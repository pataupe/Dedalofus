const pool = require('../config/db');

const LIMITE_MAX = 500;
const LIMITE_PAR_DEFAUT = 50;

function parserPagination(query) {
  const limite = Math.min(parseInt(query.limit, 10) || LIMITE_PAR_DEFAUT, LIMITE_MAX);
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);
  return { limite, offset };
}

// GET /api/cubes?nom=&element=&rang=&stats=&limit=&offset=
// `stats` accepte plusieurs clés séparées par des virgules (ex: "AGILITE,DO_AIR") :
// renvoie les cubes ayant TOUTES ces stats à la fois (ET, pas OU).
async function listerCubes(req, res) {
  const { nom, element, rang, stats } = req.query;
  const { limite, offset } = parserPagination(req.query);

  const conditions = [];
  const params = [];

  if (nom) {
    // Le champ `nom` vaut toujours "Cube" pour les 420 cubes (aucune valeur distinctive) :
    // la recherche libre doit donc aussi porter sur l'élément, le rang et le numéro,
    // sinon taper "Feu", "Commun" ou "14" ne renvoie jamais rien.
    conditions.push('(nom LIKE ? OR element LIKE ? OR rang LIKE ? OR numero LIKE ?)');
    params.push(`%${nom}%`, `%${nom}%`, `%${nom}%`, `%${nom}%`);
  }
  if (element) {
    conditions.push('element = ?');
    params.push(element);
  }
  if (rang) {
    conditions.push('rang = ?');
    params.push(rang);
  }
  const listeStats = stats ? stats.split(',').filter(Boolean) : [];
  // Une condition IN(...) séparée par stat cochée, jointe en AND avec les autres
  // conditions ci-dessous : le cube doit avoir CHACUNE des stats, pas juste une seule.
  for (const cle of listeStats) {
    conditions.push('id IN (SELECT cube_id FROM StatCube WHERE cle_stat = ?)');
    params.push(cle);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [cubes] = await pool.query(
    `SELECT id, nom, element, rang, numero, image_url FROM \`Cube\` ${whereClause} ORDER BY id LIMIT ? OFFSET ?`,
    [...params, limite, offset]
  );

  if (cubes.length === 0) {
    return res.json([]);
  }

  // On récupère les stats de tous les cubes de la page en une seule requête,
  // puis on les regroupe par cube_id (évite le N+1 requêtes).
  const idsCubes = cubes.map((c) => c.id);
  const [statsLignes] = await pool.query(
    `SELECT cube_id, cle_stat AS \`key\`, valeur AS value, libelle AS label
     FROM StatCube WHERE cube_id IN (${idsCubes.map(() => '?').join(',')})`,
    idsCubes
  );

  const statsParCube = {};
  for (const ligne of statsLignes) {
    if (!statsParCube[ligne.cube_id]) statsParCube[ligne.cube_id] = [];
    statsParCube[ligne.cube_id].push({ key: ligne.key, value: ligne.value, label: ligne.label });
  }

  res.json(cubes.map((cube) => ({ ...cube, stats: statsParCube[cube.id] || [] })));
}

// GET /api/cubes/:id — cube + ses stats jointes
async function obtenirCube(req, res) {
  const { id } = req.params;

  const [cubes] = await pool.query(
    'SELECT id, nom, element, rang, numero, image_url FROM `Cube` WHERE id = ?',
    [id]
  );

  if (cubes.length === 0) {
    return res.status(404).json({ erreur: 'Cube introuvable' });
  }

  const [stats] = await pool.query(
    'SELECT cle_stat AS `key`, valeur AS value, libelle AS label FROM StatCube WHERE cube_id = ?',
    [id]
  );

  res.json({ ...cubes[0], stats });
}

module.exports = { listerCubes, obtenirCube };
