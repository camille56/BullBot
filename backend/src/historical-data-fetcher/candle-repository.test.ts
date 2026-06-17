import 'dotenv/config';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createPrismaClient } from '../db/prisma-client';
import { PrismaCandleRepository } from './candle-repository';

const TEST_INTERVAL = '1m-candle-repository-test';

describe('PrismaCandleRepository (intégration, nécessite Postgres local via docker compose)', () => {
  const prisma = createPrismaClient();
  const repository = new PrismaCandleRepository(prisma);

  beforeEach(async () => {
    await prisma.candle.deleteMany({ where: { interval: TEST_INTERVAL } });
  });

  afterAll(async () => {
    await prisma.candle.deleteMany({ where: { interval: TEST_INTERVAL } });
    await prisma.$disconnect();
  });

  it('ne retourne aucune date couverte tant qu\'aucune bougie n\'est sauvegardée', async () => {
    const covered = await repository.getCoveredDates(TEST_INTERVAL);
    expect(covered.size).toBe(0);
  });

  it('sauvegarde des bougies puis les retrouve comme dates couvertes', async () => {
    await repository.saveCandles(
      [{ timestamp: Date.parse('2024-01-01T00:00:00.000Z'), open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 }],
      TEST_INTERVAL
    );

    const covered = await repository.getCoveredDates(TEST_INTERVAL);
    expect(covered).toEqual(new Set(['2024-01-01']));
  });

  it('ignore les doublons (même timestamp/interval/source) sans erreur', async () => {
    const candle = { timestamp: Date.parse('2024-01-02T00:00:00.000Z'), open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 };

    await repository.saveCandles([candle], TEST_INTERVAL);
    await repository.saveCandles([candle], TEST_INTERVAL);

    const count = await prisma.candle.count({ where: { interval: TEST_INTERVAL } });
    expect(count).toBe(1);
  });

  it('retrouve les bougies d\'une période, triées par timestamp croissant', async () => {
    await repository.saveCandles(
      [
        { timestamp: Date.parse('2024-01-03T00:00:00.000Z'), open: 3, high: 3, low: 3, close: 3, volume: 1 },
        { timestamp: Date.parse('2024-01-01T00:00:00.000Z'), open: 1, high: 1, low: 1, close: 1, volume: 1 },
        { timestamp: Date.parse('2024-01-02T00:00:00.000Z'), open: 2, high: 2, low: 2, close: 2, volume: 1 },
        { timestamp: Date.parse('2024-01-10T00:00:00.000Z'), open: 10, high: 10, low: 10, close: 10, volume: 1 },
      ],
      TEST_INTERVAL
    );

    const candles = await repository.findCandlesInRange(
      TEST_INTERVAL,
      Date.parse('2024-01-01T00:00:00.000Z'),
      Date.parse('2024-01-03T00:00:00.000Z')
    );

    expect(candles.map((c) => c.close)).toEqual([1, 2, 3]);
  });
});
