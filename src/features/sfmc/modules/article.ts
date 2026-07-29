import type { ModuleDef } from './types';
import { raw, type SelogerBrand } from '../brand';
import { ampVarFromLink } from './cta-button';

/** Gabarits d'affichage déterministes pour le bloc article / info. */
export type ArticleLayout = 'horizontal' | 'vertical' | 'editorial' | 'highlight' | 'banner';

export interface ArticleLayoutInfo {
  id: ArticleLayout;
  label: string;
  description: string;
}

/** Catalogue figé — l'IA choisit parmi ces ids, elle ne crée jamais de layout inventé. */
export const ARTICLE_LAYOUTS: ArticleLayoutInfo[] = [
  {
    id: 'horizontal',
    label: 'Carte horizontale',
    description: 'Vignette à gauche, titre + teaser + lien à droite (classique SeLoger).',
  },
  {
    id: 'vertical',
    label: 'Carte verticale',
    description: 'Grande image en haut, texte et CTA en dessous — impact visuel fort.',
  },
  {
    id: 'editorial',
    label: 'Éditorial',
    description: 'Mise en page magazine : titre dominant, teaser long, petite vignette.',
  },
  {
    id: 'highlight',
    label: 'Encadré accent',
    description: 'Bloc papier avec filet rouge SeLoger — idéal pour une info clé.',
  },
  {
    id: 'banner',
    label: 'Bannière info',
    description: 'Bandeau pleine largeur, image de fond légère et texte centré.',
  },
];

export const ARTICLE_LAYOUT_IDS = ARTICLE_LAYOUTS.map((l) => l.id);

export interface ArticleProps {
  title: string;
  teaser: string;
  img: string;
  link: string;
  layout: ArticleLayout;
}

const DEFAULT_IMG =
  'https://image.by.seloger.com/lib/fe2311737364047b731d79/m/1/a385eb83-989c-4c47-bdd7-1df107a892e0.png';

function resolveLayout(layout: unknown): ArticleLayout {
  return ARTICLE_LAYOUT_IDS.includes(layout as ArticleLayout) ? (layout as ArticleLayout) : 'horizontal';
}

function renderHorizontal(props: ArticleProps, brand: SelogerBrand, link: string, img: string): string {
  return `<table class="container-fluid" role="presentation" style="width:${brand.emailWidth}px;" bgcolor="#FFFFFF" border="0" cellpadding="0" cellspacing="0" width="${brand.emailWidth}" align="center"><tr><td style="padding:16px 0 32px;">
      <table class="container-90" role="presentation" style="border-radius:16px;background-color:${brand.paper}; width:${brand.contentWidth}px;" width="${brand.contentWidth}" bgcolor="${brand.paper}" cellspacing="0" cellpadding="0" border="0" align="center"><tr><td style="padding:24px;" align="center">
        <table width="${brand.contentWidth}" cellspacing="0" cellpadding="0" border="0" align="center"><tr>
          <th align="left" valign="top"><img src="${img}" width="128" height="128" alt="${raw(props.title)}" style="display:block; width:128px; height:auto; border-radius:8px;"></th>
          <th align="left" valign="middle" style="font-family:${brand.fontFamily}; padding-left:16px;">
            <a href="%%=RedirectTo(${link})=%%" target="_blank" style="text-decoration:none;"><strong style="font-size:18px; color:${brand.ink};">${raw(props.title)}</strong>
            <span style="display:block; padding:8px 0; font-size:15px; color:${brand.grey};">${raw(props.teaser)}</span></a>
            <a href="%%=RedirectTo(${link})=%%" target="_blank" style="color:#E30613; text-decoration:none; font-weight:bold;">Lire l'article complet&nbsp;→</a>
          </th>
        </tr></table>
      </td></tr></table>
    </td></tr></table>`;
}

