import type { SelogerBrand } from '../brand';

/**
 * Châssis email SeLoger — porté fidèlement de `buildHTML` (FSRBO).
 * head (police CeraSL) + header logo + zone de contenu + footer légal conforme.
 */

export interface ChassisParams {
  brand: SelogerBrand;
  subject: string;
  /** Étape de séquence pour la référence footer (ex. "J20"). */
  sequenceStep: string;
  /** HTML des modules déjà rendus, concaténé. */
  bodyHtml: string;
  /** Étiquette de référence campagne dans le footer (ex. "FSRBO"). */
  footerRef: string;
}

export function renderChassis(params: ChassisParams): string {
  const { brand, subject, sequenceStep, bodyHtml, footerRef } = params;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${subject}</title>
<style>
body{background-color:${brand.paper}; font-family:${brand.fontFamily} !important;}
${brand.fontFaces}
</style>
</head>
<body style="width:100%;height:100%;padding:0;margin:0">
<div style="background-color:${brand.paper}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${brand.paper}"><tr><td align="center">
<table role="presentation" width="${brand.emailWidth}" bgcolor="#FFFFFF" cellpadding="0" cellspacing="0" align="center"><tr><td style="padding:0 40px 40px 40px;">
<table width="${brand.contentWidth}" cellpadding="0" cellspacing="0" align="center"><tr><td align="center" style="padding:40px 0;">
<a href="https://www.seloger.com/" target="_blank"><img src="${brand.logoUrl}" alt="seloger_logo" width="${brand.logoWidth}" border="0" style="display:block;"></a>
</td></tr></table>
${bodyHtml}
</td></tr></table>
<table role="presentation" width="${brand.emailWidth}" bgcolor="#FFFFFF" cellpadding="0" cellspacing="0" align="center"><tr><td>
<table width="${brand.contentWidth}" cellpadding="0" cellspacing="0" align="center">
<tr><td style="padding:16px 0 24px; font-family:${brand.fontFamily}; font-size:12px; color:${brand.ink}; text-align:center;">
<a href="%%=RedirectTo(@unsubUrl)=%%" style="color:${brand.ink};">Se désabonner</a> | <a href="%%=RedirectTo(@preferenceCenter)=%%" style="color:${brand.ink};">Gérer mes abonnements</a><br><br>
Cet e-mail vous a été envoyé sur <span>%%emailaddr%%</span> car vous avez réalisé une estimation de votre bien sur SeLoger.<br><br>
${brand.legal.company} · ${brand.legal.address}<br><br>
Conformément à la loi Informatique et Libertés, vous pouvez accéder aux données vous concernant, les faire rectifier ou demander leur effacement.
</td></tr>
</table>
</td></tr></table>
<table role="presentation" width="${brand.emailWidth}" bgcolor="${brand.paper}" cellpadding="0" cellspacing="0" align="center"><tr><td>
<table width="${brand.contentWidth}" cellpadding="0" cellspacing="0" align="center"><tr><td style="padding:0 0 8px; text-align:center; font-size:6px; color:#AAAAAA;">SeLoger • <a href="%%view_email_url%%" style="color:#AAAAAA;">SLG-${sequenceStep}-${footerRef}</a></td></tr></table>
</td></tr></table>
</td></tr></table>
</div>
</body></html>`;
}
