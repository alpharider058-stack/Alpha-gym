import { NextRequest, NextResponse } from 'next/server';
import { UserFitnessProfile, Routine, Plan6Months } from '@/types/gym';
import { generateGeminiContentWithFallback } from '@/lib/gemini-server';

export async function POST(req: NextRequest) {
  let profile: UserFitnessProfile;

  try {
    const body = await req.json();
    profile = body.profile;
    if (!profile) {
      return NextResponse.json({ error: 'Perfil de usuario no proporcionado' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 });
  }

  // Calculate basal and rough calories as reference for prompt & fallback
  const isMale = profile.gender === 'hombre';
  // Harris-Benedict formula
  const bmr = isMale
    ? 10 * profile.currentWeightKg + 6.25 * profile.heightCm - 5 * profile.age + 5
    : 10 * profile.currentWeightKg + 6.25 * profile.heightCm - 5 * profile.age - 161;
  
  // Activity multiplier ~ 1.45 (gym days)
  let tdee = Math.round(bmr * (1.2 + (profile.daysPerWeek * 0.08)));
  if (profile.goal === 'definicion') tdee -= 400;
  else if (profile.goal === 'hipertrofia') tdee += 300;
  else if (profile.goal === 'fuerza') tdee += 200;

  const targetCal = Math.max(1400, Math.round(tdee));
  const proteinG = Math.round(profile.currentWeightKg * (profile.goal === 'definicion' ? 2.2 : 2.0));
  const fatG = Math.round(profile.currentWeightKg * 0.8);
  const carbsG = Math.max(80, Math.round((targetCal - (proteinG * 4 + fatG * 9)) / 4));

  const prompt = `
Eres un entrenador personal de élite, preparador físico y biomecánico con más de 15 años de experiencia en hipertrofia y acondicionamiento.
Diseña un programa integral de entrenamiento para este usuario y un Plan de Transformación Física a 6 Meses ("Mi Plan"):

PERFIL DEL USUARIO:
- Género: ${profile.gender}
- Edad: ${profile.age} años
- Altura: ${profile.heightCm} cm
- Peso actual: ${profile.currentWeightKg} kg
- Peso objetivo: ${profile.targetWeightKg} kg
- Objetivo principal: ${profile.goal} (hipertrofia/definición/fuerza/recomposición/salud)
- Nivel de experiencia: ${profile.experience} (principiante/intermedio/avanzado)
- Días de entrenamiento disponibles: ${profile.daysPerWeek} días por semana.
- Días seleccionados por el usuario: ${profile.selectedDays && profile.selectedDays.length > 0 ? profile.selectedDays.join(', ') : `${profile.daysPerWeek} días`}
- Equipamiento disponible: ${profile.equipment} (gym_completo, mancuernas_banco, barra_discos, calistenia_casa)
- Duración por sesión: ${profile.sessionDurationMin} minutos
- Lesiones o limitaciones físicas: ${profile.injuriesOrLimitations || 'Ninguna'}
- Estilo o división preferida: ${profile.preferredSplit}

REQUISITOS DEL PROGRAMA:
1. "routine": Debe contener exactamente ${profile.daysPerWeek} días de entrenamiento, asignando cada uno a los días seleccionados (${profile.selectedDays?.join(', ') || 'Día 1, Día 2, etc.'}).
   - Cada día debe tener entre 4 y 6 ejercicios efectivos adaptados al equipamiento y limitaciones.
   - Cada ejercicio debe incluir: id único, nombre en español, muscleGroup ('pecho'|'espalda'|'piernas'|'hombros'|'brazos'|'core'|'cardio'|'cuerpo_completo'), array de 3-4 series con targetReps (ej: "8-10", "10-12"), targetWeightKg sugerido realista para su peso, restSeconds (60, 90, 120), y notas biomecánicas claras.
2. "plan6Months": Un plan estratégico de 6 meses completo para lograr la transformación física con:
   - overviewSummary: Resumen motivador y científico de la estrategia de 6 meses.
   - 6 meses detallados (month 1 a 6) agrupados en 3 fases progresivas (Mes 1-2 Fase 1, Mes 3-4 Fase 2, Mes 5-6 Fase 3).
   - Para cada mes:
     - month: número (1 a 6)
     - title: título del mes (ej: "Mes 1: Adaptación Anatómica y Reclutamiento")
     - phaseName: nombre de la fase
     - focus: enfoque principal del mes
     - calorieTarget: calorías diarias recomendadas (ej: ${targetCal})
     - proteinGrams: gramos de proteína recomendados (ej: ${proteinG})
     - carbsGrams: gramos de carbohidratos (ej: ${carbsG})
     - fatGrams: gramos de grasas (ej: ${fatG})
     - cardioProtocol: pauta de pasos diarios y cardio (ej: "8.500 pasos diarios + 2 sesiones LISS 20 min")
     - expectedWeightKg: peso estimado objetivo al final de ese mes
     - strengthMilestone: hito de fuerza o técnica a lograr
     - deloadWeek: semana de descarga recomendada (ej: 4, 8, 12, etc.)
     - trainingGuidelines: array de 3-4 consejos técnicos clave para ese mes
     - milestones: array de 4 hitos concretos (semanas 1, 2, 3, 4 del mes) con week, title, description, isCompleted: false.

DEVUELVE ÚNICAMENTE UN OBJETO JSON VÁLIDO CON LA SIGUIENTE ESTRUCTURA EXACTA (sin markdown adicional):
{
  "routine": {
    "title": "string",
    "description": "string",
    "daysPerWeek": number,
    "days": [
      {
        "id": "string",
        "name": "string",
        "dayOfWeek": "string",
        "targetMuscles": ["string"],
        "estimatedDurationMin": number,
        "exercises": [
          {
            "id": "string",
            "name": "string",
            "muscleGroup": "pecho" | "espalda" | "piernas" | "hombros" | "brazos" | "core" | "cardio" | "cuerpo_completo",
            "notes": "string",
            "sets": [
              {
                "setNumber": number,
                "targetReps": "string",
                "targetWeightKg": number,
                "restSeconds": number
              }
            ]
          }
        ]
      }
    ]
  },
  "plan6Months": {
    "overviewSummary": "string",
    "months": [
      {
        "month": number,
        "title": "string",
        "phaseName": "string",
        "focus": "string",
        "calorieTarget": number,
        "proteinGrams": number,
        "carbsGrams": number,
        "fatGrams": number,
        "cardioProtocol": "string",
        "expectedWeightKg": number,
        "strengthMilestone": "string",
        "deloadWeek": number,
        "trainingGuidelines": ["string"],
        "milestones": [
          {
            "week": number,
            "title": "string",
            "description": "string",
            "isCompleted": false
          }
        ]
      }
    ]
  }
}
`;

  try {
    const geminiResult = await generateGeminiContentWithFallback({
      contents: prompt,
      responseMimeType: 'application/json',
      temperature: 0.65,
    });

    const text = geminiResult.text;
    if (!text) {
      throw new Error('Respuesta vacía de Gemini');
    }

    let cleanJson = text.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanJson);

    // Build complete typed objects
    const routineId = `routine-ai-${Date.now()}`;
    const generatedRoutine: Routine = {
      id: routineId,
      title: parsed.routine.title || `Rutina Personalizada IA (${profile.daysPerWeek} Días)`,
      description: parsed.routine.description || `Diseñada para ${profile.goal} con ${profile.daysPerWeek} días de entrenamiento por semana.`,
      createdAt: new Date().toISOString(),
      isAiGenerated: true,
      daysPerWeek: profile.daysPerWeek,
      days: parsed.routine.days.map((d: any, idx: number) => ({
        id: `day-${idx + 1}-${Date.now()}`,
        name: d.name,
        dayOfWeek: d.dayOfWeek || profile.selectedDays[idx] || `Día ${idx + 1}`,
        targetMuscles: d.targetMuscles || [],
        estimatedDurationMin: d.estimatedDurationMin || profile.sessionDurationMin || 60,
        exercises: (d.exercises || []).map((ex: any, exIdx: number) => ({
          id: `ex-${idx}-${exIdx}-${Date.now()}`,
          name: ex.name,
          muscleGroup: ex.muscleGroup || 'cuerpo_completo',
          notes: ex.notes || '',
          sets: (ex.sets || []).map((s: any, sIdx: number) => ({
            setNumber: s.setNumber || sIdx + 1,
            targetReps: s.targetReps || '8-10',
            targetWeightKg: Number(s.targetWeightKg) || 20,
            restSeconds: Number(s.restSeconds) || 90,
          })),
        })),
      })),
      userProfile: profile,
    };

    const generatedPlan: Plan6Months = {
      id: `plan-6m-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      profileSnapshot: profile,
      overviewSummary: parsed.plan6Months.overviewSummary || `Plan de transformación física a 6 meses enfocado en ${profile.goal}.`,
      months: parsed.plan6Months.months.map((m: any) => ({
        month: m.month,
        title: m.title,
        phaseName: m.phaseName,
        focus: m.focus,
        calorieTarget: m.calorieTarget || targetCal,
        proteinGrams: m.proteinGrams || proteinG,
        carbsGrams: m.carbsGrams || carbsG,
        fatGrams: m.fatGrams || fatG,
        cardioProtocol: m.cardioProtocol || '8.500 pasos diarios',
        expectedWeightKg: m.expectedWeightKg || profile.targetWeightKg,
        strengthMilestone: m.strengthMilestone || 'Progreso de sobrecarga constante',
        deloadWeek: m.deloadWeek || 4,
        trainingGuidelines: m.trainingGuidelines || [],
        milestones: (m.milestones || []).map((ms: any) => ({
          week: ms.week,
          title: ms.title,
          description: ms.description,
          isCompleted: false,
        })),
      })),
    };

    return NextResponse.json({
      routine: generatedRoutine,
      plan6Months: generatedPlan,
    });
  } catch (error: any) {
    console.warn('Gemini API call encountered error, using high-fidelity fallback generator:', error?.message);

    // Construct high-fidelity algorithmic fallback tailored to exact user choices
    const fallbackDays = generateFallbackRoutineDays(profile);
    const fallbackPlanMonths = generateFallbackPlanMonths(profile, targetCal, proteinG, carbsG, fatG);

    const fallbackRoutine: Routine = {
      id: `routine-ai-${Date.now()}`,
      title: `Plan Coach IA: ${getGoalName(profile.goal)} (${profile.daysPerWeek} Días)`,
      description: `Plan adaptado a tu objetivo de ${getGoalName(profile.goal)} para ${profile.daysPerWeek} días semanales (${profile.selectedDays.join(', ')}).`,
      createdAt: new Date().toISOString(),
      isAiGenerated: true,
      daysPerWeek: profile.daysPerWeek,
      days: fallbackDays,
      userProfile: profile,
    };

    const fallbackPlan: Plan6Months = {
      id: `plan-6m-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      profileSnapshot: profile,
      overviewSummary: `Plan de transformación de 6 meses diseñado para llevarte de ${profile.currentWeightKg} kg a tu objetivo de ${profile.targetWeightKg} kg optimizando ${getGoalName(profile.goal)} con ${profile.daysPerWeek} días de entrenamiento por semana.`,
      months: fallbackPlanMonths,
    };

    return NextResponse.json({
      routine: fallbackRoutine,
      plan6Months: fallbackPlan,
      isFallback: true,
    });
  }
}

