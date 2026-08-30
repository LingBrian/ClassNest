<script setup lang="ts">
import { NButton, NDropdown, NSpace, type DropdownOption } from 'naive-ui'
import { useRouter } from 'vue-router'

const props = defineProps<{ scheduleName: string; scheduleId: number }>()
const emit = defineEmits<{ (e: 'openCreate'): void }>()

const router = useRouter()

const moreOptions: DropdownOption[] = [
  { label: '新建课表', key: 'create' },
  { label: '课表管理', key: 'schedules' },
  { label: '课表设置', key: 'schedule-settings' },
  { label: '全局设置', key: 'app-settings' },
  { type: 'divider', key: 'd1' },
  { label: '导入课表', key: 'import' },
  { label: '导出课表', key: 'export' },
]

function onMore(key: string): void {
  switch (key) {
    case 'create':
      emit('openCreate')
      break
    case 'schedules':
      router.push('/schedules')
      break
    case 'schedule-settings':
      router.push(`/schedule/${props.scheduleId}/settings`)
      break
    case 'app-settings':
      router.push('/settings')
      break
    case 'import':
      router.push('/import')
      break
    case 'export':
      router.push('/export')
      break
  }
}
</script>

<template>
  <div class="schedule-header">
    <span class="schedule-name" @click="router.push('/schedules')">{{ props.scheduleName }}</span>
    <NSpace align="center" size="small">
      <NButton size="small" type="primary" @click="router.push('/course/new')">新增课程</NButton>
      <NButton size="small" @click="router.push('/import')">导入</NButton>
      <NButton size="small" @click="router.push('/export')">导出</NButton>
      <NDropdown :options="moreOptions" trigger="click" @select="onMore">
        <NButton size="small">更多</NButton>
      </NDropdown>
    </NSpace>
  </div>
</template>

<style scoped lang="scss">
.schedule-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.18);
}
.schedule-name {
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
</style>
