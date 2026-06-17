import { describe, it, expect } from 'vitest';
import { calculateATR, calculateATRStopLoss } from './atr';

describe('calculateATR', () => {
  const candles = [
    { high: 110, low: 100, close: 105 },
    { high: 112, low: 104, close: 108 },
    { high: 109, low: 101, close: 103 },
    { high: 115, low: 106, close: 112 },
  ];

  it('calcul la moyenne du True Range sur la période', () => {
    const result = calculateATR(candles, 3);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeCloseTo(26 / 3, 4);
    expect(result[1]).toBeCloseTo(28 / 3, 4);
  });

  it('verifier que la période est non null et differente de 0', () => {
    expect(() => calculateATR(candles, 0)).toThrow();
  });

  it('Renvois un tableau vide quand la valeur de la période est supérieur à la taille de la série', () => {
    const result = calculateATR(candles.slice(0, 2), 3);
    expect(result).toEqual([]);
  });

  it('calcul le True Range de la première bougie sans clôture précédente', () => {
    const result = calculateATR([{ high: 110, low: 100, close: 999 }], 1);
    expect(result).toEqual([10]);
  });
});

describe('calculateATRStopLoss', () => {
  it('retourne le prix d\'entrée moins le multiplicateur fois l\'ATR', () => {
    const stopLoss = calculateATRStopLoss({ entryPrice: 100, atr: 4, atrMultiplier: 1.5 });
    expect(stopLoss).toBe(94);
  });

  it('retourne le prix d\'entrée quand l\'ATR est nul', () => {
    const stopLoss = calculateATRStopLoss({ entryPrice: 100, atr: 0, atrMultiplier: 1.5 });
    expect(stopLoss).toBe(100);
  });
});
