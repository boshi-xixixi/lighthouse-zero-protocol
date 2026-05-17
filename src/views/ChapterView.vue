<template>
  <div class="chapter-container" :style="chapterStyle">
    <div class="bg-solid"></div>
    <div class="bg-noise"></div>

    <transition name="fade-down">
      <div v-if="showHeader" class="chapter-header">
        <span class="header-chapter">{{ currentChapter.subtitle }}</span>
        <h2 class="header-title">{{ currentChapter.title }}</h2>
        <div class="header-line"></div>
      </div>
    </transition>

    <div class="scene-stage">
      <transition name="cinematic-fade" mode="out-in">

        <!-- 开场文本 + 直接显示选项 -->
        <div v-if="phase === 'intro'" key="intro" class="act-intro">
          <div class="text-curtain">
            <p
              v-for="(line, idx) in introLines"
              :key="idx"
              class="text-reveal"
              v-html="hl(line)"
            ></p>
          </div>
          <button class="action-trigger" @click="goToScene(0)">
            <span class="trigger-text">进入场景</span>
            <span class="trigger-icon"></span>
          </button>
        </div>

        <!-- 场景描述 + 选项（合并在同一页） -->
        <div v-else-if="phase === 'scene' || phase === 'options'" key="scene-options" class="act-scene-combined">
          <div class="text-curtain scene-curtain">
            <p
              v-for="(line, idx) in sceneLines"
              :key="idx"
              class="text-reveal"
              v-html="hl(line)"
            ></p>
          </div>

          <!-- 行动区：调查/取证任务（独立于决策） -->
          <div v-if="visibleActions.length" class="action-section">
            <div class="action-prompt">
              <span class="action-dot"></span>
              <span class="action-prompt-text">额外行动</span>
              <span class="action-dot"></span>
            </div>

            <div class="actions-list">
              <button
                v-for="(action, idx) in visibleActions"
                :key="action.id"
                class="action-card"
                :class="{
                  'action-hidden': action.isHidden && !isOptionRevealed(action.id),
                  'action-revealed': isOptionRevealed(action.id) && action.isHidden,
                  'press-hold': action.hiddenTrigger === 'longPress' && !isOptionRevealed(action.id)
                }"
                :style="{ animationDelay: (idx * 0.12) + 's' }"
                @click="triggerAction(action)"
                @touchstart="handleLongPressStart(action, $event)"
                @touchend="handleLongPressEnd(action)"
                @touchcancel="handleLongPressEnd(action)"
                @mousedown="handleLongPressStart(action, $event)"
                @mouseup="handleLongPressEnd(action)"
                @mouseleave="handleLongPressEnd(action)"
              >
                <span class="action-icon">{{ getActionIcon(action.gameType) }}</span>
                <span class="action-body">
                  <template v-if="action.hiddenTrigger === 'longPress' && !isOptionRevealed(action.id)">
                    <span class="hidden-label">{{ action.hiddenHint || '长按揭示' }}</span>
                  </template>
                  <template v-else>
                    {{ action.text }}
                  </template>
                </span>
                <span v-if="action.isHidden && isOptionRevealed(action.id)" class="reveal-mark"></span>
              </button>
            </div>
          </div>

          <!-- 决策区：普通选项 -->
          <div v-if="visibleChoices.length" class="choice-section">
            <div class="choice-prompt">
              <span class="prompt-line prompt-line-left"></span>
              <span class="prompt-text">你会怎么做</span>
              <span class="prompt-line prompt-line-right"></span>
            </div>

            <div class="choices-list">
              <button
                v-for="(option, idx) in visibleChoices"
                :key="option.id"
                class="choice-card"
                :style="{ animationDelay: (idx * 0.1) + 's' }"
                @click="selectOption(option)"
              >
                <span class="choice-index">{{ getOptionLetter(option.id) }}</span>
                <span class="choice-body">{{ option.text }}</span>
                <span class="choice-indicator"></span>
              </button>
            </div>
          </div>
        </div>

        <!-- 章节结算（NPC关系变化摘要） -->
        <div v-else-if="phase === 'summary'" key="summary" class="act-summary">
          <div class="summary-symbol"></div>
          <h3 class="summary-title">本章余波</h3>
          <p class="summary-desc">{{ chapterEndText }}</p>

          <div class="npc-ripple-list">
            <div
              v-for="(ripple, idx) in chapterNpcRipples"
              :key="idx"
              class="npc-ripple-item"
              :class="'ripple-' + ripple.type"
            >
              <span class="ripple-npc">{{ ripple.npcName }}</span>
              <span class="ripple-arrow"></span>
              <span class="ripple-text">{{ ripple.text }}</span>
            </div>
          </div>

          <button class="action-proceed" @click="nextChapter">
            <span>{{ hasNextChapter ? '继续前行' : '揭示真相' }}</span>
            <span class="proceed-arrow"></span>
          </button>
        </div>

        <!-- 章节结束 -->
        <div v-else-if="phase === 'end'" key="end" class="act-finale">
          <div class="finale-symbol"></div>
          <h3 class="finale-title">{{ chapterEndTitle }}</h3>
          <p class="finale-desc">{{ chapterEndText }}</p>
          <button class="action-proceed" @click="nextChapter">
            <span>{{ hasNextChapter ? '下一章' : '揭示真相' }}</span>
            <span class="proceed-arrow"></span>
          </button>
        </div>

      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMbtiStore } from '../stores/mbti'
