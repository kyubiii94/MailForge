import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string; num: string }> }) {
  const { id, num } = await params;
  const templateNumber = parseInt(num, 10);
  if (isNaN(templateNumber) || templateNumber < 1 || templateNumber > 8) {
    return NextResponse.json({ error: 'Numéro de template invalide (1-8)' }, { status: 400 });
  }

  const campaign = await db.getCampaign(id);
  if (!campaign) {
    return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
  }

  const template = await db.getTemplateByCampaignAndNumber(id, templateNumber);
  if (!template) {
    return NextResponse.json({ error: `Template #${templateNumber} non trouvé` }, { status: 404 });
  }

  return NextResponse.json({ template, campaign });
}
