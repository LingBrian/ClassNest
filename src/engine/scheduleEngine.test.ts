import { describe, expect, it } from 'vitest'
import type { Course } from '@/models/course'
import type { Schedule } from '@/models/schedule'
import { createDefaultWeekRule, type CourseSession } from '@/models/session'
import { DEFAULT_SECTION_TIMES, type TimeTable } from '@/models/timetable'
import { build, type RenderedCourse } from './scheduleEngine'

function makeTimetable(): TimeTable {
  return {
    id: 1,
    name: '默认时间表',
    isDefault: true,
    sections: DEFAULT_SECTION_TIMES.map((t, i) => ({
      id: i + 1,
      sectionNumber: i + 1,
      startTime: t.startTime,
      endTime: t.endTime,
    })),
  }
}

function makeSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    id: 1,
    name: '课表A',
    semesterStart: '2026-09-01',
    currentWeek: 3,
    totalWeeks: 16,
    firstDayOfWeek: 1,
    sectionCount: 12,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 1,
    scheduleId: 1,
    name: '高等数学',
    color: '#4C8DFF',
    credits: 4,
    note: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

function makeSession(overrides: Partial<CourseSession> = {}): CourseSession {
  return {
    id: 1,
    courseId: 1,
    weekday: 1,
    startSection: 1,
    endSection: 2,
    startTime: null,
    endTime: null,
    teacher: '张老师',
    location: '逸夫楼 101',
    weekRule: createDefaultWeekRule(),
    dateStart: null,
    dateEnd: null,
    isCustomTime: false,
    ...overrides,
  }
}

const timetable = makeTimetable()

function findById(rendered: RenderedCourse[], sessionId: number): RenderedCourse {
  const found = rendered.find((r) => r.sessionId === sessionId)
  if (!found) throw new Error(`session ${sessionId} not rendered`)
  return found
}

describe('scheduleEngine 周过滤', () => {
  it('1-16 周命中当前周，透明度为 1；双周/自定义断周课程不命中并降透明度', () => {
    const schedule = makeSchedule({ currentWeek: 3 }) // 2026 第3周（奇数周）
    const rendered = build({
      schedule,
      courses: [
        makeCourse({ id: 1, name: '高等数学' }),
        makeCourse({ id: 2, name: '线性代数' }),
        makeCourse({ id: 3, name: '英语' }),
      ],
      sessions: [
        makeSession({ id: 1, courseId: 1 }),
        makeSession({
          id: 2,
          courseId: 2,
          weekRule: { type: 'even', ranges: [{ start: 2, end: 16 }] },
        }),
        makeSession({
          id: 3,
          courseId: 3,
          weekRule: { type: 'custom', ranges: [{ start: 7, end: 11 }] },
        }),
      ],
      timetable,
    })

    expect(findById(rendered, 1).weekMatched).toBe(true)
    expect(findById(rendered, 1).opacity).toBe(1)
    expect(findById(rendered, 2).weekMatched).toBe(false)
    expect(findById(rendered, 2).opacity).toBeCloseTo(0.35, 5)
    expect(findById(rendered, 3).weekMatched).toBe(false)
  })

  it('绝对日期区间：当前周落在区间内才生效', () => {
    const windowSession = makeSession({ id: 1, dateStart: '2026-09-14', dateEnd: '2026-09-27' })
    const courses = [makeCourse({ id: 1, name: '实验' })]
    const inWindow = build({
      schedule: makeSchedule({ currentWeek: 3 }),
      courses,
      sessions: [windowSession],
      timetable,
    })
    expect(findById(inWindow, 1).weekMatched).toBe(true)

    // 第 5 周周一为 09-28，超出了日期区间
    const afterWindow = build({
      schedule: makeSchedule({ currentWeek: 5 }),
      courses,
      sessions: [windowSession],
      timetable,
    })
    expect(findById(afterWindow, 1).weekMatched).toBe(false)
  })

  it('非当前周透明度可用配置覆盖并钳制在 0-1', () => {
    const rendered = build({
      schedule: makeSchedule({ currentWeek: 3 }),
      courses: [makeCourse({ id: 1 })],
      sessions: [
        makeSession({ id: 1, weekRule: { type: 'custom', ranges: [{ start: 7, end: 11 }] } }),
      ],
      timetable,
      nonCurrentWeekOpacity: 0.5,
    })
    expect(findById(rendered, 1).opacity).toBe(0.5)
  })
})

describe('scheduleEngine 边界', () => {
  it('无任何时间段时返回空数组', () => {
    const rendered = build({
      schedule: makeSchedule(),
      courses: [makeCourse({ id: 1 })],
      sessions: [],
      timetable,
    })
    expect(rendered).toEqual([])
  })

  it('时间表缺少该节次时 startTime/endTime 回退为空串', () => {
    const tiny: TimeTable = { id: 2, name: '少量节次', isDefault: false, sections: [] }
    const rendered = build({
      schedule: makeSchedule(),
      courses: [makeCourse({ id: 1 })],
      sessions: [makeSession({ id: 1, startSection: 1, endSection: 2 })],
      timetable: tiny,
    })
    expect(rendered[0]?.startTime).toBe('')
    expect(rendered[0]?.endTime).toBe('')
  })

  it('课程不存在于 courses 时回退到默认名称与颜色', () => {
    const rendered = build({
      schedule: makeSchedule(),
      courses: [],
      sessions: [makeSession({ id: 1, courseId: 99 })],
      timetable,
    })
    expect(rendered[0]?.name).toBe('课程')
    expect(rendered[0]?.color).toBe('#4C8DFF')
  })
})

