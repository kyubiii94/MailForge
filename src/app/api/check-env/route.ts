import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/ai/gemini';

/**
 * GET /api/check-env - Diagnostic complet : format de la clé + test de connexion réel.
 */
export async function GET() {
  const key = process.env.GEMINI_API_KEY?.trim();
  const isSet = Boolean(key && key.length > 0);
  const length = key?.length ?? 0;
  const looksValid = isSet && length >= 30 && key!.startsWith('AIza');

  const keyCheck = {
    geminiKeySet: isSet,
    geminiKeyLength: length,
    geminiKeyLooksValid: looksValid,
    keyHint: !isSet
      ? 'GEMINI_API_KEY est vide ou absente. Ajoutez-la dans les Environment Variables Vercel (ou .env en local).'
      : !key!.startsWith('AIza')
        ? 'La clé ne commence pas par AIza. Vérifiez que c\'est une clé Google AI Studio.'
        : length < 30
          ? 'La clé semble trop courte.'
          : 'Format de clé OK.',
  };

  if (!isSet) {
    return NextResponse.json({ ...keyCheck, connectionTest: null, nodeVersion: process.version });
  }

  try {
    const result = await testConnection();
    return NextResponse.json({
      ...keyCheck,
      connectionTest: result,
      nodeVersion: process.version,
    });
  } catch (err) {
    return NextResponse.json({
      ...keyCheck,
      connectionTest: {
        ok: false,
        error: err instanceof Error ? err.message.slice(0, 300) : String(err).slice(0, 300),
      },
      nodeVersion: process.version,
    });
  }
}
