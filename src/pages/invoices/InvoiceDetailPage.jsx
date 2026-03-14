import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Typography, Button, Card, CardContent, Grid, Stack, Chip,
    Table, TableBody, TableCell, TableHead, TableRow, Divider, MenuItem,
    TextField, Skeleton,
} from '@mui/material';
import { ArrowBack, PictureAsPdf, Edit } from '@mui/icons-material';
import { invoicesAPI } from '../../services/api';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function InvoiceDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [newStatus, setNewStatus] = useState('');

    const { data: invoice, isLoading } = useQuery({
        queryKey: ['invoice', id],
        queryFn: () => invoicesAPI.get(id).then((r) => r.data.data),
    });

    const statusMutation = useMutation({
        mutationFn: (status) => invoicesAPI.updateStatus(id, { status }),
        onSuccess: () => { qc.invalidateQueries(['invoice', id]); toast.success('Status updated!'); setNewStatus(''); },
    });

    const handleDownload = () => {
        const url = invoicesAPI.pdfUrl(id);
        window.open(`${url}?token=${localStorage.getItem('accessToken')}`, '_blank');
    };

    if (isLoading) return <Box p={4}><Skeleton height={300} /></Box>;
    if (!invoice) return <Typography>Invoice not found</Typography>;

    const sale = invoice.sale;
    const customer = sale?.customer;
    const items = sale?.items || [];

    return (
        <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                <Stack direction="row" alignItems="center" gap={2}>
                    <Button startIcon={<ArrowBack />} onClick={() => navigate('/invoices')}>Back</Button>
                    <Typography variant="h5" fontWeight={800}>{invoice.invoiceNumber}</Typography>
                    <Chip label={invoice.status} size="small" sx={{
                        bgcolor: invoice.status === 'PAID' ? 'rgba(0,224,150,0.15)' : 'rgba(255,181,71,0.15)',
                        color: invoice.status === 'PAID' ? 'success.main' : 'warning.main',
                    }} />
                </Stack>
                <Stack direction="row" gap={1}>
                    <Stack direction="row" gap={1} alignItems="center">
                        <TextField select size="small" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} sx={{ width: 140 }} label="Status">
                            {['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </TextField>
                        <Button variant="outlined" startIcon={<Edit />} disabled={!newStatus} onClick={() => statusMutation.mutate(newStatus)}>Update</Button>
                    </Stack>
                    <Button variant="contained" startIcon={<PictureAsPdf />} onClick={handleDownload}>Download PDF</Button>
                </Stack>
            </Stack>

            <Card>
                <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={3} mb={4}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" display="block" mb={1}>Bill To</Typography>
                            <Typography variant="h6" fontWeight={700}>{customer?.name || 'Walk-in Customer'}</Typography>
                            {customer?.email && <Typography variant="body2" color="text.secondary">{customer.email}</Typography>}
                            {customer?.phone && <Typography variant="body2" color="text.secondary">{customer.phone}</Typography>}
                            {customer?.address && <Typography variant="body2" color="text.secondary">{customer.address}</Typography>}
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" display="block" mb={1}>Invoice Details</Typography>
                            <Typography variant="body2"><strong>Invoice:</strong> {invoice.invoiceNumber}</Typography>
                            <Typography variant="body2"><strong>Sale:</strong> {sale?.saleNumber}</Typography>
                            <Typography variant="body2"><strong>Date:</strong> {dayjs(invoice.createdAt).format('MMMM D, YYYY')}</Typography>
                            <Typography variant="body2"><strong>Payment:</strong> {sale?.paymentMethod}</Typography>
                        </Grid>
                    </Grid>

                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>#</TableCell>
                                <TableCell>Item</TableCell>
                                <TableCell align="right">Qty</TableCell>
                                <TableCell align="right">Unit Price</TableCell>
                                <TableCell align="right">Discount</TableCell>
                                <TableCell align="right">Total</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map((item, idx) => (
                                <TableRow key={item.id}>
                                    <TableCell>{idx + 1}</TableCell>
                                    <TableCell><Typography variant="body2" fontWeight={600}>{item.productName || item.product?.name}</Typography></TableCell>
                                    <TableCell align="right">{item.quantity}</TableCell>
                                    <TableCell align="right">${Number(item.unitPrice).toFixed(2)}</TableCell>
                                    <TableCell align="right">${Number(item.discount || 0).toFixed(2)}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>${Number(item.total).toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Divider sx={{ my: 2 }} />
                    <Box maxWidth={300} ml="auto">
                        <Stack spacing={0.75}>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography color="text.secondary">Subtotal</Typography>
                                <Typography>${Number(sale?.subtotal || 0).toFixed(2)}</Typography>
                            </Stack>
                            {sale?.discountAmount > 0 && (
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography color="text.secondary">Discount</Typography>
                                    <Typography color="error.main">-${Number(sale.discountAmount).toFixed(2)}</Typography>
                                </Stack>
                            )}
                            {sale?.taxAmount > 0 && (
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography color="text.secondary">Tax ({sale.taxRate}%)</Typography>
                                    <Typography>${Number(sale.taxAmount).toFixed(2)}</Typography>
                                </Stack>
                            )}
                            <Divider />
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="h6" fontWeight={800}>Total</Typography>
                                <Typography variant="h6" fontWeight={800} color="success.main">${Number(sale?.total || 0).toFixed(2)}</Typography>
                            </Stack>
                        </Stack>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
