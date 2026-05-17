/**
 * 灯塔零点协议 - 主应用逻辑
 *
 * 功能：
 * 1. 路由系统（Hash 路由）
 * 2. 状态管理（类似 Vuex/Pinia）
 * 3. 页面渲染引擎
 * 4. 弹层系统
 * 5. 事件处理中心
 */

(function() {
  'use strict';

  // ===== 全局状态管理 =====
  const store = {
    // 基础数据
    choices: [],
    actionLogs: [],
    currentChapter: 0,
    gameMode: 'fun',

    // MBTI 分数
    scores: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },

    // 行为标签
    behaviorTags: {
      cooperative: 0,
      deceptive: 0,
      cautious: 0,
      aggressive: 0,
      curious: 0,
      protective: 0
    },

    // NPC 关系值 (-100 到 +100)
    npcRelations: {
      lawyer: 0,
      nurse: 0,
      reporter: 0
    },

    // 结局路径权重
    endingWeights: {
      truth: 0,
      escape: 0,
      backfire: 0,
      zero: 0,
      secret: 0
    },

    // 特殊标记和探索数据
    specialFlags: {},
    hiddenOptionsFound: 0,
    visitedScenes: new Set(),
    visitCount: 0,

    // 隐藏选项相关
    longPressTimers: {},
    revealedHiddenOptions: new Set(),

    // 游戏结果
    gameResults: [],

    // 当前游戏实例
    currentGame: null,

    // 重置所有状态
    reset() {
      this.choices = [];
      this.actionLogs = [];
      this.currentChapter = 0;
      this.scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
      this.behaviorTags = {
        cooperative: 0,
        deceptive: 0,
        cautious: 0,
        aggressive: 0,
        curious: 0,
        protective: 0
      };
      this.npcRelations = { lawyer: 0, nurse: 0, reporter: 0 };
      this.endingWeights = { truth: 0, escape: 0, backfire: 0, zero: 0, secret: 0 };
      this.specialFlags = {};
      this.hiddenOptionsFound = 0;
      this.visitedScenes = new Set();
      this.visitCount = 0;
      this.longPressTimers = {};
      this.revealedHiddenOptions = new Set();
      this.gameResults = [];
      this.currentGame = null;
    },

    // 记录选择
    recordChoice(action) {
      this.choices.push(action);

      // 记录详细日志
      this.actionLogs.push({
        timestamp: Date.now(),
        chapterId: this.currentChapter,
        optionId: action.id,
        text: action.text,
        isHidden: action.isHidden || false,
        gameType: action.gameType || null
      });

      // 更新维度分数
      if (action.dimensions) {
        action.dimensions.forEach(dim => {
          if (this.scores[dim] !== undefined) {
            this.scores[dim] += (dim.weight || 1);
          }
        });
      }

      // 更新行为标签
      if (action.behaviorTags) {
        action.behaviorTags.forEach(tag => {
          if (this.behaviorTags[tag] !== undefined) {
            this.behaviorTags[tag] += 1;
          }
        });
      }

      // 更新 NPC 关系
      if (action.relationEffect) {
        Object.entries(action.relationEffect).forEach(([npc, value]) => {
          if (this.npcRelations[npc] !== undefined) {
            this.npcRelations[npc] += value;
            this.npcRelations[npc] = Math.max(-100, Math.min(100, this.npcRelations[npc]));
          }
        });
      }

      // 更新结局权重
      if (action.endingWeight) {
        Object.entries(action.endingWeight).forEach(([path, weight]) => {
          if (this.endingWeights[path] !== undefined) {
            this.endingWeights[path] += weight;
          }
        });
      }

      // 记录特殊标记
      if (action.specialFlag) {
        this.specialFlags[action.specialFlag] = true;
      }

      // 记录隐藏选项发现
      if (action.isHidden) {
        this.hiddenOptionsFound++;
        this.revealedHiddenOptions.add(action.id);
      }

      // 访问计数
      this.visitCount++;
    },

    // 记录游戏结果
    recordGameResult(result) {
      this.gameResults.push(result);
    },

    // 记录场景访问
    recordSceneVisit(sceneId) {
      this.visitedScenes.add(sceneId);
    },

    // 检查隐藏条件
    checkHiddenCondition(condition) {
      if (!condition) return false;

      switch (condition) {
        case 'mustVisitD':
          return this.visitedScenes.has('1-2d') || this.visitedScenes.has('1-1');
        case 'hasFlag_observer':
          return !!this.specialFlags.observer;
        case 'hasFlag_brave':
          return !!this.specialFlags.brave;
        case 'visitCount_>=2':
          return this.visitCount >= 2;
        case 'flags_count >= 3':
          return Object.keys(this.specialFlags).length >= 3;
        default:
          if (condition.startsWith('relation_')) {
            const [npc, op, val] = condition.replace('relation_', '').split(/([><=]+)/);
            const numVal = parseInt(val);
            const relationVal = this.npcRelations[npc];
            switch (op) {
              case '>=': return relationVal >= numVal;
              case '<=': return relationVal <= numVal;
              case '>': return relationVal > numVal;
              case '<': return relationVal < numVal;
              default: return false;
            }
          }
          if (condition.startsWith('has_item:')) {
            const item = condition.split(':')[1];
            return !!this.specialFlags[item];
          }
          if (condition.startsWith('flags_count')) {
            const count = parseInt(condition.split('>=')[1]);
            return Object.keys(this.specialFlags).length >= count;
          }
          return false;
      }
    },

    // 检查是否已揭示隐藏选项
    isOptionRevealed(optionId) {
      return this.revealedHiddenOptions.has(optionId);
    },

    // 是否显示隐藏选项
    shouldShowHiddenOption(option) {
      if (!option.isHidden) return true;

      if (this.isOptionRevealed(option.id)) return true;

      switch (option.hiddenTrigger) {
        case 'condition':
          return this.checkHiddenCondition(option.hiddenCondition, option);
        case 'always':
          return true;
        case 'longPress':
          return true;
        case 'sceneInspect':
          return this.isOptionRevealed(option.id);
        case 'relationGate':
          return this.checkHiddenCondition(option.unlockCondition, option);
        case 'itemGate':
          return this.checkHiddenCondition(option.unlockCondition, option);
        case 'gameUnlock':
          return this.gameResults.some(r => r.gameType === option.requiredGame && r.success);
        default:
          return false;
      }
    },

    // 长按处理
    startLongPress(optionId, callback, duration) {
      duration = duration || 1500;
      this.longPressTimers[optionId] = setTimeout(() => {
        callback();
        this.revealedHiddenOptions.add(optionId);
      }, duration);
    },

    cancelLongPress(optionId) {
      if (this.longPressTimers[optionId]) {
        clearTimeout(this.longPressTimers[optionId]);
        delete this.longPressTimers[optionId];
      }
    },

    // 计算 MBTI 类型
    getMbtiType() {
      return ''
        + (this.scores.E >= this.scores.I ? 'E' : 'I')
        + (this.scores.S >= this.scores.N ? 'S' : 'N')
        + (this.scores.T >= this.scores.F ? 'T' : 'F')
        + (this.scores.J >= this.scores.P ? 'J' : 'P');
    }
  };

  // ===== DOM 工具函数 =====
  function $(selector) {
    return document.querySelector(selector);
  }

  function $$(selector) {
    return document.querySelectorAll(selector);
  }

  function createElement(tag, className, innerHTML) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (innerHTML) el.innerHTML = innerHTML;
    return el;
  }

  // ===== 关键字高亮 =====
  function highlightKeywords(text) {
    if (!text) return '';

    const rules = [
      { regex: /(律师|护士|记者|01号|02号|03号|04号)/g, class: 'kw-person' },
      { regex: /(档案袋|手环|钥匙|电台|医药箱|救生衣)/g, class: 'kw-item' },
      { regex: /(灯塔|地下室|铁门|海鸥号)/g, class: 'kw-place' },
      { regex: /(真相|秘密|沉船案|零点协议)/g, class: 'kw-secret' },
      { regex: /(广播|暴雨|海浪)/g, class: 'kw-event' },
      { regex: /(沙哑|嘎吱|低语)/g, class: 'kw-sound' }
    ];

    let result = text;
    rules.forEach(rule => {
      result = result.replace(rule.regex, `<span class="${rule.class}">$1</span>`);
    });

    return result;
  }

  // ===== 路由系统 =====
  let currentRoute = '/';
  let previousRoute = '/';

  function getRoute() {
    return window.location.hash.slice(1) || '/';
  }

  function navigate(path) {
    window.location.hash = path;
  }

  function onRouteChange() {
    const newRoute = getRoute();
    if (newRoute === currentRoute) return;

    previousRoute = currentRoute;
    currentRoute = newRoute;

    // 触发转场效果
    triggerTransition();

    // 渲染对应页面
    setTimeout(() => {
      renderRoute(currentRoute);
    }, 150);
  }

  function triggerTransition() {
    const grainOverlay = $('#grainOverlay');
    if (grainOverlay) {
      grainOverlay.classList.add('active');
      setTimeout(() => grainOverlay.classList.remove('active'), 80);
    }
  }

  // ===== 页面渲染器 =====
  const routerView = $('#router-view');

  function renderRoute(route) {
    routerView.innerHTML = '';

    if (route === '/' || route === '') {
      renderHome();
    } else if (route.startsWith('/chapter/')) {
      const chapterId = parseInt(route.split('/')[2]);
      renderChapter(chapterId);
    } else if (route.startsWith('/game/')) {
      const gameType = route.split('/')[2];
      renderGame(gameType);
    } else if (route === '/result') {
      renderResult();
    } else {
      renderHome();
    }
  }

  // ===== 首页渲染 =====
  function renderHome() {
    store.reset();

    const container = createElement('div', 'page home-container active');

    container.innerHTML = `
      <div class="bg-layer"></div>
      <div class="vignette"></div>
      <div class="scanline"></div>

      <div class="home-content">
        <div class="top-meta">
          <span class="meta-item">INTERACTIVE FICTION</span>
          <span class="meta-sep">/</span>
          <span class="meta-item">v1.0</span>
        </div>

        <main class="main-stage">
          <div class="title-block">
            <h1 class="game-title">
              <span class="title-zh">灯塔零点协议</span>
            </h1>
            <h2 class="title-en">LIGHTHOUSE : ZERO PROTOCOL</h2>
            <div class="title-ornament">
              <span class="orn-line"></span>
              <span class="orn-diamond">◆</span>
              <span class="orn-line"></span>
            </div>
          </div>

          <div class="story-block" id="storyBlock"></div>

          <div class="enter-hint">
            <span class="hint-text">点击任意位置进入灯塔</span>
            <span class="hint-cursor">▌</span>
          </div>
        </main>

        <footer class="bottom-info">
          <div class="info-divider"></div>
          <p class="info-row">
            <span>悬疑叙事互动</span>
            <span class="info-dot">·</span>
            <span>4 幕剧情</span>
            <span class="info-dot">·</span>
            <span>约 5-8 分钟</span>
          </p>
        </footer>
      </div>
    `;

    routerView.appendChild(container);

    // 渲染故事文本
    const storyLines = [
      '暴雨夜，你在废弃灯塔醒来',
      '手腕上多了一个编号手环：04',
      '',
      '广播里传来沙哑的声音：',
      '"你们之中有人知道沉船案真相。"',
      '"想活着离开，就把他交出来。"',
      '',
      '桌上摆着四份档案袋',
      '四个人，只有一把钥匙能打开出口',
      '',
      '你选哪条路？'
    ];

    const storyBlock = container.querySelector('#storyBlock');
    storyLines.forEach((line, idx) => {
      const lineEl = createElement('div', 'story-line' + (line.trim() ? '' : ' line-empty'));
      if (line.trim()) {
        lineEl.style.animationDelay = (idx * 0.08) + 's';
        lineEl.innerHTML = `
          <span class="prompt-mark">&gt;</span>
          <span class="line-text">${formatLine(line)}</span>
        `;
      }
      storyBlock.appendChild(lineEl);
    });

    // 点击进入游戏
    container.addEventListener('click', () => navigate('/chapter/1'));
  }

  function formatLine(line) {
    if (line.startsWith('"') && line.endsWith('"')) {
      return `<em>${line.slice(1, -1)}</em>`;
    }
    return highlightKeywords(line);
  }

  // ===== 章节页面渲染 =====
  function renderChapter(chapterId) {
    const chapter = GAME_DATA.CHAPTERS.find(c => c.id === chapterId);
    if (!chapter) {
      navigate('/');
      return;
    }

    store.currentChapter = chapterId;

    const container = createElement('div', 'page chapter-container active');
    container.style.setProperty('--chapter-color', GAME_DATA.CHAPTER_COLORS[chapterId] || '#7a8aaa');

    container.innerHTML = `
      <div class="bg-solid"></div>
      <div class="bg-noise"></div>

      <div class="chapter-header">
        <span class="header-chapter">${chapter.subtitle}</span>
        <h2 class="header-title">${chapter.title}</h2>
        <div class="header-line"></div>
      </div>

      <div class="scene-stage" id="sceneStage"></div>
    `;

    routerView.appendChild(container);

    // 渲染开场
    renderIntro(chapter);
  }

  function renderIntro(chapter) {
    const sceneStage = document.getElementById('sceneStage');
    if (!sceneStage) return;

    const introLines = chapter.intro.split('\n').filter(l => l.trim());

    sceneStage.innerHTML = `
      <div class="act-intro">
        <div class="text-curtain">
          ${introLines.map((line, idx) =>
            `<p class="text-reveal" style="animation-delay: ${idx * 0.05}s">${highlightKeywords(line)}</p>`
          ).join('')}
        </div>
        <button class="action-trigger" id="enterSceneBtn">
          <span class="trigger-text">进入场景</span>
          <span class="trigger-icon"></span>
        </button>
      </div>
    `;

    const btn = document.getElementById('enterSceneBtn');
    btn.addEventListener('click', () => renderScene(chapter, 0));

    // TTS: 播放章节开场白（延迟播放，等待动画完成）
    if (window.tts && chapter.id) {
      setTimeout(() => {
        const introDialogue = TTS_CONFIG?.keyDialogues?.[`chapter${chapter.id}`]?.[0];
        if (introDialogue) {
          window.tts.play({
            text: introDialogue.text,
            speaker: introDialogue.speaker || 'narrator',
            emotion: introDialogue.emotion,
            dialogueId: introDialogue.id
          });
        } else {
          // 如果没有预配置的对话，使用章节 intro 的前几行作为旁白
          const introText = introLines.slice(0, 3).join(' ');
          if (introText) {
            window.tts.play({
              text: introText,
              speaker: 'narrator',
              dialogueId: `ch${chapter.id}_auto_intro`
            });
          }
        }
      }, 1000); // 延迟1秒等待动画

      // 预加载当前章节和下一章音频
      window.tts.preloadChapter(chapter.id);
      if (chapter.id < 4) {
        window.tts.preloadChapter(chapter.id + 1);
      }
    }

    // 添加 TTS 控制按钮到页面
    addTTSControls(sceneStage);
  }

  function renderScene(chapter, sceneIndex) {
    const sceneStage = document.getElementById('sceneStage');
    if (!sceneStage) return;

    const scene = chapter.scenes[sceneIndex];
    if (!scene) return;

    store.recordSceneVisit(scene.id);

    const visibleOptions = scene.options.filter(opt =>
      store.shouldShowHiddenOption(opt)
    );

    const sceneLines = scene.text.split('\n').filter(l => l.trim());

    sceneStage.innerHTML = `
      <div class="act-scene-combined">
        <div class="text-curtain scene-curtain">
          ${sceneLines.map((line, idx) =>
            `<p class="text-reveal">${highlightKeywords(line)}</p>`
          ).join('')}
        </div>

        <div class="choice-section">
          <div class="choice-prompt">
            <span class="prompt-line prompt-line-left"></span>
            <span class="prompt-text">你会怎么做</span>
            <span class="prompt-line prompt-line-right"></span>
          </div>

          <div class="choices-list" id="choicesList">
            ${visibleOptions.map((opt, idx) => renderOptionCard(opt, idx)).join('')}
          </div>
        </div>
      </div>
    `;

    // 绑定选项事件
    bindOptionEvents(visibleOptions);

    // 绑定长按事件
    bindLongPressEvents(visibleOptions);

    // TTS: 播放场景描述（旁白）
    if (window.tts && sceneLines.length > 0) {
      setTimeout(() => {
        const sceneText = sceneLines.slice(0, 2).join(' ');
        window.tts.play({
          text: sceneText,
          speaker: 'narrator',
          dialogueId: `${scene.id}_narrator`,
          emotion: '(平静, 缓慢) '
        });
      }, 800);
    }

    // 更新 TTS 控制按钮位置
    updateTTSControls(sceneStage);
  }

  function renderOptionCard(option, index) {
    const isRevealed = store.isOptionRevealed(option.id);
    const isHidden = option.isHidden && !isRevealed;
    const isLongPress = option.hiddenTrigger === 'longPress' && !isRevealed;

    let classes = 'choice-card';
    if (isHidden) classes += ' hidden-choice';
    if (isRevealed && option.isHidden) classes += ' revealed-choice';
    if (isLongPress) classes += ' press-hold';

    const letter = String.fromCharCode(65 + index);

    return `
      <button class="${classes}" data-option-id="${option.id}" style="animation-delay: ${index * 0.1}s">
        <span class="choice-index">${letter}</span>
        <span class="choice-body">
          ${isLongPress ? '<span class="hidden-label">长按揭示</span>' : option.text}
        </span>
        <span class="choice-indicator">→</span>
        ${isRevealed && option.isHidden ? '<span class="reveal-mark"></span>' : ''}
      </button>
    `;
  }

  function bindOptionEvents(options) {
    const choiceCards = $$('#choicesList .choice-card');

    choiceCards.forEach(card => {
      const optionId = card.dataset.optionId;
      const option = options.find(o => o.id === optionId);

      card.addEventListener('click', () => handleSelectOption(option));
    });
  }

  function bindLongPressEvents(options) {
    const choiceCards = $$('#choicesList .choice-card');

    choiceCards.forEach(card => {
      const optionId = card.dataset.optionId;
      const option = options.find(o => o.id === optionId);

      if (!option || option.hiddenTrigger !== 'longPress') return;
      if (store.isOptionRevealed(option.id)) return;

      // 触控长按
      card.addEventListener('touchstart', (e) => {
        e.preventDefault();
        store.startLongPress(option.id, () => {
          console.log(`Hidden option ${option.id} revealed!`);
        });
      }, { passive: false });

      card.addEventListener('touchend', () => store.cancelLongPress(option.id));
      card.addEventListener('touchcancel', () => store.cancelLongPress(option.id));

      // 鼠标长按
      card.addEventListener('mousedown', () => {
        store.startLongPress(option.id, () => {
          console.log(`Hidden option ${option.id} revealed!`);
        });
      });

      card.addEventListener('mouseup', () => store.cancelLongPress(option.id));
      card.addEventListener('mouseleave', () => store.cancelLongPress(option.id));
    });
  }

  function handleSelectOption(option) {
    if (!option) return;

    // 如果有小游戏，跳转到游戏页面
    if (option.gameType) {
      navigate('/game/' + option.gameType);
      return;
    }

    // 记录选择
    store.recordChoice(option);

    // 根据下一步决定跳转
    if (option.nextScene === 'end') {
      renderSummary();
    } else if (option.nextScene === 'result') {
      navigate('/result');
    } else {
      const chapter = GAME_DATA.CHAPTERS.find(c => c.id === store.currentChapter);
      if (chapter) {
        const nextIndex = chapter.scenes.findIndex(s => s.id === option.nextScene);
        if (nextIndex !== -1) {
          store.recordSceneVisit(option.nextScene);
          renderScene(chapter, nextIndex);
        }
      }
    }
  }

  function renderSummary() {
    const chapter = GAME_DATA.CHAPTERS.find(c => c.id === store.currentChapter);
    if (!chapter) return;

    const sceneStage = document.getElementById('sceneStage');
    if (!sceneStage) return;

    const hasNextChapter = store.currentChapter < GAME_DATA.CHAPTERS.length;

    // 构建 NPC 关系变化列表
    const ripples = [];
    Object.entries(store.npcRelations).forEach(([npc, val]) => {
      if (val >= 15) {
        ripples.push({
          npcName: GAME_DATA.NPC_NAMES[npc],
          text: GAME_DATA.NPC_RIPPLE_TEXTS[npc]?.high,
          type: 'positive'
        });
      } else if (val <= -15) {
        ripples.push({
          npcName: GAME_DATA.NPC_NAMES[npc],
          text: GAME_DATA.NPC_RIPPLE_TEXTS[npc]?.low,
          type: 'negative'
        });
      } else if (val !== 0) {
        ripples.push({
          npcName: GAME_DATA.NPC_NAMES[npc],
          text: GAME_DATA.NPC_RIPPLE_TEXTS[npc]?.neutral,
          type: 'neutral'
        });
      }
    });

    sceneStage.innerHTML = `
      <div class="act-summary">
        <div class="summary-symbol"></div>
        <h3 class="summary-title">本章余波</h3>
        <p class="summary-desc">${chapter.endText}</p>

        <div class="npc-ripple-list">
          ${ripples.map((r, idx) => `
            <div class="npc-ripple-item ripple-${r.type}" style="animation-delay: ${idx * 0.1}s">
              <span class="ripple-npc">${r.npcName}</span>
              <span class="ripple-arrow"></span>
              <span class="ripple-text">${r.text}</span>
            </div>
          `).join('')}
        </div>

        <button class="action-proceed" id="nextChapterBtn">
          <span>${hasNextChapter ? '继续前行' : '揭示真相'}</span>
          <span class="proceed-arrow"></span>
        </button>
      </div>
    `;

    const btn = document.getElementById('nextChapterBtn');
    btn.addEventListener('click', () => {
      if (hasNextChapter) {
        navigate('/chapter/' + (store.currentChapter + 1));
      } else {
        navigate('/result');
      }
    });
  }

  // ===== 游戏页面渲染 =====
  function renderGame(gameType) {
    const container = createElement('div', 'page game-container active');

    const gameTitles = {
      match3: '搜证挑战：三消解谜',
      sliding: '密码破解：滑块拼图',
      memory: '记忆重构：翻牌配对',
      code: '系统入侵：密码破译'
    };

    const gameSubtitles = {
      match3: '消除障碍，获取隐藏线索',
      sliding: '还原顺序，解锁电子锁',
      memory: '找回记忆碎片',
      code: '突破防线，获取控制权'
    };

    container.innerHTML = `
      <div class="game-header">
        <h2 class="game-title">${gameTitles[gameType] || '挑战'}</h2>
        <p class="game-subtitle">${gameSubtitles[gameType] || ''}</p>
      </div>

      <div class="game-area" id="gameArea">
        <div class="game-loading">正在加载...</div>
      </div>
    `;

    routerView.appendChild(container);

    // 初始化并启动游戏
    initGame(gameType);
  }

  function initGame(gameType) {
    const gameArea = document.getElementById('gameArea');
    if (!gameArea) return;

    // 销毁之前的游戏
    if (store.currentGame && store.currentGame.destroy) {
      store.currentGame.destroy();
    }

    try {
      let gameInstance;

      switch (gameType) {
        case 'match3':
          if (window.Match3Game) {
            window.Match3Game.init(gameArea);
            window.Match3Game.start();
            gameInstance = window.Match3Game;
          }
          break;
        case 'sliding':
          if (window.SlidingGame) {
            window.SlidingGame.init(gameArea);
            window.SlidingGame.start();
            gameInstance = window.SlidingGame;
          }
          break;
        case 'memory':
          if (window.MemoryGame) {
            window.MemoryGame.init(gameArea);
            window.MemoryGame.start();
            gameInstance = window.MemoryGame;
          }
          break;
        case 'code':
          if (window.CodeGame) {
            window.CodeGame.init(gameArea);
            window.CodeGame.start({
              onComplete: (result) => handleGameComplete(result)
            });
            gameInstance = window.CodeGame;
          }
          break;
      }

      store.currentGame = gameInstance;

      // 对于非 code 游戏，设置完成回调
      if (gameType !== 'code' && gameInstance) {
        // 大多数游戏会在 getResult() 后结束
        // 这里我们添加一个返回按钮
        addGameBackButton(gameType);
      }

    } catch (error) {
      console.error('Game initialization error:', error);
      showModal('error', {
        title: '加载失败',
        message: '小游戏初始化出错，请重试。',
        onConfirm: () => navigate('/chapter/' + store.currentChapter)
      });
    }
  }

  function addGameBackButton(gameType) {
    const gameArea = document.getElementById('gameArea');
    if (!gameArea) return;

    const backBtn = createElement('button', 'game-btn primary');
    backBtn.textContent = '完成挑战';
    backBtn.style.marginTop = '1rem';

    backBtn.addEventListener('click', () => {
      if (store.currentGame && store.currentGame.getResult) {
        const result = store.currentGame.getResult();
        store.recordGameResult({
          gameType: gameType,
          success: result.success,
          ...result
        });
      }

      // 返回章节
      const chapter = GAME_DATA.CHAPTERS.find(c => c.id === store.currentChapter);
      if (chapter) {
        renderSummary();
      }
    });

    gameArea.appendChild(backBtn);
  }

  function handleGameComplete(result) {
    store.recordGameResult(result);

    // 显示结果弹窗
    if (result.success) {
      showModal('success', {
        title: '挑战成功！',
        message: `你成功完成了挑战！获得了关键线索。`,
        onConfirm: () => {
          const chapter = GAME_DATA.CHAPTERS.find(c => c.id === store.currentChapter);
          if (chapter) {
            renderSummary();
          }
        }
      });
    } else {
      showModal('fail', {
        title: '挑战失败',
        message: '很遗憾，挑战失败了。但你可以继续前进...',
        onConfirm: () => {
          const chapter = GAME_DATA.CHAPTERS.find(c => c.id === store.currentChapter);
          if (chapter) {
            renderSummary();
          }
        }
      });
    }
  }

  // ===== 结果页面渲染 =====
  function renderResult() {
    const mbtiType = store.getMbtiType();
    const mbtiData = GAME_DATA.SBTI_DESCRIPTIONS[mbtiType];

    // 计算结局
    const endingData = ENDING_CALCULATOR.calculateEnding(store);
    const endingText = ENDING_CALCULATOR.getEndingText(
      endingData.type,
      mbtiType,
      endingData.variant
    );

    const container = createElement('div', 'page result-container active');

    container.style.setProperty('--mbti-gradient', mbtiData?.colorScheme?.gradient || '#6366f1');
    container.style.setProperty('--mbti-primary', mbtiData?.colorScheme?.primary || '#6366f1');
    container.style.setProperty('--ending-color', endingData?.color || '#fbbf24');

    container.innerHTML = `
      <div class="result-bg"></div>
      <div class="result-content" id="resultContent"></div>
    `;

    routerView.appendChild(container);

    const resultContent = container.querySelector('#resultContent');

    // 构建结果 HTML
    resultContent.innerHTML = `
      <!-- 头部信息 -->
      <div class="result-header">
        <div class="result-badge">
          <span>🎭 SBTI 性格分析</span>
        </div>
        <h1 class="result-mbti">${mbtiType}</h1>
        <h2 class="result-name">${mbtiData?.name || ''}</h2>
        <p class="result-title">${mbtiData?.title || ''}</p>
        <p class="result-description">${mbtiData?.description || ''}</p>
        <blockquote class="result-quote">${mbtiData?.quote || ''}</blockquote>
      </div>

      <!-- 优势特征 -->
      <div class="result-section">
        <h3 class="section-title">核心优势</h3>
        <div class="strength-grid">
          ${(mbtiData?.strengths || []).map(strength =>
            `<div class="strength-item">${strength}</div>`
          ).join('')}
        </div>
      </div>

      <!-- 结局卡片 -->
      <div class="result-section">
        <h3 class="section-title">你的结局</h3>
        <div class="ending-card">
          <div class="ending-icon">${endingData?.icon || ''}</div>
          <h4 class="ending-type-name" style="color: var(--ending-color)">
            ${endingText?.title || endingData?.name || ''}
          </h4>
          <p class="ending-subtitle">${endingData?.subtitle || ''}</p>
          <p class="ending-main-text">${endingText?.main || ''}</p>
          <p class="ending-sub-text">${endingText?.sub || ''}</p>
          <blockquote class="ending-quote">${endingText?.quote || ''}</blockquote>
          ${endingText?.achievement ? `<div class="achievement-badge">${endingText.achievement}</div>` : ''}
          ${endingText?.suggestion ? `<p style="color: #78829a; font-size: 0.85rem; margin-top: 1rem;">${endingText.suggestion}</p>` : ''}
        </div>
      </div>

      <!-- 行为分析 -->
      ${renderBehaviorAnalysis(endingData)}

      <!-- 重新开始按钮 -->
      <button class="restart-btn" id="restartBtn">重新开始体验</button>
    `;

    // 绑定重新开始事件
    const restartBtn = document.getElementById('restartBtn');
    restartBtn.addEventListener('click', () => navigate('/'));

    // 保存最高分
    saveHighScore(mbtiType, endingData);

    // TTS: 播放结局语音
    if (window.tts && endingData?.type) {
      setTimeout(() => {
        const endingDialogues = TTS_CONFIG?.keyDialogues?.endings?.[endingData.type];
        if (endingDialogues && endingDialogues.length > 0) {
          const endingDialogue = endingDialogues[0];
          window.tts.play({
            text: endingDialogue.text,
            speaker: endingDialogue.speaker || 'narrator',
            emotion: endingDialogue.emotion,
            dialogueId: endingDialogue.id,
            priority: 'high'
          });
        } else {
          // 如果没有预配置的结局对话，使用结局文本
          const endingText = `${endingText?.main || ''} ${endingText?.quote || ''}`;
          if (endingText.trim()) {
            const style = TTS_CONFIG?.endingStyles?.[endingData.type]?.emotion || '';
            window.tts.play({
              text: endingText.trim(),
              speaker: 'narrator',
              emotion: style,
              dialogueId: `end_${endingData.type}_auto`
            });
          }
        }
      }, 1500); // 延迟播放，等待页面动画完成
    }

    // 在结果页添加 TTS 控制按钮
    const resultContent = container.querySelector('#resultContent');
    if (resultContent) {
      addTTSControls(resultContent);
    }
  }

  function renderBehaviorAnalysis(endingData) {
    const analysis = endingData?.behaviorAnalysis;
    if (!analysis) return '';

    return `
      <div class="result-section">
        <h3 class="section-title">行为侧写</h3>
        <div class="strength-grid">
          <div class="strength-item">
            <strong>主导行为：</strong> ${analysis.profileText || ''}
          </div>
          <div class="strength-item">
            <strong>NPC 关系：</strong>
            ${Object.entries(analysis.relationSummary || {}).map(([k, v]) =>
              `${GAME_DATA.NPC_NAMES[k]}: ${v}`
            ).join(' | ') || '无'}
          </div>
          ${analysis.traits?.length ? `
            <div class="strength-item" style="grid-column: span 2;">
              <strong>特征标签：</strong> ${analysis.traits.join('、')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // ===== 存档系统 =====
  function saveHighScore(mbtiType, endingData) {
    try {
      const key = 'lighthouse_zero_protocol_best';
      const prev = localStorage.getItem(key);
      let best = prev ? JSON.parse(prev) : {};

      if (!best[mbtiType] || endingData.score > best[mbtiType].score) {
        best[mbtiType] = {
          score: endingData.score,
          type: endingData.type,
          variant: endingData.variant,
          timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(best));
      }
    } catch (e) {
      console.warn('Failed to save high score:', e);
    }
  }

  // ===== 弹层系统 =====
  function showModal(type, options) {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    const configs = {
      success: {
        icon: '✅',
        color: '#10b981',
        title: '成功',
        ...options
      },
      error: {
        icon: '❌',
        color: '#ef4444',
        title: '错误',
        ...options
      },
      warning: {
        icon: '⚠️',
        color: '#f59e0b',
        title: '警告',
        ...options
      },
      info: {
        icon: 'ℹ️',
        color: '#3b82f6',
        title: '提示',
        ...options
      },
      fail: {
        icon: '💔',
        color: '#64748b',
        title: '失败',
        ...options
      }
    };

    const config = configs[type] || configs.info;

    modalContainer.innerHTML = `
      <div class="modal-overlay active" id="modalOverlay">
        <div class="modal-card" role="dialog" aria-modal="true">
          <div class="modal-icon">${config.icon}</div>
          <h2 class="modal-title">${config.title}</h2>
          <p class="modal-message">${config.message || ''}</p>
          <div class="modal-actions">
            <button class="modal-btn primary" id="modalConfirmBtn">确定</button>
          </div>
        </div>
      </div>
    `;

    modalContainer.style.setProperty('--modal-color', config.color);

    // 绑定确认事件
    const confirmBtn = document.getElementById('modalConfirmBtn');
    confirmBtn.addEventListener('click', () => {
      hideModal();
      if (config.onConfirm) config.onConfirm();
    });

    // 点击遮罩关闭
    const overlay = document.getElementById('modalOverlay');
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        hideModal();
      }
    });
  }

  function hideModal() {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
      modalContainer.innerHTML = '';
    }
  }

  // ===== 错误兜底 =====
  function handleError(error) {
    console.error('Application error:', error);

    const fallback = document.createElement('div');
    fallback.style.cssText = `
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      color: #111;
      font-size: 18px;
      padding: 24px;
      text-align: center;
      z-index: 99999;
    `;
    fallback.textContent = '哎呀，出错了，请重启试试吧~';

    document.body.innerHTML = '';
    document.body.appendChild(fallback);
  }

  // ===== TTS UI 控制系统 =====
  function addTTSControls(container) {
    if (!container || !window.tts) return;

    // 避免重复添加
    if (container.querySelector('.tts-controls')) return;

    const controlsDiv = createElement('div', 'tts-controls');
    controlsDiv.innerHTML = `
      <div class="tts-toggle" id="ttsToggle" title="语音开关">
        <span class="tts-icon">🎙️</span>
        <span class="tts-status" id="ttsStatus"></span>
      </div>
      <div class="tts-volume-control" id="ttsVolumeControl">
        <input type="range" id="ttsVolumeSlider" min="0" max="1" step="0.1" 
               value="${window.TTSManager?.volume || 0.8}" title="音量">
      </div>
    `;

    container.appendChild(controlsDiv);

    // 绑定事件
    const toggleBtn = document.getElementById('ttsToggle');
    const volumeSlider = document.getElementById('ttsVolumeSlider');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const isEnabled = window.tts.toggle();
        updateTTSStatusUI(isEnabled);
      });

      // 初始化状态显示
      updateTTSStatusUI(window.TTSManager?.enabled !== false);
    }

    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        window.tts.setVolume(parseFloat(e.target.value));
      });
    }
  }

  function updateTTSControls(container) {
    if (!container) return;

    let controls = container.querySelector('.tts-controls');
    if (!controls) {
      addTTSControls(container);
      controls = container.querySelector('.tts-controls');
    }

    if (controls) {
      updateTTSStatusUI(window.TTSManager?.enabled !== false);
      
      const volumeSlider = document.getElementById('ttsVolumeSlider');
      if (volumeSlider && window.TTSManager) {
        volumeSlider.value = window.TTSManager.volume;
      }
    }
  }

  function updateTTSStatusUI(enabled) {
    const statusEl = document.getElementById('ttsStatus');
    const toggleEl = document.getElementById('ttsToggle');

    if (statusEl) {
      statusEl.textContent = enabled ? 'ON' : 'OFF';
      statusEl.className = `tts-status ${enabled ? 'enabled' : 'disabled'}`;
    }

    if (toggleEl) {
      toggleEl.className = `tts-toggle ${enabled ? 'active' : ''}`;
    }
  }

  // ===== 初始化应用 =====
  function initApp() {
    try {
      // 监听路由变化
      window.addEventListener('hashchange', onRouteChange);

      // 初始渲染
      renderRoute(getRoute());

      console.log('🗼 灯塔零点协议 - 初始化完成');
    } catch (error) {
      handleError(error);
    }
  }

  // 页面加载完成后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  // 暴露全局 API（供调试使用）
  window.LighthouseZeroProtocol = {
    store,
    navigate,
    showModal,
    hideModal,
    getState: () => ({ ...store })
  };

})();