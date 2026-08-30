import { describe, expect, it } from 'vitest'
import { createTestDb } from '@/database/sqlite-test-adapter'
import { CourseRepository } from './CourseRepository'
import { ScheduleRepository } from './ScheduleRepository'
import { CourseSessionRepository } from './CourseSessionRepository'
import { createDefaultWeekRule, type WeekRule } from '@/models/session'

describe('CourseSessionRepository', () => {
  async function setup() {
    const db = createTestDb()
    await db.applyMigrations()
    const scheduleRepo = new ScheduleRepository(db)
    const courseRepo = new CourseRepository(db)
    const sessionRepo = new CourseSessionRepository(db)
    const schedule = await scheduleRepo.create({ name: '课表A', semesterStart: '2026-09-01' })
    const course = await courseRepo.create({ scheduleId: schedule.id, name: '高等数学' })
    return { db, scheduleRepo, courseRepo, sessionRepo, schedule, course }
  }

  it('create：week_rule 以结构化对象存 JSON，读回保持一致', async () => {
    const { db, sessionRepo, course } = await setup()
    const weekRule: WeekRule = {
      type: 'custom',
      ranges: [
        { start: 1, end: 5 },
        { start: 7, end: 11, parity: 'odd' },
      ],
    }
    const session = await sessionRepo.create({
      courseId: course.id,
      weekday: 1,
      startSection: 1,
      endSection: 2,
      weekRule,
      isCustomTime: false,
    })
    expect(session.id).toBeGreaterThan(0)
    expect(session.weekRule.type).toBe('custom')
    expect(session.weekRule.ranges[1].parity).toBe('odd')
    expect(session.isCustomTime).toBe(false)

    // 底层确实是 JSON 字符串（docs/tech.md §11 约定）
    const raw = await db.select<{ week_rule: string }>(
      'SELECT week_rule FROM course_session WHERE id = ?',
      [session.id],
    )
    expect(typeof raw[0].week_rule).toBe('string')

    const loaded = await sessionRepo.findById(session.id)
    expect(loaded?.weekRule).toEqual(weekRule)
    db.close()
  })

  it('findByCourseId / findByScheduleId：多时间段与课表维度查询', async () => {
    const { db, sessionRepo, course, schedule } = await setup()
    const rule1 = createDefaultWeekRule()
    const rule2 = createDefaultWeekRule()
    await sessionRepo.create({
      courseId: course.id,
      weekday: 1,
      startSection: 1,
      endSection: 2,
      weekRule: rule1,
      isCustomTime: false,
    })
    await sessionRepo.create({
      courseId: course.id,
      weekday: 3,
      startSection: 5,
      endSection: 6,
      weekRule: rule2,
      isCustomTime: false,
    })

    const byCourse = await sessionRepo.findByCourseId(course.id)
    expect(byCourse).toHaveLength(2)
    expect(byCourse.map((s) => s.weekday)).toEqual([1, 3])

    const bySchedule = await sessionRepo.findByScheduleId(schedule.id)
    expect(bySchedule).toHaveLength(2)
    db.close()
  })

  it('update：可调星期/节次/老师/地点并保留周规则；delete 与课程级联删除', async () => {
    const { db, sessionRepo, courseRepo, course } = await setup()
    const session = await sessionRepo.create({
      courseId: course.id,
      weekday: 1,
      startSection: 1,
      endSection: 2,
      weekRule: createDefaultWeekRule(),
      teacher: '张老师',
      location: '逸夫楼 101',
      isCustomTime: false,
    })
    await sessionRepo.update(session.id, { weekday: 2, endSection: 4, teacher: '李老师' })
    const updated = await sessionRepo.findById(session.id)
    expect(updated?.weekday).toBe(2)
    expect(updated?.endSection).toBe(4)
    expect(updated?.teacher).toBe('李老师')
    expect(updated?.location).toBe('逸夫楼 101')

    await courseRepo.delete(course.id)
    const afterDelete = await db.select('SELECT * FROM course_session')
    expect(afterDelete).toHaveLength(0)
    db.close()
  })
})
