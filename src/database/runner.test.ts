import { describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { migrations } from './migrations'
import type { Migration } from './migrations'
import { runMigrations, type MigrationDb } from './runner'

/** better-sqlite3 内存库适配 MigrationDb（test-only，生产不依赖）。 */
function makeDb(): MigrationDb & { close(): void } {
  const sqlite = new Database(':memory:')
  return {
    async execute(sql: string) {
      sqlite.exec(sql)
    },
    async select(sql: string) {
      return sqlite.prepare(sql).all() as Record<string, unknown>[]
    },
    close() {
      sqlite.close()
    },
  }
}

describe('migrations runner', () => {
  it('首次执行会依次应用全部 0001-0004 迁移并创建全部基础表', async () => {
    const db = makeDb()
    const applied = await runMigrations(db, migrations)
    expect(applied.map((m) => m.name)).toEqual([
      '0001_initial',
      '0002_course_override',
      '0003_schedule_style',
      '0004_app_settings',
    ])
    const tableRows = await db.select(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
    )
    const names = tableRows.map((r) => r['name'])
    expect(names).toEqual(
      expect.arrayContaining([
        'schedule',
        'course',
        'course_session',
        'timetable',
        'timetable_section',
        'course_override',
        'schedule_style',
        'app_setting',
      ]),
    )
    db.close()
  })

  it('重复执行是幂等的：已应用版本全部跳过', async () => {
    const db = makeDb()
    await runMigrations(db, migrations)
    const again = await runMigrations(db, migrations)
    expect(again).toEqual([])
    const versionRow = await db.select('PRAGMA user_version')
    expect(Number(versionRow[0]?.['user_version'])).toBe(migrations.length)
    db.close()
  })

  it('追加迁移只增量执行：0001-0004 后新增 0005 只执行 0005', async () => {
    const db = makeDb()
    await runMigrations(db, migrations)
    const extra: Migration = {
      name: '0005_probe',
      sql: 'CREATE TABLE IF NOT EXISTS probe (id INTEGER PRIMARY KEY);',
    }
    const applied = await runMigrations(db, [...migrations, extra])
    expect(applied.map((m) => m.name)).toEqual(['0005_probe'])
    db.close()
  })
})
