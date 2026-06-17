# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

**No code has been written yet.** This repository currently contains only three French-language specification documents that define what is to be built and how. There is no `package.json`, no `src/`, no Dockerfiles, no tests. When asked to start implementation, scaffold the project according to the stack and structure described below rather than assuming any existing setup.

The specs, in reading order:
- `cahier-des-charges-trading-bot.md` — scope, architecture, module breakdown, data model, tech stack, roadmap.
- `regles-risque-recompense.md` — the trading risk/reward decision logic (belongs to the Trading Engine).
- `strategie-de-test.md` — testing discipline (TDD rules, what to test per module, file layout).

Treat these as the source of truth for design decisions. If an instruction conflicts with them, point out the conflict rather than silently picking one.

## What this project is

A **paper trading bot** (simulated, no real funds, no private API keys needed) for a single fixed pair, **BTC/USDT on Binance Spot**. It has two equally important goals:
1. Functional: implement and backtest trading strategies (SMA, RSI, MACD to start).
2. Pedagogical: the project is a deliberate training ground for hand-written TDD, E2E, and performance testing — testing rigor matters even on code that looks trivial.

Testing is explicitly **phase 2**, after the functional core (data fetching → strategy → backtest → trading engine → live → dashboard → Docker) is in place. Don't jump ahead to E2E/perf work before the functional pipeline exists, and don't skip writing unit tests once a module is started — TDD applies from the first line of application code (see below).

## Planned stack

| Layer | Choice |
|---|---|
| Language | TypeScript |
| Runtime | Node.js |
| Backend framework | Express |
| ORM | Prisma |
| Database | PostgreSQL |
| Frontend | React |
| Live transport | WebSocket (backend ↔ dashboard) |
| Exchange client | npm `binance` (tiagosiebler) |
| Historical data source | `data.binance.vision` (bulk download, no auth) |
| Unit/TDD | Vitest |
| E2E | Playwright |
| Containerization | Docker + Docker Compose, target platform **Dokploy** |

Once scaffolded, expect commands along the lines of `npm ci`, `tsc` (build), `vitest` (unit tests, `vitest run path/to/file.test.ts` for a single file), and `playwright test` for E2E — confirm exact scripts in `package.json` once it exists rather than assuming these names.

## Architecture

Single pipeline; only the two ends (price source, order destination) differ between **backtest** and **live** modes — strategy and portfolio logic never change between modes:

```
Backtest:  data.binance.vision → Historical Data Fetcher → PostgreSQL → Backtest Runner ─┐
                                                                                            │
Live:      Binance WebSocket ─────────────────────────────────────────────────────► Strategy Engine → Trading Engine → Order Executor (simulated)
                                                                                            │
                                                                                            ▼
                                                                              PostgreSQL ←→ Dashboard (API + WebSocket + React)
```

