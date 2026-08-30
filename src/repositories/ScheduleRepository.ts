import { getRepositoryDb } from '@/database/repository-db'
import type { RepositoryDb } from '@/database/repository-db'
import type { Schedule } from '@/models/schedule'
import { DEFAULT_SECTION_TIMES } from '@/models/timetable'

export interface CreateScheduleInput {
  /** 课表名称 */
  name: string
  /** 学期开始日期 YYYY-MM-DD */
  semesterStart: string
  currentWeek?: number
  totalWeeks?: number
  /** 1=周一 … 7=周日 */
  firstDayOfWeek?: number
  sectionCount?: number
}

type ScheduleRow = {
  id: number
  name: string
  semester_start: string
  current_week: number
  total_weeks: number
  first_day_of_week: number
  section_count: number
  time_table_id: number | null
  created_at: string
  updated_at: string
}

function toSchedule(row: ScheduleRow): Schedule {
  return {
    id: row.id,
    name: row.name,
    semesterStart: row.semester_start,
    currentWeek: row.current_week,
    totalWeeks: row.total_weeks,
    firstDayOfWeek: row.first_day_of_week,
    sectionCount: row.section_count,
    timeTableId: row.time_table_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * 课表 Repository：课表 CRUD + 新建课表三件套（schedule + 默认 timetable(含节次) + 默认 schedule_style）。
 * 三件套在同一事务内完成（docs/tech.md §34、docs/DATABASE.md §6）。
 */
export class ScheduleRepository {
  constructor(private readonly db: RepositoryDb = getRepositoryDb()) {}

  async findAll(): Promise<Schedule[]> {
    const rows = await this.db.select<ScheduleRow>('SELECT * FROM schedule ORDER BY id ASC')
    return rows.map(toSchedule)
  }

  async findById(id: number): Promise<Schedule | null> {
    const rows = await this.db.select<ScheduleRow>('SELECT * FROM schedule WHERE id = ?', [id])
    return rows[0] ? toSchedule(rows[0]) : null
  }

  async create(input: CreateScheduleInput): Promise<Schedule> {
    const now = nowIso()
    const currentWeek = input.currentWeek ?? 1
    const totalWeeks = input.totalWeeks ?? 20
    const firstDayOfWeek = input.firstDayOfWeek ?? 1
    const sectionCount = input.sectionCount ?? 12

    await this.db.execute('BEGIN')
    try {
      const scheduleRows = await this.db.select<{ id: number }>(
        `INSERT INTO schedule
           (name, semester_start, current_week, total_weeks, first_day_of_week, section_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING id`,
        [
          input.name,
          input.semesterStart,
          currentWeek,
          totalWeeks,
          firstDayOfWeek,
          sectionCount,
          now,
          now,
        ],
      )
      const scheduleId = scheduleRows[0]?.id
      if (scheduleId === undefined) throw new Error('create schedule failed: no id returned')

      const ttRows = await this.db.select<{ id: number }>(
        `INSERT INTO timetable (name, is_default) VALUES (?, 1) RETURNING id`,
        ['默认时间表'],
      )
      const timetableId = ttRows[0]?.id
      if (timetableId === undefined)
        throw new Error('create schedule failed: default timetable no id')

      await this.db.execute(`UPDATE schedule SET time_table_id = ? WHERE id = ?`, [
        timetableId,
        scheduleId,
      ])

      for (let i = 0; i < DEFAULT_SECTION_TIMES.length; i++) {
        const section = DEFAULT_SECTION_TIMES[i]
        await this.db.execute(
          `INSERT INTO timetable_section (timetable_id, section_number, start_time, end_time)
           VALUES (?, ?, ?, ?)`,
          [timetableId, i + 1, section.startTime, section.endTime],
        )
      }

      await this.db.execute(`INSERT INTO schedule_style (schedule_id) VALUES (?)`, [scheduleId])
      await this.db.execute('COMMIT')

      const created = await this.findById(scheduleId)
      if (!created) throw new Error('create schedule failed: not found after commit')
      return created
    } catch (error) {
      await this.db.execute('ROLLBACK')
      throw error
    }
  }

  async update(id: number, patch: Partial<Schedule>): Promise<void> {
    const current = await this.findById(id)
    if (!current) throw new Error(`schedule not found: ${id}`)
    const merged: Schedule = { ...current, ...patch, id, createdAt: current.createdAt }
    await this.db.execute(
      `UPDATE schedule SET
         name = ?, semester_start = ?, current_week = ?, total_weeks = ?, first_day_of_week = ?,
         section_count = ?, time_table_id = ?, updated_at = ?
       WHERE id = ?`,
      [
        merged.name,
        merged.semesterStart,
        merged.currentWeek,
        merged.totalWeeks,
        merged.firstDayOfWeek,
        merged.sectionCount,
        merged.timeTableId ?? null,
        nowIso(),
        id,
      ],
    )
  }

  async delete(id: number): Promise<void> {
    await this.db.execute(`DELETE FROM schedule WHERE id = ?`, [id])
  }
}
