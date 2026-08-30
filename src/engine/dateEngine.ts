const MS_PER_DAY = 86_400_000

/** 解析 YYYY-MM-DD 为 UTC 日期（避免本地时区偏移导致跨天误差）。 */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) {
    throw new Error(`Invalid date: ${dateStr}`)
  }
  return new Date(Date.UTC(y, m - 1, d))
}

/** Date → YYYY-MM-DD（UTC）。 */
export function toDateString(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 日期 → 星期编号：1=周一 … 7=周日。 */
export function weekdayOf(date: Date): number {
  return ((date.getUTCDay() + 6) % 7) + 1
}

/**
 * 该日期所在周的第一天（按 firstDayOfWeek 对齐，1=周一 … 7=周日）。
 * 周起点取「当天及之前」最近的一个 firstDayOfWeek，属于周内定位语义。
 */
export function startOfWeekDate(date: Date, firstDayOfWeek: number): Date {
  const offset = (weekdayOf(date) - firstDayOfWeek + 7) % 7
  return new Date(date.getTime() - offset * MS_PER_DAY)
}

/**
 * 某学期的第 week 周、weekday 那天的日期。
 * 约定：包含 semesterStart 的那一周是第 1 周（week 从 1 起）；
 * week 1 的起点按 firstDayOfWeek 对齐到 semesterStart 之前最近的周首。
 */
export function getDateOfWeek(
  semesterStart: string,
  week: number,
  weekday: number,
  firstDayOfWeek = 1,
): string {
  const anchor = parseDate(semesterStart)
  const week1Start = startOfWeekDate(anchor, firstDayOfWeek)
  const offset = (weekday - firstDayOfWeek + 7) % 7
  const target = week1Start.getTime() + (week - 1) * 7 * MS_PER_DAY + offset * MS_PER_DAY
  return toDateString(new Date(target))
}

/** HH:MM → 当日分钟数；非法返回 null。 */
export function timeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

/**
 * 今天是学期内第几周（>=1，开学前按 1 处理）。
 * 约定：包含 semesterStart 的那一周是第 1 周。
 */
export function getCurrentWeek(semesterStart: string, today: string, firstDayOfWeek = 1): number {
  const week1Start = startOfWeekDate(parseDate(semesterStart), firstDayOfWeek)
  const todayStart = startOfWeekDate(parseDate(today), firstDayOfWeek)
  const diffDays = Math.round((todayStart.getTime() - week1Start.getTime()) / MS_PER_DAY)
  return Math.max(1, Math.floor(diffDays / 7) + 1)
}
