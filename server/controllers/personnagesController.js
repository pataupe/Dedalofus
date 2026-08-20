const crypto = require('crypto');
const pool = require('../config/db');
const { calculerStatsPersonnage, calculerPanopliesActives, calculerDegats } = require('../logic/calcul');
const { construireBoost, valeurBoostParDefaut, clamperValeurBoost } = require('../logic/boosts');
const { calculerEffetsBreloques } = require('../logic/effetsBreloques');
const { calculerEnsemblesActifs, calculerBonusEnsembles } = require('../logic/ensembles');
// Généré par server/scripts/generate-ensembles.js (à partir de data/Liste-des-ensembles.md
// + PANOPLIES pour les ensembles de cubes) — statique, comme les autres imports de ce fichier.
const ensemblesData = require('../data/ensembles.json');

const NOM_MAX = 100;

// Lien de partage court : alphabet à 62 caractères (chiffres + lettres maj/min),
// bien plus dense que l'hexadécimal (16) — 8 caractères donnent ~218 000
// milliards de combinaisons, largement de quoi éviter qu'un lien soit deviné
// par hasard sur un site de cette taille, pour une URL bien plus courte que
// l'ancien format (32 caractères hexadécimaux). Les personnages déjà créés
// gardent leur ancien lien : rien ne les régénère, la colonne accepte les deux.
const ALPHABET_LIEN_PARTAGE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const LONGUEUR_LIEN_PARTAGE = 8;
// Rejette les octets au-delà du dernier multiple de 62 (248) pour un tirage
// uniforme : sans ça, certains caractères de l'alphabet auraient une chance
// légèrement plus élevée d'être tirés que d'autres (biais de modulo).
const OCTET_MAX_VALIDE = 256 - (256 % ALPHABET_LIEN_PARTAGE.length);

function genererLienPartage() {
  let code = '';
  while (code.length < LONGUEUR_LIEN_PARTAGE) {
    const octet = crypto.randomBytes(1)[0];
    if (octet < OCTET_MAX_VALIDE) code += ALPHABET_LIEN_PARTAGE[octet % ALPHABET_LIEN_PARTAGE.length];
  }
  return code;
}

function lignesVides(equipementId, nombre) {
  return Array.from({ length: nombre }, (_, i) => [equipementId, i + 1, null]);
}

// POST /api/personnages
async function creerPersonnage(req, res) {
  const { nom } = req.body;

  if (!nom) {
    return res.status(400).json({ erreur: 'Le nom du personnage est requis' });
  }
  if (nom.length > NOM_MAX) {
    return res.status(400).json({ erreur: `Le nom doit faire au maximum ${NOM_MAX} caractères` });
  }

  const [resultat] = await pool.query(
    'INSERT INTO Personnage (utilisateur_id, nom) VALUES (?, ?)',
    [req.utilisateur.id, nom]
  );

  // Nouvelle tentative avec un lien différent en cas de collision (improbable
  // avec ~218 000 milliards de combinaisons, mais la contrainte UNIQUE la
  // détecterait de toute façon — autant la gérer proprement plutôt que de
  // renvoyer une 500 au joueur).
  let equipement;
  for (let tentative = 1; ; tentative++) {
    try {
      [equipement] = await pool.query(
        'INSERT INTO Equipement (personnage_id, lien_partage) VALUES (?, ?)',
        [resultat.insertId, genererLienPartage()]
      );
      break;
    } catch (err) {
      if (err.code !== 'ER_DUP_ENTRY' || tentative >= 5) throw err;
    }
  }

  await pool.query('INSERT INTO EquipementCube (equipement_id, emplacement, cube_id) VALUES ?', [
    lignesVides(equipement.insertId, 9),
  ]);
  await pool.query('INSERT INTO EquipementSort (equipement_id, emplacement, sort_id) VALUES ?', [
    lignesVides(equipement.insertId, 9),
  ]);
  await pool.query('INSERT INTO EquipementBreloque (equipement_id, emplacement, breloque_id) VALUES ?', [
    lignesVides(equipement.insertId, 7),
  ]);

  res.status(201).json({ id: resultat.insertId, nom });
}

