"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, Shield, LogOut, LogIn, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Header = () => {
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'employee': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (!mounted) return null;

  return (
    <motion.header 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      className="fixed top-0 left-64 right-0 z-40 flex justify-center px-8"
    >
      <div className="rounded-2xl mt-4 w-full max-w-5xl mx-auto border border-slate-200 bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-between px-6 py-3">
        {/* Search Bar */}
        <div className="flex items-center bg-slate-50 rounded-lg px-4 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all min-w-[240px] border border-slate-100">
          <Search className="text-indigo-500 w-4 h-4 mr-2" />
          <input 
            className="bg-transparent border-none focus:ring-0 text-xs text-slate-900 w-full font-sans placeholder:text-slate-400 outline-none" 
            placeholder="Search activity..." 
            type="text"
          />
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-8 font-sans text-[10px] uppercase tracking-widest font-extrabold">
          <Link 
            className={`${pathname === '/dashboard' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'} transition-colors`} 
            href="/dashboard"
          >
            Insights
          </Link>
          <Link 
            className={`${pathname === '/upload' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'} transition-colors`} 
            href="/upload"
          >
            Upload
          </Link>
          <Link 
            className={`${pathname === '/track' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'} transition-colors`} 
            href="/track"
          >
            Track
          </Link>
          {user?.role === 'admin' && (
            <Link 
              className={`${pathname === '/admin' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'} transition-colors`} 
              href="/admin"
            >
              Admin
            </Link>
          )}
        </nav>

        {/* User Profile & Notifications */}
        <div className="flex items-center gap-4">
          <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-all">
            <Bell className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-slate-200 mx-1"></div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-bold text-slate-800 tracking-tight">{user.name}</span>
                <div className={`flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full border text-[8px] uppercase tracking-wider font-extrabold ${getRoleColor(user.role)}`}>
                  {user.role === 'admin' && <Shield className="w-2.5 h-2.5" />}
                  {user.role}
                </div>
              </div>
              <div className="relative group">
                <div className="h-9 w-9 rounded-xl overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-all">
                  <img 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                    src={user?.avatar || "https://i.pravatar.cc/150"}
                  />
                </div>
                {/* Logout Tooltip/Menu */}
                <button 
                  onClick={logout}
                  className="absolute right-0 top-full mt-2 opacity-0 group-hover:opacity-100 flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all text-[10px] font-bold uppercase tracking-wider whitespace-nowrap z-50 pointer-events-none group-hover:pointer-events-auto"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <Link 
              href="/login"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
