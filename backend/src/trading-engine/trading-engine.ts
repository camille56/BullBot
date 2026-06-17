import { decideTradeAcceptance } from './acceptance-decision';
import { calculatePositionSize } from './position-size';
import { updateTrailingStop } from './trailing-stop';
import { openPosition, closePosition } from './portfolio';
import type { Portfolio } from './portfolio';

export interface TradingEngineConfig {
  minConfidenceThreshold: number;
  minNetRiskRewardRatio: number;
  takerFeeRate: number;
  minPositionSize: number;
  maxPositionSize: number;
  trailingActivationRatio: number;
}

interface EvaluateSignalParams {
  signal: { confidence: number; price: number };
  stopLoss: number;
  takeProfit: number;
}

export type RejectionReason = 'CONFIDENCE_BELOW_THRESHOLD' | 'POSITION_ALREADY_OPEN' | 'NET_RATIO_BELOW_THRESHOLD';

interface RejectedSignal {
  accepted: false;
  reason: RejectionReason;
  netRatio?: number;
}

interface AcceptedSignal {
  accepted: true;
  entryPrice: number;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
}

type ExitReason = 'STOP_LOSS' | 'TAKE_PROFIT';

interface ClosedTrade {
  exitPrice: number;
  quantity: number;
  reason: ExitReason;
}

export class TradingEngine {
  portfolio: Portfolio;

  constructor(initialCash: number, private readonly config: TradingEngineConfig) {
    this.portfolio = { cashBalance: initialCash, position: null };
  }

  evaluateSignal(params: EvaluateSignalParams): AcceptedSignal | RejectedSignal {
    const { signal, stopLoss, takeProfit } = params;

    const decision = decideTradeAcceptance({
      signal,
      hasOpenPosition: this.portfolio.position !== null,
      stopLoss,
      takeProfit,
      minConfidenceThreshold: this.config.minConfidenceThreshold,
      minNetRiskRewardRatio: this.config.minNetRiskRewardRatio,
      takerFeeRate: this.config.takerFeeRate,
    });

    if (!decision.accepted) {
      return { accepted: false, reason: decision.reason as RejectionReason, netRatio: decision.netRatio };
    }

    const positionSizeRatio = calculatePositionSize({
      confidence: signal.confidence,
      minPositionSize: this.config.minPositionSize,
      maxPositionSize: this.config.maxPositionSize,
    });
    const allocatedCash = this.portfolio.cashBalance * positionSizeRatio;
    const quantity = allocatedCash / signal.price;

    this.portfolio = openPosition(this.portfolio, { entryPrice: signal.price, quantity, stopLoss, takeProfit });

    return { accepted: true, entryPrice: signal.price, quantity, stopLoss, takeProfit };
  }

  evaluatePriceUpdate(currentPrice: number, candidateStopLoss: number): ClosedTrade | null {
    const { position } = this.portfolio;
    if (position === null) {
      return null;
    }

    if (currentPrice <= position.stopLoss) {
      const quantity = position.quantity;
      this.portfolio = closePosition(this.portfolio, position.stopLoss);
      return { exitPrice: position.stopLoss, quantity, reason: 'STOP_LOSS' };
    }

    if (currentPrice >= position.takeProfit) {
      const quantity = position.quantity;
      this.portfolio = closePosition(this.portfolio, position.takeProfit);
      return { exitPrice: position.takeProfit, quantity, reason: 'TAKE_PROFIT' };
    }

    const newStopLoss = updateTrailingStop({
      entryPrice: position.avgEntryPrice,
      takeProfit: position.takeProfit,
      currentPrice,
      currentStopLoss: position.stopLoss,
      candidateStopLoss,
      trailingActivationRatio: this.config.trailingActivationRatio,
    });

    if (newStopLoss !== position.stopLoss) {
      this.portfolio = { ...this.portfolio, position: { ...position, stopLoss: newStopLoss } };
    }

    return null;
  }
}
