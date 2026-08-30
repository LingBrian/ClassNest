import type { Course } from '@/models/course'
import type { Schedule } from '@/models/schedule'
import type { CourseSession } from '@/models/session'
import type { TimeTable } from '@/models/timetable'
import { isWeekMatched } from './weekRuleEngine'
import { getDateOfWeek, timeToMinutes } from './dateEngine'
import { sessionsOverlap } from './conflictEngine'
import { getCoursePosition, findSection } from './positionEngine'

/** ScheduleEngine 统一输出，UI 只消费该结果（docs/tech.md §23、docs/API.md §3.1）。 */
export interface RenderedCourse {
  courseId: number
  sessionId: number
  name: string
  /** hex 颜色 */
  color: string
  /** 1=周一 … 7=周日 */
  weekday: number
  startSection: number
  endSection: number
  /** 实际时刻（自定义时间优先，否则取时间表对应节次）HH:MM */
  startTime: string
  endTime: string
  teacher?: string
  location?: string
  /** 当前周是否生效（WeekRule + 绝对日期区间综合） */
  weekMatched: boolean
  /** 是否存在时间重叠的冲突时段（weekday/周数/时间均相交） */
  conflict: boolean
  /** 与本时段冲突的课程 id（去重） */
  conflictCourseIds: number[]
  /** 非当前周透明度（当前周为 1，其余用配置值） */
  opacity: number
  /** 距日列顶部百分比 0-100 */
  top: number
  /** 高度百分比 0-100 */
  height: number
  /** 距日列左侧百分比 0-100（冲突布局分列） */
  left: number
  /** 宽度百分比 0-100（冲突布局分列） */
  width: number
}

export interface ScheduleEngineBuildOptions {
  schedule: Schedule
  courses: Course[]
  sessions: CourseSession[]
  timetable: TimeTable
  /** 非当前周课程透明度（0-1），默认 0.35（docs/tech.md §17 默认值） */
  nonCurrentWeekOpacity?: number
}

interface OverlapNode {
  /** index within the weekday bucket */
  index: number
  start: number
  end: number
}

function effectiveTime(
  session: CourseSession,
  timetable: TimeTable,
  which: 'start' | 'end',
): string {
  if (session.isCustomTime) {
    const custom = which === 'start' ? session.startTime : session.endTime
    if (custom) return custom
  }
  const section = findSection(
    timetable.sections,
    which === 'start' ? session.startSection : session.endSection,
  )
  if (section) return which === 'start' ? section.startTime : section.endTime
  return ''
}

/** 当前周该时段是否生效：WeekRule 命中 + 绝对日期区间包含当前周该 weekday 的日期。 */
function isActiveInWeek(session: CourseSession, schedule: Schedule): boolean {
  if (!isWeekMatched(session.weekRule, schedule.currentWeek)) return false
  if (!session.dateStart || !session.dateEnd) return true
  const date = getDateOfWeek(
    schedule.semesterStart,
    schedule.currentWeek,
    session.weekday,
    schedule.firstDayOfWeek,
  )
  return date >= session.dateStart && date <= session.dateEnd
}

/** 按 weekday 分组（保持输入顺序）。 */
function groupByWeekday(courses: readonly RenderedCourse[]): Map<number, RenderedCourse[]> {
  const groups = new Map<number, RenderedCourse[]>()
  for (const rc of courses) {
    const list = groups.get(rc.weekday) ?? []
    list.push(rc)
    groups.set(rc.weekday, list)
  }
  return groups
}

/**
 * 对同一 weekday 的一批时段做冲突分列：
 * 结构冲突（sessionsOverlap）作为连通判据，连通分量内部按时间区间贪心着色分配列。
 */
