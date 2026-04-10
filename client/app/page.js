"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Shield, 
  Zap, 
  ArrowRight, 
  Star, 
  Upload, 
  FileText, 
  Database, 
  CheckCircle2, 
  Cpu, 
  BookMarked,
  LayoutTemplate,
  FileEdit,
  Brain,
  LayoutDashboard,
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen relative overflow-x-hidden selection:bg-indigo-600 selection:text-white bg-slate-50 text-slate-900">
      {/* Cinematic Background Grid */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      {/* Header / Nav */}
      <nav className="fixed top-0 w-full z-50 px-12 py-6 flex justify-between items-center bg-white/40 backdrop-blur-xl border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl liquid-gradient flex items-center justify-center shadow-lg shadow-indigo-500/20">
             <Sparkles className="text-white w-6 h-6 fill-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-br from-indigo-600 to-indigo-800 bg-clip-text text-transparent">SmartDoc</span>
        </div>
        <div className="flex items-center gap-8">
           <a href="#features" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">Capabilities</a>
           <a href="#workflow" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">Workflow</a>
           <Link href="/dashboard" className="px-6 py-2.5 liquid-gradient text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all">
             Enter Dashboard
           </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-12 flex flex-col items-center text-center">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-6"
        >
          <span className="px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em] border border-indigo-100 flex items-center gap-2 mx-auto w-fit">
            <BookMarked className="w-3.5 h-3.5 text-indigo-600" /> RAG template engine · institutional standards
          </span>
        </motion.div>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-body text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] max-w-4xl mb-8"
        >
          Documents that <span className="font-display italic font-medium text-indigo-600">stay on-brand</span> <br />
          from <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">upload to DOCX</span>
        </motion.h1>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-slate-500 text-xl font-medium max-w-2xl leading-relaxed mb-12"
        >
          Retrieval-augmented generation matches every intake to your institutional templates, validates output, and tracks the full lifecycle—so startups, mentors, and administrators share one source of truth.
        </motion.p>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex gap-6"
        >
          <Link href="/dashboard" className="px-10 py-5 liquid-gradient text-white rounded-2xl font-bold flex items-center gap-3 shadow-2xl shadow-indigo-500/30 hover:scale-105 hover:rotate-1 transition-all">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/track" className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-800 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
            View Live Demo
          </Link>
        </motion.div>

        {/* Floating Decoration Icons */}
        <motion.div 
           animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
           transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
           className="absolute top-1/2 left-20 opacity-20 hidden lg:block"
        >
           <FileText className="w-16 h-16 text-indigo-600" />
        </motion.div>
        <motion.div 
           animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
           transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
           className="absolute bottom-20 right-32 opacity-20 hidden lg:block"
        >
           <Database className="w-20 h-20 text-indigo-800" />
        </motion.div>
      </section>

      {/* Workflow Animation Section */}
      <section id="workflow" className="py-32 bg-white relative">
        <div className="max-w-6xl mx-auto px-12">
          <div className="text-center mb-20">
             <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-4">RAG + validation</h2>
             <h3 className="text-4xl font-bold text-slate-900 tracking-tight">From raw file to governed DOCX</h3>
          </div>

          <WorkflowAnimation />
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-12">
          <div className="grid grid-cols-12 gap-8 items-center mb-20">
             <div className="col-span-12 lg:col-span-6">
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight">
                  Built for <br />
                  <span className="text-indigo-600">programs & portfolios</span>
                </h3>
             </div>
             <div className="col-span-12 lg:col-span-6">
                <p className="text-slate-500 font-medium text-lg leading-relaxed">
                  SmartDoc pairs extraction with a <strong className="text-slate-700 font-semibold">retrieval layer</strong> over your template library so generated documents follow institutional format rules—then AI fills forms, flags gaps, and routes approvals to the right dashboard.
                </p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={LayoutTemplate} 
              title="RAG on your templates" 
              desc="Semantic retrieval picks the right institutional template every time—so structure, headings, and field layouts stay consistent with program standards."
              delay={0.1}
            />
            <FeatureCard 
              icon={CheckCircle2} 
              title="Generation & validation" 
              desc="Automates document creation, cross-checks AI-filled fields against source extracts, and tracks status from draft through approval."
              delay={0.2}
            />
            <FeatureCard 
              icon={FileEdit} 
              title="Editable DOCX output" 
              desc="Delivered as real Word files teams can revise—perfect for mentor feedback and final polish before submission."
              delay={0.3}
            />
            <FeatureCard 
              icon={Brain} 
              title="Smart form filling" 
              desc="NLP maps unstructured intake into structured slots, surfaces insights, and highlights missing or inconsistent data before sign-off."
              delay={0.4}
            />
            <FeatureCard 
              icon={LayoutDashboard} 
              title="Role-aware dashboards" 
              desc="Tailored views for startups, mentors, and administrators—upload pipelines, review queues, and compliance in one place."
              delay={0.5}
            />
            <FeatureCard 
              icon={Shield} 
              title="Institutional guardrails" 
              desc="Template-locked sections and validation gates reduce format drift and keep outward-facing documents aligned with your playbook."
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* Trust Quote / Stats */}
      <section className="py-32 liquid-gradient text-white">
        <div className="max-w-4xl mx-auto px-12 text-center">
           <Star className="w-12 h-12 fill-white mx-auto mb-10 opacity-40" />
           <p className="text-3xl font-newsreader italic leading-relaxed mb-12">
             "SmartDoc has reduced our manual entry overhead by over 85% in the first quarter alone. It's not just a tool; it's the nervous system of our operations."
           </p>
           <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/50 mb-4 shadow-xl">
                 <img src="https://i.pravatar.cc/100?u=ceo" alt="CEO" />
              </div>
              <h5 className="font-bold text-lg tracking-tight">Marcus Thorne</h5>
              <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Director of Logistics, OmniCorp</p>
           </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-40 bg-white text-center">
         <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-600 mb-8 animate-pulse">Ready to evolve?</h2>
         <h3 className="text-6xl font-black text-slate-900 tracking-tighter mb-12">Start your automation journey.</h3>
         <Link href="/dashboard" className="px-12 py-6 bg-slate-900 text-white rounded-3xl font-black text-lg shadow-2xl hover:bg-indigo-600 hover:scale-[1.05] transition-all transform hover:-rotate-1 active:scale-95 inline-flex items-center gap-3">
            Enter Command Center <Zap className="w-6 h-6 fill-white" />
          </Link>
      </section>

      <footer className="py-12 px-12 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
         <div>&copy; 2026 SmartDoc-AI. Neural Engine v4.2.</div>
         <div className="flex gap-8">
            <a href="#" className="hover:text-indigo-600 transition-colors">Twitter</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Documentation</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
         </div>
      </footer>
    </main>
  );
}

