"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  FolderSearch, 
  Shapes, 
  Archive, 
  Plus, 
  Settings, 
  HelpCircle,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: ShieldCheck, label: "Admin Center", href: "/admin" },
    { icon: FileText, label: "My Documents", href: "#" },
    { icon: FolderSearch, label: "Shared Assets", href: "#" },
    { icon: Shapes, label: "Workspaces", href: "#" },
    { icon: Archive, label: "Archive", href: "#" },
  ];

  return (
    <motion.nav 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed left-0 top-0 flex flex-col p-4 gap-4 h-screen w-64 border-r border-slate-200 bg-white/60 backdrop-blur-xl font-body tracking-tight z-50"
    >
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-xl liquid-gradient flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="text-white w-6 h-6 fill-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold bg-gradient-to-br from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
            SmartDoc-AI
          </span>
          <span className="font-sans text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            AI Command Center
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex flex-col gap-1 flex-1">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 transition-all rounded-xl ${
                isActive 
                  ? "text-indigo-700 bg-indigo-50 font-semibold" 
                  : "text-slate-600 hover:text-indigo-700 hover:bg-slate-100/80"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* New Document Button */}
      <button className="mt-4 mb-8 liquid-gradient text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 transition-all">
        <Plus className="w-5 h-5" />
        New Document
      </button>

      {/* Footer Links */}
      <div className="flex flex-col gap-1 border-t border-slate-100 pt-4">
        <a className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-indigo-700 hover:bg-slate-50 transition-all text-sm rounded-lg" href="#">
          <Settings className="w-4 h-4" />
          Settings
        </a>
        <a className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-indigo-700 hover:bg-slate-50 transition-all text-sm rounded-lg" href="#">
          <HelpCircle className="w-4 h-4" />
          Support
        </a>
      </div>
    </motion.nav>
  );
};

export default Sidebar;