// GET /api/personnages — triés par dernière modification (pas par création),
// pour que le personnage qu'on vient de modifier remonte en haut de la liste.
async function listerPersonnages(req, res) {
  const [personnages] = await pool.query(
    `SELECT p.id, p.nom, p.cree_le, e.mis_a_jour_le, e.vues_partage
     FROM Personnage p
     JOIN Equipement e ON e.personnage_id = p.id
     WHERE p.utilisateur_id = ?
     ORDER BY e.mis_a_jour_le DESC`,
    [req.utilisateur.id]
  );

  res.json(personnages);
}

async function trouverPersonnage(id, utilisateurId) {
  const [personnages] = await pool.query(
    'SELECT id, nom FROM Personnage WHERE id = ? AND utilisateur_id = ?',
    [id, utilisateurId]
  );
  return personnages[0] || null;
}

// Marque le personnage comme modifié maintenant (Equipement.mis_a_jour_le) —
// appelé après chaque action qui change son stuff/nom, pour que la liste
// (listerPersonnages, triée par cette colonne) le remonte en haut.
async function marquerModifie(personnageId) {
  await pool.query('UPDATE Equipement SET mis_a_jour_le = NOW() WHERE personnage_id = ?', [personnageId]);
}

// Construit la fiche complète (stats, panoplies, équipement, dégâts) d'un
// personnage déjà identifié — partagé entre la route privée (obtenirPersonnage,
// vérifie utilisateur_id) et la route publique de partage (vérifie lien_partage).
async function construireFichePersonnage(personnage) {
  const [cubes] = await pool.query(
    `SELECT ec.emplacement, c.id, c.nom, c.element, c.rang, c.numero, c.image_url
     FROM EquipementCube ec
     JOIN Equipement e ON e.id = ec.equipement_id
     LEFT JOIN \`Cube\` c ON c.id = ec.cube_id
     WHERE e.personnage_id = ?
     ORDER BY ec.emplacement`,
    [personnage.id]
  );
  const [sorts] = await pool.query(
    `SELECT es.emplacement, s.*
     FROM EquipementSort es
     JOIN Equipement e ON e.id = es.equipement_id
     LEFT JOIN Sort s ON s.id = es.sort_id
     WHERE e.personnage_id = ?
     ORDER BY es.emplacement`,
    [personnage.id]
  );
  const [breloques] = await pool.query(
    `SELECT eb.emplacement, eb.boost_valeur, b.id, b.nom, b.rang, b.effet, b.image_url,
       b.type_input, b.bonus_min_texte, b.bonus_increment_texte, b.bonus_max_texte, b.bonus_defaut_texte
     FROM EquipementBreloque eb
     JOIN Equipement e ON e.id = eb.equipement_id
     LEFT JOIN Breloque b ON b.id = eb.breloque_id
     WHERE e.personnage_id = ?
     ORDER BY eb.emplacement`,
    [personnage.id]
  );

  const [equipements] = await pool.query(
    `SELECT lien_partage, parcho_vitalite, parcho_sagesse, parcho_force, parcho_intelligence, parcho_chance, parcho_agilite
     FROM Equipement WHERE personnage_id = ?`,
    [personnage.id]
  );
  const eq = equipements[0];
  const parcho = {
    VITALITE: eq.parcho_vitalite,
    SAGESSE: eq.parcho_sagesse,
    FORCE: eq.parcho_force,
    INTELLIGENCE: eq.parcho_intelligence,
    CHANCE: eq.parcho_chance,
    AGILITE: eq.parcho_agilite,
  };

  const idsCubesEquipes = cubes.filter((c) => c.id).map((c) => c.id);
  let statsParCube = {};
  if (idsCubesEquipes.length > 0) {
    const [statsLignes] = await pool.query(
      `SELECT cube_id, cle_stat AS \`key\`, valeur AS value, libelle AS label
       FROM StatCube WHERE cube_id IN (${idsCubesEquipes.map(() => '?').join(',')})`,
      idsCubesEquipes
    );
    for (const ligne of statsLignes) {
      if (!statsParCube[ligne.cube_id]) statsParCube[ligne.cube_id] = [];
      statsParCube[ligne.cube_id].push({ key: ligne.key, value: ligne.value, label: ligne.label });
    }
  }
  const cubesEquipesPourCalcul = cubes
    .filter((c) => c.id)
    .map((c) => ({ element: c.element, stats: statsParCube[c.id] || [] }));

  // Lignes de dégâts supplémentaires (SortDegatsSup) des sorts équipés — Bluff/
  // Tourbillon Embrasé (2 à 4 éléments à la fois), Pile ou Face/Foène/Pelle
  // Aveuglante (2e ligne indépendante). Batch-fetch comme StatCube, groupé par sort.
  const idsSortsEquipes = sorts.filter((s) => s.id).map((s) => s.id);
  let lignesSupParSort = {};
  if (idsSortsEquipes.length > 0) {
    const [lignesSup] = await pool.query(
      `SELECT sort_id, element, degats_min, degats_max, degats_critique_min, degats_critique_max
       FROM SortDegatsSup WHERE sort_id IN (${idsSortsEquipes.map(() => '?').join(',')}) ORDER BY ordre`,
      idsSortsEquipes
    );
    for (const ligne of lignesSup) {
      if (!lignesSupParSort[ligne.sort_id]) lignesSupParSort[ligne.sort_id] = [];
      lignesSupParSort[ligne.sort_id].push({
        element: ligne.element,
        degatsMin: ligne.degats_min,
        degatsMax: ligne.degats_max,
        degatsCritiqueMin: ligne.degats_critique_min,
        degatsCritiqueMax: ligne.degats_critique_max,
      });
    }
  }

  // Un sort peut taper dans 2 éléments à la fois (ex: Bluff, "Air, Eau" en base) :
  // converti en tableau pour calculerDegats, qui produit alors un résultat distinct
  // par élément (voir server/logic/calcul.js, resoudreElements).
  function eclaterElement(element) {
    return element && element.includes(',') ? element.split(',').map((e) => e.trim()) : element;
  }

  // Effets actuellement actifs des breloques équipées (onglet "Boosts breloques") :
  // bonus de stats plates + pdvPourcent fusionnés dans calculerStatsPersonnage comme
  // le Parcho, multiplicateurs de dégâts réservés à calculerDegats (2 appels plus bas,
  // un par mode d'attaque — le joueur choisit distance/mêlée côté client, sans recharger
  // la fiche : les deux résultats sont calculés d'avance et renvoyés ensemble).
  const breloquesEquipeesPourCalcul = breloques.filter((b) => b.id).map((b) => ({
    nom: b.nom,
    boost: construireBoost(b, b.boost_valeur),
  }));
  const effetsBreloques = calculerEffetsBreloques(breloquesEquipeesPourCalcul);

  const sortsEquipesPourCalcul = sorts
    .filter((s) => s.id)
    .map((s) => ({
      id: s.id,
      nom: s.nom,
      degatsMin: s.degats_min,
      degatsMax: s.degats_max,
      element: eclaterElement(s.element),
      degatsCritiqueMin: s.degats_critique_min,
      degatsCritiqueMax: s.degats_critique_max,
      chanceCritique: s.chance_critique,
      estSoin: Boolean(s.est_soin),
      estIndirect: Boolean(s.est_indirect),
      estPiege: Boolean(s.est_piege),
      lignesSupplementaires: (lignesSupParSort[s.id] || []).map((l) => ({
        ...l,
        element: eclaterElement(l.element),
      })),
    }));

  // Ensembles classiques/boss actuellement actifs (>= 1 pièce reconnue équipée parmi
  // les sorts/breloques ci-dessus) — les ensembles de cubes restent gérés par
  // calculerPanopliesActives ci-dessous, mécanisme séparé et inchangé.
  const ensemblesActifs = calculerEnsemblesActifs(sortsEquipesPourCalcul, breloquesEquipeesPourCalcul, ensemblesData);
  const bonusEnsembles = calculerBonusEnsembles(ensemblesActifs);

  const statsPersonnage = calculerStatsPersonnage(cubesEquipesPourCalcul, parcho, effetsBreloques, bonusEnsembles);
  const panoplies = calculerPanopliesActives(cubesEquipesPourCalcul);

  const multiplicateursBreloques = [...effetsBreloques.multiplicateurs, ...bonusEnsembles.multiplicateurs];
  const degats = {
    distance: calculerDegats(statsPersonnage, sortsEquipesPourCalcul, {
      multiplicateursBreloques,
      modeAttaque: 'distance',
    }),
    melee: calculerDegats(statsPersonnage, sortsEquipesPourCalcul, {
      multiplicateursBreloques,
      modeAttaque: 'melee',
    }),
  };

  return {
    id: personnage.id,
    nom: personnage.nom,
    lienPartage: eq.lien_partage,
    stats: statsPersonnage,
    panoplies,
    ensemblesActifs,
    parcho,
    degats,
    cubes: cubes.map(({ emplacement, id, nom, element, rang, numero, image_url }) => ({
      emplacement,
      cube: id ? { id, nom, element, rang, numero, image_url } : null,
    })),
    sorts: sorts.map(({ emplacement, ...sort }) => ({
      emplacement,
      sort: sort.id
        ? {
            ...sort,
            lignes_supplementaires: (lignesSupParSort[sort.id] || []).map((l) => ({
              element: l.element,
              degats_min: l.degatsMin,
              degats_max: l.degatsMax,
              degats_critique_min: l.degatsCritiqueMin,
              degats_critique_max: l.degatsCritiqueMax,
            })),
          }
        : null,
    })),
    breloques: breloques.map(({ emplacement, id, nom, rang, effet, image_url, boost_valeur, ...boostColonnes }) => ({
      emplacement,
      breloque: id ? { id, nom, rang, effet, image_url, boost: construireBoost(boostColonnes, boost_valeur) } : null,
    })),
  };
}

