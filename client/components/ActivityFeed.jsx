"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ChartNoAxesCombined, Wand2, ChevronRight } from 'lucide-react';

const ActivityFeed = () => {
  const activities = [
    {
      id: 1,
      user: "Sarah Chen",
      action: "published",
      target: "Market Research.pdf",
      subtitle: "Identified 3 new growth quadrants",
      time: "14:22 PM",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBEi-uSwmHETr2ujrfkc7T1YLe5wyfmkYwuBnNlCIcGTjxDiqQ4DOfwAWvRoyRfNs0GHfQa-04g2GeTDZjb-lm8udj04DBKOxtco_LBKGixdFT2MbpY4hk7BDGu3BmEs9meakWWQYYdu7EbTCUgGCODpF91fRQCADNTk08bj5S9I7Z_5dbbMEk2FS39_S2OIByi9CuCy-uffVkp6dx8dFUAfbON9UKOVxWcdhAHm1Z81oI8vS_0Aen0kg7qQo26-o5dKl2yw62Q7uk"
    },
    {
      id: 2,
      user: "System Oracle",
      action: "updated",
      target: "Resource Allocation",
      subtitle: "Optimization level reached 98.4%",
      time: "12:05 PM",
      iconColor: "text-teal-600",
      bgColor: "bg-teal-50",
      borderColor: "border-teal-100",
      icon: Wand2
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-body text-xl font-bold flex items-center gap-3 px-2 text-slate-900">
        <ChartNoAxesCombined className="text-indigo-600 w-6 h-6" />
        Live Interaction Stream
      </h2>
      
      <motion.div 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="space-y-4"
      >
        {activities.map((act) => (
          <motion.div 
            key={act.id}
            variants={item}
            className="glass-panel hover:bg-white transition-all rounded-2xl p-5 flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              {act.avatar ? (
                <div className="w-12 h-12 rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                  <img src={act.avatar} alt={act.user} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className={`w-12 h-12 rounded-xl ${act.bgColor} border ${act.borderColor} flex items-center justify-center ${act.iconColor} shadow-sm`}>
                  <act.icon className="w-6 h-6 fill-current" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-600">
                  <span className="font-bold text-slate-900">{act.user}</span> {act.action} {" "}
                  <span className="font-display italic text-indigo-600">{act.target}</span>
                </p>
                <p className="font-sans text-[10px] text-slate-400 uppercase tracking-wider mt-1 font-semibold">
                  {act.subtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 pr-2">
              <span className="text-[10px] font-sans text-slate-400 font-bold">{act.time}</span>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default ActivityFeed;
