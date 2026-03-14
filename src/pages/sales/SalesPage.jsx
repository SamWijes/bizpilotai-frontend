import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Typography, Button, Card, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Stack, Pagination, Skeleton,
} from '@mui/material';
import { Add, Visibility, Cancel } from '@mui/icons-material';
import { salesAPI } from '../../services/api';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    COMPLETED: { bg: 'rgba(0,224,150,0.15)', color: 'success.main' },
    PENDING: { bg: 'rgba(255,181,71,0.15)', color: 'warning.main' },
    CANCELLED: { bg: 'rgba(255,77,77,0.15)', color: 'error.main' },
};

export default function SalesPage() {
    const qc = useQueryClient();
    const navigate = useNavigate();
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['sales', page],
        queryFn: () => salesAPI.list({ page, limit: 15 }).then((r) => r.data),
        keepPreviousData: true,
    });

    const cancelMutation = useMutation({
        mutationFn: (id) => salesAPI.cancel(id),
        onSuccess: () => { qc.invalidateQueries(['sales']); toast.success('Sale cancelled'); },
        onError: (err) => toast.error(err.response?.data?.message || 'Error'),
    });

    const sales = data?.data || [];
    const meta = data?.meta;

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Sales</Typography>
                    <Typography color="text.secondary" variant="body2">{meta?.total || 0} total transactions</Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/sales/new')}>New Sale</Button>
            </Stack>

            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Sale #</TableCell>
                                <TableCell>Customer</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Payment</TableCell>
                                <TableCell>Subtotal</TableCell>
                                <TableCell>Tax</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? Array.from({ length: 8 }).map((_, i) => (
                                <TableRow key={i}>{Array.from({ length: 9 }).map((__, j) => <TableCell key={j}><Skeleton height={28} /></TableCell>)}</TableRow>
                            )) : sales.map((s) => {
                                const sc = STATUS_COLORS[s.status] || STATUS_COLORS.PENDING;
                                return (
                                    <TableRow key={s.id} hover sx={{ '&:hover': { bgcolor: 'rgba(108,99,255,0.04)' } }}>
                                        <TableCell><Typography variant="body2" fontFamily="monospace" fontWeight={700} color="primary.light">{s.saleNumber}</Typography></TableCell>
                                        <TableCell><Typography variant="body2">{s.customer?.name || 'Walk-in'}</Typography></TableCell>
                                        <TableCell><Typography variant="body2">{dayjs(s.saleDate).format('MMM D, YYYY')}</Typography></TableCell>
                                        <TableCell><Chip label={s.paymentMethod} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', fontSize: '0.7rem' }} /></TableCell>
                                        <TableCell><Typography variant="body2">${Number(s.subtotal).toFixed(2)}</Typography></TableCell>
                                        <TableCell><Typography variant="body2">${Number(s.taxAmount || 0).toFixed(2)}</Typography></TableCell>
                                        <TableCell><Typography variant="body2" fontWeight={700} color="success.main">${Number(s.total).toFixed(2)}</Typography></TableCell>
                                        <TableCell><Chip label={s.status} size="small" sx={{ bgcolor: sc.bg, color: sc.color }} /></TableCell>
                                        <TableCell align="right">
                                            <Button size="small" startIcon={<Visibility />} onClick={() => navigate(`/invoices/${s.invoice?.id || ''}`)}>Invoice</Button>
                                            {s.status !== 'CANCELLED' && (
                                                <Button size="small" color="error" startIcon={<Cancel />} onClick={() => cancelMutation.mutate(s.id)} sx={{ ml: 0.5 }}>Cancel</Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
                {meta && <Box p={2} display="flex" justifyContent="center"><Pagination count={meta.totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" /></Box>}
            </Card>
        </Box>
    );
}
