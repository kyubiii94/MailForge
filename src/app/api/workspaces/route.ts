import { NextRequest, NextResponse } from 'next/server';
import { createWorkspaceSchema } from '@/lib/validators';
import { db } from '@/lib/db';

/**
 * POST /api/workspaces - Create a new workspace.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createWorkspaceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const workspace = await db.createWorkspace(parsed.data.name);
    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    console.error('Workspace creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/workspaces - List all workspaces.
 */
export async function GET() {
  const workspaces = await db.listWorkspaces();
  return NextResponse.json(workspaces);
}
