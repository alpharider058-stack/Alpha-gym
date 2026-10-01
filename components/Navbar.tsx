'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Dumbbell, Sparkles, Play, Target, LineChart, Flame, MessageSquare } from 'lucide-react';
import { PWAInstallButton } from './pwa/PWAInstallButton';

interface NavbarProps {
  activeTab: 'routines' | 'plan' | 'progress' | 'profile';
  setActiveTab: (tab: 'routines' | 'plan' | 'progress' | 'profile') => void;
  onOpenAiWizard: () => void;
  onOpenManualRoutine: () => void;
  hasActiveSession?: boolean;
  onResumeActiveSession?: () => void;
  hasAiRoutine?: boolean;
  onOpenCoachChat?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAiWizard,
  hasActiveSession,
  onResumeActiveSession,
  hasAiRoutine,
  onOpenCoachChat,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full liquid-glass border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Zone */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('routines')}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-b from-zinc-800 to-black border border-white/20 shadow-lg shadow-black/50 text-white">
            <Dumbbell className="w-5 h-5 -rotate-45 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white ring-2 ring-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-wider text-white uppercase">
                Iron<span className="text-zinc-400 font-light">Pulse</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/15">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
              Monochrome Liquid OS • Gym & Coach IA
            </p>
          </div>
        </motion.div>

        {/* Desktop Segmented Liquid Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl liquid-glass-subtle border border-white/10">
          <button
            onClick={() => setActiveTab('routines')}
            className={`relative px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'routines'
                ? 'text-black font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {activeTab === 'routines' && (
              <motion.div
                layoutId="activeTabBadge"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="absolute inset-0 bg-white rounded-xl shadow-md"
              />
            )}
            <span className="relative z-10">Mis Rutinas</span>
          </button>

          <button
            onClick={() => setActiveTab('plan')}
            className={`relative px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'plan'
                ? 'text-black font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {activeTab === 'plan' && (
              <motion.div
                layoutId="activeTabBadge"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="absolute inset-0 bg-white rounded-xl shadow-md"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <span>Mi Plan (6 Meses)</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`relative px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'progress'
                ? 'text-black font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {activeTab === 'progress' && (
              <motion.div
                layoutId="activeTabBadge"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="absolute inset-0 bg-white rounded-xl shadow-md"
              />
            )}
            <span className="relative z-10">Progreso & Gráficas</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {hasAiRoutine && onOpenCoachChat && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenCoachChat}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl liquid-glass-button text-xs font-bold text-white shadow-lg"
              title="Preguntar a tu Entrenador Personal IA"
            >
              <MessageSquare className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Preguntar al Coach</span>
              <span className="sm:hidden">Coach</span>
            </motion.button>
          )}

          {hasActiveSession && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onResumeActiveSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 text-xs font-bold shadow-lg"
            >
              <Play className="w-3.5 h-3.5 fill-current text-white animate-pulse" />
              <span>Sesión Activa</span>
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenAiWizard}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl liquid-glass-button-primary font-bold text-xs shadow-lg active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>Crear con IA</span>
          </motion.button>

          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