function renderVertical(props: ArticleProps, brand: SelogerBrand, link: string, img: string): string {
  return `<table class="container-fluid" role="presentation" style="width:${brand.emailWidth}px;" bgcolor="#FFFFFF" border="0" cellpadding="0" cellspacing="0" width="${brand.emailWidth}" align="center"><tr><td style="padding:16px 0 32px;" align="center">
      <table class="container-90" role="presentation" style="border-radius:16px;background-color:${brand.paper}; width:${brand.contentWidth}px;" width="${brand.contentWidth}" bgcolor="${brand.paper}" cellspacing="0" cellpadding="0" border="0" align="center">
        <tr><td style="padding:0;" align="center">
          <a href="%%=RedirectTo(${link})=%%" target="_blank"><img src="${img}" width="${brand.contentWidth}" alt="${raw(props.title)}" style="display:block; width:100%; max-width:${brand.contentWidth}px; height:auto; border:0; border-radius:16px 16px 0 0;"></a>
        </td></tr>
        <tr><td style="padding:24px; font-family:${brand.fontFamily};" align="left">
          <a href="%%=RedirectTo(${link})=%%" target="_blank" style="text-decoration:none;"><strong style="font-size:20px; color:${brand.ink}; line-height:28px;">${raw(props.title)}</strong>
          <span style="display:block; padding:12px 0 16px; font-size:15px; color:${brand.grey}; line-height:22px;">${raw(props.teaser)}</span></a>
          <a href="%%=RedirectTo(${link})=%%" target="_blank" style="color:#E30613; text-decoration:none; font-weight:bold;">Lire l'article&nbsp;→</a>
        </td></tr>
      </table>
    </td></tr></table>`;
}

function renderEditorial(props: ArticleProps, brand: SelogerBrand, link: string, img: string): string {
  return `<table class="container-fluid" role="presentation" style="width:${brand.emailWidth}px;" bgcolor="#FFFFFF" border="0" cellpadding="0" cellspacing="0" width="${brand.emailWidth}" align="center"><tr><td style="padding:16px 40px 32px;" align="center">
      <table width="${brand.contentWidth}" cellspacing="0" cellpadding="0" border="0" align="center">
        <tr><td style="font-family:${brand.fontFamily}; padding-bottom:12px;">
          <span style="display:inline-block; font-size:11px; font-weight:bold; letter-spacing:0.08em; text-transform:uppercase; color:${brand.red};">À lire sur SeLoger</span>
        </td></tr>
        <tr><td style="font-family:${brand.fontFamily};">
          <a href="%%=RedirectTo(${link})=%%" target="_blank" style="text-decoration:none;"><strong style="font-size:24px; color:${brand.ink}; line-height:32px;">${raw(props.title)}</strong></a>
        </td></tr>
        <tr><td style="padding:16px 0;">
          <table width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
            <td width="72" valign="top"><img src="${img}" width="64" height="64" alt="" style="display:block; width:64px; height:64px; border-radius:8px; object-fit:cover;"></td>
            <td valign="top" style="font-family:${brand.fontFamily}; font-size:15px; line-height:24px; color:${brand.grey}; padding-left:16px;">${raw(props.teaser)}<br>
              <a href="%%=RedirectTo(${link})=%%" target="_blank" style="color:#E30613; text-decoration:none; font-weight:bold;">Continuer la lecture&nbsp;→</a>
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr></table>`;
}

function renderHighlight(props: ArticleProps, brand: SelogerBrand, link: string, img: string): string {
  return `<table class="container-fluid" role="presentation" style="width:${brand.emailWidth}px;" bgcolor="#FFFFFF" border="0" cellpadding="0" cellspacing="0" width="${brand.emailWidth}" align="center"><tr><td style="padding:16px 0 32px;" align="center">
      <table class="container-90" role="presentation" style="width:${brand.contentWidth}px; border-left:4px solid ${brand.red}; background-color:${brand.paper}; border-radius:0 12px 12px 0;" width="${brand.contentWidth}" bgcolor="${brand.paper}" cellspacing="0" cellpadding="0" border="0" align="center">
        <tr><td style="padding:20px 24px;">
          <table width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
            <td width="80" valign="middle"><img src="${img}" width="72" alt="${raw(props.title)}" style="display:block; width:72px; height:auto; border-radius:8px;"></td>
            <td valign="middle" style="font-family:${brand.fontFamily}; padding-left:16px;">
              <strong style="font-size:17px; color:${brand.ink};">${raw(props.title)}</strong>
              <span style="display:block; padding:6px 0 10px; font-size:14px; color:${brand.grey}; line-height:20px;">${raw(props.teaser)}</span>
              <a href="%%=RedirectTo(${link})=%%" target="_blank" style="color:#E30613; text-decoration:none; font-weight:bold; font-size:14px;">En savoir plus&nbsp;→</a>
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr></table>`;
}

