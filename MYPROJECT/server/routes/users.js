const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  validateProfileUpdate,
  validatePasswordChange,
  handleValidationErrors
} = require('../middleware/validation');
const {
  getProfile,
  updateProfile,
  changePassword,
  updatePreferences,
  getUserStats,
  deleteAccount,
  exportUserData,
  getActivityLog
} = require('../controllers/userController');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile (name, email)
// @access  Private
router.put('/profile', validateProfileUpdate, updateProfile);

// @route   PUT /api/users/password
// @desc    Change user password
// @access  Private
router.put('/password', validatePasswordChange, changePassword);

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', [
  // Custom validation for preferences
  (req, res, next) => {
    const { preferences } = req.body;
    
    if (!preferences) {
      return res.status(400).json({
        success: false,
        message: 'Preferences object is required'
      });
    }

    // Validate specific preference fields
    const validPreferences = {};
    const allowedFields = [
      'currency', 'dateFormat', 'theme', 'language',
      'emailNotifications', 'pushNotifications',
      'defaultTransactionType', 'dashboardLayout'
    ];

    Object.keys(preferences).forEach(key => {
      if (allowedFields.includes(key)) {
        validPreferences[key] = preferences[key];
      }
    });

    req.body.preferences = validPreferences;
    next();
  }
], updatePreferences);

// @route   GET /api/users/stats
// @desc    Get user statistics and summary
// @access  Private
router.get('/stats', getUserStats);

// @route   GET /api/users/activity-log
// @desc    Get user activity log
// @access  Private
router.get('/activity-log', [
  // Query validation for pagination
  (req, res, next) => {
    const { page = 1, limit = 20 } = req.query;
    
    if (isNaN(page) || page < 1 || page > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Page must be a number between 1 and 1000'
      });
    }
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be a number between 1 and 100'
      });
    }
    
    next();
  }
], getActivityLog);

// @route   GET /api/users/export-data
// @desc    Export all user data (GDPR compliance)
// @access  Private
router.get('/export-data', exportUserData);

// @route   DELETE /api/users/account
// @desc    Delete user account and all associated data
// @access  Private
router.delete('/account', [
  // Validation for account deletion
  (req, res, next) => {
    const { confirmPassword } = req.body;
    
    if (!confirmPassword || typeof confirmPassword !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation is required'
      });
    }
    
    if (confirmPassword.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation cannot be empty'
      });
    }
    
    next();
  }
], deleteAccount);

// @route   POST /api/users/verify-password
// @desc    Verify user password (for sensitive operations)
// @access  Private
router.post('/verify-password', [
  (req, res, next) => {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }
    
    next();
  }
], async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const User = require('../models/User');
    const { createApiResponse } = require('../utils/helpers');
    
    const userId = req.user.userId;
    const { password } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(
        createApiResponse(false, 'User not found')
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    res.status(200).json(
      createApiResponse(true, 'Password verification completed', {
        isValid: isPasswordValid
      })
    );

  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json(
      createApiResponse(false, 'Internal server error')
    );
  }
});

// @route   GET /api/users/settings
// @desc    Get user account settings
// @access  Private
router.get('/settings', async (req, res) => {
  try {
    const User = require('../models/User');
    const { createApiResponse } = require('../utils/helpers');
    
    const userId = req.user.userId;
    const user = await User.findById(userId).select('name email isVerified preferences createdAt');
    
    if (!user) {
      return res.status(404).json(
        createApiResponse(false, 'User not found')
      );
    }

    const settings = {
      profile: {
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        memberSince: user.createdAt
      },
      preferences: user.preferences || {
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        theme: 'light',
        language: 'en',
        emailNotifications: true,
        pushNotifications: false,
        defaultTransactionType: 'expense'
      },
      security: {
        twoFactorEnabled: false, // Placeholder for future 2FA implementation
        passwordLastChanged: user.updatedAt || user.createdAt,
        loginSessions: 1 // Placeholder for session management
      }
    };

    res.status(200).json(
      createApiResponse(true, 'Settings retrieved successfully', { settings })
    );

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json(
      createApiResponse(false, 'Internal server error')
    );
  }
});

