<template>
  <div class="result-container" :class="['ending-' + ending?.type]" :style="colorStyleVars">
    <div class="bg-canvas" :class="{ 'secret-bg': ending?.type === 'secret' || ending?.type === 'zero' }">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
      <div v-if="ending?.type === 'bad' || ending?.type === 'backfire'" class="fog-overlay"></div>
    </div>

    <div class="content" :class="{ revealed: isRevealed, 'fun-mode': isFunMode, ['ending-content-' + ending?.type]: ending }">

      <!-- 揭开谜底阶段 -->
      <div v-if="!isRevealed" class="reveal-phase">
        <div class="mystic-orb">
          <!-- 核心光晕 -->
          <div class="orb-core">
            <div class="core-inner">
              <span class="core-symbol">◈</span>
            </div>
            <div class="core-glow"></div>
            <div class="core-pulse"></div>
          </div>

          <!-- 旋转轨道环 -->
          <div class="orbit-ring orbit-1">
            <div class="orbit-dot dot-1"></div>
            <div class="orbit-dot dot-2"></div>
            <div class="orbit-dot dot-3"></div>
          </div>

          <div class="orbit-ring orbit-2">
            <div class="orbit-dash dash-1"></div>
            <div class="orbit-dash dash-2"></div>
            <div class="orbit-dash dash-3"></div>
            <div class="orbit-dash dash-4"></div>
          </div>

          <div class="orbit-ring orbit-3">
            <span class="ring-rune rune-1">✦</span>
            <span class="ring-rune rune-2">◇</span>
            <span class="ring-rune rune-3">✧</span>
          </div>

          <!-- 外层装饰环 -->
          <div class="outer-ring ring-a"></div>
          <div class="outer-ring ring-b"></div>
          <div class="outer-ring ring-c"></div>

          <!-- 光线效果 -->
          <div class="light-ray ray-1"></div>
          <div class="light-ray ray-2"></div>
          <div class="light-ray ray-3"></div>
          <div class="light-ray ray-4"></div>

          <!-- 漂浮粒子 -->
          <div class="float-particle p-1"></div>
          <div class="float-particle p-2"></div>
          <div class="float-particle p-3"></div>
          <div class="float-particle p-4"></div>
          <div class="float-particle p-5"></div>
          <div class="float-particle p-6"></div>
        </div>
        <h2 class="reveal-title">真相即将揭晓</h2>
        <p class="reveal-subtitle">你在旅途中的每一个选择，都指向一个答案</p>
        <button class="reveal-btn" @click="revealResult">
          <span>揭开谜底</span>
        </button>
      </div>

      <!-- 结局剧情展示 -->
      <div v-else-if="!showMBTI" class="story-phase">

        <!-- 结局标题卡片 -->
        <div class="ending-header-card" :class="'header-' + ending?.type">
          <div class="header-glow"></div>
          <div class="header-top-line"></div>

          <div class="ending-badge">
            <span class="badge-icon">{{ endingInfo?.icon }}</span>
            <span class="badge-text">{{ endingInfo?.title }}</span>
          </div>

          <h1 class="ending-name">{{ endingInfo?.name }}</h1>
          <p class="ending-subtitle">{{ endingInfo?.subtitle }}</p>

          <div class="header-divider">
            <span></span>
            <span class="divider-diamond">◆</span>
            <span></span>
          </div>
        </div>

        <!-- 剧情正文 -->
        <div class="story-narrative">
          <div
            v-for="(paragraph, idx) in storyParagraphs"
            :key="idx"
            class="story-paragraph"
            :style="{ animationDelay: (idx * 0.15) + 's' }"
          >
            <span class="paragraph-marker"></span>
            <p>{{ paragraph }}</p>
          </div>
        </div>

        <!-- 核心引用 -->
        <blockquote class="story-quote" :class="'quote-' + ending?.type">
          {{ endingText?.quote }}
        </blockquote>

        <!-- 操作按钮 -->
        <div class="story-actions">
          <button class="action-btn primary-action" @click="showMBTIResult">
            <span class="btn-icon-left"></span>
            <span>查看你的MBTI人格</span>
            <span class="btn-icon-right"></span>
          </button>
          <button class="action-btn secondary-action" @click="restartGame">
            <span class="btn-icon-left alt-icon"></span>
            <span>重新探索</span>
          </button>
        </div>

        <p class="story-hint">
          {{ endingHint }}
        </p>
      </div>

      <!-- MBTI 人格结果展示 -->
      <div v-else class="mbti-phase">

        <!-- 返回按钮 -->
        <button class="back-to-story-btn" @click="showMBTI = false">
          <span class="back-icon">←</span>
          <span>返回结局剧情</span>
        </button>

        <!-- 行为侧写面板（新增） -->
        <div v-if="behaviorAnalysis" class="behavior-panel">
          <div class="behavior-header">
            <span class="behavior-icon">◇</span>
            <h3 class="behavior-title">行为侧写</h3>
          </div>

          <p class="behavior-profile-text">{{ behaviorAnalysis.profileText }}</p>

          <div v-if="behaviorAnalysis.traits && behaviorAnalysis.traits.length" class="behavior-traits">
            <span
              v-for="(trait, idx) in behaviorAnalysis.traits"
              :key="idx"
              class="behavior-trait-tag"
            >{{ trait }}</span>
          </div>

          <div v-if="behaviorAnalysis.relationSummary" class="npc-relation-summary">
            <span class="relation-label">NPC 关系：</span>
            <span
              v-for="(status, npc) in behaviorAnalysis.relationSummary"
              :key="npc"
              class="relation-item"
              :class="'relation-' + status"
            >{{ npcNameMap[npc] || npc }}({{ status === '信任' ? '↑' : status === '警惕' ? '↓' : '－' }})</span>
          </div>
        </div>

        <!-- BAD/BACKFIRE END -->
        <div v-if="ending?.type === 'bad' || ending?.type === 'backfire'" class="bad-ending-panel">
          <div class="bad-icon"></div>
          <h1 class="bad-title">{{ mbtiType }} · {{ typeInfo.name }}</h1>
          <p class="bad-description">{{ typeInfo.description }}</p>

          <div class="strengths-section">
            <h4>灵魂特质</h4>
            <div class="traits-grid">
              <div
                v-for="(trait, idx) in typeInfo.strengths"
                :key="trait"
                class="trait-item"
                :style="{ animationDelay: (idx * 0.1) + 's' }"
              >
                <span class="trait-dot"></span>
                <span>{{ trait }}</span>
              </div>
            </div>
          </div>

          <blockquote class="soul-quote">
            {{ typeInfo.quote }}
          </blockquote>

          <div class="dimensions-panel">
            <h3 class="panel-title">
              <span class="title-icon"></span>
              灵魂维度
            </h3>
            <div class="dimension-bars">
              <div
                v-for="(dim, key) in dimensionDetails"
                :key="key"
                class="dimension-item"
              >
                <div class="dim-header">
                  <span class="dim-label">{{ dim.label }}</span>
                  <span class="dim-result">{{ getDimWinner(dim) }}</span>
                </div>
                <div class="dim-bar">
                  <div
                    class="dim-fill left"
                    :style="{ width: getLeftPercent(dim) + '%' }"
                  ></div>
                  <div class="dim-center"></div>
                  <div
                    class="dim-fill right"
                    :style="{ width: getRightPercent(dim) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div class="actions">
            <button class="action-btn primary" @click="shareResult">
              <span class="btn-icon"></span>
              <span>分享你的身份</span>
            </button>
            <button class="action-btn secondary" @click="restartGame">
              <span class="btn-icon"></span>
              <span>重新探索</span>
            </button>
          </div>
        </div>

        <!-- TRUE/TRUTH END -->
        <div v-else-if="ending?.type === 'true' || ending?.type === 'truth'" class="true-ending-panel">
          <div class="crown-badge"></div>

          <div class="identity-card true-card">
            <div class="card-glow golden-glow"></div>
            <div class="card-top-line"></div>
            <div class="card-bottom-line"></div>

            <div class="personality-image-container">
              <img :src="personalityImage" :alt="typeInfo.name" class="personality-image">
              <div class="image-frame"></div>
            </div>

            <div class="identity-meta">
              <span class="element-badge golden-badge">{{ typeInfo.element }}</span>
              <span class="origin-code">{{ mbtiType }}</span>
            </div>

            <h1 class="identity-name golden-name">{{ typeInfo.name }}</h1>
            <p class="identity-title golden-title">{{ typeInfo.title }}</p>

            <div class="identity-divider golden-divider">
              <span></span>
              <span class="divider-icon"></span>
              <span></span>
            </div>

            <p class="identity-desc">{{ typeInfo.description }}</p>

            <div class="strengths-section">
              <h4>灵魂特质</h4>
              <div class="traits-grid">
                <div
                  v-for="(trait, idx) in typeInfo.strengths"
                  :key="trait"
                  class="trait-item golden-trait"
                  :style="{ animationDelay: (idx * 0.1) + 's' }"
                >
                  <span class="trait-dot golden-dot"></span>
                  <span>{{ trait }}</span>
                </div>
              </div>
            </div>

            <blockquote class="soul-quote golden-quote">
              {{ typeInfo.quote }}
            </blockquote>
          </div>

          <div class="dimensions-panel golden-dimensions">
            <h3 class="panel-title">
              <span class="title-icon"></span>
              灵魂维度
            </h3>
            <div class="dimension-bars">
              <div
                v-for="(dim, key) in dimensionDetails"
                :key="key"
                class="dimension-item"
              >
                <div class="dim-header">
                  <span class="dim-label">{{ dim.label }}</span>
                  <span class="dim-result golden-result">{{ getDimWinner(dim) }}</span>
                </div>
                <div class="dim-bar">
                  <div
                    class="dim-fill left golden-fill-left"
                    :style="{ width: getLeftPercent(dim) + '%' }"
                  ></div>
                  <div class="dim-center"></div>
                  <div
                    class="dim-fill right golden-fill-right"
                    :style="{ width: getRightPercent(dim) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div class="actions">
            <button class="action-btn primary golden-primary" @click="shareResult">
              <span class="btn-icon"></span>
              <span>分享你的身份</span>
            </button>
            <button class="action-btn secondary" @click="restartGame">
              <span class="btn-icon"></span>
              <span>重新探索</span>
            </button>
          </div>
        </div>

        <!-- SECRET/ZERO END -->
        <div v-else-if="ending?.type === 'secret' || ending?.type === 'zero'" class="secret-ending-panel">
          <div class="secret-badge">稀有成就</div>

          <div class="identity-card secret-card">
            <div class="card-glow rainbow-glow"></div>
            <div class="card-top-line secret-top-line"></div>
            <div class="card-bottom-line secret-bottom-line"></div>

            <div class="personality-image-container secret-image-container">
              <img :src="personalityImage" :alt="ending.name || typeInfo.name" class="personality-image">
              <div class="image-frame secret-frame"></div>
            </div>

            <div class="identity-meta">
              <span class="element-badge secret-badge-element">{{ ending.secretVariant || '觉醒者' }}</span>
              <span class="origin-code secret-code">{{ mbtiType }}</span>
            </div>

            <h1 class="identity-name secret-name">{{ ending.name || typeInfo.name }}</h1>
            <p class="identity-title secret-title">{{ ending.subtitle || typeInfo.title }}</p>

            <div class="identity-divider secret-divider">
              <span></span>
              <span class="divider-icon"></span>
              <span></span>
            </div>

            <p class="identity-desc secret-main-text">{{ ending.description }}</p>
            <p class="identity-desc secret-sub-text">{{ typeInfo.description }}</p>

            <div class="strengths-section">
              <h4>独特能力</h4>
              <div class="traits-grid">
                <div
                  v-for="(trait, idx) in typeInfo.strengths"
                  :key="trait"
                  class="trait-item secret-trait"
                  :style="{ animationDelay: (idx * 0.08) + 's' }"
                >
                  <span class="trait-dot secret-dot"></span>
                  <span>{{ trait }}</span>
                </div>
              </div>
            </div>

            <blockquote class="soul-quote secret-quote">
              {{ typeInfo.quote }}
            </blockquote>
          </div>

          <div class="dimensions-panel secret-dimensions">
            <h3 class="panel-title">
              <span class="title-icon"></span>
              维度解析
            </h3>
            <div class="dimension-bars">
              <div
                v-for="(dim, key) in dimensionDetails"
                :key="key"
                class="dimension-item"
              >
                <div class="dim-header">
                  <span class="dim-label">{{ dim.label }}</span>
                  <span class="dim-result secret-result">{{ getDimWinner(dim) }}</span>
                </div>
                <div class="dim-bar">
                  <div
                    class="dim-fill left secret-fill-left"
                    :style="{ width: getLeftPercent(dim) + '%' }"
                  ></div>
                  <div class="dim-center"></div>
                  <div
                    class="dim-fill right secret-fill-right"
                    :style="{ width: getRightPercent(dim) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div class="actions">
            <button class="action-btn primary secret-primary" @click="shareResult">
              <span class="btn-icon"></span>
              <span>分享隐藏真相</span>
            </button>
            <button class="action-btn secondary" @click="restartGame">
              <span class="btn-icon"></span>
              <span>再次探索</span>
            </button>
          </div>
        </div>

        <!-- NORMAL/ESCAPE END -->
        <div v-else class="normal-ending-panel">
          <div class="identity-card">
            <div class="card-glow"></div>
            <div class="card-top-line"></div>
            <div class="card-bottom-line"></div>

            <div class="personality-image-container">
              <img :src="personalityImage" :alt="typeInfo.name" class="personality-image">
              <div class="image-frame"></div>
            </div>

            <div class="identity-meta">
              <span class="element-badge">{{ typeInfo.element }}</span>
              <span class="origin-code">{{ mbtiType }}</span>
            </div>

            <h1 class="identity-name">{{ typeInfo.name }}</h1>
            <p class="identity-title">{{ typeInfo.title }}</p>

            <div class="identity-divider">
              <span></span>
              <span class="divider-icon"></span>
              <span></span>
            </div>

            <p class="identity-desc">{{ typeInfo.description }}</p>

            <div class="strengths-section">
              <h4>灵魂特质</h4>
              <div class="traits-grid">
                <div
                  v-for="(trait, idx) in typeInfo.strengths"
                  :key="trait"
                  class="trait-item"
                  :style="{ animationDelay: (idx * 0.1) + 's' }"
                >
                  <span class="trait-dot"></span>
                  <span>{{ trait }}</span>
                </div>
              </div>
            </div>

            <blockquote class="soul-quote">
              {{ typeInfo.quote }}
            </blockquote>
          </div>

          <div class="dimensions-panel">
            <h3 class="panel-title">
              <span class="title-icon"></span>
              灵魂维度
            </h3>
            <div class="dimension-bars">
              <div
                v-for="(dim, key) in dimensionDetails"
                :key="key"
                class="dimension-item"
              >
                <div class="dim-header">
                  <span class="dim-label">{{ dim.label }}</span>
                  <span class="dim-result">{{ getDimWinner(dim) }}</span>
                </div>
                <div class="dim-bar">
                  <div
                    class="dim-fill left"
                    :style="{ width: getLeftPercent(dim) + '%' }"
                  ></div>
                  <div class="dim-center"></div>
                  <div
                    class="dim-fill right"
                    :style="{ width: getRightPercent(dim) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div class="actions">
            <button class="action-btn primary" @click="shareResult">
              <span class="btn-icon"></span>
              <span>分享你的身份</span>
            </button>
            <button class="action-btn secondary" @click="restartGame">
              <span class="btn-icon"></span>
              <span>重新探索</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <ModalComponent
      v-model:visible="modalState.visible"
      :type="modalState.type"
      :title="modalState.title"
      :message="modalState.message"
      :confirm-text="modalState.confirmText"
      @confirm="confirmModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMbtiStore } from '../stores/mbti'
