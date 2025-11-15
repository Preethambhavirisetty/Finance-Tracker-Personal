import React from 'react';
import { PieChart, TrendingUp, TrendingDown } from 'lucide-react';

const CategoryBreakdown = ({ categoryBreakdown }) => {
  if (Object.keys(categoryBreakdown).length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl border-2 border-gray-200 mb-6 sm:mb-8">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
        <PieChart className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-700" />
        Category Breakdown
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {Object.entries(categoryBreakdown).map(([category, amounts]) => (
          <div
            key={category}
            className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300"
          >
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">{category}</h3>
            {amounts.income > 0 && (
              <p className="text-green-700 flex items-center gap-2 mb-1 font-semibold text-sm sm:text-base">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                ${amounts.income.toFixed(2)}
              </p>
            )}
            {amounts.expense > 0 && (
              <p className="text-red-700 flex items-center gap-2 font-semibold text-sm sm:text-base">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                ${amounts.expense.toFixed(2)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryBreakdown;

