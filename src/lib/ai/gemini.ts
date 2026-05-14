import { GoogleGenAI } from '@google/genai';
import type { CampaignBrief, CampaignDNA } from '@/types';
import { buildDNAPrompt, buildMasterTemplatePrompt, buildTemplatePrompt, type SiteContent, type MasterContext } from './prompts';

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

function extractJson(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];
  return raw.trim();
}

function repairJson(raw: string): string {
  let s = raw.trim();
  const quoteCount = (s.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) s += '"';
  // Remplacer les valeurs manquantes : "key":} ou "key":] ou "key":, par "key":""
  s = s.replace(/:\s*([}\],])/g, ':""$1');
  let braces = 0;
  let brackets = 0;
  let inString = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"' && (i === 0 || s[i - 1] !== '\\')) { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') braces++;
    else if (ch === '}') braces--;
    else if (ch === '[') brackets++;
    else if (ch === ']') brackets--;
  }
  s = s.replace(/,\s*$/, '');
  while (brackets > 0) { s += ']'; brackets--; }
  while (braces > 0) { s += '}'; braces--; }
  return s;
}

export function safeJsonParse<T>(raw: string): T {
  const jsonStr = extractJson(raw);
  try {
    return JSON.parse(jsonStr) as T;
  } catch (firstErr) {
    const trimmed = (raw || jsonStr || '').trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[') && trimmed.length > 0) {
      const excerpt = trimmed.length > 350 ? trimmed.slice(0, 350) + '…' : trimmed;
      throw new Error(`Réponse Gemini invalide (attendu du JSON) : ${excerpt}`);
    }
    console.warn('[Gemini] JSON.parse failed, attempting repair...');
    try {
      const repaired = repairJson(jsonStr);
      return JSON.parse(repaired) as T;
    } catch {
      const msg = firstErr instanceof Error ? firstErr.message : String(firstErr);
      if (msg.includes('Réponse Gemini')) throw firstErr;
      throw new Error(`Réponse Gemini : le modèle n'a pas renvoyé de JSON valide. ${msg.slice(0, 120)}`);
    }
  }
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
          console.log(`[Gemini] Backoff ${backoff}ms then retry ${attempt + 1}/${maxAttemptsPerModel} (${model})`);
          await sleep(backoff);
        }
        console.log(`[Gemini] Trying model: ${model} (JSON mode, ${maxTokens} max tokens)`);
        // Disable thinking on 2.5 models to avoid timeouts on Vercel free tier (60s limit)
        const thinkingConfig = model.includes('2.5') ? { thinkingBudget: 0 } : undefined;
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            maxOutputTokens: maxTokens,
            ...(thinkingConfig ? { thinkingConfig } : {}),
          },
        }) as { text?: string; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

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

        console.log(`[Gemini] Raw response (${text.length} chars): ${text.slice(0, 300)}`);
        const parsedOut = safeJsonParse<T>(text);
        console.log(`[Gemini] JSON parsed OK with model ${model}`);
        return parsedOut;
      } catch (err) {
        const code = getErrorCode(err);
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[Gemini] Model ${model} failed (HTTP ${code ?? '?'}):`, msg.slice(0, 300));
        lastError = err;
        if (isModelNotFoundError(err)) break;
        if (isTransientGeminiError(err) && attempt < maxAttemptsPerModel - 1) continue;
        if (isTransientGeminiError(err)) break;
        throw err;
      }
    }
  }
  throw new Error(formatGeminiUserMessage(lastError));
}

async function generateText(prompt: string, maxTokens = 8192): Promise<string> {
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
        console.log(`[Gemini] Trying model: ${model} (text mode)`);
        const thinkingConfig = model.includes('2.5') ? { thinkingBudget: 0 } : undefined;
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            maxOutputTokens: maxTokens,
            ...(thinkingConfig ? { thinkingConfig } : {}),
          },
        }) as { text?: string; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

        let text = response.text;
        if (!text && response.candidates?.[0]?.content?.parts?.[0]?.text) {
          text = response.candidates[0].content.parts[0].text;
        }
        if (!text) throw new Error('Réponse vide de Gemini');
        console.log(`[Gemini] Success with model ${model} (${text.length} chars)`);
        return text;
      } catch (err) {
        const code = getErrorCode(err);
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[Gemini] Model ${model} failed (HTTP ${code ?? '?'}):`, msg.slice(0, 300));
        lastError = err;
        if (isModelNotFoundError(err)) break;
        if (isTransientGeminiError(err) && attempt < maxAttemptsPerModel - 1) continue;
        if (isTransientGeminiError(err)) break;
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
      const response = await client.models.generateContent({
        model,
        contents: 'Reply with exactly: ok',
        config: { maxOutputTokens: 10 },
      }) as { text?: string };
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

// ─── Campaign DNA Generation ──────────────────────────────────────────────────

/** Réponse JSON Gemini avec retry multi-modèles et backoff (503 / 429 / UNAVAILABLE). */
export async function geminiGenerateJson<T>(prompt: string, maxTokens = 4096): Promise<T> {
  return generateJson<T>(prompt, maxTokens);
}

export async function generateCampaignDNA(
  brief: CampaignBrief,
  crawledData?: { colors?: string; fonts?: string; textContent?: string; title?: string; metaDescription?: string }
): Promise<CampaignDNA> {
  const prompt = buildDNAPrompt(brief, crawledData);
  return generateJson<CampaignDNA>(prompt, 4096);
}

// ─── Master Template (#8) Generation ──────────────────────────────────────────

interface RawTemplateResponse {
  subjectLine: string;
  previewText: string;
  layoutDescription: {
    structure: string;
    heroSection: string;
    bodySections: string;
    ctaSection: string;
    footer: string;
  };
  designSpecs: {
    width: string;
    backgroundColor: string;
    fontStack: string;
    headingStyle: string;
    bodyStyle: string;
    ctaStyle: string;
    spacing: string;
    borderRadius: string;
    imageTreatment: string;
  };
  htmlCode: string;
  mjmlCode?: string;
  darkModeOverrides: string;
  accessibilityNotes: string;
  coherenceTips: string;
}

export async function generateMasterTemplate(dna: CampaignDNA, siteContent?: SiteContent | null): Promise<RawTemplateResponse> {
  const prompt = buildMasterTemplatePrompt(dna, siteContent);
  return generateJson<RawTemplateResponse>(prompt, 16384);
}

// ─── Individual Template (1-7) Generation ─────────────────────────────────────

export async function generateTemplate(
  dna: CampaignDNA,
  masterContext: MasterContext,
  templateNumber: number,
  siteContent?: SiteContent | null
): Promise<RawTemplateResponse> {
  const prompt = buildTemplatePrompt(dna, masterContext, templateNumber, siteContent);
  return generateJson<RawTemplateResponse>(prompt, 16384);
}
