import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import type { AppDeps } from '../app';
import type { RawCandle as Candle } from '../../historical-data-fetcher/types';

const ONE_MINUTE = 60_000;

function toCandles(closes: number[]): Candle[] {
  return closes.map((close, i) => ({
    timestamp: i * ONE_MINUTE,
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 100,
  }));
}

function fixtureUptrendScenario(): Candle[] {
  const flatBaseline = Array(6).fill(100);
  const sustainedRise = Array.from({ length: 10 }, (_, i) => 100 + (i + 1) * 3);
  return toCandles([...flatBaseline, ...sustainedRise]);
}

function createDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    tradeRepository: { saveBacktestTrades: vi.fn(), findPage: vi.fn().mockResolvedValue({ trades: [], total: 0 }) },
    backtestRunRepository: { save: vi.fn(), findPage: vi.fn().mockResolvedValue({ runs: [], total: 0 }) },
    strategyRepository: {
      findAll: vi.fn().mockResolvedValue([]),
      findOrCreateByName: vi.fn().mockResolvedValue({ id: 'strategy-1', name: 'SMA', params: {}, version: 1 }),
    },
    candleRepository: { getCoveredDates: vi.fn(), saveCandles: vi.fn(), findCandlesInRange: vi.fn().mockResolvedValue([]) },
    ...overrides,
  };
}

const VALID_BODY = {
  strategyName: 'SMA',
  interval: '1m',
  start: '2024-01-01T00:00:00.000Z',
  end: '2024-01-01T00:15:00.000Z',
  initialCapital: 10_000,
  smaShortPeriod: 3,
  smaLongPeriod: 5,
  riskLevels: {
    atrPeriod: 5,
    atrMultiplier: 0.5,
    supportResistanceLookback: 5,
    supportBufferRatio: 0.01,
    bollingerPeriod: 5,
    bollingerStdDevMultiplier: 4,
  },
  tradingEngine: {
    minConfidenceThreshold: 0.3,
    minNetRiskRewardRatio: 1.5,
    takerFeeRate: 0.001,
    minPositionSize: 0.02,
    maxPositionSize: 0.1,
    trailingActivationRatio: 0.5,
  },
};

describe('GET /api/backtests', () => {
  it('retourne 200 et la liste des backtests existants', async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const response = await request(app).get('/api/backtests');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.runs)).toBe(true);
  });

  it('retourne 400 si les paramètres de pagination sont invalides', async () => {
    const app = createApp(createDeps());

    const response = await request(app).get('/api/backtests?pageSize=0');

    expect(response.status).toBe(400);
  });
});

describe('POST /api/backtests', () => {
  it('lance un backtest, persiste les trades et le résultat, et retourne 201', async () => {
    const deps = createDeps({
      candleRepository: {
        getCoveredDates: vi.fn(),
        saveCandles: vi.fn(),
        findCandlesInRange: vi.fn().mockResolvedValue(fixtureUptrendScenario()),
      },
    });
    const app = createApp(deps);

    const response = await request(app).post('/api/backtests').send(VALID_BODY);

    expect(response.status).toBe(201);
    expect(response.body.tradeCount).toBeGreaterThan(0);
    expect(deps.strategyRepository.findOrCreateByName).toHaveBeenCalledWith('SMA', { smaShortPeriod: 3, smaLongPeriod: 5 });
    expect(deps.tradeRepository.saveBacktestTrades).toHaveBeenCalled();
    expect(deps.backtestRunRepository.save).toHaveBeenCalledWith(expect.anything(), 'strategy-1');
  });

  it('retourne 400 si un champ requis est manquant', async () => {
    const app = createApp(createDeps());
    const { strategyName, ...incomplete } = VALID_BODY;

    const response = await request(app).post('/api/backtests').send(incomplete);

    expect(response.status).toBe(400);
  });

  it('retourne 400 si aucune bougie n\'est disponible pour la période demandée', async () => {
    const deps = createDeps({
      candleRepository: { getCoveredDates: vi.fn(), saveCandles: vi.fn(), findCandlesInRange: vi.fn().mockResolvedValue([]) },
    });
    const app = createApp(deps);

    const response = await request(app).post('/api/backtests').send(VALID_BODY);

    expect(response.status).toBe(400);
  });
});
