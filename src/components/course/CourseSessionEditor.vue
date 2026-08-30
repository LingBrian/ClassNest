<script setup lang="ts">
import { ref } from 'vue'
import {
  NButton,
  NDrawer,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NSwitch,
  useMessage,
} from 'naive-ui'
import { useCourseStore } from '@/stores/course'
import { createDefaultWeekRule } from '@/models/session'
import type { CourseSession } from '@/models/session'

const props = defineProps<{
  courseId: number
  sessionId: number | null
  show: boolean
}>()

const emit = defineEmits<{ (e: 'update:show', value: boolean): void }>()

const courseStore = useCourseStore()
const message = useMessage()

const weekdayOptions = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 },
]

const isNew = () => props.sessionId === null

const form = ref({
  weekday: 1,
  startSection: 1,
  endSection: 2,
  teacher: '',
  location: '',
  isCustomTime: false,
  startTime: '08:00' as string | null,
  endTime: '09:00' as string | null,
  weekStart: 1,
  weekEnd: 16,
})

const saving = ref(false)

function toSectionCountLimit(): number {
  return 24
}

function openForCreate(): void {
  const defaultRule = createDefaultWeekRule()
  const range = defaultRule.ranges[0] ?? { start: 1, end: 16 }
  form.value = {
    weekday: 1,
    startSection: 1,
    endSection: 2,
    teacher: '',
    location: '',
    isCustomTime: false,
    startTime: '08:00',
    endTime: '09:00',
    weekStart: range.start,
    weekEnd: range.end,
  }
}

function openForEdit(session: CourseSession): void {
  const range = session.weekRule.ranges[0] ?? { start: 1, end: 16 }
  form.value = {
    weekday: session.weekday,
    startSection: session.startSection,
    endSection: session.endSection,
    teacher: session.teacher ?? '',
    location: session.location ?? '',
    isCustomTime: session.isCustomTime,
    startTime: session.startTime ?? '08:00',
    endTime: session.endTime ?? '09:00',
    weekStart: range.start,
    weekEnd: range.end,
  }
}

function onOpenChange(show: boolean): void {
  if (!show) return
  if (props.sessionId === null) openForCreate()
  else {
    const existing = courseStore.sessionsOf(props.courseId).find((s) => s.id === props.sessionId)
    if (existing) openForEdit(existing)
    else openForCreate()
  }
}

function validate(): string | null {
  if (form.value.endSection < form.value.startSection) return '结束节不能小于开始节'
  if (form.value.weekEnd < form.value.weekStart) return '结束周不能小于开始周'
  if (form.value.isCustomTime && (!form.value.startTime || !form.value.endTime))
    return '自定义时间需填写开始与结束时间'
  return null
}

async function save(): Promise<void> {
  const validation = validate()
  if (validation) {
    message.warning(validation)
    return
  }
  saving.value = true
  try {
    const payload = {
      weekday: form.value.weekday,
      startSection: form.value.startSection,
      endSection: form.value.endSection,
      teacher: form.value.teacher.trim() || null,
      location: form.value.location.trim() || null,
      weekRule: {
        type: 'range' as const,
        ranges: [{ start: form.value.weekStart, end: form.value.weekEnd }],
      },
      isCustomTime: form.value.isCustomTime,
      startTime: form.value.isCustomTime ? form.value.startTime : null,
      endTime: form.value.isCustomTime ? form.value.endTime : null,
    }
    if (isNew()) {
      await courseStore.createSession({ courseId: props.courseId, ...payload })
      message.success('已添加时间段')
    } else {
      await courseStore.updateSession(props.sessionId!, payload)
      message.success('已保存时间段')
    }
    emit('update:show', false)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    message.error(`保存失败：${detail}`)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <NDrawer
    :show="props.show"
    :width="400"
    placement="right"
    @update:show="emit('update:show', $event)"
    @after-enter="onOpenChange(props.show)"
  >
    <div class="session-editor">
      <h3 class="section-title">{{ isNew() ? '添加时间段' : '编辑时间段' }}</h3>
      <NForm label-placement="left" label-width="96">
        <NFormItem label="星期">
          <NSelect v-model:value="form.weekday" :options="weekdayOptions" />
        </NFormItem>
        <NFormItem label="开始节">
          <NInputNumber v-model:value="form.startSection" :min="1" :max="toSectionCountLimit()" />
        </NFormItem>
        <NFormItem label="结束节">
          <NInputNumber
            v-model:value="form.endSection"
            :min="form.startSection"
            :max="toSectionCountLimit()"
          />
        </NFormItem>
        <NFormItem label="开始周">
          <NInputNumber v-model:value="form.weekStart" :min="1" :max="99" />
        </NFormItem>
        <NFormItem label="结束周">
          <NInputNumber v-model:value="form.weekEnd" :min="form.weekStart" :max="99" />
        </NFormItem>
        <NFormItem label="老师">
          <NInput v-model:value="form.teacher" placeholder="可空" />
        </NFormItem>
        <NFormItem label="地点">
          <NInput v-model:value="form.location" placeholder="可空" />
        </NFormItem>
        <NFormItem label="自定义时间">
          <NSwitch v-model:value="form.isCustomTime" />
        </NFormItem>
        <NFormItem v-if="form.isCustomTime" label="开始时间">
          <NInput v-model:value="form.startTime" placeholder="HH:mm，如 08:00" />
        </NFormItem>
        <NFormItem v-if="form.isCustomTime" label="结束时间">
          <NInput v-model:value="form.endTime" placeholder="HH:mm，如 09:00" />
        </NFormItem>
      </NForm>
      <p class="session-editor-note">
        单双周/自定义周数完整编辑器将在 Phase 2（WeekRuleEngine）接入
      </p>
      <NSpace justify="end">
        <NButton @click="emit('update:show', false)">取消</NButton>
        <NButton type="primary" :loading="saving" @click="save">保存</NButton>
      </NSpace>
    </div>
  </NDrawer>
</template>

<style scoped lang="scss">
.session-editor {
  padding: 16px;
}
.section-title {
  margin: 0 0 16px;
  font-size: 15px;
}
.session-editor-note {
  color: #888;
  font-size: 12px;
  margin: 4px 0 12px;
}
</style>
