"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, AlertCircle, FileText, ChevronRight,
  Edit3, Download, Clock, CheckCircle2, XCircle,
  Flag, Truck, Upload, Cpu
} from 'lucide-react';
import { getAuthHeaders } from '@/lib/auth';
import { API_URL, API_ORIGIN } from '@/lib/api';

// Map status strings to icons + colors
const STATUS_META = {
  uploaded:          { icon: Upload,      color: 'text-slate-500',   bg: 'bg-slate-100'   },
  extracted:         { icon: Cpu,         color: 'text-violet-600',  bg: 'bg-violet-50'   },
  matched:           { icon: CheckCircle2,color: 'text-indigo-600',  bg: 'bg-indigo-50'   },
  llm_verified:      { icon: CheckCircle2,color: 'text-indigo-600',  bg: 'bg-indigo-50'   },
  generated_pdf:     { icon: FileText,    color: 'text-blue-600',    bg: 'bg-blue-50'     },
  awaiting_submitter:{ icon: Clock,       color: 'text-amber-600',   bg: 'bg-amber-50'    },
  pending_admin:     { icon: Clock,       color: 'text-amber-600',   bg: 'bg-amber-50'    },
  approved:          { icon: CheckCircle2,color: 'text-emerald-600', bg: 'bg-emerald-50'  },
  dispatched:        { icon: Truck,       color: 'text-blue-600',    bg: 'bg-blue-50'     },
  rejected:          { icon: XCircle,     color: 'text-rose-600',    bg: 'bg-rose-50'     },
  flagged:           { icon: Flag,        color: 'text-orange-600',  bg: 'bg-orange-50'   },
};

