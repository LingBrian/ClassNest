<script setup lang="ts">
import { onMounted } from 'vue'
import { NButton } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useScheduleStore } from '@/stores/schedule'
import ScheduleManager from '@/components/schedule/ScheduleManager.vue'

// 课表管理页（/schedules，tech.md §35）：查看/切换/新增/重命名/删除。
// 进入页面时若从未加载过课表列表则加载一次（store 缓存，切页不重查）。
const router = useRouter()
const scheduleStore = useScheduleStore()

onMounted(async () => {
  if (scheduleStore.schedules.length > 0) return
  try {
    await scheduleStore.loadSchedules()
  } catch (error) {
    // store.error 已记录，页面兜底提示
    void error
  }
})
</script>

<template>
  <div class="schedule-manager-view">
    <div class="schedule-manager-view-toolbar">
      <NButton quaternary size="small" @click="router.push('/')">← 返回课表</NButton>
    </div>
    <ScheduleManager />
  </div>
</template>

<style scoped lang="scss">
.schedule-manager-view {
  height: 100%;
  overflow: auto;
}
.schedule-manager-view-toolbar {
  padding: 8px 16px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.12);
}
</style>
