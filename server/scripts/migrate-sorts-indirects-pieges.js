// Migration ponctuelle (rejouable) : ajoute Sort.est_indirect / Sort.est_piege et
// marque les sorts concernés (data/sorts-degats-indirects.md). est_piege est un
// sous-ensemble de est_indirect (5 sorts sur les 16) — voir schema.sql/calcul.js.
// Usage : node server/scripts/migrate-sorts-indirects-pieges.js
require('dotenv').config();
const mysql = require('mysql2/promise');

// `prefixe: true` pour les sorts stockés avec un suffixe d'élément ("Piège
// sournois - Terre"/"- Feu"...) : un seul nom en base, un seul en base avec
// suffixe, ou plusieurs variantes selon l'élément — LIKE 'nom%' couvre tous les
// rangs ET toutes les variantes d'élément en une seule requête. `prefixe: false`
// pour les sorts à nom unique sans suffixe (comparaison exacte).
const SORTS_INDIRECTS = [
  { nom: 'Poison Insidieux', prefixe: true },
  { nom: 'Toxines', prefixe: false },
  { nom: 'Piège sournois', prefixe: true },
  { nom: 'Piège de Masse', prefixe: true },
  { nom: "Piège d'immobilisation", prefixe: false },
  { nom: 'Piège empoisonné', prefixe: true },
  { nom: "Piège d'entaille", prefixe: true },
  { nom: "Glyphe d'Entrave", prefixe: true },
  // Le fichier source dit "glyphe d'eblouissement" mais le sort réel en base
  // s'appelle "Glyphe Éblouissant".
  { nom: 'Glyphe Éblouissant', prefixe: true },
  { nom: 'Escarre face', prefixe: true },
  { nom: 'Tornabombe', prefixe: true },
  { nom: 'Sismobombe', prefixe: true },
  { nom: 'Bombe à eau', prefixe: false },
  { nom: 'Explobombe', prefixe: false },
  { nom: 'Machination', prefixe: false },
  { nom: 'Secousse Temporelle', prefixe: false },
];

// Sous-ensemble de SORTS_INDIRECTS (les 5 vrais pièges, cf. sorts-degats-indirects.md).
const SORTS_PIEGES = [
  'Piège sournois',
  'Piège de Masse',
  "Piège d'immobilisation",
  'Piège empoisonné',
  "Piège d'entaille",
];

async function colonneExiste(connexion, table, colonne) {
  const [rows] = await connexion.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, colonne]
  );
  return rows[0].n > 0;
}

async function marquer(connexion, colonne, nom, prefixe) {
  const [resultat] = await connexion.query(
    `UPDATE Sort SET ${colonne} = 1 WHERE nom ${prefixe ? 'LIKE ?' : '= ?'}`,
    [prefixe ? `${nom}%` : nom]
  );
  if (resultat.affectedRows === 0) {
    console.log(`  ⚠️  Aucune ligne trouvée pour "${nom}" (${colonne}) — à vérifier.`);
  } else {
    console.log(`  ${nom} → ${resultat.affectedRows} ligne(s) marquée(s) (${colonne}).`);
  }
}

async function main() {
  const connexion = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'dedalofus',
  });

  for (const colonne of ['est_indirect', 'est_piege']) {
    if (await colonneExiste(connexion, 'Sort', colonne)) {
      console.log(`Sort.${colonne} existe déjà — ignoré.`);
    } else {
      await connexion.query(`ALTER TABLE Sort ADD COLUMN ${colonne} TINYINT(1) NOT NULL DEFAULT 0`);
      console.log(`Sort.${colonne} ajoutée.`);
    }
  }

  console.log('\nMarquage est_indirect :');
  for (const { nom, prefixe } of SORTS_INDIRECTS) {
    await marquer(connexion, 'est_indirect', nom, prefixe);
  }

  console.log('\nMarquage est_piege :');
  for (const nom of SORTS_PIEGES) {
    const { prefixe } = SORTS_INDIRECTS.find((s) => s.nom === nom);
    await marquer(connexion, 'est_piege', nom, prefixe);
  }

  const [[{ n: nIndirect }]] = await connexion.query('SELECT COUNT(*) AS n FROM Sort WHERE est_indirect = 1');
  const [[{ n: nPiege }]] = await connexion.query('SELECT COUNT(*) AS n FROM Sort WHERE est_piege = 1');
  console.log(`\nTotal : ${nIndirect} lignes est_indirect=1, ${nPiege} lignes est_piege=1.`);

  await connexion.end();
}

main().catch((err) => {
  console.error('Erreur pendant la migration :', err);
  process.exit(1);
});
