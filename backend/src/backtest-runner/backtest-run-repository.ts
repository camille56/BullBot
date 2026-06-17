import type { PrismaClient } from '../generated/prisma/client';
import type { BacktestResult } from './backtest-runner';

export interface PersistedBacktestRun {
  id: string;
  strategyId: string;
  periodStart: number;
  periodEnd: number;
  initialCapital: number;
  finalPnl: number;
  maxDrawdown: number;
  tradeCount: number;
  createdAt: number;
}

export interface BacktestRunPage {
  runs: PersistedBacktestRun[];
  total: number;
}

export interface BacktestRunRepository {
  save(result: BacktestResult, strategyId: string): Promise<void>;
  findPage(page: number, pageSize: number): Promise<BacktestRunPage>;
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

  async findPage(page: number, pageSize: number): Promise<BacktestRunPage> {
    if (page < 1 || pageSize < 1) {
      throw new Error('page and pageSize must be positive integers');
    }

    const [rows, total] = await Promise.all([
      this.prisma.backtestRun.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.backtestRun.count(),
    ]);

    return {
      total,
      runs: rows.map((row) => ({
        id: row.id,
        strategyId: row.strategyId,
        periodStart: row.periodStart.getTime(),
        periodEnd: row.periodEnd.getTime(),
        initialCapital: Number(row.initialCapital),
        finalPnl: Number(row.finalPnl),
        maxDrawdown: Number(row.maxDrawdown),
        tradeCount: row.tradeCount,
        createdAt: row.createdAt.getTime(),
      })),
    };
  }
}
