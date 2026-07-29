import { SELOGER_BRAND } from '../brand';
import type { RenderContext } from '../modules/types';
import { renderModuleInstance } from '../modules/registry';
import { renderChassis } from '../chassis/seloger-chassis';
import { buildAmpscriptHeader } from '../ampscript/build-header';
import { renderCloudPage } from '../cloudpages/render';
import { buildSsjs } from '../ssjs/templates';
import { toPreviewHTML } from './preview';
import { runChecklist } from '../qa/checklist';
import type { SfmcEmailConfig, RenderedArtifacts } from '../types';

/**
 * Renderer déterministe : assemble AMPscript header + châssis SeLoger + modules
 * → artefacts SFMC (HTML, AMPscript, SSJS, CloudPage, package) + preview + QA.
 * Aucune part générée par l'IA.
 */
export function renderEmail(config: SfmcEmailConfig): RenderedArtifacts {
  const brand = SELOGER_BRAND;
  const ctx: RenderContext = { brand, preview: false };

  // 1. AMPscript header (déterministe)
  const ampscript = buildAmpscriptHeader(config.ampscript, {
    subject: config.subject,
    preheader: config.preheader,
    utmTrigger: config.utmTrigger,
  });

  // 2. Modules
  const requiredAmpVars: string[] = [];
  const bodyHtml = config.modules
    .map((inst) => {
      const res = renderModuleInstance(inst, ctx);
      requiredAmpVars.push(...res.requiredAmpVars);
      return res.html;
    })
    .filter(Boolean)
    .join('\n');

  // 3. Châssis
  const html = renderChassis({
    brand,
    subject: config.subject,
    sequenceStep: config.sequenceStep || 'J0',
    bodyHtml,
    footerRef: config.footerRef || 'CRM',
  });

  // 4. Package copier-coller (AMPscript + HTML)
  const pkg = `${ampscript}\n${html}`;

  // 5. Artefacts CloudPage / SSJS
  const ssjs = config.cloudPage ? buildSsjs(config.ampscript) : '';
  const cloudPage = config.cloudPage
    ? renderCloudPage({
        brand,
        title: config.subject || 'SeLoger',
        intro: config.preheader || '',
        ampscript: config.ampscript,
      })
    : '';

  // 6. Preview (substitution de tokens)
  const preview = toPreviewHTML(pkg);

  // 7. QA
  const qa = runChecklist({
    config,
    brand,
    html,
    ampscript,
    ssjs,
    cloudPage,
    requiredAmpVars,
  });

  return { html, ampscript, ssjs, cloudPage, package: pkg, preview, qa };
}
