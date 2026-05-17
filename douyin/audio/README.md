# TTS 语音系统使用指南

## 🎙️ 系统概述

灯塔零点协议集成了 **MiMo v2.5 TTS** 语音合成系统，为游戏提供沉浸式语音体验。

### 核心特性

- ✅ **多角色配音**：旁白、律师、护士、记者、广播系统各有专属音色
- ✅ **情绪控制**：支持 30+ 种情绪标签（恐惧、愤怒、释然等）
- ✅ **混合模式**：预生成音频 + 实时 API 调用
- ✅ **智能缓存**：音频预加载和本地缓存机制
- ✅ **用户控制**：音量调节、开关切换
- ✅ **优雅降级**：无音频时自动降级为纯文本模式

---

## 📁 文件结构

```
douyin/
├── js/
│   ├── tts-config.js      # TTS 配置（音色、情绪、关键对话）
│   └── tts-manager.js     # TTS 管理器核心模块
├── audio/                  # 预生成的音频文件
│   ├── chapter1/         # 第1章音频
│   ├── chapter2/         # 第2章音频
│   ├── chapter3/         # 第3章音频
│   ├── chapter4/         # 第4章音频
│   ├── endings/          # 结局音频
│   └── system/           # 系统音效
├── generate_tts_audio.py # 批量生成脚本
└── css/style.css         # TTS UI 样式
```

---

## 🚀 快速开始

### 方案一：仅使用预生成音频（推荐用于比赛）

1. **生成音频文件**（需要 MiMo API Key）

```bash
# 设置 API Key
export MIMO_API_KEY='your-api-key-here'

# 进入项目目录
cd douyin

# 安装 Python 依赖
pip install openai requests tqdm

# 预览将要生成的列表（不实际调用 API）
python generate_tts_audio.py --dry-run

# 生成所有高优先级音频
python generate_tts_audio.py --priority high

# 或生成全部音频
python generate_tts_audio.py
```

2. **启动项目**

```bash
npm run dev
```

3. **体验语音效果**

- 每个章节开场会自动播放旁白
- 场景描述会有语音解说
- 结局有专门的配音
- 右下角有🎙️按钮可控制语音开关和音量

---

### 方案二：实时 API 调用（需要网络）

在 [js/tts-config.js](js/tts-config.js) 中配置你的 API Key：

```javascript
const TTS_CONFIG = {
  api: {
    apiKey: 'your-mimo-api-key', // 替换为真实的 Key
    // ...
  }
};
```

**优点**：
- 支持动态内容（用户选择影响语音）
- 可根据 MBTI 结果调整语气
- 无需预生成，节省存储空间

**缺点**：
- 有延迟（1-3秒）
- 依赖网络连接
- API 调用成本

---

## 🎭 音色配置

### 角色分配

| 角色 | 音色ID | 声线特点 |
|------|--------|---------|
| **旁白 (narrator)** | 白桦（定制） | 低沉沙哑，深夜电台风格 |
| **律师 (lawyer)** | 苏打 | 成熟男性，冷峻理性 |
| **护士 (nurse)** | 冰糖 | 年轻女性，温柔脆弱 |
| **记者 (reporter)** | 白桦 | 中年男性，锐利急促 |
| **广播系统 (broadcast)** | 苏打 | 机械合成音，冰冷无情 |

### 情绪标签示例

```javascript
// 基础情绪
'(开心) 今天天气真好！'
'(悲伤) 我不想离开这里……'
'(愤怒) 你怎么可以这样做！'

// 复合情绪（MiMo 特色）
'(压抑的愤怒) 三年了……你以为我会忘记吗？'
'(带着哽咽的笑意) 原来……这就是真相。'
'(疲惫但庆幸) 我们……活下来了。'

// 细粒度控制
'(深呼吸) 呼……冷静，冷静。'
'(颤抖, 害怕) 别、别过来……'
'(提高音量喊话) 你们听我说！'
```

---

## 🔧 自定义配置

### 修改 [tts-config.js](js/tts-config.js)

#### 1. 添加新的关键对话

