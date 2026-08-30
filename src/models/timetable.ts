export interface TimeTable {
  id: number
  name: string
  isDefault: boolean
  sections: TimeSection[]
}

export interface TimeSection {
  id: number
  sectionNumber: number
  startTime: string
  endTime: string
}

/** 默认时间表节次（tech.md §14 示例约定：45 分钟 + 课间），新建课表时随 default timetable 写入。 */
export const DEFAULT_SECTION_TIMES: ReadonlyArray<{ startTime: string; endTime: string }> = [
  { startTime: '08:00', endTime: '08:45' },
  { startTime: '08:55', endTime: '09:40' },
  { startTime: '10:00', endTime: '10:45' },
  { startTime: '10:55', endTime: '11:40' },
  { startTime: '14:00', endTime: '14:45' },
  { startTime: '14:55', endTime: '15:40' },
  { startTime: '16:00', endTime: '16:45' },
  { startTime: '16:55', endTime: '17:40' },
  { startTime: '19:00', endTime: '19:45' },
  { startTime: '19:55', endTime: '20:40' },
  { startTime: '20:50', endTime: '21:35' },
  { startTime: '21:45', endTime: '22:30' },
]
