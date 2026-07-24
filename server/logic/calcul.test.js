import { describe, it, expect } from 'vitest';
const { calculerStatsPersonnage, calculerDegats, calculerPanopliesActives } = require('./calcul');

// Petit utilitaire pour fabriquer un "cube équipé" avec juste les stats voulues
// (et éventuellement son élément, utile pour les tests de bonus de panoplie).
function cube(stats, element) {
  return { element, stats: Object.entries(stats).map(([key, value]) => ({ key, value })) };
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

  it('Vitalité = base 1050 + bonus des cubes (exemple validé : 1450 → 2500)', () => {
    const stats = calculerStatsPersonnage([cube({ VITALITE: 1450 })]);
    expect(stats.VITALITE_TOTALE).toBe(2500);
  });

  it('PA = base 7 + cubes, PM = base 3 + cubes, sans panoplie', () => {
    const stats = calculerStatsPersonnage([cube({ PA: 2, PM: 1 })]);
    expect(stats.PA_TOTAL).toBe(9);
    expect(stats.PM_TOTAL).toBe(4);
  });

  it('Invocation = base 1 + bonus des cubes', () => {
    const stats = calculerStatsPersonnage([cube({ INVOCATION: 2 })]);
    expect(stats.INVOCATION_TOTALE).toBe(3);
  });

  it('Tacle = 1 par tranche de 10 Agilité, troncature (exemple validé : 178 agilité → 17)', () => {
    const stats = calculerStatsPersonnage([cube({ AGILITE: 178 })]);
    expect(stats.TACLE_TOTAL).toBe(17);
  });

  it('Fuite = 1 par tranche de 10 Chance (troncature) + bonus Fuite direct des cubes', () => {
    const stats = calculerStatsPersonnage([cube({ CHANCE: 178, FUITE: 5 })]);
    expect(stats.FUITE_TOTALE).toBe(17 + 5);
  });

  it('Retrait PA/PM et Esquive PA/PM = 1 par tranche de 10 Sagesse (exemple validé : 278 → 27)', () => {
    const stats = calculerStatsPersonnage([cube({ SAGESSE: 278 })]);
    expect(stats.RETRAIT_PA_TOTAL).toBe(27);
    expect(stats.RETRAIT_PM_TOTAL).toBe(27);
    expect(stats.ESQUIVE_PA_TOTALE).toBe(27);
    expect(stats.ESQUIVE_PM_TOTALE).toBe(27);
  });

  it('Esquive PA/PM peut en plus être boostée directement par des cubes, contrairement au Retrait', () => {
    const stats = calculerStatsPersonnage([cube({ SAGESSE: 100, ESQUIVE_PA: 5, ESQUIVE_PM: 3 })]);
    expect(stats.ESQUIVE_PA_TOTALE).toBe(10 + 5);
    expect(stats.ESQUIVE_PM_TOTALE).toBe(10 + 3);
    expect(stats.RETRAIT_PA_TOTAL).toBe(10); // pas de stat cube pour le Retrait
    expect(stats.RETRAIT_PM_TOTAL).toBe(10);
  });

  it('Dommages élémentaires affichés = Dommages global + dommages direct de l\'élément (exemple validé : 20 + 85 = 105)', () => {
    const stats = calculerStatsPersonnage([cube({ DOMMAGES: 20, DO_FEU: 85 })]);
    expect(stats.DOMMAGES_FEU_TOTAL).toBe(105);
    expect(stats.DOMMAGES_TERRE_TOTAL).toBe(20); // pas de DO_TERRE ici
  });
});

