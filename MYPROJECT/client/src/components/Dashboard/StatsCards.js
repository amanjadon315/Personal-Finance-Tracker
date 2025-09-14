import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatsCards = ({ stats, analyticsData, loading }) => {
  const { income, expenses, savings, totalTransactions } = stats;

  // Calculate percentage change from previous month
  const getPreviousMonthChange = () => {
    if (!analyticsData.monthlyComparison) {
      return { percentage: 0, isIncrease: false };
    }

    const { currentMonth, previousMonth } = analyticsData.monthlyComparison;
    if (previousMonth === 0) {
      return { percentage: 0, isIncrease: false };
    }

    const change = ((currentMonth - previousMonth) / previousMonth) * 100;
    return {
      percentage: Math.abs(change),
      isIncrease: change > 0
    };
  };

  const monthlyChange = getPreviousMonthChange();

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Cards configuration
  const cards = [
    {
      title: 'Total Income',
      value: formatCurrency(income),
      icon: TrendingUp,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      valueColor: 'text-green-600',
      description: 'This month',
      trend: income > 0 ? { value: `+${formatCurrency(income)}`, isPositive: true } : null
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(expenses),
      icon: TrendingDown,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      valueColor: 'text-red-600',
      description: 'This month',
      trend: monthlyChange.percentage > 0 ? {
        value: `${monthlyChange.isIncrease ? '+' : '-'}${monthlyChange.percentage.toFixed(1)}%`,
        isPositive: !monthlyChange.isIncrease
      } : null
    },
    {
      title: 'Net Savings',
      value: formatCurrency(savings),
      icon: DollarSign,
      iconBg: savings >= 0 ? 'bg-blue-100' : 'bg-orange-100',
      iconColor: savings >= 0 ? 'text-blue-600' : 'text-orange-600',
      valueColor: savings >= 0 ? 'text-blue-600' : 'text-orange-600',
      description: 'Income - Expenses',
      trend: savings !== 0 ? {
        value: savings >= 0 ? 'Surplus' : 'Deficit',
        isPositive: savings >= 0
      } : null
    },
    {
      title: 'Transactions',
      value: totalTransactions.toString(),
      icon: BarChart3,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      valueColor: 'text-purple-600',
      description: 'This month',
      trend: totalTransactions > 0 ? {
        value: `${totalTransactions} total`,
        isPositive: true
      } : null
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <div
            key={index}
            className={`bg-white p-6 rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md ${
              loading ? 'animate-pulse' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                <p className={`text-2xl font-bold ${card.valueColor} mb-2`}>
                  {loading ? (
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                  ) : (
                    card.value
                  )}
                </p>
                
                {/* Trend indicator */}
                {!loading && card.trend && (
                  <div className="flex items-center gap-1">
                    {card.trend.isPositive ? (
                      <ArrowUpRight size={16} className="text-green-500" />
                    ) : (
                      <ArrowDownRight size={16} className="text-red-500" />
                    )}
                    <span className={`text-sm ${
                      card.trend.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.trend.value}
                    </span>
                  </div>
                )}
                
                {!card.trend && !loading && (
                  <p className="text-sm text-gray-500">{card.description}</p>
                )}
              </div>
              
              <div className={`${card.iconBg} p-3 rounded-full`}>
                {loading ? (
                  <div className="h-6 w-6 bg-gray-200 rounded"></div>
                ) : (
                  <Icon className={card.iconColor} size={24} />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Individual stat card component for reusability
export const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  iconBg = 'bg-gray-100',
  iconColor = 'text-gray-600',
  valueColor = 'text-gray-900',
  description,
  trend,
  loading = false,
  onClick
}) => {
  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      } ${loading ? 'animate-pulse' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${valueColor} mb-2`}>
            {loading ? (
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            ) : (
              value
            )}
          </p>
          
          {/* Trend indicator */}
          {!loading && trend && (
            <div className="flex items-center gap-1">
              {trend.isPositive ? (
                <ArrowUpRight size={16} className="text-green-500" />
              ) : (
                <ArrowDownRight size={16} className="text-red-500" />
              )}
              <span className={`text-sm ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.value}
              </span>
            </div>
          )}
          
          {!trend && !loading && description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
        
        <div className={`${iconBg} p-3 rounded-full`}>
          {loading ? (
            <div className="h-6 w-6 bg-gray-200 rounded"></div>
          ) : (
            <Icon className={iconColor} size={24} />
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCards;