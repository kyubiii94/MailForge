/**
 * Profil AMPscript — description déclarative du header AMPscript à générer.
 * Le header est produit de façon DÉTERMINISTE (jamais par l'IA) pour garantir
 * la validité SFMC (désabonnement légal, Data Extensions, UTM).
 */

export interface AmpAttribute {
  /** Nom de la variable AMPscript (sans @). */
  var: string;
  /** Nom de l'attribut de la Data Extension (AttributeValue). */
  attr: string;
}

export interface AmpConstant {
  var: string;
  value: string;
}

export interface AmpLink {
  var: string;
  /** Expression AMPscript complète (ex. CONCAT(...)). */
  expression: string;
}

export interface AmpscriptProfile {
  /** SET @x = AttributeValue("y") — attributs lus depuis la Data Extension. */
  attributes: AmpAttribute[];
  /** SET @x = "valeur" — constantes (topic, portal, canal, base légale...). */
  constants: AmpConstant[];
  /** Bloc conditionnel type de bien (maison/appartement) — immobilier. */
  estateTypeLogic: boolean;
  /** Fallback prix (@displaySellPrice) — immobilier. */
  priceFallback: boolean;
  /** Construction du bloc UTM (utm_campaign lowercase). */
  utm: boolean;
  /** ID de CloudPage pour le lien de désabonnement (SeLoger = 162). */
  cloudPageUnsubId: number | null;
  /** Centre de préférences. */
  preferenceCenter: boolean;
  /** Lookup géo pour @agencelink. */
  geoLookup: boolean;
  /** Liens personnalisés (CONCAT) construits après les UTM. */
  links: AmpLink[];
}