import { mbtiDescriptions, sbtiDescriptions } from '../data/gameData'
import { calculateEnding, getEndingText, ENDING_TYPES, ENDING_INFO } from '../utils/endingCalculator'
import { useTTS } from '../utils/tts'
import ModalComponent from '../components/ModalComponent.vue'
import { useModal } from '../composables/useModal'

const router = useRouter()
const mbtiStore = useMbtiStore()
const tts = useTTS()
const { modalState, showModal, confirmModal } = useModal()
const isRevealed = ref(false)
const showMBTI = ref(false)
const ending = ref(null)
const endingText = ref(null)

const mbtiType = computed(() => mbtiStore.mbtiType)
const dimensionDetails = computed(() => mbtiStore.dimensionDetails)
const isFunMode = computed(() => mbtiStore.gameMode === 'fun')

const colorScheme = computed(() => {
  const descriptions = isFunMode.value ? sbtiDescriptions : mbtiDescriptions
  return descriptions[mbtiType.value]?.colorScheme || null
})

const colorStyleVars = computed(() => {
  if (!colorScheme.value) return {}
  const cs = colorScheme.value
  return {
    '--mbti-primary': cs.primary,
    '--mbti-secondary': cs.secondary,
    '--mbti-accent': cs.accent,
    '--mbti-background': cs.background,
    '--mbti-gradient': cs.gradient,
    '--mbti-text': cs.text,
    '--mbti-glow': cs.glow
  }
})

