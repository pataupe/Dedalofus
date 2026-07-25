// Import des sorts de rang Expert / Maître α / Maître ẞ, en complément des sorts
// Novice déjà en base (server/scripts/import-sorts.js).
//
// Contrairement à import-sorts.js, ce script n'efface RIEN : il ajoute seulement
// de nouvelles lignes Sort (rang_evolution différent), pour ne pas casser les
// références EquipementSort existantes ni la colonne `visible` déjà renseignée
// sur les sorts Novice.
//
// Alignement des CSV : chaque fichier de rang supérieur contient exactement les
// mêmes 115 sorts, dans le même ordre, que "DEDALE - SORTS NOVICE.csv" (vérifié :
// la ligne de données n°N correspond toujours au sort Novice d'id N en base).
// On s'appuie donc sur cet ordre plutôt que sur la colonne "Nom du sort" du CSV,
// qui contient plusieurs coquilles dans les fichiers Expert/Maître (suffixe
// d'élément manquant sur "Piège de Masse"/"Piège d'entaille"/"Pulsar", virgule
// parasite dans "Invocation, de Yukisamara") : le nom réutilisé est celui du
// sort Novice correspondant, déjà correct en base.
//
// Usage : node server/scripts/import-sorts-rangs-superieurs.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { parse } = require('csv-parse/sync');

const FICHIERS = [
  { rang: 'Expert', fichier: 'DEDALE - SORTS EXPERT - DEDALE.csv' },
  { rang: 'Maître α', fichier: 'DEDALE - SORTS MAÎTRE α - DEDALE.csv' },
  { rang: 'Maître ẞ', fichier: 'DEDALE - SORTS MAÎTRE ẞ - DEDALE.csv' },
];

// Convertit "19 à 23" -> { min: 19, max: 23 }. Retourne { min: null, max: null }
// si la valeur est vide, "-", ou dans un format inattendu.
function parsePlageDegats(valeur) {
  if (!valeur) return { min: null, max: null };
  const nettoye = valeur.trim();
  if (nettoye === '' || nettoye === '-') return { min: null, max: null };

  const correspondance = nettoye.match(/(\d+)\s*à\s*(\d+)/);
  if (!correspondance) return { min: null, max: null };

  return { min: parseInt(correspondance[1], 10), max: parseInt(correspondance[2], 10) };
}

// Repli identique à import-sorts.js : certains sorts n'ont pas de valeur dans
// "Dégâts de base"/"Dégâts critique", les dégâts sont écrits en texte libre
// dans "Effet du sort"/"Effet du sort (Critique)" à la place.
function parseDegatsDepuisEffet(effetTexte) {
  if (!effetTexte) return { min: null, max: null };
  for (const segment of effetTexte.split('/')) {
    if (/PV rendus/i.test(segment)) continue;
    const correspondance = segment.match(/(\d+)\s*à\s*(\d+)/);
    if (correspondance) {
      return { min: parseInt(correspondance[1], 10), max: parseInt(correspondance[2], 10) };
    }
  }
  return { min: null, max: null };
}

function nettoyerTexte(valeur) {
  if (!valeur) return null;
  const nettoye = valeur.trim();
  return nettoye === '' || nettoye === '-' ? null : nettoye;
}

function parsePourcentage(valeur) {
  const texte = nettoyerTexte(valeur);
  if (texte === null) return null;
  const nombre = parseInt(texte.replace('%', ''), 10);
  return isNaN(nombre) ? null : nombre;
}

function parseEntier(valeur) {
  const texte = nettoyerTexte(valeur);
  if (texte === null) return null;
  const nombre = parseInt(texte, 10);
  return isNaN(nombre) ? null : nombre;
}

async function main() {
  const connexion = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'dedalofus',
  });

  const [sortsNovice] = await connexion.execute(
    "SELECT id, nom, image_url, visible FROM Sort WHERE rang_evolution = 'Novice' ORDER BY id"
  );

  for (const { rang, fichier } of FICHIERS) {
    const cheminCsv = path.join(__dirname, '..', '..', 'data', fichier);
    const contenu = fs.readFileSync(cheminCsv, 'utf-8');
    const lignes = parse(contenu, { columns: true, skip_empty_lines: true });

    if (lignes.length !== sortsNovice.length) {
      throw new Error(
        `${fichier} contient ${lignes.length} lignes, attendu ${sortsNovice.length} (doit être aligné sur les sorts Novice)`
      );
    }

    const [[{ n: dejaPresents }]] = await connexion.query(
      'SELECT COUNT(*) AS n FROM Sort WHERE rang_evolution = ?',
      [rang]
    );
    if (dejaPresents > 0) {
      console.log(`${rang} : déjà ${dejaPresents} sorts en base, import ignoré.`);
      continue;
    }

    let inserees = 0;
    for (let i = 0; i < lignes.length; i++) {
      const ligne = lignes[i];
      const noviceCorrespondant = sortsNovice[i];

      let degats = parsePlageDegats(ligne['Dégâts de base']);
      if (degats.min === null) degats = parseDegatsDepuisEffet(ligne['Effet du sort']);
      let degatsCrit = parsePlageDegats(ligne['Dégâts critique']);
      if (degatsCrit.min === null) degatsCrit = parseDegatsDepuisEffet(ligne['Effet du sort (Critique)']);

      await connexion.execute(
        `INSERT INTO Sort (
          nom, description, cout_pa, portee_min, portee_max, portee_modifiable,
          ligne_de_vue_requise, zone_effet, lancers_par_tour, lancers_par_combat,
          lancers_par_cible, portee_diagonale_ligne, intervalle_relance_cd,
          duree_effet, cumul_effets, rang_evolution, degats_min, degats_max,
          element, degats_critique_min, degats_critique_max, chance_critique,
          visible, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          noviceCorrespondant.nom,
          nettoyerTexte(ligne['Description']),
          parseEntier(ligne['Coût en PA']),
          parseEntier(ligne['Portée min']),
          parseEntier(ligne['Portée max']),
          nettoyerTexte(ligne['Portée modifiable']),
          nettoyerTexte(ligne['Ligne de vue requise']),
          nettoyerTexte(ligne['Zone d’effet']),
          nettoyerTexte(ligne['Lancers par tour']),
          nettoyerTexte(ligne['Lancers par combat']),
          nettoyerTexte(ligne['Lancers par cible']),
          nettoyerTexte(ligne['Portée en diagonale / ligne']),
          nettoyerTexte(ligne['Intervalle de relance (CD)']),
          nettoyerTexte(ligne['Durée de l’effet']),
          nettoyerTexte(ligne['Cumul des effets']),
          rang,
          degats.min,
          degats.max,
          nettoyerTexte(ligne['Élément principal']),
          degatsCrit.min,
          degatsCrit.max,
          parsePourcentage(ligne['Chance de critique']),
          noviceCorrespondant.visible,
          noviceCorrespondant.image_url,
        ]
      );
      inserees++;
    }
    console.log(`${rang} : ${inserees} sorts insérés.`);
  }

  await connexion.end();
}

main().catch((err) => {
  console.error("Erreur pendant l'import des sorts (rangs supérieurs) :", err);
  process.exit(1);
});
