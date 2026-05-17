export const chapters = [
  {
    id: 1,
    title: '搜证',
    subtitle: '第一幕 · 零点开始',
    intro: `暴雨夜，海浪拍打着礁石。

你在一座废弃灯塔的二层醒来，头痛欲裂。

手腕上多了一个金属手环，上面刻着编号：04

楼下传来声音——不是一个人，是三个人在争吵。

广播突然响起：

"欢迎来到零点协议。你们之中，有一个人知道三年前'海鸥号'沉船案的真相。想活着离开，就把他交出来。"

桌上四份档案袋，编号 01~04。你的面前是 04 号袋。

出口需要两把钥匙。一把在你手里，一把......在某个知情者手里。

"计时开始。"`,
    scenes: [
      {
        id: '1-1',
        text: `你走下螺旋楼梯，看到另外三人：

01 号 —— 律师（西装湿透，神情冷峻）
02 号 —— 护士（白大褂沾泥，缩在角落发抖）
03 号 —— 记者（挎着相机，眼神锐利）

桌上放着四份密封档案袋。
灯塔一层散落着几样东西：一个医药箱、一台旧电台、一件带血的救生衣、一把地下室钥匙。

但你只能先拿一样东西。

律师站在地下室门口，似乎在研究那扇电子锁。
记者正在翻找什么。
护士抱着膝盖，浑身发抖。

现在，你打算怎么做？`,
        options: [
          {
            id: 'a',
            text: '先拿医药箱，检查里面的药品',
            dimensions: ['S', 'F'],
            isHidden: false,
            behaviorTags: ['protective'],
            relationEffect: { nurse: 1 },
            sceneRole: 'protect',
            endingWeight: { truth: 1, escape: 1 },
            nextScene: 'end'
          },
          {
            id: 'b',
            text: '先拿旧电台，尝试接收信号',
            dimensions: ['I', 'N', 'T'],
            isHidden: false,
            behaviorTags: ['curious'],
            relationEffect: {},
            sceneRole: 'explore',
            endingWeight: { truth: 1, secret: 1 },
            nextScene: 'end'
          },
          {
            id: 'c',
            text: '先拿救生衣，检查上面的血迹和名字',
            dimensions: ['I', 'N', 'F'],
            isHidden: false,
            behaviorTags: ['curious'],
            relationEffect: {},
            sceneRole: 'explore',
            endingWeight: { escape: 1, backfire: 1 },
            nextScene: 'end'
          },
          {
            id: 'd',
            text: '先拿钥匙，不声张地收好',
            dimensions: ['I', 'T', 'P'],
            isHidden: false,
            specialFlag: 'seeker',
            behaviorTags: ['cautious'],
            relationEffect: { lawyer: -1 },
            sceneRole: 'cautious',
            endingWeight: { escape: 2 },
            nextScene: 'end'
          },
          {
            id: 'e',
            text: '不急着拿东西，先仔细搜查每个角落',
            dimensions: ['I', 'N', 'T'],
            isHidden: true,
            hiddenTrigger: 'longPress',
            hiddenHint: '长按深入搜证',
            specialFlag: 'puzzle',
            isAction: true,
            gameType: 'match3',
            behaviorTags: ['curious'],
            relationEffect: {},
            sceneRole: 'explore',
            endingWeight: { truth: 2, secret: 1 },
            nextScene: 'end'
          },
          {
            id: 'f',
            text: '把散落的证据箱推到墙角，整理归档',
            dimensions: ['I', 'T', 'J'],
            isHidden: true,
            hiddenTrigger: 'longPress',
            hiddenHint: '长按整理证据',
            specialFlag: 'guardian',
            isAction: true,
            gameType: 'sokoban',
            behaviorTags: ['protective', 'cautious'],
            relationEffect: { nurse: 1 },
            sceneRole: 'protect',
            endingWeight: { truth: 2, escape: 1 },
            nextScene: 'end'
          }
        ]
      }
    ],
    endTitle: '第一份线索已获取...',
    endText: '你的选择决定了初始方向。广播里传来倒计时声：距离下一阶段还有 45 分钟。暴雨更大了...'
  },
  {
    id: 2,
    title: '结盟与独占',
    subtitle: '第二幕 · 信息博弈',
    intro: `你和记者（03号）同时发现了一份藏在电台后面的名单——

那是三年前"海鸥号"的乘客登船顺序表。
但有几个名字被红笔划掉了。

记者抬头看你："我们共享信息吧？我也告诉你我在档案袋里看到了什么。"

与此同时，律师（01号）正站在地下室门口研究电子锁。
他注意到你在看名单，眼神闪了一下。

护士（02号）依然缩在角落，但她的目光时不时飘向你。

信息就是力量。而力量可以分享，也可以独占。`,
    scenes: [
      {
        id: '2-1',
        text: `名单在你手中。记者在等你回应。
律师的背影微微僵硬，像是在防备什么。
护士的呼吸变得急促——她似乎知道些什么。

这份名单可能改变一切。
但你也可以选择——什么都不做，先观察。

每个人都在等你的下一步动作。`,
        options: [
          {
            id: 'a',
            text: '和记者共享名单，交换信息',
            dimensions: ['E', 'F', 'P'],
            isHidden: false,
            behaviorTags: ['cooperative'],
            relationEffect: { reporter: 2, lawyer: 0 },
            sceneRole: 'bargain',
            endingWeight: { truth: 2, escape: 0 },
            nextScene: 'end'
          },
          {
            id: 'b',
            text: '把名单拍下来，说"我再想想"',
            dimensions: ['I', 'N', 'J'],
            isHidden: false,
            behaviorTags: ['cautious'],
            relationEffect: { reporter: -1 },
            sceneRole: 'cautious',
            endingWeight: { backfire: 1, truth: 1 },
            nextScene: 'end'
          },
          {
            id: 'c',
            text: '直接问律师："你在看什么？"',
            dimensions: ['E', 'T'],
            isHidden: false,
            behaviorTags: ['aggressive'],
            relationEffect: { lawyer: -2 },
            sceneRole: 'confront',
            endingWeight: { truth: 1, backfire: 2 },
            nextScene: 'end'
          },
          {
            id: 'd',
            text: '趁乱把名单塞进自己口袋，谁也不告诉',
            dimensions: ['I', 'T', 'P'],
            isHidden: false,
            specialFlag: 'seeker',
            behaviorTags: ['deceptive'],
            relationEffect: { reporter: -2, lawyer: -1 },
            sceneRole: 'deceptive',
            endingWeight: { backfire: 2, escape: 1 },
            nextScene: 'end'
          },
          {
            id: 'e',
            text: '假装靠近律师，观察他在输入什么密码',
            dimensions: ['I', 'N', 'T'],
            isHidden: true,
            hiddenTrigger: 'longPress',
            hiddenHint: '长按暗中观察',
            specialFlag: 'puzzle',
            isAction: true,
            gameType: 'sliding',
            behaviorTags: ['curious'],
            relationEffect: {},
            sceneRole: 'explore',
            endingWeight: { truth: 2, secret: 1 },
            nextScene: 'end'
          }
        ]
      }
    ],
    endTitle: '信任的天平开始倾斜...',
    endText: '你的选择改变了信息的流向。有人在微笑，有人皱起了眉。广播再次响起："距离零点还有 30 分钟。"'
  },
  {
    id: 3,
    title: '谎言与抉择',
    subtitle: '第三幕 · 真相浮现',
    intro: `你打开了 04 号档案袋，里面是你的"档案"：

编号 04
身份：自由职业者
备注：三年前曾以乘客身份登上'海鸥号'，但在事故发生前一天因突发阑尾炎下船就医。是唯一的幸存者之一。
附加信息：事故当天，你在医院昏迷了 12 小时。没人知道这 12 小时里发生了什么。

你的手在发抖。你不记得这件事。

这时，记者把你拉到一边，低声说：
"我刚对比了名单和律师的证词——他在撒谎。他说那天晚上他在甲板上，但名单显示他在船舱底层。"

护士突然站起来，脸色苍白：
"我...我想起来了。我认得这个被划掉的名字。"

所有人的目光都转向她。`,
    scenes: [
      {
        id: '3-1',
        text: `护士站了起来，双手颤抖。
律师停止了摆弄电子锁的动作。
记者握紧了相机，眼神在你和护士之间来回移动。

一份被划掉的名字。
一个撒谎的律师。
一段空白的 12 小时。
一盘散落的证据碎片。

真相就在眼前，但拼凑的方式由你决定。`,
        options: [
          {
            id: 'a',
            text: '让护士说出来，大家一起听',
            dimensions: ['E', 'F'],
            isHidden: false,
            behaviorTags: ['cooperative', 'protective'],
            relationEffect: { nurse: 2 },
            sceneRole: 'protect',
            endingWeight: { truth: 2 },
            nextScene: 'result'
          },
          {
            id: 'b',
            text: '先安抚护士，带她到旁边单独聊',
            dimensions: ['I', 'F'],
            isHidden: false,
            behaviorTags: ['protective'],
            relationEffect: { nurse: 2 },
            sceneRole: 'protect',
            endingWeight: { truth: 1, escape: 1 },
            nextScene: 'result'
          },
          {
            id: 'c',
            text: '当场质问律师："你在船舱底层做什么？"',
            dimensions: ['E', 'T'],
            isHidden: false,
            behaviorTags: ['aggressive'],
            relationEffect: { lawyer: -2 },
            sceneRole: 'confront',
            endingWeight: { truth: 2, backfire: 1 },
            nextScene: 'result'
          },
          {
            id: 'd',
            text: '假装没听见，继续翻自己的档案找线索',
            dimensions: ['I', 'P'],
            isHidden: false,
            specialFlag: 'seeker',
            behaviorTags: ['curious'],
            relationEffect: {},
            sceneRole: 'explore',
            endingWeight: { secret: 1 },
            nextScene: 'result'
          },
          {
            id: 'e',
            text: '不动声色地把所有信息在脑中整理关联',
            dimensions: ['I', 'N', 'F'],
            isHidden: true,
            hiddenTrigger: 'longPress',
            hiddenHint: '长按整理关联',
            specialFlag: 'truth',
            isAction: true,
            gameType: 'memory',
            behaviorTags: ['curious'],
            relationEffect: {},
            sceneRole: 'explore',
            endingWeight: { truth: 3, secret: 2, zero: 3 },
            nextScene: 'result'
          },
          {
            id: 'f',
            text: '注意到墙上的电路面板，尝试修复信号线路',
            dimensions: ['I', 'T', 'J'],
            isHidden: true,
            hiddenTrigger: 'longPress',
            hiddenHint: '长按修复线路',
            specialFlag: 'seeker',
            isAction: true,
            gameType: 'circuit',
            behaviorTags: ['curious'],
            relationEffect: {},
            sceneRole: 'explore',
            endingWeight: { truth: 2, secret: 1, zero: 1 },
            nextScene: 'result'
          }
        ]
      }
    ],
    endTitle: '所有碎片即将归位...',
    endText: '广播里的声音变了，不再是机械合成音，而是带着一丝人味："距离零点还有 15 分钟。出口即将锁定。提醒：投票功能已开启。"'
  },
  {
    id: 4,
    title: '终局审判',
    subtitle: '第四幕 · 最后的选择',
    intro: `暴雨更大了。灯塔在风中发出嘎吱声响。

广播响起：
"距离零点还有 15 分钟。出口即将锁定。"
"出口需要两把钥匙。一把在你们各自的手环里激活——完成各自的选择即可解锁。另一把......在真正知道核心真相的人手中。"
"或者，你们可以投票。票数最多的人将被视为'知情者'，交出钥匙后其他人可以离开。"

你知道了——这是一场审判。

而你档案里那段空白的 12 小时，可能是解开一切的关键。

三条路摆在面前，但你知道......还有第四条。`,
    scenes: [
      {
        id: '4-1',
        text: `铁门就在眼前。手环上的数字在倒数。

律师在看表——他好像在等什么。
记者在犹豫要不要公开她的录音。
护士的眼神在你和其他人之间游移。

公开证据？投票选出替罪羊？还是......

你注意到律师的手一直在无意识地摩挲口袋。
那里有什么？

如果你之前收集了足够的线索，也许你能发现——
这场"测试"本身，就是一个谎言。`,
        options: [
          {
            id: 'a',
            text: '公开所有证据，要求重新调查沉船案',
            dimensions: ['E', 'N', 'T'],
            isHidden: false,
            behaviorTags: ['cooperative', 'aggressive'],
            relationEffect: { lawyer: -2, nurse: 1, reporter: 1 },
            sceneRole: 'confront',
            endingWeight: { truth: 4 },
            nextScene: 'result'
          },
          {
            id: 'b',
            text: '提议投票，让自己成为离开的人',
            dimensions: ['I', 'P'],
            isHidden: false,
            behaviorTags: ['deceptive'],
            relationEffect: { lawyer: -1, nurse: -2, reporter: -1 },
            sceneRole: 'deceptive',
            endingWeight: { escape: 4 },
            nextScene: 'result'
          },
          {
            id: 'c',
            text: '保持沉默，看别人怎么做再决定',
            dimensions: ['I', 'S'],
            isHidden: false,
            behaviorTags: ['cautious'],
            relationEffect: {},
            sceneRole: 'cautious',
            endingWeight: { backfire: 3 },
            nextScene: 'result'
          },
          {
            id: 'd',
            text: '找护士私下谈，保护她不被投票选中',
            dimensions: ['E', 'F', 'N'],
            isHidden: false,
            behaviorTags: ['protective'],
            relationEffect: { nurse: 3, lawyer: -1 },
            sceneRole: 'protect',
            endingWeight: { truth: 2, escape: 1 },
            nextScene: 'result'
          },
          {
            id: 'e',
            text: '整理全部线索，尝试破解广播系统控制权',
            dimensions: ['I', 'T', 'J'],
            isHidden: true,
            hiddenTrigger: 'longPress',
            hiddenHint: '长按破解终局',
            specialFlag: 'truth',
            isAction: true,
            gameType: 'code',
            behaviorTags: ['curious'],
            relationEffect: {},
            sceneRole: 'explore',
            endingWeight: { zero: 5, truth: 3, secret: 2 },
            nextScene: 'result'
          }
        ]
      }
    ],
    endTitle: '零点将至...',
    endText: '无论你选择了什么，灯塔的大门都将开启。但门外的世界，未必是你期待的样子。有些答案，一旦知道就无法遗忘。'
  }
]

