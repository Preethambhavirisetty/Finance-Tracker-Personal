import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { User, LogOut, PlusCircle } from 'lucide-react';
import { api, APIError } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import StatsCards from './StatsCards';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import CategoryBreakdown from './CategoryBreakdown';

const Dashboard = () => {
  const { profileId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [currentProfile, setCurrentProfile] = useState(location.state?.profile || null);
  const [transactions, setTransactions] = useState([]);
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  useEffect(() => {
    if (profileId) {
      loadTransactions(profileId);
      
      // If profile not in state, fetch it
      if (!currentProfile) {
        loadProfile(profileId);
      }
    }
  }, [profileId]);

  const loadProfile = async (id) => {
    try {
      const profiles = await api.getProfiles();
      const profile = profiles.find(p => p.id === parseInt(id));
      if (profile) {
        setCurrentProfile(profile);
      } else {
        navigate('/profiles');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      navigate('/profiles');
    }
  };

  const loadTransactions = async (id) => {
    try {
      const data = await api.getTransactions(id);
      setTransactions(data);
    } catch (error) {
      if (error instanceof APIError && error.status !== 401) {
        console.error('Failed to load transactions:', error.message);
      }
    }
  };

  const handleTransactionAdded = (transaction) => {
    setTransactions([transaction, ...transactions]);
    setShowAddTransaction(false);
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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const stats = calculateStats();
  const categoryBreakdown = getCategoryBreakdown();

  return (
    <div className="min-h-screen bg-white p-3 sm:p-4 md:p-6 lg:p-8" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 mb-4 sm:mb-8 pb-3 sm:pb-6 border-b-2 border-gray-200">
          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-1 sm:mb-2" style={{ letterSpacing: '0.02em' }}>
              Finance Dashboard
            </h1>
            <p className="text-xs sm:text-lg md:text-xl text-gray-600 flex items-center gap-1.5 sm:gap-2 font-light italic">
              <User className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              {currentProfile?.name}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 w-full lg:w-auto">
            <button
              onClick={() => navigate('/profiles')}
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
        <StatsCards stats={stats} />

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
          <TransactionForm
            profileId={profileId}
            onTransactionAdded={handleTransactionAdded}
            onCancel={() => setShowAddTransaction(false)}
          />
        )}

        {/* Category Breakdown */}
        <CategoryBreakdown categoryBreakdown={categoryBreakdown} />

        {/* Recent Transactions */}
        <TransactionList
          transactions={transactions}
          onDelete={deleteTransaction}
        />
      </div>
    </div>
  );
};

export default Dashboard;

