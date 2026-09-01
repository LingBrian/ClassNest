<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  NNotificationProvider,
  darkTheme,
  dateZhCN,
  zhCN,
} from 'naive-ui'
import { RouterView } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

const isDark = computed(() => settingsStore.getGlobal('theme') === 'dark')

onMounted(() => {
  void settingsStore.loadGlobal()
})
</script>

<template>
  <NConfigProvider :locale="zhCN" :date-locale="dateZhCN" :theme="isDark ? darkTheme : null">
    <NMessageProvider>
      <NDialogProvider>
        <NNotificationProvider>
          <div class="app-shell">
            <RouterView />
          </div>
        </NNotificationProvider>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style scoped lang="scss">
.app-shell {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
</style>
