import type { Trade } from './client';

export interface PnlPoint {
  timestamp: number;
  cumulativePnl: number;
}

/**
 * Une seule position ouverte à la fois (cf. Trading Engine) : les Trade persistés
 * alternent toujours BUY (entrée) puis SELL (sortie) dans l'ordre chronologique,
 * donc les apparier séquentiellement après tri suffit à reconstituer le P&L réalisé.
 */
export function derivePnlCurve(trades: Trade[]): PnlPoint[] {
  const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);
  const points: PnlPoint[] = [];
  let cumulativePnl = 0;

  for (let i = 0; i + 1 < sorted.length; i += 2) {
    const entry = sorted[i];
    const exit = sorted[i + 1];
    cumulativePnl += (exit.executionPrice - entry.executionPrice) * entry.quantity;
    points.push({ timestamp: exit.timestamp, cumulativePnl });
  }

  return points;
}
