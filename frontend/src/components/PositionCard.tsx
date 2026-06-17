import { useEffect, useState } from 'react';
import { getPortfolio } from '../api/client';
import type { Portfolio } from '../api/client';

export function PositionCard() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPortfolio()
      .then(setPortfolio)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section>
      <h2>Position</h2>
      {error && <p className="negative">{error}</p>}
      {portfolio === null && !error && <p>Chargement…</p>}
      {portfolio !== null && portfolio.position === null && <p>Aucune position ouverte</p>}
      {portfolio !== null && portfolio.position !== null && (
        <table>
          <tbody>
            <tr>
              <th>Quantité</th>
              <td>{portfolio.position.quantity}</td>
            </tr>
            <tr>
              <th>Prix d'entrée</th>
              <td>{portfolio.position.avgEntryPrice}</td>
            </tr>
            <tr>
              <th>Stop-loss</th>
              <td>{portfolio.position.stopLoss}</td>
            </tr>
            <tr>
              <th>Take-profit</th>
              <td>{portfolio.position.takeProfit}</td>
            </tr>
          </tbody>
        </table>
      )}
    </section>
  );
}
