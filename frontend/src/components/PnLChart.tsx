import type { PnlPoint } from '../api/derivePnlCurve';

const WIDTH = 600;
const HEIGHT = 120;
const PADDING = 8;

function buildPolylinePoints(points: PnlPoint[]): string {
  if (points.length === 0) {
    return '';
  }

  const values = points.map((p) => p.cumulativePnl);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = max - min || 1;

  return points
    .map((point, i) => {
      const x = PADDING + (i / Math.max(points.length - 1, 1)) * (WIDTH - 2 * PADDING);
      const y = HEIGHT - PADDING - ((point.cumulativePnl - min) / range) * (HEIGHT - 2 * PADDING);
      return `${x},${y}`;
    })
    .join(' ');
}

export function PnLChart({ points }: { points: PnlPoint[] }) {
  if (points.length === 0) {
    return <p>Aucun trade clôturé pour le moment</p>;
  }

  const last = points[points.length - 1];

  return (
    <div>
      <svg width={WIDTH} height={HEIGHT} role="img" aria-label="Courbe de P&L cumulé">
        <polyline points={buildPolylinePoints(points)} fill="none" stroke="currentColor" strokeWidth={2} />
      </svg>
      <p className={last.cumulativePnl >= 0 ? 'positive' : 'negative'}>
        P&L cumulé : {last.cumulativePnl.toFixed(2)} $
      </p>
    </div>
  );
}
