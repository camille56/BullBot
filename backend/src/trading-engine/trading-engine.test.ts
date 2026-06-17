import { describe, it, expect } from 'vitest';
import { TradingEngine } from './trading-engine';
import type { TradingEngineConfig } from './trading-engine';

const CONFIG: TradingEngineConfig = {
  minConfidenceThreshold: 0.3,
  minNetRiskRewardRatio: 1.5,
  takerFeeRate: 0.001,
  minPositionSize: 0.02,
  maxPositionSize: 0.1,
  trailingActivationRatio: 0.5,
};

describe('TradingEngine.evaluateSignal', () => {
  it('refuse un signal sous le seuil de confiance minimal', () => {
    const engine = new TradingEngine(10_000, CONFIG);

    const result = engine.evaluateSignal({ signal: { confidence: 0.1, price: 100 }, stopLoss: 95, takeProfit: 110 });

    expect(result).toEqual({ accepted: false, reason: 'CONFIDENCE_BELOW_THRESHOLD' });
    expect(engine.portfolio.position).toBeNull();
  });

  it('refuse un signal si une position est déjà ouverte', () => {
    const engine = new TradingEngine(10_000, CONFIG);
    engine.evaluateSignal({ signal: { confidence: 0.9, price: 100 }, stopLoss: 95, takeProfit: 110 });

    const result = engine.evaluateSignal({ signal: { confidence: 0.9, price: 101 }, stopLoss: 96, takeProfit: 111 });

    expect(result).toEqual({ accepted: false, reason: 'POSITION_ALREADY_OPEN' });
  });

  it('refuse un signal sous le ratio risque/récompense net minimal', () => {
    const engine = new TradingEngine(10_000, CONFIG);

    // risque=5, récompense brute=2 -> ratio net largement < 1.5
    const result = engine.evaluateSignal({ signal: { confidence: 0.9, price: 100 }, stopLoss: 95, takeProfit: 102 });

    expect(result).toEqual({ accepted: false, reason: 'NET_RATIO_BELOW_THRESHOLD', netRatio: expect.any(Number) });
  });

  it('accepte un signal valide, ouvre une position dimensionnée selon la confiance', () => {
    const engine = new TradingEngine(10_000, CONFIG);

    const result = engine.evaluateSignal({ signal: { confidence: 1, price: 100 }, stopLoss: 90, takeProfit: 130 });

    expect(result.accepted).toBe(true);
    // confidence=1 -> taille de position = maxPositionSize = 10% du cash
    expect(engine.portfolio.position).toEqual({ quantity: 10, avgEntryPrice: 100, stopLoss: 90, takeProfit: 130 });
    expect(engine.portfolio.cashBalance).toBe(9_000);
  });
});

describe('TradingEngine.evaluatePriceUpdate', () => {
  function openEngineWithPosition(): TradingEngine {
    const engine = new TradingEngine(10_000, CONFIG);
    engine.evaluateSignal({ signal: { confidence: 1, price: 100 }, stopLoss: 90, takeProfit: 130 });
    return engine;
  }

  it('ne fait rien tant qu\'aucune position n\'est ouverte', () => {
    const engine = new TradingEngine(10_000, CONFIG);

    const result = engine.evaluatePriceUpdate(100, 95);

    expect(result).toBeNull();
  });

  it('clôture la position au prix du stop-loss si le prix le touche', () => {
    const engine = openEngineWithPosition();

    const result = engine.evaluatePriceUpdate(89, 89);

    expect(result).toEqual({ exitPrice: 90, quantity: 10, reason: 'STOP_LOSS' });
    expect(engine.portfolio.position).toBeNull();
  });

  it('clôture la position au prix du take-profit si le prix l\'atteint', () => {
    const engine = openEngineWithPosition();

    const result = engine.evaluatePriceUpdate(131, 120);

    expect(result).toEqual({ exitPrice: 130, quantity: 10, reason: 'TAKE_PROFIT' });
    expect(engine.portfolio.position).toBeNull();
  });

  it('relève le trailing stop une fois le seuil d\'activation atteint, sans clôturer', () => {
    const engine = openEngineWithPosition();
    // progress vers le take-profit = (115-100)/(130-100) = 0.5 -> active le trailing
    const result = engine.evaluatePriceUpdate(115, 105);

    expect(result).toBeNull();
    expect(engine.portfolio.position?.stopLoss).toBe(105);
  });

  it('ne redescend jamais le trailing stop', () => {
    const engine = openEngineWithPosition();
    engine.evaluatePriceUpdate(115, 105);

    const result = engine.evaluatePriceUpdate(116, 95);

    expect(result).toBeNull();
    expect(engine.portfolio.position?.stopLoss).toBe(105);
  });
});
