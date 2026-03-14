import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Box, Typography, Card, CardContent, Grid, Stack, MenuItem, TextField,
    Skeleton, Table, TableHead, TableRow, TableCell, TableBody, Chip,
} from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
    LineChart, Line, Legend,
} from 'recharts';
import { reportsAPI } from '../../services/api';
import dayjs from 'dayjs';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{ bgcolor: '#1A1D2E', border: '1px solid rgba(255,255,255,0.1)', p: 1.5, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            {payload.map((p) => (
                <Typography key={p.name} variant="body2" fontWeight={600} sx={{ color: p.color }}>
                    {p.name}: {typeof p.value === 'number' && p.name !== 'Transactions' ? `$${Number(p.value).toLocaleString()}` : p.value}
                </Typography>
            ))}
        </Box>
    );
};

export default function ReportsPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const currentYearOptions = [year - 1, year, year + 1];

    const { data: profitData, isLoading: profitLoading } = useQuery({
        queryKey: ['profit', year],
        queryFn: () => reportsAPI.profit({ year }).then((r) => r.data.data),
    });

    const { data: topProducts, isLoading: topLoading } = useQuery({
        queryKey: ['top-products'],
        queryFn: () => reportsAPI.topProducts({ limit: 10 }).then((r) => r.data.data),
    });

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const monthlyChart = MONTHS.map((month, idx) => {
        const mNum = idx + 1;
        const sales = profitData?.salesByMonth?.find((s) => parseInt(s.dataValues?.month || s.month) === mNum);
        const expenses = profitData?.expensesByMonth?.find((e) => parseInt(e.dataValues?.month || e.month) === mNum);
        const revenue = parseFloat(sales?.dataValues?.totalSales || sales?.totalSales || 0);
        const expense = parseFloat(expenses?.dataValues?.totalExpenses || expenses?.totalExpenses || 0);
        return { month, Revenue: revenue, Expenses: expense, Profit: revenue - expense };
    });

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Reports</Typography>
                    <Typography color="text.secondary" variant="body2">Business analytics and financial summary</Typography>
                </Box>
                <TextField select size="small" value={year} onChange={(e) => setYear(e.target.value)} sx={{ width: 140 }} label="Year">
                    {currentYearOptions.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </TextField>
            </Stack>

            {/* Revenue vs Expenses bar chart */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" fontWeight={700} mb={2}>Monthly Revenue vs Expenses ({year})</Typography>
                    {profitLoading ? <Skeleton height={280} sx={{ borderRadius: 2 }} /> : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={monthlyChart} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="month" tick={{ fill: '#8B8FA8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#8B8FA8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                <RTooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                                <Bar dataKey="Revenue" fill="#6C63FF" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Expenses" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Profit line chart */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} mb={2}>Net Profit Trend ({year})</Typography>
                            {profitLoading ? <Skeleton height={220} sx={{ borderRadius: 2 }} /> : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={monthlyChart}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="month" tick={{ fill: '#8B8FA8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#8B8FA8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                        <RTooltip content={<CustomTooltip />} />
                                        <Line type="monotone" dataKey="Profit" stroke="#00E096" strokeWidth={2.5} dot={{ fill: '#00E096', r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={5}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} mb={2}>Top Selling Products</Typography>
                            {topLoading ? <Stack spacing={1}>{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={36} sx={{ borderRadius: 1 }} />)}</Stack> : (
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Product</TableCell>
                                            <TableCell align="right">Sold</TableCell>
                                            <TableCell align="right">Revenue</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(topProducts || []).map((p, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell><Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 160 }}>{p.product?.name || '—'}</Typography></TableCell>
                                                <TableCell align="right"><Chip label={p.dataValues?.totalSold || p.totalSold} size="small" sx={{ bgcolor: 'rgba(108,99,255,0.15)', color: 'primary.light' }} /></TableCell>
                                                <TableCell align="right"><Typography variant="body2" fontWeight={600} color="success.main">${Number(p.dataValues?.revenue || p.revenue || 0).toFixed(0)}</Typography></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
