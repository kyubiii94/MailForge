import { NextRequest, NextResponse } from 'next/server';
import { getStyle } from '@/lib/library/queries';
import { generateStylePrompt } from '@/lib/library/style-prompt-builder';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { styleId } = await request.json();
    if (!styleId) {
      return NextResponse.json({ error: 'styleId requis' }, { status: 400 });
    }

    const style = await getStyle(styleId);
    if (!style) {
      return NextResponse.json({ error: 'Style introuvable' }, { status: 404 });
    }

    if (!style.inspirations || style.inspirations.length === 0) {
      return NextResponse.json({ error: 'Le style doit contenir au moins une newsletter' }, { status: 400 });
    }

    const prompt = await generateStylePrompt(style.name, style.inspirations);

    return NextResponse.json({ prompt });
  } catch (err) {
    console.error('[API] Generate style prompt error:', err);
    return NextResponse.json({ error: 'Erreur lors de la génération du prompt' }, { status: 500 });
  }
}
