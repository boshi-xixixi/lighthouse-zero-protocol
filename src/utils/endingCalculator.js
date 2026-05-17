/**
 * 结局计算器 - 路径权重主导模式
 *
 * 核心改动：
 * 1. 从"一致性主导"改为"路径权重主导"
 * 2. 使用行为质量做修正（而非直接改结局类型）
 * 3. 支持结局亚型（完整版/残缺版/知情版/自陷版）
 * 4. 返回更丰富的行为分析数据
 */

export const ENDING_TYPES = {
  TRUTH_END: 'truth',
  ESCAPE_END: 'escape',
  BACKFIRE_END: 'backfire',
  ZERO_END: 'zero'
}

// 结局亚型
export const ENDING_VARIANTS = {
  COMPLETE: 'complete',      // 完整版
  FRAGMENTED: 'fragmented', // 残缺版
  INFORMED: 'informed',    // 知情版
  SELF_TRAPPED: 'self_trapped' // 自陷版
}

export const ENDING_INFO = {
  [ENDING_TYPES.TRUTH_END]: {
    name: '真相揭露',
    title: 'TRUTH END',
    icon: '💡',
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
    description: '你揭开了灯塔背后的真相',
    subtitle: '揭露者'
  },
  [ENDING_TYPES.ESCAPE_END]: {
    name: '独自逃生',
    title: 'ESCAPE END',
    icon: '🚪',
    color: '#60a5fa',
    gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6, #2563eb)',
    description: '你选择了自保，逃离了这座灯塔',
    subtitle: '幸存者'
  },
  [ENDING_TYPES.BACKFIRE_END]: {
    name: '反噬困局',
    title: 'BACKFIRE END',
    icon: '⚠️',
    color: '#64748b',
    gradient: 'linear-gradient(135deg, #64748b, #475569, #334155)',
    description: '你的选择引发了连锁反应，局势失控...',
    subtitle: '被困者'
  },
  [ENDING_TYPES.ZERO_END]: {
    name: '零点觉醒',
    title: 'ZERO END',
    icon: '◈',
    gradient: 'linear-gradient(135deg, #a78bfa, #ec4899, #f97316)',
    color: '#a78bfa',
    description: '你触发了零点协议，看到了一切的源头',
    subtitle: '觉醒者'
  }
}

/**
 * 计算结局 - 路径权重主导模式
 */
export function calculateEnding(gameData) {
  const { choices, specialFlags, hiddenOptionsFound, endingWeights, behaviorTags, npcRelations } = gameData

  // 1. 检查隐藏结局（ZERO） - 最高优先级
  const zeroEnding = checkZeroEnding(specialFlags, hiddenOptionsFound)
  if (zeroEnding) {
    return {
      type: ENDING_TYPES.ZERO_END,
      variant: ENDING_VARIANTS.COMPLETE,
      ...ENDING_INFO[ENDING_TYPES.ZERO_END],
      secretVariant: zeroEnding,
      isSecret: true,
      behaviorAnalysis: analyzeBehavior(behaviorTags, npcRelations)
    }
  }

  // 2. 根据路径权重决定基础结局
  if (!endingWeights || Object.keys(endingWeights).length === 0) {
    return getFallbackEnding(gameData)
  }

  const dominantEnding = getDominantPath(endingWeights)

  // 3. 使用行为质量计算亚型
  const qualityModifiers = calculateQualityModifiers(behaviorTags, hiddenOptionsFound, npcRelations)
  const variant = determineVariant(dominantEnding, qualityModifiers)

  return {
    type: dominantEnding,
    variant,
    ...ENDING_INFO[dominantEnding],
    score: Math.max(...Object.values(endingWeights)),
    isSecret: false,
    behaviorAnalysis: analyzeBehavior(behaviorTags, npcRelations),
    qualityModifiers
  }
}

/**
 * 获取主导路径 - 权重最高者胜出
 */
