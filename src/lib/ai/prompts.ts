import type { CampaignBrief, CampaignDNA } from '@/types';
import { TEMPLATE_TYPES, AMBIANCE_VOCABULARY } from '@/lib/constants';

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

export function buildMasterTemplatePrompt(dna: CampaignDNA, siteContent?: SiteContent | null): string {
  const siteBlock = getSiteContentBlock(siteContent ?? null);
  return `Tu es un expert en design d'emails HTML avec 15 ans d'expérience.
Tu dois créer le CAMPAIGN MASTER TEMPLATE (#8) qui servira de système de design de référence pour toute la campagne newsletter.
${siteBlock}

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
  "subjectLine": "Objet d'email optimisé",
  "previewText": "Preview text de 40-90 caractères",
  "layoutDescription": {
    "structure": "description du layout — nombre de sections, disposition des blocs",
    "heroSection": "description du header / hero — image, titre, sous-titre",
    "bodySections": "description des blocs de contenu — texte, images, colonnes",
    "ctaSection": "description du/des CTA — texte, style, placement",
    "footer": "description du footer — liens, social, unsubscribe"
  },
  "designSpecs": {
    "width": "600px",
    "backgroundColor": "${dna.palette.background}",
    "fontStack": "${dna.designSystem.primaryFont}",
    "headingStyle": "taille, poids, couleur, espacement des titres",
    "bodyStyle": "taille, hauteur de ligne, couleur du texte body",
    "ctaStyle": "couleur bg, couleur texte, border-radius, padding, hover",
    "spacing": "système d'espacement — padding entre sections",
    "borderRadius": "${dna.designSystem.borderRadius}",
    "imageTreatment": "style des images — full-width, rounded, shadow, ratio"
  },
  "htmlCode": "CODE HTML EMAIL COMPLET ICI",
  "mjmlCode": "CODE MJML EQUIVALENT ICI",
  "darkModeOverrides": "CSS pour compatibilité dark mode",
  "accessibilityNotes": "notes d'accessibilité",
  "coherenceTips": "conseils pour maintenir la cohérence avec les autres emails"
}

RÈGLES STRICTES POUR LE CODE HTML :
- Structure : Table-based layout (pas de div pour la structure)
- <!DOCTYPE html> avec xmlns pour Outlook
- <table> avec role="presentation" pour l'accessibilité
- Largeur max 600px, centré avec align="center"
- cellpadding="0" et cellspacing="0" sur toutes les tables
- CSS inline uniquement (pas de <style> externe sauf pour responsive/dark mode)
- <style> block dans <head> uniquement pour media queries et dark mode
- MSO conditionals : <!--[if mso]> et <!--[if !mso]>
- Images : utilise les VRAIES URLs fournies dans "CONTENU RÉEL DU SITE" pour le hero et les visuels ; alt="" descriptif, display: block, border: 0, max-width: 100%
- Responsive : @media screen and (max-width: 600px)
- Dark mode : @media (prefers-color-scheme: dark), color-scheme: light dark
- Lien unsubscribe dans le footer
- Le HTML doit être COMPLET et fonctionnel avec de vrais visuels (pas de placeholder type https://via.placeholder.com)

CONTENU ET LISIBILITÉ OBLIGATOIRES :
- En mode clair (défaut), le fond principal du corps doit être la couleur "background" de la palette (ex: ${dna.palette.background}), le texte en couleur "text" (ex: ${dna.palette.text}). Ne JAMAIS produire un email entièrement noir ou sans contenu lisible.
- Le corps de l'email doit contenir : (1) une section hero avec image ou titre accrocheur, (2) au moins une section de texte avec du copy concret (titres, paragraphes) en rapport avec la marque et l'objectif, (3) un ou plusieurs CTA visibles (boutons ou liens), (4) un footer avec liens et désinscription.
- Rédiger du vrai copy : titres, accroches et CTA en lien direct avec l'objet de la campagne et la marque (ex. pour un lancement produit : nom du produit, bénéfices, "Découvrir", "Voir la collection"). Pas de "Lorem ipsum" ni de contenu vide.

POUR LE MJML :
- Utilise les balises MJML standard : <mjml>, <mj-head>, <mj-body>, <mj-section>, <mj-column>, <mj-text>, <mj-button>, <mj-image>
- Inclure les attributs de style correspondant au design system
- Le MJML doit produire un résultat visuellement identique au HTML`;
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

  return `Tu es un expert en design d'emails HTML avec 15 ans d'expérience.
Tu dois créer l'email #${templateNumber} (${templateInfo.type}) pour une campagne newsletter.
${siteBlock}

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
  "subjectLine": "Objet d'email optimisé pour ce type",
  "previewText": "Preview text de 40-90 caractères",
  "layoutDescription": {
    "structure": "description du layout adapté au type ${templateInfo.type}",
    "heroSection": "description du hero adapté",
    "bodySections": "description des sections de contenu",
    "ctaSection": "description des CTA",
    "footer": "footer identique au master template"
  },
  "designSpecs": {
    "width": "600px",
    "backgroundColor": "${dna.palette.background}",
    "fontStack": "${dna.designSystem.primaryFont}",
    "headingStyle": "cohérent avec le master template",
    "bodyStyle": "cohérent avec le master template",
    "ctaStyle": "cohérent avec le master template",
    "spacing": "cohérent avec le master template",
    "borderRadius": "${dna.designSystem.borderRadius}",
    "imageTreatment": "adapté au type d'email"
  },
  "htmlCode": "CODE HTML EMAIL COMPLET ICI",
  "mjmlCode": "CODE MJML EQUIVALENT ICI",
  "darkModeOverrides": "CSS dark mode cohérent",
  "accessibilityNotes": "notes d'accessibilité",
  "coherenceTips": "comment cet email s'intègre dans la campagne"
}

RÈGLES HTML (identiques au master) :
- Table-based layout, role="presentation"
- CSS inline, MSO conditionals
- Responsive @media max-width: 600px
- Dark mode @media prefers-color-scheme: dark
- Images : utilise les VRAIES URLs du "CONTENU RÉEL DU SITE" (hero, produits, visuels) ; alt text, display: block, max-width: 100%
- Footer avec unsubscribe
- Réutiliser le <head> du master template
- Le contenu doit être RÉALISTE pour une marque "${dna.marque.name}" dans le secteur "${dna.marque.sector}"
- Le HTML doit être COMPLET et fonctionnel avec de vrais visuels (pas de placeholder)

CONTENU ET LISIBILITÉ OBLIGATOIRES :
- En mode clair (défaut), fond du corps = couleur background (${dna.palette.background}), texte = couleur text (${dna.palette.text}). Ne jamais produire un email entièrement noir ou vide.
- Inclure : hero (image ou titre), sections de corps avec copy concret (titres, paragraphes, CTA) en lien avec l'objectif "${dna.objectif}" et la marque ${dna.marque.name}. Rédiger du vrai texte, pas de placeholder.

COHÉRENCE :
- Même font-stack que le master template
- Mêmes couleurs hex exactes
- Même style de CTA
- Même espacement entre sections
- Footer identique
- Le <head> (dark mode + media queries) doit être copié du master`;
}
