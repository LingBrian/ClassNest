<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  NButton,
  NForm,
  NFormItem,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
  NSwitch,
  useMessage,
} from 'naive-ui'
import { useRouter } from 'vue-router'
import { useScheduleStore } from '@/stores/schedule'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const scheduleStore = useScheduleStore()
const settingsStore = useSettingsStore()
const message = useMessage()

const theme = ref<'light' | 'dark'>('light')
const language = ref('zh-CN')
const activeScheduleId = ref<number | null>(null)
const autoBackup = ref(false)
const startupBehavior = ref('default')

const scheduleOptions = computed(() =>
  scheduleStore.schedules.map((s) => ({ label: s.name, value: s.id })),
)

const loading = ref(false)

onMounted(async () => {
  try {
    await Promise.all([settingsStore.loadGlobal(), scheduleStore.loadSchedules()])
    theme.value = settingsStore.getGlobal('theme') === 'dark' ? 'dark' : 'light'
    language.value = settingsStore.getGlobal('language') ?? 'zh-CN'
    activeScheduleId.value =
      (settingsStore.getGlobal('active_schedule_id') &&
        Number(settingsStore.getGlobal('active_schedule_id'))) ||
      null
    autoBackup.value = settingsStore.getGlobal('auto_backup') === 'true'
    startupBehavior.value = settingsStore.getGlobal('startup_behavior') ?? 'default'
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    message.error(`加载全局设置失败：${detail}`)
  } finally {
    loading.value = false
  }
})

const saving = ref(false)

async function save(): Promise<void> {
  saving.value = true
  try {
    await settingsStore.setGlobal('theme', theme.value)
    await settingsStore.setGlobal('language', language.value)
    await settingsStore.setGlobal(
      'active_schedule_id',
      activeScheduleId.value === null ? '' : String(activeScheduleId.value),
    )
    await settingsStore.setGlobal('auto_backup', autoBackup.value ? 'true' : 'false')
    await settingsStore.setGlobal('startup_behavior', startupBehavior.value)
    message.success('全局设置已保存，返回课表')
    router.push('/')
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    message.error(`保存失败：${detail}`)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="global-settings-form">
    <NForm label-placement="left" label-width="140">
      <NFormItem label="主题">
        <NRadioGroup v-model:value="theme">
          <NSpace>
            <NRadio value="light">浅色</NRadio>
            <NRadio value="dark">深色</NRadio>
          </NSpace>
        </NRadioGroup>
      </NFormItem>
      <NFormItem label="语言">
        <NSelect
          v-model:value="language"
          :options="[
            { label: '简体中文', value: 'zh-CN' },
            { label: 'English', value: 'en' },
          ]"
          style="width: 200px"
        />
      </NFormItem>
      <NFormItem label="启动默认课表">
        <NSelect
          v-model:value="activeScheduleId"
          :options="scheduleOptions"
          clearable
          placeholder="不指定则默认第一个课表"
          style="width: 260px"
        />
      </NFormItem>
      <NFormItem label="自动备份">
        <NSwitch v-model:value="autoBackup" />
      </NFormItem>
      <NFormItem label="启动行为">
        <NRadioGroup v-model:value="startupBehavior">
          <NSpace>
            <NRadio value="default">打开默认课表</NRadio>
            <NRadio value="last_schedule">打开上次课表</NRadio>
          </NSpace>
        </NRadioGroup>
      </NFormItem>
    </NForm>
    <NButton type="primary" :loading="saving" @click="save">保存</NButton>
  </div>
</template>

<style scoped lang="scss">
.global-settings-form {
  max-width: 460px;
}
</style>
