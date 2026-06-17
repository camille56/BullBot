import { describe, it, expect } from 'vitest';
import { decideTradeAcceptance } from './acceptance-decision';

describe('decideTradeAcceptance', () => {
  const config = { minConfidenceThreshold: 0.3, minNetRiskRewardRatio: 1.5, takerFeeRate: 0.001 };
  const goodSetup = { stopLoss: 95, takeProfit: 110 }; // netRatio ≈ 1.96
  const badRatioSetup = { stopLoss: 95, takeProfit: 100.05 }; // netRatio ≈ -0.03

  it('rejette le trade quand la confidence est sous le seuil minimal', () => {
    const decision = decideTradeAcceptance({
      signal: { confidence: 0.2, price: 100 },
      hasOpenPosition: false,
      ...goodSetup,
      ...config,
    });
    expect(decision.accepted).toBe(false);
    expect(decision.reason).toBe('CONFIDENCE_BELOW_THRESHOLD');
  });

  it('ne rejette pas pour ce motif quand la confidence est exactement au seuil minimal', () => {
    const decision = decideTradeAcceptance({
      signal: { confidence: 0.3, price: 100 },
      hasOpenPosition: false,
      ...goodSetup,
      ...config,
    });
    expect(decision.accepted).toBe(true);
  });

  it('rejette le trade quand une position est déjà ouverte', () => {
    const decision = decideTradeAcceptance({
      signal: { confidence: 0.5, price: 100 },
      hasOpenPosition: true,
      ...goodSetup,
      ...config,
    });
    expect(decision.accepted).toBe(false);
    expect(decision.reason).toBe('POSITION_ALREADY_OPEN');
  });

  it('rejette le trade quand le ratio net est sous le seuil minimal', () => {
    const decision = decideTradeAcceptance({
      signal: { confidence: 0.5, price: 100 },
      hasOpenPosition: false,
      ...badRatioSetup,
      ...config,
    });
    expect(decision.accepted).toBe(false);
    expect(decision.reason).toBe('NET_RATIO_BELOW_THRESHOLD');
    expect(decision.netRatio).toBeCloseTo(-0.03);
  });

  it('accepte le trade quand toutes les conditions sont remplies', () => {
    const decision = decideTradeAcceptance({
      signal: { confidence: 0.5, price: 100 },
      hasOpenPosition: false,
      ...goodSetup,
      ...config,
    });
    expect(decision.accepted).toBe(true);
    expect(decision.netRatio).toBeCloseTo(1.96);
  });

  it('priorise le motif confidence insuffisante sur position déjà ouverte', () => {
    const decision = decideTradeAcceptance({
      signal: { confidence: 0.2, price: 100 },
      hasOpenPosition: true,
      ...goodSetup,
      ...config,
    });
    expect(decision.reason).toBe('CONFIDENCE_BELOW_THRESHOLD');
  });

  it('priorise le motif position déjà ouverte sur ratio net insuffisant', () => {
    const decision = decideTradeAcceptance({
      signal: { confidence: 0.5, price: 100 },
      hasOpenPosition: true,
      ...badRatioSetup,
      ...config,
    });
    expect(decision.reason).toBe('POSITION_ALREADY_OPEN');
  });
});
