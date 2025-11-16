import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Edit2, Trash2, Check, X } from 'lucide-react';
import { api, APIError } from '../../utils/api';

const AccountsManager = ({ profileId }) => {
  const [accounts, setAccounts] = useState([]);
  const [newAccount, setNewAccount] = useState({ 
    name: '', 
    type: 'cash', 
    balance: 0, 
    currency: 'USD',
    icon: '💰', 
    color: '#10B981' 
  });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);

  const loadAccounts = useCallback(async () => {
    try {
      const data = await api.getAccounts(profileId);
      setAccounts(data);
      setLoading(false);
    } catch (error) {
      if (!(error instanceof APIError && error.status === 401)) {
        console.error('Failed to load accounts:', error);
      }
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleCreate = async () => {
    if (!newAccount.name.trim() || newAccount.name.length < 2) {
      alert('Account name must be at least 2 characters');
      return;
    }

    try {
      const created = await api.createAccount(profileId, newAccount);
      setAccounts([...accounts, created]);
      setNewAccount({ name: '', type: 'cash', balance: 0, currency: 'USD', icon: '💰', color: '#10B981' });
    } catch (error) {
      alert(error instanceof APIError ? error.message : 'Failed to create account');
    }
  };

  const handleUpdate = async (accountId) => {
    try {
      const updated = await api.updateAccount(accountId, editData);
      setAccounts(accounts.map(a => a.id === accountId ? updated : a));
      setEditingId(null);
      setEditData({});
    } catch (error) {
      alert(error instanceof APIError ? error.message : 'Failed to update account');
    }
  };

  const handleDelete = async (accountId) => {
    if (!window.confirm('Are you sure? Transactions linked to this account will remain but won\'t be connected to an account.')) {
      return;
    }

    try {
      await api.deleteAccount(accountId);
      setAccounts(accounts.filter(a => a.id !== accountId));
    } catch (error) {
      alert(error instanceof APIError ? error.message : 'Failed to delete account');
    }
  };

  const startEdit = (account) => {
    setEditingId(account.id);
    setEditData({ 
      name: account.name, 
      balance: account.balance, 
      icon: account.icon, 
      color: account.color,
      is_active: account.is_active 
    });
  };

  const accountTypes = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank', label: 'Bank Account' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'investment', label: 'Investment' },
    { value: 'savings', label: 'Savings' },
    { value: 'other', label: 'Other' }
  ];

  const accountIcons = ['💰', '🏦', '💳', '📈', '🐷', '💵', '💴', '💶', '💷'];
  const accountColors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280', '#EC4899'];

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading accounts...</div>;
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
        <h2 className="text-lg sm:text-2xl md:text-3xl font-semibold text-gray-900">Manage Accounts</h2>
        <div className="text-right">
          <p className="text-xs sm:text-sm text-gray-500">Total Balance</p>
          <p className="text-xl sm:text-3xl font-bold text-green-700">${totalBalance.toFixed(2)}</p>
        </div>
      </div>
      
      {/* Create New */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 border-2 border-gray-200">
        <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Create New Account</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <input
            type="text"
            value={newAccount.name}
            onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
            placeholder="Account name..."
            className="px-3 sm:px-4 py-2 sm:py-3 bg-white rounded-lg text-gray-900 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 text-xs sm:text-base"
          />
          <select
            value={newAccount.type}
            onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
            className="px-3 sm:px-4 py-2 sm:py-3 bg-white rounded-lg text-gray-900 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 text-xs sm:text-base"
          >
            {accountTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            value={newAccount.balance}
            onChange={(e) => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) || 0 })}
            placeholder="Initial balance..."
            className="px-3 sm:px-4 py-2 sm:py-3 bg-white rounded-lg text-gray-900 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 text-xs sm:text-base"
          />
          <input
            type="text"
            value={newAccount.currency}
            onChange={(e) => setNewAccount({ ...newAccount, currency: e.target.value.toUpperCase() })}
            placeholder="Currency (USD, EUR...)"
            maxLength={3}
            className="px-3 sm:px-4 py-2 sm:py-3 bg-white rounded-lg text-gray-900 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 text-xs sm:text-base"
          />
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
          <span className="text-xs sm:text-sm text-gray-600 w-full">Icon:</span>
          {accountIcons.map(icon => (
            <button
              key={icon}
              onClick={() => setNewAccount({ ...newAccount, icon })}
              className={`text-xl sm:text-2xl p-2 rounded-lg border-2 ${newAccount.icon === icon ? 'border-gray-900 bg-gray-100' : 'border-gray-200'}`}
            >
              {icon}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
          <span className="text-xs sm:text-sm text-gray-600 w-full">Color:</span>
          {accountColors.map(color => (
            <button
              key={color}
              onClick={() => setNewAccount({ ...newAccount, color })}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 ${newAccount.color === color ? 'border-gray-900' : 'border-gray-200'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <button
          onClick={handleCreate}
          className="mt-3 sm:mt-4 w-full px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-base"
        >
          <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          Create Account
        </button>
      </div>

      {/* Accounts List */}
      <div className="space-y-2 sm:space-y-3">
        {accounts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm sm:text-base">No accounts yet. Create your first one above!</p>
          </div>
        ) : (
          accounts.map(account => (
            <div
              key={account.id}
              className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-gray-200 hover:border-gray-300 transition-all"
            >
              {editingId === account.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-base"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={editData.balance}
                    onChange={(e) => setEditData({ ...editData, balance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-base"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleUpdate(account.id)}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl p-1.5 sm:p-2 rounded-lg" style={{ backgroundColor: account.color }}>
                      {account.icon}
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-lg font-semibold text-gray-900">{account.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 capitalize">{account.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="text-right">
                      <p className="text-sm sm:text-xl font-bold text-gray-900">${account.balance.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{account.currency}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(account)}
                        className="p-1.5 sm:p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="p-1.5 sm:p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AccountsManager;

