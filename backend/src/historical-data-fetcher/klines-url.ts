interface DailyKlineUrlParams {
  symbol: string;
  interval: string;
  date: string;
}

export function buildDailyKlineUrl(params: DailyKlineUrlParams): string {
  const { symbol, interval, date } = params;
  return `https://data.binance.vision/data/spot/daily/klines/${symbol}/${interval}/${symbol}-${interval}-${date}.zip`;
}

export function enumerateDailyDates(start: string, end: string): string[] {
  const startDate = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);

  if (startDate > endDate) {
    throw new Error('start must be before or equal to end');
  }

  const dates: string[] = [];
  for (let current = startDate; current <= endDate; current = new Date(current.getTime() + 86_400_000)) {
    dates.push(current.toISOString().slice(0, 10));
  }

  return dates;
}
