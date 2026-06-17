import { TradingEngine } from '../trading-engine/trading-engine';
import type { TradingEngineConfig } from '../trading-engine/trading-engine';
import type { RiskLevelsConfig } from '../trading-engine/risk-levels';
import { processCandle } from '../backtest-runner/process-candle';
import type { CandleEvent } from '../backtest-runner/process-candle';
import type { RawCandle as Candle } from '../historical-data-fetcher/types';
import type { PriceFeed } from './types';

export interface LiveTradingSessionConfig {
  smaShortPeriod: number;
  smaLongPeriod: number;
  riskLevels: RiskLevelsConfig;
  tradingEngine: TradingEngineConfig;
  initialCapital: number;
  maxHistory?: number;
}

const DEFAULT_MAX_HISTORY = 500;

/**
 * Branche un PriceFeed (live ou, en théorie, tout autre flux séquentiel) sur le même
 * processCandle que le BacktestRunner : c'est la preuve que Strategy/Trading Engine
 * tournent à l'identique en backtest et en live (cf. CLAUDE.md, interfaces PriceFeed/OrderExecutor).
 */
export class LiveTradingSession {
  readonly engine: TradingEngine;
  private candles: Candle[] = [];
  private readonly minHistory: number;
  private readonly maxHistory: number;

  constructor(
    private readonly priceFeed: PriceFeed,
    private readonly config: LiveTradingSessionConfig,
    private readonly onEvent: (event: CandleEvent) => void = () => {}
  ) {
    this.engine = new TradingEngine(config.initialCapital, config.tradingEngine);
    this.minHistory = Math.max(config.smaLongPeriod, config.riskLevels.atrPeriod, config.riskLevels.bollingerPeriod);
    this.maxHistory = config.maxHistory ?? DEFAULT_MAX_HISTORY;
  }

  start(): void {
    this.priceFeed.onPrice((candle) => this.handleCandle(candle));
  }

  get portfolio() {
    return this.engine.portfolio;
  }

  private handleCandle(candle: Candle): void {
    this.candles.push(candle);
    if (this.candles.length > this.maxHistory) {
      this.candles.shift();
    }

    if (this.candles.length < this.minHistory) {
      return;
    }

    const event = processCandle(this.engine, this.candles, this.config);
    if (event) {
      this.onEvent(event);
    }
  }
}
