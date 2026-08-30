<script setup lang="ts">
import type { CourseSession } from '@/models/session'
import DayColumn from './DayColumn.vue'
import TimeAxis from './TimeAxis.vue'

const props = defineProps<{
  sessionsByWeekday: Record<number, CourseSession[]>
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
</script>

<template>
  <div class="schedule-grid">
    <div class="grid-header" :style="{ gridTemplateColumns: `72px repeat(7, minmax(120px, 1fr))` }">
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
    <div class="grid-body" :style="{ gridTemplateColumns: `72px repeat(7, minmax(120px, 1fr))` }">
      <TimeAxis :section-count="props.sectionCount" />
      <DayColumn
        v-for="w in weekdayOrder"
        :key="w"
        :label="weekdayLabels[w]"
        :sessions="props.sessionsByWeekday[w] ?? []"
        :is-today="w === props.todayWeekday"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.schedule-grid {
  flex: 1;
  overflow: auto;
  padding: 8px 12px;
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