// GET /api/personnages/:id
async function obtenirPersonnage(req, res) {
  const personnage = await trouverPersonnage(req.params.id, req.utilisateur.id);
  if (!personnage) {
    return res.status(404).json({ erreur: 'Personnage introuvable' });
  }

  res.json(await construireFichePersonnage(personnage));
}

// GET /api/partage/:lienPartage — route publique (sans authentification),
// consultation en lecture seule d'un stuff partagé via son lien unique.
async function obtenirPersonnagePartage(req, res) {
  const [personnages] = await pool.query(
    `SELECT p.id, p.nom
     FROM Personnage p
     JOIN Equipement e ON e.personnage_id = p.id
     WHERE e.lien_partage = ?`,
    [req.params.lienPartage]
  );
  const personnage = personnages[0];
  if (!personnage) {
    return res.status(404).json({ erreur: 'Lien de partage introuvable' });
  }

  // Compteur de vues affiché au propriétaire sur sa liste de personnages
  // (listerPersonnages) — uniquement les consultations via le lien public,
  // pas les visites de la fiche privée par le propriétaire lui-même.
  // `mis_a_jour_le = mis_a_jour_le` : assignation explicite pour empêcher le
  // ON UPDATE CURRENT_TIMESTAMP automatique de la colonne (voir schema.sql) de
  // se déclencher ici — une simple consultation du lien public ne doit pas
  // faire remonter le personnage dans la liste du propriétaire (contrairement
  // à marquerModifie, qui le fait exprès pour les vraies modifications).
  await pool.query(
    'UPDATE Equipement SET vues_partage = vues_partage + 1, mis_a_jour_le = mis_a_jour_le WHERE personnage_id = ?',
    [personnage.id]
  );

  res.json(await construireFichePersonnage(personnage));
}

