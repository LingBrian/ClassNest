import type { Migration } from './migrations'

/**
 * runner 依赖的最小数据库接口：
 * - 生产环境由 @tauri-apps/plugin-sql 的 Database 满足；
 * - 单测环境由 better-sqlite3（test-only）适配器满足。
 */
export interface MigrationDb {
  /** 执行一段或多段 SQL（不要求返回） */
  execute(sql: string): Promise<unknown>
  /** 查询并返回行数组（对象） */
  select(sql: string): Promise<Record<string, unknown>[]>
}

/**
 * 按「应用版本追踪」执行未应用的迁移，并记录到 SQLite user_version（DECISIONS D-8 推荐方案 a）。
 * 返回本次实际应用（新增）的迁移列表；幂等：已记版本之前的迁移不再执行。
 */
export async function runMigrations(
  db: MigrationDb,
  migrations: Migration[],
): Promise<Migration[]> {
  const rows = await db.select('PRAGMA user_version')
  const from = Number(rows[0]?.['user_version'] ?? 0)
  const applied: Migration[] = []
  for (let i = from; i < migrations.length; i++) {
    const migration = migrations[i]
    await db.execute(migration.sql)
    await db.execute(`PRAGMA user_version = ${i + 1}`)
    applied.push(migration)
  }
  return applied
}
