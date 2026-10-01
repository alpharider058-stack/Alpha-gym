'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Routine, RoutineDay, Exercise } from '@/types/gym';
import {
  Dumbbell,
  Sparkles,
  Plus,
  Play,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import { ProgressiveOverloadAdvisorModal } from '@/components/ai/ProgressiveOverloadAdvisorModal';
import { GymStorage } from '@/lib/storage';

interface RoutineListProps {
  routines: Routine[];
  onOpenAiWizard: () => void;
  onOpenManualModal: (routineToEdit?: Routine) => void;
  onStartWorkout: (routine: Routine, day: RoutineDay) => void;
  onDeleteRoutine: (routineId: string) => void;
  onOpenCoachChat?: () => void;
}

export const RoutineList: React.FC<RoutineListProps> = ({
  routines,
  onOpenAiWizard,
  onOpenManualModal,
  onStartWorkout,
  onDeleteRoutine,
  onOpenCoachChat,
}) => {
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(
    routines.length > 0 ? routines[0].id : null
  );

  const hasAiRoutine = routines.some((r) => r.isAiGenerated);

  // Progressive overload modal state
  const [overloadModalTarget, setOverloadModalTarget] = useState<{
    routineId: string;
    dayId: string;
    exercise: Exercise;
  } | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRoutineId((prev) => (prev === id ? null : id));
  };

  const handleApplyOverload = (weightKg: number, reps: string) => {
    if (!overloadModalTarget) return;
    GymStorage.updateExerciseInRoutine(
      overloadModalTarget.routineId,
      overloadModalTarget.dayId,
      overloadModalTarget.exercise.id,
      { targetWeightKg: weightKg, targetReps: reps }
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Top Banner & Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 liquid-glass-elevated p-4 sm:p-6 rounded-3xl"
      >
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-400">
              PROGRAMACIÓN & CONTROL
            </span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            <span>Mis Rutinas de Entrenamiento</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5 max-w-xl">
            Registra tus cargas en directo con el temporizador integrado o diseña un programa personalizado con IA.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onOpenManualModal()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl liquid-glass-button text-xs font-semibold text-zinc-300 hover:text-white transition"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>Crear Manual</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenAiWizard}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl liquid-glass-button-primary font-bold text-xs shadow-xl active:scale-95 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>Crear con IA</span>
          </motion.button>
        </div>
      </motion.div>

      {/* AI Coach Personal Trainer Banner */}
      {onOpenCoachChat && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass rounded-3xl p-4 sm:p-5 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center font-bold shrink-0 shadow-md">
              <MessageSquare className="w-5 h-5 fill-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {hasAiRoutine ? 'Tu Entrenador Personal IA está Conectado' : 'Coach IA • Entrenador Personal'}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/10 text-white uppercase tracking-wider">
                  En Línea
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {hasAiRoutine
                  ? '¿Dudas sobre cómo ejecutar un ejercicio de tu rutina, sustituir una máquina ocupada o nutrición? Consulta en directo.'
                  : 'Pregúntale cualquier duda sobre el gimnasio, técnicas de ejercicios, dudas de nutrición o rutinas personalizadas.'}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenCoachChat}
            className="px-4 py-2 rounded-xl liquid-glass-button text-xs font-bold text-white self-start sm:self-auto shrink-0 flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Preguntar al Coach</span>
          </motion.button>
        </motion.div>
      )}

      {/* Routine Cards List */}
      {routines.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 sm:py-16 liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white mx-auto mb-3 shadow-lg">
            <Dumbbell className="w-7 h-7 text-white -rotate-45" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-1 tracking-tight">
            Comienza tu entrenamiento
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-5 leading-relaxed">
            Tu panel está completamente listo. Puedes apuntar tus propias rutinas manualmente o dejar que el Coach IA las diseñe respondiendo 10 preguntas.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-xs mx-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenAiWizard}
              className="w-full py-2.5 rounded-xl liquid-glass-button-primary text-xs font-bold text-black flex items-center justify-center gap-2 shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>Generar Rutina con IA</span>
            </motion.button>
            <button
              onClick={() => onOpenManualModal()}
              className="w-full py-2.5 rounded-xl liquid-glass-button text-xs font-semibold text-white"
            >
              Apuntar Rutina Manual
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3.5">
          {routines.map((routine, idx) => {
            const isExpanded = expandedRoutineId === routine.id;

            return (
              <motion.div
                key={routine.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.4 }}
                className="liquid-glass rounded-3xl overflow-hidden transition-all duration-300 hover:border-white/20"
              >
                {/* Routine Card Header */}
                <div
                  onClick={() => toggleExpand(routine.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.02] transition"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                        {routine.title}
                      </h2>
                      {routine.isAiGenerated && (
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-white" />
                          Coach IA
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-1">
                      {routine.description}
                    </p>
                    <div className="flex items-center gap-2.5 text-[11px] text-zinc-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-400" />
                        {routine.days.length} días de entreno
                      </span>
                      <span>·</span>
                      <span className="font-mono">
                        {routine.days.reduce((acc, d) => acc + d.exercises.length, 0)} ejercicios
                      </span>
                    </div>
                  </div>

                  {/* Actions & Chevron */}
                  <div className="flex items-center justify-between sm:justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                    {routine.isAiGenerated && onOpenCoachChat && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCoachChat();
                        }}
                        className="px-2.5 py-1.5 rounded-xl liquid-glass-subtle text-zinc-200 hover:text-white border border-white/10 hover:border-white/25 text-xs font-bold transition flex items-center gap-1.5"
                        title="Preguntar a tu Entrenador Personal IA sobre esta rutina"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-white" />
                        <span className="hidden md:inline">Preguntar al Coach</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenManualModal(routine);
                      }}
                      className="p-2 rounded-xl liquid-glass-subtle text-zinc-300 hover:text-white hover:border-white/20 text-xs transition"
                      title="Editar rutina"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Eliminar la rutina "${routine.title}"?`)) {
                          onDeleteRoutine(routine.id);
                        }
                      }}
                      className="p-2 rounded-xl liquid-glass-subtle text-zinc-400 hover:text-white hover:border-white/20 text-xs transition"
                      title="Eliminar rutina"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="p-1.5 text-zinc-400 hover:text-white">
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Routine Days */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-3.5 sm:px-5 pb-5 pt-1 border-t border-white/10 space-y-3.5"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {routine.days.map((day, dIdx) => (
                          <div
                            key={day.id}
                            className="liquid-glass-subtle rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between border border-white/10"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-mono uppercase tracking-wider text-white font-bold">
                                  {day.dayOfWeek || `Día ${dIdx + 1}`}
                                </span>
                                <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                                  <Clock className="w-3 h-3 text-zinc-400" />
                                  ~{day.estimatedDurationMin || 60} min
                                </span>
                              </div>

                              <h3 className="text-xs sm:text-sm font-bold text-white mb-2">{day.name}</h3>

                              {/* Exercises Preview */}
                              <div className="space-y-1.5 mb-3.5">
                                {day.exercises.map((ex, exIdx) => (
                                  <div
                                    key={ex.id}
                                    className="text-xs text-zinc-300 flex items-center justify-between bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/5 gap-2"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <span className="w-4 h-4 rounded-md bg-white/10 text-[10px] text-white flex items-center justify-center font-mono shrink-0">
                                        {exIdx + 1}
                                      </span>
                                      <span className="truncate text-xs">{ex.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-[10px] text-zinc-400 font-mono">
                                        {ex.sets.length}x{ex.sets[0]?.targetReps || '8-10'}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOverloadModalTarget({
                                            routineId: routine.id,
                                            dayId: day.id,
                                            exercise: ex,
                                          });
                                        }}
                                        className="p-1 rounded-md bg-white/10 hover:bg-white text-zinc-300 hover:text-black transition"
                                        title="Calcular Sobrecarga con IA"
                                      >
                                        <TrendingUp className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Start Workout Button */}
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => onStartWorkout(routine, day)}
                              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl liquid-glass-button-primary font-bold text-xs shadow-md transition"
                            >
                              <Play className="w-3.5 h-3.5 fill-current text-black" />
                              <span>Entrenar Este Día</span>
                            </motion.button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Progressive Overload Advisor Modal */}
      {overloadModalTarget && (
        <ProgressiveOverloadAdvisorModal
          exerciseName={overloadModalTarget.exercise.name}
          initialWeightKg={overloadModalTarget.exercise.sets[0]?.targetWeightKg || 60}
          initialReps={overloadModalTarget.exercise.sets[0]?.targetReps || 8}
          onClose={() => setOverloadModalTarget(null)}
          onApplyProgression={handleApplyOverload}
        />
      )}
    </div>
  );
};
