<template>
  <div class="game-container">
    <div class="game-header">
      <h2 class="game-title">🔐 密码锁破解</h2>
      <div class="game-stats">
        <span class="stat">剩余线索: {{ cluesLeft }}/3</span>
        <span class="stat">时间: {{ timeLeft }}s</span>
      </div>
    </div>

    <div class="puzzle-board">
      <div 
        v-for="(tile, index) in tiles" 
        :key="index"
        class="tile"
        :class="{ 
          empty: tile === 0,
          correct: isCorrectPosition(index, tile)
        }"
        @click="handleTileClick(index)"
      >
        <span v-if="tile !== 0" class="tile-number">{{ tile }}</span>
      </div>
    </div>

    <div class="game-controls">
      <button class="back-btn" @click="abortGame">返回剧情</button>
    </div>

    <div v-if="gameWon" class="victory-overlay">
      <div class="victory-card">
        <h2>✨ 记忆解锁！</h2>
        <p>你发现了一段关键记忆：</p>
        <div class="clue-reveal">{{ currentClue }}</div>
        <button v-if="cluesLeft > 0" class="continue-btn" @click="nextPuzzle">
          继续解密 ({{ cluesLeft }} 剩余)
        </button>
        <button v-else class="continue-btn" @click="goBack">
          继续剧情
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMbtiStore } from '../../stores/mbti'

const router = useRouter()
const mbtiStore = useMbtiStore()

const CLUES = [
  '密码的第一位是 2',
  '第二位数字看起来像是 7',
  '最后一位被刮花了，但隐约可见是奇数'
]

const GRID_SIZE = 3
const TIME_LIMIT = 60

const tiles = ref([])
const timeLeft = ref(TIME_LIMIT)
const gameWon = ref(false)
const cluesLeft = ref(3)
const currentClue = ref('')
let timer = null

onMounted(() => {
  initPuzzle()
  startTimer()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function initPuzzle() {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 0]
  do {
    tiles.value = shuffleArray(nums)
  } while (!isSolvable(tiles.value))
  gameWon.value = false
}

function shuffleArray(arr) {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function isSolvable(arr) {
  let inversions = 0
  const nums = arr.filter(n => n !== 0)
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] > nums[j]) inversions++
    }
  }
  return inversions % 2 === 0
}

function handleTileClick(index) {
  if (gameWon.value || tiles.value[index] === 0) return

  const emptyIndex = tiles.value.indexOf(0)
  const row = Math.floor(index / GRID_SIZE)
  const col = index % GRID_SIZE
  const emptyRow = Math.floor(emptyIndex / GRID_SIZE)
  const emptyCol = emptyIndex % GRID_SIZE

  const isAdjacent = (Math.abs(row - emptyRow) + Math.abs(col - emptyCol)) === 1

  if (isAdjacent) {
    ;[tiles.value[index], tiles.value[emptyIndex]] = [tiles.value[emptyIndex], tiles.value[index]]
    checkWin()
  }
}

function isCorrectPosition(index, tile) {
  if (tile === 0) return false
  return tile === index + 1
}

function checkWin() {
  for (let i = 0; i < tiles.value.length - 1; i++) {
    if (tiles.value[i] !== i + 1) return
  }
  if (tiles.value[tiles.value.length - 1] !== 0) return

  gameWon.value = true
  currentClue.value = CLUES[CLUES.length - cluesLeft.value]
  cluesLeft.value--
  if (timer) clearInterval(timer)
}

function startTimer() {
  timeLeft.value = TIME_LIMIT
  timer = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      if (timer) clearInterval(timer)
      goBack()
    }
  }, 1000)
}

function nextPuzzle() {
  initPuzzle()
  startTimer()
}

function goBack() {
  if (timer) clearInterval(timer)
  mbtiStore.recordChoice({
    dimensions: ['I', 'T', 'N'],
    specialFlag: 'puzzle',
    isHidden: true,
    behaviorTags: ['cautious'],
    endingWeight: { escape: 1 }
  })
  const usedTime = TIME_LIMIT - timeLeft.value
  const rank = usedTime <= 20 ? 'S' : usedTime <= 40 ? 'A' : usedTime <= 55 ? 'B' : 'C'
  sessionStorage.setItem('gameResult', JSON.stringify({
    success: true,
    score: (3 - cluesLeft.value) * 333,
    time: usedTime + '秒',
    rank,
    gameType: 'sliding',
    reward: ['escape_fragment'],
    narrative: '电子锁发出"滴"的一声，屏幕上闪过一行字："访问权限已授予——04号观察者"。律师的私人储物柜缓缓打开。'
  }))
  mbtiStore.recordGameResult({ success: true, gameType: 'sliding' })
  router.push({ name: 'gameResult', params: { type: 'sliding' } })
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
  background: linear-gradient(160deg, #0c0c14 0%, #141428 50%, #0a1628 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1.5rem;
  color: #c0c4cc;
  user-select: none;
}

.game-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 30%, rgba(167, 139, 250, 0.08) 0%, transparent 60%);
  pointer-events: none;
}

.game-header {
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  z-index: 10;
}

.game-title {
  color: #a78bfa;
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

.puzzle-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-width: 300px;
  margin: 0 auto 2rem;
  position: relative;
  z-index: 10;
}

.tile {
  aspect-ratio: 1;
  background: rgba(167, 139, 250, 0.15);
  border: 2px solid rgba(167, 139, 250, 0.3);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tile:hover {
  background: rgba(167, 139, 250, 0.25);
  transform: scale(1.05);
}

.tile.empty {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
  cursor: default;
}

.tile.correct {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.3);
}

.tile-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #e2e8f0;
}

.game-controls {
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 10;
}

.back-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
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
  border: 2px solid rgba(167, 139, 250, 0.3);
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
  color: #a78bfa;
  font-size: 2rem;
  margin: 0 0 1rem;
}

.victory-card p {
  color: #94a3b8;
  font-size: 1.1rem;
  margin: 0 0 1.5rem;
}

.clue-reveal {
  background: rgba(167, 139, 250, 0.1);
  border: 1px solid rgba(167, 139, 250, 0.3);
  border-radius: 12px;
  padding: 1rem;
  color: #a78bfa;
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.continue-btn {
  background: linear-gradient(135deg, #a78bfa, #7c3aed);
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
  box-shadow: 0 10px 30px rgba(167, 139, 250, 0.4);
}
</style>
