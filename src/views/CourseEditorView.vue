<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { NButton } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import CourseEditor from '@/components/course/CourseEditor.vue'
import CourseSessionList from '@/components/course/CourseSessionList.vue'

const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()

const courseId = computed(() => {
  const raw = route.params.id
  const id = typeof raw === 'string' ? Number(raw) : Number.NaN
  return Number.isFinite(id) && id > 0 ? id : null
})

onMounted(async () => {
  if (courseId.value === null) return
  try {
    await courseStore.ensureCourse(courseId.value)
    await courseStore.ensureSessions(courseId.value)
  } catch (error) {
    // store.error 已记录，编辑页会通过消息兜底提示；不允许 Uncaught Promise
    void error
  }
})
</script>

<template>
  <div class="course-editor-view">
    <div class="course-editor-view-toolbar">
      <NButton quaternary size="small" @click="router.push('/')">← 返回课表</NButton>
    </div>
    <CourseEditor :course-id="courseId" />
    <CourseSessionList v-if="courseId !== null" :course-id="courseId" />
  </div>
</template>

<style scoped lang="scss">
.course-editor-view {
  height: 100%;
  overflow: auto;
}
.course-editor-view-toolbar {
  padding: 8px 16px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.12);
}
</style>
