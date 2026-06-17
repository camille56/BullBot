import { describe, it, expect } from 'vitest';
import { updateTrailingStop } from './trailing-stop';

describe('updateTrailingStop', () => {
  const base = { entryPrice: 100, takeProfit: 120, trailingActivationRatio: 0.5 };

  it('retourne le stop-loss actuel inchangé quand le trailing n\'est pas encore actif', () => {
    const result = updateTrailingStop({
      ...base,
      currentPrice: 105,
      currentStopLoss: 95,
      candidateStopLoss: 102,
    });
    expect(result).toBe(95);
  });

  it('retourne le niveau candidat quand le trailing est actif et plus favorable', () => {
    const result = updateTrailingStop({
      ...base,
      currentPrice: 115,
      currentStopLoss: 95,
      candidateStopLoss: 105,
    });
    expect(result).toBe(105);
  });

  it('ne fait jamais reculer le stop-loss, même trailing actif', () => {
    const result = updateTrailingStop({
      ...base,
      currentPrice: 115,
      currentStopLoss: 105,
      candidateStopLoss: 100,
    });
    expect(result).toBe(105);
  });

  it('considère le trailing actif exactement au ratio d\'activation', () => {
    const result = updateTrailingStop({
      ...base,
      currentPrice: 110,
      currentStopLoss: 95,
      candidateStopLoss: 103,
    });
    expect(result).toBe(103);
  });
});
