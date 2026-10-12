// Remplace les images Expert/Maître α/Maître ẞ des breloques (jusqu'ici une copie
// de l'image Novice) par les vraies images fournies pour ces 3 rangs, dans
// data/images/breloques/ (fichiers PNG lourds ~2-3 Mo, résolution 1512x1512,
// fond transparent). Compressées + réduites à 256x256 (même taille que les
// webp déjà en place), aplaties sur fond noir (les images Novice existantes
// n'ont pas de canal alpha, fond #000000 uni) pour rester visuellement cohérent.
//
// Correspondance construite à la main (comme import-breloques-boss-images.js) :
// vérifiée un par un contre les 38 noms de breloques non-Unique en base.
// 7 breloques n'ont pas reçu d'image pour ces 3 rangs (voir MANQUANTES ci-dessous) —
// elles gardent leur image Novice en Expert/Maître α/ẞ, inchangé.
//
// Usage : node server/scripts/import-breloques-rangs-images.js
require('dotenv').config();
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const DOSSIER_SOURCE = path.join(__dirname, '..', '..', 'data', 'images', 'breloques');
const DOSSIER_DEST = path.join(__dirname, '..', '..', 'client', 'public', 'images', 'breloques');

const RANG_EXPERT = 'Expert';
const RANG_MAITRE_A = 'Maître α';
const RANG_MAITRE_B = 'Maître ẞ';

const SUFFIXES = [
  { suffixe: '_expert.png', rang: RANG_EXPERT },
  { suffixe: '_maitre_a.png', rang: RANG_MAITRE_A },
  { suffixe: '_maitre_b.png', rang: RANG_MAITRE_B },
];

// clé de fichier (sans suffixe de rang) -> nom exact en base
const CORRESPONDANCE = {
  acupuncteur: "Breloque de l'Acupuncteur",
  agoraphobe: "Breloque de l'Agoraphobe",
  artificier_instable: "Breloque de l'Artificier instable",
  audacieux: "Breloque de l'Audacieux",
  bombeur_fascine: 'Breloque du Bombeur fasciné',
  bouclier_d_urgence: "Breloque du Bouclier d'urgence",
  capacite_croissante: 'Breloque de Capacité croissante',
  clerc_obscur: 'Breloque du Clerc obscur',
  dernier_souffle: 'Breloque de Dernier Souffle',
  embourbeur_embourbe: "Breloque de l'Embourbeur embourbé",
  empathie_croissante: "Breloque d'empathie croissante",
  entree_fracassante: "Breloque d'Entrée fracassante",
  explosivite_croissante: "Breloque d'Explosivité croissante",
  flagellant: 'Breloque du Flagellant',
  forcene: 'Breloque du Forcené',
  guerisseur_tenace: 'Breloque du Guérisseur tenace',
  hemophile: "Breloque de l'Hémophile",
  homeopathe: "Breloque de l'Homéopathe",
  martyr: 'Breloque du Martyr',
  paladin: "Breloque du Paladin d'avant-garde",
  rage_mortelle: 'Breloque de Rage mortelle',
  randonneur_tenace: 'Breloque du Randonneur tenace',
  revenant: 'Breloque du Revenant',
  sentinelle: 'Breloque de la Sentinelle',
  sprinteur: 'Breloque du Sprinteur',
  stratege_d_avant_garde: "Breloque du Stratège d'avant-garde",
  sursaut_de_puissance: 'Breloque de Sursaut de puissance',
  tension_croissante: 'Breloque de Tension croissante',
  tireur_elite: "Breloque du Tireur d'élite",
  tournee_d_adieux: "Breloque de la Tournée d'adieux",
  voile_sacre: 'Breloque du Voile Sacré',
};

// Breloques du CSV/DB n'ayant reçu aucune image Expert/Maître α/ẞ dans cet envoi
// (gardent leur image Novice pour ces 3 rangs) — listées pour le rapport de fin.
const MANQUANTES = [
  'Breloque de Carapace adaptative',
  'Breloque du Combattant belliqueux',
  'Breloque du Dernier repli',
  'Breloque du Randonneur ballonné',
  'Breloque du Rixeur Instable',
  'Breloque de Vision croissante',
  "Breloque du Visionnaire d'avant-garde",
];

async function main() {
  fs.mkdirSync(DOSSIER_DEST, { recursive: true });
  let succes = 0;
  let echecs = 0;

  for (const [cle, nom] of Object.entries(CORRESPONDANCE)) {
    for (const { suffixe, rang } of SUFFIXES) {
      const fichier = `${cle}${suffixe}`;
      const cheminSource = path.join(DOSSIER_SOURCE, fichier);
      if (!fs.existsSync(cheminSource)) {
        console.log(`⚠️  ${fichier} introuvable`);
        echecs++;
        continue;
      }

      const [lignes] = await pool.query('SELECT id FROM `Breloque` WHERE nom = ? AND rang = ?', [nom, rang]);
      if (lignes.length === 0) {
        console.log(`⚠️  Breloque "${nom}" (${rang}) introuvable en base`);
        echecs++;
        continue;
      }
      const { id } = lignes[0];
      const cheminDest = path.join(DOSSIER_DEST, `${id}.webp`);

      await sharp(cheminSource)
        .flatten({ background: '#000000' })
        .resize(256, 256)
        .webp({ quality: 80 })
        .toFile(cheminDest);

      console.log(`✓ ${fichier} -> Breloque ${id} (${nom}, ${rang})`);
      succes++;
    }
  }

  console.log(`\n${succes} images mises à jour, ${echecs} échec(s)/manquantes.`);
  console.log(`\n${MANQUANTES.length} breloques sans image Expert/Maître α/ẞ fournie (gardent l'image Novice) :`);
  MANQUANTES.forEach((nom) => console.log(`  - ${nom}`));

  process.exit(0);
}

main().catch((err) => {
  console.error('Erreur :', err);
  process.exit(1);
});
