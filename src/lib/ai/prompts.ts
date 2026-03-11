import type { CampaignBrief, CampaignDNA } from '@/types';
import { TEMPLATE_TYPES, AMBIANCE_VOCABULARY } from '@/lib/constants';
import { ACCESSIBILITY_NEWSLETTER_RULES } from '@/lib/ai/skills/accessibility-newsletter';

function getAmbianceHint(ambiance: string): string {
  const key = Object.keys(AMBIANCE_VOCABULARY).find(
    (k) => ambiance.toLowerCase().includes(k)
  );
  return key ? `\nVocabulaire design suggéré : ${AMBIANCE_VOCABULARY[key]}` : '';
}

export function buildDNAPrompt(brief: CampaignBrief, crawledData?: { colors?: string; fonts?: string; textContent?: string; title?: string; metaDescription?: string }): string {
  const ambianceHint = brief.ambiance ? getAmbianceHint(brief.ambiance) : '';

  const isUrlMode = brief.mode === 'precise' && crawledData;

  const crawlContext = crawledData
    ? `\nDonnées extraites du site web (${brief.siteUrl}) :\n- Titre du site : ${crawledData.title || 'inconnu'}\n- Description meta : ${crawledData.metaDescription || 'aucune'}\n- Couleurs trouvées : ${crawledData.colors || 'aucune'}\n- Polices trouvées : ${crawledData.fonts || 'aucune'}\n- Extraits de texte du site :\n${(crawledData.textContent || '').slice(0, 5000)}`
    : '';

  const modeInstruction = isUrlMode
    ? `IMPORTANT : Le brief provient d'une analyse automatique d'un site web. Tu DOIS déduire le nom de la marque, le secteur, le positionnement, le ton de voix, l'audience cible et l'ambiance DIRECTEMENT à partir des données extraites du site (titre, texte, couleurs, polices). Ne laisse aucun champ vide ou générique — analyse le contenu du site pour les remplir de manière concrète et précise.`
    : '';

  return `Tu es un expert en stratégie de marque et email marketing.
À partir ${isUrlMode ? 'de l\'analyse du site web suivant' : 'du brief suivant'}, génère un ADN de campagne newsletter structuré en 6 points.

${modeInstruction}

${isUrlMode ? `URL ANALYSÉE : ${brief.siteUrl}` : `BRIEF :
- Marque : ${brief.brand}
- Secteur : ${brief.sector}
- Positionnement : ${brief.positioning}
- Objectif de campagne : ${brief.objective}
- Audience cible : ${brief.audience}
- Ambiance / tone of voice : ${brief.ambiance}${ambianceHint}
- Palette souhaitée : ${brief.palette}`}
${brief.constraints ? `- Contraintes : ${brief.constraints}` : ''}
${brief.extraContent ? `- Contenu additionnel : ${brief.extraContent}` : ''}
${crawlContext}

Réponds en JSON avec exactement cette structure :
{
  "marque": {
    "name": "nom de la marque",
    "sector": "secteur d'activité",
    "positioning": "positionnement en une phrase",
    "toneOfVoice": "description du ton de voix en 2-3 phrases"
  },
  "objectif": "objectif principal de la campagne",
  "audience": "description de l'audience cible",
  "designSystem": {
    "primaryFont": "police principale web-safe avec fallbacks (ex: Helvetica Neue, Helvetica, Arial, sans-serif)",
    "secondaryFont": "police secondaire web-safe avec fallbacks",
    "borderRadius": "valeur CSS (ex: 0px, 4px, 8px)",
    "spacingSystem": "description du système d'espacement",
    "ctaStyle": "description détaillée du style des CTA"
  },
  "palette": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "text": "#hex"
  },
  "contraintes": "contraintes techniques ou de marque à respecter"
}

Règles :
- Les couleurs DOIVENT être en format hex (#XXXXXX)
- Les polices DOIVENT être web-safe avec des fallbacks
- Si le brief mentionne une palette, utilise ces couleurs. Sinon, propose des couleurs cohérentes avec le secteur et l'ambiance.
- Le ton de voix doit être précis et actionable pour un rédacteur
- Les contraintes doivent inclure : ESP (générique), largeur max 600px, compatibilité dark mode`;
}

export type SiteContent = { imageUrls: string[]; textContent: string };

