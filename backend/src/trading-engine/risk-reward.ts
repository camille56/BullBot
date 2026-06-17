interface RiskRewardParams {
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  takerFeeRate: number;
}

export function calculateNetRiskRewardRatio(params: RiskRewardParams): number {
  const { entryPrice, stopLoss, takeProfit, takerFeeRate } = params;

  const risk = entryPrice - stopLoss;
  if (risk <= 0) {
    throw new Error('stopLoss must be strictly below entryPrice');
  }

  const fees = 2 * takerFeeRate * entryPrice;
  const netReward = takeProfit - entryPrice - fees;

  return netReward / risk;
}
