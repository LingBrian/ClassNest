import { describe, expect, it } from 'vitest'
import { createDefaultWeekRule, type CourseSession, type WeekRule } from '@/models/session'
import { detectConflicts, sessionsOverlap } from './conflictEngine'

function session(overrides: Partial<CourseSession> = {}): CourseSession {
  return {
    id: 1,
    courseId: 1,
    weekday: 1,
    startSection: 1,
    endSection: 2,
    startTime: null,
    endTime: null,
    teacher: null,
    location: null,
    weekRule: createDefaultWeekRule(),
    dateStart: null,
    dateEnd: null,
    isCustomTime: false,
    ...overrides,
  }
}

function rule(ranges: Array<{ start: number; end: number; parity?: 'odd' | 'even' }>): WeekRule {
  return { type: 'custom', ranges }
}

describe('conflictEngine.sessionsOverlap', () => {
  it('同星期 + 周相交 + 节次相交 → 冲突', () => {
    const a = session({})
    const b = session({ id: 2, courseId: 2, startSection: 2, endSection: 3 })
    expect(sessionsOverlap(a, b)).toBe(true)
  })

  it('星期不同不冲突', () => {
    const a = session({})
    const b = session({ id: 2, courseId: 2, weekday: 3 })
    expect(sessionsOverlap(a, b)).toBe(false)
  })

  it('周数不相交不冲突（1-5 vs 7-11）', () => {
    const a = session({ weekRule: rule([{ start: 1, end: 5 }]) })
    const b = session({ id: 2, courseId: 2, weekRule: rule([{ start: 7, end: 11 }]) })
    expect(sessionsOverlap(a, b)).toBe(false)
  })

  it('节次区间不相交不冲突', () => {
    const a = session({})
    const b = session({ id: 2, courseId: 2, startSection: 5, endSection: 6 })
    expect(sessionsOverlap(a, b)).toBe(false)
  })

  it('双方自定义时间：按真实时刻判断，节次不相交但时间相交仍冲突', () => {
    const a = session({
      startSection: 1,
      endSection: 2,
      isCustomTime: true,
      startTime: '08:00',
      endTime: '09:00',
    })
    const b = session({
      id: 2,
      courseId: 2,
      startSection: 3,
      endSection: 4,
      isCustomTime: true,
      startTime: '08:30',
      endTime: '09:30',
    })
    expect(sessionsOverlap(a, b)).toBe(true)
  })

  it('双方自定义时间：时间不相交即使节次相交也不冲突', () => {
    const a = session({ isCustomTime: true, startTime: '08:00', endTime: '09:00' })
    const b = session({
      id: 2,
      courseId: 2,
      startSection: 1,
      endSection: 2,
      isCustomTime: true,
      startTime: '10:00',
      endTime: '11:00',
    })
    expect(sessionsOverlap(a, b)).toBe(false)
  })

  it('绝对日期区间不相交不冲突', () => {
    const a = session({ dateStart: '2026-09-01', dateEnd: '2026-09-07' })
    const b = session({ id: 2, courseId: 2, dateStart: '2026-09-14', dateEnd: '2026-09-20' })
    expect(sessionsOverlap(a, b)).toBe(false)
  })

  it('仅一方自定义时间：按节次区间判断', () => {
    const a = session({ isCustomTime: true, startTime: '10:00', endTime: '11:00' })
    const b = session({ id: 2, courseId: 2, startSection: 1, endSection: 2 })
    // 节次 1-2 相交（08:00~09:40），视为冲突
    expect(sessionsOverlap(a, b)).toBe(true)
  })

  it('自定义时间区间非法（end<=start）时退化到节次判断', () => {
    const a = session({ isCustomTime: true, startTime: '11:00', endTime: '10:00' })
    const b = session({ id: 2, courseId: 2, startSection: 1, endSection: 2 })
    expect(sessionsOverlap(a, b)).toBe(true)
  })
})

describe('conflictEngine.detectConflicts', () => {
  it('三个互相冲突的时段返回三对（保留两侧，不删除）', () => {
    const a = session({ id: 1, courseId: 1 })
    const b = session({ id: 2, courseId: 2 })
    const c = session({ id: 3, courseId: 3 })
    const conflicts = detectConflicts([a, b, c])
    expect(conflicts).toHaveLength(3)
    expect(conflicts.map((p) => [p.sessionA.id, p.sessionB.id])).toEqual([
      [1, 2],
      [1, 3],
      [2, 3],
    ])
  })

  it('同一课程多个时间段互不冲突且与其它课程同样判定', () => {
    const a = session({ id: 1, courseId: 1 })
    const b = session({ id: 2, courseId: 1, weekday: 3, startSection: 5, endSection: 6 })
    const conflicts = detectConflicts([a, b])
    expect(conflicts).toHaveLength(0)
  })
})
