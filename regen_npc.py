import requests, base64, os, wave

API_KEY = 'sk-ctd025cd9llwa9dyxvpt7vm4t1tzo8wwpiejalvplmu2n1y4'
API_BASE = 'https://api.xiaomimimo.com/v1'

items = [
    ('chapter1/ch1_broadcast',
     '欢迎来到零点协议。你们之中，有一个人知道三年前海鸥号沉船案的真相。想活着离开，就把他交出来。计时开始。',
     '苏打', '冰冷机械音'),
    ('chapter1/1-1_nurse',
     '别、别过来……我什么都不知道……求你们别看我……',
     '冰糖', '年轻女性，害怕颤抖'),
    ('chapter2/ch2_reporter',
     '我们共享信息吧？我也告诉你我在档案袋里看到了什么。',
     '白桦', '中年男性，急促锐利'),
    ('chapter2/ch2_tail',
     '与此同时，律师01号正站在地下室门口研究电子锁。他注意到你在看名单，眼神闪了一下。护士02号依然缩在角落，但她的目光时不时飘向你。信息就是力量。而力量可以分享，也可以独占。',
     '白桦', '深沉男声旁白'),
    ('chapter3/ch3_reporter',
     '我刚对比了名单和律师的证词——他在撒谎。他说那天晚上他在甲板上，但名单显示他在船舱底层。',
     '白桦', '中年男性，压低声音急促'),
    ('chapter3/ch3_nurse',
     '我……我想起来了。我认得这个被划掉的名字。',
     '冰糖', '年轻女性，害怕颤抖突然想起'),
    ('chapter3/ch3_tail',
     '所有人的目光都转向她。',
     '白桦', '深沉男声旁白'),
    ('chapter4/ch4_broadcast',
     '距离零点还有15分钟。出口即将锁定。出口需要两把钥匙。一把在你们各自的手环里激活——完成各自的选择即可解锁。另一把在真正知道核心真相的人手中。或者，你们可以投票。票数最多的人将被视为知情者，交出钥匙后其他人可以离开。',
     '苏打', '冰冷机械音'),
]

for did, text, voice, style in items:
    print(f'Generating {did}...', flush=True)
    r = requests.post(f'{API_BASE}/chat/completions',
        headers={'Content-Type': 'application/json', 'api-key': API_KEY},
        json={'model': 'mimo-v2.5-tts',
              'messages': [{'role':'user','content':style},
                           {'role':'assistant','content':text}],
              'audio':{'format':'wav','voice':voice}},
        timeout=60)
    if r.status_code != 200:
        print(f'  ERR {r.status_code}')
        continue
    ad = r.json()['choices'][0]['message']['audio']['data']
    ab = base64.b64decode(ad)
    out = 'public/audio/' + did + '.wav'
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'wb') as f:
        f.write(ab)
    w = wave.open(out, 'rb')
    d = w.getnframes() / w.getframerate()
    w.close()
    print(f'  OK ({len(ab)//1024}KB, {d:.1f}s)')
print('All done!')
