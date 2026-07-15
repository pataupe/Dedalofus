const pool = require('../config/db');

const LIMITE_MAX = 500;
const LIMITE_PAR_DEFAUT = 50;

function parserPagination(query) {
  const limite = Math.min(parseInt(query.limit, 10) || LIMITE_PAR_DEFAUT, LIMITE_MAX);
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);
  return { limite, offset };
}

// GET /api/cubes?nom=&element=&rang=&limit=&offset=
async function listerCubes(req, res) {
  const { nom, element, rang } = req.query;
  const { limite, offset } = parserPagination(req.query);

  const conditions = [];
  const params = [];

  if (nom) {
    conditions.push('nom LIKE ?');
    params.push(`%${nom}%`);
  }
  if (element) {
    conditions.push('element = ?');
    params.push(element);
  }
  if (rang) {
    conditions.push('rang = ?');
    params.push(rang);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [cubes] = await pool.query(
    `SELECT id, nom, element, rang, numero, image_url FROM \`Cube\` ${whereClause} ORDER BY id LIMIT ? OFFSET ?`,
    [...params, limite, offset]
  );

  res.json(cubes);
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
