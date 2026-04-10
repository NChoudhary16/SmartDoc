"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import DocumentWizard from '@/components/DocumentWizard';
import { motion } from 'framer-motion';

export default function UploadPage() {
  return (
    <ProtectedRoute allowedRoles={['employee', 'admin']}>
      <main className="min-h-screen relative overflow-x-hidden selection:bg-indigo-600 selection:text-white">
        <Sidebar />
        <Header />
        
        <div className="ml-64 pt-28 px-12 pb-12 relative z-10">
          <section className="max-w-4xl">
            <motion.header 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="mb-12"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="font-sans text-[10px] text-indigo-600 font-bold tracking-[0.3em] uppercase">Document Processing</span>
                <div className="h-px w-24 bg-gradient-to-r from-indigo-300 to-transparent"></div>
              </div>
              <h1 className="font-body text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Upload & <span className="font-display italic font-medium text-indigo-600">Analyze</span>
              </h1>
              <p className="text-slate-500 mt-4 max-w-xl font-medium">
                Upload PDF, DOCX, or high-res images. The pipeline extracts key fields, runs verification, and sends documents for admin approval.
              </p>
            </motion.header>

            <div className="mt-8">
              <DocumentWizard />
            </div>
          </section>
        </div>

        {/* Global Decorations (copied from RootLayout/Page if needed, but they are in body of root layout) */}
      </main>
    </ProtectedRoute>
  );
}
