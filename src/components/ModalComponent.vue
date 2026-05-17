<template>
  <Transition name="modal-fade">
    <div v-if="visible" class="modal-overlay" @click.self="handleOverlayClick">
      <Transition name="modal-scale" appear>
        <div v-if="visible" class="modal-card" :style="cardBorderStyle">
          <div class="modal-icon">{{ typeConfig.icon }}</div>
          <div v-if="title" class="modal-title">{{ title }}</div>
          <div v-if="message" class="modal-message">{{ message }}</div>
          <button
            class="modal-confirm-btn"
            :style="btnStyle"
            @click="handleConfirm"
          >
            {{ confirmText }}
          </button>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  type: {
    type: String,
    default: 'info'
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  confirmText: {
    type: String,
    default: '确定'
  }
})

const emit = defineEmits(['confirm', 'update:visible'])

const typeMap = {
  success: { icon: '✅', color: '#10b981' },
  error: { icon: '❌', color: '#ef4444' },
  warning: { icon: '⚠️', color: '#f59e0b' },
  info: { icon: 'ℹ️', color: '#3b82f6' },
  fail: { icon: '💔', color: '#64748b' }
}

const typeConfig = computed(() => typeMap[props.type] || typeMap.info)

const cardBorderStyle = computed(() => ({
  borderColor: `${typeConfig.value.color}15`
}))

const btnStyle = computed(() => ({
  color: typeConfig.value.color,
  borderColor: `${typeConfig.value.color}40`,
  '--btn-glow-color': typeConfig.value.color
}))

function handleConfirm() {
  emit('confirm')
  emit('update:visible', false)
}

function handleOverlayClick() {
  emit('update:visible', false)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.modal-card {
  background: linear-gradient(170deg, rgba(20, 22, 30, 0.98), rgba(12, 14, 20, 0.98));
  border: 1px solid rgba(130, 135, 165, 0.1);
  border-radius: 2px;
  padding: 2.5rem 2rem 2rem;
  min-width: 280px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.modal-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
  line-height: 1;
}

.modal-title {
  color: #b0b4c0;
  font-size: 1.2rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  margin-bottom: 0.75rem;
}

.modal-message {
  color: #78829a;
  font-size: 0.9rem;
  line-height: 1.8;
  margin-bottom: 1.75rem;
  max-width: 320px;
}

.modal-confirm-btn {
  background: transparent;
  border: 1px solid;
  border-radius: 2px;
  padding: 0.55rem 2.2rem;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
}

.modal-confirm-btn:hover {
  background: color-mix(in srgb, var(--btn-glow-color) 8%, transparent);
  box-shadow: 0 0 20px color-mix(in srgb, var(--btn-glow-color) 15%, transparent);
  border-color: color-mix(in srgb, var(--btn-glow-color) 50%, transparent);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-scale-leave-active {
  transition: all 0.18s ease-in;
}

.modal-scale-enter-from {
  opacity: 0;
  transform: scale(0.92);
}

.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