function getDominantPath(weights) {
  const { truth = 0, escape = 0, backfire = 0, zero = 0, secret = 0 } = weights

  // 如果有 zero 或 secret 权重且达到阈值，优先考虑隐藏路径
  if ((zero + secret) >= 3) {
    return null // 让隐藏结局检测逻辑处理
  }

  const pathScores = {
    [ENDING_TYPES.TRUTH_END]: truth,
    [ENDING_TYPES.ESCAPE_END]: escape,
    [ENDING_TYPES.BACKFIRE_END]: backfire
  }

  const maxScore = Math.max(...Object.values(pathScores))
  if (maxScore === 0) return ENDING_TYPES.ESCAPE_END

  // 找出得分最高的路径
  return Object.entries(pathScores).find(([type, score]) => score === maxScore)?.[0]
        || ENDING_TYPES.ESCAPE_END
}

/**
 * 行为质量修正指标
 */
function calculateQualityModifiers(behaviorTags, hiddenOptionsFound, npcRelations) {
  const tags = behaviorTags || {}
  const total = Object.values(tags).reduce((a, b) => a + b, 0)
  
  // 一致性：决策风格是否稳定
  const tagValues = Object.values(tags)
  const maxTag = Math.max(...tagValues)
  const consistency = total > 0 ? maxTag / total : 0.5

  // 风险偏好：激进+欺骗 vs 谨慎+保护
  const riskStyle = ((tags.aggressive || 0) + (tags.deceptive || 0)) -
                   ((tags.cautious || 0) + (tags.protective || 0))

  // 信任倾向：合作 vs 独占
  const trustStyle = (tags.cooperative || 0) - (tags.deceptive || 0)

  // 探索深度
  const hiddenDepth = hiddenOptionsFound || 0

  // NPC 关系均衡度
  const relationValues = Object.values(npcRelations || {})
  const relationVariance = Math.max(...relationValues) - Math.min(...relationValues)

  return {
    consistency,
    riskStyle,
    trustStyle,
    hiddenDepth,
    relationVariance,
    isHighConsistency: consistency > 0.6,
    isHighRisk: riskStyle > 1,
    isTruster: trustStyle > 0,
    isDeepExplorer: hiddenDepth >= 2
  }
}

/**
 * 根据质量修正决定结局亚型
 */
function determineVariant(endingType, modifiers) {
  switch (endingType) {
    case ENDING_TYPES.TRUTH_END:
      if (modifiers.isHighConsistency && modifiers.isDeepExplorer) {
        return ENDING_VARIANTS.COMPLETE       // 真相揭露·完全版
      } else if (!modifiers.isHighConsistency) {
        return ENDING_VARIANTS.FRAGMENTED     // 真相揭露·残缺版
      }
      return ENDING_VARIANTS.COMPLETE

    case ENDING_TYPES.ESCAPE_END:
      if (modifiers.isDeepExplorer) {
        return ENDING_VARIANTS.INFORMED       // 独自逃生·知情版
      }
      return ENDING_VARIANTS.COMPLETE

    case ENDING_TYPES.BACKFIRE_END:
      if (modifiers.isHighRisk) {
        return ENDING_VARIANTS.SELF_TRAPPED   // 反噬困局·自陷版
      }
      return ENDING_VARIANTS.COMPLETE

    default:
      return ENDING_VARIANTS.COMPLETE
  }
}

/**
 * 行为分析 - 生成行为侧写描述
 */
function analyzeBehavior(behaviorTags, npcRelations) {
  const tags = behaviorTags || {}
  const relations = npcRelations || {}

  // 主导行为标签
  const sortedTags = Object.entries(tags).sort((a, b) => b[1] - a[1])
  const dominantTag = sortedTags[0]?.[0] || 'balanced'
  const dominantPct = sortedTags.length > 0 
    ? Math.round((sortedTags[0][1] / Object.values(tags).reduce((a,b)=>a+b,0)) * 100) 
    : 0

  // NPC 关系总结
  const relationSummary = {}
  Object.entries(relations).forEach(([npc, val]) => {
    if (val >= 20) relationSummary[npc] = '信任'
    else if (val <= -20) relationSummary[npc] = '警惕'
    else relationSummary[npc] = '中立'
  })

  // 行为特征描述
  const traits = []
  if ((tags.cooperative || 0) > 1) traits.push('倾向于合作共享')
  if ((tags.deceptive || 0) > 1) traits.push('擅长策略性隐瞒')
  if ((tags.cautious || 0) > 1) traits.push('行事谨慎周全')
  if ((tags.aggressive || 0) > 1) traits.push('敢于正面冲突')
  if ((tags.curious || 0) > 2) traits.push('有强烈探索欲')
  if ((tags.protective || 0) > 1) traits.push('会主动保护他人')

  return {
    dominantTag,
    dominantPct,
    allTags: tags,
    relationSummary,
    traits,
    profileText: generateProfileText(dominantTag, traits)
  }
}

