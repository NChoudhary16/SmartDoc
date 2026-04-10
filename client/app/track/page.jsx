"use client";

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import { motion } from 'framer-motion';
import { Search, Loader2, CheckCircle2, Clock, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { fetchDocuments, trackDocument } from '@/lib/api';

export default function TrackPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);

  useEffect(() => {
    fetchDocuments()
      .then((docs) => setRecentDocs(docs.slice(0, 5)))
      .catch((error) => console.error('Failed to load recent documents', error));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setIsSearching(true);
    trackDocument(searchQuery)
      .then(({ result: found, recent }) => {
        setResult(found || 'not_found');
        if (recent?.length) setRecentDocs(recent);
      })
      .catch(() => setResult('not_found'))
      .finally(() => setIsSearching(false));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
      case 'dispatched': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'uploaded':
      case 'matched':
      case 'generated_pdf': return <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />;
      case 'flagged':
      case 'rejected': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default: return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'dispatched': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'uploaded':
      case 'matched':
      case 'generated_pdf': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'flagged':
      case 'rejected': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen relative overflow-x-hidden selection:bg-indigo-600 selection:text-white">
        <Sidebar />
        <Header />
        
        <div className="ml-64 pt-28 px-12 pb-12 relative z-10">
          <section className="max-w-5xl">
            <motion.header 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="mb-12"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="font-sans text-[10px] text-indigo-600 font-bold tracking-[0.3em] uppercase">Status Tracking</span>
                <div className="h-px w-24 bg-gradient-to-r from-indigo-300 to-transparent"></div>
              </div>
              <h1 className="font-body text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Trace Your <span className="font-display italic font-medium text-indigo-600">Documents</span>
              </h1>
              <p className="text-slate-500 mt-4 max-w-xl font-medium">
                Enter your document ID or filename to track the real-time processing status of your AI operations.
              </p>
            </motion.header>

            {/* Search Bar */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="glass-panel p-2 rounded-2xl flex items-center mb-12 shadow-sm border border-slate-200/60 max-w-2xl"
            >
              <form onSubmit={handleSearch} className="flex-1 flex items-center px-4">
                <Search className="w-5 h-5 text-slate-400 mr-3" />
                <input 
                  type="text" 
                  placeholder="Enter tracking ID (e.g. DOC-9821)..."
                  className="bg-transparent border-none focus:ring-0 text-slate-900 w-full font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="liquid-gradient px-6 py-3 rounded-xl text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track Status"}
              </button>
            </motion.div>

            {/* Content Area */}
            <div className="grid grid-cols-12 gap-8">
              {/* Results / Empty State */}
              <div className="col-span-12 lg:col-span-8">
                {result === 'not_found' && (
                   <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel p-12 rounded-3xl border-dashed border-2 border-slate-200 flex flex-col items-center text-center"
                   >
                     <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
                        <AlertCircle className="w-8 h-8 text-rose-500" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-800 mb-2">Document Not Found</h3>
                     <p className="text-slate-500 max-w-sm mb-6">
                       We couldn't find any document matching "<span className="font-semibold">{searchQuery}</span>". Please check the ID and try again.
                     </p>
                   </motion.div>
                )}

                {result && result !== 'not_found' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-8 rounded-3xl border border-indigo-100 shadow-xl shadow-indigo-500/5"
                  >
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                          <FileText className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{result.original_file}</h3>
                          <p className="text-slate-400 text-sm font-medium">Tracking ID: {result.id}</p>
                        </div>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${getStatusColor(result.status)}`}>
                        {getStatusIcon(result.status)}
                        {result.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mb-8">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Type</p>
                        <p className="font-bold text-slate-800">{result.document_type || 'General'}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Updated</p>
                        <p className="font-bold text-slate-800">{new Date(result.updated_at || result.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Confidence</p>
                        <p className="font-bold text-indigo-600">{Math.round((result.validation_report?.score || result.verification_report?.confidence || 0) * 100)}%</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6 flex justify-between items-center">
                      <div className="flex -space-x-2">
                         {[1,2,3].map(i => (
                           <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm">
                             <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" className="w-full h-full object-cover" />
                           </div>
                         ))}
                         <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                           +2
                         </div>
                      </div>
                      <button className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:gap-3 transition-all">
                        View Details <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Recent History Table */}
                <div className="mt-12 pt-8 border-t border-slate-200/60">
                  <h4 className="text-lg font-bold text-slate-800 mb-6">Recently Tracked</h4>
                  <div className="flex flex-col gap-3">
                    {recentDocs.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50/80 transition-all border border-transparent hover:border-slate-100 group cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{item.original_file}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${getStatusColor(item.status)}`}>
                             {item.status}
                           </div>
                           <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                              <ArrowRight className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Stats */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                <div className="glass-panel p-6 rounded-3xl border border-slate-200/60">
                   <h5 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                     <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                     System Nodes
                   </h5>
                   <div className="flex flex-col gap-4">
                      {[
                        { label: 'Ingestion Engine', status: 'Online', delay: '12ms' },
                        { label: 'OCV Extraction', status: 'Online', delay: '45ms' },
                        { label: 'Template Matcher', status: 'Online', delay: '8ms' },
                        { label: 'Storage Layer', status: 'Standby', delay: '-' },
                      ].map((node, i) => (
                        <div key={i} className="flex items-center justify-between">
                           <span className="text-xs font-medium text-slate-500">{node.label}</span>
                           <div className="flex items-center gap-3">
                             <span className="text-[10px] font-bold text-slate-400 tracking-wider transition-all">{node.delay}</span>
                             <div className={`w-2 h-2 rounded-full ${node.status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="liquid-gradient p-8 rounded-3xl text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                   <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                      <Sparkles className="w-32 h-32" />
                   </div>
                   <h5 className="font-bold text-lg mb-2 relative z-10">Smart Alerts</h5>
                   <p className="text-indigo-100 text-xs leading-relaxed mb-6 opacity-80 relative z-10">
                     Enable push notifications to receive real-time updates on your document processing status.
                   </p>
                   <button className="w-full py-3 bg-white/20 backdrop-blur-md rounded-xl font-bold text-sm border border-white/30 hover:bg-white/30 transition-all relative z-10">
                     Enable Notifications
                   </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}

const Sparkles = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor"/>
  </svg>
);
