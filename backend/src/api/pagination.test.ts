import { describe, it, expect } from 'vitest';
import { parsePagination } from './pagination';

describe('parsePagination', () => {
  it('retourne les valeurs par défaut quand aucun paramètre n\'est fourni', () => {
    expect(parsePagination({})).toEqual({ page: 1, pageSize: 20 });
  });

  it('parse des paramètres valides', () => {
    expect(parsePagination({ page: '2', pageSize: '50' })).toEqual({ page: 2, pageSize: 50 });
  });

  it('retourne null pour une page négative ou nulle', () => {
    expect(parsePagination({ page: '-1' })).toBeNull();
    expect(parsePagination({ page: '0' })).toBeNull();
  });

  it('retourne null pour une page non numérique', () => {
    expect(parsePagination({ page: 'abc' })).toBeNull();
  });

  it('retourne null pour un pageSize hors bornes', () => {
    expect(parsePagination({ pageSize: '0' })).toBeNull();
    expect(parsePagination({ pageSize: '101' })).toBeNull();
  });
});
