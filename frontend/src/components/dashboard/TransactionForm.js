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
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border-2 border-gray-200 mb-4 sm:mb-8">
      <h2 className="text-base sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-3 sm:mb-6">New Transaction</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
        <div>
          <label className="block text-gray-700 mb-1.5 sm:mb-2 font-semibold text-xs sm:text-base md:text-lg">Type</label>
          <select
            value={newTransaction.type}
            onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
            className="w-full px-3 sm:px-5 md:px-6 py-2 sm:py-3.5 md:py-4 bg-white rounded-lg sm:rounded-2xl text-gray-900 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm text-xs sm:text-base"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-1.5 sm:mb-2 font-semibold text-xs sm:text-base md:text-lg">Amount</label>
          <input
            type="number"
            value={newTransaction.amount}
            onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
            placeholder="0.00"
            className="w-full px-3 sm:px-5 md:px-6 py-2 sm:py-3.5 md:py-4 bg-white rounded-lg sm:rounded-2xl text-gray-900 placeholder-gray-400 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm text-xs sm:text-base"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1.5 sm:mb-2 font-semibold text-xs sm:text-base md:text-lg">Category</label>
          <select
            value={newTransaction.category_id || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 sm:px-5 md:px-6 py-2 sm:py-3.5 md:py-4 bg-white rounded-lg sm:rounded-2xl text-gray-900 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm text-xs sm:text-base"
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
              className="w-full px-3 sm:px-5 md:px-6 py-2 sm:py-3 md:py-3.5 bg-white rounded-lg sm:rounded-2xl text-gray-900 placeholder-gray-400 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm text-xs sm:text-base mt-2"
            />
          )}
        </div>

        <div>
          <label className="block text-gray-700 mb-1.5 sm:mb-2 font-semibold text-xs sm:text-base md:text-lg">Account</label>
          <select
            value={newTransaction.account_id || ''}
            onChange={(e) => setNewTransaction({ ...newTransaction, account_id: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full px-3 sm:px-5 md:px-6 py-2 sm:py-3.5 md:py-4 bg-white rounded-lg sm:rounded-2xl text-gray-900 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm text-xs sm:text-base"
          >
            <option value="">No account (optional)</option>
            {accounts.filter(a => a.is_active).map(acc => (
              <option key={acc.id} value={acc.id}>{acc.icon} {acc.name} (${acc.balance.toFixed(2)})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-1.5 sm:mb-2 font-semibold text-xs sm:text-base md:text-lg">Date</label>
          <input
            type="date"
            value={newTransaction.date}
            onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
            className="w-full px-3 sm:px-5 md:px-6 py-2 sm:py-3.5 md:py-4 bg-white rounded-lg sm:rounded-2xl text-gray-900 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm text-xs sm:text-base"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-1.5 sm:mb-2 font-semibold text-xs sm:text-base md:text-lg">Description</label>
          <input
            type="text"
            value={newTransaction.description}
            onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
            placeholder="Optional..."
            className="w-full px-3 sm:px-5 md:px-6 py-2 sm:py-3.5 md:py-4 bg-white rounded-lg sm:rounded-2xl text-gray-900 placeholder-gray-400 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent shadow-sm text-xs sm:text-base"
          />
        </div>

               {/* Tags */}
               {tags.length > 0 && (
                 <div className="md:col-span-2">
                   <label className="block text-gray-700 mb-2 font-semibold text-xs sm:text-base md:text-lg">Tags (optional)</label>
                   <div className="flex flex-wrap gap-2">
                     {tags.map(tag => (
                       <button
                         key={tag.id}
                         type="button"
                         onClick={() => toggleTag(tag)}
                         className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1 ${
                           selectedTags.find(t => t.id === tag.id)
                             ? 'text-white shadow-md'
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
               <div className="md:col-span-2">
                 <label className="block text-gray-700 mb-2 font-semibold text-xs sm:text-base md:text-lg">
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
                       className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-white border-2 border-dashed border-gray-300 rounded-lg sm:rounded-2xl cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all text-xs sm:text-base"
                     >
                       <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                       <span className="text-gray-600 font-medium">Upload Receipt/Proof</span>
                     </label>
                   </div>
                 ) : (
                   <div className="bg-white border-2 border-gray-300 rounded-lg sm:rounded-2xl p-3 sm:p-4">
                     <div className="flex items-start gap-3">
                       {filePreview ? (
                         <img
                           src={filePreview}
                           alt="Preview"
                           className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                         />
                       ) : (
                         <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                           <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                         </div>
                       )}
                       <div className="flex-1 min-w-0">
                         <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{selectedFile.name}</p>
                         <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                       </div>
                       <button
                         type="button"
                         onClick={clearFile}
                         className="p-1.5 sm:p-2 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                       >
                         <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                       </button>
                     </div>
                   </div>
                 )}
               </div>
             </div>

             <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3 sm:mt-6">
               <button
                 onClick={addTransaction}
                 disabled={uploadingFile}
                 className="flex-1 px-4 sm:px-6 py-2.5 sm:py-4 bg-green-600 text-white rounded-lg sm:rounded-2xl font-semibold hover:bg-green-700 transition-all duration-300 shadow-lg text-xs sm:text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {uploadingFile ? 'Uploading Document...' : 'Add Transaction'}
               </button>
        <button
          onClick={onCancel}
          className="px-4 sm:px-6 py-2.5 sm:py-4 bg-white text-gray-900 rounded-lg sm:rounded-2xl font-semibold hover:bg-gray-100 transition-all duration-300 border-2 border-gray-300 text-xs sm:text-base md:text-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TransactionForm;

