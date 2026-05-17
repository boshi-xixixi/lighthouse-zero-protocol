<template>
  <div class="game-container">
    <div class="game-header">
      <h2 class="game-title">🔍 搜证匹配</h2>
      <div class="game-stats">
        <span class="stat">步数: {{ steps }}/30</span>
        <span class="stat">分数: {{ score }}/1000</span>
      </div>
    </div>

    <div class="game-board">
      <div 
        v-for="(cell, index) in board" 
        :key="index"
        class="cell"
        :class="{ 
          selected: selectedCell === index,
          matched: cell === null,
          swapping: swappingCells.includes(index)
        }"
        @click="handleCellClick(index)"
      >
        <span v-if="cell !== null" class="cell-icon">{{ cell }}</span>
      </div>
    </div>

    <div class="game-controls">
      <button class="hint-btn" @click="showHint">💡 提示</button>
      <button class="back-btn" @click="abortGame">返回剧情</button>
    </div>

    <div v-if="gameWon" class="victory-overlay">
      <div class="victory-card">
        <h2>✨ 解密成功！</h2>
        <p>你发现了一条关键线索：</p>
        <div class="clue-reveal">"旧电台的频率是 97.3 MHz——有人在向外发送信号"</div>
        <button class="continue-btn" @click="goBack">继续剧情</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMbtiStore } from '../../stores/mbti'

const router = useRouter()
const mbtiStore = useMbtiStore()

const ICONS = ['💊', '📻', '🧥', '🗝️', '📝', '🔦']
const BOARD_SIZE = 36
const MAX_STEPS = 30
const TARGET_SCORE = 1000

const board = ref([])
const selectedCell = ref(null)
const steps = ref(0)
const score = ref(0)
const gameWon = ref(false)
const swappingCells = ref([])

onMounted(() => {
  initBoard()
})

function initBoard() {
  let icons = []
  for (let i = 0; i < BOARD_SIZE / 2; i++) {
    icons.push(...[ICONS[i % ICONS.length], ICONS[i % ICONS.length]])
  }
  board.value = shuffleArray(icons)
}

function shuffleArray(arr) {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function handleCellClick(index) {
  if (gameWon.value || board.value[index] === null) return

  if (selectedCell.value === null) {
    selectedCell.value = index
  } else if (selectedCell.value === index) {
    selectedCell.value = null
  } else {
    trySwap(selectedCell.value, index)
  }
}

async function trySwap(index1, index2) {
  if (steps.value >= MAX_STEPS) return

  swappingCells.value = [index1, index2]
  await new Promise(r => setTimeout(r, 300))

  const temp = board.value[index1]
  board.value[index1] = board.value[index2]
  board.value[index2] = temp

  const matches = findMatches()
  if (matches.length > 0) {
    steps.value++
    processMatches(matches)
  } else {
    board.value[index2] = board.value[index1]
    board.value[index1] = temp
  }

  swappingCells.value = []
  selectedCell.value = null
}

function findMatches() {
  const matches = new Set()
  const size = 6

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size - 2; col++) {
      const idx = row * size + col
      if (board.value[idx] && 
          board.value[idx] === board.value[idx + 1] && 
          board.value[idx] === board.value[idx + 2]) {
        matches.add(idx)
        matches.add(idx + 1)
        matches.add(idx + 2)
      }
    }
  }

  for (let col = 0; col < size; col++) {
    for (let row = 0; row < size - 2; row++) {
      const idx = row * size + col
      if (board.value[idx] && 
          board.value[idx] === board.value[idx + size] && 
          board.value[idx] === board.value[idx + size * 2]) {
        matches.add(idx)
        matches.add(idx + size)
        matches.add(idx + size * 2)
      }
    }
  }

  return Array.from(matches)
}

async function processMatches(matches) {
  score.value += matches.length * 50
  matches.forEach(idx => {
    board.value[idx] = null
  })

  await new Promise(r => setTimeout(r, 400))
  dropPieces()
  fillNewPieces()

  if (score.value >= TARGET_SCORE) {
    gameWon.value = true
  } else {
    const newMatches = findMatches()
    if (newMatches.length > 0) {
      processMatches(newMatches)
    }
  }
}

