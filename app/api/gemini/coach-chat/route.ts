import { NextRequest, NextResponse } from 'next/server';
import { Routine, Plan6Months, UserFitnessProfile, WorkoutSessionLog } from '@/types/gym';
import { generateGeminiContentWithFallback } from '@/lib/gemini-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      conversationHistory = [],
      activeRoutine,
      activePlan,
      userProfile,
      recentLogs = [],
    }: {
      message: string;
      conversationHistory?: Array<{ role: 'user' | 'model'; text: string }>;
      activeRoutine?: Routine | null;
      activePlan?: Plan6Months | null;
      userProfile?: UserFitnessProfile | null;
      recentLogs?: WorkoutSessionLog[];
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'El mensaje es requerido' },
        { status: 400 }
      );
    }

    // Build context about the user's routine, plan, and performance
    let contextSummary = 'INFORMACIÓN DEL USUARIO Y SU PROGRAMACIÓN:';

    const profile = userProfile || activePlan?.profileSnapshot || activeRoutine?.userProfile;
    if (profile) {
      contextSummary += `\n- Sexo: ${profile.gender}, Edad: ${profile.age} años, Altura: ${profile.heightCm} cm, Peso Actual: ${profile.currentWeightKg} kg, Peso Objetivo: ${profile.targetWeightKg} kg`;
      contextSummary += `\n- Nivel: ${profile.experience}, Objetivo: ${profile.goal}`;
      contextSummary += `\n- Frecuencia: ${profile.daysPerWeek} días/semana (Días seleccionados: ${profile.selectedDays?.join(', ') || 'N/A'})`;
      contextSummary += `\n- Equipamiento: ${profile.equipment}, Duración por sesión: ${profile.sessionDurationMin} min`;
      contextSummary += `\n- Lesiones o limitaciones: ${profile.injuriesOrLimitations || 'Ninguna'}`;
    }

    if (activeRoutine) {
      contextSummary += `\n\nRUTINA ACTIVA DEL USUARIO ("${activeRoutine.title}"):`;
      contextSummary += `\n- Descripción: ${activeRoutine.description}`;
      contextSummary += `\n- Días estructurados (${activeRoutine.days.length} días):`;
      activeRoutine.days.forEach((day, dIdx) => {
        const exerciseList = day.exercises
          .map((e) => `${e.name} (${e.sets.length} series)`)
          .join(', ');
        contextSummary += `\n  * ${day.name} [${day.dayOfWeek || `Día ${dIdx + 1}`}]: ${exerciseList}`;
      });
    }

    if (activePlan) {
      contextSummary += `\n\nPLAN DE TRANSFORMACIÓN 6 MESES:`;
      contextSummary += `\n- Resumen general: ${activePlan.overviewSummary}`;
      const m1 = activePlan.months[0];
      if (m1) {
        contextSummary += `\n- Mes actual / Fase 1 (${m1.phaseName}): Meta calorías ${m1.calorieTarget} kcal, ${m1.proteinGrams}g proteína, ${m1.carbsGrams}g carbohidratos, ${m1.fatGrams}g grasas. Cardio: ${m1.cardioProtocol}. Hito: ${m1.strengthMilestone}`;
      }
    }

    if (recentLogs && recentLogs.length > 0) {
      contextSummary += `\n\nÚLTIMAS SESIONES REGISTRADAS:`;
      recentLogs.slice(0, 3).forEach((log) => {
        contextSummary += `\n- ${log.dayName}: ${log.totalVolumeKg} kg levantados en ${log.durationMinutes} min.`;
      });
    }

    const systemInstruction = `
Eres "Coach IA", el entrenador personal de élite, preparador físico y biomecánico oficial de la app IronPulse.
Tu objetivo fundamental es escuchar al usuario y RESPONDER DIRECTA Y ESPECÍFICAMENTE A LO QUE TE PIDE O PREGUNTA, actuando como un auténtico entrenador personal de gimnasio de primer nivel.

CONTEXTO ACTUAL DEL USUARIO:
${contextSummary}

DIRECTRICES DE RESPUESTA OBLIGATORIAS:
1. RESPONDE EXACTAMENTE A LA DUDA O PETICIÓN: Si el usuario te pregunta por un ejercicio, habla de ese ejercicio; si pregunta por nutrición, responde sobre nutrición; si tiene dolor o molestia, dale la biomecánica y sustitutos exactos; si pide modificar su rutina, dale la solución concreta.
2. NUNCA des respuestas genéricas ni uses un esquema repetitivo. Habla con naturalidad, pasión por el entrenamiento, empatía y base científica rigurosa.
3. Si el usuario te pide cambiar, sustituir, agregar o retirar un ejercicio de su rutina (ej: "cambia las sentadillas por prensa", "añade bíceps al día de tirón"), explícale el porqué biomecánico y proporciona la modificación exacta en el campo "routineUpdate".
4. Si el usuario te pregunta sobre máquinas ocupadas, ofrece 2 o 3 sustitutos biomecánicos equivalentes y prácticos que trabajen el mismo patrón motor.
5. Devuelve siempre un objeto JSON válido con la siguiente estructura:
{
  "reply": "Tu respuesta detallada, motivadora y directa en formato Markdown (puedes usar negritas, listas y consejos)",
  "suggestedFollowUps": [
    "Pregunta de seguimiento relevante 1",
    "Pregunta de seguimiento relevante 2",
    "Pregunta de seguimiento relevante 3"
  ],
  "routineUpdate": null | {
    "action": "replace_exercise" | "add_exercise" | "remove_exercise",
    "targetDayIndex": number,
    "exerciseName": "nombre del ejercicio a cambiar o eliminar",
    "newExercise": {
      "name": "Nombre del nuevo ejercicio",
      "muscleGroup": "pecho" | "espalda" | "piernas" | "hombros" | "brazos" | "core",
      "notes": "indicación técnica biomecánica breve",
      "sets": 3,
      "reps": "8-10"
    },
    "confirmationMessage": "Mensaje corto confirmando el cambio realizado en la rutina"
  }
}
`;

    // Filter conversation history to exclude the current message to prevent echoes
    const previousHistory = conversationHistory
      .filter((m, idx) => !(idx === conversationHistory.length - 1 && m.role === 'user' && m.text.trim() === message.trim()))
      .slice(-6)
      .map((msg) => `${msg.role === 'user' ? 'USUARIO' : 'COACH IA'}: ${msg.text}`)
      .join('\n\n');

    const prompt = `
HISTORIAL DE CHARLA PREVIA:
${previousHistory || '(Inicio de conversación)'}

PREGUNTA O PETICIÓN DEL USUARIO:
"${message}"

Responde como su Coach IA de forma personalizada y directa a lo que te pide:
`;

    const geminiResult = await generateGeminiContentWithFallback({
      contents: prompt,
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.7,
    });

    const responseText = geminiResult.text;
    if (responseText) {
      let cleanJson = responseText.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      const parsed = JSON.parse(cleanJson);
      return NextResponse.json({
        ...parsed,
        modelUsed: geminiResult.modelUsed,
      });
    }

    throw new Error('Respuesta vacía de Gemini');
  } catch (error: any) {
    console.warn('Coach IA error caught:', error?.message);

    // Provide a real, relevant response instead of generic canned bullets
    return NextResponse.json({
      reply: `Como tu Coach IA, he recibido tu consulta sobre lo que me pides. Tuve una micro-intermitencia al conectar con la red, pero cuéntame: ¿prefieres que ajustemos los ejercicios de tu rutina actual o necesitas una indicación biomecánica sobre un ejercicio específico? Escríbemelo de nuevo o pulsa en reintentar.`,
      suggestedFollowUps: [
        '¿Cómo caliento para mi rutina?',
        '¿Qué sustituto hago si una máquina está ocupada?',
        '¿Cómo sé cuándo subir de peso?',
      ],
      isFallback: true,
    });
  }
}