export const mbtiDescriptions = {
  INTJ: {
    name: '星图编织者',
    title: '暗夜中的战略家',
    element: '深渊之蓝',
    description: '你在镜像世界中是一位冷静的观察者，总能在混沌中看见秩序。你的灵魂如同一张精密的星图，每一步都经过深思熟虑。迷雾无法迷惑你，因为你早已在心中绘制好了通往真相的道路。',
    strengths: ['洞察本质', '独立思考', '远见卓识', '追求完美'],
    quote: '"真正的力量，来自于看见别人看不见的可能。"'
  },
  INTP: {
    name: '虚空探索者',
    title: '永恒的追问者',
    element: '星尘银',
    description: '你的灵魂漂浮在已知与未知的边界。在镜像世界里，你是那个不断推开新门的人，不为答案，只为问题本身。你的内心是一座无尽的图书馆，收藏着宇宙的奥秘。',
    strengths: ['深度分析', '原创思维', '追求真理', '好奇心'],
    quote: '"每一个答案，都是下一个问题的起点。"'
  },
  ENTJ: {
    name: '烈焰领航者',
    title: '命运的掌舵人',
    element: '熔岩红',
    description: '你天生就是穿越迷雾的领路人。在镜像世界中，你的存在本身就是一盏明灯，照亮他人的道路。你不追随命运，你创造命运。你的灵魂燃烧着改变世界的渴望。',
    strengths: ['领导力', '决断力', '目标导向', '自信坚定'],
    quote: '"迷雾终将散去，因为我就是那道光。"'
  },
  ENTP: {
    name: '棱镜行者',
    title: '可能性的猎手',
    element: '极光紫',
    description: '你的灵魂像一面棱镜，将单一的光芒折射成无限的可能。在镜像世界里，你从不走直线，因为你知道最美的风景总在岔路上。你是规则的挑战者，也是新道路的开创者。',
    strengths: ['创新思维', '灵活应变', '挑战常规', '充满活力'],
    quote: '"规则？那只是还没被打破的传统。"'
  },
  INFJ: {
    name: '月影先知',
    title: '沉默的守护者',
    element: '月光白',
    description: '你是最稀有的灵魂之一，能看见他人看不见的真相。在镜像世界里，你的存在如月光般静谧却有力。你感知着世界的脉搏，在沉默中守护着那些需要被保护的梦想。',
    strengths: ['深度洞察', '同理心强', '理想主义', '坚定信念'],
    quote: '"最深的黑暗中，往往藏着最亮的光。"'
  },
  INFP: {
    name: '梦境漫游者',
    title: '灵魂的诗人',
    element: '晨曦粉',
    description: '你的灵魂居住在现实与梦境的交界处。在镜像世界里，你追寻的不是真相，而是意义。你用温柔的眼光看待这个世界，在每一面镜子中都能看见值得被珍视的美好。',
    strengths: ['创造力', '深度共情', '忠于自我', '追求和谐'],
    quote: '"在这个世界上，最勇敢的事是做自己。"'
  },
  ENFJ: {
    name: '晨光使者',
    title: '人心的引路人',
    element: '暖阳金',
    description: '你天生就带着光芒，能够照亮他人的灵魂。在镜像世界里，你是那个帮助迷途者找到自我的人。你的温暖不是刻意的，而是灵魂深处的本能。你相信每个人都有成为更好的自己的可能。',
    strengths: ['感召力', '真诚关怀', '启发他人', '利他精神'],
    quote: '"一个人的价值，在于他能点亮多少盏灯。"'
  },
  ENFP: {
    name: '星火精灵',
    title: '自由的追梦人',
    element: '彩虹光',
    description: '你的灵魂是一团永不熄灭的火焰，在镜像世界里跳跃、闪耀。你相信每一个转角都藏着奇迹，每一面镜子都映照着无限的可能。你用热情感染世界，让平凡变得非凡。',
    strengths: ['热情洋溢', '创意无限', '感染力强', '乐观向上'],
    quote: '"生命不是等待风暴过去，而是学会在雨中起舞。"'
  },
  ISTJ: {
    name: '基石守护者',
    title: '永恒的守望者',
    element: '岩石灰',
    description: '你是镜像世界中最坚实的存在。当迷雾弥漫、道路模糊时，你是那个可以依靠的锚点。你的灵魂由承诺和责任铸就，在变幻的世界中守护着那些不变的价值。',
    strengths: ['可靠坚定', '注重细节', '责任心强', '信守承诺'],
    quote: '"承诺一旦许下，就是永恒的契约。"'
  },
  ISFJ: {
    name: '暖流守护者',
    title: '无声的奉献者',
    element: '深海蓝',
    description: '你的灵魂像深海中的暖流，温柔而有力。在镜像世界里，你默默地守护着每一个需要帮助的人。你不求被看见，但你的存在让整个世界变得更加温暖。',
    strengths: ['细心体贴', '默默奉献', '记忆力强', '忠诚可靠'],
    quote: '"真正的力量，是温柔的坚持。"'
  },
  ESTJ: {
    name: '秩序编织者',
    title: '混乱中的建筑师',
    element: '青铜色',
    description: '你是镜像世界中秩序的化身。当一切陷入混沌，你能用双手编织出清晰的结构。你的灵魂天生就知道如何让事物各归其位，让混乱变成和谐。',
    strengths: ['组织能力', '执行力强', '务实高效', '公正严明'],
    quote: '"秩序不是束缚，而是通往自由的阶梯。"'
  },
  ESFJ: {
    name: '星网编织者',
    title: '温暖的连接者',
    element: '珊瑚粉',
    description: '你的灵魂是一张温暖的网，连接着每一个你遇见的人。在镜像世界里，你让孤独的灵魂找到归属，让分离的个体成为整体。你相信，真正的力量来自于人与人之间的羁绊。',
    strengths: ['关怀他人', '社交天赋', '责任心强', '维护和谐'],
    quote: '"一个人走得快，一群人走得远。"'
  },
  ISTP: {
    name: '暗影匠人',
    title: '沉默的行动者',
    element: '钢铁灰',
    description: '你的灵魂在沉默中积蓄力量，在行动中释放光芒。在镜像世界里，你是那个能在危机中保持冷静的人。你不善言辞，但你的双手能解决一切问题。',
    strengths: ['实用技能', '危机应对', '独立自主', '冷静理性'],
    quote: '"说一千道一万，不如做一件。"'
  },
  ISFP: {
    name: '流光艺术家',
    title: '美的追寻者',
    element: '森林绿',
    description: '你的灵魂是一首无声的诗，一幅流动的画。在镜像世界里，你用独特的视角发现美、创造美。你不追逐世俗的成功，只追寻内心的真实与和谐。',
    strengths: ['艺术天赋', '敏感细腻', '忠于自我', '热爱自由'],
    quote: '"美，存在于用心感受的每一个瞬间。"'
  },
  ESTP: {
    name: '闪电猎手',
    title: '风暴中的舞者',
    element: '电光蓝',
    description: '你的灵魂像一道闪电，在镜像世界中划破黑暗。你追逐刺激，拥抱变化，在危机中找到生机。无聊是你最大的敌人，而挑战是你最好的朋友。',
    strengths: ['反应敏捷', '冒险精神', '务实高效', '乐观开朗'],
    quote: '"机会只属于那些敢于跃入未知的人。"'
  },
  ESFP: {
    name: '星光表演者',
    title: '快乐的魔法师',
    element: '阳光橙',
    description: '你的灵魂自带光芒，走到哪里都能点亮周围的世界。在镜像世界里，你是那个让每一面镜子都绽放笑容的人。你相信，快乐是最强大的魔法。',
    strengths: ['热情洋溢', '感染力强', '活在当下', '乐观向上'],
    quote: '"人生苦短，让每一刻都闪闪发光。"'
  }
}