import { chapters, NPC_NAMES, NPC_RIPPLE_TEXTS, CHAPTER_COLORS } from '../data/gameData'
import { highlightKeywords } from '../utils/keywordHighlight'
import { useTTS } from '../utils/tts'

function hl(text) {
  return text ? highlightKeywords(text) : ''
}

const router = useRouter()
const route = useRoute()
const mbtiStore = useMbtiStore()
const tts = useTTS()

const chapterId = computed(() => parseInt(route.params.id))
const currentChapter = computed(() => chapters.find(c => c.id === chapterId.value))
const scenes = computed(() => currentChapter.value?.scenes || [])
const currentSceneIndex = ref(-1)
const currentScene = computed(() => {
  if (currentSceneIndex.value < 0) return null
  return scenes.value[currentSceneIndex.value] || null
})

const phase = ref('intro')
const showHeader = ref(false)

const chapterStyle = computed(() => ({
  '--chapter-color': getChapterColor(chapterId.value)
}))

const introLines = computed(() =>
  currentChapter.value?.intro?.split('\n').filter(l => l.trim()) || []
)

const sceneLines = computed(() =>
  currentScene.value?.text?.split('\n').filter(l => l.trim()) || []
)

const chapterEndTitle = computed(() => {
  return currentChapter.value?.endTitle || '本章完'
})

const chapterEndText = computed(() => {
  return currentChapter.value?.endText || '准备好了吗？'
})

const hasNextChapter = computed(() => chapterId.value < chapters.length)

const chapterNpcRipples = computed(() => {
  const relations = mbtiStore.npcRelations
  const ripples = []

  Object.entries(relations).forEach(([npc, val]) => {
    if (val >= 15) {
      ripples.push({
        npcName: NPC_NAMES[npc] || npc,
        text: NPC_RIPPLE_TEXTS[npc]?.high || '态度有所转变',
        type: 'positive'
      })
    } else if (val <= -15) {
      ripples.push({
        npcName: NPC_NAMES[npc] || npc,
        text: NPC_RIPPLE_TEXTS[npc]?.low || '态度变得冷淡',
        type: 'negative'
      })
    } else if (val !== 0) {
      ripples.push({
        npcName: NPC_NAMES[npc] || npc,
        text: NPC_RIPPLE_TEXTS[npc]?.neutral || '没有明显变化',
        type: 'neutral'
      })
    }
  })

  return ripples
})

const visibleOptions = computed(() => {
  if (!currentScene.value?.options) return []
  return currentScene.value.options.filter(option =>
    mbtiStore.shouldShowHiddenOption(option)
  )
})

const visibleChoices = computed(() => {
  return visibleOptions.value.filter(opt => !opt.isAction)
})

const visibleActions = computed(() => {
  return visibleOptions.value.filter(opt => opt.isAction === true)
})

onMounted(() => {
  resetState()
})

watch(chapterId, () => {
  resetState()
})

