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
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#0D0D0D]/90 backdrop-blur-md rounded-[1.4rem] p-4 cursor-pointer overflow-hidden"
      >
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-xl ${isNew ? 'bg-fca-orange/20 text-fca-orange' : 'bg-white/5 text-slate-400'} group-hover:scale-110 transition-transform`}>
            <Info className="w-5 h-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">{date}</span>
              {isNew && <span className="bg-fca-orange text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Nuevo</span>}
            </div>
            {/* Solo resumen en colapsado */}
            <p className={`text-sm font-bold leading-tight line-clamp-2 ${isNew ? 'text-slate-100' : 'text-slate-300'}`}>
              {summaryPart}
            </p>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-white/5">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                   <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 bg-fca-orange rounded-full animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-fca-orange/80">Detalles del Aviso</span>
                   </div>
                   <p className="text-xs text-slate-400 font-medium leading-relaxed whitespace-pre-wrap">
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
