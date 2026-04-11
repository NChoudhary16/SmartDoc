"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <main className="min-h-screen relative overflow-x-hidden selection:bg-indigo-600 selection:text-white">
        <Sidebar />
        <Header />

        <div className="ml-64 pt-28 px-12 pb-12 relative z-10">
          <section className="relative">{children}</section>
        </div>

        <Footer />
      </main>
    </ProtectedRoute>
  );
}
