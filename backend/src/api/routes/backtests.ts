import { Router } from 'express';
import type { TradeRepository } from '../../backtest-runner/trade-repository';
import type { BacktestRunRepository } from '../../backtest-runner/backtest-run-repository';
import type { StrategyRepository } from '../../strategy-engine/strategy-repository';
import type { CandleRepository } from '../../historical-data-fetcher/candle-repository';
import { runBacktest } from '../../backtest-runner/backtest-runner';
import type { BacktestConfig } from '../../backtest-runner/backtest-runner';
import { parsePagination } from '../pagination';

interface BacktestRouterDeps {
  tradeRepository: TradeRepository;
  backtestRunRepository: BacktestRunRepository;
  strategyRepository: StrategyRepository;
  candleRepository: CandleRepository;
}

const REQUIRED_FIELDS = [
  'strategyName',
  'interval',
  'start',
  'end',
  'initialCapital',
  'smaShortPeriod',
  'smaLongPeriod',
  'riskLevels',
  'tradingEngine',
] as const;

interface CreateBacktestBody {
  strategyName: string;
  interval: string;
  start: string;
  end: string;
  initialCapital: number;
  smaShortPeriod: number;
  smaLongPeriod: number;
  riskLevels: BacktestConfig['riskLevels'];
  tradingEngine: BacktestConfig['tradingEngine'];
}

function validateBody(body: unknown): CreateBacktestBody | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }

  const record = body as Record<string, unknown>;
  for (const field of REQUIRED_FIELDS) {
    if (record[field] === undefined) {
      return null;
    }
  }

  const start = Date.parse(record.start as string);
  const end = Date.parse(record.end as string);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }

  return record as unknown as CreateBacktestBody;
}

export function createBacktestsRouter(deps: BacktestRouterDeps): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    if (pagination === null) {
      res.status(400).json({ error: 'invalid pagination parameters' });
      return;
    }

    const page = await deps.backtestRunRepository.findPage(pagination.page, pagination.pageSize);
    res.status(200).json(page);
  });

  router.post('/', async (req, res) => {
    const body = validateBody(req.body);
    if (body === null) {
      res.status(400).json({ error: `missing or invalid field, expected: ${REQUIRED_FIELDS.join(', ')}` });
      return;
    }

    const candles = await deps.candleRepository.findCandlesInRange(body.interval, Date.parse(body.start), Date.parse(body.end));
    if (candles.length === 0) {
      res.status(400).json({ error: 'no candles found for the requested period' });
      return;
    }

    const strategy = await deps.strategyRepository.findOrCreateByName(body.strategyName, {
      smaShortPeriod: body.smaShortPeriod,
      smaLongPeriod: body.smaLongPeriod,
    });

    const config: BacktestConfig = {
      smaShortPeriod: body.smaShortPeriod,
      smaLongPeriod: body.smaLongPeriod,
      riskLevels: body.riskLevels,
      tradingEngine: body.tradingEngine,
      initialCapital: body.initialCapital,
    };

    try {
      const result = runBacktest(candles, config);
      await deps.tradeRepository.saveBacktestTrades(result.trades);
      await deps.backtestRunRepository.save(result, strategy.id);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'backtest failed' });
    }
  });

  return router;
}
