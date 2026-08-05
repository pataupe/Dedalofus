// Génère client/src/data/monstres.json à partir de data/monstres.md, et copie les
// images correspondantes (data/images/monstres/) vers client/public/images/monstres/.
// Usage : node server/scripts/generate-monstres.js
//
// Contenu purement statique (pas de compte, pas de relation avec un personnage) :
// pas de table MySQL ni de route API, juste un fichier JSON importé directement
// par le frontend (React) — cohérent avec la priorité "vitesse de sortie du MVP".

const fs = require('fs');
const path = require('path');

const CHEMIN_MD = path.join(__dirname, '..', '..', 'data', 'monstres.md');
const DOSSIER_IMAGES_SOURCE = path.join(__dirname, '..', '..', 'data', 'images', 'monstres');
const DOSSIER_IMAGES_DEST = path.join(__dirname, '..', '..', 'client', 'public', 'images', 'monstres');
const CHEMIN_JSON = path.join(__dirname, '..', '..', 'client', 'src', 'data', 'monstres.json');

const CLES_PROFONDEUR = {
  'Profondeur 1': 'P1',
  'Profondeurs 2 & 3': 'P2-P3',
  'Profondeurs 4 & 5': 'P4-P5',
  'Profondeurs 6 & 7': 'P6-P7',
};

function normaliser(texte) {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function slugifier(texte) {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function construireIndexImages() {
  const index = new Map();
  for (const fichier of fs.readdirSync(DOSSIER_IMAGES_SOURCE)) {
    const sansExtension = fichier.replace(/\.webp$/i, '');
    const sansDimensions = sansExtension.replace(/-\d+x\d+$/, '');
    index.set(normaliser(sansDimensions), fichier);
  }
  return index;
}

function trouverImage(indexImages, nomMonstre) {
  const premierSegment = nomMonstre.split(',')[0];
  return (
    indexImages.get(normaliser(nomMonstre)) || indexImages.get(normaliser(premierSegment)) || null
  );
}

// Découpe le corps d'un monstre (lignes brutes entre son titre #### et le
// prochain titre) en paragraphes ordonnés, en distinguant les paragraphes
// "Mécanique :"/"Conseils :" (présents seulement sur certains boss) du texte
// descriptif normal — l'ordre de lecture d'origine est conservé tel quel.
function decouperParagraphes(lignes) {
  const texteBrut = lignes.join('\n').trim();
  if (!texteBrut) return [];

  return texteBrut
    .split(/\n{2,}/)
    .map((bloc) => bloc.replace(/\n/g, ' ').trim())
    .filter(Boolean)
    .map((bloc) => {
      const matchMecanique = bloc.match(/^Mécanique\s*:\s*/i);
      if (matchMecanique) return { type: 'mecanique', texte: bloc.slice(matchMecanique[0].length) };

      const matchConseils = bloc.match(/^Conseils\s*:\s*/i);
      if (matchConseils) return { type: 'conseils', texte: bloc.slice(matchConseils[0].length) };

      return { type: 'texte', texte: bloc };
    });
}

function parserMonstresMd(contenu) {
  const lignes = contenu.split('\n');

  const profondeurs = [];
  let profondeurActuelle = null;
  let biomeActuel = null;
  let familleActuelle = null;
  let monstreActuel = null; // { nom, boss, lignesBrutes }
  let lignesPassifFamille = null; // accumulateur pour le passif de famille (avant le premier ####)

  function clorePassifFamille() {
    if (familleActuelle && lignesPassifFamille && lignesPassifFamille.length) {
      const texte = lignesPassifFamille.join('\n').trim();
      if (texte) familleActuelle.passif = texte.replace(/\n+/g, ' ');
    }
    lignesPassifFamille = null;
  }

  function cloreMonstre() {
    if (!monstreActuel) return;
    familleActuelle.monstres.push({
      nom: monstreActuel.nom,
      boss: monstreActuel.boss,
      paragraphes: decouperParagraphes(monstreActuel.lignesBrutes),
    });
    monstreActuel = null;
  }

  for (const ligneBrute of lignes) {
    const ligne = ligneBrute.trimEnd();

    if (ligne.startsWith('#### ')) {
      cloreMonstre();
      clorePassifFamille();
      const titre = ligne.slice(5).trim();
      const boss = /^BOSS\s*:\s*/i.test(titre);
      const nom = boss ? titre.replace(/^BOSS\s*:\s*/i, '') : titre;
      monstreActuel = { nom, boss, lignesBrutes: [] };
      continue;
    }

    if (ligne.startsWith('### ')) {
      cloreMonstre();
      clorePassifFamille();
      familleActuelle = { nom: ligne.slice(4).trim(), passif: null, monstres: [] };
      biomeActuel.familles.push(familleActuelle);
      lignesPassifFamille = [];
      continue;
    }

    if (ligne.startsWith('## ')) {
      cloreMonstre();
      clorePassifFamille();
      const titre = ligne.slice(3).trim();
      biomeActuel = { nom: titre.replace(/^Biome\s*:\s*/i, ''), familles: [] };
      profondeurActuelle.biomes.push(biomeActuel);
      continue;
    }

    if (ligne.startsWith('# ')) {
      cloreMonstre();
      clorePassifFamille();
      const titre = ligne.slice(2).trim();
      profondeurActuelle = { cle: CLES_PROFONDEUR[titre] || slugifier(titre), titre, biomes: [] };
      profondeurs.push(profondeurActuelle);
      continue;
    }

    if (ligne.trim() === '---') continue;

    if (monstreActuel) {
      monstreActuel.lignesBrutes.push(ligne);
    } else if (lignesPassifFamille !== null) {
      lignesPassifFamille.push(ligne);
    }
  }

  cloreMonstre();
  clorePassifFamille();

  return profondeurs;
}

function main() {
  const contenu = fs.readFileSync(CHEMIN_MD, 'utf-8');
  const profondeurs = parserMonstresMd(contenu);

  const indexImages = construireIndexImages();
  fs.mkdirSync(DOSSIER_IMAGES_DEST, { recursive: true });
  fs.mkdirSync(path.dirname(CHEMIN_JSON), { recursive: true });

  const slugsUtilises = new Set();
  let totalMonstres = 0;
  let totalAvecImage = 0;
  const sansImage = [];

  for (const profondeur of profondeurs) {
    for (const biome of profondeur.biomes) {
      for (const famille of biome.familles) {
        for (const monstre of famille.monstres) {
          totalMonstres++;

          let slug = slugifier(monstre.nom);
          while (slugsUtilises.has(slug)) slug = `${slug}-2`;
          slugsUtilises.add(slug);
          monstre.slug = slug;

          const fichierSource = trouverImage(indexImages, monstre.nom);
          if (fichierSource) {
            totalAvecImage++;
            fs.copyFileSync(
              path.join(DOSSIER_IMAGES_SOURCE, fichierSource),
              path.join(DOSSIER_IMAGES_DEST, `${slug}.webp`)
            );
            monstre.image = `/images/monstres/${slug}.webp`;
          } else {
            sansImage.push(monstre.nom);
            monstre.image = null;
          }
        }
      }
    }
  }

  fs.writeFileSync(CHEMIN_JSON, JSON.stringify(profondeurs, null, 2), 'utf-8');

  console.log(`Terminé : ${totalMonstres} monstres, ${totalAvecImage} avec image.`);
  if (sansImage.length) console.log('Sans image :', sansImage.join(', '));
}

main();
