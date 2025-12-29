import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LandingPage from './components/landing/LandingPage';
import AuthForm from './components/auth/AuthForm';
import ProfileSelection from './components/profile/ProfileSelection';
import Dashboard from './components/dashboard/Dashboard';
import Settings from './components/settings/Settings';
import AllTransactions from './components/transactions/AllTransactions';

const AuthRedirect = () => {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/profiles" replace />;
  }

  return <LandingPage />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AuthRedirect />} />
          <Route path="/auth" element={<AuthForm />} />
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
          <Route
            path="/transactions/:profileId"
            element={
              <ProtectedRoute>
                <AllTransactions />
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
