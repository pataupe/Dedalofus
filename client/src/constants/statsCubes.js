// Liste exhaustive des stats réellement présentes sur au moins un cube
// (vérifiée via `SELECT DISTINCT cle_stat, libelle FROM StatCube` — 36 stats).
// Ne pas ajouter de clé ici sans revérifier en base, pour ne pas afficher une
// case de filtre qui ne matchera jamais aucun cube.
//
// Ordre volontairement pas alphabétique : reprend le regroupement de DofusBook
// (Effets généraux, puis Mobilité/Esquive-Retrait, puis Dommages, puis
// Résistances), plus intuitif pour les joueurs habitués à cet outil. Pods,
// Prospection et les cases "Craftable/Favoris/Sans condition de stats" de
// DofusBook n'ont pas d'équivalent ici (pas de stat cube correspondante).
export const STATS_CUBES = [
  { cle: 'PA', libelle: 'PA' },
  { cle: 'PM', libelle: 'PM' },
  { cle: 'PO', libelle: 'PO' },
  { cle: 'VITALITE', libelle: 'Vitalité' },
  { cle: 'AGILITE', libelle: 'Agilité' },
  { cle: 'CHANCE', libelle: 'Chance' },
  { cle: 'FORCE', libelle: 'Force' },
  { cle: 'INTELLIGENCE', libelle: 'Intelligence' },
  { cle: 'PUISSANCE', libelle: 'Puissance' },
  { cle: '%_COUP_CRITIQUE', libelle: '% Critique' },
  { cle: 'SAGESSE', libelle: 'Sagesse' },
  { cle: 'ESQUIVE_PA', libelle: 'Esquive PA' },
  { cle: 'ESQUIVE_PM', libelle: 'Esquive PM' },
  { cle: 'SOIN', libelle: 'Soin' },
  { cle: 'FUITE', libelle: 'Fuite' },
  { cle: 'INITIATIVE', libelle: 'Initiative' },
  { cle: 'INVOCATION', libelle: 'Invocation' },
  { cle: 'DOMMAGES', libelle: 'Dommages' },
  { cle: 'DO_TERRE', libelle: 'Dommages Terre' },
  { cle: 'DO_FEU', libelle: 'Dommages Feu' },
  { cle: 'DO_EAU', libelle: 'Dommages Eau' },
  { cle: 'DO_AIR', libelle: 'Dommages Air' },
  { cle: 'DO_CRIT', libelle: 'Dommages Critiques' },
  { cle: 'DO_POU', libelle: 'Dommages Poussée' },
  { cle: 'RES_NEUTRE', libelle: 'Résistance Neutre' },
  { cle: '%_RES_NEUTRE', libelle: '% Résistance Neutre' },
  { cle: 'RES_TERRE', libelle: 'Résistance Terre' },
  { cle: '%_RES_TERRE', libelle: '% Résistance Terre' },
  { cle: 'RES_FEU', libelle: 'Résistance Feu' },
  { cle: '%_RES_FEU', libelle: '% Résistance Feu' },
  { cle: 'RES_EAU', libelle: 'Résistance Eau' },
  { cle: '%_RES_EAU', libelle: '% Résistance Eau' },
  { cle: 'RES_AIR', libelle: 'Résistance Air' },
  { cle: '%_RES_AIR', libelle: '% Résistance Air' },
  { cle: 'RES_CRIT', libelle: 'Résistance Critiques' },
  { cle: 'RES_POU', libelle: 'Résistance Poussée' },
];