const behaviorAnalysis = computed(() => ending.value?.behaviorAnalysis || null)

const behaviorLabelMap = {
  cooperative: '合作倾向',
  deceptive: '策略隐蔽',
  cautious: '谨慎周全',
  aggressive: '正面突破',
  curious: '探索欲强',
  protective: '守护他人'
}

const npcNameMap = {
  lawyer: '律师',
  nurse: '护士',
  reporter: '记者'
}

const typeInfo = computed(() => {
  const descriptions = isFunMode.value ? sbtiDescriptions : mbtiDescriptions
  return descriptions[mbtiType.value] || {
    name: '神秘旅人',
    title: '独特的存在',
    element: '虚空之黑',
    description: '你是独一无二的个体，无法被简单的标签定义。在这场博弈中，你的身份仍在形成之中...',
    strengths: ['独特性', '神秘感', '不可预测', '无限可能'],
    quote: '"我就是我，无需被定义。"'
  }
})

const personalityImage = computed(() => {
  return new URL(`../image/${mbtiType.value}.jpg`, import.meta.url).href
})

const endingInfo = computed(() => {
  if (!ending.value) return null
  return ENDING_INFO[ending.value.type] || ENDING_INFO[ENDING_TYPES.ESCAPE_END]
})

const storyParagraphs = computed(() => {
  if (!ending.value) return []

  const stories = {
    [ENDING_TYPES.TRUTH_END]: [
      `你选择了公开所有证据。灯塔的广播系统传出你的声音——沉船案的真相，终于大白于天下。`,
      `律师沉默了。护士捂着脸哭了。记者开始疯狂记录每一个细节。`,
      `铁门缓缓打开，海风夹杂着雨丝扑面而来。但你知道，走出这座灯塔，你要面对的不只是自由。`,
      `那些不想让真相曝光的人，正在外面等着你。但你已经不在乎了。`,
      `你回头看了一眼那座在暴雨中若隐若现的灯塔。零点已过，真相永存。`
    ],
    [ENDING_TYPES.ESCAPE_END]: [
      `你选择了自保。当其他人还在争论谁该相信谁时，你已经找到了出口的钥匙。`,
      `铁门在你身后重重关上，将争吵、谎言、真相，都关在了那座废弃的灯塔里。`,
      `海浪拍打着礁石，冰冷的海水漫过你的脚踝。你深吸了一口气——你还活着。`,
      `但每当夜深人静，你总会想起灯塔里的三个人。他们怎么样了？真相到底是什么？`,
      `你永远不会知道答案。而这，或许就是独自逃生的代价。`
    ],
    [ENDING_TYPES.BACKFIRE_END]: [
      `你的选择引发了连锁反应。信任在一瞬间崩塌，所有人都在互相指责。`,
      `"是你！是你出卖了我们！"律师的声音在空旷的灯塔里回荡。`,
      `广播系统突然失控，刺耳的杂音充斥着每一寸空间。红灯开始闪烁。`,
      `铁门从外面锁死了。电子音冷冷地响起："检测到协议违反。所有出口已封锁。"`,
      `暴雨仍在继续，而零点协议的倒计时……才刚刚开始。`
    ],
    [ENDING_TYPES.ZERO_END]: [
      `你触发了零点协议。灯塔的广播系统突然切换到一个陌生的频率。`,
      `一个没有感情的机械声响起："欢迎，04号观察者。你通过了所有测试。恭喜。"` ,
      `主屏幕上弹出一段被加密的文件——沉船案的完整真相，以及这场"游戏"的真正目的。`,
      `你不是幸存者。你从来都不是。你是被选中的人。`,
      `而现在，站在真相面前，你必须做出最后一个抉择。`
    ]
  }

  return stories[ending.value.type] || stories[ENDING_TYPES.ESCAPE_END]
})

const endingHint = computed(() => {
  if (!ending.value) return ''

  const hints = {
    [ENDING_TYPES.TRUTH_END]: '🔍 想知道你在这次博弈中展现出怎样的人格特质？点击上方按钮查看',
    [ENDING_TYPES.ESCAPE_END]: '🚪 活着离开固然重要，但你的选择也揭示了真实的自己',
    [ENDING_TYPES.BACKFIRE_END]: '⚠️ 每个选择都有代价。了解你的决策模式，或许下次能改变结局',
    [ENDING_TYPES.ZERO_END]: '◈ 稀有达成！你在这次博弈中展现出了超越常人的洞察力'
  }

  return hints[ending.value.type] || ''
})

onMounted(() => {
  window.scrollTo(0, 0)

  ending.value = calculateEnding({
    choices: mbtiStore.choices,
    specialFlags: mbtiStore.specialFlags,
    hiddenOptionsFound: mbtiStore.hiddenOptionsFound,
    endingWeights: mbtiStore.endingWeights
  })

  endingText.value = getEndingText(ending.value.type, mbtiType.value)

  tts.preloadEndings()

  saveHighScore()
})

onUnmounted(() => {
  tts.stop()
})

function saveHighScore() {
  try {
    const key = 'lighthouse_zero_protocol_best'
    const prev = localStorage.getItem(key)
    let best = prev ? JSON.parse(prev) : {}
    const score = Object.values(mbtiStore.endingWeights).reduce((a, b) => a + b, 0)
    if (!best[mbtiType.value] || score > best[mbtiType.value].score) {
      best[mbtiType.value] = {
        score,
        type: ending.value?.type,
        variant: ending.value?.variant,
        timestamp: Date.now()
      }
      localStorage.setItem(key, JSON.stringify(best))
    }
  } catch (e) {}
}

function revealResult() {
  isRevealed.value = true

  if (ending.value?.type && storyParagraphs.value.length) {
    const emotion = tts.ENDING_VOICES[ending.value.type] || '(平静) '
    tts.play({
      text: storyParagraphs.value.join(' '),
      speaker: 'narrator',
      emotion,
      dialogueId: `ending_${ending.value.type}`
    })
  }
}

