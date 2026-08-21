// Import des 10 familles de breuvage (3 rangs chacune : Petit/Normal/Grand) —
// pas de CSV source ici, les noms + stats ont été communiqués directement par
// le porteur de projet (aucun fichier fourni), donc codés en dur ci-dessous
// plutôt qu'un fichier intermédiaire pour 30 lignes.
//
// Images : data/images/breuvages-final/<slug>.png (30 fichiers, détourés —
// voir CLAUDE.md "Détourage des 30 premières images de breuvages"), convertis
// en webp et copiés vers client/public/images/breuvages/<id>.webp, comme les
// autres types d'équipement.
//
// Usage : node server/scripts/import-breuvages.js
// Vide la table avant de réimporter (comme import-breloques.js), pour pouvoir
// relancer sans doublons — les FK EquipementBreuvage.breuvage_id passent à
// NULL automatiquement (ON DELETE SET NULL, voir schema.sql).

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const sharp = require('sharp');

const DOSSIER_SRC = path.join(__dirname, '..', '..', 'data', 'images', 'breuvages-final');
const DOSSIER_DEST = path.join(__dirname, '..', '..', 'client', 'public', 'images', 'breuvages');

// valeurs : [Petit, Normal, Grand]
const BREUVAGES = [
  { slug: 'stimulant', nomBase: 'Breuvage Stimulant', cle: 'INTELLIGENCE', valeurs: [50, 100, 150] },
  { slug: 'fortifiant', nomBase: 'Breuvage Fortifiant', cle: 'FORCE', valeurs: [50, 100, 150] },
  { slug: 'de-réussite', nomBase: 'Breuvage de Réussite', cle: 'CHANCE', valeurs: [50, 100, 150] },
  { slug: 'assouplissant', nomBase: 'Breuvage Assouplissant', cle: 'AGILITE', valeurs: [50, 100, 150] },
  { slug: 'de-renfort-de-santé', nomBase: 'Breuvage de Renfort de Santé', cle: 'VITALITE', valeurs: [100, 250, 400] },
  { slug: 'raide-boule', nomBase: 'Breuvage Raide Boule', cle: 'PUISSANCE', valeurs: [40, 80, 120] },
  { slug: 'pétillant', nomBase: 'Breuvage Pétillant', cle: 'DO_CRIT', valeurs: [10, 20, 30] },
  { slug: 'percutant', nomBase: 'Breuvage Percutant', cle: 'DO_POU', valeurs: [20, 40, 60] },
  { slug: 'vaporeux', nomBase: 'Breuvage Vaporeux', cle: 'FUITE', valeurs: [40, 60, 80] },
  { slug: 'sirupeux', nomBase: 'Breuvage Sirupeux', cle: 'TACLE', valeurs: [30, 60, 90] },
];

const RANGS = ['Petit', 'Normal', 'Grand'];

// Convention de nommage des fichiers sources : "breuvage-<slug>.png" (Normal),
// "petit-breuvage-<slug>.png" / "grand-breuvage-<slug>.png". Une seule
// exception : le fichier Petit d'"assouplissant" a une coquille ("preuvage"
// au lieu de "breuvage") dans le nom fourni par le porteur de projet.
function nomFichier(slug, rang) {
  if (rang === 'Normal') return `breuvage-${slug}.png`;
  if (rang === 'Petit' && slug === 'assouplissant') return 'petit-preuvage-assouplissant.png';
  return `${rang.toLowerCase()}-breuvage-${slug}.png`;
}

async function main() {
  fs.mkdirSync(DOSSIER_DEST, { recursive: true });

  const connexion = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'dedalofus',
  });

  console.log(`Import de ${BREUVAGES.length * RANGS.length} breuvages...`);
  await connexion.execute('DELETE FROM Breuvage');

  let inserees = 0;
  for (const breuvage of BREUVAGES) {
    RANGS.forEach((rang, i) => {
      const valeur = breuvage.valeurs[i];
      const nom = rang === 'Normal' ? breuvage.nomBase : `${rang} ${breuvage.nomBase}`;
      const fichier = nomFichier(breuvage.slug, rang);
      const cheminSrc = path.join(DOSSIER_SRC, fichier);

      if (!fs.existsSync(cheminSrc)) {
        console.log(`  ⚠️  Image manquante pour "${nom}" (${fichier}) — insérée sans image.`);
      }

      breuvage._lignes = breuvage._lignes || [];
      breuvage._lignes.push({ nom, rang, valeur, cheminSrc: fs.existsSync(cheminSrc) ? cheminSrc : null });
    });
  }

  for (const breuvage of BREUVAGES) {
    for (const { nom, rang, valeur, cheminSrc } of breuvage._lignes) {
      const [resultat] = await connexion.execute(
        'INSERT INTO Breuvage (nom, rang, cle_stat, valeur_stat) VALUES (?, ?, ?, ?)',
        [nom, rang, breuvage.cle, valeur]
      );
      const id = resultat.insertId;

      if (cheminSrc) {
        const cheminDest = path.join(DOSSIER_DEST, `${id}.webp`);
        await sharp(cheminSrc).webp({ quality: 80 }).toFile(cheminDest);
        await connexion.execute('UPDATE Breuvage SET image_url = ? WHERE id = ?', [`/images/breuvages/${id}.webp`, id]);
      }

      inserees++;
    }
  }

  console.log(`Terminé : ${inserees} breuvages insérés (${DOSSIER_DEST}).`);
  await connexion.end();
}

main().catch((err) => {
  console.error("Erreur pendant l'import des breuvages :", err);
  process.exit(1);
});
