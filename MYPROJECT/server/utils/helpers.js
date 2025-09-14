const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Generate a random OTP of specified length
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} Generated OTP
 */
const generateOTP = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max).toString();
};

/**
 * Generate a secure random token
 * @param {number} length - Length of token in bytes (default: 32)
 * @returns {string} Generated token in hex format
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash password using bcrypt
 * @param {string} password - Password to hash
 * @param {number} rounds - Salt rounds (default: from env or 12)
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password, rounds = null) => {
  const saltRounds = rounds || parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
const generateJWTToken = (payload, expiresIn = null) => {
  const expiration = expiresIn || process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: expiration });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyJWTToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format date to readable string
 * @param {Date} date - Date to format
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
const formatDate = (date, locale = 'en-US', options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options })
    .format(new Date(date));
};

/**
 * Get date range for different periods
 * @param {string} period - Period type (today, week, month, year)
 * @param {Date} baseDate - Base date for calculations (default: now)
 * @returns {Object} Object with start and end dates
 */
const getDateRange = (period, baseDate = new Date()) => {
  const base = new Date(baseDate);
  let start, end;

  switch (period.toLowerCase()) {
    case 'today':
      start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
      end = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);
      break;
    
    case 'yesterday':
      start = new Date(base.getFullYear(), base.getMonth(), base.getDate() - 1);
      end = new Date(base.getFullYear(), base.getMonth(), base.getDate());
      break;
    
    case 'week':
      const dayOfWeek = base.getDay();
      start = new Date(base.getTime() - (dayOfWeek * 24 * 60 * 60 * 1000));
      start.setHours(0, 0, 0, 0);
      end = new Date(start.getTime() + (7 * 24 * 60 * 60 * 1000));
      break;
    
    case 'last-week':
      const lastWeekStart = new Date(base.getTime() - (7 * 24 * 60 * 60 * 1000));
      const dayOfLastWeek = lastWeekStart.getDay();
      start = new Date(lastWeekStart.getTime() - (dayOfLastWeek * 24 * 60 * 60 * 1000));
      start.setHours(0, 0, 0, 0);
      end = new Date(start.getTime() + (7 * 24 * 60 * 60 * 1000));
      break;
    
    case 'month':
      start = new Date(base.getFullYear(), base.getMonth(), 1);
      end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
      break;
    
    case 'last-month':
      start = new Date(base.getFullYear(), base.getMonth() - 1, 1);
      end = new Date(base.getFullYear(), base.getMonth(), 1);
      break;
    
    case 'year':
      start = new Date(base.getFullYear(), 0, 1);
      end = new Date(base.getFullYear() + 1, 0, 1);
      break;
    
    case 'last-year':
      start = new Date(base.getFullYear() - 1, 0, 1);
      end = new Date(base.getFullYear(), 0, 1);
      break;
    
    default:
      start = null;
      end = null;
  }

  return { start, end };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with score and feedback
 */
const validatePasswordStrength = (password) => {
  const result = {
    isValid: false,
    score: 0,
    feedback: []
  };

  if (password.length < 8) {
    result.feedback.push('Password must be at least 8 characters long');
  } else {
    result.score += 1;
  }

  if (!/[a-z]/.test(password)) {
    result.feedback.push('Password must contain at least one lowercase letter');
  } else {
    result.score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    result.feedback.push('Password must contain at least one uppercase letter');
  } else {
    result.score += 1;
  }

  if (!/\d/.test(password)) {
    result.feedback.push('Password must contain at least one number');
  } else {
    result.score += 1;
  }

  if (!/[@$!%*?&]/.test(password)) {
    result.feedback.push('Password must contain at least one special character (@$!%*?&)');
  } else {
    result.score += 1;
  }

  result.isValid = result.score === 5;
  return result;
};

/**
 * Sanitize string input to prevent XSS
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers like onclick=
};

/**
 * Calculate percentage
 * @param {number} part - Part value
 * @param {number} total - Total value
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Calculated percentage
 */
const calculatePercentage = (part, total, decimals = 2) => {
  if (total === 0) return 0;
  return Math.round((part / total) * 100 * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Calculate percentage change
 * @param {number} oldValue - Previous value
 * @param {number} newValue - Current value
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Percentage change
 */
const calculatePercentageChange = (oldValue, newValue, decimals = 2) => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  const change = ((newValue - oldValue) / oldValue) * 100;
  return Math.round(change * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Generate pagination info
 * @param {number} currentPage - Current page number
 * @param {number} totalItems - Total number of items
 * @param {number} itemsPerPage - Items per page
 * @returns {Object} Pagination information
 */
const getPaginationInfo = (currentPage, totalItems, itemsPerPage) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;
  const skip = (currentPage - 1) * itemsPerPage;

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNextPage,
    hasPrevPage,
    skip,
    startIndex: skip + 1,
    endIndex: Math.min(skip + itemsPerPage, totalItems)
  };
};

/**
 * Create standard API response format
 * @param {boolean} success - Success status
 * @param {string} message - Response message
 * @param {Object} data - Response data
 * @param {Object} meta - Additional metadata
 * @returns {Object} Formatted API response
 */
const createApiResponse = (success, message, data = null, meta = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { 
      environment: 'development'
    })
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return response;
};

