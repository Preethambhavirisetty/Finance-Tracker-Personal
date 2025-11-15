import React from 'react';
import { TrendingUp, TrendingDown, Trash2, DollarSign, Calendar } from 'lucide-react';

const TransactionList = ({ transactions, onDelete }) => {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl border-2 border-gray-200">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
        <Calendar className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-700" />
        Recent Transactions
      </h2>
      
      {transactions.length > 0 ? (
        <div className="space-y-2 sm:space-y-3">
          {[...transactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(transaction => (
              <div
                key={transaction.id}
                className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 group"
              >
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-green-700" />
                      ) : (
                        <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-red-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate">{transaction.category}</h3>
                        <span className="text-xs sm:text-sm text-gray-500 font-light italic flex-shrink-0">{new Date(transaction.date).toLocaleDateString()}</span>
                      </div>
                      {transaction.description && (
                        <p className="text-xs sm:text-sm text-gray-600 font-light truncate">{transaction.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <p className={`text-lg sm:text-2xl md:text-3xl font-bold ${transaction.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                      {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                    </p>
                    <button
                      onClick={() => onDelete(transaction.id)}
                      className="p-2 hover:bg-red-50 rounded-xl transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-12 sm:py-16">
          <DollarSign className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <p className="text-xl sm:text-2xl text-gray-600 font-semibold">No transactions yet</p>
          <p className="text-sm sm:text-base text-gray-500 mt-2 font-light italic px-4">Add your first transaction to begin tracking</p>
        </div>
      )}
    </div>
  );
};

export default TransactionList;

