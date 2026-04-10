"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, MoveUpRight } from 'lucide-react';

const CommandBar = () => {
  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, delay: 1, ease: "backOut" }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 ml-32 z-50 w-full max-w-xl"
    >
      <div className="glass-panel rounded-2xl px-6 py-4 shadow-2xl border-white/60 bg-white/80 flex items-center gap-4 group ring-1 ring-slate-200/50">
        <div className="w-10 h-10 rounded-xl liquid-gradient flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <Terminal className="w-5 h-5" />
        </div>
        <input 
          className="bg-transparent border-none focus:ring-0 text-sm text-slate-900 w-full font-sans placeholder:text-slate-400" 
          placeholder="Command the Oracle..." 
          type="text"
        />
        <div className="flex items-center gap-3">
          <kbd className="px-2 py-1 bg-slate-100 rounded text-[10px] font-sans border border-slate-200 text-slate-500 font-bold whitespace-nowrap">
            ⌘ K
          </kbd>
          <button className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
            <MoveUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CommandBar;