const EMPLACEMENTS_MAX = { cubes: 9, sorts: 9, breloques: 7 };

// PUT /api/personnages/:id/cubes/:emplacement
// Un même cube (élément + numéro, ex: "Air 4") ne peut être équipé qu'une fois,
// même à un rang différent (Air 4 Commun et Air 4 Mythique s'excluent mutuellement).
async function equiperCube(req, res) {
  const personnage = await trouverPersonnage(req.params.id, req.utilisateur.id);
  if (!personnage) {
    return res.status(404).json({ erreur: 'Personnage introuvable' });
  }

  const emplacement = Number(req.params.emplacement);
  if (!Number.isInteger(emplacement) || emplacement < 1 || emplacement > EMPLACEMENTS_MAX.cubes) {
    return res.status(400).json({ erreur: 'Emplacement invalide' });
  }

  const cubeId = req.body.cubeId;

  if (cubeId) {
    const [cibles] = await pool.query('SELECT element, numero FROM `Cube` WHERE id = ?', [cubeId]);
    const cible = cibles[0];
    const [doublons] = await pool.query(
      `SELECT ec.emplacement
       FROM EquipementCube ec
       JOIN Equipement e ON e.id = ec.equipement_id
       JOIN \`Cube\` c ON c.id = ec.cube_id
       WHERE e.personnage_id = ? AND ec.emplacement != ? AND c.element = ? AND c.numero = ?`,
      [personnage.id, emplacement, cible.element, cible.numero]
    );
    if (doublons.length > 0) {
      return res.status(409).json({
        erreur: `Le cube ${cible.element} ${cible.numero} est déjà équipé (rang différent inclus) à l'emplacement ${doublons[0].emplacement}.`,
      });
    }
  }

  await pool.query(
    'UPDATE EquipementCube ec JOIN Equipement e ON e.id = ec.equipement_id SET ec.cube_id = ? WHERE e.personnage_id = ? AND ec.emplacement = ?',
    [cubeId, personnage.id, emplacement]
  );
  await marquerModifie(personnage.id);

  res.json({ emplacement, cube_id: cubeId });
}

