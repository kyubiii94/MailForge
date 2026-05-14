/**
 * Robust parsing for LLM JSON outputs (Gemini/OpenAI): markdown fences,
 * trailing garbage after a valid object, nested braces inside HTML strings.
 */

export function extractBalancedJsonObject(raw: string): string | null {
  let s = raw.trim();
  const fenceMatch = s.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) s = fenceMatch[1].trim();

  const start = s.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < s.length; i++) {
    const ch = s[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === '\\' && inString) {
      escape = true;
      continue;
    }

    if (ch === '"' && !escape) {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }

  return null;
}

export function extractJson(raw: string): string {
  const balanced = extractBalancedJsonObject(raw);
  if (balanced) return balanced;
  return raw.trim();
}

function repairJson(raw: string): string {
  let s = raw.trim();
  const quoteCount = (s.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) s += '"';
  s = s.replace(/:\s*([}\],])/g, ':""$1');
  let braces = 0;
  let brackets = 0;
  let inString = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"' && (i === 0 || s[i - 1] !== '\\')) {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') braces++;
    else if (ch === '}') braces--;
    else if (ch === '[') brackets++;
    else if (ch === ']') brackets--;
  }
  s = s.replace(/,\s*$/, '');
  while (brackets > 0) {
    s += ']';
    brackets--;
  }
  while (braces > 0) {
    s += '}';
    braces--;
  }
  return s;
}

export function safeJsonParse<T>(raw: string): T {
  const jsonStr = extractJson(raw);
  try {
    return JSON.parse(jsonStr) as T;
  } catch (firstErr) {
    const trimmed = (raw || jsonStr || '').trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[') && trimmed.length > 0) {
      const excerpt = trimmed.length > 350 ? `${trimmed.slice(0, 350)}…` : trimmed;
      throw new Error(`Réponse IA invalide (attendu du JSON) : ${excerpt}`);
    }
    console.warn('[json-response] JSON.parse failed, attempting repair...');
    try {
      const repaired = repairJson(jsonStr);
      return JSON.parse(repaired) as T;
    } catch {
      const msg = firstErr instanceof Error ? firstErr.message : String(firstErr);
      if (msg.includes('Réponse IA')) throw firstErr;
      throw new Error(`Réponse IA : JSON invalide. ${msg.slice(0, 160)}`);
    }
  }
}
