import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon, iconBgColor, iconColor, valueColor = 'text-gray-900', colSpan = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-3 tablet:p-4 laptop:p-4 desktop:p-5 transition-shadow ${colSpan}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm tablet:text-base laptop:text-lg desktop:text-xl font-medium text-gray-700">{title}</h3>
        <div className={`p-1.5 tablet:p-2 laptop:p-2 desktop:p-3 ${iconBgColor} rounded-lg`}>
          <Icon className={`w-4 h-4 tablet:w-5 tablet:h-5 laptop:w-5 laptop:h-5 desktop:w-6 desktop:h-6 ${iconColor}`} />
        </div>
      </div>
      <p className={`text-xl tablet:text-2xl laptop:text-3xl desktop:text-5xl font-light mb-1 ${valueColor}`}>
        ${value.toFixed(2)}
      </p>
      <p className="text-xs tablet:text-sm laptop:text-base desktop:text-lg text-gray-500 font-light">{subtitle}</p>
    </div>
  );
};

const StatsCards = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-3 desktop:grid-cols-3 gap-4 tablet:gap-5 laptop:gap-6 desktop:gap-8">
      <StatCard
        title="Income"
        value={stats.income}
        subtitle="Total earnings"
        icon={TrendingUp}
        iconBgColor="bg-green-100"
        iconColor="text-green-600"
      />
      
      <StatCard
        title="Expenses"
        value={stats.expenses}
        subtitle="Total spending"
        icon={TrendingDown}
        iconBgColor="bg-red-100"
        iconColor="text-red-600"
      />
      
      <StatCard
        title="Balance"
        value={stats.balance}
        subtitle="Net balance"
        icon={Wallet}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
        valueColor={stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}
        colSpan="tablet:col-span-2 laptop:col-span-1 desktop:col-span-1"
      />
    </div>
  );
};

export default StatsCards;
