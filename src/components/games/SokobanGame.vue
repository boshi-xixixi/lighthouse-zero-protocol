<template>
  <div class="game-container">
    <div class="game-header">
      <h2 class="game-title">📦 证据搬运</h2>
      <div class="game-stats">
        <span class="stat">步数: {{ moves }}</span>
      </div>
    </div>

    <div class="level-hint" v-if="levelHint">{{ levelHint }}</div>

    <div class="sokoban-board" :style="{ gridTemplateColumns: `repeat(${boardWidth}, 1fr)` }">
      <div
        v-for="(cell, idx) in flatBoard"
        :key="idx"
        class="cell"
        :class="getCellClass(cell)"
      >
        <span v-if="cell === PLAYER || cell === PLAYER_ON_GOAL" class="player-icon">●</span>
        <span v-else-if="cell === BOX || cell === BOX_ON_GOAL" class="box-icon">▣</span>
        <span v-else-if="cell === GOAL || cell === GOAL_EMPTY" class="goal-icon">✦</span>
      </div>
    </div>

    <div class="game-controls">
      <button class="ctrl-btn" @click="undoMove">↩ 撤销</button>
      <button class="ctrl-btn" @click="resetLevel">↻ 重置</button>
      <button class="back-btn" @click="abortGame">返回剧情</button>
    </div>

    <!-- 方向键（桌面端提示） -->
    <div class="dpad-hint">使用 ↑ ↓ ← → 或 WASD 移动</div>

    <div v-if="gameWon" class="victory-overlay">
      <div class="victory-card">
        <h2>✨ 证据已归位！</h2>
        <p>你把所有关键证据搬运到了安全位置。</p>
        <div class="clue-reveal">"证据箱上的封条写着：'仅限04号观察者开启——内部含沉船当日航海日志残页'"</div>
        <button class="continue-btn" @click="goBack">继续剧情</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMbtiStore } from '../../stores/mbti'

const router = useRouter()
const mbtiStore = useMbtiStore()

const EMPTY = 0
const WALL = 1
const GOAL = 2
const BOX = 3
const PLAYER = 4
const BOX_ON_GOAL = 5
const PLAYER_ON_GOAL = 6
const GOAL_EMPTY = 7

const levels = [
  {
    hint: '把证据箱推到标记位置',
    map: [
      [1,1,1,1,1,1],
      [1,0,0,0,0,1],
      [1,0,3,0,0,1],
      [1,0,0,4,2,1],
      [1,0,0,0,0,1],
      [1,1,1,1,1,1]
    ]
  }
]

const currentLevel = ref(0)
const currentBoard = ref([])
const history = ref([])
const moves = ref(0)
const gameWon = ref(false)

const boardWidth = computed(() => {
  return currentBoard.value.length > 0 ? currentBoard.value[0].length : 6
})

const flatBoard = computed(() => {
  return currentBoard.value.flat()
})

const levelHint = computed(() => levels[currentLevel.value]?.hint || '')

function initLevel(levelIdx) {
  const level = levels[levelIdx]
  currentBoard.value = level.map.map(row => [...row])
  history.value = []
  moves.value = 0
  gameWon.value = false
}

function getCellClass(cell) {
  if (cell === WALL) return 'wall'
  if (cell === GOAL || cell === GOAL_EMPTY) return 'goal'
  if (cell === BOX) return 'box'
  if (cell === BOX_ON_GOAL) return 'box box-on-goal'
  if (cell === PLAYER || cell === PLAYER_ON_GOAL) return 'player'
  return 'floor'
}

function findPlayer() {
  const board = currentBoard.value
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === PLAYER || board[r][c] === PLAYER_ON_GOAL) {
        return { r, c }
      }
    }
  }
  return null
}

function move(dirR, dirC) {
  if (gameWon.value) return

  const pos = findPlayer()
  if (!pos) return

  const board = currentBoard.value
  const newR = pos.r + dirR
  const newC = pos.c + dirC

  if (newR < 0 || newR >= board.length || newC < 0 || newC >= board[0].length) return

  const target = board[newR][newC]

  if (target === WALL || target === BOX_ON_GOAL) return

  // Save state for undo
  const prevBoard = board.map(row => [...row])
  history.value.push(prevBoard)

  if (target === BOX) {
    const boxNewR = newR + dirR
    const boxNewC = newC + dirC

    if (boxNewR < 0 || boxNewR >= board.length || boxNewC < 0 || boxNewC >= board[0].length) return

    const behind = board[boxNewR][boxNewC]
    if (behind === WALL || behind === BOX || behind === BOX_ON_GOAL) return

    // Move box
    board[boxNewR][boxNewC] = (behind === GOAL || behind === GOAL_EMPTY) ? BOX_ON_GOAL : BOX
    board[newR][newC] = (target === GOAL) ? PLAYER_ON_GOAL : PLAYER
    board[pos.r][pos.c] = (board[pos.r][pos.c] === PLAYER_ON_GOAL) ? GOAL : EMPTY
  } else {
    // Simple move
    board[newR][newC] = (target === GOAL || target === GOAL_EMPTY) ? PLAYER_ON_GOAL : PLAYER
    board[pos.r][pos.c] = (board[pos.r][pos.c] === PLAYER_ON_GOAL) ? GOAL : EMPTY
  }

  moves.value++
  checkWin()
}

function checkWin() {
  const board = currentBoard.value
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === BOX) return
    }
  }
  gameWon.value = true
}

function undoMove() {
  if (history.value.length === 0 || gameWon.value) return
  currentBoard.value = history.value.pop()
  moves.value--
}

function resetLevel() {
  initLevel(currentLevel.value)
}

