"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { motion } from 'framer-motion';
import InsightCard from '@/components/InsightCard';
import ActivityFeed from '@/components/ActivityFeed';
import MetricsPanel from '@/components/MetricsPanel';
import DocumentWizard from '@/components/DocumentWizard';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/context/AuthContext';
import AdminStats from '@/components/Admin/AdminStats';
import DocumentTable from '@/components/Admin/DocumentTable';
import DocumentReviewModal from '@/components/Admin/DocumentReviewModal';
import { Sparkles, Shield, Zap, Lock, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const { canUploadDocuments, isAdmin, isGuest, isMentor } = usePermissions();
  const [reviewingDoc, setReviewingDoc] = useState(null);

  return (
    <ProtectedRoute>
      <main className="min-h-screen relative overflow-x-hidden selection:bg-indigo-600 selection:text-white">
        <Sidebar />
        <Header />
        
        <div className="ml-64 pt-28 px-12 pb-12 relative z-10">
          <section className="relative">
            {/* Role-Based Dashboard Content */}
            {isAdmin ? (
              <AdminDashboard onReview={setReviewingDoc} />
            ) : isGuest ? (
              <GuestDashboard />
            ) : isMentor ? (
              <MentorDashboard canUploadDocuments={canUploadDocuments} user={user} />
            ) : (
              <EmployeeDashboard canUploadDocuments={canUploadDocuments} user={user} />
            )}
          </section>
        </div>

        <Footer />

        {reviewingDoc && (
          <DocumentReviewModal 
            document={reviewingDoc} 
            isOpen={!!reviewingDoc} 
            onClose={() => setReviewingDoc(null)} 
          />
        )}
      </main>
    </ProtectedRoute>
  );
}

