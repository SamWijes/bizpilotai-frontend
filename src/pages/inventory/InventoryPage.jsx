import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Typography, Button, Card, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Stack, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, Grid, Tabs, Tab, Skeleton,
} from '@mui/material';
import { Add, ArrowUpward, ArrowDownward, Tune, Category as CategoryIcon } from '@mui/icons-material';
import { inventoryAPI, productsAPI, itemsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function InventoryPage() {
    const qc = useQueryClient();
    const [tab, setTab] = useState('transactions');
    const [dialog, setDialog] = useState({ open: false, mode: 'in' });
    const [form, setForm] = useState({ productId: '', quantity: '', reason: '', notes: '' });

    const { data: txData, isLoading } = useQuery({
        queryKey: ['inventory-transactions'],
        queryFn: () => inventoryAPI.transactions({ limit: 50 }).then((r) => r.data.data),
    });

    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['inventory-supplier-stats'],
        queryFn: () => inventoryAPI.supplierStats({ limit: 100 }).then((r) => r.data.data),
    });

    const { data: itemsData, isLoading: itemsLoading } = useQuery({
        queryKey: ['inventory-items'],
        queryFn: () => itemsAPI.list({ limit: 200 }).then((r) => r.data.data),
    });

    const { data: products } = useQuery({
        queryKey: ['products-all'],
        queryFn: () => productsAPI.list({ limit: 200 }).then((r) => r.data.data),
    });

    const { data: categories } = useQuery({
        queryKey: ['categories-all'],
        queryFn: () => productsAPI.categories().then((r) => r.data.data),
    });

    const [itemDialog, setItemDialog] = useState(false);
    const [itemForm, setItemForm] = useState({ name: '', sku: '', categoryId: '', unit: 'pcs', description: '' });

    const itemMutation = useMutation({
        mutationFn: (payload) => itemsAPI.create(payload),
        onSuccess: () => {
            qc.invalidateQueries(['inventory-items']);
            toast.success('Item added to catalog!');
            setItemDialog(false);
            setItemForm({ name: '', sku: '', categoryId: '', unit: 'pcs', description: '' });
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Error'),
    });

    const stockMutation = useMutation({
        mutationFn: (payload) => {
            if (dialog.mode === 'in') return inventoryAPI.stockIn(payload);
            if (dialog.mode === 'out') return inventoryAPI.stockOut(payload);
            return inventoryAPI.adjust({ ...payload, newQuantity: payload.quantity });
        },
        onSuccess: () => {
            qc.invalidateQueries(['inventory-transactions']);
            qc.invalidateQueries(['products']);
            qc.invalidateQueries(['low-stock']);
            toast.success(`Stock ${dialog.mode === 'in' ? 'added' : dialog.mode === 'out' ? 'removed' : 'adjusted'}!`);
            setDialog({ ...dialog, open: false });
            setForm({ productId: '', quantity: '', reason: '', notes: '' });
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Error'),
    });

    const txs = txData || [];
    const stats = statsData || [];
    const items = itemsData || [];

    const typeConfig = {
        IN: { color: 'success', label: 'Stock In', icon: '↑' },
        OUT: { color: 'error', label: 'Stock Out', icon: '↓' },
        ADJUSTMENT: { color: 'warning', label: 'Adjustment', icon: '⟳' },
        SALE: { color: 'info', label: 'Sale', icon: '🛒' },
        RETURN: { color: 'secondary', label: 'Return', icon: '↩' },
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Inventory</Typography>
                    <Typography color="text.secondary" variant="body2">Stock management and transaction history</Typography>
                </Box>
                <Stack direction="row" gap={1}>
                    <Button variant="contained" startIcon={<Add />} onClick={() => setItemDialog(true)}>New Item</Button>
                    <Button variant="outlined" startIcon={<ArrowUpward />} color="success" onClick={() => { setDialog({ open: true, mode: 'in' }); }}>Stock In</Button>
                    <Button variant="outlined" startIcon={<ArrowDownward />} color="error" onClick={() => setDialog({ open: true, mode: 'out' })}>Stock Out</Button>
                    <Button variant="outlined" startIcon={<Tune />} onClick={() => setDialog({ open: true, mode: 'adjust' })}>Adjust</Button>
                </Stack>
            </Stack>

            <Card>
                <Box p={2} borderBottom="1px solid rgba(255,255,255,0.06)">
                    <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="primary" indicatorColor="primary">
                        <Tab label="Transaction History" value="transactions" />
                        <Tab label="Supplier Stock" value="supplier-stats" />
                        <Tab label="Items Catalog" value="items" />
                    </Tabs>
                </Box>
                <TableContainer>
                    <Table>
                        {tab === 'transactions' ? (
                            <>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Product</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Quantity</TableCell>
                                        <TableCell>Balance Before</TableCell>
                                        <TableCell>Balance After</TableCell>
                                        <TableCell>Reason</TableCell>
                                        <TableCell>Date</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {isLoading ? Array.from({ length: 8 }).map((_, i) => (
                                        <TableRow key={i}>{Array.from({ length: 7 }).map((__, j) => <TableCell key={j}><Skeleton height={28} /></TableCell>)}</TableRow>
                                    )) : txs.map((tx) => {
                                        const cfg = typeConfig[tx.type] || {};
                                        return (
                                            <TableRow key={tx.id} hover sx={{ '&:hover': { bgcolor: 'rgba(108,99,255,0.04)' } }}>
                                                <TableCell><Typography variant="body2" fontWeight={600}>{tx.product?.name || tx.productId}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{tx.product?.sku}</Typography></TableCell>
                                                <TableCell><Chip label={cfg.label || tx.type} size="small" color={cfg.color || 'default'} sx={{ fontWeight: 600, letterSpacing: '0.05em' }} /></TableCell>
                                                <TableCell><Typography variant="body2" fontWeight={700} color={tx.type === 'IN' ? 'success.main' : tx.type === 'OUT' || tx.type === 'SALE' ? 'error.main' : 'warning.main'}>
                                                    {tx.type === 'IN' ? '+' : tx.type === 'OUT' || tx.type === 'SALE' ? '-' : '~'}{tx.quantity}
                                                </Typography></TableCell>
                                                <TableCell><Typography variant="body2">{tx.balanceBefore}</Typography></TableCell>
                                                <TableCell><Typography variant="body2" fontWeight={600}>{tx.balanceAfter}</Typography></TableCell>
                                                <TableCell><Typography variant="body2">{tx.reason}</Typography></TableCell>
                                                <TableCell><Typography variant="body2">{dayjs(tx.createdAt).format('MMM D, h:mm a')}</Typography></TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </>
                        ) : tab === 'items' ? (
                            <>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>SKU</TableCell>
                                        <TableCell>Category</TableCell>
                                        <TableCell>Unit</TableCell>
                                        <TableCell>Description</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {itemsLoading ? Array.from({ length: 8 }).map((_, i) => (
                                        <TableRow key={i}>{Array.from({ length: 5 }).map((__, j) => <TableCell key={j}><Skeleton height={28} /></TableCell>)}</TableRow>
                                    )) : items.map((item) => (
                                        <TableRow key={item.id} hover sx={{ '&:hover': { bgcolor: 'rgba(108,99,255,0.04)' } }}>
                                            <TableCell><Typography variant="body2" fontWeight={600}>{item.name}</Typography></TableCell>
                                            <TableCell><Typography variant="caption" fontFamily="monospace">{item.sku || '—'}</Typography></TableCell>
                                            <TableCell>
                                                <Chip label={item.category?.name || '—'} size="small" variant="outlined" />
                                            </TableCell>
                                            <TableCell><Typography variant="body2">{item.unit}</Typography></TableCell>
                                            <TableCell><Typography variant="body2" color="text.secondary">{item.description || '—'}</Typography></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </>
                        ) : (
                            <>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Supplier</TableCell>
                                        <TableCell>Product</TableCell>
                                        <TableCell>SKU</TableCell>
                                        <TableCell>Total IN</TableCell>
                                        <TableCell>Total OUT</TableCell>
                                        <TableCell>Current Balance</TableCell>
                                        <TableCell align="right">Inventory Value</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {statsLoading ? Array.from({ length: 8 }).map((_, i) => (
                                        <TableRow key={i}>{Array.from({ length: 7 }).map((__, j) => <TableCell key={j}><Skeleton height={28} /></TableCell>)}</TableRow>
                                    )) : stats.map((stat) => (
                                        <TableRow key={stat.id} hover sx={{ '&:hover': { bgcolor: 'rgba(108,99,255,0.04)' } }}>
                                            <TableCell>
                                                <Chip label={stat.supplier?.name || '—'} size="small" variant="outlined" color="primary" />
                                            </TableCell>
                                            <TableCell><Typography variant="body2" fontWeight={600}>{stat.name}</Typography></TableCell>
                                            <TableCell><Typography variant="caption" fontFamily="monospace">{stat.sku}</Typography></TableCell>
                                            <TableCell><Typography variant="body2" color="success.main" fontWeight={600}>{stat.totalIn}</Typography></TableCell>
                                            <TableCell><Typography variant="body2" color="error.main" fontWeight={600}>{stat.totalOut}</Typography></TableCell>
                                            <TableCell><Typography variant="body2" fontWeight={800}>{stat.balance}</Typography></TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight={700} color="primary.main">
                                                    ${Number(stat.totalValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </>
                        )}
                    </Table>
                </TableContainer>
            </Card>

            <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>
                    {dialog.mode === 'in' ? '📦 Stock In' : dialog.mode === 'out' ? '📤 Stock Out' : '⟳ Adjust Stock'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField select label="Product" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required fullWidth>
                            {(products || []).map((p) => <MenuItem key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</MenuItem>)}
                        </TextField>
                        <TextField label={dialog.mode === 'adjust' ? 'New Quantity' : 'Quantity'} type="number" value={form.quantity}
                            onChange={(e) => setForm({ ...form, quantity: e.target.value })} required fullWidth />
                        <TextField label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} fullWidth />
                        <TextField label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} multiline rows={2} fullWidth />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 0 }}>
                    <Button onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
                    <Button variant="contained" onClick={() => stockMutation.mutate(form)} disabled={stockMutation.isLoading || !form.productId || !form.quantity}>Confirm</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={itemDialog} onClose={() => setItemDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Add New Item</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField label="Item Name" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} required fullWidth />
                        <TextField label="SKU" value={itemForm.sku} onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })} fullWidth />
                        <TextField select label="Category" value={itemForm.categoryId} onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })} fullWidth>
                            <MenuItem value="">None</MenuItem>
                            {(categories || []).map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                        </TextField>
                        <TextField label="Unit (e.g. pcs, kg)" value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} required fullWidth />
                        <TextField label="Description" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} multiline rows={2} fullWidth />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 0 }}>
                    <Button onClick={() => setItemDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={() => itemMutation.mutate(itemForm)} disabled={itemMutation.isLoading || !itemForm.name}>Confirm</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
