// Import de "DEDALE - BRELOQUES_NEW.csv" : ajoute les données de bonus
// conditionnel (onglet "Boosts breloques") aux 29 breloques déjà en base, et
// insère les nouvelles breloques présentes dans ce CSV mais absentes jusqu'ici
// (référentiel Breloque uniquement — aucune suppression, aucun id existant
// modifié, pour ne pas casser les EquipementBreloque déjà posés).
//
// Particularités du fichier, vérifiées avant d'écrire ce script :
//  - Encodage ISO-8859-1 (pas UTF-8) — décodé explicitement en latin1.
//  - Séparateur ";" (pas ",").
//  - Colonne "Rang" ne distingue pas Maître α de Maître ẞ (les deux valent
//    littéralement "Maître ?", perte d'encodage côté source). Résolu par la
//    position : dans ce CSV, l'ordre est TOUJOURS Expert, Maître α, Maître ẞ,
//    Novice pour une breloque à 4 rangs (confirmé sur les 52 groupes du
//    fichier, 0 exception) ; les breloques "Unique" n'ont qu'une seule ligne.
//  - Coquilles/variantes de nom corrigées ici (comme pour les sorts) : "Forcene"
//    -> "Forcené", "Homeopathe" -> "Homéopathe", "ballonne" -> "ballonné",
//    "Breloque de Dernier repli" -> "Breloque du Dernier repli" (orthographe
//    déjà en base).
//
// Usage : node server/scripts/import-breloques-boosts.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { parse } = require('csv-parse/sync');

const RANGS_QUATRE = ['Expert', 'Maître α', 'Maître ẞ', 'Novice'];
const DOSSIER_IMAGES_SOURCE = path.join(__dirname, '..', '..', 'data', 'images', 'breloques');
const DOSSIER_IMAGES_CIBLE = path.join(__dirname, '..', '..', 'client', 'public', 'images', 'breloques');

function normaliserNom(nom) {
  return nom
    .replace(/Forcene\b/g, 'Forcené')
    .replace(/Homeopathe\b/g, 'Homéopathe')
    .replace(/ballonne\b/g, 'ballonné')
    .replace(/^Breloque de Dernier repli$/, 'Breloque du Dernier repli')
    .trim();
}

function nettoyerTexte(valeur) {
  if (!valeur) return null;
  const nettoye = valeur.trim();
  return nettoye === '' ? null : nettoye;
}

function normaliserTypeInput(valeur) {
  const texte = nettoyerTexte(valeur);
  if (!texte) return null;
  return texte === 'bouton accumulateur' ? 'accumulateur' : texte;
}

// Même principe que le script d'appariement d'images des sorts/breloques
// Novice (non commité à l'époque) : sac de mots significatifs, comparaison au
// nom de la breloque, match retenu seulement si tous les mots du nom sont
// couverts par le fichier (score 1.0) pour éviter les faux positifs.
const MOTS_VIDES = new Set(['de', 'du', 'des', 'le', 'la', 'les', 'l', 'd', 'un', 'une']);
function motsSignificatifs(texte) {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/breloque/g, '')
    .split(/[^a-z0-9]+/)
    .filter((m) => m && !MOTS_VIDES.has(m));
}

function trouverImageCorrespondante(nom, fichiersDisponibles) {
  const motsNom = motsSignificatifs(nom);
  for (const fichier of fichiersDisponibles) {
    const base = fichier.replace(/_novice\.webp$/, '');
    const motsFichier = new Set(motsSignificatifs(base));
    if (motsNom.every((m) => motsFichier.has(m))) return fichier;
  }
  return null;
}

