import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { api, APIError } from '../../utils/api';

const TagsManager = ({ profileId }) => {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState({ name: '', color: '#3B82F6' });
  const [loading, setLoading] = useState(true);

  const loadTags = useCallback(async () => {
    try {
      const data = await api.getTags(profileId);
      setTags(data);
      setLoading(false);
    } catch (error) {
      if (!(error instanceof APIError && error.status === 401)) {
        console.error('Failed to load tags:', error);
      }
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const handleCreate = async () => {
    if (!newTag.name.trim() || newTag.name.length < 2) {
      alert('Tag name must be at least 2 characters');
      return;
    }

    try {
      const created = await api.createTag(profileId, newTag);
      setTags([...tags, created]);
      setNewTag({ name: '', color: '#3B82F6' });
    } catch (error) {
      alert(error instanceof APIError ? error.message : 'Failed to create tag');
    }
  };

  const handleDelete = async (tagId) => {
    if (!window.confirm('Are you sure? This tag will be removed from all transactions.')) {
      return;
    }

    try {
      await api.deleteTag(tagId);
      setTags(tags.filter(t => t.id !== tagId));
    } catch (error) {
      alert(error instanceof APIError ? error.message : 'Failed to delete tag');
    }
  };

  const tagColors = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6'];

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading tags...</div>;
  }

  return (
    <div>
      <h2 className="text-lg sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-4 sm:mb-6">Manage Tags</h2>
      
      {/* Create New */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 border-2 border-gray-200">
        <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Create New Tag</h3>
        <input
          type="text"
          value={newTag.name}
          onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
          onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Tag name..."
          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white rounded-lg text-gray-900 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 text-xs sm:text-base mb-3 sm:mb-4"
        />
        
        <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
          <span className="text-xs sm:text-sm text-gray-600 w-full">Color:</span>
          {tagColors.map(color => (
            <button
              key={color}
              onClick={() => setNewTag({ ...newTag, color })}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 ${newTag.color === color ? 'border-gray-900' : 'border-gray-200'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <button
          onClick={handleCreate}
          className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-base"
        >
          <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          Create Tag
        </button>
      </div>

      {/* Tags List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        {tags.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            <p className="text-sm sm:text-base">No tags yet. Create your first one above!</p>
          </div>
        ) : (
          tags.map(tag => (
            <div
              key={tag.id}
              className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-gray-200 hover:border-gray-300 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="text-sm sm:text-base font-semibold text-gray-900">{tag.name}</span>
              </div>
              <button
                onClick={() => handleDelete(tag.id)}
                className="p-1.5 sm:p-2 hover:bg-red-50 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TagsManager;

