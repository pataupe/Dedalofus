import { describe, it, expect } from 'vitest';
const { resoudreEffetBreloque, calculerEffetsBreloques, combinerMultiplicateurs } = require('./effetsBreloques');

// Fixtures reprises telles quelles depuis la base (SELECT DISTINCT nom,
// type_input, bonus_max_texte, bonus_defaut_texte FROM Breloque WHERE
// type_input IS NOT NULL), pour vérifier le module contre la vraie donnée.

describe('resoudreEffetBreloque — toggle', () => {
  it('toggle désactivé -> aucun effet', () => {
    const effet = resoudreEffetBreloque('Breloque de Sursaut de puissance', { type: 'toggle', actif: false, texteActif: 'dommages finaux x1.4' });
    expect(effet).toEqual({ multiplicateurs: [], statsPlates: {}, pdvPourcent: 0 });
  });

  it('multiplicateur simple (Sursaut de puissance)', () => {
    const effet = resoudreEffetBreloque('Breloque de Sursaut de puissance', { type: 'toggle', actif: true, texteActif: 'dommages finaux x1.4' });
    expect(effet.multiplicateurs).toEqual([{ type: 'finaux', valeur: 1.4 }]);
  });

  it('multiplicateur distance (Sentinelle, rangs Novice/Expert/Maître α)', () => {
    const effet = resoudreEffetBreloque('Breloque de la Sentinelle', { type: 'toggle', actif: true, texteActif: 'dommages finaux distance x1.6' });
    expect(effet.multiplicateurs).toEqual([{ type: 'finaux_distance', valeur: 1.6 }]);
  });

  it('multiplicateur global (Sentinelle Maître ẞ, texte sans "distance")', () => {
    const effet = resoudreEffetBreloque('Breloque de la Sentinelle', { type: 'toggle', actif: true, texteActif: 'dommages finaux x1.6' });
    expect(effet.multiplicateurs).toEqual([{ type: 'finaux', valeur: 1.6 }]);
  });

  it('mêlée (Rixeur Instable)', () => {
    const effet = resoudreEffetBreloque('Breloque du Rixeur Instable', { type: 'toggle', actif: true, texteActif: 'dommages finaux mêlée x1.3' });
    expect(effet.multiplicateurs).toEqual([{ type: 'finaux_melee', valeur: 1.3 }]);
  });

  it('2 multiplicateurs opposés dans le même texte (Tireur d\'élite)', () => {
    const effet = resoudreEffetBreloque("Breloque du Tireur d'élite", {
      type: 'toggle',
      actif: true,
      texteActif: 'dommages finaux distance x1.15, dommages finaux mêlée x0.8',
    });
    expect(effet.multiplicateurs).toEqual([
      { type: 'finaux_distance', valeur: 1.15 },
      { type: 'finaux_melee', valeur: 0.8 },
    ]);
  });

  it('bonus simple PA (Entrée fracassante)', () => {
    const effet = resoudreEffetBreloque("Breloque d'Entrée fracassante", { type: 'toggle', actif: true, texteActif: '2 PA' });
    expect(effet).toEqual({ multiplicateurs: [], statsPlates: { PA: 2 }, pdvPourcent: 0 });
  });

  it('bonus simple PM sans espace (Sprinteur)', () => {
    const effet = resoudreEffetBreloque('Breloque du Sprinteur', { type: 'toggle', actif: true, texteActif: '2PM' });
    expect(effet.statsPlates).toEqual({ PM: 2 });
  });

  it('bonus simple % critique (Stratège d\'avant-garde)', () => {
    const effet = resoudreEffetBreloque("Breloque du Stratège d'avant-garde", { type: 'toggle', actif: true, texteActif: '40% Critique' });
    expect(effet.statsPlates).toEqual({ '%_COUP_CRITIQUE': 40 });
  });

  it('Vitalité négative (Bombeur fasciné)', () => {
    const effet = resoudreEffetBreloque('Breloque du Bombeur fasciné', { type: 'toggle', actif: true, texteActif: '-100 Vitalité' });
    expect(effet.statsPlates).toEqual({ VITALITE: -100 });
  });

  it('Vitalité positive, casse différente (Bombeur fasciné Maître ẞ)', () => {
    const effet = resoudreEffetBreloque('Breloque du Bombeur fasciné', { type: 'toggle', actif: true, texteActif: '+200 vitalité' });
    expect(effet.statsPlates).toEqual({ VITALITE: 200 });
  });

  it('PdV en pourcentage (Hémophile) -> pdvPourcent, pas une stat plate', () => {
    const effet = resoudreEffetBreloque("Breloque de l'Hémophile", { type: 'toggle', actif: true, texteActif: '+50% PdV' });
    expect(effet).toEqual({ multiplicateurs: [], statsPlates: {}, pdvPourcent: 50 });
  });

  it('composite Retrait + Esquive (Embourbeur embourbé, 4 valeurs)', () => {
    const effet = resoudreEffetBreloque("Breloque de l'Embourbeur embourbé", {
      type: 'toggle',
      actif: true,
      texteActif: '+20 Retrait PA + 20 Retrait PM ; - 10 Esquive PA - 10 Esquive PM',
    });
    expect(effet.statsPlates).toEqual({
      RETRAIT_PA_BRELOQUE: 20,
      RETRAIT_PM_BRELOQUE: 20,
      ESQUIVE_PA: -10,
      ESQUIVE_PM: -10,
    });
  });

  it('composite Embourbeur Maître α, sans le volet Esquive (donnée source incomplète)', () => {
    const effet = resoudreEffetBreloque("Breloque de l'Embourbeur embourbé", {
      type: 'toggle',
      actif: true,
      texteActif: '+30 Retrait PA + 30 Retrait PM',
    });
    expect(effet.statsPlates).toEqual({ RETRAIT_PA_BRELOQUE: 30, RETRAIT_PM_BRELOQUE: 30 });
  });

  it('composite Critique + Dommages critiques (Forcené)', () => {
    const effet = resoudreEffetBreloque('Breloque du Forcené', {
      type: 'toggle',
      actif: true,
      texteActif: '-15% Coups Critiques, +40 Dommages Critiques',
    });
    expect(effet.statsPlates).toEqual({ '%_COUP_CRITIQUE': -15, DO_CRIT: 40 });
  });
});

