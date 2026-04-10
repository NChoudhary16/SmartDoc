"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Search, Bell } from 'lucide-react';

const Header = () => {
  return (
    <motion.header 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      className="fixed top-0 left-64 right-0 z-40 flex justify-center px-8"
    >
      <div className="rounded-2xl mt-4 w-full max-w-5xl mx-auto border border-slate-200 bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-between px-6 py-3">
        {/* Search Bar */}
        <div className="flex items-center bg-slate-50 rounded-lg px-4 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all min-w-[300px] border border-slate-100">
          <Search className="text-indigo-500 w-4 h-4 mr-2" />
          <input 
            className="bg-transparent border-none focus:ring-0 text-sm text-slate-900 w-full font-sans placeholder:text-slate-400" 
            placeholder="Search team activity..." 
            type="text"
          />
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-8 font-sans text-xs uppercase tracking-widest font-bold">
          <a className="text-indigo-600" href="#">Insights</a>
          <a className="text-slate-500 hover:text-indigo-600 transition-colors" href="#">History</a>
          <a className="text-slate-500 hover:text-indigo-600 transition-colors" href="#">Analytics</a>
        </nav>

        {/* User Profile & Notifications */}
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-all">
            <Bell className="w-5 h-5" />
          </button>
          <div className="h-8 w-8 rounded-lg overflow-hidden border border-slate-200 ml-2 cursor-pointer hover:scale-110 transition-transform">
            <img 
              alt="Profile" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6TaP0ExIO87XE0Hj9jnnmGWa84UYD60EK-gLSilpNNuLltKc7S9HLlvvgm0zN94bHmZDtC_FdtyG6lKBT01I9U4BNcy497PdukxgxtejjUNvnEasDwyjz1ZojMLz6xW9IwyyQ1HUtfVKzPLA67Yqy4Kc0_KoJgY_r-zkRgk4G42s0vuFf9_BwfwVdFmcg3xnGgL-ESEWmLxZ_Yeq48VtM03zbXM7_IOrRSyqdBbAdoRvBpGN332w2UNOsA7syHMAsc8IKzgHCCto"
            />
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
