const crypto = require('crypto');
const pool = require('../config/db');
const { calculerStatsPersonnage, calculerPanopliesActives, calculerDegats } = require('../logic/calcul');

const NOM_MAX = 100;

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

  const lienPartage = crypto.randomBytes(16).toString('hex');
  const [equipement] = await pool.query(
    'INSERT INTO Equipement (personnage_id, lien_partage) VALUES (?, ?)',
    [resultat.insertId, lienPartage]
  );

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

// GET /api/personnages
async function listerPersonnages(req, res) {
  const [personnages] = await pool.query(
    'SELECT id, nom, cree_le FROM Personnage WHERE utilisateur_id = ? ORDER BY cree_le DESC',
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

// Construit la fiche complète (stats, panoplies, équipement, dégâts) d'un
// personnage déjà identifié — partagé entre la route privée (obtenirPersonnage,
// vérifie utilisateur_id) et la route publique de partage (vérifie lien_partage).
async function construireFichePersonnage(personnage) {
  const [cubes] = await pool.query(
    `SELECT ec.emplacement, c.id, c.nom, c.element, c.rang, c.numero
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
    `SELECT eb.emplacement, b.id, b.nom, b.rang, b.effet
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
  const statsPersonnage = calculerStatsPersonnage(cubesEquipesPourCalcul, parcho);
  const panoplies = calculerPanopliesActives(cubesEquipesPourCalcul);

  const sortsEquipesPourCalcul = sorts
    .filter((s) => s.id)
    .map((s) => ({
      id: s.id,
      degatsMin: s.degats_min,
      degatsMax: s.degats_max,
      element: s.element,
      degatsCritiqueMin: s.degats_critique_min,
      degatsCritiqueMax: s.degats_critique_max,
      chanceCritique: s.chance_critique,
    }));
  const degats = calculerDegats(statsPersonnage, sortsEquipesPourCalcul);

  return {
    id: personnage.id,
    nom: personnage.nom,
    lienPartage: eq.lien_partage,
    stats: statsPersonnage,
    panoplies,
    parcho,
    degats,
    cubes: cubes.map(({ emplacement, id, nom, element, rang, numero }) => ({
      emplacement,
      cube: id ? { id, nom, element, rang, numero } : null,
    })),
    sorts: sorts.map(({ emplacement, ...sort }) => ({
      emplacement,
      sort: sort.id ? sort : null,
    })),
    breloques: breloques.map(({ emplacement, id, nom, rang, effet }) => ({
      emplacement,
      breloque: id ? { id, nom, rang, effet } : null,
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
    return res.status(409).json({ erreur: 'Tous les emplacements cubes sont déjà occupés.' });
  }

  await pool.query(
    'UPDATE EquipementCube ec JOIN Equipement e ON e.id = ec.equipement_id SET ec.cube_id = ? WHERE e.personnage_id = ? AND ec.emplacement = ?',
    [cubeId, personnage.id, emplacement]
  );

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

// PUT /api/personnages/:id/sorts et /api/personnages/:id/breloques — même
// principe que equiperCubeAuto (premier emplacement libre), sans contrainte de
// doublon (seuls les cubes ont la règle "un seul exemplaire par élément+numéro").
async function equiperAuto(req, res, { table, colonne, type, valeur }) {
  const personnage = await trouverPersonnage(req.params.id, req.utilisateur.id);
  if (!personnage) {
    return res.status(404).json({ erreur: 'Personnage introuvable' });
  }

  const emplacement = await trouverEmplacementLibre(personnage.id, table, colonne);
  if (!emplacement) {
    return res.status(409).json({ erreur: `Tous les emplacements ${type} sont déjà occupés.` });
  }

  await pool.query(
    `UPDATE ${table} t JOIN Equipement e ON e.id = t.equipement_id SET t.${colonne} = ? WHERE e.personnage_id = ? AND t.emplacement = ?`,
    [valeur, personnage.id, emplacement]
  );

  res.json({ emplacement, [colonne]: valeur });
}

async function equiperSortAuto(req, res) {
  await equiperAuto(req, res, { table: 'EquipementSort', colonne: 'sort_id', type: 'sorts', valeur: req.body.sortId });
}

async function equiperBreloqueAuto(req, res) {
  await equiperAuto(req, res, {
    table: 'EquipementBreloque',
    colonne: 'breloque_id',
    type: 'breloques',
    valeur: req.body.breloqueId,
  });
}

// PUT /api/personnages/:id/sorts/:emplacement
async function equiperSort(req, res) {
  await equiper(req, res, {
    table: 'EquipementSort',
    colonne: 'sort_id',
    type: 'sorts',
    valeur: req.body.sortId,
  });
}

// PUT /api/personnages/:id/breloques/:emplacement
async function equiperBreloque(req, res) {
  await equiper(req, res, {
    table: 'EquipementBreloque',
    colonne: 'breloque_id',
    type: 'breloques',
    valeur: req.body.breloqueId,
  });
}

async function equiper(req, res, { table, colonne, type, valeur }) {
  const personnage = await trouverPersonnage(req.params.id, req.utilisateur.id);
  if (!personnage) {
    return res.status(404).json({ erreur: 'Personnage introuvable' });
  }

  const emplacement = Number(req.params.emplacement);
  if (!Number.isInteger(emplacement) || emplacement < 1 || emplacement > EMPLACEMENTS_MAX[type]) {
    return res.status(400).json({ erreur: 'Emplacement invalide' });
  }

  await pool.query(
    `UPDATE ${table} t JOIN Equipement e ON e.id = t.equipement_id SET t.${colonne} = ? WHERE e.personnage_id = ? AND t.emplacement = ?`,
    [valeur, personnage.id, emplacement]
  );

  res.json({ emplacement, [colonne]: valeur });
}

// PUT /api/personnages/:id/parcho — bonus de caractéristiques éditable par le
// joueur (façon scrolls), 6 valeurs entières >= 0, persistées sur l'Equipement.
async function sauvegarderParcho(req, res) {
  const personnage = await trouverPersonnage(req.params.id, req.utilisateur.id);
  if (!personnage) {
    return res.status(404).json({ erreur: 'Personnage introuvable' });
  }

  const entier = (v) => Math.max(0, parseInt(v, 10) || 0);
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
     SET parcho_vitalite = ?, parcho_sagesse = ?, parcho_force = ?, parcho_intelligence = ?, parcho_chance = ?, parcho_agilite = ?
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
};