describe('calculerStatsPersonnage — bonus de panoplie', () => {
  it('pas de bonus avec un seul cube d\'une famille', () => {
    const stats = calculerStatsPersonnage([cube({ AGILITE: 10 }, 'Air')]);
    expect(stats.VITALITE_TOTALE).toBe(1050); // pas de bonus panoplie Air
  });

  it('panoplie Lumière à 3 cubes : +1 PM +1 PA (palier 3, pas cumulé avec le palier 2)', () => {
    const stats = calculerStatsPersonnage([
      cube({}, 'Lumière'), cube({}, 'Lumière'), cube({}, 'Lumière'),
    ]);
    expect(stats.PM_TOTAL).toBe(3 + 1); // base 3 + palier 3 Lumière
    expect(stats.PA_TOTAL).toBe(7 + 1); // base 7 + palier 3 Lumière
  });

  it('exemple validé : 3 cubes Lumière donnant chacun 1PA/1PM + panoplie 3 = 11 PA, 7 PM', () => {
    const stats = calculerStatsPersonnage([
      cube({ PA: 1, PM: 1 }, 'Lumière'),
      cube({ PA: 1, PM: 1 }, 'Lumière'),
      cube({ PA: 1, PM: 1 }, 'Lumière'),
    ]);
    expect(stats.PA_TOTAL).toBe(11);
    expect(stats.PM_TOTAL).toBe(7);
  });

  it('panoplie Air à 4 cubes applique le palier 4 (pas la somme des paliers 2+3+4)', () => {
    const stats = calculerStatsPersonnage([
      cube({}, 'Air'), cube({}, 'Air'), cube({}, 'Air'), cube({}, 'Air'),
    ]);
    expect(stats.VITALITE_TOTALE).toBe(1050 + 150);
    expect(stats.PUISSANCE).toBe(25);
    expect(stats.DOMMAGES).toBe(5);
  });

  it('un cube Chaos compte comme 1 cube de chaque famille pour les panoplies', () => {
    // 2 cubes Lumière + 1 Chaos = palier 3 Lumière (+1PM +1PA)
    const stats = calculerStatsPersonnage([
      cube({}, 'Lumière'), cube({}, 'Lumière'), cube({}, 'Chaos'),
    ]);
    expect(stats.PM_TOTAL).toBe(3 + 1);
    expect(stats.PA_TOTAL).toBe(7 + 1);
  });

  it('plusieurs panoplies actives en même temps se cumulent entre elles', () => {
    const stats = calculerStatsPersonnage([
      cube({}, 'Air'), cube({}, 'Air'), // palier 2 Air : +50 vita, +50 agi, +10 do_air
      cube({}, 'Lumière'), cube({}, 'Lumière'), // palier 2 Lumière : +1 PM, +50 vita
    ]);
    expect(stats.VITALITE_TOTALE).toBe(1050 + 50 + 50);
    expect(stats.PM_TOTAL).toBe(3 + 1);
  });

  it('Terre/Eau/Feu ont aussi un bonus de panoplie (copie de Air en attendant les vraies valeurs)', () => {
    const terre = calculerStatsPersonnage([cube({}, 'Terre'), cube({}, 'Terre')]);
    expect(terre.VITALITE_TOTALE).toBe(1050 + 50);
    expect(terre.FORCE).toBe(50);
    expect(terre.DO_TERRE).toBe(10);

    const eau = calculerStatsPersonnage([cube({}, 'Eau'), cube({}, 'Eau')]);
    expect(eau.CHANCE).toBe(50);
    expect(eau.DO_EAU).toBe(10);

    const feu = calculerStatsPersonnage([cube({}, 'Feu'), cube({}, 'Feu')]);
    expect(feu.INTELLIGENCE).toBe(50);
    expect(feu.DO_FEU).toBe(10);
  });
});

describe('calculerStatsPersonnage — bonus "Parcho"', () => {
  it('Parcho Vitalité impacte le PdV (VITALITE_TOTALE)', () => {
    const stats = calculerStatsPersonnage([], { VITALITE: 200 });
    expect(stats.VITALITE_TOTALE).toBe(1050 + 200);
  });

  it('Parcho Agilité impacte le Tacle, Parcho Chance impacte la Fuite', () => {
    const stats = calculerStatsPersonnage([], { AGILITE: 100, CHANCE: 100 });
    expect(stats.TACLE_TOTAL).toBe(10);
    expect(stats.FUITE_TOTALE).toBe(10);
  });

  it('Parcho Sagesse impacte Retrait PA/PM et Esquive PA/PM', () => {
    const stats = calculerStatsPersonnage([], { SAGESSE: 100 });
    expect(stats.RETRAIT_PA_TOTAL).toBe(10);
    expect(stats.RETRAIT_PM_TOTAL).toBe(10);
    expect(stats.ESQUIVE_PA_TOTALE).toBe(10);
    expect(stats.ESQUIVE_PM_TOTALE).toBe(10);
  });

  it('Parcho Force/Intelligence/Chance/Agilité impacte aussi l\'Initiative', () => {
    const stats = calculerStatsPersonnage([], { FORCE: 10, INTELLIGENCE: 20, CHANCE: 30, AGILITE: 40 });
    expect(stats.INITIATIVE_TOTALE).toBe(10 + 20 + 30 + 40);
  });

  it('Parcho se cumule avec les bonus de cubes/panoplie, pas de Parcho par défaut', () => {
    const stats = calculerStatsPersonnage([cube({ AGILITE: 50 }, 'Air'), cube({}, 'Air')], { AGILITE: 100 });
    // palier 2 Air (+50 agi) + 50 (cube) + 100 (parcho) = 200
    expect(stats.AGILITE).toBe(200);
    expect(calculerStatsPersonnage([]).VITALITE_TOTALE).toBe(1050); // sans 2e argument, aucun changement
  });
});

