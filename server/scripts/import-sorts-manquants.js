// Import des 54 sorts manquants (40 sorts à 4 rangs + 14 sorts "Unique") repérés
// en comparant Dedalofus avec touchmanager.fr, complétés par le porteur de projet
// dans data/Dedalofus_Sorts_manquants_COMPLET.csv.
//
// Particularités de ce fichier :
// - La ligne d'exemple ("Exemple – Lame Tourbillonnante") est ignorée.
// - Certains sorts existent en 2 variantes d'élément (ex: "Acharnement méthodique
//   (Air)" / "(Feu)") : le porteur de projet n'a rempli que l'une des deux, l'autre
//   est volontairement laissée vide ("toutes les infos sont pareilles, seul
//   l'élément de frappe diffère") — on copie les stats de la variante remplie.
// - Les sorts Chaos/Lumière n'ont pas de colonne Élément renseignée : "Meilleur
//   élément" si le sort inflige des dégâts sur au moins un rang (même convention
//   que Absorption Magique/Assaut Magique/Foène/Martel/Mot Revitalisant déjà en
//   base), NULL sinon (sorts utilitaires/invocations sans dégâts direct).
// - Le nom brut du CSV vient de touchmanager.fr, ex: "Acharnement méthodique
//   (Air)" ou "Appétit (Chaos)" — traduit vers la convention déjà en base :
//   " - Air"/" - Terre"/"- Eau"/"- Feu" pour les variantes d'élément physique,
//   suffixe retiré entièrement pour Chaos/Lumière (ex: "Appétit").
//
// Usage : node server/scripts/import-sorts-manquants.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { parse } = require('csv-parse/sync');

const CHEMIN_CSV = path.join(__dirname, '..', '..', 'data', 'Dedalofus_Sorts_manquants_COMPLET.csv');
const DOSSIER_IMAGES_SOURCE = path.join(__dirname, '..', '..', 'data', 'images', 'sorts');
const DOSSIER_IMAGES_PUBLIC = path.join(__dirname, '..', '..', 'client', 'public', 'images', 'sorts');

// Correspondance directe nom -> fichier image pour les 14 sorts "Unique" (noms
// trop courts/abrégés dans les fichiers pour un matching automatique fiable).
// Nécessite d'avoir lancé convert-sorts-unique-webp.js avant (les .png sources
// sont convertis en .webp à côté, jamais servis tels quels).
const IMAGES_UNIQUE = {
  'Amnésie progressive': 'amnesie.webp',
  "Coup de main d'outre-tombe": 'main-outre-tombe.webp',
  'Dîme étouffante': 'dime.webp',
  'Étreinte forcée': 'etreinte.webp',
  'Funérailles Aériennes': 'funerailles.webp',
  'Hulularvaire': 'hulula.webp',
  'Invocation de Pyrover domestique': 'pyrover.webp',
  'Peau de pierre': 'peau-de-pierre.webp',
  'Rendez-vous secret': 'rdv-secret.webp',
  'Sacrifice nécessaire': 'sacrifice.webp',
  "Sh'hzx": 'shhzx.webp',
  'Toxines': 'toxine.webp',
  'Mon ami imaginaire': 'mon-ami-imaginaire.webp',
  'Kong Smash': 'kong.webp',
};

const MOTS_VIDES = new Set(['de', 'du', 'd', 'l', 'le', 'la', 'les', 'un', 'une', 'des', 'a']);

function motsSignificatifs(texte) {
  const mots = texte
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return new Set(mots.filter((m) => !MOTS_VIDES.has(m)));
}

