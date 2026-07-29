import type { SelogerBrand } from '../brand';

export type CtaStyle = 'red' | 'outline';

/**
 * Bouton CTA — porté fidèlement de `ctaButton` (FSRBO).
 * Le lien est toujours enveloppé dans `%%=RedirectTo(...)=%%` (tracking SFMC obligatoire).
 */
export function ctaButton(
  label: string,
  style: CtaStyle,
  link: string,
  name: string,
  brand: SelogerBrand
): string {
  const isRed = style === 'red';
  const border = isRed ? brand.red : '#000000';
  const bg = isRed ? brand.red : '#FFFFFF';
  const color = isRed ? '#FFFFFF' : '#000000';
  return `<table border="0" cellspacing="0" cellpadding="0" role="presentation" class="mobile-button" align="center"><tr><td>
      <span style="border-style:solid; border-color:${border}; background:${bg}; border-width:2px; display:inline-block; border-radius:25px; width:auto;">
        <a href="%%=RedirectTo(${link})=%%" name="${name}" alias="${name}" target="_blank" style="mso-style-priority:100 !important; text-decoration:none !important; mso-line-height-rule:exactly; color:${color}; font-size:15px; padding:6px 20px; display:inline-block; background:${bg}; border-radius:25px; font-style:normal; font-weight:bold; line-height:22px; width:auto; text-align:left; letter-spacing:0; mso-padding-alt:6px; mso-border-alt:2px solid ${border}; font-family:${brand.fontFamily};">${label}</a>
      </span>
    </td></tr></table>`;
}

/** Extrait la variable AMPscript (@xxx) d'un lien si présente. */
export function ampVarFromLink(link: string): string[] {
  const trimmed = (link || '').trim();
  return trimmed.startsWith('@') ? [trimmed.slice(1)] : [];
}
