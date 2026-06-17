import { describe, it, expect } from 'vitest';
import { openPosition, closePosition, portfolioValue } from './portfolio';
import type { Portfolio } from './portfolio';

describe('openPosition', () => {
  it('débite le cash et ouvre la position au prix d\'entrée', () => {
    const portfolio: Portfolio = { cashBalance: 10_000, position: null };

    const result = openPosition(portfolio, { entryPrice: 100, quantity: 2, stopLoss: 90, takeProfit: 130 });

    expect(result.cashBalance).toBe(9_800);
    expect(result.position).toEqual({ quantity: 2, avgEntryPrice: 100, stopLoss: 90, takeProfit: 130 });
  });

  it('lève une erreur si une position est déjà ouverte', () => {
    const portfolio: Portfolio = {
      cashBalance: 10_000,
      position: { quantity: 1, avgEntryPrice: 100, stopLoss: 90, takeProfit: 130 },
    };

    expect(() => openPosition(portfolio, { entryPrice: 100, quantity: 1, stopLoss: 90, takeProfit: 130 })).toThrow();
  });

  it('lève une erreur si le cash disponible est insuffisant', () => {
    const portfolio: Portfolio = { cashBalance: 50, position: null };

    expect(() => openPosition(portfolio, { entryPrice: 100, quantity: 1, stopLoss: 90, takeProfit: 130 })).toThrow();
  });
});

describe('closePosition', () => {
  it('crédite le cash au prix de sortie et vide la position', () => {
    const portfolio: Portfolio = {
      cashBalance: 9_800,
      position: { quantity: 2, avgEntryPrice: 100, stopLoss: 90, takeProfit: 130 },
    };

    const result = closePosition(portfolio, 120);

    expect(result.cashBalance).toBe(9_800 + 240);
    expect(result.position).toBeNull();
  });

  it('lève une erreur si aucune position n\'est ouverte', () => {
    const portfolio: Portfolio = { cashBalance: 10_000, position: null };

    expect(() => closePosition(portfolio, 120)).toThrow();
  });
});

describe('portfolioValue', () => {
  it('retourne le cash seul quand aucune position n\'est ouverte', () => {
    const portfolio: Portfolio = { cashBalance: 10_000, position: null };

    expect(portfolioValue(portfolio, 100)).toBe(10_000);
  });

  it('ajoute la valeur de marché de la position au cash', () => {
    const portfolio: Portfolio = {
      cashBalance: 9_800,
      position: { quantity: 2, avgEntryPrice: 100, stopLoss: 90, takeProfit: 130 },
    };

    expect(portfolioValue(portfolio, 110)).toBe(9_800 + 220);
  });
});