function getGoalName(goal: string): string {
  switch (goal) {
    case 'hipertrofia':
      return 'Ganancia Muscular & Hipertrofia';
    case 'definicion':
      return 'Definición & Pérdida de Grasa';
    case 'fuerza':
      return 'Fuerza Máxima & Powerlifting';
    case 'recomposicion':
      return 'Recomposición Corporal';
    default:
      return 'Salud & Acondicionamiento Físico';
  }
}

function generateFallbackRoutineDays(profile: UserFitnessProfile) {
  const selectedDays = profile.selectedDays.length > 0 ? profile.selectedDays : ['Lunes', 'Miércoles', 'Viernes'];
  const count = profile.daysPerWeek;

  const templates: { [key: number]: { name: string; muscles: string[]; exercises: any[] }[] } = {
    2: [
      {
        name: 'Día A: Torso y Empuje Completo',
        muscles: ['Pecho', 'Espalda', 'Hombros', 'Brazos'],
        exercises: [
          { name: 'Press de Banca Plano', muscle: 'pecho', sets: 4, reps: '8-10', weight: 60, rest: 90, notes: 'Retracción escapular firme y recorrido completo' },
          { name: 'Jalón al Pecho Agarre Neutro', muscle: 'espalda', sets: 4, reps: '10-12', weight: 55, rest: 75, notes: 'Controlar la bajada y apretar dorsales' },
          { name: 'Press Militar con Mancuernas', muscle: 'hombros', sets: 3, reps: '10-12', weight: 16, rest: 90, notes: 'Subir sin bloquear codos violentamente' },
          { name: 'Remo en Polea Baja', muscle: 'espalda', sets: 3, reps: '10-12', weight: 50, rest: 75, notes: 'Llevar el tirón al ombligo' },
          { name: 'Curl de Bíceps con Barra Z', muscle: 'brazos', sets: 3, reps: '12-15', weight: 25, rest: 60, notes: 'Codos pegados al costado' },
          { name: 'Extensiones de Tríceps Polea', muscle: 'brazos', sets: 3, reps: '12-15', weight: 22.5, rest: 60, notes: 'Apertura al final de la extensión' },
        ],
      },
      {
        name: 'Día B: Pierna y Core Global',
        muscles: ['Cuádriceps', 'Isquiotibiales', 'Glúteos', 'Abdomen'],
        exercises: [
          { name: 'Sentadilla Trasera con Barra', muscle: 'piernas', sets: 4, reps: '8-10', weight: 70, rest: 120, notes: 'Profundidad paralela y respiración diafragmática' },
          { name: 'Peso Muerto Rumano con Mancuernas', muscle: 'piernas', sets: 4, reps: '10-12', weight: 24, rest: 90, notes: 'Empujar cadera atrás y sentir isquios' },
          { name: 'Prensa Inclinada 45°', muscle: 'piernas', sets: 3, reps: '12-15', weight: 140, rest: 90, notes: 'Sin despegar la zona lumbar del respaldo' },
          { name: 'Curl Femoral Tumbado o Sentado', muscle: 'piernas', sets: 3, reps: '12-15', weight: 45, rest: 75, notes: 'Pausa de 1 segundo en contracción' },
          { name: 'Elevación de Talones en Máquina', muscle: 'piernas', sets: 4, reps: '15-20', weight: 50, rest: 45, notes: 'Estiramiento profundo de gemelos' },
          { name: 'Plancha Abdominal Activa', muscle: 'core', sets: 3, reps: '45-60s', weight: 0, rest: 60, notes: 'Retroversión pélvica y máxima tensión' },
        ],
      },
    ],
    3: [
      {
        name: 'Día 1: Empuje (Pecho, Hombro, Tríceps)',
        muscles: ['Pecho', 'Hombro', 'Tríceps'],
        exercises: [
          { name: 'Press de Banca con Barra', muscle: 'pecho', sets: 4, reps: '8-10', weight: 65, rest: 90, notes: 'Parada de 1s en pectoral' },
          { name: 'Press Inclinado con Mancuernas', muscle: 'pecho', sets: 3, reps: '10-12', weight: 22, rest: 75, notes: 'Inclinación a 30 grados' },
          { name: 'Press Militar de Pie', muscle: 'hombros', sets: 3, reps: '8-10', weight: 40, rest: 90, notes: 'Glúteos apretados' },
          { name: 'Elevaciones Laterales con Mancuerna', muscle: 'hombros', sets: 4, reps: '12-15', weight: 10, rest: 60, notes: 'Subir en plano escapular' },
          { name: 'Fondos en Paralelas o Máquina', muscle: 'tríceps', sets: 3, reps: '10-12', weight: 0, rest: 75, notes: 'Cuerpo ligeramente inclinado' },
          { name: 'Extensiones de Tríceps en Polea', muscle: 'tríceps', sets: 3, reps: '12-15', weight: 22, rest: 60, notes: 'Cuerda abierta al final' },
        ],
      },
      {
        name: 'Día 2: Tirón (Espalda, Deltoides Post, Bíceps)',
        muscles: ['Espalda', 'Trapecio', 'Bíceps'],
        exercises: [
          { name: 'Peso Muerto Convencional', muscle: 'espalda', sets: 3, reps: '6-8', weight: 100, rest: 120, notes: 'Barra pegada al cuerpo' },
          { name: 'Dominadas o Jalón al Pecho', muscle: 'espalda', sets: 4, reps: '8-10', weight: 60, rest: 90, notes: 'Depresión escapular antes de tirar' },
          { name: 'Remo Gironda en Polea Baja', muscle: 'espalda', sets: 3, reps: '10-12', weight: 55, rest: 75, notes: 'Tirón firme a la parte baja del abdomen' },
          { name: 'Pájaros con Mancuerna o Facepull', muscle: 'hombros', sets: 3, reps: '15', weight: 8, rest: 60, notes: 'Rotación externa al final' },
          { name: 'Curl de Bíceps en Banco Inclinado', muscle: 'brazos', sets: 3, reps: '10-12', weight: 12, rest: 60, notes: 'Estiramiento máximo' },
          { name: 'Curl Martillo con Mancuernas', muscle: 'brazos', sets: 3, reps: '10-12', weight: 14, rest: 60, notes: 'Braquial y antebrazo' },
        ],
      },
      {
        name: 'Día 3: Pierna y Abdomen',
        muscles: ['Cuádriceps', 'Isquiotibiales', 'Glúteos', 'Gemelos'],
        exercises: [
          { name: 'Sentadilla Libre con Barra', muscle: 'piernas', sets: 4, reps: '8-10', weight: 80, rest: 120, notes: 'Empujar el suelo con toda la planta' },
          { name: 'Prensa Inclinada 45°', muscle: 'piernas', sets: 3, reps: '10-12', weight: 160, rest: 90, notes: 'Control de la bajada' },
          { name: 'Peso Muerto Rumano', muscle: 'piernas', sets: 3, reps: '10-12', weight: 26, rest: 90, notes: 'Bisagra de cadera limpia' },
          { name: 'Extensiones de Cuádriceps', muscle: 'piernas', sets: 3, reps: '12-15', weight: 50, rest: 60, notes: '1 segundo de contracción arriba' },
          { name: 'Elevación de Gemelos de Pie', muscle: 'piernas', sets: 4, reps: '15-20', weight: 50, rest: 45, notes: 'Pausa en estiramiento' },
          { name: 'Elevación de Piernas Colgado', muscle: 'core', sets: 3, reps: '12-15', weight: 0, rest: 60, notes: 'Evitar balanceos con inercia' },
        ],
      },
    ],
    4: [
      {
        name: 'Día 1: Torso Fuerza & Cargas',
        muscles: ['Pecho', 'Espalda', 'Hombros'],
        exercises: [
          { name: 'Press de Banca Plano', muscle: 'pecho', sets: 4, reps: '6-8', weight: 70, rest: 120, notes: 'Prioridad de fuerza' },
          { name: 'Remo con Barra 45°', muscle: 'espalda', sets: 4, reps: '8-10', weight: 60, rest: 90, notes: 'Espalda neutra' },
          { name: 'Press Militar con Mancuernas', muscle: 'hombros', sets: 3, reps: '8-10', weight: 20, rest: 90, notes: 'Empuje vertical estricto' },
          { name: 'Jalón al Pecho Neutro', muscle: 'espalda', sets: 3, reps: '10-12', weight: 60, rest: 75, notes: 'Codos abajo y atrás' },
          { name: 'Fondos para Pecho/Tríceps', muscle: 'pecho', sets: 3, reps: '10-12', weight: 0, rest: 75, notes: 'Control excéntrico' },
        ],
      },
      {
        name: 'Día 2: Pierna Fuerza & Cuádriceps',
        muscles: ['Cuádriceps', 'Glúteos', 'Gemelos'],
        exercises: [
          { name: 'Sentadilla Trasera con Barra', muscle: 'piernas', sets: 4, reps: '6-8', weight: 85, rest: 120, notes: 'Profundidad limpia' },
          { name: 'Prensa 45° con Pies Bajos', muscle: 'piernas', sets: 3, reps: '10-12', weight: 170, rest: 90, notes: 'Énfasis en vasto externo' },
          { name: 'Zancadas Búlgaras con Mancuernas', muscle: 'piernas', sets: 3, reps: '10-12', weight: 16, rest: 75, notes: 'Torso ligeramente inclinado' },
          { name: 'Gemelos en Máquina Sóleo', muscle: 'piernas', sets: 4, reps: '15-20', weight: 45, rest: 45, notes: 'Pausa isométrica' },
          { name: 'Rueda Abdominal (Ab Wheel)', muscle: 'core', sets: 3, reps: '10-12', weight: 0, rest: 60, notes: 'Foco en la pelvis' },
        ],
      },
      {
        name: 'Día 3: Torso Hipertrofia & Brazos',
        muscles: ['Pecho', 'Espalda', 'Bíceps', 'Tríceps'],
        exercises: [
          { name: 'Press Inclinado Mancuernas 30°', muscle: 'pecho', sets: 4, reps: '10-12', weight: 24, rest: 75, notes: 'Apertura controlada' },
          { name: 'Remo en Banco con Mancuernas', muscle: 'espalda', sets: 4, reps: '10-12', weight: 26, rest: 75, notes: 'Apoyo en pecho' },
          { name: 'Aperturas en Polea (Crossover)', muscle: 'pecho', sets: 3, reps: '12-15', weight: 12.5, rest: 60, notes: 'Pausa en contracción' },
          { name: 'Elevaciones Laterales en Polea', muscle: 'hombros', sets: 4, reps: '12-15', weight: 8, rest: 60, notes: 'Tensión constante' },
          { name: 'Curl Bíceps Banco Inclinado', muscle: 'brazos', sets: 3, reps: '10-12', weight: 12, rest: 60, notes: 'Estiramiento profundo' },
          { name: 'Press Francés con Barra Z', muscle: 'brazos', sets: 3, reps: '10-12', weight: 25, rest: 60, notes: 'Bajar a la frente o detrás' },
        ],
      },
      {
        name: 'Día 4: Pierna Cadena Posterior & Core',
        muscles: ['Isquiotibiales', 'Glúteos', 'Espalda Baja'],
        exercises: [
          { name: 'Peso Muerto Rumano con Barra', muscle: 'piernas', sets: 4, reps: '8-10', weight: 80, rest: 120, notes: 'Tensión máxima en isquios' },
          { name: 'Hip Thrust con Barra / Máquina', muscle: 'piernas', sets: 4, reps: '10-12', weight: 90, rest: 90, notes: 'Bloqueo arriba de 2s' },
          { name: 'Curl Femoral Tumbado', muscle: 'piernas', sets: 3, reps: '10-12', weight: 45, rest: 60, notes: 'Sin arquear la espalda' },
          { name: 'Extensiones de Cuádriceps', muscle: 'piernas', sets: 3, reps: '15', weight: 45, rest: 60, notes: 'Bombeo metabólico' },
          { name: 'Elevación de Gemelos de Pie', muscle: 'piernas', sets: 4, reps: '15-20', weight: 55, rest: 45, notes: 'Fuerza elástica' },
          { name: 'Pallof Press en Polea', muscle: 'core', sets: 3, reps: '12/lado', weight: 15, rest: 45, notes: 'Anti-rotación del core' },
        ],
      },
    ],
  };

  const pool = templates[count] || templates[4] || templates[3];

  return pool.slice(0, count).map((item, idx) => ({
    id: `day-${idx + 1}-${Date.now()}`,
    name: item.name,
    dayOfWeek: selectedDays[idx] || `Día ${idx + 1}`,
    targetMuscles: item.muscles,
    estimatedDurationMin: profile.sessionDurationMin || 60,
    exercises: item.exercises.map((ex, exIdx) => ({
      id: `ex-${idx}-${exIdx}-${Date.now()}`,
      name: ex.name,
      muscleGroup: ex.muscle,
      notes: ex.notes,
      sets: Array.from({ length: ex.sets }).map((_, sIdx) => ({
        setNumber: sIdx + 1,
        targetReps: ex.reps,
        targetWeightKg: ex.weight,
        restSeconds: ex.rest,
      })),
    })),
  }));
}

