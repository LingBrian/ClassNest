import Database from 'better-sqlite3'
import { migrations } from './migrations'
import type { Migration } from './migrations'
import { runMigrations, type MigrationDb } from './runner'
import type { ExecuteResult, RepositoryDb } from './repository-db'

/** test-only：better-sqlite3 内存库同时适配 MigrationDb 与 RepositoryDb。只允许出现在 *.test.ts 中。 */
export function createTestDb(): RepositoryDb &
  MigrationDb & {
    close(): void
    applyMigrations(): Promise<Migration[]>
  } {
  const sqlite = new Database(':memory:')

  const adapter: RepositoryDb & MigrationDb = {
    async select<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      const rows = sqlite
        .prepare(sql)
        .all(...(params as (string | number | bigint | Uint8Array | null)[]))
      return rows as unknown as T[]
    },
    async execute(sql: string, params: unknown[] = []): Promise<ExecuteResult | undefined> {
      // 无参数：迁移文件是多语句批次（以及 BEGIN/COMMIT/ROLLBACK），必须用 exec。
      if (params.length === 0) {
        sqlite.exec(sql)
        return undefined
      }
      const stmt = sqlite.prepare(sql)
      const info = stmt.run(...(params as (string | number | bigint | Uint8Array | null)[]))
      return { lastInsertId: Number(info.lastInsertRowid), rowsAffected: Number(info.changes) }
    },
  }

  return {
    ...adapter,
    applyMigrations() {
      return runMigrations(adapter, migrations)
    },
    close() {
      sqlite.close()
    },
  }
}
