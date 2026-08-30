import { describe, expect, it } from 'vitest'
import {
  getDateOfWeek,
  getCurrentWeek,
  parseDate,
  toDateString,
  weekdayOf,
  startOfWeekDate,
  timeToMinutes,
} from './dateEngine'

describe('dateEngine.getDateOfWeek', () => {
  it('周一作为周首：第1周包含学期开始日', () => {
    // 2026-09-01 是周二；周一为首时第 1 周从 08-31（周一）开始
    expect(getDateOfWeek('2026-09-01', 1, 1)).toBe('2026-08-31')
    expect(getDateOfWeek('2026-09-01', 1, 3)).toBe('2026-09-02')
    expect(getDateOfWeek('2026-09-01', 1, 7)).toBe('2026-09-06')
  })

  it('跨月份：第 3 周开始进入 9 月中后段、第 6 周进入 10 月', () => {
    expect(getDateOfWeek('2026-09-01', 3, 1)).toBe('2026-09-14')
    expect(getDateOfWeek('2026-09-01', 6, 7)).toBe('2026-10-11')
  })

  it('跨年份：2025-12-29 周一开学，第 2 周进入 2026', () => {
    expect(getDateOfWeek('2025-12-29', 1, 1)).toBe('2025-12-29')
    expect(getDateOfWeek('2025-12-29', 1, 7)).toBe('2026-01-04')
    expect(getDateOfWeek('2025-12-29', 2, 1)).toBe('2026-01-05')
  })

  it('周日作为周首：第 1 周从距开学最近的周日开始', () => {
    // 2026-09-01（周二）所在周，周日为首 → 第 1 周 08-30（周日）~ 09-05（周六）
    expect(getDateOfWeek('2026-09-01', 1, 7, 7)).toBe('2026-08-30')
    expect(getDateOfWeek('2026-09-01', 1, 1, 7)).toBe('2026-08-31')
    expect(getDateOfWeek('2026-09-01', 2, 7, 7)).toBe('2026-09-06')
    expect(getDateOfWeek('2026-09-01', 2, 1, 7)).toBe('2026-09-07')
  })

  it('学期开始日恰为周首时直接对齐', () => {
    expect(getDateOfWeek('2025-12-29', 1, 1)).toBe('2025-12-29')
  })
})

describe('dateEngine.getCurrentWeek', () => {
  it('开学当周是第 1 周', () => {
    expect(getCurrentWeek('2026-09-01', '2026-09-01')).toBe(1)
    expect(getCurrentWeek('2026-09-01', '2026-09-03')).toBe(1)
  })

  it('下一周是第 2 周（跨月场景）', () => {
    expect(getCurrentWeek('2026-09-01', '2026-09-07')).toBe(2)
    expect(getCurrentWeek('2026-09-01', '2026-09-13')).toBe(2)
  })

  it('跨年份后仍是正常周数', () => {
    expect(getCurrentWeek('2025-12-29', '2026-01-05')).toBe(2)
    expect(getCurrentWeek('2025-12-29', '2026-01-12')).toBe(3)
  })

  it('周日作为周首时周界不同', () => {
    // 第 1 周 = 08-30（周日）~ 09-05（周六）；09-06 周日已是第 2 周周首
    expect(getCurrentWeek('2026-09-01', '2026-09-05', 7)).toBe(1)
    expect(getCurrentWeek('2026-09-01', '2026-09-06', 7)).toBe(2)
    expect(getCurrentWeek('2026-09-01', '2026-09-07', 7)).toBe(2)
  })

  it('开学前返回 1', () => {
    expect(getCurrentWeek('2026-09-01', '2026-08-28')).toBe(1)
  })
})

describe('dateEngine 辅助', () => {
  it('parseDate / toDateString / weekdayOf 往返正确', () => {
    const date = parseDate('2026-09-01')
    expect(toDateString(date)).toBe('2026-09-01')
    expect(weekdayOf(date)).toBe(2) // 周二
    expect(weekdayOf(parseDate('2026-08-30'))).toBe(7) // 周日
  })

  it('startOfWeekDate 按周首对齐', () => {
    expect(toDateString(startOfWeekDate(parseDate('2026-09-01'), 1))).toBe('2026-08-31')
    expect(toDateString(startOfWeekDate(parseDate('2026-09-01'), 7))).toBe('2026-08-30')
  })

  it('timeToMinutes 解析 H:MM / HH:MM', () => {
    expect(timeToMinutes('08:00')).toBe(480)
    expect(timeToMinutes('14:00')).toBe(840)
    expect(timeToMinutes('22:30')).toBe(1350)
    expect(timeToMinutes('9:40')).toBe(580)
    expect(timeToMinutes('24:00')).toBeNull()
    expect(timeToMinutes('08:60')).toBeNull()
    expect(timeToMinutes('abc')).toBeNull()
  })
})
