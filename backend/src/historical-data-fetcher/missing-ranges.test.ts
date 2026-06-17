import { describe, it, expect } from 'vitest';
import { filterMissingDates } from './missing-ranges';

describe('filterMissingDates', () => {
  it('retourne uniquement les dates absentes de la couverture existante', () => {
    const requested = ['2024-01-01', '2024-01-02', '2024-01-03'];
    const covered = new Set(['2024-01-01', '2024-01-02']);

    expect(filterMissingDates(requested, covered)).toEqual(['2024-01-03']);
  });

  it('retourne un tableau vide si tout est déjà couvert', () => {
    const requested = ['2024-01-01', '2024-01-02'];
    const covered = new Set(['2024-01-01', '2024-01-02']);

    expect(filterMissingDates(requested, covered)).toEqual([]);
  });

  it('retourne toutes les dates demandées si rien n\'est couvert', () => {
    const requested = ['2024-01-01', '2024-01-02'];
    const covered = new Set<string>();

    expect(filterMissingDates(requested, covered)).toEqual(requested);
  });
});
