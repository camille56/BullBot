import { describe, it, expect } from 'vitest';
import { evaluatePartialExit } from './partial-exit';

describe('evaluatePartialExit', () => {
  const firstTakeProfitLevel = 110;
  const partialExitRatio = 0.5;

  it('ne déclenche aucune sortie quand le premier palier n\'est pas atteint', () => {
    const result = evaluatePartialExit({
      currentPrice: 105,
      firstTakeProfitLevel,
      positionQuantity: 1,
      partialExitRatio,
      alreadyExitedPartial: false,
    });
    expect(result.triggered).toBe(false);
    expect(result.exitQuantity).toBe(0);
    expect(result.remainingQuantity).toBe(1);
  });

  it('déclenche une sortie partielle proportionnelle au ratio configuré quand le palier est atteint', () => {
    const result = evaluatePartialExit({
      currentPrice: 115,
      firstTakeProfitLevel,
      positionQuantity: 1,
      partialExitRatio,
      alreadyExitedPartial: false,
    });
    expect(result.triggered).toBe(true);
    expect(result.exitQuantity).toBe(0.5);
    expect(result.remainingQuantity).toBe(0.5);
  });

  it('déclenche la sortie partielle quand le prix est exactement au niveau du palier', () => {
    const result = evaluatePartialExit({
      currentPrice: 110,
      firstTakeProfitLevel,
      positionQuantity: 1,
      partialExitRatio,
      alreadyExitedPartial: false,
    });
    expect(result.triggered).toBe(true);
    expect(result.exitQuantity).toBe(0.5);
  });

  it('ne déclenche pas de nouvelle sortie si une sortie partielle a déjà eu lieu', () => {
    const result = evaluatePartialExit({
      currentPrice: 115,
      firstTakeProfitLevel,
      positionQuantity: 0.5,
      partialExitRatio,
      alreadyExitedPartial: true,
    });
    expect(result.triggered).toBe(false);
    expect(result.exitQuantity).toBe(0);
    expect(result.remainingQuantity).toBe(0.5);
  });
});
