import { describe, it, expect, vi } from 'vitest';
import { WebsocketClient } from 'binance';
import { BinanceMarketDataProvider } from './binance-market-data-provider';

function fixtureKlineMessage(overrides: Partial<{ isFinal: boolean }> = {}) {
  return {
    wsMarket: 'spot' as const,
    wsKey: 'main' as const,
    streamName: 'btcusdt@kline_1m',
    e: 'kline' as const,
    E: 1704067260000,
    s: 'BTCUSDT',
    k: {
      t: 1704067200000,
      T: 1704067259999,
      s: 'BTCUSDT',
      i: '1m' as const,
      f: 1,
      L: 2,
      o: '42283.58',
      c: '42298.41',
      h: '42305.12',
      l: '42270.00',
      v: '12.3456',
      n: 10,
      x: overrides.isFinal ?? true,
      q: '0',
      V: '0',
      Q: '0',
      B: '0',
    },
  };
}

describe('BinanceMarketDataProvider', () => {
  it('normalise une bougie clôturée en RawCandle et notifie les abonnés', () => {
    const wsClient = new WebsocketClient({});
    const provider = new BinanceMarketDataProvider(wsClient);
    const callback = vi.fn();
    provider.onPrice(callback);

    wsClient.emit('message', fixtureKlineMessage({ isFinal: true }));

    expect(callback).toHaveBeenCalledWith({
      timestamp: 1704067200000,
      open: 42283.58,
      high: 42305.12,
      low: 42270.0,
      close: 42298.41,
      volume: 12.3456,
    });
  });

  it('ignore les bougies pas encore clôturées', () => {
    const wsClient = new WebsocketClient({});
    const provider = new BinanceMarketDataProvider(wsClient);
    const callback = vi.fn();
    provider.onPrice(callback);

    wsClient.emit('message', fixtureKlineMessage({ isFinal: false }));

    expect(callback).not.toHaveBeenCalled();
  });

  it('ignore les messages qui ne sont pas des klines', () => {
    const wsClient = new WebsocketClient({});
    const provider = new BinanceMarketDataProvider(wsClient);
    const callback = vi.fn();
    provider.onPrice(callback);

    wsClient.emit('message', {
      wsMarket: 'spot' as const,
      wsKey: 'main' as const,
      streamName: 'btcusdt@aggTrade',
      e: 'aggTrade' as const,
      E: 1704067260000,
      s: 'BTCUSDT',
      a: 1,
      p: '42298.41',
      q: '0.001',
      f: 1,
      l: 1,
      T: 1704067260000,
      m: true,
      M: true,
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('notifie tous les abonnés enregistrés via onPrice', () => {
    const wsClient = new WebsocketClient({});
    const provider = new BinanceMarketDataProvider(wsClient);
    const first = vi.fn();
    const second = vi.fn();
    provider.onPrice(first);
    provider.onPrice(second);

    wsClient.emit('message', fixtureKlineMessage({ isFinal: true }));

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('subscribe() s\'abonne au flux kline du symbole/intervalle configurés', () => {
    const wsClient = new WebsocketClient({});
    const subscribeSpy = vi.spyOn(wsClient, 'subscribe').mockImplementation(() => Promise.resolve());
    const provider = new BinanceMarketDataProvider(wsClient, 'BTCUSDT', '1m');

    provider.subscribe();

    expect(subscribeSpy).toHaveBeenCalledWith('btcusdt@kline_1m', 'main');
  });
});
