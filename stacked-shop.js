/*
 * STACKED shop layer. Loaded after app.js and stackd-enhancements.js; it wraps their globals
 * (card, renderCart, A.add/inc/dec) instead of rewriting them, so catalog, auth, orders and Supabase logic stay untouched.
 *
 * Adds: fly-to-cart card stack dock, quantity stepper without a duplicate button, per-product mini icon (admin),
 * footer social links (admin), news carousel. Settings are stored in the existing `site_settings` key/value table:
 *   product_icons {productId: url}, social_instagram, social_tiktok (Telegram uses the existing telegram_channel).
 */
(() => {
  'use strict';
  if (typeof S === 'undefined' || typeof _supabase === 'undefined') return;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off';
  const lang = () => (['ru', 'en', 'az'].includes(S.lang) ? S.lang : 'ru');
  const TX = {
    ru: { cart: 'Корзина', items: 'шт.', open: 'Открыть корзину', iconTitle: 'Мини-иконка товара', iconHelp: 'Небольшой логотип ресторана на карточке. Если не задан, на карточке ничего не показывается.', iconPick: 'Выбрать изображение', iconSave: 'Сохранить иконку', iconRemove: 'Удалить иконку', iconFirst: 'Сначала сохраните товар, затем задайте иконку.', iconSaved: 'Иконка сохранена.', iconRemoved: 'Иконка удалена.', iconFail: 'Не удалось сохранить иконку: ', socTitle: 'Социальные сети', socHelp: 'Пустое поле скрывает иконку в футере. Допускаются только ссылки https.', socSave: 'Сохранить ссылки', socSaved: 'Ссылки сохранены.', socBad: 'Проверьте ссылку: ', admin: 'Только владелец может менять настройки.', newsPrev: 'Предыдущая новость', newsNext: 'Следующая новость', newsGo: 'Новость' },
    en: { cart: 'Cart', items: 'items', open: 'Open cart', iconTitle: 'Product mini icon', iconHelp: 'A small restaurant logo shown on the card. If not set, nothing is shown.', iconPick: 'Choose image', iconSave: 'Save icon', iconRemove: 'Remove icon', iconFirst: 'Save the product first, then set an icon.', iconSaved: 'Icon saved.', iconRemoved: 'Icon removed.', iconFail: 'Could not save the icon: ', socTitle: 'Social links', socHelp: 'An empty field hides the icon in the footer. Only https links are accepted.', socSave: 'Save links', socSaved: 'Links saved.', socBad: 'Check the link: ', admin: 'Only the owner can change settings.', newsPrev: 'Previous news', newsNext: 'Next news', newsGo: 'News' },
    az: { cart: 'Səbət', items: 'ədəd', open: 'Səbəti aç', iconTitle: 'Məhsulun mini ikonu', iconHelp: 'Kartda göstərilən kiçik restoran loqosu. Təyin edilməyibsə, heç nə göstərilmir.', iconPick: 'Şəkil seç', iconSave: 'İkonu saxla', iconRemove: 'İkonu sil', iconFirst: 'Əvvəlcə məhsulu saxlayın, sonra ikon təyin edin.', iconSaved: 'İkon saxlanıldı.', iconRemoved: 'İkon silindi.', iconFail: 'İkonu saxlamaq mümkün olmadı: ', socTitle: 'Sosial şəbəkələr', socHelp: 'Boş sahə ikonu gizlədir. Yalnız https keçidləri qəbul olunur.', socSave: 'Keçidləri saxla', socSaved: 'Keçidlər saxlanıldı.', socBad: 'Keçidi yoxlayın: ', admin: 'Ayarları yalnız sahibi dəyişə bilər.', newsPrev: 'Əvvəlki xəbər', newsNext: 'Növbəti xəbər', newsGo: 'Xəbər' }
  };
  const t = (k) => (TX[lang()] || TX.ru)[k] || TX.ru[k] || k;
  const settings = { product_icons: {}, social_instagram: '', social_tiktok: '', telegram_channel: 'stackdbaku' };

  /* ───────── settings (site_settings key/value) ───────── */
  async function loadShopSettings() {
    try {
      const { data, error } = await _supabase.from('site_settings').select('key,value').in('key', ['product_icons', 'social_instagram', 'social_tiktok', 'telegram_channel']);
      if (error) throw error;
      (data || []).forEach((row) => {
        if (row.key === 'product_icons') { try { const v = JSON.parse(row.value || '{}'); settings.product_icons = v && typeof v === 'object' ? v : {}; } catch { settings.product_icons = {}; } }
        else if (row.key in settings) settings[row.key] = String(row.value || '').trim();
      });
    } catch (e) { console.warn('STACKED shop settings not loaded:', e.message || e); }
    renderFooterSocials(); refreshAllCards();
  }
  const httpsUrl = (v, host) => {
    v = String(v || '').trim(); if (!v) return '';
    try { const u = new URL(v); if (u.protocol !== 'https:') return null; if (host && !u.hostname.replace(/^www\./, '').endsWith(host)) return null; return u.href; } catch { return null; }
  };

  /* ───────── cards: stepper only, per-product icon, no hard-coded restaurant logo ───────── */
  const prevCard = card;
  card = function stackedCard(p) {
    const tpl = document.createElement('template');
    tpl.innerHTML = prevCard(p).trim();
    const root = tpl.content.firstElementChild;
    if (!root) return prevCard(p);
    root.querySelector('.stackd-arches')?.remove(); // the old build stamped McDonald's arches on every card
    const icon = settings.product_icons[String(p.id)];
    const media = root.querySelector('.card-media');
    const safe = icon ? safeImageUrl(icon) : '';
    if (media && safe) {
      const m = document.createElement('span'); m.className = 'stacked-mark';
      const img = document.createElement('img'); img.src = safe; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
      m.append(img); media.append(m);
    }
    const actions = root.querySelector('.stackd-card-actions');
    if (actions && actions.querySelector('.stackd-card-qty')) actions.querySelector('[data-act="add"]')?.remove();
    return root.outerHTML;
  };
  function refreshCard(id) {
    const old = document.querySelector(`.card[data-id="${CSS.escape(String(id))}"]`), p = find(id);
    if (!old || !p) return;
    const tpl = document.createElement('template'); tpl.innerHTML = card(p).trim();
    const next = tpl.content.firstElementChild; if (!next) return;
    const had = !!old.querySelector('.stackd-card-qty'), has = !!next.querySelector('.stackd-card-qty');
    next.querySelector('.stackd-card-qty')?.classList.add(had ? 'is-steady' : 'is-in');
    old.replaceWith(next);
  }
  function refreshAllCards() { try { renderAll(); } catch { /* catalog not ready yet */ } }

  /* ───────── cart dock: a compact stack of mini cards ───────── */
  const dock = document.createElement('div');
  dock.id = 'stackedDock'; dock.className = 'stacked-dock'; dock.hidden = true; dock.setAttribute('role', 'region');
  dock.innerHTML = '<button type="button" class="stacked-dock-main" data-act="cart-open"><span class="stacked-stack" aria-hidden="true"></span><span class="stacked-dock-info"><strong></strong><small></small></span><span class="stacked-dock-cta"></span></button>';
  document.body.append(dock);
  const layer = document.createElement('div'); layer.className = 'stacked-fly-layer'; layer.setAttribute('aria-hidden', 'true'); document.body.append(layer);
  const stackEl = dock.querySelector('.stacked-stack');
  const pending = new Map();
  function renderDock() {
    const L = lines(), n = L.reduce((a, l) => a + l.qty, 0), total = L.reduce((a, l) => a + l.qty * l.p.price, 0);
    dock.hidden = !n; document.body.classList.toggle('has-dock', n > 0);
    dock.setAttribute('aria-label', t('cart'));
    dock.querySelector('.stacked-dock-info strong').textContent = `${n} ${t('items')}`;
    dock.querySelector('.stacked-dock-info small').textContent = fmt(total);
    dock.querySelector('.stacked-dock-cta').textContent = t('open');
    const top = L.slice(-4);
    stackEl.innerHTML = top.map(({ p, qty }, i) => {
      const off = i - (top.length - 1);
      return `<span class="stacked-mini${pending.has(String(p.id)) ? ' is-pending' : ''}" data-dock-id="${esc(p.id)}" style="--o:${off};--z:${i}"><img src="${esc(imgSrc(p))}" alt="">${qty > 1 ? `<b>${qty}</b>` : ''}</span>`;
    }).join('');
  }
  const prevRenderCart = renderCart;
  renderCart = function stackedRenderCart() { const r = prevRenderCart.apply(this, arguments); renderDock(); return r; };

  function fly(a, clone, id) {
    const key = String(id);
    const slot = stackEl.querySelector(`[data-dock-id="${CSS.escape(key)}"]`);
    if (!slot || !a || !clone) return;
    if (reduced()) { slot.classList.add('is-settle'); setTimeout(() => slot.classList.remove('is-settle'), 400); return; }
    const b = slot.getBoundingClientRect();
    if (!a.width || !b.width) return;
    pending.set(key, (pending.get(key) || 0) + 1); slot.classList.add('is-pending');
    const el = document.createElement('div'); el.className = 'stacked-fly';
    el.style.cssText = `left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px`;
    clone.removeAttribute('id'); clone.querySelectorAll('[id],button,input').forEach((n) => n.removeAttribute('id'));
    clone.querySelectorAll('button').forEach((n) => { n.tabIndex = -1; });
    clone.style.cssText = 'margin:0;width:100%;height:100%;object-fit:cover;display:block;pointer-events:none';
    el.append(clone); layer.append(el);
    const sc = Math.max(0.05, b.width / a.width);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const k = (f, rx, rz, s) => `translate3d(${dx * f}px,${dy * f}px,0) rotateX(${rx}deg) rotateZ(${rz}deg) scale(${s})`;
    const anim = el.animate([
      { transform: k(0, 0, 0, 1), opacity: 1, offset: 0 },
      { transform: `translate3d(${dx * 0.18}px,${Math.min(-14, dy * 0.02) }px,0) rotateZ(-3deg) scale(${1 - (1 - sc) * 0.18})`, opacity: 1, offset: 0.22 },
      { transform: k(0.72, 0, 2, 1 - (1 - sc) * 0.78), opacity: 1, offset: 0.68 },
      { transform: k(1, 0, 0, sc), opacity: 1, offset: 1 }
    ], { duration: 680, easing: 'cubic-bezier(.32,.72,.2,1)', fill: 'forwards' });
    const done = () => {
      el.remove();
      const left = (pending.get(key) || 1) - 1; if (left <= 0) pending.delete(key); else pending.set(key, left);
      const real = stackEl.querySelector(`[data-dock-id="${CSS.escape(key)}"]`);
      if (real) { if (!pending.has(key)) real.classList.remove('is-pending'); real.classList.remove('is-settle'); void real.offsetWidth; real.classList.add('is-settle'); }
    };
    anim.onfinish = done; anim.oncancel = done;
  }

  /* ───────── actions: race guard + fly + card refresh ───────── */
  const qtyOf = (id) => Number(S.cart.find((x) => String(x.id) === String(id))?.qty || 0);
  const busy = new Set();
  ['add', 'inc', 'dec'].forEach((name) => {
    const orig = A[name]; if (typeof orig !== 'function') return;
    A[name] = (id, btn) => {
      if (id === undefined || busy.has(id + name)) return;
      busy.add(id + name); setTimeout(() => busy.delete(id + name), 160);
      const before = qtyOf(id);
      // The flying element is a copy of the product PHOTO only (never the card), measured before the card re-renders.
      const src = btn?.closest('.card')?.querySelector('.card-media img') || btn?.closest('.detail')?.querySelector('img');
      const full = src && src.getBoundingClientRect().width ? src.getBoundingClientRect() : null;
      const w = full ? Math.min(full.width, 150) : 0, h = full ? full.height * (w / full.width) : 0;
      const rect = full ? { left: full.left + (full.width - w) / 2, top: full.top + (full.height - h) / 2, width: w, height: h } : null;
      const copy = full ? src.cloneNode(false) : null;
      if (copy) { copy.removeAttribute('loading'); copy.removeAttribute('data-act'); copy.setAttribute('alt', ''); }
      const r = orig(id, btn);
      if (qtyOf(id) > before && name !== 'dec') requestAnimationFrame(() => fly(rect, copy, id));
      refreshCard(id);
      return r;
    };
  });
  // quantity changes made from inside the cart drawer must also refresh the card on the page
  document.addEventListener('click', (e) => {
    const b = e.target.closest('#lines [data-act]'); if (!b) return;
    const id = b.closest('[data-id]')?.dataset.id; if (id) setTimeout(() => refreshCard(id), 0);
  });
  document.getElementById('clearBtn')?.addEventListener('click', () => setTimeout(refreshAllCards, 0));

  /* ───────── footer socials ───────── */
  const ICON = {
    telegram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>'
  };
  function renderFooterSocials() {
    const host = document.querySelector('.foot .wrap > div:first-child'); if (!host) return;
    let box = host.querySelector('.stacked-socials');
    if (!box) { box = document.createElement('nav'); box.className = 'stacked-socials'; box.setAttribute('aria-label', 'Social'); (host.querySelector('.social-links') || host.lastElementChild).after(box); }
    const tg = settings.telegram_channel ? `https://t.me/${settings.telegram_channel.replace(/^@/, '')}` : '';
    const list = [['telegram', 'Telegram', tg], ['instagram', 'Instagram', settings.social_instagram], ['tiktok', 'TikTok', settings.social_tiktok]].filter(([, , url]) => url && /^https:\/\//.test(url));
    box.hidden = !list.length;
    box.innerHTML = list.map(([k, name, url]) => `<a class="stacked-social" data-net="${k}" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${name}" title="${name}">${ICON[k]}</a>`).join('');
  }

  /* ───────── admin: product mini icon + social links (site_settings) ───────── */
  async function saveSetting(key, value) {
    const { error } = await _supabase.from('site_settings').upsert([{ key, value }], { onConflict: 'key' });
    if (error) throw error;
  }
  async function freshIcons() {
    const { data } = await _supabase.from('site_settings').select('value').eq('key', 'product_icons').maybeSingle();
    try { const v = JSON.parse(data?.value || '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
  }
  let iconFile = null, iconObjectUrl = null;
  function currentProductId() { return S.draft?.id ? String(S.draft.id) : ''; }
  function syncIconUI() {
    const box = document.getElementById('stackedIconField'); if (!box) return;
    const id = currentProductId(), saved = id && S.products.some((p) => String(p.id) === id);
    const url = iconObjectUrl || (saved ? settings.product_icons[id] : '') || '';
    const prev = box.querySelector('.stacked-icon-prev');
    prev.innerHTML = url ? `<img src="${esc(safeImageUrl(url))}" alt="">` : '';
    box.querySelector('[data-icon="remove"]').disabled = !(saved && settings.product_icons[id]);
    box.querySelector('[data-icon="save"]').disabled = !iconFile;
    box.querySelector('.stacked-icon-note').textContent = saved ? t('iconHelp') : t('iconFirst');
  }
  function buildIconField() {
    const form = document.getElementById('pform'); if (!form || document.getElementById('stackedIconField')) return;
    const box = document.createElement('fieldset'); box.id = 'stackedIconField'; box.className = 'stacked-icon-field';
    box.innerHTML = `<legend>${esc(t('iconTitle'))}</legend><div class="stacked-icon-row"><span class="stacked-icon-prev" aria-hidden="true"></span><div class="stacked-icon-ctl"><input type="file" id="stackedIconFile" accept="image/jpeg,image/png,image/webp" hidden><button type="button" class="btn btn-ghost sm" data-icon="pick">${esc(t('iconPick'))}</button><button type="button" class="btn btn-primary sm" data-icon="save" disabled>${esc(t('iconSave'))}</button><button type="button" class="btn btn-ghost sm" data-icon="remove" disabled>${esc(t('iconRemove'))}</button></div></div><small class="stacked-icon-note"></small>`;
    const submit = form.querySelector('button[type="submit"]'); (submit || form.lastElementChild).before(box);
    const fileInput = box.querySelector('#stackedIconFile');
    box.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-icon]'); if (!b) return;
      const act = b.dataset.icon, id = currentProductId();
      if (act === 'pick') { fileInput.click(); return; }
      if (!isAdmin()) { toast(t('admin')); return; }
      if (!id || !S.products.some((p) => String(p.id) === id)) { toast(t('iconFirst')); return; }
      b.disabled = true;
      try {
        const map = await freshIcons();
        if (act === 'save' && iconFile) {
          await validateProductImage(iconFile);
          const up = await _supabase.storage.from(PRODUCT_BUCKET).upload(`icons/${crypto.randomUUID()}.${IMAGE_TYPES[iconFile.type]}`, iconFile, { cacheControl: '31536000', upsert: false, contentType: iconFile.type });
          if (up.error) throw up.error;
          const pub = _supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(up.data.path).data?.publicUrl;
          if (!pub) throw new Error('Storage');
          const oldPath = map[id] ? getProductStoragePath(map[id]) : '';
          map[id] = pub; await saveSetting('product_icons', JSON.stringify(map));
          if (oldPath && oldPath.startsWith('icons/')) _supabase.storage.from(PRODUCT_BUCKET).remove([oldPath]).catch(() => {});
          iconFile = null; if (iconObjectUrl) URL.revokeObjectURL(iconObjectUrl); iconObjectUrl = null; fileInput.value = '';
          toast(t('iconSaved'));
        } else if (act === 'remove') {
          const oldPath = map[id] ? getProductStoragePath(map[id]) : '';
          delete map[id]; await saveSetting('product_icons', JSON.stringify(map));
          if (oldPath && oldPath.startsWith('icons/')) _supabase.storage.from(PRODUCT_BUCKET).remove([oldPath]).catch(() => {});
          toast(t('iconRemoved'));
        }
        settings.product_icons = map; refreshAllCards();
      } catch (err) { toast(t('iconFail') + (err.message || '')); }
      syncIconUI();
    });
    fileInput.addEventListener('change', async () => {
      const f = fileInput.files?.[0]; iconFile = null; if (iconObjectUrl) URL.revokeObjectURL(iconObjectUrl); iconObjectUrl = null;
      if (f) { try { await validateProductImage(f); iconFile = f; iconObjectUrl = URL.createObjectURL(f); } catch (err) { toast(err.message); fileInput.value = ''; } }
      syncIconUI();
    });
    syncIconUI();
  }
  function buildSocialSettings() {
    const tab = document.getElementById('tab-settings'); if (!tab || document.getElementById('stackedSocialSettings')) return;
    const s = document.createElement('section'); s.id = 'stackedSocialSettings'; s.className = 'stackd-settings-section';
    s.innerHTML = `<div class="stackd-section-head"><h3>${esc(t('socTitle'))}</h3><span>FOOTER</span></div><p class="stackd-admin-note">${esc(t('socHelp'))}</p>
      <label for="stackedIg">Instagram</label><input id="stackedIg" type="url" inputmode="url" placeholder="https://instagram.com/..." autocomplete="off">
      <label for="stackedTt">TikTok</label><input id="stackedTt" type="url" inputmode="url" placeholder="https://tiktok.com/@..." autocomplete="off">
      <button type="button" class="btn btn-primary" id="stackedSocialSave">${esc(t('socSave'))}</button>`;
    tab.append(s);
    const fill = () => { s.querySelector('#stackedIg').value = settings.social_instagram; s.querySelector('#stackedTt').value = settings.social_tiktok; };
    fill();
    s.querySelector('#stackedSocialSave').addEventListener('click', async (e) => {
      if (!isAdmin()) { toast(t('admin')); return; }
      const ig = httpsUrl(s.querySelector('#stackedIg').value, 'instagram.com'), tt = httpsUrl(s.querySelector('#stackedTt').value, 'tiktok.com');
      if (ig === null) { toast(t('socBad') + 'Instagram'); return; }
      if (tt === null) { toast(t('socBad') + 'TikTok'); return; }
      e.currentTarget.disabled = true;
      try { await saveSetting('social_instagram', ig); await saveSetting('social_tiktok', tt); settings.social_instagram = ig; settings.social_tiktok = tt; renderFooterSocials(); toast(t('socSaved')); }
      catch (err) { toast(err.message || 'Error'); }
      e.currentTarget.disabled = false;
    });
    s._fill = fill;
  }
  // Admin tabs are built lazily by the older scripts, so wait for the elements instead of racing them.
  new MutationObserver(() => { buildIconField(); buildSocialSettings(); }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', (e) => { if (e.target.closest('#adminList,[data-act="new"],[data-act="edit"],#adminAdd')) setTimeout(syncIconUI, 60); });

  /* ───────── news: calm cross-fade carousel built from the existing news data ───────── */
  let newsTimer = null, newsI = 0;
  function buildNews() {
    const sec = document.getElementById('stackdNewsRail'); if (!sec) return;
    const cards = Array.from(sec.querySelectorAll('#stackdNewsTrack > .stackd-news-card'));
    let items = cards.map((c) => ({ img: c.querySelector('img')?.getAttribute('src') || '', cap: c.querySelector('.stackd-news-caption')?.textContent || '', href: c.tagName === 'A' ? c.getAttribute('href') : '' }));
    if (items.length > 1 && items[0].img === items[items.length - 1].img) items.pop();
    clearInterval(newsTimer);
    let stage = sec.querySelector('.stacked-news'); stage?.remove();
    if (!items.length || sec.hidden) return;
    sec.classList.add('has-stacked-news');
    stage = document.createElement('div'); stage.className = 'stacked-news'; stage.setAttribute('role', 'region'); stage.setAttribute('aria-roledescription', 'carousel');
    stage.innerHTML = `<div class="stacked-news-slides">${items.map((it, i) => {
      const inner = `<img src="${esc(it.img)}" alt="${esc(it.cap)}" ${i ? 'loading="lazy"' : ''} decoding="async">${it.cap ? `<span class="stacked-news-cap">${esc(it.cap)}</span>` : ''}`;
      return it.href ? `<a class="stacked-news-slide" href="${esc(it.href)}" target="_blank" rel="noopener noreferrer" data-i="${i}">${inner}</a>` : `<div class="stacked-news-slide" data-i="${i}">${inner}</div>`;
    }).join('')}</div>${items.length > 1 ? `<div class="stacked-news-dots">${items.map((_, i) => `<button type="button" data-go="${i}" aria-label="${esc(t('newsGo'))} ${i + 1}"></button>`).join('')}</div>` : ''}`;
    sec.append(stage);
    const slides = Array.from(stage.querySelectorAll('.stacked-news-slide')), dots = Array.from(stage.querySelectorAll('.stacked-news-dots button'));
    const show = (i) => { newsI = (i + items.length) % items.length; slides.forEach((s, k) => { const on = k === newsI; s.classList.toggle('is-on', on); s.setAttribute('aria-hidden', on ? 'false' : 'true'); s.tabIndex = on ? 0 : -1; }); dots.forEach((d, k) => d.setAttribute('aria-current', k === newsI ? 'true' : 'false')); };
    show(0);
    if (items.length < 2) return;
    const start = () => { clearInterval(newsTimer); if (!reduced()) newsTimer = setInterval(() => { if (!document.hidden) show(newsI + 1); }, 6000); };
    stage.addEventListener('click', (e) => { const d = e.target.closest('[data-go]'); if (d) { show(+d.dataset.go); start(); } });
    stage.addEventListener('pointerenter', () => clearInterval(newsTimer)); stage.addEventListener('pointerleave', start);
    let x0 = null;
    stage.addEventListener('pointerdown', (e) => { x0 = e.clientX; }); stage.addEventListener('pointerup', (e) => { if (x0 !== null && Math.abs(e.clientX - x0) > 40) { show(newsI + (e.clientX < x0 ? 1 : -1)); start(); } x0 = null; });
    start();
  }
  let newsRaf = 0;
  new MutationObserver(() => { cancelAnimationFrame(newsRaf); newsRaf = requestAnimationFrame(() => { const sec = document.getElementById('stackdNewsRail'); if (sec && !sec.dataset.stackedBusy) { buildNews(); } }); }).observe(document.getElementById('catalog') || document.body, { childList: true, subtree: false });
  const watchTrack = () => { const tr = document.getElementById('stackdNewsTrack'); if (!tr || tr._watched) return; tr._watched = true; new MutationObserver(() => { cancelAnimationFrame(newsRaf); newsRaf = requestAnimationFrame(buildNews); }).observe(tr, { childList: true }); buildNews(); };
  new MutationObserver(watchTrack).observe(document.body, { childList: true, subtree: true }); watchTrack();

  /* ───────── boot ───────── */
  document.addEventListener('click', (e) => { if (e.target.closest('[data-lang]')) setTimeout(() => { renderDock(); refreshAllCards(); }, 60); });
  renderDock(); renderFooterSocials(); buildIconField(); buildSocialSettings();
  loadShopSettings();
})();
