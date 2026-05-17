/**
 * TTS 音频管理器 - 灯塔零点协议语音系统 (Howler.js 版)
 *
 * 使用 Howler.js 解决跨浏览器兼容性问题
 * 特点：
 * 1. 自动选择最佳播放引擎 (Web Audio API / HTML5 Audio)
 * 2. 内置音频缓存和池化
 * 3. 完善的错误处理和降级
 * 4. 统一的 API 接口
 */

(function() {
  'use strict';

  // 检查 Howler.js 是否加载
  if (typeof Howl === 'undefined' || typeof Howler === 'undefined') {
    console.error('❌ Howler.js 未加载！请确保在 index.html 中引入了 howler.js');
    return;
  }

  let instance = null;
  let userHasInteracted = false;

  class TTSManager {
    constructor() {
      if (instance) return instance;
      instance = this;

      // 核心状态
      this.enabled = true;
      this.volume = TTS_CONFIG?.ux?.defaults?.volume || 0.8;
      this.currentSound = null;
      this.isPlaying = false;

      // Howler.js 全局配置
      Howler.volume(this.volume);

      // 初始化
      this._loadUserSettings();
      this._setupUserInteractionListener();
      
      console.log('🎙️ TTS Manager 初始化完成 (Powered by Howler.js)');
      console.log(`🎙️ Howler.js 版本: ${Howler.version || 'unknown'}`);
      console.log(`🎙️ 使用引擎: ${Howler.usingWebAudio ? '✅ Web Audio API' : '⚠️ HTML5 Audio (降级)'}`);
    }

    _setupUserInteractionListener() {
      const unlockEvents = ['click', 'touchstart', 'keydown'];
      
      const unlock = () => {
        if (!userHasInteracted) {
          userHasInteracted = true;
          console.log('🎙️ 用户已交互，音频播放已解锁');
          
          // 解锁 Web Audio Context（如果被暂停）
          if (Howler.ctx && Howler.ctx.state === 'suspended') {
            Howler.ctx.resume();
          }
          
          unlockEvents.forEach(event => {
            document.removeEventListener(event, unlock);
          });
        }
      };
      
      unlockEvents.forEach(event => {
        document.addEventListener(event, unlock, { once: false });
      });
    }

    _loadUserSettings() {
      try {
        const saved = localStorage.getItem('tts_settings');
        if (saved) {
          const settings = JSON.parse(saved);
          this.enabled = settings.enabled !== false;
          this.volume = settings.volume || 0.8;
          Howler.volume(this.volume);
        }
      } catch (e) {
        console.warn('无法加载 TTS 设置');
      }
    }

    _saveUserSettings() {
      try {
        localStorage.setItem('tts_settings', JSON.stringify({
          enabled: this.enabled,
          volume: this.volume
        }));
      } catch (e) {
        console.warn('无法保存 TTS 设置');
      }
    }

    // ===== 公共 API =====

    async play(options) {
      console.log('🎙️ [TTS] play() 被调用', options);

      if (!this.enabled) {
        console.log('🎙️ [TTS] 语音功能已禁用');
        if (options.onEnd) options.onEnd();
        return;
      }

      const {
        text,
        speaker = 'narrator',
        emotion = '',
        dialogueId,
        priority = 'medium',
        onEnd,
        onStart,
        forceRealtime = false
      } = options;

      if (!text && !dialogueId) {
        console.warn('🎙️ [TTS] 文本和 ID 都为空，跳过播放');
        if (onEnd) onEnd();
        return;
      }

      // 构建完整的情绪化文本
      const fullText = this._buildEmotionText(text, speaker, emotion);
      console.log(`🎙️ [TTS] 准备播放: "${(text || dialogueId).substring(0, 50)}..."`);

      try {
        // 策略1：尝试从本地文件获取
        if (!forceRealtime && dialogueId) {
          console.log('🎙️ [TTS] 策略1: 尝试本地文件...');
          const localResult = await this._playLocalFile(dialogueId, onEnd, onStart);
          if (localResult) return;
        }

        // 策略2：实时调用 TTS API
        const apiKey = TTS_CONFIG?.api?.apiKey;
        if (apiKey && apiKey !== 'YOUR_API_KEY_HERE' && text) {
          console.log('🎙️ [TTS] 策略2: 实时 TTS API...');
          await this._playRealtimeTTS(fullText, speaker, onEnd, onStart);
          return;
        }

        // 降级：无可用音频源
        console.log(`🎙️ [TTS] 无可用音频源`);
        if (onEnd) onEnd();

      } catch (error) {
        console.error('🎙️ [TTS] ❌ 播放失败:', error);
        if (onEnd) onEnd();
      }
    }

    async preloadChapter(chapterId) {
      if (!this.enabled) return;

      const dialogues = this._getChapterDialogues(chapterId);
      if (!dialogues || dialogues.length === 0) return;

      console.log(`🎙️ 预加载第 ${chapterId} 章 (${dialogues.length} 条)`);

      for (const dialogue of dialogues) {
        try {
          await this._preloadSound(dialogue.id);
        } catch (e) {
          console.warn(`预加载失败: ${dialogue.id}`);
        }
      }
    }

    stop() {
      if (this.currentSound) {
        this.currentSound.stop();
        this.currentSound.unload(); // 释放资源
        this.currentSound = null;
      }
      this.isPlaying = false;
    }

    pause() {
      if (this.currentSound) {
        this.currentSound.pause();
      }
      this.isPlaying = false;
    }

    resume() {
      if (this.currentSound) {
        this.currentSound.play();
        this.isPlaying = true;
      }
    }

    setVolume(volume) {
      this.volume = Math.max(0, Math.min(1, volume));
      Howler.volume(this.volume);
      if (this.currentSound) {
        this.currentSound.volume(this.volume);
      }
      this._saveUserSettings();
      console.log(`🎙️ [TTS] 音量设置为: ${Math.round(this.volume * 100)}%`);
    }

    toggle() {
      this.enabled = !this.enabled;
      if (!this.enabled) {
        this.stop();
      }
      this._saveUserSettings();
      console.log(`🎙️ [TTS] 语音功能: ${this.enabled ? '✅ 开启' : '❌ 关闭'}`);
      return this.enabled;
    }

    getStatus() {
      return {
        enabled: this.enabled,
        volume: this.volume,
        isPlaying: this.isPlaying,
        usingWebAudio: Howler.usingWebAudio,
        howlerCodecs: Howler.codecs,
        userHasInteracted: userHasInteracted
      };
    }

    // ===== 内部方法 =====

    _buildEmotionText(text, speaker, customEmotion) {
      let emotionPrefix = '';

      if (customEmotion) {
        emotionPrefix = customEmotion;
      } else if (speaker && TTS_CONFIG?.voices?.npc?.[speaker]) {
        emotionPrefix = TTS_CONFIG.voices.npc[speaker].defaultStyle || '';
      } else if (speaker === 'narrator') {
        emotionPrefix = '(低沉, 缓慢) ';
      } else if (speaker === 'broadcast') {
        emotionPrefix = '(机械, 冰冷) ';
      }

      return emotionPrefix + text;
    }

    /**
     * 使用 Howler.js 播放本地文件
     * 不再使用 HEAD 请求检测文件（Vite SPA 会误判）
     * 直接用 Howl 尝试加载，失败则尝试下一个路径
     */
    async _playLocalFile(dialogueId, onEnd, onStart) {
      const possiblePaths = [
        `/audio/chapter1/${dialogueId}.wav`,
        `/audio/chapter2/${dialogueId}.wav`,
        `/audio/chapter3/${dialogueId}.wav`,
        `/audio/chapter4/${dialogueId}.wav`,
        `/audio/endings/${dialogueId}.wav`,
        `/audio/system/${dialogueId}.wav`,
        `/audio/${dialogueId}.wav`
      ];

      for (const path of possiblePaths) {
        try {
          const result = await this._tryPlayWithHowler(path, onEnd, onStart);
          if (result) return true;
        } catch (e) {
          continue;
        }
      }

      console.log(`🎙️ [TTS] 未找到可用文件: ${dialogueId}`);
      return false;
    }

    /**
     * 尝试用 Howler 加载并播放指定路径的音频
     * 返回 Promise<boolean> - true=成功, false=失败
     */
    _tryPlayWithHowler(path, onEnd, onStart) {
      return new Promise((resolve) => {
        console.log(`🎙️ [TTS] 尝试加载: ${path}`);

        this._stopCurrentSound();

        let resolved = false;

        const sound = new Howl({
          src: [path],
          volume: this.volume,
          html5: true,
          format: ['wav'],

          onload: () => {
            if (resolved) return;
            resolved = true;
            console.log(`🎙️ [TTS] ✅ Howler 加载成功: ${path}`);
            console.log(`🎙️ [TTS] 时长: ${sound.duration().toFixed(1)}s`);
            if (onStart) onStart();
            this.isPlaying = true;
          },

          onplay: () => {
            console.log('🎙️ [TTS] 🎵🎵🎵 Howler 开始播放！');
          },

          onend: () => {
            console.log('🎙️ [TTS] ✅ 播放结束');
            this.isPlaying = false;
            this.currentSound = null;
            if (onEnd) onEnd();
            resolve(true);
          },

          onstop: () => {
            this.isPlaying = false;
            this.currentSound = null;
          },

          onloaderror: (id, error) => {
            if (resolved) return;
            resolved = true;
            console.log(`🎙️ [TTS] ⚠️ 文件不可用: ${path} (error: ${error})`);
            sound.unload();
            resolve(false);
          },

          onplayerror: (id, error) => {
            console.warn('🎙️ [TTS] ⚠️ 播放被阻止，尝试解锁...');
            sound.once('unlock', () => {
              sound.play();
            });
          }
        });

        this.currentSound = sound;
        sound.play();

        // 超时保护：3秒内如果既没有 onload 也没有 onloaderror，视为失败
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            console.log(`🎙️ [TTS] ⏱️ 加载超时: ${path}`);
            sound.unload();
            resolve(false);
          }
        }, 3000);
      });
    }

    async _preloadSound(dialogueId) {
      try {
        const path = `/audio/chapter1/${dialogueId}.wav`;
        const exists = await this._checkFileExists(path);
        
        if (exists) {
          // 预加载但不播放
          const sound = new Howl({
            src: [path],
            volume: 0, // 静音预加载
            preload: true,
            autoplay: false
          });
          
          console.log(`🎙️ 预加载成功: ${dialogueId}`);
        }
      } catch (e) {
        console.warn(`预加载失败: ${dialogueId}`, e);
      }
    }

    _stopCurrentSound() {
      if (this.currentSound) {
        this.currentSound.stop();
        this.currentSound.unload();
        this.currentSound = null;
      }
      this.isPlaying = false;
    }

    /**
     * 实时调用 MiMo TTS API 并用 Howler 播放
     */
    async _playRealtimeTTS(text, speaker, onEnd, onStart) {
      const apiKey = TTS_CONFIG?.api?.apiKey;
      
      if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
        throw new Error('API Key 未配置');
      }

      let voiceId = 'mimo_default';
      let styleInstruction = '';
      let model = TTS_CONFIG.api.model;

      if (speaker && TTS_CONFIG?.voices?.npc?.[speaker]) {
        voiceId = TTS_CONFIG.voices.npc[speaker].id;
        styleInstruction = TTS_CONFIG.voices.npc[speaker].description;
      } else if (speaker === 'narrator') {
        styleInstruction = TTS_CONFIG?.voices?.system?.narrator?.customPrompt || '';
      } else if (speaker === 'broadcast') {
        voiceId = TTS_CONFIG.voices?.system?.broadcast?.id || '苏打';
        styleInstruction = '机械合成音';
      }

      console.log(`🎙️ [TTS] 调用实时 API...`);

      try {
        const response = await fetch(`${TTS_CONFIG.api.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'user', content: styleInstruction },
              { role: 'assistant', content: text }
            ],
            audio: {
              format: TTS_CONFIG.api.audioFormat,
              voice: voiceId
            }
          })
        });

        if (!response.ok) {
          throw new Error(`API 错误: ${response.status}`);
        }

        const result = await response.json();
        const audioDataBase64 = result.choices[0].message.audio.data;
        
        // Base64 解码
        const binaryString = atob(audioDataBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // 创建 Blob URL
        const blob = new Blob([bytes], { type: 'audio/wav' });
        const blobUrl = URL.createObjectURL(blob);

        console.log(`🎙️ [TTS] ✅ API 响应成功 (${(bytes.length/1024).toFixed(1)} KB)`);

        // 使用 Howler 播放 Blob URL
        return new Promise((resolve) => {
          this._stopCurrentSound();

          this.currentSound = new Howl({
            src: [blobUrl],
            volume: this.volume,
            format: ['wav'],
            
            onload: () => {
              console.log('🎙️ [TTS] ✅ Howler 加载 API 音频成功');
              if (onStart) onStart();
              this.isPlaying = true;
            },
            
            onloaderror: (id, err) => {
              console.error('🎙️ [TTS] ❌ Howler 加载错误:', err);
              URL.revokeObjectURL(blobUrl);
              if (onEnd) onEnd();
              resolve();
            },
            
            onplay: () => {
              console.log('🎙️ [TTS] 🎵🎵🎵 实时 TTS 开始播放！');
            },
            
            onend: () => {
              console.log('🎙️ [TTS] ✅ 实时 TTS 播放结束');
              URL.revokeObjectURL(blobUrl); // 清理 Blob URL
              this.isPlaying = false;
              this.currentSound = null;
              if (onEnd) onEnd();
              resolve();
            },
            
            onplayerror: (id, err) => {
              console.error('🎙️ [TTS] ❌ 播放错误:', err);
              if (this.currentSound) {
                this.currentSound.once('unlock', () => {
                  this.currentSound.play();
                });
              }
            }
          });

          this.currentSound.play();
        });

      } catch (error) {
        console.error('🎙️ [TTS] ❌ API 调用失败:', error);
        throw error;
      }
    }

    _getChapterDialogues(chapterId) {
      const allDialogues = [];

      if (!TTS_CONFIG?.keyDialogues) return allDialogues;

      const chapterKey = `chapter${chapterId}`;
      if (TTS_CONFIG.keyDialogues[chapterKey]) {
        allDialogues.push(...TTS_CONFIG.keyDialogues[chapterKey]);
      }

      return allDialogues.filter(d => d.priority === 'high');
    }

    destroy() {
      this.stop();
      Howler.unload(); // 卸载所有 Howler 缓存
      instance = null;
    }
  }

  // ===== 全局暴露 =====
  window.TTSManager = new TTSManager();

  window.tts = {
    play: (options) => window.TTSManager.play(options),
    stop: () => window.TTSManager.stop(),
    pause: () => window.TTSManager.pause(),
    resume: () => window.TTSManager.resume(),
    setVolume: (vol) => window.TTSManager.setVolume(vol),
    toggle: () => window.TTSManager.toggle(),
    preloadChapter: (id) => window.TTSManager.preloadChapter(id),
    getStatus: () => window.TTSManager.getStatus()
  };

  // 调试方法
  window.ttsDebug = {
    testPlay: async () => {
      console.log('🎙️ [DEBUG] 测试实时 TTS...');
      await window.tts.play({
        text: '这是一个测试。如果你能听到这段话，说明 TTS 系统工作正常！',
        speaker: 'narrator',
        dialogueId: 'debug_test'
      });
    },
    
    testLocalFile: async (filename) => {
      console.log(`🎙️ [DEBUG] 测试本地文件: ${filename}`);
      await window.tts.play({
        text: '测试本地文件播放',
        dialogueId: filename
      });
    },

    showStatus: () => {
      const status = window.TTSManager.getStatus();
      console.table(status);
      alert(`TTS 状态:\n${JSON.stringify(status, null, 2)}`);
    }
  };

  console.log('🎙️ TTS 系统 (Howler.js) 加载完成！');
  console.log('🎙️ 调试命令:');
  console.log('  - ttsDebug.testPlay()');
  console.log('  - ttsDebug.testLocalFile("sample_narrator_1")');
  console.log('  - ttsDebug.showStatus()');

})();
