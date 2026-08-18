// Module de calcul de dégâts — Tâche 3
// Fonctions pures, sans dépendance à Express ni MySQL, testables unitairement.

const { combinerMultiplicateurs } = require('./effetsBreloques');

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

// Valeurs de base du personnage hors équipement (avant tout bonus de cube/panoplie).
const BASES_PERSONNAGE = {
  VITALITE: 1050,
  PA: 7,
  PM: 3,
  INVOCATION: 1,
};

// Bonus de panoplie : équiper N cubes d'une même famille (élément, ou Lumière) donne un
// bonus de stats. Le bonus au palier N remplace celui du palier N-1 (pas cumulatif entre
// paliers). Un cube Chaos compte comme 1 cube de CHAQUE famille ci-dessous (pas de bonus
// propre).
const PANOPLIES = {
  'Lumière': {
    2: { PM: 1, VITALITE: 50, SOIN: 5, DO_CRIT: 5 },
    3: { PM: 1, PA: 1, VITALITE: 75, SOIN: 10, DO_CRIT: 10 },
    4: { PM: 1, PA: 1, PO: 1, VITALITE: 100, SOIN: 15, DO_CRIT: 15 },
    // palier 9 : généré par Windsurf, à corriger
    5: { PM: 1, PA: 1, PO: 1, VITALITE: 150, SOIN: 20, DO_CRIT: 20 },
    6: { PM: 2, PA: 1, PO: 1, VITALITE: 175, SOIN: 25, DO_CRIT: 25 },
    7: { PM: 2, PA: 2, PO: 1, VITALITE: 200, SOIN: 30, DO_CRIT: 30 },
    8: { PM: 2, PA: 2, PO: 2, VITALITE: 225, SOIN: 35, DO_CRIT: 35 },
    9: { PM: 2, PA: 2, PO: 2, VITALITE: 250, SOIN: 40, DO_CRIT: 40 },
  },
  Air: {
    2: { VITALITE: 50, AGILITE: 50, DO_AIR: 10 },
    3: { VITALITE: 100, AGILITE: 100, DO_AIR: 20 },
    4: { VITALITE: 150, AGILITE: 150, DO_AIR: 30, PUISSANCE: 25, DOMMAGES: 5 },
    5: { VITALITE: 200, AGILITE: 150, DO_AIR: 30, PUISSANCE: 50, DOMMAGES: 10 },
    6: { VITALITE: 250, AGILITE: 150, DO_AIR: 30, PUISSANCE: 75, DOMMAGES: 15 },
    7: { VITALITE: 300, AGILITE: 150, DO_AIR: 30, PUISSANCE: 100, DOMMAGES: 20 },
    8: { VITALITE: 350, AGILITE: 150, DO_AIR: 30, PUISSANCE: 125, DOMMAGES: 25 },
    9: { VITALITE: 400, AGILITE: 150, DO_AIR: 30, PUISSANCE: 150, DOMMAGES: 30 },
  },
  Terre: {
    2: { VITALITE: 50, FORCE: 50, DO_TERRE: 10 },
    3: { VITALITE: 100, FORCE: 100, DO_TERRE: 20 },
    4: { VITALITE: 150, FORCE: 150, DO_TERRE: 30, PUISSANCE: 25, DOMMAGES: 5 },
    5: { VITALITE: 200, FORCE: 150, DO_TERRE: 30, PUISSANCE: 50, DOMMAGES: 10 },
    6: { VITALITE: 250, FORCE: 150, DO_TERRE: 30, PUISSANCE: 75, DOMMAGES: 15 },
    7: { VITALITE: 300, FORCE: 150, DO_TERRE: 30, PUISSANCE: 100, DOMMAGES: 20 },
    8: { VITALITE: 350, FORCE: 150, DO_TERRE: 30, PUISSANCE: 125, DOMMAGES: 25 },
    9: { VITALITE: 400, FORCE: 150, DO_TERRE: 30, PUISSANCE: 150, DOMMAGES: 30 },
  },
  Eau: {
    2: { VITALITE: 50, CHANCE: 50, DO_EAU: 10 },
    3: { VITALITE: 100, CHANCE: 100, DO_EAU: 20 },
    4: { VITALITE: 150, CHANCE: 150, DO_EAU: 30, PUISSANCE: 25, DOMMAGES: 5 },
    5: { VITALITE: 200, CHANCE: 150, DO_EAU: 30, PUISSANCE: 50, DOMMAGES: 10 },
    6: { VITALITE: 250, CHANCE: 150, DO_EAU: 30, PUISSANCE: 75, DOMMAGES: 15 },
    7: { VITALITE: 300, CHANCE: 150, DO_EAU: 30, PUISSANCE: 100, DOMMAGES: 20 },
    8: { VITALITE: 350, CHANCE: 150, DO_EAU: 30, PUISSANCE: 125, DOMMAGES: 25 },
    9: { VITALITE: 400, CHANCE: 150, DO_EAU: 30, PUISSANCE: 150, DOMMAGES: 30 },
  },
  Feu: {
    2: { VITALITE: 50, INTELLIGENCE: 50, DO_FEU: 10 },
    3: { VITALITE: 100, INTELLIGENCE: 100, DO_FEU: 20 },
    4: { VITALITE: 150, INTELLIGENCE: 150, DO_FEU: 30, PUISSANCE: 25, DOMMAGES: 5 },
    5: { VITALITE: 200, INTELLIGENCE: 150, DO_FEU: 30, PUISSANCE: 50, DOMMAGES: 10 },
    6: { VITALITE: 250, INTELLIGENCE: 150, DO_FEU: 30, PUISSANCE: 75, DOMMAGES: 15 },
    7: { VITALITE: 300, INTELLIGENCE: 150, DO_FEU: 30, PUISSANCE: 100, DOMMAGES: 20 },
    8: { VITALITE: 350, INTELLIGENCE: 150, DO_FEU: 30, PUISSANCE: 125, DOMMAGES: 25 },
    9: { VITALITE: 400, INTELLIGENCE: 150, DO_FEU: 30, PUISSANCE: 150, DOMMAGES: 30 },
  },
};

