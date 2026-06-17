import express from 'express';
import type { Express } from 'express';
import type { TradeRepository } from '../backtest-runner/trade-repository';
import type { BacktestRunRepository } from '../backtest-runner/backtest-run-repository';
import type { StrategyRepository } from '../strategy-engine/strategy-repository';
import type { CandleRepository } from '../historical-data-fetcher/candle-repository';
import { createTradesRouter } from './routes/trades';
import { createStrategiesRouter } from './routes/strategies';
import { createBacktestsRouter } from './routes/backtests';

export interface AppDeps {
  tradeRepository: TradeRepository;
  backtestRunRepository: BacktestRunRepository;
  strategyRepository: StrategyRepository;
  candleRepository: CandleRepository;
}

export function createApp(deps: AppDeps): Express {
  const app = express();
  app.use(express.json());

  app.use('/api/trades', createTradesRouter(deps.tradeRepository));
  app.use('/api/strategies', createStrategiesRouter(deps.strategyRepository));
  app.use('/api/backtests', createBacktestsRouter(deps));

  return app;
}
