import React, { memo } from 'react';
import { motion } from 'framer-motion';

const GlassCard = memo(({ children, className = '', animate = true }) => {
  const containerVariants = {
    initial: { opacity: 0, scale: 0.98, y: 15 },
    animate: { opacity: 1, scale: 1, y: 0 },
  };

  const Component = animate ? motion.div : 'div';
  
  return (
    <Component
      variants={animate ? containerVariants : undefined}
      initial={animate ? "initial" : undefined}
      animate={animate ? "animate" : undefined}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`glass rounded-3xl p-6 relative overflow-hidden group ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      <div className="relative z-10 w-full">
        {children}
      </div>
    </Component>
  );
});

export default GlassCard;
