import type { AmpscriptProfile } from './profile';

export interface AmpscriptSettings {
  subject: string;
  preheader: string;
  utmTrigger: string;
}

function escapeAmp(s: string): string {
  return (s || '').replace(/"/g, '\\"');
}

/**
 * Construit le header AMPscript de façon déterministe — généralisé depuis
 * `buildAmpscriptHeader` (FSRBO). Avec le profil SeLoger FSRBO, la sortie est
 * identique à l'original (attributs DE, CloudPagesURL(162), UTM lowercase, liens).
 */
export function buildAmpscriptHeader(
  profile: AmpscriptProfile,
  settings: AmpscriptSettings
): string {
  const lines: string[] = ['%%['];

  // Attributs Data Extension
  for (const a of profile.attributes) {
    lines.push(`SET @${a.var} = AttributeValue("${a.attr}")`);
  }

  // Constantes
  if (profile.constants.length) {
    lines.push('');
    for (const c of profile.constants) {
      lines.push(`SET @${c.var} = "${escapeAmp(c.value)}"`);
    }
  }

  // Logique type de bien (immobilier)
  if (profile.estateTypeLogic) {
    lines.push('');
    lines.push('IF @estimaEstateType == "HOUSE" THEN');
    lines.push('  SET @preHederEstateType = "cette maison"');
    lines.push('  SET @estateTypeFR = "Maison"');
    lines.push('ELSE');
    lines.push('  SET @preHederEstateType = "cet appartement"');
    lines.push('  SET @estateTypeFR = "Appartement"');
    lines.push('ENDIF');
  }

  // Fallback prix
  if (profile.priceFallback) {
    lines.push('');
    lines.push('IF NOT Empty(@estimaSellPrice) THEN');
    lines.push('  SET @displaySellPrice = FormatNumber(@estimaSellPrice, "C0", "fr_FR")');
    lines.push('ELSE');
    lines.push('  SET @displaySellPrice = "sur demande"');
    lines.push('ENDIF');
  }

  // Sujet + préheader
  lines.push('');
  lines.push(`SET @subject = "${escapeAmp(settings.subject)}"`);
  lines.push(`SET @preheader = CONCAT("${escapeAmp(settings.preheader)}")`);

  // UTM (utm_campaign toujours en lowercase)
  if (profile.utm) {
    const trigger = (settings.utmTrigger || 'campaign').toLowerCase();
    const hasEstate = profile.attributes.some((a) => a.var === 'estimaEstateType');
    lines.push('');
    if (hasEstate) {
      lines.push(
        `SET @utmTracking = CONCAT("utm_campaign=journey_owner_sl_b2c_emailing_${trigger}_", Lowercase(@estimaEstateType), "_france_x_x_x_fr_x_email_x_x&utm_medium=email&utm_source=crm-b2c&utm_content=method_", @estimaOwnerSaleMethod)`
      );
    } else {
      lines.push(
        `SET @utmTracking = "utm_campaign=journey_sl_b2c_emailing_${trigger}_france_x_x_x_fr_x_email_x_x&utm_medium=email&utm_source=crm-b2c"`
      );
    }
  }

  // Désabonnement (CloudPage) + centre de préférences
  if (profile.cloudPageUnsubId != null) {
    lines.push('');
    lines.push(
      `SET @unsubUrl = CloudPagesURL(${profile.cloudPageUnsubId}, "avivUserId", @avivUserId, "topic", @topic, "portal", @portal, "channel", @channel, "preferenceType", @preferenceType, "legalBasis", @legalBasis)`
    );
  }
  if (profile.preferenceCenter) {
    lines.push(
      `SET @preferenceCenter = CONCAT("https://www.seloger.com/mon-espace/preferences-de-notification","?", @utmTracking, "&utm_content=preferencecenter")`
    );
  }

  // Liens personnalisés
  for (const link of profile.links) {
    lines.push(`SET @${link.var} = ${link.expression}`);
  }

  // Lookup géo → @agencelink
  if (profile.geoLookup) {
    lines.push('');
    lines.push('SET @geoRefDE = "Geo_FR_Referential_202511"');
    lines.push('SET @slug = Lookup(@geoRefDE, "slug", "postalCode", @estimaPostalCode)');
    lines.push('IF NOT EMPTY(@slug) THEN');
    lines.push(
      '  SET @agencelink = CONCAT("https://www.seloger.com/annuaire/", @slug, "/?", @utmTracking, "&utm_content=btn_agences_locales")'
    );
    lines.push('ELSE');
    lines.push(
      '  SET @agencelink = CONCAT("https://www.seloger.com/annuaire/?", @utmTracking, "&utm_content=btn_agences_fallback")'
    );
    lines.push('ENDIF');
  }

  lines.push(']%%');
  return lines.join('\n');
}