function generateFallbackPlanMonths(
  profile: UserFitnessProfile,
  calories: number,
  protein: number,
  carbs: number,
  fat: number
) {
  const weightDiff = profile.targetWeightKg - profile.currentWeightKg;
  const monthlyStep = weightDiff / 6;

  const phaseNames = [
    'Fase 1: Cimientos y Adaptación',
    'Fase 1: Cimientos y Adaptación',
    'Fase 2: Intensidad y Sobrecarga Progresiva',
    'Fase 2: Intensidad y Sobrecarga Progresiva',
    'Fase 3: Picos de Rendimiento y Definición',
    'Fase 3: Picos de Rendimiento y Definición',
  ];

  const monthFocuses = [
    'Adaptación neuromuscular, perfeccionamiento de la técnica biomecánica y ajuste calórico inicial.',
    'Aumento del volumen efectivo semanal de entrenamiento e incremento de fuerza de base.',
    'Intensificación de cargas en los levantamientos clave y aceleración metabólica.',
    'Máxima sobrecarga progresiva y densidad de entrenamiento para remodelación corporal.',
    'Refinamiento estético, detalle muscular y consolidación de marcas personales.',
    'Puesta a punto final de la transformación física de 6 meses y consolidación del nuevo peso.',
  ];

  return Array.from({ length: 6 }).map((_, idx) => {
    const monthNum = idx + 1;
    const estWeight = Number((profile.currentWeightKg + monthlyStep * monthNum).toFixed(1));
    const calAdj = profile.goal === 'definicion' ? calories - idx * 50 : calories + idx * 40;

    return {
      month: monthNum,
      title: `Mes ${monthNum}: ${monthFocuses[idx].split(',')[0]}`,
      phaseName: phaseNames[idx],
      focus: monthFocuses[idx],
      calorieTarget: Math.round(calAdj),
      proteinGrams: protein,
      carbsGrams: carbs,
      fatGrams: fat,
      cardioProtocol: `${8000 + idx * 500} pasos diarios + ${1 + Math.floor(idx / 2)} sesiones de cardio`,
      expectedWeightKg: estWeight,
      strengthMilestone: `Superar marcas del mes anterior en al menos un 3-5% en los ejercicios básicos`,
      deloadWeek: monthNum * 4,
      trainingGuidelines: [
        'Mantener un registro estricto de cada serie realizada en la app.',
        'Priorizar calidad de repetición y tempo controlado (2s de bajada excéntrica).',
        'Dormir un mínimo de 7 a 8 horas diarias para maximizar síntesis proteica.',
      ],
      milestones: [
        { week: (monthNum - 1) * 4 + 1, title: `Ajuste Semana ${(monthNum - 1) * 4 + 1}`, description: 'Calibración de pesos para las repeticiones indicadas', isCompleted: false },
        { week: (monthNum - 1) * 4 + 2, title: `Consistencia ${(monthNum - 1) * 4 + 2}`, description: 'Cumplir todos los días de entrenamiento planificados', isCompleted: false },
        { week: (monthNum - 1) * 4 + 3, title: `Sobrecarga ${(monthNum - 1) * 4 + 3}`, description: 'Añadir 1 repetición o 1-2kg en los ejercicios principales', isCompleted: false },
        { week: (monthNum - 1) * 4 + 4, title: `Descarga / Test ${(monthNum - 1) * 4 + 4}`, description: 'Semana de descarga activa o test de progreso', isCompleted: false },
      ],
    };
  });
}
