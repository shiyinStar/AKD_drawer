<script setup lang="ts">
import { computed } from 'vue'
import { CircleDashed, CircleCheck, Eye, PenLine, CircleX } from 'lucide-vue-next'

type AppStatus = 'NOT_READY' | 'IDLE' | 'PREVIEWING' | 'DRAWING' | 'ERROR'

const props = defineProps<{
  status: AppStatus
  extraInfo?: string
}>()

type StatusConfig = {
  color: string
  icon: typeof CircleDashed
  label: string
  animation: 'none' | 'pulse' | 'glow'
  ariaLabel: string
}

const statusMap: Record<AppStatus, StatusConfig> = {
  NOT_READY: {
    color: '#60a5fa',
    icon: CircleDashed,
    label: '未就绪',
    animation: 'pulse',
    ariaLabel: '系统未就绪',
  },
  IDLE: {
    color: '#34d399',
    icon: CircleCheck,
    label: '空闲',
    animation: 'none',
    ariaLabel: '系统空闲，等待操作',
  },
  PREVIEWING: {
    color: '#6366f1',
    icon: Eye,
    label: '预览中',
    animation: 'glow',
    ariaLabel: '预览模式已激活',
  },
  DRAWING: {
    color: '#fbbf24',
    icon: PenLine,
    label: '绘制中',
    animation: 'pulse',
    ariaLabel: '正在绘制',
  },
  ERROR: {
    color: '#f87171',
    icon: CircleX,
    label: '错误',
    animation: 'none',
    ariaLabel: '发生错误',
  },
}

const config = computed(() => statusMap[props.status])

const dotClass = computed(() => {
  const anim = config.value.animation
  if (anim === 'pulse') return 'status-indicator__dot--pulse'
  if (anim === 'glow') return 'status-indicator__dot--glow'
  return ''
})
</script>

<template>
  <div
    class="status-indicator"
    role="status"
    :aria-live="status === 'ERROR' ? 'assertive' : 'polite'"
    :aria-label="config.ariaLabel"
    :style="{ color: config.color }"
  >
    <span class="status-indicator__dot" :class="dotClass" />
    <component :is="config.icon" :size="16" stroke-width="1.5" class="status-indicator__icon" />
    <span class="status-indicator__label">{{ config.label }}</span>
    <span v-if="extraInfo" class="status-indicator__separator">|</span>
    <span v-if="extraInfo" class="status-indicator__extra">{{ extraInfo }}</span>
  </div>
</template>

<style scoped>
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 var(--space-3);
  transition: color var(--duration-normal) var(--ease-in-out);
}

.status-indicator__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
  transition:
    background var(--duration-normal) var(--ease-in-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.status-indicator__dot--pulse {
  animation: status-pulse 2s ease-in-out infinite;
}

.status-indicator__dot--glow {
  animation: status-glow 3s ease-in-out infinite;
}

.status-indicator__icon {
  margin-left: 6px;
  flex-shrink: 0;
}

.status-indicator__label {
  font-size: 12px;
  font-weight: 500;
  margin-left: 4px;
}

.status-indicator__separator {
  color: var(--color-surface-500);
  margin-left: 8px;
}

.status-indicator__extra {
  font-size: 12px;
  color: var(--color-surface-600);
}
</style>