/**
 * Hash sensitive data for logging purposes
 * @param {string} data - Data to hash
 * @param {number} length - Length of hash to return (default: 8)
 * @returns {string} Hashed data
 */
const hashSensitiveData = (data, length = 8) => {
  return crypto
    .createHash('sha256')
    .update(data.toString())
    .digest('hex')
    .substring(0, length);
};

/**
 * Check if date is within range
 * @param {Date} date - Date to check
 * @param {Date} startDate - Start of range
 * @param {Date} endDate - End of range
 * @returns {boolean} True if date is within range
 */
const isDateInRange = (date, startDate, endDate) => {
  const checkDate = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return checkDate >= start && checkDate <= end;
};

/**
 * Get month name from month number
 * @param {number} month - Month number (1-12)
 * @param {boolean} short - Return short name (default: false)
 * @returns {string} Month name
 */
const getMonthName = (month, short = false) => {
  const months = short 
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['January', 'February', 'March', 'April', 'May', 'June', 
       'July', 'August', 'September', 'October', 'November', 'December'];
  
  return months[month - 1] || 'Unknown';
};

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to limit function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Sleep/delay function for async operations
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generate unique filename with timestamp
 * @param {string} originalName - Original filename
 * @param {string} prefix - Optional prefix
 * @returns {string} Unique filename
 */
const generateUniqueFilename = (originalName, prefix = '') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const nameWithoutExtension = originalName.replace(`.${extension}`, '');
  
  return `${prefix}${nameWithoutExtension}_${timestamp}_${random}.${extension}`;
};

/**
 * Convert bytes to human readable format
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Human readable size
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Generate random string
 * @param {number} length - Length of string
 * @param {string} charset - Character set to use
 * @returns {string} Random string
 */
const generateRandomString = (length = 10, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
};

/**
 * Remove empty properties from object
 * @param {Object} obj - Object to clean
 * @returns {Object} Cleaned object
 */
const removeEmptyProperties = (obj) => {
  const cleaned = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'object' && !Array.isArray(value)) {
        const cleanedNested = removeEmptyProperties(value);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        cleaned[key] = value;
      }
    }
  });
  
  return cleaned;
};

/**
 * Capitalize first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
const capitalizeWords = (str) => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Convert string to slug format
 * @param {string} str - String to convert
 * @returns {string} Slug string
 */
const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Function result or throws last error
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, i); // Exponential backoff
      await sleep(delay);
    }
  }
  
  throw lastError;
};

/**
 * Mask sensitive data for logging
 * @param {string} data - Data to mask
 * @param {number} visibleChars - Number of visible characters at start/end
 * @returns {string} Masked data
 */
const maskSensitiveData = (data, visibleChars = 2) => {
  if (!data || data.length <= visibleChars * 2) {
    return '*'.repeat(data?.length || 0);
  }
  
  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const middle = '*'.repeat(data.length - visibleChars * 2);
  
  return `${start}${middle}${end}`;
};

/**
 * Generate error object with consistent structure
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {number} statusCode - HTTP status code
 * @param {Object} details - Additional error details
 * @returns {Object} Structured error object
 */
const createError = (message, code = 'GENERIC_ERROR', statusCode = 500, details = {}) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  error.timestamp = new Date().toISOString();
  
  return error;
};

module.exports = {
  // Crypto & Security
  generateOTP,
  generateSecureToken,
  hashPassword,
  comparePassword,
  generateJWTToken,
  verifyJWTToken,
  hashSensitiveData,
  maskSensitiveData,
  
  // Formatting
  formatCurrency,
  formatDate,
  formatBytes,
  capitalizeWords,
  slugify,
  
  // Date & Time
  getDateRange,
  isDateInRange,
  getMonthName,
  
  // Validation
  isValidEmail,
  validatePasswordStrength,
  isEmpty,
  
  // String manipulation
  sanitizeString,
  generateRandomString,
  generateUniqueFilename,
  
  // Math & Calculations
  calculatePercentage,
  calculatePercentageChange,
  
  // Pagination & Data
  getPaginationInfo,
  removeEmptyProperties,
  deepClone,
  
  // API & Response
  createApiResponse,
  createError,
  
  // Utility Functions
  debounce,
  throttle,
  sleep,
  retryWithBackoff
};