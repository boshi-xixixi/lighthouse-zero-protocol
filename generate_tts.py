import requests
import base64
import os
import json
import time
import sys

API_KEY = 'sk-ctd025cd9llwa9dyxvpt7vm4t1tzo8wwpiejalvplmu2n1y4'
API_BASE = 'https://api.xiaomimimo.com/v1'

PUBLIC_AUDIO_DIR = os.path.join(os.path.dirname(__file__), 'public', 'audio')

MANIFEST_PATH = os.path.join(PUBLIC_AUDIO_DIR, 'manifest.json')

DIALOGUES = [
    # === 第1章 ===
    {
        'id': 'ch1_intro',
        'text': '暴雨夜，海浪拍打着礁石。你在一座废弃灯塔的二层醒来，头痛欲裂。手腕上多了一个金属手环，上面刻着编号：04。楼下传来声音——不是一个人，是三个人在争吵。',
        'speaker': 'narrator',
        'voice': '白桦',
        'style': '低沉沙哑的男声，像深夜电台主持人，语速极慢，每个字都像是在回忆一段被掩盖的真相。',
        'emotion': '(低沉, 缓慢, 带着不祥的预感) ',
        'dir': 'chapter1',
        'priority': 'high'
    },
    {
        'id': 'ch1_broadcast',
        'text': '欢迎来到零点协议。你们之中，有一个人知道三年前海鸥号沉船案的真相。想活着离开，就把他交出来。计时开始。',
        'speaker': 'broadcast',
        'voice': '苏打',
        'style': '机械合成音，冰冷无情，没有任何感情波动。',
        'emotion': '(机械, 冰冷, 毫无起伏) ',
        'dir': 'chapter1',
        'priority': 'high'
    },
    {
        'id': '1-1',
        'text': '你走下螺旋楼梯，看到另外三人：01号律师，西装湿透，神情冷峻。02号护士，白大褂沾泥，缩在角落发抖。03号记者，挎着相机，眼神锐利。桌上放着四份密封档案袋。灯塔一层散落着几样东西：一个医药箱、一台旧电台、一件带血的救生衣、一把地下室钥匙。但你只能先拿一样东西。',
        'speaker': 'narrator',
        'voice': '白桦',
        'style': '低沉沙哑的男声，像深夜电台主持人，语速极慢，每个字都像是在回忆一段被掩盖的真相。',
        'emotion': '(低沉, 缓慢, 描述性的) ',
        'dir': 'chapter1',
        'priority': 'high'
    },
    {
        'id': '1-1_nurse',
        'text': '别、别过来……我什么都不知道……求你们别看我……',
        'speaker': 'nurse',
        'voice': '冰糖',
        'style': '年轻女性，温柔但带着深深的恐惧感，像是在黑暗中颤抖着说话。',
        'emotion': '(颤抖, 害怕, 抽泣) ',
        'dir': 'chapter1',
        'priority': 'high'
    },
    {
        'id': 'ch1_end',
        'text': '你的选择决定了初始方向。广播里传来倒计时声：距离下一阶段还有45分钟。暴雨更大了。',
        'speaker': 'broadcast',
        'voice': '苏打',
        'style': '机械合成音，冰冷无情，没有任何感情波动。',
        'emotion': '(机械, 冰冷, 毫无起伏) ',
        'dir': 'chapter1',
        'priority': 'medium'
    },

    # === 第2章 ===
    {
        'id': 'ch2_intro',
        'text': '你和记者03号同时发现了一份藏在电台后面的名单——那是三年前海鸥号的乘客登船顺序表。但有几个名字被红笔划掉了。',
        'speaker': 'narrator',
        'voice': '白桦',
        'style': '低沉沙哑的男声，像深夜电台主持人，语速极慢，每个字都像是在回忆一段被掩盖的真相。',
        'emotion': '(低沉, 缓慢, 暗流涌动) ',
        'dir': 'chapter2',
        'priority': 'high'
    },
    {
        'id': 'ch2_reporter',
        'text': '我们共享信息吧？我也告诉你我在档案袋里看到了什么。',
        'speaker': 'reporter',
        'voice': '白桦',
        'style': '中年男性，锐利急促，像是一个追查真相多年的记者。',
        'emotion': '(急促, 期待, 带着试探) ',
        'dir': 'chapter2',
        'priority': 'high'
    },
    {
        'id': '2-1',
        'text': '名单在你手中。律师的背影微微僵硬，像是在防备什么。护士的呼吸变得急促——她似乎知道些什么。这份名单可能改变一切。但你也可以选择——什么都不做，先观察。每个人都在等你的下一步动作。',
        'speaker': 'narrator',
        'voice': '白桦',
        'style': '低沉沙哑的男声，像深夜电台主持人，语速极慢，每个字都像是在回忆一段被掩盖的真相。',
        'emotion': '(低沉, 紧张, 压迫感) ',
        'dir': 'chapter2',
        'priority': 'high'
    },
    {
        'id': 'ch2_end',
        'text': '你的选择改变了信息的流向。有人在微笑，有人皱起了眉。广播再次响起：距离零点还有30分钟。',
        'speaker': 'broadcast',
        'voice': '苏打',
        'style': '机械合成音，冰冷无情，没有任何感情波动。',
        'emotion': '(机械, 冰冷, 毫无起伏) ',
        'dir': 'chapter2',
        'priority': 'medium'
    },

    # === 第3章 ===
    {
        'id': 'ch3_intro',
        'text': '你打开了04号档案袋，里面是你的档案。编号04，身份：自由职业者。备注：三年前曾以乘客身份登上海鸥号，但在事故发生前一天因突发阑尾炎下船就医。是唯一的幸存者之一。附加信息：事故当天，你在医院昏迷了12小时。没人知道这12小时里发生了什么。你的手在发抖。你不记得这件事。',
        'speaker': 'narrator',
        'voice': '白桦',
        'style': '低沉沙哑的男声，像深夜电台主持人，语速极慢，每个字都像是在回忆一段被掩盖的真相。',
        'emotion': '(低沉, 紧张, 真相浮出水面) ',
        'dir': 'chapter3',
        'priority': 'high'
    },
    {
        'id': 'ch3_reporter',
        'text': '我刚对比了名单和律师的证词——他在撒谎。他说那天晚上他在甲板上，但名单显示他在船舱底层。',
        'speaker': 'reporter',
        'voice': '白桦',
        'style': '中年男性，锐利急促，像是一个追查真相多年的记者。',
        'emotion': '(急促, 压低声音, 揭秘时的兴奋) ',
        'dir': 'chapter3',
        'priority': 'high'
    },
    {
        'id': 'ch3_nurse',
        'text': '我……我想起来了。我认得这个被划掉的名字。',
        'speaker': 'nurse',
        'voice': '冰糖',
        'style': '年轻女性，温柔但带着深深的恐惧感，像是在黑暗中颤抖着说话。',
        'emotion': '(颤抖, 害怕, 突然想起什么) ',
        'dir': 'chapter3',
        'priority': 'high'
    },
    {
        'id': '3-1',
        'text': '护士站了起来，双手颤抖。律师停止了摆弄电子锁的动作。记者握紧了相机，眼神在你和护士之间来回移动。一份被划掉的名字。一个撒谎的律师。一段空白的12小时。一盘散落的证据碎片。真相就在眼前，但拼凑的方式由你决定。',
        'speaker': 'narrator',
        'voice': '白桦',
        'style': '低沉沙哑的男声，像深夜电台主持人，语速极慢，每个字都像是在回忆一段被掩盖的真相。',
        'emotion': '(低沉, 紧迫, 关键时刻) ',
        'dir': 'chapter3',
        'priority': 'high'
    },
    {
        'id': 'ch3_end',
        'text': '距离零点还有15分钟。出口即将锁定。提醒：投票功能已开启。',
        'speaker': 'broadcast',
        'voice': '苏打',
        'style': '机械合成音，但隐约带有一丝人性。',
        'emotion': '(机械, 但隐约有一丝人味) ',
        'dir': 'chapter3',
        'priority': 'medium'
    },

    # === 第4章 ===
    {
        'id': 'ch4_intro',
        'text': '暴雨更大了。灯塔在风中发出嘎吱声响。',
        'speaker': 'narrator',
        'voice': '白桦',
        'style': '低沉沙哑的男声，像深夜电台主持人，语速极慢，每个字都像是在回忆一段被掩盖的真相。',
        'emotion': '(低沉, 紧迫, 终局将至) ',
        'dir': 'chapter4',
        'priority': 'high'
    },
    {
        'id': 'ch4_broadcast',
        'text': '距离零点还有15分钟。出口即将锁定。出口需要两把钥匙。一把在你们各自的手环里激活——完成各自的选择即可解锁。另一把在真正知道核心真相的人手中。或者，你们可以投票。票数最多的人将被视为知情者，交出钥匙后其他人可以离开。',
        'speaker': 'broadcast',
        'voice': '苏打',
        'style': '机械合成音，冰冷无情，没有任何感情波动。',
        'emotion': '(机械, 冰冷, 毫无起伏) ',
        'dir': 'chapter4',
        'priority': 'high'
    },
    {
        'id': '4-1',
        'text': '铁门就在眼前。手环上的数字在倒数。律师在看表——他好像在等什么。记者在犹豫要不要公开她的录音。护士的眼神在你和其他人之间游移。公开证据？投票选出替罪羊？还是你注意到律师的手一直在无意识地摩挲口袋。那里有什么？如果你之前收集了足够的线索，也许你能发现——这场测试本身，就是一个谎言。',
        'speaker': 'narrator',
        'voice': '白桦',
        'style': '低沉沙哑的男声，像深夜电台主持人，语速极慢，每个字都像是在回忆一段被掩盖的真相。',
        'emotion': '(低沉, 紧迫, 最后的抉择) ',
        'dir': 'chapter4',
        'priority': 'high'
    },
    {
        'id': 'ch4_end',
        'text': '无论你选择了什么，灯塔的大门都将开启。但门外的世界，未必是你期待的样子。有些答案，一旦知道就无法遗忘。',
        'speaker': 'narrator',
        'voice': '白桦',
        'style': '低沉沙哑的男声，像深夜电台主持人，语速极慢，每个字都像是在回忆一段被掩盖的真相。',
        'emotion': '(低沉, 感慨, 余韵) ',
        'dir': 'chapter4',
        'priority': 'medium'
    },

    # === 结局 ===
    {
        'id': 'ending_truth',
        'text': '你选择了公开所有证据。灯塔的广播系统传出你的声音——沉船案的真相，终于大白于天下。律师沉默了。护士捂着脸哭了。记者开始疯狂记录每一个细节。铁门缓缓打开，海风夹杂着雨丝扑面而来。但你知道，走出这座灯塔，你要面对的不只是自由。那些不想让真相曝光的人，正在外面等着你。但你已经不在乎了。你回头看了一眼那座在暴雨中若隐若现的灯塔。零点已过，真相永存。',
        'speaker': 'narrator',
        'voice': '白桦',
        'style': '低沉沙哑的男声，像深夜电台主持人，语速极慢，每个字都像是在回忆一段被掩盖的真相。',
        'emotion': '(释然, 温暖, 真相大白) ',
        'dir': 'endings',
        'priority': 'high'
    },
    {
        'id': 'ending_escape',
        'text': '你选择了自保。当其他人还在争论谁该相信谁时，你已经找到了出口的钥匙。铁门在你身后重重关上，将争吵、谎言、真相，都关在了那座废弃的灯塔里。海浪拍打着礁石，冰冷的海水漫过你的脚踝。你深吸了一口气——你还活着。但每当夜深人静，你总会想起灯塔里的三个人。他们怎么样了？真相到底是什么？你永远不会知道答案。而这，或许就是独自逃生的代价。',
        'speaker': 'narrator',
        'voice': '白桦',
        'style': '低沉沙哑的男声，像深夜电台主持人，语速极慢，每个字都像是在回忆一段被掩盖的真相。',
        'emotion': '(疲惫, 庆幸, 但带着遗憾) ',
        'dir': 'endings',
        'priority': 'high'
    },
    {
        'id': 'ending_backfire',
        'text': '你的选择引发了连锁反应。信任在一瞬间崩塌，所有人都在互相指责。是你！是你出卖了我们！律师的声音在空旷的灯塔里回荡。广播系统突然失控，刺耳的杂音充斥着每一寸空间。红灯开始闪烁。铁门从外面锁死了。电子音冷冷地响起：检测到协议违反。所有出口已封锁。暴雨仍在继续，而零点协议的倒计时才刚刚开始。',
        'speaker': 'narrator',
        'voice': '白桦',
        'style': '低沉沙哑的男声，像深夜电台主持人，语速极慢，每个字都像是在回忆一段被掩盖的真相。',
        'emotion': '(绝望, 崩溃, 恐惧) ',
        'dir': 'endings',
        'priority': 'high'
    },
    {
        'id': 'ending_zero',
        'text': '你触发了零点协议。灯塔的广播系统突然切换到一个陌生的频率。一个没有感情的机械声响起：欢迎，04号观察者。你通过了所有测试。恭喜。主屏幕上弹出一段被加密的文件——沉船案的完整真相，以及这场游戏的真正目的。你不是幸存者。你从来都不是。你是被选中的人。而现在，站在真相面前，你必须做出最后一个抉择。',
        'speaker': 'narrator',
        'voice': '白桦',
        'style': '低沉沙哑的男声，像深夜电台主持人，语速极慢，每个字都像是在回忆一段被掩盖的真相。',
        'emotion': '(平静, 超脱, 揭示真相) ',
        'dir': 'endings',
        'priority': 'high'
    },

    # === 系统音 ===
    {
        'id': 'system_welcome',
        'text': '欢迎来到零点协议。你们之中，有一个人知道三年前海鸥号沉船案的真相。想活着离开，就把他交出来。计时开始。',
        'speaker': 'broadcast',
        'voice': '苏打',
        'style': '机械合成音，冰冷无情，没有任何感情波动。',
        'emotion': '(机械, 冰冷, 毫无起伏) ',
        'dir': 'system',
        'priority': 'high'
    },
    {
        'id': 'system_countdown',
        'text': '距离零点还有15分钟。出口即将锁定。',
        'speaker': 'broadcast',
        'voice': '苏打',
        'style': '机械合成音，冰冷无情，没有任何感情波动。',
        'emotion': '(机械, 冰冷, 毫无起伏) ',
        'dir': 'system',
        'priority': 'medium'
    },
    {
        'id': 'system_vote',
        'text': '投票功能已开启。票数最多的人将被视为知情者。',
        'speaker': 'broadcast',
        'voice': '苏打',
        'style': '机械合成音，冰冷无情，没有任何感情波动。',
        'emotion': '(机械, 冰冷, 毫无起伏) ',
        'dir': 'system',
        'priority': 'medium'
    },
]


