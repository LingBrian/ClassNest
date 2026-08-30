import type { WeekRule, WeekRange } from '@/models/session'

/** 周奇偶匹配：奇数周 / 偶数周。 */
export function matchesParity(parity: 'odd' | 'even', week: number): boolean {
  return parity === 'odd' ? week % 2 === 1 : week % 2 === 0
}

/**
 * 计算一个区间实际生效的奇偶约束：
 * 区间自带 parity 优先；否则回退到 WeekRule.type（odd / even）。
 * type 为 range / custom 时无全局奇偶约束。
 */
function effectiveParity(rule: WeekRule, range: WeekRange): 'odd' | 'even' | null {
  if (range.parity) return range.parity
  if (rule.type === 'odd' || rule.type === 'even') return rule.type
  return null
}

/** week 是否命中 WeekRule（week 从 1 起）。 */
export function isWeekMatched(weekRule: WeekRule, week: number): boolean {
  if (!Number.isInteger(week) || week < 1) return false
  return weekRule.ranges.some((range) => {
    if (week < range.start || week > range.end) return false
    const parity = effectiveParity(weekRule, range)
    return parity === null || matchesParity(parity, week)
  })
}

/** 在 1..totalWeeks 中命中周数列表（升序）。 */
export function getMatchedWeeks(weekRule: WeekRule, totalWeeks: number): number[] {
  const max = Math.max(0, Math.floor(totalWeeks))
  const weeks: number[] = []
  for (let week = 1; week <= max; week++) {
    if (isWeekMatched(weekRule, week)) weeks.push(week)
  }
  return weeks
}

/** 两个 WeekRule 是否存在相交周数（以两者最大周数上界为探测范围）。 */
export function weekRulesIntersect(a: WeekRule, b: WeekRule): boolean {
  let bound = 0
  for (const range of a.ranges) bound = Math.max(bound, range.end)
  for (const range of b.ranges) bound = Math.max(bound, range.end)
  for (let week = 1; week <= bound; week++) {
    if (isWeekMatched(a, week) && isWeekMatched(b, week)) return true
  }
  return false
}
