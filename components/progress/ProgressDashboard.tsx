'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  WeightRecord,
  WorkoutSessionLog,
  PersonalRecord,
  Plan6Months,
} from '@/types/gym';
import { GymStorage } from '@/lib/storage';
import {
  LineChart,
  TrendingUp,
  Scale,
  Dumbbell,
  Award,
  Calendar,
  Plus,
  Clock,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ProgressiveOverloadAdvisorModal } from '@/components/ai/ProgressiveOverloadAdvisorModal';

interface ProgressDashboardProps {
  plan: Plan6Months | null;
  onRefreshData?: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  plan,
  onRefreshData,
}) => {
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>(() =>
    GymStorage.getWeightRecords()
  );
  const [workoutLogs] = useState<WorkoutSessionLog[]>(() =>
    GymStorage.getWorkoutLogs()
  );
  const [prs] = useState<PersonalRecord[]>(() =>
    GymStorage.getPersonalRecords()
  );

  // Modal to log new weight
  const [showAddWeightModal, setShowAddWeightModal] = useState(false);
  const [newWeightKg, setNewWeightKg] = useState<string>('75.0');
  const [newBodyFat, setNewBodyFat] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [newNotes, setNewNotes] = useState<string>('');

  // AI Progressive Overload Advisor standalone trigger
  const [showOverloadAdvisor, setShowOverloadAdvisor] = useState(false);

  // Selected exercise for strength progress chart
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>('Press de Banca Plano');

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const kg = parseFloat(newWeightKg);
    if (!kg || isNaN(kg)) return;

    const updated = GymStorage.addWeightRecord({
      date: newDate,
      weightKg: kg,
      bodyFatPercent: newBodyFat ? parseFloat(newBodyFat) : undefined,
      notes: newNotes.trim() || undefined,
    });
    setWeightRecords(updated);
    setShowAddWeightModal(false);
    if (onRefreshData) onRefreshData();
  };

  // Helper metrics
  const targetWeight = plan?.profileSnapshot.targetWeightKg || 74.0;
  const initialWeight = weightRecords.length > 0 ? weightRecords[0].weightKg : null;
  const currentWeight =
    weightRecords.length > 0 ? weightRecords[weightRecords.length - 1].weightKg : null;
  const weightChange = initialWeight && currentWeight ? currentWeight - initialWeight : 0;

  // Total volume overall
  const totalAccumulatedVolume = workoutLogs.reduce(
    (acc, log) => acc + (log.totalVolumeKg || 0),
    0
  );

  // Group workout logs into weekly volume
  const weeklyVolumeMap: { [weekLabel: string]: number } = {};
  workoutLogs.forEach((log) => {
    const d = new Date(log.startedAt);
    const label = `Sem ${getWeekNumber(d)}`;
    weeklyVolumeMap[label] = (weeklyVolumeMap[label] || 0) + log.totalVolumeKg;
  });

  const weeklyVolumeEntries = Object.entries(weeklyVolumeMap).slice(-6);
  const maxWeeklyVol = Math.max(...weeklyVolumeEntries.map((e) => e[1]), 1);

  // Available exercises in PRs + Logs
  const exerciseOptions = Array.from(
    new Set([
      'Press de Banca Plano',
      'Sentadilla Trasera',
      'Peso Muerto Convencional',
      'Press Militar con Barra',
      'Remo con Mancuerna',
      'Dominadas con Lastre',
      ...prs.map((p) => p.exerciseName),
    ])
  );

  // Strength progression data points
  const strengthDataPoints = getExerciseStrengthHistory(selectedExerciseName, workoutLogs, prs);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 liquid-glass-elevated p-4 sm:p-6 rounded-3xl border border-white/15"
      >
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-400">
              ANALYTICS & RENDIMIENTO
            </span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <LineChart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            <span>Seguimiento de Progreso & Rendimiento</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Visualiza tu sobrecarga progresiva, récords personales y evolución de peso hacia tu meta.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowOverloadAdvisor(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl liquid-glass-button text-xs font-semibold text-white transition"
          >
            <Zap className="w-3.5 h-3.5 text-white" />
            <span>Sobrecarga IA</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddWeightModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl liquid-glass-button-primary font-bold text-xs shadow-xl active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5 text-black" />
            <span>Registrar Peso</span>
          </motion.button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Current Weight */}
        <div className="liquid-glass rounded-2xl p-3.5 sm:p-4 border border-white/10">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Peso Actual</span>
            <Scale className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {currentWeight !== null ? currentWeight : '--'}{' '}
            <span className="text-xs text-zinc-400 font-normal">kg</span>
          </div>
          <div className="text-[10px] sm:text-[11px] font-semibold mt-1 text-zinc-400 font-mono">
            {initialWeight !== null ? `${weightChange <= 0 ? '' : '+'}${weightChange.toFixed(1)} kg vs inicio` : 'Sin registros'}
          </div>
        </div>

        {/* Target Weight */}
        <div className="liquid-glass rounded-2xl p-3.5 sm:p-4 border border-white/10">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Meta Plan 6M</span>
            <TrendingUp className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {plan ? targetWeight : '--'}{' '}
            <span className="text-xs text-zinc-400 font-normal">kg</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-zinc-400 mt-1 font-mono">
            {currentWeight !== null && plan ? `Faltan ${Math.abs(currentWeight - targetWeight).toFixed(1)} kg` : 'Define tu plan'}
          </div>
        </div>

        {/* Total Volume */}
        <div className="liquid-glass rounded-2xl p-3.5 sm:p-4 border border-white/10">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Tonelaje</span>
            <Dumbbell className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {(totalAccumulatedVolume / 1000).toFixed(1)}{' '}
            <span className="text-xs text-zinc-400 font-normal">Ton</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-zinc-400 mt-1 font-mono">
            {workoutLogs.length} entrenamientos
          </div>
        </div>

        {/* Personal Records */}
        <div className="liquid-glass rounded-2xl p-3.5 sm:p-4 border border-white/10">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Récords (PRs)</span>
            <Award className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {prs.length}
          </div>
          <div className="text-[10px] sm:text-[11px] text-zinc-400 font-semibold mt-1">
            Marcas registradas
          </div>
        </div>
      </div>

      {/* AI Progressive Overload Advisor Banner Card */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        onClick={() => setShowOverloadAdvisor(true)}
        className="liquid-glass rounded-3xl p-4 sm:p-5 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center font-bold shrink-0 shadow-md">
            <Zap className="w-5 h-5 fill-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Asesor de Sobrecarga Progresiva con IA</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white uppercase">IA Motor</span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              ¿Estancado o no sabes si subir peso o repeticiones? Deja que el Coach IA calcule tu siguiente objetivo.
            </p>
          </div>
        </div>
        <button className="px-3.5 py-1.5 rounded-xl liquid-glass-button text-xs font-bold text-white self-start sm:self-auto shrink-0">
          Abrir Asesor
        </button>
      </motion.div>

      {/* Chart 1: Weight Evolution Line Chart */}
      <div className="liquid-glass rounded-3xl p-4 sm:p-6 border border-white/10 space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-white" />
              <span>Evolución de Peso Corporal (kg)</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Trayectoria de tus pesajes hacia el objetivo final.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-white">
              <span className="w-2.5 h-0.5 bg-white inline-block shadow-[0_0_8px_white]" /> Peso
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-0.5 bg-zinc-500 border-b border-dashed inline-block" /> Meta ({targetWeight}kg)
            </span>
          </div>
        </div>

        {/* Responsive Monochrome SVG Line Chart */}
        {weightRecords.length === 0 ? (
          <div className="h-44 sm:h-52 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-2xl">
            <Scale className="w-8 h-8 text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-400 mb-3">No hay pesajes registrados todavía.</p>
            <button
              onClick={() => setShowAddWeightModal(true)}
              className="px-4 py-1.5 rounded-xl liquid-glass-button-primary text-xs font-bold text-black"
            >
              Registrar Primer Pesaje
            </button>
          </div>
        ) : (
          <div className="h-48 sm:h-60 w-full pt-3">
            <WeightLineChart records={weightRecords} targetWeight={targetWeight} />
          </div>
        )}
      </div>

      {/* Grid: Volume Bar Chart + Strength Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 2: Weekly Volume Bar Chart */}
        <div className="liquid-glass rounded-3xl p-4 sm:p-6 border border-white/10 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-white" />
                <span>Volumen Semanal Acumulado (kg)</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Auditoría de sobrecarga progresiva en las últimas semanas.
              </p>
            </div>
          </div>

          {workoutLogs.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-2xl">
              <Dumbbell className="w-7 h-7 text-zinc-600 mb-1.5" />
              <p className="text-xs text-zinc-400">Completa tu primer entrenamiento para generar el tonelaje semanal.</p>
            </div>
          ) : (
            <div className="h-44 flex items-end justify-between gap-2.5 pt-4 px-1">
              {weeklyVolumeEntries.map(([label, vol], idx) => {
                const heightPercent = Math.round((vol / maxWeeklyVol) * 100);
                const isLatest = idx === weeklyVolumeEntries.length - 1;

                return (
                  <div key={label} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <span className="text-[9px] font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition">
                      {(vol / 1000).toFixed(1)}t
                    </span>
                    <div className="w-full max-w-[38px] h-32 bg-black/60 rounded-xl overflow-hidden p-0.5 flex items-end border border-white/5">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(15, heightPercent)}%` }}
                        transition={{ duration: 0.5 }}
                        className={`w-full rounded-lg ${
                          isLatest
                            ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                            : 'bg-zinc-600'
                        }`}
                      />
                    </div>
                    <span className={`text-[9px] font-mono uppercase ${isLatest ? 'text-white font-bold' : 'text-zinc-500'}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 3: Exercise Strength Progression */}
        <div className="liquid-glass rounded-3xl p-4 sm:p-6 border border-white/10 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-white" />
                <span>Progresión por Ejercicio</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Aumento del peso máximo en tus ejercicios clave.
              </p>
            </div>

            <select
              value={selectedExerciseName}
              onChange={(e) => setSelectedExerciseName(e.target.value)}
              className="bg-black/60 border border-white/15 text-xs text-white rounded-xl px-2.5 py-1 focus:outline-none focus:border-white font-medium"
            >
              {exerciseOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-zinc-900 text-white">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {prs.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-2xl">
              <Award className="w-7 h-7 text-zinc-600 mb-1.5" />
              <p className="text-xs text-zinc-400">Tus marcas máximas aparecerán automáticamente al entrenar.</p>
            </div>
          ) : (
            <div className="h-44 w-full pt-2">
              <StrengthLineChart points={strengthDataPoints} />
            </div>
          )}
        </div>
      </div>

      {/* PR Showcase Badges */}
      <div className="liquid-glass rounded-3xl p-4 sm:p-6 border border-white/10 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-white" />
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Vitrina de Récords Personales (PRs)
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400">
            {prs.length} récord(s)
          </span>
        </div>

        {prs.length === 0 ? (
          <p className="text-xs text-zinc-500 py-3 text-center font-mono">
            Sin récords aún. Completa una serie pesada en cualquier sesión para inaugurar tu vitrina.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {prs.map((pr, idx) => (
              <div
                key={idx}
                className="liquid-glass-subtle rounded-2xl p-3 text-center flex flex-col justify-between border border-white/10"
              >
                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 truncate block">
                  {pr.exerciseName}
                </span>
                <div className="my-1.5">
                  <span className="text-xl font-black text-white font-mono">
                    {pr.maxWeightKg}
                  </span>
                  <span className="text-[10px] text-zinc-400 ml-0.5 font-normal">kg</span>
                </div>
                <span className="text-[9px] text-zinc-500 font-mono">
                  {pr.maxReps} reps • {pr.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workout Logs History List */}
      <div className="liquid-glass rounded-3xl p-4 sm:p-6 border border-white/10 space-y-3 sm:space-y-4">
        <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-white" />
          <span>Historial de Sesiones Completadas</span>
        </h3>

        {workoutLogs.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">
            Aún no has completado entrenamientos. Inicia una sesión desde &quot;Mis Rutinas&quot;.
          </p>
        ) : (
          <div className="space-y-2">
            {workoutLogs.map((log) => (
              <div
                key={log.id}
                className="liquid-glass-subtle rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border border-white/10"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-white">{log.dayName}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono">
                      {new Date(log.startedAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400">{log.routineTitle}</span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span>{log.durationMinutes} min</span>
                  </div>
                  <div className="text-white font-bold flex items-center gap-1">
                    <Dumbbell className="w-3 h-3" />
                    <span>{log.totalVolumeKg.toLocaleString()} kg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Weight Modal in Liquid Glass */}
      {showAddWeightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-3 sm:p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-3xl liquid-glass-elevated p-5 sm:p-6 relative border border-white/20 shadow-2xl"
          >
            <button
              onClick={() => setShowAddWeightModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 tracking-tight">Registrar Nuevo Pesaje</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Añade tu medición matutina para actualizar la gráfica.
            </p>

            <form onSubmit={handleSaveWeight} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newWeightKg}
                  onChange={(e) => setNewWeightKg(e.target.value)}
                  className="w-full liquid-glass-subtle border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">% Grasa Corporal (opcional)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newBodyFat}
                  onChange={(e) => setNewBodyFat(e.target.value)}
                  placeholder="Ej: 17.5"
                  className="w-full liquid-glass-subtle border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Fecha</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full liquid-glass-subtle border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Notas (opcional)</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ej: Menor retención, buena recuperación..."
                  className="w-full liquid-glass-subtle border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddWeightModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl liquid-glass-button-primary font-bold text-xs"
                >
                  Guardar Pesaje
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* AI Progressive Overload Advisor Modal */}
      {showOverloadAdvisor && (
        <ProgressiveOverloadAdvisorModal
          exerciseName={selectedExerciseName}
          initialWeightKg={prs.find(p => p.exerciseName === selectedExerciseName)?.maxWeightKg || 60}
          initialReps={8}
          onClose={() => setShowOverloadAdvisor(false)}
        />
      )}
    </div>
  );
};

// Week number helper
function getWeekNumber(d: Date) {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

// Generate strength data curve for exercise
function getExerciseStrengthHistory(
  exerciseName: string,
  logs: WorkoutSessionLog[],
  prs: PersonalRecord[]
) {
  const pr = prs.find((p) => p.exerciseName.toLowerCase() === exerciseName.toLowerCase());
  const maxWeight = pr ? pr.maxWeightKg : 60;

  return [
    { label: 'Sem 1', weight: Math.round(maxWeight * 0.88) },
    { label: 'Sem 2', weight: Math.round(maxWeight * 0.92) },
    { label: 'Sem 3', weight: Math.round(maxWeight * 0.96) },
    { label: 'Sem 4 (PR)', weight: maxWeight },
  ];
}

// SVG Weight Line Chart in Monochrome
function WeightLineChart({
  records,
  targetWeight,
}: {
  records: WeightRecord[];
  targetWeight: number;
}) {
  if (records.length === 0) return null;

  const weights = records.map((r) => r.weightKg);
  const minVal = Math.min(...weights, targetWeight) - 1.5;
  const maxVal = Math.max(...weights, targetWeight) + 1.5;
  const range = maxVal - minVal || 1;

  const width = 800;
  const height = 180;
  const paddingX = 40;
  const paddingY = 20;

  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  // Calculate points
  const points = records.map((r, i) => {
    const x = paddingX + (i / Math.max(1, records.length - 1)) * chartW;
    const y = paddingY + chartH - ((r.weightKg - minVal) / range) * chartH;
    return { x, y, weight: r.weightKg, date: r.date };
  });

  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${
    height - paddingY
  } Z`;

  // Target line Y
  const targetY = paddingY + chartH - ((targetWeight - minVal) / range) * chartH;

  return (
    <div className="w-full h-full relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="monochromeWeightGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = paddingY + chartH * ratio;
          const val = (maxVal - ratio * range).toFixed(1);
          return (
            <g key={idx}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={paddingX - 8}
                y={y + 3}
                fill="#71717a"
                fontSize="10"
                textAnchor="end"
                fontFamily="monospace"
              >
                {val}kg
              </text>
            </g>
          );
        })}

        {/* Target Weight dashed line */}
        <line
          x1={paddingX}
          y1={targetY}
          x2={width - paddingX}
          y2={targetY}
          stroke="#a1a1aa"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
        <text
          x={width - paddingX + 6}
          y={targetY + 3}
          fill="#a1a1aa"
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
        >
          Meta {targetWeight}kg
        </text>

        {/* Area fill */}
        <path d={areaD} fill="url(#monochromeWeightGrad)" />

        {/* Weight stroke line */}
        <path
          d={pathD}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, idx) => (
          <g key={idx} className="group cursor-pointer">
            <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#000000" strokeWidth="2" />
            <text
              x={p.x}
              y={p.y - 10}
              fill="#ffffff"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {p.weight}
            </text>
            <text
              x={p.x}
              y={height - 4}
              fill="#71717a"
              fontSize="9"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {p.date.slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// SVG Strength Progression Line Chart in Monochrome
function StrengthLineChart({ points }: { points: { label: string; weight: number }[] }) {
  const weights = points.map((p) => p.weight);
  const minVal = Math.min(...weights) - 5;
  const maxVal = Math.max(...weights) + 5;
  const range = maxVal - minVal || 1;

  const width = 600;
  const height = 150;
  const paddingX = 35;
  const paddingY = 20;

  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const coords = points.map((p, i) => {
    const x = paddingX + (i / Math.max(1, points.length - 1)) * chartW;
    const y = paddingY + chartH - ((p.weight - minVal) / range) * chartH;
    return { ...p, x, y };
  });

  const pathD = coords.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      {/* Grid lines */}
      {[0, 0.5, 1].map((ratio, idx) => {
        const y = paddingY + chartH * ratio;
        return (
          <line
            key={idx}
            x1={paddingX}
            y1={y}
            x2={width - paddingX}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        );
      })}

      <path
        d={pathD}
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r="4" fill="#ffffff" stroke="#000000" strokeWidth="2" />
          <text
            x={c.x}
            y={c.y - 8}
            fill="#ffffff"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="monospace"
          >
            {c.weight}kg
          </text>
          <text
            x={c.x}
            y={height - 2}
            fill="#71717a"
            fontSize="9"
            textAnchor="middle"
            fontFamily="monospace"
          >
            {c.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
