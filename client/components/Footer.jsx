"use client";

import React from "react";

export default function Footer() {
  return (
    <footer className="flex justify-between items-center px-12 py-8 ml-64 bg-transparent font-sans text-[10px] tracking-[0.2em] uppercase font-bold opacity-60 z-10 relative">
      <div className="flex gap-8">
        <a className="text-slate-600 hover:text-indigo-600 transition-colors" href="#">
          Security
        </a>
        <a className="text-slate-600 hover:text-indigo-600 transition-colors" href="#">
          Legal
        </a>
        <a className="text-slate-600 hover:text-indigo-600 transition-colors" href="#">
          Endpoints
        </a>
      </div>
      <div className="text-slate-600">
        SmartDoc-AI v2.4.0 — <span className="font-bold text-indigo-600">Neural Engine Active</span>
      </div>
    </footer>
  );
}
