import React from 'react';
import { User, Trash2 } from 'lucide-react';

const ProfileCard = ({ profile, onSelect, onDelete }) => {
  return (
    <div
      className="bg-white rounded-lg tablet:rounded-lg laptop:rounded-lg border border-gray-200 p-3 tablet:p-4 laptop:p-4 desktop:p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start tablet:items-center gap-2">
        <div onClick={() => onSelect(profile)} className="flex-1 min-w-0">
          <h3 className="text-base tablet:text-lg laptop:text-xl desktop:text-xl font-semibold text-gray-900 mb-1 tablet:mb-1.5 laptop:mb-1.5 flex items-center gap-2">
            <User className="w-4 h-4 tablet:w-5 tablet:h-5 laptop:w-5 laptop:h-5 desktop:w-5 desktop:h-5 text-gray-700 flex-shrink-0" />
            <span className="truncate capitalize">{profile.name}</span>
          </h3>
          <p className="text-xs tablet:text-sm laptop:text-sm desktop:text-sm text-gray-500 font-light">
            Created {new Date(profile.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(profile.id);
          }}
          className="p-1.5 tablet:p-2 laptop:p-2 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
          title="Delete profile"
        >
          <Trash2 className="w-4 h-4 tablet:w-4 tablet:h-4 laptop:w-4 laptop:h-4 desktop:w-4 desktop:h-4 text-red-600" />
        </button>
      </div>
    </div>
  );
};

export default ProfileCard;