onUnmounted(() => {
  tts.stop()
})

function resetState() {
  currentSceneIndex.value = -1
  phase.value = 'intro'
  showHeader.value = false

  setTimeout(() => showHeader.value = true, 400)

  tts.preloadChapter(chapterId.value)
  tts.stop()
  tts.playChapterPlaylist(chapterId.value, 'intro')

  if (chapterId.value < chapters.length) {
    tts.preloadChapter(chapterId.value + 1)
  }
}

function goToScene(index) {
  const scene = scenes.value[index]
  if (scene) {
    mbtiStore.recordSceneVisit(scene.id)
  }
  currentSceneIndex.value = index
  phase.value = 'scene'

  tts.stop()
  tts.playChapterPlaylist(chapterId.value, scene?.id)
}

function selectOption(option) {
  mbtiStore.recordChoice(option)
  tts.stop()

  if (option.nextScene === 'end') {
    phase.value = 'summary'
  } else if (option.nextScene === 'result') {
    router.push('/result')
  } else {
    const nextIndex = scenes.value.findIndex(s => s.id === option.nextScene)
    if (nextIndex !== -1) {
      mbtiStore.recordSceneVisit(option.nextScene)
      phase.value = 'scene'
      currentSceneIndex.value = nextIndex
    }
  }
}

function triggerAction(action) {
  if (!action.gameType) return

  mbtiStore.recordChoice(action)
  tts.stop()
  router.push({ name: 'game', params: { type: action.gameType } })
}

const ACTION_ICONS = {
  match3: '🔍',
  sliding: '🔐',
  memory: '📁',
  code: '📡',
  sokoban: '📦',
  circuit: '🔌'
}

function getActionIcon(gameType) {
  return ACTION_ICONS[gameType] || '🎯'
}

function nextChapter() {
  tts.stop()
  if (hasNextChapter.value) {
    router.push(`/chapter/${chapterId.value + 1}`)
  } else {
    router.push('/result')
  }
}

function getOptionLetter(id) {
  return String.fromCharCode(65 + (id.charCodeAt(0) - 97))
}

function getChapterColor(id) {
  return CHAPTER_COLORS[id] || '#7a8aaa'
}

function isOptionRevealed(optionId) {
  return mbtiStore.isOptionRevealed(optionId)
}

function handleLongPressStart(option, event) {
  if (option.hiddenTrigger !== 'longPress') return
  if (mbtiStore.isOptionRevealed(option.id)) return

  event.preventDefault()

  mbtiStore.startLongPress(option.id, () => {
    console.log(`Hidden option ${option.id} revealed!`)
  })
}

function handleLongPressEnd(option) {
  if (option.hiddenTrigger !== 'longPress') return
  mbtiStore.cancelLongPress(option.id)
}
</script>

<style scoped>
.chapter-container {
  height: 100vh;
  width: 100vw;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    165deg,
    #06070c 0%,
    #0b0d14 30%,
    #080a10 60%,
    #080a10 100%
  );
}

.bg-solid {
  display: none;
}

.bg-noise {
  position: absolute;
  inset: 0;
  opacity: 0.015;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 100px 100px;
  pointer-events: none;
}

