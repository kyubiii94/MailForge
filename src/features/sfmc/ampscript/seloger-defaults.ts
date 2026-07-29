import type { AmpscriptProfile } from './profile';

/** Constantes de conformité communes SeLoger (topic, portal, canal, base légale). */
const SELOGER_CONSTANTS = [
  { var: 'topic', value: 'MarketingEmails' },
  { var: 'portal', value: 'SLGFR' },
  { var: 'channel', value: 'Email' },
  { var: 'legalBasis', value: 'Contract' },
  { var: 'preferenceType', value: 'Marketing' },
];

/** Attribut minimal requis pour le désabonnement CloudPage 162. */
const AVIV_USER_ID = { var: 'avivUserId', attr: 'avivUserId' };

/**
 * Profil AMPscript FSRBO — reproduit fidèlement `buildAmpscriptHeader` du générateur d'origine.
 * Séquence estimation vendeurs (Data Extension estimation, carte bien, agence via géo lookup).
 */
export const FSRBO_AMPSCRIPT_PROFILE: AmpscriptProfile = {
  attributes: [
    AVIV_USER_ID,
    { var: 'estimaId', attr: 'id' },
    { var: 'estimaCityName', attr: 'cityName' },
    { var: 'estimaPostalCode', attr: 'postalCode' },
    { var: 'estimaLivingSurface', attr: 'livingSurface' },
    { var: 'estimaOwnerSaleMethod', attr: 'saleMethod' },
    { var: 'estimaEstateType', attr: 'estateType' },
    { var: 'estimaSellPrice', attr: 'sellPrice' },
    { var: 'estimaRoomCount', attr: 'numberOfBedRooms' },
  ],
  constants: SELOGER_CONSTANTS,
  estateTypeLogic: true,
  priceFallback: true,
  utm: true,
  cloudPageUnsubId: 162,
  preferenceCenter: true,
  geoLookup: true,
  links: [
    {
      var: 'fsrboLink',
      expression:
        'CONCAT("https://www.seloger.com/depot-annonce/vente-particulier/type-de-bien?estimaId=",@estimaId,"&",@utmTracking)',
    },
  ],
};

/**
 * Profil AMPscript générique SeLoger CRM — pour newsletters/acheteurs/triggers.
 * Conserve la conformité (désabonnement CloudPage 162, préférences, UTM lowercase)
 * sans la logique immobilière estimation.
 */
export const SELOGER_BASE_PROFILE: AmpscriptProfile = {
  attributes: [AVIV_USER_ID],
  constants: SELOGER_CONSTANTS,
  estateTypeLogic: false,
  priceFallback: false,
  utm: true,
  cloudPageUnsubId: 162,
  preferenceCenter: true,
  geoLookup: false,
  links: [],
};

/** Clone un profil pour permettre des variantes sans muter la constante. */
export function cloneProfile(profile: AmpscriptProfile): AmpscriptProfile {
  return {
    ...profile,
    attributes: profile.attributes.map((a) => ({ ...a })),
    constants: profile.constants.map((c) => ({ ...c })),
    links: profile.links.map((l) => ({ ...l })),
  };
}
