import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
    headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach access token ──────────────────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ── Response interceptor — handle 401, refresh token ──────────────────────
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const original = err.config;
        if (err.response?.status === 401 && !original._retry) {
            original._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const { data } = await axios.post(
                        `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
                        { refreshToken }
                    );
                    localStorage.setItem('accessToken', data.data.accessToken);
                    localStorage.setItem('refreshToken', data.data.refreshToken);
                    original.headers.Authorization = `Bearer ${data.data.accessToken}`;
                    return api(original);
                } catch {
                    localStorage.clear();
                    window.location.href = '/login';
                }
            } else {
                localStorage.clear();
                window.location.href = '/login';
            }
        }
        return Promise.reject(err);
    }
);

// ── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    profile: () => api.get('/auth/profile'),
    changePassword: (data) => api.put('/auth/change-password', data),
};

// ── Business ───────────────────────────────────────────────────────────────
export const businessAPI = {
    getProfile: () => api.get('/business/profile'),
    updateProfile: (data) => api.put('/business/profile', data),
    getSettings: () => api.get('/business/settings'),
    updateSettings: (data) => api.put('/business/settings', data),
};

// ── Customers ──────────────────────────────────────────────────────────────
export const customersAPI = {
    list: (params) => api.get('/customers', { params }),
    create: (data) => api.post('/customers', data),
    get: (id) => api.get(`/customers/${id}`),
    update: (id, data) => api.put(`/customers/${id}`, data),
    delete: (id) => api.delete(`/customers/${id}`),
};

// ── Suppliers ──────────────────────────────────────────────────────────────
export const suppliersAPI = {
    list: (params) => api.get('/suppliers', { params }),
    create: (data) => api.post('/suppliers', data),
    get: (id) => api.get(`/suppliers/${id}`),
    update: (id, data) => api.put(`/suppliers/${id}`, data),
    delete: (id) => api.delete(`/suppliers/${id}`),
};

// ── Items (Catalog) ────────────────────────────────────────────────────────
export const itemsAPI = {
    list: (params) => api.get('/items', { params }),
    create: (data) => api.post('/items', data),
    get: (id) => api.get(`/items/${id}`),
    update: (id, data) => api.put(`/items/${id}`, data),
    delete: (id) => api.delete(`/items/${id}`),
};

// ── Products ───────────────────────────────────────────────────────────────
export const productsAPI = {
    list: (params) => api.get('/products', { params }),
    create: (data) => api.post('/products', data),
    createBulk: (data) => api.post('/products/bulk', data),
    get: (id) => api.get(`/products/${id}`),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
    lowStock: () => api.get('/products/low-stock'),
    categories: () => api.get('/products/categories'),
    createCategory: (data) => api.post('/products/categories', data),
};

// ── Inventory ──────────────────────────────────────────────────────────────
export const inventoryAPI = {
    stockIn: (data) => api.post('/inventory/stock-in', data),
    stockOut: (data) => api.post('/inventory/stock-out', data),
    adjust: (data) => api.post('/inventory/adjust', data),
    transactions: (params) => api.get('/inventory/transactions', { params }),
    supplierStats: (params) => api.get('/inventory/supplier-stats', { params }),
};

// ── Sales ──────────────────────────────────────────────────────────────────
export const salesAPI = {
    list: (params) => api.get('/sales', { params }),
    create: (data) => api.post('/sales', data),
    get: (id) => api.get(`/sales/${id}`),
    cancel: (id) => api.patch(`/sales/${id}/cancel`),
};

// ── Invoices ───────────────────────────────────────────────────────────────
export const invoicesAPI = {
    list: (params) => api.get('/invoices', { params }),
    get: (id) => api.get(`/invoices/${id}`),
    pdfUrl: (id) =>
        `${import.meta.env.VITE_API_BASE_URL}/invoices/${id}/pdf`,
    updateStatus: (id, data) => api.patch(`/invoices/${id}/status`, data),
};

// ── Finance (Expenses + Income) ────────────────────────────────────────────
export const financeAPI = {
    listExpenses: (params) => api.get('/finance/expenses', { params }),
    createExpense: (data) => api.post('/finance/expenses', data),
    updateExpense: (id, data) => api.put(`/finance/expenses/${id}`, data),
    deleteExpense: (id) => api.delete(`/finance/expenses/${id}`),
    listIncome: (params) => api.get('/finance/income', { params }),
    createIncome: (data) => api.post('/finance/income', data),
    updateIncome: (id, data) => api.put(`/finance/income/${id}`, data),
    deleteIncome: (id) => api.delete(`/finance/income/${id}`),
};

// ── Reports ────────────────────────────────────────────────────────────────
export const reportsAPI = {
    dashboard: () => api.get('/reports/dashboard'),
    sales: (params) => api.get('/reports/sales', { params }),
    profit: (params) => api.get('/reports/profit', { params }),
    topProducts: (params) => api.get('/reports/top-products', { params }),
};

// ── AI ─────────────────────────────────────────────────────────────────────
export const aiAPI = {
    insights: (prompt) => api.post('/ai/insights', { prompt }),
    email: (prompt) => api.post('/ai/email', { prompt }),
    invoiceSummary: (invoiceData) => api.post('/ai/invoice-summary', { invoiceData }),
    socialPost: (prompt) => api.post('/ai/social-post', { prompt }),
    chat: (message) => api.post('/ai/chat', { message }),
};

// ── Users ──────────────────────────────────────────────────────────────────
export const usersAPI = {
    list: (params) => api.get('/users', { params }),
    create: (data) => api.post('/users', data),
    get: (id) => api.get(`/users/${id}`),
    update: (id, data) => api.put(`/users/${id}`, data),
    deactivate: (id) => api.patch(`/users/${id}/deactivate`),
};

export default api;
