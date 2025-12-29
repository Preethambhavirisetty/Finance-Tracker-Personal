import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, PlusCircle } from 'lucide-react';
import { api, APIError } from '../../utils/api';
import { validateProfileName } from '../../utils/validation';
import { useAuth } from '../../context/AuthContext';
import ProfileCard from './ProfileCard';

const ProfileSelection = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [newProfileName, setNewProfileName] = useState('');

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const data = await api.getProfiles();
      setProfiles(data);
    } catch (error) {
      if (error instanceof APIError && error.status !== 401) {
        console.error('Failed to load profiles:', error.message);
      }
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
    } catch (error) {
      const message = error instanceof APIError ? error.message : 'Failed to delete profile';
      alert(message);
    }
  };

  const selectProfile = (profile) => {
    navigate(`/dashboard/${profile.id}`, { state: { profile } });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 tablet:p-6 laptop:p-8 desktop:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col tablet:flex-col laptop:flex-row desktop:flex-row justify-between items-start tablet:items-center gap-3 tablet:gap-4 laptop:gap-4 mb-4 tablet:mb-6 laptop:mb-8">
          <div className="flex-1">
            <h1 className="text-xl tablet:text-3xl laptop:text-4xl desktop:text-4xl font-bold text-gray-900 mb-1 tablet:mb-2 laptop:mb-2 capitalize" style={{ letterSpacing: '0.02em' }}>
              Welcome, {currentUser?.username}
            </h1>
            <p className="text-xs tablet:text-base laptop:text-lg desktop:text-lg text-gray-600 font-light">Select or create a profile</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 tablet:px-4 laptop:px-5 desktop:px-5 py-1.5 tablet:py-2 laptop:py-2.5 desktop:py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center gap-1.5 tablet:gap-2 text-xs tablet:text-sm laptop:text-base desktop:text-base"
          >
            <LogOut className="w-3.5 h-3.5 tablet:w-4 tablet:h-4 laptop:w-4 laptop:h-4 desktop:w-4 desktop:h-4" />
            Logout
          </button>
        </div>

        {/* Create Profile Card */}
        <div className="bg-white rounded-lg tablet:rounded-xl laptop:rounded-xl shadow-sm border border-gray-200 p-4 tablet:p-5 laptop:p-6 desktop:p-6 mb-4 tablet:mb-6 laptop:mb-8">
          <h2 className="text-base tablet:text-lg laptop:text-xl desktop:text-xl font-semibold text-gray-900 mb-3 tablet:mb-4 laptop:mb-4 flex items-center gap-2">
            <User className="w-4 h-4 tablet:w-5 tablet:h-5 laptop:w-5 laptop:h-5 desktop:w-5 desktop:h-5 text-gray-700" />
            Create New Profile
          </h2>
          <div className="flex flex-col tablet:flex-row gap-2 tablet:gap-3 laptop:gap-3">
            <input
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createProfile()}
              placeholder="Profile name..."
              className="flex-1 px-3 tablet:px-4 laptop:px-5 desktop:px-5 py-2 tablet:py-2.5 laptop:py-3 desktop:py-3 bg-white rounded-lg text-gray-900 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm tablet:text-base laptop:text-base desktop:text-base"
            />
            <button
              onClick={createProfile}
              className="px-4 tablet:px-5 laptop:px-6 desktop:px-6 py-2 tablet:py-2.5 laptop:py-3 desktop:py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm tablet:text-base laptop:text-base desktop:text-base whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5 tablet:w-4 tablet:h-4 laptop:w-4 laptop:h-4 desktop:w-4 desktop:h-4" />
              Create
            </button>
          </div>
        </div>

        {/* Existing Profiles */}
        {profiles.length > 0 && (
          <div className="bg-white rounded-lg tablet:rounded-xl laptop:rounded-xl shadow-sm border border-gray-200 p-4 tablet:p-5 laptop:p-6 desktop:p-6">
            <h2 className="text-lg tablet:text-xl laptop:text-2xl desktop:text-2xl font-semibold text-gray-900 mb-4 tablet:mb-5 laptop:mb-6">Your Profiles</h2>
            <div className="grid grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-2 desktop:grid-cols-2 gap-3 tablet:gap-4 laptop:gap-4 desktop:gap-5">
              {profiles.map(profile => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onSelect={selectProfile}
                  onDelete={deleteProfile}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSelection;
