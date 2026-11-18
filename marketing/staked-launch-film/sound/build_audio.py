"""STAKED launch film: score + sound effects + optional voice, all built from code.

python3 build_audio.py events.json out_dir [vo.mp3]
Writes music.wav, sfx.wav and mix_novoice.wav; with a voice file also mix_voice.wav (voice lines are split on
silences and placed on the film's VO beats, the music ducks under them).
"""
import json, sys, os, subprocess, wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
TOTAL = 54.0
N = int(TOTAL * SR)
rng = np.random.default_rng(7)
VO_STARTS = [12.25, 16.0, 20.3, 26.9, 31.5, 48.4]

def t_(d): return np.arange(int(round(d * SR))) / SR
def env(n, a, d): t = np.arange(n) / SR; return np.minimum(t / max(a, 1e-4), 1) * np.exp(-t / d)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], 'band', output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f / (SR / 2), 'low', output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f / (SR / 2), 'high', output='sos'), x)
def sweep(f0, f1, d): ph = 2 * np.pi * np.cumsum(np.geomspace(f0, f1, int(d * SR))) / SR; return np.sin(ph)
def noise(d): return rng.standard_normal(int(round(d * SR)))
def add(buf, x, t, g=1.0, pan=0.0):
    i = int(t * SR); j = min(len(buf), i + len(x))
    if i >= len(buf) or j <= i: return
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:j, 0] += x[:j - i] * g * l * 1.414; buf[i:j, 1] += x[:j - i] * g * r * 1.414
def mtof(m): return 440 * 2 ** ((m - 69) / 12)

# ───────────── music: warm lo-fi groove in D, 96 bpm ─────────────
BPM = 96; BEAT = 60 / BPM; BAR = 4 * BEAT
def ep(f, d, vel=1.0):  # electric-piano-ish tone
    t = t_(d); e = np.exp(-t / 1.1) * np.minimum(t / .004, 1)
    x = np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / .35) + .12 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t / .15)
    return x * e * (1 + .08 * np.sin(2 * np.pi * 5 * t)) * vel
def bass(f, d): t = t_(d); x = np.tanh(1.6 * (np.sin(2 * np.pi * f * t) + .25 * np.sin(4 * np.pi * f * t))); return x * np.exp(-t / .55) * np.minimum(t / .006, 1)
def kick(): t = t_(.35); return np.sin(2 * np.pi * np.cumsum(np.geomspace(130, 42, len(t))) / SR) * np.exp(-t / .12)
def snare(): t = t_(.25); return bp(noise(.25), 1400, 7000) * np.exp(-t / .07) * .7 + np.sin(2 * np.pi * 190 * t) * np.exp(-t / .05) * .5
def hat(o=False): t = t_(.18 if o else .05); return hp(noise(len(t) / SR), 7000) * np.exp(-t / (.06 if o else .015))
def pluck(f, d=.5): t = t_(d); return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t / .04)) * np.exp(-t / .22) * np.minimum(t / .002, 1)

CH = [[62, 66, 69, 73], [59, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 67]]  # Dmaj7 Bm7 Gmaj7 A7
ROOT = [38, 35, 31, 33]
MEL = [(0, 74), (1.5, 76), (2, 78), (3, 81), (4, 78), (5.5, 76), (6, 74), (7, 71)]  # motif over two bars, in beats

music = np.zeros((N, 2))
def section_gain(t):  # arrangement: what plays when
    return dict(
        keys=1.0, bass=0.0 if t < 6 else 1.0, drums=0.0 if t < 2.5 else (0.55 if t < 15.4 else 1.0),
        mel=1.0 if 37 <= t < 47 or 20 <= t < 26 else 0.0)
bars = int(TOTAL / BAR) + 1
for b in range(bars):
    t0 = b * BAR
    if t0 >= 47.0: break
    ci = b % 4; g = section_gain(t0)
    for k, m in enumerate(CH[ci]):  # chord stabs on 1 and the and-of-2
        for off, v in ((0, .9), (1.5 * BEAT, .55)):
            add(music, ep(mtof(m), 1.6, v) * .11, t0 + off + k * .008, pan=(k - 1.5) * .25)
    if g['bass']:
        for off, d in ((0, .9), (1.5 * BEAT, .4), (2 * BEAT, .9), (3.5 * BEAT, .3)):
            add(music, bass(mtof(ROOT[ci] + (7 if off == 3.5 * BEAT else 0)), d) * .28, t0 + off)
    if g['drums']:
        for i in range(8):
            sw = (0.06 * BEAT if i % 2 else 0)
            add(music, hat(i == 7) * .07 * g['drums'], t0 + i * BEAT / 2 + sw, pan=.3)
        add(music, kick() * .55 * g['drums'], t0); add(music, kick() * .4 * g['drums'], t0 + 2.5 * BEAT)
        add(music, snare() * .3 * g['drums'], t0 + BEAT); add(music, snare() * .3 * g['drums'], t0 + 3 * BEAT)
    if g['mel'] and b % 2 == 0:
        for (bt, m) in MEL: add(music, pluck(mtof(m)) * .09, t0 + bt * BEAT, pan=-.2)
