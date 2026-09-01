<script setup lang="ts">
const props = defineProps<{ sectionCount: number }>()
</script>

<template>
  <div v-for="i in props.sectionCount" :key="i" class="time-axis-cell" :style="{ gridRow: i }">
    第{{ i }}节
  </div>
</template>

<style scoped lang="scss">
/* 共享 grid-body 的行轨道：每个 cell 占恰好一行，与右侧课程块网格线严格对齐（Issue #5）。 */
.time-axis-cell {
  grid-column: 1;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 4px 8px 0 0;
  font-size: 12px;
  color: #888;
  border-bottom: 1px solid rgba(128, 128, 128, 0.12);
}
</style>