// Compte le nombre de cubes équipés par famille (Air, Feu, Terre, Eau, Lumière). Un
// cube Chaos compte comme 1 cube de chaque famille (mais pas de sa propre famille,
// Chaos n'a pas de panoplie).
function compterCubesParFamille(cubesEquipes) {
  const familles = ['Air', 'Feu', 'Terre', 'Eau', 'Lumière'];
  const compte = Object.fromEntries(familles.map((f) => [f, 0]));

  for (const cube of cubesEquipes || []) {
    if (!cube || !cube.element) continue;
    if (cube.element === 'Chaos') {
      familles.forEach((f) => { compte[f] += 1; });
    } else if (compte[cube.element] !== undefined) {
      compte[cube.element] += 1;
    }
  }

  return compte;
}

/**
 * Détail par famille des panoplies actives (>= 2 cubes), utilisé pour l'affichage
 * sur la fiche perso (une entrée par famille, avec son propre bonus non fusionné —
 * contrairement à `calculerBonusPanoplies` qui fusionne tout en un seul objet pour
 * le calcul des stats).
 * @returns {Array<{ famille: string, nombre: number, palier: number, bonus: Object }>}
 */
function calculerPanopliesActives(cubesEquipes) {
  const compte = compterCubesParFamille(cubesEquipes);
  const actives = [];

  for (const [famille, nombre] of Object.entries(compte)) {
    const table = PANOPLIES[famille];
    if (!table || nombre < 2) continue;

    const paliersAtteignables = Object.keys(table).map(Number).filter((p) => p <= nombre);
    if (paliersAtteignables.length === 0) continue;
    const palier = Math.max(...paliersAtteignables);

    actives.push({ famille, nombre, palier, bonus: table[palier] });
  }

  return actives;
}

// Calcule les bonus de stats apportés par les panoplies actives (>= 2 cubes d'une même
// famille), en tenant compte des cubes Chaos comptés dans chaque famille.
function calculerBonusPanoplies(cubesEquipes) {
  const bonus = {};

  for (const { bonus: bonusFamille } of calculerPanopliesActives(cubesEquipes)) {
    for (const [cle, valeur] of Object.entries(bonusFamille)) {
      bonus[cle] = (bonus[cle] || 0) + valeur;
    }
  }

  return bonus;
}

