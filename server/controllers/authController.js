const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const TOURS_HACHAGE = 10;

function genererToken(id, email) {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// POST /api/auth/inscription
async function inscription(req, res) {
  const { email, motDePasse } = req.body;

  if (!email || !motDePasse) {
    return res.status(400).json({ erreur: 'Email et mot de passe requis' });
  }
  if (motDePasse.length < 6) {
    return res.status(400).json({ erreur: 'Le mot de passe doit faire au moins 6 caractères' });
  }

  const [existants] = await pool.query('SELECT id FROM Utilisateur WHERE email = ?', [email]);
  if (existants.length > 0) {
    return res.status(409).json({ erreur: 'Un compte existe déjà avec cet email' });
  }

  const hash = await bcrypt.hash(motDePasse, TOURS_HACHAGE);
  const [resultat] = await pool.query(
    'INSERT INTO Utilisateur (email, mot_de_passe_hash) VALUES (?, ?)',
    [email, hash]
  );

  const token = genererToken(resultat.insertId, email);
  res.status(201).json({ token, utilisateur: { id: resultat.insertId, email } });
}

// POST /api/auth/connexion
async function connexion(req, res) {
  const { email, motDePasse } = req.body;

  if (!email || !motDePasse) {
    return res.status(400).json({ erreur: 'Email et mot de passe requis' });
  }

  const [utilisateurs] = await pool.query(
    'SELECT id, email, mot_de_passe_hash FROM Utilisateur WHERE email = ?',
    [email]
  );

  if (utilisateurs.length === 0) {
    return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
  }

  const utilisateur = utilisateurs[0];
  const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.mot_de_passe_hash);

  if (!motDePasseValide) {
    return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
  }

  const token = genererToken(utilisateur.id, utilisateur.email);
  res.json({ token, utilisateur: { id: utilisateur.id, email: utilisateur.email } });
}

module.exports = { inscription, connexion };
