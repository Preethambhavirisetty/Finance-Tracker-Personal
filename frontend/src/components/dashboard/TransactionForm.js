import React, { useState, useEffect, useCallback } from 'react';
import { api, APIError } from '../../utils/api';
import { validateTransaction } from '../../utils/validation';
import { X } from 'lucide-react';

const TransactionForm = ({ profileId, onTransactionAdded, onCancel }) => {
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    amount: '',
    category: '',
    category_id: null,
    account_id: null,
    tag_ids: [],
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  
  const loadData = useCallback(async () => {
    try {
      const [categoriesData, tagsData, accountsData] = await Promise.all([
        api.getCategories(profileId),
        api.getTags(profileId),
        api.getAccounts(profileId)
      ]);
      setCategories(categoriesData);
      setTags(tagsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error('Failed to load form data:', error);
    }
  }, [profileId]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCategoryChange = (categoryId) => {
    if (categoryId) {
      const category = categories.find(c => c.id === parseInt(categoryId));
      setNewTransaction({
        ...newTransaction,
        category_id: parseInt(categoryId),
        category: category ? category.name : '',
        type: category ? category.type : newTransaction.type
      });
    } else {
      setNewTransaction({
        ...newTransaction,
        category_id: null
      });
    }
  };

  const toggleTag = (tag) => {
    if (selectedTags.find(t => t.id === tag.id)) {
      setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const addTransaction = async () => {
    const transactionData = {
      ...newTransaction,
      tag_ids: selectedTags.map(t => t.id)
    };
    
    const validation = validateTransaction(transactionData);
    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      return;
    }
    
    try {
      const transaction = await api.createTransaction(profileId, transactionData);
      onTransactionAdded(transaction);
      
      setNewTransaction({
        type: 'expense',
        amount: '',
        category: '',
        category_id: null,
        account_id: null,
        tag_ids: [],
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setSelectedTags([]);
    } catch (error) {
      const message = error instanceof APIError ? error.message : 'Failed to add transaction';
      alert(message);
    }
  };
  
  const filteredCategories = categories.filter(c => c.type === newTransaction.type);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border-2 border-gray-200 mb-4 sm:mb-8">
      <h2 className="text-base sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-3 sm:mb-6">New Transaction</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
        <div>
          <label className="block text-gray-700 mb-1.5 sm:mb-2 font-semibold text-xs sm:text-base md:text-lg">Type</label>
          <select
            value={newTransaction.type}
            onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
            className="w-full px-3 sm:px-5 md:px-6 py-2 sm:py-3.5 md:py-4 bg-white rounded-lg sm:rounded-2xl text-gray-900 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm text-xs sm:text-base"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-1.5 sm:mb-2 font-semibold text-xs sm:text-base md:text-lg">Amount</label>
          <input
            type="number"
            value={newTransaction.amount}
            onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
            placeholder="0.00"
            className="w-full px-3 sm:px-5 md:px-6 py-2 sm:py-3.5 md:py-4 bg-white rounded-lg sm:rounded-2xl text-gray-900 placeholder-gray-400 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm text-xs sm:text-base"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1.5 sm:mb-2 font-semibold text-xs sm:text-base md:text-lg">Category</label>
          <select
            value={newTransaction.category_id || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 sm:px-5 md:px-6 py-2 sm:py-3.5 md:py-4 bg-white rounded-lg sm:rounded-2xl text-gray-900 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm text-xs sm:text-base"
          >
            <option value="">Select category (or type below)</option>
            {filteredCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
          {!newTransaction.category_id && (
            <input
              type="text"
              value={newTransaction.category}
              onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
              placeholder="Or type custom category..."
              className="w-full px-3 sm:px-5 md:px-6 py-2 sm:py-3 md:py-3.5 bg-white rounded-lg sm:rounded-2xl text-gray-900 placeholder-gray-400 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm text-xs sm:text-base mt-2"
            />
          )}
        </div>

        <div>
          <label className="block text-gray-700 mb-1.5 sm:mb-2 font-semibold text-xs sm:text-base md:text-lg">Account</label>
          <select
            value={newTransaction.account_id || ''}
            onChange={(e) => setNewTransaction({ ...newTransaction, account_id: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full px-3 sm:px-5 md:px-6 py-2 sm:py-3.5 md:py-4 bg-white rounded-lg sm:rounded-2xl text-gray-900 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm text-xs sm:text-base"
          >
            <option value="">No account (optional)</option>
            {accounts.filter(a => a.is_active).map(acc => (
              <option key={acc.id} value={acc.id}>{acc.icon} {acc.name} (${acc.balance.toFixed(2)})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-1.5 sm:mb-2 font-semibold text-xs sm:text-base md:text-lg">Date</label>
          <input
            type="date"
            value={newTransaction.date}
            onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
            className="w-full px-3 sm:px-5 md:px-6 py-2 sm:py-3.5 md:py-4 bg-white rounded-lg sm:rounded-2xl text-gray-900 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm text-xs sm:text-base"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-1.5 sm:mb-2 font-semibold text-xs sm:text-base md:text-lg">Description</label>
          <input
            type="text"
            value={newTransaction.description}
            onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
            placeholder="Optional..."
            className="w-full px-3 sm:px-5 md:px-6 py-2 sm:py-3.5 md:py-4 bg-white rounded-lg sm:rounded-2xl text-gray-900 placeholder-gray-400 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm text-xs sm:text-base"
          />
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2 font-semibold text-xs sm:text-base md:text-lg">Tags (optional)</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1 ${
                    selectedTags.find(t => t.id === tag.id)
                      ? 'text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={selectedTags.find(t => t.id === tag.id) ? { backgroundColor: tag.color } : {}}
                >
                  {tag.name}
                  {selectedTags.find(t => t.id === tag.id) && <X className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3 sm:mt-6">
        <button
          onClick={addTransaction}
          className="flex-1 px-4 sm:px-6 py-2.5 sm:py-4 bg-green-600 text-white rounded-lg sm:rounded-2xl font-semibold hover:bg-green-700 transition-all duration-300 shadow-lg text-xs sm:text-base md:text-lg"
        >
          Add Transaction
        </button>
        <button
          onClick={onCancel}
          className="px-4 sm:px-6 py-2.5 sm:py-4 bg-white text-gray-900 rounded-lg sm:rounded-2xl font-semibold hover:bg-gray-100 transition-all duration-300 border-2 border-gray-300 text-xs sm:text-base md:text-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TransactionForm;