/** Instructions pour utiliser des placeholders Placehold.co quand aucune URL d'image du site n'est fournie. */
function getPlaceholderImageBlock(dna: CampaignDNA): string {
  const hex = (dna.palette.primary || '1a1a1a').replace(/^#/, '');
  const marque = encodeURIComponent(dna.marque.name || 'Marque');
  return `

IMAGES (aucune URL du site fournie) : Tu DOIS malgré tout inclure des images dans le HTML. Utilise des placeholders Placehold.co avec la couleur primaire et le nom de la marque :
- Hero : https://placehold.co/600x400/${hex}/ffffff?text=${marque}
- Visuels secondaires : https://placehold.co/400x300/${hex}/ffffff?text=Produit ou https://placehold.co/300x200/${hex}/ffffff?text=+
Chaque <img> doit avoir un src avec cette URL complète, un alt descriptif et style="display:block;border:0;max-width:100%;". Ne laisse jamais une section hero ou visuelle sans image.`;
}

function getSiteContentBlock(siteContent: SiteContent | null | undefined): string {
  if (!siteContent || (siteContent.imageUrls.length === 0 && !siteContent.textContent?.trim())) return '';
  const lines: string[] = [
    '',
    'CONTENU RÉEL DU SITE (à utiliser dans l\'email) :',
    '- Tu DOIS utiliser les URLs d\'images ci-dessous dans le HTML : balises <img src="URL_ICI" alt="description" style="display:block;border:0;max-width:100%;" />.',
    '- Pour le hero : choisis une image adaptée (produit, bannière, lifestyle) parmi les URLs listées.',
    '- Pour les visuels secondaires : utilise d\'autres URLs de la liste si pertinent.',
    '- Le copy (titres, accroches, texte) peut s\'inspirer des extraits de texte du site pour rester fidèle à la marque.',
  ];
  if (siteContent.imageUrls.length > 0) {
    lines.push('- URLs d\'images à utiliser (au moins une pour le hero) :');
    siteContent.imageUrls.slice(0, 20).forEach((url) => lines.push(`  ${url}`));
  }
  if (siteContent.textContent?.trim()) {
    lines.push('- Extraits de texte du site (pour le copy) :');
    lines.push(siteContent.textContent.slice(0, 3000));
  }
  return lines.join('\n');
}

const ART_DIRECTOR_PROFILE = `Tu es un directeur artistique email senior avec 15 ans d'expérience chez des agences comme RGA, Huge, Pentagram. Tu conçois des emails pour des marques comme Apple, Nike, Aesop.

Principes de design que tu appliques TOUJOURS :
1. HIÉRARCHIE VISUELLE — Un seul point focal par section. Le regard suit un chemin clair : hero → titre → texte → CTA.
2. WHITESPACE GÉNÉREUX — L'espace vide n'est pas du gaspillage, c'est de la respiration. Minimum 40px de padding entre les sections sur desktop.
3. TYPOGRAPHIE MAÎTRISÉE — Maximum 2 familles de polices. Les titres sont plus grands ET plus espacés que le body. Le body ne descend jamais sous 15px.
4. PALETTE RESTREINTE — Maximum 3 couleurs actives + noir + blanc. La couleur accent ne s'utilise que sur 1-2 éléments max (CTA, détail).
5. IMAGES COMME PONCTUATION — Les images respirent, elles ne sont pas collées au texte. Toujours un espace avant et après.
6. CTA ÉVIDENT — Le bouton principal est le seul élément en couleur forte dans sa section. Il attire le regard sans effort.
7. FOOTER DISCRET — Le footer est fonctionnel et sobre. Pas de couleur forte, pas de gros texte. Il sait se faire oublier.

Ce que tu ne fais JAMAIS :
- Texte clair sur fond clair (ratio < 4.5:1)
- Plus de 3 CTA dans un email
- Des sections trop chargées avec texte + image + bouton empilés sans espace
- Du texte centré sur plus de 3 lignes (centrer uniquement les titres courts et les CTA)
- Des bordures partout
- Des fonds de couleur sur chaque section (varier entre fond blanc et 1-2 sections avec fond coloré max)`;

const STRICT_CONTRAST_RULES = `
RÈGLES DE CONTRASTE ABSOLUES — NE JAMAIS ENFREINDRE :
- Texte sombre sur fond clair OU texte clair sur fond sombre. Jamais de texte clair sur fond clair.
- Ratio de contraste minimum 4.5:1 entre le texte et son arrière-plan (norme WCAG AA).
- Le texte body doit TOUJOURS être une couleur sombre (#000000 à #4A4A4A) sur un fond clair (#FFFFFF à #F5F5F0).
- Le texte blanc (#FFFFFF) ne s'utilise QUE sur un fond suffisamment sombre (noir, bleu foncé, couleur brand foncée).
- Les CTA doivent avoir un contraste fort : texte clair sur bouton foncé, ou texte foncé sur bouton vif.

COMBINAISONS INTERDITES :
- Texte blanc sur fond gris clair → INTERDIT
- Texte gris clair sur fond blanc → INTERDIT
- Texte de couleur accent sur fond de couleur similaire → INTERDIT

COMBINAISONS SÛRES À PRIVILÉGIER :
- #1A1A1A sur #FFFFFF (ratio 17.4:1)
- #2D2D2D sur #F5F5F0 (ratio 10.2:1)
- #FFFFFF sur #0A0A0A (ratio 19.9:1)
- #FFFFFF sur #003399 (ratio 9.6:1)

OBLIGATION : Chaque élément texte (<p>, <h1-h3>, <a>, <span>, <td> avec texte) DOIT avoir un attribut style avec "color:" explicite. Ne jamais laisser la couleur par défaut du navigateur.`;

export function buildMasterTemplatePrompt(dna: CampaignDNA, siteContent?: SiteContent | null): string {
  const siteBlock = getSiteContentBlock(siteContent ?? null);
  const imageFallback = !siteContent?.imageUrls?.length ? getPlaceholderImageBlock(dna) : '';
  return `${ART_DIRECTOR_PROFILE}

Tu dois créer le CAMPAIGN MASTER TEMPLATE (#8) qui servira de système de design de référence pour toute la campagne newsletter.
${siteBlock}${imageFallback}

ADN DE LA CAMPAGNE :
- Marque : ${dna.marque.name} (${dna.marque.sector})
- Positionnement : ${dna.marque.positioning}
- Ton : ${dna.marque.toneOfVoice}
- Objectif : ${dna.objectif}
- Audience : ${dna.audience}
- Design System :
  - Police principale : ${dna.designSystem.primaryFont}
  - Police secondaire : ${dna.designSystem.secondaryFont}
  - Border radius : ${dna.designSystem.borderRadius}
  - Espacement : ${dna.designSystem.spacingSystem}
  - Style CTA : ${dna.designSystem.ctaStyle}
- Palette :
  - Primary : ${dna.palette.primary}
  - Secondary : ${dna.palette.secondary}
  - Accent : ${dna.palette.accent}
  - Background : ${dna.palette.background}
  - Text : ${dna.palette.text}
- Contraintes : ${dna.contraintes}

OBJECTIF : Créer un template master complet qui définit le système de design. Tous les autres emails de la campagne hériteront de son <head> (dark mode, media queries) et de son footer.

Réponds en JSON avec cette structure exacte :
{
  "subjectLine": "Objet email optimisé",
  "previewText": "Preview text 40-90 car.",
  "layoutDescription": { "structure": "...", "heroSection": "...", "bodySections": "...", "ctaSection": "...", "footer": "..." },
  "designSpecs": { "width": "600px", "backgroundColor": "${dna.palette.background}", "fontStack": "${dna.designSystem.primaryFont}", "headingStyle": "...", "bodyStyle": "...", "ctaStyle": "...", "spacing": "...", "borderRadius": "${dna.designSystem.borderRadius}", "imageTreatment": "..." },
  "htmlCode": "CODE HTML EMAIL COMPLET — voir règles ci-dessous",
  "darkModeOverrides": "",
  "accessibilityNotes": "",
  "coherenceTips": ""
}

Le champ "htmlCode" DOIT être un document HTML email COMPLET et LISIBLE. Structure obligatoire :
- <!DOCTYPE html><html><head> avec meta charset + <style> pour responsive (@media max-width:600px) </head>
- <body style="margin:0;padding:0;background-color:${dna.palette.background};">
- Table principale width="600" align="center" cellpadding="0" cellspacing="0" role="presentation"
- Section HERO : <td> avec <h1 style="color:${dna.palette.text};font-size:28px;font-family:${dna.designSystem.primaryFont};"> + accroche en lien avec "${dna.objectif}"
- Section TEXTE : <td> avec <p style="color:${dna.palette.text};font-size:16px;line-height:24px;font-family:${dna.designSystem.primaryFont};"> 2-4 phrases concrètes sur la marque ${dna.marque.name}
- Section CTA : <td align="center"> avec <a href="#" style="display:inline-block;background-color:${dna.palette.primary};color:#fff;padding:14px 28px;text-decoration:none;border-radius:${dna.designSystem.borderRadius};font-family:${dna.designSystem.primaryFont};">Texte CTA</a>
- Section FOOTER : <td> avec lien "Se désabonner" + nom de la marque
- CSS inline sur chaque élément. Le HTML doit faire au moins 1500 caractères.
- Rédiger du VRAI copy : titres, accroches et CTA en français, en lien avec l'objectif "${dna.objectif}" et la marque "${dna.marque.name}". Pas de Lorem ipsum, pas de placeholder.
- Images : les balises <img> doivent avoir un attribut src avec une URL complète (http:// ou https://) ou être remplacées par un bloc de couleur (bgcolor/background-color). Ne jamais mettre un code couleur (ex: #ffc73c ou ffc73c) dans src="...".
- NE PAS inclure de champ "mjmlCode" dans la réponse.

${STRICT_CONTRAST_RULES}

${ACCESSIBILITY_NEWSLETTER_RULES}`;
}

export function buildTemplatePrompt(
  dna: CampaignDNA,
  masterDesignSpecs: string,
  masterHeadHtml: string,
  templateNumber: number,
  siteContent?: SiteContent | null
): string {
  const templateInfo = TEMPLATE_TYPES.find((t) => t.number === templateNumber);
  if (!templateInfo) throw new Error(`Template type ${templateNumber} not found`);
  const siteBlock = getSiteContentBlock(siteContent ?? null);
  const imageFallback = !siteContent?.imageUrls?.length ? getPlaceholderImageBlock(dna) : '';

  return `${ART_DIRECTOR_PROFILE}

Tu dois créer l'email #${templateNumber} (${templateInfo.type}) pour une campagne newsletter.
${siteBlock}${imageFallback}

TYPE D'EMAIL : ${templateInfo.type}
OBJECTIF : ${templateInfo.objective}

ADN DE LA CAMPAGNE :
- Marque : ${dna.marque.name} (${dna.marque.sector})
- Positionnement : ${dna.marque.positioning}
- Ton : ${dna.marque.toneOfVoice}
- Objectif campagne : ${dna.objectif}
- Audience : ${dna.audience}
- Palette : Primary ${dna.palette.primary}, Secondary ${dna.palette.secondary}, Accent ${dna.palette.accent}, BG ${dna.palette.background}, Text ${dna.palette.text}
- Contraintes : ${dna.contraintes}

DESIGN SYSTEM DE RÉFÉRENCE (du Master Template #8) :
${masterDesignSpecs}

HEAD HTML DE RÉFÉRENCE (à réutiliser pour la cohérence) :
${masterHeadHtml}

Réponds en JSON avec cette structure exacte :
{
  "subjectLine": "Objet email optimisé pour ${templateInfo.type}",
  "previewText": "Preview text 40-90 car.",
  "layoutDescription": { "structure": "...", "heroSection": "...", "bodySections": "...", "ctaSection": "...", "footer": "..." },
  "designSpecs": { "width": "600px", "backgroundColor": "${dna.palette.background}", "fontStack": "${dna.designSystem.primaryFont}", "headingStyle": "...", "bodyStyle": "...", "ctaStyle": "...", "spacing": "...", "borderRadius": "${dna.designSystem.borderRadius}", "imageTreatment": "..." },
  "htmlCode": "CODE HTML EMAIL COMPLET",
  "darkModeOverrides": "",
  "accessibilityNotes": "",
  "coherenceTips": ""
}

Le champ "htmlCode" DOIT être un document HTML email COMPLET et LISIBLE :
- <!DOCTYPE html><html><head> + <style> responsive </head><body style="margin:0;padding:0;background-color:${dna.palette.background};">
- Table 600px, CSS inline, role="presentation", cellpadding="0" cellspacing="0"
- Hero : <h1> ou image en lien avec "${dna.objectif}" pour ${templateInfo.type}
- Corps : 2-4 paragraphes concrets, couleur ${dna.palette.text}, font ${dna.designSystem.primaryFont}
- CTA : bouton bg ${dna.palette.primary}, texte #fff, border-radius ${dna.designSystem.borderRadius}
- Footer : "Se désabonner" + ${dna.marque.name}
- Minimum 1500 caractères. Vrai copy en français lié à "${dna.objectif}" et "${dna.marque.name}". Pas de Lorem ipsum.
- Cohérence avec le master : mêmes couleurs, mêmes polices, même style CTA, même footer.
- Images : <img src="..."> uniquement avec URL complète (http/https). Pas de code couleur (#hex ou hex seul) dans src.
- NE PAS inclure de champ "mjmlCode" dans la réponse.

${STRICT_CONTRAST_RULES}

${ACCESSIBILITY_NEWSLETTER_RULES}`;
}
