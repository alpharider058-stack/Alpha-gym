'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Dumbbell,
  ArrowRight,
  X,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Flame,
  ChevronRight,
} from 'lucide-react';

interface ProgressiveOverloadAdvisorModalProps {
  exerciseName?: string;
  initialWeightKg?: number;
  initialReps?: number | string;
  onClose: () => void;
  onApplyProgression?: (weightKg: number, reps: string) => void;
}

export const ProgressiveOverloadAdvisorModal: React.FC<ProgressiveOverloadAdvisorModalProps> = ({
  exerciseName = 'Press de Banca Plano',
  initialWeightKg = 60,
  initialReps = 8,
  onClose,
  onApplyProgression,
}) => {
  const [exercise, setExercise] = useState(exerciseName);
  const [lastWeight, setLastWeight] = useState(initialWeightKg);
  const [lastReps, setLastReps] = useState(
    typeof initialReps === 'number' ? initialReps : parseInt(initialReps) || 8
  );
  const [feeling, setFeeling] = useState<'facil' | 'adecuado' | 'casi_fallo' | 'fallo_estancado'>(
    'adecuado'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    nextWeightKg: number;
    nextReps: string;
    progressionMethod: string;
    recommendationTitle: string;
    detailedReasoning: string;
    techniqueFocus: string;
    warmupProtocol: string;
  } | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/gemini/overload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseName: exercise,
          lastWeightKg: lastWeight,
          lastReps,
          feeling,
          userGoal: 'hipertrofia',
        }),
      });

      if (!res.ok) throw new Error('Error en el servidor');
      const data = await res.json();
      setResult(data);
    } catch {
      // Offline fallback
      setResult({
        nextWeightKg: feeling === 'facil' ? lastWeight + 2.5 : lastWeight,
        nextReps: feeling === 'facil' ? '8-10' : `${lastReps + 1}-10`,
        progressionMethod: feeling === 'facil' ? 'sobrecarga_lineal' : 'doble_progresion',
        recommendationTitle:
          feeling === 'facil'
            ? `Subir carga a ${lastWeight + 2.5} kg`
            : `Añadir +1 repetición con ${lastWeight} kg`,
        detailedReasoning:
          'La sobrecarga progresiva no siempre es subir peso: aumentar repeticiones o mejorar el tempo de bajada genera mayor tensión mecánica con menor riesgo articular.',
        techniqueFocus: 'Pausa de 1 segundo en el estiramiento y bajada en 3 segundos excéntricos.',
        warmupProtocol: `${Math.round(lastWeight * 0.5)}kg x 10, ${Math.round(lastWeight * 0.75)}kg x 4`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-lg rounded-3xl liquid-glass-elevated border border-white/20 p-5 sm:p-6 shadow-2xl relative my-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg shadow-white/20 shrink-0">
            <Sparkles className="w-5 h-5 fill-black" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Sobrecarga Progresiva con IA
            </h2>
            <p className="text-xs text-zinc-400">
              Cálculo científico de repeticiones y kilos para tu siguiente sesión
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Ejercicio a Progresar</label>
            <input
              type="text"
              required
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              placeholder="Ej: Press de Banca Plano, Sentadilla..."
              className="w-full liquid-glass-subtle border border-white/10 rounded-2xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Último Peso (kg)</label>
              <input
                type="number"
                step="0.5"
                required
                value={lastWeight}
                onChange={(e) => setLastWeight(parseFloat(e.target.value) || 0)}
                className="w-full liquid-glass-subtle border border-white/10 rounded-2xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Reps Logradas</label>
              <input
                type="number"
                required
                value={lastReps}
                onChange={(e) => setLastReps(parseInt(e.target.value) || 1)}
                className="w-full liquid-glass-subtle border border-white/10 rounded-2xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-white"
              />
            </div>
          </div>

          {/* Effort perception RIR */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Sensación de Esfuerzo (RPE/RIR):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'facil', label: 'Fácil (Sobró fuerza)', desc: 'RIR 3-4+' },
                { key: 'adecuado', label: 'Adecuado (Óptimo)', desc: 'RIR 2' },
                { key: 'casi_fallo', label: 'Al Límite (Muy duro)', desc: 'RIR 1' },
                { key: 'fallo_estancado', label: 'Fallo / Estancado', desc: 'RIR 0 o no completé' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setFeeling(opt.key as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    feeling === opt.key
                      ? 'bg-white text-black border-white shadow-md'
                      : 'liquid-glass-subtle text-zinc-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-bold block">{opt.label}</span>
                  <span className={`text-[10px] ${feeling === opt.key ? 'text-zinc-700' : 'text-zinc-500'}`}>
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-2xl liquid-glass-button-primary font-bold text-xs shadow-xl flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 text-black animate-spin" />
                <span>Analizando Biomecánica...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-black" />
                <span>Calcular Sobrecarga con IA</span>
              </>
            )}
          </motion.button>
        </form>

        {/* AI Result Card */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 p-4 rounded-2xl liquid-glass border border-white/20 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                  RECOMENDACIÓN COACH IA
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-mono">
                  {result.progressionMethod.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/10">
                <div>
                  <span className="text-[10px] text-zinc-400 block font-mono uppercase">Carga Sugerida</span>
                  <span className="text-2xl font-black text-white font-mono">
                    {result.nextWeightKg}{' '}
                    <span className="text-xs text-zinc-400 font-normal">kg</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block font-mono uppercase">Rango Reps</span>
                  <span className="text-xl font-black text-white font-mono">
                    {result.nextReps}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white mb-1">
                  {result.recommendationTitle}
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {result.detailedReasoning}
                </p>
              </div>

              {result.techniqueFocus && (
                <div className="text-[11px] text-zinc-300 liquid-glass-subtle p-2.5 rounded-xl border border-white/10">
                  <strong className="text-white">Clave Biomecánica:</strong> {result.techniqueFocus}
                </div>
              )}

              {onApplyProgression && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyProgression(result.nextWeightKg, result.nextReps);
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition shadow-lg"
                >
                  Aplicar Carga y Reps a mi Rutina
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
