"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Shield, ShieldCheck, ShieldAlert, Edit2, Search, Filter } from 'lucide-react';

const mockUsersData = [
  { id: 1, name: 'System Admin', username: 'admin', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=admin', email: 'admin@smartdoc.ai' },
  { id: 2, name: 'John Doe', username: 'john.doe', role: 'employee', avatar: 'https://i.pravatar.cc/150?u=john', email: 'john@smartdoc.ai' },
  { id: 3, name: 'Sarah Wilson', username: 'sarah.w', role: 'employee', avatar: 'https://i.pravatar.cc/150?u=sarah', email: 'sarah@smartdoc.ai' },
  { id: 4, name: 'Guest User', username: 'guest', role: 'guest', avatar: 'https://i.pravatar.cc/150?u=guest', email: 'guest@visitor.com' },
];

export default function UsersPage() {
  const [users, setUsers] = useState(mockUsersData);
  const [searchTerm, setSearchTerm] = useState('');

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'employee': return <Shield className="w-4 h-4 text-indigo-600" />;
      default: return <ShieldAlert className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'employee': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <motion.header 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
        className="mb-8 flex items-end justify-between"
      >
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-sans text-[10px] text-indigo-600 font-bold tracking-[0.3em] uppercase">RBAC Management</span>
            <div className="h-px w-24 bg-gradient-to-r from-indigo-300 to-transparent"></div>
          </div>
          <h1 className="font-body text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            User <span className="font-display italic font-medium text-indigo-600">Access Control</span>
          </h1>
        </div>
        
        <div className="flex gap-3 pb-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium w-64 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all shadow-sm"
            />
          </div>
          <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            <Filter size={16} /> Filter
          </button>
        </div>
      </motion.header>

      {/* Users Table */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="glass-panel overflow-hidden rounded-3xl border border-white/60 shadow-xl"
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">User</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Access Level</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative group-hover:scale-105 transition-transform">
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm tracking-tight">{user.name}</span>
                      <span className="text-xs text-slate-500 font-medium">{user.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getRoleBadgeClass(user.role)}`}>
                    {getRoleIcon(user.role)}
                    {user.role}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-slate-600">Active</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-100">
                    <Edit2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Footer Info */}
      <p className="mt-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        Showing {users.length} authenticated users — Changes are audited in real-time
      </p>
    </div>
  );
}
