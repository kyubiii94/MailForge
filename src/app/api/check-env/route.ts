import { NextResponse } from 'next/server';

/**
 * GET /api/check-env - Diagnostic (sans exposer les secrets).
 * Vérifie que GEMINI_API_KEY est chargée et a un format plausible.
 */
export async function GET() {
  const key = process.env.GEMINI_API_KEY?.trim();
  const isSet = Boolean(key && key.length > 0);
  const length = key?.length ?? 0;
  // Les clés Gemini (Google AI Studio) commencent par AIza et font environ 39+ caractères
  const looksValid = isSet && length >= 30 && key!.startsWith('AIza');

  return NextResponse.json({
    geminiKeySet: isSet,
    geminiKeyLength: length,
    geminiKeyLooksValid: looksValid,
    hint: !isSet
      ? 'GEMINI_API_KEY est vide ou absente. Ajoutez-la dans .env (aistudio.google.com/apikey).'
      : !key!.startsWith('AIza')
        ? 'La clé ne commence pas par AIza. Vérifiez que c\'est bien une clé Google AI Studio (Gemini).'
        : length < 30
          ? 'La clé semble trop courte. Vérifiez qu\'elle est complète (sans espace ni coupure).'
          : looksValid
            ? 'La clé Gemini est chargée et a un format plausible. Vous pouvez lancer l\'analyse ADN de marque.'
            : 'Vérifiez le format de GEMINI_API_KEY dans .env.',
  });
}
