import type { SelogerBrand } from '../brand';
import type { SfmcEmailConfig, QaResult } from '../types';
import type { AdviceProps } from '../modules/advice';

export interface QaInput {
  config: SfmcEmailConfig;
  brand: SelogerBrand;
  html: string;
  ampscript: string;
  ssjs: string;
  cloudPage: string;
  requiredAmpVars: string[];
}

const SECRET_PATTERNS = [
  /api[_-]?key\s*=\s*["'][^"']+["']/i,
  /password\s*=\s*["'][^"']+["']/i,
  /secret\s*=\s*["'][^"']+["']/i,
  /bearer\s+[a-z0-9._-]{12,}/i,
];

/**
 * Moteur de checklist QA — porté de `runChecklist` (FSRBO) et étendu.
 * Vérifie la conformité SFMC avant export (relecture humaine ensuite obligatoire).
 */
export function runChecklist(input: QaInput): QaResult[] {
  const { config, brand, html, ampscript, ssjs, cloudPage, requiredAmpVars } = input;
  const results: QaResult[] = [];
  const fullCode = `${ampscript}\n${html}`;

  // Désabonnement légal (CloudPage 162)
  const hasUnsub = html.includes('@unsubUrl');
  const has162 =
    config.ampscript.cloudPageUnsubId == null ||
    ampscript.includes(`CloudPagesURL(${config.ampscript.cloudPageUnsubId}`);
  results.push({
    ok: hasUnsub && has162,
    label: 'Désabonnement (CloudPage 162)',
    detail: hasUnsub && has162
      ? 'Lien de désabonnement présent via CloudPagesURL.'
      : 'Le lien de désabonnement CloudPage est manquant ou incomplet.',
  });

  // Centre de préférences
  const hasPref = html.includes('@preferenceCenter');
  results.push({
    ok: config.ampscript.preferenceCenter ? hasPref : true,
    label: 'Gérer mes abonnements',
    detail: hasPref ? 'Lien centre de préférences présent.' : 'Lien « Gérer mes abonnements » manquant.',
  });

  // Adresse légale
  const hasAddress = html.includes(brand.legal.address);
  results.push({
    ok: hasAddress,
    label: 'Adresse légale',
    detail: hasAddress ? 'Adresse postale légale présente.' : `Adresse « ${brand.legal.address} » absente du footer.`,
  });

  // Police CeraSL
  const hasFont = html.includes('CeraSL');
  results.push({
    ok: hasFont,
    label: 'Police CeraSL',
    detail: hasFont ? 'Police de marque CeraSL déclarée.' : 'La police CeraSL est absente.',
  });

  // UTM lowercase
  const utmMatch = ampscript.match(/utm_campaign=([^"&]*)/);
  const utmLower = !utmMatch || utmMatch[1] === utmMatch[1].toLowerCase();
  results.push({
    ok: utmLower,
    label: 'UTM en minuscules',
    detail: utmLower ? 'utm_campaign est en minuscules.' : 'utm_campaign contient des majuscules.',
  });

  // Pas de secret en dur
  const hasSecret = SECRET_PATTERNS.some((re) => re.test(fullCode) || re.test(ssjs) || re.test(cloudPage));
  results.push({
    ok: !hasSecret,
    label: 'Aucun secret en dur',
    detail: hasSecret ? 'Un secret potentiel a été détecté dans le code.' : 'Aucun secret détecté.',
  });

  // Fallback prix
  if (config.ampscript.priceFallback) {
    const hasFallback = ampscript.includes('IF NOT Empty(@estimaSellPrice)');
    results.push({
      ok: hasFallback,
      label: 'Fallback prix',
      detail: hasFallback ? 'Fallback prix estimation présent.' : 'Le fallback prix estimation est manquant.',
    });
  }

  // Liens conseils complets
  const adviceIssues: string[] = [];
  for (const inst of config.modules) {
    if (inst.type !== 'advice' || !inst.enabled) continue;
    const items = ((inst.props as Partial<AdviceProps>).items || []) as AdviceProps['items'];
    items.forEach((it, i) => {
      const hasLabel = !!it.linkLabel;
      const hasUrl = !!it.linkUrl;
      if (hasLabel !== hasUrl) adviceIssues.push(`conseil #${i + 1}`);
    });
  }
  results.push({
    ok: adviceIssues.length === 0,
    label: 'Liens conseils complets',
    detail: adviceIssues.length
      ? `Libellé/URL incomplet : ${adviceIssues.join(', ')}.`
      : 'Tous les liens de conseils sont complets.',
  });

  // Variables AMPscript requises définies
  const uniqueVars = Array.from(new Set(requiredAmpVars));
  const missing = uniqueVars.filter((v) => !new RegExp(`SET @${v}\\b`).test(ampscript));
  results.push({
    ok: missing.length === 0,
    label: 'Variables AMPscript définies',
    detail: missing.length
      ? `Variables utilisées mais non définies : ${missing.map((v) => '@' + v).join(', ')}.`
      : 'Toutes les variables utilisées sont définies dans le header.',
  });

  // Liens trackés (RedirectTo)
  const untracked = countUntrackedLinks(html);
  results.push({
    ok: untracked === 0,
    label: 'Liens trackés (RedirectTo)',
    detail: untracked === 0
      ? 'Tous les liens de contenu passent par RedirectTo.'
      : `${untracked} lien(s) direct(s) non tracké(s) détecté(s).`,
  });

  // CloudPage
  if (config.cloudPage) {
    const ok = cloudPage.trim().length > 0 && ssjs.trim().length > 0;
    results.push({
      ok,
      label: 'Artefacts CloudPage',
      detail: ok ? 'CloudPage + SSJS générés.' : 'Les artefacts CloudPage/SSJS sont vides.',
    });
  }

  return results;
}

/** Compte les liens http(s) directs non wrappés dans RedirectTo (hors logo autorisé). */
function countUntrackedLinks(html: string): number {
  const allowed = ['https://www.seloger.com/"'];
  const matches = html.match(/href="https?:\/\/[^"]*"/g) || [];
  return matches.filter((m) => !allowed.some((a) => m.includes(a))).length;
}

/** Indique si la QA est bloquante (au moins un échec). */
export function hasBlockingIssues(results: QaResult[]): boolean {
  return results.some((r) => !r.ok);
}
