import { describe, it, expect } from 'vitest';
const { calculerEnsemblesActifs, calculerBonusEnsembles } = require('./ensembles');

// Petit ensemble fictif à 3 pièces (2 sorts + 1 breloque), 3 paliers, un bonus
// spécial à 2 pièces — assez pour couvrir les cas sans dépendre du vrai ensembles.json.
const ENSEMBLE_FICTIF = {
  cle: 'fictif',
  nom: 'Ensemble Fictif',
  type: 'classique',
  pieces: [
    { type: 'sort', nom: 'Sort A' },
    { type: 'sort', nom: 'Sort B' },
    { type: 'breloque', nom: 'Breloque C' },
  ],
  bonusSpecial: { seuil: 2, texte: 'Effet spécial' },
  paliers: [
    { items: 1, texte: '+10 PV', delta: { statsPlates: { VITALITE: 10 }, multiplicateurs: [] } },
    { items: 2, texte: '+20 PV', delta: { statsPlates: { VITALITE: 20 }, multiplicateurs: [] } },
    { items: 3, texte: '+30 PV, +10% dommages indirects', delta: { statsPlates: { VITALITE: 30 }, multiplicateurs: [{ type: 'indirects', valeur: 1.1 }] } },
  ],
};

const ENSEMBLE_CUBE_FICTIF = { cle: 'air', nom: 'Ensemble de Cubes Air', type: 'cube', pieces: [], paliers: [] };

describe('calculerEnsemblesActifs', () => {
  it('aucune pièce équipée -> tableau vide', () => {
    expect(calculerEnsemblesActifs([], [], [ENSEMBLE_FICTIF])).toEqual([]);
  });

  it('1 pièce équipée -> palier 1, pas de bonus spécial', () => {
    const actifs = calculerEnsemblesActifs([{ nom: 'Sort A' }], [], [ENSEMBLE_FICTIF]);
    expect(actifs).toHaveLength(1);
    expect(actifs[0].nombrePieces).toBe(1);
    expect(actifs[0].palier).toBe(1);
    expect(actifs[0].bonusTexte).toBe('+10 PV');
    expect(actifs[0].bonusSpecial).toBeNull();
  });

  it('2 pièces (sort + breloque) -> palier 2, bonus spécial débloqué', () => {
    const actifs = calculerEnsemblesActifs([{ nom: 'Sort A' }], [{ nom: 'Breloque C' }], [ENSEMBLE_FICTIF]);
    expect(actifs[0].nombrePieces).toBe(2);
    expect(actifs[0].palier).toBe(2);
    expect(actifs[0].bonusSpecial).toEqual({ seuil: 2, texte: 'Effet spécial' });
  });

  it('3 pièces -> palier max atteint (pas la somme des paliers 1+2+3)', () => {
    const actifs = calculerEnsemblesActifs(
      [{ nom: 'Sort A' }, { nom: 'Sort B' }],
      [{ nom: 'Breloque C' }],
      [ENSEMBLE_FICTIF]
    );
    expect(actifs[0].nombrePieces).toBe(3);
    expect(actifs[0].palier).toBe(3);
    expect(actifs[0].delta.statsPlates.VITALITE).toBe(30);
  });

  it('une pièce non reconnue (autre sort équipé) ne compte pas', () => {
    const actifs = calculerEnsemblesActifs([{ nom: 'Sort Sans Rapport' }], [], [ENSEMBLE_FICTIF]);
    expect(actifs).toEqual([]);
  });

  it('les ensembles de type "cube" sont ignorés (gérés par PANOPLIES ailleurs)', () => {
    const actifs = calculerEnsemblesActifs([], [], [ENSEMBLE_CUBE_FICTIF]);
    expect(actifs).toEqual([]);
  });

  it('le rang n\'a pas d\'importance, seul le nom compte (une pièce = un nom, tous rangs confondus)', () => {
    const actifs = calculerEnsemblesActifs([{ nom: 'Sort A', rang: 'Maître α' }], [], [ENSEMBLE_FICTIF]);
    expect(actifs[0].nombrePieces).toBe(1);
  });
});

describe('calculerBonusEnsembles', () => {
  it('tableau vide -> statsPlates/multiplicateurs vides', () => {
    expect(calculerBonusEnsembles([])).toEqual({ statsPlates: {}, multiplicateurs: [] });
  });

  it('fusionne les statsPlates de plusieurs ensembles actifs', () => {
    const actifs = [
      { delta: { statsPlates: { VITALITE: 30, PA: 1 }, multiplicateurs: [] } },
      { delta: { statsPlates: { VITALITE: 10 }, multiplicateurs: [] } },
    ];
    expect(calculerBonusEnsembles(actifs)).toEqual({ statsPlates: { VITALITE: 40, PA: 1 }, multiplicateurs: [] });
  });

  it('concatène les multiplicateurs de plusieurs ensembles actifs', () => {
    const actifs = [
      { delta: { statsPlates: {}, multiplicateurs: [{ type: 'indirects', valeur: 1.1 }] } },
      { delta: { statsPlates: {}, multiplicateurs: [{ type: 'finaux_distance', valeur: 1.2 }] } },
    ];
    expect(calculerBonusEnsembles(actifs).multiplicateurs).toEqual([
      { type: 'indirects', valeur: 1.1 },
      { type: 'finaux_distance', valeur: 1.2 },
    ]);
  });
});
