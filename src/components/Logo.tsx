import React from 'react';
import { motion } from 'motion/react';

export const Logo: React.FC<{ size?: number; className?: string }> = ({ size = 48, className = "" }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer Glow */}
      <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
      
      {/* Logo Container */}
      <div className="relative w-full h-full bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/20 overflow-hidden">
        {/* Circuit Pattern Overlay */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full opacity-30 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path d="M20 20 L40 40 M80 20 L60 40 M20 80 L40 60 M80 80 L60 60" />
          <circle cx="50" cy="50" r="10" />
          <path d="M50 20 V40 M50 60 V80 M20 50 H40 M60 50 H80" />
        </svg>

        {/* Main Icon (Stylized A + Sparkle) */}
        <div className="relative z-10 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            width={size * 0.6}
            height={size * 0.6}
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 22h20L12 2z" />
            <path d="M12 2v20" />
            <circle cx="12" cy="12" r="3" fill="white" fillOpacity="0.2" />
            <path d="M8 14h8" />
          </svg>
          
          {/* Floating Sparkle */}
          <motion.div
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
              rotate: [0, 90, 180, 270, 360]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -top-1 -right-1"
          >
            <svg viewBox="0 0 24 24" width={size * 0.3} height={size * 0.3} fill="white">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </motion.div>
        </div>

        {/* Glass Reflection */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
      </div>
    </motion.div>
  );
};
