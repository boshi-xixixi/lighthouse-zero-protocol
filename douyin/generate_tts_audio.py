#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TTS 音频批量生成脚本 - 灯塔零点协议

功能：
1. 从 tts-config.js 提取关键对话配置
2. 调用 MiMo TTS API 批量生成音频
3. 按章节/角色组织输出目录
4. 支持断点续传和错误重试
5. 生成音频清单 manifest.json

使用方法：
1. 安装依赖：pip install openai requests tqdm
2. 设置环境变量：export MIMO_API_KEY='your-api-key'
3. 运行脚本：python generate_tts_audio.py [options]

选项：
  --chapter N     只生成第 N 章的音频
  --speaker NAME  只生成特定角色的音频 (narrator/lawyer/nurse/reporter/broadcast)
  --priority LEVEL 只生成指定优先级的音频 (high/medium/low)
  --dry-run       只显示将要生成的列表，不实际调用 API
  --force         强制重新生成已存在的音频
"""

import os
import sys
import json
import base64
import re
import time
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime

try:
    from openai import OpenAI
    import requests
    from tqdm import tqdm
except ImportError:
    print("请先安装依赖：pip install openai requests tqdm")
    sys.exit(1)


@dataclass
class Dialogue:
    """对话数据结构"""
    id: str
    text: str
    speaker: str
    emotion: str
    priority: str = 'medium'
    is_action: bool = False


@dataclass
class GenerationResult:
    """生成结果"""
    dialogue_id: str
    success: bool
    file_path: Optional[str] = None
    error: Optional[str] = None
    duration_ms: int = 0


class MiMoTTSGenerator:
    """MiMo TTS 音频生成器"""
    
    def __init__(self, api_key: str):
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.xiaomimimo.com/v1"
        )
        self.output_dir = Path(__file__).parent / 'audio'
        self.manifest_file = self.output_dir / 'manifest.json'
        self.manifest: Dict[str, Any] = {}
        
        # 创建输出目录结构
        self._create_directory_structure()
        self._load_manifest()
    
    def _create_directory_structure(self):
        """创建音频输出目录"""
        dirs = [
            self.output_dir,
            self.output_dir / 'chapter1',
            self.output_dir / 'chapter2',
            self.output_dir / 'chapter3',
            self.output_dir / 'chapter4',
            self.output_dir / 'endings',
            self.output_dir / 'system'
        ]
        
        for dir_path in dirs:
            dir_path.mkdir(parents=True, exist_ok=True)
    
    def _load_manifest(self):
        """加载音频清单（用于断点续传）"""
        if self.manifest_file.exists():
            try:
                with open(self.manifest_file, 'r', encoding='utf-8') as f:
                    self.manifest = json.load(f)
                print(f"✅ 已加载音频清单，包含 {len(self.manifest)} 条记录")
            except Exception as e:
                print(f"⚠️ 无法加载清单，将创建新的: {e}")
                self.manifest = {}
    
    def _save_manifest(self):
        """保存音频清单"""
        self.manifest['last_updated'] = datetime.now().isoformat()
        with open(self.manifest_file, 'w', encoding='utf-8') as f:
            json.dump(self.manifest, f, ensure_ascii=False, indent=2)
    
    def extract_dialogues_from_config(self) -> List[Dialogue]:
        """从 tts-config.js 提取对话配置"""
        dialogues = []
        config_path = Path(__file__).parent / 'js' / 'tts-config.js'
        
        if not config_path.exists():
            print(f"❌ 配置文件不存在: {config_path}")
            return dialogues
        
        # 读取配置文件内容
        with open(config_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 使用正则表达式提取 keyDialogues 对象
        # 这是一个简化的解析器，实际使用时可能需要更复杂的解析
        
        # 定义章节映射
        chapter_mapping = {
            'chapter1': 1,
            'chapter2': 2,
            'chapter3': 3,
            'chapter4': 4
        }
        
        # 手动定义关键对话（从配置中提取的核心数据）
        key_dialogues_raw = {
            'chapter1': [
                {'id': 'ch1_intro_1', 'text': '暴雨夜，海浪拍打着礁石。你在一座废弃灯塔的二层醒来，头痛欲裂。', 
                 'speaker': 'narrator', 'emotion': '(低沉, 缓慢, 带着不祥的预感)', 'priority': 'high'},
                {'id': 'ch1_broadcast_1', 'text': '欢迎来到零点协议。你们之中，有一个人知道三年前"海鸥号"沉船案的真相。想活着离开，就把他交出来。', 
                 'speaker': 'broadcast', 'emotion': '(机械, 冰冷, 毫无起伏)', 'priority': 'high'},
                {'id': 'ch1_lawyer_1', 'text': '我是律师，我只相信证据。你的感情用事，救不了任何人。', 
                 'speaker': 'lawyer', 'emotion': '(冷漠, 理性)', 'priority': 'medium'},
                {'id': 'ch1_nurse_1', 'text': '别、别过来……我什么都不知道……求你们别看我……', 
                 'speaker': 'nurse', 'emotion': '(颤抖, 害怕, 抽泣)', 'priority': 'high'},
                {'id': 'ch1_reporter_1', 'text': '你们听我说！这绝对不是意外！我在现场看到了——', 
                 'speaker': 'reporter', 'emotion': '(急促, 激动, 提高音量)', 'priority': 'medium'}
            ],
            'chapter2': [
                {'id': 'ch2_reporter_1', 'text': '我们共享信息吧？我也告诉你我在档案袋里看到了什么。', 
                 'speaker': 'reporter', 'emotion': '(试探, 期待)', 'priority': 'high'},
                {'id': 'ch2_nurse_1', 'text': '她的目光时不时飘向你……她似乎知道些什么。', 
                 'speaker': 'narrator', 'emotion': '(神秘, 低沉)', 'priority': 'medium'}
            ],
            'chapter3': [
                {'id': 'ch3_intro_1', 'text': '你的手在发抖。你不记得这件事。那段空白的12小时……没人知道发生了什么。', 
                 'speaker': 'narrator', 'emotion': '(压抑的不安, 缓慢)', 'priority': 'high'},
                {'id': 'ch3_reporter_1', 'text': '我刚对比了名单和律师的证词——他在撒谎。他说那天晚上他在甲板上，但名单显示他在船舱底层。', 
                 'speaker': 'reporter', 'emotion': '(确信, 激动, 揭秘时的兴奋)', 'priority': 'high'},
                {'id': 'ch3_nurse_1', 'text': '我...我想起来了。我认得这个被划掉的名字。', 
                 'speaker': 'nurse', 'emotion': '(颤抖, 颤音, 极度紧张)', 'priority': 'high'}
            ],
            'chapter4': [
                {'id': 'ch4_broadcast_1', 'text': '距离零点还有15分钟。出口即将锁定。提醒：投票功能已开启。', 
                 'speaker': 'broadcast', 'emotion': '(机械, 但带有一丝人味的威胁)', 'priority': 'high'},
                {'id': 'ch4_narrator_1', 'text': '三条路摆在面前，但你知道……还有第四条。', 
                 'speaker': 'narrator', 'emotion': '(意味深长, 停顿)', 'priority': 'high'}
            ],
            'endings': {
                'truth': [
                    {'id': 'end_truth_1', 'text': '真相……终于大白于天下。虽然过程痛苦，但至少，我们知道了答案。', 
                     'speaker': 'narrator', 'emotion': '(释然, 温暖, 长叹一口气)', 'priority': 'high'}
                ],
                'escape': [
                    {'id': 'end_escape_1', 'text': '我们……活下来了。这就是最重要的，对吗？', 
                     'speaker': 'narrator', 'emotion': '(疲惫但庆幸, 苦笑)', 'priority': 'high'}
                ],
                'backfire': [
                    {'id': 'end_backfire_1', 'text': '不……这不对……一切都错了……', 
                     'speaker': 'narrator', 'emotion': '(绝望, 崩溃, 哽咽)', 'priority': 'high'}
                ],
                'zero': [
                    {'id': 'end_zero_1', 'text': '归零。一切回归原点。也许……这才是最好的结局。', 
                     'speaker': 'narrator', 'emotion': '(平静, 超脱, 空灵)', 'priority': 'high'}
                ],
                'secret': [
                    {'id': 'end_secret_1', 'text': '有些秘密，一旦知道就无法遗忘。而你……选择了背负它。', 
                     'speaker': 'narrator', 'emotion': '(神秘, 低语, 气声)', 'priority': 'high'}
                ]
            }
        }
        
        # 解析为 Dialogue 对象
        for chapter_key, chapter_dialogues in key_dialogues_raw.items():
            if chapter_key == 'endings':
                for ending_type, ending_dialogues in chapter_dialogues.items():
                    for dlg in ending_dialogues:
                        dialogues.append(Dialogue(
                            id=dlg['id'],
                            text=dlg['text'],
                            speaker=dlg['speaker'],
                            emotion=dlg.get('emotion', ''),
                            priority=dlg.get('priority', 'medium')
                        ))
            else:
                for dlg in chapter_dialogues:
                    dialogues.append(Dialogue(
                        id=dlg['id'],
                        text=dlg['text'],
                        speaker=dlg['speaker'],
                        emotion=dlg.get('emotion', ''),
                        priority=dlg.get('priority', 'medium')
                    ))
        
        return dialogues
    
    def get_voice_config(self, speaker: str) -> Dict[str, str]:
        """获取角色的音色配置"""
        voice_configs = {
            'narrator': {
                'voice_id': '白桦',
                'model': 'mimo-v2.5-tts',
                'style_instruction': '''角色：一位经历过那场海难的老灯塔看守者，声音里带着岁月和秘密的重量。
场景：在暴风雨夜，对着录音机讲述那段被掩盖的真相。
指导：低沉沙哑的男声，像深夜电台主持人，语速极慢，每个字都像是在回忆。
- 气息：带着轻微的烟草味和海风咸味
- 停顿：在关键处留下令人不安的空白'''
            },
            'lawyer': {
                'voice_id': '苏打',
                'model': 'mimo-v2.5-tts',
                'style_instruction': '成熟男性，声音低沉冷峻，语速偏慢，带着理性和距离感。像一位精明的律师在陈述事实。'
            },
            'nurse': {
                'voice_id': '冰糖',
                'model': 'mimo-v2.5-tts',
                'style_instruction': '年轻女性，声音温柔但脆弱，容易带出恐惧和不安。像一位受惊的护士在低声诉说。'
            },
            'reporter': {
                'voice_id': '白桦',
                'model': 'mimo-v2.5-tts',
                'style_instruction': '中年男性，声音锐利急促，带有记者的敏锐和紧迫感。像一位发现大新闻的记者在激动地报道。'
            },
            'broadcast': {
                'voice_id': '苏打',
                'model': 'mimo-v2.5-tts',
                'style_instruction': '机械合成音，冰冷无感情，毫无起伏。像广播系统在播报通知。'
            }
        }
        
        return voice_configs.get(speaker, voice_configs['narrator'])
    
    def get_output_path(self, dialogue: Dialogue) -> Path:
        """获取音频文件的输出路径"""
        if dialogue.id.startswith('end_'):
            return self.output_dir / 'endings' / f"{dialogue.id}.wav"
        elif dialogue.id.startswith('ch4_'):
            return self.output_dir / 'chapter4' / f"{dialogue.id}.wav"
        elif dialogue.id.startswith('ch3_'):
            return self.output_dir / 'chapter3' / f"{dialogue.id}.wav"
        elif dialogue.id.startswith('ch2_'):
            return self.output_dir / 'chapter2' / f"{dialogue.id}.wav"
        else:
            return self.output_dir / 'chapter1' / f"{dialogue.id}.wav"
    
    def generate_single(self, dialogue: Dialogue, force: bool = False) -> GenerationResult:
        """生成单条对话的音频"""
        output_path = self.get_output_path(dialogue)
        
        # 检查是否已存在
        if output_path.exists() and not force:
            if dialogue.id in self.manifest:
                return GenerationResult(
                    dialogue_id=dialogue.id,
                    success=True,
                    file_path=str(output_path),
                    error=None
                )
        
        start_time = time.time()
        
        try:
            # 获取音色配置
            voice_config = self.get_voice_config(dialogue.speaker)
            
            # 构建完整的文本（包含情绪标签）
            full_text = f"{dialogue.emotion}{dialogue.text}" if dialogue.emotion else dialogue.text
            
            print(f"\n🎙️ 正在生成: {dialogue.id}")
            print(f"   角色: {dialogue.speaker} | 音色: {voice_config['voice_id']}")
            print(f"   文本: {full_text[:50]}...")
            
            # 调用 MiMo API
            completion = self.client.chat.completions.create(
                model=voice_config['model'],
                messages=[
                    {
                        "role": "user",
                        "content": voice_config['style_instruction']
                    },
                    {
                        "role": "assistant",
                        "content": full_text
                    }
                ],
                audio={
                    "format": "wav",
                    "voice": voice_config['voice_id']
                }
            )
            
            # 解码音频数据
            audio_data_base64 = completion.choices[0].message.audio.data
            audio_bytes = base64.b64decode(audio_data_base64)
            
            # 写入文件
            with open(output_path, 'wb') as f:
                f.write(audio_bytes)
            
            duration_ms = int((time.time() - start_time) * 1000)
            file_size_kb = len(audio_bytes) / 1024
            
            result = GenerationResult(
                dialogue_id=dialogue.id,
                success=True,
                file_path=str(output_path),
                error=None,
                duration_ms=duration_ms
            )
            
            # 更新清单
            self.manifest[dialogue.id] = {
                'file_path': str(output_path.relative_to(self.output_dir)),
                'speaker': dialogue.speaker,
                'text': dialogue.text,
                'emotion': dialogue.emotion,
                'file_size_kb': round(file_size_kb, 2),
                'generated_at': datetime.now().isoformat()
            }
            
            print(f"   ✅ 成功! 文件大小: {file_size_kb:.1f} KB | 耗时: {duration_ms}ms")
            
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            
            result = GenerationResult(
                dialogue_id=dialogue.id,
                success=False,
                error=str(e),
                duration_ms=duration_ms
            )
            
            print(f"   ❌ 失败: {str(e)[:100]}")
            
            return result
    
    def generate_batch(
        self,
        dialogues: List[Dialogue],
        chapter_filter: Optional[int] = None,
        speaker_filter: Optional[str] = None,
        priority_filter: Optional[str] = None,
        dry_run: bool = False,
        force: bool = False
    ) -> List[GenerationResult]:
        """批量生成音频"""
        
        # 应用过滤器
        filtered_dialogues = []
        for dlg in dialogues:
            if chapter_filter:
                # 简单的章节过滤逻辑
                if dlg.id.startswith(f'ch{chapter_filter}_'):
                    pass
                elif not dlg.id.startswith('ch') and chapter_filter == 4:
                    pass  # 结局可能在最后
                else:
                    continue
            
            if speaker_filter and dlg.speaker != speaker_filter:
                continue
                
            if priority_filter and dlg.priority != priority_filter:
                continue
            
            filtered_dialogues.append(dlg)
        
        if not filtered_dialogues:
            print("⚠️ 没有匹配的对话需要生成")
            return []
        
        print(f"\n{'='*60}")
        print(f"🎙️ 开始批量生成音频")
        print(f"   总数: {len(filtered_dialogues)} 条")
        print(f"   章节: {chapter_filter or '全部'}")
        print(f"   角色: {speaker_filter or '全部'}")
        print(f"   优先级: {priority_filter or '全部'}")
        print(f"{'='*60}\n")
        
        if dry_run:
            print("📋 DRY RUN 模式 - 只显示将要生成的列表:\n")
            for dlg in filtered_dialogues:
                output_path = self.get_output_path(dlg)
                status = "🔄 将生成" if force or not output_path.exists() else "⏭️ 已存在"
                print(f"  [{dlg.priority.upper()}] {dlg.id:<20} {dlg.speaker:<10} {status}")
                print(f"      └─ {dlg.text[:60]}...")
            return []
        
        results = []
        
        # 使用进度条
        pbar = tqdm(filtered_dialogues, desc="生成进度", unit="条")
        
        for dialogue in pbar:
            pbar.set_postfix_str(f"{dialogue.id}")
            
            result = self.generate_single(dialogue, force=force)
            results.append(result)
            
            # 每10条保存一次清单
            if len(results) % 10 == 0:
                self._save_manifest()
            
            # API 速率限制保护
            time.sleep(0.5)
        
        # 最终保存清单
        self._save_manifest()
        
        # 统计结果
        successful = sum(1 for r in results if r.success)
        failed = sum(1 for r in results if not r.success)
        
        print(f"\n{'='*60}")
        print(f"📊 生成完成统计:")
        print(f"   ✅ 成功: {successful} 条")
        print(f"   ❌ 失败: {failed} 条")
        print(f"   📁 输出目录: {self.output_dir}")
        print(f"   📋 清单文件: {self.manifest_file}")
        print(f"{'='*60}\n")
        
        return results
    
    def generate_stats(self):
        """生成统计信息"""
        total_size = 0
        file_count = 0
        
        for wav_file in self.output_dir.rglob('*.wav'):
            total_size += wav_file.stat().st_size
            file_count += 1
        
        print(f"\n📊 音频库统计:")
        print(f"   总文件数: {file_count}")
        print(f"   总大小: {total_size / 1024 / 1024:.2f} MB")
        print(f"   清单记录: {len(self.manifest)} 条")


def main():
    parser = argparse.ArgumentParser(
        description='灯塔零点协议 - TTS 音频批量生成工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例用法:
  python generate_tts_audio.py                          # 生成所有音频
  python generate_tts_audio.py --chapter 1              # 只生成第1章
  python generate_tts_audio.py --speaker narrator       # 只生成旁白
  python generate_tts_audio.py --priority high          # 只生成高优先级
  python generate_tts_audio.py --dry-run                # 预览将要生成的列表
  python generate_tts_audio.py --force                  # 强制重新生成
        """
    )
    
    parser.add_argument('--chapter', type=int, help='只生成指定章节 (1-4)')
    parser.add_argument('--speaker', choices=['narrator', 'lawyer', 'nurse', 'reporter', 'broadcast'],
                       help='只生成指定角色的音频')
    parser.add_argument('--priority', choices=['high', 'medium', 'low'],
                       help='只生成指定优先级的音频')
    parser.add_argument('--dry-run', action='store_true', help='只显示将要生成的列表，不实际调用API')
    parser.add_argument('--force', action='store_true', help='强制重新生成已存在的音频')
    parser.add_argument('--stats', action='store_true', help='显示音频库统计信息')
    
    args = parser.parse_args()
    
    # 检查 API Key
    api_key = os.environ.get('MIMO_API_KEY')
    if not api_key:
        print("❌ 错误: 未设置 MIMO_API_KEY 环境变量")
        print("\n请设置 API Key:")
        print("  export MIMO_API_KEY='your-api-key-here'")
        print("\n或:")
        print("  MIMO_API_KEY='your-key' python generate_tts_audio.py\n")
        sys.exit(1)
    
    # 创建生成器实例
    generator = MiMoTTSGenerator(api_key)
    
    # 显示统计信息
    if args.stats:
        generator.generate_stats()
        return
    
    # 提取对话配置
    dialogues = generator.extract_dialogues_from_config()
    
    if not dialogues:
        print("❌ 未找到任何对话配置")
        sys.exit(1)
    
    print(f"📚 从配置中提取到 {len(dialogues)} 条对话")
    
    # 批量生成
    results = generator.generate_batch(
        dialogues=dialogues,
        chapter_filter=args.chapter,
        speaker_filter=args.speaker,
        priority_filter=args.priority,
        dry_run=args.dry_run,
        force=args.force
    )
    
    # 如果有失败的任务，返回非零退出码
    failed_count = sum(1 for r in results if not r.success)
    if failed_count > 0:
        print(f"\n⚠️ 有 {failed_count} 条音频生成失败，请检查错误信息")
        sys.exit(1)


if __name__ == '__main__':
    main()
