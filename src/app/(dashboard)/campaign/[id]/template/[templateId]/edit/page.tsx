'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { NewsletterTemplate, Campaign } from '@/types';
import type { Block } from '@/types/editor';
import { useEditorStore } from '@/stores/editor-store';
import { EmailEditor } from '@/components/editor/EmailEditor';
import { mjmlToBlocks, htmlToBlocks } from '@/components/editor/utils/mjml-to-blocks';
import { blocksToMjml } from '@/components/editor/utils/blocks-to-mjml';
import { ArrowLeft } from 'lucide-react';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const templateId = params.templateId as string;

  const [template, setTemplate] = useState<NewsletterTemplate | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [initialBlocks, setInitialBlocks] = useState<Block[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/campaign/${campaignId}/template/${templateId}`);
        if (!res.ok) {
          setError('Template introuvable');
          return;
        }
        const data = await res.json();
        setTemplate(data.template);
        setCampaign(data.campaign);

        // Parse MJML or HTML into blocks
        const t = data.template as NewsletterTemplate;
        let blocks: Block[];
        if (t.mjmlCode?.trim()) {
          blocks = mjmlToBlocks(t.mjmlCode);
        } else {
          blocks = htmlToBlocks(t.htmlCode);
        }
        setInitialBlocks(blocks);
      } catch {
        setError('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campaignId, templateId]);

  const handleSave = useCallback(
    async (blocks: Block[]) => {
      setIsSaving(true);
      setSaveMessage('');
      try {
        // Extract head from original MJML if available
        let headContent: string | undefined;
        if (template?.mjmlCode) {
          const headMatch = template.mjmlCode.match(/<mj-head[^>]*>([\s\S]*?)<\/mj-head>/i);
          if (headMatch) headContent = headMatch[1];
        }

        const mjml = blocksToMjml(blocks, headContent);

        const res = await fetch(`/api/campaign/${campaignId}/template/${templateId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mjmlSource: mjml }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setSaveMessage(data.error || 'Erreur de sauvegarde');
          return;
        }

        const data = await res.json();
        setTemplate(data.template);
        useEditorStore.getState().resetDirty();
        setSaveMessage('Sauvegardé !');
        setTimeout(() => setSaveMessage(''), 3000);
      } catch {
        setSaveMessage('Erreur réseau');
      } finally {
        setIsSaving(false);
      }
    },
    [campaignId, templateId, template]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !template || !initialBlocks) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-600">{error || 'Erreur de chargement'}</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-brand-600 hover:underline"
        >
          Retour
        </button>
      </div>
    );
  }

  const palette = campaign?.dna?.palette;
  const brandFonts = campaign?.dna?.designSystem
    ? [campaign.dna.designSystem.primaryFont, campaign.dna.designSystem.secondaryFont].filter(Boolean)
    : undefined;

  return (
    <div className="h-screen flex flex-col min-h-0">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-surface-200 bg-white shrink-0">
        <button
          onClick={() => router.push(`/campaign/${campaign?.id || campaignId}/template/${templateId}`)}
          className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <div className="h-4 w-px bg-surface-200" />
        <span className="text-sm font-medium text-surface-900">
          #{template.templateNumber} — {template.templateType}
        </span>
        {campaign && (
          <span className="text-xs text-surface-400">{campaign.name}</span>
        )}
        {saveMessage && (
          <span className={`text-xs ml-auto ${saveMessage.includes('Erreur') ? 'text-red-600' : 'text-green-600'}`}>
            {saveMessage}
          </span>
        )}
      </div>

      {/* Editor */}
      <EmailEditor
        initialBlocks={initialBlocks}
        palette={palette}
        brandFonts={brandFonts}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
