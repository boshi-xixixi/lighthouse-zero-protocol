import { Howl, Howler } from 'howler'

const API_KEY = 'sk-ctd025cd9llwa9dyxvpt7vm4t1tzo8wwpiejalvplmu2n1y4'
const API_BASE = 'https://api.xiaomimimo.com/v1'

const VOICES = {
  narrator: { id: '白桦', description: '低沉沙哑的男声，像深夜电台主持人，语速极慢，每个字都像是在回忆一段被掩盖的真相。', defaultStyle: '(低沉, 缓慢, 带着不祥的预感) ' },
  lawyer: { id: '苏打', description: '成熟男性，冷峻理性，像法庭上的辩护律师，每个词都经过精心斟酌。', defaultStyle: '(冷漠, 理性) ' },
  nurse: { id: '冰糖', description: '年轻女性，温柔但带着深深的恐惧感，像是在黑暗中颤抖着说话。', defaultStyle: '(颤抖, 害怕) ' },
  reporter: { id: '白桦', description: '中年男性，锐利急促，像是一个追查真相多年的记者。', defaultStyle: '(急促, 激动) ' },
  broadcast: { id: '苏打', description: '机械合成音，冰冷无情，没有任何感情波动。', defaultStyle: '(机械, 冰冷, 毫无起伏) ' }
}

const ENDING_VOICES = {
  truth: '(释然, 温暖) ',
  escape: '(疲惫但庆幸) ',
  backfire: '(绝望, 崩溃) ',
  zero: '(平静, 超脱) ',
  secret: '(神秘, 低语) '
}

const PATH_MAP = {
  'ch1_intro': '/audio/chapter1/ch1_intro.wav',
  'ch1_broadcast': '/audio/chapter1/ch1_broadcast.wav',
  '1-1': '/audio/chapter1/1-1.wav',
  '1-1_nurse': '/audio/chapter1/1-1_nurse.wav',
  'ch1_end': '/audio/chapter1/ch1_end.wav',
  'ch2_intro': '/audio/chapter2/ch2_intro.wav',
  'ch2_reporter': '/audio/chapter2/ch2_reporter.wav',
  'ch2_tail': '/audio/chapter2/ch2_tail.wav',
  '2-1': '/audio/chapter2/2-1.wav',
  'ch2_end': '/audio/chapter2/ch2_end.wav',
  'ch3_intro': '/audio/chapter3/ch3_intro.wav',
  'ch3_reporter': '/audio/chapter3/ch3_reporter.wav',
  'ch3_nurse': '/audio/chapter3/ch3_nurse.wav',
  'ch3_tail': '/audio/chapter3/ch3_tail.wav',
  '3-1': '/audio/chapter3/3-1.wav',
  'ch3_end': '/audio/chapter3/ch3_end.wav',
  'ch4_intro': '/audio/chapter4/ch4_intro.wav',
  'ch4_broadcast': '/audio/chapter4/ch4_broadcast.wav',
  '4-1': '/audio/chapter4/4-1.wav',
  'ch4_end': '/audio/chapter4/ch4_end.wav',
  'ending_truth': '/audio/endings/ending_truth.wav',
  'ending_escape': '/audio/endings/ending_escape.wav',
  'ending_backfire': '/audio/endings/ending_backfire.wav',
  'ending_zero': '/audio/endings/ending_zero.wav',
  'system_welcome': '/audio/system/system_welcome.wav',
  'system_countdown': '/audio/system/system_countdown.wav',
  'system_vote': '/audio/system/system_vote.wav'
}

const CHAPTER_PLAYLISTS = {
  1: {
    intro: ['ch1_intro', 'ch1_broadcast'],
    '1-1': ['1-1', '1-1_nurse'],
    end: ['ch1_end']
  },
  2: {
    intro: ['ch2_intro', 'ch2_reporter', 'ch2_tail'],
    '2-1': ['2-1'],
    end: ['ch2_end']
  },
  3: {
    intro: ['ch3_intro', 'ch3_reporter', 'ch3_nurse', 'ch3_tail'],
    '3-1': ['3-1'],
    end: ['ch3_end']
  },
  4: {
    intro: ['ch4_intro', 'ch4_broadcast'],
    '4-1': ['4-1'],
    end: ['ch4_end']
  }
}