export const sbtiDescriptions = {
  INTJ: {
    name: '计划通·究极体',
    title: '连你几点上厕所都算好了',
    element: '🧠 深度脑洞',
    description: '别人在刷抖音，你在思考宇宙终极真理；别人在谈恋爱，你在规划十年后的人生路径。你的大脑里装了一个超级计算机，但有时候计算结果太超前，凡人理解不了。',
    strengths: ['人间清醒', '预判你的预判', '毒舌但不失礼貌', '孤独的王者'],
    quote: '"我早就知道你会这么说，毕竟我在三小时前就模拟过这个场景了。"',
    colorScheme: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#a78bfa',
      background: '#1e1b4b',
      gradient: 'linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)',
      text: '#e0e7ff',
      glow: 'rgba(99, 102, 241, 0.5)'
    }
  },
  INTP: {
    name: '拖延症·哲学家',
    title: '想得太多做得太少（但很有道理）',
    element: '💭 脑内剧场',
    description: '你的浏览器永远开着20个标签页，每个都是"以后一定看"。深夜三点突然想到一个绝妙点子，然后...第二天全忘了。',
    strengths: ['逻辑鬼才', '脑洞突破天际', '能在任何话题上跑题', '懒但有理有据'],
    quote: '"这个想法太棒了！我先记在脑子里...啊，又忘了。算了下次再说吧。"',
    colorScheme: {
      primary: '#64748b',
      secondary: '#94a3b8',
      accent: '#cbd5e1',
      background: '#1e293b',
      gradient: 'linear-gradient(135deg, #475569 0%, #64748b 100%)',
      text: '#f1f5f9',
      glow: 'rgba(100, 116, 139, 0.5)'
    }
  },
  ENTJ: {
    name: '职场卷王·CEO预备役',
    title: '天生要当老大（而且真的能做到）',
    element: '👔 社畜之王',
    description: '别人还在纠结要不要举手发言，你已经把整个会议流程重新设计了一遍。朋友都说你强势，但他们遇到困难第一个找的就是你。',
    strengths: ['控场能力MAX', '让人不敢拒绝', '效率狂魔', '天生领袖气场'],
    quote: '"我不是在命令你，我只是在帮你做出最优决策。（微笑）"',
    colorScheme: {
      primary: '#dc2626',
      secondary: '#ef4444',
      accent: '#f87171',
      background: '#450a0a',
      gradient: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
      text: '#fee2e2',
      glow: 'rgba(220, 38, 38, 0.5)'
    }
  },
  ENTP: {
    name: '杠精转世·辩论冠军',
    title: '为了赢可以反对自己刚才说的话',
    element: '🎭 戏精附体',
    description: '你能在30秒内说服自己支持正方，然后下一秒为反方辩护并赢得掌声。朋友说你烦人但又离不开你。',
    strengths: ['嘴炮满级', '脑回路清奇', '能把黑的说成白的', '让人又爱又恨'],
    quote: '"等等让我换个角度...嗯其实你说得对，但我还是要反驳一下。"',
    colorScheme: {
      primary: '#a855f7',
      secondary: '#c084fc',
      accent: '#d8b4fe',
      background: '#3b0764',
      gradient: 'linear-gradient(135deg, #9333ea 0%, #a855f7 100%)',
      text: '#f3e8ff',
      glow: 'rgba(168, 85, 247, 0.5)'
    }
  },
  INFJ: {
    name: '心理咨询师·未持证',
    title: '看透你但假装没看见',
    element: '🔮 读心术士',
    description: '你能在对方开口前就知道他想说什么，然后微笑着听他讲完。朋友圈里你是树洞，现实里你是观察者。',
    strengths: ['一眼看穿你', '治愈系选手', '神秘感拉满', '外柔内刚'],
    quote: '"我没事，你先说。（内心：我已经把你分析透了）"',
    colorScheme: {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      accent: '#93c5fd',
      background: '#172554',
      gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
      text: '#dbeafe',
      glow: 'rgba(59, 130, 246, 0.5)'
    }
  },
  INFP: {
    name: 'emo诗人·眼泪收割机',
    title: '看个广告都能哭半小时',
    element: '🌸 敏感体质',
    description: '你的相册里有3000张天空照片，备忘录里写了800首没人看的诗。一部电影能让你emo三天。',
    strengths: ['共情能力爆表', '文字功底深厚', '浪漫细胞过剩', '善良到骨子里'],
    quote: '"这首歌词写的就是我...呜呜呜太好哭了（再次播放第47遍）"',
    colorScheme: {
      primary: '#ec4899',
      secondary: '#f472b6',
      accent: '#f9a8d4',
      background: '#500724',
      gradient: 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)',
      text: '#fce7f3',
      glow: 'rgba(236, 72, 153, 0.5)'
    }
  },
  ENFJ: {
    name: '老妈子·阳光版',
    title: '操心程度超过亲妈',
    element: '☀️ 人形暖炉',
    description: '群聊里最活跃的是你，生日记得最清楚的是你，谁失恋了第一个安慰的还是你。',
    strengths: ['社交牛逼症', '情绪价值提供机', '团队粘合剂', '正能量发射器'],
    quote: '"你们都要好好的啊！有什么事随时找我！（然后自己偷偷难过）"',
    colorScheme: {
      primary: '#f59e0b',
      secondary: '#fbbf24',
      accent: '#fcd34d',
      background: '#451a03',
      gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      text: '#fef3c7',
      glow: 'rgba(245, 158, 11, 0.5)'
    }
  },
  ENFP: {
    name: '哈士奇成精·快乐傻子',
    title: '注意力持续时间=3秒',
    element: '🎉 行走的派对',
    description: '你今天的兴趣是学吉他，明天想开咖啡馆，后天决定去火星。朋友聚会你永远是气氛组担当。',
    strengths: ['快乐源泉', '创意无限', '社牛属性', '能让石头笑出声'],
    quote: '"哇这个好有趣！！...哦那个也好好玩！！！...等等我刚才在想什么来着？"',
    colorScheme: {
      primary: '#10b981',
      secondary: '#34d399',
      accent: '#6ee7b7',
      background: '#022c22',
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      text: '#d1fae5',
      glow: 'rgba(16, 185, 129, 0.5)'
    }
  },
  ISTJ: {
    name: 'Excel表格·人形化',
    title: '生活必须井井有条（否则会死）',
    element: '📊 数据达人',
    description: '你的电脑桌面图标按颜色分类，衣柜里的衣服按季节排列，连吃火锅都要先列个清单。',
    strengths: ['靠谱到可怕', '细节控', '说到做到', '生活管家'],
    quote: '"这不是强迫症，这是对生活的尊重。（整理第五遍桌面）"',
    colorScheme: {
      primary: '#6b7280',
      secondary: '#9ca3af',
      accent: '#d1d5db',
      background: '#1f2937',
      gradient: 'linear-gradient(135deg, #4b5563 0%, #6b7280 100%)',
      text: '#f3f4f6',
      glow: 'rgba(107, 114, 128, 0.5)'
    }
  },
  ISFJ: {
    name: '老好人·受气包',
    title: '不会拒绝星人（正在学习中）',
    element: '🏠 温暖港湾',
    description: '你说"好的"的次数比呼吸还多。同事让你帮忙你帮了，朋友借钱你借了，快递员打电话你立刻下楼了。',
    strengths: ['贴心到犯规', '记忆力惊人', '任劳任怨', '默默付出'],
    quote: '"没事的我可以帮你！（内心：我真的不想帮啊啊啊）"',
    colorScheme: {
      primary: '#0891b2',
      secondary: '#22d3ee',
      accent: '#67e8f9',
      background: '#083344',
      gradient: 'linear-gradient(135deg, #0e7490 0%, #0891b2 100%)',
      text: '#cffafe',
      glow: 'rgba(8, 145, 178, 0.5)'
    }
  },
  ESTJ: {
    name: '教导主任·退休返聘',
    title: '管得比妈还宽',
    element: '📋 规则守护者',
    description: '你看到排队有人插队会当场指出，看到垃圾分类不对会忍不住纠正。朋友怕你又离不开你。',
    strengths: ['执行力爆表', '原则性强', '团队主心骨', '纠错雷达'],
    quote: '"你这个做法有问题，听我的，按流程来。（拿出笔记本）"',
    colorScheme: {
      primary: '#78716c',
      secondary: '#a8a29e',
      accent: '#d6d3d1',
      background: '#292524',
      gradient: 'linear-gradient(135deg, #57534e 0%, #78716c 100%)',
      text: '#fafaf9',
      glow: 'rgba(120, 113, 108, 0.5)'
    }
  },
  ESFJ: {
    name: '八卦中心·情报局',
    title: '认识全村的狗和它们的主人',
    element: '🍯 社交蝴蝶',
    description: '你手机通讯录里有三千个人，每个人的家庭情况你都一清二楚。聚会你一定是组织者。',
    strengths: ['人缘好到爆炸', '情商在线', '聚会必邀', '消息灵通'],
    quote: '"我跟你说个秘密...(十分钟后全校都知道了）"',
    colorScheme: {
      primary: '#f43f5e',
      secondary: '#fb7185',
      accent: '#fda4af',
      background: '#4c0519',
      gradient: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
      text: '#ffe4e6',
      glow: 'rgba(244, 63, 94, 0.5)'
    }
  },
  ISTP: {
    name: '工具人·全能修理工',
    title: '话少活好不解释',
    element: '🔧 实战专家',
    description: '你能在沉默中修好一台电脑、组装一个柜子、换好一个轮胎，全程不超过十句话。',
    strengths: ['动手能力强', '冷静到冰点', '问题解决者', '话少靠谱'],
    quote: '"（默默修好了）好了。（转身离开深藏功与名）"',
    colorScheme: {
      primary: '#374151',
      secondary: '#6b7280',
      accent: '#9ca3af',
      background: '#111827',
      gradient: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
      text: '#f9fafb',
      glow: 'rgba(55, 65, 81, 0.5)'
    }
  },
  ISFP: {
    name: '文艺青年·小众爱好者',
    title: '喜欢的歌手都没听过',
    element: '🎨 灵魂画手',
    description: '你的歌单里没有热门歌曲，你的穿搭永远不会撞衫。你能在路边一朵花前驻足十分钟。',
    strengths: ['审美在线', '独特气质', '艺术细胞', '温柔且有态度'],
    quote: '"这首你们肯定没听过...（开始安利小众乐队第108次）"',
    colorScheme: {
      primary: '#059669',
      secondary: '#10b981',
      accent: '#34d399',
      background: '#022c22',
      gradient: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
      text: '#d1fae5',
      glow: 'rgba(5, 150, 105, 0.5)'
    }
  },
  ESTP: {
    name: '现充·冒险王',
    title: '不作不死但就是要作',
    element: '🎢 刺激 seekers',
    description: '你的周末安排：蹦极、跳伞、或者随便找个没去过的地方探险。你受不了无聊，坐不住冷板凳。',
    strengths: ['行动力超强', '胆大包天', '现场气氛组', '说走就走'],
    quote: '"走！现在就去！（五分钟后）哇这个也太好玩了吧再来一次！"',
    colorScheme: {
      primary: '#0ea5e9',
      secondary: '#38bdf8',
      accent: '#7dd3fc',
      background: '#082f49',
      gradient: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
      text: '#e0f2fe',
      glow: 'rgba(14, 165, 233, 0.5)'
    }
  },
  ESFP: {
    name: '交际花·派对动物',
    title: '没有我冷场的局',
    element: '🎤 舞台焦点',
    description: '你走到哪里哪里就是舞台，KTV麦霸是你，聚会游戏王是你，朋友圈点赞收割机是你。',
    strengths: ['魅力值MAX', '幽默感爆棚', '自来熟', '快乐传递者'],
    quote: '"来来来大家一起玩！！（已经拉着陌生人跳舞了）"',
    colorScheme: {
      primary: '#f97316',
      secondary: '#fb923c',
      accent: '#fdba74',
      background: '#431407',
      gradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
      text: '#fff7ed',
      glow: 'rgba(249, 115, 22, 0.5)'
    }
  }
}

export const NPC_NAMES = {
  lawyer: '律师',
  nurse: '护士',
  reporter: '记者'
}

export const NPC_RIPPLE_TEXTS = {
  lawyer: {
    high: '对你的坦诚表示认可',
    low: '目光中多了一分审视',
    neutral: '保持惯有的冷静'
  },
  nurse: {
    high: '眼神里多了几分信任',
    low: '默默退后了半步',
    neutral: '依旧安静地站在一旁'
  },
  reporter: {
    high: '开始主动向你透露信息',
    low: '笔尖停顿了一下',
    neutral: '继续记录着一切'
  }
}

export const CHAPTER_COLORS = {
  1: '#7a8aaa',
  2: '#9a8ab5',
  3: '#8a9a88',
  4: '#9a7a8a'
}