describe('calculerPanopliesActives', () => {
  it('tableau vide si aucune famille n\'a 2 cubes ou plus', () => {
    expect(calculerPanopliesActives([cube({}, 'Air')])).toEqual([]);
  });

  it('une entrée par famille active, non fusionnées entre elles', () => {
    const actives = calculerPanopliesActives([
      cube({}, 'Air'), cube({}, 'Air'),
      cube({}, 'Lumière'), cube({}, 'Lumière'), cube({}, 'Lumière'),
    ]);
    expect(actives).toHaveLength(2);

    const air = actives.find((a) => a.famille === 'Air');
    expect(air.nombre).toBe(2);
    expect(air.palier).toBe(2);
    expect(air.bonus).toEqual({ VITALITE: 50, AGILITE: 50, DO_AIR: 10 });

    const lumiere = actives.find((a) => a.famille === 'Lumière');
    expect(lumiere.palier).toBe(3);
    expect(lumiere.bonus).toEqual({ PM: 1, PA: 1, VITALITE: 75, SOIN: 10, DO_CRIT: 10 });
  });

  it('un cube Chaos compte dans les 5 familles à la fois', () => {
    const actives = calculerPanopliesActives([cube({}, 'Air'), cube({}, 'Chaos')]);
    expect(actives).toHaveLength(1); // Air seul atteint 2, les autres familles restent à 1
    expect(actives[0].famille).toBe('Air');
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

  it('calcule aussi les dégâts critiques quand degatsCritiqueMin/Max sont fournis', () => {
    const stats = calculerStatsPersonnage([cube({ INTELLIGENCE: 100 })]);
    const resultats = calculerDegats(stats, [
      { id: 1, degatsMin: 20, degatsMax: 20, degatsCritiqueMin: 25, degatsCritiqueMax: 25, element: 'Feu' },
    ]);
    expect(resultats[0].degatsMin).toBe(40); // 100 stat = double les dégâts
    expect(resultats[0].degatsCritiqueMin).toBe(50);
    expect(resultats[0].degatsCritiqueMax).toBe(50);
  });

  it('pas de degatsCritiqueMin/Max dans le résultat si absents en entrée (rétrocompatible)', () => {
    const stats = calculerStatsPersonnage([]);
    const resultats = calculerDegats(stats, [{ id: 1, degatsMin: 19, degatsMax: 23, element: 'Feu' }]);
    expect(resultats).toEqual([{ sortId: 1, element: 'Feu', degatsMin: 19, degatsMax: 23 }]);
  });

  it('% critique total = % critique de base du sort + %_COUP_CRITIQUE du personnage', () => {
    const stats = calculerStatsPersonnage([cube({ '%_COUP_CRITIQUE': 20 })]);
    const resultats = calculerDegats(stats, [
      { id: 1, degatsMin: 20, degatsMax: 20, chanceCritique: 15, element: 'Feu' },
    ]);
    expect(resultats[0].chanceCritiqueTotal).toBe(35);
  });

  it('chanceCritiqueTotal absent si chanceCritique non fourni en entrée', () => {
    const stats = calculerStatsPersonnage([]);
    const resultats = calculerDegats(stats, [{ id: 1, degatsMin: 20, degatsMax: 20, element: 'Feu' }]);
    expect(resultats[0].chanceCritiqueTotal).toBeUndefined();
  });
});
