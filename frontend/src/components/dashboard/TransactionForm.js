import React, { useState, useEffect, useCallback } from 'react';
import { api, APIError } from '../../utils/api';
import { validateTransaction } from '../../utils/validation';
import { X, Upload, FileText, Trash2 } from 'lucide-react';

const TransactionForm = ({ profileId, onTransactionAdded, onCancel }) => {
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    amount: '',
    category: '',
    category_id: null,
    account_id: null,
    tag_ids: [],
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const loadData = useCallback(async () => {
    try {
      const [categoriesData, tagsData, accountsData] = await Promise.all([
        api.getCategories(profileId),
        api.getTags(profileId),
        api.getAccounts(profileId)
      ]);
      setCategories(categoriesData);
      setTags(tagsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error('Failed to load form data:', error);
    }
  }, [profileId]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCategoryChange = (categoryId) => {
    if (categoryId) {
      const category = categories.find(c => c.id === parseInt(categoryId));
      setNewTransaction({
        ...newTransaction,
        category_id: parseInt(categoryId),
        category: category ? category.name : '',
        type: category ? category.type : newTransaction.type
      });
    } else {
      setNewTransaction({
        ...newTransaction,
        category_id: null
      });
    }
  };

  const toggleTag = (tag) => {
    if (selectedTags.find(t => t.id === tag.id)) {
      setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (3MB max)
    const maxSize = 3 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File too large! Maximum size is 3MB.');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const addTransaction = async () => {
    const transactionData = {
      ...newTransaction,
      tag_ids: selectedTags.map(t => t.id)
    };
    
    const validation = validateTransaction(transactionData);
    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      return;
    }
    
    try {
      // Create transaction first
      const transaction = await api.createTransaction(profileId, transactionData);
      
      // Upload document if selected
      if (selectedFile) {
        setUploadingFile(true);
        try {
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              await api.uploadDocument(
                transaction.id,
                event.target.result,
                selectedFile.name,
                selectedFile.type
              );
              setUploadingFile(false);
              
              // Reload the transaction with documents
              const updatedTransactions = await api.getTransactions(profileId);
              const fullTransaction = updatedTransactions.find(t => t.id === transaction.id);
              onTransactionAdded(fullTransaction || transaction);
            } catch (uploadError) {
              setUploadingFile(false);
              alert('Transaction created but document upload failed: ' + 
                (uploadError instanceof APIError ? uploadError.message : 'Unknown error'));
              onTransactionAdded(transaction);
            }
          };
          reader.readAsDataURL(selectedFile);
        } catch (error) {
          setUploadingFile(false);
          alert('Transaction created but document upload failed');
          onTransactionAdded(transaction);
        }
      } else {
        onTransactionAdded(transaction);
      }
      
      // Reset form
      setNewTransaction({
        type: 'expense',
        amount: '',
        category: '',
        category_id: null,
        account_id: null,
        tag_ids: [],
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setSelectedTags([]);
      clearFile();
    } catch (error) {
      const message = error instanceof APIError ? error.message : 'Failed to add transaction';
      alert(message);
    }
  };
  
  const filteredCategories = categories.filter(c => c.type === newTransaction.type);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 tablet:p-5 laptop:p-6">
      <h2 className="text-lg tablet:text-xl laptop:text-2xl font-semibold text-gray-900 mb-4 tablet:mb-5 laptop:mb-6">New Transaction</h2>
      <div className="grid grid-cols-1 laptop:grid-cols-2 gap-4 tablet:gap-5 laptop:gap-6">
        <div>
          <label className="block text-sm tablet:text-base font-medium text-gray-700 mb-2">Type</label>
          <select
            value={newTransaction.type}
            onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
            className="w-full px-4 py-2.5 bg-white rounded-lg text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm tablet:text-base"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div>
          <label className="block text-sm tablet:text-base font-medium text-gray-700 mb-2">Amount</label>
          <input
            type="number"
            value={newTransaction.amount}
            onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
            placeholder="0.00"
            className="w-full px-4 py-2.5 bg-white rounded-lg text-gray-900 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm tablet:text-base"
          />
        </div>

        <div>
          <label className="block text-sm tablet:text-base font-medium text-gray-700 mb-2">Category</label>
          <select
            value={newTransaction.category_id || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-white rounded-lg text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm tablet:text-base"
          >
            <option value="">Select category (or type below)</option>
            {filteredCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
          {!newTransaction.category_id && (
            <input
              type="text"
              value={newTransaction.category}
              onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
              placeholder="Or type custom category..."
              className="w-full px-4 py-2.5 bg-white rounded-lg text-gray-900 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm tablet:text-base mt-2"
            />
          )}
        </div>

        <div>
          <label className="block text-sm tablet:text-base font-medium text-gray-700 mb-2">Account</label>
          <select
            value={newTransaction.account_id || ''}
            onChange={(e) => setNewTransaction({ ...newTransaction, account_id: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full px-4 py-2.5 bg-white rounded-lg text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm tablet:text-base"
          >
            <option value="">No account (optional)</option>
            {accounts.filter(a => a.is_active).map(acc => (
              <option key={acc.id} value={acc.id}>{acc.icon} {acc.name} (${acc.balance.toFixed(2)})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm tablet:text-base font-medium text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={newTransaction.date}
            onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
            className="w-full px-4 py-2.5 bg-white rounded-lg text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm tablet:text-base"
          />
        </div>

        <div className="laptop:col-span-2">
          <label className="block text-sm tablet:text-base font-medium text-gray-700 mb-2">Description</label>
          <input
            type="text"
            value={newTransaction.description}
            onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
            placeholder="Optional..."
            className="w-full px-4 py-2.5 bg-white rounded-lg text-gray-900 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm tablet:text-base"
          />
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="laptop:col-span-2">
            <label className="block text-sm tablet:text-base font-medium text-gray-700 mb-2">Tags (optional)</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                    selectedTags.find(t => t.id === tag.id)
                      ? 'text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={selectedTags.find(t => t.id === tag.id) ? { backgroundColor: tag.color } : {}}
                >
                  {tag.name}
                  {selectedTags.find(t => t.id === tag.id) && <X className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Document Upload */}
        <div className="laptop:col-span-2">
          <label className="block text-sm tablet:text-base font-medium text-gray-700 mb-2">
            Attach Document (optional, max 3MB)
          </label>
          
          {!selectedFile ? (
            <div className="relative">
              <input
                type="file"
                id="document-upload"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
              />
              <label
                htmlFor="document-upload"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-100 transition-colors text-sm tablet:text-base"
              >
                <Upload className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600 font-medium">Upload Receipt/Proof</span>
              </label>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                {filePreview ? (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    <FileText className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col tablet:flex-row gap-3 mt-6">
        <button
          onClick={addTransaction}
          disabled={uploadingFile}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploadingFile ? 'Uploading Document...' : 'Add Transaction'}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors border border-gray-300 text-base"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TransactionForm;
