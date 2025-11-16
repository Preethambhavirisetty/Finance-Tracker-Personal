import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-white rounded-xl sm:rounded-2xl shadow-2xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl z-10">
          <h2 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

