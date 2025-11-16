import React, { useState } from 'react';
import { Calendar, DollarSign, Tag, Wallet, FileText, TrendingUp, TrendingDown, Download, Eye, X as XIcon } from 'lucide-react';
import Modal from '../common/Modal';
import { api, APIError } from '../../utils/api';

const TransactionDetailModal = ({ transaction, isOpen, onClose, onDocumentDeleted }) => {
  const [deletingDoc, setDeletingDoc] = useState(null);
  
  if (!transaction) return null;

  const handleDownload = async (doc) => {
    try {
      const data = await api.getDocumentData(doc.id);
      const link = document.createElement('a');
      link.href = data.file_data;
      link.download = doc.filename;
      link.click();
    } catch (error) {
      alert(error instanceof APIError ? error.message : 'Failed to download document');
    }
  };

  const handlePreview = async (doc) => {
    try {
      const data = await api.getDocumentData(doc.id);
      window.open(data.file_data, '_blank');
    } catch (error) {
      alert(error instanceof APIError ? error.message : 'Failed to preview document');
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete ${doc.filename}?`)) return;
    
    setDeletingDoc(doc.id);
    try {
      await api.deleteDocument(doc.id);
      if (onDocumentDeleted) {
        onDocumentDeleted(doc.id);
      }
      alert('Document deleted successfully');
    } catch (error) {
      alert(error instanceof APIError ? error.message : 'Failed to delete document');
    } finally {
      setDeletingDoc(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transaction Details">
      <div className="space-y-3 sm:space-y-4">
        {/* Type & Amount */}
        <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg sm:rounded-xl">
          <div className="flex items-center gap-2 sm:gap-3">
            {transaction.type === 'income' ? (
              <div className="p-2 sm:p-2.5 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
              </div>
            ) : (
              <div className="p-2 sm:p-2.5 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-700" />
              </div>
            )}
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Type</p>
              <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 capitalize">{transaction.type}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs sm:text-sm text-gray-600">Amount</p>
            <p className={`text-lg sm:text-2xl md:text-3xl font-bold ${transaction.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
              {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Category */}
        <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl">
          <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs sm:text-sm text-gray-600 mb-0.5">Category</p>
            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">{transaction.category}</p>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl">
          <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs sm:text-sm text-gray-600 mb-0.5">Date</p>
            <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
              {new Date(transaction.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Description */}
        {transaction.description && (
          <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl">
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-gray-600 mb-0.5">Description</p>
              <p className="text-sm sm:text-base text-gray-900">{transaction.description}</p>
            </div>
          </div>
        )}

        {/* Account */}
        {transaction.account_id && (
          <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-gray-600 mb-0.5">Account</p>
              <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">Account #{transaction.account_id}</p>
            </div>
          </div>
        )}

        {/* Tags */}
        {transaction.tags && transaction.tags.length > 0 && (
          <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl">
            <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg">
              <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {transaction.tags.map(tag => (
                  <span
                    key={tag.id}
                    className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Documents */}
        {transaction.documents && transaction.documents.length > 0 && (
          <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Attached Documents</p>
              <div className="space-y-2">
                {transaction.documents.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{doc.filename}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(doc.file_size)}</p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 ml-2">
                      <button
                        onClick={() => handlePreview(doc)}
                        className="p-1 sm:p-1.5 hover:bg-blue-100 rounded transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-1 sm:p-1.5 hover:bg-green-100 rounded transition-colors"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={deletingDoc === doc.id}
                        className="p-1 sm:p-1.5 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <XIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Created At */}
        <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
          <p className="text-xs sm:text-sm text-gray-600">Created</p>
          <p className="text-xs sm:text-sm text-gray-900">
            {new Date(transaction.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default TransactionDetailModal;

