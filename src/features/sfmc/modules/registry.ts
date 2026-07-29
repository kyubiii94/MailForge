import type { ModuleDef, ModuleInstance, RenderContext, ModuleRenderResult } from './types';
import { heroModule } from './hero';
import { ctaModule } from './cta';
import { adviceModule } from './advice';
import { priceCardModule } from './price-card';
import { agenceModule } from './agence';
import { articleModule } from './article';
import { spacerModule } from './spacer';
import { imageModule } from './image';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const MODULE_REGISTRY: Record<string, ModuleDef<any>> = {
  [heroModule.type]: heroModule,
  [ctaModule.type]: ctaModule,
  [adviceModule.type]: adviceModule,
  [priceCardModule.type]: priceCardModule,
  [agenceModule.type]: agenceModule,
  [articleModule.type]: articleModule,
  [spacerModule.type]: spacerModule,
  [imageModule.type]: imageModule,
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export function getModuleDef(type: string): ModuleDef | undefined {
  return MODULE_REGISTRY[type];
}

/** Rend une instance de module (ignore si désactivée ou type inconnu). */
export function renderModuleInstance(
  instance: ModuleInstance,
  ctx: RenderContext
): ModuleRenderResult {
  if (!instance.enabled) return { html: '', requiredAmpVars: [] };
  const def = getModuleDef(instance.type);
  if (!def) return { html: '', requiredAmpVars: [] };
  const props = { ...def.defaultProps, ...instance.props };
  return def.render(props, ctx);
}

export const ALL_MODULE_DEFS: ModuleDef[] = Object.values(MODULE_REGISTRY);
