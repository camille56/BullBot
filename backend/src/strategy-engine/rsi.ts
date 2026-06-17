import type { PricePoint, StrategySignal } from './types';

export function calculateRSI(prices: number[], period: number): number[] {
  if (period <= 0) {
    throw new Error('period must be a positive integer');
  }

  const deltas: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    deltas.push(prices[i] - prices[i - 1]);
  }

  const result: number[] = [];
  for (let i = period - 1; i < deltas.length; i++) {
    const window = deltas.slice(i - period + 1, i + 1);
    const avgGain = window.reduce((acc, delta) => acc + Math.max(delta, 0), 0) / period;
    const avgLoss = window.reduce((acc, delta) => acc + Math.max(-delta, 0), 0) / period;

    if (avgGain === 0 && avgLoss === 0) {
      result.push(50);
    } else {
      const rs = avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }
  return result;
}

interface RSISignalOptions {
  period: number;
  oversold: number;
  overbought: number;
}

export function generateRSISignal(
  prices: PricePoint[],
  options: RSISignalOptions
): StrategySignal {
  const last = prices[prices.length - 1];
  const rsiValues = calculateRSI(prices.map((p) => p.price), options.period);

  if (rsiValues.length === 0) {
    return { type: 'HOLD', confidence: 0, price: last.price, timestamp: last.timestamp };
  }

  const currentRSI = rsiValues[rsiValues.length - 1];

  if (currentRSI < options.oversold) {
    const confidence = Math.min((options.oversold - currentRSI) / options.oversold, 1);
    return { type: 'BUY', confidence, price: last.price, timestamp: last.timestamp };
  }

  if (currentRSI > options.overbought) {
    const confidence = Math.min(
      (currentRSI - options.overbought) / (100 - options.overbought),
      1
    );
    return { type: 'SELL', confidence, price: last.price, timestamp: last.timestamp };
  }

  return { type: 'HOLD', confidence: 0, price: last.price, timestamp: last.timestamp };
}
