import { NextRequest, NextResponse } from 'next/server';
import { updateClientSchema } from '@/lib/validators';
import { db } from '@/lib/db';

/**
 * GET /api/clients/[id] - Get a client by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = db.getClient(params.id);
  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }
  return NextResponse.json(client);
}

/**
 * PATCH /api/clients/[id] - Update a client.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const parsed = updateClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = db.updateClient(params.id, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Client update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/clients/[id] - Delete a client.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const deleted = db.deleteClient(params.id);
  if (!deleted) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
