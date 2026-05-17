<template>
  <div class="game-container">
    <div class="game-header">
      <h2 class="game-title">🔌 信号修复</h2>
      <div class="game-stats">
        <span class="stat">旋转: {{ rotations }}</span>
        <span class="stat">连通: {{ connectedCount }}/{{ totalNodes }}</span>
      </div>
    </div>

    <div class="level-hint" v-if="levelHint">{{ levelHint }}</div>

    <div class="circuit-board">
      <div class="source-node">
        <span class="node-label">信号源</span>
      </div>

      <div class="grid-area">
        <div
          v-for="(node, idx) in nodes"
          :key="idx"
          class="circuit-node"
          :class="{ 
            'node-active': node.active,
            'node-powered': node.powered,
            'node-source': node.isSource,
            'node-target': node.isTarget
          }"
          :style="{ gridColumn: node.col + 1, gridRow: node.row + 1 }"
          @click="rotateNode(idx)"
        >
          <svg viewBox="0 0 40 40" class="node-svg">
            <line
              v-if="showLine(node, 'top')"
              x1="20" y1="0" x2="20" y2="20"
              class="pipe-line"
              :class="{ 'line-powered': node.powered && hasPowerFrom(node, 'top') }"
            />
            <line
              v-if="showLine(node, 'right')"
              x1="20" y1="20" x2="40" y2="20"
              class="pipe-line"
              :class="{ 'line-powered': node.powered && hasPowerFrom(node, 'right') }"
            />
            <line
              v-if="showLine(node, 'bottom')"
              x1="20" y1="20" x2="20" y2="40"
              class="pipe-line"
              :class="{ 'line-powered': node.powered && hasPowerFrom(node, 'bottom') }"
            />
            <line
              v-if="showLine(node, 'left')"
              x1="0" y1="20" x2="20" y2="20"
              class="pipe-line"
              :class="{ 'line-powered': node.powered && hasPowerFrom(node, 'left') }"
            />
            <circle cx="20" cy="20" r="5" class="node-center" :class="{ 'center-powered': node.powered }" />
          </svg>
        </div>
      </div>

      <div class="target-node">
        <span class="node-label">灯塔主控</span>
      </div>
    </div>

    <div class="power-status" :class="{ 'status-connected': gameWon }">
      <span class="status-dot"></span>
      {{ gameWon ? '信号已接通' : '信号未连通' }}
    </div>

    <div class="game-controls">
      <button class="ctrl-btn" @click="resetLevel">↻ 重置</button>
      <button class="back-btn" @click="abortGame">返回剧情</button>
    </div>

    <div class="tap-hint">点击节点旋转管道方向</div>

    <div v-if="gameWon" class="victory-overlay">
      <div class="victory-card">
        <h2>⚡ 信号恢复！</h2>
        <p>灯塔的主电源线路重新接通了。</p>
        <div class="clue-reveal">"系统自检完成。检测到一段被覆盖的广播录音——日期：三年前的今天。时间：凌晨零点。内容：'[杂音]...协议启动...04号就位...[杂音]'"</div>
        <button class="continue-btn" @click="goBack">继续剧情</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMbtiStore } from '../../stores/mbti'

const router = useRouter()
const mbtiStore = useMbtiStore()

// 管道形状类型: 每种定义四个方向是否有接口
// 0=直管(上下), 1=直管(左右), 2=L型(上右), 3=L型(右下), 4=L型(下左), 5=L型(左上)
// 6=T型(上右下), 7=T型(右下左), 8=T型(下左上), 9=T型(左上右), 10=十字
const SHAPES = [
  { top: true, right: false, bottom: true, left: false },   // 0: |
  { top: false, right: true, bottom: false, left: true },  // 1: -
  { top: true, right: true, bottom: false, left: false },   // 2: └
  { top: false, right: true, bottom: true, left: false },   // 3: ┌
  { top: false, right: false, bottom: true, left: true },   // 4: ┐
  { top: true, right: false, bottom: false, left: true },   // 5: ┘
  { top: true, right: true, bottom: true, left: false },   // 6: ⊥
  { top: false, right: true, bottom: true, left: true },    // 7: ⊢
  { top: true, right: false, bottom: true, left: true },    // 8: ⊣
  { top: true, right: true, bottom: false, left: true },    // 9: ⊤
  { top: true, right: true, bottom: true, left: true }     // 10: +
]

