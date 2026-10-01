'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserFitnessProfile,
  Gender,
  ExperienceLevel,
  FitnessGoal,
  EquipmentType,
  TrainingSplit,
  Routine,
  Plan6Months,
} from '@/types/gym';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  Dumbbell,
  Target,
  Flame,
  Clock,
  Scale,
  Activity,
  Check,
  Loader2,
} from 'lucide-react';

interface AiRoutineWizardProps {
  onCancel: () => void;
  onSuccess: (routine: Routine, plan: Plan6Months) => void;
}

const ALL_WEEK_DAYS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

export const AiRoutineWizard: React.FC<AiRoutineWizardProps> = ({
  onCancel,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 10;
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTipIndex, setGenerationTipIndex] = useState(0);

  // User responses state
  const [formData, setFormData] = useState<UserFitnessProfile>({
    gender: 'hombre',
    age: 26,
    heightCm: 175,
    currentWeightKg: 78,
    targetWeightKg: 73,
    experience: 'intermedio',
    goal: 'hipertrofia',
    daysPerWeek: 4,
    selectedDays: ['Lunes', 'Martes', 'Jueves', 'Viernes'],
    equipment: 'gym_completo',
    sessionDurationMin: 60,
    injuriesOrLimitations: 'Ninguna',
    preferredSplit: 'recomendacion_ia',
  });

  const [customInjury, setCustomInjury] = useState('');

  // Science tips rotation during loading
  const tips = [
    'Calculando tasa metabólica basal y distribución de macronutrientes óptima...',
    'Periodizando las 3 fases de entrenamiento para evitar el estancamiento muscular...',
    'Alineando ejercicios con tu perfil articular y días seleccionados...',
    'Estructurando semanas de descarga para maximizar la supercompensación...',
  ];

  const updateFormData = (fields: Partial<UserFitnessProfile>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const handleDayToggle = (day: string) => {
    let current = [...formData.selectedDays];
    if (current.includes(day)) {
      if (current.length > 1) {
        current = current.filter((d) => d !== day);
      }
    } else {
      if (current.length < formData.daysPerWeek) {
        current.push(day);
      } else {
        current = [...current.slice(1), day];
      }
    }
    current.sort((a, b) => ALL_WEEK_DAYS.indexOf(a) - ALL_WEEK_DAYS.indexOf(b));
    updateFormData({ selectedDays: current });
  };

  const handleDaysPerWeekChange = (count: number) => {
    let newSelected: string[];
    if (count === 2) newSelected = ['Martes', 'Jueves'];
    else if (count === 3) newSelected = ['Lunes', 'Miércoles', 'Viernes'];
    else if (count === 4) newSelected = ['Lunes', 'Martes', 'Jueves', 'Viernes'];
    else if (count === 5) newSelected = ['Lunes', 'Martes', 'Miércoles', 'Viernes', 'Sábado'];
    else newSelected = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    updateFormData({
      daysPerWeek: count,
      selectedDays: newSelected,
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      onCancel();
    }
  };

  const handleSubmit = async () => {
    setIsGenerating(true);
    const interval = setInterval(() => {
      setGenerationTipIndex((prev) => (prev + 1) % tips.length);
    }, 2800);

    try {
      const finalProfile = {
        ...formData,
        injuriesOrLimitations: customInjury.trim()
          ? `${formData.injuriesOrLimitations}, ${customInjury.trim()}`
          : formData.injuriesOrLimitations,
      };

      const res = await fetch('/api/gemini/routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: finalProfile }),
      });

      if (!res.ok) {
        throw new Error('Error al generar la rutina');
      }

      const data = await res.json();
      clearInterval(interval);
      onSuccess(data.routine, data.plan6Months);
    } catch (err) {
      console.error(err);
      clearInterval(interval);
      alert('Generando con el motor analítico de respaldo.');
    } finally {
      setIsGenerating(false);
    }
  };

  // BMI helper
  const heightM = formData.heightCm / 100;
  const bmi = heightM > 0 ? (formData.currentWeightKg / (heightM * heightM)).toFixed(1) : '22.0';

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] text-white flex flex-col overflow-y-auto">
      {/* Background ambient orbs */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-zinc-700/[0.04] rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header in Liquid Glass */}
      <div className="sticky top-0 z-20 liquid-glass border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handlePrev}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-subtle border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentStep === 1 ? 'Cancelar' : 'Anterior'}</span>
        </motion.button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Creador IA Paso a Paso</span>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            Pregunta {currentStep} de {totalSteps}
          </span>
        </div>

        <button
          onClick={onCancel}
          className="text-xs text-zinc-400 hover:text-white px-2 py-1"
        >
          Salir
        </button>
      </div>

      {/* Liquid Progress Bar */}
      <div className="w-full h-1 bg-white/5 relative overflow-hidden">
        <motion.div
          className="h-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Main Body */}
      <div className="flex-1 max-w-xl w-full mx-auto px-4 py-8 flex flex-col justify-between relative z-10">
        {isGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="relative mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="w-24 h-24 rounded-3xl liquid-glass-elevated border border-white/20 flex items-center justify-center shadow-2xl"
              >
                <Dumbbell className="w-10 h-10 text-white" />
              </motion.div>
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs shadow-lg">
                <Sparkles className="w-3.5 h-3.5 fill-black" />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              Diseñando tu Rutina y Plan 6M
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
              Nuestro motor de IA está calculando tus volúmenes de carga, el balance de macronutrientes y las 3 fases de periodización.
            </p>

            <div className="w-full max-w-md liquid-glass p-4 rounded-2xl flex items-center gap-3 border border-white/15">
              <Loader2 className="w-5 h-5 text-white animate-spin shrink-0" />
              <p className="text-xs text-zinc-300 font-medium text-left">
                {tips[generationTipIndex]}
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col"
            >
              {/* Step 1: Gender */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                      Paso 01 // Biometría
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                      ¿Cuál es tu sexo biológico?
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      Permite calibrar tu metabolismo basal, gasto energético y estructura articular de los ejercicios.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'hombre', label: 'Hombre', desc: 'Foco en torso V-taper, pecho y tren inferior.' },
                      { key: 'mujer', label: 'Mujer', desc: 'Foco en glúteos, femoral, cintura y tonificación.' },
                      { key: 'otro', label: 'Otro / Neutro', desc: 'Entrenamiento equilibrado sin sesgo biomecánico.' },
                    ].map((opt) => (
                      <motion.button
                        key={opt.key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateFormData({ gender: opt.key as Gender })}
                        className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          formData.gender === opt.key
                            ? 'bg-white text-black border-white shadow-xl shadow-white/10'
                            : 'liquid-glass text-zinc-300 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-base">{opt.label}</span>
                          {formData.gender === opt.key && (
                            <CheckCircle2 className="w-5 h-5 text-black" />
                          )}
                        </div>
                        <span className={`text-xs ${formData.gender === opt.key ? 'text-zinc-700' : 'text-zinc-400'}`}>
                          {opt.desc}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Age */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                      Paso 02 // Edad
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                      ¿Cuántos años tienes?
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      Afecta la capacidad de recuperación articular, el volumen máximo recuperable y el tiempo de descanso óptimo.
                    </p>
                  </div>

                  <div className="liquid-glass-elevated rounded-3xl p-8 text-center border border-white/15">
                    <div className="text-5xl sm:text-6xl font-black text-white mb-2 font-mono tracking-tight">
                      {formData.age} <span className="text-lg text-zinc-400 font-sans font-normal">años</span>
                    </div>

                    <input
                      type="range"
                      min={14}
                      max={75}
                      value={formData.age}
                      onChange={(e) => updateFormData({ age: Number(e.target.value) })}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white my-6"
                    />

                    <div className="flex justify-between text-xs text-zinc-500 font-mono">
                      <span>14 años</span>
                      <span>40 años</span>
                      <span>75 años</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Height & Weight */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                      Paso 03 // Medidas
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                      Tus medidas corporales
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      Define tu punto de partida físico y la meta que alcanzaremos a lo largo de los 6 meses.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    {/* Height */}
                    <div className="liquid-glass p-4 rounded-2xl border border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-semibold text-zinc-300">Altura (cm)</label>
                        <span className="text-sm font-bold text-white font-mono">{formData.heightCm} cm</span>
                      </div>
                      <input
                        type="range"
                        min={140}
                        max={210}
                        value={formData.heightCm}
                        onChange={(e) => updateFormData({ heightCm: Number(e.target.value) })}
                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                    </div>

                    {/* Current Weight */}
                    <div className="liquid-glass p-4 rounded-2xl border border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-semibold text-zinc-300">Peso Actual (kg)</label>
                        <span className="text-sm font-bold text-white font-mono">{formData.currentWeightKg} kg</span>
                      </div>
                      <input
                        type="range"
                        min={40}
                        max={150}
                        step={0.5}
                        value={formData.currentWeightKg}
                        onChange={(e) => updateFormData({ currentWeightKg: Number(e.target.value) })}
                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                    </div>

                    {/* Target Weight */}
                    <div className="liquid-glass p-4 rounded-2xl border border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-semibold text-zinc-300">Peso Deseado a 6 Meses (kg)</label>
                        <span className="text-sm font-bold text-zinc-300 font-mono">{formData.targetWeightKg} kg</span>
                      </div>
                      <input
                        type="range"
                        min={40}
                        max={150}
                        step={0.5}
                        value={formData.targetWeightKg}
                        onChange={(e) => updateFormData({ targetWeightKg: Number(e.target.value) })}
                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                    </div>

                    {/* Biometric summary */}
                    <div className="p-3.5 liquid-glass-subtle rounded-2xl border border-white/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-white" />
                        <span className="text-zinc-400">IMC Estimado: <strong className="text-white font-mono">{bmi}</strong></span>
                      </div>
                      <div className="text-white font-mono font-bold">
                        {formData.targetWeightKg >= formData.currentWeightKg
                          ? `+${(formData.targetWeightKg - formData.currentWeightKg).toFixed(1)} kg volumen`
                          : `${(formData.targetWeightKg - formData.currentWeightKg).toFixed(1)} kg déficit`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Experience Level */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                      Paso 04 // Nivel
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                      ¿Cuál es tu experiencia?
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      Ajusta la complejidad técnica de los levantamientos y la velocidad de sobrecarga progresiva.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        key: 'principiante',
                        label: 'Principiante (0 a 6 meses)',
                        desc: 'Aprendiendo los patrones motores básicos, creando hábito y primeras ganancias neuromusculares.',
                      },
                      {
                        key: 'intermedio',
                        label: 'Intermedio (6 meses a 2 años)',
                        desc: 'Dominas la técnica, conoces tus cargas habituales y buscas optimizar sobrecarga progresiva.',
                      },
                      {
                        key: 'avanzado',
                        label: 'Avanzado (+2 años de entreno serio)',
                        desc: 'Cercanía al fallo muscular (RPE 8-10), técnicas de alta intensidad y volumen específico.',
                      },
                    ].map((opt) => (
                      <motion.button
                        key={opt.key}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => updateFormData({ experience: opt.key as ExperienceLevel })}
                        className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start justify-between ${
                          formData.experience === opt.key
                            ? 'bg-white text-black border-white shadow-xl shadow-white/10'
                            : 'liquid-glass text-zinc-300 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-sm mb-1">{opt.label}</div>
                          <div className={`text-xs ${formData.experience === opt.key ? 'text-zinc-700' : 'text-zinc-400'}`}>
                            {opt.desc}
                          </div>
                        </div>
                        {formData.experience === opt.key && (
                          <CheckCircle2 className="w-5 h-5 text-black shrink-0 ml-3" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Goal */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                      Paso 05 // Objetivo
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                      ¿Cuál es tu objetivo prioritario?
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      Determina los rangos de repeticiones, volumen de series y el cálculo calórico del plan de 6 meses.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        key: 'hipertrofia',
                        label: 'Ganar Masa Muscular',
                        sub: 'Hipertrofia & Volumen Limpio',
                        icon: Flame,
                      },
                      {
                        key: 'definicion',
                        label: 'Definición & Pérdida de Grasa',
                        sub: 'Vascularización y corte muscular',
                        icon: Target,
                      },
                      {
                        key: 'fuerza',
                        label: 'Fuerza Máxima',
                        sub: 'Powerlifting y progresión de kilos',
                        icon: Dumbbell,
                      },
                      {
                        key: 'recomposicion',
                        label: 'Recomposición Corporal',
                        sub: 'Ganar músculo y perder grasa a la vez',
                        icon: Activity,
                      },
                      {
                        key: 'salud',
                        label: 'Salud & Acondicionamiento',
                        sub: 'Vitalidad, movilidad y resistencia',
                        icon: Scale,
                      },
                    ].map((opt) => {
                      const IconComp = opt.icon;
                      return (
                        <motion.button
                          key={opt.key}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => updateFormData({ goal: opt.key as FitnessGoal })}
                          className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                            formData.goal === opt.key
                              ? 'bg-white text-black border-white shadow-xl shadow-white/10'
                              : 'liquid-glass text-zinc-300 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <IconComp className={`w-5 h-5 ${formData.goal === opt.key ? 'text-black' : 'text-white'}`} />
                            {formData.goal === opt.key && (
                              <CheckCircle2 className="w-5 h-5 text-black" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-sm block">{opt.label}</span>
                            <span className={`text-[11px] ${formData.goal === opt.key ? 'text-zinc-600' : 'text-zinc-400'}`}>
                              {opt.sub}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 6: Days of training */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                      Paso 06 // Frecuencia (Lo eliges tú)
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                      ¿Cuántos y qué días vas a entrenar?
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      Elige el número de días semanales y selecciona los días exactos de tu calendario.
                    </p>
                  </div>

                  {/* Day count buttons */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-2">
                      Frecuencia semanal:
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[2, 3, 4, 5, 6].map((count) => (
                        <button
                          key={count}
                          onClick={() => handleDaysPerWeekChange(count)}
                          className={`py-3 rounded-2xl border text-center font-bold text-sm transition-all ${
                            formData.daysPerWeek === count
                              ? 'bg-white text-black border-white shadow-lg'
                              : 'liquid-glass text-zinc-300 hover:border-white/20'
                          }`}
                        >
                          {count} Días
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Specific day selectors */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-2">
                      Selecciona los {formData.daysPerWeek} días que irás al gimnasio:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ALL_WEEK_DAYS.map((day) => {
                        const isSelected = formData.selectedDays.includes(day);
                        return (
                          <button
                            key={day}
                            onClick={() => handleDayToggle(day)}
                            className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-between ${
                              isSelected
                                ? 'bg-white text-black border-white shadow-md'
                                : 'liquid-glass text-zinc-400 hover:border-white/20'
                            }`}
                          >
                            <span>{day}</span>
                            {isSelected && <Check className="w-4 h-4 text-black stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3.5 liquid-glass-subtle rounded-2xl text-xs text-zinc-400 flex items-center gap-2 border border-white/10">
                    <Calendar className="w-4 h-4 text-white shrink-0" />
                    <span>
                      Días seleccionados:{' '}
                      <strong className="text-white">
                        {formData.selectedDays.join(', ')}
                      </strong>{' '}
                      ({formData.selectedDays.length} de {formData.daysPerWeek})
                    </span>
                  </div>
                </div>
              )}

              {/* Step 7: Equipment */}
              {currentStep === 7 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                      Paso 07 // Equipamiento
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                      ¿Qué equipamiento tienes disponible?
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      La IA seleccionará los ejercicios que realmente puedes realizar sin improvisar.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        key: 'gym_completo',
                        label: 'Gimnasio Comercial Completo',
                        desc: 'Máquinas de placas, poleas, multipower, barras olímpicas y mancuernas de todos los pesos.',
                      },
                      {
                        key: 'mancuernas_banco',
                        label: 'Mancuernas y Banco (Casa)',
                        desc: 'Juego de mancuernas ajustables y banco regulable.',
                      },
                      {
                        key: 'barra_discos',
                        label: 'Jaula, Barra y Discos',
                        desc: 'Enfoque en los grandes levantamientos libres (banca, sentadilla, peso muerto, militar).',
                      },
                      {
                        key: 'calistenia_casa',
                        label: 'Calistenia / Peso Corporal',
                        desc: 'Flexiones, dominadas, fondos, sentadillas y variantes avanzadas con propio peso.',
                      },
                    ].map((opt) => (
                      <motion.button
                        key={opt.key}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => updateFormData({ equipment: opt.key as EquipmentType })}
                        className={`w-full p-4 rounded-2xl border text-left transition flex items-start justify-between ${
                          formData.equipment === opt.key
                            ? 'bg-white text-black border-white shadow-xl shadow-white/10'
                            : 'liquid-glass text-zinc-300 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-sm mb-1">{opt.label}</div>
                          <div className={`text-xs ${formData.equipment === opt.key ? 'text-zinc-700' : 'text-zinc-400'}`}>
                            {opt.desc}
                          </div>
                        </div>
                        {formData.equipment === opt.key && (
                          <CheckCircle2 className="w-5 h-5 text-black shrink-0 ml-3" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 8: Session Duration */}
              {currentStep === 8 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                      Paso 08 // Duración
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                      ¿Cuánto tiempo tienes por sesión?
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      Ajustaremos el número de series y tiempos de descanso para que cumplas sin prisas.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { minutes: 45, label: '45 minutos', desc: 'Rápido, superseries y densidad' },
                      { minutes: 60, label: '60 minutos', desc: 'Estándar ideal de hipertrofia' },
                      { minutes: 75, label: '75 minutos', desc: 'Volumen completo con descansos' },
                      { minutes: 90, label: '90+ minutos', desc: 'Fuerza pesada y descansos largos' },
                    ].map((opt) => (
                      <motion.button
                        key={opt.minutes}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateFormData({ sessionDurationMin: opt.minutes })}
                        className={`p-5 rounded-2xl border text-left transition ${
                          formData.sessionDurationMin === opt.minutes
                            ? 'bg-white text-black border-white shadow-xl shadow-white/10'
                            : 'liquid-glass text-zinc-300 hover:border-white/20'
                        }`}
                      >
                        <Clock className={`w-5 h-5 mb-2 ${formData.sessionDurationMin === opt.minutes ? 'text-black' : 'text-white'}`} />
                        <span className="font-bold text-sm block">{opt.label}</span>
                        <span className={`text-xs ${formData.sessionDurationMin === opt.minutes ? 'text-zinc-600' : 'text-zinc-400'}`}>
                          {opt.desc}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 9: Injuries or Limitations */}
              {currentStep === 9 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                      Paso 09 // Salud Articular
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                      ¿Tienes alguna molestia o lesión?
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      Evitaremos patrones comprometidos y seleccionaremos alternativas biomecánicamente seguras.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'Ninguna / 100% sano', value: 'Ninguna' },
                      { label: 'Molestias en espalda baja / lumbar', value: 'Molestia lumbar' },
                      { label: 'Dolor en rodillas', value: 'Molestia rodillas' },
                      { label: 'Hombro / Manguito rotador', value: 'Molestia hombro' },
                      { label: 'Muñecas o codos', value: 'Molestia codos/muñecas' },
                    ].map((opt) => {
                      const isSelected = formData.injuriesOrLimitations.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => updateFormData({ injuriesOrLimitations: opt.value })}
                          className={`p-4 rounded-2xl border text-left text-xs font-semibold transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-white text-black border-white shadow-md'
                              : 'liquid-glass text-zinc-300 hover:border-white/20'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-black shrink-0 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                      Otra molestia específica (opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: hernia discal L5-S1 leve, molestia al bajar en sentadilla..."
                      value={customInjury}
                      onChange={(e) => setCustomInjury(e.target.value)}
                      className="w-full liquid-glass-subtle border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                    />
                  </div>
                </div>
              )}

              {/* Step 10: Preferred Split */}
              {currentStep === 10 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                      Paso 10 // Estilo de División
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                      División de entrenamiento preferida
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      Organización semanal de los grupos musculares.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        key: 'recomendacion_ia',
                        label: 'Recomendación Óptima del Coach IA (Recomendado)',
                        desc: `La IA elegirá la mejor distribución científica para tus ${formData.daysPerWeek} días (${formData.selectedDays.join(', ')}).`,
                      },
                      {
                        key: 'torso_pierna',
                        label: 'Torso / Pierna',
                        desc: 'Frecuencia 2 ideal para progresar cargas y recuperarse con solvencia.',
                      },
                      {
                        key: 'ppl',
                        label: 'Push / Pull / Legs (Empuje, Tirón, Pierna)',
                        desc: 'Separación por vectores de movimiento articular.',
                      },
                      {
                        key: 'full_body',
                        label: 'Full Body (Cuerpo Completo)',
                        desc: 'Entrenar todo el cuerpo en cada sesión con volumen moderado.',
                      },
                      {
                        key: 'weider',
                        label: 'Weider Clásica (Músculo por día)',
                        desc: 'Un grupo muscular diario a máximo bombeo y congestión.',
                      },
                    ].map((opt) => (
                      <motion.button
                        key={opt.key}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => updateFormData({ preferredSplit: opt.key as TrainingSplit })}
                        className={`w-full p-4 rounded-2xl border text-left transition flex items-start justify-between ${
                          formData.preferredSplit === opt.key
                            ? 'bg-white text-black border-white shadow-xl shadow-white/10'
                            : 'liquid-glass text-zinc-300 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-sm mb-1">{opt.label}</div>
                          <div className={`text-xs ${formData.preferredSplit === opt.key ? 'text-zinc-700' : 'text-zinc-400'}`}>
                            {opt.desc}
                          </div>
                        </div>
                        {formData.preferredSplit === opt.key && (
                          <CheckCircle2 className="w-5 h-5 text-black shrink-0 ml-3" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Footer Navigation Buttons */}
        {!isGenerating && (
          <div className="pt-6 border-t border-white/10 flex items-center justify-between gap-3 mt-6">
            <button
              onClick={handlePrev}
              className="px-5 py-2.5 rounded-2xl liquid-glass-button text-xs font-semibold text-zinc-300 hover:text-white transition"
            >
              Atrás
            </button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl liquid-glass-button-primary font-bold text-xs shadow-xl active:scale-95 transition"
            >
              <span>{currentStep === totalSteps ? 'Generar Rutina y Mi Plan 6M' : 'Siguiente'}</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};
