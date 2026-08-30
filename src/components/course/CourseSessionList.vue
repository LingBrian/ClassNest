<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton, NCard, NEmpty, NSpace, useDialog, useMessage } from 'naive-ui'
import { useCourseStore } from '@/stores/course'
import CourseSessionEditor from './CourseSessionEditor.vue'
import type { CourseSession } from '@/models/session'

const props = defineProps<{ courseId: number }>()

const courseStore = useCourseStore()
const dialog = useDialog()
const message = useMessage()

const sessions = computed(() => courseStore.sessionsOf(props.courseId))

const weekdayLabels: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
}

const editorShow = ref(false)
const editingSessionId = ref<number | null>(null)

function weekText(session: CourseSession): string {
  return session.weekRule.ranges
    .map((r) => {
      const base = `${r.start}-${r.end}`
      return r.parity ? `${base}${r.parity === 'odd' ? '单' : '双'}` : base
    })
    .join('、')
}

function timeText(session: CourseSession): string {
  if (session.isCustomTime && session.startTime && session.endTime) {
    return `${session.startTime}-${session.endTime}`
  }
  return `第${session.startSection}-${session.endSection}节`
}

function onAdd(): void {
  editingSessionId.value = null
  editorShow.value = true
}

function onEdit(session: CourseSession): void {
  editingSessionId.value = session.id
  editorShow.value = true
}

function onDelete(session: CourseSession): void {
  dialog.warning({
    title: '删除时间段',
    content: `删除「${weekdayLabels[session.weekday]} ${timeText(session)}」？级联影响见 docs/DATABASE.md。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await courseStore.deleteSession(session.id)
      message.success('已删除时间段')
    },
  })
}
</script>

<template>
  <div class="session-list">
    <NCard :title="`时间段（${sessions.length}）`" size="small">
      <template #header-extra>
        <NButton size="small" type="primary" @click="onAdd">添加时间段</NButton>
      </template>

      <NEmpty v-if="sessions.length === 0" description="还没有时间段">
        <template #extra>
          <NButton size="small" @click="onAdd">添加时间段</NButton>
        </template>
      </NEmpty>

      <div v-for="session in sessions" :key="session.id" class="session-row">
        <div class="session-row-main">
          <span class="session-weekday">{{ weekdayLabels[session.weekday] }}</span>
          <span class="session-time">{{ timeText(session) }}</span>
          <span class="session-range">{{ weekText(session) }}周</span>
          <span v-if="session.location || session.teacher" class="session-meta">
            {{ [session.location, session.teacher].filter(Boolean).join(' · ') }}
          </span>
        </div>
        <NSpace size="small">
          <NButton size="tiny" @click="onEdit(session)">编辑</NButton>
          <NButton size="tiny" type="error" ghost @click="onDelete(session)">删除</NButton>
        </NSpace>
      </div>
    </NCard>

    <CourseSessionEditor
      v-model:show="editorShow"
      :course-id="props.courseId"
      :session-id="editingSessionId"
    />
  </div>
</template>

<style scoped lang="scss">
.session-list {
  padding: 8px 16px 24px;
}
.session-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 2px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.12);
}
.session-row-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 13px;
}
.session-weekday {
  font-weight: 600;
}
.session-meta {
  color: #888;
  font-size: 12px;
}
</style>
