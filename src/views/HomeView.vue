<template>
  <div class="home-container" @click="startGame">
    <div class="bg-layer"></div>
    <div class="vignette"></div>
    <div class="scanline"></div>
    <AmbientEffects />

    <div class="content">

      <div class="top-meta">
        <span class="meta-item">INTERACTIVE FICTION</span>
        <span class="meta-sep">/</span>
        <span class="meta-item">v1.0</span>
      </div>

      <main class="main-stage">

        <div class="title-block">
          <h1 class="game-title">
            <span class="title-zh">灯塔零点协议</span>
          </h1>

          <h2 class="title-en">LIGHTHOUSE : ZERO PROTOCOL</h2>

          <div class="title-ornament">
            <span class="orn-line"></span>
            <span class="orn-diamond">◆</span>
            <span class="orn-line"></span>
          </div>
        </div>

        <div class="story-block">
          <div
            v-for="(line, idx) in storyLines"
            :key="idx"
            class="story-line"
            :class="{ 'line-empty': !line.trim(), 'line-emphasis': isEmphasisLine(line) }"
            :style="{ animationDelay: (idx * 0.08) + 's' }"
          >
            <span v-if="line.trim()" class="prompt-mark">&gt;</span>
            <span v-if="line.trim()" class="line-text" v-html="formatLine(line)"></span>
          </div>
        </div>

        <div class="enter-hint">
          <span class="hint-text">点击任意位置进入灯塔</span>
          <span class="hint-cursor">▌</span>
        </div>

      </main>

      <footer class="bottom-info">
        <div class="info-divider"></div>

        <div class="feature-tags">
          <span class="feature-tag">
            <span class="tag-icon">🎵</span>
            <span>沉浸式 BGM</span>
          </span>
          <span class="feature-tag">
            <span class="tag-icon">🎙️</span>
            <span>全语音旁白</span>
          </span>
          <span class="feature-tag">
            <span class="tag-icon">🎬</span>
            <span>4 幕剧情</span>
          </span>
        </div>

        <p class="info-row">
          <span>悬疑叙事互动</span>
          <span class="info-dot">·</span>
          <span>约 5-8 分钟</span>
        </p>

        <p class="audio-hint">
          <span class="hint-pulse"></span>
          <span>建议佩戴耳机以获得最佳体验</span>
        </p>
      </footer>

    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useMbtiStore } from '../stores/mbti'
import { useTTS } from '../utils/tts'
import AmbientEffects from '../components/AmbientEffects.vue'
import { highlightKeywords } from '../utils/keywordHighlight'

const router = useRouter()
const mbtiStore = useMbtiStore()
const tts = useTTS()

mbtiStore.reset()

const rawLines = [
  '暴雨夜，你在废弃灯塔醒来',
  '手腕上多了一个编号手环：04',
  '',
  '广播里传来沙哑的声音：',
  '"你们之中有人知道沉船案真相。"',
  '"想活着离开，就把他交出来。"',
  '',
  '桌上摆着四份档案袋',
  '四个人，只有一把钥匙能打开出口',
  '',
  '你选哪条路？'
]

const storyLines = rawLines

function isEmphasisLine(line) {
  return line.startsWith('"') || line.includes('真相')
}

function formatLine(line) {
  if (line.startsWith('"') && line.endsWith('"')) {
    return `<em>${highlightKeywords(line.slice(1, -1))}</em>`
  }
  return highlightKeywords(line)
}

function startGame() {
  tts.stop()
  router.push('/warning')
}
</script>

<style scoped>
.home-container {
  height: 100vh;
  width: 100vw;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-layer {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(180, 140, 80, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse at 20% 80%, rgba(80, 60, 100, 0.03) 0%, transparent 45%),
    radial-gradient(ellipse at 80% 70%, rgba(60, 75, 95, 0.03) 0%, transparent 40%),
    linear-gradient(178deg, #030305 0%, #050810 35%, #030509 65%, #020304 100%);
  z-index: 0;
}

.vignette {
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.6) 100%);
  pointer-events: none;
  z-index: 1;
}

.scanline {
  position: fixed;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  opacity: 0.02;
  background: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, 0.03) 2px,
    rgba(255, 255, 255, 0.03) 4px
  );
}

.content {
  position: relative;
  z-index: 10;
  width: 90%;
  max-width: 900px;
  height: 100%;
  padding: 2.5rem 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
}

