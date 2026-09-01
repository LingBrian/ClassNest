<script setup lang="ts">
import { computed } from 'vue'
import type { RenderedCourse } from '@/engine/scheduleEngine'
import CourseCard from './CourseCard.vue'

const props = defineProps<{
  weekday: number
  courses: RenderedCourse[]
  sectionCount: number
  isToday: boolean
}>()

const columnStyle = computed(() => ({
  gridColumn: props.weekday + 1,
  gridRow: '1 / -1',
}))

// 节次分隔线：top 为百分比，与共享 grid-template-rows 的行边界一一对应。
const rowLines = computed(() => {
  const count = Math.max(1, props.sectionCount)
  return Array.from({ length: count - 1 }, (_, i) => ({
    id: i + 1,
    top: ((i + 1) / count) * 100,
  }))
})
</script>

<template>
  <div class="day-column" :class="{ 'is-today': props.isToday }" :style="columnStyle">
    <div
      v-for="line in rowLines"
      :key="line.id"
      class="day-row-line"
      :style="{ top: `${line.top}%` }"
    />
    <CourseCard v-for="course in props.courses" :key="course.sessionId" :course="course" />
  </div>
</template>

<style scoped lang="scss">
.day-column {
  position: relative;
  background: rgba(255, 255, 255, 0.5);
  border-right: 1px solid rgba(128, 128, 128, 0.15);
}
.day-column.is-today {
  background: rgba(24, 160, 88, 0.06);
}
.day-row-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 0;
  border-top: 1px solid rgba(128, 128, 128, 0.1);
  pointer-events: none;
}
</style>