function showMBTIResult() {
  showMBTI.value = true
}

function getDimWinner(dim) {
  const keys = Object.keys(dim).filter(k => k !== 'label')
  let maxKey = keys[0]
  keys.forEach(k => {
    if (dim[k] > dim[maxKey]) maxKey = k
  })
  return maxKey
}

function getLeftPercent(dim) {
  const keys = Object.keys(dim).filter(k => k !== 'label')
  const total = dim[keys[0]] + dim[keys[1]] || 1
  return (dim[keys[0]] / total) * 100
}

function getRightPercent(dim) {
  const keys = Object.keys(dim).filter(k => k !== 'label')
  const total = dim[keys[0]] + dim[keys[1]] || 1
  return (dim[keys[1]] / total) * 100
}

function shareResult() {
  const modeText = isFunMode.value ? '趣味测试' : '灯塔博弈'
  let text = ''

  if (ending.value?.type === 'true' || ending.value?.type === 'truth') {
    text = `我达成了【真相揭露】好结局——我是「${typeInfo.value.name}」（${typeInfo.value.element}）。${endingText.value?.quote} 来挑战看看你能否揭露真相吧！`
  } else if (ending.value?.type === 'secret' || ending.value?.type === 'zero') {
    text = `我触发了零点协议！我是「${ending.value.name || typeInfo.value.name}」（${ending.value.secretVariant || '觉醒者'}）。${endingText.value?.quote} 这可是稀有结局哦！`
  } else if (ending.value?.type === 'bad' || ending.value?.type === 'backfire') {
    text = `我在灯塔中陷入了反噬困局...下次一定要更谨慎！来试试看你能达成什么结局？`
  } else {
    text = isFunMode.value
      ? `我在「${modeText}」中存活了下来——我是「${typeInfo.value.name}」（${typeInfo.value.element}）。${typeInfo.value.quote} 来测测你是哪种梗王吧！`
      : `我在「${modeText}」中独自逃生——我是「${typeInfo.value.name}」（${typeInfo.value.element}）。来发现你在博弈中的真实人格吧！`
  }

  if (navigator.share) {
    navigator.share({
      title: isFunMode.value ? '我的趣味MBTI结果' : '我的灯塔博弈身份',
      text: text,
      url: window.location.href
    })
  } else {
    navigator.clipboard.writeText(text)
    showModal('success', { title: '已复制', message: '结果已复制到剪贴板！' })
  }
}

function restartGame() {
  tts.stop()
  mbtiStore.reset()
  router.push('/')
}
</script>

<style scoped>
.result-container {
  height: 100vh;
  width: 100vw;
  background: linear-gradient(160deg, #080a10 0%, #0b0d14 40%, #080a10 100%);
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
}

.result-container.ending-true,
.result-container.ending-truth {
  background: linear-gradient(160deg, #0a0810 0%, #12100a 30%, #08090e 100%);
}

.result-container.ending-bad,
.result-container.ending-backfire {
  background: linear-gradient(160deg, #060608 0%, #0a0910 40%, #050608 100%);
  filter: brightness(0.85);
}

.result-container.ending-bad .content,
.result-container.ending-backfire .content {
  opacity: 0.8;
}

.result-container.ending-secret .bg-canvas.secret-bg,
.result-container.ending-zero .bg-canvas.secret-bg {
  background: linear-gradient(
    -45deg,
    rgba(100, 80, 140, 0.12),
    rgba(140, 80, 120, 0.08),
    rgba(80, 100, 140, 0.10),
    rgba(120, 80, 130, 0.07)
  );
  background-size: 400% 400%;
  animation: rainbow-gradient 10s ease infinite;
  opacity: 0.5;
}

@keyframes rainbow-gradient {
  0% { background-position: 0% 50%; }
  25% { background-position: 100% 0%; }
  50% { background-position: 100% 100%; }
  75% { background-position: 0% 100%; }
  100% { background-position: 0% 50%; }
}

.bg-canvas {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.25;
  animation: orb-float 20s ease-in-out infinite;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(70, 80, 120, 0.6) 0%, transparent 70%);
  top: -150px;
  right: -150px;
  animation-delay: 0s;
}

.orb-2 {
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(90, 65, 95, 0.5) 0%, transparent 70%);
  bottom: -120px;
  left: -120px;
  animation-delay: -8s;
}

.orb-3 {
  width: 340px;
  height: 340px;
  background: radial-gradient(circle, rgba(55, 75, 95, 0.45) 0%, transparent 70%);
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -16s;
}

@keyframes orb-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(20px, -15px) scale(1.05); }
  66% { transform: translate(-12px, 12px) scale(0.97); }
}

.fog-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 25%, rgba(15, 15, 22, 0.7) 100%);
  pointer-events: none;
  animation: fog-drift 12s ease-in-out infinite;
}

@keyframes fog-drift {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.04); }
}

.content {
  position: relative;
  z-index: 10;
  max-width: 700px;
  width: 85%;
  margin: 0 auto;
  padding: 3rem 2.5rem 4rem;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== REVEAL PHASE ===== */
.reveal-phase {
  text-align: center;
  padding: 2rem;
}

.mystic-orb {
  position: relative;
  width: 220px;
  height: 220px;
  margin: 0 auto 2.5rem;
}

.orb-core {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70px;
  height: 70px;
  z-index: 10;
}

.core-inner {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(100, 110, 150, 0.35), rgba(70, 80, 120, 0.15));
  border: 1px solid rgba(140, 145, 180, 0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.core-symbol {
  font-size: 1.8rem;
  color: #a8acc4;
  animation: symbol-flicker 4s ease-in-out infinite;
}

@keyframes symbol-flicker {
  0%, 88%, 92%, 96%, 100% { opacity: 1; }
  90% { opacity: 0.6; }
  94% { opacity: 0.8; }
}

.core-glow {
  position: absolute;
  inset: -12px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(130, 140, 180, 0.15) 0%, transparent 70%);
  animation: core-glow-pulse 3s ease-in-out infinite;
}

@keyframes core-glow-pulse {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.25); opacity: 1; }
}

.core-pulse {
  position: absolute;
  inset: -20px;
  border-radius: 50%;
  border: 1px solid rgba(130, 140, 180, 0.12);
  animation: core-pulse-ring 2.5s ease-out infinite;
}

@keyframes core-pulse-ring {
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(1.8); opacity: 0; }
}

.orbit-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 1px solid transparent;
}

.orbit-1 {
  width: 110px;
  height: 110px;
  margin: -55px 0 0 -55px;
  border-color: rgba(140, 145, 180, 0.14);
  animation: orbit-spin-cw 10s linear infinite;
}

.orbit-2 {
  width: 155px;
  height: 155px;
  margin: -77.5px 0 0 -77.5px;
  border-color: rgba(130, 135, 170, 0.09);
  border-style: dashed;
  animation: orbit-spin-ccw 16s linear infinite;
}

.orbit-3 {
  width: 195px;
  height: 195px;
  margin: -97.5px 0 0 -97.5px;
  border-color: rgba(120, 128, 165, 0.07);
  animation: orbit-spin-cw 24s linear infinite;
}

