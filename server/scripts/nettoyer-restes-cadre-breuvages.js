// Passe de nettoyage à lancer APRÈS detourer-breuvages.py : le modèle IA
// (rembg) laisse parfois un reste du cadre sombre du jeu collé à l'objet
// (typiquement quand un élément du breuvage comme un bouchon dépasse dans un
// coin du tooltip d'origine — la frontière objet/fond y est ambiguë pour le
// modèle). Repéré sur le coeur rouge (152834) : un bandeau noir opaque sur
// tout un bord, visible à l'oeil, pas juste un artefact mineur.
//
// Détouré par flood-fill géométrique depuis les bords de l'image (pas de
// distance à une couleur de fond fixe) — 2 seuils successifs car le fond du
// jeu a lui-même 2 tons bien distincts (fond intérieur ~26/255, anneau du
// cadre vers les coins/bords ~55/255, magnitude ~90) : un seul seuil assez
// large pour couvrir les deux mangeait parfois un peu de l'objet. Chaque
// seuil est appliqué en BOUCLE avec recadrage entre les passes — un reste de
// cadre encore à l'intérieur après la 1ère passe peut se retrouver exactement
// sur le nouveau bord une fois l'image recadrée, et devenir attrapable à la
// passe suivante (une seule passe ne suffit pas toujours à converger).
//
// Usage : node server/scripts/nettoyer-restes-cadre-breuvages.js
// Rejouable (idempotent : sur des images déjà propres, ne retire rien).

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DOSSIER = path.join(__dirname, '..', '..', 'data', 'images', 'breuvages-final');
const SEUILS = [60, 100];
const MAX_ITERATIONS = 6;

function passeFloodFill(data, width, height, seuil) {
  const visite = new Uint8Array(width * height);
  const file = [];
  function estFond(i) {
    const a = data[i * 4 + 3];
    if (a === 0) return false;
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    return Math.sqrt(r * r + g * g + b * b) < seuil;
  }
  function semer(i) { if (!visite[i] && estFond(i)) { visite[i] = 1; file.push(i); } }
  for (let x = 0; x < width; x++) { semer(x); semer((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { semer(y * width); semer(y * width + width - 1); }

  let tete = 0, retires = 0;
  while (tete < file.length) {
    const i = file[tete++];
    data[i * 4 + 3] = 0;
    retires++;
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
  return retires;
}

function bbox(data, width, height) {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

async function traiter(fichier) {
  let { data, info } = await sharp(path.join(DOSSIER, fichier)).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  let { width, height } = info;
  let total = 0;

  for (const seuil of SEUILS) {
    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      const retires = passeFloodFill(data, width, height, seuil);
      total += retires;
      if (retires === 0) break;
      const b = bbox(data, width, height);
      if (b.maxX < 0) return; // image entièrement vidée : ne devrait jamais arriver, on n'écrit rien par sécurité
      const buf = await sharp(data, { raw: { width, height, channels: 4 } })
        .extract({ left: b.minX, top: b.minY, width: b.maxX - b.minX + 1, height: b.maxY - b.minY + 1 })
        .raw().ensureAlpha().toBuffer({ resolveWithObject: true });
      data = buf.data; width = buf.info.width; height = buf.info.height;
    }
  }

  if (total > 0) {
    const finalBuf = await sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer();
    fs.writeFileSync(path.join(DOSSIER, fichier), finalBuf);
    console.log(fichier, '-> nettoyé,', total, 'px retirés, dims finales', width + 'x' + height);
  }
}

async function main() {
  const fichiers = fs.readdirSync(DOSSIER).filter((f) => f.toLowerCase().endsWith('.png'));
  for (const f of fichiers) {
    await traiter(f);
  }
  console.log(`\n${fichiers.length} images vérifiées.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
