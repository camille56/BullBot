export interface Position {
  quantity: number;
  avgEntryPrice: number;
  stopLoss: number;
  takeProfit: number;
}

export interface Portfolio {
  cashBalance: number;
  position: Position | null;
}

export interface Trade {
  id: string;
  timestamp: number;
  type: 'BUY' | 'SELL';
  executionPrice: number;
  quantity: number;
  mode: string;
}

export interface TradePage {
  trades: Trade[];
  total: number;
}

export interface BacktestResult {
  periodStart: number;
  periodEnd: number;
  initialCapital: number;
  finalPnl: number;
  maxDrawdown: number;
  tradeCount: number;
}

async function getJSON<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`GET ${path} failed: ${response.status}`);
  }
  return response.json();
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? `POST ${path} failed: ${response.status}`);
  }
  return data;
}

export function getPortfolio(): Promise<Portfolio> {
  return getJSON<Portfolio>('/api/portfolio');
}

export function getTrades(page = 1, pageSize = 50): Promise<TradePage> {
  return getJSON<TradePage>(`/api/trades?page=${page}&pageSize=${pageSize}`);
}

export interface CreateBacktestParams {
  strategyName: string;
  interval: string;
  start: string;
  end: string;
}

const DEFAULT_RISK_LEVELS = {
  atrPeriod: 14,
  atrMultiplier: 1.5,
  supportResistanceLookback: 20,
  supportBufferRatio: 0.005,
  bollingerPeriod: 20,
  bollingerStdDevMultiplier: 2,
};

const DEFAULT_TRADING_ENGINE = {
  minConfidenceThreshold: 0.3,
  minNetRiskRewardRatio: 1.5,
  takerFeeRate: 0.001,
  minPositionSize: 0.02,
  maxPositionSize: 0.1,
  trailingActivationRatio: 0.5,
};

export function createBacktest(params: CreateBacktestParams): Promise<BacktestResult> {
  return postJSON<BacktestResult>('/api/backtests', {
    ...params,
    initialCapital: 10_000,
    smaShortPeriod: 9,
    smaLongPeriod: 21,
    riskLevels: DEFAULT_RISK_LEVELS,
    tradingEngine: DEFAULT_TRADING_ENGINE,
  });
}
