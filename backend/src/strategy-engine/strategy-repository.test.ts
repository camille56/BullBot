import 'dotenv/config';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createPrismaClient } from '../db/prisma-client';
import { PrismaStrategyRepository } from './strategy-repository';

const TEST_STRATEGY_NAME = 'strategy-repository-test';

describe('PrismaStrategyRepository (intégration, nécessite Postgres local via docker compose)', () => {
  const prisma = createPrismaClient();
  const repository = new PrismaStrategyRepository(prisma);

  beforeEach(async () => {
    await prisma.strategy.deleteMany({ where: { name: TEST_STRATEGY_NAME } });
  });

  afterAll(async () => {
    await prisma.strategy.deleteMany({ where: { name: TEST_STRATEGY_NAME } });
    await prisma.$disconnect();
  });

  it('ne retourne pas la stratégie de test avant sa création', async () => {
    const strategies = await repository.findAll();
    expect(strategies.find((s) => s.name === TEST_STRATEGY_NAME)).toBeUndefined();
  });

  it('crée une stratégie puis la retrouve via findAll', async () => {
    const created = await repository.findOrCreateByName(TEST_STRATEGY_NAME, { shortPeriod: 3, longPeriod: 5 });

    expect(created.name).toBe(TEST_STRATEGY_NAME);
    expect(created.params).toEqual({ shortPeriod: 3, longPeriod: 5 });

    const strategies = await repository.findAll();
    expect(strategies.find((s) => s.id === created.id)).toBeTruthy();
  });

  it('ne crée pas de doublon : un second appel retrouve la même stratégie', async () => {
    const first = await repository.findOrCreateByName(TEST_STRATEGY_NAME, { shortPeriod: 3, longPeriod: 5 });
    const second = await repository.findOrCreateByName(TEST_STRATEGY_NAME, { shortPeriod: 3, longPeriod: 5 });

    expect(second.id).toBe(first.id);

    const count = await prisma.strategy.count({ where: { name: TEST_STRATEGY_NAME } });
    expect(count).toBe(1);
  });
});
