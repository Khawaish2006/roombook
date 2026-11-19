// Thin wrapper around the Gemini REST API. Every AI feature goes through here.
// It enforces a timeout and turns every failure into an AIUnavailableError, so callers
// only need one catch block to fall back to the non-AI path.
import { CONFIG } from '../config';

export class AIUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIUnavailableError';
    Object.setPrototypeOf(this, AIUnavailableError.prototype);
  }
}

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export function isAIConfigured(): boolean {
  return !!API_KEY && API_KEY.length > 10;
}

interface GeminiOptions {
  /** Ask Gemini to answer with JSON only. */
  json?: boolean;
  temperature?: number;
}

/** Sends one prompt, returns the text of the first candidate. */
export async function askGemini(prompt: string, opts: GeminiOptions = {}): Promise<string> {
  if (!isAIConfigured()) throw new AIUnavailableError('No Gemini API key configured');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.geminiModel}:generateContent`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.aiTimeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY! },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: opts.temperature ?? 0.2,
          ...(opts.json ? { responseMimeType: 'application/json' } : {}),
        },
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new AIUnavailableError(`Gemini HTTP ${res.status}`);
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new AIUnavailableError('Empty Gemini response');
    return text;
  } catch (e) {
    if (e instanceof AIUnavailableError) throw e;
    throw new AIUnavailableError(e instanceof Error ? e.message : 'Network error');
  } finally {
    clearTimeout(timer);
  }
}

/** Like askGemini but parses JSON (tolerates ```json fences). */
export async function askGeminiJSON(prompt: string): Promise<unknown> {
  const text = await askGemini(prompt, { json: true, temperature: 0 });
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new AIUnavailableError('Gemini did not return valid JSON');
  }
}
