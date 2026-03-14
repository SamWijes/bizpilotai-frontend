import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    Box, Typography, Card, CardContent, Grid, TextField, Button, Stack,
    Avatar, Divider, Chip, CircularProgress,
} from '@mui/material';
import { Save, Lock } from '@mui/icons-material';
import { businessAPI, authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const { user, business: bizCtx } = useAuth();
    const [bizForm, setBizForm] = useState(null);
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const { data: bizData, isLoading } = useQuery({
        queryKey: ['business-profile'],
        queryFn: () => businessAPI.getProfile().then((r) => { setBizForm(r.data.data); return r.data.data; }),
        enabled: !bizForm,
    });

    const bizMutation = useMutation({
        mutationFn: (payload) => businessAPI.updateProfile(payload),
        onSuccess: () => toast.success('Business profile updated!'),
        onError: (err) => toast.error(err.response?.data?.message || 'Error'),
    });

    const pwMutation = useMutation({
        mutationFn: (payload) => authAPI.changePassword(payload),
        onSuccess: () => { toast.success('Password changed!'); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); },
        onError: (err) => toast.error(err.response?.data?.message || 'Error'),
    });

    return (
        <Box>
            <Typography variant="h4" fontWeight={800} mb={0.5}>Profile & Settings</Typography>
            <Typography color="text.secondary" mb={3} variant="body2">Manage your account and business information</Typography>

            <Grid container spacing={3}>
                {/* User info */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center', p: 4 }}>
                            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem', mx: 'auto', mb: 2 }}>
                                {user?.name?.[0]?.toUpperCase()}
                            </Avatar>
                            <Typography variant="h6" fontWeight={700}>{user?.name}</Typography>
                            <Typography color="text.secondary" variant="body2" mb={1}>{user?.email}</Typography>
                            <Chip label={user?.role} sx={{
                                bgcolor: user?.role === 'OWNER' ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.08)',
                                color: user?.role === 'OWNER' ? 'primary.light' : 'text.secondary',
                            }} />
                            {bizCtx && (
                                <Box mt={2} p={2} borderRadius={2} bgcolor="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.06)">
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">Business</Typography>
                                    <Typography variant="body2" fontWeight={600} mt={0.5}>{bizCtx.name}</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    {/* Change Password */}
                    <Card sx={{ mt: 3 }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" gap={1} mb={2.5}>
                                <Lock sx={{ color: 'text.secondary', fontSize: 20 }} />
                                <Typography variant="h6" fontWeight={700}>Change Password</Typography>
                            </Stack>
                            <Stack spacing={2}>
                                <TextField label="Current Password" type="password" fullWidth size="small"
                                    value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
                                <TextField label="New Password" type="password" fullWidth size="small"
                                    value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
                                <TextField label="Confirm Password" type="password" fullWidth size="small"
                                    value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} />
                                <Button variant="outlined" onClick={() => pwMutation.mutate(pwForm)}
                                    disabled={pwMutation.isLoading || !pwForm.currentPassword || pwForm.newPassword !== pwForm.confirmPassword}>
                                    {pwMutation.isLoading ? <CircularProgress size={18} /> : 'Change Password'}
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Business profile */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight={700} mb={2.5}>Business Profile</Typography>
                            {bizForm && (
                                <Grid container spacing={2}>
                                    {[
                                        { label: 'Business Name', field: 'name', required: true, sm: 12 },
                                        { label: 'Business Email', field: 'email', type: 'email', sm: 6 },
                                        { label: 'Phone', field: 'phone', sm: 6 },
                                        { label: 'Website', field: 'website', sm: 6 },
                                        { label: 'Currency', field: 'currency', sm: 3 },
                                        { label: 'Tax Rate (%)', field: 'taxRate', type: 'number', sm: 3 },
                                        { label: 'Address', field: 'address', sm: 12 },
                                        { label: 'Timezone', field: 'timezone', sm: 6 },
                                    ].map(({ label, field, type, required, sm }) => (
                                        <Grid item xs={12} sm={sm} key={field}>
                                            <TextField label={label} type={type || 'text'} fullWidth required={required}
                                                value={bizForm[field] || ''}
                                                onChange={(e) => setBizForm({ ...bizForm, [field]: e.target.value })} />
                                        </Grid>
                                    ))}
                                    <Grid item xs={12}>
                                        <Button variant="contained" startIcon={<Save />}
                                            onClick={() => bizMutation.mutate(bizForm)} disabled={bizMutation.isLoading}>
                                            {bizMutation.isLoading ? 'Saving…' : 'Save Business Profile'}
                                        </Button>
                                    </Grid>
                                </Grid>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
