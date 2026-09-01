import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ScheduleStyleRepository } from '@/repositories/ScheduleStyleRepository'
import { SettingsRepository } from '@/repositories/SettingsRepository'
import type { AppSettingKey } from '@/repositories/SettingsRepository'
import type { ScheduleStyle } from '@/models/scheduleStyle'
import { DEFAULT_SCHEDULE_STYLE } from '@/models/scheduleStyle'

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * 设置 Store（docs/tech.md §52、docs/API.md §5）：全局设置（app_setting）+ 课表级外观。
 * 外观按课表缓存：加载一次进内存，实时写回；切课表不重复查询（docs/tech.md §54 原则）。
 */
export const useSettingsStore = defineStore('settings', () => {
  const styleCache = ref<Record<number, ScheduleStyle>>({})
  const styleLoading = ref<number | null>(null)
  const globalSettings = ref<Partial<Record<AppSettingKey, string>>>({})
  const error = ref<string | null>(null)

  const styleRepo = new ScheduleStyleRepository()
  const settingsRepo = new SettingsRepository()

  const styleOf = (scheduleId: number): ScheduleStyle => {
    return styleCache.value[scheduleId] ?? { ...DEFAULT_SCHEDULE_STYLE, scheduleId }
  }

  const hasStyle = (scheduleId: number): boolean => styleCache.value[scheduleId] !== undefined

  async function loadStyle(scheduleId: number, force = false): Promise<void> {
    if (!force && hasStyle(scheduleId)) return
    styleLoading.value = scheduleId
    error.value = null
    try {
      const style = await styleRepo.findByScheduleId(scheduleId)
      styleCache.value = {
        ...styleCache.value,
        [scheduleId]: style ?? { ...DEFAULT_SCHEDULE_STYLE, scheduleId },
      }
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    } finally {
      styleLoading.value = null
    }
  }

  /** 外观实时保存：先写回内存（页面即时生效），再落库；写库失败回滚内存并抛错。 */
  async function updateStyle(scheduleId: number, patch: Partial<ScheduleStyle>): Promise<void> {
    const prev = styleOf(scheduleId)
    const next = { ...prev, ...patch, scheduleId }
    styleCache.value = { ...styleCache.value, [scheduleId]: next }
    error.value = null
    try {
      await styleRepo.update(scheduleId, patch)
    } catch (e) {
      styleCache.value = { ...styleCache.value, [scheduleId]: prev }
      error.value = toErrorMessage(e)
      throw e
    }
  }

  async function removeStyle(scheduleId: number): Promise<void> {
    const next: Record<number, ScheduleStyle> = {}
    for (const key of Object.keys(styleCache.value)) {
      if (Number(key) !== scheduleId) next[Number(key)] = styleCache.value[Number(key)]
    }
    styleCache.value = next
  }

  async function loadGlobal(force = false): Promise<void> {
    if (!force && Object.keys(globalSettings.value).length > 0) return
    error.value = null
    try {
      globalSettings.value = await settingsRepo.getAll()
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    }
  }

  const getGlobal = (key: AppSettingKey): string | null => globalSettings.value[key] ?? null

  async function setGlobal(key: AppSettingKey, value: string): Promise<void> {
    error.value = null
    try {
      await settingsRepo.set(key, value)
      globalSettings.value = { ...globalSettings.value, [key]: value }
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    }
  }

  const theme = computed(() => getGlobal('theme'))

  return {
    styleCache,
    styleLoading,
    globalSettings,
    error,
    styleOf,
    hasStyle,
    loadStyle,
    updateStyle,
    removeStyle,
    loadGlobal,
    getGlobal,
    setGlobal,
    theme,
  }
})
