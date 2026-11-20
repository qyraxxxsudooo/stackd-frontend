/* STAKED — New Year theme and site music.
   • The admin turns the theme on or off for the whole site (Каталог → Настройки → «Зима и музыка», site_settings.winter_mode).
     When it is on, each visitor can still switch it off for themselves in Settings.
   • Dark theme: a night street with a lit lamp, a decorated tree and snowy roofs. Light theme: a winter morning at sunrise.
   • A lightweight CSS snowfall is drawn across the whole screen. Flakes pass over the interface without
     landing, accumulating, colliding, reacting to scrolling, pointer movement or device sensors.
   • The admin can upload a track (or paste a link); visitors get a small play button in the header.
   Nothing heavy is created until the theme is actually on. */
(() => {
  'use strict';
  const LOCAL = 'stacked.winter';
  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const isDark = () => root.classList.contains('stacked-dark') || root.dataset.theme === 'dark';
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const lang = () => { try { return (typeof S !== 'undefined' && S.lang) || localStorage.getItem('pdd.lang') || 'ru'; } catch { return 'ru'; } };
  const TXT = {
    ru: { admin: 'Зима и музыка', city: 'Зимний город', cityHelp: 'Выберите архитектурную атмосферу зимнего оформления.', cityBaku: 'Баку', cityNewYork: 'Нью-Йорк', cityTokyo: 'Токио', cityLondon: 'Лондон', cityParis: 'Париж', winter: 'Новогодняя тема на сайте', winterHelp: 'Снег, огни и зимняя улица у всех посетителей. Каждый может отключить её у себя в настройках.', music: '', file: 'Загрузить трек (MP3, M4A, OGG, до 20 МБ)', blur: 'Размытие зимнего фона', blurHelp: 'Настройте силу размытия сцены отдельно от карточек и интерфейса. Изменение видно сразу, сохранение — кнопкой ниже.', url: 'Или ссылка на трек (https://…)', title: 'Название трека', volume: 'Громкость', autoplay: 'Включать при первом касании страницы', save: 'Сохранить', remove: 'Убрать музыку', saved: 'Сохранено', uploading: 'Загрузка трека…', err: 'Не удалось сохранить', badUrl: 'Ссылка должна начинаться с https://', play: 'Включить музыку', pause: 'Выключить музыку', pick: 'Выбрать', nofile: 'Файл не выбран' },
    en: { admin: 'Winter and music', city: 'Winter city', cityHelp: 'Choose the architectural atmosphere for the winter scene.', cityBaku: 'Baku', cityNewYork: 'New York', cityTokyo: 'Tokyo', cityLondon: 'London', cityParis: 'Paris', winter: 'New Year theme on the site', winterHelp: 'Snow, lights and a winter street for every visitor. Anyone can switch it off in their settings.', music: '', file: 'Upload a track (MP3, M4A, OGG, up to 20 MB)', blur: 'Winter background blur', blurHelp: 'Adjust the scene blur without blurring cards or controls. Preview updates instantly; use Save below to keep it.', url: 'Or a link to a track (https://…)', title: 'Track title', volume: 'Volume', autoplay: 'Start on the first tap on the page', save: 'Save', remove: 'Remove music', saved: 'Saved', uploading: 'Uploading track…', err: 'Could not save', badUrl: 'The link must start with https://', play: 'Play music', pause: 'Pause music', pick: 'Choose', nofile: 'No file selected' },
    az: { admin: 'Qış və musiqi', city: 'Qış şəhəri', cityHelp: 'Qış səhnəsi üçün şəhər atmosferini seçin.', cityBaku: 'Bakı', cityNewYork: 'Nyu-York', cityTokyo: 'Tokio', cityLondon: 'London', cityParis: 'Paris', winter: 'Saytda Yeni il mövzusu', winterHelp: 'Bütün ziyarətçilər üçün qar, işıqlar və qış küçəsi. Hər kəs öz parametrlərində söndürə bilər.', music: '', file: 'Trek yüklə (MP3, M4A, OGG, 20 MB-a qədər)', blur: 'Qış fonunun bulanıqlığı', blurHelp: 'Yalnız qış səhnəsini bulanıqlaşdırın. Ön baxış dərhal yenilənir, saxlamaq üçün aşağıdakı düyməni basın.', url: 'Və ya trek linki (https://…)', title: 'Trekin adı', volume: 'Səs', autoplay: 'Səhifəyə ilk toxunuşda başlasın', save: 'Yadda saxla', remove: 'Musiqini sil', saved: 'Yadda saxlanıldı', uploading: 'Trek yüklənir…', err: 'Yadda saxlamaq olmadı', badUrl: 'Link https:// ilə başlamalıdır', play: 'Musiqini aç', pause: 'Musiqini dayandır', pick: 'Seç', nofile: 'Fayl seçilməyib' }
  };
  const t = (k) => (TXT[lang()] || TXT.ru)[k] || TXT.ru[k];
  const toastMsg = (m) => { try { if (typeof toast === 'function') toast(m); } catch { /* no toast */ } };

  const CITY_IDS = ['baku', 'new-york', 'tokyo', 'london', 'paris'];
  const site = { winter: 'off', winterCity: 'baku', winterBlur: 0 };

  /* ═════════════ styles (injected once) ═════════════ */
  const CSS = `
html.st-winter{background:#070b17}
html.st-winter:not(.stacked-dark):not([data-theme=dark]){background:#f6dccb}
html.st-winter body{background:transparent!important}
.stw-bg{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden;contain:strict}
.stw-atmosphere{position:absolute;inset:-28px;z-index:0;overflow:hidden;filter:blur(var(--stw-scene-blur,0px));transform:scale(1.035);transition:filter .2s ease-out}
.stw-scene{position:absolute;inset:0;z-index:0;width:100%;height:100%;object-fit:cover;object-position:50% 100%;display:block;user-select:none;filter:none!important;transform:none!important}
.stw-bg::before,.stw-bg::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none}
.stw-bg[data-dark="true"]::before{background:radial-gradient(ellipse 48% 30% at 24% 19%,rgba(49,205,172,.23),transparent 72%),radial-gradient(ellipse 40% 28% at 62% 15%,rgba(91,116,234,.24),transparent 74%),radial-gradient(ellipse 28% 24% at 88% 30%,rgba(102,207,192,.16),transparent 74%);background-size:110% 110%;mix-blend-mode:screen;opacity:.9;animation:stwAuroraDrift 26s ease-in-out infinite alternate}
.stw-bg[data-dark="true"]::after{background:radial-gradient(ellipse at 50% 48%,transparent 35%,rgba(3,7,18,.3) 100%),radial-gradient(1px 1px at 14% 19%,rgba(255,255,255,.75) 60%,transparent 100%),radial-gradient(1.5px 1.5px at 29% 11%,rgba(255,255,255,.75) 60%,transparent 100%),radial-gradient(1px 1px at 73% 22%,rgba(255,255,255,.8) 60%,transparent 100%),radial-gradient(1px 1px at 91% 13%,rgba(255,255,255,.7) 60%,transparent 100%);opacity:.72}
.stw-bg[data-dark="false"]::before{background:radial-gradient(ellipse 46% 35% at 70% 70%,rgba(255,211,159,.25),transparent 75%),radial-gradient(ellipse 55% 22% at 20% 15%,rgba(255,255,255,.25),transparent 78%);opacity:.8}
.stw-bg[data-dark="false"]::after{background:linear-gradient(180deg,rgba(255,255,255,.06),transparent 28%,rgba(255,226,211,.12));opacity:.8}
.stw-lamp{z-index:2;position:absolute;left:var(--stw-lx,40px);bottom:var(--stw-lb,80px);height:var(--stw-lh,60vh);aspect-ratio:300/560}
.stw-lamp::before{content:"";position:absolute;left:-80%;top:-22%;width:260%;height:64%;border-radius:50%;background:radial-gradient(ellipse at 50% 45%,rgba(255,222,168,.22),rgba(255,207,140,.09) 42%,transparent 76%);filter:blur(22px);pointer-events:none}
.stw-lamp img{position:absolute;inset:0;width:100%;height:100%}
.stw-halo{position:absolute;left:50%;top:13.6%;width:175%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(closest-side,rgba(255,220,164,.26),rgba(255,205,142,.08) 48%,transparent 76%);filter:blur(7px);pointer-events:none}
.stw-city-landmarks{opacity:.96}
@keyframes stwAuroraDrift{from{transform:translate3d(-1.5%,0,0) scale(1)}to{transform:translate3d(1.5%,1.2%,0) scale(1.04)}}
.stw-snow-canvas{position:fixed;inset:0;z-index:30;width:100%;height:100%;pointer-events:none;contain:strict;display:block}
@media(prefers-reduced-motion:reduce){.stw-snow-canvas{opacity:.72}}
@media (pointer:coarse){html.st-winter .st-tabbar{-webkit-backdrop-filter:blur(12px) saturate(140%)!important;backdrop-filter:blur(12px) saturate(140%)!important}.stw-bg[data-dark="true"]::before{animation:none;opacity:.72}}
@media (prefers-reduced-motion:reduce){.stw-bg::before{animation:none!important}.stw-atmosphere{transition:none}}

.stw-city-control{display:grid;gap:6px;margin:12px 0}
.stw-city-control>label{font-size:.82rem;font-weight:650;color:var(--text)}
.stw-city-control select{
  width:100%;min-height:42px;padding:9px 38px 9px 12px;border:1px solid var(--line);
  border-radius:12px;background:var(--surface);color:var(--text);font:inherit
}
.stw-city-control .stackd-admin-note{margin:0}
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
.stw-admin .stw-blur-control{display:grid;gap:5px;margin:12px 0 4px;padding:13px;border:1px solid color-mix(in srgb,var(--text) 9%,transparent);border-radius:15px;background:color-mix(in srgb,var(--surface) 68%,transparent)}
.stw-admin .stw-blur-control label{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:.84rem;font-weight:650}
.stw-admin .stw-blur-control label b{font-variant-numeric:tabular-nums;color:var(--accent)}
.stw-admin .stw-blur-control .stackd-admin-note{margin:0;font-size:.73rem}
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


  const CITY_SVG = {
    baku: '<g><path d="M650 790c-8-74 7-145 45-206 18 72 27 133 22 206Z" fill="CITYSTONE"/><path d="M735 790c-6-107 18-200 68-277 23 92 30 185 22 277Z" fill="CITYSTONE"/><path d="M840 790c-7-126 23-222 75-310 26 99 32 212 23 310Z" fill="CITYSTONE" stroke="CITYEDGE" stroke-opacity=".24" stroke-width="3"/><path d="M651 790c16-78 25-135 44-187M741 790c17-105 30-185 61-259M847 790c20-121 39-214 68-285" stroke="CITYEDGE" stroke-width="5" opacity=".7" fill="none"/><path d="M963 790V655c0-34 17-58 43-58s43 24 43 58v135Z" fill="CITYSTONE" stroke="CITYEDGE" stroke-opacity=".4" stroke-width="3"/><path d="M955 655q51-28 102 0M964 639h84" stroke="CITYEDGE" stroke-width="4" opacity=".6"/><g fill="CITYLIGHT"><rect x="675" y="686" width="7" height="13"/><rect x="758" y="672" width="7" height="13"/><rect x="862" y="650" width="7" height="13"/><rect x="981" y="690" width="7" height="13"/></g></g>',
    'new-york': '<g><path d="M650 790V566h74v224M690 790V494h76v296M960 790V530h92v260M1045 790V603h70v187" fill="CITYSTONE"/><path d="M790 790V443h28v-50h14v-42h10v-46h8v46h10v42h14v50h22v347Z" fill="CITYSTONE" stroke="CITYEDGE" stroke-opacity=".4" stroke-width="3"/><path d="M790 443h116M804 393h88M818 351h60M840 305v-62l4-16 4 16v62" fill="none" stroke="CITYEDGE" stroke-width="4" opacity=".65"/><g fill="CITYLIGHT" opacity=".75"><rect x="675" y="596" width="7" height="12"/><rect x="704" y="596" width="7" height="12"/><rect x="716" y="531" width="7" height="12"/><rect x="745" y="531" width="7" height="12"/><rect x="816" y="476" width="7" height="12"/><rect x="844" y="476" width="7" height="12"/><rect x="870" y="476" width="7" height="12"/><rect x="979" y="565" width="8" height="13"/><rect x="1010" y="565" width="8" height="13"/></g></g>',
    tokyo: '<g><path d="M620 790V615h100v175M690 790V535h95v255M965 790V572h120v218M1080 790V642h72v148" fill="CITYSTONE"/><path d="M800 790 840 330 880 790Z" fill="#aa4a42" stroke="#f0a181" stroke-width="5"/><path d="M811 674h58M818 590h44M825 506h30M832 422h16M838 352h4M810 680l60-70M818 585l52-62M825 495l45-54M870 680l-60-70M862 585l-52-62M855 495l-45-54" stroke="#f4b18c" stroke-width="3" opacity=".78"/><path d="M840 320v-34M827 286h26M615 705h95M968 690h110" stroke="#ffb27a" stroke-width="4" opacity=".68"/><g fill="CITYLIGHT"><rect x="700" y="654" width="6" height="11"/><rect x="737" y="606" width="6" height="11"/><rect x="989" y="620" width="6" height="11"/><rect x="1030" y="650" width="6" height="11"/></g></g>',
    london: '<g><path d="M620 790V640l46-35 46 35v150M930 790V632l55-40 55 40v158" fill="CITYSTONE"/><path d="M790 790V397h24v-58h11v-42h40v42h11v58h24v393Z" fill="CITYSTONE" stroke="CITYEDGE" stroke-opacity=".4" stroke-width="3"/><path d="M825 298l20-31 20 31Z" fill="CITYSTONE" stroke="CITYEDGE" stroke-opacity=".5" stroke-width="2"/><path d="M825 339h80M830 397h70M832 485h66M832 540h66M832 605h66M832 675h66" stroke="CITYEDGE" stroke-opacity=".34" stroke-width="3"/><circle cx="845" cy="447" r="24" fill="#e8e0cf" stroke="CITYEDGE" stroke-width="4"/><circle cx="845" cy="447" r="18" fill="none" stroke="#81725b" stroke-width="2"/><path d="M845 447v-13M845 447l11 5" stroke="#756448" stroke-width="3" stroke-linecap="round"/><g fill="CITYLIGHT"><rect x="641" y="662" width="8" height="12"/><rect x="690" y="662" width="8" height="12"/><rect x="955" y="663" width="8" height="12"/><rect x="1000" y="663" width="8" height="12"/></g></g>',
    paris: '<g><path d="M620 790h480M760 790l84-420 84 420M797 790l47-288 47 288M810 655h68M793 713h101M778 756h132" fill="none" stroke="CITYSTONE" stroke-width="13" stroke-linejoin="round"/><path d="M844 368v-45M831 323h27M610 650v-43h28v-24h35v24h27v43M1010 658v-45h26v-24h34v24h27v45" fill="CITYSTONE"/><path d="M608 606l47-26 47 26M1008 613l45-25 44 25" stroke="CITYEDGE" stroke-width="4" fill="none" opacity=".65"/><g fill="CITYLIGHT"><rect x="624" y="628" width="7" height="12"/><rect x="661" y="628" width="7" height="12"/><rect x="1025" y="633" width="7" height="12"/><rect x="1060" y="633" width="7" height="12"/></g></g>'
  };
  function cityLandmarks(city, dark) {
    return (CITY_SVG[city] || CITY_SVG.baku)
      .replaceAll('CITYSTONE', dark ? '#101a2d' : '#6b8299')
      .replaceAll('CITYEDGE', dark ? '#667d9d' : '#f0f2f4')
      .replaceAll('CITYLIGHT', dark ? '#ffd99a' : '#fff0c8');
  }

  function darkScene(city = site.winterCity) {
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
<g class="stw-city-landmarks">${cityLandmarks(city, true)}</g>
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

  function morningScene(city = site.winterCity) {
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
<g class="stw-city-landmarks">${cityLandmarks(city, false)}</g>
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
  function applySceneBlur(value = site.winterBlur) {
    const amount = clamp(Math.round(Number(value) || 0), 0, 18);
    site.winterBlur = amount;
    if (bg) {
      bg.style.setProperty('--stw-scene-blur', amount + 'px');
      bg.querySelector('.stw-atmosphere')?.style.setProperty('--stw-scene-blur', amount + 'px');
    }
    return amount;
  }
  function buildScene() {
    const dark = isDark();
    if (!bg) { bg = document.createElement('div'); bg.className = 'stw-bg'; bg.setAttribute('aria-hidden', 'true'); document.body.prepend(bg); }
    bg.dataset.dark = String(dark);
    bg.dataset.city = site.winterCity;
    const key = site.winterCity + '-' + (dark ? 'd' : 'l');
    cache[key] ||= svgUrl(dark ? darkScene(site.winterCity) : morningScene(site.winterCity));
    cache['lamp-' + (dark ? 'd' : 'l')] ||= svgUrl(lampSvg(dark));
    bg.innerHTML = '<div class="stw-atmosphere"><img class="stw-scene" alt="" decoding="async" src="' + cache[key] + '"><div class="stw-lamp">' + (dark ? '<div class="stw-halo"></div>' : '') + '<img alt="" decoding="async" src="' + cache['lamp-' + (dark ? 'd' : 'l')] + '"></div></div>';
    applySceneBlur(site.winterBlur);
    layout();
  }
  /* the lamp stands on the scene's ground line (the image is anchored to the bottom and scaled to cover) */
  function layout() {
    const w = innerWidth, h = innerHeight, scale = Math.max(w / 1600, h / 900);
    const lampEl = bg && bg.querySelector('.stw-lamp'); if (!lampEl) return;
    const small = w < 700;
    const lh = Math.min(h * (small ? .34 : .58), 580), lw = lh * 300 / 560;
    const lb = (900 - 786) * scale;
    const lx = small ? 6 : Math.max(18, (w - 1280) / 2 - lw * .6);
    lampEl.style.setProperty('--stw-lh', lh + 'px'); lampEl.style.setProperty('--stw-lb', lb + 'px'); lampEl.style.setProperty('--stw-lx', lx + 'px');
  }


  /* ═════════════ snow: layered, non-colliding particles ═════════════ */
  let on = false, snowCanvas = null, snowCtx = null, snowRaf = 0;
  let snowParticles = [], snowWidth = 0, snowHeight = 0, snowDpr = 1;
  let snowLast = 0, snowNextFrame = 0, snowResizeTimer = 0, snowWind = 0;
  const snowPointer = { x: -1000, y: -1000, vx: 0, vy: 0, last: 0 };
  const snowMedia = matchMedia('(prefers-reduced-motion: reduce)');
  const onResize = () => {
    layout();
    clearTimeout(snowResizeTimer);
    snowResizeTimer = setTimeout(resizeSnow, 110);
  };
  function makeSnowParticle(initial = false) {
    const depth = Math.random();
    return {
      x: Math.random() * snowWidth,
      y: initial ? Math.random() * snowHeight : -10 - Math.random() * 50,
      depth,
      radius: .55 + depth * 2.1,
      speed: 18 + depth * 56,
      drift: 5 + depth * 25,
      phase: Math.random() * Math.PI * 2,
      frequency: .00028 + Math.random() * .00072,
      opacity: .2 + depth * .68,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - .5) * (.18 + depth * .8),
      crystal: depth > .74 && Math.random() > .3,
      cursorForce: 0
    };
  }
  function resizeSnow() {
    if (!snowCanvas || !snowCtx) return;
    const w = Math.max(1, Math.round(innerWidth));
    const h = Math.max(1, Math.round(innerHeight));
    const area = w * h;
    const deviceDpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.1 : 1.8);
    snowDpr = Math.min(deviceDpr, Math.max(1, Math.sqrt((coarse ? 2200000 : 6000000) / area)));
    snowWidth = w;
    snowHeight = h;
    snowCanvas.width = Math.round(w * snowDpr);
    snowCanvas.height = Math.round(h * snowDpr);
    snowCanvas.style.width = w + 'px';
    snowCanvas.style.height = h + 'px';
    snowCtx.setTransform(snowDpr, 0, 0, snowDpr, 0, 0);
    const target = coarse
      ? Math.round(clamp(area / 22000, 28, 56))
      : Math.round(clamp(area / 4700, 210, 430));
    while (snowParticles.length < target) snowParticles.push(makeSnowParticle(true));
    if (snowParticles.length > target) snowParticles.length = target;
    drawSnow(0, performance.now());
  }
  function drawSnow(dt, now) {
    if (!snowCtx) return;
    const ctx = snowCtx;
    ctx.clearRect(0, 0, snowWidth, snowHeight);
    const motionOff = snowMedia.matches;
    const gust = motionOff ? 0 : Math.sin(now * .00017) * 8 + Math.sin(now * .000071 + 2.1) * 5;
    snowWind += (gust - snowWind) * Math.min(1, dt * .8);

    // Touch GPUs use a low-cost circle-only renderer; skip per-flake transforms and trigonometry.
    if (coarse) {
      for (const flake of snowParticles) {
        if (!motionOff) {
          flake.x += (snowWind + flake.drift * .12) * dt;
          flake.y += flake.speed * dt;
          if (flake.y > snowHeight + 12) {
            flake.y = -8 - Math.random() * 36;
            flake.x = Math.random() * snowWidth;
          }
          if (flake.x < -12) flake.x = snowWidth + 8;
          else if (flake.x > snowWidth + 12) flake.x = -8;
        }
        ctx.globalAlpha = flake.opacity;
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, Math.max(.65, flake.radius * .82), 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      return;
    }

    for (const flake of snowParticles) {
      if (!motionOff) {
        const dx = flake.x - snowPointer.x;
        const dy = flake.y - snowPointer.y;
        const distance = Math.hypot(dx, dy);
        let cursorPush = 0;
        if (!coarse && snowPointer.last && now - snowPointer.last < 260 && distance < 175) {
          const falloff = 1 - distance / 175;
          const pointerVelocity = clamp(snowPointer.vx * .45 + snowPointer.vy * .12, -42, 42);
          cursorPush = pointerVelocity * falloff * falloff * .62;
        }
        flake.cursorForce += (cursorPush - flake.cursorForce) * Math.min(1, dt * 2.2);
        const localSway = Math.sin(now * flake.frequency + flake.phase) * flake.drift;
        const microGust = Math.sin(now * .00031 + flake.phase * 1.7) * (2 + flake.depth * 5);
        flake.x += (snowWind + localSway + microGust + flake.cursorForce) * dt;
        flake.y += flake.speed * dt;
        flake.rotation += flake.spin * dt;
        if (flake.y > snowHeight + 12) {
          flake.y = -8 - Math.random() * 60;
          flake.x = Math.random() * snowWidth;
        }
        if (flake.x < -18) flake.x = snowWidth + 10;
        else if (flake.x > snowWidth + 18) flake.x = -10;
      }
      const depth = flake.depth;
      ctx.save();
      ctx.translate(flake.x, flake.y);
      ctx.rotate(flake.rotation);
      ctx.globalAlpha = flake.opacity;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(255,255,255,.92)';
      ctx.lineCap = 'round';
      if (depth < .25) ctx.filter = 'blur(.8px)';
      if (flake.crystal && !motionOff) {
        const radius = flake.radius * 1.6;
        ctx.lineWidth = Math.max(.45, flake.radius * .25);
        ctx.beginPath();
        for (let arm = 0; arm < 6; arm++) {
          const angle = arm * Math.PI / 3;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const branch = radius * .34;
          ctx.moveTo(0, 0);
          ctx.lineTo(x, y);
          ctx.moveTo(x * .58, y * .58);
          ctx.lineTo(x * .58 - Math.sin(angle) * branch, y * .58 + Math.cos(angle) * branch);
          ctx.moveTo(x * .58, y * .58);
          ctx.lineTo(x * .58 + Math.sin(angle) * branch, y * .58 - Math.cos(angle) * branch);
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, flake.radius * .48, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, flake.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  function stepSnow(now) {
    snowRaf = 0;
    if (!on || !snowCtx || document.hidden) return;
    const interval = 1000 / (coarse ? 30 : 60);
    if (now < snowNextFrame) {
      snowRaf = requestAnimationFrame(stepSnow);
      return;
    }
    snowNextFrame = now + interval;
    const dt = Math.min(.045, (now - (snowLast || now)) / 1000);
    snowLast = now;
    drawSnow(dt, now);
    if (!snowMedia.matches) snowRaf = requestAnimationFrame(stepSnow);
  }
  function kickSnow() {
    if (!on || !snowCtx || document.hidden || snowMedia.matches || snowRaf) return;
    snowLast = 0;
    snowRaf = requestAnimationFrame(stepSnow);
  }
  function onSnowPointer(event) {
    if (coarse) return;
    const now = performance.now();
    const elapsed = Math.max(.008, (now - (snowPointer.last || now)) / 1000);
    snowPointer.vx = clamp((event.clientX - snowPointer.x) / elapsed, -1600, 1600);
    snowPointer.vy = clamp((event.clientY - snowPointer.y) / elapsed, -1600, 1600);
    snowPointer.x = event.clientX;
    snowPointer.y = event.clientY;
    snowPointer.last = now;
  }
  const onSnowVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(snowRaf);
      snowRaf = 0;
    } else kickSnow();
  };
  const onSnowMotionPreference = () => {
    if (!on) return;
    cancelAnimationFrame(snowRaf);
    snowRaf = 0;
    drawSnow(0, performance.now());
    kickSnow();
  };
  function enable() {
    if (on) return;
    on = true;
    addStyle('stw-style', CSS);
    root.classList.add('st-winter');
    buildScene();
    addEventListener('resize', onResize, { passive: true });
    snowCanvas = document.createElement('canvas');
    snowCanvas.className = 'stw-snow-canvas';
    snowCanvas.setAttribute('aria-hidden', 'true');
    snowCtx = snowCanvas.getContext('2d', { alpha: true, desynchronized: true });
    if (snowCtx) {
      document.body.append(snowCanvas);
      resizeSnow();
      snowLast = 0;
      snowNextFrame = 0;
      if (!coarse) addEventListener('pointermove', onSnowPointer, { passive: true });
      document.addEventListener('visibilitychange', onSnowVisibility);
      if (snowMedia.addEventListener) snowMedia.addEventListener('change', onSnowMotionPreference);
      else snowMedia.addListener?.(onSnowMotionPreference);
      kickSnow();
    } else {
      snowCanvas.remove();
      snowCanvas = null;
    }
  }
  function disable() {
    if (!on) return;
    on = false;
    root.classList.remove('st-winter');
    removeEventListener('resize', onResize);
    removeEventListener('pointermove', onSnowPointer);
    document.removeEventListener('visibilitychange', onSnowVisibility);
    if (snowMedia.removeEventListener) snowMedia.removeEventListener('change', onSnowMotionPreference);
    else snowMedia.removeListener?.(onSnowMotionPreference);
    clearTimeout(snowResizeTimer);
    cancelAnimationFrame(snowRaf);
    snowRaf = 0;
    snowCanvas?.remove();
    snowCanvas = null;
    snowCtx = null;
    snowParticles = [];
    bg?.remove();
    bg = null;
  }
  new MutationObserver(() => {
    if (!on || !bg) return;
    if (bg.dataset.dark !== String(isDark()) || bg.dataset.city !== site.winterCity) buildScene();
  }).observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] });

  /* visitor switch in Settings: shown only while the admin has the theme on */
  const userToggle = $('#winterToggle'), userSec = userToggle?.closest('.settings-sec');
  const userWants = () => { try { return localStorage.getItem(LOCAL) !== '0'; } catch { return true; } };
  function applyWinter() {
    const allowed = site.winter === 'on';
    if (userSec) userSec.hidden = !allowed;
    if (userToggle) userToggle.checked = allowed && userWants();
    if (allowed && userWants()) {
      if (!on) enable();
      else if (bg && (bg.dataset.dark !== String(isDark()) || bg.dataset.city !== site.winterCity)) buildScene();
    } else disable();
  }
  userToggle?.addEventListener('change', () => {
    try { localStorage.setItem(LOCAL, userToggle.checked ? '1' : '0'); } catch { /* storage blocked */ }
    applyWinter();
  });

  /* Site music was removed. This hook removes stale controls from cached markup. */
  function setupMusic() {
    document.querySelectorAll('.st-music').forEach(button => button.remove());
    const preview = document.getElementById('stwAdminPreview');
    if (preview) { preview.pause(); preview.removeAttribute('src'); preview.load(); preview.remove(); }
  }

  /* ═════════════ settings from the database ═════════════ */
  function readRows(rows) {
    const m = Object.fromEntries((rows || []).map((r) => [r.key, r.value]));
    site.winter = m.winter_mode === 'on' ? 'on' : 'off';
    site.winterCity = CITY_IDS.includes(m.winter_city) ? m.winter_city : (CITY_IDS.includes(site.winterCity) ? site.winterCity : 'baku');
    site.winterBlur = clamp(Number(m.winter_blur ?? site.winterBlur ?? 0) || 0, 0, 18);
  }
  async function load() {
    try {
      const { data, error } = await _supabase.from('site_settings').select('key,value').in('key', ['winter_mode', 'winter_city', 'winter_blur']);
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
      <div class="stw-city-control">
        <label for="stwAdminCity" data-stw="city"></label>
        <select id="stwAdminCity">
          <option value="baku" data-stw="cityBaku"></option>
          <option value="new-york" data-stw="cityNewYork"></option>
          <option value="tokyo" data-stw="cityTokyo"></option>
          <option value="london" data-stw="cityLondon"></option>
          <option value="paris" data-stw="cityParis"></option>
        </select>
        <p class="stackd-admin-note" data-stw="cityHelp"></p>
      </div>
      <div class="stw-blur-control">
        <label for="stwAdminBlur"><span data-stw="blur"></span> <b id="stwAdminBlurVal">0 px</b></label>
        <input type="range" id="stwAdminBlur" min="0" max="18" step="1" value="0" aria-label="Winter background blur">
        <p class="stackd-admin-note" data-stw="blurHelp"></p>
      </div>
      <div class="stw-row"><button type="button" class="btn btn-primary" id="stwAdminSave" data-stw="save"></button></div>`;
    tab.append(adminBox);
    const citySelect = $('#stwAdminCity');
    citySelect.addEventListener('change', () => {
      site.winterCity = CITY_IDS.includes(citySelect.value) ? citySelect.value : 'baku';
      try { localStorage.setItem('stacked.site', JSON.stringify(site)); } catch { /* */ }
      if (on) buildScene();
    });
    const blur = $('#stwAdminBlur'), blurVal = $('#stwAdminBlurVal');
    blur.addEventListener('input', () => {
      const amount = applySceneBlur(blur.value);
      blurVal.textContent = amount + ' px';
    });
    $('#stwAdminSave').addEventListener('click', () => saveAdmin());    syncAdmin();
  }
  function syncAdmin() {
    if (!adminBox) return;
    adminBox.querySelectorAll('[data-stw]').forEach((el) => { el.textContent = t(el.dataset.stw); });
    $('#stwAdminWinter').checked = site.winter === 'on';
    $('#stwAdminCity').value = CITY_IDS.includes(site.winterCity) ? site.winterCity : 'baku';
    $('#stwAdminBlur').value = String(site.winterBlur);
    $('#stwAdminBlurVal').textContent = site.winterBlur + ' px';
    applySceneBlur(site.winterBlur);
  }
  async function saveAdmin() {
    const btn = $('#stwAdminSave');
    if (!btn || btn.disabled) return;
    btn.disabled = true;
    try {
      const rows = [
        { key: 'winter_mode', value: $('#stwAdminWinter').checked ? 'on' : 'off' },
        { key: 'winter_city', value: CITY_IDS.includes($('#stwAdminCity').value) ? $('#stwAdminCity').value : 'baku' },
        { key: 'winter_blur', value: String(clamp(Number($('#stwAdminBlur').value) || 0, 0, 18)) }
      ];
      const { error } = await _supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
      if (error) throw error;
      readRows(rows);
      try { localStorage.setItem('stacked.site', JSON.stringify(site)); } catch { /* */ }
      applyWinter();
      syncAdmin();
      toastMsg(t('saved'));
    } catch (err) {
      console.error('winter settings failed:', err);
      toastMsg(t('err'));
    } finally {
      btn.disabled = false;
    }
  }

    document.addEventListener('click', (e) => { if (e.target.closest('[data-lang]')) setTimeout(syncAdmin, 80); });

  // start from the last known state at once (no flash), then confirm with the database
  try { const c = JSON.parse(localStorage.getItem('stacked.site') || 'null'); if (c && typeof c === 'object') { Object.assign(site, c); applyWinter(); } } catch { /* */ }
  buildAdmin();
  if (typeof _supabase !== 'undefined') load(); else applyWinter();
  window.stWinter = { enable, disable, reload: load, get on() { return on; } };
})();