def load_manifest():
    if os.path.exists(MANIFEST_PATH):
        with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def save_manifest(manifest):
    with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)


def generate_audio(dialogue):
    text = dialogue['emotion'] + dialogue['text']
    voice = dialogue['voice']
    style = dialogue['style']

    payload = {
        'model': 'mimo-v2.5-tts',
        'messages': [
            {'role': 'user', 'content': style},
            {'role': 'assistant', 'content': text}
        ],
        'audio': {
            'format': 'wav',
            'voice': voice
        }
    }

    headers = {
        'Content-Type': 'application/json',
        'api-key': API_KEY
    }

    try:
        response = requests.post(
            f'{API_BASE}/chat/completions',
            json=payload,
            headers=headers,
            timeout=60
        )

        if response.status_code != 200:
            print(f'  ❌ API 错误: {response.status_code} - {response.text[:200]}')
            return False

        result = response.json()
        audio_data = result['choices'][0]['message']['audio']['data']

        audio_bytes = base64.b64decode(audio_data)

        output_dir = os.path.join(PUBLIC_AUDIO_DIR, dialogue['dir'])
        os.makedirs(output_dir, exist_ok=True)

        output_path = os.path.join(output_dir, f'{dialogue["id"]}.wav')
        with open(output_path, 'wb') as f:
            f.write(audio_bytes)

        size_kb = len(audio_bytes) / 1024
        print(f'  ✅ {dialogue["id"]}.wav ({size_kb:.1f} KB)')
        return True

    except Exception as e:
        print(f'  ❌ 生成失败: {e}')
        return False


