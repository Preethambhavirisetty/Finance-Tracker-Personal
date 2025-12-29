import React from 'react';
import { PieChart, TrendingUp, TrendingDown } from 'lucide-react';

const CategoryBreakdown = ({ categoryBreakdown }) => {
  if (Object.keys(categoryBreakdown).length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 tablet:p-5 laptop:p-6 desktop:p-8">
      <h2 className="text-lg tablet:text-lg laptop:text-xl desktop:text-2xl font-medium text-gray-900 mb-4 tablet:mb-5 laptop:mb-6 desktop:mb-8 flex items-center gap-2">
        <PieChart className="w-4 h-4 tablet:w-4 tablet:h-4 laptop:w-5 laptop:h-5 desktop:w-6 desktop:h-6 text-gray-600" />
        Category Breakdown
      </h2>
      <div className="grid grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-4 desktop:grid-cols-5 gap-4 tablet:gap-5 laptop:gap-6 desktop:gap-8">
        {Object.entries(categoryBreakdown).map(([category, amounts]) => (
          <div
            key={category}
            className="bg-[#F3F4F4] rounded-lg p-2 laptop:p-3 desktop:p-3 border border-gray-200 hover:shadow-sm transition-shadow"
          >
            <h3 className="text-base tablet:text-lg laptop:text-xl desktop:text-2xl font-semibold capitalize text-gray-900 mb-3 laptop:mb-4">{category}</h3>
            <div className="space-y-2">
              {amounts.income > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">Income</span>
                  </div>
                  <span className="text-base font-semibold text-green-600">${amounts.income.toFixed(2)}</span>
                </div>
              )}
              {amounts.expense > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-gray-600">Expense</span>
                  </div>
                  <span className="text-base font-semibold text-red-600">${amounts.expense.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryBreakdown;
