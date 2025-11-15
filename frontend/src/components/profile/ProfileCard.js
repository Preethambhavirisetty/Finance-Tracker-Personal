import React from 'react';
import { User, Trash2 } from 'lucide-react';

const ProfileCard = ({ profile, onSelect, onDelete }) => {
  return (
    <div
      className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-300 cursor-pointer group"
    >
      <div className="flex justify-between items-start sm:items-center gap-2">
        <div onClick={() => onSelect(profile)} className="flex-1">
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
            onDelete(profile.id);
          }}
          className="p-2 hover:bg-red-50 rounded-xl transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
        </button>
      </div>
    </div>
  );
};

export default ProfileCard;

