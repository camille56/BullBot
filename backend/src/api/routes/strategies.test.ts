import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import type { AppDeps } from '../app';

function createDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    tradeRepository: { saveBacktestTrades: vi.fn(), findPage: vi.fn() },
    backtestRunRepository: { save: vi.fn(), findPage: vi.fn() },
    strategyRepository: { findAll: vi.fn().mockResolvedValue([]), findOrCreateByName: vi.fn() },
    candleRepository: { getCoveredDates: vi.fn(), saveCandles: vi.fn(), findCandlesInRange: vi.fn() },
    ...overrides,
  };
}

describe('GET /api/strategies', () => {
  it('retourne 200 et la liste des stratégies configurées', async () => {
    const deps = createDeps({
      strategyRepository: {
        findAll: vi.fn().mockResolvedValue([{ id: '1', name: 'SMA', params: { shortPeriod: 3, longPeriod: 5 }, version: 1 }]),
        findOrCreateByName: vi.fn(),
      },
    });
    const app = createApp(deps);

    const response = await request(app).get('/api/strategies');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: '1', name: 'SMA', params: { shortPeriod: 3, longPeriod: 5 }, version: 1 }]);
  });
});
