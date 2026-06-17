export function calculateSMA(prices: number[], period: number): number[] {
  if (period <= 0) {
    throw new Error('period must be a positive integer');
  }

  const result: number[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    const window = prices.slice(i - period + 1, i + 1);
    const sum = window.reduce((acc, price) => acc + price, 0);
    result.push(sum / period);
  }
  return result;
}