```javascript
keyDialogues: {
  chapter1: [
    {
      id: 'ch1_custom_1',
      text: '你要添加的对话文本',
      speaker: 'narrator', // narrator/lawyer/nurse/reporter/broadcast
      emotion: '(情绪标签) ',
      priority: 'high' // high/medium/low
    }
  ]
}
```

#### 2. 调整角色音色

```javascript
voices: {
  npc: {
    lawyer: {
      id: '苏打', // 可选：冰糖/茉莉/苏打/白桦/Mia/Chloe/Milo/Dean
      description: '自定义音色描述...',
      defaultStyle: '(默认情绪) '
    }
  }
}
```

#### 3. 使用音色设计功能（高级）

```javascript
voices: {
  system: {
    narrator: {
      model: 'mimo-v2.5-tts-voicedesign', // 使用音色设计模型
      customPrompt: `在这里详细描述你想要的音色...
        角色：...
        场景：...
        指导：...`
    }
  }
}
```

---

## 💡 最佳实践

### 1. 性能优化建议

- **优先使用预生成音频**：固定对话提前生成，避免运行时延迟
- **按需加载**：只预加载当前章节和下一章的音频
- **高优先级优先**：先生成 `priority: 'high'` 的关键对话

### 2. 成本控制

```bash
# 只生成必要的音频
python generate_tts_audio.py --priority high

# 按章节生成（测试时）
python generate_tts_audio.py --chapter 1

# 只生成特定角色
python generate_tts_audio.py --speaker narrator
```

### 3. 用户体验优化

- 默认开启语音（用户可自行关闭）
- 音量默认 80%（不会太吵）
- 提供明显的语音控制按钮
- 文本高亮同步（当前朗读句子发光）

---

## 🐛 故障排除

### 问题：没有声音

**检查清单**：
1. ✅ 是否生成了音频文件？查看 `/audio` 目录
2. ✅ API Key 是否配置正确？
3. ✅ 浏览器是否允许自动播放？
4. ✅ 点击右下角🎙️按钮确认语音是否开启

### 问题：API 调用失败

```bash
# 测试 API 连接
curl -X POST "https://api.xiaomimimo.com/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "api-key: YOUR_KEY" \
  -d '{"model":"mimo-v2.5-tts","messages":[{"role":"assistant","content":"测试"}],"audio":{"format":"wav","voice":"冰糖"}}'
```

### 问题：音频加载慢

- 启用预加载：系统会自动预加载当前章和下一章
- 减少并发：调整 `maxConcurrentDownloads` 参数
- 使用更小的格式：考虑 mp3 替代 wav

---

## 📊 统计信息

查看已生成的音频：

```bash
python generate_tts_audio.py --stats
```

输出示例：
```
📊 音频库统计:
   总文件数: 25
   总大小: 12.34 MB
   清单记录: 25 条
```

---

## 🎯 比赛演示建议

### 展示要点

1. **技术深度**：展示 TTS 配置系统的灵活性
2. **情绪控制**：对比不同情绪标签的效果差异
3. **用户体验**：演示语音开关、音量调节等交互
4. **性能优化**：说明预加载和缓存策略

### 备选方案

如果现场网络不稳定：
- ✅ 提前生成所有音频文件（离线可用）
- ✅ 准备备用的 demo 视频
- ✅ 截图展示不同情绪效果

---

## 📝 更新日志

### v1.0.0 (2026-05-17)
- ✅ 初始版本发布
- ✅ 支持 MiMo v2.5 TTS API
- ✅ 5 种角色音色配置
- ✅ 30+ 情绪标签支持
- ✅ 混合模式（预生成 + 实时）
- ✅ UI 控制系统
- ✅ 批量生成工具

---

## 📄 许可证

本项目仅供学习和比赛使用。MiMo API 的商业使用请遵循官方授权协议。

---

## 🤝 支持

如有问题，请检查：
1. [MiMo 官方文档](https://platform.xiaomimimo.com/docs/zh-CN/usage-guide/speech-synthesis-v2.5)
2. 控制台错误日志（F12 打开开发者工具）
3. 本文件的故障排除部分

**祝你在比赛中取得好成绩！🎉**
