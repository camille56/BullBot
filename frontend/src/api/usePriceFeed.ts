import { useEffect, useState } from 'react';

export interface PriceTick {
  price: number;
  timestamp: number;
}

export function usePriceFeed(): PriceTick | null {
  const [tick, setTick] = useState<PriceTick | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'PRICE') {
        setTick({ price: message.price, timestamp: message.timestamp });
      }
    };

    return () => ws.close();
  }, []);

  return tick;
}
