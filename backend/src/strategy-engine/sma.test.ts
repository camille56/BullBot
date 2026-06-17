import { describe, it, expect } from 'vitest';
import { calculateSMA } from './sma';

describe('calculateSMA', () => {
  it('calcul la moyenne mobile sur une entrée de prix', () => {
    const prices = [300, 500, 50, 150, 25, 175];
    const period = 4;
    const result = calculateSMA(prices, period);
    expect(result).toEqual([250, 181.25, 100]);
  });

  it('verifier que la période est non null et differente de 0', () => {
    expect(() => calculateSMA([10, 50], 0)).toThrow();
  });

  it('Renvois un tableau vide quand la valeur de la période est supérieur à la taille de la série', () => {
    const prices = [300, 500];
    const period = 4;
    const result = calculateSMA(prices, period);
    expect(result).toEqual([]);
  });
});
