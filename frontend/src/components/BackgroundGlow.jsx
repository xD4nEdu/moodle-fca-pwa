import React, { memo } from 'react';
import { motion } from 'framer-motion';

const BackgroundGlow = memo(() => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#0D0D0D]">
      {/* Orange Glow */}
      <motion.div
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -80, 40, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{ willChange: 'transform' }}
        className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] rounded-full bg-fca-orange/30 blur-[120px]"
      />
      
      {/* Yellow Glow */}
      <motion.div
        animate={{
          x: [0, -80, 80, 0],
          y: [0, 120, -40, 0],
          scale: [1, 0.95, 1.05, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{ willChange: 'transform' }}
        className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-fca-yellow/20 blur-[100px]"
      />
      
      {/* Radial Gradient for deepness */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#0D0D0D]/90" />
    </div>
  );
});

export default BackgroundGlow;
