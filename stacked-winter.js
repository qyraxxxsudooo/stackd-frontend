/* STAKED — New Year theme and site music.
   • The admin turns the theme on or off for the whole site (Каталог → Настройки → «Зима и музыка», site_settings.winter_mode).
     When it is on, each visitor can still switch it off for themselves in Settings.
   • Dark theme: a night street with a lit lamp, a decorated tree and snowy roofs. Light theme: a winter morning at sunrise.
   • One canvas of snow. Flakes settle on product cards and on the tab bar; scrolling, brushing a card or shaking the phone
     knocks the snow off and it falls onto the bar; tilting the phone blows it sideways.
   • The admin can upload a track (or paste a link); visitors get a small play button in the header.
   Nothing heavy is created until the theme is actually on. */
(() => {
  'use strict';
  const LOCAL = 'stacked.winter', MUSIC_LOCAL = 'stacked.music';
  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const isDark = () => root.classList.contains('stacked-dark') || root.dataset.theme === 'dark';
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const lang = () => { try { return (typeof S !== 'undefined' && S.lang) || localStorage.getItem('pdd.lang') || 'ru'; } catch { return 'ru'; } };
  const TXT = {
    ru: { admin: 'Зима и музыка', winter: 'Новогодняя тема на сайте', winterHelp: 'Снег, огни и зимняя улица у всех посетителей. Каждый может отключить её у себя в настройках.', music: 'Музыка на сайте', file: 'Загрузить трек (MP3, M4A, OGG, до 20 МБ)', url: 'Или ссылка на трек (https://…)', title: 'Название трека', volume: 'Громкость', autoplay: 'Включать при первом касании страницы', save: 'Сохранить', remove: 'Убрать музыку', saved: 'Сохранено', uploading: 'Загрузка трека…', err: 'Не удалось сохранить', badUrl: 'Ссылка должна начинаться с https://', play: 'Включить музыку', pause: 'Выключить музыку', pick: 'Выбрать', nofile: 'Файл не выбран' },
    en: { admin: 'Winter and music', winter: 'New Year theme on the site', winterHelp: 'Snow, lights and a winter street for every visitor. Anyone can switch it off in their settings.', music: 'Site music', file: 'Upload a track (MP3, M4A, OGG, up to 20 MB)', url: 'Or a link to a track (https://…)', title: 'Track title', volume: 'Volume', autoplay: 'Start on the first tap on the page', save: 'Save', remove: 'Remove music', saved: 'Saved', uploading: 'Uploading track…', err: 'Could not save', badUrl: 'The link must start with https://', play: 'Play music', pause: 'Pause music', pick: 'Choose', nofile: 'No file selected' },
    az: { admin: 'Qış və musiqi', winter: 'Saytda Yeni il mövzusu', winterHelp: 'Bütün ziyarətçilər üçün qar, işıqlar və qış küçəsi. Hər kəs öz parametrlərində söndürə bilər.', music: 'Saytda musiqi', file: 'Trek yüklə (MP3, M4A, OGG, 20 MB-a qədər)', url: 'Və ya trek linki (https://…)', title: 'Trekin adı', volume: 'Səs', autoplay: 'Səhifəyə ilk toxunuşda başlasın', save: 'Yadda saxla', remove: 'Musiqini sil', saved: 'Yadda saxlanıldı', uploading: 'Trek yüklənir…', err: 'Yadda saxlamaq olmadı', badUrl: 'Link https:// ilə başlamalıdır', play: 'Musiqini aç', pause: 'Musiqini dayandır', pick: 'Seç', nofile: 'Fayl seçilməyib' }
  };
  const t = (k) => (TXT[lang()] || TXT.ru)[k] || TXT.ru[k];
  const toastMsg = (m) => { try { if (typeof toast === 'function') toast(m); } catch { /* no toast */ } };

  const site = { winter: 'off', musicUrl: '', musicTitle: '', musicVolume: 40, musicAutoplay: false };

  /* ═════════════ styles (injected once) ═════════════ */
  const CSS = `
html.st-winter{background:#070b17}
html.st-winter:not(.stacked-dark):not([data-theme=dark]){background:#f6dccb}
html.st-winter body{background:transparent!important}
.stw-bg{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;contain:strict}
.stw-scene{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 100%;display:block;user-select:none}
.stw-lamp{position:absolute;left:var(--stw-lx,40px);bottom:var(--stw-lb,80px);height:var(--stw-lh,60vh);aspect-ratio:300/560}
.stw-lamp img{position:absolute;inset:0;width:100%;height:100%}
.stw-halo{position:absolute;left:50%;top:13.6%;width:120%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(closest-side,rgba(255,214,140,.55),rgba(255,196,100,.16) 45%,transparent 72%)}
.stw-cone{position:absolute;left:50%;top:21.6%;width:230%;bottom:0;transform:translateX(-50%);background:radial-gradient(ellipse 50% 100% at 50% 0,rgba(255,212,130,.38),rgba(255,200,110,.16) 45%,rgba(255,200,110,.04) 70%,transparent 82%);will-change:opacity;animation:stwFlicker 7s steps(1) infinite}
.stw-pool{position:absolute;left:50%;bottom:-5%;width:260%;height:13%;transform:translateX(-50%);border-radius:50%;background:radial-gradient(closest-side,rgba(255,206,120,.38),rgba(255,206,120,.12) 55%,transparent)}
@keyframes stwFlicker{0%,100%{opacity:1}31%{opacity:.93}33%{opacity:1}61%{opacity:.97}64%{opacity:1}}
.stw-snow{position:fixed;left:0;top:0;z-index:25;pointer-events:none}
@media (pointer:coarse){html.st-winter .st-tabbar{-webkit-backdrop-filter:blur(16px) saturate(160%)!important;backdrop-filter:blur(16px) saturate(160%)!important}}
@media (prefers-reduced-motion:reduce){.stw-cone{animation:none}}
`;
  const UI_CSS = `
.st-music{position:relative;display:none!important;place-items:center;flex:none}
.st-music.has-track{display:grid!important}
.st-music .st-eq{display:flex;align-items:flex-end;gap:2px;height:16px}
.st-music .st-eq i{display:block;width:3px;height:100%;border-radius:2px;background:currentColor;transform-origin:50% 100%;transform:scaleY(.3);transition:transform .3s}
.st-music .st-eq i:nth-child(1){transform:scaleY(.45)}.st-music .st-eq i:nth-child(2){transform:scaleY(.85)}.st-music .st-eq i:nth-child(3){transform:scaleY(.6)}.st-music .st-eq i:nth-child(4){transform:scaleY(.35)}
.st-music.is-playing{color:var(--accent)}
.st-music.is-playing .st-eq i{animation:stEq 1s ease-in-out infinite}
.st-music.is-playing .st-eq i:nth-child(2){animation-delay:-.4s;animation-duration:.8s}
.st-music.is-playing .st-eq i:nth-child(3){animation-delay:-.7s;animation-duration:1.15s}
.st-music.is-playing .st-eq i:nth-child(4){animation-delay:-.2s;animation-duration:.9s}
@keyframes stEq{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
.st-music.hint::after{content:"";position:absolute;inset:-3px;border-radius:inherit;border:2px solid var(--accent);animation:stHint 1.8s ease-out infinite;pointer-events:none}
@keyframes stHint{from{opacity:.8;transform:scale(.9)}to{opacity:0;transform:scale(1.35)}}
.stw-admin .st-switch{margin:6px 0 4px}
.stw-admin audio{width:100%;margin-top:8px}
.stw-admin .stw-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
.stw-admin input[type=range]{width:100%;accent-color:var(--accent)}
.stw-admin .stw-now{margin-top:8px;font-size:.84rem;color:var(--muted);word-break:break-all}
@media (prefers-reduced-motion:reduce){.st-music .st-eq i,.st-music.hint::after{animation:none!important}}
`;
  const addStyle = (id, css) => { if (document.getElementById(id)) return; const s = document.createElement('style'); s.id = id; s.textContent = css; document.head.append(s); };

  /* ═════════════ scenes (SVG strings, rasterized once as images) ═════════════ */
  const snowCaps = (bld, color) => bld.map(([x, top, w]) => `<rect x="${(x - 2).toFixed(0)}" y="${(top - 4).toFixed(0)}" width="${(w + 4).toFixed(0)}" height="7" rx="3.5" fill="${color}"/>`).join('');
  function town(r, y0, y1, wmin, wmax, from, to) {
    const out = []; let x = from;
    while (x < to) { const w = wmin + r() * (wmax - wmin), top = y0 + r() * (y1 - y0); out.push([x, top, w]); x += w + 4 + r() * 10; }
    return out;
  }
  const pine = (x, y, s, body, snow) => `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})"><rect x="-4" y="-8" width="8" height="16" fill="#3a2a22"/><path d="M0-104 L28-60 H14 L36-30 H18 L44 0 H-44 L-18-30 H-36 L-14-60 H-28Z" fill="${body}"/><path d="M0-104 L12-85 Q0-79-12-85Z M-15-60 Q0-53 15-60 L9-70 Q0-65-9-70Z M-22-30 Q0-22 22-30 L14-42 Q0-36-14-42Z M-30 0 Q0 8 30 0 L22-12 Q0-5-22-12Z" fill="${snow}"/></g>`;
  const fence = (x0, x1, y, col) => { let d = ''; for (let x = x0; x <= x1; x += 26) d += `M${x} ${y}v-34l4-5 4 5v34Z`; return `<path d="${d}" fill="${col}"/><path d="M${x0} ${y - 24}H${x1 + 8}M${x0} ${y - 10}H${x1 + 8}" stroke="${col}" stroke-width="4"/>`; };

  function darkScene() {
    const r = rng(7); let stars = '', win = '';
    for (let i = 0; i < 90; i++) stars += `<circle cx="${(r() * 1600).toFixed(0)}" cy="${(r() * 440).toFixed(0)}" r="${(0.5 + r() * 1.2).toFixed(2)}" opacity="${(0.25 + r() * 0.65).toFixed(2)}"/>`;
    const far = town(r, 470, 600, 60, 130, -20, 1620), near = town(r, 560, 680, 90, 170, -20, 1620);
    const blocks = (b, fill) => `<path d="${b.map(([x, top, w]) => `M${x.toFixed(0)} 800V${top.toFixed(0)}h${w.toFixed(0)}V800Z`).join('')}" fill="${fill}"/>`;
    near.forEach(([x, top, w]) => { for (let wy = top + 20; wy < 740; wy += 30) for (let wx = x + 10; wx < x + w - 16; wx += 22) if (r() < .22) win += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="9" height="13" rx="1.5"/>`; });
    const chimneys = near.filter(() => r() < .3).map(([x, top, w]) => `<rect x="${(x + w * .7).toFixed(0)}" y="${(top - 22).toFixed(0)}" width="12" height="22" fill="#0a1124"/><path d="M${(x + w * .7 + 6).toFixed(0)} ${(top - 26).toFixed(0)} c-14 -18 14 -30 0 -50 c-12 -16 10 -26 4 -40" fill="none" stroke="#9aa6c8" stroke-width="7" stroke-linecap="round" opacity=".16"/>`).join('');
    const bulbs = ['#ff6b6b', '#ffd36b', '#6be4ff', '#8dff9a'];
    let lights = '';
    for (let i = 0; i <= 18; i++) { const k = i / 18, x = 360 + k * 880, y = 540 + Math.sin(k * Math.PI) * 60; lights += `<circle cx="${x.toFixed(1)}" cy="${(y + 7).toFixed(1)}" r="5" fill="${bulbs[i % 4]}"/>`; }
    let treeLights = '';
    for (let i = 0; i < 26; i++) { const k = i / 26, y = 600 + k * 160, half = 18 + k * 82, x = 1462 + Math.sin(i * 2.4) * half * .8; treeLights += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2" fill="${bulbs[i % 4]}"/>`; }
    let fg = ''; [[40, 812, 1.25], [1590, 818, 1.4], [1335, 800, .9], [210, 800, .75]].forEach(([x, y, s]) => { fg += pine(x, y, s, '#081322', '#d7dff0'); });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040812"/><stop offset=".55" stop-color="#0c1430"/><stop offset="1" stop-color="#1d2852"/></linearGradient>
<radialGradient id="moon"><stop offset="0" stop-color="#fff6dc" stop-opacity=".5"/><stop offset=".35" stop-color="#b9c8ff" stop-opacity=".14"/><stop offset="1" stop-color="#b9c8ff" stop-opacity="0"/></radialGradient>
<radialGradient id="warm"><stop offset="0" stop-color="#ffd28a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd28a" stop-opacity="0"/></radialGradient>
<linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcc8e4"/><stop offset=".45" stop-color="#8894b8"/><stop offset="1" stop-color="#4b5677"/></linearGradient>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
</defs>
<rect width="1600" height="900" fill="url(#sky)"/>
<g fill="#fff">${stars}</g>
<circle cx="960" cy="150" r="160" fill="url(#moon)"/><circle cx="960" cy="150" r="36" fill="#f3efe2"/><circle cx="948" cy="140" r="7" fill="#e0dccd"/><circle cx="972" cy="162" r="5" fill="#e0dccd"/>
${blocks(far, '#131c38')}${snowCaps(far, '#4a5677')}
${chimneys}
${blocks(near, '#0a1124')}${snowCaps(near, '#c9d3ea')}
<g fill="#ffcf72" opacity=".75">${win}</g>
<path d="M360 547 Q800 667 1240 547" fill="none" stroke="#05080f" stroke-width="2"/>
<g filter="url(#glow)" opacity=".9">${lights}</g><g>${lights}</g>
<circle cx="1300" cy="682" r="46" fill="url(#warm)"/><rect x="1298" y="690" width="4" height="84" fill="#0b1222"/><path d="M1291 674h18l-3 16h-12Z" fill="#ffd48a"/><path d="M1288 674l12-8 12 8Z" fill="#0b1222"/>
<path d="M-20 762 C200 746 380 774 620 758 S1060 744 1280 760 S1560 754 1620 750 V900 H-20Z" fill="url(#ground)"/>
<path d="M-20 762 C200 746 380 774 620 758 S1060 744 1280 760 S1560 754 1620 750" fill="none" stroke="#e8eefb" stroke-width="3" opacity=".7"/>
${fence(250, 560, 778, '#0c1424')}${fence(1040, 1250, 776, '#0c1424')}
<ellipse cx="1462" cy="776" rx="120" ry="16" fill="#e6ecfa" opacity=".5"/>
<g><rect x="1454" y="748" width="16" height="28" fill="#3a2a22"/><path d="M1462 560 L1500 625 H1482 L1522 690 H1500 L1548 760 H1376 L1424 690 H1402 L1442 625 H1424Z" fill="#0f3a2e"/><path d="M1462 560 L1478 588 Q1462 595 1446 588Z M1430 625 Q1462 636 1494 625 L1484 610 Q1462 618 1440 610Z M1410 690 Q1462 704 1514 690 L1500 674 Q1462 684 1424 674Z M1384 760 Q1462 772 1540 760 L1526 744 Q1462 754 1398 744Z" fill="#dfe7f6"/></g>
<g filter="url(#glow)">${treeLights}</g><g>${treeLights}</g>
<path d="M1462 532 l7 15 16 2 -12 11 3 16 -14 -8 -14 8 3 -16 -12 -11 16 -2Z" fill="#ffd36b"/><circle cx="1462" cy="552" r="26" fill="url(#warm)"/>
${fg}
</svg>`;
  }

  function morningScene() {
    const r = rng(11); let trees = '';
    for (let i = 0; i < 22; i++) { const x = r() * 1600; trees += pine(x, 694 + r() * 30, .4 + r() * .4, '#4f7d74', '#fff'); }
    const house = (x, y, s, wall, roof) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-46" y="-56" width="92" height="56" fill="${wall}"/><rect x="18" y="-92" width="14" height="30" fill="#7a5a4e"/><path d="M25 -96 c-16 -20 14 -32 0 -54 c-12 -18 12 -28 4 -44" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".55"/><path d="M-58 -52 L0 -98 L58 -52Z" fill="${roof}"/><path d="M-62 -50 L0 -102 L62 -50 L54 -46 L0 -90 L-54 -46Z" fill="#ffffff"/><rect x="-30" y="-40" width="18" height="18" rx="2" fill="#ffd27a"/><rect x="10" y="-40" width="18" height="18" rx="2" fill="#ffd27a"/><rect x="-10" y="-26" width="18" height="26" rx="2" fill="#7a4f3e"/><rect x="-50" y="-4" width="100" height="8" rx="4" fill="#fff"/></g>`;
    const houses = house(1380, 776, 1.05, '#c7745d', '#8d3f35') + house(1530, 786, .9, '#e2b26d', '#9b5a3a') + house(120, 780, 1, '#a9c0d6', '#566f8c') + house(1250, 768, .7, '#d99a74', '#7e4337');
    let fg = ''; [[40, 818, 1.3], [1595, 822, 1.4], [265, 806, .8], [1195, 800, .8]].forEach(([x, y, s]) => { fg += pine(x, y, s, '#2f6556', '#ffffff'); });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fa8dc"/><stop offset=".42" stop-color="#c3c9e6"/><stop offset=".68" stop-color="#f7cdb8"/><stop offset="1" stop-color="#ffe6c7"/></linearGradient>
<radialGradient id="sun"><stop offset="0" stop-color="#fffaf0"/><stop offset=".12" stop-color="#ffe7b0"/><stop offset=".35" stop-color="#ffc98a" stop-opacity=".45"/><stop offset="1" stop-color="#ffb37a" stop-opacity="0"/></radialGradient>
<linearGradient id="mtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfbad3"/><stop offset="1" stop-color="#b4bcdc"/></linearGradient>
<linearGradient id="snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff7f1"/><stop offset="1" stop-color="#eae9f6"/></linearGradient>
<linearGradient id="snow2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e3e8f6"/></linearGradient>
</defs>
<rect width="1600" height="900" fill="url(#sky)"/>
<path d="M120 170 q60 -24 120 0 q40 -20 80 4 q-100 20 -200 -4Z M1180 120 q70 -28 140 0 q50 -18 90 6 q-120 22 -230 -6Z M520 230 q50 -18 100 0 q30 -14 60 4 q-80 14 -160 -4Z" fill="#fff" opacity=".55"/>
<circle cx="1040" cy="640" r="320" fill="url(#sun)"/><circle cx="1040" cy="640" r="44" fill="#fff6e2"/>
<path d="M-20 650 L150 520 L270 590 L420 470 L590 610 L760 500 L930 620 L1090 480 L1260 600 L1410 520 L1620 630 V900 H-20Z" fill="url(#mtn)"/>
<path d="M150 520 L196 556 L172 552 L150 570 L130 550 L106 556Z M420 470 L468 510 L442 506 L420 526 L398 504 L374 508Z M760 500 L806 536 L780 532 L760 550 L740 530 L716 536Z M1090 480 L1138 518 L1112 514 L1090 532 L1068 512 L1044 516Z M1410 520 L1454 554 L1430 550 L1410 568 L1390 548 L1368 552Z" fill="#fff4ee"/>
<path d="M-20 708 C220 668 420 708 640 684 S1100 660 1320 692 S1560 678 1620 672 V900 H-20Z" fill="url(#snow)"/>
${trees}
${houses}
<path d="M-20 774 C240 748 460 786 720 766 S1180 746 1400 770 S1580 764 1620 760 V900 H-20Z" fill="url(#snow2)"/>
<path d="M-20 774 C240 748 460 786 720 766 S1180 746 1400 770" fill="none" stroke="#ffe4cf" stroke-width="3" opacity=".8"/>
<path d="M620 800 L1040 760 L1460 800Z" fill="#ffd9b8" opacity=".35"/>
${fence(300, 620, 790, '#8a6a5a')}
<path d="M-20 842 C300 826 640 852 980 836 S1460 830 1620 838" fill="none" stroke="#dfe3f3" stroke-width="12" opacity=".7"/>
${fg}
</svg>`;
  }

  const lampSvg = (lit) => { const m = lit ? '#161d2e' : '#45414c', m2 = lit ? '#1d2539' : '#524d5a'; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 560"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lit ? '#fff6d2' : '#e8eef6'}"/><stop offset="1" stop-color="${lit ? '#ffbe55' : '#b9c6d6'}"/></linearGradient></defs>
<path d="M118 532 h64 l8 28 h-80Z" fill="${m}"/><rect x="128" y="500" width="44" height="34" rx="5" fill="${m}"/>
<rect x="143" y="122" width="14" height="382" fill="${m}"/><rect x="138" y="300" width="24" height="8" rx="3" fill="${m2}"/><rect x="138" y="470" width="24" height="8" rx="3" fill="${m2}"/>
<path d="M118 42 L182 42 L173 108 L127 108Z" fill="url(#g)"/>
<path d="M118 42 L182 42 L173 108 L127 108Z M150 42 V108" fill="none" stroke="${m}" stroke-width="5" stroke-linejoin="round"/>
<path d="M106 44 L150 14 L194 44Z" fill="${m}"/><circle cx="150" cy="10" r="6" fill="${m}"/>
<path d="M110 42 Q130 24 150 16 Q170 24 190 42 Q172 36 150 38 Q128 36 110 42Z" fill="#f4f7ff"/>
<rect x="124" y="106" width="52" height="16" rx="4" fill="${m}"/>
<path d="M124 500 Q150 488 176 500 L174 507 H126Z" fill="#f2f5fd"/></svg>`; };

  const svgUrl = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const cache = {};
  let bg = null;
  function buildScene() {
    const dark = isDark();
    if (!bg) { bg = document.createElement('div'); bg.className = 'stw-bg'; bg.setAttribute('aria-hidden', 'true'); document.body.prepend(bg); }
    bg.dataset.dark = String(dark);
    const key = dark ? 'd' : 'l';
    cache[key] ||= svgUrl(dark ? darkScene() : morningScene());
    cache['lamp' + key] ||= svgUrl(lampSvg(dark));
    bg.innerHTML = `<img class="stw-scene" alt="" decoding="async" src="${cache[key]}"><div class="stw-lamp">${dark ? '<div class="stw-pool"></div><div class="stw-cone"></div><div class="stw-halo"></div>' : ''}<img alt="" decoding="async" src="${cache['lamp' + key]}"></div>`;
    layout();
  }

  /* the lamp stands on the scene's ground line (the image is anchored to the bottom and scaled to cover) */
  const view = { lamp: null, maxH: 0 };
  function layout() {
    const w = innerWidth, h = innerHeight, scale = Math.max(w / 1600, h / 900);
    const lampEl = bg && bg.querySelector('.stw-lamp'); if (!lampEl) return;
    const small = w < 700;
    const lh = Math.min(h * (small ? .34 : .58), 580), lw = lh * 300 / 560;
    const lb = (900 - 786) * scale;
    const lx = small ? 6 : Math.max(18, (w - 1280) / 2 - lw * .6);
    lampEl.style.setProperty('--stw-lh', lh + 'px'); lampEl.style.setProperty('--stw-lb', lb + 'px'); lampEl.style.setProperty('--stw-lx', lx + 'px');
    view.lamp = isDark() ? { hx: lx + lw / 2, hy: h - lb - lh * .784, gy: h - lb, hw: lw * 1.05 } : null;
  }

  /* ═════════════ snow ═════════════ */
  let on = false, cv = null, ctx = null, raf = 0;
  const flakes = [], surf = new Map();
  let W = 0, H = 0, DPR = 1, last = 0, wind = 0, tilt = 0, fall = 1, shake = 0, lastY = scrollY, vScroll = 0, want = 0, slow = 0, frames = 0, lowQ = false;
  const ptr = { x: -999, y: -999, vx: 0, t: 0 };
  const COL = 4, LOOSE_MAX = coarse ? 110 : 360;
  let looseCount = 0;

  function resize(force) {
    if (!cv) return;
    const w = innerWidth, h = innerHeight;
    view.maxH = Math.max(view.maxH, h);
    // phone browsers resize the viewport while their toolbars slide: reallocate only when the width changes or it grows a lot
    const needH = coarse ? view.maxH + 40 : h;
    if (force === true || w !== W || needH > H + 60 || (!coarse && needH !== H)) {
      DPR = Math.min(devicePixelRatio || 1, coarse ? 1.25 : 1.6);
      W = w; H = needH;
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      want = Math.round(clamp(W * h / 6500, 60, 260) * (coarse ? .55 : 1));
      fitFlakes();
    }
    layout(); measure();
  }
  function fitFlakes() {
    let base = 0; for (const f of flakes) if (!f.loose) base++;
    for (let i = base; i < want; i++) flakes.push(spawn({}, true));
    for (let i = flakes.length - 1, extra = base - want; i >= 0 && extra > 0; i--) if (!flakes[i].loose) { flakes.splice(i, 1); extra--; }
  }
  function spawn(f, anywhere) {
    const r = Math.random(), size = r < .55 ? .9 + Math.random() * .8 : r < .9 ? 1.7 + Math.random() * 1 : 2.7 + Math.random() * 1.2;
    f.r = size; f.x = Math.random() * (W + 80) - 40; f.y = anywhere ? Math.random() * innerHeight : -6 - Math.random() * 60;
    f.vy = 20 + size * 16; f.ph = Math.random() * 6.28; f.sp = .6 + Math.random() * 1.1; f.loose = false; f.vx = 0;
    return f;
  }
  function loose(x, y, vx, vy) { if (looseCount >= LOOSE_MAX) return; looseCount++; flakes.push({ r: 1 + Math.random() * 1.5, x, y, vx, vy, ph: 0, sp: 1, loose: true }); }

  const capAt = (s, i) => { const x = i * COL + COL / 2, e = Math.min(x, s.w - x); return e >= s.rad ? s.cap : s.cap * Math.max(0, e / s.rad) ** 1.6; };
  function measure() {
    const sy = scrollY, bar = $('.st-tabbar');
    const els = [...document.querySelectorAll('#grid .card')]; if (bar) els.push(bar);
    const seen = new Set();
    for (const el of els) {
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
      const isBar = el === bar;
      let s = surf.get(el);
      if (!s) { s = { el, fixed: isBar, cap: isBar ? 11 : 12, rad: isBar ? 24 : 18, top: 0, l: 0, w: 0, cols: new Float32Array(0), vis: false, vtop: 0, fresh: !isBar }; surf.set(el, s); }
      const n = Math.max(2, Math.ceil(r.width / COL));
      if (s.cols.length !== n) { const c = new Float32Array(n); c.set(s.cols.subarray(0, Math.min(n, s.cols.length))); s.cols = c; }
      s.l = r.left; s.w = r.width; s.top = isBar ? r.top : r.top + sy;
      if (s.fresh) { s.fresh = false; for (let i = 0; i < n; i++) s.cols[i] = capAt(s, i) * (.5 + Math.sin(i * .31 + r.left) * .12 + Math.sin(i * .9) * .05 + Math.random() * .06); }
      seen.add(el);
    }
    for (const el of surf.keys()) if (!seen.has(el)) surf.delete(el);
  }
  function knock(s, from, to, amount, vy) {
    const a = Math.max(0, from), b = Math.min(s.cols.length - 1, to);
    for (let i = a; i <= b; i++) {
      const take = s.cols[i] * amount; if (take < .25) continue;
      s.cols[i] -= take;
      for (let k = 0; k < take / 1.8; k++) loose(s.l + i * COL + Math.random() * COL, s.vtop - s.cols[i] - 1, (Math.random() - .5) * 70 + ptr.vx * .15, vy + Math.random() * 40);
    }
  }

  function step(now) {
    raf = 0; if (!on || !ctx) return;
    const dtRaw = (now - (last || now)) / 1000, dt = Math.min(.05, dtRaw); last = now;
    // adaptive quality: if frames keep running long, use fewer flakes and simpler drawing
    if (dtRaw > .026 && dtRaw < .2) slow++;
    if (++frames >= 45) { if (slow > 22 && want > 30) { want = Math.round(want * .72); fitFlakes(); lowQ = true; } slow = 0; frames = 0; }
    const sy = scrollY; vScroll = vScroll * .8 + ((sy - lastY) / Math.max(dt, .001)) * .2; lastY = sy;
    const gust = Math.sin(now / 3100) * 10 + Math.sin(now / 1300) * 4;
    wind += (tilt * 110 + gust - wind) * Math.min(1, dt * 1.6);
    const dark = isDark(), L = view.lamp, vh = innerHeight;

    ctx.clearRect(0, 0, W, H);
    const list = [...surf.values()];
    for (const s of list) { s.vtop = s.fixed ? s.top : s.top - sy; s.vis = s.vtop > -30 && s.vtop < vh + 20; }

    const sp = Math.abs(vScroll);
    if (sp > 450 || shake > 0) {
      const k = clamp((sp - 450) / 4000, 0, .35) + shake;
      for (const s of list) if (s.vis && !s.fixed) knock(s, 0, s.cols.length - 1, k * dt * 6, 30 + Math.min(sp, 1500) * .05);
      if (shake) for (const s of list) if (s.fixed) knock(s, 0, s.cols.length - 1, shake * dt * 4, -60);
      shake = Math.max(0, shake - dt * 1.5);
    }

    for (let i = flakes.length - 1; i >= 0; i--) {
      const f = flakes[i], py = f.y;
      if (f.loose) { f.vy = Math.min(240, f.vy + 420 * dt); f.vx *= 1 - dt * 1.2; }
      else { f.ph += dt * f.sp; f.vy += ((20 + f.r * 16) * fall - f.vy) * dt * 2; f.vx = wind * (.35 + f.r * .18) + Math.sin(f.ph) * 4.5 * f.r; }
      if (now - ptr.t < 600) { const dx = f.x - ptr.x, dy = f.y - ptr.y, d2 = dx * dx + dy * dy; if (d2 < 7000) { const d = Math.sqrt(d2) || 1, p = (1 - d / 84) * 260 * dt; f.x += dx / d * p; f.y += dy / d * p * .5; } }
      f.x += f.vx * dt; f.y += f.vy * dt;
      let gone = f.y > vh + 8 || f.x < -60 || f.x > W + 60;
      if (!gone) for (const s of list) {
        if (!s.vis || f.x < s.l || f.x >= s.l + s.w) continue;
        const c = ((f.x - s.l) / COL) | 0, surface = s.vtop - s.cols[c];
        if (py <= surface && f.y >= surface) {
          if (f.loose || Math.random() < (s.fixed ? .9 : .75)) { const cap = capAt(s, c); if (s.cols[c] < cap) s.cols[c] = Math.min(cap, s.cols[c] + f.r * (f.loose ? .6 : 1.1)); gone = true; }
          break;
        }
      }
      if (gone) { if (f.loose) { flakes.splice(i, 1); looseCount--; } else spawn(f, false); }
    }

    // piles
    ctx.fillStyle = dark ? '#e9eefc' : '#ffffff';
    ctx.strokeStyle = dark ? 'rgba(255,255,255,.6)' : 'rgba(120,140,190,.55)'; ctx.lineWidth = 1;
    for (const s of list) {
      const c = s.cols, n = c.length, melt = (s.fixed ? .35 : .035) * dt;
      for (let i = 0; i < n - 1; i++) { const d = c[i] - c[i + 1]; if (d > 1.1 || d < -1.1) { const m = d * .22; c[i] -= m; c[i + 1] += m; } }
      for (let i = 0; i < n; i++) c[i] = Math.min(c[i] * (1 - melt), capAt(s, i));
      if (!s.vis) continue;
      const top = s.vtop + (s.fixed ? 1 : 3);
      ctx.beginPath(); ctx.moveTo(s.l, top);
      for (let i = 0; i < n; i++) ctx.lineTo(s.l + i * COL + COL / 2, top - c[i]);
      ctx.lineTo(s.l + s.w, top); ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    // flakes; in the dark theme the ones inside the lamp's light turn warm
    const warm = [];
    ctx.beginPath();
    for (const f of flakes) {
      if (f.y < -4) continue;
      if (L && !lowQ && f.y > L.hy && f.y < L.gy && Math.abs(f.x - L.hx) < (f.y - L.hy) / (L.gy - L.hy) * L.hw + 8) { warm.push(f); continue; }
      ctx.moveTo(f.x + f.r, f.y); ctx.arc(f.x, f.y, f.r, 0, 6.2832);
    }
    ctx.fillStyle = dark ? 'rgba(255,255,255,.88)' : 'rgba(255,255,255,.97)'; ctx.fill();
    if (!dark && !lowQ) { ctx.strokeStyle = 'rgba(120,120,170,.30)'; ctx.lineWidth = .8; ctx.stroke(); }
    if (warm.length) { ctx.beginPath(); for (const f of warm) { ctx.moveTo(f.x + f.r, f.y); ctx.arc(f.x, f.y, f.r * 1.08, 0, 6.2832); } ctx.fillStyle = '#ffe3a3'; ctx.fill(); }

    raf = requestAnimationFrame(step);
  }

  function onPointer(e) {
    ptr.vx = e.clientX - ptr.x; ptr.x = e.clientX; ptr.y = e.clientY; ptr.t = performance.now();
    if (e.pointerType === 'touch' || Math.abs(ptr.vx) < 2) return;
    for (const s of surf.values()) {
      if (!s.vis || e.clientX < s.l || e.clientX > s.l + s.w) continue;
      if (e.clientY > s.vtop - 26 && e.clientY < s.vtop + 14) { const c = ((e.clientX - s.l) / COL) | 0; knock(s, c - 4, c + 4, .85, s.fixed ? -80 : 10); }
    }
  }
  function onOrient(e) { if (e.gamma == null) return; tilt = clamp(e.gamma / 40, -1, 1); fall = clamp(1 + ((e.beta || 45) - 45) / 160, .7, 1.3); }
  function onMotion(e) { const a = e.acceleration; if (!a) return; if (Math.hypot(a.x || 0, a.y || 0, a.z || 0) > 13) shake = Math.min(.9, shake + .35); }
  async function askSensors() {
    try { if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') await DeviceOrientationEvent.requestPermission(); } catch { /* declined */ }
    try { if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') await DeviceMotionEvent.requestPermission(); } catch { /* declined */ }
  }

  let mo = null, mt = 0, iv = 0, rt = 0;
  const remeasure = () => { clearTimeout(mt); mt = setTimeout(measure, 150); };
  const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { layout(); resize(); }, 140); };
  const kick = () => { if (on && cv && !raf && !document.hidden) { last = 0; raf = requestAnimationFrame(step); } };

  function enable() {
    if (on) return; on = true;
    addStyle('stw-style', CSS);
    root.classList.add('st-winter');
    buildScene();
    addEventListener('resize', onResize, { passive: true });
    if (reduced()) return;
    cv = document.createElement('canvas'); cv.className = 'stw-snow'; cv.setAttribute('aria-hidden', 'true');
    ctx = cv.getContext('2d', { alpha: true, desynchronized: true });
    document.body.append(cv);
    flakes.length = 0; looseCount = 0; W = 0; H = 0; lowQ = false; resize(true);
    addEventListener('pointermove', onPointer, { passive: true });
    addEventListener('deviceorientation', onOrient, { passive: true });
    addEventListener('devicemotion', onMotion, { passive: true });
    document.addEventListener('visibilitychange', kick);
    const grid = $('#grid'); mo = new MutationObserver(remeasure); if (grid) mo.observe(grid, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    iv = setInterval(measure, 2000);
    kick();
  }
  function disable() {
    if (!on) return; on = false;
    root.classList.remove('st-winter');
    cancelAnimationFrame(raf); raf = 0;
    cv?.remove(); cv = null; ctx = null; bg?.remove(); bg = null; surf.clear(); flakes.length = 0; looseCount = 0;
    removeEventListener('resize', onResize); removeEventListener('pointermove', onPointer);
    removeEventListener('deviceorientation', onOrient); removeEventListener('devicemotion', onMotion);
    document.removeEventListener('visibilitychange', kick);
    mo?.disconnect(); clearInterval(iv);
  }
  new MutationObserver(() => { if (on && bg && bg.dataset.dark !== String(isDark())) buildScene(); }).observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] });

  /* visitor switch in Settings: shown only while the admin has the theme on */
  const userToggle = $('#winterToggle'), userSec = userToggle?.closest('.settings-sec');
  const userWants = () => { try { return localStorage.getItem(LOCAL) !== '0'; } catch { return true; } };
  function applyWinter() {
    const allowed = site.winter === 'on';
    if (userSec) userSec.hidden = !allowed;
    if (userToggle) userToggle.checked = allowed && userWants();
    if (allowed && userWants()) enable(); else disable();
  }
  userToggle?.addEventListener('change', () => {
    try { localStorage.setItem(LOCAL, userToggle.checked ? '1' : '0'); } catch { /* storage blocked */ }
    if (userToggle.checked) askSensors();
    applyWinter();
  });

  /* ═════════════ music ═════════════ */
  let audio = null, musicBtn = null, armed = false;
  const userMuted = () => { try { return localStorage.getItem(MUSIC_LOCAL) === 'off'; } catch { return false; } };
  function paintMusic() {
    if (!musicBtn) return;
    const playing = !!audio && !audio.paused;
    musicBtn.classList.toggle('has-track', !!site.musicUrl);
    musicBtn.classList.toggle('is-playing', playing);
    const label = (playing ? t('pause') : t('play')) + (site.musicTitle ? ' · ' + site.musicTitle : '');
    musicBtn.setAttribute('aria-label', label); musicBtn.title = label; musicBtn.setAttribute('aria-pressed', String(playing));
  }
  function ensureAudio() {
    if (!site.musicUrl) return null;
    if (!audio) { audio = new Audio(); audio.loop = true; audio.preload = 'none'; audio.addEventListener('play', paintMusic); audio.addEventListener('pause', paintMusic); }
    if (audio.dataset.src !== site.musicUrl) { audio.pause(); audio.src = site.musicUrl; audio.dataset.src = site.musicUrl; }
    audio.volume = clamp(site.musicVolume / 100, 0, 1);
    return audio;
  }
  async function playMusic() { const a = ensureAudio(); if (!a) return; try { await a.play(); musicBtn?.classList.remove('hint'); } catch { /* blocked until a tap */ } paintMusic(); }
  function setupMusic() {
    addStyle('st-music-style', UI_CSS);
    if (!musicBtn) {
      musicBtn = document.createElement('button'); musicBtn.type = 'button'; musicBtn.className = 'icon-btn st-music';
      musicBtn.innerHTML = '<span class="st-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
      $('#settingsBtn')?.before(musicBtn);
      musicBtn.addEventListener('click', () => {
        const a = ensureAudio(); if (!a) return;
        if (a.paused) { try { localStorage.setItem(MUSIC_LOCAL, 'on'); } catch { /* */ } playMusic(); }
        else { a.pause(); try { localStorage.setItem(MUSIC_LOCAL, 'off'); } catch { /* */ } }
      });
    }
    if (!site.musicUrl) { audio?.pause(); paintMusic(); return; }
    ensureAudio(); paintMusic();
    if (site.musicAutoplay && !userMuted() && !armed) {
      armed = true; musicBtn.classList.add('hint');
      const start = (e) => { if (musicBtn.contains(e.target)) return; removeEventListener('pointerdown', start, true); removeEventListener('keydown', start, true); if (!userMuted()) playMusic(); };
      addEventListener('pointerdown', start, true); addEventListener('keydown', start, true);
    }
  }

  /* ═════════════ settings from the database ═════════════ */
  function readRows(rows) {
    const m = Object.fromEntries((rows || []).map((r) => [r.key, r.value]));
    site.winter = m.winter_mode === 'on' ? 'on' : 'off';
    site.musicUrl = /^https:\/\//.test(m.music_url || '') ? m.music_url : '';
    site.musicTitle = String(m.music_title || '').slice(0, 80);
    site.musicVolume = clamp(Number(m.music_volume ?? 40) || 0, 0, 100);
    site.musicAutoplay = m.music_autoplay === '1';
  }
  async function load() {
    try {
      const { data, error } = await _supabase.from('site_settings').select('key,value').in('key', ['winter_mode', 'music_url', 'music_title', 'music_volume', 'music_autoplay']);
      if (error) throw error;
      readRows(data);
    } catch { /* keep the last known state */ }
    try { localStorage.setItem('stacked.site', JSON.stringify(site)); } catch { /* */ }
    applyWinter(); setupMusic(); syncAdmin();
  }

  /* ═════════════ admin: Каталог → Настройки → «Зима и музыка» ═════════════ */
  let adminBox = null;
  function buildAdmin() {
    const tab = $('#tab-settings'); if (!tab || adminBox) return;
    addStyle('st-music-style', UI_CSS);
    adminBox = document.createElement('section');
    adminBox.className = 'stackd-settings-section stw-admin'; adminBox.id = 'stwAdmin';
    adminBox.innerHTML = `
      <div class="stackd-section-head"><h3 data-stw="admin"></h3><span>SEASON</span></div>
      <label class="st-switch"><input type="checkbox" id="stwAdminWinter"><span class="st-switch-ui" aria-hidden="true"></span><span data-stw="winter"></span></label>
      <p class="stackd-admin-note" data-stw="winterHelp"></p>
      <h4 style="margin:18px 0 6px" data-stw="music"></h4>
      <label for="stwAdminFile" data-stw="file"></label>
      <input type="file" id="stwAdminFile" class="st-file-input" accept="audio/mpeg,audio/mp4,audio/aac,audio/x-m4a,audio/ogg,audio/wav,audio/webm,.mp3,.m4a,.ogg,.wav">
      <label class="st-file" for="stwAdminFile"><b data-stw="pick"></b><span id="stwAdminFileName" data-stw="nofile"></span></label>
      <label for="stwAdminUrl" data-stw="url"></label>
      <input type="url" id="stwAdminUrl" inputmode="url" placeholder="https://" autocomplete="off">
      <label for="stwAdminTitle" data-stw="title"></label>
      <input type="text" id="stwAdminTitle" maxlength="80" autocomplete="off">
      <label for="stwAdminVol"><span data-stw="volume"></span> <b id="stwAdminVolVal"></b></label>
      <input type="range" id="stwAdminVol" min="0" max="100" step="5">
      <label class="st-switch"><input type="checkbox" id="stwAdminAuto"><span class="st-switch-ui" aria-hidden="true"></span><span data-stw="autoplay"></span></label>
      <audio id="stwAdminPreview" controls preload="none" hidden></audio>
      <div class="stw-now" id="stwAdminNow"></div>
      <div class="stw-row"><button type="button" class="btn btn-primary" id="stwAdminSave" data-stw="save"></button><button type="button" class="btn btn-ghost" id="stwAdminRemove" data-stw="remove"></button></div>`;
    tab.append(adminBox);
    const vol = $('#stwAdminVol'), volVal = $('#stwAdminVolVal');
    vol.addEventListener('input', () => { volVal.textContent = vol.value + '%'; if (audio) audio.volume = vol.value / 100; });
    $('#stwAdminFile').addEventListener('change', (e) => { const f = e.target.files?.[0]; $('#stwAdminFileName').textContent = f ? f.name : t('nofile'); const p = $('#stwAdminPreview'); if (f) { p.src = URL.createObjectURL(f); p.hidden = false; if (!$('#stwAdminTitle').value) $('#stwAdminTitle').value = f.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 80); } });
    $('#stwAdminSave').addEventListener('click', () => saveAdmin(false));
    $('#stwAdminRemove').addEventListener('click', () => { $('#stwAdminUrl').value = ''; $('#stwAdminFile').value = ''; $('#stwAdminTitle').value = ''; saveAdmin(true); });
    syncAdmin();
  }
  function syncAdmin() {
    if (!adminBox) return;
    adminBox.querySelectorAll('[data-stw]').forEach((el) => { el.textContent = t(el.dataset.stw); });
    $('#stwAdminWinter').checked = site.winter === 'on';
    $('#stwAdminUrl').value = site.musicUrl; $('#stwAdminTitle').value = site.musicTitle;
    $('#stwAdminVol').value = site.musicVolume; $('#stwAdminVolVal').textContent = site.musicVolume + '%';
    $('#stwAdminAuto').checked = site.musicAutoplay;
    const p = $('#stwAdminPreview');
    if (site.musicUrl) { if (p.dataset.src !== site.musicUrl) { p.src = site.musicUrl; p.dataset.src = site.musicUrl; } p.hidden = false; } else { p.hidden = true; }
    $('#stwAdminNow').textContent = site.musicUrl ? '♪ ' + (site.musicTitle || site.musicUrl) : '';
  }
  async function saveAdmin(removing) {
    const btn = $('#stwAdminSave'); btn.disabled = true;
    try {
      let url = $('#stwAdminUrl').value.trim();
      const file = $('#stwAdminFile').files?.[0];
      if (file && !removing) {
        if (file.size > 20 * 1024 * 1024) throw new Error('file over 20 MB');
        toastMsg(t('uploading'));
        const ext = (file.name.match(/\.([a-z0-9]{2,4})$/i)?.[1] || 'mp3').toLowerCase();
        const path = `music/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await _supabase.storage.from('site-media').upload(path, file, { upsert: false, contentType: file.type || 'audio/mpeg', cacheControl: '31536000' });
        if (upErr) throw upErr;
        url = _supabase.storage.from('site-media').getPublicUrl(path).data.publicUrl;
      }
      if (url && !/^https:\/\//.test(url)) { toastMsg(t('badUrl')); return; }
      const rows = [
        { key: 'winter_mode', value: $('#stwAdminWinter').checked ? 'on' : 'off' },
        { key: 'music_url', value: url },
        { key: 'music_title', value: $('#stwAdminTitle').value.trim().slice(0, 80) },
        { key: 'music_volume', value: String($('#stwAdminVol').value) },
        { key: 'music_autoplay', value: $('#stwAdminAuto').checked ? '1' : '0' }
      ];
      const { error } = await _supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
      if (error) throw error;
      readRows(rows); $('#stwAdminFile').value = ''; $('#stwAdminFileName').textContent = t('nofile');
      try { localStorage.setItem('stacked.site', JSON.stringify(site)); } catch { /* */ }
      applyWinter(); setupMusic(); syncAdmin();
      toastMsg(t('saved'));
    } catch (err) { console.error('winter/music settings failed:', err); toastMsg(t('err')); }
    finally { btn.disabled = false; }
  }

  document.addEventListener('click', (e) => { if (e.target.closest('[data-lang]')) setTimeout(() => { syncAdmin(); paintMusic(); }, 80); });

  // start from the last known state at once (no flash), then confirm with the database
  try { const c = JSON.parse(localStorage.getItem('stacked.site') || 'null'); if (c && typeof c === 'object') { Object.assign(site, c); applyWinter(); } } catch { /* */ }
  buildAdmin();
  if (typeof _supabase !== 'undefined') load(); else applyWinter();
  window.stWinter = { enable, disable, reload: load, get on() { return on; } };
})();
