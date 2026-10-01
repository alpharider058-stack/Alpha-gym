'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Routine, RoutineDay, Exercise, WorkoutSessionLog, CompletedExerciseLog } from '@/types/gym';
import { GymStorage } from '@/lib/storage';
import {
  Check,
  CheckCircle2,
  X,
  Clock,
  Dumbbell,
  Flame,
  Award,
  Volume2,
  VolumeX,
  Zap,
  MessageSquare,
} from 'lucide-react';
import { ProgressiveOverloadAdvisorModal } from '@/components/ai/ProgressiveOverloadAdvisorModal';
import { CoachChatModal } from '@/components/coach/CoachChatModal';

interface ActiveWorkoutModalProps {
  routine: Routine;
  day: RoutineDay;
  onClose: () => void;
  onFinishWorkout: (log: WorkoutSessionLog) => void;
}

export const ActiveWorkoutModal: React.FC<ActiveWorkoutModalProps> = ({
  routine,
  day,
  onClose,
  onFinishWorkout,
}) => {
  // Session timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused] = useState(false);

  // Exercises state clone with completion markers
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    return day.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => ({
        ...s,
        completedReps: parseInt(s.targetReps) || 10,
        completedWeightKg: s.targetWeightKg || 20,
        isCompleted: false,
      })),
    }));
  });

  // Rest Timer state
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Session finished state
  const [showFinishedSummary, setShowFinishedSummary] = useState(false);
  const [finishedLog, setFinishedLog] = useState<WorkoutSessionLog | null>(null);

  // Overload Advisor modal state
  const [overloadTargetExIdx, setOverloadTargetExIdx] = useState<number | null>(null);

  // Coach Chat consultation during workout
  const [showWorkoutCoachChat, setShowWorkoutCoachChat] = useState(false);

  // Start time
  const startTimeRef = useRef<string>(new Date().toISOString());

  // Elapsed workout timer effect
  useEffect(() => {
    if (isPaused || showFinishedSummary) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, showFinishedSummary]);

  // Web Audio Synth Beep for rest timer finish
  const playBeep = React.useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);

      // Vibrate if available on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch {
      // AudioContext policy safe catch
    }
  }, [soundEnabled]);

  // Rest countdown timer effect
  useEffect(() => {
    if (restSecondsRemaining === null || restSecondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setRestSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          playBeep();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [restSecondsRemaining, playBeep]);

  const handleToggleSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const targetEx = { ...next[exIdx] };
      const targetSets = [...targetEx.sets];
      const currentSet = { ...targetSets[setIdx] };

      const wasCompleted = currentSet.isCompleted;
      currentSet.isCompleted = !wasCompleted;
      targetSets[setIdx] = currentSet;
      targetEx.sets = targetSets;
      next[exIdx] = targetEx;

      // If newly marked as completed, trigger rest timer
      if (!wasCompleted) {
        const restDuration = currentSet.restSeconds || 90;
        setRestSecondsRemaining(restDuration);
      }

      return next;
    });
  };

  const handleUpdateWeight = (exIdx: number, setIdx: number, weight: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const targetEx = { ...next[exIdx] };
      const targetSets = [...targetEx.sets];
      targetSets[setIdx] = { ...targetSets[setIdx], completedWeightKg: weight };
      targetEx.sets = targetSets;
      next[exIdx] = targetEx;
      return next;
    });
  };

  const handleUpdateReps = (exIdx: number, setIdx: number, reps: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const targetEx = { ...next[exIdx] };
      const targetSets = [...targetEx.sets];
      targetSets[setIdx] = { ...targetSets[setIdx], completedReps: reps };
      targetEx.sets = targetSets;
      next[exIdx] = targetEx;
      return next;
    });
  };

  // Apply overload advice to current active exercise
  const handleApplyOverload = (weightKg: number) => {
    if (overloadTargetExIdx === null) return;
    setExercises((prev) => {
      const next = [...prev];
      const targetEx = { ...next[overloadTargetExIdx] };
      targetEx.sets = targetEx.sets.map((s) => ({
        ...s,
        completedWeightKg: weightKg,
      }));
      next[overloadTargetExIdx] = targetEx;
      return next;
    });
  };

  // Calculate live volume in kg
  const totalVolumeKg = exercises.reduce((acc, ex) => {
    const exVolume = ex.sets.reduce((sAcc, s) => {
      if (s.isCompleted) {
        return sAcc + (s.completedWeightKg || 0) * (s.completedReps || 0);
      }
      return sAcc;
    }, 0);
    return acc + exVolume;
  }, 0);

  const completedSetsCount = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.isCompleted).length,
    0
  );
  const totalSetsCount = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  const handleFinish = () => {
    const finishedAt = new Date().toISOString();
    const durationMin = Math.max(1, Math.round(elapsedSeconds / 60));

    const completedExercises: CompletedExerciseLog[] = exercises
      .filter((ex) => ex.sets.some((s) => s.isCompleted))
      .map((ex) => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: ex.sets
          .filter((s) => s.isCompleted)
          .map((s) => ({
            setNumber: s.setNumber,
            weightKg: s.completedWeightKg || 0,
            reps: s.completedReps || 0,
            completedAt: new Date().toISOString(),
          })),
      }));

    const log: WorkoutSessionLog = {
      id: `log-${Date.now()}`,
      routineId: routine.id,
      routineTitle: routine.title,
      dayName: day.name,
      startedAt: startTimeRef.current,
      finishedAt,
      durationMinutes: durationMin,
      totalVolumeKg,
      exercisesCompleted: completedExercises,
      rating: 5,
    };

    GymStorage.saveWorkoutLog(log);
    setFinishedLog(log);
    setShowFinishedSummary(true);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] text-white flex flex-col">
      {/* Top Header in Liquid Glass */}
      <div className="sticky top-0 z-30 liquid-glass border-b border-white/10 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl liquid-glass-subtle border border-white/10 text-white font-mono text-xs sm:text-sm font-bold">
            <Clock className="w-3.5 h-3.5 animate-spin text-white" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-[130px] sm:max-w-xs">
              {day.name}
            </h2>
            <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono">
              {completedSetsCount}/{totalSetsCount} series
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 sm:p-2 rounded-xl liquid-glass-subtle border border-white/10 text-zinc-400 hover:text-white"
            title={soundEnabled ? 'Silenciar alertas' : 'Activar sonido'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-white" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleFinish}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl liquid-glass-button-primary text-xs font-bold shadow-lg transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-black" />
            <span>Finalizar</span>
          </motion.button>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Rest Timer Pill */}
      {restSecondsRemaining !== null && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-[51px] sm:top-[57px] z-20 liquid-glass-elevated border-b border-white/20 px-3 sm:px-4 py-2 sm:py-2.5 shadow-2xl flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-mono text-xs sm:text-sm font-black shadow-[0_0_12px_rgba(255,255,255,0.4)]">
              {restSecondsRemaining}s
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Descanso entre series</span>
              <span className="text-[10px] text-zinc-400">Prepárate para la siguiente serie</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setRestSecondsRemaining((prev) => (prev !== null ? prev + 30 : 30))}
              className="px-2.5 py-1 rounded-xl liquid-glass-button text-white text-xs font-bold font-mono"
            >
              +30s
            </button>
            <button
              onClick={() => setRestSecondsRemaining(null)}
              className="px-2.5 py-1 rounded-xl liquid-glass-button-primary text-xs font-bold"
            >
              Saltar
            </button>
          </div>
        </motion.div>
      )}

      {/* Volume & Stats Bar */}
      <div className="liquid-glass-subtle border-b border-white/5 px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between text-[11px] sm:text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Dumbbell className="w-3.5 h-3.5 text-white" />
          <span>Volumen:</span>
          <strong className="text-white font-mono">{totalVolumeKg.toLocaleString()} kg</strong>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWorkoutCoachChat(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl liquid-glass-subtle border border-white/15 text-[11px] font-bold text-white hover:bg-white hover:text-black transition"
            title="Preguntar a tu Entrenador Personal IA durante la sesión"
          >
            <MessageSquare className="w-3 h-3" />
            <span>Duda al Coach</span>
          </button>

          <div className="flex items-center gap-1 text-zinc-400">
            <Flame className="w-3.5 h-3.5 text-zinc-400" />
            <strong className="text-white font-mono">{Math.round((elapsedSeconds / 60) * 6.5)} kcal</strong>
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 max-w-3xl w-full mx-auto pb-24">
        {exercises.map((exercise, exIdx) => (
          <div
            key={exercise.id}
            className="liquid-glass rounded-3xl overflow-hidden border border-white/10 shadow-lg"
          >
            {/* Exercise Header */}
            <div className="p-3 sm:p-4 border-b border-white/10 flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                  {exercise.muscleGroup}
                </span>
                <h3 className="text-xs sm:text-base font-bold text-white">
                  {exIdx + 1}. {exercise.name}
                </h3>
              </div>

              {/* AI Overload Trigger for this exercise */}
              <button
                onClick={() => setOverloadTargetExIdx(exIdx)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl liquid-glass-subtle border border-white/15 text-[11px] font-bold text-white hover:bg-white hover:text-black transition shrink-0"
                title="Consejo de sobrecarga para este ejercicio"
              >
                <Zap className="w-3 h-3 text-white fill-current" />
                <span className="hidden xs:inline">Sobrecarga</span> IA
              </button>
            </div>

            {/* Sets Table - Mobile optimized with compact columns */}
            <div className="p-2 sm:p-3">
              <div className="grid grid-cols-12 text-[10px] font-mono text-zinc-500 uppercase px-1 py-1 mb-1">
                <span className="col-span-2 text-center">Set</span>
                <span className="col-span-3 text-center">Objetivo</span>
                <span className="col-span-3 text-center">Kg</span>
                <span className="col-span-2 text-center">Reps</span>
                <span className="col-span-2 text-center">Listo</span>
              </div>

              <div className="space-y-1">
                {exercise.sets.map((set, setIdx) => (
                  <div
                    key={setIdx}
                    className={`grid grid-cols-12 items-center p-1.5 sm:p-2 rounded-2xl transition-all ${
                      set.isCompleted
                        ? 'bg-white/10 border border-white/30'
                        : 'bg-black/40 border border-white/5'
                    }`}
                  >
                    {/* Set Number */}
                    <div className="col-span-2 flex justify-center">
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-zinc-800 text-white flex items-center justify-center font-mono text-[11px] sm:text-xs font-bold">
                        {set.setNumber}
                      </span>
                    </div>

                    {/* Target */}
                    <div className="col-span-3 text-center font-mono text-[11px] sm:text-xs text-zinc-400 truncate px-0.5">
                      {set.targetReps}
                    </div>

                    {/* Kg input */}
                    <div className="col-span-3 flex justify-center px-0.5">
                      <input
                        type="number"
                        step="0.5"
                        value={set.completedWeightKg || ''}
                        onChange={(e) => handleUpdateWeight(exIdx, setIdx, parseFloat(e.target.value) || 0)}
                        className="w-14 sm:w-16 liquid-glass-subtle border border-white/10 rounded-xl py-1 px-1 text-center font-mono text-xs font-bold text-white focus:outline-none focus:border-white"
                      />
                    </div>

                    {/* Reps input */}
                    <div className="col-span-2 flex justify-center px-0.5">
                      <input
                        type="number"
                        value={set.completedReps || ''}
                        onChange={(e) => handleUpdateReps(exIdx, setIdx, parseInt(e.target.value) || 0)}
                        className="w-10 sm:w-12 liquid-glass-subtle border border-white/10 rounded-xl py-1 px-0.5 text-center font-mono text-xs font-bold text-white focus:outline-none focus:border-white"
                      />
                    </div>

                    {/* Done checkmark button */}
                    <div className="col-span-2 flex justify-center">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleToggleSet(exIdx, setIdx)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all ${
                          set.isCompleted
                            ? 'bg-white text-black shadow-md shadow-white/30'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Completion Modal */}
      {showFinishedSummary && finishedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-3 sm:p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-3xl liquid-glass-elevated border border-white/20 p-5 sm:p-6 shadow-2xl text-center"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-white text-black flex items-center justify-center mx-auto mb-3 shadow-xl">
              <Award className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white mb-1 tracking-tight">¡Entrenamiento Completado!</h3>
            <p className="text-xs text-zinc-400 mb-5">
              Excelente trabajo. Cada repetición suma a tu cambio de 6 meses.
            </p>

            {/* Metrics summary */}
            <div className="grid grid-cols-3 gap-2 liquid-glass-subtle p-3.5 rounded-2xl mb-5 border border-white/10">
              <div>
                <span className="text-[10px] text-zinc-400 font-mono uppercase block">Tiempo</span>
                <span className="text-sm sm:text-base font-black text-white font-mono">
                  {finishedLog.durationMinutes} min
                </span>
              </div>
              <div className="border-x border-white/10">
                <span className="text-[10px] text-zinc-400 font-mono uppercase block">Volumen</span>
                <span className="text-sm sm:text-base font-black text-white font-mono">
                  {finishedLog.totalVolumeKg.toLocaleString()} kg
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-mono uppercase block">Series</span>
                <span className="text-sm sm:text-base font-black text-white font-mono">
                  {completedSetsCount}
                </span>
              </div>
            </div>

            <button
              onClick={() => onFinishWorkout(finishedLog)}
              className="w-full py-3 rounded-2xl liquid-glass-button-primary font-bold text-xs shadow-xl"
            >
              Guardar y Ver Mi Progreso
            </button>
          </motion.div>
        </div>
      )}

      {/* Progressive Overload Advisor Modal inside workout */}
      {overloadTargetExIdx !== null && exercises[overloadTargetExIdx] && (
        <ProgressiveOverloadAdvisorModal
          exerciseName={exercises[overloadTargetExIdx].name}
          initialWeightKg={exercises[overloadTargetExIdx].sets[0]?.completedWeightKg || 60}
          initialReps={exercises[overloadTargetExIdx].sets[0]?.completedReps || 8}
          onClose={() => setOverloadTargetExIdx(null)}
          onApplyProgression={handleApplyOverload}
        />
      )}

      {/* Live Coach IA Personal Trainer Consultation Modal */}
      {showWorkoutCoachChat && (
        <CoachChatModal
          activeRoutine={routine}
          activePlan={GymStorage.getActivePlan()}
          onClose={() => setShowWorkoutCoachChat(false)}
        />
      )}
    </div>
  );
};
