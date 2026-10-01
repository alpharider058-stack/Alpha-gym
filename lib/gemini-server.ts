import { GoogleGenAI } from '@google/genai';

// Initialize the GoogleGenAI SDK with process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Candidate models prioritized for speed, quota availability, and high-demand resilience
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

export interface GeminiCallParams {
  contents: any;
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
}

export interface GeminiCallResult {
  text: string;
  modelUsed: string;
}

/**
 * Executes a Gemini prompt with automatic fallback across high-performing models
 * to ensure 100% genuine AI responses without 503/high-demand failures.
 */
export async function generateGeminiContentWithFallback(
  params: GeminiCallParams
): Promise<GeminiCallResult> {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const config: any = {};
      if (params.systemInstruction) {
        config.systemInstruction = params.systemInstruction;
      }
      if (params.responseMimeType) {
        config.responseMimeType = params.responseMimeType;
      }
      if (params.temperature !== undefined) {
        config.temperature = params.temperature;
      }

      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const text = response.text;
      if (text && text.trim().length > 0) {
        return {
          text: text.trim(),
          modelUsed: model,
        };
      }
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Model "${model}" failed:`, err?.message || err);
      lastError = err;
      // Continue to next candidate model
    }
  }

  throw lastError || new Error('Todos los modelos de Gemini fallaron en responder');
}
