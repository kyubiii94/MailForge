import type { ModuleDef } from './types';
import { raw } from '../brand';

export interface HeroProps {
  title: string;
  text: string;
}

/** Hero — titre H2 + texte d'intro (porté du châssis FSRBO). */
export const heroModule: ModuleDef<HeroProps> = {
  type: 'hero',
  label: 'Hero',
  defaultProps: {
    title: 'Votre guide vendeur',
    text: 'Texte principal. Les balises <br> sont acceptées pour les sauts de ligne.',
  },
  fields: [
    { key: 'title', label: 'Titre (H2)', kind: 'text', placeholder: 'Votre guide vendeur' },
    { key: 'text', label: "Texte d'intro", kind: 'textarea', placeholder: '<br><br> accepté pour les sauts de ligne.' },
  ],
  render: (props, ctx) => {
    const { brand } = ctx;
    const html = `<table width="${brand.contentWidth}" cellpadding="0" cellspacing="0" align="center"><tr><td align="center" style="padding:0 0 16px 0;">
<h2 style="margin:0; font-family:${brand.fontFamily}; font-size:32px; font-weight:bold; color:${brand.ink};">${raw(props.title)}</h2>
</td></tr><tr><td align="center" style="padding:0 0 24px 0; font-family:${brand.fontFamily}; font-size:16px; color:${brand.ink};">${raw(props.text)}</td></tr></table>`;
    return { html, requiredAmpVars: [] };
  },
};
