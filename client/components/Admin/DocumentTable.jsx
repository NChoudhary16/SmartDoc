"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Edit2, ExternalLink, MoreVertical } from 'lucide-react';

const DocumentTable = ({ onReview }) => {
  const documents = [
    { id: "DOC-0021", name: "Q4_Strategy_Automation.pdf", type: "Automation", date: "2024-10-14", status: "Pending", user: "Sarah Chen" },
    { id: "DOC-0022", name: "Market_Research_V2.docx", type: "Extraction", date: "2024-10-14", status: "Reviewing", user: "David Vance" },
    { id: "DOC-0023", name: "Finance_Report_Final.pdf", type: "Automation", date: "2024-10-13", status: "Approved", user: "Elena Rodriguez" },
    { id: "DOC-0024", name: "Internal_Policy_Update.docx", type: "Extraction", date: "2024-10-12", status: "Rejected", user: "System Oracle" },
  ];

  const statusStyles = {
    Pending: "bg-amber-100/50 text-amber-700 border-amber-200",
    Reviewing: "bg-blue-100/50 text-blue-700 border-blue-200",
    Approved: "bg-emerald-100/50 text-emerald-700 border-emerald-200",
    Rejected: "bg-rose-100/50 text-rose-700 border-rose-200",
  };

  return (
    <div className="glass-panel rounded-3xl overflow-hidden border-slate-200/60 shadow-xl shadow-slate-200/20">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 font-sans">ID</th>
            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 font-sans">Document</th>
            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 font-sans">Owner</th>
            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 font-sans">Type</th>
            <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 font-sans">Status</th>
            <th className="px-6 py-4 text-right text-[10px] uppercase tracking-widest font-black text-slate-500 font-sans">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {documents.map((doc, i) => (
            <motion.tr
              key={doc.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 + 0.5 }}
              className="hover:bg-indigo-50/30 transition-colors group"
            >
              <td className="px-6 py-4 text-xs font-bold text-indigo-600 font-sans">{doc.id}</td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{doc.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium font-sans">Generated on {doc.date}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600 font-medium">{doc.user}</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-[10px] font-black text-slate-500 uppercase tracking-tight">
                  {doc.type}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 border rounded-lg text-[10px] font-black uppercase tracking-wider ${statusStyles[doc.status]}`}>
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
        <span className="text-2xs uppercase tracking-widest font-black text-slate-400">Showing 4 of 42 results</span>
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors shadow-sm">Previous</button>
          <button className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors shadow-sm">Next</button>
        </div>
      </div>
    </div>
  );
};

export default DocumentTable;
