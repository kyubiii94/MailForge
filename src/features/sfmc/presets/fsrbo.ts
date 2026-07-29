import type { SfmcEmailConfig } from '../types';
import { FSRBO_AMPSCRIPT_PROFILE, cloneProfile } from '../ampscript/seloger-defaults';
import { inst, TROIS_PILIERS } from './helpers';

interface FsrboVariant {
  sequenceStep: string;
  name: string;
  subject: string;
  preheader: string;
  utmTrigger: string;
  heroTitle: string;
  heroText: string;
  ctaLabel: string;
  adviceTitle: string;
}

const VARIANTS: FsrboVariant[] = [
  {
    sequenceStep: 'J1',
    name: 'FSRBO J+1 — Votre estimation, et après ?',
    subject: 'Votre estimation est prête : les prochaines étapes',
    preheader: 'Vendez au meilleur prix, sans intermédiaire.',
    utmTrigger: 'estimation-fsbo_j1',
    heroTitle: 'Votre estimation, et après ?',
    heroText:
      "Vous venez d'estimer votre bien. Voici comment transformer cette estimation en une vente réussie, à votre rythme.",
    ctaLabel: 'Accéder à mon guide vendeur',
    adviceTitle: "Les 3 piliers d'une vente réussie",
  },
  {
    sequenceStep: 'J7',
    name: 'FSRBO J+7 — Le juste prix',
    subject: 'Vendre au juste prix : le secret des annonces qui marchent',
    preheader: "Un bon prix, c'est plus de contacts qualifiés.",
    utmTrigger: 'estimation-fsbo_j7',
    heroTitle: 'Le juste prix change tout',
    heroText:
      'Un bien correctement estimé se vend plus vite et attire des acheteurs sérieux. Revoyons ensemble votre stratégie de prix.',
    ctaLabel: 'Réviser mon estimation',
    adviceTitle: 'Bien fixer son prix de vente',
  },
  {
    sequenceStep: 'J15',
    name: 'FSRBO J+15 — Une annonce qui convertit',
    subject: 'Photos, description : créez une annonce qui donne envie',
    preheader: 'Les détails qui déclenchent les visites.',
    utmTrigger: 'estimation-fsbo_j15',
    heroTitle: 'Une annonce qui donne envie',
    heroText:
      "De belles photos et une description complète multiplient vos demandes de visite. Voici nos conseils pour vous démarquer.",
    ctaLabel: 'Compléter mon annonce',
    adviceTitle: 'Réussir son annonce',
  },
  {
    sequenceStep: 'J30',
    name: 'FSRBO J+30 — Besoin d\u2019un coup de main ?',
    subject: 'Vendre seul ou accompagné : à vous de choisir',
    preheader: 'Un professionnel peut sécuriser votre vente.',
    utmTrigger: 'estimation-fsbo_j30',
    heroTitle: "Besoin d'un accompagnement ?",
    heroText:
      "Vendre entre particuliers est possible, mais parfois un coup de main fait gagner du temps. Découvrez les agences de votre secteur.",
    ctaLabel: 'Publier mon annonce',
    adviceTitle: 'Aller plus loin',
  },
];

function buildFsrboEmail(v: FsrboVariant): SfmcEmailConfig {
  return {
    name: v.name,
    sequenceStep: v.sequenceStep,
    subject: v.subject,
    preheader: v.preheader,
    utmTrigger: v.utmTrigger,
    footerRef: 'FSRBO',
    cloudPage: false,
    ampscript: cloneProfile(FSRBO_AMPSCRIPT_PROFILE),
    modules: [
      inst('hero', { title: v.heroTitle, text: v.heroText }),
      inst('cta', { label: v.ctaLabel, style: 'red', link: '@fsrboLink', name: 'cta_hero' }),
      inst('advice', { adviceTitle: v.adviceTitle, items: TROIS_PILIERS }),
      inst('price-card', {}),
      inst('agence', {}),
      inst('article', {}, false),
      inst('cta', { label: 'Publier mon annonce gratuitement', style: 'outline', link: '@fsrboLink', name: 'cta_final' }),
    ],
  };
}

/** Séquence FSRBO complète (J+1, J+7, J+15, J+30). */
export function fsrboEmails(): SfmcEmailConfig[] {
  return VARIANTS.map(buildFsrboEmail);
}
