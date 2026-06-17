import { describe, it, expect } from 'vitest';
import { calculateNetRiskRewardRatio } from './risk-reward';

describe('calculateNetRiskRewardRatio', () => {
  it('calcul le ratio net (récompense nette des frais / risque)', () => {
    const ratio = calculateNetRiskRewardRatio({
      entryPrice: 100,
      stopLoss: 95,
      takeProfit: 110,
      takerFeeRate: 0.001,
    });
    expect(ratio).toBeCloseTo(1.96);
  });

  it('verifier que le stop-loss est strictement inférieur au prix d\'entrée', () => {
    expect(() =>
      calculateNetRiskRewardRatio({
        entryPrice: 100,
        stopLoss: 100,
        takeProfit: 110,
        takerFeeRate: 0.001,
      })
    ).toThrow();
  });

  it('retourne un ratio net négatif sans erreur quand les frais dépassent la récompense brute', () => {
    const ratio = calculateNetRiskRewardRatio({
      entryPrice: 100,
      stopLoss: 95,
      takeProfit: 100.05,
      takerFeeRate: 0.001,
    });
    expect(ratio).toBeCloseTo(-0.03);
  });
});
