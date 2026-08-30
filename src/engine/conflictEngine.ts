import type { CourseSession } from '@/models/session'
import { weekRulesIntersect } from './weekRuleEngine'
import { timeToMinutes } from './dateEngine'

/** 一对发生冲突的时间段（保留两侧，冲突不删除后者），顺序按输入 courses 的下标升序。 */
export interface CourseConflict {
  sessionA: CourseSession
  sessionB: CourseSession
}

/** 自定义时间段的有效时刻区间（分钟）；无合法自定义时间返回 null。 */
function customMinutesInterval(session: CourseSession): [number, number] | null {
  if (!session.isCustomTime) return null
  const start = session.startTime ? timeToMinutes(session.startTime) : null
  const end = session.endTime ? timeToMinutes(session.endTime) : null
  if (start === null || end === null || end <= start) return null
  return [start, end]
}

function sectionRangesIntersect(a: CourseSession, b: CourseSession): boolean {
  return a.startSection <= b.endSection && b.startSection <= a.endSection
}

/**
 * 时间维度是否相交：
 * - 双方都有合法自定义时间 → 按真实时刻区间判断；
 * - 其余情况 → 按节次区间判断（节次区间相交视同时间相交）。
 */
function timeDimensionsOverlap(a: CourseSession, b: CourseSession): boolean {
  const ai = customMinutesInterval(a)
  const bi = customMinutesInterval(b)
  if (ai && bi) return ai[0] < bi[1] && bi[0] < ai[1]
  return sectionRangesIntersect(a, b)
}

function dateWindowsIntersect(a: CourseSession, b: CourseSession): boolean {
  if (!a.dateStart || !a.dateEnd || !b.dateStart || !b.dateEnd) return true
  return a.dateStart <= b.dateEnd && b.dateStart <= a.dateEnd
}

/**
 * 两个时间段是否冲突（docs/tech.md §24）：
 * weekday 相同 + week 相交 + section 区间相交；双方自定义时间时额外按时间判断。
 * 冲突不删除后者，两个时间段都要保留并做冲突布局。
 */
export function sessionsOverlap(a: CourseSession, b: CourseSession): boolean {
  if (a.weekday !== b.weekday) return false
  if (!weekRulesIntersect(a.weekRule, b.weekRule)) return false
  if (!timeDimensionsOverlap(a, b)) return false
  return dateWindowsIntersect(a, b)
}

/** 检测全部冲突对（两两比较，i < j 保证唯一与无重复）。 */
export function detectConflicts(courses: readonly CourseSession[]): CourseConflict[] {
  const conflicts: CourseConflict[] = []
  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      const a = courses[i]
      const b = courses[j]
      if (a && b && sessionsOverlap(a, b)) {
        conflicts.push({ sessionA: a, sessionB: b })
      }
    }
  }
  return conflicts
}
