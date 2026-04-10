"use client";

import React from 'react';
import { motion } from 'framer-motion';

const MetricsPanel = () => {
  const members = [
    {
      name: "Elena Rodriguez",
      task: "Syncing",
      target: "Global_Assets",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBug_2v7rDQwmmNG2lRgYvBLkHtiDPFysEOG6_NzMho01q4a_W-vpyZ91xCOkg2Dg5la9V5uvz_iYNMcMQpBJOr0TiSu377OdH4rDjiybpGoVq6KsAgM01wCobr51AFUhX9TwaA4aqe4qh6pJUq9PCWtGgLfDR-meuEtRap2tzkHNCscxaUnmLLOM1XbFyoViVXhQudnxZ64wQQuTG8Qdfd9fuRC-1gB4u8dIAXhUl0EA4_yCT0Q1vCZWb1-fAl2mQuv6jVg4cGVOI"
    },
    {
      name: "David Vance",
      task: "Annotating",
      target: "Design_v4",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDrOmrlBRBhg009PGlqqpBM9Q9CeqJS_c4O1Y2jjPVvSsAh4N5vhSLuJo2YHA_6tLxJEhPBJkC67Bw1Cwb-qe7dHQb6cQCMFyNmqL2mokZtqEVd7pbW8dGpQRJ32JZQHLZ8KV4FzH_VR3au7IbbaDGEk3u-4SKzrWBqOghTNSzaHnvUHonh-bnl52soqjzBDLnY-RxHYrylKcN0R55qmpxWKg1RAYKNTRm0hv6B7ziZfOTKRlgH5o70EEc657Q-yMcng_OolSTwfog"
    }
  ];

  return (
    <div className="col-span-4 flex flex-col gap-8">
      {/* Active Members Card */}
      <motion.div 
        initial={{ x: 20, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
        className="glass-panel rounded-3xl p-6 border-slate-200"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-body font-bold text-sm text-slate-900">Presence</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
            <span className="font-sans text-[10px] text-indigo-600 font-bold uppercase tracking-widest">5 Active Now</span>
          </div>
        </div>
        <div className="space-y-6">
          {members.map((member, i) => (
            <div key={i} className="flex items-center gap-4 group cursor-pointer">
              <div className="relative">
                <img 
                  src={member.avatar} 
                  alt={member.name}
                  className="w-11 h-11 rounded-xl object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500 shadow-sm border border-slate-100" 
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold group-hover:text-indigo-600 transition-colors text-slate-900">{member.name}</p>
                <p className="text-[10px] text-slate-500 font-sans tracking-wide font-medium">
                  {member.task} <span className="italic text-indigo-600 font-bold">{member.target}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-8 py-3 rounded-xl text-[10px] font-bold text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-white border border-slate-200 transition-all uppercase tracking-[0.2em] font-sans">
          Expand Directory
        </button>
      </motion.div>

      {/* Velocity Metric Card */}
      <motion.div 
        initial={{ x: 20, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
        className="glass-panel rounded-3xl p-6 border-slate-200"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-body font-bold text-sm text-slate-900">Project Velocity</h3>
            <p className="text-[10px] uppercase font-sans text-indigo-600 tracking-widest mt-1 font-bold">Efficiency Delta</p>
          </div>
          <span className="text-2xl font-black text-slate-900 font-body tracking-tighter">+24.8%</span>
        </div>
        <div className="flex items-end gap-1.5 h-16 mb-4">
          <div className="flex-1 bg-slate-100 h-[30%] rounded-md"></div>
          <div className="flex-1 bg-slate-100 h-[50%] rounded-md"></div>
          <div className="flex-1 bg-slate-200 h-[45%] rounded-md"></div>
          <div className="flex-1 bg-indigo-100 h-[70%] rounded-md"></div>
          <div className="flex-1 liquid-gradient h-[90%] rounded-md shadow-lg shadow-indigo-500/20"></div>
        </div>
        <div className="pt-4 border-t border-slate-100 flex justify-between">
          <span className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-widest">Target Release</span>
          <span className="text-xs font-bold text-indigo-600 font-body">DECEMBER 12</span>
        </div>
      </motion.div>
    </div>
  );
};

export default MetricsPanel;
