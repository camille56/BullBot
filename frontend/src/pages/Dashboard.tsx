import { useEffect, useState } from 'react';
import { getTrades } from '../api/client';
import type { Trade } from '../api/client';
import { derivePnlCurve } from '../api/derivePnlCurve';
import { CurrentPrice } from '../components/CurrentPrice';
import { PositionCard } from '../components/PositionCard';
import { TradeHistory } from '../components/TradeHistory';
import { PnLChart } from '../components/PnLChart';

export function Dashboard() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTrades()
      .then((page) => setTrades(page.trades))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <CurrentPrice />
      <PositionCard />
      <section>
        <h2>Historique des trades</h2>
        {error && <p className="negative">{error}</p>}
        <TradeHistory trades={trades} />
      </section>
      <section>
        <h2>P&amp;L cumulé</h2>
        <PnLChart points={derivePnlCurve(trades)} />
      </section>
    </div>
  );
}
