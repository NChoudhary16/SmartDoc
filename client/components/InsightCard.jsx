"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const InsightCard = () => {
  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
      className="glass-panel rounded-3xl p-8 relative overflow-hidden group border-indigo-100/50"
    >
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 blur-[80px] group-hover:bg-indigo-500/10 transition-colors duration-700"></div>
      <div className="flex items-start gap-6 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100">
          <Zap className="w-10 h-10 fill-indigo-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-sans text-[10px] uppercase tracking-widest px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 font-bold">
              AI Insight
            </span>
            <span className="text-slate-400 text-xs">Analysis Complete</span>
          </div>
          <h3 className="font-body text-2xl font-bold mb-3 text-slate-900">
            Workflow bottleneck detected in "Q4 Strategy"
          </h3>
          <p className="text-slate-600 leading-relaxed text-sm max-w-2xl mb-6 font-sans">
            Review cycles for the strategy document have exceeded typical velocity. 
            Automated synthesis suggests merging three conflicting feedback threads 
            to accelerate approval by 48 hours.
          </p>
          <div className="flex gap-4">
            <button className="liquid-gradient text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all">
              Apply Synthesis
            </button>
            <button className="bg-slate-100 hover:bg-slate-200 text-slate-900 px-6 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 transition-colors">
              Details
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InsightCard;