// PUT /api/personnages/:id/cubes — équipe dans le premier emplacement cube
// libre du personnage (au lieu d'un emplacement précis) : c'est ce qu'utilise
// le bouton "Équiper" des pages liste, pour pouvoir équiper plusieurs cubes
// d'affilée sans repasser par la fiche perso entre chaque clic.
async function equiperCubeAuto(req, res) {
  const personnage = await trouverPersonnage(req.params.id, req.utilisateur.id);
  if (!personnage) {
    return res.status(404).json({ erreur: 'Personnage introuvable' });
  }

  const cubeId = req.body.cubeId;
  const [cibles] = await pool.query('SELECT element, numero FROM `Cube` WHERE id = ?', [cubeId]);
  const cible = cibles[0];

  const [doublons] = await pool.query(
    `SELECT ec.emplacement
     FROM EquipementCube ec
     JOIN Equipement e ON e.id = ec.equipement_id
     JOIN \`Cube\` c ON c.id = ec.cube_id
     WHERE e.personnage_id = ? AND c.element = ? AND c.numero = ?`,
    [personnage.id, cible.element, cible.numero]
  );
  if (doublons.length > 0) {
    return res.status(409).json({
      erreur: `Le cube ${cible.element} ${cible.numero} est déjà équipé (rang différent inclus) à l'emplacement ${doublons[0].emplacement}.`,
    });
  }

  const emplacement = await trouverEmplacementLibre(personnage.id, 'EquipementCube', 'cube_id');
  if (!emplacement) {
    return res.status(409).json({ erreur: 'Tous les emplacements cubes sont déjà occupés.', code: 'COMPLET' });
  }

  await pool.query(
    'UPDATE EquipementCube ec JOIN Equipement e ON e.id = ec.equipement_id SET ec.cube_id = ? WHERE e.personnage_id = ? AND ec.emplacement = ?',
    [cubeId, personnage.id, emplacement]
  );
  await marquerModifie(personnage.id);

  res.json({ emplacement, cube_id: cubeId });
}

async function trouverEmplacementLibre(personnageId, table, colonne) {
  const [libres] = await pool.query(
    `SELECT t.emplacement FROM ${table} t JOIN Equipement e ON e.id = t.equipement_id
     WHERE e.personnage_id = ? AND t.${colonne} IS NULL ORDER BY t.emplacement LIMIT 1`,
    [personnageId]
  );
  return libres[0]?.emplacement || null;
}

