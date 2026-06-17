import type { PrismaClient } from '../generated/prisma/client';
import type { RawCandle } from './types';

export interface CandleRepository {
  getCoveredDates(interval: string): Promise<Set<string>>;
  saveCandles(candles: RawCandle[], interval: string): Promise<void>;
  findCandlesInRange(interval: string, start: number, end: number): Promise<RawCandle[]>;
}

export class PrismaCandleRepository implements CandleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getCoveredDates(interval: string): Promise<Set<string>> {
    const rows = await this.prisma.$queryRaw<{ date: string }[]>`
      SELECT DISTINCT to_char(timestamp, 'YYYY-MM-DD') as date
      FROM "Candle"
      WHERE interval = ${interval} AND source = 'historical'
    `;
    return new Set(rows.map((row) => row.date));
  }

  async saveCandles(candles: RawCandle[], interval: string): Promise<void> {
    if (candles.length === 0) {
      return;
    }

    await this.prisma.candle.createMany({
      data: candles.map((candle) => ({
        timestamp: new Date(candle.timestamp),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        interval,
        source: 'historical',
      })),
      skipDuplicates: true,
    });
  }

  async findCandlesInRange(interval: string, start: number, end: number): Promise<RawCandle[]> {
    const rows = await this.prisma.candle.findMany({
      where: { interval, timestamp: { gte: new Date(start), lte: new Date(end) } },
      orderBy: { timestamp: 'asc' },
    });

    return rows.map((row) => ({
      timestamp: row.timestamp.getTime(),
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume),
    }));
  }
}
