<template>
  <div class="tts-control" :class="{ active: enabled }">
    <button class="tts-btn" @click="toggleTTS" :title="enabled ? '关闭语音' : '开启语音'">
      <span class="tts-icon">{{ enabled ? '🎙️' : '🔇' }}</span>
      <span v-if="playing" class="tts-pulse"></span>
    </button>
    <div v-if="enabled" class="tts-volume" @wheel.prevent="onWheel">
      <input
        type="range"
        min="0"
        max="100"
        :value="volumePercent"
        @input="onVolumeChange"
        class="volume-slider"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTTS } from '../utils/tts'

const tts = useTTS()
const enabled = ref(tts.enabled)
const playing = ref(tts.playing)
const volumePercent = ref(Math.round(tts.getStatus().volume * 100))

function toggleTTS() {
  enabled.value = tts.toggle()
}

function onVolumeChange(e) {
  const v = parseInt(e.target.value) / 100
  volumePercent.value = parseInt(e.target.value)
  tts.setVolume(v)
}

function onWheel(e) {
  const delta = e.deltaY > 0 ? -5 : 5
  const next = Math.max(0, Math.min(100, volumePercent.value + delta))
  volumePercent.value = next
  tts.setVolume(next / 100)
}
</script>

<style scoped>
.tts-control {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9998;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.tts-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(140, 150, 180, 0.15);
  background: rgba(10, 12, 18, 0.85);
  backdrop-filter: blur(8px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
}

.tts-btn:hover {
  border-color: rgba(140, 150, 180, 0.3);
  background: rgba(20, 22, 30, 0.9);
  transform: scale(1.08);
}

.tts-control.active .tts-btn {
  border-color: rgba(180, 150, 100, 0.25);
  box-shadow: 0 0 16px rgba(180, 150, 100, 0.08);
}

.tts-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.tts-pulse {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 1px solid rgba(180, 150, 100, 0.3);
  animation: tts-ping 1.5s ease-out infinite;
}

@keyframes tts-ping {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.4); opacity: 0; }
}

.tts-volume {
  width: 36px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 12, 18, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(140, 150, 180, 0.1);
  border-radius: 18px;
  padding: 8px 0;
}

.volume-slider {
  writing-mode: vertical-lr;
  direction: rtl;
  width: 4px;
  height: 60px;
  appearance: none;
  background: rgba(140, 150, 180, 0.15);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(180, 150, 100, 0.7);
  border: 1px solid rgba(180, 150, 100, 0.4);
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(180, 150, 100, 0.7);
  border: 1px solid rgba(180, 150, 100, 0.4);
  cursor: pointer;
}
</style>
