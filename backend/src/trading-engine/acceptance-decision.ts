import { calculateNetRiskRewardRatio } from './risk-reward';

type RejectionReason = 'CONFIDENCE_BELOW_THRESHOLD' | 'POSITION_ALREADY_OPEN' | 'NET_RATIO_BELOW_THRESHOLD';

interface AcceptanceDecisionParams {
  signal: { confidence: number; price: number };
  hasOpenPosition: boolean;
  stopLoss: number;
  takeProfit: number;
  minConfidenceThreshold: number;
  minNetRiskRewardRatio: number;
  takerFeeRate: number;
}

interface AcceptanceDecision {
  accepted: boolean;
  reason?: RejectionReason;
  netRatio?: number;
}

export function decideTradeAcceptance(params: AcceptanceDecisionParams): AcceptanceDecision {
  const {
    signal,
    hasOpenPosition,
    stopLoss,
    takeProfit,
    minConfidenceThreshold,
    minNetRiskRewardRatio,
    takerFeeRate,
  } = params;

  if (signal.confidence < minConfidenceThreshold) {
    return { accepted: false, reason: 'CONFIDENCE_BELOW_THRESHOLD' };
  }

  if (hasOpenPosition) {
    return { accepted: false, reason: 'POSITION_ALREADY_OPEN' };
  }

  const netRatio = calculateNetRiskRewardRatio({
    entryPrice: signal.price,
    stopLoss,
    takeProfit,
    takerFeeRate,
  });

  if (netRatio < minNetRiskRewardRatio) {
    return { accepted: false, reason: 'NET_RATIO_BELOW_THRESHOLD', netRatio };
  }

  return { accepted: true, netRatio };
}
