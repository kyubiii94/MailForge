import Link from 'next/link';
import { Zap, PenLine, FolderOpen, Mail, ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-50">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-brand opacity-[0.03]" />
        <div className="max-w-5xl mx-auto px-6 py-20 text-center relative">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Plateforme IA de Campagnes Newsletter
          </div>

          <h1 className="text-5xl font-bold text-surface-900 mb-4 leading-tight">
            Créez des campagnes newsletter<br />
            <span className="gradient-text">complètes en quelques minutes</span>
          </h1>

          <p className="text-lg text-surface-600 mb-10 max-w-2xl mx-auto">
            MailForge génère des newsletters HTML/MJML professionnelles à partir de votre brief.
            8 types de templates, design system cohérent, prêt à envoyer.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/brief"
              className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/25"
            >
              Créer une campagne
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

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-surface-900 text-center mb-12">
          Comment ça marche
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: PenLine,
              step: '1',
              title: 'Brief',
              description: 'Décrivez votre marque et objectifs, ou fournissez une URL. L\'IA génère un ADN de campagne complet.',
              color: 'from-purple-500 to-indigo-600',
            },
            {
              icon: Zap,
              step: '2',
              title: 'Génération',
              description: 'Sélectionnez parmi 8 types de newsletters. L\'IA crée le design, le contenu et le code HTML en un passage.',
              color: 'from-brand-500 to-emerald-600',
            },
            {
              icon: Mail,
              step: '3',
              title: 'Export',
              description: 'Prévisualisez, éditez et exportez vos templates en HTML ou MJML. Prêt pour votre ESP.',
              color: 'from-orange-500 to-red-600',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="relative bg-white rounded-2xl border border-surface-200 p-6 text-center"
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} mb-4`}>
                <item.icon className="w-7 h-7 text-white" />
              </div>
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center text-sm font-bold text-surface-400">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-surface-900 mb-2">{item.title}</h3>
              <p className="text-sm text-surface-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-lg font-semibold text-surface-900 mb-4">8 types de newsletters</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {['Welcome', 'Product Launch', 'Editorial', 'Promotion', 'Social Proof', 'Event', 'Win-back', 'Master Template'].map((type) => (
              <span
                key={type}
                className="px-4 py-2 rounded-full bg-white border border-surface-200 text-sm text-surface-600 font-medium"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
