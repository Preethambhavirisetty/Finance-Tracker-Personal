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
    <div className="min-h-screen bg-white p-3 sm:p-6 md:p-8" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-8">
          <div className="flex-1">
            <h1 className="text-xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-1 sm:mb-2" style={{ letterSpacing: '0.02em' }}>
              Welcome, {currentUser?.username}
            </h1>
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