function scoreJaccard(a, b) {
  const inter = [...a].filter((m) => b.has(m)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

// Trouve, parmi les fichiers sort_*_novice.webp, celui qui correspond le mieux
// au nom BRUT du CSV (celui qui contient encore "(Air)"/"(Chaos)"/etc., car les
// fichiers sources incluent ce mot dans leur nom).
function trouverImageReguliere(nomBrut, fichiersNovice) {
  const cible = motsSignificatifs(nomBrut);
  let meilleur = null;
  let meilleurScore = 0;
  for (const fichier of fichiersNovice) {
    const milieu = fichier.replace(/^sort_/, '').replace(/_novice\.webp$/, '');
    const bag = motsSignificatifs(milieu.replace(/_/g, ' '));
    const score = scoreJaccard(cible, bag);
    if (score > meilleurScore) {
      meilleurScore = score;
      meilleur = fichier;
    }
  }
  return meilleurScore >= 0.5 ? meilleur : null;
}

// "Acharnement méthodique (Air)" -> "Acharnement méthodique - Air" (variantes
// d'élément physique, convention déjà en base : "Boliche - Air", etc.)
// "Appétit (Chaos)" / "Détonateur (Lumière)" -> suffixe retiré entièrement
// (convention déjà en base : "Absorption Magique", "Cinquième Quart", etc.)
function nomFinal(nomBrut) {
  const matchElement = nomBrut.match(/^(.*)\s*\((Air|Terre|Eau|Feu)\)$/);
  if (matchElement) return `${matchElement[1].trim()} - ${matchElement[2]}`;
  const matchCategorie = nomBrut.match(/^(.*)\s*\((Chaos|Lumière)\)$/);
  if (matchCategorie) return matchCategorie[1].trim();
  return nomBrut.trim();
}

// Base commune entre variantes d'élément d'un même sort, pour retrouver le
// "donneur" d'une famille laissée vide (ex: "Acharnement méthodique (Feu)"
// vide -> cherche "Acharnement méthodique (Air)" qui a les stats).
function baseFamille(nomBrut) {
  return nomBrut.replace(/\s*\((Air|Terre|Eau|Feu|Chaos|Lumière)\)$/, '').trim().toLowerCase();
}

function nettoyerTexte(valeur) {
  if (!valeur) return null;
  const nettoye = valeur.trim();
  return nettoye === '' || nettoye === '-' ? null : nettoye;
}

function parseEntier(valeur) {
  const texte = nettoyerTexte(valeur);
  if (texte === null) return null;
  const nombre = parseInt(texte, 10);
  return isNaN(nombre) ? null : nombre;
}

// Normalise "oui"/"Oui"/"non"/"Non" -> "Oui"/"Non" (convention déjà en base).
function normaliserOuiNon(valeur) {
  const texte = nettoyerTexte(valeur);
  if (texte === null) return null;
  const bas = texte.toLowerCase();
  if (bas === 'oui') return 'Oui';
  if (bas === 'non') return 'Non';
  return texte;
}

const CHAMPS_STATS = [
  'Dégâts min', 'Dégâts max', 'Dégâts critique min', 'Dégâts critique max',
  'Chance de critique', 'Coût en PA', 'Portée min', 'Portée max',
  'Portée modifiable', 'Portée diagonale/ligne', 'Lancers par tour',
  'Lancers par cible', 'Intervalle de relance (CD)', 'Description',
  'Ligne de vue requise', "Zone d'effet", 'Lancers par combat',
  "Durée de l'effet", 'Cumul des effets',
];

function ligneVide(ligne) {
  return CHAMPS_STATS.every((champ) => nettoyerTexte(ligne[champ]) === null);
}

async function main() {
  const contenu = fs.readFileSync(CHEMIN_CSV, 'utf-8');
  const lignes = parse(contenu, { columns: true, skip_empty_lines: true })
    .filter((l) => (l['Nom du sort'] || '').trim() && !l['Nom du sort'].startsWith('Exemple'));

  // Regroupe par nom brut (ordre d'apparition conservé), 4 lignes (rangs) ou 1 (Unique).
  const familles = new Map();
  for (const ligne of lignes) {
    const nomBrut = ligne['Nom du sort'].trim();
    if (!familles.has(nomBrut)) familles.set(nomBrut, []);
    familles.get(nomBrut).push(ligne);
  }

  // Détecte les familles "vides" (toutes leurs lignes n'ont aucune stat) et
  // retrouve leur donneur (même base, une autre variante d'élément non vide).
  const parBase = new Map();
  for (const nomBrut of familles.keys()) {
    const base = baseFamille(nomBrut);
    if (!parBase.has(base)) parBase.set(base, []);
    parBase.get(base).push(nomBrut);
  }

  for (const [nomBrut, lignesFamille] of familles) {
    if (!lignesFamille.every(ligneVide)) continue;
    const base = baseFamille(nomBrut);
    const donneurNom = (parBase.get(base) || []).find(
      (autre) => autre !== nomBrut && !familles.get(autre).every(ligneVide)
    );
    if (!donneurNom) {
      console.warn(`Aucun donneur trouvé pour la famille vide "${nomBrut}" — ignorée.`);
      continue;
    }
    const donneur = familles.get(donneurNom);
    familles.set(
      nomBrut,
      lignesFamille.map((ligne) => {
        const ligneDonneuse = donneur.find((d) => d['Rang d\'évolution'] === ligne['Rang d\'évolution']);
        return { ...ligneDonneuse, 'Nom du sort': nomBrut, Élément: ligne['Élément'], "Rang d'évolution": ligne["Rang d'évolution"] };
      })
    );
    console.log(`"${nomBrut}" <- stats copiées depuis "${donneurNom}"`);
  }

  const connexion = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'dedalofus',
  });

  const fichiersNovice = fs.readdirSync(DOSSIER_IMAGES_SOURCE).filter((f) => f.endsWith('_novice.webp'));
  fs.mkdirSync(DOSSIER_IMAGES_PUBLIC, { recursive: true });

  let inserees = 0;
  let sansImage = [];

  for (const [nomBrut, lignesFamille] of familles) {
    const estUnique = lignesFamille[0]["Rang d'évolution"] === 'Unique';
    const nom = nomFinal(nomBrut);

    // Élément : direct si présent (variantes Air/Terre/Eau/Feu), sinon déduit
    // pour Chaos/Lumière (Meilleur élément si dégâts sur au moins un rang, NULL sinon).
    let elementBrut = nettoyerTexte(lignesFamille[0]['Élément']);
    if (elementBrut === null && !estUnique) {
      const aDesDegats = lignesFamille.some((l) => nettoyerTexte(l['Dégâts min']) !== null);
      elementBrut = aDesDegats ? 'Meilleur élément' : null;
    }

    // Image : recherche par nom (sorts réguliers) ou correspondance directe (Unique).
    const fichierImage = estUnique
      ? IMAGES_UNIQUE[nom]
      : trouverImageReguliere(nomBrut, fichiersNovice);
    const cheminSource = fichierImage ? path.join(DOSSIER_IMAGES_SOURCE, fichierImage) : null;
    if (!cheminSource || !fs.existsSync(cheminSource)) {
      if (fichierImage) console.warn(`Image attendue introuvable pour "${nomBrut}" : ${fichierImage}`);
      sansImage.push(nomBrut);
    }

    for (const ligne of lignesFamille) {
      const [resultat] = await connexion.execute(
        `INSERT INTO Sort (
          nom, description, cout_pa, portee_min, portee_max, portee_modifiable,
          ligne_de_vue_requise, zone_effet, lancers_par_tour, lancers_par_combat,
          lancers_par_cible, portee_diagonale_ligne, intervalle_relance_cd,
          duree_effet, cumul_effets, rang_evolution, degats_min, degats_max,
          element, degats_critique_min, degats_critique_max, chance_critique
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nom,
          nettoyerTexte(ligne['Description']),
          parseEntier(ligne['Coût en PA']),
          parseEntier(ligne['Portée min']),
          parseEntier(ligne['Portée max']),
          normaliserOuiNon(ligne['Portée modifiable']),
          normaliserOuiNon(ligne['Ligne de vue requise']),
          nettoyerTexte(ligne["Zone d'effet"]),
          nettoyerTexte(ligne['Lancers par tour']),
          nettoyerTexte(ligne['Lancers par combat']),
          nettoyerTexte(ligne['Lancers par cible']),
          nettoyerTexte(ligne['Portée diagonale/ligne']),
          nettoyerTexte(ligne['Intervalle de relance (CD)']),
          nettoyerTexte(ligne["Durée de l'effet"]),
          nettoyerTexte(ligne['Cumul des effets']),
          ligne["Rang d'évolution"],
          parseEntier(ligne['Dégâts min']),
          parseEntier(ligne['Dégâts max']),
          elementBrut,
          parseEntier(ligne['Dégâts critique min']),
          parseEntier(ligne['Dégâts critique max']),
          parseEntier(ligne['Chance de critique']),
        ]
      );

      const id = resultat.insertId;
      if (cheminSource && fs.existsSync(cheminSource)) {
        const destination = path.join(DOSSIER_IMAGES_PUBLIC, `${id}.webp`);
        fs.copyFileSync(cheminSource, destination);
        await connexion.execute('UPDATE Sort SET image_url = ? WHERE id = ?', [`/images/sorts/${id}.webp`, id]);
      }
      inserees++;
    }
  }

  console.log(`\nTerminé : ${inserees} lignes de sorts insérées (${familles.size} familles).`);
  if (sansImage.length > 0) {
    console.log(`${sansImage.length} famille(s) sans image trouvée :`);
    sansImage.forEach((n) => console.log(`  - ${n}`));
  }

  await connexion.end();
}

main().catch((err) => {
  console.error("Erreur pendant l'import des sorts manquants :", err);
  process.exit(1);
});