@keyframes orbit-spin-cw {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes orbit-spin-ccw {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

.orbit-dot {
  position: absolute;
  width: 5px;
  height: 5px;
  background: rgba(160, 165, 200, 0.7);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(140, 145, 190, 0.4);
}

.dot-1 { top: 0; left: 50%; transform: translateX(-50%); }
.dot-2 { bottom: 12%; right: 8%; }
.dot-3 { top: 55%; left: 6%; }

.orbit-dash {
  position: absolute;
  width: 12px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(140, 145, 180, 0.45), transparent);
}

.dash-1 { top: 0; left: 50%; transform: translateX(-50%) rotate(0deg); }
.dash-2 { right: 0; top: 50%; transform: translateY(-50%) rotate(90deg); }
.dash-3 { bottom: 0; left: 50%; transform: translateX(-50%) rotate(180deg); }
.dash-4 { left: 0; top: 50%; transform: translateY(-50%) rotate(270deg); }

.ring-rune {
  position: absolute;
  font-size: 0.65rem;
  color: rgba(140, 145, 185, 0.35);
  animation: rune-glow 3s ease-in-out infinite;
}

.rune-1 { top: 2px; left: 50%; transform: translateX(-50%); animation-delay: 0s; }
.rune-2 { bottom: 18%; right: 12%; animation-delay: -1s; }
.rune-3 { top: 48%; left: 10%; animation-delay: -2s; }

@keyframes rune-glow {
  0%, 100% { opacity: 0.35; text-shadow: none; }
  50% { opacity: 0.8; text-shadow: 0 0 10px rgba(140, 145, 190, 0.5); }
}

.outer-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  pointer-events: none;
}

.ring-a {
  width: 210px;
  height: 210px;
  margin: -105px 0 0 -105px;
  border: 1px solid rgba(120, 128, 165, 0.06);
  animation: outer-pulse-a 5s ease-in-out infinite;
}

.ring-b {
  width: 200px;
  height: 200px;
  margin: -100px 0 0 -100px;
  border: 1px solid rgba(125, 132, 168, 0.04);
  animation: outer-pulse-b 6s ease-in-out infinite reverse;
}

.ring-c {
  width: 218px;
  height: 218px;
  margin: -109px 0 0 -109px;
  border: 1px dashed rgba(115, 122, 160, 0.04);
  animation: outer-rotate-slow 40s linear infinite;
}

@keyframes outer-pulse-a {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.6; }
  50% { transform: scale(1.03) rotate(2deg); opacity: 1; }
}

@keyframes outer-pulse-b {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.5; }
  50% { transform: scale(0.97) rotate(-2deg); opacity: 0.9; }
}

@keyframes outer-rotate-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.light-ray {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1px;
  height: 95px;
  background: linear-gradient(to top, transparent, rgba(140, 148, 190, 0.08), transparent);
  transform-origin: bottom center;
  opacity: 0;
  animation: ray-flash 4s ease-in-out infinite;
}

.ray-1 { transform: translate(-50%, -100%) rotate(0deg); animation-delay: 0s; }
.ray-2 { transform: translate(-50%, -100%) rotate(90deg); animation-delay: -1s; }
.ray-3 { transform: translate(-50%, -100%) rotate(180deg); animation-delay: -2s; }
.ray-4 { transform: translate(-50%, -100%) rotate(270deg); animation-delay: -3s; }

@keyframes ray-flash {
  0%, 75%, 100% { opacity: 0; }
  85% { opacity: 0.6; }
}

.float-particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: rgba(160, 168, 210, 0.5);
  border-radius: 50%;
  animation: particle-float 6s ease-in-out infinite;
}

.p-1 { top: 15%; left: 20%; animation-delay: 0s; }
.p-2 { top: 25%; right: 18%; animation-delay: -1s; }
.p-3 { bottom: 30%; left: 15%; animation-delay: -2s; }
.p-4 { bottom: 20%; right: 22%; animation-delay: -3s; }
.p-5 { top: 55%; left: 8%; animation-delay: -4s; }
.p-6 { top: 48%; right: 10%; animation-delay: -5s; }

@keyframes particle-float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.3;
  }
  25% {
    transform: translate(6px, -10px) scale(1.4);
    opacity: 0.8;
  }
  50% {
    transform: translate(-4px, -16px) scale(0.8);
    opacity: 0.5;
  }
  75% {
    transform: translate(8px, -6px) scale(1.2);
    opacity: 0.7;
  }
}

.reveal-title {
  color: #b0b4c0;
  font-size: 1.6rem;
  margin: 0 0 0.8rem;
  font-weight: 600;
  letter-spacing: 0.2em;
}

.reveal-subtitle {
  color: #5a6278;
  font-size: 0.92rem;
  margin: 0 0 2.5rem;
  line-height: 1.7;
  letter-spacing: 0.06em;
}

.reveal-btn {
  background: transparent;
  border: 1px solid rgba(130, 135, 165, 0.2);
  padding: 1.1rem 3rem;
  color: #8890a8;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s ease;
  letter-spacing: 0.2em;
}

.reveal-btn:hover {
  border-color: rgba(130, 135, 165, 0.4);
  color: #b0b4c0;
  box-shadow: 0 0 30px rgba(100, 105, 135, 0.15);
  transform: translateY(-2px);
}

/* ===== STORY PHASE ===== */
.story-phase {
  width: 100%;
  animation: story-emerge 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes story-emerge {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ending-header-card {
  background: linear-gradient(
    170deg,
    rgba(255, 255, 255, 0.025) 0%,
    rgba(255, 255, 255, 0.008) 100%
  );
  border: 1px solid rgba(130, 135, 165, 0.08);
  border-radius: 2px;
  padding: 2.5rem 2rem 2rem;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
  text-align: center;
}

.header-glow {
  position: absolute;
  top: -40%;
  left: -40%;
  width: 180%;
  height: 180%;
  background: radial-gradient(
    ellipse at 50% 0%,
    rgba(100, 105, 135, 0.05) 0%,
    transparent 55%
  );
  pointer-events: none;
}

.header-top-line {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(130, 135, 165, 0.1), transparent);
}

.ending-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.2rem;
  background: rgba(120, 125, 155, 0.08);
  border: 1px solid rgba(120, 125, 155, 0.14);
  border-radius: 2px;
  margin-bottom: 1.5rem;
}

.badge-icon {
  font-size: 1.1rem;
}

.badge-text {
  color: #8890a8;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.15em;
}

.header-truth .ending-badge {
  background: rgba(180, 150, 100, 0.08);
  border-color: rgba(180, 150, 100, 0.18);
}

.header-truth .badge-text {
  color: #c4a878;
}

.header-backfire .ending-badge {
  background: rgba(120, 100, 100, 0.08);
  border-color: rgba(120, 100, 100, 0.18);
}

.header-backfire .badge-text {
  color: #a88888;
}

.header-zero .ending-badge {
  background: rgba(130, 100, 150, 0.08);
  border-color: rgba(130, 100, 150, 0.18);
}

.header-zero .badge-text {
  color: #a088b8;
}

.ending-name {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  letter-spacing: 0.15em;
  color: #c0c4cc;
}

.header-truth .ending-name {
  color: #d4c8a0;
}

.header-backfire .ending-name {
  color: #887878;
}

.header-zero .ending-name {
  color: #c8b8d8;
}

.ending-subtitle {
  color: #6a7088;
  font-size: 0.92rem;
  margin: 0 0 1.5rem;
  letter-spacing: 0.1em;
  font-style: italic;
}

.header-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-divider span:first-child,
.header-divider span:last-child {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(130, 135, 165, 0.12), transparent);
}

.divider-diamond {
  color: rgba(130, 135, 165, 0.3);
  font-size: 0.6rem;
}

.story-narrative {
  background: rgba(255, 255, 255, 0.012);
  border: 1px solid rgba(130, 135, 165, 0.05);
  border-radius: 2px;
  padding: 2rem 1.8rem;
  margin-bottom: 1.5rem;
}

.story-paragraph {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.3rem;
  animation: paragraph-in 0.6s ease-out backwards;
}

.story-paragraph:last-child {
  margin-bottom: 0;
}

