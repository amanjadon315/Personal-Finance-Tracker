const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Get financial summary
exports.getSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = 'all', startDate, endDate } = req.query;

    // Build date filter
    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'today':
        dateFilter = {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        };
        break;
      case 'week':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        dateFilter = { $gte: weekStart };
        break;
      case 'month':
        dateFilter = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
        };
        break;
      case 'year':
        dateFilter = {
          $gte: new Date(now.getFullYear(), 0, 1),
          $lt: new Date(now.getFullYear() + 1, 0, 1)
        };
        break;
    }

    const filter = { userId, type };
    if (Object.keys(dateFilter).length > 0) {
      filter.date = dateFilter;
    }

    const categoryBreakdown = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { total: -1 } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          total: 1,
          count: 1,
          avgAmount: { $round: ['$avgAmount', 2] }
        }
      }
    ]);

    // Calculate percentages
    const totalAmount = categoryBreakdown.reduce((sum, cat) => sum + cat.total, 0);
    const categoriesWithPercentage = categoryBreakdown.map(cat => ({
      ...cat,
      percentage: totalAmount > 0 ? Math.round((cat.total / totalAmount) * 100 * 100) / 100 : 0
    }));

    res.status(200).json({
      success: true,
      data: {
        categories: categoriesWithPercentage,
        totalAmount,
        period,
        type
      }
    });

  } catch (error) {
    console.error('Get category breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get monthly comparison
exports.getMonthlyComparison = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { months = 6 } = req.query;

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - parseInt(months), 1);

    const comparison = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month'
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0]
            }
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0]
            }
          }
        }
      },
      {
        $addFields: {
          net: { $subtract: ['$income', '$expense'] },
          monthName: {
            $arrayElemAt: [
              ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              { $subtract: ['$_id.month', 1] }
            ]
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: { comparison }
    });

  } catch (error) {
    console.error('Get monthly comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get financial goals progress (placeholder for future enhancement)
exports.getGoalsProgress = async (req, res) => {
  try {
    const userId = req.user.userId;

    // This is a placeholder for future financial goals feature
    // For now, return basic savings rate calculation
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyData = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: currentMonthStart }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const income = monthlyData.find(d => d._id === 'income')?.total || 0;
    const expense = monthlyData.find(d => d._id === 'expense')?.total || 0;
    const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100 * 100) / 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        currentMonth: {
          income,
          expense,
          savings: income - expense,
          savingsRate
        },
        message: 'Financial goals feature coming soon!'
      }
    });

  } catch (error) {
    console.error('Get goals progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
        };
        break;
      case 'custom':
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lt = new Date(endDate);
        break;
    }

    const filter = { userId };
    if (Object.keys(dateFilter).length > 0) {
      filter.date = dateFilter;
    }

    // Get summary data
    const summary = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    const income = summary.find(s => s._id === 'income') || { total: 0, count: 0, avgAmount: 0 };
    const expense = summary.find(s => s._id === 'expense') || { total: 0, count: 0, avgAmount: 0 };

    const summaryData = {
      totalIncome: income.total,
      totalExpense: expense.total,
      netAmount: income.total - expense.total,
      totalTransactions: income.count + expense.count,
      avgIncome: income.avgAmount,
      avgExpense: expense.avgAmount,
      incomeCount: income.count,
      expenseCount: expense.count
    };

    // Get recent transactions
    const recentTransactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        summary: summaryData,
        recentTransactions,
        period
      }
    });

  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get spending trends
exports.getTrends = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = 'month', months = 6 } = req.query;

    let groupBy = {};
    let dateRange = {};

    const now = new Date();
    
    if (period === 'month') {
      // Group by month
      groupBy = {
        year: { $year: '$date' },
        month: { $month: '$date' }
      };
      dateRange = {
        $gte: new Date(now.getFullYear(), now.getMonth() - parseInt(months), 1)
      };
    } else if (period === 'week') {
      // Group by week
      groupBy = {
        year: { $year: '$date' },
        week: { $week: '$date' }
      };
      dateRange = {
        $gte: new Date(now.getTime() - (parseInt(months) * 4 * 7 * 24 * 60 * 60 * 1000))
      };
    } else if (period === 'day') {
      // Group by day
      groupBy = {
        year: { $year: '$date' },
        month: { $month: '$date' },
        day: { $dayOfMonth: '$date' }
      };
      dateRange = {
        $gte: new Date(now.getTime() - (parseInt(months) * 30 * 24 * 60 * 60 * 1000))
      };
    }

    const trends = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: dateRange
        }
      },
      {
        $group: {
          _id: {
            ...groupBy,
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month',
            week: '$_id.week',
            day: '$_id.day'
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0]
            }
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0]
            }
          },
          incomeCount: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'income'] }, '$count', 0]
            }
          },
          expenseCount: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'expense'] }, '$count', 0]
            }
          }
        }
      },
      {
        $addFields: {
          net: { $subtract: ['$income', '$expense'] }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.day': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: { trends, period }
    });

  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get category breakdown
exports.getCategoryBreakdown = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type = 'expense', period = 'month' } = req.query;

    // Build date filter based on period
    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'week':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        dateFilter = { $gte: weekStart };
        break;
      case 'month':
        dateFilter = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
        };
        break;
      case 'year':
        dateFilter = {
          $gte: new Date(now.getFullYear(), 0, 1),
          $lt: new Date(now.getFullYear() + 1, 0, 1)