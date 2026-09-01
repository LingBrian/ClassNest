<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  NButton,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  useMessage,
} from 'naive-ui'
import { useRouter } from 'vue-router'
import { useScheduleStore } from '@/stores/schedule'
import type { Schedule } from '@/models/schedule'

const props = defineProps<{ scheduleId: number }>()

const router = useRouter()
const scheduleStore = useScheduleStore()
const message = useMessage()

const current = computed(
  () => scheduleStore.schedules.find((s) => s.id === props.scheduleId) ?? null,
)

const form = ref({
  name: '',
  semesterStart: 0 as number | null,
  currentWeek: 1,
  totalWeeks: 20,
  sectionCount: 12,
  firstDayOfWeek: 1,
})

const weekdayOptions = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 },
]

function toDayStart(iso: string): number {
  return new Date(`${iso}T00:00:00`).getTime()
}

function toDateIso(timestamp: number): string {
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fillForm(schedule: Schedule): void {
  form.value = {
    name: schedule.name,
    semesterStart: toDayStart(schedule.semesterStart),
    currentWeek: schedule.currentWeek,
    totalWeeks: schedule.totalWeeks,
    sectionCount: schedule.sectionCount,
    firstDayOfWeek: schedule.firstDayOfWeek,
  }
}

watch(current, (schedule) => {
  if (schedule) fillForm(schedule)
})

onMounted(() => {
  if (current.value) fillForm(current.value)
})

const saving = ref(false)

async function save(): Promise<void> {
  if (!current.value) return
  if (!form.value.name.trim()) {
    message.warning('课表名称不能为空')
    return
  }
  if (!form.value.semesterStart) {
    message.warning('请选择学期开始日期')
    return
  }
  saving.value = true
  try {
    await scheduleStore.updateSchedule(current.value.id, {
      name: form.value.name.trim(),
      semesterStart: toDateIso(form.value.semesterStart),
      currentWeek: form.value.currentWeek,
      totalWeeks: form.value.totalWeeks,
      sectionCount: form.value.sectionCount,
      firstDayOfWeek: form.value.firstDayOfWeek,
    })
    message.success('已保存，返回课表')
    router.push('/')
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    message.error(`保存失败：${detail}`)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="schedule-basic-settings">
    <NForm v-if="form" label-placement="left" label-width="96">
      <NFormItem label="课表名称">
        <NInput v-model:value="form.name" placeholder="课表名称" />
      </NFormItem>
      <NFormItem label="学期开始">
        <NDatePicker
          v-model:value="form.semesterStart"
          type="date"
          clearable
          placeholder="选择日期"
        />
      </NFormItem>
      <NFormItem label="当前周">
        <NInputNumber v-model:value="form.currentWeek" :min="1" :max="form.totalWeeks" />
      </NFormItem>
      <NFormItem label="总周数">
        <NInputNumber v-model:value="form.totalWeeks" :min="1" :max="99" />
      </NFormItem>
      <NFormItem label="每天节数">
        <NInputNumber v-model:value="form.sectionCount" :min="1" :max="24" />
      </NFormItem>
      <NFormItem label="每周第一天">
        <NSelect v-model:value="form.firstDayOfWeek" :options="weekdayOptions" />
      </NFormItem>
    </NForm>
    <NButton type="primary" :loading="saving" @click="save">保存</NButton>
  </div>
</template>

<style scoped lang="scss">
.schedule-basic-settings {
  max-width: 460px;
}
</style>
