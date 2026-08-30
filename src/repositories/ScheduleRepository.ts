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
 * 三件套在同一流程内完成（docs/tech.md §34、docs/DATABASE.md §6）。
 * 注意：不能使用裸 BEGIN/COMMIT。@tauri-apps/plugin-sql 底层是 sqlx 连接池（默认多连接），
 * 裸 BEGIN 会落在池中某一连接而后续写落在其他连接，导致 SQLITE_BUSY（code 5）。
 * 因此这里顺序执行全部写入；中途失败通过「删除已插入的 schedule（级联清课程/时间段/外观/调课）
 * + 显式删除独立 timetable」做补偿，保证不留半成品（见 AGENTS.md §9）。
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

    // 记录已插入的 id，失败时需显式补偿删除（timetable 是独立表，schedule 删除不级联）。
    let scheduleId: number | null = null
    let timetableId: number | null = null
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
      scheduleId = scheduleRows[0]?.id ?? null
      if (scheduleId === null) throw new Error('create schedule failed: no id returned')

      const ttRows = await this.db.select<{ id: number }>(
        `INSERT INTO timetable (name, is_default) VALUES (?, 1) RETURNING id`,
        ['默认时间表'],
      )
      timetableId = ttRows[0]?.id ?? null
      if (timetableId === null) throw new Error('create schedule failed: default timetable no id')

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

      const created = await this.findById(scheduleId)
      if (!created) throw new Error('create schedule failed: not found after write')
      return created
    } catch (error) {
      // 补偿：删除本流程已创建的 schedule（级联清除课程/时间段/调课/外观）与独立 timetable（含其节次），
      // 保证三件套不留半成品。补偿失败时仍然抛出原始错误（不吞掉主错误）。
      if (scheduleId !== null) {
        try {
          await this.db.execute(`DELETE FROM schedule WHERE id = ?`, [scheduleId])
        } catch {
          // 忽略补偿失败，原错误继续抛出
        }
      }
      if (timetableId !== null) {
        try {
          await this.db.execute(`DELETE FROM timetable WHERE id = ?`, [timetableId])
        } catch {
          // 忽略补偿失败，原错误继续抛出
        }
      }
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
