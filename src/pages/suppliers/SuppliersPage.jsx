import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Typography, Button, Card, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Chip, TextField, Stack, Dialog,
    DialogTitle, DialogContent, DialogActions, Pagination, InputAdornment, Skeleton,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { suppliersAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EMPTY = { name: '', email: '', phone: '', address: '', contactPerson: '', website: '', notes: '' };

export default function SuppliersPage() {
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [dialog, setDialog] = useState({ open: false, mode: 'create', data: EMPTY });

    const { data, isLoading } = useQuery({
        queryKey: ['suppliers', page, search],
        queryFn: () => suppliersAPI.list({ page, limit: 15, search }).then((r) => r.data),
        keepPreviousData: true,
    });

    const saveMutation = useMutation({
        mutationFn: (payload) => dialog.mode === 'create' ? suppliersAPI.create(payload) : suppliersAPI.update(dialog.data.id, payload),
        onSuccess: () => { qc.invalidateQueries(['suppliers']); toast.success('Supplier saved!'); setDialog({ ...dialog, open: false }); },
        onError: (err) => toast.error(err.response?.data?.message || 'Error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => suppliersAPI.delete(id),
        onSuccess: () => { qc.invalidateQueries(['suppliers']); toast.success('Supplier deactivated'); },
    });

    const suppliers = data?.data || [];
    const meta = data?.meta;

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Suppliers</Typography>
                    <Typography color="text.secondary" variant="body2">{meta?.total || 0} suppliers</Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={() => setDialog({ open: true, mode: 'create', data: EMPTY })}>
                    Add Supplier
                </Button>
            </Stack>

            <Card>
                <Box p={2}>
                    <TextField size="small" placeholder="Search suppliers…" value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                        sx={{ width: 300 }} />
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Supplier</TableCell>
                                <TableCell>Contact</TableCell>
                                <TableCell>Contact Person</TableCell>
                                <TableCell>Website</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i}>{Array.from({ length: 6 }).map((__, j) => <TableCell key={j}><Skeleton height={28} /></TableCell>)}</TableRow>
                            )) : suppliers.map((s) => (
                                <TableRow key={s.id} hover sx={{ '&:hover': { bgcolor: 'rgba(108,99,255,0.04)' } }}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{s.address || ''}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{s.email || '—'}</Typography>
                                        <Typography variant="caption" color="text.secondary">{s.phone || ''}</Typography>
                                    </TableCell>
                                    <TableCell><Typography variant="body2">{s.contactPerson || '—'}</Typography></TableCell>
                                    <TableCell><Typography variant="body2">{s.website || '—'}</Typography></TableCell>
                                    <TableCell>
                                        <Chip label={s.isActive ? 'Active' : 'Inactive'} size="small"
                                            sx={{ bgcolor: s.isActive ? 'rgba(0,224,150,0.15)' : 'rgba(255,77,77,0.15)', color: s.isActive ? 'success.main' : 'error.main' }} />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => setDialog({ open: true, mode: 'edit', data: s })} sx={{ color: 'text.secondary' }}><Edit fontSize="small" /></IconButton>
                                        <IconButton size="small" onClick={() => deleteMutation.mutate(s.id)} sx={{ color: 'error.main' }}><Delete fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                {meta && <Box p={2} display="flex" justifyContent="center"><Pagination count={meta.totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" /></Box>}
            </Card>

            <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight={700}>{dialog.mode === 'create' ? 'Add Supplier' : 'Edit Supplier'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        {[
                            { label: 'Company Name', field: 'name', required: true },
                            { label: 'Email', field: 'email', type: 'email' },
                            { label: 'Phone', field: 'phone' },
                            { label: 'Contact Person', field: 'contactPerson' },
                            { label: 'Address', field: 'address' },
                            { label: 'Website', field: 'website' },
                            { label: 'Notes', field: 'notes', multiline: true },
                        ].map(({ label, field, type, required, multiline }) => (
                            <TextField key={field} label={label} type={type || 'text'} fullWidth required={required}
                                multiline={multiline} rows={multiline ? 2 : 1}
                                value={dialog.data[field] || ''}
                                onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, [field]: e.target.value } })} />
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 0 }}>
                    <Button onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
                    <Button variant="contained" onClick={() => saveMutation.mutate(dialog.data)} disabled={saveMutation.isLoading}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
