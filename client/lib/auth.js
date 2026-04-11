import { API_URL } from '@/lib/config';

export const loginUser = async (username, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    }
    return { success: false, message: data.message };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Server error during login' };
  }
};

export const registerUser = async (name, username, password, role) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, password, role })
    });
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    }
    return { success: false, message: data.message };
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, message: 'Server error during registration' };
  }
};

export const logoutUser = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

export const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};
