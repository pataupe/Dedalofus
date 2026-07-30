const sharp = require('sharp');
const { readdir } = require('fs/promises');
const path = require('path');
const DOSSIER_SOURCE = path.resolve(__dirname, '../../data/images/cubes');

async function convertir() {
  const fichiers = await readdir(DOSSIER_SOURCE);
  const images = fichiers.filter(f => /\.(png|jpe?g|gif|bmp|tiff?)$/i.test(f));

  console.log(`${images.length} images à convertir…`);

  let succes = 0;
  let erreurs = 0;

  for (const fichier of images) {
    const nom = path.parse(fichier).name;
    const entree = path.join(DOSSIER_SOURCE, fichier);
    const sortie = path.join(DOSSIER_SOURCE, `${nom}.webp`);

    try {
      await sharp(entree).webp({ quality: 80 }).toFile(sortie);
      succes++;
    } catch (err) {
      console.error(`Erreur sur ${fichier} :`, err.message);
      erreurs++;
    }
  }

  console.log(`Terminé : ${succes} converties, ${erreurs} erreur(s).`);
}

convertir();
