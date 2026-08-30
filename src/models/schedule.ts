export interface Schedule {
  id: number
  /** 课表名称 */
  name: string
  /** 学期开始日期 YYYY-MM-DD */
  semesterStart: string
  currentWeek: number
  totalWeeks: number
  /** 1=周一 … 7=周日 */
  firstDayOfWeek: number
  /** 一天课程节数（ScheduleGrid 纵向格数） */
  sectionCount: number
  /** 关联时间表；空 = 使用默认时间表 */
  timeTableId?: number
  createdAt: string
  updatedAt: string
}
