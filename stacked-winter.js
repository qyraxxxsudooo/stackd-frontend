/* STAKED — New Year theme.
   A fixed winter scene behind the page (night street with a warm lamp in the dark theme, a bright snowy day in
   the light theme) and one canvas of snow. Flakes settle on the tops of product cards and on the tab bar; scrolling,
   brushing a card with the pointer or shaking the phone knocks the snow off, and it falls down onto the bar.
   Tilting the phone (gyroscope) blows the snow sideways. Nothing is created until the theme is switched on. */
(() => {
  'use strict';
  const KEY = 'stacked.winter';
  const root = document.documentElement;
  const toggle = document.getElementById('winterToggle');
  const isDark = () => root.classList.contains('stacked-dark') || root.dataset.theme === 'dark';
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  let on = false, styleEl = null, bg = null, cv = null, ctx = null, raf = 0;

  /* ───────── styles (injected once) ───────── */
  const CSS = `
html.st-winter{background:#070b17}
html.st-winter:not(.stacked-dark):not([data-theme=dark]){background:#e9f5ff}
html.st-winter body{background:transparent!important}
.stw-bg{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;contain:strict}
.stw-scene{position:absolute;inset:0;width:100%;height:100%;display:block}
.stw-lamp{position:absolute;left:var(--stw-lx,40px);bottom:var(--stw-lb,80px);height:var(--stw-lh,60vh);aspect-ratio:300/560}
.stw-lamp svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.stw-cone{position:absolute;left:-40%;right:-40%;top:19%;bottom:-1%;clip-path:polygon(43% 0,57% 0,100% 100%,0 100%);background:linear-gradient(180deg,rgba(255,212,128,.34),rgba(255,198,108,.12) 58%,rgba(255,198,108,0));-webkit-mask-image:linear-gradient(90deg,transparent,#000 32%,#000 68%,transparent);mask-image:linear-gradient(90deg,transparent,#000 32%,#000 68%,transparent);will-change:opacity;animation:stwFlicker 7s steps(1) infinite}
.stw-pool{position:absolute;left:-55%;right:-55%;bottom:-6%;height:12%;border-radius:50%;background:radial-gradient(closest-side,rgba(255,206,120,.34),rgba(255,206,120,.1) 60%,transparent)}
@keyframes stwFlicker{0%,100%{opacity:1}31%{opacity:.94}33%{opacity:1}61%{opacity:.97}64%{opacity:1}}
.stw-snow{position:fixed;inset:0;z-index:25;pointer-events:none;width:100vw;height:100vh}
@media (prefers-reduced-motion:reduce){.stw-cone{animation:none}}
`;

  /* ───────── scene ───────── */
  function darkScene() {
    const r = rng(7); let stars = '', far = '', near = '', win = '';
    for (let i = 0; i < 70; i++) stars += `<circle cx="${(r() * 1600).toFixed(0)}" cy="${(r() * 430).toFixed(0)}" r="${(0.6 + r() * 1.1).toFixed(2)}" opacity="${(0.25 + r() * 0.6).toFixed(2)}"/>`;
    const row = (y0, y1, wmin, wmax, fill, windows) => {
      let x = -20, d = '';
      while (x < 1620) {
        const w = wmin + r() * (wmax - wmin), top = y0 + r() * (y1 - y0);
        d += `M${x.toFixed(0)} 800V${top.toFixed(0)}h${w.toFixed(0)}V800Z`;
        if (r() < .45) d += `M${(x + w * .3).toFixed(0)} ${top.toFixed(0)}v-${(10 + r() * 16).toFixed(0)}h${(w * .12).toFixed(0)}v${(10 + r() * 16).toFixed(0)}Z`;
        if (windows) for (let wy = top + 18; wy < 760; wy += 30) for (let wx = x + 10; wx < x + w - 16; wx += 22) if (r() < .2) win += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="9" height="13" rx="1.5"/>`;
        x += w + r() * 6;
      }
      return `<path d="${d}" fill="${fill}"/>`;
    };
    far = row(470, 610, 60, 130, '#121b36', false);
    near = row(560, 690, 90, 180, '#0a1124', true);
    const bulbs = ['#ff6b6b', '#ffd36b', '#6be4ff', '#8dff9a'];
    let lights = '';
    for (let i = 0; i <= 16; i++) {
      const t = i / 16, x = 520 + t * 560, y = 560 + Math.sin(t * Math.PI) * 52;
      lights += `<circle cx="${x.toFixed(1)}" cy="${(y + 7).toFixed(1)}" r="5" fill="${bulbs[i % 4]}"/>`;
    }
    return `<svg class="stw-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<defs>
<linearGradient id="stwSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040812"/><stop offset=".55" stop-color="#0c1430"/><stop offset="1" stop-color="#1c2650"/></linearGradient>
<radialGradient id="stwMoonGlow"><stop offset="0" stop-color="#fff6dc" stop-opacity=".5"/><stop offset=".35" stop-color="#b9c8ff" stop-opacity=".14"/><stop offset="1" stop-color="#b9c8ff" stop-opacity="0"/></radialGradient>
<linearGradient id="stwGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9c5e2"/><stop offset=".4" stop-color="#8794b8"/><stop offset="1" stop-color="#4c5778"/></linearGradient>
<filter id="stwGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
</defs>
<rect width="1600" height="900" fill="url(#stwSky)"/>
<g fill="#fff">${stars}</g>
<circle cx="960" cy="150" r="150" fill="url(#stwMoonGlow)"/><circle cx="960" cy="150" r="36" fill="#f3efe2"/><circle cx="948" cy="140" r="7" fill="#e0dccd"/><circle cx="972" cy="162" r="5" fill="#e0dccd"/>
${far}${near}
<g fill="#ffcf72" opacity=".72">${win}</g>
<path d="M520 567 Q800 671 1080 567" fill="none" stroke="#05080f" stroke-width="2"/>
<g filter="url(#stwGlow)" opacity=".9">${lights}</g><g>${lights}</g>
<path d="M-20 760 C200 744 380 772 620 756 S1060 742 1280 758 S1560 752 1620 748 V900 H-20Z" fill="url(#stwGround)"/>
<path d="M-20 760 C200 744 380 772 620 756 S1060 742 1280 758 S1560 752 1620 748" fill="none" stroke="#e6ecfa" stroke-width="3" opacity=".7"/>
</svg>`;
  }

  function lightScene() {
    const r = rng(11); let trees = '';
    const tree = (x, y, s) => `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})"><rect x="-4" y="-6" width="8" height="18" fill="#6d4c3d"/><path d="M0-96 L30-46 H16 L40-12 H-40 L-16-46 H-30Z" fill="#2c6a55"/><path d="M0-96 L14-72 Q0-66-14-72Z M-18-46 Q0-38 18-46 L10-58 Q0-52-10-58Z M-28-12 Q0-2 28-12 L18-26 Q0-18-18-26Z" fill="#fff"/></g>`;
    for (let i = 0; i < 26; i++) { const x = r() * 1600, y = 690 + r() * 40; trees += tree(x, y, .45 + r() * .5); }
    for (let i = 0; i < 9; i++) { const x = r() * 1600; trees += tree(x, 790 + r() * 30, .9 + r() * .5); }
    return `<svg class="stw-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<defs>
<linearGradient id="stwSkyL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc4f4"/><stop offset=".55" stop-color="#c9e8ff"/><stop offset="1" stop-color="#f1f9ff"/></linearGradient>
<radialGradient id="stwSun"><stop offset="0" stop-color="#fffdf2"/><stop offset=".18" stop-color="#fff6d6" stop-opacity=".9"/><stop offset=".5" stop-color="#fff2c8" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<linearGradient id="stwHill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e3eefa"/></linearGradient>
</defs>
<rect width="1600" height="900" fill="url(#stwSkyL)"/>
<circle cx="1060" cy="150" r="230" fill="url(#stwSun)"/>
<path d="M-20 640 L160 500 L280 580 L430 450 L600 600 L760 480 L930 610 L1080 470 L1250 590 L1400 500 L1620 620 V900 H-20Z" fill="#bcd6ec"/>
<path d="M160 500 L205 535 L180 530 L160 548 L140 528 L118 533Z M430 450 L478 490 L452 486 L430 505 L408 484 L384 488Z M760 480 L806 516 L780 512 L760 530 L740 510 L716 515Z M1080 470 L1128 508 L1102 504 L1080 522 L1058 502 L1034 506Z M1400 500 L1444 534 L1420 530 L1400 548 L1380 528 L1358 532Z" fill="#fff"/>
<path d="M-20 700 C220 660 420 700 640 676 S1100 650 1320 684 S1560 670 1620 664 V900 H-20Z" fill="#dfeaf6"/>
${trees}
<path d="M-20 770 C240 744 460 782 720 762 S1180 742 1400 766 S1580 760 1620 756 V900 H-20Z" fill="url(#stwHill)"/>
<path d="M-20 836 C300 820 640 846 980 830 S1460 824 1620 832" fill="none" stroke="#d6e4f3" stroke-width="10" opacity=".7"/>
</svg>`;
  }

  const LAMP = `<div class="stw-lamp"><div class="stw-pool"></div><div class="stw-cone"></div>
<svg viewBox="0 0 300 560" aria-hidden="true"><defs>
<radialGradient id="stwHalo"><stop offset="0" stop-color="#ffd98a" stop-opacity=".75"/><stop offset=".4" stop-color="#ffc35e" stop-opacity=".22"/><stop offset="1" stop-color="#ffc35e" stop-opacity="0"/></radialGradient>
<linearGradient id="stwGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d2"/><stop offset="1" stop-color="#ffbe55"/></linearGradient></defs>
<circle cx="150" cy="76" r="104" fill="url(#stwHalo)"/>
<path d="M118 532 h64 l8 28 h-80Z" fill="#141a28"/><rect x="128" y="500" width="44" height="34" rx="5" fill="#161d2e"/>
<rect x="143" y="122" width="14" height="382" fill="#161d2e"/><rect x="138" y="300" width="24" height="8" rx="3" fill="#1d2539"/><rect x="138" y="470" width="24" height="8" rx="3" fill="#1d2539"/>
<path d="M118 42 L182 42 L173 108 L127 108Z" fill="url(#stwGlass)"/>
<path d="M118 42 L182 42 L173 108 L127 108Z M150 42 V108" fill="none" stroke="#161d2e" stroke-width="5" stroke-linejoin="round"/>
<path d="M106 44 L150 14 L194 44Z" fill="#161d2e"/><circle cx="150" cy="10" r="6" fill="#161d2e"/>
<path d="M112 41 Q130 26 150 18 Q170 26 188 41 Q172 36 150 38 Q128 36 112 41Z" fill="#eef3ff"/>
<rect x="124" y="106" width="52" height="16" rx="4" fill="#161d2e"/>
<path d="M126 500 Q150 490 174 500 L172 506 H128Z" fill="#e6ecfa"/>
</svg></div>`;

  function buildScene() {
    if (!bg) { bg = document.createElement('div'); bg.className = 'stw-bg'; bg.setAttribute('aria-hidden', 'true'); document.body.prepend(bg); }
    bg.innerHTML = isDark() ? darkScene() + LAMP : lightScene();
    layout();
  }

  /* lamp placement follows the scene's ground line; recomputed on resize */
  const view = { w: innerWidth, h: innerHeight, scale: 1, lamp: null };
  function layout() {
    view.w = innerWidth; view.h = innerHeight;
    view.scale = Math.max(view.w / 1600, view.h / 900);
    const lampEl = bg?.querySelector('.stw-lamp');
    if (!lampEl) { view.lamp = null; return; }
    const lh = Math.min(view.h * (view.w < 700 ? .46 : .6), 600);
    const lw = lh * 300 / 560;
    const lb = (900 - 784) * view.scale;
    const lx = view.w < 700 ? -lw * .18 : Math.max(18, (view.w - 1280) / 2 - lw * .55);
    lampEl.style.setProperty('--stw-lh', lh + 'px'); lampEl.style.setProperty('--stw-lb', lb + 'px'); lampEl.style.setProperty('--stw-lx', lx + 'px');
    view.lamp = { hx: lx + lw * .5, hy: view.h - lb - lh * (1 - .2), gy: view.h - lb, hw: lw * .95 };
  }

  /* ───────── snow ───────── */
  const flakes = [], surf = new Map();
  let W = 0, H = 0, DPR = 1, last = 0, wind = 0, tilt = 0, fall = 1, shake = 0, lastY = scrollY, vScroll = 0;
  const ptr = { x: -999, y: -999, vx: 0, t: 0 };
  const COL = 4;

  function resize() {
    if (!cv) return;
    DPR = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 1.75);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const want = Math.round(clamp(W * H / 6500, 70, 280) * (coarse ? .6 : 1));
    let base = 0; for (const f of flakes) if (!f.loose) base++;
    for (let i = base; i < want; i++) flakes.push(spawn({}, true));
    for (let i = flakes.length - 1, extra = base - want; i >= 0 && extra > 0; i--) if (!flakes[i].loose) { flakes.splice(i, 1); extra--; }
    layout(); measure();
  }
  function spawn(f, anywhere) {
    const r = Math.random(), size = r < .55 ? .9 + Math.random() * .8 : r < .9 ? 1.7 + Math.random() * 1 : 2.7 + Math.random() * 1.3;
    f.r = size; f.x = Math.random() * (W + 80) - 40; f.y = anywhere ? Math.random() * H : -6 - Math.random() * 60;
    f.vy = 20 + size * 16; f.ph = Math.random() * 6.28; f.sp = .6 + Math.random() * 1.1; f.loose = false; f.vx = 0;
    return f;
  }
  function loose(x, y, vx, vy) {
    if (flakes.length > 700) return;
    flakes.push({ r: 1 + Math.random() * 1.6, x, y, vx, vy, ph: Math.random() * 6.28, sp: 1, loose: true });
  }

  /* surfaces: card tops (move with the page) and the tab bar top (fixed) */
  function makeSurf(el, fixed, cap, rad) { return { el, fixed, cap, rad, top: 0, l: 0, w: 0, cols: new Float32Array(0), vis: false }; }
  function measure() {
    const sy = scrollY;
    const els = [...document.querySelectorAll('#grid .card')];
    const bar = document.querySelector('.st-tabbar');
    if (bar) els.push(bar);
    const seen = new Set();
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      let s = surf.get(el);
      const isBar = el === bar;
      if (!s) { s = makeSurf(el, isBar, isBar ? 11 : 12, isBar ? 24 : 18); s.fresh = true; surf.set(el, s); }
      const n = Math.max(2, Math.ceil(r.width / COL));
      if (s.cols.length !== n) { const c = new Float32Array(n); c.set(s.cols.subarray(0, Math.min(n, s.cols.length))); s.cols = c; }
      s.l = r.left; s.w = r.width; s.top = isBar ? r.top : r.top + sy;
      if (s.fresh && !isBar) { s.fresh = false; for (let i = 0; i < n; i++) s.cols[i] = capAt(s, i) * (.5 + Math.sin(i * .31 + r.left) * .12 + Math.sin(i * .9) * .05 + Math.random() * .06); }
      seen.add(el);
    });
    for (const el of surf.keys()) if (!seen.has(el)) surf.delete(el);
  }
  const capAt = (s, i) => { const x = i * COL + COL / 2, e = Math.min(x, s.w - x); return e >= s.rad ? s.cap : s.cap * Math.max(0, e / s.rad) ** 1.6; };
  function knock(s, from, to, amount, vy) {
    const a = Math.max(0, from), b = Math.min(s.cols.length - 1, to);
    const top = s.fixed ? s.top : s.top - scrollY;
    for (let i = a; i <= b; i++) {
      const take = s.cols[i] * amount; if (take < .25) continue;
      s.cols[i] -= take;
      for (let k = 0; k < take / 1.4; k++) loose(s.l + i * COL + Math.random() * COL, top - s.cols[i] - 1, (Math.random() - .5) * 70 + ptr.vx * .15, vy + Math.random() * 40);
    }
  }

  function step(now) {
    raf = 0;
    if (!on) return;
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    const sy = scrollY; vScroll = vScroll * .8 + ((sy - lastY) / Math.max(dt, .001)) * .2; lastY = sy;
    const gust = Math.sin(now / 3100) * 10 + Math.sin(now / 1300) * 4;
    wind += (tilt * 110 + gust - wind) * Math.min(1, dt * 1.6);
    const dark = isDark(), L = view.lamp;

    ctx.clearRect(0, 0, W, H);
    const list = [...surf.values()];
    list.forEach((s) => { const top = s.fixed ? s.top : s.top - sy; s.vis = top > -30 && top < H + 20; s.vtop = top; });

    // the faster the page scrolls, the more snow is shaken off the cards; it falls onto the bar
    const sp = Math.abs(vScroll);
    if (sp > 450 || shake > 0) {
      const k = clamp((sp - 450) / 4000, 0, .35) + shake;
      list.forEach((s) => { if (s.vis && !s.fixed) knock(s, 0, s.cols.length - 1, k * dt * 6, 30 + Math.min(sp, 1500) * .05); });
      if (shake) list.forEach((s) => { if (s.fixed) knock(s, 0, s.cols.length - 1, shake * dt * 4, -60); });
      shake = Math.max(0, shake - dt * 1.5);
    }

    // move flakes; settle the ones that land on a surface
    for (let i = flakes.length - 1; i >= 0; i--) {
      const f = flakes[i], py = f.y;
      f.ph += dt * f.sp;
      const term = (20 + f.r * 16) * fall;
      if (f.loose) { f.vy += 420 * dt; f.vy = Math.min(f.vy, 240); f.vx *= 1 - dt * 1.2; }
      else { f.vy += (term - f.vy) * dt * 2; f.vx = wind * (.35 + f.r * .18) + Math.sin(f.ph) * 9 * f.r * .5; }
      const dx = f.x - ptr.x, dy = f.y - ptr.y, d2 = dx * dx + dy * dy;
      if (d2 < 7000 && now - ptr.t < 600) { const d = Math.sqrt(d2) || 1, p = (1 - d / 84) * 260 * dt; f.x += dx / d * p; f.y += dy / d * p * .5; }
      f.x += f.vx * dt; f.y += f.vy * dt;
      let gone = f.y > H + 8 || f.x < -60 || f.x > W + 60;
      if (!gone) for (const s of list) {
        if (!s.vis || f.x < s.l || f.x >= s.l + s.w) continue;
        const c = ((f.x - s.l) / COL) | 0, surface = s.vtop - s.cols[c];
        if (py <= surface && f.y >= surface) {
          if (f.loose || Math.random() < (s.fixed ? .9 : .75)) {
            const cap = capAt(s, c);
            if (s.cols[c] < cap) s.cols[c] = Math.min(cap, s.cols[c] + f.r * (f.loose ? .6 : 1.1));
            gone = true;
          }
          break;
        }
      }
      if (gone) { if (f.loose) flakes.splice(i, 1); else spawn(f, false); }
    }

    // piles: relax neighbours, melt slowly, draw
    ctx.lineJoin = 'round';
    for (const s of list) {
      const c = s.cols, n = c.length;
      for (let i = 0; i < n - 1; i++) { const d = c[i] - c[i + 1]; if (d > 1.1 || d < -1.1) { const m = d * .22; c[i] -= m; c[i + 1] += m; } }
      const melt = s.fixed ? .035 : .0035;
      for (let i = 0; i < n; i++) { c[i] = Math.min(c[i] * (1 - melt * dt * 10), capAt(s, i)); }
      if (!s.vis) continue;
      const top = s.vtop + (s.fixed ? 1 : 3);
      ctx.beginPath(); ctx.moveTo(s.l, top);
      for (let i = 0; i < n; i++) ctx.lineTo(s.l + i * COL + COL / 2, top - c[i]);
      ctx.lineTo(s.l + s.w, top); ctx.closePath();
      ctx.fillStyle = dark ? '#e9eefc' : '#ffffff'; ctx.shadowColor = dark ? 'rgba(0,0,0,.35)' : 'rgba(80,110,160,.28)'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 1.5; ctx.fill(); ctx.shadowOffsetY = 0; ctx.shadowColor = 'transparent';
      ctx.strokeStyle = dark ? 'rgba(255,255,255,.55)' : 'rgba(120,150,195,.5)'; ctx.lineWidth = 1; ctx.stroke();
    }

    // flakes, two passes: normal and (dark theme) warm ones inside the lamp's light
    const warm = [];
    ctx.beginPath();
    for (const f of flakes) {
      if (f.y < -4) continue;
      if (dark && L && f.y > L.hy && f.y < L.gy && Math.abs(f.x - L.hx) < (f.y - L.hy) / (L.gy - L.hy) * L.hw + 8) { warm.push(f); continue; }
      ctx.moveTo(f.x + f.r, f.y); ctx.arc(f.x, f.y, f.r, 0, 6.2832);
    }
    ctx.fillStyle = dark ? 'rgba(255,255,255,.88)' : 'rgba(255,255,255,.96)'; ctx.fill();
    if (!dark) { ctx.strokeStyle = 'rgba(95,128,175,.32)'; ctx.lineWidth = .8; ctx.stroke(); }
    if (warm.length) { ctx.beginPath(); for (const f of warm) { ctx.moveTo(f.x + f.r, f.y); ctx.arc(f.x, f.y, f.r * 1.08, 0, 6.2832); } ctx.fillStyle = '#ffe3a3'; ctx.fill(); }

    raf = requestAnimationFrame(step);
  }

  /* ───────── input: pointer, scroll, gyroscope, shake ───────── */
  function onPointer(e) {
    ptr.vx = e.clientX - ptr.x; ptr.x = e.clientX; ptr.y = e.clientY; ptr.t = performance.now();
    if (Math.abs(ptr.vx) < 2) return;
    for (const s of surf.values()) {
      if (!s.vis || e.clientX < s.l || e.clientX > s.l + s.w) continue;
      if (e.clientY > s.vtop - 26 && e.clientY < s.vtop + 14) { const c = ((e.clientX - s.l) / COL) | 0; knock(s, c - 4, c + 4, .85, s.fixed ? -80 : 10); }
    }
  }
  function onOrient(e) { if (e.gamma == null) return; tilt = clamp(e.gamma / 40, -1, 1); fall = clamp(1 + ((e.beta || 45) - 45) / 160, .7, 1.3); }
  function onMotion(e) { const a = e.acceleration; if (!a) return; const m = Math.hypot(a.x || 0, a.y || 0, a.z || 0); if (m > 13) shake = Math.min(.9, shake + .35); }
  async function askSensors() {
    try { if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') await DeviceOrientationEvent.requestPermission(); } catch { /* user said no */ }
    try { if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') await DeviceMotionEvent.requestPermission(); } catch { /* user said no */ }
  }

  let mo = null, mt = 0, iv = 0;
  const remeasure = () => { clearTimeout(mt); mt = setTimeout(measure, 120); };
  const kick = () => { if (on && !raf && !document.hidden) { last = 0; raf = requestAnimationFrame(step); } };

  function enable() {
    if (on) return; on = true;
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'stw-style'; styleEl.textContent = CSS; document.head.append(styleEl); }
    root.classList.add('st-winter');
    buildScene();
    if (reduced()) return;
    cv = document.createElement('canvas'); cv.className = 'stw-snow'; cv.setAttribute('aria-hidden', 'true'); ctx = cv.getContext('2d');
    document.body.append(cv);
    flakes.length = 0; resize();
    addEventListener('resize', resize, { passive: true });
    addEventListener('pointermove', onPointer, { passive: true });
    addEventListener('deviceorientation', onOrient, { passive: true });
    addEventListener('devicemotion', onMotion, { passive: true });
    document.addEventListener('visibilitychange', kick);
    const grid = document.getElementById('grid');
    mo = new MutationObserver(remeasure); if (grid) mo.observe(grid, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    iv = setInterval(measure, 2000);
    kick();
  }
  function disable() {
    if (!on) return; on = false;
    root.classList.remove('st-winter');
    cancelAnimationFrame(raf); raf = 0;
    cv?.remove(); cv = null; ctx = null; bg?.remove(); bg = null; surf.clear(); flakes.length = 0;
    removeEventListener('resize', resize); removeEventListener('pointermove', onPointer);
    removeEventListener('deviceorientation', onOrient); removeEventListener('devicemotion', onMotion);
    document.removeEventListener('visibilitychange', kick);
    mo?.disconnect(); clearInterval(iv);
  }

  // the scene follows light/dark theme changes
  new MutationObserver(() => { if (on && bg) { const d = isDark(); if (bg.dataset.dark !== String(d)) { bg.dataset.dark = String(d); buildScene(); } } })
    .observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] });

  let saved = false; try { saved = localStorage.getItem(KEY) === '1'; } catch { /* storage blocked */ }
  if (toggle) {
    toggle.checked = saved;
    toggle.addEventListener('change', () => {
      try { localStorage.setItem(KEY, toggle.checked ? '1' : '0'); } catch { /* storage blocked */ }
      if (toggle.checked) { askSensors(); enable(); } else disable();
    });
  }
  if (saved) enable();
  window.stWinter = { enable, disable, get on() { return on; } };
})();