function dropPieces() {
  const size = 6
  for (let col = 0; col < size; col++) {
    let emptyRow = size - 1
    for (let row = size - 1; row >= 0; row--) {
      if (board.value[row * size + col] !== null) {
        board.value[emptyRow * size + col] = board.value[row * size + col]
        if (emptyRow !== row) {
          board.value[row * size + col] = null
        }
        emptyRow--
      }
    }
  }
}

function fillNewPieces() {
  const size = 6
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (board.value[i] === null) {
      board.value[i] = ICONS[Math.floor(Math.random() * ICONS.length)]
    }
  }
}

function showHint() {
  const matches = findMatches()
  if (matches.length > 0) {
    selectedCell.value = matches[0]
  }
}

function goBack() {
  mbtiStore.recordChoice({
    dimensions: ['I', 'T', 'N'],
    specialFlag: 'puzzle',
    isHidden: true,
    behaviorTags: ['curious'],
    endingWeight: { truth: 1 }
  })
  const rank = score.value >= 1500 ? 'S' : score.value >= 1000 ? 'A' : score.value >= 500 ? 'B' : 'C'
  sessionStorage.setItem('gameResult', JSON.stringify({
    success: gameWon.value,
    score: score.value,
    time: steps.value + '步',
    rank,
    gameType: 'match3',
    reward: ['truth_fragment'],
    narrative: '你从拼合后的碎片里看见了一张旧照片——海鸥号启航那天，甲板上的人群中，有一个身影让你心头一震。'
  }))
  mbtiStore.recordGameResult({ success: gameWon.value, gameType: 'match3' })
  router.push({ name: 'gameResult', params: { type: 'match3' } })
}

function abortGame() {
  router.back()
}
</script>

<style scoped>
.game-container {
  height: 100vh;
  width: 100vw;
  overflow-y: auto;
  overflow-x: hidden;
  background: linear-gradient(160deg, #06070c 0%, #0b0d14 40%, #080a10 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 1rem;
  color: #c0c4cc;
  user-select: none;
}

.game-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 30%, rgba(34, 211, 238, 0.08) 0%, transparent 60%);
  pointer-events: none;
}

.game-header {
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  z-index: 10;
}

.game-title {
  color: #22d3ee;
  font-size: 1.8rem;
  margin: 0 0 1rem;
}

.game-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.stat {
  color: #94a3b8;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.game-board {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  max-width: 400px;
  margin: 0 auto 2rem;
  position: relative;
  z-index: 10;
}

.cell {
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cell:hover {
  background: rgba(34, 211, 238, 0.1);
  border-color: rgba(34, 211, 238, 0.3);
}

.cell.selected {
  background: rgba(34, 211, 238, 0.2);
  border-color: #22d3ee;
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
}

.cell.matched {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
  cursor: default;
}

.cell-icon {
  font-size: 1.8rem;
}

.game-controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  position: relative;
  z-index: 10;
}

.hint-btn, .back-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.hint-btn {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.hint-btn:hover {
  background: rgba(251, 191, 36, 0.3);
}

.back-btn {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.victory-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fade-in 0.5s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.victory-card {
  background: linear-gradient(160deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid rgba(34, 211, 238, 0.3);
  border-radius: 24px;
  padding: 3rem 2.5rem;
  text-align: center;
  max-width: 400px;
  animation: scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scale-in {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.victory-card h2 {
  color: #22d3ee;
  font-size: 2rem;
  margin: 0 0 1rem;
}

.victory-card p {
  color: #94a3b8;
  font-size: 1.1rem;
  margin: 0 0 1.5rem;
}

.clue-reveal {
  background: rgba(34, 211, 238, 0.1);
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 12px;
  padding: 1rem;
  color: #22d3ee;
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.continue-btn {
  background: linear-gradient(135deg, #22d3ee, #06b6d4);
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.continue-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(34, 211, 238, 0.4);
}
</style>
