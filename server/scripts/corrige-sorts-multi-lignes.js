// Corrections ponctuelles (rejouables) demandées par le porteur de projet :
// - Escarre face : dégâts de base fixes (10 Novice, 12 Expert/Maître) jamais renseignés
// - Toxines : tape dans le Meilleur élément (élément non renseigné jusqu'ici)
// - Mot Soignant/Curatif/Revitalisant : sorts de soin (est_soin), valeurs de PV rendus
//   récupérées depuis les CSV sources ("Effet du sort"/"(Critique)", jamais importées
//   car explicitement ignorées par parseDegatsDepuisEffet dans import-sorts.js)
// - Pelle Aveuglante / Pile ou Face / Foène / Tourbillon Embrasé : lignes de dégâts
//   supplémentaires (SortDegatsSup), cf. schema.sql
//
// Usage : node server/scripts/corrige-sorts-multi-lignes.js
require('dotenv').config();
const mysql = require('mysql2/promise');

const RANGS = ['Novice', 'Expert', 'Maître α', 'Maître ẞ'];

async function idsParRang(connexion, nom) {
  const [rows] = await connexion.query(
    'SELECT id, rang_evolution FROM Sort WHERE nom = ?', [nom]
  );
  const parRang = {};
  for (const r of rows) parRang[r.rang_evolution] = r.id;
  return parRang;
}

