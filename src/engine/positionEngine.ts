import type { TimeTable, TimeSection } from '@/models/timetable'
import { timeToMinutes } from './dateEngine'

/** 课程卡在日列中的绝对定位（百分比，UI 直接消费到 top/height/left/width 属性）。 */
export interface Position {
  /** 距日列顶部百分比（0-100） */
  top: number
  /** 高度占日列百分比（0-100） */
  height: number
  /** 距日列左侧百分比（0-100） */
  left: number
  /** 宽度占日列百分比（0-100） */
  width: number
}

export interface CoursePositionInput {
  startSection: number
  endSection: number
  /** 自定义时间（HH:MM），仅 isCustomTime=true 时使用 */
  startTime?: string | null
  endTime?: string | null
  timetable: TimeTable
  /** 冲突布局中的列序号（0 起）；单列默认 0 */
  lane?: number
  /** 冲突布局列数；无冲突默认 1 */
  laneCount?: number
}

interface DaySpan {
  start: number
  end: number
}

export function findSection(
  sections: readonly TimeSection[],
  sectionNumber: number,
): TimeSection | null {
  return sections.find((s) => s.sectionNumber === sectionNumber) ?? null
}

function daySpanMinutes(sections: readonly TimeSection[]): DaySpan | null {
  let start = Number.POSITIVE_INFINITY
  let end = Number.NEGATIVE_INFINITY
  for (const section of sections) {
    const startMin = timeToMinutes(section.startTime)
    const endMin = timeToMinutes(section.endTime)
    if (startMin !== null) start = Math.min(start, startMin)
    if (endMin !== null) end = Math.max(end, endMin)
  }
  if (start === Number.POSITIVE_INFINITY || end === Number.NEGATIVE_INFINITY || end <= start) {
    return null
  }
  return { start, end }
}

/**
 * 计算课程卡定位（top / height / left / width，均为百分比）。
 * - 时刻来源：自定义时间优先；否则取时间表中对应节次的时刻；
 * - 坐标基准：时间表首节开始 ~ 末节结束（无时间信息时回退到节次索引布局）；
 * - 冲突布局由 lane / laneCount 决定横向分割。
 */
export function getCoursePosition(input: CoursePositionInput): Position {
  const { startSection, endSection, startTime, endTime, timetable, lane = 0, laneCount = 1 } = input
  const sections = timetable.sections

  let startMin = startTime ? timeToMinutes(startTime) : null
  if (startMin === null) {
    const section = findSection(sections, startSection)
    startMin = section ? timeToMinutes(section.startTime) : null
  }
  let endMin = endTime ? timeToMinutes(endTime) : null
  if (endMin === null) {
    const section = findSection(sections, endSection)
    endMin = section ? timeToMinutes(section.endTime) : null
  }

  let top: number
  let height: number
  const span = daySpanMinutes(sections)
  if (span && startMin !== null && endMin !== null) {
    const total = span.end - span.start
    top = total > 0 ? ((startMin - span.start) / total) * 100 : 0
    height = total > 0 ? ((endMin - startMin) / total) * 100 : 0
  } else {
    const rows = Math.max(1, sections.length)
    top = ((startSection - 1) / rows) * 100
    height = (Math.max(1, endSection - startSection + 1) / rows) * 100
  }

  top = Math.min(100, Math.max(0, top))
  height = Math.min(100 - top, Math.max(0, height))

  const safeLaneCount = Math.max(1, Math.floor(laneCount))
  const laneIndex = Math.min(Math.max(0, Math.floor(lane)), safeLaneCount - 1)
  const width = 100 / safeLaneCount
  const left = (laneIndex * 100) / safeLaneCount
  return { top, height, left, width }
}
