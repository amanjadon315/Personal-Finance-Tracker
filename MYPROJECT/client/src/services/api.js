import axios from 'axios';

// Create axios instance with base configuration
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('finance_tracker_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 401) {
        // Token expired or invalid
        localStorage.removeItem('finance_tracker_token');
        localStorage.removeItem('finance_tracker_user');
        
        if (data.expired) {
          // Redirect to login with message
          window.location.href = '/login?expired=true';
        }
      }
      
      // Return the error response for handling in components
      return Promise.reject({
        message: data.error || 'An error occurred',
        status,
        details: data.details,
      });
    } else if (error.request) {
      // Network error
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        status: 0,
      });
    } else {
      // Other error
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        status: 0,
      });
    }
  }
);

// Auth API calls
export const authAPI = {
  signup: (userData) => API.post('/auth/signup', userData),
  verifyOTP: (otpData) => API.post('/auth/verify-otp', otpData),
  login: (loginData) => API.post('/auth/login', loginData),
  verifyLoginOTP: (otpData) => API.post('/auth/verify-login-otp', otpData),
  resendOTP: (email) => API.post('/auth/resend-otp', { email }),
  getProfile: () => API.get('/auth/profile'),
  updateProfile: (profileData) => API.put('/auth/profile', profileData),
  refreshToken: () => API.post('/auth/refresh'),
  logout: () => API.post('/auth/logout'),
};

// Transaction API calls
export const transactionAPI = {
  getTransactions: (params = {}) => API.get('/transactions', { params }),
  getTransaction: (id) => API.get(`/transactions/${id}`),
  createTransaction: (transactionData) => API.post('/transactions', transactionData),
  updateTransaction: (id, transactionData) => API.put(`/transactions/${id}`, transactionData),
  deleteTransaction: (id) => API.delete(`/transactions/${id}`),
  bulkCreateTransactions: (transactions) => API.post('/transactions/bulk', { transactions }),
};

// Analytics API calls
export const analyticsAPI = {
  getMonthlySummary: (month, year) => API.get(`/analytics/monthly-summary?month=${month}&year=${year}`),
  getCategoryBreakdown: (month, year, type = 'expense') => 
    API.get(`/analytics/category-breakdown?month=${month}&year=${year}&type=${type}`),
  getSpendingTrends: (months = 6) => API.get(`/analytics/spending-trends?months=${months}`),
  getMonthlyComparison: (currentMonth, currentYear, prevMonth, prevYear) =>
    API.get(`/analytics/monthly-comparison?currentMonth=${currentMonth}&currentYear=${currentYear}&prevMonth=${prevMonth}&prevYear=${prevYear}`),
};

// Utility functions
export const apiUtils = {
  // Set auth token
  setAuthToken: (token) => {
    if (token) {
      localStorage.setItem('finance_tracker_token', token);
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('finance_tracker_token');
      delete API.defaults.headers.common['Authorization'];
    }
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('finance_tracker_token');
  },

  // Check if token exists
  isAuthenticated: () => {
    return !!localStorage.getItem('finance_tracker_token');
  },

  // Clear all stored auth data
  clearAuth: () => {
    localStorage.removeItem('finance_tracker_token');
    localStorage.removeItem('finance_tracker_user');
    delete API.defaults.headers.common['Authorization'];
  },

  // Store user data
  setUser: (user) => {
    localStorage.setItem('finance_tracker_user', JSON.stringify(user));
  },

  // Get stored user data
  getUser: () => {
    const user = localStorage.getItem('finance_tracker_user');
    return user ? JSON.parse(user) : null;
  },

  // Handle API errors consistently
  handleError: (error) => {
    console.error('API Error:', error);
    
    // Return user-friendly error message
    if (error.status === 0) {
      return 'Network error. Please check your internet connection.';
    } else if (error.status >= 500) {
      return 'Server error. Please try again later.';
    } else if (error.details) {
      return error.details;
    } else {
      return error.message || 'An unexpected error occurred.';
    }
  },

  // Format currency
  formatCurrency: (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  },

  // Format date
  formatDate: (date, options = {}) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    });
  },
};

export default API;