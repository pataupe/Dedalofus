// Génère client/src/data/ensembles.json (+ copie server/data/ensembles.json, requise
// par le contrôleur pour le calcul) à partir de data/Liste-des-ensembles.md.
// Usage : node server/scripts/generate-ensembles.js
//
// Les ensembles de cubes (5) NE viennent PAS du .md (valeurs confirmées fausses pour
// ce groupe par le porteur de projet) : ils sont reconstruits directement depuis
// PANOPLIES (server/logic/calcul.js), déjà validé et affiché sur la fiche perso.
// Les ensembles classiques (10) et boss (14) viennent du .md, résolus contre la vraie
// base (Sort/Breloque). Rejouable : ne modifie aucune donnée, se contente de lire la
// DB et d'écrire les 2 fichiers JSON.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { PANOPLIES } = require('../logic/calcul');

const CHEMIN_MD = path.join(__dirname, '..', '..', 'data', 'Liste-des-ensembles.md');
const CHEMIN_JSON_CLIENT = path.join(__dirname, '..', '..', 'client', 'src', 'data', 'ensembles.json');
const CHEMIN_JSON_SERVER = path.join(__dirname, '..', 'data', 'ensembles.json');

// ============================================
// Utils texte
// ============================================

// Le .md source utilise des apostrophes typographiques ('/', U+2019/U+2018) là où la
// base utilise des apostrophes droites (') — sans ce remplacement, "Piège d'Immobilisation"
// (md) ne matcherait jamais "Piège d'immobilisation" (DB) même après tout le reste de la
// normalisation.
function normaliserTexte(texte) {
  return texte
    .replace(/[‘’`]/g, "'")
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function slugifier(texte) {
  return normaliserTexte(texte)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// "Ensemble de l'altruiste" -> "Ensemble de l'Altruiste" (capitalise le mot qui suit
// l'article) — la casse du .md est inconsistante d'une ligne à l'autre, celles déjà
// bien capitalisées (ex: titres boss) ne matchent simplement pas et restent inchangées.
function formaterNomEnsemble(nomBrut) {
  return nomBrut.replace(
    /(Ensemble (?:de l['’]|du |des |de la ))([a-zàâäéèêëïîôöùûüç])/,
    (m, prefixe, lettre) => prefixe + lettre.toUpperCase()
  );
}

// ============================================
// Parsing du texte de bonus par palier -> deltas structurés
// ============================================

const LIBELLE_VERS_CLE = {
  pv: 'VITALITE',
  'points de vie': 'VITALITE',
  vitalite: 'VITALITE',
  pa: 'PA',
  pm: 'PM',
  po: 'PO',
  fuite: 'FUITE',
  tacle: 'TACLE',
  soins: 'SOIN',
  soin: 'SOIN',
  puissance: 'PUISSANCE',
  'puissance pieges': 'PUISSANCE_PIEGE',
  'do pieges': 'DO_PIEGE',
  'dommages pieges': 'DO_PIEGE',
  sagesse: 'SAGESSE',
  invocation: 'INVOCATION',
  invocations: 'INVOCATION',
  'dommages critiques': 'DO_CRIT',
  'dommages critique': 'DO_CRIT',
  cc: '%_COUP_CRITIQUE',
  'dommages de poussees': 'DO_POU',
  'do pou': 'DO_POU',
  'res crit': 'RES_CRIT',
  'res do pou': 'RES_POU',
};

const CLES_RESISTANCES_FIXES = ['RES_TERRE', 'RES_EAU', 'RES_FEU', 'RES_AIR', 'RES_NEUTRE'];
const CLES_RESISTANCES_POURCENT = ['%_RES_TERRE', '%_RES_EAU', '%_RES_FEU', '%_RES_AIR', '%_RES_NEUTRE'];

// Découpe un texte de bonus ("+300 Sagesse, +50 Dommages de Poussées, +1PA") en deltas
// structurés { statsPlates, multiplicateurs }. "% résistances distance/mêlée" reste
// volontairement sans delta (indicatif seulement, cf. sorts-degats-indirects.md) — le
// texte brut, lui, est toujours conservé ailleurs pour l'affichage catalogue.
function parserBonusTexte(texte) {
  const statsPlates = {};
  const multiplicateurs = [];

  const segments = (texte || '').split(',').map((s) => s.trim()).filter(Boolean);

  for (const segment of segments) {
    const match = segment.match(/^([+-]?\d+(?:[.,]\d+)?)\s*%?\s*(.*)$/);
    if (!match) continue;

    const valeur = parseFloat(match[1].replace(',', '.'));
    const reste = normaliserTexte(match[2]);
    if (!reste) continue;

    if (reste.includes('retrait pa/pm')) {
      statsPlates.RETRAIT_PA_BRELOQUE = (statsPlates.RETRAIT_PA_BRELOQUE || 0) + valeur;
      statsPlates.RETRAIT_PM_BRELOQUE = (statsPlates.RETRAIT_PM_BRELOQUE || 0) + valeur;
      continue;
    }
    if (reste.includes('resistances fixes')) {
      for (const cle of CLES_RESISTANCES_FIXES) statsPlates[cle] = (statsPlates[cle] || 0) + valeur;
      continue;
    }
    if (reste.includes('resistances dans tous les elements')) {
      for (const cle of CLES_RESISTANCES_POURCENT) statsPlates[cle] = (statsPlates[cle] || 0) + valeur;
      continue;
    }
    if (reste.includes('resistances distance') || reste.includes('resistances melee')) {
      continue; // indicatif seulement, aucun delta
    }
    if (reste.includes('dommages distance') || reste.includes('degats distance')) {
      multiplicateurs.push({ type: 'finaux_distance', valeur: 1 + valeur / 100 });
      continue;
    }
    if (reste.includes('dommages melee') || reste.includes('degats melee')) {
      multiplicateurs.push({ type: 'finaux_melee', valeur: 1 + valeur / 100 });
      continue;
    }
    if (reste.includes('dommages indirect') || reste.includes('degats indirect')) {
      multiplicateurs.push({ type: 'indirects', valeur: 1 + valeur / 100 });
      continue;
    }

    const cle = LIBELLE_VERS_CLE[reste];
    if (cle) statsPlates[cle] = (statsPlates[cle] || 0) + valeur;
    // sinon : segment non reconnu ("Aucun bonus"...), ignoré pour le delta.
  }

  return { statsPlates, multiplicateurs };
}

// ============================================
// Parsing du markdown (classiques + boss ; les tables cubes sont ignorées, cf. en-tête)
// ============================================

function parserEnsemblesMd(contenu) {
  const lignesBrutes = contenu.split(/\r?\n/);
  const classiques = [];
  const boss = [];

  let section = null; // 'classiques' | 'boss' | null
  let ensembleActuel = null;
  let sousListe = null; // 'sorts' | 'breloques' (classiques uniquement)

  function clore() {
    if (ensembleActuel) {
      (section === 'classiques' ? classiques : boss).push(ensembleActuel);
    }
    ensembleActuel = null;
    sousListe = null;
  }

  for (const brute of lignesBrutes) {
    const ligne = brute.trim();

    if (ligne === 'Ensembles classiques (Sorts et/ou Breloques)') {
      clore();
      section = 'classiques';
      continue;
    }
    if (ligne === 'Ensembles de Boss') {
      clore();
      section = 'boss';
      continue;
    }
    if (!section || !ligne) continue;

    if (/^Ensemble /.test(ligne)) {
      clore();
      ensembleActuel = { nomBrut: ligne, sorts: [], breloques: [], bonusSpecial: null, paliers: [], breloqueBoss: null, sortBoss: null };
      continue;
    }
    if (!ensembleActuel) continue; // ligne d'intro générique de section, ignorée

    if (ligne === 'Sorts inclus :') {
      sousListe = 'sorts';
      continue;
    }
    if (ligne === 'Breloques incluses :') {
      sousListe = 'breloques';
      continue;
    }
    if (ligne.startsWith('–') || ligne.startsWith('-')) {
      const item = ligne.replace(/^[–-]\s*/, '');
      if (sousListe === 'sorts') ensembleActuel.sorts.push(item);
      else if (sousListe === 'breloques') ensembleActuel.breloques.push(item);
      continue;
    }

    const matchSpecial = ligne.match(/^Bonus spécial \((\d+) objets?\)\s*:\s*(.*)$/i);
    if (matchSpecial) {
      const texte = matchSpecial[2].trim();
      ensembleActuel.bonusSpecial = /^aucun$/i.test(texte) ? null : { seuil: Number(matchSpecial[1]), texte };
      continue;
    }

    const matchBreloqueBoss = ligne.match(/^Breloque\s*\(([^)]+)\)\s*:\s*(.*)$/i);
    if (matchBreloqueBoss) {
      ensembleActuel.breloqueBoss = { nom: matchBreloqueBoss[1].trim() };
      continue;
    }
    const matchSortBoss = ligne.match(/^Sort\s*\(([^)]+)\)\s*:\s*(.*)$/i);
    if (matchSortBoss) {
      ensembleActuel.sortBoss = { nom: matchSortBoss[1].trim() };
      continue;
    }

    if (/^Objets équipés/.test(ligne)) continue; // en-tête de table, ignoré

    const matchPalier = ligne.match(/^(\d+)\t(.+)$/);
    if (matchPalier) {
      ensembleActuel.paliers.push({ items: Number(matchPalier[1]), texte: matchPalier[2].trim() });
      continue;
    }
    // ligne non reconnue : ignorée silencieusement
  }
  clore();

  return { classiques, boss };
}

// ============================================
// Éléments dans un nom de pièce ("Mot curatif (feu et eau)")
// ============================================

const ELEMENTS = ['Terre', 'Eau', 'Feu', 'Air'];

function extraireElements(texte) {
  const normalise = normaliserTexte(texte);
  return ELEMENTS.filter((el) => new RegExp(`\\b${normaliserTexte(el)}\\b`).test(normalise));
}

// "Griffe joueuse (Maître β uniquement, air et eau)" -> nomBase "Griffe joueuse",
// elements ['Air','Eau'], note "Maître β uniquement" (texte restant après avoir retiré
// les mots d'élément — conservé tel quel, aucune restriction de rang appliquée au
// comptage : voir le rapport de génération pour les cas concernés).
function decouperNomAvecElements(ligneItem) {
  const match = ligneItem.match(/^(.+?)\s*\(([^)]*)\)\s*$/);
  if (!match) return { nomBase: ligneItem.trim(), elements: [], note: null };

  const [, nomBase, interieur] = match;
  const elements = extraireElements(interieur);
  let reste = interieur;
  for (const el of elements) reste = reste.replace(new RegExp(el, 'gi'), '');
  reste = reste.replace(/\bet\b/gi, '').replace(/[,\s]+/g, ' ').trim();

  return { nomBase: nomBase.trim(), elements, note: reste || null };
}

// ============================================
// Ensembles de cubes — depuis PANOPLIES (calcul.js), pas le .md
// ============================================

const LIBELLE_STAT_CUBE = {
  PM: 'PM', PA: 'PA', PO: 'PO', VITALITE: 'Vitalité', AGILITE: 'Agilité', FORCE: 'Force',
  CHANCE: 'Chance', INTELLIGENCE: 'Intelligence', PUISSANCE: 'Puissance', DOMMAGES: 'Dommages',
  DO_AIR: 'Dommages Air', DO_TERRE: 'Dommages Terre', DO_EAU: 'Dommages Eau', DO_FEU: 'Dommages Feu',
  DO_CRIT: 'Dommages Critiques', SOIN: 'Soin',
};
const ORDRE_AFFICHAGE_STAT_CUBE = [
  'PM', 'PA', 'PO', 'VITALITE', 'AGILITE', 'FORCE', 'CHANCE', 'INTELLIGENCE',
  'PUISSANCE', 'DOMMAGES', 'DO_AIR', 'DO_TERRE', 'DO_EAU', 'DO_FEU', 'DO_CRIT', 'SOIN',
];

function formaterDeltaEnTexte(delta) {
  return ORDRE_AFFICHAGE_STAT_CUBE
    .filter((cle) => delta[cle] != null)
    .map((cle) => `+${delta[cle]} ${LIBELLE_STAT_CUBE[cle] || cle}`)
    .join(', ');
}

const ORDRE_CUBE = ['Air', 'Terre', 'Eau', 'Feu', 'Lumière'];

// Vignette d'ensemble de cubes = cube Commun n°1 + cube Éxalté n°1 de la famille
// (choix du porteur de projet), résolus par une requête dédiée plutôt que codés en
// dur : robuste si les ids venaient à changer sur un ré-import.
async function chargerCubesImageItems() {
  const [lignes] = await pool.query(
    "SELECT id, element, rang, image_url FROM `Cube` WHERE numero = 1 AND rang IN ('Commun', 'Éxalté')"
  );
  const parFamille = {};
  for (const ligne of lignes) {
    if (!parFamille[ligne.element]) parFamille[ligne.element] = {};
    parFamille[ligne.element][ligne.rang] = ligne;
  }
  return parFamille;
}

function construireEnsemblesCubes(cubesImageItems) {
  return ORDRE_CUBE.map((famille) => {
    const commun = cubesImageItems[famille]?.Commun;
    const exalte = cubesImageItems[famille]?.Éxalté;
    return {
      cle: slugifier(`ensemble-de-cubes-${famille}`),
      nom: `Ensemble de Cubes ${famille}`,
      type: 'cube',
      pieces: [],
      bonusSpecial: null,
      paliers: Object.entries(PANOPLIES[famille] || {}).map(([items, delta]) => ({
        items: Number(items),
        texte: formaterDeltaEnTexte(delta),
        delta: { statsPlates: delta, multiplicateurs: [] },
      })),
      imageItems:
        commun && exalte
          ? [
              { type: 'cube', id: commun.id, imageUrl: commun.image_url },
              { type: 'cube', id: exalte.id, imageUrl: exalte.image_url },
            ]
          : null,
    };
  });
}

// ============================================
// Résolution des noms contre la vraie base (Sort/Breloque)
// ============================================

// Préfixes réels des noms de breloques en base ("Breloque du Rixeur Instable") alors
// que le .md ne donne que le nom court ("Rixeur instable") — retirés pour construire
// un index de repli.
const PREFIXES_BRELOQUE = ["breloque de l'", 'breloque de la ', 'breloque des ', 'breloque du ', 'breloque de ', "breloque d'", 'breloque '];

function retirerPrefixeBreloque(nomNormalise) {
  for (const prefixe of PREFIXES_BRELOQUE) {
    if (nomNormalise.startsWith(prefixe)) return nomNormalise.slice(prefixe.length);
  }
  return null;
}

function ajouterIndex(map, cle, ligne) {
  if (!cle) return;
  if (!map.has(cle)) map.set(cle, []);
  map.get(cle).push(ligne);
}

async function chargerIndexDb() {
  const [sorts] = await pool.query('SELECT id, nom, rang_evolution AS rang, image_url FROM Sort ORDER BY id');
  const [breloques] = await pool.query('SELECT id, nom, rang, image_url FROM Breloque ORDER BY id');

  function construireIndex(lignes, { avecPrefixeBreloque = false, avecSuffixeElement = false } = {}) {
    const parExact = new Map();
    const parMinuscule = new Map();
    const parNormalise = new Map();
    const parRepli = new Map(); // préfixe "Breloque X" retiré, ou base avant " - Élément"

    for (const ligne of lignes) {
      ajouterIndex(parExact, ligne.nom, ligne);
      ajouterIndex(parMinuscule, ligne.nom.toLowerCase(), ligne);
      const normalise = normaliserTexte(ligne.nom);
      ajouterIndex(parNormalise, normalise, ligne);

      if (avecPrefixeBreloque) ajouterIndex(parRepli, retirerPrefixeBreloque(normalise), ligne);
      if (avecSuffixeElement) {
        const matchSuffixe = normalise.match(/^(.+?)\s*-\s*(terre|eau|feu|air)$/);
        if (matchSuffixe) ajouterIndex(parRepli, matchSuffixe[1].trim(), ligne);
      }
    }

    return { parExact, parMinuscule, parNormalise, parRepli };
  }

  return {
    sorts: construireIndex(sorts, { avecSuffixeElement: true }),
    breloques: construireIndex(breloques, { avecPrefixeBreloque: true }),
  };
}

// Derniers écarts entre le texte du .md et le vrai nom en base, confirmés un par un
// par requête directe (candidat unique et non ambigu à chaque fois — pas une
// correction devinée). Clé = normaliserTexte(nom du .md).
const ALIAS_NOMS = {
  sorts: {
    "sablier de xelor - terre": 'Sablier du Xélor - Terre',
    "sablier de xelor - eau": 'Sablier du Xélor - Eau',
    'invocation de mulou': 'Invocation du Mulou',
    'funerailles anciennes': 'Funérailles Aériennes',
  },
  breloques: {
    'du hululord': 'Couvée du Hululord',
  },
};

function resoudreNom(nom, index, alias) {
  const normalise = normaliserTexte(nom);
  const nomAlias = alias && alias[normalise];

  return (
    index.parExact.get(nom) ||
    index.parMinuscule.get(nom.toLowerCase()) ||
    index.parNormalise.get(normalise) ||
    index.parRepli.get(normalise) ||
    (nomAlias && index.parExact.get(nomAlias)) ||
    null
  );
}

function resoudrePiece(type, nomCandidat, index, rapport) {
  const lignes = resoudreNom(
    nomCandidat,
    type === 'sort' ? index.sorts : index.breloques,
    type === 'sort' ? ALIAS_NOMS.sorts : ALIAS_NOMS.breloques
  );
  if (!lignes || lignes.length === 0) {
    rapport.nonResolus.push(`${type === 'sort' ? 'Sort' : 'Breloque'} "${nomCandidat}"`);
    return null;
  }
  return {
    type,
    nom: lignes[0].nom,
    variantes: lignes.map((l) => ({ id: l.id, rang: l.rang, image_url: l.image_url })),
  };
}

// Les 2 pièces représentatives par ensemble classique choisies par le porteur de
// projet pour la vignette composite (image en diagonale) — noms courts, résolus
// via le même `resoudrePiece` que les listes de pièces (gère déjà accents/casse/
// préfixe "Breloque..."/suffixe d'élément).
const IMAGE_ITEMS_CLASSIQUES = {
  'de-l-altruiste': [{ type: 'sort', nom: 'Mot Curatif - Feu' }, { type: 'sort', nom: 'Mot Revitalisant' }],
  'de-l-artificer': [{ type: 'breloque', nom: 'Bombeur fasciné' }, { type: 'sort', nom: 'Explobombe' }],
  'du-bousculeur': [{ type: 'sort', nom: 'Boliche - Air' }, { type: 'sort', nom: 'Ressac - Eau' }],
  'du-calculateur': [{ type: 'sort', nom: 'Sablier du Xélor - Eau' }, { type: 'sort', nom: 'Secousse Temporelle' }],
  'du-chanceux': [{ type: 'sort', nom: 'Pile ou Face - Air' }, { type: 'breloque', nom: "Stratège d'avant-garde" }],
  'de-l-entraveur': [{ type: 'sort', nom: "Glyphe d'Entrave - Air" }, { type: 'breloque', nom: 'Embourbeur embourbé' }],
  'du-fourbe': [{ type: 'sort', nom: 'Piège sournois - Terre' }, { type: 'sort', nom: 'Machination' }],
  'de-l-invocateur': [{ type: 'sort', nom: "Invocation d'Empaillé" }, { type: 'sort', nom: 'Invocation du Mulou' }],
  'des-portes-de-la-mort': [{ type: 'breloque', nom: 'Flagellant' }, { type: 'breloque', nom: 'Sursaut de puissance' }],
  'du-pugiliste': [{ type: 'sort', nom: 'Cabriole - Terre' }, { type: 'breloque', nom: 'Carapace adaptative' }],
};

// Renvoie l'id + l'image de la 1ère variante ayant une image (les rangs d'une même
// pièce partagent en général la même image, mais certaines n'en ont pas encore).
function premiereVarianteAvecImage(piece) {
  return piece?.variantes.find((v) => v.image_url) || null;
}

function resoudreImageItems(cle, descripteurs, index, rapportImages) {
  if (!descripteurs) return null;

  const resolues = descripteurs.map(({ type, nom }) => {
    const piece = resoudrePiece(type, nom, index, { nonResolus: [] }); // rapport dédié : déjà compté ailleurs
    const variante = piece && premiereVarianteAvecImage(piece);
    if (!variante) {
      rapportImages.push(`${cle} : "${nom}" (${type}) introuvable ou sans image — vignette non générée`);
      return null;
    }
    return { type, id: variante.id, imageUrl: variante.image_url };
  });

  return resolues.every(Boolean) ? resolues : null;
}

function resoudreItemsClassique(items, type, index, rapport) {
  const pieces = [];
  for (const ligneItem of items) {
    const { nomBase, elements, note } = decouperNomAvecElements(ligneItem);
    const candidats = elements.length > 0 ? elements.map((el) => `${nomBase} - ${el}`) : [nomBase];
    for (const candidat of candidats) {
      const piece = resoudrePiece(type, candidat, index, rapport);
      if (piece) {
        if (note) piece.note = note;
        pieces.push(piece);
      }
    }
  }
  return pieces;
}

function construireEnsemblesClassiques(bruts, index, rapport, rapportImages) {
  return bruts.map((brut) => {
    const nom = formaterNomEnsemble(brut.nomBrut);
    const cle = slugifier(nom.replace(/^Ensemble\s+/i, ''));
    return {
      cle,
      nom,
      type: 'classique',
      pieces: [
        ...resoudreItemsClassique(brut.sorts, 'sort', index, rapport),
        ...resoudreItemsClassique(brut.breloques, 'breloque', index, rapport),
      ],
      bonusSpecial: brut.bonusSpecial,
      paliers: brut.paliers.map((p) => ({ items: p.items, texte: p.texte, delta: parserBonusTexte(p.texte) })),
      imageItems: resoudreImageItems(cle, IMAGE_ITEMS_CLASSIQUES[cle], index, rapportImages),
    };
  });
}

function noterUsage(usage, nom, cle) {
  if (!usage.has(nom)) usage.set(nom, []);
  usage.get(nom).push(cle);
}

function construireEnsemblesBoss(bruts, index, rapport, rapportImages) {
  const usage = new Map(); // nom de pièce résolu -> [cle ensemble...]

  const ensembles = bruts.map((brut) => {
    const nom = formaterNomEnsemble(brut.nomBrut);
    const cle = slugifier(nom.replace(/^Ensemble\s+/i, ''));
    const pieces = [];

    if (brut.breloqueBoss) {
      const piece = resoudrePiece('breloque', brut.breloqueBoss.nom, index, rapport);
      if (piece) {
        pieces.push(piece);
        noterUsage(usage, piece.nom, cle);
      }
    }
    if (brut.sortBoss) {
      const piece = resoudrePiece('sort', brut.sortBoss.nom, index, rapport);
      if (piece) {
        pieces.push(piece);
        noterUsage(usage, piece.nom, cle);
      }
    }

    // Toujours les 2 pièces de l'ensemble lui-même (demande explicite du porteur de
    // projet) — mais seulement si les 2 ont une image : les breloques de boss (rang
    // Unique) n'en ont aucune pour l'instant, la vignette sera générée plus tard.
    const variantesAvecImage = pieces.map(premiereVarianteAvecImage);
    const imageItems =
      pieces.length === 2 && variantesAvecImage.every(Boolean)
        ? pieces.map((p, i) => ({ type: p.type, id: variantesAvecImage[i].id, imageUrl: variantesAvecImage[i].image_url }))
        : null;
    if (!imageItems && pieces.length === 2) {
      rapportImages.push(`${cle} : image manquante sur au moins une des 2 pièces (probablement la breloque, rang Unique) — vignette non générée`);
    }

    return {
      cle,
      nom,
      type: 'boss',
      pieces,
      bonusSpecial: null,
      paliers: brut.paliers.map((p) => ({ items: p.items, texte: p.texte, delta: parserBonusTexte(p.texte) })),
      imageItems,
    };
  });

  for (const [nomPiece, cles] of usage) {
    const uniques = [...new Set(cles)];
    if (uniques.length > 1) {
      rapport.doublons.push(`"${nomPiece}" utilisé par plusieurs ensembles boss : ${uniques.join(', ')}`);
    }
  }

  return ensembles;
}

// ============================================
// Main
// ============================================

async function main() {
  const contenuMd = fs.readFileSync(CHEMIN_MD, 'utf-8');
  const { classiques: classiquesBruts, boss: bossBruts } = parserEnsemblesMd(contenuMd);
  const index = await chargerIndexDb();
  const cubesImageItems = await chargerCubesImageItems();
  const rapport = { nonResolus: [], doublons: [] };
  const rapportImages = [];

  const ensemblesCubes = construireEnsemblesCubes(cubesImageItems);
  const ensemblesClassiques = construireEnsemblesClassiques(classiquesBruts, index, rapport, rapportImages);
  const ensemblesBoss = construireEnsemblesBoss(bossBruts, index, rapport, rapportImages);
  const tous = [...ensemblesCubes, ...ensemblesClassiques, ...ensemblesBoss];

  fs.mkdirSync(path.dirname(CHEMIN_JSON_CLIENT), { recursive: true });
  fs.mkdirSync(path.dirname(CHEMIN_JSON_SERVER), { recursive: true });
  fs.writeFileSync(CHEMIN_JSON_CLIENT, JSON.stringify(tous, null, 2), 'utf-8');
  fs.writeFileSync(CHEMIN_JSON_SERVER, JSON.stringify(tous, null, 2), 'utf-8');

  const totalPieces = [...ensemblesClassiques, ...ensemblesBoss].reduce((s, e) => s + e.pieces.length, 0);
  console.log(
    `Terminé : ${ensemblesCubes.length} ensembles cubes, ${ensemblesClassiques.length} classiques, ${ensemblesBoss.length} boss (${totalPieces} pièces résolues).`
  );

  if (rapport.nonResolus.length) {
    console.log(`\n⚠️  ${rapport.nonResolus.length} pièce(s) non résolue(s) (aucune ligne en base) :`);
    rapport.nonResolus.forEach((n) => console.log('  - ' + n));
  }
  if (rapport.doublons.length) {
    console.log(`\n⚠️  ${rapport.doublons.length} doublon(s) potentiel(s) (même pièce sur plusieurs ensembles boss, à vérifier dans le .md source) :`);
    rapport.doublons.forEach((d) => console.log('  - ' + d));
  }
  const avecVignette = tous.filter((e) => e.imageItems).length;
  console.log(`\n${avecVignette}/${tous.length} ensembles ont leurs 2 images de vignette résolues.`);
  if (rapportImages.length) {
    console.log(`⚠️  Vignettes non générées :`);
    rapportImages.forEach((r) => console.log('  - ' + r));
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Erreur pendant la génération :', err);
  process.exit(1);
});
