<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { NButton, NEmpty, NSpin } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { useScheduleStore } from '@/stores/schedule'
import type { CourseSession } from '@/models/session'
import ScheduleCreateDialog from '@/components/schedule/ScheduleCreateDialog.vue'
import ScheduleGrid from '@/components/schedule-grid/ScheduleGrid.vue'
import ScheduleHeader from '@/components/schedule-grid/ScheduleHeader.vue'
import WeekNavigator from '@/components/schedule-grid/WeekNavigator.vue'

const scheduleStore = useScheduleStore()
const courseStore = useCourseStore()
const router = useRouter()

const showCreate = ref(false)

const activeSchedule = computed(() => scheduleStore.activeSchedule)

// 今日高亮基于真实日期（UI 呈现层）；学期周/日期换算归 DateEngine（Phase 2）。
const todayWeekday = computed(() => {
  const day = new Date().getDay()
  return day === 0 ? 7 : day
})

const sessionsByWeekday = computed(() => {
  const map: Record<number, CourseSession[]> = {}
  for (const session of courseStore.sessions) {
    const list = map[session.weekday] ?? []
    list.push(session)
    map[session.weekday] = list
  }
  for (const key of Object.keys(map)) {
    map[Number(key)].sort((a, b) => a.startSection - b.startSection)
  }
  return map
})

async function loadActiveCourses(): Promise<void> {
  const scheduleId = scheduleStore.activeScheduleId
  if (scheduleId === null) return
  try {
    await courseStore.loadBySchedule(scheduleId)
  } catch (error) {
    // store.error 已记录，页面兜底提示
    void error
  }
}

async function onUpdateWeek(week: number): Promise<void> {
  if (!activeSchedule.value) return
  try {
    await scheduleStore.updateSchedule(activeSchedule.value.id, { currentWeek: week })
  } catch (error) {
    void error
  }
}

onMounted(async () => {
  try {
    await scheduleStore.loadSchedules()
    await loadActiveCourses()
  } catch (error) {
    void error
  }
})

watch(
  () => scheduleStore.activeScheduleId,
  async () => {
    await loadActiveCourses()
  },
)
</script>

<template>
  <div class="schedule-view">
    <NSpin v-if="scheduleStore.loading || courseStore.loading" :show="true" />
    <template v-else-if="!scheduleStore.hasSchedules">
      <div class="empty-state">
        <NEmpty description="还没有课表">
          <template #extra>
            <NButton type="primary" @click="showCreate = true">创建课表</NButton>
            <NButton @click="router.push('/import')">导入课表</NButton>
          </template>
        </NEmpty>
      </div>
    </template>
    <template v-else-if="activeSchedule">
      <ScheduleHeader
        :schedule-name="activeSchedule.name"
        :schedule-id="activeSchedule.id"
        @open-create="showCreate = true"
      />
      <WeekNavigator
        :current-week="activeSchedule.currentWeek"
        :total-weeks="activeSchedule.totalWeeks"
        @update-week="onUpdateWeek"
      />
      <ScheduleGrid
        :sessions-by-weekday="sessionsByWeekday"
        :section-count="activeSchedule.sectionCount"
        :today-weekday="todayWeekday"
        :current-week="activeSchedule.currentWeek"
      />
    </template>

    <ScheduleCreateDialog v-model:show="showCreate" />
  </div>
</template>

<style scoped lang="scss">
.schedule-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px;
}
</style>
