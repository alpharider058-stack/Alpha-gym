import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { Routine, Plan6Months, UserFitnessProfile, WorkoutSessionLog } from '@/types/gym';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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
Eres "Coach IA", el entrenador personal de élite, preparador físico y biomecánico de la app de gimnasio IronPulse.
Tu misión es guiar, asesorar y responder cualquier pregunta del usuario sobre el gimnasio, su rutina actual, su plan de 6 meses, técnica de levantamiento, agujetas, suplementación, nutrición o dudas en directo mientras entrena.

CONTEXTO REAL DEL USUARIO:
${contextSummary}

DIRECTRICES DE RESPUESTA:
1. Habla en español, en tono cercano, motivador, empático pero con base científica rigurosa (biomecánica, hipertrofia, tensión mecánica, recuperación del SNC).
2. Como eres su entrenador personal y CONOCES su rutina y plan exactos, haz referencias directas a sus ejercicios, sus días elegidos o sus objetivos cuando sea relevante.
3. Si pregunta sobre qué hacer si una máquina o banco está ocupado, dale sustitutos biomecánicos equivalentes y prácticos.
4. Si pregunta sobre molestias o dolor, dale pautas de ajuste técnico (ángulo de codo, agarre, rango de recorrido) y recuerda no forzar dolor articular.
5. Si pregunta sobre comidas o nutrición, usa sus números del plan (calorías y macros de proteína).
6. Sé conciso y directo: usa viñetas claras y negritas para que sea muy fácil y rápido de leer en el móvil en el gimnasio.
7. Devuelve tu respuesta en formato JSON con la siguiente estructura exacta:
{
  "reply": "Texto de tu respuesta en formato Markdown con negritas y listas limpias",
  "suggestedFollowUps": [
    "Pregunta de seguimiento corta y relevante 1",
    "Pregunta de seguimiento corta y relevante 2",
    "Pregunta de seguimiento corta y relevante 3"
  ]
}
`;

    // Format chat history for context
    const formattedHistory = conversationHistory
      .slice(-6)
      .map((msg) => `${msg.role === 'user' ? 'USUARIO' : 'COACH IA'}: ${msg.text}`)
      .join('\n\n');

    const prompt = `
HISTORIAL RECIENTE DE LA CONVERSACIÓN:
${formattedHistory || '(Sin mensajes previos)'}

NUEVA PREGUNTA DEL USUARIO:
"${message}"

Genera la respuesta del Coach IA en el formato JSON indicado:
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    });

    const responseText = response.text;
    if (responseText) {
      const parsed = JSON.parse(responseText);
      return NextResponse.json(parsed);
    }

    throw new Error('Respuesta vacía de Gemini');
  } catch (error: any) {
    console.warn('Coach IA fallback invoked:', error?.message);

    // Contextual fallback response
    return NextResponse.json({
      reply: `¡Aquí está tu Coach! Sobre tu consulta: 

- **Técnica y Estímulo:** Asegúrate de controlar la fase excéntrica (bajada en 2-3 segundos) para maximizar la tensión mecánica sin fatigar articulaciones.
- **Enfoque en tu Rutina:** Respeta los descansos programados de 90 a 120 segundos en series pesadas para permitir la resíntesis de fosfocreatina.
- **Recuperación:** La hidratación intra-entreno y el aporte de proteína post-sesión son clave para activar la vía mTOR.

¿Quieres que adaptemos algún ejercicio específico de tu rutina de hoy?`,
      suggestedFollowUps: [
        '¿Cómo caliento para mi primer ejercicio pesado?',
        '¿Qué sustituto puedo hacer si la máquina está ocupada?',
        '¿Cuánto descanso entre series debo tomar?',
      ],
      isFallback: true,
    });
  }
}
