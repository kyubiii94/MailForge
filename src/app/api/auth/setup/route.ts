import { NextResponse } from 'next/server';
import { setupSchema, createFirstAdmin, countUsers } from '@/features/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const count = await countUsers();
    return NextResponse.json({ needsSetup: count === 0 });
  } catch {
    // Ne pas proposer le setup si on ne peut pas vérifier — évite un faux écran d'inscription
    return NextResponse.json(
      { needsSetup: false, error: 'Base de données indisponible' },
      { status: 503 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = setupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await createFirstAdmin(parsed.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
    });
  } catch (err) {
    console.error('[API] Auth setup error:', err);
    return NextResponse.json(
      { error: 'Impossible de créer le compte' },
      { status: 500 }
    );
  }
}
