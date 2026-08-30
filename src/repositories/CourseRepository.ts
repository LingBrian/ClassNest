import { getRepositoryDb } from '@/database/repository-db'
import type { RepositoryDb } from '@/database/repository-db'
import type { Course } from '@/models/course'

export interface CreateCourseInput {
  scheduleId: number
  name: string
  color?: string
  credits?: number | null
  note?: string | null
}

export const DEFAULT_COURSE_COLOR = '#4C8DFF'

type CourseRow = {
  id: number
  schedule_id: number
  name: string
  color: string
  credits: number | null
  note: string | null
  created_at: string
  updated_at: string
}

function toCourse(row: CourseRow): Course {
  return {
    id: row.id,
    scheduleId: row.schedule_id,
    name: row.name,
    color: row.color,
    credits: row.credits ?? null,
    note: row.note ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function nowIso(): string {
  return new Date().toISOString()
}

/** 课程 Repository：课程本身不含星期/节次/老师/地点（那些属于 CourseSession，见 docs/tech.md §9）。 */
export class CourseRepository {
  constructor(private readonly db: RepositoryDb = getRepositoryDb()) {}

  async findByScheduleId(scheduleId: number): Promise<Course[]> {
    const rows = await this.db.select<CourseRow>(
      `SELECT * FROM course WHERE schedule_id = ? ORDER BY id ASC`,
      [scheduleId],
    )
    return rows.map(toCourse)
  }

  async findById(id: number): Promise<Course | null> {
    const rows = await this.db.select<CourseRow>(`SELECT * FROM course WHERE id = ?`, [id])
    return rows[0] ? toCourse(rows[0]) : null
  }

  async create(input: CreateCourseInput): Promise<Course> {
    const now = nowIso()
    const rows = await this.db.select<{ id: number }>(
      `INSERT INTO course (schedule_id, name, color, credits, note, created_at, updated_at)\n       VALUES (?, ?, ?, ?, ?, ?, ?)\n       RETURNING id`,
      [
        input.scheduleId,
        input.name,
        input.color ?? DEFAULT_COURSE_COLOR,
        input.credits ?? null,
        input.note ?? null,
        now,
        now,
      ],
    )
    const id = rows[0]?.id
    if (id === undefined) throw new Error('create course failed: no id returned')
    const created = await this.findById(id)
    if (!created) throw new Error('create course failed: not found after insert')
    return created
  }

  async update(id: number, patch: Partial<Course>): Promise<void> {
    const current = await this.findById(id)
    if (!current) throw new Error(`course not found: ${id}`)
    const merged: Course = { ...current, ...patch, id, createdAt: current.createdAt }
    await this.db.execute(
      `UPDATE course SET\n         schedule_id = ?, name = ?, color = ?, credits = ?, note = ?, updated_at = ?\n       WHERE id = ?`,
      [
        merged.scheduleId,
        merged.name,
        merged.color,
        merged.credits ?? null,
        merged.note ?? null,
        nowIso(),
        id,
      ],
    )
  }

  async delete(id: number): Promise<void> {
    await this.db.execute(`DELETE FROM course WHERE id = ?`, [id])
  }
}
