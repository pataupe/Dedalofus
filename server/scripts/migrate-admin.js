// Migration ponctuelle (rejouable) : ajoute la colonne Utilisateur.est_admin
// (voir schema.sql) et donne le droit admin au compte indiqué.
// Usage : node server/scripts/migrate-admin.js [pseudo]   (défaut : Hyxa)
require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const pseudo = process.argv[2] || 'Hyxa';
  const connexion = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'dedalofus',
  });

  const [colonnes] = await connexion.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Utilisateur' AND COLUMN_NAME = 'est_admin'`
  );
  if (colonnes[0].n > 0) {
    console.log('Colonne est_admin existe déjà — ignorée.');
  } else {
    await connexion.query('ALTER TABLE Utilisateur ADD COLUMN est_admin TINYINT(1) NOT NULL DEFAULT 0 AFTER mot_de_passe_hash');
    console.log('Colonne est_admin ajoutée.');
  }

  const [resultat] = await connexion.query('UPDATE Utilisateur SET est_admin = 1 WHERE pseudo = ?', [pseudo]);
  console.log(resultat.affectedRows ? `Compte "${pseudo}" passé admin.` : `Aucun compte "${pseudo}" trouvé.`);

  await connexion.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
