const jwt = require('jsonwebtoken');

// Protège une route : refuse la requête si le token JWT est absent/invalide,
// sinon expose l'utilisateur décodé sur req.utilisateur ({ id, email }).
function verifierToken(req, res, next) {
  const entete = req.headers.authorization;

  if (!entete || !entete.startsWith('Bearer ')) {
    return res.status(401).json({ erreur: 'Authentification requise' });
  }

  const token = entete.slice('Bearer '.length);

  try {
    req.utilisateur = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ erreur: 'Token invalide ou expiré' });
  }
}

module.exports = verifierToken;
