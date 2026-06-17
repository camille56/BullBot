import { describe, it, expect, vi } from 'vitest';
import { HistoricalDataFetcher } from './historical-data-fetcher';
import { fixtureBinanceKlinesCSV } from '../../test/fixtures/binance-csv';
import type { HttpClient } from './http-client';
import type { CandleRepository } from './candle-repository';

function createMockHttpClient(): HttpClient {
  return { get: vi.fn().mockResolvedValue(fixtureBinanceKlinesCSV()) };
}

function createMockCandleRepository(coveredDates: string[] = []): CandleRepository {
  return {
    getCoveredDates: vi.fn().mockResolvedValue(new Set(coveredDates)),
    saveCandles: vi.fn().mockResolvedValue(undefined),
  };
}

describe('HistoricalDataFetcher.fetchRange (réseau mocké)', () => {
  it('ne re-télécharge pas une période déjà présente en base', async () => {
    const httpClient = createMockHttpClient();
    const repository = createMockCandleRepository(['2024-01-01', '2024-01-02', '2024-01-03']);
    const fetcher = new HistoricalDataFetcher(httpClient, repository);

    await fetcher.fetchRange('1d', '2024-01-01', '2024-01-03');

    expect(httpClient.get).not.toHaveBeenCalled();
    expect(repository.saveCandles).not.toHaveBeenCalled();
  });

  it('ne télécharge que les dates manquantes quand la période est partiellement couverte', async () => {
    const httpClient = createMockHttpClient();
    const repository = createMockCandleRepository(['2024-01-01']);
    const fetcher = new HistoricalDataFetcher(httpClient, repository);

    await fetcher.fetchRange('1d', '2024-01-01', '2024-01-03');

    expect(httpClient.get).toHaveBeenCalledTimes(2);
    expect(httpClient.get).toHaveBeenCalledWith(
      'https://data.binance.vision/data/spot/daily/klines/BTCUSDT/1d/BTCUSDT-1d-2024-01-02.zip'
    );
    expect(httpClient.get).toHaveBeenCalledWith(
      'https://data.binance.vision/data/spot/daily/klines/BTCUSDT/1d/BTCUSDT-1d-2024-01-03.zip'
    );
  });

  it('télécharge, parse et sauvegarde toute la période si rien n\'est couvert', async () => {
    const httpClient = createMockHttpClient();
    const repository = createMockCandleRepository([]);
    const fetcher = new HistoricalDataFetcher(httpClient, repository);

    await fetcher.fetchRange('1d', '2024-01-01', '2024-01-01');

    expect(httpClient.get).toHaveBeenCalledTimes(1);
    expect(repository.saveCandles).toHaveBeenCalledTimes(1);
    expect(repository.saveCandles).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ open: 42283.58 })]),
      '1d'
    );
  });
});
