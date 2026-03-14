import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    Box, Typography, Button, Card, CardContent, TextField, MenuItem, Stack,
    Grid, Divider, IconButton, Table, TableBody, TableCell, TableHead,
    TableRow, Alert, CircularProgress,
} from '@mui/material';
import { Add, Delete, ArrowBack, ShoppingCart } from '@mui/icons-material';
import { salesAPI, productsAPI, customersAPI } from '../../services/api';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CHEQUE'];

export default function NewSalePage() {
    const navigate = useNavigate();
    const [items, setItems] = useState([{ productId: '', quantity: 1, discount: 0 }]);
    const [customerId, setCustomerId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [taxRate, setTaxRate] = useState(0);
    const [notes, setNotes] = useState('');

    const { data: products } = useQuery({ queryKey: ['products-all'], queryFn: () => productsAPI.list({ limit: 500 }).then((r) => r.data.data) });
    const { data: customers } = useQuery({ queryKey: ['customers-all'], queryFn: () => customersAPI.list({ limit: 500 }).then((r) => r.data.data) });

    const createMutation = useMutation({
        mutationFn: (payload) => salesAPI.create(payload),
        onSuccess: (res) => {
            toast.success('Sale created!');
            navigate('/sales');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to create sale'),
    });

    const productMap = Object.fromEntries((products || []).map((p) => [p.id, p]));

    const computedItems = items.map((item) => {
        const p = productMap[item.productId];
        if (!p) return { ...item, unitPrice: 0, total: 0 };
        const unitPrice = parseFloat(p.sellingPrice);
        const total = (unitPrice * item.quantity) - (parseFloat(item.discount) || 0);
        return { ...item, unitPrice, total, name: p.name };
    });

    const subtotal = computedItems.reduce((s, i) => s + (i.total || 0), 0);
    const globalDisc = parseFloat(discountAmount) || 0;
    const taxAmt = (subtotal - globalDisc) * ((parseFloat(taxRate) || 0) / 100);
    const grandTotal = subtotal - globalDisc + taxAmt;

    const handleAddItem = () => setItems([...items, { productId: '', quantity: 1, discount: 0 }]);
    const handleRemoveItem = (i) => setItems(items.filter((_, idx) => idx !== i));
    const handleItemChange = (i, field, val) => {
        const updated = [...items];
        updated[i] = { ...updated[i], [field]: val };
        setItems(updated);
    };

    const handleSubmit = () => {
        const validItems = items.filter((i) => i.productId && i.quantity > 0);
        if (!validItems.length) return toast.error('Add at least one product');
        createMutation.mutate({
            items: validItems.map(({ productId, quantity, discount }) => ({ productId, quantity: parseFloat(quantity), discount: parseFloat(discount) || 0 })),
            customerId: customerId || undefined,
            paymentMethod,
            discountAmount: globalDisc,
            taxRate: parseFloat(taxRate) || 0,
            notes,
        });
    };

    return (
        <Box>
            <Stack direction="row" alignItems="center" gap={2} mb={3}>
                <IconButton onClick={() => navigate('/sales')} sx={{ color: 'text.secondary' }}><ArrowBack /></IconButton>
                <Box>
                    <Typography variant="h4" fontWeight={800}>New Sale</Typography>
                    <Typography color="text.secondary" variant="body2">Create a sale transaction</Typography>
                </Box>
            </Stack>

            <Grid container spacing={3}>
                {/* Left: items */}
                <Grid item xs={12} lg={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} mb={2}>Sale Items</Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Product</TableCell>
                                        <TableCell width={80}>Qty</TableCell>
                                        <TableCell width={100}>Unit Price</TableCell>
                                        <TableCell width={100}>Discount</TableCell>
                                        <TableCell width={100}>Total</TableCell>
                                        <TableCell width={40} />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {computedItems.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>
                                                <TextField select size="small" fullWidth value={item.productId}
                                                    onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}>
                                                    <MenuItem value="">Select product</MenuItem>
                                                    {(products || []).map((p) => (
                                                        <MenuItem key={p.id} value={p.id} disabled={!p.isActive || p.quantity <= 0}>
                                                            {p.name} (Stock: {p.quantity})
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            </TableCell>
                                            <TableCell>
                                                <TextField size="small" type="number" value={item.quantity} inputProps={{ min: 1 }}
                                                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <TextField size="small" type="number" value={item.discount}
                                                    onChange={(e) => handleItemChange(idx, 'discount', e.target.value)} inputProps={{ min: 0 }} />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={700} color="success.main">
                                                    ${(item.total || 0).toFixed(2)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <IconButton size="small" color="error" onClick={() => handleRemoveItem(idx)} disabled={items.length === 1}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Button startIcon={<Add />} onClick={handleAddItem} sx={{ mt: 2 }} size="small">Add Item</Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right: summary + submit */}
                <Grid item xs={12} lg={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} mb={2}>Sale Summary</Typography>
                            <Stack spacing={2}>
                                <TextField select label="Customer (optional)" value={customerId} onChange={(e) => setCustomerId(e.target.value)} fullWidth size="small">
                                    <MenuItem value="">Walk-in Customer</MenuItem>
                                    {(customers || []).map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                </TextField>
                                <TextField select label="Payment Method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} fullWidth size="small">
                                    {PAYMENT_METHODS.map((m) => <MenuItem key={m} value={m}>{m.replace('_', ' ')}</MenuItem>)}
                                </TextField>
                                <TextField label="Tax Rate (%)" type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} fullWidth size="small" />
                                <TextField label="Global Discount ($)" type="number" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} fullWidth size="small" />
                                <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth size="small" multiline rows={2} />

                                <Divider />
                                <Stack spacing={0.75}>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                                        <Typography variant="body2">${subtotal.toFixed(2)}</Typography>
                                    </Stack>
                                    {globalDisc > 0 && (
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="body2" color="text.secondary">Discount</Typography>
                                            <Typography variant="body2" color="error.main">-${globalDisc.toFixed(2)}</Typography>
                                        </Stack>
                                    )}
                                    {taxAmt > 0 && (
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="body2" color="text.secondary">Tax ({taxRate}%)</Typography>
                                            <Typography variant="body2">${taxAmt.toFixed(2)}</Typography>
                                        </Stack>
                                    )}
                                    <Divider />
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="h6" fontWeight={800}>Total</Typography>
                                        <Typography variant="h6" fontWeight={800} color="success.main">${grandTotal.toFixed(2)}</Typography>
                                    </Stack>
                                </Stack>

                                <Button variant="contained" size="large" fullWidth startIcon={createMutation.isLoading ? <CircularProgress size={18} color="inherit" /> : <ShoppingCart />}
                                    onClick={handleSubmit} disabled={createMutation.isLoading}>
                                    {createMutation.isLoading ? 'Processing…' : 'Confirm Sale'}
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
