"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, MoreVertical } from 'lucide-react';
import { fetchDocuments } from '@/lib/api';

const PAGE_SIZE = 5;

const DocumentTable = ({ onReview, refreshKey = 0, searchQuery = '', onQueueCount }) => {
  const [documents, setDocuments] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadPending = async () => {
      try {
        const data = await fetchDocuments({ status: 'pending_admin' });
        const rows = data || [];
        setDocuments(rows);
        onQueueCount?.(rows.length);
      } catch (error) {
        console.error('Failed loading pending documents', error);
        onQueueCount?.(0);
      }
    };

    loadPending();
  }, [refreshKey, onQueueCount]);

  const filteredDocuments = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return documents;
    return documents.filter((doc) => {
      const id = String(doc.id || '').toLowerCase();
      const file = String(doc.original_file || '').toLowerCase();
      const type = String(doc.document_type || '').toLowerCase();
      const status = String(doc.status || '').toLowerCase();
      return id.includes(term) || file.includes(term) || type.includes(term) || status.includes(term);
    });
  }, [documents, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedDocuments = filteredDocuments.slice(pageStart, pageStart + PAGE_SIZE);

  const statusStyles = {
    pending_admin: "bg-amber-100/50 text-amber-700 border-amber-200",
    approved: "bg-emerald-100/50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-100/50 text-rose-700 border-rose-200",
    dispatched: "bg-blue-100/50 text-blue-700 border-blue-200",
    flagged: "bg-orange-100/50 text-orange-700 border-orange-200"
  };

  return (
    <div className="glass-panel rounded-3xl overflow-hidden border-slate-200/60 shadow-xl shadow-slate-200/20">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 font-sans">ID</th>
            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 font-sans">Document</th>
            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 font-sans">Submitter</th>
            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 font-sans">Role</th>
            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 font-sans">Type</th>
            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 font-sans">Dept</th>
            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 font-sans">Status</th>
            <th className="px-6 py-4 text-right text-[10px] uppercase tracking-widest font-black text-slate-500 font-sans">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {pagedDocuments.map((doc, i) => (
            <motion.tr
              key={doc.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 + 0.5 }}
              className="hover:bg-indigo-50/30 transition-colors group"
            >
              <td className="px-6 py-4 text-xs font-bold text-indigo-600 font-sans">{String(doc.id).slice(0, 8)}</td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{doc.original_file}</span>
                  <span className="text-[10px] text-slate-400 font-medium font-sans">Created {new Date(doc.created_at).toLocaleDateString()}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600 font-medium">{doc.created_by_name || doc.created_by || 'System'}</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-indigo-50 border border-indigo-100 rounded text-[10px] font-black text-indigo-600 uppercase tracking-tight">
                  {doc.creator_role || '—'}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  {doc.document_type || 'General'}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                  {doc.department || '—'}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 border rounded-lg text-[10px] font-black uppercase tracking-wider ${statusStyles[doc.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                  {doc.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={() => onReview(doc)}
                    className="p-2 text-indigo-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-indigo-100 shadow-sm opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 group-hover:duration-300"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 group-hover:duration-300 delay-75">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
        <span className="text-2xs uppercase tracking-widest font-black text-slate-400">
          Showing {pagedDocuments.length} of {filteredDocuments.length} results
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors shadow-sm disabled:opacity-50 disabled:hover:text-slate-500"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors shadow-sm disabled:opacity-50 disabled:hover:text-slate-500"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentTable;
