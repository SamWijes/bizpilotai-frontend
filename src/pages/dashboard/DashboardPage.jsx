import { useQuery } from '@tanstack/react-query';
import {
    Grid, Card, CardContent, Typography, Box, Stack, Chip,
    Skeleton, Avatar, LinearProgress, alpha,
} from '@mui/material';
import {
    TrendingUp, Warning, AttachMoney, Inventory2,
    Receipt, People,
} from '@mui/icons-material';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, CartesianGrid,
} from 'recharts';
import { reportsAPI } from '../../services/api';
import dayjs from 'dayjs';

const StatCard = ({ title, value, subtitle, icon, color, loading }) => (
    <Card>
        <CardContent sx={{ p: 2.5 }}>
            {loading ? (
                <>
                    <Skeleton variant="rectangular" height={28} width="60%" sx={{ mb: 1.5, borderRadius: 1 }} />
                    <Skeleton variant="rectangular" height={20} width="40%" sx={{ borderRadius: 1 }} />
                </>
            ) : (
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight={800} mt={0.5} sx={{ color }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Avatar sx={{ bgcolor: alpha(color || '#6C63FF', 0.15), color: color || 'primary.main', width: 48, height: 48 }}>
                        {icon}
                    </Avatar>
                </Stack>
            )}
        </CardContent>
    </Card>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{ bgcolor: '#1A1D2E', border: '1px solid rgba(255,255,255,0.1)', p: 1.5, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            {payload.map((p) => (
                <Typography key={p.name} variant="body2" fontWeight={600} sx={{ color: p.color }}>
                    {p.name}: ${Number(p.value).toLocaleString()}
                </Typography>
            ))}
        </Box>
    );
};

export default function DashboardPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['dashboard'],
        queryFn: () => reportsAPI.dashboard().then((r) => r.data.data),
        refetchInterval: 60_000,
    });

    const { data: salesData, isLoading: salesLoading } = useQuery({
        queryKey: ['reports-sales-7d'],
        queryFn: () => {
            const end = dayjs().format('YYYY-MM-DD');
            const start = dayjs().subtract(14, 'day').format('YYYY-MM-DD');
            return reportsAPI.sales({ startDate: start, endDate: end }).then((r) => r.data.data);
        },
    });

    const chartData = salesData?.map((d) => ({
        date: dayjs(d.saleDate).format('MMM D'),
        Sales: parseFloat(d.total || 0),
        'Transactions': parseInt(d.count || 0),
    })) || [];

    const topProducts = data?.topProducts || [];
    const recentSales = data?.recentSales || [];

    return (
        <Box>
            <Typography variant="h4" fontWeight={800} mb={0.5}>Dashboard</Typography>
            <Typography color="text.secondary" mb={3} variant="body2">
                Overview of your business performance
            </Typography>

            {/* KPI Cards */}
            <Grid container spacing={2.5} mb={3}>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard title="Monthly Sales" value={`$${Number(data?.monthlySales || 0).toLocaleString()}`}
                        subtitle="This month" icon={<AttachMoney />} color="#00E096" loading={isLoading} />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard title="Monthly Expenses" value={`$${Number(data?.monthlyExpenses || 0).toLocaleString()}`}
                        subtitle="This month" icon={<TrendingUp />} color="#FFB547" loading={isLoading} />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        title="Net Profit"
                        value={`$${Number(data?.monthlyProfit || 0).toLocaleString()}`}
                        subtitle={data?.monthlyProfit >= 0 ? 'Profitable' : 'Operating at loss'}
                        icon={<AttachMoney />}
                        color={data?.monthlyProfit >= 0 ? '#00E096' : '#FF4D4D'}
                        loading={isLoading}
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard title="Low Stock Items" value={data?.lowStockCount ?? 0}
                        subtitle="Need restocking" icon={<Warning />} color="#FF6B6B" loading={isLoading} />
                </Grid>
            </Grid>

            {/* Charts row */}
            <Grid container spacing={2.5} mb={3}>
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} mb={2}>Sales — Last 14 Days</Typography>
                            {salesLoading ? (
                                <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="date" tick={{ fill: '#8B8FA8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#8B8FA8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="Sales" stroke="#6C63FF" strokeWidth={2.5} fill="url(#gradSales)" dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} mb={2}>Top Products</Typography>
                            {isLoading ? (
                                <Stack spacing={1.5}>
                                    {[1, 2, 3].map(i => <Skeleton key={i} height={40} sx={{ borderRadius: 1 }} />)}
                                </Stack>
                            ) : topProducts.length === 0 ? (
                                <Typography color="text.secondary" variant="body2">No sales data yet</Typography>
                            ) : (
                                <Stack spacing={1.5}>
                                    {topProducts.map((p, idx) => {
                                        const maxSold = Math.max(...topProducts.map((x) => x.dataValues?.totalSold || x.totalSold || 0));
                                        const sold = p.dataValues?.totalSold || p.totalSold || 0;
                                        return (
                                            <Box key={idx}>
                                                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                                    <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: '70%' }}>
                                                        {p.product?.name || `Product ${idx + 1}`}
                                                    </Typography>
                                                    <Typography variant="caption" color="primary.light" fontWeight={700}>{sold} sold</Typography>
                                                </Stack>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={maxSold ? (sold / maxSold) * 100 : 0}
                                                    sx={{
                                                        height: 6, borderRadius: 3,
                                                        bgcolor: 'rgba(108,99,255,0.12)',
                                                        '& .MuiLinearProgress-bar': { bgcolor: 'primary.main', borderRadius: 3 },
                                                    }}
                                                />
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Recent Sales */}
            <Card>
                <CardContent>
                    <Typography variant="h6" fontWeight={700} mb={2}>Recent Sales</Typography>
                    {isLoading ? (
                        <Stack spacing={1.5}>
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={44} sx={{ borderRadius: 1 }} />)}
                        </Stack>
                    ) : recentSales.length === 0 ? (
                        <Typography color="text.secondary" variant="body2">No recent sales</Typography>
                    ) : (
                        <Stack spacing={1}>
                            {recentSales.map((sale) => (
                                <Box key={sale.id} sx={{
                                    display: 'flex', alignItems: 'center', p: 1.5, borderRadius: 2,
                                    bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                                    gap: 2,
                                }}>
                                    <Avatar sx={{ bgcolor: 'rgba(108,99,255,0.15)', color: 'primary.main', width: 36, height: 36 }}>
                                        <Receipt fontSize="small" />
                                    </Avatar>
                                    <Box flex={1}>
                                        <Typography variant="body2" fontWeight={600}>{sale.saleNumber}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {sale.customer?.name || 'Walk-in'} · {dayjs(sale.saleDate).format('MMM D, YYYY')}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" fontWeight={700} color="success.main">
                                        ${Number(sale.total).toLocaleString()}
                                    </Typography>
                                    <Chip
                                        label={sale.status}
                                        size="small"
                                        sx={{
                                            bgcolor: sale.status === 'COMPLETED' ? 'rgba(0,224,150,0.15)' : 'rgba(255,77,77,0.15)',
                                            color: sale.status === 'COMPLETED' ? 'success.main' : 'error.main',
                                        }}
                                    />
                                </Box>
                            ))}
                        </Stack>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}
