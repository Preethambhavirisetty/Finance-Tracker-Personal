import React, { useState, useEffect } from 'react';
import { Calendar, Tag, Wallet, FileText, TrendingUp, TrendingDown, Download, Eye, X as XIcon } from 'lucide-react';
import Modal from '../common/Modal';
import DocumentViewer from '../common/DocumentViewer';
import { api, APIError } from '../../utils/api';
import { useParams } from 'react-router-dom';

const TransactionDetailModal = ({ transaction, isOpen, onClose, onDocumentDeleted }) => {
  const { profileId } = useParams();
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [accountName, setAccountName] = useState(null);
  
  useEffect(() => {
    const fetchAccountName = async () => {
      if (transaction?.account_id && profileId) {
        try {
          const accounts = await api.getAccounts(profileId);
          const account = accounts.find(acc => acc.id === transaction.account_id);
          if (account) {
            setAccountName(account.name);
          }
        } catch (error) {
          console.error('Failed to fetch account:', error);
        }
      } else {
        setAccountName(null);
      }
    };

    if (isOpen && transaction) {
      fetchAccountName();
    }
  }, [transaction, profileId, isOpen]);
  
  if (!transaction) return null;

  const handleDownload = async (doc) => {
    try {
      const data = await api.getDocumentData(doc.id);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = data.file_data;
      link.download = doc.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert(error instanceof APIError ? error.message : 'Failed to download document');
    }
  };

  const handlePreview = async (doc) => {
    try {
      const data = await api.getDocumentData(doc.id);
      
      // Validate that we have file data
      if (!data.file_data || !data.file_data.startsWith('data:')) {
        alert('Invalid file data. Cannot preview document.');
        return;
      }
      
      setPreviewDoc(doc);
      setPreviewData(data.file_data);
      setShowViewer(true);
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
      <div className="space-y-3 tablet:space-y-3 laptop:space-y-4">
        {/* Type & Amount */}
        <div className="flex items-center justify-between p-3 tablet:p-3 laptop:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg tablet:rounded-lg laptop:rounded-xl">
          <div className="flex items-center gap-2 tablet:gap-2.5 laptop:gap-3">
            {transaction.type === 'income' ? (
              <div className="p-2 tablet:p-2 laptop:p-2.5 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 tablet:w-5 tablet:h-5 laptop:w-6 laptop:h-6 text-green-700" />
              </div>
            ) : (
              <div className="p-2 tablet:p-2 laptop:p-2.5 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 tablet:w-5 tablet:h-5 laptop:w-6 laptop:h-6 text-red-700" />
              </div>
            )}
            <div>
              <p className="text-xs tablet:text-xs laptop:text-sm text-gray-600">Type</p>
              <p className="text-sm tablet:text-sm laptop:text-base desktop:text-lg font-semibold text-gray-900 capitalize">{transaction.type}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs tablet:text-xs laptop:text-sm text-gray-600">Amount</p>
            <p className={`text-lg tablet:text-xl laptop:text-2xl desktop:text-3xl font-bold ${transaction.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
              {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Category */}
        <div className="flex items-start gap-2 tablet:gap-2.5 laptop:gap-3 p-3 tablet:p-3 laptop:p-4 border border-gray-200 rounded-lg tablet:rounded-lg laptop:rounded-xl">
          <div className="p-1.5 tablet:p-1.5 laptop:p-2 bg-gray-100 rounded-lg">
            <FileText className="w-4 h-4 tablet:w-4 tablet:h-4 laptop:w-5 laptop:h-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs tablet:text-xs laptop:text-sm text-gray-600 mb-0.5">Category</p>
            <p className="text-sm tablet:text-sm laptop:text-base desktop:text-lg font-semibold text-gray-900">{transaction.category}</p>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-start gap-2 tablet:gap-2.5 laptop:gap-3 p-3 tablet:p-3 laptop:p-4 border border-gray-200 rounded-lg tablet:rounded-lg laptop:rounded-xl">
          <div className="p-1.5 tablet:p-1.5 laptop:p-2 bg-blue-100 rounded-lg">
            <Calendar className="w-4 h-4 tablet:w-4 tablet:h-4 laptop:w-5 laptop:h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs tablet:text-xs laptop:text-sm text-gray-600 mb-0.5">Date</p>
            <p className="text-sm tablet:text-sm laptop:text-base desktop:text-lg font-semibold text-gray-900">
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
          <div className="flex items-start gap-2 tablet:gap-2.5 laptop:gap-3 p-3 tablet:p-3 laptop:p-4 border border-gray-200 rounded-lg tablet:rounded-lg laptop:rounded-xl">
            <div className="p-1.5 tablet:p-1.5 laptop:p-2 bg-purple-100 rounded-lg">
              <FileText className="w-4 h-4 tablet:w-4 tablet:h-4 laptop:w-5 laptop:h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs tablet:text-xs laptop:text-sm text-gray-600 mb-0.5">Description</p>
              <p className="text-sm tablet:text-sm laptop:text-base text-gray-900">{transaction.description}</p>
            </div>
          </div>
        )}

        {/* Account */}
        {transaction.account_id && (
          <div className="flex items-start gap-2 tablet:gap-2.5 laptop:gap-3 p-3 tablet:p-3 laptop:p-4 border border-gray-200 rounded-lg tablet:rounded-lg laptop:rounded-xl">
            <div className="p-1.5 tablet:p-1.5 laptop:p-2 bg-green-100 rounded-lg">
              <Wallet className="w-4 h-4 tablet:w-4 tablet:h-4 laptop:w-5 laptop:h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs tablet:text-xs laptop:text-sm text-gray-600 mb-0.5">Account</p>
              <p className="text-sm tablet:text-sm laptop:text-base desktop:text-lg font-semibold text-gray-900">
                {accountName || `Account #${transaction.account_id}`}
              </p>
            </div>
          </div>
        )}

        {/* Tags */}
        {transaction.tags && transaction.tags.length > 0 && (
          <div className="flex items-start gap-2 tablet:gap-2.5 laptop:gap-3 p-3 tablet:p-3 laptop:p-4 border border-gray-200 rounded-lg tablet:rounded-lg laptop:rounded-xl">
            <div className="p-1.5 tablet:p-1.5 laptop:p-2 bg-indigo-100 rounded-lg">
              <Tag className="w-4 h-4 tablet:w-4 tablet:h-4 laptop:w-5 laptop:h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs tablet:text-xs laptop:text-sm text-gray-600 mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5 tablet:gap-1.5 laptop:gap-2">
                {transaction.tags.map(tag => (
                  <span
                    key={tag.id}
                    className="px-2 tablet:px-2 laptop:px-2.5 py-0.5 tablet:py-0.5 laptop:py-1 rounded-full text-xs tablet:text-xs laptop:text-sm font-medium text-white"
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
          <div className="p-3 tablet:p-3 laptop:p-4 border border-gray-200 rounded-lg tablet:rounded-lg laptop:rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 tablet:p-1.5 laptop:p-2 bg-blue-100 rounded-lg">
                <FileText className="w-4 h-4 tablet:w-4 tablet:h-4 laptop:w-5 laptop:h-5 text-blue-600" />
              </div>
              <p className="text-xs tablet:text-xs laptop:text-sm font-semibold text-gray-700">Attached Documents</p>
            </div>
            <div className="space-y-2 max-w-full overflow-hidden">
              {transaction.documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center gap-2 p-2 tablet:p-2 laptop:p-2.5 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-xs tablet:text-xs laptop:text-sm font-semibold text-gray-900 truncate">{doc.filename}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(doc.file_size)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handlePreview(doc)}
                      className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-3.5 h-3.5 tablet:w-3.5 tablet:h-3.5 laptop:w-4 laptop:h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-1.5 hover:bg-green-100 rounded transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5 tablet:w-3.5 tablet:h-3.5 laptop:w-4 laptop:h-4 text-green-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      disabled={deletingDoc === doc.id}
                      className="p-1.5 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <XIcon className="w-3.5 h-3.5 tablet:w-3.5 tablet:h-3.5 laptop:w-4 laptop:h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Created At */}
        <div className="flex items-center justify-between p-3 tablet:p-3 laptop:p-4 bg-gray-50 rounded-lg tablet:rounded-lg laptop:rounded-xl">
          <p className="text-xs tablet:text-xs laptop:text-sm text-gray-600">Created</p>
          <p className="text-xs tablet:text-xs laptop:text-sm text-gray-900">
            {new Date(transaction.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Document Viewer */}
      <DocumentViewer
        document={previewDoc}
        fileData={previewData}
        isOpen={showViewer}
        onClose={() => {
          setShowViewer(false);
          setPreviewDoc(null);
          setPreviewData(null);
        }}
        onDownload={() => previewDoc && handleDownload(previewDoc)}
      />
    </Modal>
  );
};

export default TransactionDetailModal;