const WorkflowAnimation = () => {
  const [step, setStep] = useState(0);
  const steps = [
    { title: 'Ingest', icon: Upload, desc: 'PDFs and Office files enter the pipeline with full traceability.' },
    { title: 'Extract', icon: Cpu, desc: 'Text and structure become machine-readable source data.' },
    { title: 'RAG match', icon: BookMarked, desc: 'Embeddings retrieve the closest institutional template from your library.' },
    { title: 'DOCX + track', icon: FileEdit, desc: 'Validated fills merge into editable Word output with lifecycle tracking.' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative p-12 glass-panel rounded-[40px] border-slate-200/60 shadow-2xl bg-white overflow-hidden min-h-[500px] flex items-center justify-center">
      <div className="grid grid-cols-4 gap-4 w-full relative z-10">
        {steps.map((s, idx) => (
          <div key={idx} className="flex flex-col items-center opacity-100">
             <motion.div 
                animate={{ 
                  scale: step === idx ? 1.2 : 1,
                  backgroundColor: step === idx ? '#4f46e5' : '#f8fafc',
                  color: step === idx ? '#fff' : '#64748b'
                }}
                className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-colors mb-6"
             >
                <s.icon className="w-8 h-8" />
             </motion.div>
             <h4 className={`font-bold transition-all ${step === idx ? 'text-slate-900 text-lg' : 'text-slate-400 text-sm'}`}>{s.title}</h4>
             <AnimatePresence mode="wait">
                {step === idx && (
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-slate-500 text-center text-xs mt-4 font-medium max-w-[150px]"
                  >
                    {s.desc}
                  </motion.p>
                )}
             </AnimatePresence>
          </div>
        ))}

        {/* Connection Arcs */}
        <div className="absolute top-10 left-0 w-full h-1 border-t-2 border-dashed border-slate-100 z-0"></div>
        <div className="absolute top-10 left-0 h-1 bg-gradient-to-r from-indigo-500 to-transparent z-0 transition-all duration-1000" style={{ width: `${(step / (steps.length-1)) * 100}%` }}></div>
      </div>
      
      {/* Moving Pulse Overlay */}
      <AnimatePresence>
        <motion.div 
          key={step}
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: '100%', opacity: 0.1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="absolute inset-0 bg-indigo-500 skew-x-12 z-0"
        ></motion.div>
      </AnimatePresence>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, delay }) => (
  <motion.div 
    initial={{ y: 20, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay }}
    className="group p-10 bg-white border border-slate-100 rounded-3xl hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all cursor-default"
  >
    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-600 transition-all">
       <Icon className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors" />
    </div>
    <h4 className="text-xl font-bold text-slate-900 mb-2">{title}</h4>
    <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
  </motion.div>
);
