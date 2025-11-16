import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { api, APIError } from '../../utils/api';

const BudgetsManager = ({ profileId }) => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newBudget, setNewBudget] = useState({ 
    category_id: null, 
    amount: 0, 
    alert_threshold: 80,
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear()
  });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);

  const loadBudgets = useCallback(async () => {
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const data = await api.getBudgets(profileId, month, year);
      setBudgets(data);
      setLoading(false);
    } catch (error) {
      if (!(error instanceof APIError && error.status === 401)) {
        console.error('Failed to load budgets:', error);
      }
      setLoading(false);
    }
  }, [profileId, currentDate]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await api.getCategories(profileId);
      setCategories(data.filter(c => c.type === 'expense'));
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, [profileId]);

  useEffect(() => {
    loadBudgets();
    loadCategories();
  }, [loadBudgets, loadCategories]);

  const handleCreate = async () => {
    if (newBudget.amount <= 0) {
      alert('Budget amount must be greater than 0');
      return;
    }

    try {
      const created = await api.createBudget(profileId, newBudget);
      setBudgets([...budgets, created]);
      setNewBudget({ 
        category_id: null, 
        amount: 0, 
        alert_threshold: 80,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
      });
    } catch (error) {
      alert(error instanceof APIError ? error.message : 'Failed to create budget');
    }
  };

  const handleUpdate = async (budgetId) => {
    try {
      const updated = await api.updateBudget(budgetId, editData);
      setBudgets(budgets.map(b => b.id === budgetId ? updated : b));
      setEditingId(null);
      setEditData({});
    } catch (error) {
      alert(error instanceof APIError ? error.message : 'Failed to update budget');
    }
  };

  const handleDelete = async (budgetId) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    try {
      await api.deleteBudget(budgetId);
      setBudgets(budgets.filter(b => b.id !== budgetId));
    } catch (error) {
      alert(error instanceof APIError ? error.message : 'Failed to delete budget');
    }
  };

  const startEdit = (budget) => {
    setEditingId(budget.id);
    setEditData({ 
      amount: budget.amount, 
      alert_threshold: budget.alert_threshold 
    });
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading budgets...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <h2 className="text-lg sm:text-2xl md:text-3xl font-semibold text-gray-900">Monthly Budgets</h2>
        <div className="flex items-center gap-2 sm:gap-3 bg-white rounded-lg px-3 sm:px-4 py-2 border-2 border-gray-200">
          <button
            onClick={() => changeMonth(-1)}
            className="text-gray-600 hover:text-gray-900 font-bold text-base sm:text-lg"
          >
            ←
          </button>
          <span className="font-semibold text-gray-900 min-w-[120px] sm:min-w-[150px] text-center text-sm sm:text-base">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="text-gray-600 hover:text-gray-900 font-bold text-base sm:text-lg"
          >
            →
          </button>
        </div>
      </div>
      
      {/* Create New */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 border-2 border-gray-200">
        <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Set New Budget</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <select
            value={newBudget.category_id || ''}
            onChange={(e) => setNewBudget({ ...newBudget, category_id: e.target.value ? parseInt(e.target.value) : null })}
            className="px-3 sm:px-4 py-2 sm:py-3 bg-white rounded-lg text-gray-900 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 text-xs sm:text-base"
          >
            <option value="">Overall Budget (All Categories)</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            value={newBudget.amount}
            onChange={(e) => setNewBudget({ ...newBudget, amount: parseFloat(e.target.value) || 0 })}
            placeholder="Budget amount..."
            className="px-3 sm:px-4 py-2 sm:py-3 bg-white rounded-lg text-gray-900 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 text-xs sm:text-base"
          />
          <div className="md:col-span-2">
            <label className="block text-xs sm:text-sm text-gray-600 mb-2">
              Alert Threshold: {newBudget.alert_threshold}% of budget
            </label>
            <input
              type="range"
              min="50"
              max="100"
              value={newBudget.alert_threshold}
              onChange={(e) => setNewBudget({ ...newBudget, alert_threshold: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          className="mt-3 sm:mt-4 w-full px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-base"
        >
          <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          Create Budget
        </button>
      </div>

      {/* Budgets List */}
      <div className="space-y-2 sm:space-y-3">
        {budgets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm sm:text-base">No budgets set for this month. Create your first one above!</p>
          </div>
        ) : (
          budgets.map(budget => {
            const category = categories.find(c => c.id === budget.category_id);
            const percentage = budget.percentage || 0;
            const isWarning = budget.is_warning;
            const isExceeded = budget.is_exceeded;
            
            return (
              <div
                key={budget.id}
                className={`bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 transition-all ${
                  isExceeded ? 'border-red-300 bg-red-50' : isWarning ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                }`}
              >
                {editingId === budget.id ? (
                  <div className="space-y-2">
                    <input
                      type="number"
                      step="0.01"
                      value={editData.amount}
                      onChange={(e) => setEditData({ ...editData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-base"
                    />
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Alert Threshold: {editData.alert_threshold}%
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={editData.alert_threshold}
                        onChange={(e) => setEditData({ ...editData, alert_threshold: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleUpdate(budget.id)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg flex items-center justify-center gap-1 text-xs sm:text-sm"
                      >
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg flex items-center justify-center gap-1 text-xs sm:text-sm"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {category ? (
                          <span className="text-base sm:text-xl">{category.icon}</span>
                        ) : (
                          <span className="text-base sm:text-xl">💰</span>
                        )}
                        <div>
                          <h3 className="text-sm sm:text-lg font-semibold text-gray-900">
                            {category ? category.name : 'Overall Budget'}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Alert at {budget.alert_threshold}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(isWarning || isExceeded) && (
                          <AlertCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${isExceeded ? 'text-red-600' : 'text-yellow-600'}`} />
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(budget)}
                            className="p-1.5 sm:p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(budget.id)}
                            className="p-1.5 sm:p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs sm:text-sm mb-1">
                        <span className="text-gray-600">Spent: ${budget.spent?.toFixed(2)}</span>
                        <span className="text-gray-600">Budget: ${budget.amount.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                        <div
                          className={`h-2 sm:h-3 rounded-full transition-all ${
                            isExceeded ? 'bg-red-600' : isWarning ? 'bg-yellow-500' : 'bg-green-600'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className={`font-semibold ${isExceeded ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'}`}>
                          {percentage.toFixed(1)}% used
                        </span>
                        <span className="text-gray-600">
                          ${budget.remaining?.toFixed(2)} remaining
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BudgetsManager;

