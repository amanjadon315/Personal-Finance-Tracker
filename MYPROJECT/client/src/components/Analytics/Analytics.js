import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { transactionAPI, analyticsAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

const Analytics = ({ showNotification, onError }) => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6months');
  const [chartType, setChartType] = useState('spending');
  const [analyticsData, setAnalyticsData] = useState({
    spendingTrends: [],
    categoryBreakdown: [],
    monthlyComparison: [],
    insights: {}
  });

  // Date range options
  const dateRanges = {
    '3months': { label: '3 Months', months: 3 },
    '6months': { label: '6 Months', months: 6 },
    '12months': { label: '12 Months', months: 12 },
    'all': { label: 'All Time', months: null }
  };

  // Chart type options
  const chartTypes = [
    { id: 'spending', name: 'Spending Trends', icon: TrendingDown },
    { id: 'income', name: 'Income Trends', icon: TrendingUp },
    { id: 'categories', name: 'Category Breakdown', icon: DollarSign },
    { id: 'comparison', name: 'Monthly Comparison', icon: Calendar }
  ];

  // Colors for charts
  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#0088fe', '#00c49f'];

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    setLoading(true);
    
    try {
      const months = dateRanges[dateRange].months;
      
      // Fetch spending trends
      const trendsResponse = await analyticsAPI.getSpendingTrends(months);
      
      // Fetch current month category breakdown
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const categoryResponse = await analyticsAPI.getCategoryBreakdown(
        currentMonth, 
        currentYear, 
        chartType === 'income' ? 'income' : 'expense'
      );
      
      // Fetch monthly comparison (last 6 months)
      const comparisonData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.getMonth();
        const year = date.getFullYear();
        
        try {
          const summary = await analyticsAPI.getMonthlySummary(month, year);
          comparisonData.push({
            month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            income: summary.data.income?.total || 0,
            expenses: summary.data.expense?.total || 0,
            savings: (summary.data.income?.total || 0) - (summary.data.expense?.total || 0)
          });
        } catch (error) {
          // Skip if no data for that month
          comparisonData.push({
            month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            income: 0,
            expenses: 0,
            savings: 0
          });
        }
      }

      setAnalyticsData({
        spendingTrends: trendsResponse.data,
        categoryBreakdown: categoryResponse.data,
        monthlyComparison: comparisonData,
        insights: calculateInsights(comparisonData)
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      showNotification('Failed to load analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate insights from data
  const calculateInsights = (monthlyData) => {
    if (monthlyData.length < 2) return {};

    const latest = monthlyData[monthlyData.length - 1];
    const previous = monthlyData[monthlyData.length - 2];
    
    const spendingChange = previous.expenses > 0 
      ? ((latest.expenses - previous.expenses) / previous.expenses) * 100 
      : 0;
    
    const incomeChange = previous.income > 0
      ? ((latest.income - previous.income) / previous.income) * 100
      : 0;

    const avgMonthlySpending = monthlyData.reduce((sum, month) => sum + month.expenses, 0) / monthlyData.length;
    const avgMonthlySavings = monthlyData.reduce((sum, month) => sum + month.savings, 0) / monthlyData.length;

    return {
      spendingChange,
      incomeChange,
      avgMonthlySpending,
      avgMonthlySavings,
      isSpendingUp: spendingChange > 0,
      isIncomeUp: incomeChange > 0
    };
  };

  // Handle data export
  const handleExportData = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      dateRange: dateRanges[dateRange].label,
      data: analyticsData
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Analytics data exported successfully!', 'success');
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, chartType]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label, formatter = (value) => `$${value.toLocaleString()}` }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{formatter(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading analytics data..." />
      </div>
    );
  }

  const { insights } = analyticsData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Analytics</h1>
              <p className="text-gray-600 mt-2">
                Detailed insights into your financial patterns and trends
              </p>
            </div>
            
            <button
              onClick={handleExportData}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Download size={16} />
              Export Data
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Date Range Filter */}
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {Object.entries(dateRanges).map(([key, range]) => (
                  <option key={key} value={key}>{range.label}</option>
                ))}
              </select>
            </div>

            {/* Chart Type Filter */}
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-500" />
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {chartTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Key Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Spending Change */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Spending Change</p>
                <p className={`text-2xl font-bold ${insights.isSpendingUp ? 'text-red-600' : 'text-green-600'}`}>
                  {insights.spendingChange ? `${insights.spendingChange.toFixed(1)}%` : '0%'}
                </p>
                <p className="text-xs text-gray-500">vs last month</p>
              </div>
              <div className={`p-3 rounded-full ${insights.isSpendingUp ? 'bg-red-100' : 'bg-green-100'}`}>
                {insights.isSpendingUp ? 
                  <ArrowUpRight className="text-red-600" size={24} /> :
                  <ArrowDownRight className="text-green-600" size={24} />
                }
              </div>
            </div>
          </div>

          {/* Income Change */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Income Change</p>
                <p className={`text-2xl font-bold ${insights.isIncomeUp ? 'text-green-600' : 'text-red-600'}`}>
                  {insights.incomeChange ? `${insights.incomeChange.toFixed(1)}%` : '0%'}
                </p>
                <p className="text-xs text-gray-500">vs last month</p>
              </div>
              <div className={`p-3 rounded-full ${insights.isIncomeUp ? 'bg-green-100' : 'bg-red-100'}`}>
                {insights.isIncomeUp ? 
                  <ArrowUpRight className="text-green-600" size={24} /> :
                  <ArrowDownRight className="text-red-600" size={24} />
                }
              </div>
            </div>
          </div>

          {/* Average Monthly Spending */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Monthly Spending</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${insights.avgMonthlySpending ? insights.avgMonthlySpending.toFixed(0) : '0'}
                </p>
                <p className="text-xs text-gray-500">last 6 months</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <TrendingDown className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          {/* Average Monthly Savings */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Monthly Savings</p>
                <p className={`text-2xl font-bold ${insights.avgMonthlySavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${insights.avgMonthlySavings ? Math.abs(insights.avgMonthlySavings).toFixed(0) : '0'}
                </p>
                <p className="text-xs text-gray-500">
                  {insights.avgMonthlySavings >= 0 ? 'surplus' : 'deficit'}
                </p>
              </div>
              <div className={`p-3 rounded-full ${insights.avgMonthlySavings >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <DollarSign className={insights.avgMonthlySavings >= 0 ? 'text-green-600' : 'text-red-600'} size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Primary Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">
              {chartTypes.find(t => t.id === chartType)?.name || 'Chart'}
            </h3>
            
            <div className="h-80">
              {chartType === 'spending' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.monthlyComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      fillOpacity={0.3}
                      name="Expenses"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {chartType === 'income' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.monthlyComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#22c55e" 
                      fill="#22c55e" 
                      fillOpacity={0.3}
                      name="Income"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {chartType === 'categories' && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ _id, total, avgAmount }) => `${_id}: ${total.toLocaleString()}`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="total"
                    >
                      {analyticsData.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value.toLocaleString()}`, 'Total']}
                      labelFormatter={(label) => `Category: ${label}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {chartType === 'comparison' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.monthlyComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="income" fill="#22c55e" name="Income" />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Secondary Chart - Savings Trend */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Savings Trend</h3>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.monthlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="savings" 
                    stroke="#8884d8" 
                    strokeWidth={3}
                    dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
                    name="Net Savings"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Category Breakdown Table */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Category Breakdown</h3>
            
            {analyticsData.categoryBreakdown.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-700">Category</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700">Total</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700">Transactions</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-700">Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.categoryBreakdown.map((category, index) => (
                      <tr key={category._id} className="border-b border-gray-100">
                        <td className="py-3 px-2 flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: chartColors[index % chartColors.length] }}
                          ></div>
                          {category._id}
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          ${category.total.toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-right text-gray-600">
                          {category.count}
                        </td>
                        <td className="py-3 px-2 text-right text-gray-600">
                          ${Math.round(category.avgAmount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No category data available</p>
                <p className="text-sm">Add some transactions to see category breakdown</p>
              </div>
            )}
          </div>

          {/* Monthly Summary Table */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Monthly Summary</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Month</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Income</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Expenses</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.monthlyComparison.slice().reverse().map((month, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-2 font-medium">{month.month}</td>
                      <td className="py-3 px-2 text-right text-green-600">
                        ${month.income.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right text-red-600">
                        ${month.expenses.toLocaleString()}
                      </td>
                      <td className={`py-3 px-2 text-right font-medium ${
                        month.savings >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {month.savings >= 0 ? '+' : ''}${month.savings.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Financial Health Score */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Financial Health Score</h3>
              <p className="text-sm text-gray-600">Based on your recent financial activity</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">
                {calculateHealthScore(insights)}
              </div>
              <div className="text-sm text-gray-600">out of 100</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-green-600" />
                <span className="text-sm font-medium">Savings Rate</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {insights.avgMonthlySavings && insights.avgMonthlySpending ? 
                  `${((insights.avgMonthlySavings / (insights.avgMonthlySavings + insights.avgMonthlySpending)) * 100).toFixed(1)}%` : 
                  'N/A'
                }
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-blue-600" />
                <span className="text-sm font-medium">Spending Consistency</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {Math.abs(insights.spendingChange || 0) < 10 ? 'Good' : 
                 Math.abs(insights.spendingChange || 0) < 25 ? 'Fair' : 'Variable'}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={16} className="text-orange-600" />
                <span className="text-sm font-medium">Income Stability</span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {Math.abs(insights.incomeChange || 0) < 5 ? 'Excellent' : 
                 Math.abs(insights.incomeChange || 0) < 15 ? 'Good' : 'Variable'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate financial health score
const calculateHealthScore = (insights) => {
  let score = 50; // Base score
  
  // Savings rate bonus/penalty
  if (insights.avgMonthlySavings > 0) {
    score += 25;
  } else if (insights.avgMonthlySavings < 0) {
    score -= 15;
  }
  
  // Spending consistency
  const spendingChange = Math.abs(insights.spendingChange || 0);
  if (spendingChange < 10) score += 15;
  else if (spendingChange > 25) score -= 10;
  
  // Income stability
  const incomeChange = Math.abs(insights.incomeChange || 0);
  if (incomeChange < 5) score += 10;
  else if (incomeChange > 15) score -= 5;
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

export default Analytics;