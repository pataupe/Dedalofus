// Module de calcul de dégâts — Tâche 3
// Fonctions pures, sans dépendance à Express ni MySQL, testables unitairement.

// Éléments de frappe réels (Chaos et Lumière ne sont pas des éléments de frappe :
// ce sont des familles de cubes, et les sorts Chaos/Lumière tapent soit dans le
// "meilleur élément", soit dans 2 éléments à la fois, soit pas de dégâts du tout).
const ELEMENTS_DE_FRAPPE = ['Feu', 'Terre', 'Eau', 'Air'];

// Caractéristique liée à chaque élément de frappe.
const STAT_PAR_ELEMENT = {
  Feu: 'INTELLIGENCE',
  Terre: 'FORCE',
  Eau: 'CHANCE',
  Air: 'AGILITE',
};

// Stat de "dommages directs" propre à chaque élément (ex: DO_FEU ne boost que le Feu),
// à distinguer de DOMMAGES qui boost tous les éléments.
const DOMMAGES_DIRECTS_PAR_ELEMENT = {
  Feu: 'DO_FEU',
  Terre: 'DO_TERRE',
  Eau: 'DO_EAU',
  Air: 'DO_AIR',
};

/**
 * Étape 1 : agrège les stats du personnage à partir des cubes équipés.
 *
 * @param {Array<{ stats: Array<{ key: string, value: number }> } | null>} cubesEquipes
 *   Liste des cubes équipés (format `cubes_v2.json` : { stats: [{ key, value, label }] }).
 *   Les emplacements vides (null/undefined) sont ignorés.
 * @returns {Object} Stats brutes sommées par clé (ex: { FORCE: 150, INTELLIGENCE: 450,
 *   PUISSANCE: 170, DOMMAGES: 11, ... }), plus une clé dérivée `INITIATIVE_TOTALE`.
 */
function calculerStatsPersonnage(cubesEquipes) {
  const stats = {};

  for (const cube of cubesEquipes || []) {
    if (!cube || !cube.stats) continue;
    for (const stat of cube.stats) {
      stats[stat.key] = (stats[stat.key] || 0) + stat.value;
    }
  }

  // Initiative = somme des 4 caractéristiques offensives + bonus Initiative éventuel
  // (cubes Lumière). Ne rentre jamais dans le calcul de dégâts, affichage seulement.
  stats.INITIATIVE_TOTALE =
    (stats.FORCE || 0) + (stats.INTELLIGENCE || 0) + (stats.CHANCE || 0) +
    (stats.AGILITE || 0) + (stats.INITIATIVE || 0);

  return stats;
}

// "1 stat" pour un élément donné = la caractéristique liée à cet élément + la Puissance
// (1 Puissance = 1 stat dans tous les éléments).
function calculerStatEfficace(statsPersonnage, element) {
  const statElement = statsPersonnage[STAT_PAR_ELEMENT[element]] || 0;
  const puissance = statsPersonnage.PUISSANCE || 0;
  return statElement + puissance;
}

// Le "b" de la formule ax + b : Dommages globaux (tous éléments) + dommages directs
// propres à l'élément (ex: DO_FEU).
function calculerBonusDommages(statsPersonnage, element) {
  const dommagesGlobaux = statsPersonnage.DOMMAGES || 0;
  const dommagesDirects = statsPersonnage[DOMMAGES_DIRECTS_PAR_ELEMENT[element]] || 0;
  return dommagesGlobaux + dommagesDirects;
}

// Dégâts d'un coup de base `degatsBase` dans un élément donné : ax + b, où
// a = 1 + 0.01 * stat efficace, b = bonus de dommages. Retourne une valeur décimale
// non arrondie (l'arrondi final se fait à l'affichage, jamais pendant le calcul).
function calculerDegatsPourElement(statsPersonnage, degatsBase, element) {
  const stat = calculerStatEfficace(statsPersonnage, element);
  const multiplicateur = 1 + 0.01 * stat;
  const bonus = calculerBonusDommages(statsPersonnage, element);
  return degatsBase * multiplicateur + bonus;
}

// Pour les sorts "meilleur élément" (Chaos/Lumière/Assaut Magique...) : détermine
// l'élément de frappe qui donnerait le plus de dégâts, en se basant sur la moyenne
// min/max du sort (le classement des éléments ne dépend pas du dégât de base choisi,
// seul le bonus de dommages direct par élément peut faire varier le classement).
function choisirMeilleurElement(statsPersonnage, sort) {
  const degatsBaseMoyen = (sort.degatsMin + sort.degatsMax) / 2;
  let meilleurElement = ELEMENTS_DE_FRAPPE[0];
  let meilleurDegats = -Infinity;

  for (const element of ELEMENTS_DE_FRAPPE) {
    const degats = calculerDegatsPourElement(statsPersonnage, degatsBaseMoyen, element);
    if (degats > meilleurDegats) {
      meilleurDegats = degats;
      meilleurElement = element;
    }
  }

  return meilleurElement;
}

// Résout la ou les éléments de frappe réels d'un sort :
// - `sort.element` = un des 4 éléments de frappe → ce seul élément
// - `sort.element` = 'Meilleur élément' → l'élément le plus avantageux pour ce perso
// - `sort.element` = tableau de 2 éléments (sort qui tape dans 2 éléments à la fois,
//   ex: certains sorts Chaos) → les deux éléments, un calcul distinct pour chacun
// - autre cas (pas d'élément, sort sans dégâts...) → tableau vide
function resoudreElements(statsPersonnage, sort) {
  if (Array.isArray(sort.element)) {
    return sort.element.filter((el) => ELEMENTS_DE_FRAPPE.includes(el));
  }
  if (sort.element === 'Meilleur élément') {
    return [choisirMeilleurElement(statsPersonnage, sort)];
  }
  if (ELEMENTS_DE_FRAPPE.includes(sort.element)) {
    return [sort.element];
  }
  return [];
}

/**
 * Étape 2 : calcule les dégâts de chaque sort équipé à partir des stats du personnage.
 *
 * @param {Object} statsPersonnage Résultat de `calculerStatsPersonnage`.
 * @param {Array<{ id: number|string, degatsMin: number|null, degatsMax: number|null,
 *   element: string|string[]|null } | null>} sortsEquipes
 * @returns {Array<{ sortId: number|string, element: string, degatsMin: number,
 *   degatsMax: number }>} Un élément du tableau par sort ET par élément de frappe
 *   concerné (2 entrées pour un sort qui tape dans 2 éléments à la fois). Les sorts
 *   sans dégâts (degatsMin/Max absents) ou sans élément de frappe sont omis.
 *   Les dégâts sont arrondis à l'entier le plus proche (jamais affichés en décimal).
 */
function calculerDegats(statsPersonnage, sortsEquipes) {
  const resultats = [];

  for (const sort of sortsEquipes || []) {
    if (!sort || sort.degatsMin == null || sort.degatsMax == null) continue;

    const elements = resoudreElements(statsPersonnage, sort);
    for (const element of elements) {
      resultats.push({
        sortId: sort.id,
        element,
        degatsMin: Math.round(calculerDegatsPourElement(statsPersonnage, sort.degatsMin, element)),
        degatsMax: Math.round(calculerDegatsPourElement(statsPersonnage, sort.degatsMax, element)),
      });
    }
  }

  return resultats;
}

module.exports = { calculerStatsPersonnage, calculerDegats };
