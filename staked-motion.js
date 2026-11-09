/*
 * STACKED MOTION, brand motion system (dependency-free: no libraries, fonts, images, network).
 *
 *   <stacked-logo size="28"></stacked-logo>                       brand mark: intro + hover micro-motion
 *   <stacked-motion type="full"></stacked-motion>                 Choose, Order, Processing, Pickup story (loop)
 *   <stacked-motion type="intro"></stacked-motion>                logo lock-up reveal (once)
 *   <stacked-motion type="loader"></stacked-motion>               compact logo loader (loop)
 *   <stacked-motion type="choose|order|processing|pickup"></...>    single-scene phone clips (once; add `loop` to repeat)
 *   <stacked-motion type="success"></stacked-motion>              short confirmation (once)
 *
 * Attributes: locale (ru|en|az, default = <html lang>), theme (light|dark, default = <html data-theme>),
 *             speed (0.5 to 2.5), size (small|medium|large), loop, paused.
 * JS: el.play() el.pause() el.replay() el.seek(seconds)  ·  event "stacked-ended" (non-looping types).
 *
 * Architecture: one deterministic timeline per scene, draw(t) → SVG attributes. No CSS keyframes, so every
 * frame can be rendered, paused and tested exactly; the loop restarts from a state identical to its end.
 * The logo geometry is the original mark (rect 32/rx 9 + dome + two lines); the final state of every
 * animation is that exact geometry.
 */
