import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Typography, Button, Card, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Chip, TextField, Stack, Dialog,
    DialogTitle, DialogContent, DialogActions, Pagination, InputAdornment,
    Avatar, Skeleton,
} from '@mui/material';
import { Add, Edit, Delete, Search, People } from '@mui/icons-material';
import { customersAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EMPTY = { name: '', email: '', phone: '', address: '', city: '', country: '', notes: '' };

export default function CustomersPage() {
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [dialog, setDialog] = useState({ open: false, mode: 'create', data: EMPTY });

    const { data, isLoading } = useQuery({
        queryKey: ['customers', page, search],
        queryFn: () => customersAPI.list({ page, limit: 15, search }).then((r) => r.data),
        keepPreviousData: true,
    });

    const saveMutation = useMutation({
        mutationFn: (payload) =>
            dialog.mode === 'create'
                ? customersAPI.create(payload)
                : customersAPI.update(dialog.data.id, payload),
        onSuccess: () => {
            qc.invalidateQueries(['customers']);
            toast.success(dialog.mode === 'create' ? 'Customer created!' : 'Customer updated!');
            setDialog({ ...dialog, open: false });
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => customersAPI.delete(id),
        onSuccess: () => { qc.invalidateQueries(['customers']); toast.success('Customer deactivated'); },
    });

    const handleSave = () => saveMutation.mutate(dialog.data);

    const customers = data?.data || [];
    const meta = data?.meta;

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Customers</Typography>
                    <Typography color="text.secondary" variant="body2">{meta?.total || 0} total customers</Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={() => setDialog({ open: true, mode: 'create', data: EMPTY })}>
                    Add Customer
                </Button>
            </Stack>

            <Card>
                <Box p={2}>
                    <TextField
                        size="small" placeholder="Search customers…" value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                        sx={{ width: 300 }}
                    />
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Customer</TableCell>
                                <TableCell>Contact</TableCell>
                                <TableCell>Location</TableCell>
                                <TableCell>Total Purchases</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading
                                ? Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 6 }).map((__, j) => (
                                            <TableCell key={j}><Skeleton height={28} /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : customers.map((c) => (
                                    <TableRow key={c.id} hover sx={{ '&:hover': { bgcolor: 'rgba(108,99,255,0.04)' } }}>
                                        <TableCell>
                                            <Stack direction="row" alignItems="center" gap={1.5}>
                                                <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(108,99,255,0.2)', color: 'primary.light', fontSize: '0.875rem' }}>
                                                    {c.name[0].toUpperCase()}
                                                </Avatar>
                                                <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{c.email || '—'}</Typography>
                                            <Typography variant="caption" color="text.secondary">{c.phone || ''}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{[c.city, c.country].filter(Boolean).join(', ') || '—'}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600} color="success.main">
                                                ${Number(c.totalPurchases || 0).toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={c.isActive ? 'Active' : 'Inactive'} size="small"
                                                sx={{ bgcolor: c.isActive ? 'rgba(0,224,150,0.15)' : 'rgba(255,77,77,0.15)', color: c.isActive ? 'success.main' : 'error.main' }} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" onClick={() => setDialog({ open: true, mode: 'edit', data: c })} sx={{ color: 'text.secondary' }}>
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => deleteMutation.mutate(c.id)} sx={{ color: 'error.main' }}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {meta && (
                    <Box p={2} display="flex" justifyContent="center">
                        <Pagination count={meta.totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
                    </Box>
                )}
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight={700}>{dialog.mode === 'create' ? 'Add Customer' : 'Edit Customer'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        {[
                            { label: 'Name', field: 'name', required: true },
                            { label: 'Email', field: 'email', type: 'email' },
                            { label: 'Phone', field: 'phone' },
                            { label: 'Address', field: 'address' },
                            { label: 'City', field: 'city' },
                            { label: 'Country', field: 'country' },
                            { label: 'Notes', field: 'notes', multiline: true },
                        ].map(({ label, field, type, required, multiline }) => (
                            <TextField
                                key={field} label={label} type={type || 'text'} fullWidth required={required}
                                multiline={multiline} rows={multiline ? 2 : 1}
                                value={dialog.data[field] || ''}
                                onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, [field]: e.target.value } })}
                            />
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 0 }}>
                    <Button onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saveMutation.isLoading}>
                        {dialog.mode === 'create' ? 'Add Customer' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
