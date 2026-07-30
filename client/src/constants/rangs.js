export const RANGS = ['Commun', 'Rare', 'Épique', 'Mythique', 'Éxalté'];

// Couleur de bordure par rang de cube, affichée sur les emplacements équipés
// de la fiche perso (V1 sans vraies images : la bordure sert d'indicateur visuel).
const COULEURS_RANG = {
  Commun: '#B08D57', // bronze
  Rare: '#C0C0C0', // argent
  Épique: '#D4AF37', // or
  Mythique: '#DC143C', // rouge écarlate
  Éxalté: '#CFEFFF', // diamant (glacé, distinct du bleu-vert de l'élément Air)
};

export function couleurRangCube(rang) {
  return COULEURS_RANG[rang] || 'var(--bordure)';
}
