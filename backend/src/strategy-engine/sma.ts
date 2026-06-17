import type { PricePoint, StrategySignal } from './types';

export function calculateSMA(prices: number[], period: number): number[] {
  if (period <= 0) {
    throw new Error('period must be a positive integer');
  }

  const result: number[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    const window = prices.slice(i - period + 1, i + 1);
    const sum = window.reduce((acc, price) => acc + price, 0);
    result.push(sum / period);
  }
  return result;
}

interface SMASignalPeriods {
  shortPeriod: number;
  longPeriod: number;
}

export function generateSMASignal(prices: PricePoint[], periods: SMASignalPeriods): StrategySignal {
  const { shortPeriod, longPeriod } = periods;
  if (shortPeriod >= longPeriod) {
    throw new Error('shortPeriod must be strictly smaller than longPeriod');
  }

  const last = prices[prices.length - 1];
  const rawPrices = prices.map((p) => p.price);
  const shortSMA = calculateSMA(rawPrices, shortPeriod);
  const longSMA = calculateSMA(rawPrices, longPeriod);

  if (longSMA.length < 2) {
    return { type: 'HOLD', confidence: 0, price: last.price, timestamp: last.timestamp };
  }

  const offset = longPeriod - shortPeriod;
  const diff = longSMA.map((longValue, i) => shortSMA[i + offset] - longValue);

  const current = diff[diff.length - 1];
  const previous = diff[diff.length - 2];

  if (previous <= 0 && current > 0) {
    return { type: 'BUY', confidence: Math.min(Math.abs(current), 1), price: last.price, timestamp: last.timestamp };
  }

  if (previous >= 0 && current < 0) {
    return { type: 'SELL', confidence: Math.min(Math.abs(current), 1), price: last.price, timestamp: last.timestamp };
  }

  return { type: 'HOLD', confidence: 0, price: last.price, timestamp: last.timestamp };
}
