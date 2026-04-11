"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getCurrentUser,
  loginUser as apiLogin,
  registerUser as apiRegister,
  logoutUser as apiLogout
} from '@/lib/auth';
import { useRouter } from 'next/navigation';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser) setUser(savedUser);
    setLoading(false);
  }, []);

  const _redirectForRole = (role) => {
    if (role === 'admin') router.push('/admin');
    else router.push('/dashboard');
  };

  const login = async (username, password) => {
    const result = await apiLogin(username, password);
    if (result.success) {
      setUser(result.user);
      _redirectForRole(result.user.role);
    }
    return result;
  };

  const register = async (name, username, password, role) => {
    const result = await apiRegister(name, username, password, role);
    if (result.success) {
      setUser(result.user);
      _redirectForRole(result.user.role);
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
    register,
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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
