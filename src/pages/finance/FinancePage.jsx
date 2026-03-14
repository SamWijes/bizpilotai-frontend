import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Typography, Button, Card, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Stack, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Tab, Tabs, Pagination, Skeleton, Grid, Chip,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { financeAPI } from '../../services/api';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

const EXPENSE_EMPTY = { description: '', amount: '', date: dayjs().format('YYYY-MM-DD'), category: '', notes: '' };
const INCOME_EMPTY = { description: '', amount: '', date: dayjs().format('YYYY-MM-DD'), source: '', notes: '' };

function FinanceTable({ type }) {
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [dialog, setDialog] = useState({ open: false, mode: 'create', data: type === 'expense' ? EXPENSE_EMPTY : INCOME_EMPTY });

    const isExpense = type === 'expense';
    const queryKey = isExpense ? ['expenses', page] : ['income', page];
    const listFn = isExpense ? financeAPI.listExpenses : financeAPI.listIncome;
    const createFn = isExpense ? financeAPI.createExpense : financeAPI.createIncome;
    const updateFn = isExpense ? financeAPI.updateExpense : financeAPI.updateIncome;
    const deleteFn = isExpense ? financeAPI.deleteExpense : financeAPI.deleteIncome;

    const { data, isLoading } = useQuery({
        queryKey,
        queryFn: () => listFn({ page, limit: 15 }).then((r) => r.data),
        keepPreviousData: true,
    });

    const saveMutation = useMutation({
        mutationFn: (payload) => dialog.mode === 'create' ? createFn(payload) : updateFn(dialog.data.id, payload),
        onSuccess: () => { qc.invalidateQueries(queryKey); toast.success('Saved!'); setDialog({ ...dialog, open: false }); },
        onError: (err) => toast.error(err.response?.data?.message || 'Error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteFn(id),
        onSuccess: () => { qc.invalidateQueries(queryKey); toast.success('Deleted'); },
    });

    const rows = data?.data || [];
    const meta = data?.meta;
    const empty = isExpense ? EXPENSE_EMPTY : INCOME_EMPTY;
    const fields = isExpense
        ? [{ label: 'Description', field: 'description', required: true }, { label: 'Amount ($)', field: 'amount', type: 'number', required: true },
        { label: 'Date', field: 'date', type: 'date' }, { label: 'Category', field: 'category' }, { label: 'Notes', field: 'notes', multiline: true }]
        : [{ label: 'Description', field: 'description', required: true }, { label: 'Amount ($)', field: 'amount', type: 'number', required: true },
        { label: 'Date', field: 'date', type: 'date' }, { label: 'Source', field: 'source' }, { label: 'Notes', field: 'notes', multiline: true }];

    return (
        <>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2" color="text.secondary">{meta?.total || 0} entries</Typography>
                <Button variant="outlined" size="small" startIcon={<Add />}
                    color={isExpense ? 'error' : 'success'}
                    onClick={() => setDialog({ open: true, mode: 'create', data: empty })}>
                    Add {isExpense ? 'Expense' : 'Income'}
                </Button>
            </Stack>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Description</TableCell>
                            <TableCell>{isExpense ? 'Category' : 'Source'}</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? Array.from({ length: 6 }).map((_, i) => (
                            <TableRow key={i}>{Array.from({ length: 5 }).map((__, j) => <TableCell key={j}><Skeleton height={24} /></TableCell>)}</TableRow>
                        )) : rows.map((r) => (
                            <TableRow key={r.id} hover sx={{ '&:hover': { bgcolor: 'rgba(108,99,255,0.04)' } }}>
                                <TableCell><Typography variant="body2" fontWeight={500}>{r.description}</Typography></TableCell>
                                <TableCell><Typography variant="body2" color="text.secondary">{r.category || r.source || '—'}</Typography></TableCell>
                                <TableCell><Typography variant="body2">{dayjs(r.date).format('MMM D, YYYY')}</Typography></TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={700} color={isExpense ? 'error.main' : 'success.main'}>
                                        {isExpense ? '-' : '+'}${Number(r.amount).toFixed(2)}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" sx={{ color: 'text.secondary' }} onClick={() => setDialog({ open: true, mode: 'edit', data: r })}><Edit fontSize="small" /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(r.id)}><Delete fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {meta && <Box p={2} display="flex" justifyContent="center"><Pagination count={meta.totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" /></Box>}

            <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>{dialog.mode === 'create' ? `Add ${isExpense ? 'Expense' : 'Income'}` : 'Edit Entry'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        {fields.map(({ label, field, type, required, multiline }) => (
                            <TextField key={field} label={label} type={type || 'text'} fullWidth required={required}
                                multiline={multiline} rows={multiline ? 2 : 1}
                                InputLabelProps={type === 'date' ? { shrink: true } : undefined}
                                value={dialog.data[field] || ''}
                                onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, [field]: e.target.value } })} />
                        ))}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 0 }}>
                    <Button onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
                    <Button variant="contained" color={isExpense ? 'error' : 'success'}
                        onClick={() => saveMutation.mutate(dialog.data)} disabled={saveMutation.isLoading}>
                        {dialog.mode === 'create' ? 'Add' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default function FinancePage() {
    const [tab, setTab] = useState('expenses');
    return (
        <Box>
            <Typography variant="h4" fontWeight={800} mb={0.5}>Finance</Typography>
            <Typography color="text.secondary" mb={3} variant="body2">Track your income and expenses</Typography>
            <Card>
                <Box borderBottom="1px solid rgba(255,255,255,0.06)">
                    <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="primary" indicatorColor="primary" sx={{ px: 2 }}>
                        <Tab label="💸 Expenses" value="expenses" />
                        <Tab label="💰 Income" value="income" />
                    </Tabs>
                </Box>
                <Box p={2}>
                    {tab === 'expenses' ? <FinanceTable type="expense" /> : <FinanceTable type="income" />}
                </Box>
            </Card>
        </Box>
    );
}
