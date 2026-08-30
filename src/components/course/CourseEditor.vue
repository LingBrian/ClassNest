<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  NButton,
  NColorPicker,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSpace,
  useMessage,
} from 'naive-ui'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { useScheduleStore } from '@/stores/schedule'
import { DEFAULT_COURSE_COLOR } from '@/repositories/CourseRepository'

const props = defineProps<{ courseId: number | null }>()

const courseStore = useCourseStore()
const scheduleStore = useScheduleStore()
const router = useRouter()
const message = useMessage()

const isNew = computed(() => props.courseId === null)

const form = reactive({
  name: '',
  color: DEFAULT_COURSE_COLOR,
  credits: null as number | null,
  note: '',
})

const saving = ref(false)

watch(
  () => courseStore.courses.find((c) => c.id === props.courseId),
  (course) => {
    if (course) {
      form.name = course.name
      form.color = course.color
      form.credits = course.credits ?? null
      form.note = course.note ?? ''
    }
  },
  { immediate: !!props.courseId },
)

function validate(): boolean {
  if (!form.name.trim()) {
    message.warning('请输入课程名称')
    return false
  }
  return true
}

async function save(): Promise<void> {
  if (!validate()) return
  saving.value = true
  try {
    if (isNew.value) {
      const scheduleId = scheduleStore.activeScheduleId
      if (scheduleId === null) {
        message.warning('请先创建课表')
        return
      }
      const created = await courseStore.createCourse({
        scheduleId,
        name: form.name.trim(),
        color: form.color,
        credits: form.credits,
        note: form.note.trim() || null,
      })
      message.success(`课程「${created.name}」已创建`)
      router.push(`/course/${created.id}/edit`)
    } else {
      await courseStore.updateCourse(props.courseId!, {
        name: form.name.trim(),
        color: form.color,
        credits: form.credits,
        note: form.note.trim() || null,
      })
      message.success('已保存')
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    message.error(`保存失败：${detail}`)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="isNew && !scheduleStore.hasSchedules" class="course-editor-empty">
    <NEmpty description="还没有课表，请先创建课表">
      <template #extra>
        <NButton size="small" @click="router.push('/')">返回课表</NButton>
      </template>
    </NEmpty>
  </div>
  <div v-else class="course-editor">
    <h3 class="section-title">{{ isNew ? '新增课程' : '编辑课程' }}</h3>
    <NForm label-placement="left" label-width="72">
      <NFormItem label="课程名称">
        <NInput v-model:value="form.name" placeholder="如：高等数学" />
      </NFormItem>
      <NFormItem label="课程颜色">
        <NColorPicker v-model:value="form.color" />
      </NFormItem>
      <NFormItem label="学分">
        <NInputNumber
          v-model:value="form.credits"
          :min="0"
          :max="30"
          :step="0.5"
          placeholder="可空"
        />
      </NFormItem>
      <NFormItem label="备注">
        <NInput v-model:value="form.note" type="textarea" placeholder="可空" />
      </NFormItem>
    </NForm>
    <NSpace>
      <NButton type="primary" :loading="saving" @click="save">{{
        isNew ? '创建课程' : '保存'
      }}</NButton>
      <NButton v-if="!isNew" @click="router.push('/')">返回课表</NButton>
    </NSpace>
  </div>
</template>

<style scoped lang="scss">
.course-editor {
  padding: 12px 16px;
}
.course-editor-empty {
  padding: 48px;
}
.section-title {
  margin: 0 0 12px;
  font-size: 15px;
}
</style>
