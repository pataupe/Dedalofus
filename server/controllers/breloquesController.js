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

// GET /api/breloques?nom=&rangs=&tags=&limit=&offset=
// `rangs` et `tags` acceptent plusieurs valeurs séparées par des virgules
// (plusieurs filtres actifs en même temps, combinés en OR entre eux). `rangs`
// accepte aussi la valeur "Unique" (rang réel en base des breloques de boss,
// affiché "Boss" côté filtre) en plus de Novice/Expert/Maître α/Maître ẞ.
// `tags` fait un LIKE par tag : une breloque peut avoir plusieurs tags à la
// fois dans une seule colonne texte (ex: "Breloque boss + Dégâts + Entrave").
async function listerBreloques(req, res) {
  const { nom } = req.query;
  const rangs = parserListe(req.query.rangs);
  const tags = parserListe(req.query.tags);
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
  if (tags.length) {
    conditions.push(`(${tags.map(() => 'tag LIKE ?').join(' OR ')})`);
    tags.forEach((tag) => params.push(`%${tag}%`));
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [breloques] = await pool.query(
    `SELECT id, nom, rang, effet, image_url FROM Breloque ${whereClause} ORDER BY id LIMIT ? OFFSET ?`,
    [...params, limite, offset]
  );

  res.json(breloques);
}

// GET /api/breloques/:id — pas de filtre `visible`/`nom` (contrairement à la
// liste) : une breloque déjà référencée ailleurs (ex: pièce d'un ensemble)
// doit rester consultable même si elle ne remonterait plus dans une recherche.
async function obtenirBreloque(req, res) {
  const { id } = req.params;

  const [breloques] = await pool.query('SELECT * FROM Breloque WHERE id = ?', [id]);

  if (breloques.length === 0) {
    return res.status(404).json({ erreur: 'Breloque introuvable' });
  }

  res.json(breloques[0]);
}

module.exports = { listerBreloques, obtenirBreloque };