/**
 * Étape 1 : agrège les stats du personnage à partir des cubes équipés.
 *
 * @param {Array<{ element: string, stats: Array<{ key: string, value: number }> } | null>} cubesEquipes
 *   Liste des cubes équipés (format `cubes_v2.json` : { element, stats: [{ key, value, label }] }).
 *   Les emplacements vides (null/undefined) sont ignorés.
 * @param {Object} [bonusParcho] Bonus de caractéristiques éditable par le joueur (ex:
 *   { VITALITE, SAGESSE, FORCE, INTELLIGENCE, CHANCE, AGILITE }), ajouté aux stats brutes
 *   avant tout calcul dérivé — pour que PdV/Initiative/Tacle/Fuite/Retrait/Esquive en
 *   tiennent compte automatiquement, comme pour les bonus de cubes/panoplie.
 * @param {Object} [effetsBreloques] Résultat de `calculerEffetsBreloques` (effetsBreloques.js) :
 *   `{ statsPlates, pdvPourcent }`. `statsPlates` fusionné comme le Parcho ; `pdvPourcent`
 *   (breloque de l'Hémophile) appliqué en multiplicateur sur `VITALITE_TOTALE`, après coup
 *   (ce n'est pas une stat brute qu'on additionne).
 * @returns {Object} Stats brutes sommées par clé (cubes + bonus de panoplie + Parcho +
 *   bonus de breloques inclus), plus les stats dérivées : `INITIATIVE_TOTALE`, `VITALITE_TOTALE`,
 *   `PA_TOTAL`, `PM_TOTAL`, `INVOCATION_TOTALE`, `TACLE_TOTAL`, `FUITE_TOTALE`,
 *   `RETRAIT_PA_TOTAL`, `RETRAIT_PM_TOTAL`, `ESQUIVE_PA_TOTALE`, `ESQUIVE_PM_TOTALE`,
 *   `DOMMAGES_FEU_TOTAL`, `DOMMAGES_TERRE_TOTAL`, `DOMMAGES_EAU_TOTAL`, `DOMMAGES_AIR_TOTAL`.
 */
