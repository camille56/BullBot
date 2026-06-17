import { describe, it, expect } from 'vitest';
import { calculateRSI, generateRSISignal } from './rsi';
import type { PricePoint } from './types';

const toPricePoints = (prices: number[]): PricePoint[] =>
  prices.map((price, i) => ({ price, timestamp: i * 60_000 }));

describe('calculateRSI', () => {
  it('calcul le RSI sur une entrée de prix', () => {
    const prices = [10, 12, 11, 13, 14, 12];
    const period = 3;
    const result = calculateRSI(prices, period);
    expect(result).toEqual([80, 75, 60]);
  });

  it('verifier que la période est non null et differente de 0', () => {
    expect(() => calculateRSI([10, 20], 0)).toThrow();
  });

  it('Renvois un tableau vide quand la valeur de la période est supérieur à la taille de la série', () => {
    const prices = [100, 101, 102];
    const period = 14;
    const result = calculateRSI(prices, period);
    expect(result).toEqual([]);
  });

  it('ne divise jamais par zéro quand tous les prix sont identiques', () => {
    const prices = [50, 50, 50, 50, 50];
    const period = 3;
    const result = calculateRSI(prices, period);
    expect(result).toEqual([50, 50]);
  });
});

describe('generateRSISignal', () => {
  const options = { period: 3, oversold: 30, overbought: 70 };

  it('génère un signal BUY quand le RSI descend sous le seuil de survente', () => {
    const prices = toPricePoints([100, 90, 80, 70]);
    const signal = generateRSISignal(prices, options);
    expect(signal.type).toBe('BUY');
  });

  it('génère un signal SELL quand le RSI dépasse le seuil de surachat', () => {
    const prices = toPricePoints([100, 110, 120, 130]);
    const signal = generateRSISignal(prices, options);
    expect(signal.type).toBe('SELL');
  });

  it('génère un signal HOLD quand le RSI est dans la zone neutre', () => {
    const prices = toPricePoints([100, 101, 100, 101]);
    const signal = generateRSISignal(prices, options);
    expect(signal.type).toBe('HOLD');
  });

  it('génère un signal HOLD quand le RSI est exactement à la borne du seuil de survente', () => {
    const prices = toPricePoints([100, 103, 96]);
    const signal = generateRSISignal(prices, { period: 2, oversold: 30, overbought: 70 });
    expect(signal.type).toBe('HOLD');
  });

  it('ne plante pas si la série de prix est plus courte que la période RSI', () => {
    const prices = toPricePoints([100, 101, 102]);
    expect(() =>
      generateRSISignal(prices, { period: 14, oversold: 30, overbought: 70 })
    ).not.toThrow();
  });
});
