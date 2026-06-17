import type { Candle } from './atr';
import { calculateATR, calculateATRStopLoss } from './atr';
import { findRecentSupport, calculateSupportStopLoss, combineStopLoss } from './support-resistance';
import { findRecentResistance, calculateBollingerBands, combineTakeProfit } from './take-profit';

export interface RiskLevelsConfig {
  atrPeriod: number;
  atrMultiplier: number;
  supportResistanceLookback: number;
  supportBufferRatio: number;
  bollingerPeriod: number;
  bollingerStdDevMultiplier: number;
}

export function computeStopLoss(candles: Candle[], config: RiskLevelsConfig): number {
  const atrSeries = calculateATR(candles, config.atrPeriod);
  if (atrSeries.length === 0) {
    throw new Error(`not enough candles (${candles.length}) for ATR period ${config.atrPeriod}`);
  }

  const entryPrice = candles[candles.length - 1].close;
  const atr = atrSeries[atrSeries.length - 1];
  const atrStopLoss = calculateATRStopLoss({ entryPrice, atr, atrMultiplier: config.atrMultiplier });

  const support = findRecentSupport(candles, config.supportResistanceLookback);
  const supportStopLoss = support !== null ? calculateSupportStopLoss({ support, bufferRatio: config.supportBufferRatio }) : null;

  return combineStopLoss({ atrStopLoss, supportStopLoss });
}

export function computeTakeProfit(candles: Candle[], config: RiskLevelsConfig): number {
  const closes = candles.map((candle) => candle.close);
  const bollingerSeries = calculateBollingerBands(closes, config.bollingerPeriod, config.bollingerStdDevMultiplier);
  if (bollingerSeries.length === 0) {
    throw new Error(`not enough candles (${candles.length}) for Bollinger period ${config.bollingerPeriod}`);
  }

  const bollingerUpper = bollingerSeries[bollingerSeries.length - 1].upper;
  const resistanceLevel = findRecentResistance(candles, config.supportResistanceLookback);

  return combineTakeProfit({ resistanceLevel, bollingerUpper });
}
