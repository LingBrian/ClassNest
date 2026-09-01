<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { NButton, NTabPane, NTabs } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { useScheduleStore } from '@/stores/schedule'
import { useSettingsStore } from '@/stores/settings'
import { build as buildScheduleEngine, type RenderedCourse } from '@/engine/scheduleEngine'
import type { TimeTable } from '@/models/timetable'
import ScheduleAppearanceForm from '@/components/settings/ScheduleAppearanceForm.vue'
import ScheduleBasicSettings from '@/components/settings/ScheduleBasicSettings.vue'
import ScheduleAdvancedSettings from '@/components/settings/ScheduleAdvancedSettings.vue'
import TimeTableEditor from '@/components/settings/TimeTableEditor.vue'
import ScheduleGrid from '@/components/schedule-grid/ScheduleGrid.vue'

const props = defineProps<{ id: string }>()

const router = useRouter()
const scheduleStore = useScheduleStore()
const courseStore = useCourseStore()
const settingsStore = useSettingsStore()

const scheduleId = computed(() => Number(props.id))

const activeSchedule = computed(
  () => scheduleStore.schedules.find((s) => s.id === scheduleId.value) ?? null,
)

const activeStyle = computed(() => settingsStore.styleOf(scheduleId.value))

// 节次轴时间表：仅携带节次序号（空时间触发 positionEngine 的节次索引回退），
// 使左侧「第 i 节」行与右侧课程块按等分行严格对齐（Issue #5）。
const sectionAxisTimetable = computed<TimeTable | null>(() => {
  const schedule = activeSchedule.value
  if (!schedule) return null
  const sectionCount = Math.max(1, schedule.sectionCount)
  return {
    id: 0,
    name: '默认时间表',
    isDefault: true,
    sections: Array.from({ length: sectionCount }, (_, i) => ({
      id: i + 1,
      sectionNumber: i + 1,
      startTime: '',
      endTime: '',
    })),
  }
})

const renderedByWeekday = computed<Record<number, RenderedCourse[]>>(() => {
  const schedule = activeSchedule.value
  const timetable = sectionAxisTimetable.value
  if (!schedule || !timetable) return {}
  const rendered = buildScheduleEngine({
    schedule,
    courses: courseStore.courses,
    sessions: courseStore.sessions,
    timetable,
    nonCurrentWeekOpacity: activeStyle.value.nonCurrentWeekOpacity,
  })
  const map: Record<number, RenderedCourse[]> = {}
  for (const rc of rendered) {
    if (!activeStyle.value.showNonCurrentWeek && !rc.weekMatched) continue
    const list = map[rc.weekday] ?? []
    list.push(rc)
    map[rc.weekday] = list
  }
  for (const key of Object.keys(map)) {
    map[Number(key)]!.sort((a, b) => a.startSection - b.startSection)
  }
  return map
})

async function load(): Promise<void> {
  try {
    await Promise.all([
      scheduleStore.loadSchedules(),
      settingsStore.loadStyle(scheduleId.value),
      courseStore.loadBySchedule(scheduleId.value),
    ])
  } catch (error) {
    void error
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="schedule-settings-view">
    <div class="schedule-settings-toolbar">
      <NButton quaternary size="small" @click="router.push('/')">← 返回课表</NButton>
    </div>
    <NTabs type="line" animated>
      <NTabPane name="basic" tab="基本设置">
        <div class="schedule-settings-basic">
          <p v-if="!activeSchedule">课表不存在或仍在加载中。</p>
          <template v-else>
            <ScheduleBasicSettings :schedule-id="scheduleId" />
          </template>
        </div>
      </NTabPane>
      <NTabPane name="timetable" tab="时间表">
        <TimeTableEditor :schedule-id="scheduleId" />
      </NTabPane>
      <NTabPane name="appearance" tab="外观">
        <div class="appearance-split">
          <ScheduleAppearanceForm :schedule-id="scheduleId" />
          <div class="appearance-preview">
            <ScheduleGrid
              v-if="activeSchedule"
              :rendered-by-weekday="renderedByWeekday"
              :section-count="activeSchedule.sectionCount"
              :today-weekday="0"
              :current-week="activeSchedule.currentWeek"
              :schedule-style="activeStyle"
            />
          </div>
        </div>
      </NTabPane>
      <NTabPane name="advanced" tab="高级">
        <ScheduleAdvancedSettings :schedule-id="scheduleId" />
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped lang="scss">
.schedule-settings-view {
  padding: 16px;
  height: 100%;
  overflow: auto;
}
.schedule-settings-toolbar {
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.12);
}
.appearance-split {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.appearance-preview {
  flex: 1;
  min-width: 0;
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 8px;
  overflow: auto;
  background: var(--n-color, #fff);
}
</style>
