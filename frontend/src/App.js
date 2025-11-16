import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AuthForm from './components/auth/AuthForm';
import ProfileSelection from './components/profile/ProfileSelection';
import Dashboard from './components/dashboard/Dashboard';
import Settings from './components/settings/Settings';

const AuthRedirect = () => {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/profiles" replace />;
  }

  return <AuthForm />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AuthRedirect />} />
          <Route
            path="/profiles"
            element={
              <ProtectedRoute>
                <ProfileSelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/:profileId"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/:profileId"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
