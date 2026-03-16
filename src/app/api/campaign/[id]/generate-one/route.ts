import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateMasterTemplate, generateTemplate } from '@/lib/ai/gemini';
import { TEMPLATE_TYPES } from '@/lib/constants';
import type { SiteContent, MasterContext } from '@/lib/ai/prompts';
import { enforceContrast } from '@/lib/email/contrast-checker';

export const maxDuration = 60;

async function buildSiteContentFromClient(clientId: string | null | undefined): Promise<SiteContent | null> {
  if (!clientId) return null;
  const client = await db.getClient(clientId);
  if (!client?.siteAnalysis) return null;

  const analysis = client.siteAnalysis;
  const textParts: string[] = [];
  if (client.name) textParts.push(client.name);
  if (client.sector) textParts.push(`Secteur : ${client.sector}`);
  if (client.positioning) textParts.push(`Positionnement : ${client.positioning}`);
  if (analysis.toneOfVoice) textParts.push(`Ton : ${analysis.toneOfVoice}`);
  if (analysis.audience) textParts.push(`Audience : ${analysis.audience}`);
  if (analysis.ambiance) textParts.push(`Ambiance : ${analysis.ambiance}`);
  if (analysis.keywords?.length) textParts.push(`Mots-clés : ${analysis.keywords.join(', ')}`);
  if (analysis.colors) textParts.push(`Couleurs du site : ${analysis.colors}`);
  if (analysis.fonts) textParts.push(`Polices du site : ${analysis.fonts}`);

  return {
    imageUrls: analysis.imageUrls ?? [],
    textContent: textParts.join('\n'),
  };
}

function extractFooterHtml(html: string): string {
  const footerMatch = html.match(/<!--\s*footer\s*-->([\s\S]*?)(?:<!--|<\/table>)/i)
    || html.match(/<t[dr][^>]*>[\s\S]*?[Ss]e\s+d[ée]sabonner[\s\S]*?<\/t[dr]>/i)
    || html.match(/<t[dr][^>]*>[\s\S]*?unsubscribe[\s\S]*?<\/t[dr]>/i);
  return footerMatch ? footerMatch[0].trim() : '';
}

function extractCtaHtml(html: string): string {
  const ctaMatch = html.match(/<a\s[^>]*display\s*:\s*inline-block[^>]*>[\s\S]*?<\/a>/i)
    || html.match(/<a\s[^>]*background-color\s*:[^>]*padding[^>]*>[\s\S]*?<\/a>/i);
  return ctaMatch ? ctaMatch[0].trim() : '';
}

