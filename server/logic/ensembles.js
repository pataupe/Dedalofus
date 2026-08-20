// Ensembles "classiques"/"boss" (sorts + breloques) — les ensembles de cubes restent
// gérés par PANOPLIES/calculerBonusPanoplies (calcul.js), inchangé. Logique pure,
// testée isolément, ne touche ni Express ni MySQL : reçoit `ensemblesData` (contenu de
// ensembles.json, généré par generate-ensembles.js) déjà chargé en paramètre.

// Compte, pour chaque ensemble classique/boss, combien de ses pièces nommées sont
// actuellement équipées (comparaison par nom, rang ignoré — une pièce compte à
// n'importe quel rang équipé, même principe que la contrainte anti-doublon
// `trouverEmplacementDoublonParNom`, personnagesController.js). Détermine le palier
// atteint (le plus haut dont le seuil `items` est <= au nombre de pièces équipées) et
// si le "bonus spécial" de l'ensemble est débloqué.
//
// @param {Array<{ nom: string }>} sortsEquipes Sorts actuellement équipés (emplacements
//   vides déjà filtrés par l'appelant, comme pour calculerEffetsBreloques).
// @param {Array<{ nom: string }>} breloquesEquipes Breloques actuellement équipées.
// @param {Array<Object>} ensemblesData Contenu de ensembles.json (tableau plat, `type`
//   'cube'|'classique'|'boss' — seuls 'classique'/'boss' sont considérés ici).
// @returns {Array<{ cle: string, nom: string, type: string, nombrePieces: number,
//   palier: number|null, bonusTexte: string|null, bonusSpecial: {seuil,texte}|null,
//   delta: { statsPlates: Object, multiplicateurs: Array } }>} Un ensemble par entrée
//   avec >= 1 pièce reconnue équipée (pas de bruit pour les ensembles sans rapport).
function calculerEnsemblesActifs(sortsEquipes, breloquesEquipes, ensemblesData) {
  const nomsSorts = new Set((sortsEquipes || []).filter(Boolean).map((s) => s.nom));
  const nomsBreloques = new Set((breloquesEquipes || []).filter(Boolean).map((b) => b.nom));

  const actifs = [];

  for (const ensemble of ensemblesData || []) {
    if (ensemble.type === 'cube') continue;

    const nombrePieces = (ensemble.pieces || []).filter((piece) => {
      const noms = piece.type === 'sort' ? nomsSorts : nomsBreloques;
      return noms.has(piece.nom);
    }).length;

    if (nombrePieces === 0) continue;

    const palierAtteint = (ensemble.paliers || [])
      .filter((p) => p.items <= nombrePieces)
      .sort((a, b) => b.items - a.items)[0] || null;

    const bonusSpecial =
      ensemble.bonusSpecial && nombrePieces >= ensemble.bonusSpecial.seuil ? ensemble.bonusSpecial : null;

    actifs.push({
      cle: ensemble.cle,
      nom: ensemble.nom,
      type: ensemble.type,
      nombrePieces,
      palier: palierAtteint ? palierAtteint.items : null,
      bonusTexte: palierAtteint ? palierAtteint.texte : null,
      bonusSpecial,
      delta: (palierAtteint && palierAtteint.delta) || { statsPlates: {}, multiplicateurs: [] },
    });
  }

  return actifs;
}

// Fusionne les deltas de tous les ensembles actifs en un seul { statsPlates,
// multiplicateurs }, même forme de sortie que calculerEffetsBreloques (effetsBreloques.js)
// pour se brancher aux mêmes points d'entrée de calcul.js.
function calculerBonusEnsembles(ensemblesActifs) {
  const statsPlates = {};
  const multiplicateurs = [];

  for (const ensemble of ensemblesActifs || []) {
    const delta = ensemble.delta || {};
    for (const [cle, valeur] of Object.entries(delta.statsPlates || {})) {
      statsPlates[cle] = (statsPlates[cle] || 0) + valeur;
    }
    multiplicateurs.push(...(delta.multiplicateurs || []));
  }

  return { statsPlates, multiplicateurs };
}

module.exports = { calculerEnsemblesActifs, calculerBonusEnsembles };
