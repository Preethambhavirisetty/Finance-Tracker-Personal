import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Lock, LogIn, AlertCircle, DollarSign, ArrowLeft } from 'lucide-react';
import { api, APIError } from '../../utils/api';
import { validateEmail, validateUsername, validatePassword, getPasswordStrength } from '../../utils/validation';
import { useAuth } from '../../context/AuthContext';

const AuthForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showLogin, setShowLogin] = useState(location.state?.mode !== 'signup');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authForm, setAuthForm] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [authError, setAuthError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!showLogin && authForm.password) {
      setPasswordStrength(getPasswordStrength(authForm.password));
    } else {
      setPasswordStrength(null);
    }
  }, [authForm.password, showLogin]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setFieldErrors({});
    setIsSubmitting(true);
    
    const usernameValidation = validateUsername(authForm.username);
    if (!usernameValidation.valid) {
      setFieldErrors(prev => ({ ...prev, username: usernameValidation.error }));
      setIsSubmitting(false);
      return;
    }

    if (!validateEmail(authForm.email)) {
      setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      setIsSubmitting(false);
      return;
    }

    const passwordValidation = validatePassword(authForm.password);
    if (!passwordValidation.valid) {
      setFieldErrors(prev => ({ ...prev, password: passwordValidation.error }));
      setIsSubmitting(false);
      return;
    }
    
    try {
      const data = await api.register(authForm.username, authForm.email, authForm.password);
      login(data.user);
      navigate('/profiles');
    } catch (error) {
      if (error instanceof APIError) {
        setAuthError(error.message);
      } else {
        setAuthError('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setFieldErrors({});
    setIsSubmitting(true);
    
    if (!authForm.username || !authForm.password) {
      setAuthError('Username and password are required');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const data = await api.login(authForm.username, authForm.password);
      login(data.user);
      navigate('/profiles');
    } catch (error) {
      if (error instanceof APIError) {
        setAuthError(error.message);
      } else {
        setAuthError('Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6 md:p-8" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6 sm:mb-12">
          <DollarSign className="w-12 h-12 sm:w-20 sm:h-20 text-gray-900 mx-auto mb-2 sm:mb-4" />
          <h1 className="text-2xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-2 sm:mb-4 px-2" style={{ letterSpacing: '0.02em' }}>Finance Tracker</h1>
          <p className="text-sm sm:text-xl text-gray-600 font-light italic px-4">Manage your wealth with elegance</p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl border-2 border-gray-200">
          <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-8">
            <button
              onClick={() => setShowLogin(true)}
              className={`flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-base ${
                showLogin
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setShowLogin(false)}
              className={`flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-base ${
                !showLogin
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Register
            </button>
          </div>

          {authError && (
            <div className="mb-3 sm:mb-6 p-2.5 sm:p-4 bg-red-50 border-2 border-red-200 rounded-lg sm:rounded-2xl">
              <p className="text-red-700 text-center text-xs sm:text-base">{authError}</p>
            </div>
          )}

          <form onSubmit={showLogin ? handleLogin : handleRegister}>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="flex items-center gap-1.5 sm:gap-2 text-gray-700 mb-1.5 sm:mb-2 font-semibold text-xs sm:text-base">
                  <User className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  Username
                </label>
                <input
                  type="text"
                  value={authForm.username}
                  onChange={(e) => {
                    setAuthForm({ ...authForm, username: e.target.value });
                    setFieldErrors(prev => ({ ...prev, username: null }));
                  }}
                  className={`w-full px-3 sm:px-6 py-2 sm:py-4 bg-white rounded-lg sm:rounded-2xl text-gray-900 placeholder-gray-400 border-2 text-xs sm:text-base ${
                    fieldErrors.username ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent`}
                  placeholder="Enter username"
                  required
                />
                {fieldErrors.username && (
                  <p className="mt-1 sm:mt-2 text-[10px] sm:text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    {fieldErrors.username}
                  </p>
                )}
              </div>

              {!showLogin && (
                <div>
                  <label className="flex items-center gap-1.5 sm:gap-2 text-gray-700 mb-1.5 sm:mb-2 font-semibold text-xs sm:text-base">
                    <Mail className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(e) => {
                      setAuthForm({ ...authForm, email: e.target.value });
                      setFieldErrors(prev => ({ ...prev, email: null }));
                    }}
                    className={`w-full px-3 sm:px-6 py-2 sm:py-4 bg-white rounded-lg sm:rounded-2xl text-gray-900 placeholder-gray-400 border-2 text-xs sm:text-base ${
                      fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent`}
                    placeholder="Enter email"
                    required
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 sm:mt-2 text-[10px] sm:text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="flex items-center gap-1.5 sm:gap-2 text-gray-700 mb-1.5 sm:mb-2 font-semibold text-xs sm:text-base">
                  <Lock className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  Password
                </label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => {
                    setAuthForm({ ...authForm, password: e.target.value });
                    setFieldErrors(prev => ({ ...prev, password: null }));
                  }}
                  className={`w-full px-3 sm:px-6 py-2 sm:py-4 bg-white rounded-lg sm:rounded-2xl text-gray-900 placeholder-gray-400 border-2 text-xs sm:text-base ${
                    fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent`}
                  placeholder="Enter password"
                  required
                />
                {fieldErrors.password && (
                  <p className="mt-1 sm:mt-2 text-[10px] sm:text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    {fieldErrors.password}
                  </p>
                )}
                {!showLogin && passwordStrength && (
                  <div className="mt-1.5 sm:mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] sm:text-sm text-gray-600">Strength:</span>
                      <span className={`text-[10px] sm:text-sm font-semibold ${
                        passwordStrength.level === 'weak' ? 'text-red-600' :
                        passwordStrength.level === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>{passwordStrength.text}</span>
                    </div>
                    <div className="w-full h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ 
                          width: passwordStrength.level === 'weak' ? '33%' :
                                 passwordStrength.level === 'medium' ? '66%' : '100%'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full mt-3 sm:mt-6 px-4 sm:px-6 py-2.5 sm:py-4 bg-gray-900 text-white rounded-lg sm:rounded-2xl font-semibold transition-all duration-300 shadow-lg flex items-center justify-center gap-2 text-sm sm:text-lg ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800 hover:shadow-xl'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 sm:border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs sm:text-base">Processing...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 sm:w-6 sm:h-6" />
                  {showLogin ? 'Login' : 'Register'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;

