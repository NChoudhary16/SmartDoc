import { API_URL } from '@/lib/config';

export const mockUsers = [
  { id: 1, name: 'System Admin', username: 'admin', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=admin' },
  { id: 2, name: 'Aarav Sharma', username: 'startup', role: 'startup', avatar: 'https://i.pravatar.cc/150?u=startup' },
  { id: 3, name: 'Priya Menon', username: 'mentor', role: 'mentor', avatar: 'https://i.pravatar.cc/150?u=mentor' },
  { id: 4, name: 'Guest User', username: 'guest', role: 'guest', avatar: 'https://i.pravatar.cc/150?u=guest' }
];

export const loginUser = async (username, role) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, role })
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
  } catch (error) {
    return null;
  }
};

export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

/**
 * Returns fetch headers with authorization token
 */
export const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};
