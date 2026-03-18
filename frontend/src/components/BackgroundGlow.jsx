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
        className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] rounded-full bg-fca-orange/30 blur-[150px]"
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
        className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-fca-yellow/20 blur-[130px]"
      />
      
      {/* Center Deepness */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#0D0D0D]/80" />
    </div>
  );
};

export default BackgroundGlow;
