<template>
  <div class="warning-container" :class="{ 'fade-out': isFading }">
    <div class="noise-overlay"></div>
    <div class="vignette"></div>

    <transition name="warning-content" appear>
      <div v-if="!isFading" class="warning-content">

        <div class="warning-icon">
          <span class="icon-ring"></span>
          <span class="icon-text">⚠</span>
        </div>

        <div class="warning-block">
          <h1 class="warning-title">虚构声明</h1>

          <div class="warning-lines">
            <p
              v-for="(line, idx) in warningLines"
              :key="idx"
              class="warn-line"
              :style="{ animationDelay: (idx * 0.15) + 's' }"
            >{{ line }}</p>
          </div>

          <div class="warning-divider">
            <span class="div-line"></span>
            <span class="div-dot">◆</span>
            <span class="div-line"></span>
          </div>

          <p class="warning-sub">本作品为虚构互动叙事游戏</p>
          <p class="warning-sub sub-dim">所有人物、事件、组织均为创作需要</p>
        </div>

        <button class="confirm-btn" @click="enterGame">
          <span class="btn-text">我已知晓，进入灯塔</span>
          <span class="btn-arrow">→</span>
        </button>

      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isFading = ref(false)

const warningLines = [
  '以下内容为完全虚构的互动叙事体验',
  '不构成任何真实事件或人物影射',
  '请以娱乐心态参与，切勿代入现实',
  '如感不适，可随时退出'
]

function enterGame() {
  isFading.value = true
  setTimeout(() => {
    router.push('/chapter/1')
  }, 800)
}
</script>

<style scoped>
.warning-container {
  height: 100vh;
  width: 100vw;
  position: relative;
  overflow: hidden;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-container.fade-out {
  animation: fade-out-black 0.8s ease-in forwards;
}

@keyframes fade-out-black {
  to { opacity: 0; }
}

.noise-overlay {
  position: fixed;
  inset: 0;
  opacity: 0.03;
  z-index: 1;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: noise-shift 0.15s steps(10) infinite;
}

@keyframes noise-shift {
  0% { transform: translate(0, 0); }
  100% { transform: translate(-10px, -10px); }
}

.vignette {
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.85) 100%);
  pointer-events: none;
  z-index: 2;
}

.warning-content {
  position: relative;
  z-index: 10;
  text-align: center;
  max-width: 580px;
  padding: 3rem 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
}

.warning-content-enter-active {
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.warning-content-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.warning-icon {
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-ring {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(200, 160, 80, 0.25);
  border-radius: 50%;
  animation: ring-pulse 2.5s ease-in-out infinite;
}

@keyframes ring-pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.08); }
}

.icon-text {
  font-size: 1.6rem;
  color: #c8a050;
  animation: icon-flicker 4s ease-in-out infinite;
}

@keyframes icon-flicker {
  0%, 90%, 100% { opacity: 1; }
  92% { opacity: 0.4; }
  94% { opacity: 1; }
  96% { opacity: 0.6; }
  98% { opacity: 1; }
}

.warning-block {
  width: 100%;
}

.warning-title {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.35em;
  color: #c8a050;
  margin: 0 0 2rem;
  text-transform: uppercase;
}

.warning-lines {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.warn-line {
  font-size: 0.9rem;
  line-height: 1.8;
  color: #888;
  letter-spacing: 0.06em;
  margin: 0;
  animation: line-appear 0.6s ease-out backwards;
}

@keyframes line-appear {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.warning-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.div-line {
  width: 50px;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(200, 160, 80, 0.15), transparent);
}

.div-dot {
  color: rgba(200, 160, 80, 0.15);
  font-size: 0.5rem;
}

.warning-sub {
  font-size: 0.78rem;
  color: #666;
  letter-spacing: 0.08em;
  margin: 0 0 0.4rem;
}

.sub-dim {
  color: #444;
  font-size: 0.72rem;
}

.confirm-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 2.5rem;
  background: transparent;
  border: 1px solid rgba(200, 160, 80, 0.2);
  color: #a08850;
  font-size: 0.88rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  cursor: pointer;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

.confirm-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(200, 160, 80, 0.05);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.confirm-btn:hover {
  border-color: rgba(200, 160, 80, 0.4);
  color: #c8a050;
  box-shadow: 0 0 30px rgba(200, 160, 80, 0.08);
  transform: translateY(-2px);
}

.confirm-btn:hover::before {
  opacity: 1;
}

.btn-text {
  position: relative;
  z-index: 1;
}

.btn-arrow {
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease;
}

.confirm-btn:hover .btn-arrow {
  transform: translateX(4px);
}
</style>