(() => {
  'use strict';
  const G = typeof window !== 'undefined' ? window : globalThis;
  if (G.StackedMotion) return;
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
      aria: 'Как работает STACKED: выбор предложения, заказ, обработка и получение',
      rail: ['ВЫБОР', 'ЗАКАЗ', 'ОБРАБОТКА', 'ПОЛУЧЕНИЕ'],
      cap: [['Выбор', 'Выберите предложение', 'дешевле обычной цены.'], ['Заказ', 'Оформите заказ', 'по сниженной цене.'], ['Обработка', 'Администратор берёт', 'заказ в работу.'], ['Получение', 'Покажите подтверждение', 'в ресторане и заберите.']],
      choose: 'ВЫБЕРИТЕ ПРЕДЛОЖЕНИЕ', item: 'Бургер', itemSub: 'Предложение дня', add: 'В корзину',
      orderT: 'ВАШ ЗАКАЗ', total: 'Итого', save: 'Экономия 4.00 AZN', place: 'Оформить заказ', sent: 'Заказ отправлен',
      status: 'СТАТУС ЗАКАЗА', st1: 'Заказ отправлен', st2: 'Обрабатывается', st3: 'Подтверждение',
      pickT: 'ПОЛУЧЕНИЕ', ready: 'Подтверждение готово', show: 'Покажите в ресторане', ok: 'Готово'
    },
    en: {
      aria: 'How STACKED works: choose an offer, order, processing and pickup',
      rail: ['CHOOSE', 'ORDER', 'PROCESSING', 'PICKUP'],
      cap: [['Choose', 'Pick an offer cheaper', 'than the usual price.'], ['Order', 'Place your order', 'at the lower price.'], ['Processing', 'Our admin takes', 'your order in work.'], ['Pickup', 'Show the confirmation', 'at the restaurant.']],
      choose: 'CHOOSE AN OFFER', item: 'Burger', itemSub: 'Offer of the day', add: 'Add to cart',
      orderT: 'YOUR ORDER', total: 'Total', save: 'You save 4.00 AZN', place: 'Place order', sent: 'Order sent',
      status: 'ORDER STATUS', st1: 'Order sent', st2: 'Being processed', st3: 'Confirmation',
      pickT: 'PICKUP', ready: 'Confirmation ready', show: 'Show it at the restaurant', ok: 'Done'
    },
    az: {
      aria: 'STACKED necə işləyir: təklif seçimi, sifariş, emal və təhvil',
      rail: ['SEÇİM', 'SİFARİŞ', 'EMAL', 'TƏHVİL'],
      cap: [['Seçim', 'Adi qiymətdən ucuz', 'təklifi seçin.'], ['Sifariş', 'Sifarişi aşağı', 'qiymətlə verin.'], ['Emal', 'Administrator sifarişi', 'işə götürür.'], ['Təhvil', 'Restoranda təsdiqi', 'göstərin və götürün.']],
      choose: 'TƏKLİF SEÇİN', item: 'Burger', itemSub: 'Günün təklifi', add: 'Səbətə at',
      orderT: 'SİFARİŞİNİZ', total: 'Cəmi', save: 'Qənaət 4.00 AZN', place: 'Sifarişi ver', sent: 'Sifariş göndərildi',
      status: 'SİFARİŞ STATUSU', st1: 'Sifariş göndərildi', st2: 'Emal olunur', st3: 'Təsdiq',
      pickT: 'TƏHVİL', ready: 'Təsdiq hazırdır', show: 'Restoranda göstərin', ok: 'Hazırdır'
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
    if (s === '') return '';
    o = o || {};
    return `<text${o.k ? ` data-k="${o.k}"` : ''} x="${x}" y="${y}" font-size="${o.sz || 10}" font-weight="${o.w || 700}" fill="${o.f}"${o.a ? ` text-anchor="${o.a}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${esc(s)}</text>`;
  };
  const CHECK = (k, c, sw, len, d) => `<path data-k="${k}" d="${d}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${len}" stroke-dashoffset="${len}"/>`;
  const glyph = (fill) => // the mark's dome + lines as an illustration, centred at (0,0), 1 unit = 1 logo unit
    `<g fill="none" stroke="${fill}" stroke-width="2.2" stroke-linecap="round"><path d="M-9 -.5a9 7 0 0 1 18 0z" fill="${fill}"/><path d="M-9 3.5h18M-7 7.5h14"/></g>`;
  const SHELL = () => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`;

  /* ═════════════ STORY (full + single-scene phone clips) ═════════════
   * Choose → Order → Processing → Pickup. Prices are an illustration (7.00 retail → 3.00 on STACKED).
   * No QR code and no "success" is drawn: the last scene shows a confirmation ticket, not a scannable code. */
  const K = { L: 2.0, cut0: 2.0, cut1: 3.0, sc: [3.0, 5.4, 7.8, 10.2], end: [5.4, 7.8, 10.2, 13.0], exit0: 13.0, T: 14.0 };

  function makeStory(cfg) {
    const SL = { choose: 0, order: 1, processing: 2, pickup: 3 }[cfg.type];
    const isSlice = SL !== undefined;
    const narrow = !isSlice && cfg.layout === 'narrow';
    const c = PAL[cfg.theme] || PAL.light;
    const L = I18N[cfg.locale] || I18N.ru;
    const id = 'sm' + ++UID;
    const Lay = isSlice ? { W: 240, H: 420, px: 120, py: 210, ps: 1, lx: 120, ly: 210, wy: 0 }
      : narrow ? { W: 300, H: 478, px: 150, py: 212, ps: 1, lx: 150, ly: 186, wy: 256 }
        : { W: 720, H: 440, px: 360, py: 220, ps: 1, lx: 360, ly: 198, wy: 268 };
    const touch = (k) => `<g data-k="${k}"><circle r="11" fill="${c.ink}" fill-opacity=".12" stroke="${c.ink}" stroke-opacity=".4" stroke-width="1.2"/><circle r="3" fill="${c.ink}" fill-opacity=".5"/></g>`;
    const row = (i, label) => { const y = -92 + i * 42; return `<g data-k="tl.r${i}"><circle data-k="tl.d${i}" cx="-62" cy="${y}" r="10" fill="${c.paper}" stroke="${c.line}" stroke-width="1.5"/>${T(-36, y + 3.4, label, { sz: 10, w: 700, f: c.ink })}</g>`; };

    const screen =
      `<g data-k="scr">` +
      /* header */
      `<g data-k="hd">` + T(-58, -142.5, 'STACKED', { sz: 9.5, w: 800, f: c.ink, ls: 1.6 }) +
      `<rect x="44" y="-157" width="38" height="22" rx="11" fill="${c.paper}" stroke="${c.line}" stroke-width="1"/><path d="M52 -148.5h2.2l1.4 6.4h5.6l1.3-4.6h-8.4" fill="none" stroke="${c.ink}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<g data-k="hd.cn"><circle cx="75" cy="-153" r="5" fill="${c.accent}"/>${T(75, -150.2, '1', { sz: 6.5, w: 800, f: c.onAccent, a: 'middle' })}</g></g>` +
      /* S0 choose */
      `<g data-k="s0"><g data-k="b.lbl">${T(-80, -112, L.choose, { sz: 7.5, w: 800, f: c.muted, ls: 1.1 })}</g>` +
      `<g data-k="b.card"><rect x="-80" y="-98" width="160" height="148" rx="16" fill="${c.paper}" stroke="${c.line}" stroke-width="1"/>` +
      `<rect x="-72" y="-90" width="144" height="66" rx="11" fill="${c.tint}"/><g transform="translate(0 -57) scale(2.5)">${glyph(c.accent)}</g>` +
      `<rect x="38" y="-84" width="30" height="14" rx="7" fill="${c.accent}"/>` + T(53, -74, '-57%', { sz: 7.5, w: 800, f: c.onAccent, a: 'middle' }) +
      T(-72, -6, L.item, { sz: 11.5, w: 700, f: c.ink }) + T(-72, 7, L.itemSub, { sz: 8, w: 600, f: c.muted }) +
      T(-72, 38, '3.00 AZN', { sz: 15, w: 800, f: c.ink }) + T(72, 37, '7.00 AZN', { sz: 8.5, w: 600, f: c.muted, a: 'end' }) +
      `<rect x="40" y="34.2" width="32" height="1" fill="${c.muted}"/></g>` +
      `<g data-k="b.btn"><clipPath id="${id}-b"><rect x="-80" y="-16" width="160" height="32" rx="11"/></clipPath>` +
      `<rect x="-80" y="-16" width="160" height="32" rx="11" fill="${c.accent}"/><g clip-path="url(#${id}-b)"><circle data-k="b.rip" cx="0" cy="0" r="0" fill="${c.onAccent}" opacity="0"/></g>` +
      `<g data-k="b.lab">${T(0, 3.8, L.add, { sz: 10.5, w: 800, f: c.onAccent, a: 'middle' })}</g><g data-k="b.chk">${CHECK('b.chkp', c.onAccent, 2.4, 20, 'M-7 0l4.5 4.5L7 -5')}</g></g>` +
      touch('b.touch') + '</g>' +
      /* S1 order */
      `<g data-k="s1"><g data-k="o.lbl">${T(-80, -112, L.orderT, { sz: 7.5, w: 800, f: c.muted, ls: 1.1 })}</g>` +
      `<g data-k="o.card"><rect x="-80" y="-98" width="160" height="132" rx="16" fill="${c.paper}" stroke="${c.line}" stroke-width="1"/>` +
      `<rect x="-70" y="-88" width="40" height="40" rx="10" fill="${c.tint}"/><g transform="translate(-50 -68)">${glyph(c.accent)}</g>` +
      T(-22, -72, L.item, { sz: 10.5, w: 700, f: c.ink }) + T(-22, -59, '1 x 3.00 AZN', { sz: 8.5, w: 600, f: c.muted }) +
      `<line x1="-70" y1="-36" x2="70" y2="-36" stroke="${c.line}" stroke-width="1"/>` +
      T(-70, -16, L.total, { sz: 9.5, w: 600, f: c.muted }) + T(70, -16, '3.00 AZN', { sz: 15, w: 800, f: c.ink, a: 'end' }) +
      `<rect x="-70" y="-2" width="140" height="22" rx="8" fill="${c.accent}" fill-opacity=".1"/>` + T(0, 13, L.save, { sz: 8.5, w: 800, f: c.accent, a: 'middle' }) + '</g>' +
      `<g data-k="o.btn"><clipPath id="${id}-o"><rect x="-80" y="-16" width="160" height="32" rx="11"/></clipPath>` +
      `<rect x="-80" y="-16" width="160" height="32" rx="11" fill="${c.accent}"/><g clip-path="url(#${id}-o)"><circle data-k="o.rip" cx="0" cy="0" r="0" fill="${c.onAccent}" opacity="0"/></g>` +
      `<g data-k="o.lab">${T(0, 3.8, L.place, { sz: 10.5, w: 800, f: c.onAccent, a: 'middle' })}</g><g data-k="o.chk">${CHECK('o.chkp', c.onAccent, 2.4, 20, 'M-7 0l4.5 4.5L7 -5')}</g></g>` +
      `<g data-k="o.sent">${T(0, 98, L.sent, { sz: 9.5, w: 700, f: c.ink, a: 'middle' })}</g>` + touch('o.touch') + '</g>' +
      /* S2+S3 shared timeline */
      `<g data-k="tl"><g data-k="tl.lbl">${T(-80, -112, L.status, { sz: 7.5, w: 800, f: c.muted, ls: 1.1 })}</g>` +
      `<line x1="-62" y1="-92" x2="-62" y2="-8" stroke="${c.line}" stroke-width="1.5"/><line data-k="tl.l" x1="-62" y1="-92" x2="-62" y2="-92" stroke="${c.accent}" stroke-width="1.5"/>` +
      row(0, L.st1) + row(1, L.st2) + row(2, L.st3) +
      `<circle data-k="tl.arc" cx="-62" cy="-50" r="10" fill="none" stroke="${c.accent}" stroke-width="2" stroke-linecap="round" transform="rotate(-90 -62 -50)" stroke-dasharray="62.83" stroke-dashoffset="62.83"/>` +
      [0, 1, 2].map((i) => `<g data-k="tl.c${i}" transform="translate(-62 ${-92 + i * 42})"><circle r="10" fill="${c.accent}"/>${CHECK('tl.cp' + i, c.onAccent, 2, 12, 'M-4 .3l2.7 2.7L4.4 -2.6')}</g>`).join('') + '</g>' +
      /* S3 pickup ticket */
      `<g data-k="s3"><g data-k="k.t"><rect x="-80" y="-38" width="160" height="76" rx="14" fill="${c.accent}"/>` +
      `<rect x="-70" y="-26" width="40" height="40" rx="10" fill="#000" fill-opacity=".16"/><g transform="translate(-50 -6) scale(1.1)">${glyph(c.onAccent)}</g>` +
      T(-22, -8, L.item, { sz: 11, w: 800, f: c.onAccent }) + T(-22, 8, L.ready, { sz: 7.5, w: 700, f: c.onAccent }) +
      `<line x1="-80" y1="26" x2="80" y2="26" stroke="${c.onAccent}" stroke-opacity=".5" stroke-width="1.2" stroke-dasharray="3 4"/>` +
      `<circle cx="-80" cy="26" r="6" fill="${c.screen}"/><circle cx="80" cy="26" r="6" fill="${c.screen}"/>` +
      '</g>' +
      `<g data-k="k.f">${T(0, 122, L.show, { sz: 10, w: 700, f: c.ink, a: 'middle' })}</g></g>` +
      '</g>';

    const phone =
      `<g data-k="ph"><ellipse cx="0" cy="208" rx="96" ry="10" fill="url(#${id}-sh)"/>` +
      `<rect x="-100" y="-194" width="200" height="388" rx="36" fill="${c.body}" stroke="${c.edge}" stroke-width=".8"/>` +
      `<rect x="-102" y="-120" width="2.4" height="26" rx="1" fill="${c.edge}"/><rect x="-102" y="-84" width="2.4" height="44" rx="1" fill="${c.edge}"/><rect x="99.6" y="-100" width="2.4" height="58" rx="1" fill="${c.edge}"/>` +
      `<rect x="-92" y="-186" width="184" height="372" rx="28" fill="${c.screen}"/>` +
      `<g clip-path="url(#${id}-s)">${screen}</g>` +
      `<rect x="-27" y="-180" width="54" height="15" rx="7.5" fill="#000"/><rect x="-26" y="176" width="52" height="3" rx="1.5" fill="${c.ink}" fill-opacity=".28"/></g>`;

    /* stage chrome (full only) */
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
      `<g data-k="wm"><g clip-path="url(#${id}-w)">${T(3.5, 0, 'STACKED', { sz: 34, w: 800, f: c.ink, a: 'middle', ls: 7 })}</g></g>`;
    const defs =
      `<defs><clipPath id="${id}-s"><rect x="-92" y="-186" width="184" height="372" rx="28"/></clipPath>` +
      `<clipPath id="${id}-w"><rect data-k="wmclip" x="-130" y="-34" width="0" height="50"/></clipPath>` +
      `<radialGradient id="${id}-sh"><stop offset="0" stop-color="#2a1c10" stop-opacity=".22"/><stop offset="1" stop-color="#2a1c10" stop-opacity="0"/></radialGradient></defs>`;
    const markup = `${SHELL()} viewBox="0 0 ${Lay.W} ${Lay.H}" role="img" aria-label="${esc(L.aria)}">${defs}${chrome}${lockup}${phone}${logoMk('L')}</svg>`;

    const mount = (svg) => {
      const R = rig(svg);
      return (t) => {
        const tg = isSlice ? K.sc[SL] + t : t;
        const vis = (i) => !isSlice || i === SL;
        const pe = isSlice ? 1 : P(tg, 2.35, 3.1, E.out4) * (1 - P(tg, K.exit0, 13.7, E.io));
        const hd = isSlice ? 1 : P(tg, 2.75, 3.1, E.out) * (1 - P(tg, K.exit0, 13.25, E.io));
        const cc = isSlice ? 1 : P(tg, K.cut0, K.cut1, E.io) * (1 - P(tg, 13.2, 14.0, E.io));
        const pyOff = 18 * (1 - pe), ps = Lay.ps * (0.94 + 0.06 * pe);
        R.put('ph', { x: Lay.px, y: Lay.py + pyOff, s: ps, o: Math.min(1, pe * 1.6) });
        R.put('scr', { o: isSlice ? P(t, 0, 0.3, E.out) : 1 });
        R.put('hd', { o: hd });
        R.put('hd.cn', { s: 1 + 0.25 * Math.sin(Math.PI * P(tg, 4.45, 4.75, E.lin)), o: P(tg, 4.45, 4.55, E.lin) });
        const dx = Lay.px + ps * -72, dy = Lay.py + pyOff + ps * -146;
        R.put('L', { x: lerp(Lay.lx, dx, cc) - 16 * Math.sin(Math.PI * cc), y: lerp(Lay.ly, dy, cc), s: lerp(2.25, 0.5625 * ps, cc) });
        logoIntro(R, 'L', tg);
        if (!isSlice) {
          const wmA = 1 - clamp(cc * 5);
          R.put('wm', { x: Lay.lx, y: Lay.wy + 6 * clamp(cc * 5), o: wmA * clamp((tg - 0.8) / 0.15) });
          R.a('wmclip', 'width', 260 * P(tg, 0.8, 1.5, E.out4));
        }
        for (let i = 0; i < 4; i++) {
          const inn = P(tg, K.sc[i], K.sc[i] + 0.4, E.out);
          const al = vis(i) ? inn * (1 - (i < 3 ? P(tg, K.end[i], K.end[i] + 0.4, E.io) : 0)) : 0;
          if (i === 2) continue; // scene 2 has no own group: it is the shared timeline
          R.put('s' + i, { o: al });
          if (al < 0.003) continue;
          const r = tg - K.sc[i], e = (a0, d) => P(r, a0, a0 + (d || 0.5), E.out4);
          if (i === 0) drawChoose(R, r, e); else if (i === 1) drawOrder(R, r, e); else drawPickup(R, r, e);
        }
        const tlA = (!isSlice || SL >= 2) ? P(tg, K.sc[2], K.sc[2] + 0.4, E.out) : 0;
        R.put('tl', { o: tlA });
        if (tlA > 0.003) drawTimeline(R, tg, tlA);

        if (!isSlice) {
          const dn = [0, 1, 2, 3].map((i) => P(tg, i < 3 ? K.sc[i + 1] : 12.6, (i < 3 ? K.sc[i + 1] : 12.6) + 0.45, E.out));
          const cur = [0, 1, 2, 3].map((i) => P(tg, K.sc[i], K.sc[i] + 0.45, E.out) * (1 - dn[i]));
          R.put('rail', { o: pe });
          if (!narrow) {
            for (let i = 0; i < 4; i++) { R.put(`r${i}.on`, { o: cur[i] }); R.put(`r${i}.dn`, { o: dn[i] }); R.put(`r${i}.off`, { o: 1 - Math.max(cur[i], dn[i]) }); }
            R.a('rail.p', 'y2', 133 + 58 * clamp((dn[0] + dn[1] + dn[2]) / 3) * 3);
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

    function press(R, k, r, t0) { return P(r, t0, t0 + 0.12, E.io) * (1 - P(r, t0 + 0.12, t0 + 0.32, E.out)); }
    function drawChoose(R, r, e) {
      let k = e(0.12, 0.4); R.put('b.lbl', { y: 6 * (1 - k), o: k });
      k = e(0.18, 0.55); R.put('b.card', { y: 12 * (1 - k), o: k });
      const pr = press(R, 'b', r, 1.3);
      k = e(0.4, 0.5);
      R.put('b.btn', { y: 78 + 8 * (1 - k), s: 1 - 0.035 * pr, o: k });
      R.put('b.lab', { o: 1 - P(r, 1.42, 1.6, E.out) }); R.put('b.chk', { o: P(r, 1.45, 1.55, E.lin) });
      R.a('b.chkp', 'stroke-dashoffset', 20 * (1 - P(r, 1.5, 1.8, E.out)));
      const rp = P(r, 1.35, 1.95, E.out4);
      R.a('b.rip', 'r', lerp(4, 110, rp).toFixed(2)); R.a('b.rip', 'opacity', (0.38 * (1 - rp)).toFixed(3));
      const tp = P(r, 0.85, 1.3, E.io), tq = P(r, 1.65, 2.1, E.io);
      R.put('b.touch', { x: r < 1.5 ? lerp(66, 6, tp) : lerp(6, 52, tq), y: r < 1.5 ? lerp(150, 84, tp) : lerp(84, 132, tq), s: 1 - 0.22 * pr, o: P(r, 0.8, 0.95, E.lin) * (1 - P(r, 1.75, 2.0, E.lin)) });
    }
    function drawOrder(R, r, e) {
      let k = e(0.12, 0.4); R.put('o.lbl', { y: 6 * (1 - k), o: k });
      k = e(0.2, 0.55); R.put('o.card', { y: 12 * (1 - k), o: k });
      const pr = press(R, 'o', r, 1.4);
      k = e(0.5, 0.5);
      R.put('o.btn', { y: 66 + 8 * (1 - k), s: 1 - 0.035 * pr, o: k });
      R.put('o.lab', { o: 1 - P(r, 1.52, 1.7, E.out) }); R.put('o.chk', { o: P(r, 1.55, 1.65, E.lin) });
      R.a('o.chkp', 'stroke-dashoffset', 20 * (1 - P(r, 1.6, 1.9, E.out)));
      const rp = P(r, 1.45, 2.05, E.out4);
      R.a('o.rip', 'r', lerp(4, 110, rp).toFixed(2)); R.a('o.rip', 'opacity', (0.38 * (1 - rp)).toFixed(3));
      k = e(1.85, 0.45); R.put('o.sent', { y: 6 * (1 - k), o: k });
      const tp = P(r, 0.95, 1.4, E.io), tq = P(r, 1.75, 2.2, E.io);
      R.put('o.touch', { x: r < 1.6 ? lerp(66, 6, tp) : lerp(6, 52, tq), y: r < 1.6 ? lerp(150, 72, tp) : lerp(72, 120, tq), s: 1 - 0.22 * pr, o: P(r, 0.9, 1.05, E.lin) * (1 - P(r, 1.85, 2.1, E.lin)) });
    }
    function drawTimeline(R, tg, a) {
      const r2 = tg - K.sc[2], r3 = tg - K.sc[3];
      R.put('tl.lbl', { o: 1 });
      const s0 = P(r2, 0.15, 0.55, E.out4), s1 = P(r2, 0.7, 1.0, E.out4);
      const done1 = P(r3, 0.25, 0.6, E.out4), done2 = P(r3, 0.8, 1.1, E.out4);
      R.put('tl.r0', { y: 6 * (1 - s0), o: s0 }); R.put('tl.r1', { y: 6 * (1 - s1), o: s1 });
      const s2 = P(r2, 1.1, 1.5, E.out4); R.put('tl.r2', { y: 6 * (1 - s2), o: s2 * (0.45 + 0.55 * done2) });
      R.put('tl.c0', { x: -62, y: -92, s: lerp(0.4, 1, P(r2, 0.2, 0.55, E.back)), o: P(r2, 0.2, 0.3, E.lin) });
      R.a('tl.cp0', 'stroke-dashoffset', (12 * (1 - P(r2, 0.3, 0.6, E.out))).toFixed(2));
      const fill1 = 42 * P(r2, 0.55, 1.0, E.io) + 42 * P(r3, 0.7, 1.1, E.io);
      R.a('tl.l', 'y2', (-92 + clamp(fill1, 0, 84)).toFixed(2));
      R.a('tl.arc', 'stroke-dashoffset', (62.83 * (1 - P(r2, 1.0, 2.3, E.io))).toFixed(2));
      R.a('tl.arc', 'opacity', (P(r2, 0.95, 1.1, E.lin) * (1 - done1)).toFixed(3));
      R.put('tl.c1', { x: -62, y: -50, s: lerp(0.4, 1, P(r3, 0.3, 0.65, E.back)), o: P(r3, 0.3, 0.4, E.lin) });
      R.a('tl.cp1', 'stroke-dashoffset', (12 * (1 - P(r3, 0.4, 0.7, E.out))).toFixed(2));
      R.put('tl.c2', { x: -62, y: -8, s: lerp(0.4, 1, P(r3, 0.85, 1.2, E.back)), o: P(r3, 0.85, 0.95, E.lin) });
      R.a('tl.cp2', 'stroke-dashoffset', (12 * (1 - P(r3, 0.95, 1.25, E.out))).toFixed(2));
    }
    function drawPickup(R, r, e) {
      const k = P(r, 1.25, 1.95, E.out4);
      R.put('k.t', { y: 66 + 40 * (1 - k), s: 0.96 + 0.04 * k, o: k });
      const f = e(1.95, 0.5); R.put('k.f', { y: 6 * (1 - f), o: f });
    }

    return { markup, vb: [Lay.W, Lay.H], T: isSlice ? K.end[SL] - K.sc[SL] + 0.3 : K.T, loopStart: isSlice ? 0 : K.L, loop: !isSlice, still: isSlice ? K.end[SL] - K.sc[SL] - 0.1 : 12.0, mount };
  }

  /* ═════════════ INTRO lock-up ═════════════ */
  function makeIntro(cfg) {
    const c = PAL[cfg.theme] || PAL.light, id = 'sm' + ++UID;
    const markup = `${SHELL()} viewBox="0 0 320 200" role="img" aria-label="STACKED"><defs><clipPath id="${id}-w"><rect data-k="wmclip" x="-120" y="-34" width="0" height="50"/></clipPath></defs>` +
      `<g data-k="wm"><g clip-path="url(#${id}-w)">${T(3.5, 0, 'STACKED', { sz: 34, w: 800, f: c.ink, a: 'middle', ls: 7 })}</g></g>${logoMk('L')}</svg>`;
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
    const markup = `${SHELL()} viewBox="0 0 64 64" role="img" aria-label="STACKED"><g transform="translate(32 32) scale(1.5)">${logoMk('L')}</g></svg>`;
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
    ':host([type="loader"]){width:var(--stacked-size,40px);height:var(--stacked-size,40px)}' +
    ':host([type="success"]){width:var(--stacked-size,96px)}' +
    ':host([hidden]){display:none}svg{display:block;width:100%;height:auto;overflow:visible;font-family:var(--font,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);font-variant-numeric:tabular-nums}';

  class StackedMotion extends HTMLElement {
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
        else { this._t = s.T; this._ended = true; this._draw(this._t); ACTIVE.delete(this); this.dispatchEvent(new CustomEvent('stacked-ended')); return; }
      }
      this._draw(this._t);
    }
    play() { this.removeAttribute('paused'); this._sync(); }
    pause() { this.setAttribute('paused', ''); this._sync(); }
    replay() { this._t = 0; this._ended = false; this._first = true; this._draw(0); this._sync(); }
    seek(t) { this._t = clamp(t, 0, this._scene.T); this._draw(this._t); }
  }

  /* ───────────── <stacked-logo>: brand mark with intro + hover ───────────── */
  class StackedLogo extends HTMLElement {
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
        const splash = document.getElementById('stackedSplash');
        const go = () => this._anim((u) => logoIntro(this._R, 'L', u), 1.15, 1.2);
        if (splash && document.body.contains(splash)) {
          this._R.put('L.t', { o: 0 }); ['a', 'b', 'd'].forEach((p) => this._R.put('L.' + p, { o: 0 }));
          const once = () => { document.removeEventListener('stacked:splash-end', once); clearTimeout(tm); go(); };
          const tm = setTimeout(once, 5000);
          document.addEventListener('stacked:splash-end', once);
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
    if (!customElements.get('stacked-motion')) customElements.define('stacked-motion', StackedMotion);
    if (!customElements.get('stacked-logo')) customElements.define('stacked-logo', StackedLogo);
  }

  /* ───────────── brand splash (first visit per session) ───────────── */
  function initSplash() {
    const el = document.getElementById('stackedSplash');
    if (!el) return;
    const finish = () => { el.remove(); document.dispatchEvent(new CustomEvent('stacked:splash-end')); };
    if (reducedMQ.matches || document.documentElement.classList.contains('stacked-no-splash')) { finish(); return; }
    try { sessionStorage.setItem('stacked.splash', '1'); } catch (e) { /* storage blocked: splash simply plays every visit */ }
    const m = document.createElement('stacked-motion');
    m.setAttribute('type', 'intro'); m.setAttribute('aria-hidden', 'true');
    el.appendChild(m);
    let left = false;
    const leave = () => {
      if (left) return; left = true;
      el.style.transition = 'opacity .45s cubic-bezier(.22,.72,.18,1)'; el.style.opacity = '0';
      setTimeout(finish, 470);
    };
    m.addEventListener('stacked-ended', () => setTimeout(leave, 320));
    ['pointerdown', 'keydown'].forEach((ev) => G.addEventListener(ev, leave, { once: true, passive: true }));
    setTimeout(leave, 4200);
  }

  G.StackedMotion = { create, easing: E, version: '1.0.0' };
  if (typeof document !== 'undefined' && document.getElementById) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSplash); else initSplash();
  }
})();
