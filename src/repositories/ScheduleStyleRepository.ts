import { getRepositoryDb } from '@/database/repository-db'
import type { RepositoryDb } from '@/database/repository-db'
import type { ScheduleStyle } from '@/models/scheduleStyle'
import { DEFAULT_SCHEDULE_STYLE } from '@/models/scheduleStyle'

type ScheduleStyleRow = {
  schedule_id: number
  background_type: 'color' | 'image'
  background_value: string
  show_time: number
  show_location: number
  show_teacher: number
  show_grid: number
  show_non_current_week: number
  non_current_week_opacity: number
  course_border: number
  course_radius: number
  course_height: number
}

function toScheduleStyle(row: ScheduleStyleRow): ScheduleStyle {
  return {
    scheduleId: row.schedule_id,
    backgroundType: row.background_type,
    backgroundValue: row.background_value,
    showTime: row.show_time === 1,
    showLocation: row.show_location === 1,
    showTeacher: row.show_teacher === 1,
    showGrid: row.show_grid === 1,
    showNonCurrentWeek: row.show_non_current_week === 1,
    nonCurrentWeekOpacity: row.non_current_week_opacity,
    courseBorder: row.course_border === 1,
    courseRadius: row.course_radius,
    courseHeight: row.course_height,
  }
}

/**
 * 课表外观 Repository（docs/tech.md §13）：按 scheduleId 读写外观。
 * schedule_style 行在新建课表时由 ScheduleRepository 三件套写入，删除时级联，因此只需 findByScheduleId / update。
 */
export class ScheduleStyleRepository {
  constructor(private readonly db: RepositoryDb = getRepositoryDb()) {}

  async findByScheduleId(scheduleId: number): Promise<ScheduleStyle | null> {
    const rows = await this.db.select<ScheduleStyleRow>(
      `SELECT * FROM schedule_style WHERE schedule_id = ?`,
      [scheduleId],
    )
    return rows[0] ? toScheduleStyle(rows[0]) : null
  }

  async update(scheduleId: number, patch: Partial<ScheduleStyle>): Promise<void> {
    const current = await this.findByScheduleId(scheduleId)
    if (!current) {
      // 容错：若行不存在则按默认值補建（防御性；正常流程由三件套保证）。
      await this.createWithDefaults(scheduleId, patch)
      return
    }
    const merged: ScheduleStyle = { ...DEFAULT_SCHEDULE_STYLE, ...current, ...patch, scheduleId }
    await this.db.execute(
      `UPDATE schedule_style SET
         background_type = ?, background_value = ?,
         show_time = ?, show_location = ?, show_teacher = ?,
         show_grid = ?, show_non_current_week = ?, non_current_week_opacity = ?,
         course_border = ?, course_radius = ?, course_height = ?
       WHERE schedule_id = ?`,
      [
        merged.backgroundType,
        merged.backgroundValue,
        merged.showTime ? 1 : 0,
        merged.showLocation ? 1 : 0,
        merged.showTeacher ? 1 : 0,
        merged.showGrid ? 1 : 0,
        merged.showNonCurrentWeek ? 1 : 0,
        merged.nonCurrentWeekOpacity,
        merged.courseBorder ? 1 : 0,
        merged.courseRadius,
        merged.courseHeight,
        scheduleId,
      ],
    )
  }

  private async createWithDefaults(
    scheduleId: number,
    patch: Partial<ScheduleStyle>,
  ): Promise<void> {
    const merged: ScheduleStyle = { ...DEFAULT_SCHEDULE_STYLE, ...patch, scheduleId }
    await this.db.execute(
      `INSERT INTO schedule_style (
         schedule_id, background_type, background_value,
         show_time, show_location, show_teacher,
         show_grid, show_non_current_week, non_current_week_opacity,
         course_border, course_radius, course_height
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        scheduleId,
        merged.backgroundType,
        merged.backgroundValue,
        merged.showTime ? 1 : 0,
        merged.showLocation ? 1 : 0,
        merged.showTeacher ? 1 : 0,
        merged.showGrid ? 1 : 0,
        merged.showNonCurrentWeek ? 1 : 0,
        merged.nonCurrentWeekOpacity,
        merged.courseBorder ? 1 : 0,
        merged.courseRadius,
        merged.courseHeight,
      ],
    )
  }
}
