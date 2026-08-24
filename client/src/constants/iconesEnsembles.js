// Icônes + libellés pour l'affichage des bonus d'ensemble (EnsembleDetail.jsx),
// repris À L'IDENTIQUE de StatsPersonnage.jsx (demande explicite du porteur de
// projet : ne jamais afficher un libellé différent pour la même stat selon l'écran,
// ex. toujours "Vitalité", jamais "Points de vie"/"PV"). Si un libellé change dans
// StatsPersonnage.jsx, le répercuter ici aussi. `icone` référence un nom de
// CHEMINS_ICONES (constants/iconesStats.js) — vraies icônes vectorielles, plus
// d'emoji (remplacées dans ce chantier, cohérent avec le reste du site).
export const ICONES_ENSEMBLES = {
  VITALITE: { libelle: 'Vitalité', icone: 'coeur', couleur: 'var(--couleur-feu)' },
  PA: { libelle: 'PA', icone: 'eclair', couleur: 'var(--couleur-lumiere)' },
  PM: { libelle: 'PM', icone: 'mouvement', couleur: 'var(--couleur-air)' },
  PO: { libelle: 'PO', icone: 'cible', couleur: 'var(--couleur-eau)' },
  FUITE: { libelle: 'Fuite', icone: 'mouvement', couleur: 'var(--couleur-terre)' },
  TACLE: { libelle: 'Tacle', icone: 'mouvement', couleur: 'var(--couleur-lumiere)' },
  SOIN: { libelle: 'Soin', icone: 'soin', couleur: 'var(--couleur-feu)' },
  PUISSANCE: { libelle: 'Puissance', icone: 'puissance', couleur: 'var(--couleur-lumiere)' },
  PUISSANCE_PIEGE: { libelle: 'Puiss. Piège', icone: 'puissance', couleur: 'var(--couleur-lumiere)' },
  DO_PIEGE: { libelle: 'Do Piège', icone: 'piege', couleur: 'var(--couleur-terre)' },
  SAGESSE: { libelle: 'Sagesse', icone: 'lune', couleur: 'var(--couleur-chaos)' },
  INVOCATION: { libelle: 'Invocation', icone: 'invocation', couleur: 'var(--couleur-chaos)' },
  DO_CRIT: { libelle: 'Do Crit.', icone: 'viseur', couleur: 'var(--couleur-feu)' },
  '%_COUP_CRITIQUE': { libelle: '% Critique', icone: 'viseur', couleur: 'var(--couleur-feu)' },
  DO_POU: { libelle: 'Do Pou.', icone: 'poussee', couleur: 'var(--texte-attenue)' },
  RES_CRIT: { libelle: 'Ré Crit.', icone: 'bouclier', couleur: 'var(--couleur-feu)' },
  RES_POU: { libelle: 'Ré Pou.', icone: 'bouclier', couleur: 'var(--texte-attenue)' },
  RETRAIT_PA_BRELOQUE: { libelle: 'Ret. PA', icone: 'chevronBas', couleur: 'var(--couleur-eau)' },
  RETRAIT_PM_BRELOQUE: { libelle: 'Ret. PM', icone: 'chevronBas', couleur: 'var(--couleur-air)' },
  ESQUIVE_PA: { libelle: 'Esq. PA', icone: 'bouclier', couleur: 'var(--couleur-eau)' },
  ESQUIVE_PM: { libelle: 'Esq. PM', icone: 'bouclier', couleur: 'var(--couleur-air)' },
  INITIATIVE: { libelle: 'Initiative', icone: 'aile', couleur: 'var(--couleur-chaos)' },
  RES_NEUTRE: { libelle: 'Ré Neutre', icone: 'bouclier', couleur: 'var(--texte-attenue)' },
  RES_TERRE: { libelle: 'Ré Terre', icone: 'montagne', couleur: 'var(--couleur-terre)' },
  RES_FEU: { libelle: 'Ré Feu', icone: 'flamme', couleur: 'var(--couleur-feu)' },
  RES_EAU: { libelle: 'Ré Eau', icone: 'goutte', couleur: 'var(--couleur-eau)' },
  RES_AIR: { libelle: 'Ré Air', icone: 'plume', couleur: 'var(--couleur-air)' },
  '%_RES_NEUTRE': { libelle: '% Ré Neutre', icone: 'bouclier', couleur: 'var(--texte-attenue)' },
  '%_RES_TERRE': { libelle: '% Ré Terre', icone: 'montagne', couleur: 'var(--couleur-terre)' },
  '%_RES_FEU': { libelle: '% Ré Feu', icone: 'flamme', couleur: 'var(--couleur-feu)' },
  '%_RES_EAU': { libelle: '% Ré Eau', icone: 'goutte', couleur: 'var(--couleur-eau)' },
  '%_RES_AIR': { libelle: '% Ré Air', icone: 'plume', couleur: 'var(--couleur-air)' },
  // Caractéristiques et dommages bruts de cube : n'apparaissent que dans les
  // ensembles de cubes (PANOPLIES, cf. calcul.js — jamais dans les ensembles
  // classiques/boss, dont le texte source ne les mentionne pas). Libellés/icônes
  // repris de StatsPersonnage.jsx (FORCE/INTELLIGENCE/CHANCE/AGILITE) et de
  // PanopliesPersonnage.jsx (DOMMAGES/DO_*, même convention que "Do Air" etc.
  // affiché ailleurs pour les stats dérivées équivalentes).
  FORCE: { libelle: 'Force', icone: 'montagne', couleur: 'var(--couleur-terre)' },
  INTELLIGENCE: { libelle: 'Intel.', icone: 'flamme', couleur: 'var(--couleur-feu)' },
  CHANCE: { libelle: 'Chance', icone: 'goutte', couleur: 'var(--couleur-eau)' },
  AGILITE: { libelle: 'Agilité', icone: 'plume', couleur: 'var(--couleur-air)' },
  DOMMAGES: { libelle: 'Dommages', icone: 'etincelle', couleur: 'var(--couleur-lumiere)' },
  DO_TERRE: { libelle: 'Do Terre', icone: 'montagne', couleur: 'var(--couleur-terre)' },
  DO_FEU: { libelle: 'Do Feu', icone: 'flamme', couleur: 'var(--couleur-feu)' },
  DO_EAU: { libelle: 'Do Eau', icone: 'goutte', couleur: 'var(--couleur-eau)' },
  DO_AIR: { libelle: 'Do Air', icone: 'plume', couleur: 'var(--couleur-air)' },
};

