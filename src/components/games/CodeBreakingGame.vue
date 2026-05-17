<template>
  <div class="game-container">
    <div class="game-header">
      <h2 class="game-title">📡 终局密钥</h2>
      <div class="game-stats">
        <span class="stat">尝试: {{ attempts }}/8</span>
        <span class="stat" v-if="hint">提示: {{ hint }}</span>
      </div>
    </div>

    <div class="game-instructions">
      <p>输入4位数字密码，系统会提示：</p>
      <p class="rule">xA = 数字正确且位置正确</p>
      <p class="rule">xB = 数字正确但位置错误</p>
    </div>

    <div class="input-section">
      <div class="digit-inputs">
        <input 
          v-for="n in 4" 
          :key="n"
          type="text" 
          maxlength="1"
          class="digit-input"
          v-model="currentGuess[n-1]"
          @input="handleInput($event, n-1)"
          @keydown="handleKeydown($event, n-1)"
        >
      </div>
      <button class="guess-btn" @click="makeGuess" :disabled="!canGuess">
        破解
      </button>
    </div>

    <div class="history-section">
      <h3>破解记录</h3>
      <div class="history-list">
        <div v-for="(item, index) in history" :key="index" class="history-item">
          <span class="guess-number">{{ item.guess }}</span>
          <span class="result">{{ item.result }}</span>
        </div>
      </div>
    </div>

    <div class="game-controls">
      <button class="hint-btn" @click="useHint" :disabled="usedHint">💡 使用提示</button>
      <button class="back-btn" @click="abortGame">返回剧情</button>
    </div>

    <div v-if="gameWon" class="victory-overlay">
      <div class="victory-card">
        <h2>🎉 密码破解成功！</h2>
        <p>你打开了通往真相的大门</p>
        <div class="clue-reveal">"广播控制码已获取——可以覆盖灯塔的原始信号"</div>
        <button class="continue-btn" @click="goBack">继续剧情</button>
      </div>
    </div>

    <div v-if="gameLost" class="failure-overlay">
      <div class="failure-card">
        <h2>😔 破解失败</h2>
        <p>密码是: {{ secretCode.join('') }}</p>
        <button class="continue-btn" @click="goBack">继续剧情</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMbtiStore } from '../../stores/mbti'

const router = useRouter()
const mbtiStore = useMbtiStore()

const MAX_ATTEMPTS = 8
const CODE_LENGTH = 4

const secretCode = ref([])
const currentGuess = ref(['', '', '', ''])
const history = ref([])
const attempts = ref(0)
const gameWon = ref(false)
const gameLost = ref(false)
const usedHint = ref(false)
const hint = ref('')

onMounted(() => {
  generateCode()
})

function generateCode() {
  const code = []
  for (let i = 0; i < CODE_LENGTH; i++) {
    code.push(Math.floor(Math.random() * 10))
  }
  secretCode.value = code
}

const canGuess = computed(() => {
  return currentGuess.value.every(d => d !== '' && d >= '0' && d <= '9')
})

function handleInput(event, index) {
  const value = event.target.value
  if (value && index < 3) {
    const nextInput = event.target.parentElement.children[index + 1]
    if (nextInput) nextInput.focus()
  }
}

function handleKeydown(event, index) {
  if (event.key === 'Backspace' && !currentGuess.value[index] && index > 0) {
    const prevInput = event.target.parentElement.children[index - 1]
    if (prevInput) prevInput.focus()
  }
  if (event.key === 'Enter' && canGuess.value) {
    makeGuess()
  }
}

function makeGuess() {
  if (!canGuess.value || gameWon.value || gameLost.value) return

  const guess = currentGuess.value.map(d => parseInt(d))
  const result = calculateResult(guess)
  
  history.value.unshift({
    guess: guess.join(''),
    result: `${result.a}A${result.b}B`
  })
  attempts.value++

  if (result.a === CODE_LENGTH) {
    gameWon.value = true
  } else if (attempts.value >= MAX_ATTEMPTS) {
    gameLost.value = true
  }

  currentGuess.value = ['', '', '', '']
}

function calculateResult(guess) {
  let a = 0
  let b = 0

  for (let i = 0; i < CODE_LENGTH; i++) {
    if (guess[i] === secretCode.value[i]) {
      a++
    } else if (secretCode.value.includes(guess[i])) {
      b++
    }
  }

  return { a, b }
}

