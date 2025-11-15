import React from 'react';
import { Navigate } from 'react-router-dom';
import { DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        <div className="text-center">
          <DollarSign className="w-20 h-20 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-2xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

