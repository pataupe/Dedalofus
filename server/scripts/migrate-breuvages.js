// Migration ponctuelle (rejouable) : crée les tables Breuvage/EquipementBreuvage
// (voir schema.sql) et rattrape les personnages déjà existants — créés avant ce
// chantier, ils n'ont pas encore leurs 3 lignes EquipementBreuvage (contrairement
// aux nouveaux personnages, qui les reçoivent à la création, cf. creerPersonnage).
// Usage : node server/scripts/migrate-breuvages.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function tableExiste(connexion, table) {
  const [rows] = await connexion.query(
    `SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
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

  if (await tableExiste(connexion, 'Breuvage')) {
    console.log('Table Breuvage existe déjà — ignorée.');
  } else {
    await connexion.query(`
      CREATE TABLE Breuvage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        rang VARCHAR(20) NOT NULL,
        cle_stat VARCHAR(50) NOT NULL,
        valeur_stat INT NOT NULL,
        image_url VARCHAR(255) NULL,
        INDEX idx_breuvage_rang (rang)
      ) ENGINE=InnoDB
    `);
    console.log('Table Breuvage créée.');
  }

  if (await tableExiste(connexion, 'EquipementBreuvage')) {
    console.log('Table EquipementBreuvage existe déjà — ignorée.');
  } else {
    await connexion.query(`
      CREATE TABLE EquipementBreuvage (
        equipement_id INT NOT NULL,
        emplacement TINYINT NOT NULL,
        breuvage_id INT NULL,
        PRIMARY KEY (equipement_id, emplacement),
        FOREIGN KEY (equipement_id) REFERENCES Equipement(id) ON DELETE CASCADE,
        FOREIGN KEY (breuvage_id) REFERENCES Breuvage(id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);
    console.log('Table EquipementBreuvage créée.');
  }

  // Personnages sans leurs 3 lignes EquipementBreuvage (LEFT JOIN + IS NULL) :
  // tous les personnages déjà existants au moment de ce chantier.
  const [manquants] = await connexion.query(`
    SELECT e.id AS equipement_id
    FROM Equipement e
    LEFT JOIN EquipementBreuvage eb ON eb.equipement_id = e.id
    WHERE eb.equipement_id IS NULL
  `);

  if (manquants.length === 0) {
    console.log('Aucun personnage à rattraper.');
  } else {
    const lignes = manquants.flatMap(({ equipement_id }) => [
      [equipement_id, 1, null],
      [equipement_id, 2, null],
      [equipement_id, 3, null],
    ]);
    await connexion.query('INSERT INTO EquipementBreuvage (equipement_id, emplacement, breuvage_id) VALUES ?', [lignes]);
    console.log(`${manquants.length} personnage(s) rattrapé(s) (3 emplacements vides chacun).`);
  }

  await connexion.end();
}

main().catch((err) => {
  console.error('Erreur pendant la migration :', err);
  process.exit(1);
});
