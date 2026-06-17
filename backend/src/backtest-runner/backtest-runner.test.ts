import { describe, it, expect } from 'vitest';
import { runBacktest } from './backtest-runner';
import type { BacktestConfig } from './backtest-runner';
import type { RawCandle as Candle } from '../historical-data-fetcher/types';

const ONE_MINUTE = 60_000;

function toCandles(closes: number[]): Candle[] {
  return closes.map((close, i) => ({
    timestamp: i * ONE_MINUTE,
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 100,
  }));
}

function fixtureUptrendScenario(): Candle[] {
  const flatBaseline = Array(6).fill(100);
  const sustainedRise = Array.from({ length: 40 }, (_, i) => 100 + (i + 1) * 3);
  return toCandles([...flatBaseline, ...sustainedRise]);
}

function fixtureFlatScenario(): Candle[] {
  return toCandles(Array(30).fill(100));
}

const CONFIG: BacktestConfig = {
  smaShortPeriod: 3,
  smaLongPeriod: 5,
  // atrMultiplier et bollingerStdDevMultiplier choisis pour que la tendance haussière du
  // fixture produise un net ratio >= minNetRiskRewardRatio (pas des valeurs de production)
  riskLevels: {
    atrPeriod: 5,
    atrMultiplier: 0.5,
    supportResistanceLookback: 5,
    supportBufferRatio: 0.01,
    bollingerPeriod: 5,
    bollingerStdDevMultiplier: 4,
  },
  tradingEngine: {
    minConfidenceThreshold: 0.3,
    minNetRiskRewardRatio: 1.5,
    takerFeeRate: 0.001,
    minPositionSize: 0.02,
    maxPositionSize: 0.1,
    trailingActivationRatio: 0.5,
  },
  initialCapital: 10_000,
};

describe('runBacktest', () => {
  it('lève une erreur sur une série de bougies vide', () => {
    expect(() => runBacktest([], CONFIG)).toThrow();
  });

  it("ne prend aucun trade sur un marché plat (aucun croisement SMA)", () => {
    const result = runBacktest(fixtureFlatScenario(), CONFIG);

    expect(result.tradeCount).toBe(0);
    expect(result.trades).toEqual([]);
    expect(result.finalPnl).toBe(0);
    expect(result.maxDrawdown).toBe(0);
  });

  it('ne plante pas avec moins de bougies que l\'historique minimal requis', () => {
    const result = runBacktest(toCandles([100, 101, 102]), CONFIG);

    expect(result.tradeCount).toBe(0);
  });

  it('prend au moins un trade sur une tendance haussière soutenue et calcule un P&L cohérent', () => {
    const result = runBacktest(fixtureUptrendScenario(), CONFIG);

    expect(result.tradeCount).toBeGreaterThan(0);
    expect(result.trades).toHaveLength(result.tradeCount);

    for (const trade of result.trades) {
      expect(trade.exitTimestamp).toBeGreaterThan(trade.entryTimestamp);
      expect(trade.quantity).toBeGreaterThan(0);
      expect(['STOP_LOSS', 'TAKE_PROFIT']).toContain(trade.reason);
    }

    // Tendance haussière soutenue -> au moins un trade gagnant attendu
    expect(result.trades.some((trade) => trade.pnl > 0)).toBe(true);
    expect(result.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(result.periodStart).toBe(0);
    expect(result.periodEnd).toBe((fixtureUptrendScenario().length - 1) * ONE_MINUTE);
  });
});
