import type { ModuleInstance } from '../modules/types';
import { getModuleDef } from '../modules/registry';

let counter = 0;

/** Crée une instance de module à partir de son type + overrides de props. */
export function inst(
  type: string,
  props: Record<string, unknown> = {},
  enabled = true
): ModuleInstance {
  const def = getModuleDef(type);
  counter += 1;
  return {
    id: `${type}-${counter}`,
    type,
    enabled,
    props: { ...(def?.defaultProps ?? {}), ...props },
  };
}

/** Les 3 piliers FSRBO — items de conseils réutilisés. */
export const TROIS_PILIERS = [
  {
    img: 'https://image.by.seloger.com/lib/fe2311737364047b731d79/m/1/a385eb83-989c-4c47-bdd7-1df107a892e0.png',
    title: 'Fixer le «\u00a0juste prix\u00a0».',
    text: "Le piège n°1 de la vente entre particuliers : surestimer son bien. Un prix aligné sur le marché attire plus de contacts qualifiés.",
    linkLabel: 'Réviser mon estimation',
    linkUrl: '@fsrboLink',
  },
  {
    img: 'https://image.by.seloger.com/lib/fe2311737364047b731d79/m/1/a385eb83-989c-4c47-bdd7-1df107a892e0.png',
    title: 'Soigner les photos.',
    text: 'Les annonces avec de belles photos reçoivent bien plus de demandes de visite. La lumière et le rangement font la différence.',
    linkLabel: 'Ajouter mes photos',
    linkUrl: '@fsrboLink',
  },
  {
    img: 'https://image.by.seloger.com/lib/fe2311737364047b731d79/m/1/a385eb83-989c-4c47-bdd7-1df107a892e0.png',
    title: 'Rédiger une annonce complète.',
    text: "Surface, DPE, atouts du quartier : une annonce détaillée rassure et fait gagner du temps à l'acheteur.",
    linkLabel: "Compléter mon annonce",
    linkUrl: '@fsrboLink',
  },
];
