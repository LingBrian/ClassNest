<script setup lang="ts">
import { computed } from 'vue'
import { NDropdown, type DropdownOption } from 'naive-ui'
import { useScheduleStore } from '@/stores/schedule'

// 课表切换器（tech.md §27）：点击课表名弹出 NDropdown，切换当前课表。
// 选项与当前课表均取自 scheduleStore（单一事实来源）。
const scheduleStore = useScheduleStore()

const options = computed<DropdownOption[]>(() =>
  scheduleStore.schedules.map((s) => ({
    label: s.name,
    key: String(s.id),
  })),
)

function onSelect(key: string): void {
  const id = Number(key)
  if (Number.isFinite(id) && id > 0) scheduleStore.switchSchedule(id)
}
</script>

<template>
  <NDropdown :options="options" trigger="click" @select="onSelect">
    <span class="schedule-switcher">
      {{ scheduleStore.activeSchedule ? scheduleStore.activeSchedule.name : '未选择课表' }}
      <span class="schedule-switcher-caret">▾</span>
    </span>
  </NDropdown>
</template>

<style scoped lang="scss">
.schedule-switcher {
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}
.schedule-switcher-caret {
  margin-left: 4px;
  font-size: 12px;
  color: #888;
}
</style>