.chapter-header {
  text-align: center;
  padding-top: 2.5rem;
  padding-bottom: 0.4rem;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.header-chapter {
  display: block;
  color: var(--chapter-color, #7a8aaa);
  font-size: 0.65rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.header-title {
  color: #c0c4cc;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.22em;
}

.header-line {
  width: 28px;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--chapter-color, #7a8aaa), transparent);
  margin: 0.7rem auto 0;
  opacity: 0.35;
}

.scene-stage {
  max-width: 860px;
  width: 90%;
  margin: 0 auto;
  padding: 1.2rem 2.5rem 2.5rem;
  position: relative;
  z-index: 10;
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 0;
}

.act-intro,
.act-scene-combined,
.act-summary,
.act-finale {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.text-curtain {
  background: linear-gradient(
    170deg,
    rgba(255, 255, 255, 0.02) 0%,
    rgba(255, 255, 255, 0.006) 100%
  );
  border: 1px solid rgba(140, 150, 180, 0.06);
  padding: 1.6rem 2.2rem;
  position: relative;
  flex-shrink: 0;
}

.scene-curtain {
  padding-top: 1.8rem;
}

.text-curtain::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(140, 155, 195, 0.12),
    transparent
  );
}

.text-reveal {
  color: #a0a4b4;
  font-size: 0.95rem;
  line-height: 2.1;
  margin: 0;
}

.action-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  width: 100%;
  padding: 0.8rem;
  background: transparent;
  border-top: 1px solid rgba(140, 150, 180, 0.08);
  border-bottom: 1px solid rgba(140, 150, 180, 0.08);
  color: #78829a;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.4s ease;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-weight: 500;
  flex-shrink: 0;
}

.action-trigger:hover {
  color: #a0a4b4;
  border-color: rgba(140, 155, 195, 0.18);
  background: rgba(140, 150, 180, 0.02);
}

.trigger-icon {
  display: block;
  width: 6px;
  height: 6px;
  border-right: 1px solid currentColor;
  border-bottom: 1px solid currentColor;
  transform: rotate(45deg);
  animation: trigger-bounce 1.5s infinite;
}

@keyframes trigger-bounce {
  0%, 100% { transform: rotate(45deg) translateY(0); }
  50% { transform: rotate(45deg) translateY(4px); }
}

/* ===== 选项区域 ===== */
.choice-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.choice-prompt {
  text-align: center;
  color: #5a6278;
  font-size: 0.76rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  flex-shrink: 0;
  margin-top: 0.4rem;
}

.prompt-line {
  width: 40px;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(100, 110, 140, 0.2), transparent);
}

.choices-list {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  flex-shrink: 0;
}

.choice-card {
  display: flex;
  align-items: flex-start;
  gap: 1.2rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(
    170deg,
    rgba(255, 255, 255, 0.015) 0%,
    rgba(255, 255, 255, 0.004) 100%
  );
  border: 1px solid rgba(140, 150, 180, 0.05);
  color: #989cb4;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.choice-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 100%;
  background: var(--chapter-color, #7a8aaa);
  opacity: 0;
  transition: opacity 0.4s;
}

.choice-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 0% 50%,
    rgba(140, 155, 195, 0.04) 0%,
    transparent 55%
  );
  opacity: 0;
  transition: opacity 0.4s;
}

.choice-card:hover {
  background: rgba(255, 255, 255, 0.022);
  border-color: rgba(140, 155, 180, 0.12);
  transform: translateX(4px);
}

.choice-card:hover::before {
  opacity: 1;
}

.choice-card:hover::after {
  opacity: 1;
}

.choice-index {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(140, 150, 180, 0.06);
  border: 1px solid rgba(140, 150, 180, 0.1);
  border-radius: 4px;
  color: #6a7088;
  font-weight: 700;
  font-size: 0.82rem;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  transition: all 0.4s;
}

