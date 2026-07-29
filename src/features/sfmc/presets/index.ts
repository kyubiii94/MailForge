import type { SfmcEmailConfig, SfmcCampaignType, CampaignTypeInfo } from '../types';
import { SELOGER_BASE_PROFILE, FSRBO_AMPSCRIPT_PROFILE, cloneProfile } from '../ampscript/seloger-defaults';
import type { AmpscriptProfile } from '../ampscript/profile';
import { inst, TROIS_PILIERS } from './helpers';
import { fsrboEmails } from './fsrbo';

export interface CampaignPreset {
  info: CampaignTypeInfo;
  emails: () => SfmcEmailConfig[];
}

interface SimpleEmailArgs {
  name: string;
  sequenceStep?: string;
  subject: string;
  preheader: string;
  utmTrigger: string;
  footerRef: string;
  heroTitle: string;
  heroText: string;
  ctaLabel: string;
  ctaLink?: string;
  profile?: AmpscriptProfile;
  withAdvice?: boolean;
  withArticle?: boolean;
  cloudPage?: boolean;
}

function simpleEmail(a: SimpleEmailArgs): SfmcEmailConfig {
  const modules = [
    inst('hero', { title: a.heroTitle, text: a.heroText }),
    inst('cta', { label: a.ctaLabel, style: 'red', link: a.ctaLink ?? '@heroLink', name: 'cta_hero' }),
  ];
  if (a.withAdvice) modules.push(inst('advice', { adviceTitle: 'Nos conseils', items: TROIS_PILIERS.slice(0, 2) }));
  if (a.withArticle) modules.push(inst('article', {}));
  return {
    name: a.name,
    sequenceStep: a.sequenceStep ?? 'J0',
    subject: a.subject,
    preheader: a.preheader,
    utmTrigger: a.utmTrigger,
    footerRef: a.footerRef,
    cloudPage: a.cloudPage ?? false,
    ampscript: cloneProfile(a.profile ?? SELOGER_BASE_PROFILE),
    modules,
  };
}

