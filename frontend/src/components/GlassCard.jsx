import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', animate = true }) => {
  const containerVariants = {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
  };

  const Component = animate ? motion.div : 'div';
  
  return (
    <Component
      variants={animate ? containerVariants : undefined}
      initial={animate ? "initial" : undefined}
      animate={animate ? "animate" : undefined}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`glass rounded-3xl p-6 relative overflow-hidden group ${className}`}
    >
      {/* Subtle Inner Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      {/* Dynamic Content */}
      <div className="relative z-10">
        {children}
      </div>
    </Component>
  );
};

export default GlassCard;
