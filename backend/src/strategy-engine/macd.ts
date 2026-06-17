import type { PricePoint, StrategySignal } from './types';

interface MACDPeriods {
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
}

interface MACDPoint {
  macd: number;
  signal: number;
  histogram: number;
}

function mean(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function ema(values: number[], period: number): number[] {
  if (values.length < period) {
    return [];
  }

  const k = 2 / (period + 1);
  const result: number[] = [mean(values.slice(0, period))];
  for (let i = period; i < values.length; i++) {
    const prev = result[result.length - 1];
    result.push(values[i] * k + prev * (1 - k));
  }
  return result;
}

export function calculateMACD(prices: number[], periods: MACDPeriods): MACDPoint[] {
  const { fastPeriod, slowPeriod, signalPeriod } = periods;
  if (fastPeriod >= slowPeriod) {
    throw new Error('fastPeriod must be strictly smaller than slowPeriod');
  }

  const fastEMA = ema(prices, fastPeriod);
  const slowEMA = ema(prices, slowPeriod);
  if (slowEMA.length === 0) {
    return [];
  }

  const offset = slowPeriod - fastPeriod;
  const macdLine = slowEMA.map((slowValue, i) => fastEMA[i + offset] - slowValue);

  const signalLine = ema(macdLine, signalPeriod);
  if (signalLine.length === 0) {
    return [];
  }

  return signalLine.map((signalValue, i) => {
    const macdValue = macdLine[i + signalPeriod - 1];
    return { macd: macdValue, signal: signalValue, histogram: macdValue - signalValue };
  });
}

export function generateMACDSignal(prices: PricePoint[], periods: MACDPeriods): StrategySignal {
  const last = prices[prices.length - 1];
  const macdValues = calculateMACD(prices.map((p) => p.price), periods);

  if (macdValues.length < 2) {
    return { type: 'HOLD', confidence: 0, price: last.price, timestamp: last.timestamp };
  }

  const current = macdValues[macdValues.length - 1];
  const previous = macdValues[macdValues.length - 2];

  if (previous.histogram <= 0 && current.histogram > 0) {
    return {
      type: 'BUY',
      confidence: Math.min(Math.abs(current.histogram), 1),
      price: last.price,
      timestamp: last.timestamp,
    };
  }

  if (previous.histogram >= 0 && current.histogram < 0) {
    return {
      type: 'SELL',
      confidence: Math.min(Math.abs(current.histogram), 1),
      price: last.price,
      timestamp: last.timestamp,
    };
  }

  return { type: 'HOLD', confidence: 0, price: last.price, timestamp: last.timestamp };
}