def main():
    args = sys.argv[1:]

    priority_filter = None
    chapter_filter = None
    speaker_filter = None
    dry_run = False
    force = False

    i = 0
    while i < len(args):
        if args[i] == '--priority':
            priority_filter = args[i + 1]
            i += 2
        elif args[i] == '--chapter':
            chapter_filter = args[i + 1]
            i += 2
        elif args[i] == '--speaker':
            speaker_filter = args[i + 1]
            i += 2
        elif args[i] == '--dry-run':
            dry_run = True
            i += 1
        elif args[i] == '--force':
            force = True
            i += 1
        else:
            i += 1

    filtered = DIALOGUES

    if priority_filter:
        order = {'high': 0, 'medium': 1, 'low': 2}
        filtered = [d for d in filtered if order.get(d['priority'], 99) <= order.get(priority_filter, 99)]

    if chapter_filter:
        ch = chapter_filter.replace('ch', '').replace('chapter', '')
        filtered = [d for d in filtered if d['dir'] == f'chapter{ch}' or d['dir'] == 'endings' or d['dir'] == 'system']

    if speaker_filter:
        filtered = [d for d in filtered if d['speaker'] == speaker_filter]

    if dry_run:
        print(f'\n📋 将生成 {len(filtered)} 条音频:\n')
        for d in filtered:
            print(f'  [{d["priority"]}] {d["id"]}')
            print(f'       {d["text"][:60]}...')
            print(f'       音色: {d["voice"]} | 情绪: {d["emotion"].strip()}')
            print()
        return

    manifest = load_manifest()

    if not force:
        filtered = [d for d in filtered if d['id'] not in manifest]
        if not filtered:
            print('✅ 所有音频已生成，无需重新生成。使用 --force 强制重新生成。')
            return

    print(f'\n🎙️ 开始生成 {len(filtered)} 条音频...\n')

    success = 0
    failed = 0

    for i, dialogue in enumerate(filtered):
        print(f'[{i + 1}/{len(filtered)}] {dialogue["id"]} ({dialogue["speaker"]})')

        if generate_audio(dialogue):
            manifest[dialogue['id']] = {
                'text': dialogue['text'][:50],
                'speaker': dialogue['speaker'],
                'voice': dialogue['voice'],
                'emotion': dialogue['emotion'].strip(),
                'priority': dialogue['priority'],
                'generated_at': time.strftime('%Y-%m-%d %H:%M:%S')
            }
            save_manifest(manifest)
            success += 1
        else:
            failed += 1

        if i < len(filtered) - 1:
            time.sleep(1)

    print(f'\n🎉 生成完成！')
    print(f'  ✅ 成功: {success}')
    print(f'  ❌ 失败: {failed}')
    print(f'  📁 总计: {len(manifest)} 条音频')


if __name__ == '__main__':
    main()
