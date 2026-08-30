<script setup lang="ts">
const props = defineProps<{ sectionCount: number }>()
</script>

<template>
  <div class="time-axis">
    <div v-for="i in props.sectionCount" :key="i" class="time-axis-cell">第{{ i }}节</div>
  </div>
</template>

<style scoped lang="scss">
.time-axis {
  display: grid;
  border-right: 1px solid rgba(128, 128, 128, 0.15);
}
.time-axis-cell {
  padding: 4px 6px;
  font-size: 12px;
  color: #888;
  text-align: right;
  border-bottom: 1px solid rgba(128, 128, 128, 0.12);
  &:last-child {
    border-bottom: none;
  }
}
</style>
