import { describe, it, expect } from 'vitest';
import { buildDailyKlineUrl, enumerateDailyDates } from './klines-url';

describe('buildDailyKlineUrl', () => {
  it('construit l\'URL d\'archive journalière au format data.binance.vision', () => {
    const url = buildDailyKlineUrl({ symbol: 'BTCUSDT', interval: '1m', date: '2024-01-01' });

    expect(url).toBe(
      'https://data.binance.vision/data/spot/daily/klines/BTCUSDT/1m/BTCUSDT-1m-2024-01-01.zip'
    );
  });
});

describe('enumerateDailyDates', () => {
  it('énumère toutes les dates entre deux bornes incluses', () => {
    expect(enumerateDailyDates('2024-01-01', '2024-01-03')).toEqual([
      '2024-01-01',
      '2024-01-02',
      '2024-01-03',
    ]);
  });

  it('retourne une seule date quand start === end', () => {
    expect(enumerateDailyDates('2024-01-01', '2024-01-01')).toEqual(['2024-01-01']);
  });

  it('lève une erreur si start est après end', () => {
    expect(() => enumerateDailyDates('2024-01-03', '2024-01-01')).toThrow();
  });

  it('traverse correctement une fin de mois', () => {
    expect(enumerateDailyDates('2024-01-30', '2024-02-01')).toEqual([
      '2024-01-30',
      '2024-01-31',
      '2024-02-01',
    ]);
  });
});
