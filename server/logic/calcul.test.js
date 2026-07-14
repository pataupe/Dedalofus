import { describe, it, expect } from 'vitest';
const { calculerStatsPersonnage, calculerDegats } = require('./calcul');

// Petit utilitaire pour fabriquer un "cube équipé" avec juste les stats voulues.
function cube(stats) {
  return { stats: Object.entries(stats).map(([key, value]) => ({ key, value })) };
}

describe('calculerStatsPersonnage', () => {
  it('renvoie des stats à 0 quand aucun cube n\'est équipé', () => {
    const stats = calculerStatsPersonnage([]);
    expect(stats.INTELLIGENCE).toBeUndefined();
    expect(stats.INITIATIVE_TOTALE).toBe(0);
  });

  it('ignore les emplacements vides (null)', () => {
    const stats = calculerStatsPersonnage([null, cube({ FORCE: 50 }), undefined]);
    expect(stats.FORCE).toBe(50);
  });

  it('additionne les stats de plusieurs cubes', () => {
    const stats = calculerStatsPersonnage([
      cube({ INTELLIGENCE: 200, PUISSANCE: 50 }),
      cube({ INTELLIGENCE: 250, PUISSANCE: 120 }),
    ]);
    expect(stats.INTELLIGENCE).toBe(450);
    expect(stats.PUISSANCE).toBe(170);
  });

  it('calcule l\'initiative comme somme des 4 caractéristiques offensives + bonus Initiative', () => {
    const stats = calculerStatsPersonnage([
      cube({ FORCE: 150, INTELLIGENCE: 450, CHANCE: 200, AGILITE: 0, INITIATIVE: 30 }),
    ]);
    expect(stats.INITIATIVE_TOTALE).toBe(150 + 450 + 200 + 0 + 30);
  });
});

describe('calculerDegats', () => {
  it('un sort sans aucune stat tape toujours ses dégâts de base', () => {
    const stats = calculerStatsPersonnage([]);
    const resultats = calculerDegats(stats, [{ id: 1, degatsMin: 19, degatsMax: 23, element: 'Feu' }]);
    expect(resultats).toEqual([{ sortId: 1, element: 'Feu', degatsMin: 19, degatsMax: 23 }]);
  });

  it('100 stat dans l\'élément double les dégâts (1 stat = 1% des dégâts de base)', () => {
    const stats = calculerStatsPersonnage([cube({ INTELLIGENCE: 100 })]);
    const resultats = calculerDegats(stats, [{ id: 1, degatsMin: 20, degatsMax: 20, element: 'Feu' }]);
    expect(resultats[0].degatsMin).toBe(40);
  });

  it('200 stat triple les dégâts', () => {
    const stats = calculerStatsPersonnage([cube({ INTELLIGENCE: 200 })]);
    const resultats = calculerDegats(stats, [{ id: 1, degatsMin: 20, degatsMax: 20, element: 'Feu' }]);
    expect(resultats[0].degatsMin).toBe(60);
  });

  it('la Puissance compte comme stat dans tous les éléments (exemple validé : 250 stat + 11 dommages sur base 20 = 81)', () => {
    const stats = calculerStatsPersonnage([cube({ INTELLIGENCE: 200, PUISSANCE: 50, DOMMAGES: 11 })]);
    const resultats = calculerDegats(stats, [{ id: 1, degatsMin: 20, degatsMax: 20, element: 'Feu' }]);
    expect(resultats[0].degatsMin).toBe(81);
  });

  it('exemple validé : 450 intel + 170 puissance sur un sort Feu 20-22 → 144 à 158', () => {
    const stats = calculerStatsPersonnage([
      cube({ FORCE: 150, CHANCE: 200, AGILITE: 0, INTELLIGENCE: 450, PUISSANCE: 170 }),
    ]);
    const resultats = calculerDegats(stats, [{ id: 1, degatsMin: 20, degatsMax: 22, element: 'Feu' }]);
    expect(resultats[0]).toEqual({ sortId: 1, element: 'Feu', degatsMin: 144, degatsMax: 158 });
  });

  it('DOMMAGES (global) s\'applique à tous les éléments, DO_FEU seulement au Feu', () => {
    const stats = calculerStatsPersonnage([cube({ DOMMAGES: 5, DO_FEU: 3 })]);
    const feu = calculerDegats(stats, [{ id: 1, degatsMin: 20, degatsMax: 20, element: 'Feu' }]);
    const terre = calculerDegats(stats, [{ id: 2, degatsMin: 20, degatsMax: 20, element: 'Terre' }]);
    expect(feu[0].degatsMin).toBe(20 + 5 + 3); // DOMMAGES + DO_FEU
    expect(terre[0].degatsMin).toBe(20 + 5); // DOMMAGES seul, pas de DO_TERRE ici
  });

  it('un sort sans stat dans son élément mais avec une autre stat équipée tape toujours sa base', () => {
    const stats = calculerStatsPersonnage([cube({ AGILITE: 150 })]); // Air, pas Terre
    const resultats = calculerDegats(stats, [{ id: 1, degatsMin: 20, degatsMax: 20, element: 'Terre' }]);
    expect(resultats[0].degatsMin).toBe(20);
  });

  it('"Meilleur élément" choisit l\'élément le plus avantageux pour le personnage', () => {
    const stats = calculerStatsPersonnage([cube({ INTELLIGENCE: 300, FORCE: 50 })]);
    const resultats = calculerDegats(stats, [{ id: 1, degatsMin: 20, degatsMax: 20, element: 'Meilleur élément' }]);
    expect(resultats[0].element).toBe('Feu');
  });

  it('un sort qui tape dans 2 éléments à la fois produit 2 résultats distincts', () => {
    const stats = calculerStatsPersonnage([cube({ INTELLIGENCE: 100, AGILITE: 200 })]);
    const resultats = calculerDegats(stats, [
      { id: 1, degatsMin: 20, degatsMax: 20, element: ['Feu', 'Air'] },
    ]);
    expect(resultats).toHaveLength(2);
    expect(resultats.find((r) => r.element === 'Feu').degatsMin).toBe(40);
    expect(resultats.find((r) => r.element === 'Air').degatsMin).toBe(60);
  });

  it('un sort sans dégâts (pas de degatsMin/Max) est ignoré', () => {
    const stats = calculerStatsPersonnage([]);
    const resultats = calculerDegats(stats, [{ id: 1, degatsMin: null, degatsMax: null, element: 'Feu' }]);
    expect(resultats).toEqual([]);
  });

  it('un emplacement de sort vide (null) est ignoré', () => {
    const stats = calculerStatsPersonnage([]);
    const resultats = calculerDegats(stats, [null, { id: 1, degatsMin: 20, degatsMax: 20, element: 'Feu' }]);
    expect(resultats).toHaveLength(1);
  });
});
