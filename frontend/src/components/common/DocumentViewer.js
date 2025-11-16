import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, RotateCw } from 'lucide-react';

const DocumentViewer = ({ document, fileData, isOpen, onClose, onDownload }) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !document || !fileData) return null;

  const isImage = document.file_type?.startsWith('image/');
  const isPDF = document.file_type === 'application/pdf';

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white hover:bg-gray-100 text-gray-900 p-2 rounded-full shadow-lg transition-colors z-50"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Controls */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-white/90 backdrop-blur-md rounded-lg shadow-lg p-2 flex items-center gap-2 z-50">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 50}
          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
        </button>
        <span className="text-xs sm:text-sm font-medium text-gray-900 min-w-[3rem] text-center">{zoom}%</span>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 200}
          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
        </button>
        {isImage && (
          <button
            onClick={handleRotate}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded transition-colors ml-1 sm:ml-2"
            title="Rotate"
          >
            <RotateCw className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
          </button>
        )}
        <button
          onClick={onDownload}
          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded transition-colors ml-1 sm:ml-2"
          title="Download"
        >
          <Download className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
        </button>
      </div>

      {/* Document info */}
      <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 bg-white/90 backdrop-blur-md rounded-lg shadow-lg p-2 sm:p-3 z-50">
        <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{document.filename}</p>
        <p className="text-xs text-gray-600">
          {document.file_type} • {(document.file_size / 1024).toFixed(2)} KB
        </p>
      </div>

      {/* Content */}
      <div className="w-full h-full flex items-center justify-center overflow-auto p-16 sm:p-20">
        {isImage ? (
          <img
            src={fileData}
            alt={document.filename}
            className="max-w-full max-h-full object-contain transition-all duration-200"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center'
            }}
          />
        ) : isPDF ? (
          <iframe
            src={fileData}
            title={document.filename}
            className="w-full h-full bg-white rounded-lg"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center top',
              minHeight: '600px'
            }}
          />
        ) : (
          <div className="bg-white rounded-lg p-6 sm:p-8 text-center max-w-md">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Preview Not Available</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              This file type cannot be previewed in the browser.
            </p>
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
            >
              Download File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;

