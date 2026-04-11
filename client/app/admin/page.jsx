"use client";

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import AdminStats from '@/components/Admin/AdminStats';
import DocumentTable from '@/components/Admin/DocumentTable';
import DocumentReviewModal from '@/components/Admin/DocumentReviewModal';
import { Search, DownloadCloud } from 'lucide-react';

const TABS = [
  { key: 'pending_admin', label: 'Pending',    color: 'text-amber-600',   dot: 'bg-amber-500' },
  { key: 'approved',      label: 'Approved',   color: 'text-emerald-600', dot: 'bg-emerald-500' },
  { key: 'dispatched',    label: 'Dispatched', color: 'text-blue-600',    dot: 'bg-blue-500' },
  { key: 'rejected',      label: 'Rejected',   color: 'text-rose-600',    dot: 'bg-rose-500' },
  { key: 'flagged',       label: 'Flagged',    color: 'text-orange-600',  dot: 'bg-orange-500' },
];

export default function AdminPage() {
  const [activeTab, setActiveTab]   = useState('pending_admin');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey]   = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabCounts, setTabCounts]     = useState({});

  const handleReview = (doc) => {
    setSelectedDoc(doc);
    setIsModalOpen(true);
  };

  const handleActionComplete = () => setRefreshKey((k) => k + 1);

  const handleTabCount = useCallback((status, count) => {
    setTabCounts((prev) => ({ ...prev, [status]: count }));
  }, []);

  const isReadOnly = activeTab !== 'pending_admin';

  return (
    <div className="flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          className="mb-8 flex items-end justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-sans text-[10px] text-indigo-600 font-bold tracking-[0.3em] uppercase">
                SmartDoc · AI Portals
              </span>
              <div className="h-px w-24 bg-linear-to-r from-indigo-300 to-transparent" />
            </div>
            <h1 className="font-body text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Admin <span className="font-display italic font-medium text-indigo-600">review center</span>
            </h1>
            <p className="mt-3 text-slate-500 max-w-2xl text-sm font-medium leading-relaxed">
              Same sidebar, header, and neural stack as the rest of the product—govern templates, validate extractions, and ship DOCX with a full audit trail.
            </p>
          </div>

          <div className="flex gap-3 pb-1">
            <button className="liquid-gradient text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
              <DownloadCloud size={16} /> Export CSV
            </button>
          </div>
        </motion.header>

        {/* Stats */}
        <AdminStats refreshKey={refreshKey} />

        {/* Tab bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex items-center gap-1 mb-6 bg-white/70 backdrop-blur border border-slate-200/60 rounded-2xl p-1.5 shadow-sm"
        >
          {TABS.map(({ key, label, color, dot }) => {
            const count = tabCounts[key] ?? 0;
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setSearchQuery(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-white shadow-md shadow-slate-200/50 text-slate-900'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                {label}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    active ? `${color} bg-slate-100` : 'bg-slate-100 text-slate-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>

        {/* Table section */}
        <section className="relative">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="font-body text-lg font-bold text-slate-800">
              {TABS.find((t) => t.key === activeTab)?.label} Documents
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search ID, file name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-100/50 border-none focus:ring-1 focus:ring-indigo-500/20 rounded-xl text-xs font-medium w-64 placeholder:text-slate-400"
              />
            </div>
          </div>

          <DocumentTable
            key={activeTab}
            statusFilter={activeTab}
            onReview={handleReview}
            refreshKey={refreshKey}
            searchQuery={searchQuery}
            onQueueCount={(count) => handleTabCount(activeTab, count)}
            readOnly={isReadOnly}
          />
        </section>

        {/* Review / View Modal */}
        <DocumentReviewModal
          isOpen={isModalOpen}
          document={selectedDoc}
          onActionComplete={handleActionComplete}
          onClose={() => setIsModalOpen(false)}
          readOnly={isReadOnly}
        />
    </div>
  );
}
