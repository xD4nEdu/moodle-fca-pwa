import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Bell, Calendar } from 'lucide-react';

const NotificationItem = ({ date, message, isNew = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative group rounded-2xl overflow-hidden transition-all duration-300 ${
        isOpen ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white/5 hover:bg-white/10 border border-white/5'
      } ${isNew ? 'ring-1 ring-fca-orange/30' : ''}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full text-left p-4 pr-12 focus:outline-none"
      >
        {/* Header (Collapsed Info) */}
        <div className="flex flex-col gap-1.5 overflow-hidden">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase opacity-40">
            <Calendar className="w-3 h-3" />
            <span>{date}</span>
            {isNew && (
              <span className="bg-fca-orange text-white px-1.5 py-0.5 rounded-full text-[8px] animate-pulse">
                NUEVA
              </span>
            )}
          </div>
          <p className={`text-sm font-semibold text-slate-100 transition-all duration-300 ${
            isOpen ? '' : 'truncate'
          }`}>
            {message}
          </p>
        </div>

        {/* Action Icon */}
        <div className="absolute top-1/2 -translate-y-1/2 right-4 text-white/20 group-hover:text-white/40 transition-colors">
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-white/5 mt-2">
              <div className="bg-fca-orange/5 p-3 rounded-xl border border-fca-orange/10">
                <p className="text-sm leading-relaxed text-slate-200/90 whitespace-pre-line">
                  {message}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NotificationItem;
