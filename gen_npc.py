import requests, base64, os, time

API_KEY = 'sk-ctd025cd9llwa9dyxvpt7vm4t1tzo8wwpiejalvplmu2n1y4'
API_BASE = 'https://api.xiaomimimo.com/v1'
AUDIO_DIR = 'public/audio'

items = [
    ('ch1_broadcast', '(机械, 冰冷, 毫无起伏) 欢迎来到零点协议。你们之中，有一个人知道三年前海鸥号沉船案的真相。想活着离开，就把他交出来。计时开始。', '苏打', '机械合成音，冰冷无情。', 'chapter1'),
    ('1-1_nurse', '(颤抖, 害怕, 抽泣) 别、别过来……我什么都不知道……求你们别看我……', '冰糖', '年轻女性，温柔但带着深深的恐惧感。', 'chapter1'),
    ('ch2_reporter', '(急促, 期待, 带着试探) 我们共享信息吧？我也告诉你我在档案袋里看到了什么。', '白桦', '中年男性，锐利急促，像是一个追查真相多年的记者。', 'chapter2'),
    ('ch3_reporter', '(急促, 压低声音, 揭秘时的兴奋) 我刚对比了名单和律师的证词——他在撒谎。他说那天晚上他在甲板上，但名单显示他在船舱底层。', '白桦', '中年男性，锐利急促，像是一个追查真相多年的记者。', 'chapter3'),
    ('ch3_nurse', '(颤抖, 害怕, 突然想起什么) 我……我想起来了。我认得这个被划掉的名字。', '冰糖', '年轻女性，温柔但带着深深的恐惧感。', 'chapter3'),
    ('ch4_broadcast', '(机械, 冰冷, 毫无起伏) 距离零点还有15分钟。出口即将锁定。出口需要两把钥匙。一把在你们各自的手环里激活完成各自的选择即可解锁。另一把在真正知道核心真相的人手中。或者你们可以投票。票数最多的人将被视为知情者交出钥匙后其他人可以离开。', '苏打', '机械合成音，冰冷无情。', 'chapter4'),
]

for i, (did, text, voice, style, d) in enumerate(items):
    print(f'[{i+1}/{len(items)}] {did}...', flush=True)
    try:
        r = requests.post(f'{API_BASE}/chat/completions',
            headers={'Content-Type': 'application/json', 'api-key': API_KEY},
            json={'model': 'mimo-v2.5-tts', 'messages': [{'role': 'user', 'content': style}, {'role': 'assistant', 'content': text}], 'audio': {'format': 'wav', 'voice': voice}},
            timeout=60)
        if r.status_code != 200:
            print(f'  ERR {r.status_code}')
            continue
        ad = r.json()['choices'][0]['message']['audio']['data']
        ab = base64.b64decode(ad)
        od = os.path.join(AUDIO_DIR, d)
        os.makedirs(od, exist_ok=True)
        with open(os.path.join(od, f'{did}.wav'), 'wb') as f:
            f.write(ab)
        print(f'  OK {did}.wav ({len(ab)//1024}KB)')
        time.sleep(1)
    except Exception as e:
        print(f'  ERR {e}')

print('Done!')
