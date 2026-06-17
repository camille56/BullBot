import { describe, it, expect } from 'vitest';
import { LiveTradingSession } from './live-trading-session';
import type { LiveTradingSessionConfig } from './live-trading-session';
import type { CandleEvent } from '../backtest-runner/process-candle';
import type { PriceFeed } from './types';
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

class FakePriceFeed implements PriceFeed {
  private callback: ((candle: Candle) => void) | null = null;

  onPrice(callback: (candle: Candle) => void): void {
    this.callback = callback;
  }

  emit(candle: Candle): void {
    this.callback?.(candle);
  }
}

const CONFIG: LiveTradingSessionConfig = {
  smaShortPeriod: 3,
  smaLongPeriod: 5,
  // mêmes valeurs que backtest-runner.test.ts, tunées pour produire un trade accepté
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

describe('LiveTradingSession', () => {
  it('ne réagit pas tant que l\'historique minimal n\'est pas atteint', () => {
    const priceFeed = new FakePriceFeed();
    const events: CandleEvent[] = [];
    const session = new LiveTradingSession(priceFeed, CONFIG, (e) => events.push(e));
    session.start();

    toCandles([100, 101, 102]).forEach((candle) => priceFeed.emit(candle));

    expect(events).toEqual([]);
    expect(session.portfolio.position).toBeNull();
  });

  it('fait tourner le même Strategy/Trading Engine que le BacktestRunner, bougie par bougie', () => {
    const priceFeed = new FakePriceFeed();
    const events: CandleEvent[] = [];
    const session = new LiveTradingSession(priceFeed, CONFIG, (e) => events.push(e));
    session.start();

    fixtureUptrendScenario().forEach((candle) => priceFeed.emit(candle));

    const opened = events.filter((e) => e.type === 'OPENED');
    const closed = events.filter((e) => e.type === 'CLOSED');

    expect(opened).toHaveLength(1);
    expect(closed).toHaveLength(1);
    expect(closed[0]).toMatchObject({ reason: 'TAKE_PROFIT' });
    expect(session.portfolio.position).toBeNull();
    expect(session.portfolio.cashBalance).toBeGreaterThan(CONFIG.initialCapital);
  });
});
