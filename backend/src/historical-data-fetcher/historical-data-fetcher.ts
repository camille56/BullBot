import { buildDailyKlineUrl, enumerateDailyDates } from './klines-url';
import { filterMissingDates } from './missing-ranges';
import { parseKlinesArchive } from './klines-parser';
import type { HttpClient } from './http-client';
import type { CandleRepository } from './candle-repository';

export class HistoricalDataFetcher {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly repository: CandleRepository,
    private readonly symbol: string = 'BTCUSDT'
  ) {}

  async fetchRange(interval: string, start: string, end: string): Promise<void> {
    const requestedDates = enumerateDailyDates(start, end);
    const coveredDates = await this.repository.getCoveredDates(interval);
    const missingDates = filterMissingDates(requestedDates, coveredDates);

    for (const date of missingDates) {
      const url = buildDailyKlineUrl({ symbol: this.symbol, interval, date });
      const csv = await this.httpClient.get(url);
      const candles = parseKlinesArchive(csv);
      await this.repository.saveCandles(candles, interval);
    }
  }
}
