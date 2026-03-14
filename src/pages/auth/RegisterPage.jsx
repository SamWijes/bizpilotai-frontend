import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Box, Card, CardContent, TextField, Button, Typography,
    InputAdornment, IconButton, CircularProgress, Stack, Grid,
} from '@mui/material';
import { Visibility, VisibilityOff, AutoAwesome } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const [form, setForm] = useState({
        businessName: '', businessEmail: '', businessPhone: '',
        name: '', email: '', password: '', currency: 'USD',
    });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(form);
            toast.success('Business registered! Welcome to BizPilotAI!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
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
            <Card sx={{ width: '100%', maxWidth: 560, p: 1 }}>
                <CardContent sx={{ p: 4 }}>
                    <Stack alignItems="center" spacing={1.5} mb={4}>
                        <Box sx={{
                            width: 56, height: 56, borderRadius: 3,
                            background: 'linear-gradient(135deg, #6C63FF, #FF6B6B)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 24px rgba(108,99,255,0.4)',
                        }}>
                            <AutoAwesome sx={{ fontSize: 28, color: 'white' }} />
                        </Box>
                        <Typography variant="h5" fontWeight={800}>Create Your Business</Typography>
                        <Typography color="text.secondary" variant="body2">Start your free trial — no credit card needed</Typography>
                    </Stack>

                    <form onSubmit={handleSubmit}>
                        <Stack spacing={2.5}>
                            <Typography variant="caption" color="primary.light" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>Business Info</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={8}>
                                    <TextField label="Business Name" fullWidth value={form.businessName} onChange={handleChange('businessName')} required />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField label="Currency" fullWidth value={form.currency} onChange={handleChange('currency')} placeholder="USD" />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Business Email" type="email" fullWidth value={form.businessEmail} onChange={handleChange('businessEmail')} required />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Business Phone" fullWidth value={form.businessPhone} onChange={handleChange('businessPhone')} />
                                </Grid>
                            </Grid>

                            <Typography variant="caption" color="primary.light" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', pt: 1 }}>Owner Account</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Your Name" fullWidth value={form.name} onChange={handleChange('name')} required />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Your Email" type="email" fullWidth value={form.email} onChange={handleChange('email')} required />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Password"
                                        type={showPw ? 'text' : 'password'}
                                        fullWidth value={form.password} onChange={handleChange('password')} required
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
                                </Grid>
                            </Grid>

                            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
                                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}>
                                {loading ? 'Creating account…' : 'Create Business Account'}
                            </Button>
                        </Stack>
                    </form>

                    <Typography textAlign="center" mt={3} variant="body2" color="text.secondary">
                        Already have an account?{' '}
                        <Typography component={Link} to="/login" variant="body2" color="primary.light" fontWeight={600} sx={{ textDecoration: 'none' }}>
                            Sign in
                        </Typography>
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}