@keyframes paragraph-in {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.paragraph-marker {
  flex-shrink: 0;
  width: 4px;
  height: 4px;
  background: rgba(130, 135, 165, 0.25);
  border-radius: 50%;
  margin-top: 0.6rem;
}

.story-paragraph p {
  color: #989cb4;
  font-size: 0.92rem;
  line-height: 1.85;
  margin: 0;
  letter-spacing: 0.02em;
}

.story-quote {
  text-align: center;
  padding: 1.5rem 2rem;
  margin: 0 0 2rem;
  font-style: italic;
  font-size: 0.95rem;
  line-height: 1.8;
  border-left: 2px solid rgba(130, 135, 165, 0.12);
  border-right: 2px solid rgba(130, 135, 165, 0.12);
  color: #78829a;
  background: rgba(120, 125, 155, 0.02);
}

.quote-truth {
  border-left-color: rgba(180, 150, 100, 0.2);
  border-right-color: rgba(180, 150, 100, 0.2);
  color: #a89868;
  background: rgba(180, 150, 100, 0.02);
}

.quote-backfire {
  border-left-color: rgba(150, 100, 100, 0.15);
  border-right-color: rgba(150, 100, 100, 0.15);
  color: #886868;
  background: rgba(150, 100, 100, 0.02);
}

.quote-zero {
  border-left-color: rgba(130, 100, 150, 0.2);
  border-right-color: rgba(130, 100, 150, 0.2);
  color: #9878a8;
  background: rgba(130, 100, 150, 0.03);
}

.story-actions {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
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
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  border: 1px solid;
}

.primary-action {
  background: transparent;
  border-color: rgba(180, 150, 100, 0.25);
  color: #c4a878;
}

.primary-action:hover {
  border-color: rgba(200, 170, 120, 0.4);
  color: #e0d4a8;
  box-shadow: 0 0 28px rgba(180, 150, 100, 0.15);
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

.story-hint {
  text-align: center;
  color: #4a5068;
  font-size: 0.82rem;
  font-style: italic;
  margin: 0;
  letter-spacing: 0.03em;
}

/* ===== MBTI PHASE ===== */
.mbti-phase {
  width: 100%;
  animation: mbti-slide-in 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ===== BEHAVIOR PANEL (新增) ===== */
.behavior-panel {
  background: linear-gradient(
    170deg,
    rgba(255, 255, 255, 0.02) 0%,
    rgba(255, 255, 255, 0.005) 100%
  );
  border: 1px solid rgba(130, 135, 165, 0.07);
  border-radius: 2px;
  padding: 1.8rem 1.5rem;
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;
}

.behavior-panel::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(130, 135, 165, 0.1), transparent);
}

.behavior-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.behavior-icon {
  color: #78829a;
  font-size: 0.9rem;
}

.behavior-title {
  color: #8890a8;
  font-size: 0.84rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: 0.12em;
}

.behavior-profile-text {
  color: #989cb4;
  font-size: 0.9rem;
  line-height: 1.9;
  margin: 0 0 1.2rem;
  font-style: italic;
}

.behavior-traits {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.2rem;
}

.behavior-trait-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.8rem;
  background: rgba(120, 125, 155, 0.06);
  border: 1px solid rgba(120, 125, 155, 0.1);
  border-radius: 2px;
  color: #8890a8;
  font-size: 0.78rem;
  letter-spacing: 0.03em;
}

.npc-relation-summary {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  padding-top: 1rem;
  border-top: 1px solid rgba(120, 125, 155, 0.06);
}

.relation-label {
  color: #5a6278;
  font-size: 0.78rem;
  font-weight: 500;
}

.relation-item {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.relation-item.relation-信任 {
  color: #98c498;
}

.relation-item.relation-警惕 {
  color: #c49898;
}

.relation-item.relation-中立 {
  color: #8890a8;
}

@keyframes mbti-slide-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.back-to-story-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: transparent;
  border: 1px solid rgba(130, 135, 165, 0.1);
  color: #6a7088;
  font-size: 0.82rem;
  cursor: pointer;
  margin-bottom: 2rem;
  transition: all 0.3s ease;
  letter-spacing: 0.05em;
}

.back-to-story-btn:hover {
  border-color: rgba(130, 135, 165, 0.25);
  color: #8890a8;
  transform: translateX(-4px);
}

.back-icon {
  font-size: 1rem;
  transition: transform 0.3s;
}

.back-to-story-btn:hover .back-icon {
  transform: translateX(-3px);
}

/* ===== IDENTITY CARD BASE ===== */
.personality-image-container {
  text-align: center;
  margin-bottom: 1.5rem;
  position: relative;
}

.personality-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid rgba(130, 135, 165, 0.15);
  position: relative;
  z-index: 1;
  transition: all 0.4s ease;
}

.personality-image:hover {
  border-color: rgba(130, 135, 165, 0.3);
  box-shadow: 0 0 20px rgba(100, 105, 135, 0.15);
}

.image-frame {
  position: absolute;
  inset: -8px;
  border: 1px solid rgba(130, 135, 165, 0.06);
  border-radius: 6px;
  pointer-events: none;
}

.identity-card {
  background: linear-gradient(
    170deg,
    rgba(255, 255, 255, 0.02) 0%,
    rgba(255, 255, 255, 0.005) 100%
  );
  border: 1px solid rgba(130, 135, 165, 0.07);
  border-radius: 2px;
  padding: 2.2rem 1.8rem;
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;
}

.card-glow {
  position: absolute;
  top: -40%;
  left: -40%;
  width: 180%;
  height: 180%;
  background: radial-gradient(
    ellipse at 50% 0%,
    rgba(100, 105, 135, 0.05) 0%,
    transparent 55%
  );
  pointer-events: none;
}

.card-top-line {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(130, 135, 165, 0.1), transparent);
}

.card-bottom-line {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(130, 135, 165, 0.04), transparent);
}

.identity-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
  position: relative;
}

.element-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.85rem;
  background: rgba(120, 125, 155, 0.1);
  border: 1px solid rgba(120, 125, 155, 0.14);
  border-radius: 2px;
  color: #8890a8;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.origin-code {
  font-size: 0.72rem;
  color: #4a5068;
  letter-spacing: 0.18em;
  font-weight: 500;
}

.identity-name {
  font-size: 1.9rem;
  font-weight: 700;
  margin: 0 0 0.3rem;
  color: #c0c4cc;
  line-height: 1.2;
}

.identity-title {
  color: #6a7088;
  font-size: 0.92rem;
  margin: 0 0 1.3rem;
  letter-spacing: 0.06em;
  font-weight: 500;
}

.identity-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.3rem;
}

.identity-divider span:first-child,
.identity-divider span:last-child {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(130, 135, 165, 0.12), transparent);
}

.divider-icon {
  display: block;
  width: 4px;
  height: 4px;
  background: rgba(130, 135, 165, 0.25);
  transform: rotate(45deg);
}

.identity-desc {
  color: #989cb4;
  font-size: 0.9rem;
  line-height: 1.9;
  margin: 0 0 1.5rem;
}

.strengths-section h4 {
  color: #8890a8;
  font-size: 0.82rem;
  font-weight: 600;
  margin: 0 0 0.9rem;
  letter-spacing: 0.12em;
}

.traits-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1.3rem;
}

.trait-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.42rem 0.7rem;
  background: rgba(120, 125, 155, 0.04);
  border: 1px solid rgba(120, 125, 155, 0.08);
  border-radius: 2px;
  font-size: 0.8rem;
  color: #8890a8;
  animation: trait-in 0.5s ease-out backwards;
}

.trait-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #6a7088;
  flex-shrink: 0;
}

