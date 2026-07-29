import type { SelogerBrand } from '../brand';
import { buildSsjs } from '../ssjs/templates';
import type { AmpscriptProfile } from '../ampscript/profile';

export interface CloudPageParams {
  brand: SelogerBrand;
  title: string;
  intro: string;
  ampscript: AmpscriptProfile;
}

/**
 * Rendu HTML d'une CloudPage SeLoger (landing) — reprend la charte email.
 * Inclut le bloc SSJS déterministe en tête.
 */
export function renderCloudPage(params: CloudPageParams): string {
  const { brand, title, intro, ampscript } = params;
  const ssjs = buildSsjs(ampscript);

  return `${ssjs}
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
body{margin:0;background:${brand.paper};font-family:${brand.fontFamily};color:${brand.ink};}
${brand.fontFaces}
.wrap{max-width:${brand.contentWidth}px;margin:0 auto;padding:40px 20px;text-align:center;}
.logo{margin-bottom:24px;}
h1{font-size:28px;color:${brand.ink};}
p{font-size:16px;color:${brand.grey};}
.cta{display:inline-block;margin-top:24px;background:${brand.red};color:#fff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:25px;}
</style>
</head>
<body>
<div class="wrap">
<img class="logo" src="${brand.logoUrl}" alt="SeLoger" width="${brand.logoWidth}">
<h1>${title}</h1>
<p>${intro}</p>
<a class="cta" href="%%=RedirectTo(@fsrboLink)=%%">Continuer sur SeLoger</a>
</div>
</body>
</html>`;
}
