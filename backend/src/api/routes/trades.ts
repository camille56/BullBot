import { Router } from 'express';
import type { TradeRepository } from '../../backtest-runner/trade-repository';
import { parsePagination } from '../pagination';

export function createTradesRouter(tradeRepository: TradeRepository): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    if (pagination === null) {
      res.status(400).json({ error: 'invalid pagination parameters' });
      return;
    }

    const page = await tradeRepository.findPage(pagination.page, pagination.pageSize);
    res.status(200).json(page);
  });

  return router;
}
