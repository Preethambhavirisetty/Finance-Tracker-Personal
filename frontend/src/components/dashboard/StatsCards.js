import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

const StatsCards = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 md:gap-6 mb-4 sm:mb-8">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 shadow-xl border-2 border-green-200 hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h3 className="text-xs sm:text-lg md:text-xl font-semibold text-gray-900">Income</h3>
          <TrendingUp className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-green-600" />
        </div>
        <p className="text-2xl sm:text-4xl md:text-5xl font-bold text-green-700">${stats.income.toFixed(2)}</p>
        <p className="text-[10px] sm:text-sm text-gray-600 mt-0.5 sm:mt-2 font-light italic">Earnings</p>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 shadow-xl border-2 border-red-200 hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h3 className="text-xs sm:text-lg md:text-xl font-semibold text-gray-900">Expenses</h3>
          <TrendingDown className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-red-600" />
        </div>
        <p className="text-2xl sm:text-4xl md:text-5xl font-bold text-red-700">${stats.expenses.toFixed(2)}</p>
        <p className="text-[10px] sm:text-sm text-gray-600 mt-0.5 sm:mt-2 font-light italic">Spending</p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 shadow-xl border-2 border-blue-200 hover:shadow-2xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h3 className="text-xs sm:text-lg md:text-xl font-semibold text-gray-900">Balance</h3>
          <Wallet className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-600" />
        </div>
        <p className={`text-2xl sm:text-4xl md:text-5xl font-bold ${stats.balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
          ${stats.balance.toFixed(2)}
        </p>
        <p className="text-[10px] sm:text-sm text-gray-600 mt-0.5 sm:mt-2 font-light italic">Net</p>
      </div>
    </div>
  );
};

export default StatsCards;

