import { describe, expect, it } from 'vitest'
import { createDefaultWeekRule, type WeekRule } from '@/models/session'
import { isWeekMatched, getMatchedWeeks, weekRulesIntersect, matchesParity } from './weekRuleEngine'

function rangeRule(rule: WeekRule) {
  return { type: rule.type, ranges: [...rule.ranges] }
}

describe('weekRuleEngine.isWeekMatched', () => {
  it('1-16 连续周全部命中', () => {
    const rule = rangeRule(createDefaultWeekRule())
    for (let week = 1; week <= 16; week++) expect(isWeekMatched(rule, week)).toBe(true)
    expect(isWeekMatched(rule, 17)).toBe(false)
    expect(isWeekMatched(rule, 0)).toBe(false)
    expect(isWeekMatched(rule, -1)).toBe(false)
  })

  it('1-8 单周：只命中奇数周', () => {
    const rule: WeekRule = { type: 'range', ranges: [{ start: 1, end: 8, parity: 'odd' }] }
    expect(getMatchedWeeks(rule, 16)).toEqual([1, 3, 5, 7])
    expect(isWeekMatched(rule, 2)).toBe(false)
  })

  it('type=odd 时全局按单周过滤', () => {
    const rule: WeekRule = { type: 'odd', ranges: [{ start: 1, end: 8 }] }
    expect(getMatchedWeeks(rule, 16)).toEqual([1, 3, 5, 7])
    expect(isWeekMatched(rule, 8)).toBe(false)
  })

  it('2-16 双周：只命中偶数周', () => {
    const rule: WeekRule = { type: 'even', ranges: [{ start: 2, end: 16 }] }
    expect(getMatchedWeeks(rule, 16)).toEqual([2, 4, 6, 8, 10, 12, 14, 16])
    expect(isWeekMatched(rule, 1)).toBe(false)
  })

  it('1-5、7-11 自定义断周', () => {
    const rule: WeekRule = {
      type: 'custom',
      ranges: [
        { start: 1, end: 5 },
        { start: 7, end: 11 },
      ],
    }
    expect(getMatchedWeeks(rule, 16)).toEqual([1, 2, 3, 4, 5, 7, 8, 9, 10, 11])
    expect(isWeekMatched(rule, 6)).toBe(false)
    expect(isWeekMatched(rule, 12)).toBe(false)
  })

  it('7-11 单周 + 1-5 连续：混合奇偶', () => {
    const rule: WeekRule = {
      type: 'custom',
      ranges: [
        { start: 1, end: 5 },
        { start: 7, end: 11, parity: 'odd' },
      ],
    }
    expect(getMatchedWeeks(rule, 16)).toEqual([1, 2, 3, 4, 5, 7, 9, 11])
  })

  it('空 ranges 任何周都不命中', () => {
    const rule: WeekRule = { type: 'custom', ranges: [] }
    expect(isWeekMatched(rule, 5)).toBe(false)
  })

  it('matchesParity 奇偶判定', () => {
    expect(matchesParity('odd', 1)).toBe(true)
    expect(matchesParity('odd', 2)).toBe(false)
    expect(matchesParity('even', 2)).toBe(true)
    expect(matchesParity('even', 3)).toBe(false)
  })

  it('非整数周不命中（不与取整混淆）', () => {
    const rule = rangeRule(createDefaultWeekRule())
    expect(isWeekMatched(rule, 1.5)).toBe(false)
    expect(isWeekMatched(rule, 3.9)).toBe(false)
  })

  it('totalWeeks 为 0 或负数时返回空列表', () => {
    const rule = rangeRule(createDefaultWeekRule())
    expect(getMatchedWeeks(rule, 0)).toEqual([])
    expect(getMatchedWeeks(rule, -3)).toEqual([])
  })
})

describe('weekRuleEngine.weekRulesIntersect', () => {
  it('1-8 单周 与 2-16 单周 相交（3/5/7）', () => {
    const a: WeekRule = { type: 'range', ranges: [{ start: 1, end: 8, parity: 'odd' }] }
    const b: WeekRule = { type: 'odd', ranges: [{ start: 2, end: 16 }] }
    expect(weekRulesIntersect(a, b)).toBe(true)
  })

  it('1-5 与 7-11 不相交', () => {
    const a: WeekRule = { type: 'range', ranges: [{ start: 1, end: 5 }] }
    const b: WeekRule = { type: 'range', ranges: [{ start: 7, end: 11 }] }
    expect(weekRulesIntersect(a, b)).toBe(false)
  })

  it('首周与末周全周不重叠', () => {
    const a: WeekRule = { type: 'range', ranges: [{ start: 1, end: 8 }] }
    const b: WeekRule = { type: 'range', ranges: [{ start: 9, end: 16 }] }
    expect(weekRulesIntersect(a, b)).toBe(false)
  })

  it('至少一方为空的 rules 无交集', () => {
    const empty: WeekRule = { type: 'custom', ranges: [] }
    const full: WeekRule = { type: 'range', ranges: [{ start: 1, end: 8 }] }
    expect(weekRulesIntersect(empty, full)).toBe(false)
    expect(weekRulesIntersect(empty, empty)).toBe(false)
  })
})
