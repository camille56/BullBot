import { describe, it, expect } from 'vitest';
import { calculatePositionSize } from './position-size';

describe('calculatePositionSize', () => {
  const bounds = { minPositionSize: 0.02, maxPositionSize: 0.1 };

  it('calcul une taille de position linéaire selon la confidence', () => {
    const size = calculatePositionSize({ confidence: 0.5, ...bounds });
    expect(size).toBeCloseTo(0.06);
  });

  it('retourne la taille minimale quand la confidence est 0', () => {
    const size = calculatePositionSize({ confidence: 0, ...bounds });
    expect(size).toBeCloseTo(0.02);
  });

  it('retourne la taille maximale quand la confidence est 1', () => {
    const size = calculatePositionSize({ confidence: 1, ...bounds });
    expect(size).toBeCloseTo(0.1);
  });

  it('ne dépasse jamais la taille maximale même avec une confidence hors bornes', () => {
    const size = calculatePositionSize({ confidence: 1.5, ...bounds });
    expect(size).toBeCloseTo(0.1);
  });
});
