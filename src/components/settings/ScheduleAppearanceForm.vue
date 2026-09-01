<script setup lang="ts">
import { computed } from 'vue'
import {
  NColorPicker,
  NForm,
  NFormItem,
  NInput,
  NRadio,
  NRadioGroup,
  NSlider,
  NSpace,
  NSwitch,
} from 'naive-ui'
import { useSettingsStore } from '@/stores/settings'
import type { ScheduleStyle } from '@/models/scheduleStyle'

const props = defineProps<{
  scheduleId: number
  /** 实时保存模式：外观设置实时写库（docs/CONVENTIONS.md §11）。 */
}>()

const settingsStore = useSettingsStore()

/** 当前课表外观（settingsStore 缓存，切课表不重查）。 */
const style = computed(() => settingsStore.styleOf(props.scheduleId))

function onPatch(patch: Partial<ScheduleStyle>): void {
  void settingsStore.updateStyle(props.scheduleId, patch)
}
</script>

<template>
  <NForm label-placement="left" label-width="140" size="small">
    <NFormItem label="背景类型">
      <NRadioGroup
        :value="style.backgroundType"
        @update:value="onPatch({ backgroundType: $event as 'color' | 'image' })"
      >
        <NSpace>
          <NRadio value="color">颜色</NRadio>
          <NRadio value="image">图片</NRadio>
        </NSpace>
      </NRadioGroup>
    </NFormItem>
    <NFormItem label="背景值">
      <NColorPicker
        v-if="style.backgroundType === 'color'"
        :value="style.backgroundValue"
        :show-alpha="false"
        @update:value="onPatch({ backgroundValue: String($event) })"
      />
      <NInput
        v-else
        :value="style.backgroundValue"
        @update:value="onPatch({ backgroundValue: String($event) })"
      />
    </NFormItem>
    <NFormItem label="课程圆角">
      <NSlider
        :value="style.courseRadius"
        :min="0"
        :max="24"
        :step="1"
        @update:value="onPatch({ courseRadius: Number($event) })"
      />
    </NFormItem>
    <NFormItem label="非本周透明度">
      <NSlider
        :value="style.nonCurrentWeekOpacity"
        :min="0"
        :max="1"
        :step="0.05"
        @update:value="onPatch({ nonCurrentWeekOpacity: Number($event) })"
      />
    </NFormItem>
    <NFormItem label="课程高度">
      <NSlider
        :value="style.courseHeight"
        :min="0.6"
        :max="2"
        :step="0.1"
        @update:value="onPatch({ courseHeight: Number($event) })"
      />
    </NFormItem>
    <NFormItem label="网格">
      <NSwitch :value="style.showGrid" @update:value="onPatch({ showGrid: Boolean($event) })" />
    </NFormItem>
    <NFormItem label="课程边框">
      <NSwitch
        :value="style.courseBorder"
        @update:value="onPatch({ courseBorder: Boolean($event) })"
      />
    </NFormItem>
    <NFormItem label="显示时间">
      <NSwitch :value="style.showTime" @update:value="onPatch({ showTime: Boolean($event) })" />
    </NFormItem>
    <NFormItem label="显示地点">
      <NSwitch
        :value="style.showLocation"
        @update:value="onPatch({ showLocation: Boolean($event) })"
      />
    </NFormItem>
    <NFormItem label="显示老师">
      <NSwitch
        :value="style.showTeacher"
        @update:value="onPatch({ showTeacher: Boolean($event) })"
      />
    </NFormItem>
    <NFormItem label="显示非本周课程">
      <NSwitch
        :value="style.showNonCurrentWeek"
        @update:value="onPatch({ showNonCurrentWeek: Boolean($event) })"
      />
    </NFormItem>
  </NForm>
</template>

<style scoped lang="scss">
.n-form {
  max-width: 420px;
}
</style>
