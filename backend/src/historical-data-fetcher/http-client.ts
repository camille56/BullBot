import AdmZip from 'adm-zip';

export interface HttpClient {
  get(url: string): Promise<string>;
}

export class BinanceVisionHttpClient implements HttpClient {
  async get(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`failed to download ${url}: HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const zip = new AdmZip(Buffer.from(arrayBuffer));
    const [entry] = zip.getEntries();
    return entry.getData().toString('utf-8');
  }
}