Modules and responsibilities:
- **Historical Data Fetcher** — downloads/parses kline archives from `data.binance.vision`, dedupes, incremental (doesn't re-download existing ranges).
- **Market Data Provider (live)** — Binance public WebSocket, normalizes prices/candles, broadcasts internally. Must handle Binance's mandatory 24h WebSocket disconnect/reconnect (the `binance` package does this natively).
- **Strategy Engine** — pure functions only: price/candle series in, `StrategySignal` out. No network or DB dependency, ever.
- **Trading Engine / Order Manager** — consumes signals, applies risk rules (position sizing, stop-loss/take-profit), updates the virtual portfolio. Pure logic + portfolio state, no I/O. Full decision logic is in `regles-risque-recompense.md` (summarized below).
- **Order Executor (simulated)** — instant fill in backtest; real-timestamped (optionally with simulated slippage) in live.
- **Backtest Runner** — sequentially replays historical candles from PostgreSQL through Strategy Engine → Trading Engine, measuring P&L/drawdown.
- **Persistence Layer** — Prisma over PostgreSQL; candles, trades, positions, strategy config.
- **API Backend** — REST for trade/backtest history and config; WebSocket for live push (price, trades, P&L) to the dashboard.
- **Dashboard** — React; current price, position, trade history, P&L curve.

### Key interchangeability interfaces

These two interfaces are what let backtest and live share the exact same Strategy/Trading Engine code, and are what make the engine testable without network/DB:
- **`PriceFeed`** — event stream (`onPrice(callback)`); implemented by sequential PostgreSQL reads (backtest) or WebSocket listening (live).
- **`OrderExecutor`** — `executeOrder(signal)`; implemented with instant calculation (backtest) or real timestamps (live).

The Strategy Engine and Trading Engine must only ever depend on these interfaces, never on a concrete implementation.

### Data model (initial sketch, to be refined in the Prisma schema)

`Candle` (timestamp, OHLCV, interval, source), `Strategy` (name, params, version), `Signal` (timestamp, strategyId, type, price), `Trade` (timestamp, signalId, type, execution price, quantity, mode), `Position` (quantity, avg entry price, unrealized P&L), `BacktestRun` (strategyId, period, initial capital, final P&L, max drawdown, trade count).

### Dokploy deployment constraints (apply from the first Dockerfile/compose written)

- No hardcoded ports — services use `expose`, never `ports: "80:80"`; all external traffic goes through Dokploy's Traefik.
- All config (DB URL, etc.) via `process.env`, populated by Dokploy's generated `.env` — never hardcoded in Dockerfile or source. Config changes require a redeploy (not picked up live).
- Services reach each other by Docker Compose service name (e.g. backend → `postgres:5432`).
- If PostgreSQL runs as a container (vs. Dokploy-managed), it needs a named volume for persistence.
- The backend container must run `prisma migrate deploy` on startup (startup script/hook), not as a manual post-deploy step.
- Logs go to stdout/stderr only — no local log files.

## Trading risk/reward logic (Trading Engine)

Full rules in `regles-risque-recompense.md`; the key flow a `BUY` signal goes through before becoming a trade:

1. **Confidence score** (0–1, on the `StrategySignal`) — combines triggering-indicator strength, confirmation from other indicators, volatility context. Below `minConfidenceThreshold` (e.g. 0.3) → signal rejected outright, regardless of risk/reward.
2. **Stop-loss** — technical, not a fixed %: nearest support/resistance, and/or `entryPrice - atrMultiplier × ATR(14)`; if combining methods, take the more conservative (closer) level.
3. **Take-profit** — technical levels (resistances, Bollinger upper band, optionally Fibonacci), potentially split into partial exits (e.g. 50% at first resistance, rest trailed).
4. **Net risk/reward ratio** — fees-inclusive: `netReward = (takeProfit - entry) - 2 × takerFeeRate × entry`; `netRatio = netReward / (entry - stopLoss)`. Below `minNetRiskRewardRatio` (e.g. 1.5) → trade rejected.
5. Only one open position at a time on BTC/USDT — a new signal while a position is open is ignored.
6. **Position sizing** scales linearly with confidence between `minPositionSize` and `maxPositionSize` (e.g. 2%–10% of portfolio) — never let a high-confidence signal bypass the max bound.
7. **Trailing stop**, once active (after price has moved `trailingActivationRatio` of the way to take-profit): can only move in the favorable direction, never backward.

Rejection order to check (and log, with reason + computed values, for later analysis): confidence below threshold → position already open → net ratio below threshold.

All thresholds/multipliers above (`minConfidenceThreshold`, `stopLossMethod`, `atrMultiplier`, `trailingActivationRatio`, `takeProfitMethod`, `partialExitRatio`, `takerFeeRate`, `minNetRiskRewardRatio`, `minPositionSize`, `maxPositionSize`) are configuration, never hardcoded constants — they're meant to be tuned via the Backtest Runner.

## Testing discipline

Strict TDD, no exceptions for "trivial" or "plumbing" code: **Red → Green → Refactor**, always — write the failing test before the production code, even for a CSV parser or an Express route. No numeric coverage threshold is enforced; the test of a test's worth is "would this fail on a real bug here?", not "does it move the coverage number?".

Three levels, each with a distinct job:
| Level | Tool | Target | Cadence |
|---|---|---|---|
| Unit | Vitest | Strategy Engine, Trading Engine, risk calcs | continuous, every change |
| E2E | Playwright | Dashboard user flows | before each commit/merge |
| Performance | Vitest w/ timing, or dedicated script | Backtest Runner throughput, live-flow latency | ad hoc, not per-commit |

Module-specific notes:
- **Strategy Engine**: pure functions, no mocks needed. Always cover: empty price series, series shorter than the indicator period, constant prices (zero variance — classic RSI divide-by-zero trap), values exactly at threshold boundaries.
- **Trading Engine**: test each risk-rule calculation independently (ratio, trailing stop, acceptance decision) before testing them assembled.
- **Historical Data Fetcher**: has a real external dependency (HTTP to `data.binance.vision`) — mock the network layer in unit tests.
- **API routes**: test against a test DB or mocked Prisma repository, never against production data.
- **Performance tests**: use synthetic/fixture data only, never real Binance network calls. Don't invent a numeric pass/fail threshold up front — establish a baseline measurement on first run, then set the threshold just above it to catch regressions.

File layout convention: tests live **colocated** next to the file they test (`sma.ts` + `sma.test.ts`), except E2E (`e2e/`) and performance (`performance/`) which live in their own top-level directories since they test cross-cutting behavior, not a single file. Shared price-series/CSV fixtures belong in `test/fixtures/`, each named after the market scenario it represents (e.g. `fixtureOversoldScenario`), not left as unlabeled arrays of numbers.

E2E tests should select elements via `data-testid`, not CSS classes/DOM structure, so dashboard styling changes don't break them.
