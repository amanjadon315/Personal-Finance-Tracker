const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');
const { hashPassword, createApiResponse } = require('../utils/helpers');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json(
        createApiResponse(false, 'User not found')
      );
    }

    res.status(200).json(
      createApiResponse(true, 'Profile retrieved successfully', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLogin: user.lastLogin,
          preferences: user.preferences || {}
        }
      })
    );

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json(
      createApiResponse(false, 'Internal server error', null, {
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    );
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createApiResponse(false, 'Validation errors', null, {
          errors: errors.array()
        })
      );
    }

    const userId = req.user.userId;
    const { name, email } = req.body;
    
    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        return res.status(409).json(
          createApiResponse(false, 'Email already exists')
        );
      }
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    updateData.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { 
        new: true, 
        runValidators: true,
        select: '-password'
      }
    );

    if (!user) {
      return res.status(404).json(
        createApiResponse(false, 'User not found')
      );
    }

    res.status(200).json(
      createApiResponse(true, 'Profile updated successfully', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          updatedAt: user.updatedAt
        }
      })
    );

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json(
      createApiResponse(false, 'Internal server error', null, {
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    );
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createApiResponse(false, 'Validation errors', null, {
          errors: errors.array()
        })
      );
    }

    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(
        createApiResponse(false, 'User not found')
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json(
        createApiResponse(false, 'Current password is incorrect')
      );
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    user.password = hashedNewPassword;
    user.updatedAt = new Date();
    await user.save();

    res.status(200).json(
      createApiResponse(true, 'Password changed successfully')
    );

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json(
      createApiResponse(false, 'Internal server error', null, {
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    );
  }
};

// Update user preferences
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json(
        createApiResponse(false, 'Valid preferences object is required')
      );
    }

    // Define allowed preference fields
    const allowedPreferences = {
      currency: 'string',
      dateFormat: 'string',
      theme: 'string',
      language: 'string',
      emailNotifications: 'boolean',
      pushNotifications: 'boolean',
      defaultTransactionType: 'string',
      dashboardLayout: 'object'
    };

    // Validate and sanitize preferences
    const validPreferences = {};
    Object.keys(preferences).forEach(key => {
      if (allowedPreferences[key] && typeof preferences[key] === allowedPreferences[key]) {
        validPreferences[key] = preferences[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        preferences: validPreferences,
        updatedAt: new Date()
      },
      { 
        new: true,
        select: '-password'
      }
    );

    if (!user) {
      return res.status(404).json(
        createApiResponse(false, 'User not found')
      );
    }

    res.status(200).json(
      createApiResponse(true, 'Preferences updated successfully', {
        preferences: user.preferences
      })
    );

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json(
      createApiResponse(false, 'Internal server error', null, {
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    );
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user registration date for calculating days since joining
    const user = await User.findById(userId).select('createdAt');
    if (!user) {
      return res.status(404).json(
        createApiResponse(false, 'User not found')
      );
    }

    const daysSinceJoining = Math.floor(
      (new Date() - user.createdAt) / (1000 * 60 * 60 * 24)
    );

    // Get transaction statistics
    const [
      totalTransactions,
      totalIncome,
      totalExpenses,
      thisMonthTransactions,
      categoriesUsed,
      recentActivity
    ] = await Promise.all([
      // Total transactions count
      Transaction.countDocuments({ userId }),
      
      // Total income
      Transaction.aggregate([
        { $match: { userId: user._id, type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      
      // Total expenses
      Transaction.aggregate([
        { $match: { userId: user._id, type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      
      // This month's transactions
      Transaction.countDocuments({
        userId,
        date: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }),
      
      // Number of unique categories used
      Transaction.distinct('category', { userId }),
      
      // Recent activity (last transaction date)
      Transaction.findOne({ userId }).sort({ date: -1 }).select('date')
    ]);

    const stats = {
      profile: {
        daysSinceJoining,
        isVerified: user.isVerified,
        memberSince: user.createdAt
      },
      transactions: {
        total: totalTransactions,
        thisMonth: thisMonthTransactions,
        categoriesUsed: categoriesUsed.length,
        lastActivity: recentActivity?.date || null
      },
      financial: {
        totalIncome: totalIncome[0]?.total || 0,
        totalExpenses: totalExpenses[0]?.total || 0,
        netAmount: (totalIncome[0]?.total || 0) - (totalExpenses[0]?.total || 0)
      }
    };

    res.status(200).json(
      createApiResponse(true, 'User statistics retrieved successfully', { stats })
    );

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json(
      createApiResponse(false, 'Internal server error', null, {
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    );
  }
};

// Delete user account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      return res.status(400).json(
        createApiResponse(false, 'Password confirmation is required')
      );
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(
        createApiResponse(false, 'User not found')
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(confirmPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json(
        createApiResponse(false, 'Invalid password')
      );
    }

    // Delete all user's transactions
    await Transaction.deleteMany({ userId });

    // Delete user account
    await User.findByIdAndDelete(userId);

    res.status(200).json(
      createApiResponse(true, 'Account deleted successfully')
    );

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json(
      createApiResponse(false, 'Internal server error', null, {
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    );
  }
};

// Export user data (GDPR compliance)
exports.exportUserData = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user data
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json(
        createApiResponse(false, 'User not found')
      );
    }

    // Get all user transactions
    const transactions = await Transaction.find({ userId }).sort({ date: -1 });

    // Prepare export data
    const exportData = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        dataType: 'complete',
        userId: userId
      },
      profile: {
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        preferences: user.preferences || {}
      },
      transactions: transactions.map(transaction => ({
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
        createdAt: transaction.createdAt
      })),
      summary: {
        totalTransactions: transactions.length,
        totalIncome: transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0),
        totalExpenses: transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
        categories: [...new Set(transactions.map(t => t.category))]
      }
    };

    // Set appropriate headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=finance-tracker-data.json');

    res.status(200).json(exportData);

  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json(
      createApiResponse(false, 'Internal server error', null, {
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    );
  }
};

// Get user activity log (for security purposes)
exports.getActivityLog = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    // This is a placeholder implementation
    // In a real application, you would track user activities in a separate collection
    const user = await User.findById(userId).select('lastLogin createdAt updatedAt');
    
    if (!user) {
      return res.status(404).json(
        createApiResponse(false, 'User not found')
      );
    }

    // Mock activity data (in production, this would come from an activity log collection)
    const activities = [
      {
        id: '1',
        type: 'login',
        description: 'User logged in',
        timestamp: user.lastLogin || new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      {
        id: '2',
        type: 'profile_update',
        description: 'Profile information updated',
        timestamp: user.updatedAt,
        ipAddress: req.ip
      },
      {
        id: '3',
        type: 'account_creation',
        description: 'Account created',
        timestamp: user.createdAt,
        ipAddress: 'Unknown'
      }
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Implement basic pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedActivities = activities.slice(startIndex, endIndex);

    res.status(200).json(
      createApiResponse(true, 'Activity log retrieved successfully', {
        activities: paginatedActivities,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(activities.length / parseInt(limit)),
          totalCount: activities.length,
          hasNextPage: endIndex < activities.length,
          hasPrevPage: parseInt(page) > 1
        }
      })
    );

  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json(
      createApiResponse(false, 'Internal server error', null, {
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    );
  }
};