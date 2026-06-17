interface PartialExitParams {
  currentPrice: number;
  firstTakeProfitLevel: number;
  positionQuantity: number;
  partialExitRatio: number;
  alreadyExitedPartial: boolean;
}

interface PartialExitResult {
  triggered: boolean;
  exitQuantity: number;
  remainingQuantity: number;
}

export function evaluatePartialExit(params: PartialExitParams): PartialExitResult {
  const { currentPrice, firstTakeProfitLevel, positionQuantity, partialExitRatio, alreadyExitedPartial } = params;

  if (alreadyExitedPartial || currentPrice < firstTakeProfitLevel) {
    return { triggered: false, exitQuantity: 0, remainingQuantity: positionQuantity };
  }

  const exitQuantity = positionQuantity * partialExitRatio;
  return {
    triggered: true,
    exitQuantity,
    remainingQuantity: positionQuantity - exitQuantity,
  };
}