describe('resoudreEffetBreloque — range/accumulateur', () => {
  it('range multiplicateur de dommages (Rage mortelle)', () => {
    const effet = resoudreEffetBreloque('Breloque de Rage mortelle', {
      type: 'range',
      min: 1.1,
      max: 1.4,
      increment: 0.1,
      valeur: 1.3,
      prefixe: 'dommages finaux x',
      suffixe: '',
    });
    expect(effet.multiplicateurs).toEqual([{ type: 'finaux', valeur: 1.3 }]);
  });

  it('range bonus simple soins (empathie croissante)', () => {
    const effet = resoudreEffetBreloque("Breloque d'empathie croissante", {
      type: 'range',
      min: 0,
      max: 30,
      increment: 10,
      valeur: 20,
      prefixe: '',
      suffixe: ' soins',
    });
    expect(effet.statsPlates).toEqual({ SOIN: 20 });
  });

  it('accumulateur Puissance (Arsenal de Guerre)', () => {
    const effet = resoudreEffetBreloque('Arsenal de Guerre', {
      type: 'accumulateur',
      min: 50,
      max: 1000,
      increment: 50,
      valeur: 150,
      prefixe: '',
      suffixe: ' puissance',
    });
    expect(effet.statsPlates).toEqual({ PUISSANCE: 150 });
  });

  it('cas spécial Embrasement du Katragon (% brut, pas la convention "dommages finaux x")', () => {
    const effet = resoudreEffetBreloque('Embrasement du Katragon', {
      type: 'range',
      min: 0,
      max: 20,
      increment: 4,
      valeur: 12,
      prefixe: '',
      suffixe: '%',
    });
    expect(effet.multiplicateurs).toEqual([{ type: 'finaux', valeur: 1.12 }]);
  });

  it('range à 0 (min, aucun bonus) -> stat plate à 0, pas d\'effet perdu', () => {
    const effet = resoudreEffetBreloque('Breloque de Capacité croissante', {
      type: 'range',
      min: 0,
      max: 3,
      increment: 1,
      valeur: 0,
      prefixe: '',
      suffixe: ' PA',
    });
    expect(effet.statsPlates).toEqual({ PA: 0 });
  });

  it('pas de breloque équipée sur cet emplacement (boost null)', () => {
    expect(resoudreEffetBreloque('', null)).toEqual({ multiplicateurs: [], statsPlates: {}, pdvPourcent: 0 });
  });
});

