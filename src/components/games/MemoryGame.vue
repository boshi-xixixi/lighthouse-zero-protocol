<template>
  <div class="game-container">
    <div class="game-header">
      <h2 class="game-title">📁 档案配对</h2>
      <div class="game-stats">
        <span class="stat">翻牌: {{ flips }}/24</span>
        <span class="stat">配对: {{ matchedPairs }}/8</span>
      </div>
    </div>

    <div class="memory-board">
      <div 
        v-for="(card, index) in cards" 
        :key="index"
        class="card"
        :class="{ 
          flipped: card.flipped || card.matched,
          matched: card.matched,
          disabled: card.matched || (selectedCards.length === 2)
        }"
        @click="handleCardClick(index)"
      >
        <div class="card-inner">
          <div class="card-front">❓</div>
          <div class="card-back">{{ card.icon }}</div>
        </div>
      </div>
    </div>

    <div class="game-controls">
      <button class="back-btn" @click="abortGame">返回剧情</button>
    </div>

    <div v-if="gameWon" class="victory-overlay">
      <div class="victory-card">
        <h2>✨ 真相浮现！</h2>
        <p>你发现了关键线索：</p>
        <div class="clue-reveal">"记者那份档案有额外的手写笔记"</div>
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

const CARD_PAIRS = [
  { icon: '👔', label: '律师证词' },
  { icon: '🚢', label: '船舱记录' },
  { icon: '🩺', label: '护士记忆' },
  { icon: '✂️', label: '被划掉的名字' },
  { icon: '📋', label: '登船名单' },
  { icon: '⚖️', label: '律师撒谎' },
  { icon: '💊', label: '医药箱清单' },
  { icon: '📻', label: '电台信号' }
]

const MAX_FLIPS = 24

const cards = ref([])
const selectedCards = ref([])
const flips = ref(0)
const matchedPairs = ref(0)
const gameWon = ref(false)

onMounted(() => {
  initCards()
})

function initCards() {
  const cardList = []
  CARD_PAIRS.forEach((pair, index) => {
    cardList.push({ ...pair, id: index, flipped: false, matched: false })
    cardList.push({ ...pair, id: index, flipped: false, matched: false })
  })
  cards.value = shuffleArray(cardList)
}

function shuffleArray(arr) {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function handleCardClick(index) {
  if (gameWon.value) return
  if (cards.value[index].matched || cards.value[index].flipped) return
  if (selectedCards.value.length >= 2) return

  cards.value[index].flipped = true
  selectedCards.value.push(index)

  if (selectedCards.value.length === 2) {
    flips.value++
    checkMatch()
  }
}

function checkMatch() {
  const [idx1, idx2] = selectedCards.value
  const card1 = cards.value[idx1]
  const card2 = cards.value[idx2]

  if (card1.id === card2.id) {
    card1.matched = true
    card2.matched = true
    matchedPairs.value++
    selectedCards.value = []

    if (matchedPairs.value === CARD_PAIRS.length) {
      gameWon.value = true
    }
  } else {
    setTimeout(() => {
      card1.flipped = false
      card2.flipped = false
      selectedCards.value = []
    }, 1000)
  }
}

function goBack() {
  mbtiStore.recordChoice({
    dimensions: ['I', 'N', 'F'],
    specialFlag: 'puzzle',
    isHidden: true,
    behaviorTags: ['curious'],
    endingWeight: { truth: 1 }
  })
  const rank = flips.value <= 16 ? 'S' : flips.value <= 20 ? 'A' : flips.value <= 24 ? 'B' : 'C'
  sessionStorage.setItem('gameResult', JSON.stringify({
    success: true,
    score: matchedPairs.value * 125,
    time: flips.value + '次翻牌',
    rank,
    gameType: 'memory',
    reward: ['truth_fragment'],
    narrative: '四份档案的内容在你脑中拼合完整。记者那份档案末尾的手写笔记写着："他们说的真相，只有一半……剩下的，在广播里。"'
  }))
  mbtiStore.recordGameResult({ success: true, gameType: 'memory' })
  router.push({ name: 'gameResult', params: { type: 'memory' } })
}

function abortGame() {
  router.back()
}
</script>

<style scoped>
.game-container {
  min-height: 100vh;
  width: 100vw;
  overflow-y: auto;
  overflow-x: hidden;
  background: linear-gradient(160deg, #06070c 0%, #0b0d14 40%, #080a10 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  color: #c0c4cc;
  user-select: none;
  box-sizing: border-box;
}

.game-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 30%, rgba(251, 191, 36, 0.08) 0%, transparent 60%);
  pointer-events: none;
}

.game-header {
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  z-index: 10;
}

.game-title {
  color: #fbbf24;
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

.memory-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  width: 100%;
  max-width: 360px;
  margin: 0 auto 2rem;
  position: relative;
  z-index: 10;
}

.card {
  width: 100%;
  aspect-ratio: 1;
  perspective: 1000px;
  cursor: pointer;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.card.flipped .card-inner {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  box-sizing: border-box;
}

.card-front {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.12));
  border: 2px solid rgba(251, 191, 36, 0.4);
}

.card-back {
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.15);
  transform: rotateY(180deg);
}

.card.matched .card-back {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

.card.disabled {
  cursor: default;
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
  border: 2px solid rgba(251, 191, 36, 0.3);
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
  color: #fbbf24;
  font-size: 2rem;
  margin: 0 0 1rem;
}

.victory-card p {
  color: #94a3b8;
  font-size: 1.1rem;
  margin: 0 0 1.5rem;
}

.clue-reveal {
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 12px;
  padding: 1rem;
  color: #fbbf24;
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.continue-btn {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
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
  box-shadow: 0 10px 30px rgba(251, 191, 36, 0.4);
}
</style>
