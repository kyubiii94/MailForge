import type { AmpscriptProfile } from '../ampscript/profile';

/**
 * Génère un bloc SSJS déterministe pour CloudPage / lookups Data Extension.
 * Placeholders sûrs (aucun secret en dur). Utilisé quand `cloudPage` est activé.
 */
export function buildSsjs(profile: AmpscriptProfile): string {
  const attrs = profile.attributes.map((a) => a.attr);
  const lookupLines = attrs
    .map((a) => `    var ${a} = Platform.Request.GetQueryStringParameter("${a}") || "";`)
    .join('\n');

  return `<script runat="server">
Platform.Load("Core", "1.1.1");
/*
  SSJS SeLoger — récupération des paramètres CloudPage (déterministe).
  À compléter en Content Builder avant activation (relecture obligatoire).
*/
try {
${lookupLines || '    // Aucun attribut déclaré'}

    // Exemple de lookup Data Extension (à adapter au nom réel de la DE) :
    // var rows = Platform.Function.LookupRows("Estimation_DE", "avivUserId", avivUserId);
    // if (rows && rows.length > 0) { /* ... */ }
} catch (e) {
    Write("<!-- SSJS error: " + Stringify(e) + " -->");
}
</script>`;
}
