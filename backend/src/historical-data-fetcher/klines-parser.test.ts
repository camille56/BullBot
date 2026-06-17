import { describe, it, expect } from 'vitest';
import { parseKlinesArchive } from './klines-parser';
import { fixtureBinanceKlinesCSV } from '../../test/fixtures/binance-csv';

describe('parseKlinesArchive', () => {
  it('parse correctement un fichier CSV de klines au format Binance', () => {
    const candles = parseKlinesArchive(fixtureBinanceKlinesCSV());

    expect(candles).toHaveLength(3);
    expect(candles[0]).toEqual({
      timestamp: 1704067200000,
      open: 42283.58,
      high: 42305.12,
      low: 42270.0,
      close: 42298.41,
      volume: 12.3456,
    });
  });

  it('ignore les lignes malformées sans planter tout le parsing', () => {
    const rawCsv = '1234,bad,data\n' + fixtureBinanceKlinesCSV();

    expect(() => parseKlinesArchive(rawCsv)).not.toThrow();
    expect(parseKlinesArchive(rawCsv)).toHaveLength(3);
  });

  it('ignore les lignes avec le bon nombre de colonnes mais des valeurs non numériques', () => {
    const rawCsv = 'a,b,c,d,e,f,g,h,i,j,k,l\n' + fixtureBinanceKlinesCSV();

    expect(parseKlinesArchive(rawCsv)).toHaveLength(3);
  });

  it('ignore les lignes vides', () => {
    const rawCsv = fixtureBinanceKlinesCSV() + '\n\n';

    expect(parseKlinesArchive(rawCsv)).toHaveLength(3);
  });

  it('retourne un tableau vide pour une entrée vide', () => {
    expect(parseKlinesArchive('')).toEqual([]);
  });
});
