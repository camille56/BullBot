import { describe, it, expect, vi, afterEach } from 'vitest';
import AdmZip from 'adm-zip';
import { BinanceVisionHttpClient } from './http-client';

function fixtureZipBuffer(csvContent: string): Buffer {
  const zip = new AdmZip();
  zip.addFile('BTCUSDT-1m-2024-01-01.csv', Buffer.from(csvContent, 'utf-8'));
  return zip.toBuffer();
}

describe('BinanceVisionHttpClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('télécharge une archive zip et en extrait le contenu CSV', async () => {
    const csvContent = '1704067200000,1,2,3,4,5,0,0,0,0,0,0';
    const zipBuffer = fixtureZipBuffer(csvContent);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => zipBuffer.buffer.slice(zipBuffer.byteOffset, zipBuffer.byteOffset + zipBuffer.byteLength),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new BinanceVisionHttpClient();
    const csv = await client.get('https://data.binance.vision/data/spot/daily/klines/BTCUSDT/1m/BTCUSDT-1m-2024-01-01.zip');

    expect(csv).toBe(csvContent);
    expect(fetchMock).toHaveBeenCalledWith('https://data.binance.vision/data/spot/daily/klines/BTCUSDT/1m/BTCUSDT-1m-2024-01-01.zip');
  });

  it('lève une erreur explicite si la réponse HTTP n\'est pas OK (ex: archive inexistante)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    vi.stubGlobal('fetch', fetchMock);

    const client = new BinanceVisionHttpClient();

    await expect(client.get('https://data.binance.vision/missing.zip')).rejects.toThrow(/404/);
  });
});
