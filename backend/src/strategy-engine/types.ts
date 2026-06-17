export type SignalType = 'BUY' | 'SELL' | 'HOLD';

export interface PricePoint {
  price: number;
  timestamp: number;
}

export interface StrategySignal {
  type: SignalType;
  confidence: number;
  price: number;
  timestamp: number;
}
