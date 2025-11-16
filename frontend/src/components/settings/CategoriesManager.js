import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Edit2, Trash2, Check, X } from 'lucide-react';
import { api, APIError } from '../../utils/api';

const CategoriesManager = ({ profileId }) => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense', icon: '📁', color: '#6B7280' });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      const data = await api.getCategories(profileId);
      setCategories(data);
      setLoading(false);
    } catch (error) {
      if (!(error instanceof APIError && error.status === 401)) {
        console.error('Failed to load categories:', error);
      }
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCreate = async () => {
    if (!newCategory.name.trim() || newCategory.name.length < 2) {
      alert('Category name must be at least 2 characters');
      return;
    }

    try {
      const created = await api.createCategory(profileId, newCategory);
      setCategories([...categories, created]);
      setNewCategory({ name: '', type: 'expense', icon: '📁', color: '#6B7280' });
    } catch (error) {
      alert(error instanceof APIError ? error.message : 'Failed to create category');
    }
  };

  const handleUpdate = async (categoryId) => {
    try {
      const updated = await api.updateCategory(categoryId, editData);
      setCategories(categories.map(c => c.id === categoryId ? updated : c));
      setEditingId(null);
      setEditData({});
    } catch (error) {
      alert(error instanceof APIError ? error.message : 'Failed to update category');
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure? Transactions using this category will still keep the category name.')) {
      return;
    }

    try {
      await api.deleteCategory(categoryId);
      setCategories(categories.filter(c => c.id !== categoryId));
    } catch (error) {
      alert(error instanceof APIError ? error.message : 'Failed to delete category');
    }
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setEditData({ name: category.name, icon: category.icon, color: category.color });
  };

  const categoryIcons = ['📁', '🏠', '🍔', '🚗', '🎮', '💼', '🎓', '🏥', '✈️', '🛒', '💰', '📱', '👕', '🎬'];
  const categoryColors = ['#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading categories...</div>;
  }

  return (
    <div>
      <h2 className="text-lg sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-4 sm:mb-6">Manage Categories</h2>
      
      {/* Create New */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 border-2 border-gray-200">
        <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Create New Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <input
            type="text"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            placeholder="Category name..."
            className="px-3 sm:px-4 py-2 sm:py-3 bg-white rounded-lg text-gray-900 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 text-xs sm:text-base"
          />
          <select
            value={newCategory.type}
            onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
            className="px-3 sm:px-4 py-2 sm:py-3 bg-white rounded-lg text-gray-900 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 text-xs sm:text-base"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
          <span className="text-xs sm:text-sm text-gray-600 w-full">Icon:</span>
          {categoryIcons.map(icon => (
            <button
              key={icon}
              onClick={() => setNewCategory({ ...newCategory, icon })}
              className={`text-xl sm:text-2xl p-2 rounded-lg border-2 ${newCategory.icon === icon ? 'border-gray-900 bg-gray-100' : 'border-gray-200'}`}
            >
              {icon}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
          <span className="text-xs sm:text-sm text-gray-600 w-full">Color:</span>
          {categoryColors.map(color => (
            <button
              key={color}
              onClick={() => setNewCategory({ ...newCategory, color })}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 ${newCategory.color === color ? 'border-gray-900' : 'border-gray-200'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <button
          onClick={handleCreate}
          className="mt-3 sm:mt-4 w-full px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-base"
        >
          <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          Create Category
        </button>
      </div>

      {/* Categories List */}
      <div className="space-y-2 sm:space-y-3">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm sm:text-base">No categories yet. Create your first one above!</p>
          </div>
        ) : (
          categories.map(category => (
            <div
              key={category.id}
              className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-gray-200 hover:border-gray-300 transition-all"
            >
              {editingId === category.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-base"
                  />
                  <div className="flex flex-wrap gap-2">
                    {categoryIcons.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setEditData({ ...editData, icon })}
                        className={`text-lg sm:text-xl p-1.5 rounded border ${editData.icon === icon ? 'border-gray-900 bg-gray-100' : 'border-gray-200'}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleUpdate(category.id)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg flex items-center justify-center gap-1 text-xs sm:text-sm"
                    >
                      <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg flex items-center justify-center gap-1 text-xs sm:text-sm"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl p-1.5 sm:p-2 rounded-lg" style={{ backgroundColor: category.color }}>
                      {category.icon}
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-lg font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 capitalize">{category.type}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(category)}
                      className="p-1.5 sm:p-2 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-1.5 sm:p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoriesManager;

