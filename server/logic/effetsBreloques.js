// Résout l'effet de gameplay actuellement actif d'une breloque équipée à
// partir de son `boost` (tel que renvoyé par construireBoost, boosts.js) en
// deltas structurés exploitables par calcul.js :
//  - des multiplicateurs de dégâts (dommages finaux / finaux distance / finaux
//    mêlée), à combiner selon les règles données par le porteur de projet
//    (même type -> addition des bonus, types différents -> multiplication) ;
//  - des bonus de stats "plates" (PA, PM, PO, Soin, Puissance, % Coup
//    Critique, Dommages Critique, Vitalité, Retrait PA/PM, Esquive PA/PM),
//    fusionnées dans calculerStatsPersonnage comme le Parcho ;
//  - un cas à part, `pdvPourcent` (Hémophile) : un pourcentage appliqué au PdV
//    final, pas une stat brute qu'on additionne.
//
// boosts.js (Tâche "onglet Boosts") ne fait que du parsing d'affichage/bornes
// de slider ; ce module-ci est le seul à interpréter le SENS gameplay des
// textes bruts du CSV, volontairement séparé pour ne pas alourdir boosts.js.

// "dommages finaux xN" / "dommages finaux distance xN" / "dommages finaux
// mêlée xN" — gère nativement plusieurs occurrences dans un même texte (ex:
// Tireur d'élite : "dommages finaux distance x1.15, dommages finaux mêlée x0.8").
const REGEX_MULTIPLICATEUR = /dommages finaux(?:\s+(distance|mêlée))?\s*x(-?\d+(?:[.,]\d+)?)/gi;

// Cette seule breloque exprime son bonus de dommages finaux en pourcentage
// brut ("20%") plutôt que la convention "dommages finaux xN" du reste du CSV
// (confirmé par sa description : "augmente ses dommages finaux de 4%").
const NOMS_POURCENT_DOMMAGES_FINAUX = new Set(['Embrasement du Katragon']);

// Suffixe déjà extrait par parseValeurBoost (trim + minuscule) -> clé de stat
// plate correspondante dans calculerStatsPersonnage. Couvre les breloques à
// bonus simple "nombre + unité" (PA, PM, PO, Soin, Puissance, % critique,
// Vitalité — Bombeur fasciné, "vitalité"/"vitalité" selon la casse d'origine).
const SUFFIXE_VERS_STAT = {
  pa: 'PA',
  pm: 'PM',
  po: 'PO',
  soins: 'SOIN',
  puissance: 'PUISSANCE',
  vitalité: 'VITALITE',
  '% critique': '%_COUP_CRITIQUE',
};

// Motifs des bonus composites (plusieurs stats dans un seul texte, détectés
// via >= 2 occurrences signées — voir resoudreTexte) : Retrait PA/PM n'ont pas
// de stat brute existante (contrairement à Esquive PA/PM et Dommages
// Critiques, déjà des clés lues par calculerStatsPersonnage) — accumulées
// dans des clés dédiées *_BRELOQUE, ajoutées à la formule dans calcul.js.
const MOTIFS_COMPOSITES = [
  { regex: /([+-])\s*(\d+)\s*Retrait PA/gi, cle: 'RETRAIT_PA_BRELOQUE' },
  { regex: /([+-])\s*(\d+)\s*Retrait PM/gi, cle: 'RETRAIT_PM_BRELOQUE' },
  { regex: /([+-])\s*(\d+)\s*Esquive PA/gi, cle: 'ESQUIVE_PA' },
  { regex: /([+-])\s*(\d+)\s*Esquive PM/gi, cle: 'ESQUIVE_PM' },
  { regex: /([+-])\s*(\d+)\s*%?\s*Coups?\s*Critiques?/gi, cle: '%_COUP_CRITIQUE' },
  { regex: /([+-])\s*(\d+)\s*Dommages\s*Critiques/gi, cle: 'DO_CRIT' },
];

function valeurSignee(signe, nombre) {
  return (signe === '-' ? -1 : 1) * Number(nombre);
}

function resoudreMultiplicateurs(texte) {
  const resultats = [];
  REGEX_MULTIPLICATEUR.lastIndex = 0;
  let correspondance;
  while ((correspondance = REGEX_MULTIPLICATEUR.exec(texte))) {
    const sousType = correspondance[1] ? correspondance[1].toLowerCase() : null;
    resultats.push({
      type: sousType === 'distance' ? 'finaux_distance' : sousType === 'mêlée' ? 'finaux_melee' : 'finaux',
      valeur: parseFloat(correspondance[2].replace(',', '.')),
    });
  }
  return resultats;
}

function resoudreComposite(texte) {
  const statsPlates = {};
  for (const { regex, cle } of MOTIFS_COMPOSITES) {
    regex.lastIndex = 0;
    let correspondance;
    while ((correspondance = regex.exec(texte))) {
      statsPlates[cle] = (statsPlates[cle] || 0) + valeurSignee(correspondance[1], correspondance[2]);
    }
  }
  return statsPlates;
}