function useHint() {
  if (usedHint.value || gameWon.value || gameLost.value) return
  usedHint.value = true
  hint.value = `密码包含数字: ${secretCode.value.slice(0, 2).join(', ')} 和另外两个数字`
}

function goBack() {
  mbtiStore.recordChoice({
    dimensions: ['I', 'T', 'J'],
    specialFlag: 'truth',
    isHidden: true,
    behaviorTags: ['aggressive'],
    endingWeight: { truth: 2, zero: 1 }
  })
  const rank = attempts.value <= 3 ? 'S' : attempts.value <= 5 ? 'A' : attempts.value <= 7 ? 'B' : 'C'
  sessionStorage.setItem('gameResult', JSON.stringify({
    success: gameWon.value,
    score: gameWon.value ? (MAX_ATTEMPTS - attempts.value) * 125 + 500 : attempts.value * 50,
    time: attempts.value + '次尝试',
    rank,
    gameType: 'code',
    reward: gameWon.value ? ['truth_fragment', 'zero_fragment'] : [],
    narrative: gameWon.value
      ? '广播系统的控制界面亮起，你输入控制码的那一刻，整个灯塔的灯光闪烁了一下——有什么东西被唤醒了。'
      : '控制码错误。屏幕上闪过一行红字："访问拒绝。04号观察者权限不足。"'
  }))
  mbtiStore.recordGameResult({ success: gameWon.value, gameType: 'code' })
  router.push({ name: 'gameResult', params: { type: 'code' } })
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
  background: radial-gradient(ellipse at 50% 30%, rgba(236, 72, 153, 0.08) 0%, transparent 60%);
  pointer-events: none;
}

.game-header {
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  z-index: 10;
}

.game-title {
  color: #ec4899;
  font-size: 1.8rem;
  margin: 0 0 1rem;
}

.game-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.stat {
  color: #94a3b8;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.game-instructions {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 1.5rem;
  max-width: 500px;
  margin: 0 auto 2rem;
  text-align: center;
  position: relative;
  z-index: 10;
}

.game-instructions p {
  color: #cbd5e1;
  margin: 0.5rem 0;
  font-size: 0.95rem;
}

.rule {
  color: #a78bfa !important;
  font-weight: 600;
}

.input-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  position: relative;
  z-index: 10;
}

.digit-inputs {
  display: flex;
  gap: 12px;
}

.digit-input {
  width: 60px;
  height: 70px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(236, 72, 153, 0.3);
  border-radius: 12px;
  color: #e2e8f0;
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  outline: none;
  transition: all 0.3s ease;
}

.digit-input:focus {
  border-color: #ec4899;
  box-shadow: 0 0 20px rgba(236, 72, 153, 0.3);
}

.guess-btn {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #ec4899, #db2777);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.guess-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(236, 72, 153, 0.4);
}

.guess-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.history-section {
  max-width: 500px;
  margin: 0 auto 2rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 1.5rem;
  position: relative;
  z-index: 10;
}

.history-section h3 {
  color: #e2e8f0;
  font-size: 1.1rem;
  margin: 0 0 1rem;
  text-align: center;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  animation: slide-in 0.3s ease;
}

@keyframes slide-in {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

.guess-number {
  color: #e2e8f0;
  font-family: monospace;
  font-size: 1.2rem;
  font-weight: 600;
}

.result {
  color: #fbbf24;
  font-weight: 700;
  font-size: 1.1rem;
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

.hint-btn:hover:not(:disabled) {
  background: rgba(251, 191, 36, 0.3);
}

.hint-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.back-btn {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.victory-overlay, .failure-overlay {
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

.victory-card, .failure-card {
  background: linear-gradient(160deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 24px;
  padding: 3rem 2.5rem;
  text-align: center;
  max-width: 400px;
  animation: scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.victory-card {
  border: 2px solid rgba(34, 197, 94, 0.3);
}

.failure-card {
  border: 2px solid rgba(239, 68, 68, 0.3);
}

@keyframes scale-in {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.victory-card h2 {
  color: #22c55e;
  font-size: 2rem;
  margin: 0 0 1rem;
}

.failure-card h2 {
  color: #ef4444;
  font-size: 2rem;
  margin: 0 0 1rem;
}

.victory-card p, .failure-card p {
  color: #94a3b8;
  font-size: 1.1rem;
  margin: 0 0 1.5rem;
}

.clue-reveal {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  padding: 1rem;
  color: #22c55e;
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.continue-btn {
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.victory-card .continue-btn {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.failure-card .continue-btn {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.continue-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}
</style>
