const pool = require('../config/db');

const LIMITE_MAX = 500;
const LIMITE_PAR_DEFAUT = 50;

function parserPagination(query) {
  const limite = Math.min(parseInt(query.limit, 10) || LIMITE_PAR_DEFAUT, LIMITE_MAX);
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);
  return { limite, offset };
}

function parserListe(valeur) {
  return valeur ? valeur.split(',').filter(Boolean) : [];
}

// GET /api/breloques?nom=&rangs=&limit=&offset=
// `rangs` accepte plusieurs valeurs séparées par des virgules (plusieurs filtres
// actifs en même temps, combinés en OR entre eux).
async function listerBreloques(req, res) {
  const { nom } = req.query;
  const rangs = parserListe(req.query.rangs);
  const { limite, offset } = parserPagination(req.query);

  const conditions = [];
  const params = [];

  if (nom) {
    conditions.push('nom LIKE ?');
    params.push(`%${nom}%`);
  }
  if (rangs.length) {
    conditions.push(`(${rangs.map(() => 'rang = ?').join(' OR ')})`);
    params.push(...rangs);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [breloques] = await pool.query(
    `SELECT id, nom, rang, effet FROM Breloque ${whereClause} ORDER BY id LIMIT ? OFFSET ?`,
    [...params, limite, offset]
  );

  res.json(breloques);
}

module.exports = { listerBreloques };
