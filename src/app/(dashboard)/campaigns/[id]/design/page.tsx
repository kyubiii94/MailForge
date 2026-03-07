'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressSteps } from '@/components/ui/progress-steps';
import type { EmailDesign, TextContent, Visual } from '@/types';
import {
  Mail,
  Sparkles,
  Monitor,
  Smartphone,
  Download,
  ArrowLeft,
  Loader2,
  BarChart3,
  AlertCircle,
} from 'lucide-react';

const isBrandDnaMissingError = (msg: string) =>
  /brand dna not found|ADN de marque non trouvé|aucun ADN/i.test(msg);

const steps = [
  { id: 'text', label: 'Contenu Textuel' },
  { id: 'visuals', label: 'Visuels' },
  { id: 'design', label: 'Design Email' },
];

export default function CampaignDesignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [designs, setDesigns] = useState<EmailDesign[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<EmailDesign | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [error, setError] = useState('');
  const [textContent, setTextContent] = useState<TextContent | null>(null);
  const [visuals, setVisuals] = useState<Visual[]>([]);

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const fetchData = async () => {
    try {
      // Fetch text versions
      const textRes = await fetch(`/api/text/${campaignId}/versions`);
      if (textRes.ok) {
        const textData = await textRes.json();
        if (textData.length > 0) setTextContent(textData[0]);
      }

      // Fetch visuals
      const visualRes = await fetch(`/api/visuals/${campaignId}`);
      if (visualRes.ok) {
        const visualData = await visualRes.json();
        setVisuals(visualData.filter((v: Visual) => v.isSelected));
      }
    } catch {
      // Silently fail
    }
  };

  const getBrandDnaId = async (): Promise<string | null> => {
    try {
      const res = await fetch(`/api/brand-dna?workspaceId=00000000-0000-0000-0000-000000000001`);
      if (res.ok) {
        const data = await res.json();
        return data.id;
      }
    } catch {
      // Fail
    }
    return null;
  };

  const handleGenerate = async () => {
    if (!textContent) {
      setError('Contenu textuel requis. Retournez à l\'étape Texte.');
      return;
    }

    const brandDnaId = await getBrandDnaId();
    if (!brandDnaId) {
      setError('brand_dna_required');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/design/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          brandDnaId,
          textContentId: textContent.id,
          visualIds: visuals.map((v) => v.id),
          variants: 2,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Generation failed');
      }

      const designData = await res.json();
      setDesigns(designData);
      if (designData.length > 0) {
        setSelectedDesign(designData[0]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Design generation failed';
      setError(isBrandDnaMissingError(msg) ? 'brand_dna_required' : msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async (format: 'html' | 'mjml') => {
    if (!selectedDesign) return;

    try {
      const res = await fetch(`/api/design/${selectedDesign.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-design-v${selectedDesign.variantNumber}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Erreur lors de l\'export.');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-8">
      {/* Progress */}
      <ProgressSteps
        steps={steps}
        currentStep="design"
        completedSteps={['text', 'visuals']}
        onStepClick={(stepId) => {
          router.push(`/campaigns/${campaignId}/${stepId}`);
        }}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
          <Mail className="w-7 h-7 text-brand-600" />
          Design Email
        </h1>
        <p className="text-surface-500 mt-1">
          Générez le design final de votre email à partir de l&apos;ADN, du texte et des visuels.
        </p>
      </div>

      {/* Pre-generation checks */}
      {!textContent && (
        <Card className="border-yellow-200 bg-yellow-50" padding="md">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Contenu textuel manquant</p>
              <p className="text-sm text-yellow-600 mt-1">
                Créez d&apos;abord le contenu textuel de votre email.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Generate button */}
      {designs.length === 0 && (
        <Card variant="elevated" padding="lg" className="text-center">
          <div className="max-w-md mx-auto py-8">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-brand-600" />
            </div>
            <h2 className="text-xl font-bold text-surface-900 mb-2">
              Prêt à générer votre email ?
            </h2>
            <p className="text-sm text-surface-500 mb-6">
              L&apos;IA va assembler votre ADN de marque, contenu textuel et visuels
              pour créer 2 variantes de design email.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <Badge variant={textContent ? 'success' : 'danger'}>
                {textContent ? '✓' : '✗'} Texte
              </Badge>
              <Badge variant={visuals.length > 0 ? 'success' : 'warning'}>
                {visuals.length > 0 ? '✓' : '○'} {visuals.length} visuel{visuals.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <Button
              size="lg"
              onClick={handleGenerate}
              isLoading={isGenerating}
              disabled={!textContent}
            >
              <Sparkles className="w-4 h-4" />
              Générer le Design
            </Button>

            {isGenerating && (
              <div className="mt-6 flex items-center justify-center gap-3 text-brand-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Génération en cours... Cela peut prendre jusqu&apos;à 30 secondes.</span>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-3 rounded-lg px-4 py-2 bg-red-50 border border-red-100">
              {error === 'brand_dna_required' ? (
                <div className="text-sm text-red-800">
                  <p className="font-medium">ADN de marque requis</p>
                  <p className="mt-1 text-red-700">
                    Analysez d&apos;abord votre site dans <strong>ADN de Marque</strong> pour pouvoir générer le design. Les données sont réinitialisées après redémarrage du serveur.
                  </p>
                  <Link
                    href="/brand-dna"
                    className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-brand-600 hover:text-brand-700 underline"
                  >
                    Aller à ADN de Marque →
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Design variants */}
      {designs.length > 0 && (
        <>
          {/* Variant selector */}
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-surface-700">Variantes :</p>
            {designs.map((design) => (
              <button
                key={design.id}
                onClick={() => setSelectedDesign(design)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedDesign?.id === design.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                }`}
              >
                Variante {design.variantNumber}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2">
              {/* Preview mode toggle */}
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded-lg ${previewMode === 'desktop' ? 'bg-brand-100 text-brand-700' : 'text-surface-400'}`}
              >
                <Monitor className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded-lg ${previewMode === 'mobile' ? 'bg-brand-100 text-brand-700' : 'text-surface-400'}`}
              >
                <Smartphone className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Preview + Score */}
          <div className="grid grid-cols-3 gap-6">
            {/* Email preview */}
            <div className="col-span-2">
              <Card padding="none" className="overflow-hidden">
                <div className="bg-surface-100 px-4 py-2 border-b border-surface-200 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs text-surface-500 ml-2">
                    {previewMode === 'desktop' ? '600px' : '375px'} preview
                  </span>
                </div>
                <div
                  className="flex justify-center bg-surface-50 p-4"
                  style={{ minHeight: '500px' }}
                >
                  <div
                    className="bg-white shadow-lg border border-surface-200 overflow-auto"
                    style={{ width: previewMode === 'desktop' ? '600px' : '375px' }}
                  >
                    {selectedDesign?.htmlContent ? (
                      <iframe
                        srcDoc={selectedDesign.htmlContent}
                        className="w-full border-none"
                        style={{ minHeight: '600px' }}
                        title="Email preview"
                      />
                    ) : (
                      <div className="p-8 text-center text-surface-400">
                        <p>Aucun aperçu disponible</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Score & Export */}
            <div className="space-y-6">
              {/* Deliverability score */}
              {selectedDesign?.deliverabilityScore && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-brand-500" />
                      Score de délivrabilité
                    </CardTitle>
                  </CardHeader>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className={`text-4xl font-bold ${getScoreColor(selectedDesign.deliverabilityScore.overallScore)}`}>
                        {selectedDesign.deliverabilityScore.overallScore}
                      </p>
                      <p className="text-xs text-surface-400">Score global / 100</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Anti-spam', score: selectedDesign.deliverabilityScore.spamScore },
                        { label: 'Ratio texte/image', score: selectedDesign.deliverabilityScore.textImageRatio },
                        { label: 'Longueur objet', score: selectedDesign.deliverabilityScore.subjectLength },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-surface-600">{item.label}</span>
                            <span className={getScoreColor(item.score)}>{item.score}/100</span>
                          </div>
                          <div className="w-full h-1.5 bg-surface-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.score >= 80 ? 'bg-green-500' : item.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Export */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-brand-500" />
                    Exporter
                  </CardTitle>
                  <CardDescription>Téléchargez votre email dans le format souhaité.</CardDescription>
                </CardHeader>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleExport('html')}
                  >
                    HTML inline (prêt ESP)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleExport('mjml')}
                  >
                    Source MJML (éditable)
                  </Button>
                </div>
              </Card>

              {/* Regenerate */}
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleGenerate}
                isLoading={isGenerating}
              >
                <Sparkles className="w-4 h-4" />
                Régénérer les variantes
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/campaigns/${campaignId}/visuals`)}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour : Visuels
        </Button>
      </div>
    </div>
  );
}
