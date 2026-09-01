import { describe, expect, it } from 'vitest'
import { createTestDb } from '@/database/sqlite-test-adapter'
import { SettingsRepository } from './SettingsRepository'

describe('SettingsRepository', () => {
  async function setup() {
    const db = createTestDb()
    await db.applyMigrations()
    return { db, repo: new SettingsRepository(db) }
  }

  it('get/set：写入后可读回，未设置时为 null', async () => {
    const { db, repo } = await setup()
    expect(await repo.get('theme')).toBeNull()
    await repo.set('theme', 'dark')
    expect(await repo.get('theme')).toBe('dark')
    await repo.set('theme', 'light')
    expect(await repo.get('theme')).toBe('light')
    db.close()
  })

  it('getAll：只返回已设置的键', async () => {
    const { db, repo } = await setup()
    await repo.set('language', 'zh-CN')
    await repo.set('theme', 'dark')
    const all = await repo.getAll()
    expect(all.theme).toBe('dark')
    expect(all.language).toBe('zh-CN')
    expect(all.active_schedule_id).toBeUndefined()
    db.close()
  })

  it('delete：删除后读回 null', async () => {
    const { db, repo } = await setup()
    await repo.set('startup_behavior', 'last_schedule')
    await repo.delete('startup_behavior')
    expect(await repo.get('startup_behavior')).toBeNull()
    db.close()
  })

  it('非法键：写入与读取均抛错', async () => {
    const { db, repo } = await setup()
    await expect(repo.set('course_color' as never, '#000')).rejects.toThrow()
    await expect(repo.get('invalid_key' as never)).rejects.toThrow()
    db.close()
  })
})
