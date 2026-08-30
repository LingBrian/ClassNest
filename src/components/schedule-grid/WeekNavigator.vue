<script setup lang="ts">
import { NButton, NInputNumber, NSpace, NTooltip, useMessage } from 'naive-ui'

const props = defineProps<{ currentWeek: number; totalWeeks: number }>()
const emit = defineEmits<{ (e: 'updateWeek', week: number): void }>()

const message = useMessage()

function clamp(week: number): number {
  return Math.min(Math.max(Math.round(week), 1), props.totalWeeks)
}

function onToday(): void {
  // Phase 2 由 DateEngine.getCurrentWeek(基于真实日期)提供，届时移除该提示。
  message.info('「今天」将在 Phase 2（DateEngine）接入')
}
</script>

<template>
  <div class="week-navigator">
    <NSpace align="center" size="small">
      <NButton size="small" @click="emit('updateWeek', clamp(props.currentWeek - 1))"
        >上一周</NButton
      >
      <NInputNumber
        :value="props.currentWeek"
        :min="1"
        :max="props.totalWeeks"
        size="small"
        style="width: 72px"
        @update:value="(v) => v !== null && emit('updateWeek', clamp(v))"
      />
      <span class="week-total">/ {{ props.totalWeeks }} 周</span>
      <NButton size="small" @click="emit('updateWeek', clamp(props.currentWeek + 1))"
        >下一周</NButton
      >
      <NTooltip>
        <template #trigger>
          <NButton size="small" ghost @click="onToday">今天</NButton>
        </template>
        Phase 2 接入 DateEngine 后可用
      </NTooltip>
    </NSpace>
  </div>
</template>

<style scoped lang="scss">
.week-navigator {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 8px;
}
.week-total {
  color: #888;
  font-size: 13px;
}
</style>
