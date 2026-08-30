import { getRepositoryDb } from '@/database/repository-db'
import type { RepositoryDb } from '@/database/repository-db'
import type { CourseSession } from '@/models/session'
import type { WeekRule } from '@/models/session'
import { deserializeWeekRule, serializeWeekRule } from '@/models/session'

export interface CreateCourseSessionInput {
  courseId: number
  weekday: number
  startSection: number
  endSection: number
  startTime?: string | null
  endTime?: string | null
  teacher?: string | null
  location?: string | null
  weekRule: WeekRule
  dateStart?: string | null
  dateEnd?: string | null
  isCustomTime: boolean
}

type CourseSessionRow = {
  id: number
  course_id: number
  weekday: number
  start_section: number
  end_section: number
  start_time: string | null
  end_time: string | null
  teacher: string | null
  location: string | null
  week_rule: string
  date_start: string | null
  date_end: string | null
  is_custom_time: number
}

function toCourseSession(row: CourseSessionRow): CourseSession {
  return {
    id: row.id,
    courseId: row.course_id,
    weekday: row.weekday,
    startSection: row.start_section,
    endSection: row.end_section,
    startTime: row.start_time ?? null,
    endTime: row.end_time ?? null,
    teacher: row.teacher ?? null,
    location: row.location ?? null,
    weekRule: deserializeWeekRule(row.week_rule),
    dateStart: row.date_start ?? null,
    dateEnd: row.date_end ?? null,
    isCustomTime: row.is_custom_time === 1,
  }
}

/** 时间段 Repository：week_rule 以 JSON 字符串存取（docs/tech.md §11），禁止在 Repository 之外直操作字符串。 */
export class CourseSessionRepository {
  constructor(private readonly db: RepositoryDb = getRepositoryDb()) {}

  async findById(id: number): Promise<CourseSession | null> {
    const rows = await this.db.select<CourseSessionRow>(
      `SELECT * FROM course_session WHERE id = ?`,
      [id],
    )
    return rows[0] ? toCourseSession(rows[0]) : null
  }

  async findByCourseId(courseId: number): Promise<CourseSession[]> {
    const rows = await this.db.select<CourseSessionRow>(
      `SELECT * FROM course_session WHERE course_id = ? ORDER BY id ASC`,
      [courseId],
    )
    return rows.map(toCourseSession)
  }

  async findByScheduleId(scheduleId: number): Promise<CourseSession[]> {
    const rows = await this.db.select<CourseSessionRow>(
      `SELECT cs.* FROM course_session cs JOIN course c ON cs.course_id = c.id WHERE c.schedule_id = ? ORDER BY cs.id ASC`,
      [scheduleId],
    )
    return rows.map(toCourseSession)
  }

  async create(input: CreateCourseSessionInput): Promise<CourseSession> {
    const rows = await this.db.select<{ id: number }>(
      `INSERT INTO course_session\n         (course_id, weekday, start_section, end_section, start_time, end_time, teacher, location,\n          week_rule, date_start, date_end, is_custom_time)\n       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\n       RETURNING id`,
      [
        input.courseId,
        input.weekday,
        input.startSection,
        input.endSection,
        input.startTime ?? null,
        input.endTime ?? null,
        input.teacher ?? null,
        input.location ?? null,
        serializeWeekRule(input.weekRule),
        input.dateStart ?? null,
        input.dateEnd ?? null,
        input.isCustomTime ? 1 : 0,
      ],
    )
    const id = rows[0]?.id
    if (id === undefined) throw new Error('create course session failed: no id returned')
    const created = await this.findById(id)
    if (!created) throw new Error('create course session failed: not found after insert')
    return created
  }

  async update(id: number, patch: Partial<CourseSession>): Promise<void> {
    const current = await this.findById(id)
    if (!current) throw new Error(`course session not found: ${id}`)
    const merged: CourseSession = { ...current, ...patch, id }
    await this.db.execute(
      `UPDATE course_session SET\n         course_id = ?, weekday = ?, start_section = ?, end_section = ?, start_time = ?, end_time = ?,\n         teacher = ?, location = ?, week_rule = ?, date_start = ?, date_end = ?, is_custom_time = ?\n       WHERE id = ?`,
      [
        merged.courseId,
        merged.weekday,
        merged.startSection,
        merged.endSection,
        merged.startTime ?? null,
        merged.endTime ?? null,
        merged.teacher ?? null,
        merged.location ?? null,
        serializeWeekRule(merged.weekRule),
        merged.dateStart ?? null,
        merged.dateEnd ?? null,
        merged.isCustomTime ? 1 : 0,
        id,
      ],
    )
  }

  async delete(id: number): Promise<void> {
    await this.db.execute(`DELETE FROM course_session WHERE id = ?`, [id])
  }
}
