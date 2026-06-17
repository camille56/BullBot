import { calculateSMA } from '../strategy-engine/sma';
import type { Candle } from './atr';

export function findRecentResistance(candles: Candle[], lookback: number): number | null {
  if (candles.length < 3) {
    return null;
  }

  const start = Math.max(1, candles.length - lookback);
  for (let i = candles.length - 2; i >= start; i--) {
    const high = candles[i].high;
    if (high > candles[i - 1].high && high > candles[i + 1].high) {
      return high;
    }
  }

  return null;
}

interface BollingerBand {
  middle: number;
  upper: number;
  lower: number;
}

export function calculateBollingerBands(
  prices: number[],
  period: number,
  stdDevMultiplier: number
): BollingerBand[] {
  if (period <= 0) {
    throw new Error('period must be a positive integer');
  }

  const middleValues = calculateSMA(prices, period);

  return middleValues.map((middle, i) => {
    const window = prices.slice(i, i + period);
    const variance = window.reduce((acc, price) => acc + (price - middle) ** 2, 0) / period;
    const stdDev = Math.sqrt(variance);

    return {
      middle,
      upper: middle + stdDevMultiplier * stdDev,
      lower: middle - stdDevMultiplier * stdDev,
    };
  });
}

interface CombineTakeProfitParams {
  resistanceLevel: number | null;
  bollingerUpper: number;
}

export function combineTakeProfit(params: CombineTakeProfitParams): number {
  const { resistanceLevel, bollingerUpper } = params;
  if (resistanceLevel === null) {
    return bollingerUpper;
  }
  return Math.min(resistanceLevel, bollingerUpper);
}
