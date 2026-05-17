/**
 * TTS 配置 - 灯塔零点协议语音合成系统 (Vue 版)
 *
 * 包含：
 * 1. NPC 音色配置
 * 2. 情绪标签映射
 * 3. 场景配音规则
 * 4. 结局语音风格
 * 5. 关键剧情台词
 * 6. 性能优化配置
 * 7. 用户体验配置
 *
 * 注意：API 配置已移至 tts.js 中管理
 */

export const TTS_CONFIG = {
  voices: {
    npc: {
      lawyer: {
        id: '苏打',
        description: '成熟男性，声音低沉冷峻，语速偏慢，带着理性和距离感',
        defaultStyle: '(冷漠, 低沉) '
      },
      nurse: {
        id: '冰糖',
        description: '年轻女性，声音温柔但脆弱，容易带出恐惧和不安',
        defaultStyle: '(颤抖, 温柔) '
      },
      reporter: {
        id: '白桦',
        description: '中年男性，声音锐利急促，带有记者的敏锐和紧迫感',
        defaultStyle: '(急促, 激动) '
      }
    },

    system: {
      narrator: {
        id: '白桦',
        description: '神秘旁白，像深夜电台主持人，低沉沙哑，语速极慢',
        customPrompt: `角色：一位经历过那场海难的老灯塔看守者，声音里带着岁月和秘密的重量。
场景：在暴风雨夜，对着录音机讲述那段被掩盖的真相。
指导：低沉沙哑的男声，像深夜电台主持人，语速极慢，每个字都像是在回忆。
- 气息：带着轻微的烟草味和海风咸味
- 停顿：在关键处留下令人不安的空白
- 尾音：某些词句末尾加入极轻的叹息`,
        model: 'mimo-v2.5-tts-voicedesign'
      },
      broadcast: {
        id: '苏打',
        description: '机械合成音，冰冷无感情，毫无起伏',
        defaultStyle: '(机械, 冰冷, 毫无起伏) '
      }
    },

    protagonist: {
      id: '茉莉',
      description: '中性声音，适合内心独白，平静但可以带入情绪',
      defaultStyle: '(平静) '
    }
  },

  emotions: {
    basic: {
      calm: '(平静) ',
      happy: '(开心) ',
      sad: '(悲伤) ',
      angry: '(愤怒) ',
      fearful: '(恐惧) ',
      surprised: '(惊讶) ',
      excited: '(兴奋) ',
      wronged: '(委屈) ',
      indifferent: '(冷漠) '
    },

    complex: {
      suppressedAnger: '(压抑的愤怒) ',
      smilingThroughTears: '(带着哽咽的笑意) ',
      gentleButTired: '(温柔但疲惫) ',
      manicGentle: '(狂躁中的温柔) ',
      melancholy: '(怅然) ',
      relieved: '(欣慰) ',
      helpless: '(无奈) ',
      guilty: '(愧疚) ',
      released: '(释然) ',
      jealous: '(嫉妒) ',
      weary: '(厌倦) ',
      anxious: '(忐忑) ',
      emotional: '(动情) '
    },

    tone: {
      gentle: '(温柔) ',
      cold: '(高冷) ',
      lively: '(活泼) ',
      serious: '(严肃) ',
      lazy: '(慵懒) ',
      playful: '(俏皮) ',
      deep: '(深沉) ',
      capable: '(干练) ',
      sharp: '(凌厉) '
    },

    texture: {
      magnetic: '(磁性) ',
      mellow: '(醇厚) ',
      clear: '(清亮) ',
      ethereal: '(空灵) ',
      tender: '(稚嫩) ',
      aged: '(苍老) ',
      sweet: '(甜美) ',
      husky: '(沙哑) ',
      elegant: '(醇雅) '
    },

    specialEffects: {
      breathIn: '(吸气) ',
      deepBreath: '(深呼吸) ',
      sigh: '(叹气) ',
      longSigh: '(长叹一口气) ',
      panting: '(喘息) ',
      holdBreath: '(屏息) ',
      nervous: '(紧张) ',
      scared: '(害怕) ',
      agitated: '(激动) ',
      exhausted: '(疲惫) ',
      wrongedAct: '(委屈) ',
      coquettish: '(撒娇) ',
      guiltyAct: '(心虚) ',
      shocked: '(震惊) ',
      impatient: '(不耐烦) ',
      trembling: '(颤抖) ',
      voiceTrembling: '(声音颤抖) ',
      outOfTune: '(变调) ',
      crackedVoice: '(破音) ',
      nasal: '(鼻音) ',
      breathy: '(气声) ',
      huskyVoice: '(沙哑) ',
      laugh: '(笑) ',
      lightLaugh: '(轻笑) ',
      loudLaugh: '(大笑) ',
      coldLaugh: '(冷笑) ',
      sobbing: '(抽泣) ',
      whimpering: '(呜咽) ',
      chokedUp: '(哽咽) ',
      wailing: '(嚎啕大哭) ',
      coughing: '(咳嗽) ',
      shout: '(提高音量喊话) '
    }
  },

  sceneRules: {
    chapterIntro: { voiceType: 'narrator', emotion: 'deep' },
    sceneDescription: { voiceType: 'narrator', emotion: 'calm' },
    npcDialogue: { dynamicEmotion: true },
    broadcast: { voiceType: 'broadcast', emotion: 'indifferent' },
    innerThought: { voiceType: 'protagonist', emotion: 'calm' }
  },

  endingStyles: {
    truth: { emotion: '(释然, 温暖) ', pacing: '中速，带着尘埃落定的轻松感' },
    escape: { emotion: '(疲惫但庆幸) ', pacing: '缓慢，劫后余生的虚脱感' },
    backfire: { emotion: '(绝望, 崩溃) ', pacing: '急促且不稳定' },
    zero: { emotion: '(平静, 超脱) ', pacing: '极慢，如同从高处俯瞰' },
    secret: { emotion: '(神秘, 低语) ', pacing: '缓慢，带着秘密分享者的谨慎' }
  },

  keyDialogues: {
    chapter1: [
      { id: 'ch1_intro_1', text: '暴雨夜，海浪拍打着礁石。你在一座废弃灯塔的二层醒来，头痛欲裂。', speaker: 'narrator', emotion: '(低沉, 缓慢, 带着不祥的预感) ', priority: 'high' },
      { id: 'ch1_broadcast_1', text: '欢迎来到零点协议。你们之中，有一个人知道三年前"海鸥号"沉船案的真相。想活着离开，就把他交出来。', speaker: 'broadcast', emotion: '(机械, 冰冷, 毫无起伏) ', priority: 'high' },
      { id: 'ch1_lawyer_1', text: '我是律师，我只相信证据。你的感情用事，救不了任何人。', speaker: 'lawyer', emotion: '(冷漠, 理性) ', priority: 'medium' },
      { id: 'ch1_nurse_1', text: '别、别过来……我什么都不知道……求你们别看我……', speaker: 'nurse', emotion: '(颤抖, 害怕, 抽泣) ', priority: 'high' },
      { id: 'ch1_reporter_1', text: '你们听我说！这绝对不是意外！我在现场看到了——', speaker: 'reporter', emotion: '(急促, 激动, 提高音量) ', priority: 'medium' }
    ],
    chapter2: [
      { id: 'ch2_reporter_1', text: '我们共享信息吧？我也告诉你我在档案袋里看到了什么。', speaker: 'reporter', emotion: '(试探, 期待) ', priority: 'high' },
      { id: 'ch2_nurse_1', text: '她的目光时不时飘向你……她似乎知道些什么。', speaker: 'narrator', emotion: '(神秘, 低沉) ', priority: 'medium' }
    ],
    chapter3: [
      { id: 'ch3_intro_1', text: '你的手在发抖。你不记得这件事。那段空白的12小时……没人知道发生了什么。', speaker: 'narrator', emotion: '(压抑的不安, 缓慢) ', priority: 'high' },
      { id: 'ch3_reporter_1', text: '我刚对比了名单和律师的证词——他在撒谎。他说那天晚上他在甲板上，但名单显示他在船舱底层。', speaker: 'reporter', emotion: '(确信, 激动, 揭秘时的兴奋) ', priority: 'high' },
      { id: 'ch3_nurse_1', text: '我...我想起来了。我认得这个被划掉的名字。', speaker: 'nurse', emotion: '(颤抖, 颤音, 极度紧张) ', priority: 'high' }
    ],
    chapter4: [
      { id: 'ch4_broadcast_1', text: '距离零点还有15分钟。出口即将锁定。提醒：投票功能已开启。', speaker: 'broadcast', emotion: '(机械, 但带有一丝人味的威胁) ', priority: 'high' },
      { id: 'ch4_narrator_1', text: '三条路摆在面前，但你知道……还有第四条。', speaker: 'narrator', emotion: '(意味深长, 停顿) ', priority: 'high' }
    ],
    endings: {
      truth: [{ id: 'end_truth_1', text: '真相……终于大白于天下。虽然过程痛苦，但至少，我们知道了答案。', speaker: 'narrator', emotion: '(释然, 温暖, 长叹一口气) ', priority: 'high' }],
      escape: [{ id: 'end_escape_1', text: '我们……活下来了。这就是最重要的，对吗？', speaker: 'narrator', emotion: '(疲惫但庆幸, 苦笑) ', priority: 'high' }],
      backfire: [{ id: 'end_backfire_1', text: '不……这不对……一切都错了……', speaker: 'narrator', emotion: '(绝望, 崩溃, 哽咽) ', priority: 'high' }],
      zero: [{ id: 'end_zero_1', text: '归零。一切回归原点。也许……这才是最好的结局。', speaker: 'narrator', emotion: '(平静, 超脱, 空灵) ', priority: 'high' }],
      secret: [{ id: 'end_secret_1', text: '有些秘密，一旦知道就无法遗忘。而你……选择了背负它。', speaker: 'narrator', emotion: '(神秘, 低语, 气声) ', priority: 'high' }]
    }
  },

  performance: {
    preload: { currentChapter: true, nextChapter: true },
    formatPreference: ['wav', 'mp3', 'ogg'],
    maxConcurrentDownloads: 3,
    cache: { enabled: true, maxSize: 50 * 1024 * 1024, ttl: 24 * 60 * 60 * 1000 }
  },

  ux: {
    defaults: { enabled: true, volume: 0.8, autoPlay: true, showSubtitle: true },
    subtitleSync: { enabled: true, highlightClass: 'tts-speaking', highlightColor: '#fbbf24' },
    skipButtonDelay: 2,
    maxRetries: 2
  }
};
