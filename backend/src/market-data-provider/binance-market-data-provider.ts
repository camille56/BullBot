import type { WebsocketClient, WsMessageKlineRaw, WsRawMessage } from 'binance';
import type { RawCandle } from '../historical-data-fetcher/types';
import type { PriceFeed } from './types';

function isClosedKlineMessage(message: WsRawMessage): message is WsMessageKlineRaw {
  return (
    typeof message === 'object' &&
    message !== null &&
    !Array.isArray(message) &&
    (message as { e?: string }).e === 'kline' &&
    (message as WsMessageKlineRaw).k.x === true
  );
}

export class BinanceMarketDataProvider implements PriceFeed {
  private readonly callbacks: Array<(candle: RawCandle) => void> = [];

  constructor(
    private readonly wsClient: WebsocketClient,
    private readonly symbol: string = 'BTCUSDT',
    private readonly interval: string = '1m'
  ) {
    this.wsClient.on('message', (message) => this.handleMessage(message));
  }

  onPrice(callback: (candle: RawCandle) => void): void {
    this.callbacks.push(callback);
  }

  subscribe(): void {
    this.wsClient.subscribe(`${this.symbol.toLowerCase()}@kline_${this.interval}`, 'main');
  }

  private handleMessage(message: WsRawMessage): void {
    if (!isClosedKlineMessage(message)) {
      return;
    }

    const candle: RawCandle = {
      timestamp: message.k.t,
      open: Number(message.k.o),
      high: Number(message.k.h),
      low: Number(message.k.l),
      close: Number(message.k.c),
      volume: Number(message.k.v),
    };

    for (const callback of this.callbacks) {
      callback(candle);
    }
  }
}
