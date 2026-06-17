import { describe, it, expect } from 'vitest';
import { findRecentResistance, calculateBollingerBands, combineTakeProfit } from './take-profit';
import type { Candle } from './atr';

const toCandles = (highs: number[]): Candle[] =>
  highs.map((high) => ({ high, low: high - 5, close: high - 2 }));

describe('findRecentResistance', () => {
  it('retourne le niveau haut de la bougie pivot la plus récente dans la fenêtre', () => {
    const candles = toCandles([100, 110, 105, 102, 115, 108, 101]);
    const resistance = findRecentResistance(candles, 5);
    expect(resistance).toBe(115);
  });

  it('retourne null quand la série est strictement monotone dans la fenêtre', () => {
    const candles = toCandles([100, 105, 110, 115, 120]);
    const resistance = findRecentResistance(candles, 5);
    expect(resistance).toBeNull();
  });

  it('retourne null sans erreur quand la série a moins de 3 bougies', () => {
    const candles = toCandles([100, 110]);
    const resistance = findRecentResistance(candles, 5);
    expect(resistance).toBeNull();
  });
});

describe('calculateBollingerBands', () => {
  it('calcul la bande médiane, la bande haute et la bande basse', () => {
    const prices = [10, 12, 14, 16, 18];
    const result = calculateBollingerBands(prices, 3, 2);
    const expectedSpread = 2 * Math.sqrt(8 / 3);

    expect(result).toHaveLength(3);
    expect(result[0].middle).toBeCloseTo(12);
    expect(result[0].upper).toBeCloseTo(12 + expectedSpread);
    expect(result[0].lower).toBeCloseTo(12 - expectedSpread);
    expect(result[2].middle).toBeCloseTo(16);
    expect(result[2].upper).toBeCloseTo(16 + expectedSpread);
  });

  it('verifier que la période est non null et differente de 0', () => {
    expect(() => calculateBollingerBands([10, 12, 14], 0, 2)).toThrow();
  });

  it('Renvois un tableau vide quand la valeur de la période est supérieur à la taille de la série', () => {
    const result = calculateBollingerBands([10, 12], 3, 2);
    expect(result).toEqual([]);
  });

  it('ne divise jamais par zéro quand tous les prix sont identiques', () => {
    const result = calculateBollingerBands([50, 50, 50, 50, 50], 3, 2);
    expect(result).toEqual([
      { middle: 50, upper: 50, lower: 50 },
      { middle: 50, upper: 50, lower: 50 },
      { middle: 50, upper: 50, lower: 50 },
    ]);
  });
});

describe('combineTakeProfit', () => {
  it('retourne la résistance quand elle est l\'objectif le plus proche', () => {
    const result = combineTakeProfit({ resistanceLevel: 120, bollingerUpper: 130 });
    expect(result).toBe(120);
  });

  it('retourne la bande de Bollinger haute quand elle est l\'objectif le plus proche', () => {
    const result = combineTakeProfit({ resistanceLevel: 140, bollingerUpper: 125 });
    expect(result).toBe(125);
  });

  it('retourne la bande de Bollinger haute seule quand aucune résistance n\'est détectée', () => {
    const result = combineTakeProfit({ resistanceLevel: null, bollingerUpper: 130 });
    expect(result).toBe(130);
  });
});