// Multiplicateurs de dégâts (pas des stats plates accumulées) : pas de précédent
// dans StatsPersonnage (jamais affichés là-bas, seulement reflétés dans les dégâts
// calculés d'OngletSorts) — icônes dédiées à ce contexte.
export const ICONES_MULTIPLICATEURS = {
  finaux_distance: { libelle: 'Dégâts Distance', icone: 'arc', couleur: 'var(--couleur-air)' },
  finaux_melee: { libelle: 'Dégâts Mêlée', icone: 'epee', couleur: 'var(--couleur-terre)' },
  indirects: { libelle: 'Dégâts Indirects', icone: 'piege', couleur: 'var(--couleur-chaos)' },
};

// "% résistances distance/mêlée" (data/sorts-degats-indirects.md : volontairement
// indicatif, aucun impact sur le calcul de stats/dégâts) — affiché avec sa propre
// icône comme les autres lignes pour rester visuellement cohérent, sans pour autant
// être une vraie stat ou un multiplicateur.
export const ICONES_INDICATIFS = {
  resistances_distance: { libelle: 'Rés. Distance', icone: 'bouclier', couleur: 'var(--couleur-air)' },
  resistances_melee: { libelle: 'Rés. Mêlée', icone: 'bouclier', couleur: 'var(--couleur-terre)' },
};