// Insère une ligne supplémentaire pour chaque rang, sauf si une ligne du même
// ordre existe déjà pour ce sort (rejouable).
async function ajouterLigneSupplementaire(connexion, nom, ordre, valeursParRang) {
  const ids = await idsParRang(connexion, nom);
  for (const rang of RANGS) {
    const sortId = ids[rang];
    if (!sortId) { console.warn(`  "${nom}" (${rang}) introuvable — ignoré.`); continue; }
    const v = valeursParRang[rang];
    if (!v) continue;

    const [existe] = await connexion.query(
      'SELECT id FROM SortDegatsSup WHERE sort_id = ? AND ordre = ?', [sortId, ordre]
    );
    if (existe.length > 0) { console.log(`  "${nom}" (${rang}) ligne ${ordre} déjà présente — ignorée.`); continue; }

    await connexion.query(
      `INSERT INTO SortDegatsSup (sort_id, ordre, element, degats_min, degats_max, degats_critique_min, degats_critique_max)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sortId, ordre, v.element ?? null, v.min ?? null, v.max ?? null, v.critMin ?? null, v.critMax ?? null]
    );
    console.log(`  "${nom}" (${rang}) ligne ${ordre} ajoutée.`);
  }
}

async function main() {
  const connexion = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'dedalofus',
  });

  // --- Escarre face : dégâts de base fixes (min = max), jamais renseignés ---
  console.log('Escarre face...');
  for (const nom of ['Escarre face - Air', 'Escarre face - Terre']) {
    await connexion.query(
      `UPDATE Sort SET degats_min = 10, degats_max = 10 WHERE nom = ? AND rang_evolution = 'Novice'`,
      [nom]
    );
    await connexion.query(
      `UPDATE Sort SET degats_min = 12, degats_max = 12 WHERE nom = ? AND rang_evolution IN ('Expert', 'Maître α', 'Maître ẞ')`,
      [nom]
    );
  }

  // --- Toxines : tape dans le Meilleur élément ---
  console.log('Toxines...');
  await connexion.query(`UPDATE Sort SET element = 'Meilleur élément' WHERE nom = 'Toxines'`);

  // --- Sorts de soin : est_soin + valeurs de PV rendus (depuis les CSV sources) ---
  console.log('Sorts de soin...');
  const SOINS = {
    'Mot Soignant - Air': { Novice: [18, 20, 21, 23], Expert: [20, 22, 23, 25], 'Maître α': [23, 25, 26, 28], 'Maître ẞ': [20, 22, 23, 25] },
    'Mot Soignant - Terre': { Novice: [18, 20, 21, 23], Expert: [20, 22, 23, 25], 'Maître α': [23, 25, 26, 28], 'Maître ẞ': [20, 22, 23, 25] },
    'Mot Curatif - Feu': { Novice: [14, 16, 16, 18], Expert: [16, 18, 19, 21], 'Maître α': [21, 24, 24, 27], 'Maître ẞ': [17, 19, 20, 22] },
    'Mot Curatif - Eau': { Novice: [14, 16, 16, 18], Expert: [16, 18, 19, 21], 'Maître α': [21, 24, 24, 27], 'Maître ẞ': [17, 19, 20, 22] },
    'Mot Revitalisant': { Novice: [9, 10, 11, 12], Expert: [11, 12, 13, 14], 'Maître α': [11, 12, 13, 14], 'Maître ẞ': [11, 12, 13, 14] },
  };
  for (const [nom, parRang] of Object.entries(SOINS)) {
    for (const [rang, [min, max, critMin, critMax]] of Object.entries(parRang)) {
      await connexion.query(
        `UPDATE Sort SET est_soin = 1, degats_min = ?, degats_max = ?, degats_critique_min = ?, degats_critique_max = ?
         WHERE nom = ? AND rang_evolution = ?`,
        [min, max, critMin, critMax, nom, rang]
      );
    }
  }

  // --- Pelle Aveuglante : 2e ligne, Meilleur élément hérité, pas de critique ---
  console.log('Pelle Aveuglante...');
  await ajouterLigneSupplementaire(connexion, 'Pelle Aveuglante', 1, {
    Novice: { min: 8, max: 10 },
    Expert: { min: 10, max: 12 },
    'Maître α': { min: 12, max: 14 },
    'Maître ẞ': { min: 12, max: 14 },
  });

  // --- Pile ou Face (Air et Terre) : 2e ligne uniquement au critique ---
  console.log('Pile ou Face...');
  for (const nom of ['Pile ou Face - Air', 'Pile ou Face - Terre']) {
    await ajouterLigneSupplementaire(connexion, nom, 1, {
      Novice: { critMin: 9, critMax: 11 },
      Expert: { critMin: 12, critMax: 14 },
      'Maître α': { critMin: 13, critMax: 15 },
      'Maître ẞ': { critMin: 13, critMax: 15 },
    });
  }

  // --- Foène : 2e ligne, Meilleur élément hérité ---
  console.log('Foène...');
  await ajouterLigneSupplementaire(connexion, 'Foène', 1, {
    Novice: { min: 8, max: 10, critMin: 10, critMax: 12 },
    Expert: { min: 9, max: 11, critMin: 11, critMax: 13 },
    'Maître α': { min: 11, max: 13, critMin: 13, critMax: 15 },
    'Maître ẞ': { min: 9, max: 11, critMin: 11, critMax: 13 },
  });

  // --- Tourbillon Embrasé : 4 lignes indépendantes (Feu/Air x primaire/secondaire) ---
  // La ligne principale du Sort (Feu, déjà correcte) reste telle quelle : seul
  // l'élément combiné "Feu, Air" est corrigé en "Feu" seul (la ligne Air a des
  // valeurs différentes, incompatible avec le mécanisme "même base, 2 éléments").
  console.log('Tourbillon Embrasé...');
  await connexion.query(`UPDATE Sort SET element = 'Feu' WHERE nom = 'Tourbillon Embrasé'`);
  await ajouterLigneSupplementaire(connexion, 'Tourbillon Embrasé', 1, {
    Novice: { element: 'Air', min: 32, max: 36, critMin: 35, critMax: 39 },
    Expert: { element: 'Air', min: 35, max: 39, critMin: 38, critMax: 42 },
    'Maître α': { element: 'Air', min: 49, max: 53, critMin: 52, critMax: 56 },
    'Maître ẞ': { element: 'Air', min: 35, max: 39, critMin: 38, critMax: 42 },
  });
  await ajouterLigneSupplementaire(connexion, 'Tourbillon Embrasé', 2, {
    Novice: { element: 'Feu', min: 16, max: 20, critMin: 19, critMax: 23 },
    Expert: { element: 'Feu', min: 19, max: 23, critMin: 22, critMax: 26 },
    'Maître α': { element: 'Feu', min: 26, max: 30, critMin: 29, critMax: 33 },
    'Maître ẞ': { element: 'Feu', min: 19, max: 23, critMin: 22, critMax: 26 },
  });
  await ajouterLigneSupplementaire(connexion, 'Tourbillon Embrasé', 3, {
    Novice: { element: 'Air', min: 16, max: 20, critMin: 19, critMax: 23 },
    Expert: { element: 'Air', min: 19, max: 23, critMin: 22, critMax: 26 },
    'Maître α': { element: 'Air', min: 26, max: 30, critMin: 29, critMax: 33 },
    'Maître ẞ': { element: 'Air', min: 19, max: 23, critMin: 22, critMax: 26 },
  });

  console.log('\nTerminé.');
  await connexion.end();
}

main().catch((err) => {
  console.error('Erreur pendant les corrections :', err);
  process.exit(1);
});
