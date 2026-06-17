import 'dotenv/config';
import http from 'http';
import { WebsocketClient } from 'binance';
import { createApp } from './api/app';
import { WebSocketBroadcaster } from './api/websocket-broadcaster';
import { createPrismaClient } from './db/prisma-client';
import { PrismaTradeRepository } from './backtest-runner/trade-repository';
import { PrismaBacktestRunRepository } from './backtest-runner/backtest-run-repository';
import { PrismaStrategyRepository } from './strategy-engine/strategy-repository';
import { PrismaCandleRepository } from './historical-data-fetcher/candle-repository';
import { BinanceMarketDataProvider } from './market-data-provider/binance-market-data-provider';
import { LiveTradingSession } from './market-data-provider/live-trading-session';
import type { LiveTradingSessionConfig } from './market-data-provider/live-trading-session';

const PORT = Number(process.env.PORT ?? 3000);

// Valeurs d'exemple de regles-risque-recompense.md §7 ; à calibrer via le Backtest Runner.
const LIVE_SESSION_CONFIG: LiveTradingSessionConfig = {
  smaShortPeriod: 9,
  smaLongPeriod: 21,
  riskLevels: {
    atrPeriod: 14,
    atrMultiplier: 1.5,
    supportResistanceLookback: 20,
    supportBufferRatio: 0.005,
    bollingerPeriod: 20,
    bollingerStdDevMultiplier: 2,
  },
  tradingEngine: {
    minConfidenceThreshold: 0.3,
    minNetRiskRewardRatio: 1.5,
    takerFeeRate: 0.001,
    minPositionSize: 0.02,
    maxPositionSize: 0.1,
    trailingActivationRatio: 0.5,
  },
  initialCapital: 10_000,
};

function main(): void {
  const prisma = createPrismaClient();

  const app = createApp({
    tradeRepository: new PrismaTradeRepository(prisma),
    backtestRunRepository: new PrismaBacktestRunRepository(prisma),
    strategyRepository: new PrismaStrategyRepository(prisma),
    candleRepository: new PrismaCandleRepository(prisma),
  });

  const httpServer = http.createServer(app);
  const broadcaster = new WebSocketBroadcaster({ server: httpServer });

  const wsClient = new WebsocketClient({});
  const marketDataProvider = new BinanceMarketDataProvider(wsClient, 'BTCUSDT', '1m');

  marketDataProvider.onPrice((candle) => {
    broadcaster.broadcast({ type: 'PRICE', price: candle.close, timestamp: candle.timestamp });
  });

  const liveSession = new LiveTradingSession(marketDataProvider, LIVE_SESSION_CONFIG, (event) => {
    broadcaster.broadcast({ type: 'TRADE_EVENT', event });
  });
  liveSession.start();
  marketDataProvider.subscribe();

  httpServer.listen(PORT, () => {
    console.log(`BullBot backend listening on :${PORT}`);
  });
}

main();
