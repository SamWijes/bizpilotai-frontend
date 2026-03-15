import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    AppBar, Toolbar, Typography, IconButton, Avatar, Badge, Tooltip,
    Divider, Chip, alpha,
} from '@mui/material';
import {
    Dashboard, People, LocalShipping, Inventory2, SwapVert,
    Receipt, RequestQuote, AccountBalance, BarChart, AutoAwesome,
    Person, Settings, Logout, Menu, Notifications, ChevronLeft,
    PointOfSale, Group,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 260;

const navItems = [
    { label: 'Dashboard', icon: <Dashboard />, path: '/' },
    { label: 'Sales', icon: <PointOfSale />, path: '/sales' },
    { label: 'Invoices', icon: <Receipt />, path: '/invoices' },
    { label: 'Customers', icon: <People />, path: '/customers' },
    { label: 'Suppliers', icon: <LocalShipping />, path: '/suppliers' },
    { label: 'Products', icon: <Inventory2 />, path: '/products' },
    { label: 'Inventory', icon: <SwapVert />, path: '/inventory' },
    { label: 'Finance', icon: <AccountBalance />, path: '/finance' },
    { label: 'Reports', icon: <BarChart />, path: '/reports' },
    { label: 'AI Tools', icon: <AutoAwesome />, path: '/ai' },
    { label: 'Users', icon: <Group />, path: '/users', ownerOnly: true },
];

export default function DashboardLayout() {
    const [open, setOpen] = useState(true);
    const { user, business, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (path) =>
        path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* ─── Sidebar ─────────────────────────────────────────── */}
            <Drawer
                variant="permanent"
                sx={{
                    width: open ? DRAWER_WIDTH : 72,
                    flexShrink: 0,
                    transition: 'width 0.3s',
                    '& .MuiDrawer-paper': {
                        width: open ? DRAWER_WIDTH : 72,
                        overflow: 'hidden',
                        transition: 'width 0.3s',
                    },
                }}
            >
                {/* Logo */}
                <Box sx={{ px: 2, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 38, height: 38, borderRadius: 2,
                        background: 'linear-gradient(135deg, #6C63FF, #FF6B6B)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <AutoAwesome sx={{ fontSize: 20, color: 'white' }} />
                    </Box>
                    {open && (
                        <Typography variant="h6" fontWeight={800} sx={{
                            background: 'linear-gradient(135deg, #6C63FF, #9D97FF)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            BizPilotAI
                        </Typography>
                    )}
                    <Box sx={{ ml: 'auto' }}>
                        <IconButton size="small" onClick={() => setOpen(!open)} sx={{ color: 'text.secondary' }}>
                            {open ? <ChevronLeft /> : <Menu />}
                        </IconButton>
                    </Box>
                </Box>

                {/* Business name */}
                {open && business && (
                    <Box sx={{ px: 2, pb: 2 }}>
                        <Chip
                            label={business.name}
                            size="small"
                            sx={{ bgcolor: 'rgba(108,99,255,0.15)', color: 'primary.light', fontWeight: 600, width: '100%' }}
                        />
                    </Box>
                )}

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

                {/* Nav items */}
                <List sx={{ px: 1, pt: 1, flex: 1 }}>
                    {navItems
                        .filter((item) => !item.ownerOnly || user?.role === 'OWNER')
                        .map((item) => {
                            const active = isActive(item.path);
                            return (
                                <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                                    <ListItemButton
                                        onClick={() => navigate(item.path)}
                                        sx={{
                                            borderRadius: 2,
                                            minHeight: 44,
                                            px: open ? 1.5 : 1,
                                            justifyContent: open ? 'initial' : 'center',
                                            bgcolor: active ? alpha('#6C63FF', 0.18) : 'transparent',
                                            border: active ? '1px solid rgba(108,99,255,0.3)' : '1px solid transparent',
                                            '&:hover': { bgcolor: alpha('#6C63FF', 0.10) },
                                        }}
                                    >
                                        <Tooltip title={!open ? item.label : ''} placement="right">
                                            <ListItemIcon sx={{
                                                minWidth: 0,
                                                mr: open ? 1.5 : 0,
                                                color: active ? 'primary.main' : 'text.secondary',
                                            }}>
                                                {item.icon}
                                            </ListItemIcon>
                                        </Tooltip>
                                        {open && (
                                            <ListItemText
                                                primary={item.label}
                                                primaryTypographyProps={{
                                                    fontSize: '0.875rem',
                                                    fontWeight: active ? 700 : 500,
                                                    color: active ? 'primary.light' : 'text.primary',
                                                }}
                                            />
                                        )}
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                </List>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

                {/* User info + logout */}
                <Box sx={{ p: 1.5 }}>
                    <ListItemButton onClick={() => navigate('/profile')} sx={{ borderRadius: 2, gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                            {user?.name?.[0]?.toUpperCase()}
                        </Avatar>
                        {open && (
                            <Box sx={{ overflow: 'hidden' }}>
                                <Typography variant="body2" fontWeight={600} noWrap>{user?.name}</Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>{user?.role}</Typography>
                            </Box>
                        )}
                    </ListItemButton>
                    <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, mt: 0.5, color: 'error.main' }}>
                        <ListItemIcon sx={{ minWidth: 0, mr: open ? 1.5 : 0, color: 'error.main' }}>
                            <Logout fontSize="small" />
                        </ListItemIcon>
                        {open && <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }} />}
                    </ListItemButton>
                </Box>
            </Drawer>

            {/* ─── Main content ─────────────────────────────────────── */}
            <Box component="main" sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* Topbar */}
                <AppBar position="sticky" elevation={0} sx={{
                    bgcolor: 'rgba(15,17,23,0.85)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                    <Toolbar sx={{ gap: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </Typography>
                        <Tooltip title="Notifications">
                            <IconButton size="small">
                                <Badge badgeContent={3} color="error">
                                    <Notifications sx={{ color: 'text.secondary' }} />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Profile">
                            <Avatar
                                onClick={() => navigate('/profile')}
                                sx={{ width: 34, height: 34, bgcolor: 'primary.main', cursor: 'pointer', fontSize: '0.875rem' }}
                            >
                                {user?.name?.[0]?.toUpperCase()}
                            </Avatar>
                        </Tooltip>
                    </Toolbar>
                </AppBar>

                <Box sx={{ flex: 1, p: 3 }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
}
