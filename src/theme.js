import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#6C63FF',
            light: '#9D97FF',
            dark: '#4A44CC',
            contrastText: '#fff',
        },
        secondary: {
            main: '#FF6B6B',
            light: '#FF9E9E',
            dark: '#CC4B4B',
        },
        success: { main: '#00E096' },
        warning: { main: '#FFB547' },
        error: { main: '#FF4D4D' },
        info: { main: '#00B8D9' },
        background: {
            default: '#0F1117',
            paper: '#1A1D2E',
        },
        text: {
            primary: '#E8EAED',
            secondary: '#8B8FA8',
        },
        divider: 'rgba(255,255,255,0.08)',
    },
    typography: {
        fontFamily: '"Inter", "Roboto", sans-serif',
        h1: { fontWeight: 700, fontSize: '2.5rem' },
        h2: { fontWeight: 700, fontSize: '2rem' },
        h3: { fontWeight: 700, fontSize: '1.75rem' },
        h4: { fontWeight: 600, fontSize: '1.5rem' },
        h5: { fontWeight: 600, fontSize: '1.25rem' },
        h6: { fontWeight: 600, fontSize: '1rem' },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 14 },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    background: 'linear-gradient(135deg, #1A1D2E 0%, #252840 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    padding: '9px 22px',
                    fontSize: '0.875rem',
                },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #6C63FF 0%, #9D97FF 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #4A44CC 0%, #6C63FF 100%)' },
                    boxShadow: '0 4px 15px rgba(108,99,255,0.35)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.04)',
                    },
                },
            },
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    '& .MuiTableCell-root': {
                        background: 'rgba(108,99,255,0.12)',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#9D97FF',
                        border: 'none',
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderColor: 'rgba(255,255,255,0.05)',
                    padding: '12px 16px',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: { borderRadius: 8, fontWeight: 600, fontSize: '0.75rem' },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    background: 'linear-gradient(180deg, #13162A 0%, #0F1117 100%)',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                },
            },
        },
    },
});

export default theme;
