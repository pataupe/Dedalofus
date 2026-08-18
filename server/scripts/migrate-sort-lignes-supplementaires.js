// Migration ponctuelle (rejouable) : ajoute Sort.est_soin + la table SortDegatsSup
// (lignes de dégâts/soin supplémentaires, cf. schema.sql). Nécessaire pour les
// sorts à dégâts multiples (Bluff, Tourbillon Embrasé, Pile ou Face, Foène,
// Pelle Aveuglante) et les sorts de soin (Mot Soignant/Curatif/Revitalisant).
// Usage : node server/scripts/migrate-sort-lignes-supplementaires.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function colonneExiste(connexion, table, colonne) {
  const [rows] = await connexion.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, colonne]
  );
  return rows[0].n > 0;
}

async function tableExiste(connexion, table) {
  const [rows] = await connexion.query(
    `SELECT COUNT(*) AS n FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return rows[0].n > 0;
}

async function main() {
  const connexion = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'dedalofus',
  });

  if (await colonneExiste(connexion, 'Sort', 'est_soin')) {
    console.log('Sort.est_soin existe déjà — ignoré.');
  } else {
    await connexion.query('ALTER TABLE Sort ADD COLUMN est_soin TINYINT(1) NOT NULL DEFAULT 0');
    console.log('Sort.est_soin ajoutée.');
  }

  if (await tableExiste(connexion, 'SortDegatsSup')) {
    console.log('Table SortDegatsSup existe déjà — ignorée.');
  } else {
    await connexion.query(`
      CREATE TABLE SortDegatsSup (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sort_id INT NOT NULL,
        ordre INT NOT NULL DEFAULT 1,
        element VARCHAR(50) NULL,
        degats_min INT NULL,
        degats_max INT NULL,
        degats_critique_min INT NULL,
        degats_critique_max INT NULL,
        FOREIGN KEY (sort_id) REFERENCES Sort(id) ON DELETE CASCADE,
        INDEX idx_sortdegatssup_sort (sort_id)
      ) ENGINE=InnoDB
    `);
    console.log('Table SortDegatsSup créée.');
  }

  await connexion.end();
}

main().catch((err) => {
  console.error('Erreur pendant la migration :', err);
  process.exit(1);
});
