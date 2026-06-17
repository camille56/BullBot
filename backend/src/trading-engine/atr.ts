export interface Candle {
  high: number;
  low: number;
  close: number;
}

export function calculateATR(candles: Candle[], period: number): number[] {
  if (period <= 0) {
    throw new Error('period must be a positive integer');
  }

  const trueRanges = candles.map((candle, i) => {
    if (i === 0) {
      return candle.high - candle.low;
    }
    const prevClose = candles[i - 1].close;
    return Math.max(
      candle.high - candle.low,
      Math.abs(candle.high - prevClose),
      Math.abs(candle.low - prevClose)
    );
  });

  const result: number[] = [];
  for (let i = period - 1; i < trueRanges.length; i++) {
    const window = trueRanges.slice(i - period + 1, i + 1);
    const sum = window.reduce((acc, tr) => acc + tr, 0);
    result.push(sum / period);
  }
  return result;
}

interface ATRStopLossParams {
  entryPrice: number;
  atr: number;
  atrMultiplier: number;
}

export function calculateATRStopLoss(params: ATRStopLossParams): number {
  return params.entryPrice - params.atrMultiplier * params.atr;
}
