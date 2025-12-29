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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 tablet:p-5 laptop:p-6 desktop:p-8">
        <div className="flex items-center justify-between mb-4 tablet:mb-5 laptop:mb-6 desktop:mb-8">
          <h2 className="text-lg tablet:text-lg laptop:text-xl desktop:text-2xl font-medium text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 tablet:w-4 tablet:h-4 laptop:w-5 laptop:h-5 desktop:w-6 desktop:h-6 text-gray-600" />
            Recent Transactions
          </h2>
          {hasMore && (
            <span className="text-sm text-gray-500">
              Showing {displayedTransactions.length} of {sortedTransactions.length}
            </span>
          )}
        </div>
        
        {transactions.length > 0 ? (
          <>
            <div className="space-y-2">
              {displayedTransactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  className={`rounded-lg rounded-tl-none rounded-bl-none p-3 tablet:p-4 border-l-4 transition-all cursor-pointer group ${
                    transaction.type === 'income' 
                      ? 'bg-green-50/30 border-l-green-500 hover:bg-green-50/50 hover:shadow-md' 
                      : 'bg-red-50/30 border-l-red-500 hover:bg-red-50/50 hover:shadow-md'
                  }`}
                  onClick={() => handleTransactionClick(transaction)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2.5 rounded-xl flex-shrink-0 shadow-sm ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 border border-green-200' 
                          : 'bg-red-100 border border-red-200'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="w-5 h-5 tablet:w-6 tablet:h-6 text-green-700" />
                        ) : (
                          <TrendingDown className="w-5 h-5 tablet:w-6 tablet:h-6 text-red-700" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col tablet:flex-row tablet:items-center gap-1.5 tablet:gap-3 mb-1.5">
                          <h3 className="text-base tablet:text-base laptop:text-lg font-semibold text-gray-900 truncate capitalize">
                            {transaction.category}
                          </h3>
                          <span className="text-xs tablet:text-sm text-gray-500 flex-shrink-0 font-medium">
                            {new Date(transaction.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        {transaction.description && (
                          <p className="text-sm text-gray-600 truncate mb-2 font-light">
                            {transaction.description}
                          </p>
                        )}
                        {transaction.tags && transaction.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {transaction.tags.slice(0, 2).map(tag => (
                              <span
                                key={tag.id}
                                className="px-2.5 py-1 rounded-full text-xs text-white font-medium shadow-sm"
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                            {transaction.tags.length > 2 && (
                              <span className="px-2.5 py-1 text-xs text-gray-500 bg-gray-100 rounded-full font-medium">
                                +{transaction.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className={`text-lg tablet:text-xl laptop:text-2xl font-bold ${transaction.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                          {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(transaction.id);
                        }}
                        className="p-2 hover:bg-red-100 rounded-lg transition-all opacity-0 group-hover:opacity-100 transform hover:scale-110"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-4 h-4 tablet:w-5 tablet:h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <button
                onClick={() => navigate(`/transactions/${profileId}`)}
                className="mt-6 w-full px-4 py-3 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors border border-gray-300 flex items-center justify-center gap-2 text-sm tablet:text-base"
              >
                <Eye className="w-4 h-4 tablet:w-5 tablet:h-5" />
                View All Transactions ({sortedTransactions.length})
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-12 tablet:py-16">
            <DollarSign className="w-16 h-16 tablet:w-20 tablet:h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-lg tablet:text-xl font-semibold text-gray-600 mb-2">No transactions yet</p>
            <p className="text-sm tablet:text-base text-gray-500">Add your first transaction to begin tracking</p>
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