function resoudreEffetSimple(valeur, suffixeBrut) {
  const suffixe = (suffixeBrut || '').trim().toLowerCase();
  if (suffixe === '% pdv') return { statsPlates: {}, pdvPourcent: valeur };
  const cle = SUFFIXE_VERS_STAT[suffixe];
  if (!cle) return { statsPlates: {}, pdvPourcent: 0 };
  return { statsPlates: { [cle]: valeur }, pdvPourcent: 0 };
}

// Interprète un texte déjà "actif" (texteActif d'un toggle, ou reconstruction
// prefixe+valeur+suffixe d'un range/accumulateur) en effet structuré. Ordre de
// classification : multiplicateur de dégâts > composite (>= 2 nombres signés,
// ex: Embourbeur/Forcené) > effet simple (1 seul nombre + unité).
function resoudreTexte(texte) {
  const vide = { multiplicateurs: [], statsPlates: {}, pdvPourcent: 0 };
  if (!texte) return vide;

  const multiplicateurs = resoudreMultiplicateurs(texte);
  if (multiplicateurs.length > 0) return { ...vide, multiplicateurs };

  const occurrencesSignees = texte.match(/[+-]\s*\d+/g) || [];
  if (occurrencesSignees.length >= 2) {
    return { ...vide, statsPlates: resoudreComposite(texte) };
  }

  const matchSimple = texte.trim().match(/^([+-]?\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (matchSimple) {
    const valeur = parseFloat(matchSimple[1].replace(',', '.'));
    const { statsPlates, pdvPourcent } = resoudreEffetSimple(valeur, matchSimple[2]);
    return { multiplicateurs: [], statsPlates, pdvPourcent };
  }

  return vide;
}

// Résout l'effet actif d'UNE breloque équipée. `boost` = null (pas de bonus
// conditionnel) ou objet renvoyé par construireBoost (boosts.js).
function resoudreEffetBreloque(nom, boost) {
  const vide = { multiplicateurs: [], statsPlates: {}, pdvPourcent: 0 };
  if (!boost) return vide;

  if (boost.type === 'toggle') {
    return boost.actif ? resoudreTexte(boost.texteActif) : vide;
  }

  // range / accumulateur : la valeur courante + son préfixe/suffixe sont déjà
  // séparés par construireBoost, pas besoin de reparser un texte brut.
  if (NOMS_POURCENT_DOMMAGES_FINAUX.has(nom)) {
    return { multiplicateurs: [{ type: 'finaux', valeur: 1 + boost.valeur / 100 }], statsPlates: {}, pdvPourcent: 0 };
  }
  if (boost.prefixe && boost.prefixe.startsWith('dommages finaux')) {
    return resoudreTexte(`${boost.prefixe}${boost.valeur}`);
  }
  const { statsPlates, pdvPourcent } = resoudreEffetSimple(boost.valeur, boost.suffixe);
  return { multiplicateurs: [], statsPlates, pdvPourcent };
}

// Agrège l'effet de TOUTES les breloques équipées d'un personnage.
// `breloquesEquipees` : [{ nom, boost } | null].
function calculerEffetsBreloques(breloquesEquipees) {
  const statsPlates = {};
  let pdvPourcent = 0;
  const multiplicateurs = [];

  for (const breloque of breloquesEquipees || []) {
    if (!breloque) continue;
    const effet = resoudreEffetBreloque(breloque.nom, breloque.boost);
    for (const [cle, valeur] of Object.entries(effet.statsPlates)) {
      statsPlates[cle] = (statsPlates[cle] || 0) + valeur;
    }
    pdvPourcent += effet.pdvPourcent;
    multiplicateurs.push(...effet.multiplicateurs);
  }

  return { statsPlates, pdvPourcent, multiplicateurs };
}

// Combine une liste de multiplicateurs de dégâts en un seul facteur, pour un
// mode d'attaque donné ('distance' | 'melee') : les multiplicateurs "finaux
// distance"/"finaux mêlée" de l'autre mode ne s'appliquent pas. Même type ->
// bonus additionnés ; types différents -> facteurs multipliés entre eux.
function combinerMultiplicateurs(multiplicateurs, modeAttaque) {
  const groupes = {};

  for (const { type, valeur } of multiplicateurs || []) {
    if (type === 'finaux_distance' && modeAttaque !== 'distance') continue;
    if (type === 'finaux_melee' && modeAttaque !== 'melee') continue;
    groupes[type] = (groupes[type] || 0) + (valeur - 1);
  }

  return Object.values(groupes).reduce((total, delta) => total * (1 + delta), 1);
}

module.exports = { resoudreEffetBreloque, calculerEffetsBreloques, combinerMultiplicateurs };