const LEVEL = {
  hint: '旋转节点，让信号从左侧源点流向右侧目标',
  gridSize: 5,
  nodes: [
    { row: 0, col: 0, shapeIdx: 0, isSource: true, fixed: true },
    { row: 1, col: 0, shapeIdx: 4, fixed: false },
    { row: 2, col: 0, shapeIdx: 1, fixed: false },
    { row: 2, col: 1, shapeIdx: 5, fixed: false },
    { row: 2, col: 2, shapeIdx: 3, fixed: false },
    { row: 2, col: 3, shapeIdx: 2, fixed: false },
    { row: 2, col: 4, shapeIdx: 0, fixed: false },
    { row: 1, col: 4, shapeIdx: 6, fixed: false },
    { row: 0, col: 4, shapeIdx: 0, isTarget: true, fixed: true },

    { row: 0, col: 2, shapeIdx: 7, fixed: false },
    { row: 1, col: 2, shapeIdx: 9, fixed: false },
    { row: 3, col: 1, shapeIdx: 8, fixed: false },
    { row: 3, col: 3, shapeIdx: 10, fixed: false }
  ]
}

const nodes = ref([])
const rotations = ref(0)
const gameWon = ref(false)

const levelHint = computed(() => LEVEL.hint)
const totalNodes = computed(() => nodes.value.filter(n => !n.isSource && !n.isTarget).length)
const connectedCount = computed(() => nodes.value.filter(n => n.powered).length)

function initLevel() {
  nodes.value = LEVEL.nodes.map(n => ({
    ...n,
    rotation: 0,
    active: false,
    powered: false,
    connections: { ...SHAPES[n.shapeIdx] }
  }))
  rotations.value = 0
  gameWon.value = false
  calcPower()
}

function getRotatedConnections(shapeIdx, rotation) {
  const base = { ...SHAPES[shapeIdx] }
  const dirs = ['top', 'right', 'bottom', 'left']
  for (let i = 0; i < rotation; i++) {
    const t = base.top
    base.top = base.left
    base.left = base.bottom
    base.bottom = base.right
    base.right = t
  }
  return base
}

function rotateNode(idx) {
  const node = nodes.value[idx]
  if (node.fixed) return

  node.rotation = (node.rotation + 1) % 4
  node.connections = getRotatedConnections(node.shapeIdx, node.rotation)
  rotations.value++

  setTimeout(() => calcPower(), 50)
}

function showLine(node, dir) {
  return node.connections[dir]
}

function hasPowerFrom(node, dir) {
  if (!node.powered) return false
  return node.connections[dir]
}

function getNodeAt(row, col) {
  return nodes.value.find(n => n.row === row && n.col === col)
}

function canConnect(fromNode, toNode, direction) {
  if (!fromNode || !toNode) return false
  if (!fromNode.powered) return false

  const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }
  return fromNode.connections[direction] && toNode.connections[opposite[direction]]
}

function calcPower() {
  nodes.value.forEach(n => { n.powered = false })

  const source = nodes.value.find(n => n.isSource)
  if (source) source.powered = true

  let changed = true
  let iterations = 0
  while (changed && iterations < 20) {
    changed = false
    iterations++

    for (const node of nodes.value) {
      if (!node.powered) continue

      const neighbors = [
        { dr: -1, dc: 0, dir: 'top' },
        { dr: 1, dc: 0, dir: 'bottom' },
        { dr: 0, dc: -1, dir: 'left' },
        { dr: 0, dc: 1, dir: 'right' }
      ]

      for (const { dr, dc, dir } of neighbors) {
        const neighbor = getNodeAt(node.row + dr, node.col + dc)
        if (neighbor && canConnect(node, neighbor, dir) && !neighbor.powered) {
          neighbor.powered = true
          changed = true
        }
      }
    }
  }

  const target = nodes.value.find(n => n.isTarget)
  if (target && target.powered) {
    gameWon.value = true
  }
}

function resetLevel() {
  initLevel()
}

function abortGame() {
  router.back()
}

