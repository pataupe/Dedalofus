// Logique liée aux bonus conditionnels de breloques (onglet "Boosts breloques"
// de la fiche perso) : parsing des valeurs brutes du CSV, valeur par défaut à
// l'équipement, et bornage d'une valeur choisie par le joueur.
//
// Les colonnes Breloque.bonus_min_texte / bonus_increment_texte /
// bonus_max_texte / bonus_defaut_texte gardent le texte brut du CSV tel quel
// (ex: "10 soins", "dommages finaux x1.5", "+20 Retrait PA + 20 Retrait PM").
// Ce module n'en extrait que ce qui est nécessaire à l'affichage/aux bornes
// d'un slider — il ne calcule pas encore l'effet réel sur les stats/dégâts.

// "10 soins" -> { valeur: 10, prefixe: '', suffixe: ' soins' }
// "dommages finaux distance x1.6" -> { valeur: 1.6, prefixe: 'dommages finaux distance x', suffixe: '' }
// "+20 Retrait PA + 20 Retrait PM" (texte composite, pas de nombre en tête) -> { valeur: null, ... }
function parseValeurBoost(texteBrut) {
  if (texteBrut == null) return null;
  const texte = String(texteBrut).trim();
  if (texte === '') return null;

  const matchMultiplicateur = texte.match(/^(dommages finaux(?:\s+(?:distance|mêlée))?\s*x)(-?\d+(?:[.,]\d+)?)/i);
  if (matchMultiplicateur) {
    return {
      valeur: parseFloat(matchMultiplicateur[2].replace(',', '.')),
      prefixe: matchMultiplicateur[1],
      suffixe: '',
    };
  }

  const matchNombre = texte.match(/^(-?\d+(?:[.,]\d+)?)(.*)$/);
  if (matchNombre) {
    return {
      valeur: parseFloat(matchNombre[1].replace(',', '.')),
      prefixe: '',
      suffixe: matchNombre[2],
    };
  }

  return { valeur: null, prefixe: '', suffixe: '' };
}

// Construit l'objet "boost" exposé par l'API pour une breloque équipée ayant
// un bonus conditionnel (`breloqueRow.type_input` non nul). `valeurActuelle`
// vient de EquipementBreloque.boost_valeur.
function construireBoost(breloqueRow, valeurActuelle) {
  if (!breloqueRow.type_input) return null;

  if (breloqueRow.type_input === 'toggle') {
    return {
      type: 'toggle',
      actif: Number(valeurActuelle) === 1,
      texteActif: breloqueRow.bonus_max_texte,
    };
  }

  const min = parseValeurBoost(breloqueRow.bonus_min_texte);
  const max = parseValeurBoost(breloqueRow.bonus_max_texte);
  const increment = parseValeurBoost(breloqueRow.bonus_increment_texte);

  return {
    type: breloqueRow.type_input,
    min: min?.valeur ?? 0,
    max: max?.valeur ?? min?.valeur ?? 0,
    increment: increment?.valeur ?? 1,
    valeur: Number(valeurActuelle),
    prefixe: max?.prefixe || min?.prefixe || '',
    suffixe: max?.suffixe || min?.suffixe || '',
  };
}

// Valeur initiale de EquipementBreloque.boost_valeur au moment d'équiper une
// breloque (colonne "Bonus par défaut" du CSV) — null si la breloque n'a pas
// de bonus conditionnel.
function valeurBoostParDefaut(breloqueRow) {
  if (!breloqueRow || !breloqueRow.type_input) return null;

  if (breloqueRow.type_input === 'toggle') {
    const texte = (breloqueRow.bonus_defaut_texte || '').trim();
    return texte !== '' && texte !== '0' ? 1 : 0;
  }

  const defaut = parseValeurBoost(breloqueRow.bonus_defaut_texte);
  const min = parseValeurBoost(breloqueRow.bonus_min_texte);
  return defaut?.valeur ?? min?.valeur ?? 0;
}

// Borne une valeur choisie par le joueur (PUT .../boost) à ce que la breloque
// autorise : 0/1 pour un toggle, [min, max] pour range/accumulateur.
function clamperValeurBoost(breloqueRow, valeurBrute) {
  const valeur = Number(valeurBrute);
  if (!Number.isFinite(valeur)) return 0;

  if (breloqueRow.type_input === 'toggle') return valeur ? 1 : 0;

  const min = parseValeurBoost(breloqueRow.bonus_min_texte)?.valeur ?? 0;
  const max = parseValeurBoost(breloqueRow.bonus_max_texte)?.valeur ?? min;
  return Math.min(Math.max(valeur, min), max);
}

module.exports = { parseValeurBoost, construireBoost, valeurBoostParDefaut, clamperValeurBoost };