// Même nom déjà équipé ailleurs sur ce personnage, rang différent inclus (ex:
// "Bluff" Novice et "Bluff" Expert s'excluent mutuellement) ? Retourne
// l'emplacement en conflit, ou null. Même principe que la contrainte cube
// (equiperCube/equiperCubeAuto, par élément + numéro), appliquée ici par `nom`
// puisque sorts et breloques n'ont pas d'équivalent élément+numéro.
// `emplacementAIgnorer` sert à equiper() (emplacement précis, ex: remplacement)
// pour ne pas se comparer à soi-même.
async function trouverEmplacementDoublonParNom(personnageId, table, colonne, refTable, valeurId, emplacementAIgnorer) {
  if (!valeurId) return null;

  const [cibles] = await pool.query(`SELECT nom FROM ${refTable} WHERE id = ?`, [valeurId]);
  const cible = cibles[0];
  if (!cible) return null;

  const params = [personnageId, cible.nom];
  let conditionEmplacement = '';
  if (emplacementAIgnorer != null) {
    conditionEmplacement = 'AND t.emplacement != ?';
    params.push(emplacementAIgnorer);
  }

  const [doublons] = await pool.query(
    `SELECT t.emplacement
     FROM ${table} t
     JOIN Equipement e ON e.id = t.equipement_id
     JOIN ${refTable} r ON r.id = t.${colonne}
     WHERE e.personnage_id = ? AND r.nom = ? ${conditionEmplacement}`,
    params
  );
  return doublons[0]?.emplacement || null;
}

function messageDoublon(refTable, emplacement) {
  return refTable === 'Sort'
    ? `Ce sort est déjà équipé (rang différent inclus) à l'emplacement ${emplacement}.`
    : `Cette breloque est déjà équipée (rang différent inclus) à l'emplacement ${emplacement}.`;
}

// Valeur initiale de EquipementBreloque.boost_valeur au moment d'équiper une
// breloque (colonne "Bonus par défaut" du CSV) — null pour les sorts (pas de
// notion de boost), pour un déséquipement (valeurId null), ou une breloque
// sans bonus conditionnel.
async function calculerValeurBoostInitiale(refTable, valeurId) {
  if (refTable !== 'Breloque' || !valeurId) return null;
  const [lignes] = await pool.query(
    'SELECT type_input, bonus_min_texte, bonus_defaut_texte FROM Breloque WHERE id = ?',
    [valeurId]
  );
  return valeurBoostParDefaut(lignes[0]);
}

// PUT /api/personnages/:id/sorts et /api/personnages/:id/breloques — même
// principe que equiperCubeAuto (premier emplacement libre), avec la même
// contrainte de doublon que les cubes (voir trouverEmplacementDoublonParNom).
async function equiperAuto(req, res, { table, colonne, type, refTable, valeur }) {
  const personnage = await trouverPersonnage(req.params.id, req.utilisateur.id);
  if (!personnage) {
    return res.status(404).json({ erreur: 'Personnage introuvable' });
  }

  const conflitEmplacement = await trouverEmplacementDoublonParNom(personnage.id, table, colonne, refTable, valeur);
  if (conflitEmplacement) {
    return res.status(409).json({ erreur: messageDoublon(refTable, conflitEmplacement) });
  }

  const emplacement = await trouverEmplacementLibre(personnage.id, table, colonne);
  if (!emplacement) {
    return res.status(409).json({ erreur: `Tous les emplacements ${type} sont déjà occupés.`, code: 'COMPLET' });
  }

  const boostValeur = await calculerValeurBoostInitiale(refTable, valeur);
  const colonneBoost = refTable === 'Breloque' ? ', t.boost_valeur = ?' : '';
  await pool.query(
    `UPDATE ${table} t JOIN Equipement e ON e.id = t.equipement_id SET t.${colonne} = ?${colonneBoost} WHERE e.personnage_id = ? AND t.emplacement = ?`,
    refTable === 'Breloque' ? [valeur, boostValeur, personnage.id, emplacement] : [valeur, personnage.id, emplacement]
  );
  await marquerModifie(personnage.id);

  res.json({ emplacement, [colonne]: valeur });
}

async function equiperSortAuto(req, res) {
  await equiperAuto(req, res, {
    table: 'EquipementSort',
    colonne: 'sort_id',
    type: 'sorts',
    refTable: 'Sort',
    valeur: req.body.sortId,
  });
}

async function equiperBreloqueAuto(req, res) {
  await equiperAuto(req, res, {
    table: 'EquipementBreloque',
    colonne: 'breloque_id',
    type: 'breloques',
    refTable: 'Breloque',
    valeur: req.body.breloqueId,
  });
}

// PUT /api/personnages/:id/sorts/:emplacement
async function equiperSort(req, res) {
  await equiper(req, res, {
    table: 'EquipementSort',
    colonne: 'sort_id',
    type: 'sorts',
    refTable: 'Sort',
    valeur: req.body.sortId,
  });
}

