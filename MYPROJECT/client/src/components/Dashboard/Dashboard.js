import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { transactionAPI, analyticsAPI } from '../../services/api';
import StatsCards from './StatsCards';
import Charts from './Charts';
import TransactionForm from './TransactionForm';
import LoadingSpinner from '../common/LoadingSpinner';

const Dashboard = ({ showNotification, onError }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [analyticsData, setAnalyticsData] = useState({
    monthlySummary: null,
    categoryBreakdown: [],
    monthlyComparison: null
  });
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();

  // Fetch dashboard data
  const fetchDashboardData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setRefreshing(!showLoader);
    
    try {
      // Fetch transactions for current month
      const transactionsResponse = await transactionAPI.getTransactions({
        month: currentMonth,
        year: selectedYear,
        limit: 50,
        sortBy: 'date',
        sortOrder: 'desc'
      });

      setTransactions(transactionsResponse.data.transactions);

      // Fetch analytics data
      const [summaryResponse, categoryResponse] = await Promise.all([
        analyticsAPI.getMonthlySummary(currentMonth, selectedYear),
        analyticsAPI.getCategoryBreakdown(currentMonth, selectedYear, 'expense')
      ]);

      // Fetch previous month for comparison
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? selectedYear - 1 : selectedYear;
      
      const comparisonResponse = await analyticsAPI.getMonthlyComparison(
        currentMonth, selectedYear, prevMonth, prevYear
      );

      setAnalyticsData({
        monthlySummary: summaryResponse.data,
        categoryBreakdown: categoryResponse.data,
        monthlyComparison: comparisonResponse.data
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [currentMonth, selectedYear]);

  // Handle month/year change
  const handlePeriodChange = (month, year) => {
    setCurrentMonth(month);
    setSelectedYear(year);
  };

  // Handle transaction added
  const handleTransactionAdded = (newTransaction) => {
    setTransactions(prev => [newTransaction, ...prev]);
    setShowTransactionForm(false);
    showNotification('Transaction added successfully!', 'success');
    
    // Refresh analytics data
    fetchDashboardData(false);
  };

  // Handle transaction deleted
  const handleTransactionDeleted = async (transactionId) => {
    try {
      await transactionAPI.deleteTransaction(transactionId);
      setTransactions(prev => prev.filter(t => t._id !== transactionId));
      showNotification('Transaction deleted successfully!', 'success');
      
      // Refresh analytics data
      fetchDashboardData(false);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showNotification('Failed to delete transaction', 'error');
    }
  };

  // Calculate quick stats from transactions
  const calculateQuickStats = () => {
    const currentMonthTransactions = transactions.filter(t => 
      new Date(t.date).getMonth() === currentMonth &&
      new Date(t.date).getFullYear() === selectedYear
    );

    const income = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const savings = income - expenses;

    return { income, expenses, savings, totalTransactions: currentMonthTransactions.length };
  };

  const quickStats = calculateQuickStats();

  // Get month name
  const getMonthName = (monthIndex) => {
    return new Date(0, monthIndex).toLocaleString('default', { month: 'long' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading your financial data..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Here's your financial overview for {getMonthName(currentMonth)} {selectedYear}
          </p>
        </div>

        {/* Period Selector & Actions */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Month/Year Selector */}
          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={currentMonth}
                onChange={(e) => handlePeriodChange(parseInt(e.target.value), selectedYear)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={refreshing}
              >
                {Array.from({length: 12}, (_, i) => (
                  <option key={i} value={i}>
                    {getMonthName(i)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => handlePeriodChange(currentMonth, parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={refreshing}
              >
                {Array.from({length: 5}, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>{year}</option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => fetchDashboardData(false)}
              disabled={refreshing}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {refreshing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Refresh
            </button>
            
            <button
              onClick={() => setShowTransactionForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Transaction
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards 
          stats={quickStats}
          analyticsData={analyticsData}
          loading={refreshing}
        />

        {/* Charts Section */}
        <Charts 
          transactions={transactions}
          analyticsData={analyticsData}
          currentMonth={currentMonth}
          selectedYear={selectedYear}
        />

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
            <span className="text-sm text-gray-500">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} this month
            </span>
          </div>
          
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h4>
              <p className="text-gray-600 mb-4">Start tracking your finances by adding your first transaction.</p>
              <button
                onClick={() => setShowTransactionForm(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Transaction
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Amount</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 10).map(transaction => (
                    <tr key={transaction._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{transaction.category}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{transaction.description}</td>
                      <td className={`py-3 px-4 text-sm text-right font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleTransactionDeleted(transaction._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transaction Form Modal */}
        {showTransactionForm && (
          <TransactionForm
            onClose={() => setShowTransactionForm(false)}
            onTransactionAdded={handleTransactionAdded}
            showNotification={showNotification}
            currentMonth={currentMonth}
            selectedYear={selectedYear}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;