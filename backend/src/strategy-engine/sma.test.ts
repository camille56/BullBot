import { describe, it, expect } from 'vitest';
import { calculateSMA, generateSMASignal } from './sma';
import type { PricePoint } from './types';

const toPricePoints = (prices: number[]): PricePoint[] =>
  prices.map((price, i) => ({ price, timestamp: i * 60_000 }));

describe('calculateSMA', () => {
  it('calcul la moyenne mobile sur une entrée de prix', () => {
    const prices = [300, 500, 50, 150, 25, 175];
    const period = 4;
    const result = calculateSMA(prices, period);
    expect(result).toEqual([250, 181.25, 100]);
  });

  it('verifier que la période est non null et differente de 0', () => {
    expect(() => calculateSMA([10, 50], 0)).toThrow();
  });

  it('Renvois un tableau vide quand la valeur de la période est supérieur à la taille de la série', () => {
    const prices = [300, 500];
    const period = 4;
    const result = calculateSMA(prices, period);
    expect(result).toEqual([]);
  });
});

describe('generateSMASignal', () => {
  const periods = { shortPeriod: 2, longPeriod: 3 };

  it('génère un signal BUY quand la SMA courte croise la SMA longue vers le haut', () => {
    const prices = toPricePoints([20, 18, 16, 14, 18, 24]);
    const signal = generateSMASignal(prices, periods);
    expect(signal.type).toBe('BUY');
  });

  it('génère un signal SELL quand la SMA courte croise la SMA longue vers le bas', () => {
    const prices = toPricePoints([18, 20, 22, 24, 20, 14]);
    const signal = generateSMASignal(prices, periods);
    expect(signal.type).toBe('SELL');
  });

  it('génère un signal HOLD en l\'absence de croisement', () => {
    const prices = toPricePoints([20, 18, 16, 14, 18, 24, 28]);
    const signal = generateSMASignal(prices, periods);
    expect(signal.type).toBe('HOLD');
  });

  it('génère un signal HOLD quand la SMA courte et la SMA longue sont exactement égales', () => {
    const prices = toPricePoints([20, 18, 16, 14, 18]);
    const signal = generateSMASignal(prices, periods);
    expect(signal.type).toBe('HOLD');
  });

  it('verifier que la période courte est strictement inférieure à la période longue', () => {
    const prices = toPricePoints([20, 18, 16, 14, 18, 24]);
    expect(() => generateSMASignal(prices, { shortPeriod: 3, longPeriod: 3 })).toThrow();
  });

  it('ne plante pas si la série de prix est plus courte que la période longue', () => {
    const prices = toPricePoints([20, 18]);
    expect(() => generateSMASignal(prices, periods)).not.toThrow();
  });
});
