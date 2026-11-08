/*
 * STAKED MOTION — brand motion system (dependency-free: no libraries, fonts, images, network).
 *
 *   <staked-logo size="28"></staked-logo>                       brand mark: intro + hover micro-motion
 *   <staked-motion type="full"></staked-motion>                 PURCHASE → SCAN → POINTS → REWARD story (loop)
 *   <staked-motion type="intro"></staked-motion>                logo lock-up reveal (once)
 *   <staked-motion type="loader"></staked-motion>               compact logo loader (loop)
 *   <staked-motion type="purchase|scan|points|reward"></...>    single-scene phone clips (once; add `loop` to repeat)
 *   <staked-motion type="success"></staked-motion>              short confirmation (once)
 *
 * Attributes: locale (ru|en|az, default = <html lang>), theme (light|dark, default = <html data-theme>),
 *             speed (0.5–2.5), size (small|medium|large), loop, paused.
 * JS: el.play() el.pause() el.replay() el.seek(seconds)  ·  event "staked-ended" (non-looping types).
 *
 * Architecture: one deterministic timeline per scene, draw(t) → SVG attributes. No CSS keyframes, so every
 * frame can be rendered, paused and tested exactly; the loop restarts from a state identical to its end.
 * The logo geometry is the original mark (rect 32/rx 9 + dome + two lines); the final state of every
 * animation is that exact geometry.
 */
