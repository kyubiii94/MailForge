import type { SelogerBrand } from '../brand';

/** Contexte de rendu fourni à chaque module (marque + helpers). */
export interface RenderContext {
  brand: SelogerBrand;
  /** true = rendu preview (les tokens AMPscript seront ensuite substitués). */
  preview: boolean;
}

/** Résultat de rendu d'un module. */
export interface ModuleRenderResult {
  html: string;
  /** Variables AMPscript (@xxx) dont ce module dépend (pour la QA). */
  requiredAmpVars: string[];
}

/** Instance de module persistée dans un email de campagne. */
export interface ModuleInstance {
  id: string;
  type: string;
  enabled: boolean;
  props: Record<string, unknown>;
}

/** Champ de formulaire déclaré par un module (piloté par preset côté UI). */
export interface ModuleField {
  key: string;
  label: string;
  kind: 'text' | 'textarea' | 'select' | 'url';
  placeholder?: string;
  options?: { value: string; label: string }[];
  hint?: string;
}

/** Définition d'un type de module réutilisable. */
export interface ModuleDef<P = Record<string, unknown>> {
  type: string;
  label: string;
  /** Répétable dans un même email (ex. conseils). */
  repeatable?: boolean;
  /** Peut être activé/désactivé via un toggle. */
  toggleable?: boolean;
  defaultProps: P;
  fields: ModuleField[];
  render: (props: P, ctx: RenderContext) => ModuleRenderResult;
}
