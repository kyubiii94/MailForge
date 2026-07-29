import type { ModuleDef } from './types';
import { raw } from '../brand';
import { ampVarFromLink } from './cta-button';

export interface AdviceItem {
  img: string;
  title: string;
  text: string;
  linkLabel: string;
  linkUrl: string;
}

export interface AdviceProps {
  adviceTitle: string;
  items: AdviceItem[];
}

/** Bloc conseils répétable — porté de `adviceBlock` (FSRBO). */
export const adviceModule: ModuleDef<AdviceProps> = {
  type: 'advice',
  label: 'Bloc conseils',
  toggleable: true,
  defaultProps: {
    adviceTitle: "Les 3 piliers d'une vente réussie",
    items: [
      {
        img: 'https://image.by.seloger.com/lib/fe2311737364047b731d79/m/1/a385eb83-989c-4c47-bdd7-1df107a892e0.png',
        title: 'Fixer le «\u00a0juste prix\u00a0»',
        text: "Le piège n°1 de la vente entre particuliers : surestimer son bien par attachement émotionnel.",
        linkLabel: '',
        linkUrl: '',
      },
    ],
  },
  fields: [{ key: 'adviceTitle', label: 'Titre du bloc', kind: 'text', placeholder: "Les 3 piliers d'une vente réussie" }],
  render: (props, ctx) => {
    const { brand } = ctx;
    const items = (props.items || []).filter((i) => i.title || i.text);
    if (!items.length) return { html: '', requiredAmpVars: [] };

    const requiredAmpVars: string[] = [];
    const rows = items
      .map((it) => {
        if (it.linkLabel && it.linkUrl) requiredAmpVars.push(...ampVarFromLink(it.linkUrl));
        return `
      <tr>
        <td valign="top" width="15%" style="padding-bottom:16px; padding-right:16px;">
          <img src="${it.img}" width="100%" alt="${raw(it.title)}" border="0" style="display:block; width:100%; max-width:64px; height:auto; border:0;" />
        </td>
        <td valign="top" width="85%" style="font-family:${brand.fontFamily}; font-size:14px; line-height:22px; color:${brand.ink}; padding-bottom:16px;">
          <strong style="color:#131313;">${raw(it.title)}</strong> ${raw(it.text)}
          ${
            it.linkLabel && it.linkUrl
              ? `<br><a href="%%=RedirectTo(${it.linkUrl})=%%" target="_blank" style="color:${brand.red}; text-decoration:underline; font-weight:bold;">${raw(it.linkLabel)} &gt;</a>`
              : ''
          }
        </td>
      </tr>`;
      })
      .join('');

    const html = `<table width="${brand.contentWidth}" cellpadding="0" cellspacing="0" align="center"><tr><td style="margin:0; padding:24px 16px; background-color:${brand.paper}; border-radius:8px;" bgcolor="${brand.paper}" align="left">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
        <tr><td align="center" style="padding-bottom:20px; font-family:${brand.fontFamily}; font-size:18px; font-weight:bold; line-height:26px; color:#E1001A;">${raw(props.adviceTitle)}</td></tr>
      </table>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">${rows}</table>
    </td></tr></table>`;
    return { html, requiredAmpVars };
  },
};
