<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { CourseSession } from '@/models/session'
import { useCourseStore } from '@/stores/course'

const props = defineProps<{ session: CourseSession }>()

const router = useRouter()
const courseStore = useCourseStore()

const courseName = computed(
  () => courseStore.courses.find((c) => c.id === props.session.courseId)?.name ?? '课程',
)

const metaText = computed(() => {
  const parts: string[] = []
  if (props.session.isCustomTime && props.session.startTime && props.session.endTime) {
    parts.push(`${props.session.startTime}-${props.session.endTime}`)
  } else {
    parts.push(`第${props.session.startSection}-${props.session.endSection}节`)
  }
  if (props.session.location) parts.push(props.session.location)
  if (props.session.teacher) parts.push(props.session.teacher)
  return parts.join(' · ')
})

function open(): void {
  router.push(`/course/${props.session.courseId}/edit`)
}
</script>

<template>
  <div class="course-card" @click="open">
    <div class="course-card-title">{{ courseName }}</div>
    <div v-if="metaText" class="course-card-meta">{{ metaText }}</div>
  </div>
</template>

<style scoped lang="scss">
.course-card {
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(24, 160, 88, 0.1);
  cursor: pointer;
  font-size: 12px;
}
.course-card-title {
  font-weight: 600;
}
.course-card-meta {
  color: #888;
  font-size: 11px;
  margin-top: 2px;
}
</style>
