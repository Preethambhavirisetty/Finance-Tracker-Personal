import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, X, Calendar, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { api, APIError } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import TransactionDetailModal from '../dashboard/TransactionDetailModal';

const AllTransactions = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { setAuthError } = useAuth();
  
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [transactionsData, categoriesData] = await Promise.all([
        api.getTransactions(profileId),
        api.getCategories(profileId)
      ]);
      setTransactions(transactionsData);
      setFilteredTransactions(transactionsData);
      setCategories(categoriesData);
      setLoading(false);
    } catch (error) {
      if (!(error instanceof APIError && error.status === 401)) {
        console.error('Failed to load data:', error);
        setAuthError('Failed to load transactions');
      }
      setLoading(false);
    }
  }, [profileId, setAuthError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let filtered = [...transactions];

    // Search filter (searches in description, category)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.category.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.type === selectedType);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(endDate));
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, selectedType, selectedCategory, startDate, endDate]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCategory('all');
    setStartDate('');
    setEndDate('');
  };

  const handleDelete = async (transactionId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      await api.deleteTransaction(transactionId);
      setTransactions(transactions.filter(t => t.id !== transactionId));
    } catch (error) {
      alert(error instanceof APIError ? error.message : 'Failed to delete transaction');
    }
  };

  const uniqueCategories = [...new Set(transactions.map(t => t.category))];
  const stats = {
    total: filteredTransactions.length,
    income: filteredTransactions.filter(t => t.type === 'income').length,
    expense: filteredTransactions.filter(t => t.type === 'expense').length,
    totalIncome: filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0),
    totalExpense: filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-base sm:text-lg text-gray-600">Loading transactions...</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white p-3 sm:p-4 md:p-6" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6 pb-2 sm:pb-4 border-b-2 border-gray-200">
            <button
              onClick={() => navigate(`/dashboard/${profileId}`)}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">All Transactions</h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">{stats.total} transactions found</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-xl border-2 border-gray-200 mb-3 sm:mb-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by category or description..."
                  className="w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 md:py-3 bg-white rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 text-xs sm:text-sm md:text-base"
                />
              </div>
              
              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base ${
                  showFilters ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 border-2 border-gray-300'
                }`}
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 pt-3 border-t-2 border-gray-200">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 md:py-2.5 bg-white rounded-lg border-2 border-gray-300 text-xs sm:text-sm md:text-base"
                >
                  <option value="all">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 md:py-2.5 bg-white rounded-lg border-2 border-gray-300 text-xs sm:text-sm md:text-base"
                >
                  <option value="all">All Categories</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start Date"
                  className="px-2 sm:px-3 py-1.5 sm:py-2 md:py-2.5 bg-white rounded-lg border-2 border-gray-300 text-xs sm:text-sm md:text-base"
                />

                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End Date"
                  className="px-2 sm:px-3 py-1.5 sm:py-2 md:py-2.5 bg-white rounded-lg border-2 border-gray-300 text-xs sm:text-sm md:text-base"
                />
              </div>
            )}

            {/* Active Filters Display */}
            {(searchQuery || selectedType !== 'all' || selectedCategory !== 'all' || startDate || endDate) && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t-2 border-gray-200">
                <span className="text-xs sm:text-sm text-gray-600">Active filters:</span>
                <button
                  onClick={clearFilters}
                  className="px-2 sm:px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs sm:text-sm flex items-center gap-1"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-6">
            <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border-2 border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600 mb-0.5">Total</p>
              <p className="text-base sm:text-lg md:text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border-2 border-green-200">
              <p className="text-xs sm:text-sm text-gray-600 mb-0.5">Income</p>
              <p className="text-base sm:text-lg md:text-2xl font-bold text-green-700">${stats.totalIncome.toFixed(2)}</p>
            </div>
            <div className="bg-red-50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border-2 border-red-200">
              <p className="text-xs sm:text-sm text-gray-600 mb-0.5">Expenses</p>
              <p className="text-base sm:text-lg md:text-2xl font-bold text-red-700">${stats.totalExpense.toFixed(2)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border-2 border-blue-200">
              <p className="text-xs sm:text-sm text-gray-600 mb-0.5">Net</p>
              <p className={`text-base sm:text-lg md:text-2xl font-bold ${stats.totalIncome - stats.totalExpense >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                ${(stats.totalIncome - stats.totalExpense).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Transactions List */}
          <div className="space-y-2">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map(transaction => (
                <div
                  key={transaction.id}
                  className="bg-white rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border-2 border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all group cursor-pointer"
                >
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <div
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setIsModalOpen(true);
                      }}
                      className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0"
                    >
                      <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-700" />
                        ) : (
                          <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-700" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">{transaction.category}</h3>
                          <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">{new Date(transaction.date).toLocaleDateString()}</span>
                        </div>
                        {transaction.description && (
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{transaction.description}</p>
                        )}
                        {transaction.tags && transaction.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {transaction.tags.map(tag => (
                              <span
                                key={tag.id}
                                className="px-1.5 py-0.5 rounded-full text-xs text-white"
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <p className={`text-sm sm:text-base md:text-lg font-bold ${transaction.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                        {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(transaction.id);
                        }}
                        className="p-1.5 sm:p-2 hover:bg-red-50 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 sm:py-12 bg-white rounded-xl sm:rounded-2xl border-2 border-gray-200">
                <Search className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-2 sm:mb-3" />
                <p className="text-base sm:text-lg text-gray-600 font-semibold">No transactions found</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default AllTransactions;

