import Database from '@tauri-apps/plugin-sql'
import { migrations } from './migrations'
import { runMigrations, type MigrationDb } from './runner'

// 项目唯一数据库连接口（tech.md §19 / ARCHITECTURE.md §8）：
// - 单例，懒加载，只在 WebView（Tauri）中可用；
// - 连接成功后立即执行未应用 migration，并开启 PRAGMA foreign_keys（由 0001 顶部负责）。
let dbPromise: Promise<Database> | null = null

export function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await Database.load('sqlite:classnest.db')
      await runMigrations(db as unknown as MigrationDb, migrations)
      return db
    })()
  }
  return dbPromise
}
