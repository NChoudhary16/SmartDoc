"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DocumentWizard() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [generating, setGenerating] = useState(false);
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

    try {
      // Point this to your backend express server running on port 5000
      const response = await fetch('http://localhost:5000/api/documents/process', {
        method: 'POST',
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
      const response = await fetch('http://localhost:5000/api/documents/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: editedData,
          templateName: result.suggested_template?.file_path || "default.docx",
          format: 'docx' // or pdf
        }),
      });

      const data = await response.json();
      if (data.success) {
        setFinalDoc(data.downloadUrl);
      } else {
        alert("Generation Failed: " + data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Error generating document");
    } finally {
      setGenerating(false);
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
               <input type="file" onChange={handleFileChange} className="mb-4" accept="image/*,.pdf" />
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
             <h3 className="text-indigo-800 font-bold mb-2">Suggested Template:</h3>
             <p className="text-indigo-900">{result.suggested_template?.name || "Unknown Template"}</p>
             <p className="text-sm text-indigo-600 truncate">{result.summary}</p>
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
             <motion.button 
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={handleApprove}
                 disabled={generating}
                 className="w-full px-8 py-4 rounded-xl font-bold text-white uppercase tracking-widest bg-emerald-500 shadow-xl shadow-emerald-500/20 flex justify-center"
               >
                 {generating ? 'Generating File...' : 'Approve & Generate Document'}
             </motion.button>
          </div>
        </div>
      ) : (
        <div className="text-center p-8 bg-emerald-50 rounded-2xl border border-emerald-200">
           <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
           <h3 className="text-xl font-bold text-emerald-900 mb-2">Document Ready!</h3>
           <a 
             href={`http://localhost:5000${finalDoc}`} 
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