/**
 * 生成行为侧写文案（行为口吻，非测试口吻）
 */
function generateProfileText(dominantTag, traits) {
  const profiles = {
    cooperative: '在高压情境中，你更倾向公开行动和建立联盟。',
    deceptive: '你善于在信息不对称中寻找机会，策略性很强。',
    cautious: '你在做出决定前会仔细权衡风险，不轻易暴露底牌。',
    aggressive: '面对阻碍时，你选择正面突破而非迂回。',
    curious: '你对未知事物有强烈的探索欲，总能发现被忽略的细节。',
    protective: '你会优先考虑他人的安危，即使这可能会让自己处于不利位置。',
    balanced: '你的行为模式比较灵活，能根据情境调整策略。'
  }

  return profiles[dominantTag] || profiles.balanced
}

/**
 * 检查隐藏结局触发条件
 */
function checkZeroEnding(flags, hiddenCount) {
  const flagCount = Object.keys(flags || {}).length

  // 收集 3+ 个特殊标记 + 发现隐藏选项 → 零点觉醒
  if (flagCount >= 3 && hiddenCount >= 2) {
    return 'collector'
  }

  // 特殊组合
  const rareCombinations = [
    ['puzzle', 'seeker'],
    ['puzzle', 'truth'],
    ['seeker', 'truth'],
    ['guardian', 'zero']
  ]

  for (const combo of rareCombinations) {
    if (combo.every(f => flags[f])) {
      return combo.join('_')
    }
  }

  // 单独 zero 标记
  if (flags['zero'] && hiddenCount >= 1) {
    return 'zero_alone'
  }

  return null
}

/**
 * 兜底结局
 */
function getFallbackEnding(gameData) {
  const { choices } = gameData
  
  if (!choices || choices.length < 3) {
    return {
      type: ENDING_TYPES.BACKFIRE_END,
      variant: ENDING_VARIANTS.FRAGMENTED,
      ...ENDING_INFO[ENDING_TYPES.BACKFIRE_END],
      score: 20,
      isBad: true,
      behaviorAnalysis: analyzeBehavior({}, {})
    }
  }

  // 基于简单一致性判断
  const dimScores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
  choices.forEach(choice => {
    if (choice.dimensions) {
      choice.dimensions.forEach(dim => {
        if (dimScores[dim] !== undefined) dimScores[dim]++
      })
    }
  })

  const values = Object.values(dimScores)
  const maxScore = Math.max(...values)
  const totalScore = values.reduce((a, b) => a + b, 0)
  const consistency = totalScore > 0 ? (maxScore / totalScore) : 0.5

  let baseType = ENDING_TYPES.ESCAPE_END

  if (consistency >= 0.55) {
    baseType = ENDING_TYPES.TRUTH_END
  } else if (consistency < 0.35) {
    baseType = ENDING_TYPES.BACKFIRE_END
  }

  return {
    type: baseType,
    variant: ENDING_VARIANTS.COMPLETE,
    ...ENDING_INFO[baseType],
    score: Math.round(consistency * 100),
    isBad: baseType === ENDING_TYPES.BACKFIRE_END,
    behaviorAnalysis: analyzeBehavior({}, {})
  }
}

/**
 * 获取结局描述文案
 */
