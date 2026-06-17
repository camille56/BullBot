interface TrailingStopParams {
  entryPrice: number;
  takeProfit: number;
  currentPrice: number;
  currentStopLoss: number;
  candidateStopLoss: number;
  trailingActivationRatio: number;
}

export function updateTrailingStop(params: TrailingStopParams): number {
  const {
    entryPrice,
    takeProfit,
    currentPrice,
    currentStopLoss,
    candidateStopLoss,
    trailingActivationRatio,
  } = params;

  const progress = (currentPrice - entryPrice) / (takeProfit - entryPrice);
  if (progress < trailingActivationRatio) {
    return currentStopLoss;
  }

  return Math.max(currentStopLoss, candidateStopLoss);
}
