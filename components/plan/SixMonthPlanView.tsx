'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plan6Months, MonthPlanDetail } from '@/types/gym';
import { GymStorage } from '@/lib/storage';
import {
  Calendar,
  Target,
  Sparkles,
  Scale,
  Award,
  Utensils,
  Footprints,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Dumbbell,
  ArrowRight,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';

interface SixMonthPlanViewProps {
  plan: Plan6Months | null;
  onGoToRoutines: () => void;
  onOpenAiWizard: () => void;
  onOpenCoachChat?: () => void;
}

export const SixMonthPlanView: React.FC<SixMonthPlanViewProps> = ({
  plan,
  onGoToRoutines,
  onOpenAiWizard,
  onOpenCoachChat,
}) => {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [overridePlan, setOverridePlan] = useState<Plan6Months | null>(null);
  const [copied, setCopied] = useState(false);

  const currentPlan = overridePlan ?? plan;

  if (!currentPlan) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-8 sm:py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="liquid-glass rounded-3xl p-6 sm:p-12 border border-white/10"
        >
          <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center text-white mx-auto mb-4 shadow-xl">
            <Target className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-white mb-2 tracking-tight">
            Comienza tu Plan de Transformación 6M
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
            Al abrir la aplicación por primera vez tu plan está listo para configurarse desde cero. Responde al Coach IA para generar tu hoja de ruta personalizada con tus días elegidos y macros diarios.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenAiWizard}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl liquid-glass-button-primary font-bold text-xs shadow-2xl transition"
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>Diseñar Mi Plan con IA (Paso a paso)</span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const activeMonth: MonthPlanDetail = currentPlan.months[selectedMonthIndex] || currentPlan.months[0];
  const profile = currentPlan.profileSnapshot;

  const handleToggleMilestone = (monthIdx: number, mIdx: number) => {
    const updated = GymStorage.toggleMilestone(monthIdx, mIdx);
    if (updated) {
      setOverridePlan({ ...updated });
    }
  };

  const handleCopySummary = () => {
    const text = `
=== MI PLAN DE TRANSFORMACIÓN FÍSICA (6 MESES) ===
Objetivo: ${profile.goal.toUpperCase()}
Días seleccionados: ${profile.selectedDays?.join(', ')} (${profile.daysPerWeek} días/semana)
Peso Inicial: ${profile.currentWeightKg} kg -> Peso Objetivo: ${profile.targetWeightKg} kg
Calorías Mes ${activeMonth.month}: ${activeMonth.calorieTarget} kcal
Proteína: ${activeMonth.proteinGrams}g | Carbos: ${activeMonth.carbsGrams}g | Grasas: ${activeMonth.fatGrams}g
Cardio: ${activeMonth.cardioProtocol}
Hito del mes: ${activeMonth.strengthMilestone}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Milestones count
  let totalMilestones = 0;
  let completedMilestones = 0;
  currentPlan.months.forEach((m) => {
    m.milestones.forEach((milestone) => {
      totalMilestones++;
      if (milestone.isCompleted) completedMilestones++;
    });
  });
  const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl liquid-glass-elevated p-5 sm:p-8 border border-white/15 shadow-2xl"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-0.5 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-white" />
                Coach IA Activo
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {profile.daysPerWeek} días / semana seleccionados
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              Mi Plan de Transformación 6M
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              {currentPlan.overviewSummary}
            </p>

            <div className="pt-1.5 flex flex-wrap items-center gap-2.5 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5 liquid-glass-subtle px-3 py-1 rounded-xl border border-white/10 text-zinc-300">
                <Calendar className="w-3.5 h-3.5 text-white" />
                <span>Días: <strong className="text-white font-medium">{profile.selectedDays?.join(', ')}</strong></span>
              </div>

              <div className="flex items-center gap-1.5 liquid-glass-subtle px-3 py-1 rounded-xl border border-white/10 text-zinc-300">
                <Scale className="w-3.5 h-3.5 text-white" />
                <span>
                  {profile.currentWeightKg} kg <ArrowRight className="w-3 h-3 inline text-zinc-500" />{' '}
                  <strong className="text-white font-mono">{profile.targetWeightKg} kg</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Progress Gauge Card */}
          <div className="liquid-glass-subtle rounded-2xl p-4 sm:p-5 border border-white/10 flex md:flex-col items-center justify-between md:justify-center gap-3.5 shrink-0 min-w-[200px]">
            <div className="text-center md:text-left">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">
                PROGRESO GLOBAL
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5">
                {progressPercent}%
              </div>
              <span className="text-[11px] text-zinc-400">
                {completedMilestones} de {totalMilestones} hitos
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
              {onOpenCoachChat && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onOpenCoachChat}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-button text-white text-xs font-bold"
                  title="Preguntar a tu Entrenador Personal IA sobre este plan"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-white" />
                  <span>Preguntar al Coach</span>
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-subtle text-zinc-300 hover:text-white text-xs font-semibold border border-white/10"
                title="Copiar resumen del plan"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Compartir'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenAiWizard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-subtle text-white text-xs font-semibold border border-white/20 hover:bg-white/10"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Reajustar</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Month Tabs Navigation */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {currentPlan.months.map((m, idx) => {
          const isSelected = selectedMonthIndex === idx;
          const completedCount = m.milestones.filter((mil) => mil.isCompleted).length;
          const isCurrentPhase1 = idx < 2;
          const isCurrentPhase2 = idx >= 2 && idx < 4;

          return (
            <motion.button
              key={m.month}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedMonthIndex(idx)}
              className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-white text-black border-white shadow-xl shadow-white/10'
                  : 'liquid-glass text-zinc-400 hover:border-white/20 hover:text-zinc-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[9px] font-mono uppercase tracking-wider ${isSelected ? 'text-zinc-600' : 'text-zinc-500'}`}>
                    {isCurrentPhase1 ? 'Fase 1' : isCurrentPhase2 ? 'Fase 2' : 'Fase 3'}
                  </span>
                  {completedCount === m.milestones.length && m.milestones.length > 0 && (
                    <CheckCircle2 className={`w-3 h-3 ${isSelected ? 'text-black' : 'text-white'}`} />
                  )}
                </div>
                <div className={`font-black text-xs sm:text-sm tracking-tight ${isSelected ? 'text-black' : 'text-white'}`}>
                  Mes 0{m.month}
                </div>
              </div>
              <div className={`text-[10px] mt-1.5 flex items-center justify-between font-mono ${isSelected ? 'text-zinc-700' : 'text-zinc-400'}`}>
                <span>{m.expectedWeightKg}kg</span>
                <span>
                  {completedCount}/{m.milestones.length}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Active Month Detail Content */}
      <div className="space-y-4 sm:space-y-6">
        {/* Month Header Banner */}
        <div className="liquid-glass rounded-3xl p-4 sm:p-6 border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                  {activeMonth.phaseName}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  Semanas {(activeMonth.month - 1) * 4 + 1} - {activeMonth.month * 4}
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">{activeMonth.title}</h2>
            </div>

            <div className="flex items-center gap-3 liquid-glass-subtle px-3.5 py-2 rounded-2xl border border-white/10 self-start sm:self-auto">
              <div className="text-center">
                <span className="text-[9px] font-mono uppercase text-zinc-400 block">Meta Peso</span>
                <span className="text-sm sm:text-base font-black text-white font-mono">
                  {activeMonth.expectedWeightKg} kg
                </span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="text-center">
                <span className="text-[9px] font-mono uppercase text-zinc-400 block">Descarga</span>
                <span className="text-xs font-bold text-zinc-300 font-mono">
                  Sem. {activeMonth.deloadWeek}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            <strong className="text-white">Foco Fisiológico:</strong> {activeMonth.focus}
          </p>
        </div>

        {/* Nutritional & Energy Strategy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Daily Macros Card */}
          <div className="liquid-glass rounded-3xl p-4 sm:p-5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white mb-2.5">
              <Utensils className="w-4 h-4 text-white" />
              <span>Objetivo Nutricional Diario</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-zinc-400">Calorías</span>
                <span className="text-lg font-black text-white font-mono">
                  {activeMonth.calorieTarget} <span className="text-xs text-zinc-400 font-normal">kcal</span>
                </span>
              </div>

              {/* Macro breakdown bars */}
              <div className="space-y-2 pt-1">
                <div>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-zinc-300 font-medium">Proteína</span>
                    <span className="text-white font-bold font-mono">{activeMonth.proteinGrams}g</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: '42%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-zinc-300 font-medium">Carbohidratos</span>
                    <span className="text-zinc-300 font-bold font-mono">{activeMonth.carbsGrams}g</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-400 rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-zinc-300 font-medium">Grasas</span>
                    <span className="text-zinc-400 font-bold font-mono">{activeMonth.fatGrams}g</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-600 rounded-full" style={{ width: '25%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-white/10 text-[11px] text-zinc-400">
              Agua recomendada: <strong className="text-white font-mono">3.5 L / día</strong>
            </div>
          </div>

          {/* Cardio & NEAT Card */}
          <div className="liquid-glass rounded-3xl p-4 sm:p-5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white mb-2.5">
              <Footprints className="w-4 h-4 text-white" />
              <span>Cardio & Actividad Diaria</span>
            </div>

            <div className="liquid-glass-subtle p-3 rounded-2xl mb-2.5 border border-white/10">
              <span className="text-[11px] font-semibold text-white block mb-0.5">Protocolo:</span>
              <p className="text-xs text-zinc-300 leading-relaxed">{activeMonth.cardioProtocol}</p>
            </div>

            <div className="space-y-1.5 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-white shrink-0" />
                <span>Gasto sostenido sin fatiga muscular.</span>
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-white/10 text-[11px] text-zinc-400 font-mono">
              Frecuencia cardíaca: <strong className="text-white">120 - 135 ppm</strong>
            </div>
          </div>

          {/* Strength Milestone Card */}
          <div className="liquid-glass rounded-3xl p-4 sm:p-5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white mb-2.5">
              <Award className="w-4 h-4 text-white" />
              <span>Hito de Fuerza</span>
            </div>

            <div className="liquid-glass-subtle p-3 rounded-2xl mb-2.5 border border-white/15">
              <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block mb-0.5">
                Objetivo del Mes {activeMonth.month}
              </span>
              <p className="text-xs font-bold text-white leading-relaxed">
                {activeMonth.strengthMilestone}
              </p>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-white/10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onGoToRoutines}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl liquid-glass-button text-white text-xs font-bold transition"
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Ver Rutinas del Plan</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Training Guidelines */}
        <div className="liquid-glass rounded-3xl p-4 sm:p-6 border border-white/10">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-3">
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>Pautas Técnicas y Biomecánicas // Mes {activeMonth.month}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {activeMonth.trainingGuidelines.map((guide, gIdx) => (
              <div
                key={gIdx}
                className="p-3 liquid-glass-subtle rounded-2xl text-xs text-zinc-300 leading-relaxed flex items-start gap-2.5 border border-white/10"
              >
                <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {gIdx + 1}
                </div>
                <span>{guide}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones Checklist */}
        <div className="liquid-glass rounded-3xl p-4 sm:p-6 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                Hitos Semanales del Mes {activeMonth.month}
              </h3>
            </div>
            <span className="text-[11px] text-zinc-400">
              Toca para marcar
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activeMonth.milestones.map((m, mIdx) => (
              <motion.button
                key={m.week}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleToggleMilestone(selectedMonthIndex, mIdx)}
                className={`p-3.5 rounded-2xl border text-left transition flex items-start justify-between gap-2.5 ${
                  m.isCompleted
                    ? 'bg-white/10 border-white/30 text-white'
                    : 'liquid-glass-subtle border-white/10 text-zinc-400 hover:border-white/20'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-white">
                      Sem. {m.week}
                    </span>
                    <span className={`text-xs font-bold ${m.isCompleted ? 'text-white' : 'text-zinc-300'}`}>
                      {m.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="shrink-0 mt-0.5">
                  {m.isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-white/20 bg-zinc-900" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
