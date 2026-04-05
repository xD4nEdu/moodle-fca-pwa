import React, { memo } from 'react';
import { motion } from 'framer-motion';

const BackgroundGlow = memo(() => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#FAFAFA] dark:bg-black transition-colors duration-200">
      {/* Vercel-like extremely subtle ambient mesh */}
      <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] rounded-full bg-slate-200/50 dark:bg-fca-orange/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-slate-200/50 dark:bg-fca-yellow/5 blur-[120px]" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay" />
    </div>
  );
});

export default BackgroundGlow;
