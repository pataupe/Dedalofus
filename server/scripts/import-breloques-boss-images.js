// Convertit + importe les images des 14 breloques de boss (rang Unique), fournies
// en PNG dans data/images/breloques/ (noms de fichiers abrégés, correspondance
// vérifiée un par un contre les 14 lignes réelles rang='Unique'). Copie vers
// client/public/images/breloques/<id>.webp et met à jour Breloque.image_url.
// Nécessite Node >= 20 (sharp) — même contrainte que convert-cubes-webp.js /
// convert-sorts-unique-webp.js. Usage : node server/scripts/import-breloques-boss-images.js
require('dotenv').config();
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const DOSSIER_SOURCE = path.join(__dirname, '..', '..', 'data', 'images', 'breloques');
const DOSSIER_DEST = path.join(__dirname, '..', '..', 'client', 'public', 'images', 'breloques');

// "phor-proximite.png" -> "Proximité étouffante du Phossile" : confirme au passage
// que la breloque de l'Ensemble du Phossile (data/Liste-des-ensembles.md) N'est PAS
// "Protection du Craqdoa" (coquille de copier-coller détectée par generate-ensembles.js,
// même breloque utilisée par erreur pour 2 ensembles boss différents) — voir la
// correction dédiée dans generate-ensembles.js (CORRECTIONS_BOSS_BRELOQUE).
const CORRESPONDANCE = {
  'arsenal.png': 'Arsenal de Guerre',
  'charme-troublant.png': "Charme troublant d'Ambra",
  'collecte.png': 'Collecte de Misère',
  'couvee.png': 'Couvée du Hululord',
  'embrasement.png': 'Embrasement du Katragon',
  'emprise.png': 'Emprise de Servitude',
  'kong-agilite.png': 'Agilité du Kong',
  'ombre-noirceur.png': "Noirceur latente de la Silhouette d'Ombre",
  'pestilience.png': 'Pestilence du Toxoliath',
  'phor-proximite.png': 'Proximité étouffante du Phossile',
  'protection-craqdoa.png': 'Protection du Craqdoa',
  'puanteur.png': 'Puanteur de Corruption',
  'putrefaction.png': 'Putréfaction de Kabahal',
  'siphon.png': "Siphon du Ch'Tyx",
};

async function main() {
  fs.mkdirSync(DOSSIER_DEST, { recursive: true });
  let succes = 0;

  for (const [fichier, nom] of Object.entries(CORRESPONDANCE)) {
    const cheminSource = path.join(DOSSIER_SOURCE, fichier);
    if (!fs.existsSync(cheminSource)) {
      console.log(`⚠️  ${fichier} introuvable dans ${DOSSIER_SOURCE}`);
      continue;
    }

    const [lignes] = await pool.query('SELECT id FROM Breloque WHERE nom = ?', [nom]);
    if (lignes.length === 0) {
      console.log(`⚠️  Breloque "${nom}" introuvable en base`);
      continue;
    }
    const { id } = lignes[0];
    const cheminDest = path.join(DOSSIER_DEST, `${id}.webp`);

    await sharp(cheminSource).webp({ quality: 85 }).toFile(cheminDest);
    await pool.query('UPDATE Breloque SET image_url = ? WHERE id = ?', [`/images/breloques/${id}.webp`, id]);
    console.log(`✓ ${fichier} -> Breloque ${id} (${nom})`);
    succes++;
  }

  console.log(`\n${succes}/${Object.keys(CORRESPONDANCE).length} breloques de boss mises à jour.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Erreur :', err);
  process.exit(1);
});