(() => {
  'use strict';
  const G = typeof window !== 'undefined' ? window : globalThis;
  if (G.StakedMotion) return;
  let UID = 0;

  /* ───────────── math & easing ───────────── */
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, k) => a + (b - a) * k;
  const E = {
    lin: (t) => t,
    out: (t) => 1 - Math.pow(1 - t, 3),
    out4: (t) => 1 - Math.pow(1 - t, 4),
    expo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    in: (t) => t * t,
    io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    back: (t) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2)
  };
  const P = (t, a, b, e = E.io) => e(clamp((t - a) / (b - a)));
  const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ───────────── palette & copy ───────────── */
  const PAL = {
    light: { accent: '#c2500a', onAccent: '#ffffff', paper: '#fffdf9', line: '#e8dfd3', ink: '#211f1c', muted: '#82796f', screen: '#f7f3ec', tint: '#f3e2d3', body: '#1b1816', edge: '#4a443d', qr: '#ffffff', qrInk: '#1b1816' },
    dark: { accent: '#f07a2a', onAccent: '#1b0e04', paper: '#262320', line: '#454039', ink: '#f4eee5', muted: '#aaa195', screen: '#1c1a17', tint: '#3a2a1e', body: '#0d0b0a', edge: '#4b453e', qr: '#f7f3ec', qrInk: '#141311' }
  };
  const LOGO_ORANGE = '#c2500a';

  const I18N = {
    ru: {
      aria: 'Как работает STAKED: покупка, сканирование QR-кода, баллы и награда',
      rail: ['ПОКУПКА', 'СКАНИРОВАНИЕ', 'БАЛЛЫ', 'НАГРАДА'],
      cap: [['Покупка', 'Выберите предложение', 'и подтвердите покупку.'], ['Сканирование', 'QR-код подтверждает', 'покупку на месте.'], ['Баллы', 'Баллы STAKED', 'начисляются сразу.'], ['Награда', 'Обменяйте баллы', 'на еду и бонусы.']],
      choose: 'ВЫБЕРИТЕ ПРЕДЛОЖЕНИЕ', item: 'Бургер-комбо', itemSub: 'STAKED · Баку', buy: 'Купить', fore: '+120 баллов STAKED',
      scan: 'ОТСКАНИРУЙТЕ QR-КОД', verified: 'Покупка подтверждена', bal: 'БАЛЛЫ', pts: 'БАЛЛОВ', left: 'До награды ещё 640',
      pick: 'ВЫБЕРИТЕ НАГРАДУ', rA: 'Бесплатный кофе', rB: 'Десерт дня', rC: 'Бургер-комбо', got: 'ПОЛУЧЕНО',
      doneT: 'НАГРАДА ПОЛУЧЕНА', doneS: 'Приятного аппетита', ok: 'Готово'
    },
    en: {
      aria: 'How STAKED works: purchase, QR scan, points and reward',
      rail: ['PURCHASE', 'SCAN', 'POINTS', 'REWARD'],
      cap: [['Purchase', 'Pick an offer and', 'confirm in seconds.'], ['Scan', 'A QR code verifies', 'the purchase on site.'], ['Points', 'STAKED points are', 'credited instantly.'], ['Reward', 'Redeem points for', 'food and extras.']],
      choose: 'CHOOSE AN OFFER', item: 'Burger combo', itemSub: 'STAKED · Baku', buy: 'Buy', fore: '+120 STAKED points',
      scan: 'SCAN THE QR CODE', verified: 'Purchase verified', bal: 'POINTS', pts: 'POINTS', left: '640 to your next reward',
      pick: 'CHOOSE A REWARD', rA: 'Free coffee', rB: 'Dessert of the day', rC: 'Burger combo', got: 'CLAIMED',
      doneT: 'REWARD UNLOCKED', doneS: 'Enjoy your meal', ok: 'Done'
    },
    az: {
      aria: 'STAKED necə işləyir: alış, QR skanı, xallar və mükafat',
      rail: ['ALIŞ', 'SKAN', 'XALLAR', 'MÜKAFAT'],
      cap: [['Alış', 'Təklif seçin və', 'alışı təsdiqləyin.'], ['Skan', 'QR kod alışı', 'yerində təsdiqləyir.'], ['Xallar', 'STAKED xalları', 'dərhal əlavə olunur.'], ['Mükafat', 'Xalları yeməyə və', 'bonuslara dəyişin.']],
      choose: 'TƏKLİF SEÇİN', item: 'Burger kombo', itemSub: 'STAKED · Bakı', buy: 'Al', fore: '+120 STAKED xalı',
      scan: 'QR KODU SKAN EDİN', verified: 'Alış təsdiqləndi', bal: 'XALLAR', pts: 'XAL', left: 'Mükafata 640 xal qalıb',
      pick: 'MÜKAFAT SEÇİN', rA: 'Pulsuz kofe', rB: 'Günün deserti', rC: 'Burger kombo', got: 'ƏLDƏ EDİLDİ',
      doneT: 'MÜKAFAT ƏLDƏ EDİLDİ', doneS: 'Nuş olsun', ok: 'Hazırdır'
    }
  };

  /* ───────────── render rig: key → SVG element, cached attribute writes ───────────── */
  function rig(svg) {
    const els = {};
    const cache = {};
    svg.querySelectorAll('[data-k]').forEach((e) => { els[e.getAttribute('data-k')] = e; });
    const r3 = (v) => Math.round(v * 1000) / 1000;
    const a = (k, n, v) => {
      const e = els[k]; if (!e) return;
      const key = k + '|' + n;
      if (cache[key] !== v) { cache[key] = v; e.setAttribute(n, v); }
    };
    return {
      a,
      put(k, o) {
        const e = els[k]; if (!e) return;
        o = o || {};
        const op = o.o === undefined ? 1 : o.o;
        if (!(op > 0.003)) { a(k, 'display', 'none'); return; }
        a(k, 'display', 'inline');
        let tr = 'translate(' + r3(o.x || 0) + ' ' + r3(o.y || 0) + ')';
        if (o.r) tr += ' rotate(' + r3(o.r) + ')';
        const sx = o.sx !== undefined ? o.sx : o.s !== undefined ? o.s : 1;
        const sy = o.sy !== undefined ? o.sy : o.s !== undefined ? o.s : 1;
        if (sx !== 1 || sy !== 1) tr += ' scale(' + r3(sx) + ' ' + r3(sy) + ')';
        a(k, 'transform', tr);
        a(k, 'opacity', r3(Math.min(1, op)));
      },
      txt(k, s) {
        const e = els[k]; if (!e) return;
        if (cache[k + '|t'] !== s) { cache[k + '|t'] = s; e.textContent = s; }
      }
    };
  }

  /* ───────────── the logo (original geometry, re-pivoted around the tile centre) ───────────── */
  // original: rect 32×32 rx9 #c2500a · path "M7 15a9 7 0 0 1 18 0z M7 19h18M9 23h14" white, stroke 2.2, round caps
  const STROKE = 'stroke="#fff" stroke-width="2.2" stroke-linecap="round"';
  const logoMk = (k) =>
    `<g data-k="${k}">` +
    `<g data-k="${k}.t"><rect x="-16" y="-16" width="32" height="32" rx="9" fill="${LOGO_ORANGE}"/></g>` +
    `<g data-k="${k}.a" transform="translate(0 3)"><path data-k="${k}.al" d="M0 0H-9" fill="none" ${STROKE} stroke-dasharray="9" stroke-dashoffset="0"/><path data-k="${k}.ar" d="M0 0H9" fill="none" ${STROKE} stroke-dasharray="9" stroke-dashoffset="0"/></g>` +
    `<g data-k="${k}.b" transform="translate(0 7)"><path data-k="${k}.bl" d="M0 0H-7" fill="none" ${STROKE} stroke-dasharray="7" stroke-dashoffset="0"/><path data-k="${k}.br" d="M0 0H7" fill="none" ${STROKE} stroke-dasharray="7" stroke-dashoffset="0"/></g>` +
    `<g data-k="${k}.d" transform="translate(0 -1)"><path d="M-9 0a9 7 0 0 1 18 0z" fill="#fff" ${STROKE}/></g>` +
    '</g>';

  // Intro: tile settles, two lines draw out from the centre, the dome drops onto them and lands.
  function logoIntro(R, k, u) {
    R.put(k + '.t', { s: 0.86 + 0.14 * P(u, 0, 0.6, E.expo), o: clamp(u / 0.22) });
    const ka = P(u, 0.3, 0.78, E.out4), kb = P(u, 0.4, 0.88, E.out4);
    const f = P(u, 0.5, 0.78, E.in);
    const sq = Math.sin(Math.PI * clamp((u - 0.78) / 0.26));
    R.put(k + '.a', { y: 3 + 0.35 * sq, o: clamp(ka * 8) });
    R.a(k + '.al', 'stroke-dashoffset', 9 * (1 - ka)); R.a(k + '.ar', 'stroke-dashoffset', 9 * (1 - ka));
    R.put(k + '.b', { y: 7 + 0.2 * sq, o: clamp(kb * 8) });
    R.a(k + '.bl', 'stroke-dashoffset', 7 * (1 - kb)); R.a(k + '.br', 'stroke-dashoffset', 7 * (1 - kb));
    R.put(k + '.d', { y: -1 - 6 * (1 - f), sx: 1 + 0.035 * sq, sy: 1 - 0.08 * sq, o: clamp((u - 0.5) / 0.12) });
  }

  // Loader: the same stacking gesture, built and unbuilt, 1.8 s loop (state at 0 == state at 1.8).
  function logoLoader(R, k, u) {
    R.put(k + '.t', { s: 1, o: 1 });
    const ka = P(u, 0, 0.45, E.out4) * (1 - P(u, 1.38, 1.68, E.io));
    const kb = P(u, 0.1, 0.55, E.out4) * (1 - P(u, 1.3, 1.6, E.io));
    const f = P(u, 0.25, 0.5, E.in);
    const sq = Math.sin(Math.PI * clamp((u - 0.5) / 0.26));
    const up = P(u, 1.3, 1.6, E.io);
    R.put(k + '.a', { y: 3, o: clamp(ka * 8) });
    R.a(k + '.al', 'stroke-dashoffset', 9 * (1 - ka)); R.a(k + '.ar', 'stroke-dashoffset', 9 * (1 - ka));
    R.put(k + '.b', { y: 7, o: clamp(kb * 8) });
    R.a(k + '.bl', 'stroke-dashoffset', 7 * (1 - kb)); R.a(k + '.br', 'stroke-dashoffset', 7 * (1 - kb));
    R.put(k + '.d', { y: -1 - 6 * (1 - f) - 5 * up, sx: 1 + 0.035 * sq, sy: 1 - 0.08 * sq, o: clamp((u - 0.25) / 0.1) * (1 - clamp((up - 0.3) / 0.7)) });
  }

  // Hover: dome lifts a little and lands again (0.75 s). Everything returns to the exact static mark.
  function logoHover(R, k, h) {
    const lift = Math.sin(Math.PI * clamp(h / 0.55));
    const sq = Math.sin(Math.PI * clamp((h - 0.55) / 0.2));
    R.put(k + '.d', { y: -1 - 1.6 * lift, sx: 1 + 0.03 * sq, sy: 1 - 0.06 * sq });
    R.put(k + '.a', { y: 3 + 0.3 * sq });
  }

  function logoStatic(R, k) { logoIntro(R, k, 99); }

  /* ───────────── QR matrix (deterministic, 21×21 with finder/timing/alignment) ───────────── */
  const QR = (() => {
    const N = 21, m = [], res = [];
    for (let r = 0; r < N; r++) { m.push(new Array(N).fill(0)); res.push(new Array(N).fill(false)); }
    const finder = (r0, c0) => {
      for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
        const rr = r0 + r, cc = c0 + c;
        if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue;
        res[rr][cc] = true;
        const inside = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        m[rr][cc] = inside && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) ? 1 : 0;
      }
    };
    finder(0, 0); finder(0, 14); finder(14, 0);
    for (let i = 8; i <= 12; i++) { res[6][i] = res[i][6] = true; m[6][i] = m[i][6] = i % 2 === 0 ? 1 : 0; }
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      res[16 + r][16 + c] = true;
      m[16 + r][16 + c] = r === 0 || r === 4 || c === 0 || c === 4 || (r === 2 && c === 2) ? 1 : 0;
    }
    let s = 5741;
    const rnd = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!res[r][c]) m[r][c] = rnd() < 0.5 ? 1 : 0;
    const MS = 4.4, O = -(N * MS) / 2;
    const bands = [];
    for (let d = 0; d <= 2 * (N - 1); d++) bands.push('');
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (m[r][c]) {
      bands[r + c] += `M${(O + c * MS).toFixed(2)} ${(O + r * MS).toFixed(2)}h${MS}v${MS}h-${MS}z`;
    }
    return { bands, half: (N * MS) / 2 };
  })();

  /* ───────────── shared markup parts ───────────── */
  const T = (x, y, s, o) => {
    o = o || {};
    return `<text${o.k ? ` data-k="${o.k}"` : ''} x="${x}" y="${y}" font-size="${o.sz || 10}" font-weight="${o.w || 700}" fill="${o.f}"${o.a ? ` text-anchor="${o.a}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${esc(s)}</text>`;
  };
  const CHECK = (k, c, sw, len, d) => `<path data-k="${k}" d="${d}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${len}" stroke-dashoffset="${len}"/>`;
  const glyph = (fill) => // the mark's dome + lines as an illustration, centred at (0,0), 1 unit = 1 logo unit
    `<g fill="none" stroke="${fill}" stroke-width="2.2" stroke-linecap="round"><path d="M-9 -.5a9 7 0 0 1 18 0z" fill="${fill}"/><path d="M-9 3.5h18M-7 7.5h14"/></g>`;
  const SHELL = () => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`;

  /* ═════════════ STORY (full + single-scene phone clips) ═════════════ */
  const K = { L: 2.0, cut0: 2.0, cut1: 3.0, sc: [3.0, 5.2, 7.8, 9.9, 12.3], end: [5.2, 7.8, 9.9, 12.3, 13.7], exit0: 13.7, T: 14.7 };

  function makeStory(cfg) {
    const SL = { purchase: 0, scan: 1, points: 2, reward: 3 }[cfg.type];
    const isSlice = SL !== undefined;
    const narrow = !isSlice && cfg.layout === 'narrow';
    const c = PAL[cfg.theme] || PAL.light;
    const L = I18N[cfg.locale] || I18N.ru;
    const id = 'sm' + ++UID;
    const Lay = isSlice ? { W: 240, H: 420, px: 120, py: 210, ps: 1, lx: 120, ly: 210, wy: 0 }
      : narrow ? { W: 300, H: 478, px: 150, py: 212, ps: 1, lx: 150, ly: 186, wy: 256 }
        : { W: 720, H: 440, px: 360, py: 220, ps: 1, lx: 360, ly: 198, wy: 268 };

    /* — phone — */
    const bandsMk = QR.bands.map((d, i) => (d ? `<g data-k="q.d${i}"><path d="${d}" fill="${c.qrInk}"/></g>` : '')).join('');
    const pill = (k, w, h, fill) => `<rect data-k="${k}" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}"/>`;
    const card = (cy, k, title, cost, tileFill, strokeC) =>
      `<g data-k="${k}"><g data-k="${k}.base"><rect x="-80" y="-28" width="160" height="56" rx="14" fill="${c.paper}" stroke="${c.line}" stroke-width="1"/>` +
      `<rect x="-72" y="-17" width="34" height="34" rx="9" fill="${c.tint}"/><g transform="translate(-55 0)">${glyph(c.accent)}</g>` +
      T(-32, -2, title, { sz: 8.8, w: 700, f: c.ink }) + T(-32, 11, cost[1], { sz: 7.5, w: 600, f: c.muted }) +
      T(72, 4, cost[0], { sz: 11, w: 800, f: c.accent, a: 'end' }) + '</g>' +
      `<rect data-k="${k}.sel" x="-80" y="-28" width="160" height="56" rx="14" fill="none" stroke="${c.accent}" stroke-width="1.8" display="none"/>` +
      (k === 'r.a' ? ticket() : '') + '</g>';
    const ticket = () =>
      `<g data-k="r.tk"><rect x="-80" y="-28" width="160" height="56" rx="14" fill="${c.accent}"/>` +
      `<rect x="-72" y="-17" width="34" height="34" rx="9" fill="#000" fill-opacity=".16"/><g transform="translate(-55 0)">${glyph(c.onAccent)}</g>` +
      T(-32, -2, L.rA, { sz: 9, w: 800, f: c.onAccent }) + T(-32, 11, L.got, { sz: 7, w: 800, f: c.onAccent, ls: 1 }) +
      `<line x1="52" y1="-18" x2="52" y2="18" stroke="${c.onAccent}" stroke-opacity=".55" stroke-width="1.2" stroke-dasharray="2.5 3.5"/>` +
      `<circle cx="-80" cy="0" r="6" fill="${c.screen}"/><circle cx="80" cy="0" r="6" fill="${c.screen}"/>` +
      CHECK('r.tkc', c.onAccent, 2.2, 14, 'M58.5 0.5l3.6 3.6L69 -3.6').replace('stroke-dashoffset="14"', 'stroke-dashoffset="0"') + '</g>';

    const screen =
      `<g data-k="scr">` +
      /* header (always) */
      `<g data-k="hd">` + T(-58, -142.5, 'STAKED', { sz: 9.5, w: 800, f: c.ink, ls: 1.6 }) +
      `<rect x="14" y="-157" width="68" height="22" rx="11" fill="${c.paper}" stroke="${c.line}" stroke-width="1"/><circle cx="26" cy="-146" r="3.2" fill="${c.accent}"/>` +
      T(74, -142.6, '1 240', { k: 'hd.n', sz: 9.5, w: 800, f: c.ink, a: 'end' }) + '</g>' +
      /* S0 purchase */
      `<g data-k="s0">` + `<g data-k="b.lbl">${T(-80, -112, L.choose, { sz: 7.5, w: 800, f: c.muted, ls: 1.1 })}</g>` +
      `<g data-k="b.card"><rect x="-80" y="-98" width="160" height="148" rx="16" fill="${c.paper}" stroke="${c.line}" stroke-width="1"/>` +
      `<rect x="-72" y="-90" width="144" height="66" rx="11" fill="${c.tint}"/><g transform="translate(0 -57) scale(2.5)">${glyph(c.accent)}</g>` +
      `<rect x="38" y="-84" width="30" height="14" rx="7" fill="${c.accent}"/>` + T(53, -74, '−20%', { sz: 7.5, w: 800, f: c.onAccent, a: 'middle' }) +
      T(-72, -6, L.item, { sz: 11.5, w: 700, f: c.ink }) + T(-72, 7, L.itemSub, { sz: 8, w: 600, f: c.muted }) +
      T(-72, 38, '12.90 AZN', { sz: 14, w: 800, f: c.ink }) + T(72, 37, '16.10', { sz: 8, w: 600, f: c.muted, a: 'end' }) +
      `<rect x="54" y="34.2" width="18" height="1" fill="${c.muted}"/></g>` +
      `<g data-k="b.btn"><clipPath id="${id}-b"><rect x="-80" y="-16" width="160" height="32" rx="11"/></clipPath>` +
      `<rect x="-80" y="-16" width="160" height="32" rx="11" fill="${c.accent}"/>` + `<g clip-path="url(#${id}-b)"><circle data-k="b.rip" cx="0" cy="0" r="0" fill="${c.onAccent}" opacity="0"/></g>` +
      `<g data-k="b.lab">${T(0, 3.8, L.buy, { sz: 10.5, w: 800, f: c.onAccent, a: 'middle' })}</g>` +
      `<g data-k="b.chk">${CHECK('b.chkp', c.onAccent, 2.4, 20, 'M-7 0l4.5 4.5L7 -5')}</g></g>` +
      `<g data-k="b.fore"><circle cx="-80" cy="112" r="3" fill="${c.accent}"/>${T(-72, 115, L.fore, { sz: 8.5, w: 700, f: c.muted })}</g>` +
      `<g data-k="b.touch"><circle r="11" fill="${c.ink}" fill-opacity=".12" stroke="${c.ink}" stroke-opacity=".4" stroke-width="1.2"/><circle r="3" fill="${c.ink}" fill-opacity=".5"/></g>` + '</g>' +
      /* S1 scan */
      `<g data-k="s1">` + `<g data-k="q.lbl">${T(-80, -112, L.scan, { sz: 7.5, w: 800, f: c.muted, ls: 1.1 })}</g>` +
      `<g data-k="q.p" transform="translate(0 -40)"><rect x="-62" y="-62" width="124" height="124" rx="14" fill="${c.qr}" stroke="${c.line}" stroke-width="1"/><g data-k="q.m">${bandsMk}</g></g>` +
      `<g data-k="q.br"><path d="M-70 -56V-70H-56M56 -70H70V-56M70 56V70H56M-56 70H-70V56" fill="none" stroke="${c.accent}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g>` +
      `<g data-k="q.sc"><rect x="-48" y="-24" width="96" height="24" fill="url(#${id}-g)"/><rect x="-48" y="-1.2" width="96" height="1.6" rx=".8" fill="${c.accent}"/></g>` +
      `<g data-k="q.ver">${T(0, 50, L.verified, { sz: 9.5, w: 700, f: c.ink, a: 'middle' })}</g>` + '</g>' +
      /* S2 points */
      `<g data-k="s2">` + `<g data-k="p.lbl">${T(-80, -112, L.bal, { sz: 7.5, w: 800, f: c.muted, ls: 1.1 })}</g>` +
      `<g data-k="p.ring"><circle r="46" fill="none" stroke="${c.line}" stroke-width="5"/>` +
      `<circle data-k="p.arc" r="46" fill="none" stroke="${c.accent}" stroke-width="5" stroke-linecap="round" transform="rotate(-90)" stroke-dasharray="289.03" stroke-dashoffset="109.8"/>` +
      `<g data-k="p.ng">${T(0, 8, '1 240', { k: 'p.num', sz: 27, w: 800, f: c.ink, a: 'middle', ls: -0.5 })}${T(0, 24, L.pts, { sz: 7, w: 800, f: c.muted, a: 'middle', ls: 1.2 })}</g></g>` +
      `<g data-k="p.row"><rect x="-80" y="48" width="160" height="40" rx="12" fill="${c.paper}" stroke="${c.line}" stroke-width="1"/><rect x="-72" y="55" width="26" height="26" rx="8" fill="${c.tint}"/><g transform="translate(-59 68) scale(.8)">${glyph(c.accent)}</g>` +
      T(-38, 65, L.item, { sz: 9.5, w: 700, f: c.ink }) + T(-38, 77, L.itemSub, { sz: 7.5, w: 600, f: c.muted }) + T(72, 72.5, '+120', { sz: 12, w: 800, f: c.accent, a: 'end' }) + '</g>' +
      `<g data-k="p.left">${T(0, 112, L.left, { sz: 8.5, w: 700, f: c.muted, a: 'middle' })}</g>` + '</g>' +
      /* S3 reward */
      `<g data-k="s3">` + `<g data-k="w.lbl">${T(-80, -112, L.pick, { sz: 7.5, w: 800, f: c.muted, ls: 1.1 })}</g>` +
      card(0, 'r.a', L.rA, ['300', L.pts.toLowerCase()]) + card(0, 'r.b', L.rB, ['450', L.pts.toLowerCase()]) + card(0, 'r.c', L.rC, ['1500', L.pts.toLowerCase()]) +
      `<g data-k="r.touch"><circle r="11" fill="${c.ink}" fill-opacity=".12" stroke="${c.ink}" stroke-opacity=".4" stroke-width="1.2"/><circle r="3" fill="${c.ink}" fill-opacity=".5"/></g>` +
      `<g data-k="r.pill">${pill('r.pillr', 40, 17, c.accent)}${T(0, 3.4, '−300', { sz: 9.5, w: 800, f: c.onAccent, a: 'middle' })}</g>` + '</g>' +
      /* S4 done */
      `<g data-k="s4"><circle data-k="d.fill" cx="0" cy="-22" r="30" fill="${c.accent}" fill-opacity=".1"/>` +
      `<circle data-k="d.ring" cx="0" cy="-22" r="30" fill="none" stroke="${c.accent}" stroke-width="3" stroke-linecap="round" transform="rotate(-90 0 -22)" stroke-dasharray="188.5" stroke-dashoffset="188.5"/>` +
      `<g transform="translate(0 -22)">${CHECK('d.chk', c.accent, 3.4, 35, 'M-11 1l8 8L12 -8')}</g>` +
      `<g data-k="d.t1">${T(0, 44, L.doneT, { sz: 8.5, w: 800, f: c.accent, a: 'middle', ls: 1.2 })}</g><g data-k="d.t2">${T(0, 64, L.doneS, { sz: 13, w: 700, f: c.ink, a: 'middle' })}</g></g>` +
      /* badge: check → "+120" chip → absorbed into balance */
      `<g data-k="bd"><rect data-k="bd.r" x="-13" y="-13" width="26" height="26" rx="13" fill="${c.accent}"/><g data-k="bd.c">${CHECK('bd.cp', c.onAccent, 2.6, 19, 'M-6 .5l4.2 4.2L6.5 -4.6')}</g>` +
      `<g data-k="bd.tg">${T(0, 3.6, '+120', { sz: 10, w: 800, f: c.onAccent, a: 'middle' })}</g></g>` +
      '</g>';

    const phone =
      `<g data-k="ph"><ellipse cx="0" cy="208" rx="96" ry="10" fill="url(#${id}-sh)"/>` +
      `<rect x="-100" y="-194" width="200" height="388" rx="36" fill="${c.body}" stroke="${c.edge}" stroke-width=".8"/>` +
      `<rect x="-102" y="-120" width="2.4" height="26" rx="1" fill="${c.edge}"/><rect x="-102" y="-84" width="2.4" height="44" rx="1" fill="${c.edge}"/><rect x="99.6" y="-100" width="2.4" height="58" rx="1" fill="${c.edge}"/>` +
      `<rect x="-92" y="-186" width="184" height="372" rx="28" fill="${c.screen}"/>` +
      `<g clip-path="url(#${id}-s)">${screen}</g>` +
      `<rect x="-27" y="-180" width="54" height="15" rx="7.5" fill="#000"/><rect x="-26" y="176" width="52" height="3" rx="1.5" fill="${c.ink}" fill-opacity=".28"/></g>`;

    /* — stage chrome (full only) — */
    let chrome = '';
    if (!isSlice && !narrow) {
      const ys = [133, 191, 249, 307];
      chrome += `<g data-k="rail"><line x1="96" y1="133" x2="96" y2="307" stroke="${c.line}" stroke-width="1.5"/><line data-k="rail.p" x1="96" y1="133" x2="96" y2="133" stroke="${c.accent}" stroke-width="1.5"/>`;
      ys.forEach((y, i) => {
        chrome += `<g data-k="r${i}.off"><circle cx="96" cy="${y}" r="11" fill="${c.screen}" stroke="${c.line}" stroke-width="1.5"/>${T(96, y + 3.2, i + 1, { sz: 9, w: 800, f: c.muted, a: 'middle' })}${T(118, y + 3.4, L.rail[i], { sz: 9, w: 800, f: c.muted, ls: 1.1 })}</g>`;
        chrome += `<g data-k="r${i}.on"><circle cx="96" cy="${y}" r="11" fill="${c.accent}"/><circle cx="96" cy="${y}" r="16" fill="none" stroke="${c.accent}" stroke-opacity=".28" stroke-width="1.2"/>${T(96, y + 3.2, i + 1, { sz: 9, w: 800, f: c.onAccent, a: 'middle' })}${T(118, y + 3.4, L.rail[i], { sz: 9, w: 800, f: c.ink, ls: 1.1 })}</g>`;
        chrome += `<g data-k="r${i}.dn"><circle cx="96" cy="${y}" r="11" fill="${c.screen}" stroke="${c.accent}" stroke-width="1.5"/><path d="M91.5 ${y + 0.4}l3 3L101 ${y - 3.4}" fill="none" stroke="${c.accent}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>${T(118, y + 3.4, L.rail[i], { sz: 9, w: 800, f: c.muted, ls: 1.1 })}</g>`;
      });
      chrome += '</g>';
      chrome += `<g data-k="capc"><rect x="520" y="158" width="170" height="124" rx="18" fill="${c.paper}" stroke="${c.line}" stroke-width="1"/>`;
      L.cap.forEach((t, i) => {
        chrome += `<g data-k="cap${i}">${T(540, 186, '0' + (i + 1) + ' / 04', { sz: 8.5, w: 800, f: c.accent, ls: 1.2 })}${T(540, 214, t[0], { sz: 17, w: 800, f: c.ink })}${T(540, 238, t[1], { sz: 10, w: 600, f: c.muted })}${T(540, 252, t[2], { sz: 10, w: 600, f: c.muted })}</g>`;
      });
      chrome += '</g>';
    } else if (!isSlice && narrow) {
      chrome += '<g data-k="rail">';
      for (let i = 0; i < 4; i++) chrome += `<rect x="${22 + i * 66}" y="437" width="58" height="3" rx="1.5" fill="${c.line}"/><g data-k="nb${i}"><rect x="0" y="437" width="58" height="3" rx="1.5" fill="${c.accent}"/></g>`;
      L.cap.forEach((t, i) => { chrome += `<g data-k="nc${i}">${T(150, 463, t[0].toUpperCase(), { sz: 9.5, w: 800, f: c.ink, a: 'middle', ls: 1.3 })}</g>`; });
      chrome += '</g>';
    }

    const lockup = isSlice ? '' :
      `<g data-k="wm"><g clip-path="url(#${id}-w)">${T(3.5, 0, 'STAKED', { sz: 34, w: 800, f: c.ink, a: 'middle', ls: 7 })}</g></g>`;

    const defs =
      `<defs><clipPath id="${id}-s"><rect x="-92" y="-186" width="184" height="372" rx="28"/></clipPath>` +
      `<clipPath id="${id}-w"><rect data-k="wmclip" x="-120" y="-34" width="0" height="50"/></clipPath>` +
      `<linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.accent}" stop-opacity="0"/><stop offset="1" stop-color="${c.accent}" stop-opacity=".34"/></linearGradient>` +
      `<radialGradient id="${id}-sh"><stop offset="0" stop-color="#2a1c10" stop-opacity=".22"/><stop offset="1" stop-color="#2a1c10" stop-opacity="0"/></radialGradient></defs>`;

    const markup = `${SHELL()} viewBox="0 0 ${Lay.W} ${Lay.H}" role="img" aria-label="${esc(L.aria)}">${defs}${chrome}${lockup}${phone}${logoMk('L')}</svg>`;

    /* — timeline — */
    const bal = (t) => {
      if (t < 8.95) return 1240;
      if (t < 9.55) return lerp(1240, 1360, E.out(P(t, 8.95, 9.55)));
      const r0 = K.sc[3] + 1.7;
      if (t < r0) return 1360;
      return lerp(1360, 1060, E.io(P(t, r0, r0 + 0.4)));
    };

    const mount = (svg) => {
      const R = rig(svg);
      return (t) => {
        const tg = isSlice ? K.sc[SL] + t : t;
        const vis = (i) => !isSlice || i === SL || (SL === 3 && i === 4);
        const pe = isSlice ? 1 : P(tg, 2.35, 3.1, E.out4) * (1 - P(tg, K.exit0, 14.4, E.io));
        const hd = isSlice ? 1 : P(tg, 2.75, 3.1, E.out) * (1 - P(tg, K.exit0, 13.95, E.io));
        const cc = isSlice ? 1 : P(tg, K.cut0, K.cut1, E.io) * (1 - P(tg, 13.9, 14.7, E.io));
        const pyOff = 18 * (1 - pe), ps = Lay.ps * (0.94 + 0.06 * pe);

        R.put('ph', { x: Lay.px, y: Lay.py + pyOff, s: ps, o: Math.min(1, pe * 1.6) });
        R.put('scr', { o: isSlice ? P(t, 0, 0.3, E.out) : 1 });
        R.put('hd', { o: hd });
        const bv = fmt(bal(tg));
        R.txt('hd.n', bv);

        /* logo: lock-up → docks into the app header (match cut) → back */
        const dx = Lay.px + ps * -72, dy = Lay.py + pyOff + ps * -146;
        const sz = lerp(2.25, 0.5625 * ps, cc);
        R.put('L', { x: lerp(Lay.lx, dx, cc) - 16 * Math.sin(Math.PI * cc), y: lerp(Lay.ly, dy, cc), s: sz });
        logoIntro(R, 'L', tg);
        if (!isSlice) {
          const wmA = 1 - clamp(cc * 5);
          R.put('wm', { x: Lay.lx, y: Lay.wy + 6 * clamp(cc * 5), o: wmA * clamp((tg - 0.8) / 0.15) });
          R.a('wmclip', 'width', 240 * P(tg, 0.8, 1.45, E.out4));
        }

        /* scenes */
        for (let i = 0; i < 5; i++) {
          const al = vis(i) ? P(tg, K.sc[i], K.sc[i] + 0.4, E.out) * (1 - (i < 4 ? P(tg, K.end[i], K.end[i] + 0.4, E.io) : 0)) : 0;
          R.put('s' + i, { o: al });
          if (al < 0.003) continue;
          const r = tg - K.sc[i];
          const e = (a0, d) => P(r, a0, a0 + (d || 0.5), E.out4);
          if (i === 0) drawBuy(R, r, e);
          else if (i === 1) drawScan(R, r, e);
          else if (i === 2) drawPoints(R, r, e, tg, bv);
          else if (i === 3) drawReward(R, r, e);
          else drawDone(R, r, e);
        }
        drawBadge(R, tg, isSlice);

        /* stage chrome */
        if (!isSlice) {
          const dn = [0, 1, 2, 3].map((i) => P(tg, i < 3 ? K.sc[i + 1] : 12.9, (i < 3 ? K.sc[i + 1] : 12.9) + 0.45, E.out));
          const cur = [0, 1, 2, 3].map((i) => P(tg, K.sc[i], K.sc[i] + 0.45, E.out) * (1 - dn[i]));
          R.put('rail', { o: pe });
          if (!narrow) {
            for (let i = 0; i < 4; i++) {
              R.put(`r${i}.on`, { o: cur[i] }); R.put(`r${i}.dn`, { o: dn[i] });
              R.put(`r${i}.off`, { o: 1 - Math.max(cur[i], dn[i]) });
            }
            R.a('rail.p', 'y2', 133 + 174 * clamp((dn[0] + dn[1] + dn[2]) / 3 + cur[1] / 6 + cur[2] / 6 + cur[3] / 6 - (dn[0] + dn[1] + dn[2]) / 18));
            R.put('capc', { o: pe });
          }
          for (let i = 0; i < 4; i++) {
            const s0 = K.sc[i] + 0.15, e0 = i < 3 ? K.sc[i + 1] : K.exit0;
            const inn = P(tg, s0, s0 + 0.45, E.out), out = P(tg, e0, e0 + 0.3, E.io);
            if (!narrow) R.put('cap' + i, { y: 8 * (1 - inn), o: inn * (1 - out) });
            else { R.put('nc' + i, { y: 6 * (1 - inn), o: inn * (1 - out) }); R.put('nb' + i, { x: 22 + i * 66, sx: Math.max(0.001, clamp(dn[i] + cur[i] * P(tg, K.sc[i], e0, E.lin))) }); }
          }
        }
      };
    };

    /* — scene drawing — */
    function drawBuy(R, r, e) {
      let k = e(0.12, 0.4); R.put('b.lbl', { y: 6 * (1 - k), o: k });
      k = e(0.18, 0.55); R.put('b.card', { y: 12 * (1 - k), o: k });
      const pr = P(r, 1.3, 1.42, E.io) * (1 - P(r, 1.42, 1.62, E.out));
      k = e(0.4, 0.5);
      R.put('b.btn', { y: 78 + 8 * (1 - k), s: 1 - 0.035 * pr, o: k });
      R.put('b.lab', { o: 1 - P(r, 1.42, 1.6, E.out) });
      R.put('b.chk', { o: P(r, 1.45, 1.55, E.lin) });
      R.a('b.chkp', 'stroke-dashoffset', 20 * (1 - P(r, 1.5, 1.8, E.out)));
      const rp = P(r, 1.35, 1.95, E.out4);
      R.a('b.rip', 'r', lerp(4, 110, rp).toFixed(2)); R.a('b.rip', 'opacity', (0.38 * (1 - rp)).toFixed(3));
      k = e(1.75, 0.45); R.put('b.fore', { y: 6 * (1 - k), o: k });
      const tp = P(r, 0.85, 1.3, E.io), tq = P(r, 1.65, 2.1, E.io);
      const x = r < 1.5 ? lerp(66, 6, tp) : lerp(6, 52, tq), y = r < 1.5 ? lerp(150, 84, tp) : lerp(84, 132, tq);
      R.put('b.touch', { x, y, s: 1 - 0.22 * pr, o: P(r, 0.8, 0.95, E.lin) * (1 - P(r, 1.75, 2.0, E.lin)) });
    }
    function drawScan(R, r, e) {
      let k = e(0.25, 0.4); R.put('q.lbl', { y: 6 * (1 - k), o: k });
      k = e(0.3, 0.55); R.put('q.p', { y: -40 + 10 * (1 - k), s: 0.97 + 0.03 * k, o: k });
      for (let d = 0; d < QR.bands.length; d++) if (QR.bands[d]) {
        const s0 = 0.45 + (d / 40) * 0.5;
        const q = P(r, s0, s0 + 0.22, E.out4);
        R.put('q.d' + d, { y: 2.5 * (1 - q), o: q });
      }
      R.put('q.m', { o: 1 - 0.86 * P(r, 1.95, 2.25, E.io) });
      R.put('q.br', { y: -40, s: lerp(1.4, 1, P(r, 0.75, 1.25, E.expo)), o: P(r, 0.7, 0.9, E.lin) * (1 - P(r, 1.95, 2.2, E.lin)) });
      R.put('q.sc', { y: lerp(-84, 8, P(r, 1.3, 1.95, E.io)), o: P(r, 1.25, 1.35, E.lin) * (1 - P(r, 1.9, 2.0, E.lin)) });
      k = e(2.05, 0.4); R.put('q.ver', { y: 6 * (1 - k), o: k });
    }
    function drawPoints(R, r, e, tg, bv) {
      let k = e(0.3, 0.4); R.put('p.lbl', { y: 6 * (1 - k), o: k });
      k = e(0.35, 0.55); R.put('p.ring', { y: -22 + 6 * (1 - k), s: 0.92 + 0.08 * k, o: k });
      const prog = lerp(0.62, 0.68, E.out(P(tg, 8.95, 9.55)));
      R.a('p.arc', 'stroke-dashoffset', (289.03 * (1 - prog)).toFixed(2));
      R.txt('p.num', bv);
      R.put('p.ng', { s: 1 + 0.05 * Math.sin(Math.PI * P(tg, 8.95, 9.4, E.lin)) });
      k = e(0.7, 0.5); R.put('p.row', { y: 10 * (1 - k), o: k });
      k = e(1.1, 0.4); R.put('p.left', { y: 6 * (1 - k), o: k });
    }
    function drawReward(R, r, e) {
      let k = e(0.3, 0.4); R.put('w.lbl', { y: 6 * (1 - k), o: k });
      const sel = P(r, 1.35, 1.6, E.out), tk = P(r, 1.95, 2.35, E.out4);
      const ka = e(0.35), kb = e(0.5), kc = e(0.65);
      R.put('r.a', { y: -62 + 10 * (1 - ka), s: 1 + 0.015 * sel, o: ka });
      R.put('r.a.base', { o: 1 - tk }); R.put('r.a.sel', { o: sel * (1 - tk) }); R.put('r.tk', { s: 0.985 + 0.015 * tk, o: tk });
      R.put('r.b', { y: 6 + 10 * (1 - kb), o: kb * (1 - 0.4 * sel) });
      R.put('r.c', { y: 74 + 10 * (1 - kc), o: kc * (1 - 0.55 * sel) });
      R.a('r.tkc', 'stroke-dashoffset', 14 * (1 - P(r, 2.1, 2.4, E.out)));
      const tp = P(r, 0.85, 1.3, E.io), tq = P(r, 1.65, 2.1, E.io);
      const pr = P(r, 1.3, 1.45, E.io) * (1 - P(r, 1.45, 1.65, E.out));
      R.put('r.touch', { x: r < 1.5 ? lerp(70, 40, tp) : lerp(40, 56, tq), y: r < 1.5 ? lerp(130, -48, E.out(tp)) : lerp(-48, 10, tq), s: 1 - 0.22 * pr, o: P(r, 0.8, 0.95, E.lin) * (1 - P(r, 1.7, 1.95, E.lin)) });
      const pt = P(r, 1.55, 2.1, E.io);
      R.put('r.pill', { x: lerp(48, 52, pt), y: lerp(-146, -62, pt), s: lerp(1, 0.6, P(r, 1.95, 2.2)), o: P(r, 1.5, 1.62, E.lin) * (1 - P(r, 2.0, 2.25, E.lin)) });
    }
    function drawDone(R, r, e) {
      R.a('d.ring', 'stroke-dashoffset', (188.5 * (1 - P(r, 0.15, 0.75, E.out4))).toFixed(2));
      R.a('d.fill', 'fill-opacity', (0.1 * P(r, 0.3, 0.8, E.out)).toFixed(3));
      R.a('d.chk', 'stroke-dashoffset', (35 * (1 - P(r, 0.65, 1.0, E.out))).toFixed(2));
      let k = e(0.85, 0.4); R.put('d.t1', { y: 6 * (1 - k), o: k });
      k = e(0.95, 0.4); R.put('d.t2', { y: 6 * (1 - k), o: k });
    }
    function drawBadge(R, tg, slice) {
      const t0 = 7.15, p0 = K.sc[2];
      const born = P(tg, t0, t0 + 0.35, E.back);
      const rise = P(tg, p0, p0 + 0.65, E.io);
      const w = lerp(26, 58, P(tg, p0 + 0.15, p0 + 0.55)), h = lerp(26, 20, P(tg, p0 + 0.15, p0 + 0.55));
      const drop = P(tg, 8.7, 9.15, E.io);
      const y = tg < p0 + 0.65 ? lerp(-40, -96, rise) : lerp(-96, -22, drop);
      const o = clamp((tg - t0) / 0.15) * (1 - clamp((drop - 0.55) / 0.45));
      R.put('bd', { y, s: lerp(0.4, 1, born) * lerp(1, 0.7, drop), o: slice && tg < K.sc[2] && tg > K.end[1] ? 0 : o });
      R.a('bd.r', 'x', (-w / 2).toFixed(2)); R.a('bd.r', 'y', (-h / 2).toFixed(2)); R.a('bd.r', 'width', w.toFixed(2)); R.a('bd.r', 'height', h.toFixed(2)); R.a('bd.r', 'rx', (h / 2).toFixed(2));
      R.put('bd.c', { o: 1 - P(tg, p0 + 0.1, p0 + 0.3, E.lin) });
      R.a('bd.cp', 'stroke-dashoffset', (19 * (1 - P(tg, t0 + 0.1, t0 + 0.45, E.out))).toFixed(2));
      R.put('bd.tg', { o: P(tg, p0 + 0.35, p0 + 0.6, E.lin) });
    }

    return { markup, vb: [Lay.W, Lay.H], T: isSlice ? (SL === 3 ? K.end[4] - K.sc[3] : K.end[SL] - K.sc[SL]) + 0.3 : K.T, loopStart: isSlice ? 0 : K.L, loop: !isSlice, still: isSlice ? (SL === 3 ? K.end[4] - K.sc[3] : K.end[SL] - K.sc[SL]) - 0.2 : 12.9, mount };
  }

  /* ═════════════ INTRO lock-up ═════════════ */
  function makeIntro(cfg) {
    const c = PAL[cfg.theme] || PAL.light, id = 'sm' + ++UID;
    const markup = `${SHELL()} viewBox="0 0 320 200" role="img" aria-label="STAKED"><defs><clipPath id="${id}-w"><rect data-k="wmclip" x="-120" y="-34" width="0" height="50"/></clipPath></defs>` +
      `<g data-k="wm"><g clip-path="url(#${id}-w)">${T(3.5, 0, 'STAKED', { sz: 34, w: 800, f: c.ink, a: 'middle', ls: 7 })}</g></g>${logoMk('L')}</svg>`;
    const mount = (svg) => {
      const R = rig(svg);
      return (t) => {
        R.put('L', { x: 160, y: 76, s: 2.25 });
        logoIntro(R, 'L', t);
        R.put('wm', { x: 160, y: 146, o: clamp((t - 0.8) / 0.15) });
        R.a('wmclip', 'width', 240 * P(t, 0.8, 1.45, E.out4));
      };
    };
    return { markup, vb: [320, 200], T: 1.75, loopStart: 0, loop: false, still: 9, mount };
  }

  /* ═════════════ LOADER ═════════════ */
  function makeLoader() {
    const markup = `${SHELL()} viewBox="0 0 64 64" role="img" aria-label="STAKED"><g transform="translate(32 32) scale(1.5)">${logoMk('L')}</g></svg>`;
    const mount = (svg) => { const R = rig(svg); return (t) => { R.put('L', {}); logoLoader(R, 'L', t); }; };
    return { markup, vb: [64, 64], T: 1.8, loopStart: 0, loop: true, still: -1, mount, stillStatic: true };
  }

  /* ═════════════ SUCCESS (short confirmation) ═════════════ */
  function makeSuccess(cfg) {
    const c = PAL[cfg.theme] || PAL.light;
    const L = I18N[cfg.locale] || I18N.ru;
    const markup = `${SHELL()} viewBox="0 0 120 120" role="img" aria-label="${esc(L.ok)}">` +
      `<circle data-k="s.fill" cx="60" cy="60" r="38" fill="${c.accent}" fill-opacity="0"/>` +
      `<circle data-k="s.rip" cx="60" cy="60" r="38" fill="none" stroke="${c.accent}" stroke-width="1.5" opacity="0"/>` +
      `<circle data-k="s.ring" cx="60" cy="60" r="38" fill="none" stroke="${c.accent}" stroke-width="3.5" stroke-linecap="round" transform="rotate(-90 60 60)" stroke-dasharray="238.76" stroke-dashoffset="238.76"/>` +
      `<g transform="translate(60 60)">${CHECK('s.chk', c.accent, 4, 40, 'M-13 1.5l9.5 9.5L14 -9.5')}</g></svg>`;
    const mount = (svg) => {
      const R = rig(svg);
      return (t) => {
        R.a('s.ring', 'stroke-dashoffset', (238.76 * (1 - P(t, 0, 0.6, E.out4))).toFixed(2));
        R.a('s.fill', 'fill-opacity', (0.1 * P(t, 0.2, 0.7, E.out)).toFixed(3));
        R.a('s.chk', 'stroke-dashoffset', (40 * (1 - P(t, 0.5, 0.85, E.out))).toFixed(2));
        const rp = P(t, 0.55, 1.25, E.out4);
        R.a('s.rip', 'r', lerp(38, 54, rp).toFixed(2)); R.a('s.rip', 'opacity', (0.4 * (1 - rp) * (rp > 0 ? 1 : 0)).toFixed(3));
      };
    };
    return { markup, vb: [120, 120], T: 1.4, loopStart: 0, loop: false, still: 9, mount };
  }

  function create(cfg) {
    cfg = cfg || {};
    if (cfg.type === 'loader') return makeLoader(cfg);
    if (cfg.type === 'intro') return makeIntro(cfg);
    if (cfg.type === 'success') return makeSuccess(cfg);
    return makeStory(cfg);
  }

  /* ───────────── playback: one shared rAF loop for all active instances ───────────── */
  const ACTIVE = new Set();
  let raf = 0, last = 0;
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ACTIVE.forEach((i) => i._step(dt));
    raf = ACTIVE.size ? requestAnimationFrame(frame) : 0;
  };
  const kick = () => { if (!raf && ACTIVE.size) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const reducedMQ = G.matchMedia ? G.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false, addEventListener() {} };
  const docTheme = () => {
    const d = document.documentElement.getAttribute('data-theme');
    if (d === 'dark' || d === 'light') return d;
    return G.matchMedia && G.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const docLocale = () => { const l = (document.documentElement.lang || 'ru').slice(0, 2).toLowerCase(); return I18N[l] ? l : 'en'; };

  const CSS = ':host{display:block;width:100%;min-width:0;contain:layout paint style;line-height:0}' +
    ':host([size="small"]){max-width:300px}:host([size="medium"]){max-width:520px}:host([size="large"]){max-width:760px}' +
    ':host([type="loader"]){width:var(--staked-size,40px);height:var(--staked-size,40px)}' +
    ':host([type="success"]){width:var(--staked-size,96px)}' +
    ':host([hidden]){display:none}svg{display:block;width:100%;height:auto;overflow:visible;font-family:var(--font,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);font-variant-numeric:tabular-nums}';

  class StakedMotion extends HTMLElement {
    static get observedAttributes() { return ['type', 'locale', 'theme', 'speed', 'paused', 'loop']; }
    constructor() { super(); this._r = this.attachShadow({ mode: 'open' }); this._t = 0; this._first = true; this._inView = false; this._ended = false; }
    connectedCallback() {
      this._connected = true;
      this._build();
      if ('IntersectionObserver' in G) { this._io = new IntersectionObserver((en) => { this._inView = en[0].isIntersecting; this._sync(); }, { threshold: 0.12 }); this._io.observe(this); } else { this._inView = true; }
      if ('ResizeObserver' in G && (this.getAttribute('type') || 'full') === 'full') {
        this._ro = new ResizeObserver(() => { const l = this._layout(); if (l !== this._lay) { this._build(true); } });
        this._ro.observe(this);
      }
      this._mo = new MutationObserver(() => this._build(true));
      this._mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'lang'] });
      this._vis = () => this._sync(); document.addEventListener('visibilitychange', this._vis);
      this._rm = () => this._build(true); reducedMQ.addEventListener && reducedMQ.addEventListener('change', this._rm);
      this._sync();
    }
    disconnectedCallback() {
      this._connected = false; ACTIVE.delete(this);
      this._io && this._io.disconnect(); this._ro && this._ro.disconnect(); this._mo && this._mo.disconnect();
      document.removeEventListener('visibilitychange', this._vis); reducedMQ.removeEventListener && reducedMQ.removeEventListener('change', this._rm);
    }
    attributeChangedCallback(n) { if (!this._connected) return; if (n === 'paused' || n === 'speed') this._sync(); else this._build(true); }
    _layout() { return this.getBoundingClientRect().width && this.getBoundingClientRect().width < 520 ? 'narrow' : 'wide'; }
    _build(keep) {
      const type = this.getAttribute('type') || 'full';
      this._lay = this._layout();
      this._scene = create({ type, locale: this.getAttribute('locale') || docLocale(), theme: this.getAttribute('theme') || docTheme(), layout: this._lay });
      this._r.innerHTML = `<style>${CSS}</style>${this._scene.markup}`;
      this._draw = this._scene.mount(this._r.querySelector('svg'));
      if (!keep) { this._t = 0; this._first = true; this._ended = false; }
      else this._t = Math.min(this._t, this._scene.T);
      this._paint();
      this._sync();
    }
    _paint() {
      const s = this._scene;
      if (!reducedMQ.matches) { this._draw(this._t); return; }
      // reduced motion: one calm, fully composed frame, never a moving one
      this._draw(s.stillStatic ? 99 : s.still);
    }
    _playing() { return this._connected && this._inView && !this.hasAttribute('paused') && !reducedMQ.matches && document.visibilityState !== 'hidden' && !this._ended; }
    _sync() { if (this._playing()) { ACTIVE.add(this); kick(); } else ACTIVE.delete(this); }
    _step(dt) {
      const s = this._scene, sp = clamp(parseFloat(this.getAttribute('speed')) || 1, 0.5, 2.5);
      this._t += dt * sp;
      if (this._t >= s.T) {
        if (s.loop || this.hasAttribute('loop')) { this._t = s.loopStart + (this._t - s.T) % Math.max(0.01, s.T - s.loopStart); this._first = false; }
        else { this._t = s.T; this._ended = true; this._draw(this._t); ACTIVE.delete(this); this.dispatchEvent(new CustomEvent('staked-ended')); return; }
      }
      this._draw(this._t);
    }
    play() { this.removeAttribute('paused'); this._sync(); }
    pause() { this.setAttribute('paused', ''); this._sync(); }
    replay() { this._t = 0; this._ended = false; this._first = true; this._draw(0); this._sync(); }
    seek(t) { this._t = clamp(t, 0, this._scene.T); this._draw(this._t); }
  }

  /* ───────────── <staked-logo>: brand mark with intro + hover ───────────── */
  class StakedLogo extends HTMLElement {
    constructor() { super(); this._r = this.attachShadow({ mode: 'open' }); this._busy = false; }
    connectedCallback() {
      const size = this.getAttribute('size'); if (size) this.style.setProperty('--s', size + 'px');
      this._r.innerHTML = '<style>:host{display:inline-block;width:var(--s,28px);height:var(--s,28px);line-height:0;flex:none}svg{display:block;width:100%;height:100%;overflow:visible}</style>' +
        `${SHELL()} viewBox="0 0 32 32" aria-hidden="true"><g transform="translate(16 16)">${logoMk('L')}</g></svg>`;
      this._R = rig(this._r.querySelector('svg'));
      logoStatic(this._R, 'L');
      this._on = () => this._hover();
      this._host = this.closest('a,button') || this;
      this._host.addEventListener('pointerenter', this._on); this._host.addEventListener('focus', this._on);
      if (this.hasAttribute('intro') && !reducedMQ.matches) {
        const splash = document.getElementById('stakedSplash');
        const go = () => this._anim((u) => logoIntro(this._R, 'L', u), 1.15, 1.2);
        if (splash && document.body.contains(splash)) {
          this._R.put('L.t', { o: 0 }); ['a', 'b', 'd'].forEach((p) => this._R.put('L.' + p, { o: 0 }));
          const once = () => { document.removeEventListener('staked:splash-end', once); clearTimeout(tm); go(); };
          const tm = setTimeout(once, 5000);
          document.addEventListener('staked:splash-end', once);
        } else go();
      }
    }
    disconnectedCallback() { this._host && this._host.removeEventListener('pointerenter', this._on); this._host && this._host.removeEventListener('focus', this._on); this._stop = true; }
    _hover() { if (this._busy || reducedMQ.matches) return; this._anim((h) => logoHover(this._R, 'L', h), 0.78, 1); }
    _anim(fn, dur, speed) {
      this._busy = true; const R = this._R; const t0 = performance.now();
      const loop = (now) => {
        if (this._stop) return;
        const u = ((now - t0) / 1000) * speed;
        if (u >= dur) { logoStatic(R, 'L'); this._busy = false; return; }
        fn(u); requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }

  if (G.customElements) {
    if (!customElements.get('staked-motion')) customElements.define('staked-motion', StakedMotion);
    if (!customElements.get('staked-logo')) customElements.define('staked-logo', StakedLogo);
  }

  /* ───────────── brand splash (first visit per session) ───────────── */
  function initSplash() {
    const el = document.getElementById('stakedSplash');
    if (!el) return;
    const finish = () => { el.remove(); document.dispatchEvent(new CustomEvent('staked:splash-end')); };
    if (reducedMQ.matches || document.documentElement.classList.contains('staked-no-splash')) { finish(); return; }
    try { sessionStorage.setItem('staked.splash', '1'); } catch (e) { /* storage blocked: splash simply plays every visit */ }
    const m = document.createElement('staked-motion');
    m.setAttribute('type', 'intro'); m.setAttribute('aria-hidden', 'true');
    el.appendChild(m);
    let left = false;
    const leave = () => {
      if (left) return; left = true;
      el.style.transition = 'opacity .45s cubic-bezier(.22,.72,.18,1)'; el.style.opacity = '0';
      setTimeout(finish, 470);
    };
    m.addEventListener('staked-ended', () => setTimeout(leave, 320));
    ['pointerdown', 'keydown'].forEach((ev) => G.addEventListener(ev, leave, { once: true, passive: true }));
    setTimeout(leave, 4200);
  }

  G.StakedMotion = { create, easing: E, version: '1.0.0' };
  if (typeof document !== 'undefined' && document.getElementById) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSplash); else initSplash();
  }
})();
