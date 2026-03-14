import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Box, Card, CardContent, TextField, Button, Typography,
    InputAdornment, IconButton, CircularProgress, Stack,
} from '@mui/material';
import { Visibility, VisibilityOff, AutoAwesome } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(form);
            toast.success('Welcome back!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 20% 50%, rgba(108,99,255,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,107,107,0.1) 0%, transparent 50%), #0F1117',
            display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
        }}>
            <Card sx={{ width: '100%', maxWidth: 420, p: 1 }}>
                <CardContent sx={{ p: 4 }}>
                    {/* Logo */}
                    <Stack alignItems="center" spacing={1.5} mb={4}>
                        <Box sx={{
                            width: 56, height: 56, borderRadius: 3,
                            background: 'linear-gradient(135deg, #6C63FF, #FF6B6B)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 24px rgba(108,99,255,0.4)',
                        }}>
                            <AutoAwesome sx={{ fontSize: 28, color: 'white' }} />
                        </Box>
                        <Typography variant="h5" fontWeight={800}>BizPilotAI</Typography>
                        <Typography color="text.secondary" variant="body2">Sign in to your account</Typography>
                    </Stack>

                    <form onSubmit={handleSubmit}>
                        <Stack spacing={2.5}>
                            <TextField
                                label="Email Address"
                                type="email"
                                fullWidth
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                                autoFocus
                            />
                            <TextField
                                label="Password"
                                type={showPw ? 'text' : 'password'}
                                fullWidth
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPw(!showPw)} edge="end">
                                                {showPw ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
                            >
                                {loading ? 'Signing in…' : 'Sign In'}
                            </Button>
                        </Stack>
                    </form>

                    <Typography textAlign="center" mt={3} variant="body2" color="text.secondary">
                        Don't have an account?{' '}
                        <Typography component={Link} to="/register" variant="body2" color="primary.light" fontWeight={600} sx={{ textDecoration: 'none' }}>
                            Register your business
                        </Typography>
                    </Typography>

                    {/* Demo credentials */}
                    <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)' }}>
                        <Typography variant="caption" color="primary.light" fontWeight={700} display="block" mb={0.5}>DEMO CREDENTIALS</Typography>
                        <Typography variant="caption" color="text.secondary">owner@demo.com / Owner@1234!</Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