const CHAPTER_PRELOAD = {
  1: ['ch1_intro', 'ch1_broadcast', '1-1', '1-1_nurse', 'ch1_end'],
  2: ['ch2_intro', 'ch2_reporter', 'ch2_tail', '2-1', 'ch2_end'],
  3: ['ch3_intro', 'ch3_reporter', 'ch3_nurse', 'ch3_tail', '3-1', 'ch3_end'],
  4: ['ch4_intro', 'ch4_broadcast', '4-1', 'ch4_end'],
  endings: ['ending_truth', 'ending_escape', 'ending_backfire', 'ending_zero']
}

let currentSound = null
let isEnabled = true
let volume = 0.8
let isPlaying = false
let playlistQueue = []
let playlistActive = false
const soundCache = new Map()

try {
  const saved = localStorage.getItem('tts_settings')
  if (saved) {
    const s = JSON.parse(saved)
    isEnabled = s.enabled !== false
    volume = s.volume ?? 0.8
  }
} catch (e) { /* ignore */ }

function saveSettings() {
  try {
    localStorage.setItem('tts_settings', JSON.stringify({ enabled: isEnabled, volume }))
  } catch (e) { /* ignore */ }
}

function stopCurrent() {
  playlistQueue = []
  playlistActive = false
  if (currentSound) {
    currentSound.stop()
    isPlaying = false
    currentSound = null
  }
}

function getOrCreateSound(dialogueId) {
  if (soundCache.has(dialogueId)) {
    return soundCache.get(dialogueId)
  }

  const path = PATH_MAP[dialogueId]
  if (!path) return null

  const sound = new Howl({
    src: [path],
    volume,
    html5: true,
    format: ['wav'],
    preload: true,
    onload() {
      console.log(`🎙️ [TTS] ✅ 预加载完成: ${dialogueId}`)
    },
    onloaderror() {
      console.warn(`🎙️ [TTS] ⚠️ 预加载失败: ${dialogueId}`)
      soundCache.delete(dialogueId)
    },
    onplayerror() {
      sound.once('unlock', () => sound.play())
    }
  })

  soundCache.set(dialogueId, sound)
  return sound
}

function preloadChapter(chapterId) {
  const ids = CHAPTER_PRELOAD[chapterId]
  if (!ids) return

  for (const id of ids) {
    getOrCreateSound(id)
  }

  console.log(`🎙️ [TTS] 📦 预加载第${chapterId}章音频: ${ids.join(', ')}`)
}

function preloadEndings() {
  preloadChapter('endings')
}

function playSingle(dialogueId, onEnd) {
  const path = PATH_MAP[dialogueId]
  if (!path) {
    onEnd?.()
    return
  }

  let sound = soundCache.get(dialogueId)

  if (sound && (sound.state() === 'loaded' || sound.state() === 'loading')) {
    attemptPlay(sound)
    return
  }

  sound = new Howl({
    src: [path],
    volume,
    html5: true,
    format: ['wav'],
    preload: true,
    onloaderror() {
      console.warn(`🎙️ [TTS] ⚠️ 加载失败，重试: ${dialogueId}`)
      soundCache.delete(dialogueId)
      const retry = new Howl({
        src: [path], volume, html5: true, format: ['wav'],
        onplayerror(s) { s.once('unlock', () => s.play()) }
      })
      soundCache.set(dialogueId, retry)
      currentSound = retry
      isPlaying = true
      retry.once('end', () => { isPlaying = false; currentSound = null; onEnd?.() })
      retry.play()
    },
    onplayerror(s) { s.once('unlock', () => s.play()) }
  })

  soundCache.set(dialogueId, sound)
  attemptPlay(sound)

  function attemptPlay(s) {
    s.stop()
    s.seek(0)
    currentSound = s
    isPlaying = true

    let ended = false
    const onEnded = () => {
      if (ended) return
      ended = true
      isPlaying = false
      currentSound = null
      onEnd?.()
    }

    s.once('end', onEnded)

    if (s.state() === 'loaded') {
      s.play()
      console.log(`🎙️ [TTS] ⚡ 播放: ${dialogueId} (${s.duration()?.toFixed(1)}s)`)
    } else {
      s.once('load', () => {
        s.play()
        console.log(`🎙️ [TTS] ⚡ 加载后播放: ${dialogueId} (${s.duration()?.toFixed(1)}s)`)
      })
    }
  }
}

