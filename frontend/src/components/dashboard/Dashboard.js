import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { User, LogOut, PlusCircle, Settings as SettingsIcon, Menu, ChevronDown } from 'lucide-react';
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
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const loadProfile = useCallback(async (id) => {
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
  }, [navigate]);

  const loadTransactions = useCallback(async (id) => {
    try {
      const data = await api.getTransactions(id);
      setTransactions(data);
    } catch (error) {
      if (error instanceof APIError && error.status !== 401) {
        console.error('Failed to load transactions:', error.message);
      }
    }
  }, []);

  useEffect(() => {
    if (profileId) {
      loadTransactions(profileId);
      
      // If profile not in state, fetch it
      if (!currentProfile) {
        loadProfile(profileId);
      }
    }
  }, [profileId, currentProfile, loadProfile, loadTransactions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);


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
  
  // style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-200 p-4 tablet:p-6 laptop:p-8 desktop:p-10">
      <div className="max-w-7xl mx-auto space-y-5 tablet:space-y-6 laptop:space-y-7 desktop:space-y-8">
        {/* Header */}
        <header className="border-b border-gray-300 p-1 tablet:p-2 laptop:p-2 desktop:p-3">
          <div className="flex flex-col laptop:flex-row desktop:flex-row justify-between items-start laptop:items-center desktop:items-center gap-4 laptop:gap-6 desktop:gap-8">
            <div className="flex-1">
              <h1 className="text-2xl tablet:text-xl laptop:text-2xl desktop:text-3xl font-bold text-gray-900 mb-2" style={{ letterSpacing: '0.02em' }}>
                Finance Dashboard
              </h1>
              <p className="text-sm tablet:text-base laptop:text-lg desktop:text-xl text-gray-600 flex items-center gap-2 capitalize">
                <User className="w-4 h-4 tablet:w-5 tablet:h-5 laptop:w-5 laptop:h-5 desktop:w-5 desktop:h-5" />
                {currentProfile?.name}
              </p>
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="px-4 tablet:px-5 laptop:px-6 desktop:px-5 py-2 tablet:py-2.5 laptop:py-3 desktop:py-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 text-sm tablet:text-base"
              >
                <Menu className="w-4 h-4 tablet:w-5 tablet:h-5" />
                <ChevronDown className={`w-4 h-4 tablet:w-5 tablet:h-5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 tablet:w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => {
                      navigate(`/settings/${profileId}`);
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm tablet:text-base text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <SettingsIcon className="w-4 h-4 tablet:w-5 tablet:h-5 text-gray-600" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      navigate('/profiles');
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm tablet:text-base text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <User className="w-4 h-4 tablet:w-5 tablet:h-5 text-gray-600" />
                    Switch Profile
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm tablet:text-base text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                  >
                    <LogOut className="w-4 h-4 tablet:w-5 tablet:h-5" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Add Transaction Button */}
        <div>
          <button
            onClick={() => setShowAddTransaction(!showAddTransaction)}
            className="w-full laptop:w-auto desktop:w-auto px-5 tablet:px-6 laptop:px-7 desktop:px-8 py-2 tablet:py-2.5 laptop:py-3 desktop:py-3.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-base tablet:text-md laptop:text-md desktop:text-md"
          >
            <PlusCircle className="w-5 h-5 tablet:w-6 tablet:h-6 laptop:w-6 laptop:h-6 desktop:w-5 desktop:h-5" />
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
