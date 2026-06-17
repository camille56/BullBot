import type { PrismaClient, Prisma } from '../generated/prisma/client';

export interface StrategyConfig {
  id: string;
  name: string;
  params: Record<string, unknown>;
  version: number;
}

export interface StrategyRepository {
  findAll(): Promise<StrategyConfig[]>;
  findOrCreateByName(name: string, params: Record<string, unknown>, version?: number): Promise<StrategyConfig>;
}

export class PrismaStrategyRepository implements StrategyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<StrategyConfig[]> {
    const rows = await this.prisma.strategy.findMany({ orderBy: { name: 'asc' } });
    return rows.map(toStrategyConfig);
  }

  async findOrCreateByName(name: string, params: Record<string, unknown>, version = 1): Promise<StrategyConfig> {
    const existing = await this.prisma.strategy.findFirst({ where: { name } });
    if (existing) {
      return toStrategyConfig(existing);
    }

    const created = await this.prisma.strategy.create({
      data: { name, params: params as Prisma.InputJsonValue, version },
    });
    return toStrategyConfig(created);
  }
}

function toStrategyConfig(row: { id: string; name: string; params: unknown; version: number }): StrategyConfig {
  return { id: row.id, name: row.name, params: row.params as Record<string, unknown>, version: row.version };
}
