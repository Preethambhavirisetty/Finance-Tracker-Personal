import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TrendingUp, TrendingDown, Trash2, DollarSign, Calendar, Eye } from 'lucide-react';
import TransactionDetailModal from './TransactionDetailModal';

const TransactionList = ({ transactions, onDelete, limit = 10 }) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { profileId } = useParams();
  
  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const displayedTransactions = limit ? sortedTransactions.slice(0, limit) : sortedTransactions;
  const hasMore = limit && sortedTransactions.length > limit;

  return (
    <>
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 shadow-2xl border-2 border-gray-200">
        <div className="flex items-center justify-between mb-3 sm:mb-5">
          <h2 className="text-base sm:text-xl md:text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-gray-700" />
            Recent Transactions
          </h2>
          {hasMore && (
            <span className="text-xs sm:text-sm text-gray-500">
              Showing {displayedTransactions.length} of {sortedTransactions.length}
            </span>
          )}
        </div>
        
        {transactions.length > 0 ? (
          <>
            <div className="space-y-2">
              {displayedTransactions.map(transaction => (
                <div
                  key={transaction.id}
                  className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3">
                    <div 
                      onClick={() => handleTransactionClick(transaction)}
                      className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0"
                    >
                      <div className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg flex-shrink-0 ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-700" />
                        ) : (
                          <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-700" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 mb-0.5 sm:mb-1">
                          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{transaction.category}</h3>
                          <span className="text-xs sm:text-sm text-gray-500 font-light italic flex-shrink-0">{new Date(transaction.date).toLocaleDateString()}</span>
                        </div>
                        {transaction.description && (
                          <p className="text-xs sm:text-sm text-gray-600 font-light truncate">{transaction.description}</p>
                        )}
                        {transaction.tags && transaction.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {transaction.tags.slice(0, 2).map(tag => (
                              <span
                                key={tag.id}
                                className="px-1.5 py-0.5 rounded-full text-xs text-white"
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                            {transaction.tags.length > 2 && (
                              <span className="px-1.5 py-0.5 text-xs text-gray-500">
                                +{transaction.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <p className={`text-base sm:text-lg md:text-xl font-bold ${transaction.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                        {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(transaction.id);
                        }}
                        className="p-1.5 sm:p-2 hover:bg-red-50 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <button
                onClick={() => navigate(`/transactions/${profileId}`)}
                className="mt-4 w-full px-4 py-2.5 sm:py-3 bg-white text-gray-900 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 border-2 border-gray-300 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                View All Transactions ({sortedTransactions.length})
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <DollarSign className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-2 sm:mb-3" />
            <p className="text-base sm:text-xl text-gray-600 font-semibold">No transactions yet</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2 font-light italic px-4">Add your first transaction to begin tracking</p>
          </div>
        )}
      </div>
      
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default TransactionList;

