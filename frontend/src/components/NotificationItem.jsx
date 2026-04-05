import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationItem = ({ id, date, message, isRead = false, onRead }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNew, setShowNew] = useState(!isRead);

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
      transition={{ layout: { duration: 0.2, ease: "easeOut" } }}
      className={`relative mb-3 rounded-3xl overflow-hidden cursor-pointer transition-all duration-200 ${
        isOpen 
          ? 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:bg-zinc-900 border border-slate-200 dark:border-white/5' 
          : 'bg-white/80 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 shadow-sm'
      }`}
      onClick={handleOpen}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Notification Icon Bubble */}
          <div className={`mt-0.5 w-2 h-2 shrink-0 rounded-full transition-colors ${showNew ? 'bg-fca-orange' : 'bg-transparent'}`} />
          
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{summaryPart.includes('-') ? summaryPart.split('-')[0].trim() : 'Aviso FCA'}</span>
              <span className="text-[10px] text-slate-500 font-medium">{date}</span>
            </div>
            <p className={`text-sm leading-tight transition-colors line-clamp-2 ${
              showNew ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-600 dark:text-slate-400'
            }`}>
              {summaryPart.includes('-') ? summaryPart.split('-').slice(1).join('-').trim() : summaryPart}
            </p>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-3 border-t border-slate-100 dark:border-white/10 ml-5 pr-2">
                 <p className="text-sm text-slate-700 dark:text-slate-300 font-normal leading-relaxed whitespace-pre-wrap">
                   {detailsPart || summaryPart}
                 </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default NotificationItem;
