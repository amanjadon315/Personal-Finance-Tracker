const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { validateAnalyticsQuery } = require('../middleware/validation');
const {
  getSummary,
  getTrends,
  getCategoryBreakdown,
  getMonthlyComparison,
  getGoalsProgress
} = require('../controllers/analyticsController');

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   GET /api/analytics/summary
// @desc    Get financial summary for dashboard
// @access  Private
router.get('/summary', validateAnalyticsQuery, getSummary);

// @route   GET /api/analytics/trends
// @desc    Get spending/income trends over time
// @access  Private
router.get('/trends', validateAnalyticsQuery, getTrends);

// @route   GET /api/analytics/categories
// @desc    Get category breakdown for expenses/income
// @access  Private
router.get('/categories', validateAnalyticsQuery, getCategoryBreakdown);

// @route   GET /api/analytics/monthly-comparison
// @desc    Get monthly income vs expense comparison
// @access  Private
router.get('/monthly-comparison', validateAnalyticsQuery, getMonthlyComparison);

// @route   GET /api/analytics/goals
// @desc    Get financial goals progress (future feature)
// @access  Private
router.get('/goals', getGoalsProgress);

// @route   GET /api/analytics/spending-patterns
// @desc    Get spending patterns analysis
// @access  Private
router.get('/spending-patterns', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = 'month' } = req.query;

    // This is a placeholder for future enhancement
    // You can implement spending pattern analysis here
    
    res.status(200).json({
      success: true,
      message: 'Spending patterns analysis feature coming soon!',
      data: {
        period,
        patterns: [],
        insights: []
      }
    });
  } catch (error) {
    console.error('Get spending patterns error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/analytics/budget-analysis
// @desc    Get budget vs actual analysis
// @access  Private
router.get('/budget-analysis', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // This is a placeholder for future budget feature
    res.status(200).json({
      success: true,
      message: 'Budget analysis feature coming soon!',
      data: {
        budgets: [],
        analysis: {}
      }
    });
  } catch (error) {
    console.error('Get budget analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;