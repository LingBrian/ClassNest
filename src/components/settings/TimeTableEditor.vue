<script setup lang="ts">
import { computed } from 'vue'
import { NEmpty, NTable } from 'naive-ui'
import { useScheduleStore } from '@/stores/schedule'
// 时间段固定为「节次 + 起止时间」。当前课表时间表来自 DEFAULT_SECTION_TIMES（Phase 1 三件套写入的默认时间表）。
import { DEFAULT_SECTION_TIMES } from '@/models/timetable'

const props = defineProps<{ scheduleId: number }>()

const scheduleStore = useScheduleStore()

const schedule = computed(
  () => scheduleStore.schedules.find((s) => s.id === props.scheduleId) ?? null,
)
</script>

<template>
  <div class="timetable-editor">
    <NEmpty v-if="!schedule" description="课表不存在或仍在加载" />
    <template v-else>
      <p class="timetable-hint">默认时间表（节次固定，Phase 4 不调整起止时间）。</p>
      <NTable size="small" :bordered="false">
        <thead>
          <tr>
            <th>节次</th>
            <th>开始时间</th>
            <th>结束时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(section, index) in DEFAULT_SECTION_TIMES" :key="index">
            <td>第{{ index + 1 }}节</td>
            <td>{{ section.startTime }}</td>
            <td>{{ section.endTime }}</td>
          </tr>
        </tbody>
      </NTable>
    </template>
  </div>
</template>

<style scoped lang="scss">
.timetable-editor {
  max-width: 420px;
}
.timetable-hint {
  color: #888;
  font-size: 12px;
  margin-bottom: 8px;
}
</style>
