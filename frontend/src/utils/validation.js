// Frontend validation utilities

export const validateEmail = (email) => {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return pattern.test(email);
};

export const validateUsername = (username) => {
  if (!username || username.length < 3 || username.length > 80) {
    return { valid: false, error: 'Username must be between 3 and 80 characters' };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  
  return { valid: true };
};

export const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password must be less than 128 characters' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  
  return { valid: true };
};

export const getPasswordStrength = (password) => {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  if (strength <= 2) return { level: 'weak', color: 'bg-red-500', text: 'Weak' };
  if (strength <= 4) return { level: 'medium', color: 'bg-yellow-500', text: 'Medium' };
  return { level: 'strong', color: 'bg-green-500', text: 'Strong' };
};

export const validateTransaction = (transaction) => {
  const errors = [];
  
  if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
    errors.push('Transaction type must be either income or expense');
  }
  
  const amount = parseFloat(transaction.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.push('Amount must be a positive number');
  }
  
  if (amount > 999999999) {
    errors.push('Amount is too large');
  }
  
  if (!transaction.category || transaction.category.trim().length === 0) {
    errors.push('Category is required');
  }
  
  if (transaction.category && transaction.category.length > 100) {
    errors.push('Category is too long (max 100 characters)');
  }
  
  if (!transaction.date) {
    errors.push('Date is required');
  }
  
  if (transaction.description && transaction.description.length > 500) {
    errors.push('Description is too long (max 500 characters)');
  }
  
  return { valid: errors.length === 0, errors };
};

export const validateProfileName = (name) => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Profile name is required' };
  }
  
  if (name.length > 100) {
    return { valid: false, error: 'Profile name is too long (max 100 characters)' };
  }
  
  return { valid: true };
};

