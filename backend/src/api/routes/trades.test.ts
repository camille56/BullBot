import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import type { AppDeps } from '../app';

function createDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    tradeRepository: {
      saveBacktestTrades: vi.fn(),
      findPage: vi.fn().mockResolvedValue({ trades: [], total: 0 }),
    },
    backtestRunRepository: {
      save: vi.fn(),
      findPage: vi.fn().mockResolvedValue({ runs: [], total: 0 }),
    },
    strategyRepository: {
      findAll: vi.fn().mockResolvedValue([]),
      findOrCreateByName: vi.fn(),
    },
    candleRepository: {
      getCoveredDates: vi.fn(),
      saveCandles: vi.fn(),
      findCandlesInRange: vi.fn().mockResolvedValue([]),
    },
    portfolioProvider: { portfolio: { cashBalance: 10_000, position: null } },
    ...overrides,
  };
}

describe('GET /api/trades', () => {
  it('retourne 200 et la liste des trades existants', async () => {
    const deps = createDeps({
      tradeRepository: {
        saveBacktestTrades: vi.fn(),
        findPage: vi.fn().mockResolvedValue({
          trades: [{ id: '1', timestamp: 0, type: 'BUY', executionPrice: 100, quantity: 1, mode: 'BACKTEST' }],
          total: 1,
        }),
      },
    });
    const app = createApp(deps);

    const response = await request(app).get('/api/trades');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.trades)).toBe(true);
    expect(response.body.total).toBe(1);
    expect(deps.tradeRepository.findPage).toHaveBeenCalledWith(1, 20);
  });

  it('retourne 400 si les paramètres de pagination sont invalides', async () => {
    const app = createApp(createDeps());

    const response = await request(app).get('/api/trades?page=-1');

    expect(response.status).toBe(400);
  });

  it('transmet page et pageSize au repository', async () => {
    const deps = createDeps();
    const app = createApp(deps);

    await request(app).get('/api/trades?page=2&pageSize=10');

    expect(deps.tradeRepository.findPage).toHaveBeenCalledWith(2, 10);
  });
});
