'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Routine, RoutineDay, Plan6Months, WorkoutSessionLog } from '@/types/gym';
import { GymStorage } from '@/lib/storage';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { RoutineList } from '@/components/routines/RoutineList';
import { ManualRoutineModal } from '@/components/routines/ManualRoutineModal';
import { AiRoutineWizard } from '@/components/ai-wizard/AiRoutineWizard';
import { SixMonthPlanView } from '@/components/plan/SixMonthPlanView';
import { ActiveWorkoutModal } from '@/components/workout/ActiveWorkoutModal';
import { ProgressDashboard } from '@/components/progress/ProgressDashboard';
import { AppEntranceIntro } from '@/components/intro/AppEntranceIntro';
import { CoachChatModal } from '@/components/coach/CoachChatModal';
import { CheckCircle2, MessageSquare } from 'lucide-react';

export default function GymHomePage() {
  const [activeTab, setActiveTab] = useState<'routines' | 'plan' | 'progress' | 'profile'>('routines');

  // Entrance splash animation flag
  const [showIntro, setShowIntro] = useState(true);

  // Stored state with lazy initializers
  const [routines, setRoutines] = useState<Routine[]>(() => {
    if (typeof window === 'undefined') return [];
    return GymStorage.getRoutines();
  });
  const [activePlan, setActivePlan] = useState<Plan6Months | null>(() => {
    if (typeof window === 'undefined') return null;
    return GymStorage.getActivePlan();
  });

  // Modals state
  const [showAiWizard, setShowAiWizard] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showCoachChat, setShowCoachChat] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  // Live Workout Session state
  const [activeSession, setActiveSession] = useState<{
    routine: Routine;
    day: RoutineDay;
  } | null>(null);

  // Check if user has generated a routine with Coach IA or has an active plan
  const hasAiRoutine = routines.some((r) => r.isAiGenerated) || !!activePlan;

  // Toast banner state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Callback from AI wizard
  const handleAiWizardSuccess = (newRoutine: Routine, newPlan: Plan6Months) => {
    const updatedRoutines = GymStorage.addRoutine(newRoutine);
    GymStorage.saveActivePlan(newPlan);

    setRoutines(updatedRoutines);
    setActivePlan(newPlan);
    setShowAiWizard(false);
    setActiveTab('plan'); // Automatically switch to "Mi Plan" as requested!

    showToast('¡Plan de 6 Meses y Rutina IA generados con éxito!');
  };

  // Manual routine save
  const handleSaveManualRoutine = (routine: Routine) => {
    const updated = GymStorage.addRoutine(routine);
    setRoutines(updated);
    setShowManualModal(false);
    setEditingRoutine(null);
    showToast(`Rutina "${routine.title}" guardada.`);
  };

  // Delete routine
  const handleDeleteRoutine = (routineId: string) => {
    const updated = GymStorage.deleteRoutine(routineId);
    setRoutines(updated);
    showToast('Rutina eliminada.');
  };

  // Start workout
  const handleStartWorkout = (routine: Routine, day: RoutineDay) => {
    setActiveSession({ routine, day });
  };

  // Finish workout callback
  const handleFinishWorkout = (log: WorkoutSessionLog) => {
    setActiveSession(null);
    setActiveTab('progress');
    showToast(`¡Sesión guardada! Levantaste ${log.totalVolumeKg.toLocaleString()} kg.`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f4f4f5] flex flex-col antialiased selection:bg-white selection:text-black pb-20 md:pb-8 relative overflow-x-hidden">
      {/* App Entrance Intro Animation */}
      {showIntro && <AppEntranceIntro onComplete={() => setShowIntro(false)} />}

      {/* Ambient Liquid Monochrome Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-white/[0.025] blur-[160px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-zinc-600/[0.035] blur-[160px] pointer-events-none" />
      <div className="fixed top-[40%] right-[20%] w-[400px] h-[400px] rounded-full bg-zinc-400/[0.015] blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAiWizard={() => setShowAiWizard(true)}
        onOpenManualRoutine={() => {
          setEditingRoutine(null);
          setShowManualModal(true);
        }}
        hasActiveSession={!!activeSession}
        onResumeActiveSession={() => {
          // Already mounted if active
        }}
        hasAiRoutine={hasAiRoutine}
        onOpenCoachChat={() => setShowCoachChat(true)}
      />

      {/* Floating Notification Toast in Liquid Glass */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-20 right-4 left-4 sm:left-auto z-50 flex items-center gap-3 rounded-2xl liquid-glass-elevated border border-white/20 text-white px-5 py-3 text-xs font-bold shadow-2xl"
          >
            <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Tab Content with Liquid Transitions */}
      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'routines' && (
              <RoutineList
                routines={routines}
                onOpenAiWizard={() => setShowAiWizard(true)}
                onOpenManualModal={(routineToEdit) => {
                  setEditingRoutine(routineToEdit || null);
                  setShowManualModal(true);
                }}
                onStartWorkout={handleStartWorkout}
                onDeleteRoutine={handleDeleteRoutine}
                onOpenCoachChat={() => setShowCoachChat(true)}
              />
            )}

            {activeTab === 'plan' && (
              <SixMonthPlanView
                plan={activePlan}
                onGoToRoutines={() => setActiveTab('routines')}
                onOpenAiWizard={() => setShowAiWizard(true)}
                onOpenCoachChat={() => setShowCoachChat(true)}
              />
            )}

            {activeTab === 'progress' && (
              <ProgressDashboard
                plan={activePlan}
                onRefreshData={() => {
                  // refresh
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* AI Routine & 6-Month Plan 1-on-1 Wizard Screen */}
      {showAiWizard && (
        <AiRoutineWizard
          onCancel={() => setShowAiWizard(false)}
          onSuccess={handleAiWizardSuccess}
        />
      )}

      {/* Manual Routine Modal */}
      {showManualModal && (
        <ManualRoutineModal
          initialRoutine={editingRoutine}
          onClose={() => {
            setShowManualModal(false);
            setEditingRoutine(null);
          }}
          onSave={handleSaveManualRoutine}
        />
      )}

      {/* Live Active Workout Runner Modal */}
      {activeSession && (
        <ActiveWorkoutModal
          routine={activeSession.routine}
          day={activeSession.day}
          onClose={() => setActiveSession(null)}
          onFinishWorkout={handleFinishWorkout}
        />
      )}

      {/* Floating Coach Chat Action Pill (when an AI routine or plan exists) */}
      {hasAiRoutine && !showCoachChat && !showAiWizard && !activeSession && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCoachChat(true)}
          className="fixed bottom-20 md:bottom-8 right-4 sm:right-6 z-40 liquid-glass-elevated border border-white/20 text-white pl-3 pr-4 py-2 rounded-full flex items-center gap-2.5 shadow-2xl hover:border-white/40 transition"
          title="Preguntar a tu Entrenador Personal IA"
        >
          <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold shadow-md shrink-0">
            <MessageSquare className="w-4 h-4 fill-black" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-white block leading-tight">
              Preguntar al Coach
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              Entrenador Personal IA
            </span>
          </div>
        </motion.button>
      )}

      {/* Coach Chat Personal Trainer Modal */}
      {showCoachChat && (
        <CoachChatModal
          activeRoutine={routines.find((r) => r.isAiGenerated) || routines[0] || null}
          activePlan={activePlan}
          onClose={() => setShowCoachChat(false)}
        />
      )}

      {/* Native Mobile Bottom Nav */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAiWizard={() => setShowAiWizard(true)}
        hasAiRoutine={hasAiRoutine}
        onOpenCoachChat={() => setShowCoachChat(true)}
      />

      {/* PWA Offline indicator */}
      <OfflineIndicator />
    </div>
  );
}