@keyframes trait-in {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

.soul-quote {
  text-align: center;
  padding: 1rem 1.3rem;
  background: rgba(120, 125, 155, 0.03);
  border-left: 1px solid rgba(120, 125, 155, 0.1);
  border-right: 1px solid rgba(120, 125, 155, 0.1);
  border-radius: 0 2px 2px 0;
  margin: 0;
  color: #6a7088;
  font-style: italic;
  line-height: 1.8;
  font-size: 0.86rem;
}

.dimensions-panel {
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(130, 135, 165, 0.05);
  border-radius: 2px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.panel-title {
  color: #8890a8;
  font-size: 0.84rem;
  font-weight: 600;
  margin: 0 0 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  letter-spacing: 0.1em;
}

.title-icon {
  display: inline-block;
  width: 5px;
  height: 5px;
  background: rgba(120, 125, 155, 0.3);
  transform: rotate(45deg);
}

.dimension-item {
  margin-bottom: 1.2rem;
}

.dimension-item:last-child {
  margin-bottom: 0;
}

.dim-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.4rem;
}

.dim-label {
  color: #4a5068;
  font-size: 0.78rem;
}

.dim-result {
  color: #78829a;
  font-weight: 700;
  font-size: 0.82rem;
}

.dim-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 2px;
  display: flex;
  overflow: hidden;
  position: relative;
}

.dim-fill {
  height: 100%;
  transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.dim-fill.left {
  background: linear-gradient(to right, #5a6890, #4a5878);
  border-radius: 2px 0 0 2px;
}

.dim-fill.right {
  background: linear-gradient(to right, #785878, #684868);
  border-radius: 0 2px 2px 0;
}

.dim-center {
  width: 1px;
  background: rgba(255, 255, 255, 0.08);
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  height: 100%;
}

.actions {
  display: flex;
  gap: 0.7rem;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn.primary {
  background: transparent;
  border-color: rgba(120, 125, 155, 0.2);
  color: #8890a8;
}

.action-btn.primary:hover {
  border-color: rgba(130, 135, 165, 0.35);
  color: #b0b4c0;
  box-shadow: 0 0 25px rgba(100, 105, 135, 0.12);
  transform: translateY(-2px);
}

.action-btn.secondary {
  background: transparent;
  border-color: rgba(120, 125, 155, 0.08);
  color: #5a6278;
}

.action-btn.secondary:hover {
  border-color: rgba(120, 125, 155, 0.18);
  color: #78829a;
  transform: translateY(-2px);
}

.btn-icon {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(-45deg);
}

/* ===== BAD END ===== */
.bad-ending-panel {
  text-align: center;
  padding: 3rem 2rem;
  animation: bad-enter 1s ease-out;
}

@keyframes bad-enter {
  from { opacity: 0; filter: brightness(0.6) blur(2px); }
  to { opacity: 1; filter: brightness(0.85) blur(0); }
}

.bad-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 1.5rem;
  border: 1px solid rgba(100, 105, 130, 0.12);
  border-radius: 50%;
  position: relative;
  animation: fog-icon-pulse 5s ease-in-out infinite;
}

.bad-icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 1px;
  background: rgba(100, 105, 130, 0.3);
}

.bad-icon::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(90deg);
  width: 20px;
  height: 1px;
  background: rgba(100, 105, 130, 0.3);
}

@keyframes fog-icon-pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.08); opacity: 0.85; }
}

.bad-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #5a6078;
  margin: 0 0 1rem;
  letter-spacing: 0.15em;
}

.bad-description {
  color: #6a7088;
  font-size: 0.95rem;
  line-height: 1.8;
  margin: 0 0 2rem;
}

.restart-btn-prominent {
  background: transparent;
  border: 1px solid rgba(100, 105, 130, 0.2);
  padding: 1rem 3rem;
  color: #78829a;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.4s ease;
  letter-spacing: 0.15em;
  animation: restart-glow 3s ease-in-out infinite;
}

.restart-btn-prominent:hover {
  border-color: rgba(120, 125, 155, 0.35);
  color: #989cb4;
  box-shadow: 0 0 30px rgba(80, 85, 110, 0.15);
  transform: translateY(-2px);
}

@keyframes restart-glow {
  0%, 100% { box-shadow: 0 0 15px rgba(80, 85, 110, 0.1); }
  50% { box-shadow: 0 0 28px rgba(80, 85, 110, 0.18); }
}

/* ===== TRUE END OVERRIDES ===== */
.true-ending-panel { position: relative; }

.crown-badge {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 36px;
  border: 1px solid rgba(170, 150, 100, 0.2);
  border-radius: 50%;
  z-index: 20;
  animation: crown-breathe 4s ease-in-out infinite;
}

.crown-badge::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: rgba(190, 170, 120, 0.5);
  border-radius: 50%;
}

@keyframes crown-breathe {
  0%, 100% { box-shadow: 0 0 15px rgba(170, 150, 100, 0.1); }
  50% { box-shadow: 0 0 28px rgba(170, 150, 100, 0.22); }
}

.true-card {
  border-color: rgba(170, 150, 100, 0.1);
  margin-top: 1.2rem;
}

.true-card .personality-image {
  border-color: rgba(170, 150, 100, 0.2);
}

.golden-glow {
  background: radial-gradient(ellipse at 50% 0%, rgba(170, 150, 100, 0.06) 0%, transparent 55%);
}

.golden-badge {
  background: rgba(170, 150, 100, 0.1);
  border-color: rgba(170, 150, 100, 0.18);
  color: #b8a878;
}

