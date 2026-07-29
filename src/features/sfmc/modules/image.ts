import type { ModuleDef } from './types';
import { raw } from '../brand';
import { ampVarFromLink } from './cta-button';

export interface ImageProps {
  src: string;
  alt: string;
  link: string;
}

/** Image pleine largeur (contenu), lien optionnel tracké. */
export const imageModule: ModuleDef<ImageProps> = {
  type: 'image',
  label: 'Image',
  toggleable: true,
  defaultProps: { src: '', alt: '', link: '' },
  fields: [
    { key: 'src', label: 'URL image', kind: 'url', placeholder: 'https://image.by.seloger.com/...' },
    { key: 'alt', label: 'Texte alternatif', kind: 'text' },
    { key: 'link', label: 'Lien (optionnel, token ou URL)', kind: 'text', placeholder: '@heroLink' },
  ],
  render: (props, ctx) => {
    const { brand } = ctx;
    if (!props.src) return { html: '', requiredAmpVars: [] };
    const img = `<img src="${props.src}" width="${brand.contentWidth}" alt="${raw(props.alt)}" border="0" style="display:block; width:100%; max-width:${brand.contentWidth}px; height:auto; border:0;" />`;
    const inner = props.link
      ? `<a href="%%=RedirectTo(${props.link})=%%" target="_blank">${img}</a>`
      : img;
    const html = `<table width="${brand.contentWidth}" cellpadding="0" cellspacing="0" align="center"><tr><td align="center" style="padding:16px 0;">${inner}</td></tr></table>`;
    return { html, requiredAmpVars: props.link ? ampVarFromLink(props.link) : [] };
  },
};
