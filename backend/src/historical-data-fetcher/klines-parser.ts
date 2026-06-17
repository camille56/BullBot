import type { RawCandle } from './types';

const COLUMN_COUNT = 12;

export function parseKlinesArchive(rawCsv: string): RawCandle[] {
  const candles: RawCandle[] = [];

  for (const line of rawCsv.split('\n')) {
    if (line.trim() === '') {
      continue;
    }

    const columns = line.split(',');
    if (columns.length !== COLUMN_COUNT) {
      continue;
    }

    const [timestamp, open, high, low, close, volume] = columns.map(Number);
    if ([timestamp, open, high, low, close, volume].some(Number.isNaN)) {
      continue;
    }

    candles.push({ timestamp, open, high, low, close, volume });
  }

  return candles;
}
