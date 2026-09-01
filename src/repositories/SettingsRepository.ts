import { getRepositoryDb } from '@/database/repository-db'
import type { RepositoryDb } from '@/database/repository-db'

/**
 * 全局设置键（docs/tech.md §50、docs/API.md §2.8）：SQLite key 一律 snake_case。
 * 课程外观/周数/时间禁止进入本表。
 */
export type AppSettingKey =
  'theme' | 'language' | 'active_schedule_id' | 'auto_backup' | 'startup_behavior'

const VALID_KEYS: ReadonlySet<string> = new Set<AppSettingKey>([
  'theme',
  'language',
  'active_schedule_id',
  'auto_backup',
  'startup_behavior',
])

/** 全局设置 Repository：app_setting 键值读写（仅全局键）。 */
export class SettingsRepository {
  constructor(private readonly db: RepositoryDb = getRepositoryDb()) {}

  private assertKey(key: string): asserts key is AppSettingKey {
    if (!VALID_KEYS.has(key)) {
      throw new Error(`invalid app setting key: ${key}`)
    }
  }

  async get(key: AppSettingKey): Promise<string | null> {
    this.assertKey(key)
    const rows = await this.db.select<{ value: string }>(
      `SELECT value FROM app_setting WHERE key = ?`,
      [key],
    )
    return rows[0]?.value ?? null
  }

  /** 读取全部已存在的全局键；缺失的键不返回，由调用方按默认值处理。 */
  async getAll(): Promise<Partial<Record<AppSettingKey, string>>> {
    const rows = await this.db.select<{ key: AppSettingKey; value: string }>(
      `SELECT key, value FROM app_setting WHERE key IN (?, ?, ?, ?, ?)`,
      ['theme', 'language', 'active_schedule_id', 'auto_backup', 'startup_behavior'],
    )
    const result: Partial<Record<AppSettingKey, string>> = {}
    for (const row of rows) result[row.key] = row.value
    return result
  }

  async set(key: AppSettingKey, value: string): Promise<void> {
    this.assertKey(key)
    await this.db.execute(
      `INSERT INTO app_setting (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value],
    )
  }

  async delete(key: AppSettingKey): Promise<void> {
    this.assertKey(key)
    await this.db.execute(`DELETE FROM app_setting WHERE key = ?`, [key])
  }
}
