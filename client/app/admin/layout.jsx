"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen relative overflow-x-hidden selection:bg-indigo-600 selection:text-white">
        <Sidebar isAdmin={true} />
        <Header />
        
        {/* Admin Content Canvas */}
        <div className="ml-64 pt-28 px-12 pb-12 relative z-10">
          <section className="relative">
            {children}
          </section>
        </div>

        {/* Admin specific decorations or layers could go here */}
      </div>
    </ProtectedRoute>
  );
}