describe('scheduleEngine 多时间段', () => {
  it('一门课程多个时间段各自渲染', () => {
    const rendered = build({
      schedule: makeSchedule(),
      courses: [makeCourse({ id: 1, name: '高等数学', color: '#E0A030' })],
      sessions: [
        makeSession({ id: 1, courseId: 1, weekday: 1 }),
        makeSession({ id: 2, courseId: 1, weekday: 3, startSection: 5, endSection: 6 }),
      ],
      timetable,
    })
    expect(rendered).toHaveLength(2)
    expect(rendered[0]?.weekday).toBe(1)
    expect(rendered[1]?.weekday).toBe(3)
    expect(rendered[0]?.name).toBe('高等数学')
    expect(rendered[1]?.color).toBe('#E0A030')
  })
})

describe('scheduleEngine 跨节次定位', () => {
  it('1-2 节按时间表时刻计算 top/height', () => {
    const rendered = build({
      schedule: makeSchedule(),
      courses: [makeCourse({ id: 1 })],
      sessions: [makeSession({ id: 1 })],
      timetable,
    })
    expect(rendered[0]?.top).toBeCloseTo(0, 5)
    expect(rendered[0]?.height).toBeCloseTo((100 / 870) * 100, 5)
    expect(rendered[0]?.startTime).toBe('08:00')
    expect(rendered[0]?.endTime).toBe('09:40')
    expect(rendered[0]?.left).toBe(0)
    expect(rendered[0]?.width).toBe(100)
  })

  it('自定义时间用真实时刻定位并回填 startTime/endTime', () => {
    const rendered = build({
      schedule: makeSchedule(),
      courses: [makeCourse({ id: 1 })],
      sessions: [makeSession({ id: 1, isCustomTime: true, startTime: '14:00', endTime: '16:00' })],
      timetable,
    })
    expect(rendered[0]?.startTime).toBe('14:00')
    expect(rendered[0]?.endTime).toBe('16:00')
    expect(rendered[0]?.top).toBeCloseTo((360 / 870) * 100, 5)
    expect(rendered[0]?.height).toBeCloseTo((120 / 870) * 100, 5)
  })
})

describe('scheduleEngine 冲突布局', () => {
  it('两个冲突时段分左右两列，各占 50% 宽并互相标记', () => {
    const rendered = build({
      schedule: makeSchedule(),
      courses: [makeCourse({ id: 1, name: '高数' }), makeCourse({ id: 2, name: '物理' })],
      sessions: [makeSession({ id: 1, courseId: 1 }), makeSession({ id: 2, courseId: 2 })],
      timetable,
    })
    const a = findById(rendered, 1)
    const b = findById(rendered, 2)
    expect(a.conflict).toBe(true)
    expect(b.conflict).toBe(true)
    expect(a.conflictCourseIds).toEqual([2])
    expect(b.conflictCourseIds).toEqual([1])
    expect(a.left).toBe(0)
    expect(a.width).toBe(50)
    expect(b.left).toBeCloseTo(50, 5)
    expect(b.width).toBeCloseTo(50, 5)
  })

  it('三个互相冲突的时段分成三列', () => {
    const rendered = build({
      schedule: makeSchedule(),
      courses: [makeCourse({ id: 1 }), makeCourse({ id: 2 }), makeCourse({ id: 3 })],
      sessions: [
        makeSession({ id: 1, courseId: 1, startSection: 1, endSection: 2 }),
        makeSession({ id: 2, courseId: 2, startSection: 2, endSection: 3 }),
        makeSession({ id: 3, courseId: 3, startSection: 1, endSection: 3 }),
      ],
      timetable,
    })
    const widths = rendered.map((r) => r.width)
    const lefts = rendered.map((r) => r.left)
    expect(widths[0]).toBeCloseTo(100 / 3, 5)
    expect(widths[1]).toBeCloseTo(100 / 3, 5)
    expect(widths[2]).toBeCloseTo(100 / 3, 5)
    expect(lefts[0]).toBe(0)
    expect(lefts[1]).toBeCloseTo(2 * (100 / 3), 5)
    expect(lefts[2]).toBeCloseTo(100 / 3, 5)
    expect(rendered.every((r) => r.conflict)).toBe(true)
  })

  it('周数不相交的同节次课程不冲突，占整列', () => {
    const rendered = build({
      schedule: makeSchedule(),
      courses: [makeCourse({ id: 1, name: '高数' }), makeCourse({ id: 2, name: '物理' })],
      sessions: [
        makeSession({
          id: 1,
          courseId: 1,
          weekRule: { type: 'range', ranges: [{ start: 1, end: 8 }] },
        }),
        makeSession({
          id: 2,
          courseId: 2,
          weekRule: { type: 'range', ranges: [{ start: 9, end: 16 }] },
        }),
      ],
      timetable,
    })
    expect(findById(rendered, 1).conflict).toBe(false)
    expect(findById(rendered, 2).conflict).toBe(false)
    expect(findById(rendered, 1).width).toBe(100)
    expect(findById(rendered, 2).width).toBe(100)
  })

  it('自定义时间冲突参与分列', () => {
    const rendered = build({
      schedule: makeSchedule(),
      courses: [makeCourse({ id: 1 }), makeCourse({ id: 2 })],
      sessions: [
        makeSession({
          id: 1,
          courseId: 1,
          isCustomTime: true,
          startTime: '08:00',
          endTime: '09:00',
        }),
        makeSession({
          id: 2,
          courseId: 2,
          isCustomTime: true,
          startTime: '08:30',
          endTime: '09:30',
        }),
      ],
      timetable,
    })
    expect(findById(rendered, 1).conflict).toBe(true)
    expect(findById(rendered, 1).width).toBe(50)
    expect(findById(rendered, 2).width).toBe(50)
  })
})
