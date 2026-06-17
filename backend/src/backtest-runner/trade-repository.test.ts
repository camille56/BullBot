import 'dotenv/config';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createPrismaClient } from '../db/prisma-client';
import { PrismaTradeRepository } from './trade-repository';
import type { BacktestTrade } from './backtest-runner';

describe('PrismaTradeRepository (intégration, nécessite Postgres local via docker compose)', () => {
  const prisma = createPrismaClient();
  const repository = new PrismaTradeRepository(prisma);

  beforeEach(async () => {
    await prisma.trade.deleteMany({});
  });

  afterAll(async () => {
    await prisma.trade.deleteMany({});
    await prisma.$disconnect();
  });

  it('persiste un BUY et un SELL pour chaque BacktestTrade', async () => {
    const trades: BacktestTrade[] = [
      {
        entryTimestamp: Date.parse('2024-01-01T00:00:00.000Z'),
        entryPrice: 100,
        exitTimestamp: Date.parse('2024-01-01T00:05:00.000Z'),
        exitPrice: 110,
        quantity: 2,
        reason: 'TAKE_PROFIT',
        pnl: 20,
      },
    ];

    await repository.saveBacktestTrades(trades);

    const count = await prisma.trade.count();
    expect(count).toBe(2);

    const rows = await prisma.trade.findMany({ orderBy: { timestamp: 'asc' } });
    expect(rows[0]).toMatchObject({ type: 'BUY', mode: 'BACKTEST' });
    expect(rows[0].executionPrice.toString()).toBe('100');
    expect(rows[1]).toMatchObject({ type: 'SELL', mode: 'BACKTEST' });
    expect(rows[1].executionPrice.toString()).toBe('110');
  });

  it('retrouve une page de trades triée par timestamp décroissant, avec le total', async () => {
    await repository.saveBacktestTrades([
      {
        entryTimestamp: Date.parse('2024-01-01T00:00:00.000Z'),
        entryPrice: 100,
        exitTimestamp: Date.parse('2024-01-01T00:05:00.000Z'),
        exitPrice: 110,
        quantity: 1,
        reason: 'TAKE_PROFIT',
        pnl: 10,
      },
      {
        entryTimestamp: Date.parse('2024-01-02T00:00:00.000Z'),
        entryPrice: 200,
        exitTimestamp: Date.parse('2024-01-02T00:05:00.000Z'),
        exitPrice: 190,
        quantity: 1,
        reason: 'STOP_LOSS',
        pnl: -10,
      },
    ]);

    const page = await repository.findPage(1, 2);

    expect(page.total).toBe(4);
    expect(page.trades).toHaveLength(2);
    expect(page.trades[0].timestamp).toBeGreaterThan(page.trades[1].timestamp);
  });

  it('lève une erreur explicite pour des paramètres de pagination invalides', async () => {
    await expect(repository.findPage(0, 10)).rejects.toThrow();
    await expect(repository.findPage(1, 0)).rejects.toThrow();
  });
});
