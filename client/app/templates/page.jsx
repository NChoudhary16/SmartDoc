"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import { motion } from 'framer-motion';
import { FileText, Search, Plus, Filter, Layout, Book, CreditCard, FileCheck } from 'lucide-react';
import { getAuthHeaders } from '@/lib/auth';
import { API_URL } from '@/lib/config';

export default function TemplatesPage() {
  const [filter, setFilter] = useState('All');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadTemplates = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/templates`, {
          headers: getAuthHeaders(),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to load templates');
        }
        if (!cancelled) {
          setTemplates(data.templates || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load templates');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadTemplates();
    return () => {
      cancelled = true;
    };
  }, []);

  const iconByType = {
    Invoice: CreditCard,
    'Purchase Order': Layout,
    MOU: FileCheck,
    Proposal: Book,
  };

  const categories = useMemo(() => {
    const dynamic = Array.from(new Set((templates || []).map((t) => t.type).filter(Boolean)));
    return ['All', ...dynamic];
  }, [templates]);

  return (
    <ProtectedRoute allowedRoles={['employee', 'admin']}>
      <main className="min-h-screen relative overflow-x-hidden selection:bg-indigo-600 selection:text-white">
        <Sidebar />
        <Header />
        
        <div className="ml-64 pt-28 px-12 pb-12 relative z-10">
          <section className="relative">
            {/* Header Section */}
            <motion.header 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="mb-12 flex items-end justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-sans text-[10px] text-indigo-600 font-bold tracking-[0.3em] uppercase">Document Library</span>
                  <div className="h-px w-24 bg-gradient-to-r from-indigo-300 to-transparent"></div>
                </div>
                <h1 className="font-body text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  Template <span className="font-display italic font-medium text-indigo-600">Assets</span>
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Standardized formats for automated document generation.</p>
              </div>
              
              <button className="liquid-gradient text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 opacity-50 cursor-not-allowed">
                <Plus size={18} /> Register Template
              </button>
            </motion.header>

            {/* Filter Section */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                    filter === cat 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading && (
                <div className="col-span-full text-sm text-slate-500 font-medium">Loading templates...</div>
              )}
              {!loading && error && (
                <div className="col-span-full text-sm text-rose-500 font-medium">{error}</div>
              )}
              {!loading && !error && templates.filter(t => filter === 'All' || t.type === filter).length === 0 && (
                <div className="col-span-full text-sm text-slate-500 font-medium">No templates found for this filter.</div>
              )}
              {!loading && !error && templates.filter(t => filter === 'All' || t.type === filter).map((template, idx) => {
                const Icon = iconByType[template.type] || FileText;
                return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="glass-panel p-6 rounded-3xl border border-white/60 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                      <Icon size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 px-2 py-1 rounded-lg">
                      {template.type || 'General'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 font-medium">
                    {template.description || 'No description provided'}
                  </p>
                  <div className="mt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                       <FileText size={12} /> {template.file_path}
                    </span>
                    <button className="text-xs font-bold text-indigo-600 hover:underline">Use Design</button>
                  </div>
                </motion.div>
              )})}
            </div>
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}
