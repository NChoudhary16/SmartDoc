"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, FileText, ChevronRight, Edit3, Send } from 'lucide-react';

const DocumentReviewModal = ({ isOpen, document, onClose }) => {
  const [content, setContent] = useState(
    "Automated synthesis of the 'Q4 Strategy' document suggests merging conflicting feedback threads from stakeholders. The current document identifies three main bottlenecks in the approval chain: legal review latency, creative asset availability, and budget reconciliation inconsistencies..."
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-end">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Panel */}
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-2xl h-screen bg-white shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{document?.name || "Review Document"}</h3>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest font-sans flex items-center gap-2">
                  ID: {document?.id} <ChevronRight size={12} /> Status: {document?.status}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <X size={24} />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            <section>
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-600 mb-4 font-sans">Automated Output Preview</h4>
              <div className="glass-panel p-6 rounded-2xl border-slate-100 bg-slate-50/30">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-96 bg-transparent border-none focus:ring-0 text-slate-600 leading-relaxed font-body text-sm resize-none"
                  placeholder="Review and edit the automated content here..."
                />
              </div>
            </section>

            <section className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-2 font-sans">Confidence Score</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '94%' }} className="h-full bg-emerald-500" />
                  </div>
                  <span className="text-sm font-black text-slate-900">94%</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-2 font-sans">Processing Model</p>
                <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle size={14} className="text-indigo-600" /> SmartDoc-AI v2
                </span>
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 bg-white grid grid-cols-2 gap-4">
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                <X size={16} /> Reject
              </button>
              <button className="flex-1 px-4 py-3 rounded-xl border border-rose-200 text-rose-600 font-bold text-sm hover:bg-rose-50 transition-colors flex items-center justify-center gap-2">
                <Edit3 size={16} /> Flag
              </button>
            </div>
            <button className="liquid-gradient text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
              <Check size={18} /> Approve & Finalize
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DocumentReviewModal;