const DocumentReviewModal = ({ isOpen, document, onClose, onActionComplete, readOnly = false }) => {
  const [content, setContent] = useState('{}');
  const [docData, setDocData] = useState(null);
  const [busy, setBusy]       = useState(false);
  const [activeSection, setActiveSection] = useState('content'); // 'content' | 'history'

  const sanitizeForEditor = (value) => {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.map((item) => sanitizeForEditor(item));
    if (typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, inner]) => [key, sanitizeForEditor(inner)])
      );
    }
    return value;
  };

  useEffect(() => {
    const loadDoc = async () => {
      if (!document?.id || !isOpen) return;
      setDocData(null);
      try {
        const response = await fetch(`${API_URL}/documents/${document.id}`, {
          headers: getAuthHeaders()
        });
        const data = await response.json();
        if (data.success) {
          setDocData(data.document);
          setContent(JSON.stringify(sanitizeForEditor(data.document.extracted_json || {}), null, 2));
        }
      } catch (error) {
        console.error('Unable to load document details', error);
      }
    };
    loadDoc();
    setActiveSection('content');
  }, [document?.id, isOpen]);

  const handleApprove = async () => {
    if (!document?.id) return;
    setBusy(true);
    try {
      const parsed = JSON.parse(content || '{}');
      const response = await fetch(`${API_URL}/documents/${document.id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          data: parsed,
          templateName: docData?.template_name,
          department: docData?.department || parsed.department || 'operations'
        })
      });
      const data = await response.json();
      if (!data.success) {
        const issues = data.validation?.issues?.length
          ? `\n\nValidation issues:\n${data.validation.issues.slice(0, 6).join('\n')}` : '';
        alert((data.message || 'Approval failed') + issues);
        return;
      }
      const docxUrl = data.downloadUrl ? `${API_ORIGIN}${data.downloadUrl}` : '';
      if (docxUrl) window.open(docxUrl, '_blank', 'noopener,noreferrer');
      const warnings = data.approval_warnings?.length
        ? `\nWarnings:\n${data.approval_warnings.join('\n')}` : '';
      alert(`Approved. Final DOCX ${docxUrl ? 'opened in a new tab' : 'is ready'}. Department: ${data.department || 'operations'}.${warnings}`);
      onActionComplete?.();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Approval failed — invalid JSON?');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!document?.id) return;
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}/documents/${document.id}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ comment: 'Rejected by admin during review' })
      });
      const data = await response.json();
      if (!data.success) { alert(data.message || 'Reject failed'); return; }
      alert('Document rejected.');
      onActionComplete?.();
      onClose();
    } catch { alert('Reject failed'); }
    finally { setBusy(false); }
  };

  const handleFlag = async () => {
    if (!document?.id) return;
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}/documents/${document.id}/flag`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ comment: 'Flagged by admin for manual corrections' })
      });
      const data = await response.json();
      if (!data.success) { alert(data.message || 'Flag failed'); return; }
      alert('Document flagged.');
      onActionComplete?.();
      onClose();
    } catch { alert('Flag failed'); }
    finally { setBusy(false); }
  };

  const docxUrl = (() => {
    const fn = docData?.artifacts?.final_docx;
    return fn ? `${API_ORIGIN}/uploads/${fn}` : null;
  })();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Slide-in Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 24, stiffness: 200 }}
          className="relative w-full max-w-2xl h-screen bg-white shadow-2xl flex flex-col overflow-hidden"
        >
          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                readOnly ? 'bg-slate-700' : 'bg-indigo-600'
              } text-white`}>
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 truncate max-w-[320px]">
                  {docData?.original_file || 'Loading...'}
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span>ID: {String(document?.id || '').slice(0, 8)}</span>
                  <ChevronRight size={10} />
                  <span className={`font-black ${
                    docData?.status === 'approved' ? 'text-emerald-600' :
                    docData?.status === 'rejected' ? 'text-rose-600' :
                    docData?.status === 'dispatched' ? 'text-blue-600' : 'text-amber-600'
                  }`}>
                    {docData?.status || document?.status}
                  </span>
                  {docData?.creator_role && (
                    <><ChevronRight size={10} /><span className="text-indigo-600">From: {docData.creator_role}</span></>
                  )}
                  {docData?.department && (
                    <><ChevronRight size={10} /><span className="text-emerald-700">Dept: {docData.department}</span></>
                  )}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 ml-2 flex-shrink-0">
              <X size={22} />
            </button>
          </div>

          {/* ── Section tabs ────────────────────────────────────────── */}
          <div className="flex border-b border-slate-100 bg-slate-50/40 px-5">
            {[
              { key: 'content', label: 'Content' },
              { key: 'history', label: `History (${Array.isArray(docData?.history) ? docData.history.length : 0})` }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all -mb-px ${
                  activeSection === key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Body ───────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-7 space-y-6">

            {activeSection === 'content' && (
              <>
                {/* Audit / review comment */}
                {docData?.review_comments && (
                  <div className={`p-4 rounded-2xl text-sm border ${
                    docData.status === 'rejected'
                      ? 'bg-rose-50 border-rose-100 text-rose-800'
                      : 'bg-amber-50 border-amber-100 text-amber-900'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70 block mb-1">
                      {docData.status === 'rejected' ? 'Rejection reason' : 'Submitter / audit note'}
                    </span>
                    <p className="font-medium">{docData.review_comments}</p>
                  </div>
                )}

                {/* Download DOCX banner for completed docs */}
                {docxUrl && (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                      <FileText size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">Final DOCX Generated</p>
                      <p className="text-[11px] text-emerald-600 mt-0.5">{docData?.artifacts?.final_docx}</p>
                    </div>
                    <a
                      href={docxUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      <Download size={14} /> Download
                    </a>
                  </div>
                )}

                {/* Extracted JSON content */}
                <section>
                  <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-600 mb-3 font-sans">
                    {readOnly ? 'Document Data (read-only)' : 'Automated Output Preview'}
                  </h4>
                  <div className="glass-panel p-5 rounded-2xl border-slate-100 bg-slate-50/40">
                    <textarea
                      value={content}
                      onChange={(e) => !readOnly && setContent(e.target.value)}
                      readOnly={readOnly}
                      className={`w-full h-80 bg-transparent border-none focus:ring-0 text-slate-600 leading-relaxed font-mono text-xs resize-none ${
                        readOnly ? 'cursor-default select-all' : ''
                      }`}
                      placeholder="No extracted data available"
                    />
                  </div>
                </section>

                {/* AI metrics */}
                <section className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-2">Confidence Score</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round((docData?.verification_report?.confidence || 0) * 100)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                      <span className="text-sm font-black text-slate-900">
                        {Math.round((docData?.verification_report?.confidence || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-2">Processing Model</p>
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <AlertCircle size={14} className="text-indigo-600" /> SmartDoc-AI v2
                    </span>
                  </div>
                </section>
              </>
            )}

            {activeSection === 'history' && (
              <section>
                <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-600 mb-5 font-sans">
                  Status Timeline
                </h4>
                {!docData ? (
                  <p className="text-sm text-slate-400 text-center py-8">Loading history...</p>
                ) : !Array.isArray(docData.history) || docData.history.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No history recorded</p>
                ) : (
                  <ol className="relative border-l-2 border-slate-100 ml-3 space-y-0">
                    {[...docData.history].reverse().map((entry, i) => {
                      const meta = STATUS_META[entry.status] || STATUS_META['uploaded'];
                      const Icon = meta.icon;
                      const isFirst = i === 0;
                      return (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="ml-6 pb-6 relative"
                        >
                          {/* dot */}
                          <span className={`absolute -left-[2.15rem] top-0.5 flex items-center justify-center w-7 h-7 rounded-full ${meta.bg} ring-4 ring-white`}>
                            <Icon size={13} className={meta.color} />
                          </span>
                          <div className={`p-3.5 rounded-2xl border ${isFirst ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100'}`}>
                            <div className="flex items-center justify-between gap-3 mb-0.5">
                              <span className={`text-xs font-black uppercase tracking-widest ${meta.color}`}>
                                {entry.status?.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium font-sans flex-shrink-0">
                                {entry.at ? new Date(entry.at).toLocaleString() : ''}
                              </span>
                            </div>
                            {entry.note && (
                              <p className="text-xs text-slate-500 mt-1 font-medium">{entry.note}</p>
                            )}
                          </div>
                        </motion.li>
                      );
                    })}
                  </ol>
                )}
              </section>
            )}
          </div>

          {/* ── Footer Actions ─────────────────────────────────────── */}
          {readOnly ? (
            // Read-only footer — just download (if available) + close
            <div className="p-5 border-t border-slate-100 bg-white flex gap-3">
              {docxUrl && (
                <a
                  href={docxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <Download size={16} /> Download DOCX
                </a>
              )}
              <button
                onClick={onClose}
                className={`${docxUrl ? '' : 'flex-1 '}px-6 py-3 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors`}
              >
                Close
              </button>
            </div>
          ) : (
            // Editable footer — Reject / Flag / Approve
            <div className="p-5 border-t border-slate-100 bg-white grid grid-cols-2 gap-3">
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={busy}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <X size={15} /> Reject
                </button>
                <button
                  onClick={handleFlag}
                  disabled={busy}
                  className="flex-1 px-4 py-3 rounded-xl border border-rose-200 text-rose-600 font-bold text-sm hover:bg-rose-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Edit3 size={15} /> Flag
                </button>
              </div>
              <button
                onClick={handleApprove}
                disabled={busy}
                className="liquid-gradient text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                <Check size={16} /> {busy ? 'Processing...' : 'Approve & Finalize'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DocumentReviewModal;
