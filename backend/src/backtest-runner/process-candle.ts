import { generateSMASignal } from '../strategy-engine/sma';
import type { PricePoint } from '../strategy-engine/types';
import { TradingEngine } from '../trading-engine/trading-engine';
import type { RejectionReason } from '../trading-engine/trading-engine';
import { computeStopLoss, computeTakeProfit } from '../trading-engine/risk-levels';
import type { RiskLevelsConfig } from '../trading-engine/risk-levels';
import type { RawCandle as Candle } from '../historical-data-fetcher/types';

export interface ProcessCandleConfig {
  smaShortPeriod: number;
  smaLongPeriod: number;
  riskLevels: RiskLevelsConfig;
}

type ExitReason = 'STOP_LOSS' | 'TAKE_PROFIT';

export type CandleEvent =
  | { type: 'OPENED'; timestamp: number; entryPrice: number; quantity: number; stopLoss: number; takeProfit: number }
  | { type: 'CLOSED'; timestamp: number; exitPrice: number; quantity: number; reason: ExitReason }
  | { type: 'REJECTED'; timestamp: number; reason: RejectionReason };

/**
 * Logique "une bougie -> décision" partagée entre BacktestRunner et LiveTradingSession :
 * c'est ce qui garantit que backtest et live font tourner exactement le même Strategy/Trading Engine.
 */
export function processCandle(engine: TradingEngine, candleWindow: Candle[], config: ProcessCandleConfig): CandleEvent | null {
  const currentCandle = candleWindow[candleWindow.length - 1];

  if (engine.portfolio.position === null) {
    const pricePoints: PricePoint[] = candleWindow.map((c) => ({ price: c.close, timestamp: c.timestamp }));
    const signal = generateSMASignal(pricePoints, {
      shortPeriod: config.smaShortPeriod,
      longPeriod: config.smaLongPeriod,
    });

    if (signal.type !== 'BUY') {
      return null;
    }

    const stopLoss = computeStopLoss(candleWindow, config.riskLevels);
    const takeProfit = computeTakeProfit(candleWindow, config.riskLevels);
    const decision = engine.evaluateSignal({
      signal: { confidence: signal.confidence, price: signal.price },
      stopLoss,
      takeProfit,
    });

    if (!decision.accepted) {
      return { type: 'REJECTED', timestamp: currentCandle.timestamp, reason: decision.reason };
    }

    return {
      type: 'OPENED',
      timestamp: currentCandle.timestamp,
      entryPrice: decision.entryPrice,
      quantity: decision.quantity,
      stopLoss: decision.stopLoss,
      takeProfit: decision.takeProfit,
    };
  }

  const candidateStopLoss = computeStopLoss(candleWindow, config.riskLevels);
  const closed = engine.evaluatePriceUpdate(currentCandle.close, candidateStopLoss);

  if (!closed) {
    return null;
  }

  return {
    type: 'CLOSED',
    timestamp: currentCandle.timestamp,
    exitPrice: closed.exitPrice,
    quantity: closed.quantity,
    reason: closed.reason,
  };
}
