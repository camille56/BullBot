import { TradingEngine } from '../trading-engine/trading-engine';
import type { TradingEngineConfig } from '../trading-engine/trading-engine';
import type { RiskLevelsConfig } from '../trading-engine/risk-levels';
import { portfolioValue } from '../trading-engine/portfolio';
import type { RawCandle as Candle } from '../historical-data-fetcher/types';
import { processCandle } from './process-candle';

export interface BacktestConfig {
  smaShortPeriod: number;
  smaLongPeriod: number;
  riskLevels: RiskLevelsConfig;
  tradingEngine: TradingEngineConfig;
  initialCapital: number;
}

type ExitReason = 'STOP_LOSS' | 'TAKE_PROFIT';

export interface BacktestTrade {
  entryTimestamp: number;
  entryPrice: number;
  exitTimestamp: number;
  exitPrice: number;
  quantity: number;
  reason: ExitReason;
  pnl: number;
}

export interface BacktestResult {
  periodStart: number;
  periodEnd: number;
  initialCapital: number;
  finalPnl: number;
  maxDrawdown: number;
  tradeCount: number;
  trades: BacktestTrade[];
}

export function runBacktest(candles: Candle[], config: BacktestConfig): BacktestResult {
  if (candles.length === 0) {
    throw new Error('cannot run a backtest on an empty candle series');
  }

  const minHistory = Math.max(config.smaLongPeriod, config.riskLevels.atrPeriod, config.riskLevels.bollingerPeriod);
  const engine = new TradingEngine(config.initialCapital, config.tradingEngine);
  const trades: BacktestTrade[] = [];
  let pendingEntry: { timestamp: number; price: number } | null = null;

  let peakValue = config.initialCapital;
  let maxDrawdown = 0;

  for (let i = 0; i < candles.length; i++) {
    const currentCandle = candles[i];

    if (i + 1 >= minHistory) {
      const candleWindow = candles.slice(0, i + 1);
      const event = processCandle(engine, candleWindow, config);

      if (event?.type === 'OPENED') {
        pendingEntry = { timestamp: event.timestamp, price: event.entryPrice };
      } else if (event?.type === 'CLOSED' && pendingEntry) {
        trades.push({
          entryTimestamp: pendingEntry.timestamp,
          entryPrice: pendingEntry.price,
          exitTimestamp: event.timestamp,
          exitPrice: event.exitPrice,
          quantity: event.quantity,
          reason: event.reason,
          pnl: (event.exitPrice - pendingEntry.price) * event.quantity,
        });
        pendingEntry = null;
      }
    }

    const currentValue = portfolioValue(engine.portfolio, currentCandle.close);
    peakValue = Math.max(peakValue, currentValue);
    maxDrawdown = Math.max(maxDrawdown, (peakValue - currentValue) / peakValue);
  }

  const finalValue = portfolioValue(engine.portfolio, candles[candles.length - 1].close);

  return {
    periodStart: candles[0].timestamp,
    periodEnd: candles[candles.length - 1].timestamp,
    initialCapital: config.initialCapital,
    finalPnl: finalValue - config.initialCapital,
    maxDrawdown,
    tradeCount: trades.length,
    trades,
  };
}
