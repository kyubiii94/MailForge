import OpenAI from 'openai';
import { safeJsonParse } from '@/lib/ai/json-response';

/**
 * Large structured JSON via OpenAI (fallback when Gemini truncates or adds trailing junk).
 */
export async function generateLargeJsonWithOpenAI<T>(prompt: string, maxOutputTokens = 16384): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('OPENAI_API_KEY manquante pour le fallback templates');

  const model = process.env.OPENAI_TEMPLATE_MODEL?.trim() || 'gpt-4o-mini';
  const capped = Math.min(Math.max(maxOutputTokens, 4096), 16384);

  const client = new OpenAI({ apiKey });

  const res = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'Tu réponds uniquement par UN objet JSON valide, conforme au schéma demandé dans le message utilisateur. Aucun markdown, aucun texte avant ou après le JSON. Échappe correctement les guillemets et les retours ligne dans les chaînes (HTML).',
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_completion_tokens: capped,
  });

  const raw = res.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error('Réponse OpenAI vide pour le template');

  console.log(`[OpenAI template] Parsed JSON (${raw.length} chars), model=${model}`);
  return safeJsonParse<T>(raw);
}
