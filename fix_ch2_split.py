import requests, base64, os

API_KEY = 'sk-ctd025cd9llwa9dyxvpt7vm4t1tzo8wwpiejalvplmu2n1y4'
API_BASE = 'https://api.xiaomimimo.com/v1'

items = [
    ('chapter2/ch2_intro',
     '(低沉, 缓慢) 你和记者03号同时发现了一份藏在电台后面的名单。那是三年前海鸥号的乘客登船顺序表。但有几个名字被红笔划掉了。',
     '白桦', '低沉沙哑的男声，像深夜电台主持人，语速极慢。'),
    ('chapter2/ch2_tail',
     '(低沉, 缓慢) 与此同时，律师01号正站在地下室门口研究电子锁。他注意到你在看名单，眼神闪了一下。护士02号依然缩在角落，但她的目光时不时飘向你。信息就是力量。而力量可以分享，也可以独占。',
     '白桦', '低沉沙哑的男声，像深夜电台主持人，语速极慢。'),
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
    os.makedirs(os.path.dirname('public/audio/' + did), exist_ok=True)
    with open('public/audio/' + did + '.wav', 'wb') as f:
        f.write(ab)
    import wave
    w = wave.open('public/audio/' + did + '.wav', 'rb')
    d = w.getnframes() / w.getframerate()
    w.close()
    print(f'  OK {did.split("/")[-1]}.wav ({len(ab)//1024}KB, {d:.1f}s)')
print('Done!')
