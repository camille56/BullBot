import { Router } from 'express';
import type { Portfolio } from '../../trading-engine/portfolio';

export interface PortfolioProvider {
  readonly portfolio: Portfolio;
}

export function createPortfolioRouter(portfolioProvider: PortfolioProvider): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.status(200).json(portfolioProvider.portfolio);
  });

  return router;
}
