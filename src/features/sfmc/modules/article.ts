import type { ModuleDef } from './types';
import { raw } from '../brand';
import { ampVarFromLink } from './cta-button';

export interface ArticleProps {
  title: string;
  teaser: string;
  img: string;
  link: string;
}

/** Bloc article de blog — porté de `articleBlock` (FSRBO). */
export const articleModule: ModuleDef<ArticleProps> = {
  type: 'article',
  label: 'Bloc article de blog',
  toggleable: true,
  defaultProps: {
    title: "Retrouvez ici l'article complet sur...",
    teaser: '',
    img: '',
    link: '@articleLink',
  },
  fields: [
    { key: 'title', label: 'Titre du lien', kind: 'text', placeholder: "Retrouvez ici l'article complet sur..." },
    { key: 'teaser', label: 'Teaser', kind: 'textarea', placeholder: "Phrase d'accroche courte" },
    { key: 'img', label: 'URL image', kind: 'url', placeholder: 'https://image.by.seloger.com/...' },
    { key: 'link', label: 'Lien (token AMPscript ou URL)', kind: 'text', placeholder: '@articleLink' },
  ],
  render: (props, ctx) => {
    const { brand } = ctx;
    const link = props.link || '@articleLink';
    const html = `<table class="container-fluid" role="presentation" style="width:${brand.emailWidth}px;" bgcolor="#FFFFFF" border="0" cellpadding="0" cellspacing="0" width="${brand.emailWidth}" align="center"><tr><td style="padding:16px 0 32px;">
      <table class="container-90" role="presentation" style="border-radius:16px;background-color:${brand.paper}; width:${brand.contentWidth}px;" width="${brand.contentWidth}" bgcolor="${brand.paper}" cellspacing="0" cellpadding="0" border="0" align="center"><tr><td style="padding:24px;" align="center">
        <table width="${brand.contentWidth}" cellspacing="0" cellpadding="0" border="0" align="center"><tr>
          <th align="left" valign="top"><img src="${props.img}" width="128" height="128" alt="${raw(props.title)}" style="display:block; width:128px; height:auto; border-radius:8px;"></th>
          <th align="left" valign="middle" style="font-family:${brand.fontFamily}; padding-left:16px;">
            <a href="%%=RedirectTo(${link})=%%" target="_blank" style="text-decoration:none;"><strong style="font-size:18px; color:${brand.ink};">${raw(props.title)}</strong>
            <span style="display:block; padding:8px 0; font-size:15px; color:${brand.grey};">${raw(props.teaser)}</span></a>
            <a href="%%=RedirectTo(${link})=%%" target="_blank" style="color:#E30613; text-decoration:none; font-weight:bold;">Lire l'article complet&nbsp;→</a>
          </th>
        </tr></table>
      </td></tr></table>
    </td></tr></table>`;
    return { html, requiredAmpVars: ampVarFromLink(link) };
  },
};
