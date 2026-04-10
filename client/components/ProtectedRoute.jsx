"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in
        router.push('/login');
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Logged in but wrong role
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, loading, router, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-body text-center p-8">
        <div className="w-24 h-24 mb-6 rounded-3xl liquid-gradient flex items-center justify-center shadow-xl shadow-indigo-500/20">
          <ShieldAlert className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Access Restricted</h1>
        <p className="text-slate-500 max-w-md mb-8 text-lg font-medium leading-relaxed">
          Your current security clearance ({user.role}) does not permit access to this sector.
        </p>
        <button 
          onClick={() => router.push('/')}
          className="px-8 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return isAuthorized ? children : null;
}