.golden-name { color: #d4c8a0; }

.golden-title { color: #a89868; font-weight: 600; }

.golden-divider span:first-child,
.golden-divider span:last-child {
  background: linear-gradient(to right, transparent, rgba(170, 150, 100, 0.18), transparent);
}

.sub-desc { color: #6a7088; font-size: 0.84rem; margin-top: -1rem; }

.golden-trait {
  background: rgba(170, 150, 100, 0.05);
  border-color: rgba(170, 150, 100, 0.1);
  color: #b8a878;
}

.golden-trait:hover {
  transform: translateX(4px);
  background: rgba(170, 150, 100, 0.08);
}

.golden-dot { background: #a89868; }

.golden-quote {
  background: rgba(170, 150, 100, 0.03);
  border-left-color: rgba(170, 150, 100, 0.12);
  border-right-color: rgba(170, 150, 100, 0.12);
  color: #a89868;
}

.golden-dimensions {
  background: rgba(170, 150, 100, 0.015);
  border-color: rgba(170, 150, 100, 0.06);
}

.golden-result { color: #b8a878; }

.golden-fill-left { background: linear-gradient(to right, #c8b888, #a89868); }
.golden-fill-right { background: linear-gradient(to right, #988858, #887848); }

.golden-primary {
  border-color: rgba(170, 150, 100, 0.25);
  color: #c8b888;
}

.golden-primary:hover {
  border-color: rgba(190, 170, 120, 0.4);
  color: #e0d4a8;
  box-shadow: 0 0 30px rgba(170, 150, 100, 0.18);
}

/* ===== SECRET/ZERO END OVERRIDES ===== */
.secret-ending-panel { position: relative; }

.secret-badge {
  text-align: center;
  background: rgba(130, 100, 150, 0.08);
  border: 1px solid rgba(130, 100, 150, 0.15);
  border-radius: 2px;
  padding: 0.5rem 1.2rem;
  color: #a088b8;
  font-weight: 700;
  font-size: 0.82rem;
  margin-bottom: 1.2rem;
  letter-spacing: 0.15em;
  animation: secret-badge-breath 3s ease-in-out infinite;
}

@keyframes secret-badge-breath {
  0%, 100% { box-shadow: 0 0 12px rgba(130, 100, 150, 0.08); }
  50% { box-shadow: 0 0 24px rgba(130, 100, 150, 0.16); }
}

.secret-card {
  border-color: rgba(130, 100, 150, 0.1);
}

.secret-image-container .personality-image {
  border-color: rgba(130, 100, 150, 0.2);
}

.secret-frame { border-color: rgba(130, 100, 150, 0.06); }

.rainbow-glow {
  background: radial-gradient(ellipse at 50% 0%, rgba(130, 100, 150, 0.06) 0%, rgba(120, 80, 130, 0.03) 40%, transparent 55%);
  animation: rainbow-glow-shift 5s ease-in-out infinite;
}

@keyframes rainbow-glow-shift {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.secret-top-line { background: linear-gradient(to right, transparent, rgba(130, 100, 150, 0.1), transparent); }

.secret-badge-element {
  background: rgba(130, 100, 150, 0.1);
  border-color: rgba(130, 100, 150, 0.18);
  color: #a088b8;
  font-size: 0.8rem;
}

.secret-code { color: #8878a8; font-weight: 600; }

.secret-name { color: #c8b8d8; }

.secret-title { color: #9890b0; font-weight: 600; font-size: 0.94rem; }

.secret-divider span:first-child,
.secret-divider span:last-child {
  background: linear-gradient(to right, transparent, rgba(130, 100, 150, 0.12), rgba(120, 80, 130, 0.08), transparent);
}

.secret-main-text { color: #b8a8c8; font-weight: 500; font-size: 0.93rem; }
.secret-sub-text { color: #9890b0; font-size: 0.87rem; margin-top: -1rem; }

.secret-trait {
  background: rgba(130, 100, 150, 0.05);
  border-color: rgba(130, 100, 150, 0.1);
  color: #a088b8;
  animation: secret-trait-pulse 2.5s ease-in-out infinite;
}

@keyframes secret-trait-pulse {
  0%, 100% { border-color: rgba(130, 100, 150, 0.1); }
  50% { border-color: rgba(150, 100, 140, 0.2); }
}

.secret-trait:hover {
  transform: translateX(4px);
  background: rgba(130, 100, 150, 0.08);
}

.secret-dot {
  background: linear-gradient(135deg, #8878a8, #a088b8);
}

.secret-quote {
  background: linear-gradient(135deg, rgba(130, 100, 150, 0.04), rgba(120, 80, 130, 0.02));
  border-left-color: rgba(130, 100, 150, 0.12);
  border-right-color: rgba(130, 100, 150, 0.12);
  color: #a088b8;
}

.secret-dimensions {
  background: rgba(130, 100, 150, 0.015);
  border-color: rgba(130, 100, 150, 0.06);
}

.secret-result { color: #a088b8; font-weight: 700; }

.secret-fill-left { background: linear-gradient(to right, #9890b8, #8878a8); }
.secret-fill-right { background: linear-gradient(to right, #a07898, #906888); }

.secret-primary {
  border-color: rgba(130, 100, 150, 0.25);
  color: #a088b8;
}

.secret-primary:hover {
  border-color: rgba(150, 110, 160, 0.38);
  color: #c0b0d0;
  box-shadow: 0 0 30px rgba(130, 100, 150, 0.15);
}

/* ===== FUN MODE OVERRIDES ===== */
.content.fun-mode .identity-card:not(.true-card):not(.secret-card) {
  background: linear-gradient(170deg, rgba(200, 160, 80, 0.025) 0%, rgba(180, 140, 60, 0.008) 100%);
  border-color: rgba(200, 160, 80, 0.08);
  animation: fun-card-wiggle 3s ease-in-out infinite;
}

@keyframes fun-card-wiggle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.content.fun-mode .element-badge:not(.golden-badge):not(.secret-badge-element) {
  background: rgba(200, 160, 80, 0.1);
  border-color: rgba(200, 160, 80, 0.16);
  color: #c8a868;
}

.content.fun-mode .identity-name:not(.golden-name):not(.secret-name) {
  color: #d8c898;
}

.content.fun-mode .trait-item:not(.golden-trait):not(.secret-trait) {
  background: rgba(200, 160, 80, 0.05);
  border-color: rgba(200, 160, 80, 0.1);
  color: #c8a868;
}

.content.fun-mode .trait-item:not(.golden-trait):not(.secret-trait):hover {
  transform: translateX(4px) scale(1.01);
  background: rgba(200, 160, 80, 0.08);
}

.content.fun-mode .trait-dot:not(.golden-dot):not(.secret-dot) {
  background: #b89848;
}

.content.fun-mode .soul-quote:not(.golden-quote):not(.secret-quote) {
  background: rgba(200, 160, 80, 0.03);
  border-left-color: rgba(200, 160, 80, 0.1);
  border-right-color: rgba(200, 160, 80, 0.1);
  color: #b89868;
}

.content.fun-mode .action-btn.primary:not(.golden-primary):not(.secret-primary) {
  border-color: rgba(200, 160, 80, 0.2);
  color: #c8a868;
}

.content.fun-mode .action-btn.primary:not(.golden-primary):not(.secret-primary):hover {
  border-color: rgba(220, 180, 100, 0.35);
  color: #e0d090;
  box-shadow: 0 0 28px rgba(200, 160, 80, 0.15);
}

.content.fun-mode .dimensions-panel:not(.golden-dimensions):not(.secret-dimensions) {
  background: rgba(200, 160, 80, 0.015);
  border-color: rgba(200, 160, 80, 0.06);
}

.content.fun-mode .dim-fill.left:not(.golden-fill-left):not(.secret-fill-left) {
  background: linear-gradient(to right, #c8a868, #b89848);
}

.content.fun-mode .dim-fill.right:not(.golden-fill-right):not(.secret-fill-right) {
  background: linear-gradient(to right, #c89858, #b88838);
}

.content.fun-mode .dim-result:not(.golden-result):not(.secret-result) {
  color: #c8a868;
}

.result-container {
  --mbti-primary: #6a7088;
  --mbti-secondary: #8890a8;
  --mbti-accent: #989cb4;
  --mbti-background: #080a10;
  --mbti-gradient: linear-gradient(135deg, #5a6890 0%, #6a7088 100%);
  --mbti-text: #c0c4cc;
  --mbti-glow: rgba(106, 112, 136, 0.5);
}

.identity-card {
  border-color: color-mix(in srgb, var(--mbti-primary) 15%, transparent);
}

.identity-name {
  color: var(--mbti-text);
}

.element-badge {
  background: color-mix(in srgb, var(--mbti-primary) 12%, transparent);
  border-color: color-mix(in srgb, var(--mbti-primary) 20%, transparent);
  color: var(--mbti-primary);
}

.trait-dot {
  background: var(--mbti-primary);
}

.trait-item {
  background: color-mix(in srgb, var(--mbti-primary) 6%, transparent);
  border-color: color-mix(in srgb, var(--mbti-primary) 12%, transparent);
  color: var(--mbti-text);
}

.soul-quote {
  background: color-mix(in srgb, var(--mbti-primary) 4%, transparent);
  border-left-color: color-mix(in srgb, var(--mbti-primary) 15%, transparent);
  border-right-color: color-mix(in srgb, var(--mbti-primary) 15%, transparent);
  color: var(--mbti-primary);
}

.action-btn.primary {
  border-color: color-mix(in srgb, var(--mbti-primary) 30%, transparent);
  color: var(--mbti-primary);
}

.action-btn.primary:hover {
  border-color: color-mix(in srgb, var(--mbti-primary) 50%, transparent);
  color: var(--mbti-text);
  box-shadow: 0 0 25px var(--mbti-glow);
}

.dim-fill.left {
  background: linear-gradient(to right, var(--mbti-primary), var(--mbti-secondary));
}

.dim-result {
  color: var(--mbti-primary);
}

.dimensions-panel {
  background: color-mix(in srgb, var(--mbti-primary) 3%, transparent);
  border-color: color-mix(in srgb, var(--mbti-primary) 8%, transparent);
}
</style>
