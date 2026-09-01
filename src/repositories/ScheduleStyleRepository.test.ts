import { describe, expect, it } from 'vitest'
import { createTestDb } from '@/database/sqlite-test-adapter'
import { ScheduleRepository } from './ScheduleRepository'
import { ScheduleStyleRepository } from './ScheduleStyleRepository'

describe('ScheduleStyleRepository', () => {
  async function setup() {
    const db = createTestDb()
    await db.applyMigrations()
    const scheduleRepo = new ScheduleRepository(db)
    const styleRepo = new ScheduleStyleRepository(db)
    const schedule = await scheduleRepo.create({ name: '课表A', semesterStart: '2026-09-01' })
    return { db, styleRepo, schedule }
  }

  it('findByScheduleId：新建课表后返回默认外观', async () => {
    const { db, styleRepo, schedule } = await setup()
    const style = await styleRepo.findByScheduleId(schedule.id)
    expect(style).not.toBeNull()
    expect(style?.scheduleId).toBe(schedule.id)
    expect(style?.backgroundType).toBe('color')
    expect(style?.backgroundValue).toBe('#ffffff')
    expect(style?.showTeacher).toBe(false)
    expect(style?.courseRadius).toBe(8)
    db.close()
  })

  it('update：局部更新外观并持久化', async () => {
    const { db, styleRepo, schedule } = await setup()
    await styleRepo.update(schedule.id, {
      courseRadius: 12,
      showTeacher: true,
      backgroundValue: '#f0f0f0',
    })
    const updated = await styleRepo.findByScheduleId(schedule.id)
    expect(updated?.courseRadius).toBe(12)
    expect(updated?.showTeacher).toBe(true)
    expect(updated?.backgroundValue).toBe('#f0f0f0')
    expect(updated?.showTime).toBe(true)
    expect(updated?.showLocation).toBe(true)
    db.close()
  })

  it('update：删除课表后外观不复存在（级联删除）', async () => {
    const { db, styleRepo, schedule } = await setup()
    await styleRepo.update(schedule.id, { courseRadius: 10 })
    await new ScheduleRepository(db).delete(schedule.id)
    expect(await styleRepo.findByScheduleId(schedule.id)).toBeNull()
    db.close()
  })
})
