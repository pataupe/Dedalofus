// Génère les vignettes composites des ensembles (2 pièces en diagonale, celle en
// premier plan/bas-gauche par-dessus celle en arrière-plan/haut-droite), à partir
// des `imageItems` déjà résolus par generate-ensembles.js dans ensembles.json.
// Écrit les fichiers dans client/public/images/ensembles/<cle>.webp et ajoute le
// champ `imageComposite` aux 2 copies de ensembles.json (client + server).
//
// Nécessite `sharp`, qui nécessite Node >= 20 — ce script plante sous le Node 18
// utilisé pour le reste du projet en local (cf. convert-cubes-webp.js, même
// contrainte déjà rencontrée). Passer temporairement sur Node 20+ (ex: `nvm use`)
// pour le lancer, puis revenir à la version normale du projet ensuite. Si sharp ne
// se charge pas ("Could not load the sharp module... win32-x64"), relancer
// `npm install --include=optional sharp` une fois sur Node 20+ pour récupérer le
// binaire natif de la plateforme, puis relancer ce script.
//
// Usage : node server/scripts/generate-ensembles-images.js
//
// Les breloques/sorts ont un fond noir opaque (pas de canal alpha, contrairement
// aux cubes) : détourées par flood-fill depuis les 4 bords de l'image avant le
// montage — ne détoure que les pixels sombres CONNECTÉS au bord (le fond étant un
// rectangle noir uniforme qui touche les 4 côtés), laisse intact tout pixel sombre
// entouré de couleur (ex: traits noirs du visage sur une breloque).

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const CHEMIN_JSON_CLIENT = path.join(__dirname, '..', '..', 'client', 'src', 'data', 'ensembles.json');
const CHEMIN_JSON_SERVER = path.join(__dirname, '..', 'data', 'ensembles.json');
const DOSSIER_PUBLIC = path.join(__dirname, '..', '..', 'client', 'public');
const DOSSIER_SORTIE = path.join(DOSSIER_PUBLIC, 'images', 'ensembles');

const TAILLE_CANVAS = 320;
const TAILLE_ITEM = 220;
const SEUIL_DETOURAGE = 45;

function detourerFond(data, width, height, seuil) {
  const sortie = Buffer.from(data);
  const visite = new Uint8Array(width * height);
  const file = [];

  function estFond(i) {
    const r = sortie[i * 4], g = sortie[i * 4 + 1], b = sortie[i * 4 + 2];
    return Math.sqrt(r * r + g * g + b * b) < seuil;
  }

  for (let x = 0; x < width; x++) {
    for (const y of [0, height - 1]) {
      const i = y * width + x;
      if (!visite[i] && estFond(i)) { visite[i] = 1; file.push(i); }
    }
  }
  for (let y = 0; y < height; y++) {
    for (const x of [0, width - 1]) {
      const i = y * width + x;
      if (!visite[i] && estFond(i)) { visite[i] = 1; file.push(i); }
    }
  }

  let tete = 0;
  while (tete < file.length) {
    const i = file[tete++];
    sortie[i * 4 + 3] = 0;
    const x = i % width, y = Math.floor(i / width);
    const voisins = [];
    if (x > 0) voisins.push(i - 1);
    if (x < width - 1) voisins.push(i + 1);
    if (y > 0) voisins.push(i - width);
    if (y < height - 1) voisins.push(i + width);
    for (const j of voisins) {
      if (!visite[j] && estFond(j)) { visite[j] = 1; file.push(j); }
    }
  }

  return sortie;
}

async function chargerBufferDetoure(cheminAbsolu, estCube) {
  const { data, info } = await sharp(cheminAbsolu).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const pixels = estCube ? data : detourerFond(data, info.width, info.height, SEUIL_DETOURAGE);
  return sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } })
    .resize(TAILLE_ITEM, TAILLE_ITEM, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function composerEnsemble(ensemble) {
  const [avant, arriere] = ensemble.imageItems; // avant = 1er item choisi = premier plan
  const bufAvant = await chargerBufferDetoure(path.join(DOSSIER_PUBLIC, avant.imageUrl), avant.type === 'cube');
  const bufArriere = await chargerBufferDetoure(path.join(DOSSIER_PUBLIC, arriere.imageUrl), arriere.type === 'cube');

  const decalage = TAILLE_CANVAS - TAILLE_ITEM;
  const cheminSortie = path.join(DOSSIER_SORTIE, `${ensemble.cle}.webp`);

  await sharp({
    create: { width: TAILLE_CANVAS, height: TAILLE_CANVAS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: bufArriere, top: 0, left: decalage }, // arrière-plan : en haut à droite
      { input: bufAvant, top: decalage, left: 0 }, // premier plan : en bas à gauche, par-dessus
    ])
    .webp({ quality: 90 })
    .toFile(cheminSortie);

  return `/images/ensembles/${ensemble.cle}.webp`;
}

async function main() {
  fs.mkdirSync(DOSSIER_SORTIE, { recursive: true });
  const donnees = JSON.parse(fs.readFileSync(CHEMIN_JSON_CLIENT, 'utf-8'));

  let generes = 0;
  const sansImageItems = [];
  for (const ensemble of donnees) {
    if (!ensemble.imageItems) {
      sansImageItems.push(ensemble.cle);
      continue;
    }
    const url = await composerEnsemble(ensemble);
    ensemble.imageComposite = url;
    generes++;
    console.log(`✓ ${ensemble.cle} -> ${url}`);
  }

  fs.writeFileSync(CHEMIN_JSON_CLIENT, JSON.stringify(donnees, null, 2), 'utf-8');
  fs.writeFileSync(CHEMIN_JSON_SERVER, JSON.stringify(donnees, null, 2), 'utf-8');

  console.log(`\n${generes} vignette(s) composite(s) générée(s).`);
  if (sansImageItems.length) {
    console.log(`${sansImageItems.length} ensemble(s) sans imageItems (ignorés) : ${sansImageItems.join(', ')}`);
  }
}

main().catch((err) => {
  console.error('Erreur :', err);
  process.exit(1);
});
