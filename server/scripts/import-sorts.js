// Import des sorts depuis "DEDALE - SORTS.csv" vers la table Sort
// Usage : node server/scripts/import-sorts.js
//
// Note (Jour 2) : le CSV actuel ne contient que des sorts de rang "Novice"
// et n'a pas encore de colonne "Rang d'évolution" dédiée (elle sera ajoutée
// au CSV plus tard, quand tous les rangs seront réunis dans le même fichier).
// En attendant, on force rang_evolution = 'Novice' pour tout ce fichier.
// Quand le CSV aura une vraie colonne "Rang d'évolution", il suffira de
// remplacer la ligne RANG_PAR_DEFAUT ci-dessous par une lecture de colonne.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { parse } = require('csv-parse/sync');

const RANG_PAR_DEFAUT = 'Novice';

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

// Certains sorts (poisons, pièges, glyphes, invocations...) n'ont pas de valeur dans
// "Dégâts de base"/"Dégâts critique" : les dégâts sont écrits en texte libre dans
// "Effet du sort"/"Effet du sort (Critique)" à la place (ex: "16 à 18 (dommages Feu)
// (2 tours)"). Recherche le premier segment (séparés par "/") qui ressemble à des
// dégâts, en ignorant les segments de soin ("PV rendus" — un sort de soin n'inflige
// pas de dégâts, même s'il contient une plage "X à Y").
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

// Nettoie les champs texte simples : "-" et "" deviennent NULL
function nettoyerTexte(valeur) {
  if (!valeur) return null;
  const nettoye = valeur.trim();
  return nettoye === '' || nettoye === '-' ? null : nettoye;
}

// "15%" -> 15 (nombre). NULL si vide ou "-"
function parsePourcentage(valeur) {
  const texte = nettoyerTexte(valeur);
  if (texte === null) return null;
  const nombre = parseInt(texte.replace('%', ''), 10);
  return isNaN(nombre) ? null : nombre;
}

// "3" -> 3 (entier). NULL si vide, "-", ou non numérique
function parseEntier(valeur) {
  const texte = nettoyerTexte(valeur);
  if (texte === null) return null;
  const nombre = parseInt(texte, 10);
  return isNaN(nombre) ? null : nombre;
}

async function main() {
  const cheminCsv = path.join(__dirname, '..', '..', 'data', 'DEDALE - SORTS.csv');
  const contenu = fs.readFileSync(cheminCsv, 'utf-8');
  const lignes = parse(contenu, { columns: true, skip_empty_lines: true });

  const connexion = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'dedalofus',
  });

  console.log(`Import de ${lignes.length} sorts...`);

  await connexion.execute('DELETE FROM Sort');

  let inserees = 0;
  for (const ligne of lignes) {
    const nom = (ligne['Nom du sort'] || '').trim();
    if (!nom) continue;

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
        element, degats_critique_min, degats_critique_max, chance_critique
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nom,
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
        RANG_PAR_DEFAUT,
        degats.min,
        degats.max,
        nettoyerTexte(ligne['Élément principal']),
        degatsCrit.min,
        degatsCrit.max,
        parsePourcentage(ligne['Chance de critique']),
      ]
    );
    inserees++;
  }

  console.log(`Terminé : ${inserees} sorts insérés.`);
  await connexion.end();
}

main().catch((err) => {
  console.error('Erreur pendant l\'import des sorts :', err);
  process.exit(1);
});
