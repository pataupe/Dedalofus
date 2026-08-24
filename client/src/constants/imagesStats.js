// Vraies icônes de stats fournies par le porteur de projet (data/images/icones-stats/,
// converties en webp dans client/public/images/icones-stats/). Une seule image
// peut couvrir plusieurs clés qui représentent le même concept sous des noms
// différents selon l'écran (ex: PA côté cube brut vs PA_TOTAL côté stat dérivée
// de calcul.js) — Résistance et % Résistance partagent aussi la même icône
// (demande explicite : "ré-air correspond aux résistances air ET % air").
// IconeStat.jsx utilise cette table en priorité (si `cle` matche) et ne retombe
// sur une icône SVG (constants/iconesStats.js) que pour les clés absentes ici —
// ex: DO_PIEGE/PUISSANCE_PIEGE (pas d'icône fournie), ou les concepts qui ne
// sont pas des clés de stat (multiplicateurs/indicatifs d'ensemble).
const I = '/images/icones-stats/';

export const IMAGE_PAR_STAT = {
  PA: `${I}pa.webp`,
  PA_TOTAL: `${I}pa.webp`,
  PM: `${I}pm.webp`,
  PM_TOTAL: `${I}pm.webp`,
  PO: `${I}po.webp`,
  VITALITE: `${I}vita.webp`,
  VITALITE_TOTALE: `${I}vita.webp`,
  AGILITE: `${I}agi.webp`,
  CHANCE: `${I}chance.webp`,
  FORCE: `${I}force.webp`,
  INTELLIGENCE: `${I}intel.webp`,
  PUISSANCE: `${I}puissance.webp`,
  '%_COUP_CRITIQUE': `${I}critique.webp`,
  SAGESSE: `${I}sagesse.webp`,
  ESQUIVE_PA: `${I}esquive-pa.webp`,
  ESQUIVE_PA_TOTALE: `${I}esquive-pa.webp`,
  ESQUIVE_PM: `${I}esquive-pm.webp`,
  ESQUIVE_PM_TOTALE: `${I}esquive-pm.webp`,
  SOIN: `${I}soin.webp`,
  FUITE: `${I}fuite.webp`,
  FUITE_TOTALE: `${I}fuite.webp`,
  TACLE: `${I}tacle.webp`,
  TACLE_TOTAL: `${I}tacle.webp`,
  INITIATIVE: `${I}initiative.webp`,
  INITIATIVE_TOTALE: `${I}initiative.webp`,
  INVOCATION: `${I}invoc.webp`,
  INVOCATION_TOTALE: `${I}invoc.webp`,
  DOMMAGES: `${I}dommages.webp`,
  DO_TERRE: `${I}do-terre.webp`,
  DOMMAGES_TERRE_TOTAL: `${I}do-terre.webp`,
  DO_FEU: `${I}do-feu.webp`,
  DOMMAGES_FEU_TOTAL: `${I}do-feu.webp`,
  DO_EAU: `${I}do-eau.webp`,
  DOMMAGES_EAU_TOTAL: `${I}do-eau.webp`,
  DO_AIR: `${I}do-air.webp`,
  DOMMAGES_AIR_TOTAL: `${I}do-air.webp`,
  DO_CRIT: `${I}do-crit.webp`,
  DO_POU: `${I}do-pou.webp`,
  RES_NEUTRE: `${I}re-neutre.webp`,
  '%_RES_NEUTRE': `${I}re-neutre.webp`,
  RES_TERRE: `${I}re-terre.webp`,
  '%_RES_TERRE': `${I}re-terre.webp`,
  RES_FEU: `${I}re-feu.webp`,
  '%_RES_FEU': `${I}re-feu.webp`,
  RES_EAU: `${I}re-eau.webp`,
  '%_RES_EAU': `${I}re-eau.webp`,
  RES_AIR: `${I}re-air.webp`,
  '%_RES_AIR': `${I}re-air.webp`,
  RES_CRIT: `${I}re-crit.webp`,
  RES_POU: `${I}re-pou.webp`,
  RETRAIT_PA_TOTAL: `${I}ret-pa.webp`,
  RETRAIT_PA_BRELOQUE: `${I}ret-pa.webp`,
  RETRAIT_PM_TOTAL: `${I}ret-pm.webp`,
  RETRAIT_PM_BRELOQUE: `${I}ret-pm.webp`,
};
