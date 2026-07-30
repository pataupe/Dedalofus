// Associe les images de data/images/cubes/ aux 420 lignes de la table Cube.
// Les fichiers sources n'ont pas de nom explicite (identifiants numériques bruts
// du site source), mais leur ORDRE (tri numérique croissant du nom de fichier)
// correspond à l'ordre alphabétique élément puis rang puis numéro croissant.
// Un seul cube n'a pas d'image fournie : le dernier de l'ordre (Terre Rare 15).
// Usage : node server/scripts/import-cubes-images.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DOSSIER_SOURCE = path.join(__dirname, '..', '..', 'data', 'images', 'cubes');
const DOSSIER_PUBLIC = path.join(__dirname, '..', '..', 'client', 'public', 'images', 'cubes');

const ORDRE_ELEMENTS = ['Air', 'Chaos', 'Eau', 'Feu', 'Lumière', 'Terre'];
const ORDRE_RANGS = ['Commun', 'Épique', 'Éxalté', 'Mythique', 'Rare'];

async function main() {
  const connexion = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'dedalofus',
  });

  const [lignes] = await connexion.execute(
    'SELECT id, element, rang, numero FROM `Cube`'
  );

  const cubesOrdonnes = [];
  for (const element of ORDRE_ELEMENTS) {
    for (const rang of ORDRE_RANGS) {
      const groupe = lignes
        .filter((c) => c.element === element && c.rang === rang)
        .sort((a, b) => a.numero - b.numero);
      cubesOrdonnes.push(...groupe);
    }
  }

  const fichiers = fs
    .readdirSync(DOSSIER_SOURCE)
    .filter((f) => f.endsWith('.webp'))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  console.log(`${cubesOrdonnes.length} cubes en base, ${fichiers.length} images sources.`);

  fs.mkdirSync(DOSSIER_PUBLIC, { recursive: true });

  let associes = 0;
  for (let i = 0; i < fichiers.length; i++) {
    const cube = cubesOrdonnes[i];
    if (!cube) break;

    const source = path.join(DOSSIER_SOURCE, fichiers[i]);
    const destination = path.join(DOSSIER_PUBLIC, `${cube.id}.webp`);
    fs.copyFileSync(source, destination);

    const imageUrl = `/images/cubes/${cube.id}.webp`;
    await connexion.execute('UPDATE `Cube` SET image_url = ? WHERE id = ?', [imageUrl, cube.id]);
    associes++;
  }

  const sansImage = cubesOrdonnes.slice(fichiers.length);
  console.log(`${associes} cubes associés à une image.`);
  if (sansImage.length > 0) {
    console.log(`${sansImage.length} cube(s) sans image (attendu : le dernier de l'ordre) :`);
    for (const c of sansImage) {
      console.log(`  - id ${c.id} : ${c.element} ${c.rang} n°${c.numero}`);
    }
  }

  await connexion.end();
}

main().catch((err) => {
  console.error("Erreur pendant l'association des images de cubes :", err);
  process.exit(1);
});