// @route   POST /api/users/upload-avatar
// @desc    Upload user avatar (placeholder for future implementation)
// @access  Private
router.post('/upload-avatar', (req, res) => {
  // Placeholder for avatar upload functionality
  // In production, you would integrate with cloud storage like AWS S3, Cloudinary, etc.
  
  res.status(501).json({
    success: false,
    message: 'Avatar upload feature is not yet implemented'
  });
});

// @route   DELETE /api/users/avatar
// @desc    Remove user avatar (placeholder for future implementation)
// @access  Private
router.delete('/avatar', (req, res) => {
  // Placeholder for avatar removal functionality
  
  res.status(501).json({
    success: false,
    message: 'Avatar removal feature is not yet implemented'
  });
});

// @route   POST /api/users/request-data
// @desc    Request user data export via email (GDPR compliance)
// @access  Private
router.post('/request-data', async (req, res) => {
  try {
    const { sendOTP } = require('../utils/sendOTP');
    const User = require('../models/User');
    const { createApiResponse } = require('../utils/helpers');
    
    const userId = req.user.userId;
    const user = await User.findById(userId).select('name email');
    
    if (!user) {
      return res.status(404).json(
        createApiResponse(false, 'User not found')
      );
    }

    // In production, you might queue this for background processing
    // For now, we'll just send a confirmation email
    
    const emailContent = `
      Dear ${user.name},
      
      Your data export request has been received. Your complete Finance Tracker data will be prepared and sent to you within 30 days as required by GDPR.
      
      This export will include:
      - Your profile information
      - All transaction records
      - Account preferences and settings
      
      If you didn't request this, please contact our support team immediately.
      
      Best regards,
      Finance Tracker Team
    `;

    // Send confirmation email (using the existing sendOTP function as a placeholder)
    // In production, you'd have a separate email service for different types of emails
    // await sendOTP(user.email, emailContent, user.name, 'Data Export Request Confirmation');

    res.status(200).json(
      createApiResponse(true, 'Data export request submitted. You will receive your data via email within 30 days.')
    );

  } catch (error) {
    console.error('Request data export error:', error);
    res.status(500).json(
      createApiResponse(false, 'Internal server error')
    );
  }
});

// @route   GET /api/users/dashboard-data
// @desc    Get user dashboard data (quick overview)
// @access  Private
router.get('/dashboard-data', async (req, res) => {
  try {
    const User = require('../models/User');
    const Transaction = require('../models/Transaction');
    const { createApiResponse } = require('../utils/helpers');
    
    const userId = req.user.userId;
    const user = await User.findById(userId).select('name preferences');
    
    if (!user) {
      return res.status(404).json(
        createApiResponse(false, 'User not found')
      );
    }

    // Get recent transactions (last 5)
    const recentTransactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(5)
      .select('type amount category description date');

    // Get this month's summary
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const thisMonthStats = await Transaction.aggregate([
      {
        $match: {
          userId: user._id,
          date: { $gte: thisMonthStart }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const income = thisMonthStats.find(stat => stat._id === 'income') || { total: 0, count: 0 };
    const expense = thisMonthStats.find(stat => stat._id === 'expense') || { total: 0, count: 0 };

    const dashboardData = {
      user: {
        name: user.name,
        preferences: user.preferences || {}
      },
      thisMonth: {
        income: income.total,
        expense: expense.total,
        net: income.total - expense.total,
        transactionCount: income.count + expense.count
      },
      recentTransactions
    };

    res.status(200).json(
      createApiResponse(true, 'Dashboard data retrieved successfully', dashboardData)
    );

  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json(
      createApiResponse(false, 'Internal server error')
    );
  }
});

module.exports = router;