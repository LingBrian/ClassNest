<script setup lang="ts">
import { NButton } from 'naive-ui'
import { useRouter } from 'vue-router'
import GlobalSettingsForm from '@/components/settings/GlobalSettingsForm.vue'

const router = useRouter()
</script>

<template>
  <div class="global-settings-view">
    <div class="global-settings-toolbar">
      <NButton quaternary size="small" @click="router.push('/')">← 返回课表</NButton>
    </div>
    <h2 class="global-settings-title">全局设置</h2>
    <GlobalSettingsForm />
  </div>
</template>

<style scoped lang="scss">
.global-settings-view {
  padding: 16px;
  height: 100%;
  overflow: auto;
}
.global-settings-toolbar {
  border-bottom: 1px solid rgba(128, 128, 128, 0.12);
  margin-bottom: 8px;
}
.global-settings-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}
</style>
