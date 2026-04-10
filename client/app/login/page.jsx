"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, User, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [role, setRole] = useState('startup');
  const [username, setUsername] = useState('startup');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // For demo: pass empty password since mock store just checks username/role
    const result = await login(username, role);
    
    if (!result.success) {
      setError(result.message || 'Login failed');
    }
  };

  const handleRoleSelect = (selectedRole, defaultUsername) => {
    setRole(selectedRole);
    setUsername(defaultUsername);
    setError('');
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden selection:bg-indigo-600 selection:text-white">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl liquid-gradient flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <Sparkles className="text-white w-8 h-8 fill-white" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-br from-indigo-600 to-slate-900 bg-clip-text text-transparent tracking-tight">
              SmartDoc-AI
            </h1>
            <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold mt-1">
              Secure Access Portal
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-3xl p-8 border border-white/60 shadow-2xl shadow-slate-200/50 backdrop-blur-xl bg-white/60">
          <h2 className="text-xl font-bold text-slate-800 mb-6 font-body">Sign in to your account</h2>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            
            {/* Role Selection */}
            <div className="grid grid-cols-4 gap-2 mb-2 p-1 bg-slate-100/80 rounded-xl rounded-b-sm border border-slate-200/50">
              <button 
                type="button"
                onClick={() => handleRoleSelect('guest', 'guest')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${role === 'guest' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Guest
              </button>
              <button 
                type="button"
                onClick={() => handleRoleSelect('startup', 'startup')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${role === 'startup' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Startup
              </button>
              <button 
                type="button"
                onClick={() => handleRoleSelect('mentor', 'mentor')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${role === 'mentor' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Mentor
              </button>
              <button 
                type="button"
                onClick={() => handleRoleSelect('admin', 'admin')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${role === 'admin' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Admin
              </button>
            </div>

            {/* Credentials Fields */}
            {role !== 'guest' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="flex flex-col gap-4 overflow-hidden"
              >
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username" 
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-medium text-slate-800 placeholder:text-slate-400 outline-none"
                    required
                  />
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="password" 
                    value="password123" // Mock password visualization 
                    readOnly
                    placeholder="Password" 
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-medium text-slate-800 placeholder:text-slate-400 outline-none opacity-80 cursor-not-allowed"
                  />
                </div>
              </motion.div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 text-rose-600 text-sm font-medium rounded-xl border border-rose-100 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="mt-2 w-full py-3.5 liquid-gradient text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 transition-all text-sm tracking-wide"
            >
              {role === 'guest' ? 'Continue as Guest' : 'Authenticate Security Clearance'}
            </button>
          </form>

          {/* Demo Hint */}
          <div className="mt-8 text-center text-xs font-medium text-slate-400 border-t border-slate-200/50 pt-6">
            <p className="mb-2 uppercase tracking-wider text-[10px] font-bold text-slate-500">Demo Credentials Active</p>
            <p>Startup: <span className="text-slate-700 font-bold">startup</span> / Mentor: <span className="text-slate-700 font-bold">mentor</span> / Admin: <span className="text-slate-700 font-bold">admin</span></p>
            <p className="mt-1 text-slate-400 italic">Passwords are mapped automatically</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
