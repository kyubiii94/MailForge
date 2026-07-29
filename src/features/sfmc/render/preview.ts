/**
 * Substitution de tokens AMPscript pour la preview navigateur.
 * Porté fidèlement de `toPreviewHTML` (FSRBO) : remplace les tokens par des
 * valeurs d'exemple afin de visualiser le rendu sans exécuter SFMC.
 */
export function toPreviewHTML(html: string): string {
  return html
    .replace(/%%=v\(@estimaCityName\)=%%/g, 'Boulogne-Billancourt')
    .replace(/%%=v\(@estimaPostalCode\)=%%/g, '92100')
    .replace(/%%=v\(@estateTypeFR\)=%%/g, 'Appartement')
    .replace(/%%=v\(@displaySellPrice\)=%%/g, '385 000 €')
    .replace(/%%\[[\s\S]*?\]%%/g, '')
    .replace(/%%=RedirectTo\(([^)]*)\)=%%/g, '#')
    .replace(/%%=FormatNumber\([^)]*\)=%%/g, '72')
    .replace(/%%=v\(@[^)]*\)=%%/g, '')
    .replace(/%%emailaddr%%/g, 'exemple@email.com')
    .replace(/%%view_email_url%%/g, '#');
}