async function main() {
  const contenu = fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'DEDALE - BRELOQUES_NEW.csv')).toString('latin1');
  const lignes = parse(contenu, { columns: true, skip_empty_lines: true, delimiter: ';' });

  // Regroupe les lignes par nom (normalisé), dans l'ordre du fichier.
  const groupes = new Map();
  for (const ligne of lignes) {
    const nom = normaliserNom(ligne['Nom de la breloque']);
    if (!groupes.has(nom)) groupes.set(nom, []);
    groupes.get(nom).push(ligne);
  }

  const connexion = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'dedalofus',
  });

  const fichiersImages = fs.readdirSync(DOSSIER_IMAGES_SOURCE);
  if (!fs.existsSync(DOSSIER_IMAGES_CIBLE)) fs.mkdirSync(DOSSIER_IMAGES_CIBLE, { recursive: true });

  let misesAJour = 0;
  let inserees = 0;

  for (const [nom, groupeLignes] of groupes) {
    const rangs = groupeLignes.length === 1 ? ['Unique'] : RANGS_QUATRE;

    for (let i = 0; i < groupeLignes.length; i++) {
      const ligne = groupeLignes[i];
      const rang = rangs[i];

      const donnees = {
        effet: ligne.Description.trim(),
        tag: nettoyerTexte(ligne.Tag),
        ensemble_lie: nettoyerTexte(ligne['Ensemble lié']),
        type_input: normaliserTypeInput(ligne["Type d'input"]),
        bonus_min_texte: nettoyerTexte(ligne['Bonus conditionnel minimum']),
        bonus_increment_texte: nettoyerTexte(ligne['incrément']),
        bonus_max_texte: nettoyerTexte(ligne['Bonus conditionnel maximum']),
        bonus_defaut_texte: nettoyerTexte(ligne['Bonus par défaut']),
      };

      const [resultatMaj] = await connexion.query(
        `UPDATE Breloque SET effet = ?, tag = ?, ensemble_lie = ?, type_input = ?,
           bonus_min_texte = ?, bonus_increment_texte = ?, bonus_max_texte = ?, bonus_defaut_texte = ?
         WHERE nom = ? AND rang = ?`,
        [
          donnees.effet,
          donnees.tag,
          donnees.ensemble_lie,
          donnees.type_input,
          donnees.bonus_min_texte,
          donnees.bonus_increment_texte,
          donnees.bonus_max_texte,
          donnees.bonus_defaut_texte,
          nom,
          rang,
        ]
      );

      if (resultatMaj.affectedRows > 0) {
        misesAJour++;
        continue;
      }

      // Nouvelle breloque : cherche une image source correspondante (partagée
      // sur les 4 rangs, comme pour les breloques déjà en base).
      const fichierImage = trouverImageCorrespondante(nom, fichiersImages);

      const [resultatInsert] = await connexion.query(
        `INSERT INTO Breloque (
          nom, rang, effet, tag, ensemble_lie, type_input,
          bonus_min_texte, bonus_increment_texte, bonus_max_texte, bonus_defaut_texte
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nom,
          rang,
          donnees.effet,
          donnees.tag,
          donnees.ensemble_lie,
          donnees.type_input,
          donnees.bonus_min_texte,
          donnees.bonus_increment_texte,
          donnees.bonus_max_texte,
          donnees.bonus_defaut_texte,
        ]
      );
      inserees++;

      if (fichierImage) {
        const cible = path.join(DOSSIER_IMAGES_CIBLE, `${resultatInsert.insertId}.webp`);
        fs.copyFileSync(path.join(DOSSIER_IMAGES_SOURCE, fichierImage), cible);
        await connexion.query('UPDATE Breloque SET image_url = ? WHERE id = ?', [
          `/images/breloques/${resultatInsert.insertId}.webp`,
          resultatInsert.insertId,
        ]);
      }
    }
  }

  console.log(`Terminé : ${misesAJour} breloques existantes mises à jour, ${inserees} nouvelles breloques insérées.`);
  await connexion.end();
}

main().catch((err) => {
  console.error("Erreur pendant l'import des boosts de breloques :", err);
  process.exit(1);
});
