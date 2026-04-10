"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AdminStats from '@/components/Admin/AdminStats';
import DocumentTable from '@/components/Admin/DocumentTable';
import DocumentReviewModal from '@/components/Admin/DocumentReviewModal';
import { Filter, Search, DownloadCloud } from 'lucide-react';

export default function AdminPage() {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleReview = (doc) => {
    setSelectedDoc(doc);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col">
      {/* Admin Title Section */}
      <motion.header 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
        className="mb-8 flex items-end justify-between"
      >
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-sans text-[10px] text-indigo-600 font-bold tracking-[0.3em] uppercase">Document Admin</span>
            <div className="h-px w-24 bg-gradient-to-r from-indigo-300 to-transparent"></div>
          </div>
          <h1 className="font-body text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Review <span className="font-display italic font-medium text-indigo-600">Center</span>
          </h1>
        </div>
        
        <div className="flex gap-3 pb-1">
          <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            <Filter size={16} /> Filter
          </button>
          <button className="liquid-gradient text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
            <DownloadCloud size={16} /> Export CSV
          </button>
        </div>
      </motion.header>

      {/* Stats Summary */}
      <AdminStats />

      {/* Main Table Section */}
      <section className="relative">
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="font-body text-xl font-bold text-slate-900 flex items-center gap-3">
            Processing Queue <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] rounded-full font-black border border-indigo-100 uppercase tracking-widest">42 Total</span>
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search ID, document name..." 
              className="pl-9 pr-4 py-2 bg-slate-100/50 border-none focus:ring-1 focus:ring-indigo-500/20 rounded-xl text-xs font-medium w-64 placeholder:text-slate-400"
            />
          </div>
        </div>
        
        <DocumentTable onReview={handleReview} />
      </section>

      {/* Review Modal */}
      <DocumentReviewModal 
        isOpen={isModalOpen} 
        document={selectedDoc} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
