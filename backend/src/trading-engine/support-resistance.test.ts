import { describe, it, expect } from 'vitest';
import { findRecentSupport, calculateSupportStopLoss, combineStopLoss } from './support-resistance';
import type { Candle } from './atr';

const toCandles = (lows: number[]): Candle[] =>
  lows.map((low) => ({ high: low + 5, low, close: low + 2 }));

describe('findRecentSupport', () => {
  it('retourne le niveau bas de la bougie pivot la plus récente dans la fenêtre', () => {
    const candles = toCandles([100, 90, 95, 98, 85, 92, 99]);
    const support = findRecentSupport(candles, 5);
    expect(support).toBe(85);
  });

  it('retourne null quand la série est strictement monotone dans la fenêtre', () => {
    const candles = toCandles([80, 85, 90, 95, 100]);
    const support = findRecentSupport(candles, 5);
    expect(support).toBeNull();
  });

  it('retourne null sans erreur quand la série a moins de 3 bougies', () => {
    const candles = toCandles([100, 90]);
    const support = findRecentSupport(candles, 5);
    expect(support).toBeNull();
  });
});

describe('calculateSupportStopLoss', () => {
  it('retourne un niveau légèrement sous le support, proportionnellement à la marge', () => {
    const stopLoss = calculateSupportStopLoss({ support: 85, bufferRatio: 0.01 });
    expect(stopLoss).toBeCloseTo(84.15);
  });
});

describe('combineStopLoss', () => {
  it('retourne le niveau ATR quand il est le plus conservateur (le plus proche de l\'entrée)', () => {
    const result = combineStopLoss({ atrStopLoss: 94, supportStopLoss: 84.15 });
    expect(result).toBe(94);
  });

  it('retourne le niveau support quand il est le plus conservateur (le plus proche de l\'entrée)', () => {
    const result = combineStopLoss({ atrStopLoss: 80, supportStopLoss: 92 });
    expect(result).toBe(92);
  });

  it('retourne le niveau ATR seul quand aucun support n\'est détecté', () => {
    const result = combineStopLoss({ atrStopLoss: 90, supportStopLoss: null });
    expect(result).toBe(90);
  });
});
