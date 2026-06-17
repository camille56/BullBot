import type { RawCandle } from '../historical-data-fetcher/types';

/**
 * Interface d'interchangeabilité backtest/live (cf. CLAUDE.md, §Architecture) : le Backtest
 * Runner et le Market Data Provider l'implémentent chacun différemment (lecture séquentielle
 * PostgreSQL vs écoute WebSocket), mais Strategy Engine et Trading Engine n'en dépendent jamais.
 */
export interface PriceFeed {
  onPrice(callback: (candle: RawCandle) => void): void;
}