.top-meta {
  position: absolute;
  top: 2rem;
  right: 3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.meta-item {
  font-family: 'Courier New', monospace;
  font-size: 0.68rem;
  color: #2a2a3a;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.meta-sep {
  color: #1a1a28;
  font-size: 0.6rem;
}

.main-stage {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.8rem;
  width: 100%;
  flex-shrink: 0;
  margin-bottom: 1rem;
}

.title-block {
  margin-bottom: 0.5rem;
}

.game-title {
  margin: 0 0 0.6rem;
}

.title-zh {
  font-size: 3rem;
  font-weight: 800;
  color: #d4c8a0;
  letter-spacing: 0.4em;
  display: block;
  text-shadow:
    0 0 50px rgba(180, 150, 100, 0.08),
    0 1px 0 rgba(0, 0, 0, 0.6);
}

.title-en {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  font-weight: 500;
  color: #5a4a38;
  margin: 0;
  letter-spacing: 0.45em;
  text-transform: uppercase;
}

.title-ornament {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;
  margin-top: 1.6rem;
}

.orn-line {
  width: 60px;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(180, 150, 100, 0.18), transparent);
}

.orn-diamond {
  color: rgba(180, 150, 100, 0.18);
  font-size: 0.55rem;
}

.story-block {
  background: linear-gradient(
    170deg,
    rgba(255, 255, 255, 0.015) 0%,
    rgba(255, 255, 255, 0.004) 100%
  );
  border: 1px solid rgba(120, 125, 155, 0.05);
  border-radius: 2px;
  padding: 1.8rem 2.5rem;
  max-width: 650px;
  width: 100%;
  text-align: left;
  position: relative;
}

.story-block::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(180, 150, 100, 0.07), transparent);
}

.story-line {
  display: flex;
  gap: 0.8rem;
  margin-bottom: 0.3rem;
  animation: line-reveal 0.5s ease-out backwards;
  line-height: 1.8;
}

.story-line.line-empty {
  height: 0.6rem;
  margin-bottom: 0;
}

@keyframes line-reveal {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.prompt-mark {
  color: #b8a068;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
  user-select: none;
  margin-top: 0.05rem;
}

.line-text {
  color: #78809a;
  font-size: 0.92rem;
  letter-spacing: 0.025em;
}

.line-text :deep(em) {
  color: #a89868;
  font-style: italic;
  font-weight: 500;
}

.story-line.line-emphasis .line-text {
  color: #9890a8;
}

.enter-hint {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-top: 0.5rem;
}

.hint-text {
  color: #3a3a4a;
  font-size: 0.82rem;
  letter-spacing: 0.12em;
  transition: color 0.4s ease;
}

.home-container:hover .hint-text {
  color: #5a5a6a;
}

.hint-cursor {
  color: #b8a068;
  font-size: 0.9rem;
  animation: cursor-pulse 1.2s step-end infinite;
  line-height: 1;
}

@keyframes cursor-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.bottom-info {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  flex-shrink: 0;
}

.info-divider {
  width: 80px;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(90, 90, 110, 0.08), transparent);
  margin: 0 auto 0.8rem;
}

.info-row {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  flex-wrap: wrap;
  margin-bottom: 0.6rem;
}

.info-row span:not(.info-dot) {
  color: #2a2a3a;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
}

.info-dot {
  color: #1a1a26;
  font-size: 0.62rem;
}

.feature-tags {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.8rem;
  flex-wrap: wrap;
}

.feature-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.85rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(120, 125, 155, 0.06);
  border-radius: 20px;
  font-size: 0.68rem;
  color: #3a3a4a;
  letter-spacing: 0.04em;
}

.tag-icon {
  font-size: 0.8rem;
}

.audio-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.6rem;
  color: #2a2a3a;
  font-size: 0.65rem;
  letter-spacing: 0.06em;
}

.hint-pulse {
  width: 6px;
  height: 6px;
  background: rgba(200, 160, 80, 0.25);
  border-radius: 50%;
  animation: hint-pulse-anim 2s ease-in-out infinite;
}

@keyframes hint-pulse-anim {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.2); }
}

:deep(.kw-person) {
  color: #c4b5a8;
  font-weight: 600;
}

:deep(.kw-item) {
  color: #a8c4b5;
  font-weight: 500;
}

:deep(.kw-place) {
  color: #a8b5c4;
  font-weight: 500;
}

:deep(.kw-secret) {
  color: #c4a8b5;
  font-weight: 600;
}

:deep(.kw-event) {
  color: #b5c4a8;
  font-weight: 500;
}

:deep(.kw-sound) {
  color: #c4c4a8;
  font-style: italic;
}
</style>
