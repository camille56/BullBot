import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import type { AppDeps } from '../app';

function createDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    tradeRepository: { saveBacktestTrades: vi.fn(), findPage: vi.fn() },
    backtestRunRepository: { save: vi.fn(), findPage: vi.fn() },
    strategyRepository: { findAll: vi.fn(), findOrCreateByName: vi.fn() },
    candleRepository: { getCoveredDates: vi.fn(), saveCandles: vi.fn(), findCandlesInRange: vi.fn() },
    portfolioProvider: { portfolio: { cashBalance: 10_000, position: null } },
    ...overrides,
  };
}

describe('GET /api/portfolio', () => {
  it('retourne 200 et le portefeuille courant sans position ouverte', async () => {
    const app = createApp(createDeps());

    const response = await request(app).get('/api/portfolio');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ cashBalance: 10_000, position: null });
  });

  it('retourne la position ouverte quand il y en a une', async () => {
    const deps = createDeps({
      portfolioProvider: {
        portfolio: {
          cashBalance: 9_000,
          position: { quantity: 1, avgEntryPrice: 100, stopLoss: 90, takeProfit: 130 },
        },
      },
    });
    const app = createApp(deps);

    const response = await request(app).get('/api/portfolio');

    expect(response.body.position).toEqual({ quantity: 1, avgEntryPrice: 100, stopLoss: 90, takeProfit: 130 });
  });
});
