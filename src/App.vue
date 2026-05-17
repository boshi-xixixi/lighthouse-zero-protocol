<template>
  <div class="app-wrapper">
    <div class="grain-overlay" :class="{ active: isTransitioning }"></div>
    <router-view v-slot="{ Component, route }">
      <transition
        :name="route.meta.transition || 'cinematic'"
        mode="out-in"
        @before-leave="onBeforeLeave"
        @after-leave="onAfterLeave"
      >
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>
    <TtsControl />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import TtsControl from './components/TtsControl.vue'
import bgm from './utils/bgm'

const isTransitioning = ref(false)

onMounted(() => {
  bgm.init('/audio/bgm.aac')
  bgm.play()
})

onUnmounted(() => {
  bgm.destroy()
})

function onBeforeLeave() {
  isTransitioning.value = true
}

function onAfterLeave() {
  setTimeout(() => {
    isTransitioning.value = false
  }, 80)
}
</script>

<style>
.app-wrapper {
  position: relative;
  min-height: 100vh;
}

.grain-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.1s ease-out;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
  background-size: 128px 128px;
  mix-blend-mode: overlay;
}

.grain-overlay.active {
  opacity: 0.5;
}

.cinematic-enter-active,
.cinematic-leave-active {
  transition: opacity 0.15s ease;
}

.cinematic-enter-from,
.cinematic-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-16px);
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
