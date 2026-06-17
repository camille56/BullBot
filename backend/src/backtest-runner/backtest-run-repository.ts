import type { PrismaClient } from '../generated/prisma/client';
import type { BacktestResult } from './backtest-runner';

export interface BacktestRunRepository {
  save(result: BacktestResult, strategyId: string): Promise<void>;
}

export class PrismaBacktestRunRepository implements BacktestRunRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(result: BacktestResult, strategyId: string): Promise<void> {
    await this.prisma.backtestRun.create({
      data: {
        strategyId,
        periodStart: new Date(result.periodStart),
        periodEnd: new Date(result.periodEnd),
        initialCapital: result.initialCapital,
        finalPnl: result.finalPnl,
        maxDrawdown: result.maxDrawdown,
        tradeCount: result.tradeCount,
      },
    });
  }
}
