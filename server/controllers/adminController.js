const pool = require('../config/db');
const { construireFichePersonnage } = require('./personnagesController');

// GET /api/admin/personnages — tous les personnages de tous les comptes,
// du plus récemment modifié au plus ancien, avec le nombre d'items équipés
// par type (un stuff vide se repère d'un coup d'œil).
async function listerTousPersonnages(req, res) {
  const [personnages] = await pool.query(
    `SELECT p.id, p.nom, p.cree_le, e.mis_a_jour_le, e.vues_partage,
            u.id AS utilisateur_id, u.pseudo, u.email,
            (SELECT COUNT(*) FROM EquipementCube WHERE equipement_id = e.id AND cube_id IS NOT NULL) AS nb_cubes,
            (SELECT COUNT(*) FROM EquipementSort WHERE equipement_id = e.id AND sort_id IS NOT NULL) AS nb_sorts,
            (SELECT COUNT(*) FROM EquipementBreloque WHERE equipement_id = e.id AND breloque_id IS NOT NULL) AS nb_breloques,
            (SELECT COUNT(*) FROM EquipementBreuvage WHERE equipement_id = e.id AND breuvage_id IS NOT NULL) AS nb_breuvages
     FROM Personnage p
     JOIN Utilisateur u ON u.id = p.utilisateur_id
     JOIN Equipement e ON e.personnage_id = p.id
     ORDER BY e.mis_a_jour_le DESC`
  );

  res.json(personnages);
}

// GET /api/admin/personnages/:id — fiche complète d'un personnage quel que soit
// son propriétaire. Contrairement à la route publique de partage, ne touche pas
// au compteur de vues (consultation admin, pas une vraie vue du lien).
async function obtenirPersonnageAdmin(req, res) {
  const [personnages] = await pool.query(
    `SELECT p.id, p.nom, u.pseudo, u.email
     FROM Personnage p
     JOIN Utilisateur u ON u.id = p.utilisateur_id
     JOIN Equipement e ON e.personnage_id = p.id
     WHERE p.id = ?`,
    [req.params.id]
  );
  const personnage = personnages[0];
  if (!personnage) {
    return res.status(404).json({ erreur: 'Personnage introuvable' });
  }

  const fiche = await construireFichePersonnage(personnage);
  res.json({ ...fiche, proprietaire: { pseudo: personnage.pseudo, email: personnage.email } });
}

module.exports = { listerTousPersonnages, obtenirPersonnageAdmin };
