import { AUTH_API, TOKEN_KEY, REFRESH_TOKEN_KEY } from './constants';

// Utility function to handle token refresh
const refreshAuthToken = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    try {
        const response = await fetch(`${AUTH_API}/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
        });
        const data = await response.json();
        
        if (data.access) {
            localStorage.setItem(TOKEN_KEY, data.access);
            return data.access;
        }
        throw new Error('Failed to refresh token');
    } catch (error) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        throw error;
    }
};

// Utility function for making authenticated API calls
const makeRequest = async (url, options = {}) => {
    try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            };
        }

        let response = await fetch(url, options);

        // Handle 401 (Unauthorized) by attempting token refresh
        if (response.status === 401 && localStorage.getItem(REFRESH_TOKEN_KEY)) {
            const newToken = await refreshAuthToken();
            options.headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(url, options);
        }

        const data = await response.json();
        
        if (!response.ok) {
            // Handle field-specific errors (like validation errors)
            if (data && typeof data === 'object' && !data.detail && !data.message) {
                const fieldErrors = [];
                for (const [field, errors] of Object.entries(data)) {
                    if (Array.isArray(errors)) {
                        fieldErrors.push(`${field}: ${errors.join(', ')}`);
                    } else {
                        fieldErrors.push(`${field}: ${errors}`);
                    }
                }
                if (fieldErrors.length > 0) {
                    throw new Error(fieldErrors.join('. '));
                }
            }
            
            throw new Error(data.detail || data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        if (error.message === 'Failed to refresh token') {
            window.location.href = '/login';
        }
        throw error;
    }
};

const apiService = {
    // Auth endpoints
    register: async (userData) => {
        return makeRequest(`${AUTH_API}/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
    },

    verifyOTP: async (data) => {
        return makeRequest(`${AUTH_API}/verify-email/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    },

    resendOTP: async (email) => {
        return makeRequest(`${AUTH_API}/resend-verification/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
    },

    login: async (credentials) => {
        const response = await makeRequest(`${AUTH_API}/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        
        if (response.access && response.refresh) {
            localStorage.setItem(TOKEN_KEY, response.access);
            localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh);
        }
        
        return response;
    },

    logout: async () => {
        try {
            const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
            if (refreshToken) {
                await makeRequest(`${AUTH_API}/logout/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh: refreshToken }),
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
    },

    getProfile: async () => {
        return makeRequest(`${AUTH_API}/profile/`);
    },

    updateProfile: async (data) => {
        return makeRequest(`${AUTH_API}/profile/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    },

    requestPasswordReset: async (email) => {
        return makeRequest(`${AUTH_API}/password-reset/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
    },

    resetPassword: async (data) => {
        return makeRequest(`${AUTH_API}/password-reset/verify/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    },

    changePassword: async (data) => {
        return makeRequest(`${AUTH_API}/password-change/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    },

    // Admin endpoints
    getAdminDashboard: async () => {
        return makeRequest(`${AUTH_API}/admin/dashboard/`);
    },

    getUsers: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        return makeRequest(`${AUTH_API}/admin/users/?${params}`);
    },

    updateUser: async (userId, data) => {
        return makeRequest(`${AUTH_API}/admin/users/${userId}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    },

    deleteUser: async (userId) => {
        return makeRequest(`${AUTH_API}/admin/users/${userId}/`, {
            method: 'DELETE',
        });
    },

    getUserActivity: async () => {
        return makeRequest(`${AUTH_API}/admin/activity/`);
    },

    // Utility methods
    isAuthenticated: () => {
        return !!localStorage.getItem(TOKEN_KEY);
    },

    getToken: () => {
        return localStorage.getItem(TOKEN_KEY);
    },

    // Check if user is admin (this would need to be enhanced with proper role checking)
    isAdmin: async () => {
        try {
            const profile = await apiService.getProfile();
            return profile.role === 'admin';
        } catch {
            return false;
        }
    }
};

export default apiService;
