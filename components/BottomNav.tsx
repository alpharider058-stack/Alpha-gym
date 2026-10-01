'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Dumbbell, Target, LineChart, Sparkles } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'routines' | 'plan' | 'progress' | 'profile';
  setActiveTab: (tab: 'routines' | 'plan' | 'progress' | 'profile') => void;
  onOpenAiWizard: () => void;
  hasAiRoutine?: boolean;
  onOpenCoachChat?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenAiWizard,
  hasAiRoutine,
  onOpenCoachChat,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 liquid-glass border-t border-white/10 px-3 py-2 pb-[max(0.6rem,var(--sab))]">
      <div className="grid grid-cols-4 items-center gap-1">
        <button
          onClick={() => setActiveTab('routines')}
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            activeTab === 'routines' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <motion.div whileTap={{ scale: 0.9 }}>
            <Dumbbell className="w-5 h-5 stroke-[2.2]" />
          </motion.div>
          <span className="text-[10px] font-semibold tracking-wider mt-1">Rutinas</span>
          {activeTab === 'routines' && (
            <motion.div
              layoutId="bottomNavDot"
              className="w-1 h-1 rounded-full bg-white mt-0.5"
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('plan')}
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            activeTab === 'plan' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <motion.div whileTap={{ scale: 0.9 }}>
            <Target className="w-5 h-5 stroke-[2.2]" />
          </motion.div>
          <span className="text-[10px] font-semibold tracking-wider mt-1">Mi Plan 6M</span>
          {activeTab === 'plan' && (
            <motion.div
              layoutId="bottomNavDot"
              className="w-1 h-1 rounded-full bg-white mt-0.5"
            />
          )}
        </button>

        <button
          onClick={hasAiRoutine && onOpenCoachChat ? onOpenCoachChat : onOpenAiWizard}
          className="flex flex-col items-center justify-center py-1 group text-zinc-400 hover:text-white"
        >
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="w-7 h-7 rounded-xl bg-white text-black flex items-center justify-center shadow-lg shadow-white/20 transition-all"
          >
            <Sparkles className="w-4 h-4 fill-black" />
          </motion.div>
          <span className="text-[10px] font-bold text-white mt-1">
            {hasAiRoutine ? 'Chat Coach' : 'Coach IA'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('progress')}
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            activeTab === 'progress' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <motion.div whileTap={{ scale: 0.9 }}>
            <LineChart className="w-5 h-5 stroke-[2.2]" />
          </motion.div>
          <span className="text-[10px] font-semibold tracking-wider mt-1">Progreso</span>
          {activeTab === 'progress' && (
            <motion.div
              layoutId="bottomNavDot"
              className="w-1 h-1 rounded-full bg-white mt-0.5"
            />
          )}
        </button>
      </div>
    </div>
  );
};
