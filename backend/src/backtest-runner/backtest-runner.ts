import { generateSMASignal } from '../strategy-engine/sma';
import type { PricePoint } from '../strategy-engine/types';
import { TradingEngine } from '../trading-engine/trading-engine';
import type { TradingEngineConfig } from '../trading-engine/trading-engine';
import { computeStopLoss, computeTakeProfit } from '../trading-engine/risk-levels';
import type { RiskLevelsConfig } from '../trading-engine/risk-levels';
import { portfolioValue } from '../trading-engine/portfolio';
import type { RawCandle as Candle } from '../historical-data-fetcher/types';

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

      if (engine.portfolio.position === null) {
        const pricePoints: PricePoint[] = candleWindow.map((c) => ({ price: c.close, timestamp: c.timestamp }));
        const signal = generateSMASignal(pricePoints, {
          shortPeriod: config.smaShortPeriod,
          longPeriod: config.smaLongPeriod,
        });

        if (signal.type === 'BUY') {
          const stopLoss = computeStopLoss(candleWindow, config.riskLevels);
          const takeProfit = computeTakeProfit(candleWindow, config.riskLevels);
          const decision = engine.evaluateSignal({
            signal: { confidence: signal.confidence, price: signal.price },
            stopLoss,
            takeProfit,
          });

          if (decision.accepted) {
            pendingEntry = { timestamp: currentCandle.timestamp, price: decision.entryPrice };
          }
        }
      } else {
        const candidateStopLoss = computeStopLoss(candleWindow, config.riskLevels);
        const closed = engine.evaluatePriceUpdate(currentCandle.close, candidateStopLoss);

        if (closed && pendingEntry) {
          trades.push({
            entryTimestamp: pendingEntry.timestamp,
            entryPrice: pendingEntry.price,
            exitTimestamp: currentCandle.timestamp,
            exitPrice: closed.exitPrice,
            quantity: closed.quantity,
            reason: closed.reason,
            pnl: (closed.exitPrice - pendingEntry.price) * closed.quantity,
          });
          pendingEntry = null;
        }
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
