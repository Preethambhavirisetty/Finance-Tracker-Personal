// API utility functions with better error handling

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'APIError';
  }
}

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    // Handle specific status codes
    if (response.status === 401) {
      // Unauthorized - session expired or not logged in
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    } else if (response.status === 429) {
      // Rate limited
      throw new APIError(data.error || 'Too many requests. Please try again later.', response.status, data);
    } else if (response.status === 403) {
      // Forbidden
      throw new APIError(data.error || 'Access denied', response.status, data);
    }
    
    throw new APIError(data.error || 'Request failed', response.status, data);
  }
  
  return data;
};

export const api = {
  // Authentication
  register: async (username, email, password) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, email, password })
    });
    return handleResponse(response);
  },

  login: async (username, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    return handleResponse(response);
  },

  logout: async () => {
    const response = await fetch(`${API_URL}/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    return handleResponse(response);
  },

  checkAuth: async () => {
    const response = await fetch(`${API_URL}/check-auth`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Profiles
  getProfiles: async () => {
    const response = await fetch(`${API_URL}/profiles`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  createProfile: async (name) => {
    const response = await fetch(`${API_URL}/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name })
    });
    return handleResponse(response);
  },

  deleteProfile: async (profileId) => {
    const response = await fetch(`${API_URL}/profiles/${profileId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Transactions
  getTransactions: async (profileId) => {
    const response = await fetch(`${API_URL}/profiles/${profileId}/transactions`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  createTransaction: async (profileId, transaction) => {
    const response = await fetch(`${API_URL}/profiles/${profileId}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(transaction)
    });
    return handleResponse(response);
  },

  deleteTransaction: async (transactionId) => {
    const response = await fetch(`${API_URL}/transactions/${transactionId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Categories
  getCategories: async (profileId) => {
    const response = await fetch(`${API_URL}/profiles/${profileId}/categories`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  createCategory: async (profileId, category) => {
    const response = await fetch(`${API_URL}/profiles/${profileId}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(category)
    });
    return handleResponse(response);
  },

  updateCategory: async (categoryId, updates) => {
    const response = await fetch(`${API_URL}/categories/${categoryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates)
    });
    return handleResponse(response);
  },

  deleteCategory: async (categoryId) => {
    const response = await fetch(`${API_URL}/categories/${categoryId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Tags
  getTags: async (profileId) => {
    const response = await fetch(`${API_URL}/profiles/${profileId}/tags`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  createTag: async (profileId, tag) => {
    const response = await fetch(`${API_URL}/profiles/${profileId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(tag)
    });
    return handleResponse(response);
  },

  deleteTag: async (tagId) => {
    const response = await fetch(`${API_URL}/tags/${tagId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Accounts
  getAccounts: async (profileId) => {
    const response = await fetch(`${API_URL}/profiles/${profileId}/accounts`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  createAccount: async (profileId, account) => {
    const response = await fetch(`${API_URL}/profiles/${profileId}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(account)
    });
    return handleResponse(response);
  },

  updateAccount: async (accountId, updates) => {
    const response = await fetch(`${API_URL}/accounts/${accountId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates)
    });
    return handleResponse(response);
  },

  deleteAccount: async (accountId) => {
    const response = await fetch(`${API_URL}/accounts/${accountId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Budgets
  getBudgets: async (profileId, month, year) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    const response = await fetch(`${API_URL}/profiles/${profileId}/budgets${queryString}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  createBudget: async (profileId, budget) => {
    const response = await fetch(`${API_URL}/profiles/${profileId}/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(budget)
    });
    return handleResponse(response);
  },

  updateBudget: async (budgetId, updates) => {
    const response = await fetch(`${API_URL}/budgets/${budgetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates)
    });
    return handleResponse(response);
  },

  deleteBudget: async (budgetId) => {
    const response = await fetch(`${API_URL}/budgets/${budgetId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  },

  // Documents
  uploadDocument: async (transactionId, fileData, filename, fileType) => {
    const response = await fetch(`${API_URL}/transactions/${transactionId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ file_data: fileData, filename, file_type: fileType })
    });
    return handleResponse(response);
  },

  getDocumentData: async (documentId) => {
    const response = await fetch(`${API_URL}/documents/${documentId}/data`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },

  deleteDocument: async (documentId) => {
    const response = await fetch(`${API_URL}/documents/${documentId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  }
};

export { APIError };