// PUT /api/personnages/:id/breloques/:emplacement
async function equiperBreloque(req, res) {
  await equiper(req, res, {
    table: 'EquipementBreloque',
    colonne: 'breloque_id',
    type: 'breloques',
    refTable: 'Breloque',
    valeur: req.body.breloqueId,
  });
}

async function equiper(req, res, { table, colonne, type, refTable, valeur }) {
  const personnage = await trouverPersonnage(req.params.id, req.utilisateur.id);
  if (!personnage) {
    return res.status(404).json({ erreur: 'Personnage introuvable' });
  }

  const emplacement = Number(req.params.emplacement);
  if (!Number.isInteger(emplacement) || emplacement < 1 || emplacement > EMPLACEMENTS_MAX[type]) {
    return res.status(400).json({ erreur: 'Emplacement invalide' });
  }

  const conflitEmplacement = await trouverEmplacementDoublonParNom(personnage.id, table, colonne, refTable, valeur, emplacement);
  if (conflitEmplacement) {
    return res.status(409).json({ erreur: messageDoublon(refTable, conflitEmplacement) });
  }

  const boostValeur = await calculerValeurBoostInitiale(refTable, valeur);
  const colonneBoost = refTable === 'Breloque' ? ', t.boost_valeur = ?' : '';
  await pool.query(
    `UPDATE ${table} t JOIN Equipement e ON e.id = t.equipement_id SET t.${colonne} = ?${colonneBoost} WHERE e.personnage_id = ? AND t.emplacement = ?`,
    refTable === 'Breloque' ? [valeur, boostValeur, personnage.id, emplacement] : [valeur, personnage.id, emplacement]
  );
  await marquerModifie(personnage.id);

  res.json({ emplacement, [colonne]: valeur });
}

// PUT /api/personnages/:id/breloques/:emplacement/boost — modifie uniquement
// le bonus conditionnel (toggle/range/accumulateur) d'une breloque déjà
// équipée, sans la déséquiper/rééquiper.
async function sauvegarderBoostBreloque(req, res) {
  const personnage = await trouverPersonnage(req.params.id, req.utilisateur.id);
  if (!personnage) {
    return res.status(404).json({ erreur: 'Personnage introuvable' });
  }

  const emplacement = Number(req.params.emplacement);
  if (!Number.isInteger(emplacement) || emplacement < 1 || emplacement > EMPLACEMENTS_MAX.breloques) {
    return res.status(400).json({ erreur: 'Emplacement invalide' });
  }

  const [lignes] = await pool.query(
    `SELECT b.type_input, b.bonus_min_texte, b.bonus_max_texte
     FROM EquipementBreloque eb
     JOIN Equipement e ON e.id = eb.equipement_id
     JOIN Breloque b ON b.id = eb.breloque_id
     WHERE e.personnage_id = ? AND eb.emplacement = ?`,
    [personnage.id, emplacement]
  );
  const breloque = lignes[0];
  if (!breloque || !breloque.type_input) {
    return res.status(400).json({ erreur: 'Aucune breloque à bonus conditionnel sur cet emplacement.' });
  }

  const valeur = clamperValeurBoost(breloque, req.body.valeur);

  await pool.query(
    `UPDATE EquipementBreloque eb JOIN Equipement e ON e.id = eb.equipement_id
     SET eb.boost_valeur = ? WHERE e.personnage_id = ? AND eb.emplacement = ?`,
    [valeur, personnage.id, emplacement]
  );
  await marquerModifie(personnage.id);

  res.json({ emplacement, valeur });
}

// PUT /api/personnages/:id/nom — renomme un personnage existant, même
// validation que la création (creerPersonnage).
async function renommerPersonnage(req, res) {
  const personnage = await trouverPersonnage(req.params.id, req.utilisateur.id);
  if (!personnage) {
    return res.status(404).json({ erreur: 'Personnage introuvable' });
  }

  const { nom } = req.body;
  if (!nom) {
    return res.status(400).json({ erreur: 'Le nom du personnage est requis' });
  }
  if (nom.length > NOM_MAX) {
    return res.status(400).json({ erreur: `Le nom doit faire au maximum ${NOM_MAX} caractères` });
  }

  await pool.query('UPDATE Personnage SET nom = ? WHERE id = ?', [nom, personnage.id]);
  await marquerModifie(personnage.id);

  res.json({ id: personnage.id, nom });
}

