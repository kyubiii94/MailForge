import { GoogleGenAI } from '@google/genai';
import { safeJsonParse } from '@/lib/ai/json-response';

export { safeJsonParse } from '@/lib/ai/json-response';

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error('GEMINI_API_KEY est vide ou absente');
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: key });
  }
  return _client;
}

function getErrorCode(err: unknown): number | undefined {
  const e = err as
    | {
        status?: number;
        statusCode?: number;
        code?: number;
        httpCode?: number;
        error?: { code?: number };
      }
    | undefined;
  if (typeof e?.error?.code === 'number') return e.error.code;
  if (typeof e?.status === 'number') return e.status;
  if (typeof e?.statusCode === 'number') return e.statusCode;
  if (typeof e?.code === 'number') return e.code;
  if (typeof e?.httpCode === 'number') return e.httpCode;
  const msg = err instanceof Error ? err.message : String(err);
  const codeMatch = msg.match(/"code"\s*:\s*(\d{3})/);
  if (codeMatch) return parseInt(codeMatch[1], 10);
  return undefined;
}

function isModelNotFoundError(err: unknown): boolean {
  const code = getErrorCode(err);
  if (code === 404) return true;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return msg.includes('is not found') || msg.includes('model not found') || (msg.includes('models/') && msg.includes('not found'));
}

/** Capacity / rate limits — try another model or retry instead of failing immediately. */
function isTransientGeminiError(err: unknown): boolean {
  const code = getErrorCode(err);
  if (code === 429 || code === 503) return true;

  const nested = err as {
    error?: { code?: number; status?: string; message?: string };
    status?: string | number;
  };
  const st = nested?.error?.status;
  if (typeof st === 'string' && ['unavailable', 'resource_exhausted'].includes(st.toLowerCase())) return true;
  if (nested?.error?.code === 429 || nested?.error?.code === 503) return true;

  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('high demand') ||
    msg.includes('"status":"unavailable"') ||
    msg.includes('unavailable') ||
    msg.includes('resource exhausted') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('overloaded')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Readable message for UI when Gemini returns nested JSON errors. */
export function formatGeminiUserMessage(err: unknown): string {
  let raw = '';
  if (err instanceof Error) raw = err.message;
  else if (err !== null && typeof err === 'object') {
    const o = err as Record<string, unknown>;
    const innerErr = o.error as Record<string, unknown> | undefined;
    const direct =
      (typeof innerErr?.message === 'string' && innerErr.message) ||
      (typeof o.message === 'string' && o.message) ||
      '';
    raw = direct || JSON.stringify(o);
  } else raw = String(err ?? '');

  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string; code?: number }; message?: string };
    const inner = parsed?.error?.message ?? parsed?.message;
    if (typeof inner === 'string' && inner.length > 0) {
      if (/high demand|temporarily|unavailable|retry/i.test(inner)) {
        return 'Le service IA est momentanément saturé. Réessayez dans une minute.';
      }
      return inner.length > 400 ? `${inner.slice(0, 400)}…` : inner;
    }
  } catch {
    /* not JSON */
  }
  if (/high demand|unavailable|503|429/i.test(raw)) {
    return 'Le service IA est momentanément saturé. Réessayez dans une minute.';
  }
  return raw.length > 500 ? `${raw.slice(0, 500)}…` : raw;
}

/** Sortie Gemini volumineuse : retry autre modèle au lieu d’abandonner au premier parse KO. */
function isRecoverableOutputError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes(`n'a pas renvoyé de JSON valide`) ||
    msg.includes('JSON invalide') ||
    msg.includes('Réponse IA invalide') ||
    msg.includes('Réponse Gemini (pas du JSON)') ||
    msg.includes('Réponse Gemini (attendu du JSON)') ||
    msg.includes('Réponse Gemini invalide') ||
    msg.includes('Unexpected non-whitespace') ||
    msg.includes('Unexpected token') ||
    msg.includes('Unexpected end') ||
    msg.includes('Bad control character') ||
    msg.includes('Expected double-quoted property name')
  );
}

async function generateJson<T>(prompt: string, maxTokens = 4096): Promise<T> {
  const client = getClient();
  let lastError: unknown;

  for (const model of MODELS) {
    const maxAttemptsPerModel = 3;
    for (let attempt = 0; attempt < maxAttemptsPerModel; attempt++) {
      try {
        if (attempt > 0) {
          const backoff = Math.min(5000, 900 * Math.pow(2, attempt - 1));
          await sleep(backoff);
        }
        const thinkingConfig = model.includes('2.5') ? { thinkingBudget: 0 } : undefined;
        const response = (await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            maxOutputTokens: maxTokens,
            ...(thinkingConfig ? { thinkingConfig } : {}),
          },
        })) as { text?: string; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

        let text = response.text;
        if (!text && response.candidates?.[0]?.content?.parts?.[0]?.text) {
          text = response.candidates[0].content.parts[0].text;
        }
        if (!text) throw new Error('Réponse vide de Gemini');

        const trimmed = text.trim();
        const looksLikeJson = trimmed.startsWith('{') || trimmed.startsWith('[');
        const looksLikeError = /^(an?\s+)?error|sorry|invalid|failed|blocked|not\s+allowed|safety|cannot\s+generate/i.test(trimmed);
        if (!looksLikeJson) {
          if (looksLikeError || trimmed.length < 150) {
            const message = trimmed.length > 400 ? trimmed.slice(0, 400) + '…' : trimmed;
            throw new Error(`Réponse Gemini (pas du JSON) : ${message}`);
          }
          if (/^[a-z]/i.test(trimmed) && !trimmed.includes('"')) {
            throw new Error(`Réponse Gemini (attendu du JSON) : ${trimmed.slice(0, 300)}${trimmed.length > 300 ? '…' : ''}`);
          }
        }

        return safeJsonParse<T>(text);
      } catch (err) {
        lastError = err;
        if (isModelNotFoundError(err)) break;
        if (isTransientGeminiError(err) && attempt < maxAttemptsPerModel - 1) continue;
        if (isTransientGeminiError(err)) break;
        if (isRecoverableOutputError(err) && attempt < maxAttemptsPerModel - 1) continue;
        if (isRecoverableOutputError(err)) break;
        throw err;
      }
    }
  }
  throw new Error(formatGeminiUserMessage(lastError));
}

export async function testConnection(): Promise<{ ok: boolean; model: string; error?: string; details?: Record<string, string> }> {
  const client = getClient();
  const details: Record<string, string> = {};
  for (const model of MODELS) {
    try {
      const response = (await client.models.generateContent({
        model,
        contents: 'Reply with exactly: ok',
        config: { maxOutputTokens: 10 },
      })) as { text?: string };
      if (response.text) {
        return { ok: true, model, details };
      }
      details[model] = 'Réponse vide';
    } catch (err) {
      const code = getErrorCode(err);
      const msg = err instanceof Error ? err.message : String(err);
      details[model] = `HTTP ${code ?? '?'}: ${msg.slice(0, 150)}`;
      if (isModelNotFoundError(err)) continue;
      return { ok: false, model, error: msg.slice(0, 200), details };
    }
  }
  return { ok: false, model: MODELS.join(', '), error: 'Aucun modèle accessible', details };
}

/** Réponse JSON Gemini avec retry multi-modèles et backoff (503 / 429 / UNAVAILABLE). */
export async function geminiGenerateJson<T>(prompt: string, maxTokens = 4096): Promise<T> {
  return generateJson<T>(prompt, maxTokens);
}
