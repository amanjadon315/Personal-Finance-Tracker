// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Transaction Types
export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense'
};

// Common Categories
export const CATEGORIES = {
  INCOME: [
    'Salary',
    'Freelance',
    'Business',
    'Investment',
    'Rental',
    'Gift',
    'Bonus',
    'Other Income'
  ],
  EXPENSE: [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Insurance',
    'Rent/Mortgage',
    'Groceries',
    'Gas',
    'Internet',
    'Phone',
    'Subscriptions',
    'Clothing',
    'Gifts',
    'Personal Care',
    'Home Maintenance',
    'Other Expense'
  ]
};

// Date Periods
export const DATE_PERIODS = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
  CUSTOM: 'custom',
  ALL: 'all'
};

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899', '#14B8A6'],
  INCOME: '#10B981',
  EXPENSE: '#EF4444',
  NET: '#3B82F6',
  BACKGROUND: {
    INCOME: '#D1FAE5',
    EXPENSE: '#FEE2E2',
    NET: '#DBEAFE'
  }
};

// Form Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  NAME: /^[a-zA-Z\s]+$/,
  OTP: /^\d{6}$/,
  AMOUNT: /^\d+(\.\d{1,2})?$/
};

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PASSWORD: 'Password must contain at least 8 characters with uppercase, lowercase, number and special character',
  INVALID_NAME: 'Name can only contain letters and spaces',
  INVALID_OTP: 'OTP must be 6 digits',
  INVALID_AMOUNT: 'Please enter a valid amount',
  PASSWORD_MISMATCH: 'Passwords do not match',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Session expired. Please login again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  REGISTRATION: 'Registration successful! Please check your email for OTP.',
  EMAIL_VERIFIED: 'Email verified successfully!',
  LOGIN: 'Login successful!',
  LOGOUT: 'Logged out successfully!',
  TRANSACTION_CREATED: 'Transaction created successfully!',
  TRANSACTION_UPDATED: 'Transaction updated successfully!',
  TRANSACTION_DELETED: 'Transaction deleted successfully!',
  OTP_SENT: 'OTP sent successfully!',
  DATA_EXPORTED: 'Data exported successfully!'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'finance_tracker_token',
  USER: 'finance_tracker_user',
  THEME: 'finance_tracker_theme',
  PREFERENCES: 'finance_tracker_preferences'
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100]
};

// Currency Configuration
export const CURRENCY = {
  DEFAULT: 'USD',
  SYMBOL: '$',
  LOCALE: 'en-US',
  OPTIONS: [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
  ]
};

// Theme Configuration
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  VERIFY_OTP: '/verify-otp',
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  ANALYTICS: '/analytics',
  PROFILE: '/profile',
  SETTINGS: '/settings'
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// Utility Functions
export const formatCurrency = (amount, currencyCode = CURRENCY.DEFAULT) => {
  return new Intl.NumberFormat(CURRENCY.LOCALE, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return new Intl.DateTimeFormat(CURRENCY.LOCALE, {
    ...defaultOptions,
    ...options
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat(CURRENCY.LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

export const capitalizeFirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const truncateText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const generateRandomColor = () => {
  const colors = CHART_COLORS.PRIMARY;
  return colors[Math.floor(Math.random() * colors.length)];
};

export const getDateRange = (period) => {
  const now = new Date();
  let start, end;

  switch (period) {
    case DATE_PERIODS.TODAY:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    
    case DATE_PERIODS.WEEK:
      const dayOfWeek = now.getDay();
      start = new Date(now.getTime() - (dayOfWeek * 24 * 60 * 60 * 1000));
      start.setHours(0, 0, 0, 0);
      end = new Date(start.getTime() + (7 * 24 * 60 * 60 * 1000));
      break;
    
    case DATE_PERIODS.MONTH:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    
    case DATE_PERIODS.YEAR:
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
      break;
    
    default:
      start = null;
      end = null;
  }

  return { start, end };
};

export const validateEmail = (email) => {
  return VALIDATION_RULES.EMAIL.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 8 && VALIDATION_RULES.PASSWORD.test(password);
};

export const validateAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 999999.99;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};