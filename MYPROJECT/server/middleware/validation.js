const { body, param, query, validationResult } = require('express-validator');

// Custom validation middleware to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User registration validation
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces')
    .escape(),
    
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 100 })
    .withMessage('Email must not exceed 100 characters'),
    
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    
  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1 })
    .withMessage('Password cannot be empty'),
    
  handleValidationErrors
];

// OTP verification validation
const validateOTP = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
    
  handleValidationErrors
];

// Email validation for resend OTP
const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  handleValidationErrors
];

// Transaction creation validation
const validateTransaction = [
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either "income" or "expense"'),
    
  body('amount')
    .isFloat({ min: 0.01, max: 999999.99 })
    .withMessage('Amount must be a positive number between 0.01 and 999,999.99')
    .custom((value) => {
      // Check for maximum 2 decimal places
      const decimalPlaces = (value.toString().split('.')[1] || '').length;
      if (decimalPlaces > 2) {
        throw new Error('Amount can have maximum 2 decimal places');
      }
      return true;
    }),
    
  body('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category is required and must not exceed 50 characters')
    .matches(/^[a-zA-Z0-9\s&\-_]+$/)
    .withMessage('Category can only contain letters, numbers, spaces, hyphens, underscores, and ampersands')
    .escape(),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters')
    .escape(),
    
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in valid ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)')
    .custom((value) => {
      if (!value) return true;
      
      const date = new Date(value);
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      
      if (date < oneYearAgo) {
        throw new Error('Date cannot be more than one year in the past');
      }
      if (date > oneMonthFromNow) {
        throw new Error('Date cannot be more than one month in the future');
      }
      return true;
    }),
    
  handleValidationErrors
];

// Transaction update validation (all fields optional)
const validateTransactionUpdate = [
  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be either "income" or "expense"'),
    
  body('amount')
    .optional()
    .isFloat({ min: 0.01, max: 999999.99 })
    .withMessage('Amount must be a positive number between 0.01 and 999,999.99')
    .custom((value) => {
      if (!value) return true;
      const decimalPlaces = (value.toString().split('.')[1] || '').length;
      if (decimalPlaces > 2) {
        throw new Error('Amount can have maximum 2 decimal places');
      }
      return true;
    }),
    
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must not exceed 50 characters')
    .matches(/^[a-zA-Z0-9\s&\-_]+$/)
    .withMessage('Category can only contain letters, numbers, spaces, hyphens, underscores, and ampersands')
    .escape(),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters')
    .escape(),
    
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in valid ISO 8601 format')
    .custom((value) => {
      if (!value) return true;
      
      const date = new Date(value);
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      
      if (date < oneYearAgo || date > oneMonthFromNow) {
        throw new Error('Date must be within reasonable range');
      }
      return true;
    }),
    
  // Ensure at least one field is provided for update
  body()
    .custom((value, { req }) => {
      const allowedFields = ['type', 'amount', 'category', 'description', 'date'];
      const providedFields = Object.keys(req.body).filter(key => allowedFields.includes(key));
      
      if (providedFields.length === 0) {
        throw new Error('At least one field must be provided for update');
      }
      return true;
    }),
    
  handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = (field = 'id') => [
  param(field)
    .isMongoId()
    .withMessage(`Invalid ${field} format - must be a valid MongoDB ObjectId`),
    
  handleValidationErrors
];

// Query parameter validation for transactions
const validateTransactionQuery = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer between 1 and 1000'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be either "income" or "expense"'),
    
  query('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category filter must not exceed 50 characters')
    .escape(),
    
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters')
    .escape(),
    
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in valid ISO 8601 format'),
    
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in valid ISO 8601 format')
    .custom((value, { req }) => {
      if (value && req.query.startDate) {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(value);
        
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
        
        // Prevent overly large date ranges (more than 2 years)
        const maxRange = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years in milliseconds
        if (endDate.getTime() - startDate.getTime() > maxRange) {
          throw new Error('Date range cannot exceed 2 years');
        }
      }
      return true;
    }),
    
  query('sortBy')
    .optional()
    .isIn(['date', 'amount', 'category', 'type', 'createdAt'])
    .withMessage('Sort by must be one of: date, amount, category, type, createdAt'),
    
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either "asc" or "desc"'),
    
  handleValidationErrors
];

