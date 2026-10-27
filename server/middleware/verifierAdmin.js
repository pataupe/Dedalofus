const pool = require('../config/db');

// À placer APRÈS verifierToken : refuse la requête si l'utilisateur connecté
// n'est pas admin. Le statut est relu en base à chaque appel (jamais lu depuis
// le JWT, valable 30 jours) : retirer le droit admin d'un compte prend effet
// immédiatement.
async function verifierAdmin(req, res, next) {
  const [utilisateurs] = await pool.query('SELECT est_admin FROM Utilisateur WHERE id = ?', [req.utilisateur.id]);

  if (!utilisateurs[0] || !utilisateurs[0].est_admin) {
    return res.status(403).json({ erreur: 'Accès réservé aux administrateurs' });
  }

  next();
}

module.exports = verifierAdmin;
