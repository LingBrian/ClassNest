<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { RenderedCourse } from '@/engine/scheduleEngine'

const props = defineProps<{ course: RenderedCourse }>()

const router = useRouter()

const metaText = computed(() => {
  const parts: string[] = []
  parts.push(`第${props.course.startSection}-${props.course.endSection}节`)
  if (props.course.location) parts.push(props.course.location)
  if (props.course.teacher) parts.push(props.course.teacher)
  return parts.join(' · ')
})

const cardStyle = computed(() => ({
  top: `${props.course.top}%`,
  height: `${props.course.height}%`,
  left: `${props.course.left}%`,
  width: `${props.course.width}%`,
  backgroundColor: props.course.color,
  opacity: props.course.opacity,
}))

function open(): void {
  router.push(`/course/${props.course.courseId}/edit`)
}
</script>

<template>
  <div
    class="course-card"
    :class="{ 'is-conflict': props.course.conflict }"
    :style="cardStyle"
    @click="open"
  >
    <div class="course-card-title">{{ props.course.name }}</div>
    <div v-if="metaText" class="course-card-meta">{{ metaText }}</div>
  </div>
</template>

<style scoped lang="scss">
.course-card {
  position: absolute;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  padding: 4px 6px;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  text-align: left;
  font-size: 12px;
  line-height: 1.25;
}
.course-card-title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.course-card-meta {
  margin-top: 2px;
  font-size: 11px;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.course-card.is-conflict {
  box-shadow: inset 0 0 0 1px rgba(208, 48, 48, 0.8);
}
</style>
