import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMbtiStore = defineStore('mbti', () => {
  const choices = ref([])
  const currentChapter = ref(0)
  const gameMode = ref('fun')
  
  // 行为日志（详细记录）
  const actionLogs = ref([])
  
  // MBTI 分数
  const scores = ref({
    E: 0, I: 0,
    S: 0, N: 0,
    T: 0, F: 0,
    J: 0, P: 0
  })
  
  // 行为标签（新增）
  const behaviorTags = ref({
    cooperative: 0,
    deceptive: 0,
    cautious: 0,
    aggressive: 0,
    curious: 0,
    protective: 0
  })
  
  // NPC 关系值（新增）-100 到 +100
  const npcRelations = ref({
    lawyer: 0,
    nurse: 0,
    reporter: 0
  })
  
  // 结局路径权重（新增）
  const endingWeights = ref({
    truth: 0,
    escape: 0,
    backfire: 0,
    zero: 0,
    secret: 0
  })
  
  // 游戏化数据
  const specialFlags = ref({})
  const hiddenOptionsFound = ref(0)
  const visitedScenes = ref(new Set())
  const visitCount = ref(0)
  const longPressTimers = ref({})
  const revealedHiddenOptions = ref(new Set())
  
  // 小游戏结果记录（新增）
  const gameResults = ref([])

  function recordAction(action) {
    choices.value.push(action)
    
    // 记录详细行为日志
    actionLogs.value.push({
      timestamp: Date.now(),
      chapterId: currentChapter.value,
      optionId: action.id,
      text: action.text,
      isHidden: action.isHidden || false,
      gameType: action.gameType || null
    })
    
    // 记录维度分数
    if (action.dimensions) {
      action.dimensions.forEach(dim => {
        if (scores.value[dim] !== undefined) {
          scores.value[dim] += dim.weight || 1
        }
      })
    }
    
    // 记录行为标签（新增）
    if (action.behaviorTags) {
      action.behaviorTags.forEach(tag => {
        if (behaviorTags.value[tag] !== undefined) {
          behaviorTags.value[tag] += 1
        }
      })
    }
    
    // 更新 NPC 关系值（新增）
    if (action.relationEffect) {
      Object.entries(action.relationEffect).forEach(([npc, value]) => {
        if (npcRelations.value[npc] !== undefined) {
          npcRelations.value[npc] += value
          // 限制在 -100 到 +100 范围内
          npcRelations.value[npc] = Math.max(-100, Math.min(100, npcRelations.value[npc]))
        }
      })
    }
    
    // 累加结局路径权重（新增）
    if (action.endingWeight) {
      Object.entries(action.endingWeight).forEach(([path, weight]) => {
        if (endingWeights.value[path] !== undefined) {
          endingWeights.value[path] += weight
        }
      })
    }
    
    // 记录特殊标记
    if (action.specialFlag) {
      specialFlags.value[action.specialFlag] = true
    }
    
    // 记录发现的隐藏选项
    if (action.isHidden) {
      hiddenOptionsFound.value++
      revealedHiddenOptions.value.add(action.id)
    }
    
    // 访问计数
    visitCount.value++
  }

  function recordGameResult(result) {
    gameResults.value.push(result)
  }

  function recordSceneVisit(sceneId) {
    visitedScenes.value.add(sceneId)
  }

  function setGameMode(mode) {
    gameMode.value = mode
  }

  function checkHiddenCondition(condition, option) {
    if (!condition) return false
    
    switch (condition) {
      case 'mustVisitD':
        return visitedScenes.value.has('1-2d') || visitedScenes.value.has('1-1')
      
      case 'hasFlag_observer':
        return !!specialFlags.value.observer
      
      case 'hasFlag_brave':
        return !!specialFlags.value.brave
      
      case 'visitCount_>=2':
        return visitCount.value >= 2
      
      case 'flags_count >= 3':
        return Object.keys(specialFlags.value).length >= 3
      
      // 新增：NPC 关系条件
      default:
        if (condition.startsWith('relation_')) {
          const [npc, op, val] = condition.replace('relation_', '').split(/([><=]+)/)
          const numVal = parseInt(val)
          const relationVal = npcRelations.value[npc]
          
          switch (op) {
            case '>=': return relationVal >= numVal
            case '<=': return relationVal <= numVal
            case '>': return relationVal > numVal
            case '<': return relationVal < numVal
            default: return false
          }
        }
        
        // 新增：持有物品条件
        if (condition.startsWith('has_item:')) {
          const item = condition.split(':')[1]
          return specialFlags.value[item] || false
        }
        
        // 原有逻辑
        if (condition.startsWith('flags_count')) {
          const count = parseInt(condition.split('>=')[1])
          return Object.keys(specialFlags.value).length >= count
        }
        return false
    }
  }

  function isOptionRevealed(optionId) {
    return revealedHiddenOptions.value.has(optionId)
  }

  function shouldShowHiddenOption(option) {
    if (!option.isHidden) return true
    
    // 已经揭示的总是显示
    if (isOptionRevealed(option.id)) return true
    
    // 检查条件触发
    if (option.hiddenTrigger === 'condition') {
      return checkHiddenCondition(option.hiddenCondition, option)
    }
    
    // always 类型总是显示（但标记为隐藏）
    if (option.hiddenTrigger === 'always') {
      return true
    }
    
    // longPress 类型总是可见（但模糊显示，需要长按揭示）
    if (option.hiddenTrigger === 'longPress') {
      return true
    }
    
    // 新增：sceneInspect 类型需要特定场景元素交互
    if (option.hiddenTrigger === 'sceneInspect') {
      // 暂时返回 false，后续可扩展场景元素点击检测
      return isOptionRevealed(option.id)
    }
    
    // 新增：relationGate 类型需要 NPC 关系达到阈值
    if (option.hiddenTrigger === 'relationGate') {
      return checkHiddenCondition(option.unlockCondition, option)
    }
    
    // 新增：itemGate 类型需要持有特定物品
    if (option.hiddenTrigger === 'itemGate') {
      return checkHiddenCondition(option.unlockCondition, option)
    }
    
    // 新增：gameUnlock 类型需要完成特定小游戏
    if (option.hiddenTrigger === 'gameUnlock') {
      return gameResults.value.some(r => r.gameType === option.requiredGame && r.success)
    }
    
    return false
  }

  function startLongPress(optionId, callback, duration = 1500) {
    longPressTimers.value[optionId] = setTimeout(() => {
      callback()
      revealedHiddenOptions.value.add(optionId)
    }, duration)
  }

  function cancelLongPress(optionId) {
    if (longPressTimers.value[optionId]) {
      clearTimeout(longPressTimers.value[optionId])
      delete longPressTimers.value[optionId]
    }
  }

  const mbtiType = computed(() => {
    const result = ''
      + (scores.value.E >= scores.value.I ? 'E' : 'I')
      + (scores.value.S >= scores.value.N ? 'S' : 'N')
      + (scores.value.T >= scores.value.F ? 'T' : 'F')
      + (scores.value.J >= scores.value.P ? 'J' : 'P')
    return result
  })

  const dimensionDetails = computed(() => ({
    EI: { E: scores.value.E, I: scores.value.I, label: '外向 vs 内向' },
    SN: { S: scores.value.S, N: scores.value.N, label: '实感 vs 直觉' },
    TF: { T: scores.value.T, F: scores.value.F, label: '思考 vs 情感' },
    JP: { J: scores.value.J, P: scores.value.P, label: '判断 vs 知觉' }
  }))
  
  // 行为气质分析（新增）
  const behaviorProfile = computed(() => {
    const tags = behaviorTags.value
    const total = Object.values(tags).reduce((a, b) => a + b, 0)
    if (total === 0) return { dominant: 'balanced', description: '均衡型' }
    
    const sorted = Object.entries(tags).sort((a, b) => b[1] - a[1])
    const [dominant] = sorted[0]
    
    const profiles = {
      cooperative: '合作者',
      deceptive: '策略者',
      cautious: '谨慎者',
      aggressive: '激进者',
      curious: '探索者',
      protective: '守护者'
    }
    
    return {
      dominant,
      label: profiles[dominant] || '未知',
      percentage: Math.round((sorted[0][1] / total) * 100),
      allTags: tags
    }
  })

  // 游戏统计
  const gameStats = computed(() => ({
    totalChoices: choices.value.length,
    flagsCollected: Object.keys(specialFlags.value).length,
    hiddenFound: hiddenOptionsFound.value,
    scenesVisited: visitedScenes.value.size,
    explorationRate: Math.round((visitedScenes.value.size / 6) * 100),
    consistencyScore: calculateConsistencyScore(),
    behaviorDominant: behaviorProfile.value.label,
    npcTrustSummary: getNpcTrustSummary()
  }))
  
  function getNpcTrustSummary() {
    const relations = npcRelations.value
    let trusted = 0
    let suspicious = 0
    
    Object.values(relations).forEach(val => {
      if (val > 20) trusted++
      else if (val < -20) suspicious++
    })
    
    return { trusted, suspicious, neutral: 3 - trusted - suspicious }
  }

  function calculateConsistencyScore() {
    const dims = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P']
    const values = dims.map(d => scores.value[d])
    const max = Math.max(...values)
    const sum = values.reduce((a, b) => a + b, 0)
    return sum > 0 ? Math.round((max / sum) * 100) : 50
  }

  function reset() {
    choices.value = []
    actionLogs.value = []
    currentChapter.value = 0
    scores.value = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
    behaviorTags.value = { cooperative: 0, deceptive: 0, cautious: 0, aggressive: 0, curious: 0, protective: 0 }
    npcRelations.value = { lawyer: 0, nurse: 0, reporter: 0 }
    endingWeights.value = { truth: 0, escape: 0, backfire: 0, zero: 0, secret: 0 }
    specialFlags.value = {}
    hiddenOptionsFound.value = 0
    visitedScenes.value = new Set()
    visitCount.value = 0
    longPressTimers.value = {}
    revealedHiddenOptions.value = new Set()
    gameResults.value = []
  }

  return {
    choices,
    actionLogs,
    currentChapter,
    gameMode,
    scores,
    behaviorTags,
    behaviorProfile,
    npcRelations,
    endingWeights,
    specialFlags,
    hiddenOptionsFound,
    visitedScenes,
    visitCount,
    revealedHiddenOptions,
    gameResults,
    recordAction,
    recordChoice: recordAction, // 向后兼容
    recordGameResult,
    recordSceneVisit,
    setGameMode,
    isOptionRevealed,
    shouldShowHiddenOption,
    startLongPress,
    cancelLongPress,
    checkHiddenCondition,
    mbtiType,
    dimensionDetails,
    gameStats,
    reset
  }
})
