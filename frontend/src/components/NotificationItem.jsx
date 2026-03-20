import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, CheckCircle2 } from 'lucide-react';

const NotificationItem = ({ id, date, message, isRead = false, onRead }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNew, setShowNew] = useState(!isRead);

  // Parsear el mensaje estructurado
  const hasDetails = message.includes('[DETAILS]');
  const summaryPart = hasDetails ? message.split('[DETAILS]')[0].trim() : message;
  const detailsPart = hasDetails ? message.split('[DETAILS]')[1].trim() : null;

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (showNew && onRead) {
      onRead(id);
      setShowNew(false);
    }
  };

  return (
    <div className="relative mb-3 rounded-[1.8rem] overflow-hidden">
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative z-10 transition-all duration-300 ${
          isOpen 
            ? 'bg-black/5 dark:bg-white/12 ring-2 ring-fca-orange/20 dark:ring-white/20' 
            : 'bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-black/5 dark:border-white/5 shadow-md dark:shadow-lg'
        } ${showNew ? 'ring-2 ring-fca-orange/40' : ''}`}
      >
        <div className="p-5 cursor-pointer select-none" onClick={handleOpen}>
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl transition-all shadow-inner ${
              showNew 
                ? 'bg-fca-orange text-white' 
                : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400'
            }`}>
              {showNew ? <Info className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase italic opacity-70">{date}</span>
                {showNew && (
                  <span className="bg-fca-orange text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase shadow-glow-sm">Nuevo</span>
                )}
              </div>
              <p className={`text-[13px] font-bold leading-tight transition-colors ${
                showNew 
                  ? 'text-slate-900 dark:text-slate-100' 
                  : 'text-slate-700 dark:text-slate-400'
              }`}>
                {summaryPart}
              </p>
            </div>
          </div>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 20 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-5 border-t border-black/5 dark:border-white/10">
                  <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-5 border border-black/5 dark:border-white/5 shadow-inner">
                     <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 bg-fca-orange rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-fca-orange/80">Detalles del Aviso</span>
                     </div>
                     <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                       {detailsPart || summaryPart}
                     </p>
                  </div>
                  <div className="mt-4 flex justify-between items-center px-1">
                     <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter italic">Este aviso caducará pronto</span>
                     <CheckCircle2 className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default NotificationItem;