// PUT /api/personnages/:id/desequiper-tout — vide en une fois les 9 cubes,
// 9 sorts et 7 breloques (et remet boost_valeur à NULL) ; renvoie la fiche
// complète à jour, comme obtenirPersonnage, pour que le front n'ait qu'à
// remplacer son état local.
async function desequiperTout(req, res) {
  const personnage = await trouverPersonnage(req.params.id, req.utilisateur.id);
  if (!personnage) {
    return res.status(404).json({ erreur: 'Personnage introuvable' });
  }

  await pool.query(
    'UPDATE EquipementCube ec JOIN Equipement e ON e.id = ec.equipement_id SET ec.cube_id = NULL WHERE e.personnage_id = ?',
    [personnage.id]
  );
  await pool.query(
    'UPDATE EquipementSort es JOIN Equipement e ON e.id = es.equipement_id SET es.sort_id = NULL WHERE e.personnage_id = ?',
    [personnage.id]
  );
  await pool.query(
    'UPDATE EquipementBreloque eb JOIN Equipement e ON e.id = eb.equipement_id SET eb.breloque_id = NULL, eb.boost_valeur = NULL WHERE e.personnage_id = ?',
    [personnage.id]
  );
  await marquerModifie(personnage.id);

  res.json(await construireFichePersonnage(personnage));
}

// DELETE /api/personnages/:id — supprime le personnage ; les lignes Equipement/
// EquipementCube/EquipementSort/EquipementBreloque sont retirées en cascade
// (ON DELETE CASCADE, voir schema.sql).
async function supprimerPersonnage(req, res) {
  const personnage = await trouverPersonnage(req.params.id, req.utilisateur.id);
  if (!personnage) {
    return res.status(404).json({ erreur: 'Personnage introuvable' });
  }

  await pool.query('DELETE FROM Personnage WHERE id = ?', [personnage.id]);

  res.json({ id: personnage.id });
}

const PARCHO_MAX = 1000;

// PUT /api/personnages/:id/parcho — bonus de caractéristiques éditable par le
// joueur (façon scrolls), 6 valeurs entières entre 0 et PARCHO_MAX, persistées
// sur l'Equipement. Bornage serveur : pas de limite côté client jusqu'ici,
// une valeur énorme envoyée directement à l'API (contournant le champ input)
// pouvait fausser tous les calculs dérivés (stats, dégâts...).
async function sauvegarderParcho(req, res) {
  const personnage = await trouverPersonnage(req.params.id, req.utilisateur.id);
  if (!personnage) {
    return res.status(404).json({ erreur: 'Personnage introuvable' });
  }

  const entier = (v) => Math.min(PARCHO_MAX, Math.max(0, parseInt(v, 10) || 0));
  const parcho = {
    VITALITE: entier(req.body.VITALITE),
    SAGESSE: entier(req.body.SAGESSE),
    FORCE: entier(req.body.FORCE),
    INTELLIGENCE: entier(req.body.INTELLIGENCE),
    CHANCE: entier(req.body.CHANCE),
    AGILITE: entier(req.body.AGILITE),
  };

  await pool.query(
    `UPDATE Equipement
     SET parcho_vitalite = ?, parcho_sagesse = ?, parcho_force = ?, parcho_intelligence = ?, parcho_chance = ?, parcho_agilite = ?, mis_a_jour_le = NOW()
     WHERE personnage_id = ?`,
    [parcho.VITALITE, parcho.SAGESSE, parcho.FORCE, parcho.INTELLIGENCE, parcho.CHANCE, parcho.AGILITE, personnage.id]
  );

  res.json(parcho);
}

module.exports = {
  creerPersonnage,
  listerPersonnages,
  obtenirPersonnage,
  obtenirPersonnagePartage,
  equiperCube,
  equiperSort,
  equiperBreloque,
  equiperCubeAuto,
  equiperSortAuto,
  equiperBreloqueAuto,
  sauvegarderParcho,
  sauvegarderBoostBreloque,
  renommerPersonnage,
  desequiperTout,
  supprimerPersonnage,
};
