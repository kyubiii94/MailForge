import { NextRequest, NextResponse } from 'next/server';
import { updateBrandDNASchema } from '@/lib/validators';
import { db } from '@/lib/db';

/**
 * GET /api/brand-dna/:id - Get a specific brand DNA.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const brandDNA = await db.getBrandDNA(params.id);
  if (!brandDNA) {
    return NextResponse.json({ error: 'Brand DNA not found' }, { status: 404 });
  }

  return NextResponse.json(brandDNA);
}

/**
 * PUT /api/brand-dna/:id - Update a brand DNA (user validation/modification).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const parsed = updateBrandDNASchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await db.updateBrandDNA(params.id, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: 'Brand DNA not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Brand DNA update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
