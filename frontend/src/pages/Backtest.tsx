import { useState } from 'react';
import type { FormEvent } from 'react';
import { createBacktest } from '../api/client';
import type { BacktestResult } from '../api/client';

export function Backtest() {
  const [strategyName, setStrategyName] = useState('SMA');
  const [start, setStart] = useState('2024-01-01');
  const [end, setEnd] = useState('2024-02-29');
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const backtestResult = await createBacktest({
        strategyName,
        interval: '1d',
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
      });
      setResult(backtestResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec du backtest');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <section>
        <h2>Lancer un backtest</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Stratégie
            <select value={strategyName} onChange={(e) => setStrategyName(e.target.value)}>
              <option value="SMA">SMA</option>
            </select>
          </label>
          <label>
            Date de début
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
          </label>
          <label>
            Date de fin
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} required />
          </label>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Backtest en cours…' : 'Lancer le backtest'}
          </button>
        </form>
      </section>

      {error && (
        <section>
          <p className="negative">{error}</p>
        </section>
      )}

      {result && (
        <section data-testid="backtest-pnl-result">
          <h2>Résultat</h2>
          <table>
            <tbody>
              <tr>
                <th>P&amp;L final</th>
                <td className={result.finalPnl >= 0 ? 'positive' : 'negative'}>{result.finalPnl.toFixed(2)} $</td>
              </tr>
              <tr>
                <th>Drawdown max</th>
                <td>{(result.maxDrawdown * 100).toFixed(2)} %</td>
              </tr>
              <tr>
                <th>Nombre de trades</th>
                <td>{result.tradeCount}</td>
              </tr>
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
