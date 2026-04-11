"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, User, KeyRound, Shield, Mail,
  ArrowRight, UserPlus, LogIn, Eye, EyeOff,
  Building2, GraduationCap, Users
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const ROLES = [
  { value: 'startup', label: 'Startup', icon: Building2, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200', activeBg: 'bg-violet-600' },
  { value: 'mentor',  label: 'Mentor',  icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', activeBg: 'bg-indigo-600' },
  { value: 'guest',   label: 'Guest',   icon: Users, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', activeBg: 'bg-slate-600' },
];

const DEMO_ACCOUNTS = [
  { label: 'Admin',   username: 'admin',   password: 'admin123',    role: 'admin' },
  { label: 'Startup', username: 'startup', password: 'password123', role: 'startup' },
  { label: 'Mentor',  username: 'mentor',  password: 'password123', role: 'mentor' },
];

export default function LoginPage() {
  const { login, register, loading } = useAuth();
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'
  const [showPw, setShowPw] = useState(false);

  // Sign-in state
  const [siUsername, setSiUsername] = useState('');
  const [siPassword, setSiPassword] = useState('');

  // Sign-up state
  const [suName,     setSuName]     = useState('');
  const [suUsername, setSuUsername] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suRole,     setSuRole]     = useState('startup');

  const [error, setError]   = useState('');
  const [busy,  setBusy]    = useState(false);

  if (loading) return null;

  const switchTab = (t) => { setTab(t); setError(''); setShowPw(false); };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    if (!siUsername || !siPassword) { setError('Enter username and password'); return; }
    setBusy(true);
    const result = await login(siUsername, siPassword);
    if (!result.success) setError(result.message || 'Sign in failed');
    setBusy(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    if (!suName || !suUsername || !suPassword) { setError('All fields are required'); return; }
    if (suPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setBusy(true);
    const result = await register(suName, suUsername, suPassword, suRole);
    if (!result.success) setError(result.message || 'Registration failed');
    setBusy(false);
  };

  const quickLogin = async (acc) => {
    setError('');
    setBusy(true);
    const result = await login(acc.username, acc.password);
    if (!result.success) setError(result.message || 'Quick login failed');
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-500/8 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl liquid-gradient flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <Sparkles className="text-white w-8 h-8 fill-white" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-linear-to-br from-indigo-600 to-slate-900 bg-clip-text text-transparent tracking-tight">
              SmartDoc-AI
            </h1>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold mt-1">
              Secure Access Portal
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-3xl overflow-hidden border border-white/60 shadow-2xl shadow-slate-200/50">

          {/* Tab switcher */}
          <div className="flex border-b border-slate-100">
            {[
              { key: 'signin', label: 'Sign In', icon: LogIn },
              { key: 'signup', label: 'Sign Up', icon: UserPlus }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => switchTab(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all ${
                  tab === key
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {tab === 'signin' ? (
                <motion.form
                  key="signin"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.22 }}
                  onSubmit={handleSignIn}
                  className="flex flex-col gap-4"
                >
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-1">Welcome back</h2>
                    <p className="text-xs text-slate-400 font-medium">Sign in to your SmartDoc account</p>
                  </div>

                  {/* Username */}
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="si-username"
                      type="text"
                      value={siUsername}
                      onChange={(e) => setSiUsername(e.target.value)}
                      placeholder="Username"
                      className="w-full pl-10 pr-4 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium text-slate-800 placeholder:text-slate-400 outline-none text-sm"
                      autoComplete="username"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="si-password"
                      type={showPw ? 'text' : 'password'}
                      value={siPassword}
                      onChange={(e) => setSiPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full pl-10 pr-10 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium text-slate-800 placeholder:text-slate-400 outline-none text-sm"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-rose-50 text-rose-600 text-sm font-medium rounded-xl border border-rose-100 flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4 shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="mt-1 w-full py-3.5 liquid-gradient text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 transition-all text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {busy ? (
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <><ArrowRight size={16} /> Sign In</>
                    )}
                  </button>

                  {/* Quick-login demo strips */}
                  <div className="mt-2 border-t border-slate-100 pt-4">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3 text-center">Quick Demo Access</p>
                    <div className="flex gap-2">
                      {DEMO_ACCOUNTS.map((acc) => (
                        <button
                          key={acc.label}
                          type="button"
                          onClick={() => quickLogin(acc)}
                          disabled={busy}
                          className="flex-1 py-2 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-lg text-xs font-bold text-slate-500 hover:text-indigo-600 transition-all"
                        >
                          {acc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.22 }}
                  onSubmit={handleSignUp}
                  className="flex flex-col gap-4"
                >
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-1">Create account</h2>
                    <p className="text-xs text-slate-400 font-medium">Join SmartDoc-AI and automate your documents</p>
                  </div>

                  {/* Full Name */}
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="su-name"
                      type="text"
                      value={suName}
                      onChange={(e) => setSuName(e.target.value)}
                      placeholder="Full name"
                      className="w-full pl-10 pr-4 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium text-slate-800 placeholder:text-slate-400 outline-none text-sm"
                      required
                    />
                  </div>

                  {/* Username */}
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="su-username"
                      type="text"
                      value={suUsername}
                      onChange={(e) => setSuUsername(e.target.value)}
                      placeholder="Username (min 3 chars)"
                      className="w-full pl-10 pr-4 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium text-slate-800 placeholder:text-slate-400 outline-none text-sm"
                      autoComplete="username"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="su-password"
                      type={showPw ? 'text' : 'password'}
                      value={suPassword}
                      onChange={(e) => setSuPassword(e.target.value)}
                      placeholder="Password (min 6 chars)"
                      className="w-full pl-10 pr-10 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium text-slate-800 placeholder:text-slate-400 outline-none text-sm"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Role picker */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2 px-1">Select your role</p>
                    <div className="grid grid-cols-3 gap-2">
                      {ROLES.map(({ value, label, icon: Icon, color, bg, activeBg }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setSuRole(value)}
                          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                            suRole === value
                              ? `${activeBg} border-transparent text-white shadow-md`
                              : `${bg} ${color} hover:scale-[1.02]`
                          }`}
                        >
                          <Icon size={18} />
                          <span className="text-[10px] font-black uppercase tracking-wide">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-rose-50 text-rose-600 text-sm font-medium rounded-xl border border-rose-100 flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4 shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="mt-1 w-full py-3.5 liquid-gradient text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 transition-all text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {busy ? (
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <><UserPlus size={16} /> Create Account</>
                    )}
                  </button>

                  <p className="text-center text-xs text-slate-400 mt-1">
                    Already have an account?{' '}
                    <button type="button" onClick={() => switchTab('signin')} className="text-indigo-600 font-bold hover:underline">
                      Sign In
                    </button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