describe('calculerEffetsBreloques', () => {
  it('agrège plusieurs breloques équipées', () => {
    const resultat = calculerEffetsBreloques([
      { nom: "Breloque d'Entrée fracassante", boost: { type: 'toggle', actif: true, texteActif: '2 PA' } },
      { nom: 'Breloque du Sprinteur', boost: { type: 'toggle', actif: true, texteActif: '2PM' } },
      {
        nom: 'Breloque de Rage mortelle',
        boost: { type: 'range', min: 1.1, max: 1.4, increment: 0.1, valeur: 1.3, prefixe: 'dommages finaux x', suffixe: '' },
      },
      null,
      { nom: 'Breloque sans bonus conditionnel', boost: null },
    ]);

    expect(resultat.statsPlates).toEqual({ PA: 2, PM: 2 });
    expect(resultat.multiplicateurs).toEqual([{ type: 'finaux', valeur: 1.3 }]);
    expect(resultat.pdvPourcent).toBe(0);
  });

  it('additionne les mêmes stats plates entre plusieurs breloques', () => {
    const resultat = calculerEffetsBreloques([
      { nom: 'A', boost: { type: 'toggle', actif: true, texteActif: '2 PA' } },
      { nom: 'B', boost: { type: 'toggle', actif: true, texteActif: '3 PA' } },
    ]);
    expect(resultat.statsPlates).toEqual({ PA: 5 });
  });
});

describe('combinerMultiplicateurs', () => {
  it('aucun multiplicateur -> facteur neutre (1)', () => {
    expect(combinerMultiplicateurs([], 'distance')).toBe(1);
  });

  it('même type -> addition des bonus (exemple porteur de projet : x1.15 distance + x1.6 distance = x1.75)', () => {
    const total = combinerMultiplicateurs(
      [
        { type: 'finaux_distance', valeur: 1.15 },
        { type: 'finaux_distance', valeur: 1.6 },
      ],
      'distance'
    );
    expect(total).toBeCloseTo(1.75);
  });

  it('types différents -> multiplication (exemple porteur de projet : x1.55 finaux * x1.15 distance = x1.7825)', () => {
    const total = combinerMultiplicateurs(
      [
        { type: 'finaux', valeur: 1.55 },
        { type: 'finaux_distance', valeur: 1.15 },
      ],
      'distance'
    );
    expect(total).toBeCloseTo(1.7825);
  });

  it('exemple porteur de projet : x1.8 finaux + x1.3 finaux = x2.1 (pas 2.34)', () => {
    const total = combinerMultiplicateurs(
      [
        { type: 'finaux', valeur: 1.8 },
        { type: 'finaux', valeur: 1.3 },
      ],
      'distance'
    );
    expect(total).toBeCloseTo(2.1);
  });

  it('un multiplicateur "distance" ne s\'applique pas en mode mêlée', () => {
    const total = combinerMultiplicateurs([{ type: 'finaux_distance', valeur: 1.6 }], 'melee');
    expect(total).toBe(1);
  });

  it('un multiplicateur "mêlée" ne s\'applique pas en mode distance', () => {
    const total = combinerMultiplicateurs([{ type: 'finaux_melee', valeur: 1.3 }], 'distance');
    expect(total).toBe(1);
  });

  it('un multiplicateur "finaux" (sans mode) s\'applique dans les deux modes', () => {
    expect(combinerMultiplicateurs([{ type: 'finaux', valeur: 1.5 }], 'distance')).toBeCloseTo(1.5);
    expect(combinerMultiplicateurs([{ type: 'finaux', valeur: 1.5 }], 'melee')).toBeCloseTo(1.5);
  });

  it('Tireur d\'élite : bonus distance + malus mêlée, seul le mode actif compte', () => {
    const multiplicateurs = [
      { type: 'finaux_distance', valeur: 1.15 },
      { type: 'finaux_melee', valeur: 0.8 },
    ];
    expect(combinerMultiplicateurs(multiplicateurs, 'distance')).toBeCloseTo(1.15);
    expect(combinerMultiplicateurs(multiplicateurs, 'melee')).toBeCloseTo(0.8);
  });
});
