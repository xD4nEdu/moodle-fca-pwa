import React from 'react';
import { motion } from 'framer-motion';

const BackgroundGlow = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Orange Glow */}
      <motion.div
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-fca-orange/15 blur-[120px]"
      />
      
      {/* Yellow Glow */}
      <motion.div
        animate={{
          x: [0, -100, 100, 0],
          y: [0, 150, -50, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-fca-yellow/10 blur-[100px]"
      />
      
      {/* Center Deepness */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#0D0D0D]/80" />
    </div>
  );
};

export default BackgroundGlow;
