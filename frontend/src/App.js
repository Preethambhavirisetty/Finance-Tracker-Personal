import React, { useState, useCallback, useEffect } from 'react';
import { PlusCircle, Trash2, User, LogOut, TrendingUp, TrendingDown, Wallet, PieChart, DollarSign, Calendar, Lock, Mail, LogIn, AlertCircle } from 'lucide-react';
import { api, APIError } from './utils/api';
import { validateEmail, validateUsername, validatePassword, getPasswordStrength, validateTransaction, validateProfileName } from './utils/validation';

const FinanceTracker = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Auth form states
  const [authForm, setAuthForm] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [authError, setAuthError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  
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

  // Handle unauthorized events
  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setProfiles([]);
      setCurrentProfile(null);
      setAuthError('Your session has expired. Please log in again.');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const loadProfiles = useCallback(async () => {
    try {
      const data = await api.getProfiles();
      setProfiles(data);
      setShowProfileSelect(true);
    } catch (error) {
      if (error instanceof APIError && error.status !== 401) {
        console.error('Failed to load profiles:', error.message);
      }
    }
  }, []);

  // Check authentication on mount
  const checkAuth = useCallback(async () => {
    try {
      const data = await api.checkAuth();
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
  }, [loadProfiles]);
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Update password strength on change
  useEffect(() => {
    if (!showLogin && authForm.password) {
      setPasswordStrength(getPasswordStrength(authForm.password));
    } else {
      setPasswordStrength(null);
    }
  }, [authForm.password, showLogin]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setFieldErrors({});
    setIsSubmitting(true);
    
    // Validate username
    const usernameValidation = validateUsername(authForm.username);
    if (!usernameValidation.valid) {
      setFieldErrors(prev => ({ ...prev, username: usernameValidation.error }));
      setIsSubmitting(false);
      return;
    }

    // Validate email
    if (!validateEmail(authForm.email)) {
      setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      setIsSubmitting(false);
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(authForm.password);
    if (!passwordValidation.valid) {
      setFieldErrors(prev => ({ ...prev, password: passwordValidation.error }));
      setIsSubmitting(false);
      return;
    }
    
    try {
      const data = await api.register(authForm.username, authForm.email, authForm.password);
      setIsAuthenticated(true);
      setCurrentUser(data.user);
      loadProfiles();
    } catch (error) {
      if (error instanceof APIError) {
        setAuthError(error.message);
      } else {
        setAuthError('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setFieldErrors({});
    setIsSubmitting(true);
    
    if (!authForm.username || !authForm.password) {
      setAuthError('Username and password are required');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const data = await api.login(authForm.username, authForm.password);
      setIsAuthenticated(true);
      setCurrentUser(data.user);
      setAuthForm({ username: '', email: '', password: '' });
      loadProfiles();
    } catch (error) {
      if (error instanceof APIError) {
        setAuthError(error.message);
      } else {
        setAuthError('Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setProfiles([]);
      setCurrentProfile(null);
      setShowProfileSelect(false);
      setTransactions([]);
      setAuthForm({ username: '', email: '', password: '' });
      setAuthError('');
      setFieldErrors({});
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const createProfile = async () => {
    const validation = validateProfileName(newProfileName);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    
    try {
      const newProfile = await api.createProfile(newProfileName);
      setProfiles([...profiles, newProfile]);
      setNewProfileName('');
      selectProfile(newProfile);
    } catch (error) {
      const message = error instanceof APIError ? error.message : 'Failed to create profile';
      alert(message);
    }
  };

  const deleteProfile = async (profileId) => {
    if (!window.confirm('Are you sure you want to delete this profile? All transactions will be permanently deleted.')) {
      return;
    }
    
    try {
      await api.deleteProfile(profileId);
      setProfiles(profiles.filter(p => p.id !== profileId));
      if (currentProfile?.id === profileId) {
        setCurrentProfile(null);
        setShowProfileSelect(true);
        setTransactions([]);
      }
    } catch (error) {
      const message = error instanceof APIError ? error.message : 'Failed to delete profile';
      alert(message);
    }
  };

  const selectProfile = async (profile) => {
    setCurrentProfile(profile);
    setShowProfileSelect(false);
    loadTransactions(profile.id);
  };

  const loadTransactions = async (profileId) => {
    try {
      const data = await api.getTransactions(profileId);
      setTransactions(data);
    } catch (error) {
      if (error instanceof APIError && error.status !== 401) {
        console.error('Failed to load transactions:', error.message);
      }
    }
  };

  const addTransaction = async () => {
    const validation = validateTransaction(newTransaction);
    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      return;
    }
    
    try {
      const transaction = await api.createTransaction(currentProfile.id, newTransaction);
      setTransactions([transaction, ...transactions]);
      
      setNewTransaction({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddTransaction(false);
    } catch (error) {
      const message = error instanceof APIError ? error.message : 'Failed to add transaction';
      alert(message);
    }
  };

  const deleteTransaction = async (transactionId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }
    
    try {
      await api.deleteTransaction(transactionId);
      setTransactions(transactions.filter(t => t.id !== transactionId));
    } catch (error) {
      const message = error instanceof APIError ? error.message : 'Failed to delete transaction';
      alert(message);
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
      <div className="min-h-screen bg-white p-3 sm:p-6 md:p-8" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6 sm:mb-12">
            <DollarSign className="w-12 h-12 sm:w-20 sm:h-20 text-gray-900 mx-auto mb-2 sm:mb-4" />
            <h1 className="text-2xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-2 sm:mb-4 px-2" style={{ letterSpacing: '0.02em' }}>Finance Tracker</h1>
            <p className="text-sm sm:text-xl text-gray-600 font-light italic px-4">Manage your wealth with elegance</p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl border-2 border-gray-200">
            <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-8">
              <button
                onClick={() => setShowLogin(true)}
                className={`flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-base ${
                  showLogin
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setShowLogin(false)}
                className={`flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-base ${
                  !showLogin
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Register
              </button>
            </div>

            {authError && (
              <div className="mb-3 sm:mb-6 p-2.5 sm:p-4 bg-red-50 border-2 border-red-200 rounded-lg sm:rounded-2xl">
                <p className="text-red-700 text-center text-xs sm:text-base">{authError}</p>
              </div>
            )}

            <form onSubmit={showLogin ? handleLogin : handleRegister}>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 sm:gap-2 text-gray-700 mb-1.5 sm:mb-2 font-semibold text-xs sm:text-base">
                    <User className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={authForm.username}
                    onChange={(e) => {
                      setAuthForm({ ...authForm, username: e.target.value });
                      setFieldErrors(prev => ({ ...prev, username: null }));
                    }}
                    className={`w-full px-3 sm:px-6 py-2 sm:py-4 bg-white rounded-lg sm:rounded-2xl text-gray-900 placeholder-gray-400 border-2 text-xs sm:text-base ${
                      fieldErrors.username ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent`}
                    placeholder="Enter username"
                    required
                  />
                  {fieldErrors.username && (
                    <p className="mt-1 sm:mt-2 text-[10px] sm:text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      {fieldErrors.username}
                    </p>
                  )}
                </div>

                {!showLogin && (
                  <div>
                    <label className="flex items-center gap-1.5 sm:gap-2 text-gray-700 mb-1.5 sm:mb-2 font-semibold text-xs sm:text-base">
                      <Mail className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(e) => {
                        setAuthForm({ ...authForm, email: e.target.value });
                        setFieldErrors(prev => ({ ...prev, email: null }));
                      }}
                      className={`w-full px-3 sm:px-6 py-2 sm:py-4 bg-white rounded-lg sm:rounded-2xl text-gray-900 placeholder-gray-400 border-2 text-xs sm:text-base ${
                        fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent`}
                      placeholder="Enter email"
                      required
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 sm:mt-2 text-[10px] sm:text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-1.5 sm:gap-2 text-gray-700 mb-1.5 sm:mb-2 font-semibold text-xs sm:text-base">
                    <Lock className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    Password
                  </label>
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(e) => {
                      setAuthForm({ ...authForm, password: e.target.value });
                      setFieldErrors(prev => ({ ...prev, password: null }));
                    }}
                    className={`w-full px-3 sm:px-6 py-2 sm:py-4 bg-white rounded-lg sm:rounded-2xl text-gray-900 placeholder-gray-400 border-2 text-xs sm:text-base ${
                      fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent`}
                    placeholder="Enter password"
                    required
                  />
                  {fieldErrors.password && (
                    <p className="mt-1 sm:mt-2 text-[10px] sm:text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      {fieldErrors.password}
                    </p>
                  )}
                  {!showLogin && passwordStrength && (
                    <div className="mt-1.5 sm:mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] sm:text-sm text-gray-600">Strength:</span>
                        <span className={`text-[10px] sm:text-sm font-semibold ${
                          passwordStrength.level === 'weak' ? 'text-red-600' :
                          passwordStrength.level === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>{passwordStrength.text}</span>
                      </div>
                      <div className="w-full h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ 
                            width: passwordStrength.level === 'weak' ? '33%' :
                                   passwordStrength.level === 'medium' ? '66%' : '100%'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full mt-3 sm:mt-6 px-4 sm:px-6 py-2.5 sm:py-4 bg-gray-900 text-white rounded-lg sm:rounded-2xl font-semibold transition-all duration-300 shadow-lg flex items-center justify-center gap-2 text-sm sm:text-lg ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800 hover:shadow-xl'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 sm:border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs sm:text-base">Processing...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 sm:w-6 sm:h-6" />
                    {showLogin ? 'Login' : 'Register'}
                  </>
                )}
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
      <div className="min-h-screen bg-white p-3 sm:p-6 md:p-8" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-8">
            <div className="flex-1">
              <h1 className="text-xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-1 sm:mb-2" style={{ letterSpacing: '0.02em' }}>Welcome, {currentUser?.username}</h1>
              <p className="text-xs sm:text-lg md:text-xl text-gray-600 font-light italic">Select or create a profile</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 sm:px-6 py-1.5 sm:py-3 bg-gray-900 text-white rounded-lg sm:rounded-2xl font-semibold hover:bg-gray-800 transition-all duration-300 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              Logout
            </button>
          </div>

          {/* Create Profile Card */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border-2 border-gray-200 mb-4 sm:mb-8">
            <h2 className="text-base sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-3 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <User className="w-4 h-4 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-700" />
              Create New Profile
            </h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createProfile()}
                placeholder="Profile name..."
                className="flex-1 px-3 sm:px-6 py-2 sm:py-4 bg-white rounded-lg sm:rounded-2xl text-gray-900 placeholder-gray-400 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm text-xs sm:text-base"
              />
              <button
                onClick={createProfile}
                className="px-4 sm:px-8 py-2 sm:py-4 bg-gray-900 text-white rounded-lg sm:rounded-2xl font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-xs sm:text-base whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                Create
              </button>
            </div>
          </div>

          {/* Existing Profiles */}
          {profiles.length > 0 && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl border-2 border-gray-200">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-4 sm:mb-6">Your Profiles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {profiles.map(profile => (
                  <div
                    key={profile.id}
                    className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex justify-between items-start sm:items-center gap-2">
                      <div onClick={() => selectProfile(profile)} className="flex-1">
                        <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2">
                          <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                          {profile.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 font-light">
                          Created {new Date(profile.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProfile(profile.id);
                        }}
                        className="p-2 hover:bg-red-50 rounded-xl transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
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
    <div>
    <div className="min-h-screen bg-white p-3 sm:p-4 md:p-6 lg:p-8" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 mb-4 sm:mb-8 pb-3 sm:pb-6 border-b-2 border-gray-200">
          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-1 sm:mb-2" style={{ letterSpacing: '0.02em' }}>Finance Dashboard</h1>
            <p className="text-xs sm:text-lg md:text-xl text-gray-600 flex items-center gap-1.5 sm:gap-2 font-light italic">
              <User className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              {currentProfile?.name}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 w-full lg:w-auto">
            <button
              onClick={() => {
                setCurrentProfile(null);
                setShowProfileSelect(true);
              }}
              className="px-3 sm:px-5 md:px-6 py-1.5 sm:py-2.5 md:py-3 bg-white text-gray-900 rounded-lg sm:rounded-2xl font-semibold hover:bg-gray-50 transition-all duration-300 border-2 border-gray-300 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-base"
            >
              <User className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Switch Profile</span>
              <span className="sm:hidden">Switch</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3 sm:px-5 md:px-6 py-1.5 sm:py-2.5 md:py-3 bg-gray-900 text-white rounded-lg sm:rounded-2xl font-semibold hover:bg-gray-800 transition-all duration-300 border-2 border-gray-900 flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg text-xs sm:text-base"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 md:gap-6 mb-4 sm:mb-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 shadow-xl border-2 border-green-200 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-lg md:text-xl font-semibold text-gray-900">Income</h3>
              <TrendingUp className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-green-600" />
            </div>
            <p className="text-2xl sm:text-4xl md:text-5xl font-bold text-green-700">${stats.income.toFixed(2)}</p>
            <p className="text-[10px] sm:text-sm text-gray-600 mt-0.5 sm:mt-2 font-light italic">Earnings</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 shadow-xl border-2 border-red-200 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-lg md:text-xl font-semibold text-gray-900">Expenses</h3>
              <TrendingDown className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-red-600" />
            </div>
            <p className="text-2xl sm:text-4xl md:text-5xl font-bold text-red-700">${stats.expenses.toFixed(2)}</p>
            <p className="text-[10px] sm:text-sm text-gray-600 mt-0.5 sm:mt-2 font-light italic">Spending</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 shadow-xl border-2 border-blue-200 hover:shadow-2xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-xs sm:text-lg md:text-xl font-semibold text-gray-900">Balance</h3>
              <Wallet className="w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-600" />
            </div>
            <p className={`text-2xl sm:text-4xl md:text-5xl font-bold ${stats.balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              ${stats.balance.toFixed(2)}
            </p>
            <p className="text-[10px] sm:text-sm text-gray-600 mt-0.5 sm:mt-2 font-light italic">Net</p>
          </div>
        </div>

        {/* Add Transaction Button */}
        <div className="mb-3 sm:mb-6">
          <button
            onClick={() => setShowAddTransaction(!showAddTransaction)}
            className="w-full md:w-auto px-4 sm:px-8 md:px-10 py-2.5 sm:py-4 md:py-5 bg-gray-900 text-white rounded-lg sm:rounded-2xl font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-lg"
          >
            <PlusCircle className="w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7" />
            Add Transaction
          </button>
        </div>

        {/* Add Transaction Form */}
        {showAddTransaction && (
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
                onClick={() => setShowAddTransaction(false)}
                className="px-4 sm:px-6 py-2.5 sm:py-4 bg-white text-gray-900 rounded-lg sm:rounded-2xl font-semibold hover:bg-gray-100 transition-all duration-300 border-2 border-gray-300 text-xs sm:text-base md:text-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {Object.keys(categoryBreakdown).length > 0 && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl border-2 border-gray-200 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <PieChart className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-700" />
              Category Breakdown
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Object.entries(categoryBreakdown).map(([category, amounts]) => (
                <div
                  key={category}
                  className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">{category}</h3>
                  {amounts.income > 0 && (
                    <p className="text-green-700 flex items-center gap-2 mb-1 font-semibold text-sm sm:text-base">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                      ${amounts.income.toFixed(2)}
                    </p>
                  )}
                  {amounts.expense > 0 && (
                    <p className="text-red-700 flex items-center gap-2 font-semibold text-sm sm:text-base">
                      <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                      ${amounts.expense.toFixed(2)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
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
                          onClick={() => deleteTransaction(transaction.id)}
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
      </div>
    </div>
    </div>
  );
};

export default FinanceTracker;

