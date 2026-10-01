'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dumbbell, ArrowRight } from 'lucide-react';

interface AppEntranceIntroProps {
  onComplete: () => void;
}

export const AppEntranceIntro: React.FC<AppEntranceIntroProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(onComplete, 600);
  }, [onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, 2400);

    return () => clearTimeout(timer);
  }, [handleDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden select-none cursor-pointer"
          onClick={handleDismiss}
        >
          {/* Ambient Liquid Monochrome Orbs */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.9, 1.15, 1], opacity: [0.3, 0.6, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
            className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-white/10 via-zinc-800/20 to-transparent blur-[120px] pointer-events-none"
          />

          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: [1.1, 0.85, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut', delay: 0.5 }}
            className="absolute w-[380px] h-[380px] rounded-full bg-gradient-to-br from-zinc-700/20 via-zinc-900/30 to-transparent blur-[100px] pointer-events-none"
          />

          {/* Central Liquid Glass Medallion */}
          <div className="relative z-10 flex flex-col items-center text-center px-6">
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative p-6 rounded-3xl liquid-glass-elevated mb-8 group"
            >
              {/* Outer specular glow ring */}
              <div className="absolute inset-0 rounded-3xl border border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.12)]" />
              
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-zinc-800 to-black border border-white/30 flex items-center justify-center text-white shadow-2xl">
                <Dumbbell className="w-8 h-8 sm:w-10 sm:h-10 text-white -rotate-45" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.4, 1] }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white ring-4 ring-black"
                />
              </div>
            </motion.div>

            {/* Kinetic Typography */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-2"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-zinc-400">
                  SYSTEM READY
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
                Iron<span className="text-zinc-400 font-light">Pulse</span>
              </h1>

              <p className="text-xs sm:text-sm text-zinc-400 font-medium tracking-wide max-w-xs sm:max-w-md mx-auto">
                Liquid Performance OS • Coach IA • 6-Month Evolution
              </p>
            </motion.div>

            {/* Progress line */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 140, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1.4, ease: 'easeInOut' }}
              className="h-[2px] bg-gradient-to-r from-transparent via-white to-transparent rounded-full mt-8"
            />

            {/* Quick Skip hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.8 }}
              className="mt-6 flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono tracking-wider uppercase hover:text-white transition"
            >
              <span>Toca en cualquier lugar para entrar</span>
              <ArrowRight className="w-3 h-3 inline" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
