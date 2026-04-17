import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function BrandLogo({ className, size = 32, animated = false }) {
  // Infinity loop (Figure-8) path
  const pathD = "M 35 60 C 15 60 15 40 35 40 C 45 40 55 60 65 60 C 85 60 85 40 65 40 C 55 40 45 60 35 60 Z";

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      {/* Background soft glow core */}
      <motion.div
        className="absolute inset-0 rounded-full bg-blue-500/20 blur-[12px]"
        animate={animated ? { scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.7, 0.3] } : { scale: 1, opacity: 0.1 }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-2xl overflow-visible">
        <defs>
          <linearGradient id="mobiusBase" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="energyBeam1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <linearGradient id="energyBeam2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Base dark track */}
        <path
          d={pathD}
          stroke="url(#mobiusBase)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Animated Energy Beam 1 (Blue/Purple) */}
        <motion.path
          d={pathD}
          stroke="url(#energyBeam1)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#neonGlow)"
          pathLength="100"
          strokeDasharray="25 75"
          animate={{ strokeDashoffset: [100, 0] }}
          transition={{ duration: animated ? 2 : 10, repeat: Infinity, ease: "linear" }}
        />

        {/* Animated Energy Beam 2 (Pink/Purple, moving faster) */}
        <motion.path
          d={pathD}
          stroke="url(#energyBeam2)"
          strokeWidth="1.5"
          strokeLinecap="round"
          filter="url(#strongGlow)"
          pathLength="100"
          strokeDasharray="10 90"
          animate={{ strokeDashoffset: [100, 0] }}
          transition={{ duration: animated ? 1.5 : 8, repeat: Infinity, ease: "linear", delay: 1 }}
        />

        {/* Animated Tiny Particles */}
        <motion.path
          d={pathD}
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#neonGlow)"
          pathLength="100"
          strokeDasharray="1 99"
          animate={{ strokeDashoffset: [100, 0] }}
          transition={{ duration: animated ? 1 : 6, repeat: Infinity, ease: "linear" }}
        />
      </svg>
    </div>
  );
}
