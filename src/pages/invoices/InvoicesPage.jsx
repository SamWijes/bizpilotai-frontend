import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Typography, Button, Card, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Stack, Pagination, Skeleton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PictureAsPdf, Visibility } from '@mui/icons-material';
import { invoicesAPI } from '../../services/api';
import dayjs from 'dayjs';

const STATUS_COLORS = {
    DRAFT: { bg: 'rgba(255,181,71,0.15)', color: 'warning.main' },
    SENT: { bg: 'rgba(0,184,217,0.15)', color: 'info.main' },
    PAID: { bg: 'rgba(0,224,150,0.15)', color: 'success.main' },
    OVERDUE: { bg: 'rgba(255,77,77,0.15)', color: 'error.main' },
};

export default function InvoicesPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['invoices', page],
        queryFn: () => invoicesAPI.list({ page, limit: 15 }).then((r) => r.data),
        keepPreviousData: true,
    });

    const invoices = data?.data || [];
    const meta = data?.meta;

    const handleDownloadPDF = (id) => {
        const url = invoicesAPI.pdfUrl(id);
        window.open(`${url}?token=${localStorage.getItem('accessToken')}`, '_blank');
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Invoices</Typography>
                    <Typography color="text.secondary" variant="body2">{meta?.total || invoices.length} invoices</Typography>
                </Box>
            </Stack>

            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Invoice #</TableCell>
                                <TableCell>Sale #</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Payment</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? Array.from({ length: 8 }).map((_, i) => (
                                <TableRow key={i}>{Array.from({ length: 7 }).map((__, j) => <TableCell key={j}><Skeleton height={28} /></TableCell>)}</TableRow>
                            )) : invoices.map((inv) => {
                                const sc = STATUS_COLORS[inv.status] || STATUS_COLORS.DRAFT;
                                return (
                                    <TableRow key={inv.id} hover sx={{ '&:hover': { bgcolor: 'rgba(108,99,255,0.04)' } }}>
                                        <TableCell><Typography variant="body2" fontFamily="monospace" fontWeight={700} color="primary.light">{inv.invoiceNumber}</Typography></TableCell>
                                        <TableCell><Typography variant="body2" color="text.secondary">{inv.sale?.saleNumber || '—'}</Typography></TableCell>
                                        <TableCell><Typography variant="body2">{dayjs(inv.createdAt).format('MMM D, YYYY')}</Typography></TableCell>
                                        <TableCell><Typography variant="body2" fontWeight={700} color="success.main">${Number(inv.sale?.total || 0).toFixed(2)}</Typography></TableCell>
                                        <TableCell><Chip label={inv.sale?.paymentMethod || '—'} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', fontSize: '0.7rem' }} /></TableCell>
                                        <TableCell><Chip label={inv.status} size="small" sx={{ bgcolor: sc.bg, color: sc.color }} /></TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" justifyContent="flex-end" gap={0.5}>
                                                <Button size="small" startIcon={<Visibility />} onClick={() => navigate(`/invoices/${inv.id}`)}>View</Button>
                                                <Button size="small" startIcon={<PictureAsPdf />} color="secondary" onClick={() => handleDownloadPDF(inv.id)}>PDF</Button>
                                            </Stack>
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
