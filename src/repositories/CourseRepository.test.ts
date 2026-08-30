import { describe, expect, it } from 'vitest'
import { createTestDb } from '@/database/sqlite-test-adapter'
import { ScheduleRepository } from './ScheduleRepository'
import { CourseRepository, DEFAULT_COURSE_COLOR } from './CourseRepository'

describe('CourseRepository', () => {
  async function setup() {
    const db = createTestDb()
    await db.applyMigrations()
    const scheduleRepo = new ScheduleRepository(db)
    const courseRepo = new CourseRepository(db)
    const schedule = await scheduleRepo.create({ name: '课表A', semesterStart: '2026-09-01' })
    return { db, scheduleRepo, courseRepo, schedule }
  }

  it('create：使用默认颜色与时间戳，返回完整模型', async () => {
    const { db, courseRepo, schedule } = await setup()
    const course = await courseRepo.create({ scheduleId: schedule.id, name: '高等数学' })
    expect(course.id).toBeGreaterThan(0)
    expect(course.color).toBe(DEFAULT_COURSE_COLOR)
    expect(course.credits).toBeNull()
    db.close()
  })

  it('findByScheduleId：可空查询，只返回本课表的课程', async () => {
    const { db, courseRepo, schedule, scheduleRepo } = await setup()
    const other = await scheduleRepo.create({ name: '课表B', semesterStart: '2026-09-01' })
    await courseRepo.create({ scheduleId: schedule.id, name: '课程1', credits: 3.5 })
    await courseRepo.create({ scheduleId: other.id, name: '课程2' })
    const list = await courseRepo.findByScheduleId(schedule.id)
    expect(list.map((c) => c.name)).toEqual(['课程1'])
    expect(list[0].credits).toBe(3.5)
    db.close()
  })

  it('update / delete：普通更新与删除', async () => {
    const { db, courseRepo, schedule } = await setup()
    const course = await courseRepo.create({ scheduleId: schedule.id, name: '旧名', note: '备注' })
    await courseRepo.update(course.id, { name: '新名', credits: 2 })
    const updated = await courseRepo.findById(course.id)
    expect(updated?.name).toBe('新名')
    expect(updated?.credits).toBe(2)
    await courseRepo.delete(course.id)
    expect(await courseRepo.findById(course.id)).toBeNull()
    db.close()
  })
})
