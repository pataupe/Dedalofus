const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const TOURS_HACHAGE = 10;
const PSEUDO_MIN = 3;
const PSEUDO_MAX = 32;

// Regex pragmatique (norme HTML5 pour <input type="email">) : local-part@domaine.tld,
// exige un point dans le domaine. Rejette "0@0", accepte les emails valides classiques.
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function genererToken(id, email, pseudo) {
  return jwt.sign({ id, email, pseudo }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// POST /api/auth/inscription
async function inscription(req, res) {
  const { email, pseudo, motDePasse } = req.body;

  if (!email || !pseudo || !motDePasse) {
    return res.status(400).json({ erreur: 'Email, pseudo et mot de passe requis' });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ erreur: 'Adresse email invalide' });
  }
  if (pseudo.length < PSEUDO_MIN || pseudo.length > PSEUDO_MAX) {
    return res.status(400).json({ erreur: `Le pseudo doit faire entre ${PSEUDO_MIN} et ${PSEUDO_MAX} caractères` });
  }
  if (motDePasse.length < 6) {
    return res.status(400).json({ erreur: 'Le mot de passe doit faire au moins 6 caractères' });
  }

  const [existants] = await pool.query(
    'SELECT id FROM Utilisateur WHERE email = ? OR pseudo = ?',
    [email, pseudo]
  );
  if (existants.length > 0) {
    return res.status(409).json({ erreur: 'Un compte existe déjà avec cet email ou ce pseudo' });
  }

  const hash = await bcrypt.hash(motDePasse, TOURS_HACHAGE);

  let resultat;
  try {
    [resultat] = await pool.query(
      'INSERT INTO Utilisateur (email, pseudo, mot_de_passe_hash) VALUES (?, ?, ?)',
      [email, pseudo, hash]
    );
  } catch (err) {
    // Filet de sécurité contre une course entre la vérification ci-dessus et l'insertion
    // (deux inscriptions quasi simultanées avec le même email/pseudo) : la contrainte
    // UNIQUE en base rattrape le cas, on renvoie juste un message propre au lieu d'une 500.
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erreur: 'Un compte existe déjà avec cet email ou ce pseudo' });
    }
    throw err;
  }

  const token = genererToken(resultat.insertId, email, pseudo);
  res.status(201).json({ token, utilisateur: { id: resultat.insertId, email, pseudo } });
}

// POST /api/auth/connexion
async function connexion(req, res) {
  const { email, motDePasse } = req.body;

  if (!email || !motDePasse) {
    return res.status(400).json({ erreur: 'Email et mot de passe requis' });
  }

  const [utilisateurs] = await pool.query(
    'SELECT id, email, pseudo, mot_de_passe_hash FROM Utilisateur WHERE email = ?',
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

  const token = genererToken(utilisateur.id, utilisateur.email, utilisateur.pseudo);
  res.json({ token, utilisateur: { id: utilisateur.id, email: utilisateur.email, pseudo: utilisateur.pseudo } });
}

module.exports = { inscription, connexion };
