"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { motion } from 'framer-motion';
import InsightCard from '@/components/InsightCard';
import ActivityFeed from '@/components/ActivityFeed';
import MetricsPanel from '@/components/MetricsPanel';
import CommandBar from '@/components/CommandBar';
import DocumentWizard from '@/components/DocumentWizard';

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-x-hidden selection:bg-indigo-600 selection:text-white">
      <Sidebar />
      <Header />
      
      {/* Main Content Canvas */}
      <div className="ml-64 pt-28 px-12 pb-12 relative z-10">
        <section className="relative">
          {/* Hero Header */}
          <motion.header 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="font-sans text-[10px] text-indigo-600 font-bold tracking-[0.3em] uppercase">Intelligence Layer</span>
              <div className="h-px w-24 bg-gradient-to-r from-indigo-300 to-transparent"></div>
            </div>
            <h1 className="font-body text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Team <span className="font-display italic font-medium text-indigo-600">Activity Hub</span>
            </h1>
          </motion.header>

          {/* Bento Grid Dashboard */}
          <div className="grid grid-cols-12 gap-8">
            {/* Main Activity Feed (Left - 8 columns) */}
            <div className="col-span-8 flex flex-col gap-8">
              <InsightCard />
              <DocumentWizard />
            </div>

            {/* Right Side Panels (4 columns) */}
            <MetricsPanel />
          </div>
        </section>
      </div>

      <Footer />
      <CommandBar />
    </main>
  );
}

const Footer = () => {
  return (
    <footer className="flex justify-between items-center px-12 py-8 ml-64 bg-transparent font-sans text-[10px] tracking-[0.2em] uppercase font-bold opacity-60 z-10 relative">
      <div className="flex gap-8">
        <a className="text-slate-600 hover:text-indigo-600 transition-colors" href="#">Security</a>
        <a className="text-slate-600 hover:text-indigo-600 transition-colors" href="#">Legal</a>
        <a className="text-slate-600 hover:text-indigo-600 transition-colors" href="#">Endpoints</a>
      </div>
      <div className="text-slate-600">
        SmartDoc-AI v2.4.0 — <span className="font-bold text-indigo-600">Neural Engine Active</span>
      </div>
    </footer>
  );
};
