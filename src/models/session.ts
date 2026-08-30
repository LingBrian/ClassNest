export interface WeekRule {
  type: 'range' | 'odd' | 'even' | 'custom'
  ranges: WeekRange[]
}

export interface WeekRange {
  start: number
  end: number
  parity?: 'odd' | 'even'
}

export interface CourseSession {
  id: number
  courseId: number
  /** 1=周一 … 7=周日 */
  weekday: number
  startSection: number
  endSection: number
  /** 仅 isCustomTime=true 时必填 */
  startTime?: string | null
  endTime?: string | null
  teacher?: string | null
  location?: string | null
  weekRule: WeekRule
  /** 可选绝对日期区间（跨学期/短学期） */
  dateStart?: string | null
  dateEnd?: string | null
  isCustomTime: boolean
}

/** 新建时间段时的默认周规则：第 1-16 周。每次返回新对象，避免共享可变引用。 */
export function createDefaultWeekRule(): WeekRule {
  return { type: 'range', ranges: [{ start: 1, end: 16 }] }
}

function isWeekRule(value: unknown): value is WeekRule {
  if (typeof value !== 'object' || value === null) return false
  const rule = value as { type?: unknown; ranges?: unknown }
  if (
    rule.type !== 'range' &&
    rule.type !== 'odd' &&
    rule.type !== 'even' &&
    rule.type !== 'custom'
  ) {
    return false
  }
  if (!Array.isArray(rule.ranges)) return false
  return rule.ranges.every((item) => {
    if (typeof item !== 'object' || item === null) return false
    const range = item as { start?: unknown; end?: unknown; parity?: unknown }
    if (typeof range.start !== 'number' || typeof range.end !== 'number') return false
    return range.parity === undefined || range.parity === 'odd' || range.parity === 'even'
  })
}

/** DB 的 week_rule JSON 字符串 → WeekRule；非法/旧数据回退默认周规则。 */
export function deserializeWeekRule(raw: string): WeekRule {
  let parsed: unknown = null
  try {
    parsed = JSON.parse(raw)
  } catch {
    return createDefaultWeekRule()
  }
  return isWeekRule(parsed) ? parsed : createDefaultWeekRule()
}

/** WeekRule → DB 的 week_rule JSON 字符串。 */
export function serializeWeekRule(rule: WeekRule): string {
  return JSON.stringify(rule)
}
