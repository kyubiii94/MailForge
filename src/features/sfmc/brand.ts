/**
 * Constantes de marque SeLoger — portées fidèlement du générateur FSRBO.
 * Source de vérité visuelle (couleurs, police CeraSL, largeurs, logo, footer légal).
 * Ne pas modifier sans validation CRM : ces valeurs conditionnent la conformité SFMC.
 */

export interface SelogerBrand {
  red: string;
  ink: string;
  grey: string;
  paper: string;
  line: string;
  emailWidth: number;
  contentWidth: number;
  fontFamily: string;
  logoUrl: string;
  logoWidth: number;
  fontFaces: string;
  legal: {
    company: string;
    address: string;
  };
}

export const SELOGER_BRAND: SelogerBrand = {
  red: '#E30513',
  ink: '#323232',
  grey: '#646464',
  paper: '#F9F9F9',
  line: '#E0E0E0',
  emailWidth: 640,
  contentWidth: 560,
  fontFamily: "'CeraSL', Helvetica, Arial, sans-serif",
  logoUrl:
    'https://image.by.seloger.com/lib/fe2311737364047b731d79/m/1/eadcb611-0848-4dad-a9aa-3e8a3513263c.png',
  logoWidth: 149,
  fontFaces: `@font-face{font-family:'CeraSL'; font-weight:400; src:url(https://website-assets.seloger.com/commons/fonts/cera-sl/CeraSLsys-Regular.woff2) format('woff2');}
@font-face{font-family:'CeraSL'; font-weight:700; src:url(https://website-assets.seloger.com/commons/fonts/cera-sl/CeraSLsys-Bold.woff2) format('woff2');}`,
  legal: {
    company: 'SeLoger / Digital Classifieds France',
    address: '2-8, rue des Italiens · 75009 Paris',
  },
};

/** Client unique de la plateforme. */
export const SELOGER_CLIENT = {
  id: 'seloger',
  name: 'SeLoger',
  segment: 'CRM B2C',
} as const;

/** Échappe le HTML (équivalent `esc` du FSRBO). */
export function esc(s: string | undefined | null): string {
  return (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Passe la valeur telle quelle (équivalent `raw` du FSRBO — accepte les <br> et tokens). */
export function raw(s: string | undefined | null): string {
  return s || '';
}
