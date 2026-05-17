import requests, base64, os, wave

API_KEY = 'sk-ctd025cd9llwa9dyxvpt7vm4t1tzo8wwpiejalvplmu2n1y4'
API_BASE = 'https://api.xiaomimimo.com/v1'

items = [
    ('chapter1/ch1_intro',
     '暴雨夜，海浪拍打着礁石。你在一座废弃灯塔的二层醒来，头痛欲裂。手腕上多了一个金属手环，上面刻着编号04。楼下传来声音——不是一个人，是三个人在争吵。',
     '白桦', '深沉男声旁白'),
    ('chapter2/ch2_intro',
     '你和记者03号同时发现了一份藏在电台后面的名单。那是三年前海鸥号的乘客登船顺序表。但有几个名字被红笔划掉了。',
     '白桦', '深沉男声旁白'),
    ('chapter3/ch3_intro',
     '你打开了04号档案袋，里面是你的档案。编号04，身份自由职业者。备注：三年前曾以乘客身份登上海鸥号，但在事故发生前一天因突发阑尾炎下船就医。是唯一的幸存者之一。附加信息：事故当天，你在医院昏迷了12小时。没人知道这12小时里发生了什么。你的手在发抖。你不记得这件事。',
     '白桦', '深沉男声旁白'),
    ('chapter4/ch4_intro',
     '暴雨更大了。灯塔在风中发出嘎吱声响。',
     '白桦', '深沉男声旁白'),
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
