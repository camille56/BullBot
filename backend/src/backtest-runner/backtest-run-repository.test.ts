import 'dotenv/config';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createPrismaClient } from '../db/prisma-client';
import { PrismaBacktestRunRepository } from './backtest-run-repository';
import type { BacktestResult } from './backtest-runner';

const TEST_STRATEGY_NAME = 'backtest-run-repository-test';

describe('PrismaBacktestRunRepository (intégration, nécessite Postgres local via docker compose)', () => {
  const prisma = createPrismaClient();
  const repository = new PrismaBacktestRunRepository(prisma);
  let strategyId: string;

  beforeEach(async () => {
    await prisma.backtestRun.deleteMany({ where: { strategy: { name: TEST_STRATEGY_NAME } } });
    await prisma.strategy.deleteMany({ where: { name: TEST_STRATEGY_NAME } });
    const strategy = await prisma.strategy.create({
      data: { name: TEST_STRATEGY_NAME, params: { shortPeriod: 3, longPeriod: 5 }, version: 1 },
    });
    strategyId = strategy.id;
  });

  afterAll(async () => {
    await prisma.backtestRun.deleteMany({ where: { strategy: { name: TEST_STRATEGY_NAME } } });
    await prisma.strategy.deleteMany({ where: { name: TEST_STRATEGY_NAME } });
    await prisma.$disconnect();
  });

  it('persiste le résultat d\'un backtest et le retrouve en base', async () => {
    const result: BacktestResult = {
      periodStart: Date.parse('2024-01-01T00:00:00.000Z'),
      periodEnd: Date.parse('2024-01-31T00:00:00.000Z'),
      initialCapital: 10_000,
      finalPnl: 250.5,
      maxDrawdown: 0.08,
      tradeCount: 3,
      trades: [],
    };

    await repository.save(result, strategyId);

    const rows = await prisma.backtestRun.findMany({ where: { strategyId } });
    expect(rows).toHaveLength(1);
    expect(rows[0].finalPnl.toString()).toBe('250.5');
    expect(rows[0].tradeCount).toBe(3);
  });
});
