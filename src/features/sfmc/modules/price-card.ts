import type { ModuleDef } from './types';

export type PriceCardProps = Record<string, never>;

/**
 * Carte « bien à vendre » pilotée par la Data Extension estimation — portée du FSRBO.
 * Rien à saisir : les valeurs viennent des attributs DE (@displaySellPrice, @estateTypeFR...).
 */
export const priceCardModule: ModuleDef<PriceCardProps> = {
  type: 'price-card',
  label: 'Carte bien à vendre',
  toggleable: true,
  defaultProps: {},
  fields: [],
  render: (_props, ctx) => {
    const { brand } = ctx;
    const html = `<table width="${brand.contentWidth}" cellpadding="0" cellspacing="0" align="center"><tr><td style="Margin:0;padding:24px 0px 24px 0px; border-radius:16px;" align="center">
      <table class="container-fluid" role="presentation" style="border-spacing:0px; border-radius:16px;background-color:#FFFFFF;width:${brand.contentWidth}px; border:1px solid #AAAAAA;" width="${brand.contentWidth}" cellspacing="0" cellpadding="0" border="0" align="center" bgcolor="#FFFFFF"><tr>
        <th align="left" valign="middle" style="Padding:16px;" width="240">
          <a href="%%=RedirectTo(@fsrboLink)=%%" target="_blank"><img src="https://image.by.seloger.com/lib/fe2311737364047b731d79/m/1/Room_default.png" height="auto" width="240" style="display:block; border-radius:8px; border:none;"></a>
        </th>
        <th align="right" valign="middle">
          <a href="%%=RedirectTo(@fsrboLink)=%%" target="_blank" style="font-weight:normal; color:${brand.ink}; font-size:16px; line-height:24px; font-family:${brand.fontFamily}; text-decoration:none;">
            <span style="font-size:24px; font-weight:bold;">%%=v(@displaySellPrice)=%%</span><br>
            <b>%%=v(@estateTypeFR)=%% à vendre</b><br>
            <span style="font-size:16px; color:${brand.ink};">%%[ IF NOT EMPTY(@estimaLivingSurface) THEN ]%%%%=FormatNumber(@estimaLivingSurface,"N0","fr_FR")=%%&nbsp;m2%%[ ENDIF ]%%</span><br>
            <span style="font-size:14px; color:${brand.grey};">%%=v(@estimaCityName)=%% (%%=v(@estimaPostalCode)=%%)</span>
          </a>
          <br><a href="%%=RedirectTo(@fsrboLink)=%%" target="_blank" style="color:#E30613; text-decoration:none; font-weight:bold;">Ajouter des photos&nbsp;→</a>
        </th>
      </tr></table>
    </td></tr></table>`;
    return {
      html,
      requiredAmpVars: [
        'fsrboLink',
        'displaySellPrice',
        'estateTypeFR',
        'estimaLivingSurface',
        'estimaCityName',
        'estimaPostalCode',
      ],
    };
  },
};
