import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiContentWithFallback } from '@/lib/gemini-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      exerciseName,
      lastWeightKg = 60,
      lastReps = 8,
      feeling = 'adecuado',
      userGoal = 'hipertrofia',
    } = body;

    const prompt = `
Eres un preparador físico de fuerza y biomecánico experto en sobrecarga progresiva científica (progressive overload).
Analiza el rendimiento del usuario en el ejercicio "${exerciseName}" y genera la sobrecarga progresiva óptima para su próxima sesión:

DATOS DEL USUARIO:
- Ejercicio: ${exerciseName}
- Último peso utilizado: ${lastWeightKg} kg
- Repeticiones completadas: ${lastReps} reps
- Sensación subjetiva de esfuerzo (RPE / RIR): ${feeling} (facil, adecuado, casi_fallo, fallo_estancado)
- Objetivo: ${userGoal} (hipertrofia, fuerza, definicion, recomposicion)

REGLAS DE SOBRECARGA CIENTÍFICA:
1. Si fue "facil": Se recomienda aumento de carga (+2.5 kg a +5 kg según sea tren superior o inferior) manteniendo rango de reps.
2. Si fue "adecuado": Principio de doble progresión (aumentar 1 o 2 repeticiones en las series hasta alcanzar el tope del rango antes de subir kilos).
3. Si fue "casi_fallo" (RIR 1): Consolidar el peso actual mejorando el tempo de bajada (3 segundos excéntricos) o igualar reps con técnica más limpia.
4. Si fue "fallo_estancado" o no alcanzó las reps mínimas: Recomendar micro-ajuste, descarga del 10% o series cluster para romper el estancamiento.

DEVUELVE ÚNICAMENTE UN JSON CON ESTA ESTRUCTURA (sin markdown adicional):
{
  "nextWeightKg": number,
  "nextReps": "string",
  "progressionMethod": "doble_progresion" | "sobrecarga_lineal" | "densidad_tempo" | "micro_descarga",
  "recommendationTitle": "string",
  "detailedReasoning": "string",
  "techniqueFocus": "string",
  "warmupProtocol": "string"
}
`;

    const geminiResult = await generateGeminiContentWithFallback({
      contents: prompt,
      responseMimeType: 'application/json',
      temperature: 0.5,
    });

    const text = geminiResult.text;
    if (text) {
      let cleanJson = text.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      const parsed = JSON.parse(cleanJson);
      return NextResponse.json(parsed);
    }
    throw new Error('Respuesta vacía');
  } catch (error: any) {
    console.warn('Gemini Overload API fallback invoked:', error?.message);

    // Algorithmic progression fallback
    const body = await req.json().catch(() => ({}));
    const weight = Number(body?.lastWeightKg) || 60;
    const reps = Number(body?.lastReps) || 8;
    const feeling = body?.feeling || 'adecuado';

    let nextWeight = weight;
    let nextReps = '8-10';
    let method = 'doble_progresion';
    let title = 'Incrementar 1 repetición con técnica pulida';
    let reasoning = 'Aplica doble progresión: busca alcanzar 10 repeticiones sólidas con este peso antes de incrementar los kilos.';
    let technique = 'Controla la fase excéntrica en 2 a 3 segundos y evita balanceos con inercia.';

    if (feeling === 'facil') {
      nextWeight = weight + 2.5;
      nextReps = `${Math.max(6, reps - 1)}-${reps}`;
      method = 'sobrecarga_lineal';
      title = `Subir carga a ${nextWeight} kg`;
      reasoning = `Al haber completado ${reps} reps con solvencia, tu sistema neuromuscular está listo para incrementar la tensión mecánica absoluta.`;
      technique = 'Mantén la retracción escapular y parada de 1 segundo en el punto de máximo estiramiento.';
    } else if (feeling === 'fallo_estancado') {
      nextWeight = Math.max(20, Math.round(weight * 0.9 * 2) / 2);
      nextReps = '10-12';
      method = 'micro_descarga';
      title = `Descarga estratégica a ${nextWeight} kg`;
      reasoning = 'Una ligera reducción del 10% de carga permite reiniciar la curva de estímulo-recuperación y disipar fatiga articular.';
      technique = 'Prioriza la conexión mente-músculo y máxima aceleración concéntrica.';
    }

    return NextResponse.json({
      nextWeightKg: nextWeight,
      nextReps,
      progressionMethod: method,
      recommendationTitle: title,
      detailedReasoning: reasoning,
      techniqueFocus: technique,
      warmupProtocol: `${Math.round(nextWeight * 0.5)}kg x 10, ${Math.round(nextWeight * 0.75)}kg x 4`,
      isFallback: true,
    });
  }
}
