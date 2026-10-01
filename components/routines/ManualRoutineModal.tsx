'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Routine, RoutineDay, Exercise } from '@/types/gym';
import { X, Plus, Trash2, Dumbbell } from 'lucide-react';

interface ManualRoutineModalProps {
  initialRoutine?: Routine | null;
  onClose: () => void;
  onSave: (routine: Routine) => void;
}

export const ManualRoutineModal: React.FC<ManualRoutineModalProps> = ({
  initialRoutine,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(initialRoutine?.title || 'Mi Rutina Personalizada');
  const [description, setDescription] = useState(
    initialRoutine?.description || 'Rutina manual enfocada en hipertrofia y progresión.'
  );

  const [days, setDays] = useState<RoutineDay[]>(() => {
    if (initialRoutine && initialRoutine.days.length > 0) {
      return initialRoutine.days;
    }
    return [
      {
        id: `day-${Date.now()}-1`,
        name: 'Día 1: Torso / Empuje',
        dayOfWeek: 'Lunes',
        targetMuscles: ['Pecho', 'Hombros', 'Tríceps'],
        estimatedDurationMin: 60,
        exercises: [
          {
            id: `ex-${Date.now()}-1`,
            name: 'Press de Banca Plano con Barra',
            muscleGroup: 'pecho',
            notes: 'Parada de 1s en el pecho y subida explosiva.',
            sets: [
              { setNumber: 1, targetReps: '8-10', targetWeightKg: 60, restSeconds: 90 },
              { setNumber: 2, targetReps: '8-10', targetWeightKg: 65, restSeconds: 90 },
              { setNumber: 3, targetReps: '6-8', targetWeightKg: 70, restSeconds: 120 },
            ],
          },
        ],
      },
    ];
  });

  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const handleAddDay = () => {
    const newDayNumber = days.length + 1;
    const newDay: RoutineDay = {
      id: `day-${Date.now()}-${newDayNumber}`,
      name: `Día ${newDayNumber}: Nuevo Entrenamiento`,
      dayOfWeek: 'Miércoles',
      targetMuscles: ['Cuerpo Completo'],
      estimatedDurationMin: 60,
      exercises: [
        {
          id: `ex-${Date.now()}`,
          name: 'Sentadilla Libre con Barra',
          muscleGroup: 'piernas',
          notes: '',
          sets: [
            { setNumber: 1, targetReps: '8-10', targetWeightKg: 70, restSeconds: 120 },
            { setNumber: 2, targetReps: '8-10', targetWeightKg: 75, restSeconds: 120 },
            { setNumber: 3, targetReps: '6-8', targetWeightKg: 80, restSeconds: 120 },
          ],
        },
      ],
    };
    setDays([...days, newDay]);
    setActiveDayIndex(days.length);
  };

  const handleRemoveDay = (idx: number) => {
    if (days.length <= 1) return;
    const updated = days.filter((_, i) => i !== idx);
    setDays(updated);
    setActiveDayIndex(Math.max(0, idx - 1));
  };

  const handleAddExercise = (dayIdx: number) => {
    const updatedDays = [...days];
    const newEx: Exercise = {
      id: `ex-${Date.now()}`,
      name: 'Nuevo Ejercicio',
      muscleGroup: 'pecho',
      notes: '',
      sets: [
        { setNumber: 1, targetReps: '10-12', targetWeightKg: 20, restSeconds: 60 },
        { setNumber: 2, targetReps: '10-12', targetWeightKg: 20, restSeconds: 60 },
        { setNumber: 3, targetReps: '10-12', targetWeightKg: 20, restSeconds: 60 },
      ],
    };
    updatedDays[dayIdx].exercises.push(newEx);
    setDays(updatedDays);
  };

  const handleRemoveExercise = (dayIdx: number, exIdx: number) => {
    const updatedDays = [...days];
    updatedDays[dayIdx].exercises = updatedDays[dayIdx].exercises.filter((_, i) => i !== exIdx);
    setDays(updatedDays);
  };

  const handleAddSet = (dayIdx: number, exIdx: number) => {
    const updatedDays = [...days];
    const targetEx = updatedDays[dayIdx].exercises[exIdx];
    const lastSet = targetEx.sets[targetEx.sets.length - 1];
    targetEx.sets.push({
      setNumber: targetEx.sets.length + 1,
      targetReps: lastSet?.targetReps || '10-12',
      targetWeightKg: lastSet?.targetWeightKg || 20,
      restSeconds: lastSet?.restSeconds || 60,
    });
    setDays(updatedDays);
  };

  const handleRemoveSet = (dayIdx: number, exIdx: number, setIdx: number) => {
    const updatedDays = [...days];
    const targetEx = updatedDays[dayIdx].exercises[exIdx];
    if (targetEx.sets.length <= 1) return;
    targetEx.sets = targetEx.sets
      .filter((_, i) => i !== setIdx)
      .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
    setDays(updatedDays);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const routineToSave: Routine = {
      id: initialRoutine?.id || `routine-manual-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      createdAt: initialRoutine?.createdAt || new Date().toISOString(),
      isAiGenerated: false,
      daysPerWeek: days.length,
      days,
    };

    onSave(routineToSave);
  };

  const currentDay = days[activeDayIndex] || days[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl liquid-glass-elevated border border-white/20 shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              {initialRoutine ? 'Editar Rutina' : 'Crear Rutina Manual'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Nombre de la Rutina</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Push Pull Legs Fuerza..."
                className="w-full liquid-glass-subtle border border-white/10 rounded-2xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Descripción / Enfoque</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Frecuencia 2 con sobrecarga semanal..."
                className="w-full liquid-glass-subtle border border-white/10 rounded-2xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              />
            </div>
          </div>

          {/* Days Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">Días de Entrenamiento ({days.length}):</label>
              <button
                onClick={handleAddDay}
                className="flex items-center gap-1 text-xs text-white hover:text-zinc-200 font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Día</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {days.map((d, dIdx) => (
                <button
                  key={d.id}
                  onClick={() => setActiveDayIndex(dIdx)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeDayIndex === dIdx
                      ? 'bg-white text-black shadow-lg'
                      : 'liquid-glass-subtle text-zinc-400 hover:text-white border border-white/10'
                  }`}
                >
                  <span>Día {dIdx + 1}</span>
                  {days.length > 1 && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveDay(dIdx);
                      }}
                      className="hover:text-red-400 ml-1 text-zinc-500 font-mono"
                    >
                      ×
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Current Day Details */}
          {currentDay && (
            <div className="liquid-glass rounded-2xl p-4 space-y-4 border border-white/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Nombre del Día</label>
                  <input
                    type="text"
                    value={currentDay.name}
                    onChange={(e) => {
                      const updated = [...days];
                      updated[activeDayIndex].name = e.target.value;
                      setDays(updated);
                    }}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Día preferido</label>
                  <select
                    value={currentDay.dayOfWeek || 'Lunes'}
                    onChange={(e) => {
                      const updated = [...days];
                      updated[activeDayIndex].dayOfWeek = e.target.value;
                      setDays(updated);
                    }}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-200"
                  >
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((dayName) => (
                      <option key={dayName} value={dayName} className="bg-zinc-900 text-white">
                        {dayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Exercises in current day */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Ejercicios del {currentDay.name}
                  </h4>
                  <button
                    onClick={() => handleAddExercise(activeDayIndex)}
                    className="flex items-center gap-1 px-3 py-1 rounded-xl liquid-glass-subtle text-white text-xs font-bold hover:bg-white/10 border border-white/10"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir Ejercicio</span>
                  </button>
                </div>

                {currentDay.exercises.map((exercise, exIdx) => (
                  <div
                    key={exercise.id}
                    className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={exercise.name}
                          onChange={(e) => {
                            const updated = [...days];
                            updated[activeDayIndex].exercises[exIdx].name = e.target.value;
                            setDays(updated);
                          }}
                          placeholder="Nombre del ejercicio..."
                          className="liquid-glass-subtle border border-white/10 rounded-xl px-3 py-1 text-xs text-white font-bold"
                        />

                        <select
                          value={exercise.muscleGroup}
                          onChange={(e) => {
                            const updated = [...days];
                            updated[activeDayIndex].exercises[exIdx].muscleGroup = e.target.value as any;
                            setDays(updated);
                          }}
                          className="liquid-glass-subtle border border-white/10 rounded-xl px-3 py-1 text-xs text-zinc-300"
                        >
                          <option value="pecho" className="bg-zinc-900">Pecho</option>
                          <option value="espalda" className="bg-zinc-900">Espalda</option>
                          <option value="piernas" className="bg-zinc-900">Piernas</option>
                          <option value="hombros" className="bg-zinc-900">Hombros</option>
                          <option value="brazos" className="bg-zinc-900">Brazos</option>
                          <option value="core" className="bg-zinc-900">Core / Abdomen</option>
                          <option value="cardio" className="bg-zinc-900">Cardio</option>
                          <option value="cuerpo_completo" className="bg-zinc-900">Cuerpo Completo</option>
                        </select>
                      </div>

                      <button
                        onClick={() => handleRemoveExercise(activeDayIndex, exIdx)}
                        className="p-2 text-zinc-500 hover:text-white rounded-xl hover:bg-white/10"
                        title="Eliminar ejercicio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Series Rows */}
                    <div className="space-y-1.5 pt-1">
                      <div className="grid grid-cols-12 text-[10px] font-mono text-zinc-500 uppercase px-1">
                        <span className="col-span-2">Serie</span>
                        <span className="col-span-3">Reps Objetivo</span>
                        <span className="col-span-3">Peso (kg)</span>
                        <span className="col-span-3">Descanso (s)</span>
                        <span className="col-span-1"></span>
                      </div>

                      {exercise.sets.map((set, sIdx) => (
                        <div key={sIdx} className="grid grid-cols-12 items-center gap-1.5 text-xs">
                          <span className="col-span-2 font-mono font-bold text-zinc-400 text-center">
                            #{set.setNumber}
                          </span>
                          <input
                            type="text"
                            value={set.targetReps}
                            onChange={(e) => {
                              const updated = [...days];
                              updated[activeDayIndex].exercises[exIdx].sets[sIdx].targetReps = e.target.value;
                              setDays(updated);
                            }}
                            className="col-span-3 liquid-glass-subtle border border-white/10 rounded-lg px-2 py-0.5 text-center font-mono text-white"
                          />
                          <input
                            type="number"
                            step="0.5"
                            value={set.targetWeightKg}
                            onChange={(e) => {
                              const updated = [...days];
                              updated[activeDayIndex].exercises[exIdx].sets[sIdx].targetWeightKg =
                                parseFloat(e.target.value) || 0;
                              setDays(updated);
                            }}
                            className="col-span-3 liquid-glass-subtle border border-white/10 rounded-lg px-2 py-0.5 text-center font-mono text-white"
                          />
                          <input
                            type="number"
                            step="15"
                            value={set.restSeconds}
                            onChange={(e) => {
                              const updated = [...days];
                              updated[activeDayIndex].exercises[exIdx].sets[sIdx].restSeconds =
                                parseInt(e.target.value) || 60;
                              setDays(updated);
                            }}
                            className="col-span-3 liquid-glass-subtle border border-white/10 rounded-lg px-2 py-0.5 text-center font-mono text-white"
                          />
                          <button
                            onClick={() => handleRemoveSet(activeDayIndex, exIdx, sIdx)}
                            className="col-span-1 text-zinc-500 hover:text-white text-center font-mono"
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => handleAddSet(activeDayIndex, exIdx)}
                        className="text-[11px] text-white hover:text-zinc-300 font-bold pt-1 inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Añadir Serie</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-black liquid-glass-button-primary shadow-xl"
          >
            Guardar Rutina
          </button>
        </div>
      </motion.div>
    </div>
  );
};
