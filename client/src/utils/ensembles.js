// Lookup côté frontend contre ensembles.json (généré par
// server/scripts/generate-ensembles.js) — pas de round-trip réseau pour une simple
// question "cet item appartient-il à un ensemble ?" sur une card.
import ensemblesData from '../data/ensembles.json';

// Ensembles de cubes auxquels appartient un élément de cube donné. Un cube Chaos
// compte comme 1 cube de chaque famille (même règle que calculerPanopliesActives,
// server/logic/calcul.js) : sur sa propre card, il pointe donc vers les 5 ensembles.
export function trouverEnsemblesCube(element) {
  if (!element) return [];
  if (element === 'Chaos') {
    return ensemblesData.filter((e) => e.type === 'cube');
  }
  return ensemblesData.filter((e) => e.type === 'cube' && e.nom === `Ensemble de Cubes ${element}`);
}

// Ensembles classiques/boss auxquels appartient un sort ou une breloque, par nom (le
// rang n'a pas d'importance — une pièce compte à n'importe quel rang équipé, même
// règle que calculerEnsemblesActifs côté serveur).
export function trouverEnsemblesPiece(type, nom) {
  if (!nom) return [];
  return ensemblesData.filter((e) => (e.pieces || []).some((piece) => piece.type === type && piece.nom === nom));
}

export function obtenirEnsemble(cle) {
  return ensemblesData.find((e) => e.cle === cle) || null;
}

export default ensemblesData;
