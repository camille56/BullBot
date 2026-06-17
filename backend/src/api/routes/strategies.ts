import { Router } from 'express';
import type { StrategyRepository } from '../../strategy-engine/strategy-repository';

export function createStrategiesRouter(strategyRepository: StrategyRepository): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const strategies = await strategyRepository.findAll();
    res.status(200).json(strategies);
  });

  return router;
}