function truncateHtml(html: string, maxLen = 4000): string {
  if (!html || html.length <= maxLen) return html;
  return html.slice(0, maxLen) + '\n<!-- ... tronqué -->';
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaignId = typeof id === 'string' ? id.trim().toLowerCase() : id;
  const campaign = await db.getCampaign(campaignId);
  if (!campaign) {
    return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY non configurée.' }, { status: 503 });
  }

  const body = await request.json();
  const templateNumber: number = body.templateNumber;
  const masterDesignSpecs: string = body.masterDesignSpecs || '';
  const masterHeadHtml: string = body.masterHeadHtml || '';
  const masterHtmlCode: string = body.masterHtmlCode || '';
  const masterFooterHtml: string = body.masterFooterHtml || '';
  const masterCtaHtml: string = body.masterCtaHtml || '';

  if (typeof templateNumber !== 'number' || templateNumber < 1 || templateNumber > 8) {
    return NextResponse.json({ error: 'templateNumber invalide (1-8)' }, { status: 400 });
  }

  const siteContent = await buildSiteContentFromClient(campaign.clientId);

  try {
    if (templateNumber === 8) {
      console.log(`[GenerateOne] Generating master template (#8) for campaign ${campaignId}...`);
      const masterData = await generateMasterTemplate(campaign.dna, siteContent);

      // Renforcer l'accessibilité : corriger les contrastes (texte sur fond) du HTML master
      if (masterData.htmlCode) {
        const { html: fixedHtml, corrections } = enforceContrast(masterData.htmlCode);
        masterData.htmlCode = fixedHtml;
        if (corrections.length > 0) {
          console.log(
            `[GenerateOne] Master template: fixed ${corrections.length} contrast issues (accessibility)`
          );
        }
      }

      const designSpecs = JSON.stringify(masterData.designSpecs, null, 2);
      const headMatch = masterData.htmlCode?.match(/<head[\s\S]*?<\/head>/i);
      const headHtml = headMatch ? headMatch[0] : '';
      const fullHtml = masterData.htmlCode || '';
      const footerHtml = extractFooterHtml(fullHtml);
      const ctaHtml = extractCtaHtml(fullHtml);

      const existing = await db.getTemplateByCampaignAndNumber(campaignId, 8);
      const template = existing
        ? (await db.updateTemplate(existing.id, {
            subjectLine: masterData.subjectLine || '',
            previewText: masterData.previewText || '',
            layoutDescription: masterData.layoutDescription || { structure: '', heroSection: '', bodySections: '', ctaSection: '', footer: '' },
            designSpecs: masterData.designSpecs || { width: '600px', backgroundColor: '#FFFFFF', fontStack: '', headingStyle: '', bodyStyle: '', ctaStyle: '', spacing: '', borderRadius: '', imageTreatment: '' },
            htmlCode: fullHtml,
            mjmlCode: '',
            darkModeOverrides: masterData.darkModeOverrides || '',
            accessibilityNotes: masterData.accessibilityNotes || '',
            coherenceTips: masterData.coherenceTips || '',
          }))!
        : await db.createTemplate({
            campaignId,
            templateNumber: 8,
            templateType: 'Campaign Master Template',
            subjectLine: masterData.subjectLine || '',
            previewText: masterData.previewText || '',
            layoutDescription: masterData.layoutDescription || { structure: '', heroSection: '', bodySections: '', ctaSection: '', footer: '' },
            designSpecs: masterData.designSpecs || { width: '600px', backgroundColor: '#FFFFFF', fontStack: '', headingStyle: '', bodyStyle: '', ctaStyle: '', spacing: '', borderRadius: '', imageTreatment: '' },
            htmlCode: fullHtml,
            mjmlCode: '',
            darkModeOverrides: masterData.darkModeOverrides || '',
            accessibilityNotes: masterData.accessibilityNotes || '',
            coherenceTips: masterData.coherenceTips || '',
          });

      return NextResponse.json({
        status: 'ok',
        template,
        masterDesignSpecs: designSpecs,
        masterHeadHtml: headHtml,
        masterHtmlCode: truncateHtml(fullHtml),
        masterFooterHtml: footerHtml,
        masterCtaHtml: ctaHtml,
      });
    }

    const typeInfo = TEMPLATE_TYPES.find((t) => t.number === templateNumber);
    if (!typeInfo) {
      return NextResponse.json({ error: `Type de template #${templateNumber} inconnu` }, { status: 400 });
    }

    const masterContext: MasterContext = {
      designSpecs: masterDesignSpecs,
      headHtml: masterHeadHtml,
      htmlCode: masterHtmlCode,
      footerHtml: masterFooterHtml,
      ctaHtml: masterCtaHtml,
    };

    console.log(`[GenerateOne] Generating template #${templateNumber} (${typeInfo.type}) for campaign ${campaignId}...`);
    const data = await generateTemplate(campaign.dna, masterContext, templateNumber, siteContent);

    // Renforcer l'accessibilité : corriger les contrastes du HTML variant
    if (data.htmlCode) {
      const { html: fixedHtml, corrections } = enforceContrast(data.htmlCode);
      data.htmlCode = fixedHtml;
      if (corrections.length > 0) {
        console.log(
          `[GenerateOne] Template #${templateNumber}: fixed ${corrections.length} contrast issues (accessibility)`
        );
      }
    }

    const existing = await db.getTemplateByCampaignAndNumber(campaignId, templateNumber);
    const template = existing
      ? (await db.updateTemplate(existing.id, {
          subjectLine: data.subjectLine || '',
          previewText: data.previewText || '',
          layoutDescription: data.layoutDescription || { structure: '', heroSection: '', bodySections: '', ctaSection: '', footer: '' },
          designSpecs: data.designSpecs || { width: '600px', backgroundColor: '#FFFFFF', fontStack: '', headingStyle: '', bodyStyle: '', ctaStyle: '', spacing: '', borderRadius: '', imageTreatment: '' },
          htmlCode: data.htmlCode || '',
          mjmlCode: '',
          darkModeOverrides: data.darkModeOverrides || '',
          accessibilityNotes: data.accessibilityNotes || '',
          coherenceTips: data.coherenceTips || '',
        }))!
      : await db.createTemplate({
campaignId,
            templateNumber,
          templateType: typeInfo.type,
          subjectLine: data.subjectLine || '',
          previewText: data.previewText || '',
          layoutDescription: data.layoutDescription || { structure: '', heroSection: '', bodySections: '', ctaSection: '', footer: '' },
          designSpecs: data.designSpecs || { width: '600px', backgroundColor: '#FFFFFF', fontStack: '', headingStyle: '', bodyStyle: '', ctaStyle: '', spacing: '', borderRadius: '', imageTreatment: '' },
          htmlCode: data.htmlCode || '',
          mjmlCode: '',
          darkModeOverrides: data.darkModeOverrides || '',
          accessibilityNotes: data.accessibilityNotes || '',
          coherenceTips: data.coherenceTips || '',
        });

    return NextResponse.json({ status: 'ok', template });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur de génération';
    console.error(`[GenerateOne] Template #${templateNumber} failed:`, message);
    return NextResponse.json({ status: 'error', templateNumber, error: message }, { status: 500 });
  }
}
