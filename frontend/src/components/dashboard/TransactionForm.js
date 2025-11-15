import React, { useState } from 'react';
import { api, APIError } from '../../utils/api';
import { validateTransaction } from '../../utils/validation';

const TransactionForm = ({ profileId, onTransactionAdded, onCancel }) => {
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const addTransaction = async () => {
    const validation = validateTransaction(newTransaction);
    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      return;
    }
    
    try {
      const transaction = await api.createTransaction(profileId, newTransaction);
      onTransactionAdded(transaction);
      
      setNewTransaction({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      const message = error instanceof APIError ? error.message : 'Failed to add transaction';
      alert(message);
    }
  };

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
          <input
            type="text"
            value={newTransaction.category}
            onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
            placeholder="e.g., Dining, Salary"
            className="w-full px-3 sm:px-5 md:px-6 py-2 sm:py-3.5 md:py-4 bg-white rounded-lg sm:rounded-2xl text-gray-900 placeholder-gray-400 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm text-xs sm:text-base"
          />
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

