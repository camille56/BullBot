export interface Position {
  quantity: number;
  avgEntryPrice: number;
  stopLoss: number;
  takeProfit: number;
}

export interface Portfolio {
  cashBalance: number;
  position: Position | null;
}

interface OpenPositionParams {
  entryPrice: number;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
}

export function openPosition(portfolio: Portfolio, params: OpenPositionParams): Portfolio {
  if (portfolio.position !== null) {
    throw new Error('a position is already open');
  }

  const cost = params.entryPrice * params.quantity;
  if (cost > portfolio.cashBalance) {
    throw new Error('insufficient cash balance to open position');
  }

  return {
    cashBalance: portfolio.cashBalance - cost,
    position: {
      quantity: params.quantity,
      avgEntryPrice: params.entryPrice,
      stopLoss: params.stopLoss,
      takeProfit: params.takeProfit,
    },
  };
}

export function closePosition(portfolio: Portfolio, exitPrice: number): Portfolio {
  if (portfolio.position === null) {
    throw new Error('no open position to close');
  }

  const proceeds = exitPrice * portfolio.position.quantity;
  return { cashBalance: portfolio.cashBalance + proceeds, position: null };
}

export function portfolioValue(portfolio: Portfolio, currentPrice: number): number {
  const positionValue = portfolio.position ? portfolio.position.quantity * currentPrice : 0;
  return portfolio.cashBalance + positionValue;
}
