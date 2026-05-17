import requests, base64, os

API_KEY = 'sk-ctd025cd9llwa9dyxvpt7vm4t1tzo8wwpiejalvplmu2n1y4'
API_BASE = 'https://api.xiaomimimo.com/v1'

items = [
    ('chapter3/ch3_tail',
     '(低沉, 紧张) 所有人的目光都转向她。',
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
