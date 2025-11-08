import React, { useState, useCallback, useEffect } from 'react';
import { PlusCircle, Trash2, User, LogOut, TrendingUp, TrendingDown, Wallet, PieChart, DollarSign, Calendar, Lock, Mail, LogIn } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const FinanceTracker = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Auth form states
  const [authForm, setAuthForm] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [authError, setAuthError] = useState('');
  
  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [showProfileSelect, setShowProfileSelect] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  
  // Transaction states
  const [transactions, setTransactions] = useState([]);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Check authentication on mount
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/check-auth`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        loadProfiles();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setAuthLoading(false);
    }
  }, [API_URL, loadProfiles, setIsAuthenticated, setCurrentUser]);
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(authForm)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        loadProfiles();
      } else {
        setAuthError(data.error);
      }
    } catch (error) {
      setAuthError('Registration failed. Please try again.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: authForm.username,
          password: authForm.password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        loadProfiles();
      } else {
        setAuthError(data.error);
      }
    } catch (error) {
      setAuthError('Login failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      setIsAuthenticated(false);
      setCurrentUser(null);
      setProfiles([]);
      setCurrentProfile(null);
      setShowProfileSelect(false);
      setAuthForm({ username: '', email: '', password: '' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      const response = await fetch(`${API_URL}/profiles`, {
        credentials: 'include'
      });
      const data = await response.json();
      setProfiles(data);
      setShowProfileSelect(true);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  };

  const createProfile = async () => {
    if (newProfileName.trim()) {
      try {
        const response = await fetch(`${API_URL}/profiles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: newProfileName })
        });
        
        const newProfile = await response.json();
        setProfiles([...profiles, newProfile]);
        setNewProfileName('');
        selectProfile(newProfile);
      } catch (error) {
        console.error('Failed to create profile:', error);
      }
    }
  };

  const deleteProfile = async (profileId) => {
    try {
      await fetch(`${API_URL}/profiles/${profileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      setProfiles(profiles.filter(p => p.id !== profileId));
      if (currentProfile?.id === profileId) {
        setCurrentProfile(null);
        setShowProfileSelect(true);
      }
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
  };

  const selectProfile = async (profile) => {
    setCurrentProfile(profile);
    setShowProfileSelect(false);
    loadTransactions(profile.id);
  };

  const loadTransactions = async (profileId) => {
    try {
      const response = await fetch(`${API_URL}/profiles/${profileId}/transactions`, {
        credentials: 'include'
      });
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const addTransaction = async () => {
    if (newTransaction.amount && newTransaction.category) {
      try {
        const response = await fetch(`${API_URL}/profiles/${currentProfile.id}/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(newTransaction)
        });
        
        const transaction = await response.json();
        setTransactions([...transactions, transaction]);
        
        setNewTransaction({
          type: 'expense',
          amount: '',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
        setShowAddTransaction(false);
      } catch (error) {
        console.error('Failed to add transaction:', error);
      }
    }
  };

  const deleteTransaction = async (transactionId) => {
    try {
      await fetch(`${API_URL}/transactions/${transactionId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      setTransactions(transactions.filter(t => t.id !== transactionId));
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const calculateStats = () => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    return { income, expenses, balance: income - expenses };
  };

  const getCategoryBreakdown = () => {
    const breakdown = {};
    transactions.forEach(t => {
      if (!breakdown[t.category]) {
        breakdown[t.category] = { income: 0, expense: 0 };
      }
      breakdown[t.category][t.type] += parseFloat(t.amount);
    });
    return breakdown;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        <div className="text-center">
          <DollarSign className="w-20 h-20 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-2xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Login/Register Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white p-8" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-12">
            <DollarSign className="w-20 h-20 text-gray-900 mx-auto mb-4" />
            <h1 className="text-6xl font-bold text-gray-900 mb-4" style={{ letterSpacing: '0.02em' }}>Finance Tracker</h1>
            <p className="text-xl text-gray-600 font-light italic">Manage your wealth with elegance</p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 shadow-2xl border-2 border-gray-200">
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setShowLogin(true)}
                className={`flex-1 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                  showLogin
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setShowLogin(false)}
                className={`flex-1 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                  !showLogin
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Register
              </button>
            </div>

            {authError && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                <p className="text-red-700 text-center">{authError}</p>
              </div>
            )}

            <form onSubmit={showLogin ? handleLogin : handleRegister}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2 font-semibold flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={authForm.username}
                    onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                    className="w-full px-6 py-4 bg-white rounded-2xl text-gray-900 placeholder-gray-400 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                    placeholder="Enter your username"
                    required
                  />
                </div>

                {!showLogin && (
                  <div>
                    <label className="block text-gray-700 mb-2 font-semibold flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                      className="w-full px-6 py-4 bg-white rounded-2xl text-gray-900 placeholder-gray-400 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 mb-2 font-semibold flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Password
                  </label>
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="w-full px-6 py-4 bg-white rounded-2xl text-gray-900 placeholder-gray-400 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-6 px-6 py-4 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
              >
                <LogIn className="w-6 h-6" />
                {showLogin ? 'Login' : 'Register'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const stats = currentProfile ? calculateStats() : { income: 0, expenses: 0, balance: 0 };
  const categoryBreakdown = currentProfile ? getCategoryBreakdown() : {};

  // Profile Selection Screen
  if (showProfileSelect) {
    return (
      <div className="min-h-screen bg-white p-8" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-6xl font-bold text-gray-900 mb-2" style={{ letterSpacing: '0.02em' }}>Welcome, {currentUser?.username}</h1>
              <p className="text-xl text-gray-600 font-light italic">Select or create a profile</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-gray-800 transition-all duration-300 flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>

          {/* Create Profile Card */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 shadow-2xl border-2 border-gray-200 mb-8">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <User className="w-8 h-8 text-gray-700" />
              Create New Profile
            </h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createProfile()}
                placeholder="Enter your distinguished name..."
                className="flex-1 px-6 py-4 bg-white rounded-2xl text-gray-900 placeholder-gray-400 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm"
              />
              <button
                onClick={createProfile}
                className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                Create
              </button>
            </div>
          </div>

          {/* Existing Profiles */}
          {profiles.length > 0 && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 shadow-2xl border-2 border-gray-200">
              <h2 className="text-3xl font-semibold text-gray-900 mb-6">Your Profiles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profiles.map(profile => (
                  <div
                    key={profile.id}
                    className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex justify-between items-center">
                      <div onClick={() => selectProfile(profile)} className="flex-1">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <User className="w-6 h-6 text-gray-700" />
                          {profile.name}
                        </h3>
                        <p className="text-sm text-gray-500 font-light">
                          Created {new Date(profile.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProfile(profile.id);
                        }}
                        className="p-2 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-white p-4 md:p-8" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-6 border-b-2 border-gray-200">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-2" style={{ letterSpacing: '0.02em' }}>Finance Dashboard</h1>
            <p className="text-xl text-gray-600 flex items-center gap-2 font-light italic">
              <User className="w-5 h-5" />
              {currentProfile?.name}
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setCurrentProfile(null);
                setShowProfileSelect(true);
              }}
              className="px-6 py-3 bg-white text-gray-900 rounded-2xl font-semibold hover:bg-gray-50 transition-all duration-300 border-2 border-gray-300 flex items-center gap-2"
            >
              <User className="w-5 h-5" />
              Switch Profile
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-gray-800 transition-all duration-300 border-2 border-gray-900 flex items-center gap-2 shadow-lg"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 shadow-xl border-2 border-green-200 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Total Income</h3>
              <TrendingUp className="w-10 h-10 text-green-600" />
            </div>
            <p className="text-5xl font-bold text-green-700">${stats.income.toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-2 font-light italic">Earnings accumulated</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-3xl p-8 shadow-xl border-2 border-red-200 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Total Expenses</h3>
              <TrendingDown className="w-10 h-10 text-red-600" />
            </div>
            <p className="text-5xl font-bold text-red-700">${stats.expenses.toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-2 font-light italic">Expenditure tracked</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 shadow-xl border-2 border-blue-200 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Net Balance</h3>
              <Wallet className="w-10 h-10 text-blue-600" />
            </div>
            <p className={`text-5xl font-bold ${stats.balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              ${stats.balance.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 mt-2 font-light italic">Current standing</p>
          </div>
        </div>

        {/* Add Transaction Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddTransaction(!showAddTransaction)}
            className="w-full md:w-auto px-10 py-5 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center justify-center gap-3 text-lg"
          >
            <PlusCircle className="w-7 h-7" />
            Add Transaction
          </button>
        </div>

        {/* Add Transaction Form */}
        {showAddTransaction && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 shadow-2xl border-2 border-gray-200 mb-8">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">New Transaction</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-2 font-semibold text-lg">Type</label>
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
                  className="w-full px-6 py-4 bg-white rounded-2xl text-gray-900 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-semibold text-lg">Amount</label>
                <input
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-6 py-4 bg-white rounded-2xl text-gray-900 placeholder-gray-400 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-semibold text-lg">Category</label>
                <input
                  type="text"
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  placeholder="e.g., Dining, Salary, Transport"
                  className="w-full px-6 py-4 bg-white rounded-2xl text-gray-900 placeholder-gray-400 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-semibold text-lg">Date</label>
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  className="w-full px-6 py-4 bg-white rounded-2xl text-gray-900 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2 font-semibold text-lg">Description</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  placeholder="Optional details..."
                  className="w-full px-6 py-4 bg-white rounded-2xl text-gray-900 placeholder-gray-400 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={addTransaction}
                className="flex-1 px-6 py-4 bg-green-600 text-white rounded-2xl font-semibold hover:bg-green-700 transition-all duration-300 shadow-lg text-lg"
              >
                Add Transaction
              </button>
              <button
                onClick={() => setShowAddTransaction(false)}
                className="px-6 py-4 bg-white text-gray-900 rounded-2xl font-semibold hover:bg-gray-100 transition-all duration-300 border-2 border-gray-300 text-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {Object.keys(categoryBreakdown).length > 0 && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 shadow-2xl border-2 border-gray-200 mb-8">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <PieChart className="w-8 h-8 text-gray-700" />
              Category Breakdown
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(categoryBreakdown).map(([category, amounts]) => (
                <div
                  key={category}
                  className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{category}</h3>
                  {amounts.income > 0 && (
                    <p className="text-green-700 flex items-center gap-2 mb-1 font-semibold">
                      <TrendingUp className="w-5 h-5" />
                      ${amounts.income.toFixed(2)}
                    </p>
                  )}
                  {amounts.expense > 0 && (
                    <p className="text-red-700 flex items-center gap-2 font-semibold">
                      <TrendingDown className="w-5 h-5" />
                      ${amounts.expense.toFixed(2)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 shadow-2xl border-2 border-gray-200">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-gray-700" />
            Recent Transactions
          </h2>
          
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {[...transactions]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(transaction => (
                  <div
                    key={transaction.id}
                    className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`p-3 rounded-xl ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {transaction.type === 'income' ? (
                            <TrendingUp className="w-7 h-7 text-green-700" />
                          ) : (
                            <TrendingDown className="w-7 h-7 text-red-700" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-semibold text-gray-900">{transaction.category}</h3>
                            <span className="text-sm text-gray-500 font-light italic">{new Date(transaction.date).toLocaleDateString()}</span>
                          </div>
                          {transaction.description && (
                            <p className="text-sm text-gray-600 font-light">{transaction.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className={`text-3xl font-bold ${transaction.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                          {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                        </p>
                        <button
                          onClick={() => deleteTransaction(transaction.id)}
                          className="p-2 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <DollarSign className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-2xl text-gray-600 font-semibold">No transactions yet</p>
              <p className="text-gray-500 mt-2 font-light italic">Add your first transaction to begin tracking</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceTracker;

