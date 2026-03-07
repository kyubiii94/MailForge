import { GoogleGenAI } from '@google/genai';
import type { CampaignBrief, CampaignDNA } from '@/types';
import { buildDNAPrompt, buildMasterTemplatePrompt, buildTemplatePrompt } from './prompts';

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
  const e = err as { status?: number; statusCode?: number; code?: number; httpCode?: number } | undefined;
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

function safeJsonParse<T>(raw: string): T {
  const jsonStr = extractJson(raw);
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    console.warn('[Gemini] JSON.parse failed, attempting repair...');
    const repaired = repairJson(jsonStr);
    return JSON.parse(repaired) as T;
  }
}

async function generateJson<T>(prompt: string, maxTokens = 4096): Promise<T> {
  const client = getClient();
  let lastError: unknown;

  for (const model of MODELS) {
    try {
      console.log(`[Gemini] Trying model: ${model} (JSON mode, ${maxTokens} max tokens)`);
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: maxTokens,
        },
      }) as { text?: string; candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

      let text = response.text;
      if (!text && response.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = response.candidates[0].content.parts[0].text;
      }
      if (!text) throw new Error('Réponse vide de Gemini');

      console.log(`[Gemini] Raw response (${text.length} chars): ${text.slice(0, 300)}`);
      const parsed = safeJsonParse<T>(text);
      console.log(`[Gemini] JSON parsed OK with model ${model}`);
      return parsed;
    } catch (err) {
      const code = getErrorCode(err);
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Gemini] Model ${model} failed (HTTP ${code ?? '?'}):`, msg.slice(0, 300));
      lastError = err;
      if (isModelNotFoundError(err)) continue;
      throw err;
    }
  }
  throw lastError;
}

async function generateText(prompt: string, maxTokens = 8192): Promise<string> {
  const client = getClient();
  let lastError: unknown;

  for (const model of MODELS) {
    try {
      console.log(`[Gemini] Trying model: ${model} (text mode)`);
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: { maxOutputTokens: maxTokens },
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
      if (isModelNotFoundError(err)) continue;
      throw err;
    }
  }
  throw lastError;
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
  mjmlCode: string;
  darkModeOverrides: string;
  accessibilityNotes: string;
  coherenceTips: string;
}

export async function generateMasterTemplate(dna: CampaignDNA): Promise<RawTemplateResponse> {
  const prompt = buildMasterTemplatePrompt(dna);
  return generateJson<RawTemplateResponse>(prompt, 8192);
}

// ─── Individual Template (1-7) Generation ─────────────────────────────────────

export async function generateTemplate(
  dna: CampaignDNA,
  masterDesignSpecs: string,
  masterHeadHtml: string,
  templateNumber: number
): Promise<RawTemplateResponse> {
  const prompt = buildTemplatePrompt(dna, masterDesignSpecs, masterHeadHtml, templateNumber);
  return generateJson<RawTemplateResponse>(prompt, 8192);
}
