<script setup lang="ts">
import type { CourseSession } from '@/models/session'
import CourseCard from './CourseCard.vue'

const props = defineProps<{ label: string; sessions: CourseSession[]; isToday: boolean }>()
</script>

<template>
  <div class="day-column" :class="{ 'is-today': props.isToday }">
    <div v-for="session in props.sessions" :key="session.id" class="day-column-item">
      <CourseCard :session="session" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.day-column {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 2px;
  border-right: 1px solid rgba(128, 128, 128, 0.15);
  min-height: 200px;
}
.day-column.is-today {
  background: rgba(24, 160, 88, 0.06);
}
</style>
