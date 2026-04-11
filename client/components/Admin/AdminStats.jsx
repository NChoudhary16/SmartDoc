"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchDashboardSummary } from '@/lib/api';

const AdminStats = ({ refreshKey = 0 }) => {
  const [totals, setTotals] = useState({
    total_documents: 0,
    pending_review: 0,
    approved_today: 0,
    rejected: 0
  });

  useEffect(() => {
    let active = true;
    fetchDashboardSummary()
      .then((summary) => {
        if (active && summary?.totals) setTotals(summary.totals);
      })
      .catch((error) => console.error('Failed to load dashboard summary', error));
    return () => { active = false; };
  }, [refreshKey]);

  const stats = [
    { label: "Total Documents", value: totals.total_documents, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Pending Review", value: totals.pending_review, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Approved today", value: totals.approved_today, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Rejected", value: totals.rejected, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="grid grid-cols-4 gap-6 mb-10">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          className="glass-panel rounded-2xl p-6 border-white/40 flex items-center gap-5 hover:scale-[1.02] transition-transform cursor-default"
        >
          <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
            <stat.icon size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900 font-body">{stat.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default AdminStats;
