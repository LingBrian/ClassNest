<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  NButton,
  NCard,
  NEmpty,
  NInput,
  NModal,
  NSpace,
  NTag,
  useDialog,
  useMessage,
} from 'naive-ui'
import { useScheduleStore } from '@/stores/schedule'
import type { Schedule } from '@/models/schedule'
import ScheduleCreateDialog from './ScheduleCreateDialog.vue'

// 课表管理（tech.md §35 / Phase 3）：查看全部课表 / 切换 / 新增 / 重命名 / 删除。
// 复制课表属 Phase 10 高级功能，本阶段不实现。
// 删除课表必须 NDialog 明确提示级联影响（课程、时间段、调课、外观）。
const scheduleStore = useScheduleStore()
const dialog = useDialog()
const message = useMessage()

const showCreate = ref(false)
const showRename = ref(false)
const renameTarget = ref<Schedule | null>(null)
const renameName = ref('')

const activeId = computed(() => scheduleStore.activeScheduleId)

function weekdayOptions(): Array<{ label: string; value: number }> {
  return [
    { label: '周一', value: 1 },
    { label: '周二', value: 2 },
    { label: '周三', value: 3 },
    { label: '周四', value: 4 },
    { label: '周五', value: 5 },
    { label: '周六', value: 6 },
    { label: '周日', value: 7 },
  ]
}

function firstDayLabel(firstDayOfWeek: number): string {
  return weekdayOptions().find((o) => o.value === firstDayOfWeek)?.label ?? String(firstDayOfWeek)
}

function onSwitch(schedule: Schedule): void {
  if (activeId.value === schedule.id) return
  scheduleStore.switchSchedule(schedule.id)
  message.success(`已切换到「${schedule.name}」`)
}

function openRename(schedule: Schedule): void {
  renameTarget.value = schedule
  renameName.value = schedule.name
  showRename.value = true
}

function closeRename(): void {
  renameTarget.value = null
  showRename.value = false
}

async function confirmRename(): Promise<void> {
  const target = renameTarget.value
  if (!target) return
  const name = renameName.value.trim()
  if (!name) {
    message.warning('课表名称不能为空')
    return
  }
  try {
    await scheduleStore.updateSchedule(target.id, { name })
    message.success('课表已重命名')
    renameTarget.value = null
    showRename.value = false
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    message.error(`重命名失败：${detail}`)
  }
}

function onDelete(schedule: Schedule): void {
  dialog.warning({
    title: '删除课表',
    content: `删除课表「${schedule.name}」会同时删除课程、时间段、调课和外观配置。此操作不可撤销，确定删除？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await scheduleStore.deleteSchedule(schedule.id)
        message.success(`课表「${schedule.name}」已删除`)
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        message.error(`删除失败：${detail}`)
      }
    },
  })
}
</script>

<template>
  <div class="schedule-manager">
    <NCard :title="`全部课表（${scheduleStore.schedules.length}）`" size="small">
      <template #header-extra>
        <NButton size="small" type="primary" @click="showCreate = true">新建课表</NButton>
      </template>

      <NEmpty v-if="scheduleStore.schedules.length === 0" description="还没有课表">
        <template #extra>
          <NButton size="small" type="primary" @click="showCreate = true">创建课表</NButton>
        </template>
      </NEmpty>

      <div v-for="schedule in scheduleStore.schedules" :key="schedule.id" class="schedule-row">
        <div class="schedule-row-main" @click="onSwitch(schedule)">
          <span class="schedule-row-name">{{ schedule.name }}</span>
          <NTag v-if="activeId === schedule.id" size="small" type="primary" bordered>当前</NTag>
          <span class="schedule-row-meta">
            学期 {{ schedule.semesterStart }} · 第{{ schedule.currentWeek }}/{{
              schedule.totalWeeks
            }}周 · {{ schedule.sectionCount }}节 · {{ firstDayLabel(schedule.firstDayOfWeek) }}起
          </span>
        </div>
        <NSpace size="small">
          <NButton v-if="activeId !== schedule.id" size="tiny" @click="onSwitch(schedule)">
            设为当前
          </NButton>
          <NButton size="tiny" @click="openRename(schedule)">重命名</NButton>
          <NButton size="tiny" type="error" ghost @click="onDelete(schedule)">删除</NButton>
        </NSpace>
      </div>
    </NCard>

    <NModal v-model:show="showRename" preset="card" title="重命名课表" style="width: 380px">
      <NInput v-model:value="renameName" placeholder="课表名称" @keyup.enter="confirmRename" />
      <template #footer>
        <NSpace justify="end">
          <NButton @click="closeRename">取消</NButton>
          <NButton type="primary" @click="confirmRename">保存</NButton>
        </NSpace>
      </template>
    </NModal>

    <ScheduleCreateDialog v-model:show="showCreate" />
  </div>
</template>

<style scoped lang="scss">
.schedule-manager {
  padding: 12px 16px 24px;
}
.schedule-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 2px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.12);
}
.schedule-row-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  cursor: pointer;
}
.schedule-row-name {
  font-size: 14px;
  font-weight: 600;
}
.schedule-row-meta {
  color: #888;
  font-size: 12px;
}
</style>
