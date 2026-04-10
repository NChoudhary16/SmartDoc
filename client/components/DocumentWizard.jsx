"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getAuthHeaders } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import { submitDocumentForReview, ApiRequestError, API_URL, API_ORIGIN } from '@/lib/api';

export default function DocumentWizard() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finalDoc, setFinalDoc] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);

    const formData = new FormData();
    formData.append('document', file);
    const headers = getAuthHeaders();
    delete headers['Content-Type'];

    try {
      const response = await fetch(`${API_URL}/documents/process`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
               setResult(data);
        setEditedData(data.extracted_data);
      } else {
        alert("Processing Failed: " + data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Error connecting to backend");
    } finally {
      setProcessing(false);
    }
  };

  const handleFieldChange = (key, value) => {
    setEditedData((prev) => ({ ...prev, [key]: value }));
  };

  const handleApprove = async () => {
    setGenerating(true);
    try {
      if (!result?.document_id) {
        throw new Error('Missing document id');
      }
      const response = await fetch(`${API_URL}/documents/${result.document_id}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          data: editedData,
          templateName: result.suggested_template?.file_path || "default_template.docx",
          department: editedData.department || editedData.target_department || 'operations'
        }),
      });

      const data = await response.json();
      if (data.success) {
        setFinalDoc(data.downloadUrl);
        if (data.department) {
          const warnings = data.approval_warnings?.length
            ? `\nWarnings:\n${data.approval_warnings.join('\n')}`
            : '';
          alert(`DOCX ready. Routed to department: ${data.department}${warnings}`);
        }
      } else {
        const issueText = data.validation?.issues?.length
          ? `\n\nValidation issues:\n${data.validation.issues.slice(0, 6).join('\n')}`
          : '';
        alert("Generation Failed: " + data.message + issueText);
      }
    } catch (error) {
      console.error(error);
      alert("Error generating document");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitForAdmin = async () => {
    if (!result?.document_id) return;
    setSubmitting(true);
    try {
      await submitDocumentForReview(result.document_id, {
        data: editedData,
        template_name: result.suggested_template?.file_path || null,
        template_id: result.suggested_template?.id || null
      });
      alert(
        'Your draft passed reverification and is in the admin queue. An administrator will approve it to generate the final DOCX and route it to the correct department.'
      );
    } catch (error) {
      console.error(error);
      if (error instanceof ApiRequestError && error.payload?.validation?.issues?.length) {
        alert(
          `${error.message}\n\nIssues:\n${error.payload.validation.issues.slice(0, 6).join('\n')}`
        );
      } else {
        alert(error.message || 'Could not submit for review');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-[0_20px_40px_-20px_rgba(30,58,138,0.1)]">
      <h2 className="font-display text-2xl font-semibold text-slate-800 mb-6">DocuFlow Pipeline</h2>
      
      {!result ? (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/50">
           {processing ? (
             <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="font-sans text-sm font-bold text-indigo-700 tracking-wider">AI EXTRACTING DATA...</p>
             </div>
           ) : (
             <>
              <input type="file" onChange={handleFileChange} className="mb-4" accept="image/*,.pdf,.docx" />
               <motion.button 
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={handleProcess}
                 disabled={!file}
                 className={`px-8 py-3 rounded-full font-bold tracking-wide text-xs uppercase ${file ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
               >
                 Process Document
               </motion.button>
             </>
           )}
        </div>
      ) : !finalDoc ? (
        <div className="space-y-6">
          <div className="bg-indigo-50 p-4 rounded-xl">
             <h3 className="text-indigo-800 font-bold mb-2">RAG-matched template (by category)</h3>
             <p className="text-indigo-900 font-semibold">{result.suggested_template?.name || "Unknown Template"}</p>
             <p className="text-xs text-indigo-700 mt-1">
               Category: {result.suggested_template?.type || result.validation?.document_type || '—'} · DOCX:{' '}
               {result.suggested_template?.file_path || '—'}
             </p>
             {result.department && (
               <p className="text-xs text-slate-600 mt-1">
                 Routed department after approval: <span className="font-bold uppercase">{result.department}</span>
               </p>
             )}
             <p className="text-sm text-indigo-600 truncate mt-2">{result.summary}</p>
             <p className="mt-2 text-xs text-slate-500">
               Final product: <strong>DOCX</strong> from this template, filled from your upload + edits.
             </p>
             {result.review_hint && (
               <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
                 {result.review_hint}
               </p>
             )}
             <p className="mt-2 text-xs text-slate-500">
               Editable output: {(result.editable_output_formats || ['docx']).join(', ').toUpperCase()}
             </p>
             {result.validation && (
               <p className="mt-1 text-xs text-slate-500">
                 Validation: {result.validation.passed ? 'Passed institutional checks' : `Needs fixes (${result.validation.missing_fields.length} missing fields)`}
               </p>
             )}
             {result.preview_url && (
               <a
                 href={`${API_ORIGIN}${result.preview_url}`}
                 target="_blank"
                 rel="noreferrer"
                 className="inline-block mt-2 text-xs font-bold text-indigo-700 underline"
               >
                 Open generated preview PDF
               </a>
             )}
             <p className="mt-2 text-xs text-slate-500">
               LLM verification: {result.verification?.approved ? 'Passed' : 'Needs manual review'}
             </p>
          </div>

          <div>
             <h3 className="font-bold text-slate-800 mb-4">Verify & Edit Data</h3>
             <div className="grid grid-cols-2 gap-4">
                {Object.keys(editedData).map(key => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{key.replace(/_/g, ' ')}</label>
                    <input 
                      type="text" 
                      value={typeof editedData[key] === 'object' ? JSON.stringify(editedData[key]) : editedData[key]}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white"
                    />
                  </div>
                ))}
             </div>
          </div>

          <div className="pt-6">
            {user?.role === 'admin' ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApprove}
                disabled={generating}
                className="w-full px-8 py-4 rounded-xl font-bold text-white uppercase tracking-widest bg-emerald-500 shadow-xl shadow-emerald-500/20 flex justify-center"
              >
                {generating ? 'Generating File...' : 'Approve & Generate DOCX'}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmitForAdmin}
                disabled={submitting}
                className="w-full px-8 py-4 rounded-xl font-bold text-white uppercase tracking-widest bg-indigo-600 shadow-xl shadow-indigo-500/20 flex justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting…' : 'Submit For Admin Approval'}
              </motion.button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center p-8 bg-emerald-50 rounded-2xl border border-emerald-200">
           <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
           <h3 className="text-xl font-bold text-emerald-900 mb-2">Document Ready!</h3>
           <a 
             href={`${API_ORIGIN}${finalDoc}`} 
             target="_blank" 
             rel="noreferrer"
             className="inline-block mt-4 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full transition-colors"
           >
             Download Final File
           </a>
        </div>
      )}
    </div>
  );
}
