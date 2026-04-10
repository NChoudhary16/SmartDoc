"use client";

import React, { useEffect, useState } from 'react';
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
  ShieldCheck,
  Upload,
  LogOut,
  AppWindow,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

const Sidebar = () => {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { isGuest, canUploadDocuments, isAdmin } = usePermissions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { icon: Sparkles, label: "Landing Page", href: "/", show: true },
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", show: true },
    { icon: ShieldCheck, label: "Admin Center", href: "/admin", show: isAdmin },
    { icon: Upload, label: "Upload Documents", href: "/upload", show: canUploadDocuments },
    { icon: Search, label: "Track Status", href: "/track", show: true },
    { icon: AppWindow, label: "Templates", href: "/templates", show: canUploadDocuments },
    { icon: FileText, label: "My Documents", href: "#", show: !isGuest },
    { icon: FolderSearch, label: "Shared Assets", href: "#", show: true },
    { icon: Shapes, label: "Workspaces", href: "#", show: !isGuest },
    { icon: Archive, label: "Archive", href: "#", show: !isGuest },
  ];

  if (!mounted) return null;

  return (
    <motion.nav 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed left-0 top-0 flex flex-col p-4 gap-4 h-screen w-64 border-r border-slate-200 bg-white/60 backdrop-blur-xl font-body tracking-tight z-50"
    >
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-2 mb-8 mt-2">
        <div className="w-10 h-10 rounded-xl liquid-gradient flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="text-white w-6 h-6 fill-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold bg-gradient-to-br from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
            SmartDoc
          </span>
          <span className="font-sans text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            AI Portals
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex flex-col gap-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {navItems.filter(item => item.show).map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 transition-all rounded-xl ${
                isActive 
                  ? "text-indigo-700 bg-indigo-50 font-semibold shadow-sm border border-indigo-100" 
                  : "text-slate-600 hover:text-indigo-700 hover:bg-slate-50 border border-transparent"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* New Document Button */}
      {canUploadDocuments && (
        <button className="mt-2 mb-4 liquid-gradient text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-95 transition-all text-sm tracking-wide">
          <Plus className="w-5 h-5" />
          New Document
        </button>
      )}

      {/* Footer / User Profile Card */}
      <div className="flex flex-col gap-2 border-t border-slate-200/60 pt-4 mt-auto">
        <div className="px-3 py-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:border-slate-200 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200">
              <img src={user?.avatar || "https://i.pravatar.cc/150"} alt="User" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800 line-clamp-1">{user?.name || 'Guest User'}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                {user?.role || 'Guest'}
              </span>
            </div>
          </div>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Sidebar;
