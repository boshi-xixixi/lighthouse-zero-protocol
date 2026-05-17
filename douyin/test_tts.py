#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MiMo TTS 快速测试脚本 (简化版 - 使用 requests)
"""

import os
import sys
import base64
import json
from pathlib import Path

try:
    import requests
except ImportError:
    print("❌ 请先安装依赖: pip install requests")
    sys.exit(1)


def load_env():
    """加载 .env 文件"""
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
        print("✅ 已加载 .env 配置")


def test_api_connection(api_key: str):
    """测试 API 连接"""
    print("\n" + "="*60)
    print("🔧 测试 MiMo TTS API 连接...")
    print("="*60)
    
    try:
        url = "https://api.xiaomimimo.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "api-key": api_key
        }
        data = {
            "model": "mimo-v2.5-tts",
            "messages": [
                {
                    "role": "user", 
                    "content": "温柔的女声，像在讲故事"
                },
                {
                    "role": "assistant", 
                    "content": "(温柔) 你好，这是一个测试。MiMo TTS 语音系统工作正常！"
                }
            ],
            "audio": {
                "format": "wav",
                "voice": "冰糖"
            }
        }
        
        print("\n📤 发送测试请求...")
        response = requests.post(url, headers=headers, json=data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            audio_data_base64 = result['choices'][0]['message']['audio']['data']
            audio_bytes = base64.b64decode(audio_data_base64)
            
            output_file = Path(__file__).parent / "audio" / "system" / "test_api.wav"
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_file, 'wb') as f:
                f.write(audio_bytes)
            
            file_size_kb = len(audio_bytes) / 1024
            
            print(f"\n✅ API 连接成功！")
            print(f"   📁 测试音频已保存: {output_file.name}")
            print(f"   📊 文件大小: {file_size_kb:.1f} KB")
            print(f"   🎵 音色: 冰糖 (年轻女性)")
            print(f"   💬 内容: '你好，这是一个测试...'")
            
            return True
        else:
            print(f"\n❌ HTTP 错误: {response.status_code}")
            print(f"   响应: {response.text[:300]}")
            
            if response.status_code == 401:
                print("\n💡 可能的原因:")
                print("   - API Key 无效或已过期")
                print("   - 账户余额不足")
            elif response.status_code == 429:
                print("\n💡 可能的原因:")
                print("   - 请求频率过高")
            elif response.status_code == 403:
                print("\n💡 可能的原因:")
                print("   - API Key 权限不足")
            
            return False
            
    except requests.exceptions.Timeout:
        print("\n❌ 请求超时（30秒）")
        print("   请检查网络连接或稍后重试")
        return False
    except Exception as e:
        print(f"\n❌ 请求失败:")
        print(f"   错误类型: {type(e).__name__}")
        print(f"   错误信息: {str(e)[:200]}")
        return False


def generate_sample_dialogues(api_key: str):
    """生成示例对话"""
    print("\n" + "="*60)
    print("🎙️ 生成 5 条示例对话...")
    print("="*60)
    
    url = "https://api.xiaomimimo.com/v1/chat/completions"
    
    sample_dialogues = [
        {
            'id': 'sample_narrator_1',
            'text': '暴雨夜，海浪拍打着礁石。你在一座废弃灯塔的二层醒来，头痛欲裂。',
            'voice': '白桦',
            'emotion': '(低沉, 缓慢, 带着不祥的预感)',
            'style': '一位经历过那场海难的老灯塔看守者，声音里带着岁月和秘密。'
        },
        {
            'id': 'sample_broadcast_1',
            'text': '欢迎来到零点协议。你们之中，有一个人知道真相。',
            'voice': '苏打',
            'emotion': '(机械, 冰冷)',
            'style': '机械合成音，冰冷无感情。'
        },
        {
            'id': 'sample_nurse_1',
            'text': '别、别过来……我什么都不知道……求你们别看我……',
            'voice': '冰糖',
            'emotion': '(颤抖, 害怕, 抽泣)',
            'style': '年轻女性，声音温柔但脆弱，容易带出恐惧和不安。'
        },
        {
            'id': 'sample_lawyer_1',
            'text': '我是律师，我只相信证据。你的感情用事，救不了任何人。',
            'voice': '苏打',
            'emotion': '(冷漠, 理性)',
            'style': '成熟男性，声音低沉冷峻，语速偏慢，带着理性和距离感。'
        },
        {
            'id': 'sample_reporter_1',
            'text': '你们听我说！这绝对不是意外！我在现场看到了——',
            'voice': '白桦',
            'emotion': '(急促, 激动, 提高音量)',
            'style': '中年男性，声音锐利急促，带有记者的敏锐和紧迫感。'
        }
    ]
    
    success_count = 0
    
    for i, dialogue in enumerate(sample_dialogues, 1):
        print(f"\n[{i}/{len(sample_dialogues)}] 生成: {dialogue['id']}")
        print(f"   音色: {dialogue['voice']}")
        print(f"   情绪: {dialogue['emotion']}")
        print(f"   文本: {dialogue['text'][:50]}...")
        
        try:
            headers = {
                "Content-Type": "application/json",
                "api-key": api_key
            }
            data = {
                "model": "mimo-v2.5-tts",
                "messages": [
                    {"role": "user", "content": dialogue['style']},
                    {"role": "assistant", "content": f"{dialogue['emotion']}{dialogue['text']}"}
                ],
                "audio": {
                    "format": "wav",
                    "voice": dialogue['voice']
                }
            }
            
            response = requests.post(url, headers=headers, json=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                audio_data_base64 = result['choices'][0]['message']['audio']['data']
                audio_bytes = base64.b64decode(audio_data_base64)
                
                output_dir = Path(__file__).parent / "audio" / "chapter1"
                output_dir.mkdir(parents=True, exist_ok=True)
                
                output_file = output_dir / f"{dialogue['id']}.wav"
                with open(output_file, 'wb') as f:
                    f.write(audio_bytes)
                
                file_size_kb = len(audio_bytes) / 1024
                print(f"   ✅ 成功! ({file_size_kb:.1f} KB)")
                success_count += 1
                
            else:
                print(f"   ❌ 失败 ({response.status_code}): {response.text[:100]}")
                
        except Exception as e:
            print(f"   ❌ 错误: {str(e)[:100]}")
        
        # 避免频率限制
        if i < len(sample_dialogues):
            import time
            time.sleep(0.5)
    
    print(f"\n{'='*60}")
    print(f"📊 生成完成: {success_count}/{len(sample_dialogues)} 条成功")
    print(f"📁 音频位置: /audio/chapter1/")
    print(f"{'='*60}\n")
    
    return success_count > 0


def main():
    print("\n" + "🎙️"*30)
    print("🎙️  灯塔零点协议 - MiMo TTS 测试工具  🎙️")
    print("🎙️"*30 + "\n")
    
    load_env()
    
    api_key = os.environ.get('MIMO_API_KEY')
    
    if not api_key or api_key == 'your-api-key-here':
        print("❌ 错误: 未找到有效的 API Key\n")
        return False
    
    masked_key = api_key[:8] + "..." + api_key[-4:] if len(api_key) > 12 else "***"
    print(f"✅ API Key: {masked_key}\n")
    
    if not test_api_connection(api_key):
        return False
    
    generate_sample_dialogues(api_key)
    
    print("\n🎉 测试完成！\n")
    print("下一步操作:")
    print("  ✅ 运行 npm run dev 启动项目")
    print("  ✅ 打开浏览器访问游戏")
    print("  ✅ 点击右下角 🎙️ 按钮体验语音效果\n")
    
    return True


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
