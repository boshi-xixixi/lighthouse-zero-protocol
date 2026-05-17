<template>
  <div class="game-view-container">
    <transition name="game-transition" mode="out-in">
      <Match3Game v-if="gameType === 'match3'" key="match3" />
      <SlidingPuzzleGame v-else-if="gameType === 'sliding'" key="sliding" />
      <MemoryGame v-else-if="gameType === 'memory'" key="memory" />
      <CodeBreakingGame v-else-if="gameType === 'code'" key="code" />
      <SokobanGame v-else-if="gameType === 'sokoban'" key="sokoban" />
      <CircuitGame v-else-if="gameType === 'circuit'" key="circuit" />
      <div v-else class="error-state">
        <h2>游戏类型未找到</h2>
        <button @click="goBack">返回</button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Match3Game from '../components/games/Match3Game.vue'
import SlidingPuzzleGame from '../components/games/SlidingPuzzleGame.vue'
import MemoryGame from '../components/games/MemoryGame.vue'
import CodeBreakingGame from '../components/games/CodeBreakingGame.vue'
import SokobanGame from '../components/games/SokobanGame.vue'
import CircuitGame from '../components/games/CircuitGame.vue'

const route = useRoute()
const router = useRouter()

const gameType = computed(() => {
  const t = route.params.type
  return Array.isArray(t) ? t[0] : t
})

function goBack() {
  router.back()
}
</script>

<style scoped>
.game-view-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.error-state {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #0c0c14 0%, #141428 50%, #0a1628 100%);
  color: #e2e8f0;
}

.error-state h2 {
  margin-bottom: 2rem;
}

.error-state button {
  padding: 0.8rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.error-state button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.game-transition-enter-active,
.game-transition-leave-active {
  transition: all 0.3s ease;
}

.game-transition-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.game-transition-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
