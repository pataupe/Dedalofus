import { describe, it, expect } from 'vitest';
const { parseValeurBoost, construireBoost, valeurBoostParDefaut, clamperValeurBoost } = require('./boosts');

describe('parseValeurBoost', () => {
  it('renvoie null pour une valeur vide ou absente', () => {
    expect(parseValeurBoost('')).toBeNull();
    expect(parseValeurBoost(null)).toBeNull();
    expect(parseValeurBoost(undefined)).toBeNull();
  });

  it('parse un nombre simple sans suffixe', () => {
    expect(parseValeurBoost('0')).toEqual({ valeur: 0, prefixe: '', suffixe: '' });
  });

  it('parse "nombre puis unité" avec espace', () => {
    expect(parseValeurBoost('10 soins')).toEqual({ valeur: 10, prefixe: '', suffixe: ' soins' });
  });

  it('parse "nombre puis unité" sans espace', () => {
    expect(parseValeurBoost('3PA')).toEqual({ valeur: 3, prefixe: '', suffixe: 'PA' });
  });

  it('parse un pourcentage avec suffixe texte', () => {
    expect(parseValeurBoost('30% critique')).toEqual({ valeur: 30, prefixe: '', suffixe: '% critique' });
  });

  it('parse une décimale à virgule (format français)', () => {
    expect(parseValeurBoost('0,1')).toEqual({ valeur: 0.1, prefixe: '', suffixe: '' });
  });

  it('parse un multiplicateur de dommages finaux', () => {
    expect(parseValeurBoost('dommages finaux x1.5')).toEqual({
      valeur: 1.5,
      prefixe: 'dommages finaux x',
      suffixe: '',
    });
  });

  it('parse un multiplicateur de dommages finaux distance/mêlée', () => {
    expect(parseValeurBoost('dommages finaux distance x1.6')).toEqual({
      valeur: 1.6,
      prefixe: 'dommages finaux distance x',
      suffixe: '',
    });
  });

  it('renvoie valeur null pour un texte composite sans nombre en tête', () => {
    expect(parseValeurBoost('+20 Retrait PA + 20 Retrait PM')).toEqual({ valeur: null, prefixe: '', suffixe: '' });
  });
});

describe('valeurBoostParDefaut', () => {
  it('renvoie null si la breloque n\'a pas de bonus conditionnel', () => {
    expect(valeurBoostParDefaut({ type_input: null })).toBeNull();
  });

  it('toggle désactivé par défaut ("0")', () => {
    expect(valeurBoostParDefaut({ type_input: 'toggle', bonus_defaut_texte: '0' })).toBe(0);
  });

  it('toggle activé par défaut (texte non "0")', () => {
    expect(valeurBoostParDefaut({ type_input: 'toggle', bonus_defaut_texte: '2 PA' })).toBe(1);
  });

  it('range utilise le nombre de la colonne "défaut"', () => {
    expect(
      valeurBoostParDefaut({ type_input: 'range', bonus_defaut_texte: 'dommages finaux x1.1', bonus_min_texte: 'dommages finaux x1.1' })
    ).toBe(1.1);
  });

  it('range retombe sur le minimum si "défaut" est vide', () => {
    expect(valeurBoostParDefaut({ type_input: 'range', bonus_defaut_texte: '', bonus_min_texte: '0' })).toBe(0);
  });
});

describe('clamperValeurBoost', () => {
  it('toggle : toute valeur truthy devient 1, falsy devient 0', () => {
    expect(clamperValeurBoost({ type_input: 'toggle' }, 1)).toBe(1);
    expect(clamperValeurBoost({ type_input: 'toggle' }, 0)).toBe(0);
    expect(clamperValeurBoost({ type_input: 'toggle' }, 5)).toBe(1);
  });

  it('range : borne dans [min, max]', () => {
    const breloque = { type_input: 'range', bonus_min_texte: '0', bonus_max_texte: '30 soins' };
    expect(clamperValeurBoost(breloque, 15)).toBe(15);
    expect(clamperValeurBoost(breloque, -5)).toBe(0);
    expect(clamperValeurBoost(breloque, 999)).toBe(30);
  });

  it('valeur non numérique -> 0', () => {
    expect(clamperValeurBoost({ type_input: 'range', bonus_min_texte: '0', bonus_max_texte: '10' }, 'abc')).toBe(0);
  });
});

describe('construireBoost', () => {
  it('renvoie null si pas de bonus conditionnel', () => {
    expect(construireBoost({ type_input: null }, null)).toBeNull();
  });

  it('toggle', () => {
    const boost = construireBoost({ type_input: 'toggle', bonus_max_texte: 'dommages finaux distance x1.6' }, 1);
    expect(boost).toEqual({ type: 'toggle', actif: true, texteActif: 'dommages finaux distance x1.6' });
  });

  it('range avec suffixe', () => {
    const boost = construireBoost(
      { type_input: 'range', bonus_min_texte: '0', bonus_increment_texte: '10 soins', bonus_max_texte: '30 soins' },
      10
    );
    expect(boost).toEqual({ type: 'range', min: 0, max: 30, increment: 10, valeur: 10, prefixe: '', suffixe: ' soins' });
  });

  it('range avec préfixe (multiplicateur de dommages)', () => {
    const boost = construireBoost(
      {
        type_input: 'range',
        bonus_min_texte: 'dommages finaux x1.1',
        bonus_increment_texte: '0,1',
        bonus_max_texte: 'dommages finaux x1.4',
      },
      1.2
    );
    expect(boost).toEqual({
      type: 'range',
      min: 1.1,
      max: 1.4,
      increment: 0.1,
      valeur: 1.2,
      prefixe: 'dommages finaux x',
      suffixe: '',
    });
  });
});
