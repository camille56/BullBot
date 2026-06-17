import { describe, it, expect } from 'vitest';
import { calculateMACD, generateMACDSignal } from './macd';
import type { PricePoint } from './types';

const toPricePoints = (prices: number[]): PricePoint[] =>
  prices.map((price, i) => ({ price, timestamp: i * 60_000 }));

const periods = { fastPeriod: 2, slowPeriod: 3, signalPeriod: 2 };

describe('calculateMACD', () => {
  it('calcul la ligne MACD, la ligne de signal et l\'histogramme sur une entrée de prix', () => {
    const prices = [10, 12, 14, 16, 18, 20];
    const result = calculateMACD(prices, periods);
    expect(result).toEqual([
      { macd: 1, signal: 1, histogram: 0 },
      { macd: 1, signal: 1, histogram: 0 },
      { macd: 1, signal: 1, histogram: 0 },
    ]);
  });

  it('verifier que la période rapide est strictement inférieure à la période lente', () => {
    const prices = [10, 12, 14, 16, 18, 20];
    expect(() =>
      calculateMACD(prices, { fastPeriod: 3, slowPeriod: 3, signalPeriod: 2 })
    ).toThrow();
  });

  it('Renvois un tableau vide quand la série est plus courte que la période lente additionnée à la période de signal', () => {
    const prices = [10, 12, 14];
    const result = calculateMACD(prices, periods);
    expect(result).toEqual([]);
  });

  it('ne divise jamais par zéro quand tous les prix sont identiques', () => {
    const prices = [50, 50, 50, 50, 50, 50];
    const result = calculateMACD(prices, periods);
    expect(result).toEqual([
      { macd: 0, signal: 0, histogram: 0 },
      { macd: 0, signal: 0, histogram: 0 },
      { macd: 0, signal: 0, histogram: 0 },
    ]);
  });
});

describe('generateMACDSignal', () => {
  it('génère un signal BUY quand la ligne MACD croise la ligne de signal vers le haut', () => {
    const prices = toPricePoints([20, 18, 16, 14, 16]);
    const signal = generateMACDSignal(prices, periods);
    expect(signal.type).toBe('BUY');
  });

  it('génère un signal SELL quand la ligne MACD croise la ligne de signal vers le bas', () => {
    const prices = toPricePoints([14, 16, 18, 20, 18]);
    const signal = generateMACDSignal(prices, periods);
    expect(signal.type).toBe('SELL');
  });

  it('génère un signal HOLD en l\'absence de croisement', () => {
    const prices = toPricePoints([20, 18, 16, 14, 16, 20]);
    const signal = generateMACDSignal(prices, periods);
    expect(signal.type).toBe('HOLD');
  });

  it('génère un signal HOLD quand la ligne MACD et la ligne de signal sont exactement égales', () => {
    const prices = toPricePoints([20, 18, 16, 14]);
    const signal = generateMACDSignal(prices, periods);
    expect(signal.type).toBe('HOLD');
  });

  it('ne plante pas si la série de prix est plus courte que la période nécessaire', () => {
    const prices = toPricePoints([20, 18]);
    expect(() => generateMACDSignal(prices, periods)).not.toThrow();
  });
});