.choice-card:hover .choice-index {
  background: var(--chapter-color, #7a8aaa);
  border-color: var(--chapter-color, #7a8aaa);
  color: #0a0c10;
  box-shadow: 0 0 12px rgba(122, 138, 170, 0.25);
}

.choice-body {
  flex: 1;
  font-size: 0.92rem;
  line-height: 1.7;
  position: relative;
  z-index: 1;
  padding-top: 2px;
}

.hidden-label {
  color: rgba(180, 190, 220, 0.6);
  font-style: italic;
  font-size: 0.82rem;
  letter-spacing: 0.1em;
}

.choice-indicator {
  opacity: 0;
  transform: translateX(-6px);
  transition: all 0.4s;
  color: var(--chapter-color, #7a8aaa);
  position: relative;
  z-index: 1;
  font-size: 1rem;
  padding-top: 4px;
}

.choice-card:hover .choice-indicator {
  opacity: 0.5;
  transform: translateX(0);
}

.choice-card.hidden-choice {
  opacity: 1;
  cursor: pointer;
  border-color: rgba(140, 150, 180, 0.12);
  background: rgba(255, 255, 255, 0.015);
}

.choice-card.hidden-choice:hover {
  border-color: rgba(180, 190, 220, 0.22);
  background: rgba(255, 255, 255, 0.028);
}

.choice-card.press-hold::after {
  inset: 0;
  border-radius: 0;
  border: 1px dashed rgba(180, 190, 220, 0.25);
  background: none;
}

.choice-card.revealed-choice {
  border-color: var(--chapter-color, #7a8aaa);
  box-shadow:
    0 0 16px rgba(122, 138, 170, 0.12),
    0 0 32px rgba(122, 138, 170, 0.05);
  animation: revealed-glow 2.5s ease-in-out infinite alternate;
}

.choice-card.revealed-choice::before {
  opacity: 1;
}

@keyframes revealed-glow {
  from {
    box-shadow:
      0 0 16px rgba(122, 138, 170, 0.12),
      0 0 32px rgba(122, 138, 170, 0.05);
  }
  to {
    box-shadow:
      0 0 22px rgba(122, 138, 170, 0.18),
      0 0 44px rgba(122, 138, 170, 0.08);
  }
}

.reveal-mark {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 6px;
  height: 6px;
  background: var(--chapter-color, #7a8aaa);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--chapter-color, #7a8aaa);
  animation: mark-pulse 1.5s ease-in-out infinite;
  z-index: 2;
}

@keyframes mark-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

/* ===== 行动区（调查/取证任务） ===== */
.action-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid rgba(140, 150, 180, 0.05);
}

.action-prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  color: #4a5568;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.action-dot {
  width: 4px;
  height: 4px;
  background: rgba(140, 150, 180, 0.2);
  border-radius: 50%;
}

.actions-list {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 1rem;
  background: rgba(120, 130, 160, 0.03);
  border: 1px solid rgba(120, 130, 160, 0.08);
  border-radius: 3px;
  color: #8890a8;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  flex: 1;
  min-width: 0;
}

.action-card:hover {
  background: rgba(140, 145, 180, 0.06);
  border-color: rgba(160, 170, 200, 0.16);
  color: #a0a8c0;
}

.action-icon {
  font-size: 1rem;
  flex-shrink: 0;
  opacity: 0.8;
}

.action-body {
  flex: 1;
  min-width: 0;
  text-align: left;
  line-height: 1.4;
}

.action-hidden {
  opacity: 0.5;
  border-color: rgba(140, 150, 180, 0.08);
  background: rgba(255, 255, 255, 0.01);
}

.action-revealed {
  border-color: rgba(180, 150, 100, 0.18);
  background: rgba(180, 150, 100, 0.03);
  box-shadow: 0 0 12px rgba(180, 150, 100, 0.06);
}

/* ===== 章节结算 ===== */
.act-summary {
  text-align: center;
  padding: 1.5rem 1.5rem;
  justify-content: center;
}

.summary-symbol {
  width: 32px;
  height: 32px;
  margin: 0 auto 1rem;
  border: 1px solid rgba(140, 150, 180, 0.1);
  border-radius: 50%;
  position: relative;
  animation: summary-pulse 3s ease-in-out infinite;
  flex-shrink: 0;
}

.summary-symbol::before,
.summary-symbol::after {
  content: '';
  position: absolute;
  background: var(--chapter-color, #7a8aaa);
  border-radius: 1px;
}

.summary-symbol::before {
  width: 10px;
  height: 1px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.summary-symbol::after {
  width: 1px;
  height: 10px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

@keyframes summary-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

.summary-title {
  color: #b0b4c0;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.6rem;
  letter-spacing: 0.15em;
  flex-shrink: 0;
}

.summary-desc {
  color: #6a7088;
  font-size: 0.86rem;
  line-height: 1.7;
  margin: 0 0 1.5rem;
  flex-shrink: 0;
}

.npc-ripple-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.8rem;
  flex-shrink: 0;
}

.npc-ripple-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.7rem 1.2rem;
  background: rgba(255, 255, 255, 0.012);
  border: 1px solid rgba(140, 150, 180, 0.05);
  font-size: 0.84rem;
  animation: ripple-in 0.4s ease-out backwards;
}

.npc-ripple-item:nth-child(1) { animation-delay: 0.1s; }
.npc-ripple-item:nth-child(2) { animation-delay: 0.2s; }
.npc-ripple-item:nth-child(3) { animation-delay: 0.3s; }

@keyframes ripple-in {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

.ripple-npc {
  color: #8890a8;
  font-weight: 600;
  min-width: 36px;
  flex-shrink: 0;
}

.ripple-arrow {
  width: 12px;
  height: 1px;
  background: rgba(140, 150, 180, 0.15);
  flex-shrink: 0;
  position: relative;
}

.ripple-arrow::after {
  content: '';
  position: absolute;
  right: 0;
  top: -3px;
  border: 3px solid transparent;
  border-left-color: rgba(140, 150, 180, 0.15);
}

.ripple-text {
  color: #78829a;
  flex: 1;
  text-align: left;
}

.npc-ripple-item.ripple-positive {
  border-color: rgba(120, 160, 120, 0.1);
  background: rgba(120, 160, 120, 0.02);
}

.npc-ripple-item.ripple-positive .ripple-npc {
  color: #98c498;
}

.npc-ripple-item.ripple-positive .ripple-text {
  color: #88a888;
}

.npc-ripple-item.ripple-positive .ripple-arrow,
.npc-ripple-item.ripple-positive .ripple-arrow::after {
  background: rgba(120, 160, 120, 0.2);
  border-left-color: rgba(120, 160, 120, 0.2);
}

.npc-ripple-item.ripple-negative {
  border-color: rgba(160, 120, 120, 0.1);
  background: rgba(160, 120, 120, 0.02);
}

.npc-ripple-item.ripple-negative .ripple-npc {
  color: #c49898;
}

.npc-ripple-item.ripple-negative .ripple-text {
  color: #a88888;
}

.npc-ripple-item.ripple-negative .ripple-arrow,
.npc-ripple-item.ripple-negative .ripple-arrow::after {
  background: rgba(160, 120, 120, 0.2);
  border-left-color: rgba(160, 120, 120, 0.2);
}

/* ===== 结束页 ===== */
.act-finale {
  text-align: center;
  padding: 1.5rem 1.5rem;
  justify-content: center;
}

.finale-symbol {
  width: 36px;
  height: 36px;
  margin: 0 auto 1.2rem;
  border: 1px solid rgba(140, 150, 180, 0.12);
  border-radius: 50%;
  position: relative;
  animation: finale-spin 10s linear infinite;
  flex-shrink: 0;
}

.finale-symbol::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background: var(--chapter-color, #7a8aaa);
  border-radius: 50%;
}

@keyframes finale-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.finale-title {
  color: #b0b4c0;
  font-size: 1.35rem;
  font-weight: 700;
  margin: 0 0 0.8rem;
  letter-spacing: 0.12em;
  flex-shrink: 0;
}

.finale-desc {
  color: #6a7088;
  font-size: 0.86rem;
  line-height: 1.8;
  margin: 0 0 1.6rem;
  flex-shrink: 0;
}

.action-proceed {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 2rem;
  background: transparent;
  border: 1px solid rgba(140, 150, 180, 0.15);
  color: #9094a8;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s ease;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.action-proceed:hover {
  border-color: var(--chapter-color, #7a8aaa);
  color: #c0c4cc;
  box-shadow: 0 0 25px rgba(122, 138, 170, 0.12);
  transform: translateY(-2px);
}

.proceed-arrow {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(-45deg);
  transition: transform 0.3s;
}

.action-proceed:hover .proceed-arrow {
  transform: rotate(-45deg) translateX(3px);
}

.cinematic-fade-enter-active {
  animation: cinematic-fade-in 0.2s ease-out;
}

.cinematic-fade-leave-active {
  animation: cinematic-fade-out 0.15s ease-in;
}

@keyframes cinematic-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes cinematic-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

.fade-down-enter-active,
.fade-down-leave-active {
  transition: opacity 0.2s ease;
}

.fade-down-enter-from {
  opacity: 0;
}
/* ===== 关键字高亮 ===== */
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

/* ===== 性能优化 ===== */
.text-reveal {
  will-change: opacity, transform;
  contain: layout style;
}

.choice-card {
  will-change: transform, opacity;
  contain: layout style;
}

:deep(.tts-speaking) {
  color: #fbbf24;
  text-shadow: 0 0 8px rgba(251, 191, 36, 0.3);
  transition: all 0.3s ease;
}
</style>
