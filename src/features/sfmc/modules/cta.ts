import type { ModuleDef } from './types';
import { ctaButton, ampVarFromLink, type CtaStyle } from './cta-button';

export interface CtaProps {
  label: string;
  style: CtaStyle;
  link: string;
  name: string;
}

/** CTA autonome (bouton centré) — porté du FSRBO. */
export const ctaModule: ModuleDef<CtaProps> = {
  type: 'cta',
  label: 'Bouton CTA',
  toggleable: true,
  defaultProps: {
    label: 'Accéder au guide complet',
    style: 'red',
    link: '@fsrboLink',
    name: 'cta_hero',
  },
  fields: [
    { key: 'label', label: 'Libellé', kind: 'text', placeholder: 'Accéder au guide complet' },
    {
      key: 'style',
      label: 'Style',
      kind: 'select',
      options: [
        { value: 'red', label: 'Rouge plein' },
        { value: 'outline', label: 'Contour noir' },
      ],
    },
    { key: 'link', label: 'Lien (token AMPscript ou URL)', kind: 'text', placeholder: '@fsrboLink' },
    { key: 'name', label: 'Nom / alias (tracking)', kind: 'text', placeholder: 'cta_hero' },
  ],
  render: (props, ctx) => {
    const { brand } = ctx;
    const link = props.link || '@fsrboLink';
    const html = `<table width="${brand.contentWidth}" cellpadding="0" cellspacing="0" align="center"><tr><td align="center" style="padding-bottom:16px;">${ctaButton(
      props.label,
      props.style,
      link,
      props.name || 'cta',
      brand
    )}</td></tr></table>`;
    return { html, requiredAmpVars: ampVarFromLink(link) };
  },
};
