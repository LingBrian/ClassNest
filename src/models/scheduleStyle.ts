export interface ScheduleStyle {
  scheduleId: number
  backgroundType: 'color' | 'image'
  backgroundValue: string
  showTime: boolean
  showLocation: boolean
  showTeacher: boolean
  showGrid: boolean
  showNonCurrentWeek: boolean
  nonCurrentWeekOpacity: number
  courseBorder: boolean
  courseRadius: number
  courseHeight: number
}

/** 默认外观（与 0003_schedule_style.sql 的列默认值一致）；新建课表时写入 schedule_style 行。 */
export const DEFAULT_SCHEDULE_STYLE: ScheduleStyle = {
  scheduleId: 0,
  backgroundType: 'color',
  backgroundValue: '#ffffff',
  showTime: true,
  showLocation: true,
  showTeacher: false,
  showGrid: true,
  showNonCurrentWeek: true,
  nonCurrentWeekOpacity: 0.35,
  courseBorder: false,
  courseRadius: 8,
  courseHeight: 1,
}
