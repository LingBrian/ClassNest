<script setup lang="ts">
import { NButton, useDialog, useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useScheduleStore } from '@/stores/schedule'

const props = defineProps<{ scheduleId: number }>()

const router = useRouter()
const scheduleStore = useScheduleStore()
const dialog = useDialog()
const message = useMessage()

function deleteSchedule(): void {
  const schedule = scheduleStore.schedules.find((s) => s.id === props.scheduleId)
  if (!schedule) return
  dialog.warning({
    title: '删除课表',
    content: `删除课表「${schedule.name}」会同时删除课程、时间段、调课和外观配置。此操作不可撤销，确定删除？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await scheduleStore.deleteSchedule(schedule.id)
        message.success(`课表「${schedule.name}」已删除，返回课表`)
        router.push('/')
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        message.error(`删除失败：${detail}`)
      }
    },
  })
}
</script>

<template>
  <div class="schedule-advanced-settings">
    <NButton type="error" ghost @click="deleteSchedule">删除此课表</NButton>
    <p class="schedule-advanced-hint">
      删除课表会级联删除课程、时间段、调课与外观配置（Phase 3 行为）。
    </p>
  </div>
</template>

<style scoped lang="scss">
.schedule-advanced-settings {
  max-width: 460px;
}
.schedule-advanced-hint {
  margin-top: 8px;
  color: #888;
  font-size: 12px;
}
</style>
