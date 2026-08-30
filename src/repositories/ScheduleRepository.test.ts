import { describe, expect, it } from 'vitest'
import { createTestDb } from '@/database/sqlite-test-adapter'
import { ScheduleRepository } from './ScheduleRepository'

describe('ScheduleRepository', () => {
  async function setup() {
    const db = createTestDb()
    await db.applyMigrations()
    const repo = new ScheduleRepository(db)
    return { db, repo }
  }

  it('create：新建课表三件套（schedule + 默认 timetable(12 节) + 默认 schedule_style）', async () => {
    const { db, repo } = await setup()
    const schedule = await repo.create({ name: '我的大学课表', semesterStart: '2026-09-01' })

    expect(schedule.id).toBeGreaterThan(0)
    expect(schedule.name).toBe('我的大学课表')
    expect(schedule.currentWeek).toBe(1)
    expect(schedule.totalWeeks).toBe(20)
    expect(schedule.firstDayOfWeek).toBe(1)
    expect(schedule.sectionCount).toBe(12)

    const timetable = await db.select<{ id: number; name: string; is_default: number }>(
      'SELECT * FROM timetable ORDER BY id',
    )
    expect(timetable).toHaveLength(1)
    expect(timetable[0].name).toBe('默认时间表')
    expect(timetable[0].is_default).toBe(1)

    const sections = await db.select<{ section_number: number }>(
      'SELECT section_number FROM timetable_section ORDER BY section_number',
    )
    expect(sections).toHaveLength(12)

    const style = await db.select<{
      schedule_id: number
      show_grid: number
      background_value: string
    }>('SELECT schedule_id, show_grid, background_value FROM schedule_style')
    expect(style).toHaveLength(1)
    expect(style[0].schedule_id).toBe(schedule.id)
    expect(style[0].show_grid).toBe(1)
    expect(style[0].background_value).toBe('#ffffff')
    db.close()
  })

  it('多次 create 生成相互独立的三件套（schedule/timetable/样式数量与归属正确）', async () => {
    const { db, repo } = await setup()
    const s1 = await repo.create({ name: 'A', semesterStart: '2026-09-01' })
    const s2 = await repo.create({
      name: 'B',
      semesterStart: '2026-02-23',
      totalWeeks: 16,
      firstDayOfWeek: 7,
    })

    expect(s2.totalWeeks).toBe(16)
    expect(s2.firstDayOfWeek).toBe(7)

    const schedules = await repo.findAll()
    expect(schedules.map((s) => s.name)).toEqual(['A', 'B'])

    const timetables = await db.select<{ id: number; name: string }>(
      'SELECT id, name FROM timetable',
    )
    expect(timetables).toHaveLength(2)
    const sectionCounts = await db.select<{ timetable_id: number; cnt: number }>(
      'SELECT timetable_id, COUNT(*) cnt FROM timetable_section GROUP BY timetable_id',
    )
    expect(sectionCounts).toHaveLength(2)
    expect(sectionCounts.every((r) => r.cnt === 12)).toBe(true)
    const styles = await db.select<{ schedule_id: number }>(
      'SELECT schedule_id FROM schedule_style',
    )
    expect(styles.map((r) => r.schedule_id)).toEqual([s1.id, s2.id])
    db.close()
  })

  it('delete：级联删除课程与外观；其他课表不受影响', async () => {
    const { db, repo } = await setup()
    const s1 = await repo.create({ name: '课表A', semesterStart: '2026-09-01' })
    const s2 = await repo.create({ name: '课表B', semesterStart: '2026-09-01' })

    const insertCourse = (scheduleId: number, name: string) =>
      db.execute(
        'INSERT INTO course (schedule_id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [scheduleId, name, '#4C8DFF', '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z'],
      )
    await insertCourse(s1.id, '高等数学')
    await insertCourse(s2.id, '大学英语')

    await repo.delete(s1.id)

    const remaining = await db.select<{ id: number; name: string }>('SELECT id, name FROM course')
    expect(remaining).toHaveLength(1)
    expect(remaining[0].name).toBe('大学英语')
    const styles = await db.select<{ schedule_id: number }>(
      'SELECT schedule_id FROM schedule_style',
    )
    expect(styles.map((r) => r.schedule_id)).toEqual([s2.id])
    // timetable 是独立表（schedule.time_table_id 是它自己的外键），删除课表不级联删除默认 timetable（docs/DATABASE.md §2）
    const timetables = await db.select('SELECT * FROM timetable')
    expect(timetables).toHaveLength(2)
    const schedules = await repo.findAll()
    expect(schedules.map((s) => s.name)).toEqual(['课表B'])
    db.close()
  })

  it('update：普通字段更新并保留时间表引用', async () => {
    const { repo } = await setup()
    const s = await repo.create({ name: '初始', semesterStart: '2026-09-01' })
    await repo.update(s.id, { name: '改名', currentWeek: 3 })
    const updated = await repo.findById(s.id)
    expect(updated?.name).toBe('改名')
    expect(updated?.currentWeek).toBe(3)
    expect(updated?.timeTableId).not.toBeUndefined()
  })
})
