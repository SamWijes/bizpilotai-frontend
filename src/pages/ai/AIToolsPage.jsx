import { useState } from 'react';
import {
    Box, Typography, Card, CardContent, Button, TextField, Stack,
    Tab, Tabs, CircularProgress, Chip, alpha, Grid,
} from '@mui/material';
import {
    Lightbulb, Email, Receipt, Campaign, SmartToy, Send,
} from '@mui/icons-material';
import { aiAPI } from '../../services/api';
import toast from 'react-hot-toast';

const tools = [
    { id: 'insights', icon: <Lightbulb />, label: 'Business Insights', prompt: 'What insights do you have about my business performance this month?', color: '#FFB547' },
    {
        id: 'email', icon: <Email />, label: 'Email Composer', prompt: 'Write a professional follow-up email to a client who has not paid their invoice.', color: '#00B8D9'
    },
    { id: 'invoiceSummary', icon: <Receipt />, label: 'Invoice Summary', prompt: null, color: '#6C63FF', isJson: true },
    { id: 'socialPost', icon: <Campaign />, label: 'Social Media Post', prompt: 'Write a promotional Instagram post for a 20% off sale on electronics this weekend.', color: '#FF6B6B' },
    { id: 'chat', icon: <SmartToy />, label: 'AI Chat', prompt: 'How is my business performing compared to last month?', color: '#00E096' },
];

function AiTool({ tool }) {
    const [input, setInput] = useState(tool.prompt || '');
    const [response, setResponse] = useState('');
    const [tokens, setTokens] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;
        setLoading(true);
        setResponse('');
        try {
            let res;
            if (tool.id === 'insights') res = await aiAPI.insights(input);
            else if (tool.id === 'email') res = await aiAPI.email(input);
            else if (tool.id === 'socialPost') res = await aiAPI.socialPost(input);
            else if (tool.id === 'chat') res = await aiAPI.chat(input);
            else if (tool.id === 'invoiceSummary') {
                let parsed;
                try { parsed = JSON.parse(input); } catch { parsed = input; }
                res = await aiAPI.invoiceSummary(parsed);
            }
            setResponse(res.data.data.response);
            setTokens(res.data.data.tokensUsed);
        } catch (err) {
            toast.error(err.response?.data?.message || 'AI request failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardContent>
                <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
                    <Box sx={{
                        width: 40, height: 40, borderRadius: 2,
                        bgcolor: alpha(tool.color, 0.15), color: tool.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {tool.icon}
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>{tool.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {tool.id === 'invoiceSummary' ? 'Paste invoice JSON to explain in plain language' : 'Prompt the AI with your request'}
                        </Typography>
                    </Box>
                </Stack>

                <TextField
                    label={tool.id === 'invoiceSummary' ? 'Invoice data (JSON)' : 'Your prompt'}
                    fullWidth multiline rows={3}
                    value={input} onChange={(e) => setInput(e.target.value)}
                    sx={{ mb: 2 }}
                />
                <Button
                    variant="contained" endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Send />}
                    onClick={handleSend} disabled={loading || !input.trim()}
                    sx={{ bgcolor: tool.color, '&:hover': { bgcolor: alpha(tool.color, 0.8) } }}>
                    {loading ? 'Generating…' : 'Generate'}
                </Button>

                {response && (
                    <Box sx={{ mt: 2.5, p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
                        {tokens && (
                            <Chip label={`${tokens} tokens`} size="small" sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(108,99,255,0.2)', color: 'primary.light', fontSize: '0.7rem' }} />
                        )}
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, pr: 8 }}>{response}</Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}

export default function AIToolsPage() {
    const [tab, setTab] = useState(0);

    return (
        <Box>
            <Stack spacing={0.5} mb={3}>
                <Typography variant="h4" fontWeight={800}>AI Tools</Typography>
                <Typography color="text.secondary" variant="body2">
                    Powered by OpenAI — Generate insights, emails, posts, and more
                </Typography>
            </Stack>

            <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', mb: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="primary" indicatorColor="primary" variant="scrollable" scrollButtons="auto">
                    {tools.map((t, i) => <Tab key={t.id} icon={t.icon} label={t.label} iconPosition="start" value={i} />)}
                </Tabs>
            </Box>

            <AiTool tool={tools[tab]} />
        </Box>
    );
}
