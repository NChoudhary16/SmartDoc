"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Eye, Download } from 'lucide-react';
import { fetchDocuments } from '@/lib/api';
import { API_ORIGIN } from '@/lib/api';

const PAGE_SIZE = 8;

const STATUS_STYLES = {
  pending_admin: 'bg-amber-100/60 text-amber-700 border-amber-200',
  approved:      'bg-emerald-100/60 text-emerald-700 border-emerald-200',
  rejected:      'bg-rose-100/60 text-rose-700 border-rose-200',
  dispatched:    'bg-blue-100/60 text-blue-700 border-blue-200',
  flagged:       'bg-orange-100/60 text-orange-700 border-orange-200',
};

const DocumentTable = ({
  onReview,
  refreshKey = 0,
  searchQuery = '',
  onQueueCount,
  statusFilter = 'pending_admin',
  readOnly = false,
}) => {
  const [documents, setDocuments] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const loadDocs = async () => {
      setLoading(true);
      try {
        const data = await fetchDocuments({ status: statusFilter });
        const rows = data || [];
        if (active) {
          setDocuments(rows);
          onQueueCount?.(rows.length);
          setPage(1);
        }
      } catch (error) {
        console.error('Failed loading documents', error);
        if (active) onQueueCount?.(0);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadDocs();
    return () => { active = false; };
  }, [refreshKey, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredDocuments = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return documents;
    return documents.filter((doc) => {
      const haystack = [doc.id, doc.original_file, doc.document_type, doc.status, doc.created_by_name]
        .join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }, [documents, searchQuery]);

  const totalPages     = Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE));
  const currentPage    = Math.min(page, totalPages);
  const pagedDocuments = filteredDocuments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getDocxUrl = (doc) => {
    const finalDocx = doc?.artifacts?.final_docx;
    if (!finalDocx) return null;
    return `${API_ORIGIN}/uploads/${finalDocx}`;
  };

  const hasDocx = (doc) => !!getDocxUrl(doc);

  return (
    <div className="glass-panel rounded-3xl overflow-hidden border-slate-200/60 shadow-xl shadow-slate-200/20">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {['ID','Document','Submitter','Role','Type','Dept','Status','Actions'].map((h, i) => (
              <th
                key={h}
                className={`px-5 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 font-sans${i === 7 ? ' text-right' : ''}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm font-medium">
                <div className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Loading documents...
                </div>
              </td>
            </tr>
          ) : pagedDocuments.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-14 text-center">
                <p className="text-slate-400 text-sm font-medium">No documents found</p>
                <p className="text-slate-300 text-xs mt-1">Documents in this category will appear here</p>
              </td>
            </tr>
          ) : pagedDocuments.map((doc, i) => (
            <motion.tr
              key={doc.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 + 0.1 }}
              className="hover:bg-indigo-50/30 transition-colors group"
            >
              <td className="px-5 py-4 text-xs font-bold text-indigo-600 font-sans">
                {String(doc.id).slice(0, 8)}
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors truncate max-w-[160px]">
                    {doc.original_file}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium font-sans">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-slate-600 font-medium">
                {doc.created_by_name || doc.created_by || 'System'}
              </td>
              <td className="px-5 py-4">
                <span className="px-2 py-1 bg-indigo-50 border border-indigo-100 rounded text-[10px] font-black text-indigo-600 uppercase tracking-tight">
                  {doc.creator_role || '—'}
                </span>
              </td>
              <td className="px-5 py-4">
                <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  {doc.document_type || 'General'}
                </span>
              </td>
              <td className="px-5 py-4">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                  {doc.department || '—'}
                </span>
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-col gap-1">
                  <span className={`px-2.5 py-1 border rounded-lg text-[10px] font-black uppercase tracking-wider ${STATUS_STYLES[doc.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {doc.status?.replace('_', ' ')}
                  </span>
                  {/* Rejection note inline */}
                  {doc.status === 'rejected' && doc.review_comments && (
                    <span className="text-[10px] text-rose-500 font-medium truncate max-w-[120px]" title={doc.review_comments}>
                      {doc.review_comments}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {/* Download DOCX — for approved/dispatched docs with a file */}
                  {hasDocx(doc) && (
                    <a
                      href={getDocxUrl(doc)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Download final DOCX"
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 group-hover:duration-300"
                    >
                      <Download size={15} />
                    </a>
                  )}
                  {/* Review / View */}
                  <button
                    onClick={() => onReview(doc)}
                    title={readOnly ? 'View details' : 'Review'}
                    className="p-2 text-indigo-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-indigo-100 shadow-sm opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 group-hover:duration-300 delay-75"
                  >
                    {readOnly ? <Eye size={15} /> : <Edit2 size={15} />}
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">
          {pagedDocuments.length} of {filteredDocuments.length} documents
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors shadow-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs font-bold text-slate-500">{currentPage} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors shadow-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentTable;
