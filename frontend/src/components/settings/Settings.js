import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Tag as TagIcon, Folder, Wallet, TrendingDown } from 'lucide-react';
import CategoriesManager from './CategoriesManager';
import TagsManager from './TagsManager';
import AccountsManager from './AccountsManager';
import BudgetsManager from './BudgetsManager';

const Settings = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('categories');

  const tabs = [
    { id: 'categories', label: 'Categories', icon: Folder },
    { id: 'tags', label: 'Tags', icon: TagIcon },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'budgets', label: 'Budgets', icon: TrendingDown }
  ];

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6 md:p-8" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-8 pb-3 sm:pb-6 border-b-2 border-gray-200">
          <button
            onClick={() => navigate(`/dashboard/${profileId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900" style={{ letterSpacing: '0.02em' }}>
              Settings
            </h1>
            <p className="text-xs sm:text-lg md:text-xl text-gray-600 font-light italic">
              Manage your finance settings
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-base ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border-2 border-gray-200">
          {activeTab === 'categories' && <CategoriesManager profileId={profileId} />}
          {activeTab === 'tags' && <TagsManager profileId={profileId} />}
          {activeTab === 'accounts' && <AccountsManager profileId={profileId} />}
          {activeTab === 'budgets' && <BudgetsManager profileId={profileId} />}
        </div>
      </div>
    </div>
  );
};

export default Settings;

