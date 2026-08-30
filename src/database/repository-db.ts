import { getDb } from './connection'

/** INSERT/UPDATE 类语句的执行结果（用于取回自增主键）。 */
export interface ExecuteResult {
  lastInsertId?: number
  rowsAffected?: number
}

/**
 * Repository 层依赖的最小数据库接口（docs/API.md §4、DECISIONS D-4）：
 * - 生产环境由 @tauri-apps/plugin-sql 的 Database 满足；
 * - 单测环境由 better-sqlite3（test-only）适配器满足。
 */
export interface RepositoryDb {
  select<T>(sql: string, params?: unknown[]): Promise<T[]>
  execute(sql: string, params?: unknown[]): Promise<ExecuteResult | undefined>
}

/** plugin-sql 适配器（默认实例）：懒加载连接，结构上满足 RepositoryDb。 */
class PluginRepositoryDb implements RepositoryDb {
  async select<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const db = await getDb()
    // plugin-sql 的 select<T> 中 T 为整行数组类型，这里显式传 T[] 以匹配我的 T[] 语义。
    return db.select<T[]>(sql, params)
  }
  async execute(sql: string, params?: unknown[]): Promise<ExecuteResult | undefined> {
    const db = await getDb()
    return db.execute(sql, params) as Promise<ExecuteResult | undefined>
  }
}

let instance: RepositoryDb | null = null

/** 默认 RepositoryDb（Tauri 运行环境使用；测试注入替代实例）。 */
export function getRepositoryDb(): RepositoryDb {
  if (!instance) instance = new PluginRepositoryDb()
  return instance
}
