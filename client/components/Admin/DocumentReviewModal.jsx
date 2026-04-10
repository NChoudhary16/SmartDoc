"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, FileText, ChevronRight, Edit3 } from 'lucide-react';
import { getAuthHeaders } from '@/lib/auth';
import { API_URL, API_ORIGIN } from '@/lib/api';

const DocumentReviewModal = ({ isOpen, document, onClose, onActionComplete }) => {
  const [content, setContent] = useState('{}');
  const [docData, setDocData] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const loadDoc = async () => {
      if (!document?.id || !isOpen) return;
      try {
        const response = await fetch(`${API_URL}/documents/${document.id}`, {
          headers: getAuthHeaders()
        });
        const data = await response.json();
        if (data.success) {
          setDocData(data.document);
          setContent(JSON.stringify(data.document.extracted_json || {}, null, 2));
        }
      } catch (error) {
        console.error('Unable to load document details', error);
      }
    };
    loadDoc();
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
        const validationIssues = data.validation?.issues?.length
          ? `\n\nValidation issues:\n${data.validation.issues.slice(0, 6).join('\n')}`
          : '';
        alert((data.message || 'Approval failed') + validationIssues);
        return;
      }
      const docxUrl = data.downloadUrl ? `${API_ORIGIN}${data.downloadUrl}` : '';
      if (docxUrl) {
        window.open(docxUrl, '_blank', 'noopener,noreferrer');
      }
      const warningText = data.approval_warnings?.length
        ? `\nWarnings:\n${data.approval_warnings.join('\n')}`
        : '';
      alert(
        `Approved. Final DOCX ${docxUrl ? 'opened in a new tab' : 'is ready'}. Department: ${data.department || docData?.department || 'operations'}.${warningText}`
      );
      onActionComplete?.();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Approval failed');
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
        body: JSON.stringify({
          comment: 'Rejected by admin during review'
        })
      });
      const data = await response.json();
      if (!data.success) {
        alert(data.message || 'Reject failed');
        return;
      }
      alert('Document rejected.');
      onActionComplete?.();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Reject failed');
    } finally {
      setBusy(false);
    }
  };

  const handleFlag = async () => {
    if (!document?.id) return;
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}/documents/${document.id}/flag`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          comment: 'Flagged by admin for manual corrections'
        })
      });
      const data = await response.json();
      if (!data.success) {
        alert(data.message || 'Flag failed');
        return;
      }
      alert('Document flagged.');
      onActionComplete?.();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Flag failed');
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-end">
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
                <h3 className="text-lg font-bold text-slate-900">{docData?.original_file || "Review Document"}</h3>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest font-sans flex flex-wrap items-center gap-2">
                  ID: {String(document?.id || '').slice(0, 8)} <ChevronRight size={12} /> Status: {docData?.status || document?.status}
                  {docData?.creator_role && (
                    <>
                      <ChevronRight size={12} />
                      <span className="text-indigo-600">From: {docData.creator_role}</span>
                    </>
                  )}
                  {docData?.department && (
                    <>
                      <ChevronRight size={12} />
                      <span className="text-emerald-700">Route: {docData.department}</span>
                    </>
                  )}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Approving generates the <strong className="text-slate-700">final DOCX</strong> (with an electronic signature section: approver, time, document id, department) and emails the department inbox.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <X size={24} />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {docData?.review_comments && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-sm text-amber-900">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Submitter / audit note</span>
                <p className="mt-1 font-medium">{docData.review_comments}</p>
              </div>
            )}
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
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((docData?.verification_report?.confidence || 0) * 100)}%` }} className="h-full bg-emerald-500" />
                  </div>
                  <span className="text-sm font-black text-slate-900">{Math.round((docData?.verification_report?.confidence || 0) * 100)}%</span>
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
              <button onClick={handleReject} disabled={busy} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                <X size={16} /> Reject
              </button>
              <button onClick={handleFlag} disabled={busy} className="flex-1 px-4 py-3 rounded-xl border border-rose-200 text-rose-600 font-bold text-sm hover:bg-rose-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                <Edit3 size={16} /> Flag
              </button>
            </div>
            <button onClick={handleApprove} disabled={busy} className="liquid-gradient text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
              <Check size={18} /> {busy ? 'Processing...' : 'Approve & Finalize'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DocumentReviewModal;
