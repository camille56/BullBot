import type { Candle } from './atr';

export function findRecentSupport(candles: Candle[], lookback: number): number | null {
  if (candles.length < 3) {
    return null;
  }

  const start = Math.max(1, candles.length - lookback);
  for (let i = candles.length - 2; i >= start; i--) {
    const low = candles[i].low;
    if (low < candles[i - 1].low && low < candles[i + 1].low) {
      return low;
    }
  }

  return null;
}

interface SupportStopLossParams {
  support: number;
  bufferRatio: number;
}

export function calculateSupportStopLoss(params: SupportStopLossParams): number {
  return params.support * (1 - params.bufferRatio);
}

interface CombineStopLossParams {
  atrStopLoss: number;
  supportStopLoss: number | null;
}

export function combineStopLoss(params: CombineStopLossParams): number {
  const { atrStopLoss, supportStopLoss } = params;
  if (supportStopLoss === null) {
    return atrStopLoss;
  }
  return Math.max(atrStopLoss, supportStopLoss);
}
