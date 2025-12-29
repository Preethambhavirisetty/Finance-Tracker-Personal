import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Lock, LogIn, AlertCircle, DollarSign } from 'lucide-react';
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
    <div className="min-h-screen bg-white p-3 tablet:p-6 laptop:p-8 desktop:p-8">
      <div className="max-w-lg mx-auto bg-white">
        <div className="text-center mb-6 tablet:mb-9 laptop:mb-9 desktop:mb-9">
          <DollarSign className="w-12 h-12 tablet:w-20 tablet:h-20 laptop:w-24 laptop:h-24 desktop:w-24 desktop:h-20 text-gray-900 mx-auto mb-2 tablet:mb-4 laptop:mb-6 desktop:mb-6" />
          <h1 className="text-2xl tablet:text-5xl laptop:text-6xl desktop:text-6xl font-bold text-gray-900 mb-2 tablet:mb-3 laptop:mb-4 desktop:mb-4 px-2" style={{ letterSpacing: '0.02em' }}>MintMuse</h1>
          <p className="text-sm tablet:text-xl laptop:text-2xl desktop:text-2xl text-gray-600 font-light px-4">Smarter, Lighter Money Management</p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl tablet:rounded-3xl laptop:rounded-3xl desktop:rounded-3xl p-4 tablet:p-8 laptop:p-10 desktop:p-10 shadow-2xl border-2 border-gray-200">
          <div className="flex gap-2 tablet:gap-4 laptop:gap-4 desktop:gap-4 mb-4 tablet:mb-8 laptop:mb-10 desktop:mb-10">
            <button
              onClick={() => setShowLogin(true)}
              className={`flex-1 py-1 tablet:py-2 laptop:py-2 desktop:py-2 rounded-lg tablet:rounded-lg laptop:rounded-lg desktop:rounded-lg font-semibold transition-all duration-300 text-xs tablet:text-base laptop:text-lg desktop:text-lg ${
                showLogin
                  ? 'bg-primary text-white shadow-lg hover:bg-primary-dark'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setShowLogin(false)}
              className={`flex-1 py-1 tablet:py-2 laptop:py-2 desktop:py-2 rounded-lg tablet:rounded-lg laptop:rounded-lg desktop:rounded-lg font-semibold transition-all duration-300 text-xs tablet:text-base laptop:text-lg desktop:text-lg ${
                !showLogin
                  ? 'bg-primary text-white shadow-lg hover:bg-primary-dark'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Register
            </button>
          </div>

          {authError && (
            <div className="mb-3 tablet:mb-6 laptop:mb-8 desktop:mb-8 p-2.5 tablet:p-4 laptop:p-5 desktop:p-5 bg-red-50 border-2 border-red-200 rounded-lg tablet:rounded-2xl laptop:rounded-2xl desktop:rounded-2xl">
              <p className="text-red-700 text-center text-xs tablet:text-base laptop:text-lg desktop:text-lg">{authError}</p>
            </div>
          )}

          <form onSubmit={showLogin ? handleLogin : handleRegister}>
            <div className="space-y-3 tablet:space-y-4 laptop:space-y-5 desktop:space-y-5">
              <div>
                <label className="flex items-center gap-1.5 tablet:gap-2 laptop:gap-2 desktop:gap-2 text-gray-700 mb-1.5 tablet:mb-2 laptop:mb-3 desktop:mb-3 font-semibold text-xs tablet:text-base laptop:text-base desktop:text-base">
                  <User className="w-3.5 h-3.5 tablet:w-5 tablet:h-5 laptop:w-5 laptop:h-5 desktop:w-5 desktop:h-5" />
                  Username
                </label>
                <input
                  type="text"
                  value={authForm.username}
                  onChange={(e) => {
                    setAuthForm({ ...authForm, username: e.target.value });
                    setFieldErrors(prev => ({ ...prev, username: null }));
                  }}
                  className={`w-full px-3 tablet:px-6 laptop:px-8 desktop:px-4 py-2 tablet:py-4 laptop:py-5 desktop:py-2 bg-white rounded-lg tablet:rounded-lg laptop:rounded-xl desktop:rounded-lg text-gray-900 placeholder-gray-400 border-2 text-xs tablet:text-base laptop:text-lg desktop:text-lg ${
                    fieldErrors.username ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent`}
                  placeholder="Enter username"
                  required
                />
                {fieldErrors.username && (
                  <p className="mt-1 tablet:mt-2 laptop:mt-3 desktop:mt-3 text-[10px] tablet:text-sm laptop:text-base desktop:text-base text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 tablet:w-4 tablet:h-4 laptop:w-5 laptop:h-5 desktop:w-5 desktop:h-5" />
                    {fieldErrors.username}
                  </p>
                )}
              </div>

              {!showLogin && (
                <div>
                  <label className="flex items-center gap-1.5 tablet:gap-2 laptop:gap-2 desktop:gap-2 text-gray-700 mb-1.5 tablet:mb-2 laptop:mb-3 desktop:mb-3 font-semibold text-xs tablet:text-base laptop:text-base desktop:text-base">
                    <Mail className="w-3.5 h-3.5 tablet:w-5 tablet:h-5 laptop:w-5 laptop:h-5 desktop:w-5 desktop:h-5" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(e) => {
                      setAuthForm({ ...authForm, email: e.target.value });
                      setFieldErrors(prev => ({ ...prev, email: null }));
                    }}
                    className={`w-full px-3 tablet:px-6 laptop:px-8 desktop:px-4 py-2 tablet:py-4 laptop:py-5 desktop:py-2 bg-white rounded-lg tablet:rounded-lg laptop:rounded-xl desktop:rounded-lg text-gray-900 placeholder-gray-400 border-2 text-xs tablet:text-base laptop:text-lg desktop:text-lg ${
                      fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent`}
                    placeholder="Enter email"
                    required
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 tablet:mt-2 laptop:mt-3 desktop:mt-3 text-[10px] tablet:text-sm laptop:text-base desktop:text-base text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 tablet:w-4 tablet:h-4 laptop:w-5 laptop:h-5 desktop:w-5 desktop:h-5" />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="flex items-center gap-1.5 tablet:gap-2 laptop:gap-2 desktop:gap-2 text-gray-700 mb-1.5 tablet:mb-2 laptop:mb-3 desktop:mb-3 font-semibold text-xs tablet:text-base laptop:text-base desktop:text-base">
                  <Lock className="w-3.5 h-3.5 tablet:w-5 tablet:h-5 laptop:w-5 laptop:h-5 desktop:w-5 desktop:h-5" />
                  Password
                </label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => {
                    setAuthForm({ ...authForm, password: e.target.value });
                    setFieldErrors(prev => ({ ...prev, password: null }));
                  }}
                  className={`w-full px-3 tablet:px-6 laptop:px-8 desktop:px-4 py-2 tablet:py-4 laptop:py-5 desktop:py-2 bg-white rounded-lg tablet:rounded-lg laptop:rounded-xl desktop:rounded-lg text-gray-900 placeholder-gray-400 border-2 text-xs tablet:text-base laptop:text-lg desktop:text-lg ${
                    fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent`}
                  placeholder="Enter password"
                  required
                />
                {fieldErrors.password && (
                  <p className="mt-1 tablet:mt-2 laptop:mt-3 desktop:mt-3 text-[10px] tablet:text-sm laptop:text-base desktop:text-base text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 tablet:w-4 tablet:h-4 laptop:w-5 laptop:h-5 desktop:w-5 desktop:h-5" />
                    {fieldErrors.password}
                  </p>
                )}
                {!showLogin && passwordStrength && (
                  <div className="mt-1.5 tablet:mt-2 laptop:mt-3 desktop:mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] tablet:text-sm laptop:text-base desktop:text-base text-gray-600">Strength:</span>
                      <span className={`text-[10px] tablet:text-sm laptop:text-base desktop:text-base font-semibold ${
                        passwordStrength.level === 'weak' ? 'text-red-600' :
                        passwordStrength.level === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>{passwordStrength.text}</span>
                    </div>
                    <div className="w-full h-1.5 tablet:h-2 laptop:h-2.5 desktop:h-2.5 bg-gray-200 rounded-full overflow-hidden">
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
              className={`w-full mt-3 tablet:mt-6 laptop:mt-8 desktop:mt-8 px-4 tablet:px-6 laptop:px-8 desktop:px-4 py-2.5 tablet:py-4 laptop:py-5 desktop:py-2 bg-primary text-white rounded-lg tablet:rounded-lg laptop:rounded-xl desktop:rounded-lg font-semibold transition-all duration-300 shadow-lg flex items-center justify-center gap-2 text-sm tablet:text-lg laptop:text-xl desktop:text-lg ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-dark hover:shadow-xl'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 tablet:w-6 tablet:h-6 laptop:w-7 laptop:h-7 desktop:w-7 desktop:h-7 border-2 tablet:border-3 laptop:border-3 desktop:border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs tablet:text-base laptop:text-lg desktop:text-lg">Processing...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 tablet:w-5 tablet:h-5 laptop:w-5 laptop:h-5 desktop:w-5 desktop:h-5" />
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

