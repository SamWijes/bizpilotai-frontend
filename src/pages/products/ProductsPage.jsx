import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Typography, Button, Card, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Chip, TextField, Stack, Dialog,
    DialogTitle, DialogContent, DialogActions, Pagination, InputAdornment,
    MenuItem, Grid, Skeleton, Alert,
} from '@mui/material';
import { Add, Edit, Delete, Search, Warning } from '@mui/icons-material';
import { productsAPI, suppliersAPI, itemsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EMPTY = { name: '', sku: '', description: '', unit: 'pcs', buyingPrice: '', sellingPrice: '', quantity: 0, reorderLevel: 5, categoryId: '', supplierId: '' };

export default function ProductsPage() {
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [dialog, setDialog] = useState({ open: false, mode: 'create', data: EMPTY, bulkItems: [{ ...EMPTY }], supplierId: '' });

    const { data, isLoading } = useQuery({
        queryKey: ['products', page, search],
        queryFn: () => productsAPI.list({ page, limit: 15, search }).then((r) => r.data),
        keepPreviousData: true,
    });

    const { data: lowStockData } = useQuery({
        queryKey: ['low-stock'],
        queryFn: () => productsAPI.lowStock().then((r) => r.data.data),
    });

    const { data: catData } = useQuery({
        queryKey: ['categories'],
        queryFn: () => productsAPI.categories().then((r) => r.data.data),
    });

    const { data: suppData } = useQuery({
        queryKey: ['suppliers'],
        queryFn: () => suppliersAPI.list({ limit: 100 }).then((r) => r.data.data),
    });

    const { data: itemsData } = useQuery({
        queryKey: ['items-all'],
        queryFn: () => itemsAPI.list({ limit: 500 }).then((r) => r.data.data),
    });

    const saveMutation = useMutation({
        mutationFn: (payload) => {
            if (dialog.mode === 'create') {
                return productsAPI.createBulk({
                    supplierId: dialog.supplierId,
                    products: dialog.bulkItems.filter(p => p.name)
                });
            } else {
                return productsAPI.update(dialog.data.id, dialog.data);
            }
        },
        onSuccess: () => { qc.invalidateQueries(['products']); qc.invalidateQueries(['low-stock']); toast.success('Product saved!'); setDialog({ ...dialog, open: false }); },
        onError: (err) => toast.error(err.response?.data?.message || 'Error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => productsAPI.delete(id),
        onSuccess: () => { qc.invalidateQueries(['products']); toast.success('Product deactivated'); },
    });

    const products = data?.data || [];
    const meta = data?.meta;
    const lowCount = lowStockData?.length || 0;

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Products</Typography>
                    <Typography color="text.secondary" variant="body2">{meta?.total || 0} products</Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={() => setDialog({ open: true, mode: 'create', data: EMPTY, bulkItems: [{ ...EMPTY }], supplierId: '' })}>
                    Add Products
                </Button>
            </Stack>

            {lowCount > 0 && (
                <Alert severity="warning" icon={<Warning />} sx={{ mb: 2.5, borderRadius: 2 }}>
                    <strong>{lowCount} product{lowCount > 1 ? 's' : ''}</strong> below reorder level — time to restock!
                </Alert>
            )}

            <Card>
                <Box p={2}>
                    <TextField size="small" placeholder="Search products…" value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                        sx={{ width: 300 }} />
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Product</TableCell>
                                <TableCell>SKU</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Buy Price</TableCell>
                                <TableCell>Sell Price</TableCell>
                                <TableCell>Stock</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? Array.from({ length: 8 }).map((_, i) => (
                                <TableRow key={i}>{Array.from({ length: 8 }).map((__, j) => <TableCell key={j}><Skeleton height={28} /></TableCell>)}</TableRow>
                            )) : products.map((p) => {
                                const isLow = parseFloat(p.quantity) <= parseFloat(p.reorderLevel);
                                return (
                                    <TableRow key={p.id} hover sx={{ '&:hover': { bgcolor: 'rgba(108,99,255,0.04)' } }}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{p.unit}</Typography>
                                        </TableCell>
                                        <TableCell><Typography variant="body2" fontFamily="monospace">{p.sku || '—'}</Typography></TableCell>
                                        <TableCell><Typography variant="body2">{p.category?.name || '—'}</Typography></TableCell>
                                        <TableCell><Typography variant="body2">${Number(p.buyingPrice).toFixed(2)}</Typography></TableCell>
                                        <TableCell><Typography variant="body2" fontWeight={600}>${Number(p.sellingPrice).toFixed(2)}</Typography></TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={700} color={isLow ? 'error.main' : 'text.primary'}>
                                                {p.quantity} {isLow && '⚠️'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">Min: {p.reorderLevel}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={p.isActive ? 'Active' : 'Inactive'} size="small"
                                                sx={{ bgcolor: p.isActive ? 'rgba(0,224,150,0.15)' : 'rgba(255,77,77,0.15)', color: p.isActive ? 'success.main' : 'error.main' }} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" onClick={() => setDialog({ open: true, mode: 'edit', data: p })} sx={{ color: 'text.secondary' }}><Edit fontSize="small" /></IconButton>
                                            <IconButton size="small" onClick={() => deleteMutation.mutate(p.id)} sx={{ color: 'error.main' }}><Delete fontSize="small" /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
                {meta && <Box p={2} display="flex" justifyContent="center"><Pagination count={meta.totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" /></Box>}
            </Card>

            <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })} maxWidth={dialog.mode === 'create' ? "lg" : "sm"} fullWidth>
                <DialogTitle fontWeight={700}>{dialog.mode === 'create' ? 'Add Products (Bulk)' : 'Edit Product'}</DialogTitle>
                <DialogContent>
                    {dialog.mode === 'create' ? (
                        <Box mt={1}>
                            <Grid container spacing={2} mb={2}>
                                <Grid item xs={12} sm={4}>
                                    <TextField select label="Primary Supplier" fullWidth required value={dialog.supplierId}
                                        onChange={(e) => setDialog({ ...dialog, supplierId: e.target.value })}>
                                        <MenuItem value="">— Select Supplier —</MenuItem>
                                        {(suppData || []).map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                                    </TextField>
                                </Grid>
                            </Grid>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell width="25%">Item (from Catalog)</TableCell>
                                            <TableCell>Buy Price</TableCell>
                                            <TableCell>Sell Price</TableCell>
                                            <TableCell>Stock Level</TableCell>
                                            <TableCell>Min Stock</TableCell>
                                            <TableCell align="right">Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {dialog.bulkItems.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>
                                                    <TextField select fullWidth size="small" value={item.itemId || ''}
                                                        onChange={(e) => {
                                                            const selected = itemsData?.find(i => i.id === e.target.value);
                                                            const newBulk = [...dialog.bulkItems];
                                                            newBulk[idx] = {
                                                                ...newBulk[idx],
                                                                itemId: selected.id, name: selected.name, sku: selected.sku,
                                                                unit: selected.unit, categoryId: selected.categoryId || '', description: selected.description || ''
                                                            };
                                                            setDialog({ ...dialog, bulkItems: newBulk });
                                                        }}>
                                                        {(itemsData || []).map(i => <MenuItem key={i.id} value={i.id}>{i.name} ({i.sku || 'N/A'})</MenuItem>)}
                                                    </TextField>
                                                </TableCell>
                                                <TableCell>
                                                    <TextField type="number" fullWidth size="small" value={item.buyingPrice}
                                                        onChange={(e) => { const nb = [...dialog.bulkItems]; nb[idx].buyingPrice = e.target.value; setDialog({ ...dialog, bulkItems: nb }); }} />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField type="number" fullWidth size="small" value={item.sellingPrice}
                                                        onChange={(e) => { const nb = [...dialog.bulkItems]; nb[idx].sellingPrice = e.target.value; setDialog({ ...dialog, bulkItems: nb }); }} />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField type="number" fullWidth size="small" value={item.quantity}
                                                        onChange={(e) => { const nb = [...dialog.bulkItems]; nb[idx].quantity = e.target.value; setDialog({ ...dialog, bulkItems: nb }); }} />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField type="number" fullWidth size="small" value={item.reorderLevel}
                                                        onChange={(e) => { const nb = [...dialog.bulkItems]; nb[idx].reorderLevel = e.target.value; setDialog({ ...dialog, bulkItems: nb }); }} />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton color="error" size="small" onClick={() => {
                                                        const nb = dialog.bulkItems.filter((_, i) => i !== idx);
                                                        setDialog({ ...dialog, bulkItems: nb });
                                                    }}><Delete fontSize="small" /></IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <Button startIcon={<Add />} onClick={() => setDialog({ ...dialog, bulkItems: [...dialog.bulkItems, { ...EMPTY }] })} sx={{ mt: 1 }}>
                                Add Row
                            </Button>
                        </Box>
                    ) : (
                        <Grid container spacing={2} mt={0.5}>
                            <Grid item xs={12} sm={12}>
                                <TextField label="Product Name" fullWidth required value={dialog.data.name || ''}
                                    onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, name: e.target.value } })} />
                            </Grid>
                            {[
                                { label: 'SKU', field: 'sku', sm: 6 },
                                { label: 'Unit (pcs/kg/L)', field: 'unit', sm: 6 },
                                { label: 'Buying Price', field: 'buyingPrice', type: 'number', sm: 6 },
                                { label: 'Selling Price', field: 'sellingPrice', type: 'number', sm: 6 },
                                { label: 'Stock Level', field: 'quantity', type: 'number', sm: 6 },
                                { label: 'Reorder Level', field: 'reorderLevel', type: 'number', sm: 6 },
                            ].map(({ label, field, type, sm }) => (
                                <Grid item xs={12} sm={sm || 12} key={field}>
                                    <TextField label={label} type={type || 'text'} fullWidth
                                        value={dialog.data[field] || ''}
                                        onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, [field]: e.target.value } })} />
                                </Grid>
                            ))}
                            <Grid item xs={12} sm={6}>
                                <TextField select label="Category" fullWidth value={dialog.data.categoryId || ''}
                                    onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, categoryId: e.target.value } })}>
                                    <MenuItem value="">— None —</MenuItem>
                                    {(catData || []).map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField select label="Supplier" fullWidth required value={dialog.data.supplierId || ''}
                                    onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, supplierId: e.target.value } })}>
                                    <MenuItem value="">— Select Supplier —</MenuItem>
                                    {(suppData || []).map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField label="Description" fullWidth multiline rows={2}
                                    value={dialog.data.description || ''}
                                    onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, description: e.target.value } })} />
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 0 }}>
                    <Button onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
                    <Button variant="contained" onClick={() => saveMutation.mutate()} disabled={saveMutation.isLoading || (dialog.mode === 'create' ? (!dialog.supplierId || dialog.bulkItems.length === 0) : !dialog.data.name)}>Save Product{dialog.mode === 'create' ? 's' : ''}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
