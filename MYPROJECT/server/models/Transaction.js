const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User ID is required'],
    ref: 'User'
  },
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: {
      values: ['income', 'expense'],
      message: 'Type must be either income or expense'
    }
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
    validate: {
      validator: function(v) {
        return v && v > 0;
      },
      message: 'Amount must be a positive number'
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: {
      values: ['Basic Needs', 'Clothes', 'Entertainment', 'Other', 'Salary', 'Freelance', 'Investment', 'Gift'],
      message: 'Invalid category'
    }
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  date: {
    type: Date,
    required: [true, 'Transaction date is required'],
    default: Date.now
  },
  month: {
    type: Number,
    required: true,
    min: 0,
    max: 11
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2050
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  receipt: {
    url: String,
    filename: String
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: function() {
      return this.isRecurring;
    }
  },
  location: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, month: 1, year: 1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ createdAt: -1 });

// Pre-save middleware to set month and year
transactionSchema.pre('save', function(next) {
  if (this.date) {
    const date = new Date(this.date);
    this.month = date.getMonth();
    this.year = date.getFullYear();
  }
  next();
});

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(this.amount);
});

// Virtual for formatted date
transactionSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

// Static method to get user's monthly summary
transactionSchema.statics.getMonthlySummary = async function(userId, month, year) {
  const result = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        month: month,
        year: year
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
  
  const summary = {
    income: { total: 0, count: 0 },
    expense: { total: 0, count: 0 }
  };
  
  result.forEach(item => {
    summary[item._id] = {
      total: item.total,
      count: item.count
    };
  });
  
  summary.savings = summary.income.total - summary.expense.total;
  summary.totalTransactions = summary.income.count + summary.expense.count;
  
  return summary;
};

// Static method to get category breakdown
transactionSchema.statics.getCategoryBreakdown = async function(userId, month, year, type = 'expense') {
  return await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        month: month,
        year: year,
        type: type
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
};

// Static method to get spending trends
transactionSchema.statics.getSpendingTrends = async function(userId, months = 6) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - months);
  
  return await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        type: 'expense'
      }
    },
    {
      $group: {
        _id: {
          year: '$year',
          month: '$month'
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
};

// Instance method to duplicate transaction (for recurring)
transactionSchema.methods.duplicate = function(newDate) {
  const Transaction = this.constructor;
  const duplicated = new Transaction({
    userId: this.userId,
    type: this.type,
    amount: this.amount,
    category: this.category,
    description: this.description,
    date: newDate || new Date(),
    tags: this.tags,
    notes: `Recurring: ${this.notes || ''}`.trim()
  });
  
  return duplicated.save();
};

module.exports = mongoose.model('Transaction', transactionSchema);