import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ScheduleRepository, type CreateScheduleInput } from '@/repositories/ScheduleRepository'
import type { Schedule } from '@/models/schedule'

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** 课表 Store：课表列表 / 当前课表 / 三件套创建与 CRUD（docs/tech.md §52、docs/API.md §5）。 */
export const useScheduleStore = defineStore('schedule', () => {
  const schedules = ref<Schedule[]>([])
  const activeScheduleId = ref<number | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const repo = new ScheduleRepository()

  const activeSchedule = computed(
    () => schedules.value.find((s) => s.id === activeScheduleId.value) ?? null,
  )
  const hasSchedules = computed(() => schedules.value.length > 0)

  async function loadSchedules(selectFirst = true): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const list = await repo.findAll()
      schedules.value = list
      const activeStillExists = list.some((s) => s.id === activeScheduleId.value)
      if (!activeStillExists) {
        activeScheduleId.value = selectFirst ? (list[0]?.id ?? null) : null
      }
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  function switchSchedule(id: number): void {
    if (schedules.value.some((s) => s.id === id)) activeScheduleId.value = id
  }

  async function createSchedule(input: CreateScheduleInput): Promise<Schedule> {
    error.value = null
    try {
      const created = await repo.create(input)
      schedules.value = [...schedules.value, created]
      activeScheduleId.value = created.id
      return created
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    }
  }

  async function updateSchedule(id: number, patch: Partial<Schedule>): Promise<void> {
    error.value = null
    try {
      await repo.update(id, patch)
      const index = schedules.value.findIndex((s) => s.id === id)
      if (index >= 0) {
        schedules.value[index] = { ...schedules.value[index], ...patch, id }
      }
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    }
  }

  async function deleteSchedule(id: number): Promise<void> {
    error.value = null
    try {
      await repo.delete(id)
      schedules.value = schedules.value.filter((s) => s.id !== id)
      if (activeScheduleId.value === id) {
        activeScheduleId.value = schedules.value[0]?.id ?? null
      }
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    }
  }

  return {
    schedules,
    activeScheduleId,
    activeSchedule,
    hasSchedules,
    loading,
    error,
    loadSchedules,
    switchSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  }
})
