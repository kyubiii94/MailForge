import type { ModuleDef } from './types';

export interface SpacerProps {
  height: string;
}

/** Espaceur vertical simple. */
export const spacerModule: ModuleDef<SpacerProps> = {
  type: 'spacer',
  label: 'Espaceur',
  toggleable: true,
  defaultProps: { height: '24' },
  fields: [{ key: 'height', label: 'Hauteur (px)', kind: 'text', placeholder: '24' }],
  render: (props, ctx) => {
    const { brand } = ctx;
    const h = String(parseInt(props.height, 10) || 24);
    const html = `<table width="${brand.contentWidth}" cellpadding="0" cellspacing="0" align="center"><tr><td style="height:${h}px; line-height:${h}px; font-size:0;">&nbsp;</td></tr></table>`;
    return { html, requiredAmpVars: [] };
  },
};
