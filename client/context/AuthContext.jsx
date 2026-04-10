"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, loginUser as apiLogin, logoutUser as apiLogout } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for logged-in user on mount
    const savedUser = getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (username, role) => {
    const result = await apiLogin(username, role);
    if (result.success) {
      setUser(result.user);
      
      // Redirect based on role
      if (result.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
    return result;
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    router.push('/login');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