function goBack() {
  mbtiStore.recordChoice({
    dimensions: ['I', 'N', 'T'],
    specialFlag: 'seeker',
    isHidden: true,
    behaviorTags: ['curious'],
    endingWeight: { truth: 2, secret: 1, zero: 1 }
  })
  const rank = rotations.value <= 8 ? 'S' : rotations.value <= 14 ? 'A' : rotations.value <= 20 ? 'B' : 'C'
  sessionStorage.setItem('gameResult', JSON.stringify({
    success: gameWon.value,
    score: gameWon.value ? Math.max(200, 500 - rotations.value * 15) : rotations.value * 30,
    time: rotations.value + '次旋转',
    rank,
    gameType: 'circuit',
    reward: gameWon.value ? ['truth_fragment', 'secret_fragment'] : [],
    narrative: gameWon.value
      ? '随着最后一根管线对接到位，整个灯塔的应急照明同时亮起。控制台屏幕自动弹出一段被加密的音频文件——播放键在闪烁。'
      : '信号没能完全接通。有些节点始终无法对齐，像是在刻意阻止什么人恢复这座灯塔的功能。'
  }))
  mbtiStore.recordGameResult({ success: gameWon.value, gameType: 'circuit' })
  router.push({ name: 'gameResult', params: { type: 'circuit' } })
}

onMounted(() => {
  initLevel()
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
  max-width: 480px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
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

.level-hint {
  max-width: 480px;
  width: 100%;
  text-align: center;
  color: #8890a8;
  font-size: 0.82rem;
  margin-bottom: 1rem;
  font-style: italic;
}

.circuit-board {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.source-node,
.target-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.6rem 0.8rem;
  border-radius: 4px;
  min-width: 60px;
}

.source-node {
  background: linear-gradient(135deg, rgba(100, 140, 180, 0.1), rgba(80, 120, 160, 0.05));
  border: 1px solid rgba(100, 140, 180, 0.15);
}

.target-node {
  background: linear-gradient(135deg, rgba(180, 150, 100, 0.1), rgba(160, 130, 80, 0.05));
  border: 1px solid rgba(180, 150, 100, 0.15);
}

.node-label {
  font-size: 0.72rem;
  color: #78829a;
  text-align: center;
  letter-spacing: 0.04em;
}

.grid-area {
  display: grid;
  grid-template-columns: repeat(5, 44px);
  grid-template-rows: repeat(5, 44px);
  gap: 4px;
  background: rgba(120, 125, 155, 0.04);
  border: 1px solid rgba(120, 125, 155, 0.08);
  padding: 8px;
  border-radius: 4px;
  position: relative;
}

.circuit-node {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(120, 125, 155, 0.08);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
}

.circuit-node:hover:not(.node-fixed) {
  background: rgba(140, 145, 180, 0.06);
  border-color: rgba(140, 145, 180, 0.18);
  transform: scale(1.05);
}

.circuit-node.node-source {
  background: rgba(100, 140, 180, 0.1);
  border-color: rgba(100, 140, 180, 0.25);
  cursor: default;
}

.circuit-node.node-target {
  background: rgba(180, 150, 100, 0.1);
  border-color: rgba(180, 150, 100, 0.25);
  cursor: default;
}

.circuit-node.node-powered {
  box-shadow: 0 0 12px rgba(180, 160, 100, 0.15);
}

.node-svg {
  width: 36px;
  height: 36px;
  overflow: visible;
}

.pipe-line {
  stroke: rgba(120, 125, 155, 0.3);
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke 0.3s ease;
}

.line-powered {
  stroke: rgba(196, 168, 120, 0.7);
  filter: drop-shadow(0 0 3px rgba(196, 168, 120, 0.4));
}

.node-center {
  fill: rgba(120, 125, 155, 0.15);
  transition: fill 0.3s ease;
}

.center-powered {
  fill: rgba(196, 168, 120, 0.5);
}

.power-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.2rem;
  background: rgba(120, 100, 100, 0.06);
  border: 1px solid rgba(120, 100, 100, 0.1);
  border-radius: 20px;
  font-size: 0.8rem;
  color: #886868;
  margin-bottom: 1rem;
  transition: all 0.4s ease;
}

.status-connected {
  background: rgba(120, 180, 120, 0.06);
  border-color: rgba(120, 180, 120, 0.2);
  color: #88a888;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #886868;
  transition: background 0.4s ease;
}

.status-connected .status-dot {
  background: #98c498;
  box-shadow: 0 0 6px rgba(152, 196, 152, 0.5);
}

.game-controls {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
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

.tap-hint {
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
  max-width: 400px;
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
  font-size: 0.84rem;
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
