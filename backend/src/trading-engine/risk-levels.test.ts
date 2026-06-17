import { describe, it, expect } from 'vitest';
import { computeStopLoss, computeTakeProfit } from './risk-levels';
import type { Candle } from './atr';

function generateCandles(closes: number[]): Candle[] {
  return closes.map((close) => ({ high: close + 3, low: close - 3, close }));
}

const RISK_CONFIG = {
  atrPeriod: 14,
  atrMultiplier: 1.5,
  supportResistanceLookback: 10,
  supportBufferRatio: 0.01,
  bollingerPeriod: 20,
  bollingerStdDevMultiplier: 2,
};

describe('computeStopLoss', () => {
  it('combine ATR et support détecté, en retenant le plus prudent (le plus proche du prix)', () => {
    // Plateau à 100 puis creux net à 95 (support) suivi d'une remontée -> support proche du prix d'entrée
    const closes = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 95, 100, 100, 100, 100, 100, 100, 100, 100, 100];
    const candles = generateCandles(closes);

    const stopLoss = computeStopLoss(candles, RISK_CONFIG);

    // Le support (95 * (1 - 0.01) = 94.05) doit dominer un ATR très large sur un plateau quasi plat
    expect(stopLoss).toBeGreaterThan(90);
    expect(stopLoss).toBeLessThan(95);
  });

  it('retombe sur le stop-loss ATR seul si aucun support n\'est détecté', () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i * 0.1);
    const candles = generateCandles(closes);

    const stopLoss = computeStopLoss(candles, RISK_CONFIG);

    expect(stopLoss).toBeLessThan(candles[candles.length - 1].close);
  });

  it('lève une erreur explicite si l\'historique est insuffisant pour la période ATR configurée', () => {
    const candles = generateCandles([100, 101, 102]);

    expect(() => computeStopLoss(candles, RISK_CONFIG)).toThrow();
  });
});

describe('computeTakeProfit', () => {
  it('combine résistance détectée et bande de Bollinger haute, en retenant le plus prudent (le plus proche du prix)', () => {
    // Plateau à 100 puis pic net à 105 (résistance) suivi d'une rechute -> résistance proche du prix
    const closes = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 105, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100];
    const candles = generateCandles(closes);

    const takeProfit = computeTakeProfit(candles, RISK_CONFIG);

    expect(takeProfit).toBeGreaterThan(100);
    expect(takeProfit).toBeLessThan(105);
  });

  it('lève une erreur explicite si l\'historique est insuffisant pour la période Bollinger configurée', () => {
    const candles = generateCandles([100, 101, 102]);

    expect(() => computeTakeProfit(candles, RISK_CONFIG)).toThrow();
  });
});