function abortGame() {
  router.back()
}

function goBack() {
  mbtiStore.recordChoice({
    dimensions: ['I', 'T', 'J'],
    specialFlag: 'guardian',
    isHidden: true,
    behaviorTags: ['protective', 'cautious'],
    endingWeight: { truth: 2, escape: 1 }
  })
  const rank = moves.value <= 15 ? 'S' : moves.value <= 30 ? 'A' : moves.value <= 50 ? 'B' : 'C'
  sessionStorage.setItem('gameResult', JSON.stringify({
    success: true,
    score: Math.max(100, 500 - moves.value * 5),
    time: moves.value + '步',
    rank,
    gameType: 'sokoban',
    reward: ['truth_fragment'],
    narrative: '你把所有证据箱推到了指定位置。打开最后一个箱子，里面是一张泛黄的航海日志残页，上面只看得清一行字："第12小时，有人从外面打开了舱门……"'
  }))
  mbtiStore.recordGameResult({ success: true, gameType: 'sokoban' })
  router.push({ name: 'gameResult', params: { type: 'sokoban' } })
}

function handleKeydown(e) {
  if (gameWon.value) return
  switch (e.key) {
    case 'ArrowUp': case 'w': case 'W': e.preventDefault(); move(-1, 0); break
    case 'ArrowDown': case 's': case 'S': e.preventDefault(); move(1, 0); break
    case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); move(0, -1); break
    case 'ArrowRight': case 'd': case 'D': e.preventDefault(); move(0, 1); break
  }
}

onMounted(() => {
  initLevel(0)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
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

.game-header {
  width: 100%;
  max-width: 420px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.game-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.08em;
}

.game-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #6a7088;
}

.stat {
  color: #78829a;
  font-weight: 500;
}

.level-hint {
  max-width: 420px;
  width: 100%;
  text-align: center;
  color: #8890a8;
  font-size: 0.82rem;
  margin-bottom: 1rem;
  font-style: italic;
  letter-spacing: 0.03em;
}

.sokoban-board {
  display: grid;
  gap: 2px;
  background: rgba(120, 125, 155, 0.06);
  border: 1px solid rgba(120, 125, 155, 0.1);
  padding: 6px;
  border-radius: 4px;
  margin-bottom: 1.2rem;
}

.cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  transition: background 0.15s ease;
  position: relative;
  min-width: 32px;
  min-height: 32px;
}

.cell.floor {
  background: rgba(255, 255, 255, 0.02);
}

.cell.wall {
  background: linear-gradient(135deg, #2a3040, #1e2430);
  border-radius: 3px;
}

.cell.goal {
  background: rgba(180, 150, 100, 0.06);
  border: 1px dashed rgba(180, 150, 100, 0.15);
}

.player-icon {
  color: #7aa8c4;
  font-size: 1.1rem;
  text-shadow: 0 0 8px rgba(122, 168, 196, 0.4);
  animation: player-pulse 2s ease-in-out infinite;
}

@keyframes player-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

.box-icon {
  color: #c4a878;
  font-size: 1.15rem;
  text-shadow: 0 0 6px rgba(196, 168, 120, 0.25);
  transition: all 0.2s ease;
}

.box-on-goal .box-icon {
  color: #98c498;
  text-shadow: 0 0 10px rgba(152, 196, 152, 0.35);
}

.goal-icon {
  color: rgba(180, 150, 100, 0.3);
  font-size: 0.9rem;
}

.game-controls {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 0.8rem;
}

.ctrl-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid rgba(130, 135, 165, 0.12);
  border-radius: 3px;
  color: #78829a;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.25s ease;
}

.ctrl-btn:hover {
  border-color: rgba(130, 135, 165, 0.25);
  color: #989cb4;
  background: rgba(130, 135, 165, 0.05);
}

.back-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid rgba(130, 135, 165, 0.1);
  border-radius: 3px;
  color: #5a6278;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.25s ease;
  margin-left: auto;
}

.back-btn:hover {
  border-color: rgba(130, 135, 165, 0.2);
  color: #78829a;
}

.dpad-hint {
  text-align: center;
  color: #4a5068;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
}

/* Victory overlay */
.victory-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 7, 12, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: victory-fade-in 0.4s ease;
}

@keyframes victory-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.victory-card {
  background: linear-gradient(170deg, rgba(20, 22, 32, 0.98), rgba(14, 16, 24, 0.98));
  border: 1px solid rgba(180, 150, 100, 0.15);
  border-radius: 4px;
  padding: 2.5rem 2rem;
  text-align: center;
  max-width: 380px;
  width: 85%;
}

.victory-card h2 {
  color: #c4a878;
  font-size: 1.4rem;
  margin: 0 0 0.6rem;
  letter-spacing: 0.08em;
}

.victory-card p {
  color: #8890a8;
  font-size: 0.9rem;
  margin: 0 0 1.2rem;
  line-height: 1.6;
}

.clue-reveal {
  background: rgba(180, 150, 100, 0.05);
  border-left: 2px solid rgba(180, 150, 100, 0.2);
  padding: 1rem 1.2rem;
  color: #b8a888;
  font-size: 0.86rem;
  line-height: 1.7;
  font-style: italic;
  margin-bottom: 1.5rem;
  text-align: left;
}

.continue-btn {
  padding: 0.75rem 2rem;
  background: transparent;
  border: 1px solid rgba(180, 150, 100, 0.25);
  border-radius: 3px;
  color: #c4a878;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.08em;
}

.continue-btn:hover {
  border-color: rgba(200, 170, 120, 0.4);
  color: #e0d4a8;
  box-shadow: 0 0 20px rgba(180, 150, 100, 0.12);
}
</style>
