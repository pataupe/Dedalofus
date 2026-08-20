// Icônes + libellés pour l'affichage des bonus d'ensemble (EnsembleDetail.jsx),
// repris À L'IDENTIQUE de StatsPersonnage.jsx (demande explicite du porteur de
// projet : ne jamais afficher un libellé différent pour la même stat selon l'écran,
// ex. toujours "Vitalité", jamais "Points de vie"/"PV"). Si un libellé change dans
// StatsPersonnage.jsx, le répercuter ici aussi.
export const ICONES_ENSEMBLES = {
  VITALITE: { libelle: 'Vitalité', icone: '❤️', couleur: 'var(--couleur-feu)' },
  PA: { libelle: 'PA', icone: '⭐', couleur: 'var(--couleur-lumiere)' },
  PM: { libelle: 'PM', icone: '🔷', couleur: 'var(--couleur-air)' },
  PO: { libelle: 'PO', icone: '👁️', couleur: 'var(--couleur-eau)' },
  FUITE: { libelle: 'Fuite', icone: '➡️', couleur: 'var(--couleur-terre)' },
  TACLE: { libelle: 'Tacle', icone: '🐾', couleur: 'var(--couleur-lumiere)' },
  SOIN: { libelle: 'Soin', icone: '✚', couleur: 'var(--couleur-feu)' },
  PUISSANCE: { libelle: 'Puissance', icone: '⚡', couleur: 'var(--couleur-lumiere)' },
  PUISSANCE_PIEGE: { libelle: 'Puiss. Piège', icone: '🪤', couleur: 'var(--couleur-lumiere)' },
  DO_PIEGE: { libelle: 'Do Piège', icone: '🪤', couleur: 'var(--couleur-terre)' },
  SAGESSE: { libelle: 'Sagesse', icone: '🌙', couleur: 'var(--couleur-chaos)' },
  INVOCATION: { libelle: 'Invocation', icone: '👹', couleur: 'var(--couleur-chaos)' },
  DO_CRIT: { libelle: 'Do Crit.', icone: '🎯', couleur: 'var(--couleur-feu)' },
  '%_COUP_CRITIQUE': { libelle: '% Critique', icone: '❗', couleur: 'var(--couleur-feu)' },
  DO_POU: { libelle: 'Do Pou.', icone: '➡️', couleur: 'var(--texte-attenue)' },
  RES_CRIT: { libelle: 'Ré Crit.', icone: '🛡️', couleur: 'var(--couleur-feu)' },
  RES_POU: { libelle: 'Ré Pou.', icone: '🛡️', couleur: 'var(--texte-attenue)' },
  RETRAIT_PA_BRELOQUE: { libelle: 'Ret. PA', icone: '⬇️', couleur: 'var(--couleur-eau)' },
  RETRAIT_PM_BRELOQUE: { libelle: 'Ret. PM', icone: '⬇️', couleur: 'var(--couleur-air)' },
  RES_NEUTRE: { libelle: 'Ré Neutre', icone: '☯️', couleur: 'var(--texte-attenue)' },
  RES_TERRE: { libelle: 'Ré Terre', icone: '🌾', couleur: 'var(--couleur-terre)' },
  RES_FEU: { libelle: 'Ré Feu', icone: '🔥', couleur: 'var(--couleur-feu)' },
  RES_EAU: { libelle: 'Ré Eau', icone: '💧', couleur: 'var(--couleur-eau)' },
  RES_AIR: { libelle: 'Ré Air', icone: '🍃', couleur: 'var(--couleur-air)' },
  '%_RES_NEUTRE': { libelle: '% Ré Neutre', icone: '☯️', couleur: 'var(--texte-attenue)' },
  '%_RES_TERRE': { libelle: '% Ré Terre', icone: '🌾', couleur: 'var(--couleur-terre)' },
  '%_RES_FEU': { libelle: '% Ré Feu', icone: '🔥', couleur: 'var(--couleur-feu)' },
  '%_RES_EAU': { libelle: '% Ré Eau', icone: '💧', couleur: 'var(--couleur-eau)' },
  '%_RES_AIR': { libelle: '% Ré Air', icone: '🍃', couleur: 'var(--couleur-air)' },
};

// Multiplicateurs de dégâts (pas des stats plates accumulées) : pas de précédent
// dans StatsPersonnage (jamais affichés là-bas, seulement reflétés dans les dégâts
// calculés d'OngletSorts) — icônes dédiées à ce contexte.
export const ICONES_MULTIPLICATEURS = {
  finaux_distance: { libelle: 'Dégâts Distance', icone: '🏹', couleur: 'var(--couleur-air)' },
  finaux_melee: { libelle: 'Dégâts Mêlée', icone: '⚔️', couleur: 'var(--couleur-terre)' },
  indirects: { libelle: 'Dégâts Indirects', icone: '☠️', couleur: 'var(--couleur-chaos)' },
};

// "% résistances distance/mêlée" (data/sorts-degats-indirects.md : volontairement
// indicatif, aucun impact sur le calcul de stats/dégâts) — affiché avec sa propre
// icône comme les autres lignes pour rester visuellement cohérent, sans pour autant
// être une vraie stat ou un multiplicateur.
export const ICONES_INDICATIFS = {
  resistances_distance: { libelle: 'Rés. Distance', icone: '🛡️', couleur: 'var(--couleur-air)' },
  resistances_melee: { libelle: 'Rés. Mêlée', icone: '🛡️', couleur: 'var(--couleur-terre)' },
};