// Analytics query validation
const validateAnalyticsQuery = [
  query('period')
    .optional()
    .isIn(['today', 'week', 'month', 'year', 'custom', 'all'])
    .withMessage('Period must be one of: today, week, month, year, custom, all'),
    
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in valid ISO 8601 format'),
    
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in valid ISO 8601 format'),
    
  query('months')
    .optional()
    .isInt({ min: 1, max: 36 })
    .withMessage('Months must be between 1 and 36'),
    
  query('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be either "income" or "expense"'),
    
        // Custom validation for period-specific requirements
  query()
    .custom((value, { req }) => {
      const { period, startDate, endDate } = req.query;
      
      if (period === 'custom' && (!startDate || !endDate)) {
        throw new Error('Start date and end date are required for custom period');
      }
      
      if (period !== 'custom' && (startDate || endDate)) {
        throw new Error('Start date and end date should only be used with custom period');
      }
      
      return true;
    }),
    
  handleValidationErrors
];

// Bulk operations validation
const validateBulkDelete = [
  body('transactionIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('Transaction IDs must be an array with 1-100 items'),
    
  body('transactionIds.*')
    .isMongoId()
    .withMessage('Each transaction ID must be a valid MongoDB ObjectId'),
    
  // Check for duplicate IDs
  body('transactionIds')
    .custom((ids) => {
      const uniqueIds = [...new Set(ids)];
      if (uniqueIds.length !== ids.length) {
        throw new Error('Duplicate transaction IDs are not allowed');
      }
      return true;
    }),
    
  handleValidationErrors
];

// Export format validation
const validateExportFormat = [
  query('format')
    .optional()
    .isIn(['json', 'csv', 'xlsx'])
    .withMessage('Export format must be one of: json, csv, xlsx'),
    
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in valid ISO 8601 format'),
    
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in valid ISO 8601 format')
    .custom((value, { req }) => {
      if (value && req.query.startDate) {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(value);
        
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
    
  handleValidationErrors
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
    
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
    
  // Ensure new password is different from current password
  body('newPassword')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
    
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces')
    .escape(),
    
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 100 })
    .withMessage('Email must not exceed 100 characters'),
    
  // Ensure at least one field is provided
  body()
    .custom((value, { req }) => {
      const allowedFields = ['name', 'email'];
      const providedFields = Object.keys(req.body).filter(key => allowedFields.includes(key));
      
      if (providedFields.length === 0) {
        throw new Error('At least one field (name or email) must be provided for update');
      }
      return true;
    }),
    
  handleValidationErrors
];

// Generic ID array validation (for bulk operations)
const validateIdArray = (fieldName = 'ids', maxLength = 100) => [
  body(fieldName)
    .isArray({ min: 1, max: maxLength })
    .withMessage(`${fieldName} must be an array with 1-${maxLength} items`),
    
  body(`${fieldName}.*`)
    .isMongoId()
    .withMessage(`Each ID in ${fieldName} must be a valid MongoDB ObjectId`),
    
  body(fieldName)
    .custom((ids) => {
      const uniqueIds = [...new Set(ids)];
      if (uniqueIds.length !== ids.length) {
        throw new Error(`Duplicate IDs are not allowed in ${fieldName}`);
      }
      return true;
    }),
    
  handleValidationErrors
];

// Request rate limiting validation (for sensitive operations)
const validateSensitiveOperation = [
  body()
    .custom((value, { req }) => {
      // Add timestamp to track request frequency
      const now = Date.now();
      const userAgent = req.get('User-Agent') || '';
      const ip = req.ip || req.connection.remoteAddress;
      
      // This is a placeholder for rate limiting logic
      // In production, you would implement proper rate limiting middleware
      
      return true;
    }),
    
  handleValidationErrors
];

module.exports = {
  // Authentication validations
  validateRegister,
  validateLogin,
  validateOTP,
  validateEmail,
  validatePasswordChange,
  validateProfileUpdate,
  
  // Transaction validations
  validateTransaction,
  validateTransactionUpdate,
  validateTransactionQuery,
  validateBulkDelete,
  validateExportFormat,
  
  // Analytics validations
  validateAnalyticsQuery,
  
  // General validations
  validateObjectId,
  validateIdArray,
  validateSensitiveOperation,
  
  // Utility
  handleValidationErrors
};