const express = require('express');
const Joi = require('joi');
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const transactionSchema = Joi.object({
  type: Joi.string().valid('income', 'expense').required(),
  amount: Joi.number().positive().precision(2).required(),
  category: Joi.string().valid(
    'Basic Needs', 'Clothes', 'Entertainment', 'Other', 
    'Salary', 'Freelance', 'Investment', 'Gift'
  ).required(),
  description: Joi.string().min(1).max(200).required(),
  date: Joi.date().optional(),
  tags: Joi.array().items(Joi.string().max(20)).optional(),
  notes: Joi.string().max(500).optional(),
  location: Joi.object({
    name: Joi.string().optional(),
    coordinates: Joi.object({
      lat: Joi.number().optional(),
      lng: Joi.number().optional()
    }).optional()
  }).optional()
});

const updateTransactionSchema = Joi.object({
  type: Joi.string().valid('income', 'expense').optional(),
  amount: Joi.number().positive().precision(2).optional(),
  category: Joi.string().valid(
    'Basic Needs', 'Clothes', 'Entertainment', 'Other', 
    'Salary', 'Freelance', 'Investment', 'Gift'
  ).optional(),
  description: Joi.string().min(1).max(200).optional(),
  date: Joi.date().optional(),
  tags: Joi.array().items(Joi.string().max(20)).optional(),
  notes: Joi.string().max(500).optional(),
  location: Joi.object({
    name: Joi.string().optional(),
    coordinates: Joi.object({
      lat: Joi.number().optional(),
      lng: Joi.number().optional()
    }).optional()
  }).optional()
});

// Apply auth middleware to all routes
router.use(auth);

// @route   GET /api/transactions
// @desc    Get user's transactions with filtering
// @access  Private
router.get('/', async (req, res) => {
  try {
    const {
      month,
      year,
      type,
      category,
      limit = 50,
      page = 1,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { userId: req.user.id };
    
    if (month !== undefined) filter.month = parseInt(month);
    if (year !== undefined) filter.year = parseInt(year);
    if (type) filter.type = type;
    if (category) filter.category = category;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const transactions = await Transaction.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const totalTransactions = await Transaction.countDocuments(filter);
    const totalPages = Math.ceil(totalTransactions / parseInt(limit));

    res.json({
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalTransactions,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      error: 'Failed to fetch transactions',
      details: error.message
    });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }

    res.json(transaction);

  } catch (error) {
    console.error('Get transaction error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid transaction ID'
      });
    }
    
    res.status(500).json({
      error: 'Failed to fetch transaction',
      details: error.message
    });
  }
});

// @route   POST /api/transactions
// @desc    Create new transaction
// @access  Private
router.post('/', async (req, res) => {
  try {
    // Validate input
    const { error } = transactionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    // Create transaction
    const transactionData = {
      ...req.body,
      userId: req.user.id
    };

    // Set date if not provided
    if (!transactionData.date) {
      transactionData.date = new Date();
    }

    const transaction = new Transaction(transactionData);
    await transaction.save();

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      error: 'Failed to create transaction',
      details: error.message
    });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    // Validate input
    const { error } = updateTransactionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    // Find and update transaction
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }

    res.json({
      message: 'Transaction updated successfully',
      transaction
    });

  } catch (error) {
    console.error('Update transaction error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid transaction ID'
      });
    }
    
    res.status(500).json({
      error: 'Failed to update transaction',
      details: error.message
    });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }

    res.json({
      message: 'Transaction deleted successfully',
      transaction
    });

  } catch (error) {
    console.error('Delete transaction error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid transaction ID'
      });
    }
    
    res.status(500).json({
      error: 'Failed to delete transaction',
      details: error.message
    });
  }
});

// @route   POST /api/transactions/bulk
// @desc    Create multiple transactions
// @access  Private
router.post('/bulk', async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        error: 'Transactions array is required and must not be empty'
      });
    }

    // Validate each transaction
    const validationErrors = [];
    const validTransactions = [];

    for (let i = 0; i < transactions.length; i++) {
      const { error } = transactionSchema.validate(transactions[i]);
      if (error) {
        validationErrors.push({
          index: i,
          error: error.details[0].message
        });
      } else {
        validTransactions.push({
          ...transactions[i],
          userId: req.user.id
        });
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation errors in transactions',
        details: validationErrors
      });
    }

    // Insert all valid transactions
    const createdTransactions = await Transaction.insertMany(validTransactions);

    res.status(201).json({
      message: `${createdTransactions.length} transactions created successfully`,
      transactions: createdTransactions
    });

  } catch (error) {
    console.error('Bulk create transactions error:', error);
    res.status(500).json({
      error: 'Failed to create transactions',
      details: error.message
    });
  }
});

module.exports = router;