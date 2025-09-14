import React, { useState, useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Calendar } from 'lucide-react';

const Charts = ({ transactions, analyticsData, currentMonth, selectedYear }) => {
  const [activeChart, setActiveChart] = useState('pie');

  // Colors for different categories
  const categoryColors = {
    'Basic Needs': '#8884d8',
    'Clothes': '#82ca9d', 
    'Entertainment': '#ffc658',
    'Other': '#ff7c7c',
    'Salary': '#0088fe',
    'Freelance': '#00c49f',
    'Investment': '#ffbb28',
    'Gift': '#ff8042'
  };

  // Prepare pie chart data (expense categories)
  const pieChartData = useMemo(() => {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const categoryTotals = {};
    
    expenseTransactions.forEach(transaction => {
      categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
    });
    
    return Object.entries(categoryTotals).map(([category, amount]) => ({
      name: category,
      value: amount,
      percentage: expenseTransactions.length > 0 ? (amount / expenseTransactions.reduce((sum, t) => sum + t.amount, 0) * 100).toFixed(1) : 0
    })).filter(item => item.value > 0);
  }, [transactions]);

  // Prepare monthly comparison data
  const monthlyComparisonData = useMemo(() => {
    if (!analyticsData.monthlyComparison) return [];
    
    const { currentMonth: current, previousMonth: previous } = analyticsData.monthlyComparison;
    
    const prevMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? selectedYear - 1 : selectedYear;
    
    return [
      {
        month: `${new Date(0, prevMonthIndex).toLocaleString('default', { month: 'short' })} ${prevYear}`,
        expenses: previous,
        income: 0 // You might want to add income comparison
      },
      {
        month: `${new Date(0, currentMonth).toLocaleString('default', { month: 'short' })} ${selectedYear}`,
        expenses: current,
        income: 0
      }
    ];
  }, [analyticsData.monthlyComparison, currentMonth, selectedYear]);

  // Prepare weekly spending trend
  const weeklyTrendData = useMemo(() => {
    const weeklyData = {};
    
    transactions.filter(t => t.type === 'expense').forEach(transaction => {
      const date = new Date(transaction.date);
      const weekKey = `Week ${Math.ceil(date.getDate() / 7)}`;
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + transaction.amount;
    });
    
    return Object.entries(weeklyData).map(([week, amount]) => ({
      week,
      amount
    }));
  }, [transactions]);

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            Amount: <span className="font-semibold">${data.value.toLocaleString()}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage: <span className="font-semibold">{data.payload.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for bar chart
  const BarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">${entry.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Chart selection tabs
  const chartTabs = [
    { id: 'pie', name: 'Expense Breakdown', icon: PieChartIcon },
    { id: 'bar', name: 'Monthly Comparison', icon: BarChart3 },
    { id: 'trend', name: 'Weekly Trend', icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
      {/* Main Chart Area */}
      <div className="xl:col-span-2 bg-white p-6 rounded-xl shadow-sm border">
        {/* Chart Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {chartTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveChart(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeChart === tab.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Chart Content */}
        <div className="h-80">
          {activeChart === 'pie' && (
            <>
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={categoryColors[entry.name] || '#8884d8'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <PieChartIcon size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No expense data available</p>
                    <p className="text-sm">Add some transactions to see the breakdown</p>
                  </div>
                </div>
              )}
            </>
          )}

          {activeChart === 'bar' && (
            <>
              {monthlyComparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<BarTooltip />} />
                    <Legend />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No comparison data available</p>
                    <p className="text-sm">Need data from previous month for comparison</p>
                  </div>
                </div>
              )}
            </>
          )}

          {activeChart === 'trend' && (
            <>
              {weeklyTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']}
                      labelFormatter={(label) => `Week: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No trend data available</p>
                    <p className="text-sm">Add more transactions to see spending trends</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Summary Panel */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Insights</h3>
        
        {/* Top Categories */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Top Spending Categories</h4>
            {pieChartData.slice(0, 3).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoryColors[item.name] || '#8884d8' }}
                  ></div>
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    ${item.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Monthly Summary */}
          {analyticsData.monthlySummary && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">This Month</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Transactions</span>
                  <span className="font-medium">
                    {analyticsData.monthlySummary.totalTransactions || transactions.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Average per transaction</span>
                  <span className="font-medium">
                    ${transactions.length > 0 ? 
                      Math.round(transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) / transactions.filter(t => t.type === 'expense').length || 0) : 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Largest expense</span>
                  <span className="font-medium text-red-600">
                    ${Math.max(...transactions.filter(t => t.type === 'expense').map(t => t.amount), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                Export Data
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                Set Budget Goals
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                View Detailed Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;