# the shock: music drops out under "Сколько?!" and returns after "Стоп!"
def gain_curve(t):
    g = np.ones_like(t)
    g = np.where((t > 7.7) & (t < 12.0), .28, g)
    g = np.where((t >= 12.0) & (t < 12.35), 0.0, g)
    g = np.where((t >= 12.35) & (t < 15.4), .45, g)
    return g
tt = np.arange(N) / SR
music *= gain_curve(tt)[:, None]
# ending: a sustained Dmaj9 with a soft swell, then fade
for k, m in enumerate([50, 57, 62, 66, 69, 76]): add(music, ep(mtof(m), 6.5, .9) * .12, 47.0 + k * .03, pan=(k - 2.5) * .2)
fade = np.clip((TOTAL - tt) / 2.5, 0, 1); music *= fade[:, None]
music = lp(music.T, 9000).T

# ───────────── sound effects, cued from the film's EVENTS ─────────────
def bell(fs, d=1.4): t = t_(d); return sum(np.sin(2 * np.pi * f * t) * np.exp(-t / (d / (1 + i))) * (.6 ** i) for i, f in enumerate(fs))
def whoosh(d, lo, hi, up=True):
    x = noise(d); n = len(x); out = np.zeros(n); seg = 512
    for i in range(0, n - seg, seg // 2):
        u = i / n; f = lo + (hi - lo) * (u if up else 1 - u); out[i:i + seg] += bp(x[i:i + seg], max(f * .6, 50), f * 1.5) * np.hanning(seg)
    return out * np.sin(np.pi * np.arange(n) / n) ** 1.5
def scratch(d):
    x = bp(noise(d), 2000, 9000); t = t_(d); m = (np.sin(2 * np.pi * 14 * t + 3 * np.sin(2 * np.pi * 3 * t)) > .2).astype(float)
    return x * lp(m, 60) * .6
def crunch():
    out = np.zeros(int(round(.45 * SR)))
    for _ in range(14):
        i = rng.integers(0, len(out) - 2000); n = rng.integers(300, 1600); out[i:i + n] += hp(noise(n / SR), 1500) * np.exp(-np.arange(n) / (n / 4)) * rng.uniform(.4, 1)
    return out
def slurp():
    d = .55; t = t_(d); x = noise(d); y = np.zeros_like(x)
    for i in range(0, len(x) - 1024, 512):
        f = 900 + 600 * np.sin(2 * np.pi * 9 * i / SR); y[i:i + 1024] += bp(x[i:i + 1024], f * .7, f * 1.3) * np.hanning(1024)
    return y * np.sin(np.pi * t / d) * .8
def murmur(d):
    x = bp(noise(d), 250, 1400); t = t_(d); am = .6 + .4 * np.sin(2 * np.pi * .7 * t) * np.sin(2 * np.pi * 1.9 * t + 1)
    return x * am
SFX = {
    'step': lambda: (np.sin(2 * np.pi * 70 * t_(.08)) * np.exp(-t_(.08) / .02) + bp(noise(.08), 800, 3000) * np.exp(-t_(.08) / .01) * .3, .22),
    'pop': lambda: (sweep(700, 220, .09) * env(int(round(.09 * SR)), .001, .03), .35),
    'door_bell': lambda: (bell([1320, 2640, 3960], 1.6) * .5 + np.pad(bell([1760, 3520], 1.4), (int(round(.12 * SR)), int(round(.2 * SR))))[:int(1.6 * SR)] * .45, .32),
    'whoosh_in': lambda: (whoosh(.7, 300, 3500), .35), 'whoosh_up': lambda: (whoosh(.9, 250, 4000), .35), 'whoosh_down': lambda: (whoosh(.6, 3500, 300, True), .3),
    'whip': lambda: (whoosh(.45, 600, 6000), .4), 'sheet': lambda: (whoosh(.35, 800, 3000), .22), 'fly': lambda: (whoosh(.5, 900, 5000), .2), 'swipe': lambda: (whoosh(.8, 400, 2500), .25),
    'street_amb': lambda: (lp(noise(6), 500) * .6 + bp(noise(6), 1500, 4000) * .05, .05),
    'room_amb': lambda: (murmur(9.4), .07), 'cafe_amb': lambda: (murmur(10), .08),
    'shock': lambda: (sweep(420, 110, .5) * env(int(round(.5 * SR)), .005, .25), .3), 'hit': lambda: (sweep(140, 45, .6) * env(int(round(.6 * SR)), .002, .18) + bp(noise(.6), 200, 2000) * env(int(round(.6 * SR)), .001, .05) * .4, .5),
    'tap': lambda: (bp(noise(.03), 2500, 9000) * env(int(round(.03 * SR)), .0005, .005) + np.sin(2 * np.pi * 1400 * t_(.03)) * env(int(round(.03 * SR)), .0005, .008) * .5, .4),
    'coin': lambda: (bell([2400, 3780, 5230], .35), .14), 'ding': lambda: (bell([1568, 2093, 3136], 1.3), .25),
    'land': lambda: (sweep(500, 160, .1) * env(int(round(.1 * SR)), .001, .04), .4),
    'pen_qr': lambda: (scratch(1.6), .22), 'pen_logo': lambda: (scratch(1.3), .2), 'pen_in': lambda: (scratch(.6), .1),
    'scan': lambda: (np.sign(np.sin(2 * np.pi * 120 * t_(.6))) * bp(noise(.6), 900, 2500) * .3 * env(int(round(.6 * SR)), .01, .4), .2),
    'beep': lambda: (np.concatenate([np.sign(np.sin(2 * np.pi * 1850 * t_(.12))) * env(int(round(.12 * SR)), .002, .1), np.zeros(int(round(.04 * SR))), np.sign(np.sin(2 * np.pi * 2200 * t_(.14))) * env(int(round(.14 * SR)), .002, .12)]) * .35, .3),
    'tray': lambda: (np.concatenate([bp(noise(.45), 300, 2200) * np.linspace(.2, 1, int(round(.45 * SR))), sweep(160, 70, .15) * env(int(round(.15 * SR)), .001, .05) * 2]), .25),
    'crunch': lambda: (crunch(), .5), 'slurp': lambda: (slurp(), .35), 'laugh_pop': lambda: (sweep(500, 900, .12) * env(int(round(.12 * SR)), .002, .06), .15),
    'chime': lambda: (sum(np.pad(bell([mtof(m), mtof(m) * 2], 1.8), (int(i * .09 * SR), int(1 * SR)))[:int(2.2 * SR)] for i, m in enumerate([86, 90, 93, 98])) * .5, .3),
    'sparkle': lambda: (sum(np.pad(bell([f], .5), (int(i * .07 * SR), int(1 * SR)))[:int(1 * SR)] for i, f in enumerate([4200, 5300, 6100, 7000])) * .5, .12),
}
sfx = np.zeros((N, 2))
events = json.load(open(sys.argv[1]))
for i, e in enumerate(events):
    f = SFX.get(e['name'])
    if not f: continue
    x, g = f(); x = x / (np.abs(x).max() + 1e-9)
    pan = 0 if e['name'] in ('street_amb', 'room_amb', 'cafe_amb') else float(np.sin(i * 2.3)) * .25
    if e['name'] == 'step': pan = -.5 + (i % 4) * .1
    add(sfx, x, e['t'], g, pan)

out = sys.argv[2]; os.makedirs(out, exist_ok=True)
def write(name, x):
    x = np.tanh(x * 1.1) * .95; w = wave.open(os.path.join(out, name), 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
def norm(x, target_rms):
    r = np.sqrt(np.mean(x ** 2)) + 1e-9; return x * target_rms / r

music = norm(music, .075); write('music.wav', music); write('sfx.wav', sfx)
write('mix_novoice.wav', music + sfx)

if len(sys.argv) > 3:
    raw = os.path.join(out, 'vo_raw.wav')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', sys.argv[3], '-ar', str(SR), '-ac', '1', raw], check=True)
    w = wave.open(raw); v = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768; w.close()
    # split on silences longer than 0.35 s
    frame = int(round(.02 * SR)); en = np.array([np.sqrt(np.mean(v[i:i + frame] ** 2)) for i in range(0, len(v) - frame, frame)])
    thr = max(en.max() * .04, 1e-4); loud = en > thr; segs = []; i = 0
    while i < len(loud):
        if loud[i]:
            j = i
            while j < len(loud) and (loud[j] or (j + 18 < len(loud) and loud[j:j + 18].any())): j += 1
            segs.append((max(0, i - 2) * frame, min(len(v), (j + 3) * frame))); i = j
        else: i += 1
    print('voice segments:', [(round(a / SR, 2), round(b / SR, 2)) for a, b in segs])
    # merge the closest pairs until there are as many segments as voice beats
    while len(segs) > len(VO_STARTS):
        gaps = [segs[k + 1][0] - segs[k][1] for k in range(len(segs) - 1)]; k = int(np.argmin(gaps)); segs[k] = (segs[k][0], segs[k + 1][1]); del segs[k + 1]
    vo = np.zeros(N); duck = np.zeros(N)
    for (a, b), st in zip(segs, VO_STARTS):
        x = v[a:b] * np.minimum(1, np.minimum(np.arange(b - a), np.arange(b - a)[::-1]) / (.01 * SR)); i0 = int(st * SR); j0 = min(N, i0 + len(x))
        vo[i0:j0] += x[:j0 - i0]; duck[max(0, i0 - int(round(.15 * SR))):min(N, j0 + int(round(.25 * SR)))] = 1
    duck = lp(duck, 6) ; duck = np.clip(duck, 0, 1)
    vo = norm(hp(vo, 90), .11)
    write('voice.wav', np.stack([vo, vo], 1))
    mix = music * (1 - .55 * duck)[:, None] + sfx * (1 - .3 * duck)[:, None] + np.stack([vo, vo], 1)
    write('mix_voice.wav', mix)
    print('segments placed:', len(segs))
print('done')