const AdminDashboard = ({ onReview }) => (
  <div className="flex flex-col gap-8">
    <motion.header 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="font-sans text-[10px] text-emerald-600 font-bold tracking-[0.3em] uppercase">Administrators</span>
        <div className="h-px w-24 bg-gradient-to-r from-emerald-300 to-transparent"></div>
      </div>
      <h1 className="font-body text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
        Compliance & <span className="font-display italic font-medium text-emerald-600">template governance</span>
      </h1>
      <p className="mt-4 text-slate-500 max-w-2xl leading-relaxed">
        Enforce institutional formats across the cohort: RAG-matched templates, validation gates, and full audit trails from intake to dispatched DOCX.
      </p>
    </motion.header>

    <AdminStats />
    
    <div className="grid grid-cols-12 gap-8">
      {/* Left: Health and Priority */}
      <div className="col-span-8 flex flex-col gap-8">
        <InsightCard />
        
        <div className="glass-panel p-8 rounded-3xl border border-slate-200/60">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              Critical Queue
            </h3>
            <Link href="/admin" className="text-xs font-bold text-indigo-600 hover:gap-2 flex items-center transition-all group">
              Open Admin Center <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {[
              { id: "DOC-0021", name: "Q4_Strategy_Automation.pdf", user: "Sarah Chen", priority: "High" },
              { id: "DOC-0022", name: "Market_Research_V2.docx", user: "David Vance", priority: "Urgent" },
              { id: "DOC-0025", name: "Internal_Audit_Draft.pdf", user: "John Doe", priority: "Normal" },
            ].map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-100 hover:bg-white transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                      <Shield className="w-5 h-5" />
                   </div>
                   <div>
                     <p className="font-bold text-slate-800 text-sm">{doc.name}</p>
                     <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Submitted by {doc.user}</p>
                   </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                    doc.priority === 'Urgent' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                    doc.priority === 'High' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                    'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {doc.priority}
                  </span>
                  <button onClick={() => onReview(doc)} className="p-2 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Presence and Metrics */}
      <div className="col-span-4">
        <MetricsPanel />
      </div>
    </div>
  </div>
);

const EmployeeDashboard = ({ canUploadDocuments, user }) => (
  <div className="flex flex-col gap-8">
    <motion.header 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="font-sans text-[10px] text-indigo-600 font-bold tracking-[0.3em] uppercase">Startups & mentors</span>
        <div className="h-px w-24 bg-gradient-to-r from-indigo-300 to-transparent"></div>
      </div>
      <h1 className="font-body text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
        Pipeline <span className="font-display italic font-medium text-indigo-600">for your cohort</span>
      </h1>
      <p className="mt-4 text-slate-500 max-w-2xl leading-relaxed">
        Upload source documents, get AI-assisted extraction and RAG template matching, then download editable DOCX aligned with program standards—ready for mentor review.
      </p>
    </motion.header>

    <div className="glass-panel p-6 rounded-3xl border border-slate-200/60">
      <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-indigo-600 mb-2">Startup Workspace</p>
      <p className="text-slate-700 font-medium">
        {user?.name || 'Startup team'} can prepare institutional drafts, inspect extracted fields, and export editable DOCX output before admin approval.
      </p>
    </div>

    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-8 flex flex-col gap-8">
        <InsightCard />
        {canUploadDocuments && <DocumentWizard />}
        <ActivityFeed />
      </div>
      <div className="col-span-4">
        <MetricsPanel />
      </div>
    </div>
  </div>
);

const MentorDashboard = ({ canUploadDocuments, user }) => (
  <div className="flex flex-col gap-8">
    <motion.header 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="font-sans text-[10px] text-indigo-600 font-bold tracking-[0.3em] uppercase">Mentor Oversight</span>
        <div className="h-px w-24 bg-gradient-to-r from-indigo-300 to-transparent"></div>
      </div>
      <h1 className="font-body text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
        Validate <span className="font-display italic font-medium text-indigo-600">startup submissions</span>
      </h1>
      <p className="mt-4 text-slate-500 max-w-2xl leading-relaxed">
        Review structured drafts, surface missing fields early, and keep every submission aligned with institutional format standards before administration sees it.
      </p>
    </motion.header>

    <div className="glass-panel p-6 rounded-3xl border border-slate-200/60">
      <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-indigo-600 mb-2">Assigned Mentor</p>
      <p className="text-slate-700 font-medium">
        {user?.name || 'Mentor'} can inspect AI-filled forms, flag compliance gaps, and submit corrected drafts onward for final approval.
      </p>
    </div>

    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-8 flex flex-col gap-8">
        <InsightCard />
        {canUploadDocuments && <DocumentWizard />}
        <ActivityFeed />
      </div>
      <div className="col-span-4">
        <MetricsPanel />
      </div>
    </div>
  </div>
);

const GuestDashboard = () => (
  <div className="flex flex-col gap-12">
    <motion.header 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="text-center max-w-2xl mx-auto"
    >
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="font-sans text-[10px] text-indigo-500 font-bold tracking-[0.3em] uppercase italic">Preview access</span>
      </div>
      <h1 className="font-body text-6xl font-extrabold tracking-tight text-slate-900 leading-tight mb-6">
        See how <span className="font-display italic font-medium text-indigo-600">RAG + DOCX</span> fit your program
      </h1>
      <p className="text-slate-500 text-lg font-medium leading-relaxed mb-8">
        Sign in as a startup or mentor to run the full flow—template retrieval, smart form filling, validation, and tracked deliverables. Administrators get oversight and approvals.
      </p>
      <div className="flex items-center justify-center gap-4">
        <Link href="/login" className="px-8 py-4 liquid-gradient text-white rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-indigo-500/20 hover:scale-[1.05] transition-all">
          Upgrade Access <Zap className="w-5 h-5 fill-white" />
        </Link>
        <Link href="/track" className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all">
          Track Demo
        </Link>
      </div>
    </motion.header>

    <div className="grid grid-cols-3 gap-8">
      {[
        { title: "RAG template match", desc: "Semantic retrieval binds each upload to the right institutional layout and field schema.", icon: Sparkles },
        { title: "Editable Word output", desc: "Export DOCX for redlines and mentor comments—not locked PDFs.", icon: Star },
        { title: "Validation & tracking", desc: "AI checks fills against sources; status stays visible across roles.", icon: Shield },
      ].map((feat, i) => (
        <motion.div 
          key={i}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
          className="glass-panel p-8 rounded-3xl border border-slate-200/60 flex flex-col items-center text-center group hover:border-indigo-100 transition-all"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-indigo-50 group-hover:scale-110 transition-all">
            <feat.icon className="w-7 h-7 text-slate-400 group-hover:text-indigo-600" />
          </div>
          <h4 className="text-xl font-bold text-slate-800 mb-2">{feat.title}</h4>
          <p className="text-slate-500 text-sm leading-relaxed">{feat.desc}</p>
        </motion.div>
      ))}
    </div>

    {/* Restricted Area Preview */}
    <div className="mt-8 relative">
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white to-transparent z-10"></div>
      <div className="opacity-20 pointer-events-none blur-[1px]">
        <AdminStats />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
         <div className="bg-white/90 backdrop-blur-md p-10 rounded-3xl shadow-2xl border border-white flex flex-col items-center gap-4 max-w-md text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-2">
              <Lock className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-2xl font-black text-slate-900 tracking-tight">Access Restricted</h4>
            <p className="text-slate-500 text-sm font-medium">Dashboard metrics and document queues are reserved for high-clearance operatives.</p>
            <Link href="/login" className="mt-4 flex items-center gap-2 text-indigo-600 font-bold hover:gap-3 transition-all">
              Request Clearance <ArrowRight className="w-4 h-4" />
            </Link>
         </div>
      </div>
    </div>
  </div>
);
