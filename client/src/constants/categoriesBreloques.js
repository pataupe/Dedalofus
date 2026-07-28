// Catégories de filtres, désormais branchées sur Breloque.tag (colonne ajoutée
// par DEDALE - BRELOQUES_NEW.csv, onglet "Boosts breloques") : une breloque peut
// avoir plusieurs tags à la fois (ex: "Breloque boss + Dégâts + Entrave"), le
// filtre serveur fait un LIKE par tag sélectionné (OR entre eux, comme les
// éléments des sorts). Les libellés ci-dessous doivent matcher exactement les
// tokens présents en base (vérifiés via `SELECT DISTINCT tag`) — "Breloque boss"
// est bien au singulier en base, pas "Breloques boss".
export const CATEGORIES_BRELOQUES = [
  'Dégâts',
  'Mobilité',
  'Soin - Protection',
  'Entrave',
  'Bonus PA/PO',
  'Bonus Divers',
  'Breloque boss',
];