export const CAMPAIGN_PRESETS: Record<SfmcCampaignType, CampaignPreset> = {
  fsrbo: {
    info: {
      type: 'fsrbo',
      label: 'Estimation vendeurs (FSRBO)',
      description: 'Séquence email SeLoger J+1 → J+30 après une estimation particulière.',
      icon: '🏡',
      category: 'parcours',
    },
    emails: fsrboEmails,
  },
  'newsletter-crm': {
    info: {
      type: 'newsletter-crm',
      label: 'Newsletter CRM SeLoger',
      description: 'Newsletter relationnelle : actus, conseils et nouveautés SeLoger.',
      icon: '📰',
      category: 'newsletter',
    },
    emails: () => [
      simpleEmail({
        name: 'Newsletter CRM SeLoger',
        subject: 'Vos actus SeLoger du mois',
        preheader: 'Conseils, tendances et nouveautés immobilières.',
        utmTrigger: 'newsletter-crm',
        footerRef: 'NLCRM',
        heroTitle: 'Le meilleur de SeLoger ce mois-ci',
        heroText: 'Une sélection de conseils et d\u2019actualités pour votre projet immobilier.',
        ctaLabel: 'Découvrir',
        withArticle: true,
      }),
    ],
  },
  'newsletter-immobiliere': {
    info: {
      type: 'newsletter-immobiliere',
      label: 'Newsletter immobilière',
      description: 'Tendances du marché et opportunités près de chez vos contacts.',
      icon: '📈',
      category: 'newsletter',
    },
    emails: () => [
      simpleEmail({
        name: 'Newsletter immobilière SeLoger',
        subject: 'Les tendances du marché près de chez vous',
        preheader: 'Prix, demande, opportunités : le point du mois.',
        utmTrigger: 'newsletter-immo',
        footerRef: 'NLIMMO',
        heroTitle: 'Tendances du marché immobilier',
        heroText: 'Suivez l\u2019évolution des prix et repérez les meilleures opportunités.',
        ctaLabel: 'Voir les biens',
        withArticle: true,
      }),
    ],
  },
  engagement: {
    info: {
      type: 'engagement',
      label: 'Email d\u2019engagement',
      description: 'Relance douce pour faire avancer un projet immobilier SeLoger.',
      icon: '💬',
      category: 'email',
    },
    emails: () => [
      simpleEmail({
        name: 'Email d\u2019engagement SeLoger',
        subject: 'Où en êtes-vous de votre projet ?',
        preheader: 'On vous accompagne, étape par étape.',
        utmTrigger: 'engagement',
        footerRef: 'ENG',
        heroTitle: 'Reprenons votre projet ensemble',
        heroText: 'Quelques ressources utiles pour avancer sereinement.',
        ctaLabel: 'Continuer mon projet',
        withAdvice: true,
      }),
    ],
  },
  vendeurs: {
    info: {
      type: 'vendeurs',
      label: 'Email vendeurs',
      description: 'Conseils vente, estimation et agences SeLoger.',
      icon: '🔑',
      category: 'email',
    },
    emails: () => [
      simpleEmail({
        name: 'Email vendeurs SeLoger',
        subject: 'Vendez votre bien dans les meilleures conditions',
        preheader: 'Estimation, prix, visibilité : nos conseils.',
        utmTrigger: 'vendeurs',
        footerRef: 'VEND',
        heroTitle: 'Réussissez votre vente',
        heroText: 'Tous nos conseils pour vendre vite et au bon prix.',
        ctaLabel: 'Estimer mon bien',
        ctaLink: '@fsrboLink',
        profile: FSRBO_AMPSCRIPT_PROFILE,
        withAdvice: true,
      }),
    ],
  },
  acheteurs: {
    info: {
      type: 'acheteurs',
      label: 'Email acheteurs',
      description: 'Alertes biens et conseils achat SeLoger.',
      icon: '🔎',
      category: 'email',
    },
    emails: () => [
      simpleEmail({
        name: 'Email acheteurs SeLoger',
        subject: 'De nouveaux biens correspondent à votre recherche',
        preheader: 'Ne manquez pas les nouvelles annonces.',
        utmTrigger: 'acheteurs',
        footerRef: 'ACH',
        heroTitle: 'Votre prochain chez-vous vous attend',
        heroText: 'Découvrez les dernières annonces qui correspondent à vos critères.',
        ctaLabel: 'Voir les annonces',
        withArticle: true,
      }),
    ],
  },
  journey: {
    info: {
      type: 'journey',
      label: 'Parcours multi-emails',
      description: 'Séquence SeLoger en plusieurs étapes (Journey Builder).',
      icon: '🧭',
      category: 'parcours',
    },
    emails: () => [
      simpleEmail({
        name: 'Journey — Étape 1 : Bienvenue',
        sequenceStep: 'E1',
        subject: 'Bienvenue chez SeLoger',
        preheader: 'Faisons connaissance.',
        utmTrigger: 'journey_e1',
        footerRef: 'JRN',
        heroTitle: 'Bienvenue !',
        heroText: 'Voici comment tirer le meilleur de SeLoger.',
        ctaLabel: 'Commencer',
      }),
      simpleEmail({
        name: 'Journey — Étape 2 : Conseils',
        sequenceStep: 'E2',
        subject: 'Nos meilleurs conseils pour votre projet',
        preheader: 'Des ressources utiles.',
        utmTrigger: 'journey_e2',
        footerRef: 'JRN',
        heroTitle: 'Avancez sereinement',
        heroText: 'Nos conseils pour concrétiser votre projet.',
        ctaLabel: 'Lire les conseils',
        withAdvice: true,
      }),
      simpleEmail({
        name: 'Journey — Étape 3 : Passer à l\u2019action',
        sequenceStep: 'E3',
        subject: 'Prêt à passer à l\u2019étape suivante ?',
        preheader: 'On vous accompagne.',
        utmTrigger: 'journey_e3',
        footerRef: 'JRN',
        heroTitle: 'Passez à l\u2019action',
        heroText: 'Il est temps de concrétiser votre projet immobilier.',
        ctaLabel: 'Continuer',
      }),
    ],
  },
  trigger: {
    info: {
      type: 'trigger',
      label: 'Email déclenché',
      description: 'Email SeLoger déclenché par une action utilisateur.',
      icon: '⚡',
      category: 'email',
    },
    emails: () => [
      simpleEmail({
        name: 'Email déclenché SeLoger',
        subject: 'Une action vous attend',
        preheader: 'Suite à votre activité récente.',
        utmTrigger: 'trigger',
        footerRef: 'TRIG',
        heroTitle: 'Suite à votre activité',
        heroText: 'Voici la prochaine étape recommandée pour vous.',
        ctaLabel: 'Voir maintenant',
        cloudPage: true,
      }),
    ],
  },
  reactivation: {
    info: {
      type: 'reactivation',
      label: 'Email de réactivation',
      description: 'Win-back des contacts SeLoger inactifs.',
      icon: '💌',
      category: 'email',
    },
    emails: () => [
      simpleEmail({
        name: 'Email de réactivation SeLoger',
        subject: 'Vous nous avez manqué',
        preheader: 'Reprenons votre projet là où vous l\u2019aviez laissé.',
        utmTrigger: 'reactivation',
        footerRef: 'REACT',
        heroTitle: 'Ça fait un moment !',
        heroText: 'Votre projet immobilier vous attend. Reprenons ensemble.',
        ctaLabel: 'Revenir sur SeLoger',
        withAdvice: true,
      }),
    ],
  },
  'lead-nurturing': {
    info: {
      type: 'lead-nurturing',
      label: 'Lead nurturing',
      description: 'Maturation progressive d\u2019un lead immobilier SeLoger.',
      icon: '🌱',
      category: 'email',
    },
    emails: () => [
      simpleEmail({
        name: 'Lead nurturing SeLoger',
        subject: 'Des ressources pour bien préparer votre projet',
        preheader: 'On vous aide à y voir plus clair.',
        utmTrigger: 'nurturing',
        footerRef: 'NURT',
        heroTitle: 'Préparez votre projet en confiance',
        heroText: 'Guides, conseils et outils pour avancer à votre rythme.',
        ctaLabel: 'Explorer les guides',
        withArticle: true,
      }),
    ],
  },
  transactionnel: {
    info: {
      type: 'transactionnel',
      label: 'Email transactionnel',
      description: 'Confirmation ou notification de service SeLoger.',
      icon: '📩',
      category: 'email',
    },
    emails: () => [
      simpleEmail({
        name: 'Email transactionnel SeLoger',
        subject: 'Confirmation de votre demande',
        preheader: 'Voici le récapitulatif de votre demande.',
        utmTrigger: 'transactionnel',
        footerRef: 'TX',
        heroTitle: 'Votre demande est confirmée',
        heroText: 'Merci ! Voici les détails de votre demande.',
        ctaLabel: 'Voir le détail',
      }),
    ],
  },
  libre: {
    info: {
      type: 'libre',
      label: 'Email libre SeLoger',
      description: 'Partir d\u2019un châssis SeLoger vierge à composer librement.',
      icon: '✏️',
      category: 'email',
    },
    emails: () => [
      {
        name: 'Nouvel email SeLoger',
        sequenceStep: 'J0',
        subject: 'Nouveau sujet',
        preheader: '',
        utmTrigger: 'libre',
        footerRef: 'LIBRE',
        cloudPage: false,
        ampscript: cloneProfile(SELOGER_BASE_PROFILE),
        modules: [inst('hero', {})],
      },
    ],
  },
};

export const PRESET_CATEGORIES: {
  id: import('../types').SfmcPresetCategory;
  label: string;
  description: string;
}[] = [
  {
    id: 'newsletter',
    label: 'Newsletters',
    description: 'Envois récurrents SeLoger (CRM, marché immobilier).',
  },
  {
    id: 'email',
    label: 'Emails CRM',
    description: 'Emails one-shot : vendeurs, acheteurs, réactivation, triggers…',
  },
  {
    id: 'parcours',
    label: 'Parcours',
    description: 'Séquences multi-emails SeLoger (FSRBO, Journey).',
  },
];

export const CAMPAIGN_TYPES: CampaignTypeInfo[] = Object.values(CAMPAIGN_PRESETS).map((p) => p.info);

export function getPreset(type: SfmcCampaignType): CampaignPreset {
  return CAMPAIGN_PRESETS[type] ?? CAMPAIGN_PRESETS.libre;
}