function playPlaylist(ids, onAllEnd) {
  if (!isEnabled || !ids || ids.length === 0) {
    onAllEnd?.()
    return
  }

  stopCurrent()
  playlistQueue = [...ids]
  playlistActive = true

  function playNext() {
    if (!playlistActive || playlistQueue.length === 0) {
      playlistActive = false
      onAllEnd?.()
      return
    }

    const id = playlistQueue.shift()
    playSingle(id, playNext)
  }

  playNext()
}

function play(options) {
  const { text, speaker = 'narrator', emotion = '', dialogueId, onEnd, onStart } = options

  if (!isEnabled) {
    onEnd?.()
    return
  }

  stopCurrent()

  const voice = VOICES[speaker] || VOICES.narrator
  const stylePrefix = emotion || voice.defaultStyle

  if (dialogueId && PATH_MAP[dialogueId]) {
    playSingle(dialogueId, onEnd)
    onStart?.()
    return
  }

  if (text) {
    playRealtime(stylePrefix + text, voice, onEnd, onStart)
    return
  }

  onEnd?.()
}

function playChapterPlaylist(chapterId, sceneKey, onEnd) {
  stopCurrent()
  const playlist = CHAPTER_PLAYLISTS[chapterId]
  if (!playlist || !playlist[sceneKey]) {
    onEnd?.()
    return
  }
  playPlaylist(playlist[sceneKey], onEnd)
}

async function playRealtime(text, voice, onEnd, onStart) {
  try {
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY
      },
      body: JSON.stringify({
        model: 'mimo-v2.5-tts',
        messages: [
          { role: 'user', content: voice.description },
          { role: 'assistant', content: text }
        ],
        audio: { format: 'wav', voice: voice.id }
      })
    })

    if (!response.ok) throw new Error(`API ${response.status}`)

    const result = await response.json()
    const audioData = result.choices[0].message.audio.data

    const binaryStr = atob(audioData)
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }

    const blob = new Blob([bytes], { type: 'audio/wav' })
    const blobUrl = URL.createObjectURL(blob)

    console.log(`🎙️ [TTS] ✅ API 响应成功 (${(bytes.length / 1024).toFixed(1)} KB)`)

    const sound = new Howl({
      src: [blobUrl],
      volume,
      format: ['wav'],

      onload() {
        onStart?.()
        isPlaying = true
      },

      onplay() {
        console.log('🎙️ [TTS] 🎵 实时 TTS 播放中')
      },

      onend() {
        URL.revokeObjectURL(blobUrl)
        isPlaying = false
        currentSound = null
        onEnd?.()
      },

      onstop() {
        URL.revokeObjectURL(blobUrl)
        isPlaying = false
        currentSound = null
      },

      onloaderror() {
        URL.revokeObjectURL(blobUrl)
        console.warn('🎙️ [TTS] ⚠️ 音频加载失败，跳过')
        onEnd?.()
      },

      onplayerror() {
        sound.once('unlock', () => sound.play())
      }
    })

    currentSound = sound
    sound.play()
  } catch (error) {
    console.warn('🎙️ [TTS] ⚠️ API 调用失败，跳过语音播放:', error.message || error)
    onEnd?.()
  }
}

function stop() { stopCurrent() }

function setVolume(v) {
  volume = Math.max(0, Math.min(1, v))
  for (const sound of soundCache.values()) {
    sound.volume(volume)
  }
  if (currentSound) currentSound.volume(volume)
  saveSettings()
}

function toggle() {
  isEnabled = !isEnabled
  if (!isEnabled) stop()
  saveSettings()
  return isEnabled
}

function getStatus() {
  return { enabled: isEnabled, volume, isPlaying, usingWebAudio: Howler.usingWebAudio }
}

export function useTTS() {
  return {
    play,
    stop,
    setVolume,
    toggle,
    getStatus,
    preloadChapter,
    preloadEndings,
    playChapterPlaylist,
    VOICES,
    ENDING_VOICES,
    get enabled() { return isEnabled },
    get playing() { return isPlaying }
  }
}
