import { describe, expect, it } from 'vitest'
import { DEFAULT_SECTION_TIMES, type TimeTable } from '@/models/timetable'
import { getCoursePosition } from './positionEngine'

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

// 默认时间表日跨度：08:00(480) ~ 22:30(1350)，共 870 分钟
const timetable = makeTimetable()

describe('positionEngine.getCoursePosition', () => {
  it('1-2 节：从日列顶部开始，高度按 100 分钟折算', () => {
    const pos = getCoursePosition({ startSection: 1, endSection: 2, timetable })
    expect(pos.top).toBeCloseTo(0, 5)
    expect(pos.height).toBeCloseTo((100 / 870) * 100, 5) // ≈ 11.49
    expect(pos.left).toBe(0)
    expect(pos.width).toBe(100)
  })

  it('3-4 节：按真实时刻跨节次定位', () => {
    const pos = getCoursePosition({ startSection: 3, endSection: 4, timetable })
    expect(pos.top).toBeCloseTo((120 / 870) * 100, 5) // 10:00 起 ≈ 13.79
    expect(pos.height).toBeCloseTo((100 / 870) * 100, 5)
  })

  it('自定义时间：用真实时刻计算定位', () => {
    const pos = getCoursePosition({
      startSection: 1,
      endSection: 2,
      startTime: '14:00',
      endTime: '16:00',
      timetable,
    })
    expect(pos.top).toBeCloseTo((360 / 870) * 100, 5) // ≈ 41.38
    expect(pos.height).toBeCloseTo((120 / 870) * 100, 5) // ≈ 13.79
  })

  it('重叠超出日跨度末端时高度被钳制', () => {
    const pos = getCoursePosition({
      startSection: 1,
      endSection: 2,
      startTime: '20:00',
      endTime: '23:59',
      timetable,
    })
    expect(pos.top).toBeCloseTo((720 / 870) * 100, 5) // ≈ 82.76
    expect(pos.height).toBeCloseTo(100 - (720 / 870) * 100, 5) // 钳制到剩余高度 ≈ 17.24
  })

  it('冲突分列：lane/laneCount 决定 left/width', () => {
    const half = getCoursePosition({
      startSection: 1,
      endSection: 2,
      timetable,
      lane: 0,
      laneCount: 2,
    })
    const halfRight = getCoursePosition({
      startSection: 1,
      endSection: 2,
      timetable,
      lane: 1,
      laneCount: 2,
    })
    expect(half.left).toBe(0)
    expect(half.width).toBe(50)
    expect(halfRight.left).toBe(50)
    expect(halfRight.width).toBe(50)

    const quarter = getCoursePosition({
      startSection: 1,
      endSection: 2,
      timetable,
      lane: 2,
      laneCount: 4,
    })
    expect(quarter.left).toBe(50)
    expect(quarter.width).toBe(25)
  })

  it('时间表缺少对应节次时回退到节次索引定位', () => {
    const tiny: TimeTable = { id: 2, name: '少量节次', isDefault: false, sections: [] }
    const pos = getCoursePosition({ startSection: 1, endSection: 2, timetable: tiny })
    // 无任何节次时按 1 行兜底：top 0 / height 100
    expect(pos.top).toBe(0)
    expect(pos.height).toBe(100)
  })
})
