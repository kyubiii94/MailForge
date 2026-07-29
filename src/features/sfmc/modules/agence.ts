import type { ModuleDef } from './types';
import { raw } from '../brand';
import { ctaButton } from './cta-button';

export interface AgenceProps {
  title: string;
  text: string;
  cta: string;
}

/** Bloc agence — porté de `agenceBlock` (FSRBO). Lien via @agencelink. */
export const agenceModule: ModuleDef<AgenceProps> = {
  type: 'agence',
  label: 'Bloc agence',
  toggleable: true,
  defaultProps: {
    title: 'Vous souhaitez finalement vendre votre bien via une agence ?',
    text: 'Découvrez les agences dans votre secteur et bénéficiez d\u2019un accompagnement personnalisé.',
    cta: 'Trouver mon agence',
  },
  fields: [
    { key: 'title', label: 'Titre', kind: 'text' },
    { key: 'text', label: 'Sous-texte', kind: 'textarea' },
    { key: 'cta', label: 'Libellé bouton', kind: 'text' },
  ],
  render: (props, ctx) => {
    const { brand } = ctx;
    const html = `<table class="container-fluid" role="presentation" style="border-collapse:collapse;background-color:#FFFFFF;width:${brand.emailWidth}px;" bgcolor="#FFFFFF" border="0" cellpadding="0" cellspacing="0" width="${brand.emailWidth}" align="center"><tr><td style="margin:0; padding:16px 0px 32px 0px;">
      <table class="container-90" role="presentation" style="border-radius:16px;background-color:${brand.paper}; width:${brand.contentWidth}px;" width="${brand.contentWidth}" bgcolor="${brand.paper}" cellspacing="0" cellpadding="0" border="0" align="center"><tr><td style="margin:0; padding:24px; border-radius:16px;" align="center">
        <table width="${brand.contentWidth}" cellspacing="0" cellpadding="0" border="0" align="center"><tr>
          <th align="left" valign="middle"><img src="https://image.by.seloger.com/lib/fe2311737364047b731d79/m/1/agent_immo.png" width="128" height="128" alt="Conseiller SeLoger" style="display:block; width:128px; height:128px; border-radius:8px;"></th>
          <th align="left" valign="middle" style="font-family:${brand.fontFamily}; padding-left:16px;">
            <strong style="font-size:18px; color:${brand.ink};">${raw(props.title)}</strong>
            <span style="display:block; padding:8px 0; font-size:15px; color:${brand.grey};">${raw(props.text)}</span>
            ${ctaButton(props.cta, 'red', '@agencelink', 'bloc_agence', brand)}
          </th>
        </tr></table>
      </td></tr></table>
    </td></tr></table>`;
    return { html, requiredAmpVars: ['agencelink'] };
  },
};
