import Link from 'next/link';
import { Zap, Dna, Type, Image, Mail, ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-50">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-brand opacity-[0.03]" />
        <div className="max-w-5xl mx-auto px-6 py-20 text-center relative">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Plateforme IA de Génération d&apos;Emails
          </div>

          <h1 className="text-5xl font-bold text-surface-900 mb-4 leading-tight">
            Créez des emails marketing<br />
            <span className="gradient-text">alignés avec votre marque</span>
          </h1>

          <p className="text-lg text-surface-600 mb-10 max-w-2xl mx-auto">
            MailForge AI analyse l&apos;ADN de votre marque et génère des emails marketing
            parfaitement cohérents, en quelques minutes.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/brand-dna"
              className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/25"
            >
              Commencer
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-2 bg-white text-surface-700 px-6 py-3 rounded-lg font-medium hover:bg-surface-50 transition-colors border border-surface-200"
            >
              Mes Campagnes
            </Link>
          </div>
        </div>
      </header>

      {/* Modules */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-surface-900 text-center mb-12">
          4 Modules Intelligents
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              icon: Dna,
              title: 'ADN de Marque',
              description: 'Extraction automatique de l\'identité complète depuis votre site web : typographie, couleurs, ton éditorial, style visuel.',
              href: '/brand-dna',
              color: 'from-purple-500 to-indigo-600',
            },
            {
              icon: Type,
              title: 'Contenu Textuel',
              description: 'Texte existant, brouillon amélioré par Claude AI, ou extraction depuis une URL. 3 options flexibles.',
              href: '/campaigns',
              color: 'from-blue-500 to-cyan-600',
            },
            {
              icon: Image,
              title: 'Contenu Visuel',
              description: 'Upload direct, génération IA via Gemini, ou extraction depuis une page. Optimisation auto pour email.',
              href: '/campaigns',
              color: 'from-emerald-500 to-teal-600',
            },
            {
              icon: Mail,
              title: 'Design Email',
              description: 'Assemblage intelligent ADN + Texte + Visuels. Génération de variantes, prévisualisation multi-device.',
              href: '/campaigns',
              color: 'from-orange-500 to-red-600',
            },
          ].map((module) => (
            <Link
              key={module.title}
              href={module.href}
              className="group relative bg-white rounded-2xl border border-surface-200 p-6 hover:shadow-lg hover:border-surface-300 transition-all duration-300"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} mb-4`}>
                <module.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 mb-2">{module.title}</h3>
              <p className="text-sm text-surface-500 leading-relaxed">{module.description}</p>
              <div className="mt-4 text-brand-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                Ouvrir <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
