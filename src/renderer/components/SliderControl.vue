<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  modelValue: number
  min: number
  max: number
  step?: number
  unit?: string
}>(), {
  step: 1,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function onInput(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', Number(target.value))
}

const percent = computed(() => {
  return ((props.modelValue - props.min) / (props.max - props.min)) * 100
})
</script>

<template>
  <div class="slider-control">
    <label class="slider-label">{{ label }}</label>
    <div class="slider-track-wrap">
      <input
        type="range"
        class="slider-input"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        :style="{ '--fill-pct': percent + '%' }"
        @input="onInput"
      />
    </div>
    <span class="slider-value">{{ modelValue }}{{ unit ? ' ' + unit : '' }}</span>
  </div>
</template>

<script lang="ts">
import { computed } from 'vue'
export default { name: 'SliderControl' }
</script>

<style scoped>
.slider-control {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 32px;
}

.slider-label {
  font-size: 12px;
  color: var(--color-surface-700);
  min-width: 72px;
  flex-shrink: 0;
}

.slider-track-wrap {
  flex: 1;
  display: flex;
  align-items: center;
}

.slider-input {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    var(--color-primary-500) 0%,
    var(--color-primary-500) var(--fill-pct),
    var(--color-surface-400) var(--fill-pct),
    var(--color-surface-400) 100%
  );
  outline: none;
  cursor: pointer;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid var(--color-primary-500);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-out);
}

.slider-input::-webkit-slider-thumb:active {
  transform: scale(1.38);
}

.slider-value {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-surface-800);
  min-width: 72px;
  text-align: right;
  flex-shrink: 0;
}
</style>