export function getEndingText(endingType, mbtiType, variant) {
  const variants = {
    [ENDING_TYPES.TRUTH_END]: {
      [ENDING_VARIANTS.COMPLETE]: {
        title: `💡 ${mbtiType} · 真相揭露`,
        main: `你选择了公开所有证据。广播沉默了三秒，然后响起："判定通过。04号，你是这次测试中唯一一个选择直面真相的人。"`,
        sub: `铁门缓缓打开。暴雨灌入，但也带来了新鲜空气。`,
        quote: `"有些真相很沉重，但只有扛得住的人才能看见黎明。"`,
        achievement: '成就解锁：真相揭露者 💡'
      },
      [ENDING_VARIANTS.FRAGMENTED]: {
        title: `💡 ${mbtiType} · 真相揭露`,
        main: `你试图揭开真相，但有些关键线索永远丢失了...`,
        sub: `部分真相浮出水面，但完整的画面始终无法拼凑。`,
        quote: `"真相往往藏在最危险的地方——而你只触碰了边缘。"`,
        suggestion: '💡 提示：下次试着更深入地探索每一个角落'
      }
    },
    [ENDING_TYPES.ESCAPE_END]: {
      [ENDING_VARIANTS.COMPLETE]: {
        title: `🚪 ${mbtiType} · 独自逃生`,
        main: `你选择了生存。投票结果出来了——律师被选为"知情者"。他平静地交出了钥匙："至少，有一个人能出去。"`,
        sub: `你和其他人依次走出铁门。回头时，你看到律师坐在台阶上，点了一根烟。`,
        quote: `"活着本身就是一种答案。只是有些人会一直问自己，当初是不是该选另一条路。"`,
        achievement: null
      },
      [ENDING_VARIANTS.INFORMED]: {
        title: `🚪 ${mbtiType} · 独自逃生`,
        main: `你选择了离开，但你带走了一些不该知道的东西...`,
        sub: `活着离开灯塔，但真相的碎片会在每个雨夜困扰你。`,
        quote: `"你知道得比表面上多。这就是最大的负担。"`,
        achievement: null
      }
    },
    [ENDING_TYPES.BACKFIRE_END]: {
      [ENDING_VARIANTS.COMPLETE]: {
        title: `⚠️ ???. · 反噬困局`,
        main: `你以为掌控了局面。但当伸手去拿钥匙的时候——手环突然收紧。`,
        sub: `"04号，你在测试中表现出的欺骗倾向，超过了我们的预期。"原来，这场测试测的不是"谁是知情者"——而是"谁在伪装无辜"。`,
        quote: `"最可怕的陷阱，是你以为自己在猎人位置的时候。"`,
        suggestion: '⚠️ 提示：每个选择都有代价。了解你的决策模式，或许下次能改变结局'
      },
      [ENDING_VARIANTS.SELF_TRAPPED]: {
        title: `⚠️ ???. · 反噬困局`,
        main: `你的策略性选择最终反噬了自己。你精心编织的网，困住了最不该困住的人——你自己。`,
        sub: `铁门没有打开。其余三人看着你的眼神变了。`,
        quote: `"当你凝视深渊时，深渊也在凝视你——而这次，深渊先眨眼了。"`,
        suggestion: '⚠️ 提示：过度的策略有时会成为枷锁'
      }
    },
    [ENDING_TYPES.ZERO_END]: {
      [ENDING_VARIANTS.COMPLETE]: {
        title: `◈ ${mbtiType} · 零点觉醒`,
        main: `你破解了广播系统。屏幕上显示的不是密码验证界面，而是一段视频——三年前的录像。`,
        sub: `"你好，04号。或者说——我应该叫你'当年的英雄'。那12小时里，你回到船上救了三个人。"`,
        quote: `"谢谢你。再一次。"`,
        achievement: '🏆 成就解锁：零点守护者 ◈ (稀有!)'
      }
    }
  }

  // 如果指定了亚型，优先返回；否则返回默认
  if (variant && variants[endingType]?.[variant]) {
    return variants[endingType][variant]
  }
  
  return variants[endingType]?.[ENDING_VARIANTS.COMPLETE] || {}
}
