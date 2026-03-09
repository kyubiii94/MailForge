/**
 * Règles d'accessibilité newsletter (skill accessibility-newsletter).
 * Source : docs/accessibility-newsletter.skill — Charte d'accessibilité de la communication de l'État (SIG).
 * Appliquées à chaque génération de template par MailForge.
 */
export const ACCESSIBILITY_NEWSLETTER_RULES = `
RÈGLES D'ACCESSIBILITÉ OBLIGATOIRES (WCAG AA / Charte État) — à respecter dans tout le HTML généré :

1. CONTRASTES : Ratio texte/fond minimum 4.5:1 (texte standard) ou 3:1 (texte large ≥18pt). INTERDIT : texte blanc (#fff) ou clair sur fond blanc ou clair ; texte noir ou foncé sur fond noir ou foncé sans contraste. Chaque bloc doit avoir une combinaison lisible : fond clair → color texte foncé (#1a1a1a ou équivalent) ; fond foncé → color texte clair (#ffffff). Vérifier en light ET dark mode. CTA : texte contrasté sur le fond du bouton. Éviter texte gris clair sur blanc, blanc sur jaune.

2. TYPO : Corps ≥14px (idéal 15–16px), footer ≥12px, titres ≥20px. Line-height ≥1.5× taille. Interdiction de text-align:justify. Font-stack avec fallbacks web-safe. Pas de paragraphes en italique ou tout en majuscules.

3. IMAGES : Chaque <img> DOIT avoir alt="..." pertinent (descriptif pour images informatives, alt="" + role="presentation" pour décoratif). Logo : alt="[Nom de la marque]". Ajouter width et style="display:block;border:0;outline:none;". Conteneur d'image : background-color de fallback.

4. STRUCTURE : Tables de layout : <table role="presentation" cellpadding="0" cellspacing="0" border="0">. Ordre de lecture logique dans le code : preheader → header → hero → contenu → footer. Un seul H1 puis H2, H3.

5. LIENS ET CTA : Texte de lien explicite (jamais "Cliquez ici" ou "En savoir plus" seul). CTA zone cliquable minimale 44×44px, padding min 12px vertical / 24px horizontal. Lien désabonnement visible et explicite.

6. COULEUR : La couleur ne doit jamais être le seul vecteur d'information (ex. prix barré : line-through + couleur + texte; liens : underline ou indicateur en plus de la couleur).

7. COPY : Phrases courtes, vocabulaire courant, pas de jargon. Subject line 50–60 car., preview 40–90 car. Accents sur majuscules (É, À). Pas de ALL CAPS dans le subject.

8. RESPONSIVE : Zone tactile min 44px. Media query max-width:600px pour mobile. Texte mobile jamais sous 14px.

9. HEAD : Inclure <meta name="color-scheme" content="light dark"> et <meta name="supported-color-schemes" content="light dark">. Preheader masqué avec technique standard (font-size:1px; max-height:0; overflow:hidden) + caractères &zwnj;&nbsp; en fin pour éviter le préchargement.

10. FOOTER : Lien désabonnement visible, adresse physique, mention "Vous recevez cet email car...". Contraste footer ≥4.5:1. Icônes sociaux avec alt="[Nom du réseau]".
`;
