const pool = require('../config/db');

const LIMITE_MAX = 500;
const LIMITE_PAR_DEFAUT = 50;

function parserPagination(query) {
  const limite = Math.min(parseInt(query.limit, 10) || LIMITE_PAR_DEFAUT, LIMITE_MAX);
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);
  return { limite, offset };
}

// GET /api/sorts?nom=&element=&rang=&limit=&offset=
async function listerSorts(req, res) {
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
    conditions.push('rang_evolution = ?');
    params.push(rang);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [sorts] = await pool.query(
    `SELECT * FROM Sort ${whereClause} ORDER BY id LIMIT ? OFFSET ?`,
    [...params, limite, offset]
  );

  res.json(sorts);
}

module.exports = { listerSorts };
