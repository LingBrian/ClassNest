<script setup lang="ts">
import { reactive, ref } from 'vue'
import {
  NButton,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  useMessage,
} from 'naive-ui'
import { useScheduleStore } from '@/stores/schedule'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ (e: 'update:show', value: boolean): void }>()

const scheduleStore = useScheduleStore()
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

const form = reactive({
  name: '',
  semesterStart: 0 as number | null,
  totalWeeks: 20,
  currentWeek: 1,
  sectionCount: 12,
  firstDayOfWeek: 1,
})

const submitting = ref(false)

function resetForm(): void {
  form.name = ''
  form.semesterStart = null
  form.totalWeeks = 20
  form.currentWeek = 1
  form.sectionCount = 12
  form.firstDayOfWeek = 1
}

function toDateIso(timestamp: number): string {
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function submit(): Promise<void> {
  if (!form.name.trim()) {
    message.warning('请输入课表名称')
    return
  }
  if (!form.semesterStart) {
    message.warning('请选择学期开始日期')
    return
  }
  submitting.value = true
  try {
    const created = await scheduleStore.createSchedule({
      name: form.name.trim(),
      semesterStart: toDateIso(form.semesterStart),
      totalWeeks: form.totalWeeks,
      currentWeek: form.currentWeek,
      sectionCount: form.sectionCount,
      firstDayOfWeek: form.firstDayOfWeek,
    })
    message.success(`课表「${created.name}」已创建`)
    emit('update:show', false)
    resetForm()
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    message.error(`创建课表失败：${detail}`)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <NModal
    :show="props.show"
    preset="card"
    title="新建课表"
    style="width: 480px"
    @update:show="emit('update:show', $event)"
  >
    <NForm label-placement="left" label-width="96">
      <NFormItem label="课表名称">
        <NInput v-model:value="form.name" placeholder="如：我的大学课表" />
      </NFormItem>
      <NFormItem label="学期开始">
        <NDatePicker
          v-model:value="form.semesterStart"
          type="date"
          clearable
          placeholder="选择日期"
        />
      </NFormItem>
      <NFormItem label="总周数">
        <NInputNumber v-model:value="form.totalWeeks" :min="1" :max="99" />
      </NFormItem>
      <NFormItem label="当前周">
        <NInputNumber v-model:value="form.currentWeek" :min="1" :max="form.totalWeeks" />
      </NFormItem>
      <NFormItem label="每天节数">
        <NInputNumber v-model:value="form.sectionCount" :min="1" :max="24" />
      </NFormItem>
      <NFormItem label="每周第一天">
        <NSelect v-model:value="form.firstDayOfWeek" :options="weekdayOptions" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="emit('update:show', false)">取消</NButton>
        <NButton type="primary" :loading="submitting" @click="submit">创建</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
