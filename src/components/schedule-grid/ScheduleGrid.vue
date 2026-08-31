<script setup lang="ts">
import { computed } from 'vue'
import type { RenderedCourse } from '@/engine/scheduleEngine'
import DayColumn from './DayColumn.vue'
import TimeAxis from './TimeAxis.vue'

const props = defineProps<{
  renderedByWeekday: Record<number, RenderedCourse[]>
  sectionCount: number
  todayWeekday: number
  currentWeek: number
}>()

const weekdayOrder = [1, 2, 3, 4, 5, 6, 7]
const weekdayLabels: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
}

const headerStyle = computed(() => ({
  gridTemplateColumns: '72px repeat(7, minmax(120px, 1fr))',
}))

// 共享行轨道：节次轴与所有日列使用同一组 grid-template-rows，
// 课程块按 positionEngine 产出的百分比 absolute 定位，天然与网格线严格对齐（Issue #5）。
const bodyStyle = computed(() => ({
  gridTemplateColumns: '72px repeat(7, minmax(120px, 1fr))',
  gridTemplateRows: `repeat(${Math.max(1, props.sectionCount)}, 64px)`,
}))
</script>

<template>
  <div class="schedule-grid">
    <div class="grid-header" :style="headerStyle">
      <div class="grid-corner">第 {{ props.currentWeek }} 周</div>
      <div
        v-for="w in weekdayOrder"
        :key="w"
        class="grid-weekday"
        :class="{ 'is-today': w === props.todayWeekday }"
      >
        {{ weekdayLabels[w] }}
      </div>
    </div>
    <div class="grid-body" :style="bodyStyle">
      <TimeAxis :section-count="props.sectionCount" />
      <DayColumn
        v-for="w in weekdayOrder"
        :key="w"
        :weekday="w"
        :courses="props.renderedByWeekday[w] ?? []"
        :section-count="props.sectionCount"
        :is-today="w === props.todayWeekday"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.schedule-grid {
  flex: 1;
  overflow: auto;
  padding: 0 12px 8px;
}
.grid-header,
.grid-body {
  display: grid;
  min-width: 920px;
}
.grid-header {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--n-color, #fff);
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}
.grid-corner,
.grid-weekday {
  padding: 6px 8px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  border-right: 1px solid rgba(128, 128, 128, 0.15);
  border-bottom: 1px solid rgba(128, 128, 128, 0.15);
}
.grid-weekday.is-today {
  color: #18a058;
}
</style>
