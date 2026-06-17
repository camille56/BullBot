import type { Trade } from '../api/client';

export function TradeHistory({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) {
    return <p>Aucun trade pour le moment</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Prix</th>
          <th>Quantité</th>
          <th>Mode</th>
        </tr>
      </thead>
      <tbody>
        {trades.map((trade) => (
          <tr key={trade.id}>
            <td>{new Date(trade.timestamp).toLocaleString('fr-FR')}</td>
            <td>{trade.type}</td>
            <td>{trade.executionPrice}</td>
            <td>{trade.quantity}</td>
            <td>{trade.mode}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