function assignConflictLanes(
  bucket: readonly RenderedCourse[],
  sessions: Map<number, CourseSession>,
): { left: number; width: number }[] {
  const n = bucket.length
  const result: { left: number; width: number }[] = bucket.map(() => ({ left: 0, width: 100 }))

  const adj: number[][] = Array.from({ length: n }, () => [])
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = sessions.get(bucket[i]!.sessionId)
      const b = sessions.get(bucket[j]!.sessionId)
      if (a && b && sessionsOverlap(a, b)) {
        adj[i]!.push(j)
        adj[j]!.push(i)
      }
    }
  }

  const visited = new Array<boolean>(n).fill(false)
  for (let start = 0; start < n; start++) {
    if (visited[start]) continue
    // BFS 收集连通分量
    const component: number[] = []
    const queue = [start]
    visited[start] = true
    while (queue.length > 0) {
      const current = queue.shift()!
      component.push(current)
      for (const next of adj[current]!) {
        if (!visited[next]) {
          visited[next] = true
          queue.push(next)
        }
      }
    }
    if (component.length === 1) continue

    // 贪心区间着色：按开始时刻排序，依次选择最早释放的列
    const nodes: OverlapNode[] = component.map((i) => {
      const rc = bucket[i]!
      return {
        index: i,
        start: timeToMinutes(rc.startTime) ?? 0,
        end: timeToMinutes(rc.endTime) ?? 0,
      }
    })
    nodes.sort((a, b) => a.start - b.start || a.end - b.end)

    const laneAssignments = new Map<number, number>()
    const laneEnds: number[] = []
    for (const node of nodes) {
      let lane = 0
      while (lane < laneEnds.length && laneEnds[lane]! > node.start) lane++
      if (lane === laneEnds.length) laneEnds.push(node.end)
      else laneEnds[lane] = node.end
      laneAssignments.set(node.index, lane)
    }

    const laneCount = laneEnds.length
    for (const [index, lane] of laneAssignments) {
      result[index] = { left: (lane * 100) / laneCount, width: 100 / laneCount }
    }
  }
  return result
}

/** 整合周过滤、跨节次定位与冲突布局，输出统一 RenderedCourse[]（docs/tech.md §23）。 */
export function build(options: ScheduleEngineBuildOptions): RenderedCourse[] {
  const { schedule, courses, sessions, timetable, nonCurrentWeekOpacity = 0.35 } = options

  const courseById = new Map<number, Course>()
  for (const course of courses) courseById.set(course.id, course)

  const sessionById = new Map<number, CourseSession>()
  for (const session of sessions) sessionById.set(session.id, session)

  const rendered: RenderedCourse[] = sessions.map((session) => {
    const course = courseById.get(session.courseId)
    const position = getCoursePosition({
      startSection: session.startSection,
      endSection: session.endSection,
      startTime: session.startTime,
      endTime: session.endTime,
      timetable,
    })
    const weekMatched = isActiveInWeek(session, schedule)
    return {
      courseId: session.courseId,
      sessionId: session.id,
      name: course?.name ?? '课程',
      color: course?.color ?? '#4C8DFF',
      weekday: session.weekday,
      startSection: session.startSection,
      endSection: session.endSection,
      startTime: effectiveTime(session, timetable, 'start'),
      endTime: effectiveTime(session, timetable, 'end'),
      teacher: session.teacher ?? undefined,
      location: session.location ?? undefined,
      weekMatched,
      conflict: false,
      conflictCourseIds: [],
      opacity: weekMatched ? 1 : Math.min(1, Math.max(0, nonCurrentWeekOpacity)),
      top: position.top,
      height: position.height,
      left: position.left,
      width: position.width,
    }
  })

  // 冲突基本信息（全局两两比较）
  for (let i = 0; i < rendered.length; i++) {
    const ids: number[] = []
    for (let j = 0; j < rendered.length; j++) {
      if (i === j) continue
      const a = sessions[i]
      const b = sessions[j]
      if (a && b && sessionsOverlap(a, b)) {
        if (!ids.includes(b.courseId)) ids.push(b.courseId)
      }
    }
    rendered[i]!.conflict = ids.length > 0
    rendered[i]!.conflictCourseIds = ids
  }

  // 冲突布局分列（按 weekday 桶处理）
  for (const [, bucket] of groupByWeekday(rendered)) {
    const lanes = assignConflictLanes(bucket, sessionById)
    for (let k = 0; k < bucket.length; k++) {
      bucket[k]!.left = lanes[k]!.left
      bucket[k]!.width = lanes[k]!.width
    }
  }

  return rendered
}
