import type { PrismaClient } from '../generated/prisma/client';
import type { BacktestTrade } from './backtest-runner';

export interface PersistedTrade {
  id: string;
  timestamp: number;
  type: 'BUY' | 'SELL';
  executionPrice: number;
  quantity: number;
  mode: string;
}

export interface TradePage {
  trades: PersistedTrade[];
  total: number;
}

export interface TradeRepository {
  saveBacktestTrades(trades: BacktestTrade[]): Promise<void>;
  findPage(page: number, pageSize: number): Promise<TradePage>;
}

export class PrismaTradeRepository implements TradeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveBacktestTrades(trades: BacktestTrade[]): Promise<void> {
    if (trades.length === 0) {
      return;
    }

    const rows = trades.flatMap((trade) => [
      { timestamp: new Date(trade.entryTimestamp), type: 'BUY' as const, executionPrice: trade.entryPrice, quantity: trade.quantity, mode: 'BACKTEST' as const },
      { timestamp: new Date(trade.exitTimestamp), type: 'SELL' as const, executionPrice: trade.exitPrice, quantity: trade.quantity, mode: 'BACKTEST' as const },
    ]);

    await this.prisma.trade.createMany({ data: rows });
  }

  async findPage(page: number, pageSize: number): Promise<TradePage> {
    if (page < 1 || pageSize < 1) {
      throw new Error('page and pageSize must be positive integers');
    }

    const [rows, total] = await Promise.all([
      this.prisma.trade.findMany({
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.trade.count(),
    ]);

    return {
      total,
      trades: rows.map((row) => ({
        id: row.id,
        timestamp: row.timestamp.getTime(),
        type: row.type as 'BUY' | 'SELL',
        executionPrice: Number(row.executionPrice),
        quantity: Number(row.quantity),
        mode: row.mode,
      })),
    };
  }
}
