import type { RenderedArtifacts, SfmcEmailConfig } from '../types';

export type ExportFormat = 'package' | 'html' | 'ampscript' | 'ssjs' | 'cloudpage';

export interface ExportResult {
  filename: string;
  mime: string;
  content: string;
}

function slug(s: string): string {
  return (s || 'email').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'email';
}

/**
 * Prépare un artefact SFMC pour export/copier-coller selon le format demandé.
 * `package` = AMPscript + HTML combinés, directement collables dans Content Builder.
 */
export function buildExport(
  config: SfmcEmailConfig,
  rendered: RenderedArtifacts,
  format: ExportFormat
): ExportResult {
  const base = slug(config.name);
  switch (format) {
    case 'html':
      return { filename: `${base}.html`, mime: 'text/html', content: rendered.html };
    case 'ampscript':
      return { filename: `${base}.ampscript.txt`, mime: 'text/plain', content: rendered.ampscript };
    case 'ssjs':
      return { filename: `${base}.ssjs.txt`, mime: 'text/plain', content: rendered.ssjs };
    case 'cloudpage':
      return { filename: `${base}.cloudpage.html`, mime: 'text/html', content: rendered.cloudPage };
    case 'package':
    default:
      return { filename: `${base}.package.html`, mime: 'text/html', content: rendered.package };
  }
}
