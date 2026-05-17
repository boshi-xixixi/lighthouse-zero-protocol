<template>
  <div class="game-result-container">
    <div class="bg-layer"></div>

    <div class="result-content" :class="{ revealed: isRevealed }">
      <div class="result-header">
        <span class="game-type-badge">{{ gameTypeInfo.label }}</span>
        <h2 class="result-title">挑战完成</h2>
      </div>

      <div class="clue-panel">
        <div class="clue-icon-ring">
          <span class="clue-icon">{{ gameTypeInfo.icon }}</span>
        </div>
        <h3 class="clue-title">发现线索</h3>
        <p class="clue-text">{{ gameTypeInfo.clue }}</p>
      </div>

      <!-- 叙事化结果 -->
      <div v-if="gameNarrative" class="narrative-panel">
        <div class="narrative-mark"></div>
        <p class="narrative-text">{{ gameNarrative }}</p>
      </div>

      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-value">{{ gameStats.score }}</span>
          <span class="stat-label">得分</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ gameStats.time }}</span>
          <span class="stat-label">用时</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ gameStats.rank }}</span>
          <span class="stat-label">评级</span>
        </div>
      </div>

      <div class="action-group">
        <button class="action-btn primary-action" @click="continueStory">
          <span class="btn-icon-left"></span>
          <span>继续剧情</span>
          <span class="btn-icon-right"></span>
        </button>
      </div>

      <p class="hint-text">
        线索已记录，将在终局审判中发挥作用...
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const isRevealed = ref(false)

const gameType = computed(() => {
  const t = route.params.type
  return Array.isArray(t) ? t[0] : t
})

const GAME_TYPES = {
  match3: {
    label: '搜证匹配',
    icon: '🔍',
    clue: '"旧电台的频率是 97.3 MHz——有人在向外发送信号"'
  },
  sliding: {
    label: '密码锁破解',
    icon: '🔐',
    clue: '"律师电子锁的密码前三位是 2-7-?——最后一位被刮花了"'
  },
  memory: {
    label: '档案配对',
    icon: '📁',
    clue: '"四份档案袋的内容对上了——记者那份有额外的手写笔记"'
  },
  code: {
    label: '广播破解',
    icon: '📡',
    clue: '"广播控制码已获取——可以覆盖灯塔的原始信号"'
  },
  sokoban: {
    label: '证据搬运',
    icon: '📦',
    clue: '"所有证据箱已归位——封条上写着：仅限04号观察者开启"'
  },
  circuit: {
    label: '信号修复',
    icon: '🔌',
    clue: '"灯塔主电源线路恢复——一段被覆盖的录音浮出水面"'
  }
}

const gameTypeInfo = computed(() => {
  return GAME_TYPES[gameType.value] || {
    label: '未知挑战',
    icon: '❓',
    clue: '你发现了一条关键线索...'
  }
})

const gameStats = computed(() => {
  const stats = sessionStorage.getItem('gameResult')
  if (stats) {
    try {
      return JSON.parse(stats)
    } catch (e) {}
  }
  return { score: '--', time: '--', rank: '--' }
})

const gameNarrative = computed(() => {
  return gameStats.value?.narrative || ''
})

onMounted(() => {
  window.scrollTo(0, 0)
  setTimeout(() => isRevealed.value = true, 200)
})

function continueStory() {
  router.go(-2)
}

function viewPersonality() {
  router.push('/result')
}
</script>

<style scoped>
.game-result-container {
  height: 100vh;
  width: 100vw;
  background: linear-gradient(160deg, #06070c 0%, #0b0d14 40%, #080a10 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-layer {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(180, 140, 80, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(100, 80, 120, 0.06) 0%, transparent 50%);
}

.result-content {
  position: relative;
  z-index: 10;
  max-width: 560px;
  width: 85%;
  padding: 2.5rem 2.5rem;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.result-content.revealed {
  opacity: 1;
  transform: translateY(0);
}

.result-header {
  text-align: center;
  margin-bottom: 2rem;
}

.game-type-badge {
  display: inline-block;
  padding: 0.35rem 1rem;
  background: rgba(180, 150, 100, 0.08);
  border: 1px solid rgba(180, 150, 100, 0.15);
  border-radius: 2px;
  color: #c4a878;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  margin-bottom: 1rem;
}

.result-title {
  color: #c0c4cc;
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.15em;
}

.clue-panel {
  background: linear-gradient(
    170deg,
    rgba(255, 255, 255, 0.02) 0%,
    rgba(255, 255, 255, 0.005) 100%
  );
  border: 1px solid rgba(180, 150, 100, 0.08);
  padding: 2rem 1.8rem;
  text-align: center;
  margin-bottom: 1.5rem;
  position: relative;
}

.clue-panel::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(200, 170, 120, 0.12), transparent);
}

.clue-icon-ring {
  width: 56px;
  height: 56px;
  margin: 0 auto 1.2rem;
  border: 1px solid rgba(180, 150, 100, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clue-icon {
  font-size: 1.6rem;
}

.clue-title {
  color: #c4a878;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  margin: 0 0 0.8rem;
}

.clue-text {
  color: #b8a888;
  font-size: 0.92rem;
  line-height: 1.7;
  margin: 0;
  font-style: italic;
}

.narrative-panel {
  background: linear-gradient(
    170deg,
    rgba(180, 150, 100, 0.03) 0%,
    rgba(180, 150, 100, 0.008) 100%
  );
  border-left: 2px solid rgba(180, 150, 100, 0.15);
  padding: 1.3rem 1.5rem;
  margin-bottom: 1.5rem;
  position: relative;
}

.narrative-mark {
  position: absolute;
  left: -1px;
  top: 1.2rem;
  width: 6px;
  height: 6px;
  background: rgba(180, 150, 100, 0.4);
  border-radius: 50%;
}

.narrative-text {
  color: #a89878;
  font-size: 0.88rem;
  line-height: 1.85;
  margin: 0;
  font-style: italic;
  letter-spacing: 0.02em;
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 1.2rem 1.5rem;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(130, 135, 165, 0.05);
  margin-bottom: 1.8rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  color: #c0c4cc;
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: #5a6278;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: linear-gradient(to bottom, transparent, rgba(180, 150, 100, 0.15), transparent);
}

.action-group {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin-bottom: 1.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 1rem 1.5rem;
  cursor: pointer;
  transition: all 0.35s ease;
  font-size: 0.88rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  border: 1px solid;
}

.primary-action {
  background: transparent;
  border-color: rgba(180, 150, 100, 0.2);
  color: #c4a878;
}

.primary-action:hover {
  border-color: rgba(200, 170, 120, 0.35);
  color: #e0d4a8;
  box-shadow: 0 0 25px rgba(180, 150, 100, 0.12);
  transform: translateY(-2px);
}

.secondary-action {
  background: transparent;
  border-color: rgba(130, 135, 165, 0.08);
  color: #6a7088;
}

.secondary-action:hover {
  border-color: rgba(130, 135, 165, 0.18);
  color: #8890a8;
  transform: translateY(-1px);
}

.btn-icon-left,
.btn-icon-right {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(-45deg);
  transition: transform 0.3s;
}

.btn-icon-right {
  transform: rotate(135deg);
}

.alt-icon {
  width: 4px;
  height: 4px;
  border: none;
  background: currentColor;
  border-radius: 50%;
  transform: none;
}

.primary-action:hover .btn-icon-right {
  transform: rotate(135deg) translateX(2px);
}

.hint-text {
  text-align: center;
  color: #4a5068;
  font-size: 0.78rem;
  font-style: italic;
  margin: 0;
  letter-spacing: 0.04em;
}
</style>