function renderBanner(props: ArticleProps, brand: SelogerBrand, link: string, img: string): string {
  return `<table class="container-fluid" role="presentation" style="width:${brand.emailWidth}px;" bgcolor="#FFFFFF" border="0" cellpadding="0" cellspacing="0" width="${brand.emailWidth}" align="center"><tr><td style="padding:16px 0 32px;" align="center">
      <table role="presentation" width="${brand.contentWidth}" cellspacing="0" cellpadding="0" border="0" align="center" style="border-radius:16px; overflow:hidden;">
        <tr><td background="${img}" bgcolor="${brand.ink}" width="${brand.contentWidth}" valign="middle" style="background-image:url(${img}); background-size:cover; background-position:center;">
          <!--[if gte mso 9]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:${brand.contentWidth}px;height:200px;"><v:fill type="frame" src="${img}" /><v:textbox inset="0,0,0,0"><![endif]-->
          <div>
            <table width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
              <td align="center" style="padding:40px 28px; background-color:rgba(50,50,50,0.72); font-family:${brand.fontFamily};">
                <strong style="display:block; font-size:22px; line-height:30px; color:#FFFFFF; padding-bottom:10px;">${raw(props.title)}</strong>
                <span style="display:block; font-size:15px; line-height:22px; color:#F0F0F0; padding-bottom:18px;">${raw(props.teaser)}</span>
                <a href="%%=RedirectTo(${link})=%%" target="_blank" style="display:inline-block; background:${brand.red}; color:#FFFFFF; text-decoration:none; font-weight:bold; font-size:14px; padding:10px 22px; border-radius:25px;">Découvrir</a>
              </td>
            </tr></table>
          </div>
          <!--[if gte mso 9]></v:textbox></v:rect><![endif]-->
        </td></tr>
      </table>
    </td></tr></table>`;
}

/** Bloc article de blog — layouts déterministes (jamais générés par l'IA). */
export const articleModule: ModuleDef<ArticleProps> = {
  type: 'article',
  label: 'Bloc article de blog',
  toggleable: true,
  defaultProps: {
    title: "Retrouvez ici l'article complet sur...",
    teaser: '',
    img: DEFAULT_IMG,
    link: '@articleLink',
    layout: 'horizontal',
  },
  fields: [
    {
      key: 'layout',
      label: 'Template d\'affichage',
      kind: 'select',
      options: ARTICLE_LAYOUTS.map((l) => ({ value: l.id, label: l.label })),
      hint: 'Gabarits déterministes SeLoger — proposés aussi par l\'assistant IA.',
    },
    { key: 'title', label: 'Titre', kind: 'text', placeholder: "Retrouvez ici l'article complet sur..." },
    { key: 'teaser', label: 'Teaser', kind: 'textarea', placeholder: "Phrase d'accroche courte" },
    { key: 'img', label: 'URL image', kind: 'url', placeholder: 'https://image.by.seloger.com/...' },
    { key: 'link', label: 'Lien (token AMPscript ou URL)', kind: 'text', placeholder: '@articleLink' },
  ],
  render: (props, ctx) => {
    const { brand } = ctx;
    const link = props.link || '@articleLink';
    const img = props.img || DEFAULT_IMG;
    const layout = resolveLayout(props.layout);
    const html =
      layout === 'vertical'
        ? renderVertical(props, brand, link, img)
        : layout === 'editorial'
          ? renderEditorial(props, brand, link, img)
          : layout === 'highlight'
            ? renderHighlight(props, brand, link, img)
            : layout === 'banner'
              ? renderBanner(props, brand, link, img)
              : renderHorizontal(props, brand, link, img);
    return { html, requiredAmpVars: ampVarFromLink(link) };
  },
};