function calculerStatsPersonnage(cubesEquipes, bonusParcho = {}, effetsBreloques = {}) {
  const stats = {};
  const { statsPlates: bonusBreloques = {}, pdvPourcent = 0 } = effetsBreloques;

  for (const cube of cubesEquipes || []) {
    if (!cube || !cube.stats) continue;
    for (const stat of cube.stats) {
      stats[stat.key] = (stats[stat.key] || 0) + stat.value;
    }
  }

  // Bonus de panoplie (>= 2 cubes d'une même famille), ajoutés aux stats brutes avant
  // tout calcul dérivé (PA/PM total, etc. doivent en tenir compte).
  const bonusPanoplies = calculerBonusPanoplies(cubesEquipes);
  for (const [cle, valeur] of Object.entries(bonusPanoplies)) {
    stats[cle] = (stats[cle] || 0) + valeur;
  }

  // Bonus "Parcho" (scrolls simulés par le joueur), même traitement que les bonus de
  // panoplie : ajoutés avant la dérivation pour impacter PdV/Initiative/Tacle/Fuite/
  // Retrait/Esquive automatiquement.
  for (const [cle, valeur] of Object.entries(bonusParcho || {})) {
    stats[cle] = (stats[cle] || 0) + (valeur || 0);
  }

  // Bonus de breloques (onglet "Boosts breloques") actuellement actives : même
  // traitement que Parcho/panoplie, sauf RETRAIT_PA/PM_BRELOQUE et pdvPourcent
  // (Hémophile) traités à part plus bas, pas de stat brute équivalente.
  for (const [cle, valeur] of Object.entries(bonusBreloques)) {
    stats[cle] = (stats[cle] || 0) + (valeur || 0);
  }

  // Initiative = somme des 4 caractéristiques offensives + bonus Initiative éventuel
  // (cubes Lumière). Ne rentre jamais dans le calcul de dégâts, affichage seulement.
  stats.INITIATIVE_TOTALE =
    (stats.FORCE || 0) + (stats.INTELLIGENCE || 0) + (stats.CHANCE || 0) +
    (stats.AGILITE || 0) + (stats.INITIATIVE || 0);

  // Stats avec une valeur de base non nulle hors équipement. `pdvPourcent`
  // (breloque de l'Hémophile) s'applique en multiplicateur sur le total, pas
  // en addition — arrondi ici (pas de calcul ultérieur qui en dépend).
  stats.VITALITE_TOTALE = Math.round((BASES_PERSONNAGE.VITALITE + (stats.VITALITE || 0)) * (1 + pdvPourcent / 100));
  stats.PA_TOTAL = BASES_PERSONNAGE.PA + (stats.PA || 0);
  stats.PM_TOTAL = BASES_PERSONNAGE.PM + (stats.PM || 0);
  stats.INVOCATION_TOTALE = BASES_PERSONNAGE.INVOCATION + (stats.INVOCATION || 0);

  // Tacle = 1 par tranche de 10 Agilité (troncature). Fuite = 1 par tranche de 10
  // Chance (troncature) + bonus Fuite direct des cubes.
  stats.TACLE_TOTAL = Math.floor((stats.AGILITE || 0) / 10);
  stats.FUITE_TOTALE = Math.floor((stats.CHANCE || 0) / 10) + (stats.FUITE || 0);

  // Retrait PA/PM et Esquive PA/PM partent toutes du même palier : 1 par tranche de 10
  // Sagesse (troncature). Esquive PA/PM peut en plus être augmentée directement par des
  // cubes ou des breloques (stat ESQUIVE_PA/ESQUIVE_PM, même clé pour les deux sources,
  // déjà fusionnée dans `stats` ci-dessus). Retrait PA/PM n'a pas de stat cube
  // équivalente ; seules les breloques l'augmentent, via RETRAIT_PA/PM_BRELOQUE
  // (clés dédiées, calculerEffetsBreloques/effetsBreloques.js).
  const palierSagesse = Math.floor((stats.SAGESSE || 0) / 10);
  stats.RETRAIT_PA_TOTAL = palierSagesse + (stats.RETRAIT_PA_BRELOQUE || 0);
  stats.RETRAIT_PM_TOTAL = palierSagesse + (stats.RETRAIT_PM_BRELOQUE || 0);
  stats.ESQUIVE_PA_TOTALE = palierSagesse + (stats.ESQUIVE_PA || 0);
  stats.ESQUIVE_PM_TOTALE = palierSagesse + (stats.ESQUIVE_PM || 0);

  // Dommages élémentaires affichables sur la fiche perso = Dommages globaux + dommages
  // directs de l'élément (la stat "Dommages" seule n'est jamais affichée telle quelle).
  stats.DOMMAGES_FEU_TOTAL = (stats.DOMMAGES || 0) + (stats.DO_FEU || 0);
  stats.DOMMAGES_TERRE_TOTAL = (stats.DOMMAGES || 0) + (stats.DO_TERRE || 0);
  stats.DOMMAGES_EAU_TOTAL = (stats.DOMMAGES || 0) + (stats.DO_EAU || 0);
  stats.DOMMAGES_AIR_TOTAL = (stats.DOMMAGES || 0) + (stats.DO_AIR || 0);

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

// Même formule que les dégâts, mais pour les sorts de soin (Mot Soignant/Curatif/
// Revitalisant) : la Puissance ne compte pas (contrairement aux dégâts), et le "b"
// de la formule est la stat Soin plutôt que Dommages/DO_<ELEMENT>.
function calculerStatEfficaceSoin(statsPersonnage, element) {
  return statsPersonnage[STAT_PAR_ELEMENT[element]] || 0;
}

function calculerBonusSoin(statsPersonnage) {
  return statsPersonnage.SOIN || 0;
}

function calculerSoinPourElement(statsPersonnage, soinBase, element) {
  const stat = calculerStatEfficaceSoin(statsPersonnage, element);
  const multiplicateur = 1 + 0.01 * stat;
  return soinBase * multiplicateur + calculerBonusSoin(statsPersonnage);
}

// Pour les sorts "meilleur élément" (Chaos/Lumière/Assaut Magique...) : détermine
// l'élément de frappe qui donnerait le plus de dégâts, en se basant sur la moyenne
// min/max de la ligne (le classement des éléments ne dépend pas du dégât de base
// choisi, seul le bonus de dommages direct par élément peut faire varier le classement).
function choisirMeilleurElement(statsPersonnage, degatsBaseMoyen) {
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

// Équivalent pour un sort de soin "meilleur élément" (Mot Revitalisant) : classe
// uniquement sur la caractéristique brute (pas de Puissance, pas de bonus par
// élément — la stat Soin est la même quel que soit l'élément choisi, elle ne
// peut donc jamais départager le classement).
function choisirMeilleurElementSoin(statsPersonnage) {
  let meilleurElement = ELEMENTS_DE_FRAPPE[0];
  let meilleureStat = -Infinity;

  for (const element of ELEMENTS_DE_FRAPPE) {
    const stat = statsPersonnage[STAT_PAR_ELEMENT[element]] || 0;
    if (stat > meilleureStat) {
      meilleureStat = stat;
      meilleurElement = element;
    }
  }

  return meilleurElement;
}

// Résout la ou les éléments de frappe réels d'une ligne de dégâts/soin d'un sort
// (`ligne.element`, ou hérité de `sort.element` si absent) :
// - un des 4 éléments de frappe → ce seul élément
// - 'Meilleur élément' → l'élément le plus avantageux pour ce perso (formule dégâts
//   ou soin selon `sort.estSoin`)
// - tableau de 2 éléments (sort qui tape dans 2 éléments à la fois, ex: Bluff) →
//   les deux éléments, un calcul distinct pour chacun
// - autre cas (pas d'élément, sort sans dégâts...) → tableau vide
function resoudreElements(statsPersonnage, sort, ligne) {
  const element = ligne.element ?? sort.element;

  if (Array.isArray(element)) {
    return element.filter((el) => ELEMENTS_DE_FRAPPE.includes(el));
  }
  if (element === 'Meilleur élément') {
    if (sort.estSoin) return [choisirMeilleurElementSoin(statsPersonnage)];
    const degatsBaseMoyen = ligne.degatsMin != null
      ? (ligne.degatsMin + ligne.degatsMax) / 2
      : (ligne.degatsCritiqueMin + ligne.degatsCritiqueMax) / 2;
    return [choisirMeilleurElement(statsPersonnage, degatsBaseMoyen)];
  }
  if (ELEMENTS_DE_FRAPPE.includes(element)) {
    return [element];
  }
  return [];
}

// Construit la liste des lignes "brutes" d'un sort : la ligne principale (colonnes
// du Sort lui-même) si elle porte une valeur, puis chaque ligne supplémentaire
// (SortDegatsSup, ex: Bluff/Tourbillon Embrasé/Pile ou Face/Foène/Pelle Aveuglante)
// qui en porte une. Une ligne sans aucune valeur (ni dégâts, ni critique) est omise.
function construireLignes(sort) {
  const lignes = [];

  if (sort.degatsMin != null || sort.degatsCritiqueMin != null) {
    lignes.push({
      element: sort.element,
      degatsMin: sort.degatsMin,
      degatsMax: sort.degatsMax,
      degatsCritiqueMin: sort.degatsCritiqueMin,
      degatsCritiqueMax: sort.degatsCritiqueMax,
    });
  }

  for (const supp of sort.lignesSupplementaires || []) {
    if (supp.degatsMin == null && supp.degatsCritiqueMin == null) continue;
    lignes.push({
      element: supp.element ?? sort.element,
      degatsMin: supp.degatsMin,
      degatsMax: supp.degatsMax,
      degatsCritiqueMin: supp.degatsCritiqueMin,
      degatsCritiqueMax: supp.degatsCritiqueMax,
    });
  }

  return lignes;
}

/**
 * Étape 2 : calcule les dégâts (ou le soin, pour les sorts `estSoin`) de chaque
 * sort équipé à partir des stats du personnage.
 *
 * @param {Object} statsPersonnage Résultat de `calculerStatsPersonnage`.
 * @param {Array<{ id: number|string, degatsMin: number|null, degatsMax: number|null,
 *   element: string|string[]|null, degatsCritiqueMin?: number|null,
 *   degatsCritiqueMax?: number|null, chanceCritique?: number|null, estSoin?: boolean,
 *   lignesSupplementaires?: Array<{ element?: string|null, degatsMin?: number|null,
 *   degatsMax?: number|null, degatsCritiqueMin?: number|null, degatsCritiqueMax?: number|null }>
 *   } | null>} sortsEquipes
 *   `degatsCritiqueMin/Max` et `chanceCritique` sont optionnels : absents, ils ne
 *   produisent simplement pas les clés correspondantes dans le résultat.
 *   `lignesSupplementaires` (optionnel) : lignes de dégâts indépendantes de la ligne
 *   principale (ex: 2e ligne de Pile ou Face/Foène/Pelle Aveuglante, lignes 2 à 4 de
 *   Tourbillon Embrasé) — `element` absent hérite de `sort.element`, `degatsMin/Max`
 *   peuvent être absents si la ligne n'existe qu'au critique (Pile ou Face).
 * @param {Object} [options]
 * @param {Array<{type: string, valeur: number}>} [options.multiplicateursBreloques] Résultat
 *   de `calculerEffetsBreloques(...).multiplicateurs` (effetsBreloques.js) — multiplicateurs
 *   de dégâts des breloques actuellement actives, combinés via `combinerMultiplicateurs`
 *   selon `modeAttaque` puis appliqués en facteur final sur chaque dégât (normal ET
 *   critique). Jamais appliqués aux sorts de soin (`estSoin`).
 * @param {'distance'|'melee'} [options.modeAttaque] Une attaque est toujours soit distance
 *   soit mêlée, jamais les deux (choix du joueur, onglet Sorts) — détermine quels
 *   multiplicateurs "finaux distance"/"finaux mêlée" s'appliquent. Par défaut 'distance'.
 * @returns {Array<{ sortId: number|string, element: string, degatsMin?: number,
 *   degatsMax?: number, degatsCritiqueMin?: number, degatsCritiqueMax?: number,
 *   chanceCritiqueTotal?: number, estSoin?: true }>} Une entrée par ligne ET par élément
 *   de frappe concerné (2 entrées pour une ligne qui tape dans 2 éléments à la fois,
 *   comme Bluff ; 4 entrées pour un sort à 4 lignes indépendantes, comme Tourbillon
 *   Embrasé). `degatsMin/Max` absents si la ligne n'a de valeur qu'au critique (Pile ou
 *   Face). Les lignes/sorts sans aucune valeur ou sans élément de frappe sont omis.
 *   Les dégâts sont arrondis à l'entier le plus proche (jamais affichés en décimal).
 *   `chanceCritiqueTotal` = % critique de base du sort + stat `%_COUP_CRITIQUE` du
 *   personnage (jamais arrondi, c'est déjà un entier des deux côtés).
 */
function calculerDegats(statsPersonnage, sortsEquipes, options = {}) {
  const { multiplicateursBreloques = [], modeAttaque = 'distance' } = options;
  const multiplicateurFinal = combinerMultiplicateurs(multiplicateursBreloques, modeAttaque);
  const resultats = [];

  for (const sort of sortsEquipes || []) {
    if (!sort) continue;

    // Les multiplicateurs de breloques (dommages finaux) sont une mécanique de
    // dégâts : ne s'appliquent jamais aux sorts de soin.
    const facteur = sort.estSoin ? 1 : multiplicateurFinal;
    const calculerValeurPour = sort.estSoin ? calculerSoinPourElement : calculerDegatsPourElement;

    for (const ligne of construireLignes(sort)) {
      const elements = resoudreElements(statsPersonnage, sort, ligne);

      for (const element of elements) {
        const resultat = { sortId: sort.id, element };
        if (sort.estSoin) resultat.estSoin = true;

        if (ligne.degatsMin != null && ligne.degatsMax != null) {
          resultat.degatsMin = Math.round(calculerValeurPour(statsPersonnage, ligne.degatsMin, element) * facteur);
          resultat.degatsMax = Math.round(calculerValeurPour(statsPersonnage, ligne.degatsMax, element) * facteur);
        }

        if (ligne.degatsCritiqueMin != null && ligne.degatsCritiqueMax != null) {
          resultat.degatsCritiqueMin = Math.round(
            calculerValeurPour(statsPersonnage, ligne.degatsCritiqueMin, element) * facteur
          );
          resultat.degatsCritiqueMax = Math.round(
            calculerValeurPour(statsPersonnage, ligne.degatsCritiqueMax, element) * facteur
          );
        }

        if (sort.chanceCritique != null) {
          resultat.chanceCritiqueTotal = sort.chanceCritique + (statsPersonnage['%_COUP_CRITIQUE'] || 0);
        }

        resultats.push(resultat);
      }
    }
  }

  return resultats;
}

module.exports = { calculerStatsPersonnage, calculerDegats, calculerPanopliesActives };
