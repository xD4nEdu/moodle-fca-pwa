import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Calendar, Info } from 'lucide-react';

const NotificationItem = ({ date, message, isNew = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Parsear el mensaje si tiene el nuevo formato estructurado
  const hasDetails = message.includes('[DETAILS]');
  const summaryPart = hasDetails ? message.split('[DETAILS]')[0].trim() : message;
  const detailsPart = hasDetails ? message.split('[DETAILS]')[1].trim() : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative group rounded-3xl overflow-hidden transition-all duration-300 ${
        isOpen ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white/5 hover:bg-white/10 border border-white/5 shadow-lg shadow-black/20'
      } ${isNew ? 'ring-1 ring-fca-orange/40' : ''}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full text-left p-5 pr-14 focus:outline-none"
      >
        <div className="flex flex-col gap-2 overflow-hidden">
          {/* Tag and Date */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase opacity-50 text-slate-400">
              <Calendar className="w-2.5 h-2.5" />
              <span>{date}</span>
            </div>
            {isNew && (
              <span className="bg-fca-orange text-white px-2 py-0.5 rounded-full text-[8px] font-bold shadow-sm shadow-fca-orange/20 uppercase tracking-tighter">
                NUEVA
              </span>
            )}
          </div>

          {/* Main Summary */}
          <p className={`text-[15px] leading-snug font-medium text-slate-100 transition-all duration-300 ${
            isOpen ? '' : 'line-clamp-2'
          }`}>
            {summaryPart}
          </p>
        </div>

        {/* Action Icon */}
        <div className="absolute top-1/2 -translate-y-1/2 right-4 text-white/20 group-hover:text-white/50 transition-colors">
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0, scale: isOpen ? 1.2 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <ChevronRight className={`w-5 h-5 ${isOpen ? 'text-fca-orange' : ''}`} />
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
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0">
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-fca-orange shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-fca-orange/80 uppercase tracking-widest">Detalles del Aviso</p>
                    <p className="text-sm leading-relaxed text-slate-200/90 whitespace-pre-line antialiased">
                      {detailsPart || summaryPart}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NotificationItem;
