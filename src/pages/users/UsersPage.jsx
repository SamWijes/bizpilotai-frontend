import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Typography, Button, Card, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Stack, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, Avatar, Skeleton,
} from '@mui/material';
import { Add, PersonOff } from '@mui/icons-material';
import { usersAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ROLES = ['OWNER', 'ADMIN', 'STAFF'];
const EMPTY = { name: '', email: '', password: '', role: 'STAFF' };

export default function UsersPage() {
    const qc = useQueryClient();
    const [dialog, setDialog] = useState({ open: false, data: EMPTY });

    const { data, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => usersAPI.list({ limit: 50 }).then((r) => r.data.data),
    });

    const createMutation = useMutation({
        mutationFn: (payload) => usersAPI.create(payload),
        onSuccess: () => { qc.invalidateQueries(['users']); toast.success('User created!'); setDialog({ ...dialog, open: false }); },
        onError: (err) => toast.error(err.response?.data?.message || 'Error'),
    });

    const deactivateMutation = useMutation({
        mutationFn: (id) => usersAPI.deactivate(id),
        onSuccess: () => { qc.invalidateQueries(['users']); toast.success('User deactivated'); },
    });

    const users = data || [];

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>Team Members</Typography>
                    <Typography color="text.secondary" variant="body2">{users.length} user{users.length !== 1 ? 's' : ''}</Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={() => setDialog({ open: true, data: EMPTY })}>
                    Add User
                </Button>
            </Stack>

            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>User</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Last Login</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                                <TableRow key={i}>{Array.from({ length: 6 }).map((__, j) => <TableCell key={j}><Skeleton height={28} /></TableCell>)}</TableRow>
                            )) : users.map((u) => (
                                <TableRow key={u.id} hover sx={{ '&:hover': { bgcolor: 'rgba(108,99,255,0.04)' } }}>
                                    <TableCell>
                                        <Stack direction="row" alignItems="center" gap={1.5}>
                                            <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(108,99,255,0.2)', color: 'primary.light', fontSize: '0.875rem' }}>
                                                {u.name?.[0]?.toUpperCase()}
                                            </Avatar>
                                            <Typography variant="body2" fontWeight={600}>{u.name}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell><Typography variant="body2">{u.email}</Typography></TableCell>
                                    <TableCell>
                                        <Chip label={u.role} size="small" sx={{
                                            bgcolor: u.role === 'OWNER' ? 'rgba(108,99,255,0.2)' : u.role === 'ADMIN' ? 'rgba(255,181,71,0.15)' : 'rgba(255,255,255,0.08)',
                                            color: u.role === 'OWNER' ? 'primary.light' : u.role === 'ADMIN' ? 'warning.main' : 'text.secondary',
                                        }} />
                                    </TableCell>
                                    <TableCell><Chip label={u.isActive ? 'Active' : 'Inactive'} size="small"
                                        sx={{ bgcolor: u.isActive ? 'rgba(0,224,150,0.15)' : 'rgba(255,77,77,0.15)', color: u.isActive ? 'success.main' : 'error.main' }} /></TableCell>
                                    <TableCell><Typography variant="body2" color="text.secondary">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}</Typography></TableCell>
                                    <TableCell align="right">
                                        {u.role !== 'OWNER' && u.isActive && (
                                            <Button size="small" color="error" startIcon={<PersonOff />} onClick={() => deactivateMutation.mutate(u.id)}>Deactivate</Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Add Team Member</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField label="Full Name" fullWidth required value={dialog.data.name}
                            onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, name: e.target.value } })} />
                        <TextField label="Email" type="email" fullWidth required value={dialog.data.email}
                            onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, email: e.target.value } })} />
                        <TextField label="Password" type="password" fullWidth required value={dialog.data.password}
                            onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, password: e.target.value } })} />
                        <TextField select label="Role" fullWidth value={dialog.data.role}
                            onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, role: e.target.value } })}>
                            {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                        </TextField>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 0 }}>
                    <Button onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
                    <Button variant="contained" onClick={() => createMutation.mutate(dialog.data)} disabled={createMutation.isLoading}>Create User</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
