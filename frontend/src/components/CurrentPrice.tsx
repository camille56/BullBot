import { usePriceFeed } from '../api/usePriceFeed';

export function CurrentPrice() {
  const tick = usePriceFeed();

  return (
    <section>
      <h2>Prix BTC/USDT</h2>
      <p data-testid="current-price">
        {tick === null ? 'En attente du flux live…' : `${tick.price.toLocaleString('fr-FR')} $`}
      </p>
    </section>
  );
}
