// Retire la barre rouge d'UI (barre de vie/ressource capturée par erreur en
// haut de chaque capture) des 30 breuvages sources — étape de préparation
// avant détourage IA (voir data/images/breuvages/README ou la conversation
// associée : le flood-fill utilisé pour cubes/breloques/sorts mange une
// partie du breuvage lui-même sur ce style d'icône, dégradés/lueur trop
// progressifs pour une simple distance de couleur — un outil IA de retrait de
// fond (ex: Clipdrop Remove Background) fait un bien meilleur travail pour
// cette étape-là, une fois la barre déjà effacée par ce script).
//
// Détection GÉOMÉTRIQUE (pas une distance de couleur classique) : la barre
// est une bande pleine largeur toujours collée au bord haut, d'un rouge "pur"
// (G et B faibles ET proches l'un de l'autre) — contrairement à un dégradé
// ambré/doré de bouteille où le rouge domine aussi mais où le vert reste une
// fraction significative du rouge. Cette distinction évite de confondre la
// barre avec un breuvage lui-même rouge (coeur, chope) ou doré (fiole).
//
// Usage : node server/scripts/nettoyer-barre-breuvages.js
// Rejouable (écrase juste le dossier de sortie).

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DOSSIER_SRC = path.join(__dirname, '..', '..', 'data', 'images', 'breuvages');
const DOSSIER_SORTIE = path.join(__dirname, '..', '..', 'data', 'images', 'breuvages-sans-barre');

function detecterBasDeBarre(data, width, height) {
  let barBottom = -1;
  const limite = Math.floor(height * 0.28);
  const margeX = Math.floor(width * 0.12); // ignore les colonnes extrêmes (coin arrondi du cadre)
  let trouGap = 0;
  for (let y = 0; y < limite; y++) {
    let sr = 0, sg = 0, sb = 0, n = 0;
    for (let x = margeX; x < width - margeX; x++) {
      const i = (y * width + x) * 4;
      sr += data[i]; sg += data[i + 1]; sb += data[i + 2];
      n++;
    }
    const mr = sr / n, mg = sg / n, mb = sb / n;
    const estBarre = mr > 70 && mg < mr * 0.35 && mb < mr * 0.35;
    if (estBarre) { barBottom = y; trouGap = 0; }
    else if (barBottom >= 0) {
      trouGap++;
      if (trouGap > 2) break; // au-delà d'un petit creux (ombre/reflet de la barre), on considère qu'elle est finie
    }
  }
  return barBottom;
}

async function traiter(fichier) {
  const cheminSrc = path.join(DOSSIER_SRC, fichier);
  const { data, info } = await sharp(cheminSrc).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  const barBottom = detecterBasDeBarre(data, width, height);
  if (barBottom < 0) {
    // pas de barre détectée (déjà recadrée en amont) : copie telle quelle
    await sharp(cheminSrc).png().toFile(path.join(DOSSIER_SORTIE, fichier));
    console.log(fichier, '-> aucune barre détectée, copié tel quel');
    return;
  }

  const fin = Math.min(height, barBottom + 3);
  // couleur de fond de repli : moyenne de la ligne juste sous la barre (le
  // vrai fond du cadre à cet endroit précis, coins compris)
  let sr = 0, sg = 0, sb = 0;
  for (let x = 0; x < width; x++) {
    const i = (fin * width + x) * 4;
    sr += data[i]; sg += data[i + 1]; sb += data[i + 2];
  }
  const fond = [Math.round(sr / width), Math.round(sg / width), Math.round(sb / width)];

  for (let y = 0; y < fin; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      data[i] = fond[0]; data[i + 1] = fond[1]; data[i + 2] = fond[2]; data[i + 3] = 255;
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(path.join(DOSSIER_SORTIE, fichier));
  console.log(fichier, '-> barre retirée (0 à', fin, 'px), fond repeint en', fond);
}

async function main() {
  fs.mkdirSync(DOSSIER_SORTIE, { recursive: true });
  const fichiers = fs.readdirSync(DOSSIER_SRC).filter((f) => f.toLowerCase().endsWith('.png'));
  for (const f of fichiers) {
    await traiter(f);
  }
  console.log(`\n${fichiers.length} images traitées -> ${DOSSIER_SORTIE}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
