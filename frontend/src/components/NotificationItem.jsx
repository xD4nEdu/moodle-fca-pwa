import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Info, CheckCircle2 } from 'lucide-react';

const NotificationItem = ({ id, date, message, isRead = false, onRead, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNew, setShowNew] = useState(!isRead);

  // Parsear el mensaje
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
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative group rounded-3xl overflow-hidden transition-all duration-300 ${
        isOpen 
          ? 'bg-black/5 dark:bg-white/10 ring-1 ring-black/10 dark:ring-white/20' 
          : 'bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 shadow-md dark:shadow-lg'
      } ${showNew ? 'ring-2 ring-fca-orange/40' : ''}`}
    >
      <div className="p-4 cursor-pointer relative">
        <div className="flex items-center gap-4" onClick={handleOpen}>
          <div className={`p-2.5 rounded-xl transition-transform ${
            showNew 
              ? 'bg-fca-orange/20 text-fca-orange' 
              : 'bg-black/5 dark:bg-white/5 text-slate-400 dark:text-slate-500'
          }`}>
            {showNew ? <Info className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">{date}</span>
              <div className="flex items-center gap-2">
                {showNew && (
                  <span className="bg-fca-orange text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">Nuevo</span>
                )}
              </div>
            </div>
            <p className={`text-sm font-bold leading-tight line-clamp-2 transition-colors ${
              showNew 
                ? 'text-slate-900 dark:text-slate-100' 
                : 'text-slate-600 dark:text-slate-400'
            }`}>
              {summaryPart}
            </p>
          </div>
        </div>

        {/* Botón de borrar discreto */}
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(id); }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all transform scale-90 hover:scale-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="pt-4 border-t border-black/5 dark:border-white/5">
                <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5">
                   <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 bg-fca-orange rounded-full animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-fca-orange/80">Detalles del Aviso</span>
                   </div>
                   <p className="text-xs text-slate-700 dark:text-slate-400 font-medium leading-relaxed whitespace-pre-wrap">
                     {detailsPart || summaryPart}
                   </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default NotificationItem;
