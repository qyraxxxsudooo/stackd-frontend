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
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  // Flies a copy of the product photo (never the card) along an arc into the visible cart target.
  const motionOff = () => reduced() || document.documentElement.classList.contains('stk-motion-off');
  function flyTarget(id) {
    const list = [
      stackEl.querySelector(`[data-dock-id="${CSS.escape(String(id))}"]`),
      document.querySelector('.stackd-mobile-actions .cart-btn'),
      document.querySelector('.stackd-mobile-cart'),
      document.querySelector('.nav .cart-btn')
    ];
    for (const el of list) {
      if (!el || el.closest('[hidden]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(el).visibility !== 'hidden') return { el, r };
    }
    return null;
  }
  function bumpTarget(el) {
    if (!el) return;
    const k = el.classList.contains('stacked-mini') ? 'is-settle' : 'stk-bump';
    el.classList.remove(k); void el.offsetWidth; el.classList.add(k);
    setTimeout(() => el.classList.remove(k), 450);
  }
  function fly(a, src, id) {
    const key = String(id);
    const target = flyTarget(id);
    if (!target) return;
    if (!a || !src || motionOff() || !a.width || a.bottom < 0 || a.top > innerHeight) { bumpTarget(target.el); return; }
    const isSlot = target.el.classList.contains('stacked-mini');
    if (isSlot) { pending.set(key, (pending.get(key) || 0) + 1); target.el.classList.add('is-pending'); }
    const b = target.r;
    // A square crop of the photo keeps the food centred and reads as "the burger", not as a card.
    const size = Math.min(a.width, a.height, 220);
    const x0 = a.left + a.width / 2 - size / 2, y0 = a.top + a.height / 2 - size / 2;
    const el = document.createElement('img');
    el.className = 'stacked-fly'; el.alt = ''; el.decoding = 'sync';
    el.src = src;
    el.style.cssText = `left:${x0}px;top:${y0}px;width:${size}px;height:${size}px`;
    layer.append(el);
    const dx = b.left + b.width / 2 - (x0 + size / 2), dy = b.top + b.height / 2 - (y0 + size / 2);
    const end = Math.max(0.12, Math.min(b.width, b.height) / size);
    const lift = Math.min(140, Math.max(60, Math.abs(dy) * 0.35));
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const frames = [];
    for (let i = 0; i <= 12; i++) {
      const u = i / 12, t = ease(u);
      // quadratic Bézier: start → control point above the start → target
      const cx = dx * 0.25, cy = -lift;
      const x = 2 * (1 - t) * t * cx + t * t * dx, y = 2 * (1 - t) * t * cy + t * t * dy;
      const s = u < 0.12 ? 1 + 0.06 * (u / 0.12) : 1.06 - (1.06 - end) * ((t - ease(0.12)) / (1 - ease(0.12)));
      frames.push({ offset: u, transform: `translate3d(${x}px,${y}px,0) rotate(${-8 * Math.sin(Math.PI * t)}deg) scale(${s})`, opacity: u > 0.9 ? (1 - (u - 0.9) / 0.1) * 0.6 + 0.4 : 1, borderRadius: `${12 + 38 * t}%` });
    }
    const anim = el.animate(frames, { duration: Math.min(820, 520 + Math.hypot(dx, dy) * 0.25), easing: 'linear', fill: 'forwards' });
    let finished = false;
    const done = () => {
      if (finished) return; finished = true;
      el.remove();
      if (isSlot) {
        const left = (pending.get(key) || 1) - 1; if (left <= 0) pending.delete(key); else pending.set(key, left);
        const real = stackEl.querySelector(`[data-dock-id="${CSS.escape(key)}"]`);
        if (real && !pending.has(key)) real.classList.remove('is-pending');
        bumpTarget(real);
      } else bumpTarget(flyTarget(id)?.el || target.el);
    };
    anim.onfinish = done; anim.oncancel = done;
    setTimeout(done, 1200); // never leave a stray copy on screen
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
      const img = btn?.closest('.card')?.querySelector('.card-media img') || btn?.closest('dialog')?.querySelector('img');
      // measured before the card re-renders; only the photo URL is copied, the card itself is untouched
      const rect = img ? img.getBoundingClientRect() : null, photo = img ? (img.currentSrc || img.src) : '';
      const r = orig(id, btn);
      if (qtyOf(id) > before && name !== 'dec') requestAnimationFrame(() => fly(rect, photo, id));
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

/* ═══════════ STACKED pass 2: settings panel, promo codes (customer + admin), Telegram link, first reveal ═══════════
 * Server is the source of truth: the browser only previews a code (stackd_promo_preview) and shows an estimate;
 * price, discount, limits and the free item are recalculated inside stackd_checkout. */
(() => {
  'use strict';
  if (typeof S === 'undefined' || typeof _supabase === 'undefined' || typeof A === 'undefined') return;
  const root = document.documentElement;
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const lang = () => (['ru', 'en', 'az'].includes(S.lang) ? S.lang : 'ru');
  const motionOff = () => root.classList.contains('stk-motion-off') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = (n) => `${(Math.round((Number(n) || 0) * 100) / 100).toFixed(2)} AZN`;
  const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const h = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const TX = {
    ru: {
      settings: 'Настройки', appearance: 'Оформление', light: 'Светлая', dark: 'Тёмная', system: 'Системная', language: 'Язык',
      promo: 'Промокод', apply: 'Применить', motion: 'Анимации', motionHint: 'Декоративные эффекты интерфейса', close: 'Закрыть',
      promoPh: 'Введите код', checking: 'Проверяем…', remove: 'Убрать', havePromo: 'Есть промокод?',
      invalid: 'Промокод недействителен или срок его действия истёк.', used: 'Вы уже использовали этот промокод.',
      rate: 'Слишком много попыток. Попробуйте позже.', auth: 'Войдите в аккаунт, чтобы применить промокод.', empty: 'Введите промокод.',
      unavailable: 'Промокоды временно недоступны.', needProduct: 'Добавьте в корзину «{p}», чтобы получить скидку.',
      needCart: 'Добавьте товары в корзину, чтобы получить скидку.', outGift: 'Подарочный товар сейчас закончился.',
      pctCart: 'Скидка {v}% на весь заказ', pctProduct: 'Скидка {v}% на «{p}»', fixCart: 'Скидка {v} на заказ', fixProduct: 'Скидка {v} на «{p}»',
      free: '«{p}» в подарок — 1 шт.', until: 'Действует до {d}', oneOrder: 'Один промокод на заказ', saving: 'Экономия в корзине: {v}',
      subtotal: 'Сумма', discount: 'Скидка', freeTag: '1 шт. бесплатно по промокоду', freeAdded: '«{p}» добавлен в корзину бесплатно',
      notApplicableCheckout: 'Промокод не подходит к корзине. Уберите его или добавьте нужный товар.',
      tgLink: 'Подключить Telegram', tgLinked: 'Telegram подключён', tgNoBot: 'Telegram-бот для уведомлений ещё не настроен.',
      tgFail: 'Не удалось создать ссылку для Telegram.', tgBot: 'Telegram-бот для QR-уведомлений', tgBotHelp: 'Username бота без @. Используется для кнопки «Подключить Telegram».', save: 'Сохранить', saved: 'Сохранено.'
    },
    en: {
      settings: 'Settings', appearance: 'Appearance', light: 'Light', dark: 'Dark', system: 'System', language: 'Language',
      promo: 'Promo code', apply: 'Apply', motion: 'Animations', motionHint: 'Decorative interface effects', close: 'Close',
      promoPh: 'Enter code', checking: 'Checking…', remove: 'Remove', havePromo: 'Have a promo code?',
      invalid: 'This promo code is invalid or has expired.', used: 'You have already used this promo code.',
      rate: 'Too many attempts. Please try again later.', auth: 'Sign in to apply a promo code.', empty: 'Enter a promo code.',
      unavailable: 'Promo codes are temporarily unavailable.', needProduct: 'Add “{p}” to the cart to get the discount.',
      needCart: 'Add items to the cart to get the discount.', outGift: 'The gift item is currently out of stock.',
      pctCart: '{v}% off the whole order', pctProduct: '{v}% off “{p}”', fixCart: '{v} off the order', fixProduct: '{v} off “{p}”',
      free: '“{p}” as a gift — 1 pc.', until: 'Valid until {d}', oneOrder: 'One promo code per order', saving: 'You save {v}',
      subtotal: 'Subtotal', discount: 'Discount', freeTag: '1 pc. free with promo code', freeAdded: '“{p}” added to the cart for free',
      notApplicableCheckout: 'The promo code does not match the cart. Remove it or add the required item.',
      tgLink: 'Connect Telegram', tgLinked: 'Telegram connected', tgNoBot: 'The notification bot is not configured yet.',
      tgFail: 'Could not create the Telegram link.', tgBot: 'Telegram bot for QR notifications', tgBotHelp: 'Bot username without @. Used by the “Connect Telegram” button.', save: 'Save', saved: 'Saved.'
    },
    az: {
      settings: 'Ayarlar', appearance: 'Görünüş', light: 'Açıq', dark: 'Tünd', system: 'Sistem', language: 'Dil',
      promo: 'Promokod', apply: 'Tətbiq et', motion: 'Animasiyalar', motionHint: 'Dekorativ interfeys effektləri', close: 'Bağla',
      promoPh: 'Kodu daxil edin', checking: 'Yoxlanılır…', remove: 'Sil', havePromo: 'Promokodunuz var?',
      invalid: 'Promokod etibarsızdır və ya müddəti bitib.', used: 'Bu promokoddan artıq istifadə etmisiniz.',
      rate: 'Çox cəhd edildi. Bir az sonra yenidən yoxlayın.', auth: 'Promokodu tətbiq etmək üçün daxil olun.', empty: 'Promokodu daxil edin.',
      unavailable: 'Promokodlar müvəqqəti əlçatan deyil.', needProduct: 'Endirim üçün səbətə «{p}» əlavə edin.',
      needCart: 'Endirim üçün səbətə məhsul əlavə edin.', outGift: 'Hədiyyə məhsul hazırda bitib.',
      pctCart: 'Bütün sifarişə {v}% endirim', pctProduct: '«{p}» üçün {v}% endirim', fixCart: 'Sifarişə {v} endirim', fixProduct: '«{p}» üçün {v} endirim',
      free: '«{p}» hədiyyə — 1 əd.', until: '{d} tarixinədək', oneOrder: 'Bir sifarişə bir promokod', saving: 'Qənaət: {v}',
      subtotal: 'Məbləğ', discount: 'Endirim', freeTag: 'Promokodla 1 əd. pulsuz', freeAdded: '«{p}» səbətə pulsuz əlavə edildi',
      notApplicableCheckout: 'Promokod səbətə uyğun deyil. Onu silin və ya lazım olan məhsulu əlavə edin.',
      tgLink: 'Telegram qoş', tgLinked: 'Telegram qoşulub', tgNoBot: 'Bildiriş botu hələ qurulmayıb.',
      tgFail: 'Telegram keçidi yaradıla bilmədi.', tgBot: 'QR bildirişləri üçün Telegram bot', tgBotHelp: 'Botun @ olmadan istifadəçi adı. «Telegram qoş» düyməsi üçün.', save: 'Saxla', saved: 'Saxlanıldı.'
    }
  };
  const t = (k, vars) => {
    let s = (TX[lang()] || TX.ru)[k] ?? TX.ru[k] ?? k;
    if (vars) Object.entries(vars).forEach(([a, b]) => { s = s.split(`{${a}}`).join(b); });
    return s;
  };
  const fmtDate = (iso) => {
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d.toLocaleString(lang() === 'en' ? 'en-GB' : lang() === 'az' ? 'az-Latn-AZ' : 'ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
  };

  /* ───────── settings panel ───────── */
  const wrap = q('#stkSettingsWrap'), gear = q('#stkGear'), panel = q('#stkSettings');
  const scrim = document.createElement('div'); scrim.className = 'stk-scrim'; scrim.hidden = true; document.body.append(scrim);
  // The nav has backdrop-filter, which would trap a fixed panel inside it: the panel lives in <body> instead.
  if (panel) document.body.append(panel);
  const sheet = () => matchMedia('(max-width: 680px)').matches;
  function placePanel() {
    if (!panel || !gear) return;
    if (sheet()) { panel.style.top = ''; panel.style.right = ''; return; }
    const g = gear.getBoundingClientRect();
    panel.style.top = `${Math.round(g.bottom + 10)}px`;
    panel.style.right = `${Math.max(8, Math.round(document.documentElement.clientWidth - g.right))}px`;
  }
  addEventListener('resize', () => { if (panel?.classList.contains('is-open')) placePanel(); });
  let closeTimer = 0;
  const isOpen = () => panel?.classList.contains('is-open');
  function openPanel(open) {
    if (!panel || !gear || open === isOpen()) return;
    clearTimeout(closeTimer);
    gear.setAttribute('aria-expanded', String(open));
    gear.classList.toggle('is-open', open);
    if (open) {
      panel.hidden = false; scrim.hidden = false;
      syncSettings(); renderPromoBox(); placePanel();
      requestAnimationFrame(() => { panel.classList.add('is-open'); scrim.classList.add('is-open'); });
      setTimeout(() => (q('button[aria-pressed="true"]', panel) || q('button', panel))?.focus({ preventScroll: true }), 60);
    } else {
      panel.classList.remove('is-open'); scrim.classList.remove('is-open');
      closeTimer = setTimeout(() => { if (!isOpen()) { panel.hidden = true; scrim.hidden = true; } }, motionOff() ? 0 : 240);
    }
  }
  gear?.addEventListener('click', () => openPanel(!isOpen()));
  q('[data-stk-close]', panel || document)?.addEventListener('click', () => { openPanel(false); gear?.focus(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) { e.preventDefault(); openPanel(false); gear?.focus(); } });
  document.addEventListener('pointerdown', (e) => { if (isOpen() && !wrap?.contains(e.target) && !panel.contains(e.target)) openPanel(false); });

  function syncSettings() {
    if (!panel) return;
    qa('[data-stk]', panel).forEach((el) => { el.textContent = t(el.dataset.stk); });
    gear?.setAttribute('aria-label', t('settings'));
    q('[data-stk-close]', panel)?.setAttribute('aria-label', t('close'));
    const input = q('#stkPromoInput'); if (input) input.placeholder = t('promoPh');
    let theme = 'system'; try { theme = localStorage.getItem('pdd.theme') || 'system'; } catch { /* storage blocked */ }
    qa('#stkTheme button', panel).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === theme)));
    qa('#stkLang button', panel).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.stkLang === lang())));
    q('#stkMotion')?.setAttribute('aria-checked', String(!root.classList.contains('stk-motion-off')));
  }
  // Theme: the existing A.theme does the work; this only adds a short colour cross-fade.
  q('#stkTheme')?.addEventListener('click', (e) => {
    if (!e.target.closest('button[data-v]')) return;
    if (!motionOff()) { root.classList.add('stk-theme-shift'); setTimeout(() => root.classList.remove('stk-theme-shift'), 450); }
    setTimeout(syncSettings, 0);
  });
  // Language: reuse the existing switcher so every translation layer updates exactly as before.
  q('#stkLang')?.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-stk-lang]'); if (!b) return;
    q(`#langDropdown button[data-lang="${b.dataset.stkLang}"]`)?.click();
    setTimeout(() => { syncSettings(); renderPromoBox(); renderCartPromo(); syncTelegramButton(); renderAdminPromos(); }, 0);
  });
  q('.lang-dropdown')?.addEventListener('click', () => setTimeout(() => { syncSettings(); renderCartPromo(); syncTelegramButton(); }, 0));
  q('#stkMotion')?.addEventListener('click', () => {
    const off = !root.classList.contains('stk-motion-off');
    root.classList.toggle('stk-motion-off', off);
    try { if (off) localStorage.setItem('stk.motion', 'off'); else localStorage.removeItem('stk.motion'); } catch { /* storage blocked */ }
    window.dispatchEvent(new Event('stacked:motion'));
    syncSettings();
  });

  /* ───────── promo: customer state ───────── */
  const PKEY = 'stk.promo';
  let promo = null;
  try { promo = JSON.parse(localStorage.getItem(PKEY) || 'null'); } catch { promo = null; }
  if (!promo || typeof promo.code !== 'string') promo = null;
  const savePromo = () => { try { if (promo) localStorage.setItem(PKEY, JSON.stringify(promo)); else localStorage.removeItem(PKEY); } catch { /* storage blocked */ } };
  let promoMsg = null; // {kind: 'error'|'pending', text}

  // Display-only estimate from current catalog prices; the server recomputes everything at checkout.
  function estimate() {
    if (!promo) return null;
    const L = lines(), sub = r2(L.reduce((a, l) => a + l.qty * Number(l.p.price), 0));
    const pid = promo.product?.id ? String(promo.product.id) : '';
    const pl = pid ? L.find((l) => String(l.p.id) === pid) : null;
    const scoped = promo.type === 'free_product' || promo.scope === 'product';
    const eligible = scoped ? (pl ? pl.qty * Number(pl.p.price) : 0) : sub;
    let d = 0;
    if (eligible > 0) {
      if (promo.type === 'percent') d = r2((eligible * Number(promo.percent)) / 100);
      else if (promo.type === 'fixed') d = Math.min(Number(promo.amount), eligible);
      else d = Number(pl.p.price);
    }
    d = r2(Math.min(d, sub));
    return { subtotal: sub, discount: d, total: r2(sub - d), applicable: eligible > 0, freeId: promo.type === 'free_product' && pl ? pid : '' };
  }
  function terms(p) {
    const name = p.product?.name || '';
    const v = p.type === 'percent' ? String(Number(p.percent)) : money(p.amount);
    if (p.type === 'free_product') return t('free', { p: name });
    if (p.type === 'percent') return p.scope === 'product' ? t('pctProduct', { v, p: name }) : t('pctCart', { v });
    return p.scope === 'product' ? t('fixProduct', { v, p: name }) : t('fixCart', { v });
  }
  const reasonText = (reason) => ({ invalid: t('invalid'), already_used: t('used'), rate_limited: t('rate'), auth_required: t('auth'), out_of_stock: t('outGift') })[reason] || t('invalid');

  async function applyPromo(raw, source) {
    const code = String(raw || '').trim();
    if (!code) { promoMsg = { kind: 'error', text: t('empty') }; renderPromoUI(); return; }
    if (!S.user) { promoMsg = { kind: 'error', text: t('auth') }; renderPromoUI(); return; }
    promoMsg = { kind: 'pending', text: t('checking') }; renderPromoUI();
    const buttons = qa('#stkPromoApply, .stk-cart-promo-form button'); buttons.forEach((b) => { b.disabled = true; });
    try {
      const { data, error } = await _supabase.rpc('stackd_promo_preview', { p_code: code, p_items: S.cart.map((x) => ({ id: x.id, qty: x.qty })) });
      if (error) { console.error('promo preview failed', error); promoMsg = { kind: 'error', text: t('unavailable') }; return; }
      if (!data?.ok) { promoMsg = { kind: 'error', text: reasonText(data?.reason) }; return; }
      promo = { code: data.code, title: data.title, description: data.description || '', type: data.type, percent: data.percent, amount: data.amount, scope: data.scope, ends_at: data.ends_at, product: data.product || null };
      savePromo(); promoMsg = null;
      if (promo.type === 'free_product' && promo.product?.id) {
        const pid = String(promo.product.id);
        if (!S.cart.some((x) => String(x.id) === pid)) {
          if (promo.product.purchasable && typeof find === 'function' && find(pid)) { A.add(pid); toast(t('freeAdded', { p: promo.product.name })); }
          else promoMsg = { kind: 'error', text: t('outGift') };
        }
      }
      q('#stkPromoInput') && (q('#stkPromoInput').value = '');
      if (source === 'cart') q('.stk-cart-promo')?.classList.add('is-applied-now');
    } catch (e) {
      console.error('promo preview failed', e); promoMsg = { kind: 'error', text: t('unavailable') };
    } finally {
      buttons.forEach((b) => { b.disabled = false; });
      renderCart();
      renderPromoUI();
    }
  }
  function clearPromo() { promo = null; promoMsg = null; savePromo(); renderCart(); renderPromoUI(); }
  q('#stkPromoForm')?.addEventListener('submit', (e) => { e.preventDefault(); applyPromo(q('#stkPromoInput')?.value, 'settings'); });

  function promoCard(compact) {
    const est = estimate();
    let note = '';
    if (est && !est.applicable) note = promo.product?.name && (promo.scope === 'product' || promo.type === 'free_product') ? t('needProduct', { p: promo.product.name }) : t('needCart');
    else if (!compact && est && est.discount > 0) note = t('saving', { v: money(est.discount) });
    return `<div class="stk-promo-card${est && !est.applicable ? ' is-idle' : ''}">
      <div class="stk-promo-top"><span class="stk-code">${h(promo.code)}</span><button type="button" class="stk-link" data-stk-promo-remove>${h(t('remove'))}</button></div>
      ${compact ? '' : `<strong class="stk-promo-title">${h(promo.title)}</strong>`}
      <p class="stk-promo-terms">${h(terms(promo))}${promo.ends_at ? ` · ${h(t('until', { d: fmtDate(promo.ends_at) }))}` : ''}</p>
      ${note ? `<p class="stk-promo-note">${h(note)}</p>` : ''}
    </div>`;
  }
  function renderPromoBox() {
    const box = q('#stkPromoResult'); if (!box) return;
    const form = q('#stkPromoForm'); if (form) form.hidden = Boolean(promo);
    box.innerHTML = (promo ? promoCard(false) : '') + (promoMsg ? `<p class="stk-msg is-${promoMsg.kind}">${h(promoMsg.text)}</p>` : '');
  }
  document.addEventListener('click', (e) => { if (e.target.closest('[data-stk-promo-remove]')) clearPromo(); });

  /* ───────── promo: cart drawer (summary, inline code entry, free item marker) ───────── */
  function renderCartPromo() {
    const footer = q('#drawer footer'), totalRow = footer && q('.total', footer);
    if (!footer || !totalRow) return;
    let box = q('.stk-cart-promo', footer);
    if (!box) { box = document.createElement('div'); box.className = 'stk-cart-promo'; footer.insertBefore(box, totalRow); }
    const est = estimate(), hasLines = lines().length > 0;
    qa('#lines .stk-free-tag').forEach((n) => n.remove());
    qa('#lines li.is-free').forEach((n) => n.classList.remove('is-free'));
    if (est?.freeId) {
      const li = q(`#lines li[data-id="${CSS.escape(est.freeId)}"]`);
      if (li) { li.classList.add('is-free'); const name = q('strong', li); name?.insertAdjacentHTML('afterend', `<span class="stk-free-tag">${h(t('freeTag'))}</span>`); }
    }
    const total = q('#total');
    if (promo && hasLines) {
      const open = box.classList.contains('is-applied-now');
      box.innerHTML = `${promoCard(true)}
        <div class="stk-sum"><span>${h(t('subtotal'))}</span><span>${money(est.subtotal)}</span></div>
        ${est.discount > 0 ? `<div class="stk-sum is-discount"><span>${h(t('discount'))}</span><span>−${money(est.discount)}</span></div>` : ''}`;
      box.classList.toggle('is-applied-now', open);
      if (total) total.textContent = money(est.total);
    } else if (hasLines) {
      const expanded = box.dataset.expanded === '1';
      box.innerHTML = expanded
        ? `<form class="stk-cart-promo-form" novalidate><input type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="40" placeholder="${h(t('promoPh'))}" aria-label="${h(t('promo'))}"><button type="submit" class="btn btn-ghost">${h(t('apply'))}</button></form>${promoMsg ? `<p class="stk-msg is-${promoMsg.kind}">${h(promoMsg.text)}</p>` : ''}`
        : `<button type="button" class="stk-link stk-cart-promo-add">${h(t('havePromo'))}</button>`;
    } else box.innerHTML = '';
    const dockTotal = q('#stackedDock .stacked-dock-info small');
    if (dockTotal && est && hasLines) dockTotal.textContent = money(est.total);
  }
  q('#drawer')?.addEventListener('click', (e) => {
    const add = e.target.closest('.stk-cart-promo-add');
    if (add) { const box = add.closest('.stk-cart-promo'); box.dataset.expanded = '1'; renderCartPromo(); q('input', box)?.focus(); }
  });
  q('#drawer')?.addEventListener('submit', (e) => {
    const form = e.target.closest('.stk-cart-promo-form'); if (!form) return;
    e.preventDefault(); applyPromo(q('input', form)?.value, 'cart');
  });
  function renderPromoUI() { renderPromoBox(); renderCartPromo(); }
  const prevRender = renderCart;
  renderCart = function stkRenderCart() { const r = prevRender.apply(this, arguments); try { renderCartPromo(); } catch (e) { console.error(e); } return r; };

  /* ───────── checkout bridge used by app.js checkout() ───────── */
  let pendingRequest = null; // reused only for retries of the very same cart after a network failure
  const promoError = (msg) => ({ PROMO_INVALID: t('invalid'), PROMO_ALREADY_USED: t('used'), PROMO_RATE_LIMITED: t('rate'), PROMO_NOT_APPLICABLE: t('notApplicableCheckout') })[msg];
  window.stackdPlaceOrder = async (items) => {
    const est = estimate();
    if (promo && est && !est.applicable) return { data: null, error: { message: t('notApplicableCheckout') } };
    const code = promo ? promo.code : null;
    const sig = JSON.stringify([items, code]);
    if (!pendingRequest || pendingRequest.sig !== sig) pendingRequest = { id: crypto.randomUUID(), sig };
    const res = await _supabase.rpc('stackd_checkout', { p_items: items, p_promo_code: code, p_request_id: pendingRequest.id });
    if (!res.error) { pendingRequest = null; return { data: res.data, error: null }; }
    if (res.error.code === 'PGRST202' && !code) { pendingRequest = null; return _supabase.rpc('checkout_order', { cart_items: items }); }
    if (res.error.code) pendingRequest = null; // a server answer: the next attempt is a new request
    const mapped = res.error.code === 'PGRST202' ? t('unavailable') : promoError(res.error.message);
    if (res.error.message === 'PROMO_INVALID' || res.error.message === 'PROMO_ALREADY_USED') { promo = null; savePromo(); setTimeout(renderPromoUI, 0); }
    return { data: null, error: mapped ? { message: mapped } : res.error };
  };
  document.addEventListener('stackd:order-placed', () => { promo = null; promoMsg = null; savePromo(); renderPromoUI(); });

  /* ───────── Telegram link (profile menu) ───────── */
  let tgBot = '', tgLinked = false, tgAvailable = true;
  async function loadTelegramSettings() {
    try { const { data } = await _supabase.from('site_settings').select('value').eq('key', 'telegram_bot').maybeSingle(); tgBot = String(data?.value || '').replace(/^@/, '').trim(); } catch { tgBot = ''; }
    const input = q('#stkTgBot'); if (input) input.value = tgBot;
    syncTelegramButton();
  }
  async function refreshTelegram() {
    tgLinked = false;
    if (S.user) {
      const { data, error } = await _supabase.from('telegram_links').select('user_id').eq('user_id', S.user.id).maybeSingle();
      tgAvailable = !error; tgLinked = Boolean(data);
    }
    syncTelegramButton();
  }
  function syncTelegramButton() {
    const b = q('#stackdTelegramLink'); if (!b) return;
    b.hidden = !S.user || !tgAvailable || !tgBot;
    b.textContent = tgLinked ? t('tgLinked') : t('tgLink');
    b.classList.toggle('is-linked', tgLinked);
  }
  A['tg-link'] = async () => {
    if (!S.user) { A.auth?.(); return; }
    if (!tgBot || !/^[A-Za-z0-9_]{5,32}$/.test(tgBot)) { toast(t('tgNoBot')); return; }
    const win = window.open('about:blank', '_blank'); // opened synchronously so popup blockers allow it
    const { data, error } = await _supabase.rpc('stackd_telegram_link_token');
    if (error || !/^[0-9a-f]{32}$/.test(String(data))) { win?.close(); toast(t('tgFail')); return; }
    const url = `https://t.me/${tgBot}?start=link_${data}`;
    if (win) { win.opener = null; win.location.href = url; } else location.href = url;
  };
  _supabase.auth.onAuthStateChange(() => setTimeout(() => { refreshTelegram(); renderPromoUI(); }, 0));
  loadTelegramSettings(); refreshTelegram();

  /* ───────── first catalog reveal + category switch ───────── */
  const grid = q('#grid');
  if (grid) {
    const cascade = () => {
      if (!grid.querySelector('.card')) return false;
      if (q('#stackedSplash') || root.classList.contains('stk-reveal') || motionOff()) return true; // the page reveal covers it
      grid.classList.add('stk-cards-in'); setTimeout(() => grid.classList.remove('stk-cards-in'), 1100);
      return true;
    };
    if (!cascade()) { const mo = new MutationObserver(() => { if (cascade()) mo.disconnect(); }); mo.observe(grid, { childList: true }); setTimeout(() => mo.disconnect(), 15000); }
    q('#chips')?.addEventListener('click', (e) => {
      if (!e.target.closest('[data-act="cat"]') || motionOff()) return;
      grid.classList.remove('stk-swap'); void grid.offsetWidth; grid.classList.add('stk-swap');
      setTimeout(() => grid.classList.remove('stk-swap'), 600);
    });
  }

  /* ───────── admin: promo codes tab ───────── */
  const AT = {
    ru: { title: 'Промокоды', create: 'Новый промокод', edit: 'Редактирование', editBtn: 'Изменить', perUserShort: 'на пользователя', code: 'Код', name: 'Название', desc: 'Описание (необязательно)', type: 'Тип', percent: 'Процент', fixed: 'Фиксированная', free: 'Бесплатный товар', value: 'Размер скидки', valuePct: 'Скидка, %', valueAzn: 'Скидка, AZN', scope: 'Область', scopeCart: 'Вся корзина', scopeProduct: 'Выбранный товар', product: 'Товар', maxUses: 'Лимит использований', unlimited: 'без лимита', perUser: 'На одного пользователя', starts: 'Начало', ends: 'Окончание', active: 'Активен', save: 'Сохранить', cancel: 'Отмена', used: 'использовано', left: 'осталось', on: 'Активен', off: 'Выключен', expired: 'Истёк', scheduled: 'Запланирован', exhausted: 'Исчерпан', archived: 'В архиве', archive: 'В архив', restore: 'Вернуть', del: 'Удалить', delConfirm: 'Удалить промокод {c}? Это действие нельзя отменить.', hasHistory: 'У промокода есть история заказов — он перенесён в архив.', showArchived: 'Показать архив', empty: 'Промокодов пока нет.', missing: 'Таблица промокодов не найдена. Примените миграцию supabase/migrations/20261112120000_promo_codes.sql в Supabase.', errCode: 'Код: 3–40 символов без пробелов.', errValue: 'Укажите корректный размер скидки.', errProduct: 'Выберите товар.', errDates: 'Дата окончания должна быть позже начала.', dup: 'Такой код уже существует.', savedOk: 'Промокод сохранён.', saveFail: 'Не удалось сохранить: ' },
    en: { title: 'Promo codes', create: 'New promo code', edit: 'Edit promo code', editBtn: 'Edit', perUserShort: 'per user', code: 'Code', name: 'Display name', desc: 'Description (optional)', type: 'Type', percent: 'Percentage', fixed: 'Fixed amount', free: 'Free product', value: 'Discount', valuePct: 'Discount, %', valueAzn: 'Discount, AZN', scope: 'Applies to', scopeCart: 'Whole cart', scopeProduct: 'Selected product', product: 'Product', maxUses: 'Total uses', unlimited: 'unlimited', perUser: 'Per user', starts: 'Starts', ends: 'Ends', active: 'Active', save: 'Save', cancel: 'Cancel', used: 'used', left: 'left', on: 'Active', off: 'Disabled', expired: 'Expired', scheduled: 'Scheduled', exhausted: 'Exhausted', archived: 'Archived', archive: 'Archive', restore: 'Restore', del: 'Delete', delConfirm: 'Delete promo code {c}? This cannot be undone.', hasHistory: 'This code has order history, so it was archived instead.', showArchived: 'Show archive', empty: 'No promo codes yet.', missing: 'Promo table not found. Apply supabase/migrations/20261112120000_promo_codes.sql in Supabase.', errCode: 'Code: 3–40 characters, no spaces.', errValue: 'Enter a valid discount.', errProduct: 'Choose a product.', errDates: 'End date must be after the start date.', dup: 'This code already exists.', savedOk: 'Promo code saved.', saveFail: 'Could not save: ' },
    az: { title: 'Promokodlar', create: 'Yeni promokod', edit: 'Redaktə', editBtn: 'Dəyiş', perUserShort: 'hər istifadəçiyə', code: 'Kod', name: 'Ad', desc: 'Təsvir (istəyə görə)', type: 'Növ', percent: 'Faiz', fixed: 'Sabit məbləğ', free: 'Pulsuz məhsul', value: 'Endirim', valuePct: 'Endirim, %', valueAzn: 'Endirim, AZN', scope: 'Tətbiq sahəsi', scopeCart: 'Bütün səbət', scopeProduct: 'Seçilmiş məhsul', product: 'Məhsul', maxUses: 'İstifadə limiti', unlimited: 'limitsiz', perUser: 'Bir istifadəçiyə', starts: 'Başlanğıc', ends: 'Bitmə', active: 'Aktiv', save: 'Saxla', cancel: 'Ləğv et', used: 'istifadə', left: 'qalıb', on: 'Aktiv', off: 'Söndürülüb', expired: 'Bitib', scheduled: 'Planlaşdırılıb', exhausted: 'Tükənib', archived: 'Arxivdə', archive: 'Arxivə', restore: 'Qaytar', del: 'Sil', delConfirm: '{c} promokodu silinsin? Bu geri qaytarılmır.', hasHistory: 'Promokodun sifariş tarixçəsi var — arxivə köçürüldü.', showArchived: 'Arxivi göstər', empty: 'Hələ promokod yoxdur.', missing: 'Promokod cədvəli tapılmadı. Supabase-də supabase/migrations/20261112120000_promo_codes.sql miqrasiyasını tətbiq edin.', errCode: 'Kod: 3–40 simvol, boşluqsuz.', errValue: 'Düzgün endirim daxil edin.', errProduct: 'Məhsul seçin.', errDates: 'Bitmə tarixi başlanğıcdan sonra olmalıdır.', dup: 'Bu kod artıq mövcuddur.', savedOk: 'Promokod saxlanıldı.', saveFail: 'Saxlanılmadı: ' }
  };
  const at = (k, vars) => { let s = (AT[lang()] || AT.ru)[k] ?? AT.ru[k] ?? k; if (vars) Object.entries(vars).forEach(([a, b]) => { s = s.split(`{${a}}`).join(b); }); return s; };
  const tab = q('#tab-promos'), tabBtn = q('#stkPromoTabBtn');
  let adminRows = [], adminState = 'idle', editing = null, showArchived = false, adminMsg = '';
  const toLocalInput = (iso) => { if (!iso) return ''; const d = new Date(iso); if (!Number.isFinite(d.getTime())) return ''; const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
  function statusOf(r) {
    const now = Date.now();
    if (r.archived_at) return 'archived';
    if (!r.active) return 'off';
    if (r.ends_at && new Date(r.ends_at).getTime() <= now) return 'expired';
    if (r.starts_at && new Date(r.starts_at).getTime() > now) return 'scheduled';
    if (r.max_uses && r.uses_count >= r.max_uses) return 'exhausted';
    return 'on';
  }
  const productName = (id) => (S.products || []).find((p) => String(p.id) === String(id))?.name || '—';
  function rowTerms(r) {
    const p = { type: r.discount_type, percent: r.percent_off, amount: r.amount_off, scope: r.scope, product: { name: productName(r.product_id) } };
    return terms(p);
  }
  async function loadAdminPromos() {
    if (!tab || !isAdmin()) return;
    adminState = 'loading'; renderAdminPromos();
    const { data, error } = await _supabase.from('promo_codes').select('id,code,title,description,discount_type,percent_off,amount_off,scope,product_id,max_uses,max_uses_per_user,uses_count,starts_at,ends_at,active,archived_at,created_at').order('created_at', { ascending: false });
    if (error) { adminState = error.code === 'PGRST205' || error.code === '42P01' ? 'missing' : 'error'; adminMsg = error.message || ''; renderAdminPromos(); return; }
    adminRows = data || []; adminState = 'ready'; renderAdminPromos();
  }
  function formHtml(r) {
    const type = r?.discount_type || 'percent', scope = r?.scope || 'cart';
    const products = (S.products || []).map((p) => `<option value="${h(p.id)}"${String(p.id) === String(r?.product_id) ? ' selected' : ''}>${h(p.name)} · ${money(p.price)}</option>`).join('');
    return `<form class="stk-pform" data-type="${h(type)}" data-scope="${h(scope)}" novalidate>
      <div class="stk-pform-head"><strong>${h(r?.id ? at('edit') : at('create'))}</strong></div>
      <div class="stk-pgrid">
        <label>${h(at('code'))}<input name="code" required maxlength="40" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${h(r?.code || '')}" placeholder="STACKED!"></label>
        <label>${h(at('name'))}<input name="title" required maxlength="80" value="${h(r?.title || '')}" placeholder="STACKED Special Offer"></label>
        <label class="is-wide">${h(at('desc'))}<input name="description" maxlength="200" value="${h(r?.description || '')}"></label>
      </div>
      <fieldset class="stk-pseg"><legend>${h(at('type'))}</legend><div class="stk-pseg-opts">
        ${['percent', 'fixed', 'free_product'].map((v) => `<label><input type="radio" name="discount_type" value="${v}"${type === v ? ' checked' : ''}><span>${h(at(v === 'free_product' ? 'free' : v))}</span></label>`).join('')}</div>
      </fieldset>
      <div class="stk-pgrid">
        <label class="stk-only-pct">${h(at('valuePct'))}<input name="percent_off" type="number" inputmode="decimal" min="1" max="100" step="1" value="${h(r?.percent_off ?? 20)}"></label>
        <label class="stk-only-fixed">${h(at('valueAzn'))}<input name="amount_off" type="number" inputmode="decimal" min="0.01" step="0.01" value="${h(r?.amount_off ?? 2)}"></label>
        <label class="stk-only-scope">${h(at('scope'))}<select name="scope"><option value="cart"${scope === 'cart' ? ' selected' : ''}>${h(at('scopeCart'))}</option><option value="product"${scope === 'product' ? ' selected' : ''}>${h(at('scopeProduct'))}</option></select></label>
        <label class="stk-only-product">${h(at('product'))}<select name="product_id"><option value="">—</option>${products}</select></label>
      </div>
      <div class="stk-pgrid">
        <label>${h(at('maxUses'))}<input name="max_uses" type="number" inputmode="numeric" min="1" step="1" value="${h(r?.max_uses ?? '')}" placeholder="${h(at('unlimited'))}"></label>
        <label>${h(at('perUser'))}<input name="max_uses_per_user" type="number" inputmode="numeric" min="1" step="1" value="${h(r?.max_uses_per_user ?? 1)}"></label>
        <label>${h(at('starts'))}<input name="starts_at" type="datetime-local" value="${h(toLocalInput(r?.starts_at))}"></label>
        <label>${h(at('ends'))}<input name="ends_at" type="datetime-local" value="${h(toLocalInput(r?.ends_at))}"></label>
      </div>
      <label class="stk-pcheck"><input type="checkbox" name="active"${r?.active === false ? '' : ' checked'}> ${h(at('active'))}</label>
      <p class="stk-msg is-error" data-pform-msg hidden></p>
      <div class="stk-pactions"><button type="button" class="btn btn-ghost" data-promo-cancel>${h(at('cancel'))}</button><button type="submit" class="btn btn-primary">${h(at('save'))}</button></div>
    </form>`;
  }
  function renderAdminPromos() {
    if (!tab) return;
    if (tabBtn) tabBtn.textContent = at('title');
    const head = `<div class="stk-padmin-head"><h3>${h(at('title'))}</h3><div><label class="stk-pcheck"><input type="checkbox" data-promo-archived${showArchived ? ' checked' : ''}> ${h(at('showArchived'))}</label><button type="button" class="btn btn-primary sm" data-promo-new>${h(at('create'))}</button></div></div>`;
    if (adminState === 'missing') { tab.innerHTML = `${head}<p class="stk-msg is-error">${h(at('missing'))}</p>`; return; }
    if (adminState === 'error') { tab.innerHTML = `${head}<p class="stk-msg is-error">${h(adminMsg)}</p>`; return; }
    if (adminState === 'loading' && !adminRows.length) { tab.innerHTML = `${head}<p class="stk-msg">…</p>`; return; }
    const rows = adminRows.filter((r) => showArchived || !r.archived_at);
    const list = rows.length ? rows.map((r) => {
      const st = statusOf(r), left = r.max_uses ? Math.max(0, r.max_uses - r.uses_count) : null;
      return `<li class="stk-prow" data-promo-id="${h(r.id)}" data-status="${st}">
        <div class="stk-prow-main"><span class="stk-code">${h(r.code)}</span><strong>${h(r.title)}</strong><small>${h(rowTerms(r))}</small></div>
        <div class="stk-prow-meta">
          <span class="stk-pill is-${st}">${h(at(st))}</span>
          <span class="stk-usage"><b>${r.uses_count}</b>${r.max_uses ? ` / ${r.max_uses}` : ''} ${h(at('used'))}${left !== null ? ` · ${left} ${h(at('left'))}` : ''} · ${r.max_uses_per_user}× ${h(at('perUserShort'))}</span>
          ${r.starts_at || r.ends_at ? `<span class="stk-dates">${h(r.starts_at ? fmtDate(r.starts_at) : '…')} — ${h(r.ends_at ? fmtDate(r.ends_at) : '…')}</span>` : ''}
        </div>
        <div class="stk-prow-actions">
          ${r.archived_at ? `<button type="button" class="btn btn-ghost sm" data-promo-restore>${h(at('restore'))}</button>` : `<button type="button" class="stk-switch sm" role="switch" aria-checked="${r.active}" aria-label="${h(at('active'))}" data-promo-toggle><span></span></button><button type="button" class="btn btn-ghost sm" data-promo-edit>${h(at('editBtn'))}</button>`}
          ${r.uses_count === 0 ? `<button type="button" class="btn btn-ghost sm stk-danger" data-promo-delete>${h(at('del'))}</button>` : r.archived_at ? '' : `<button type="button" class="btn btn-ghost sm" data-promo-archive>${h(at('archive'))}</button>`}
        </div>
      </li>`;
    }).join('') : `<li class="stk-pempty">${h(at('empty'))}</li>`;
    const okMsg = adminMsg && adminState === 'ready' ? `<p class="stk-msg is-ok">${h(adminMsg)}</p>` : '';
    tab.innerHTML = `${head}${okMsg}${editing ? formHtml(editing === 'new' ? null : editing) : ''}<ul class="stk-plist">${list}</ul>`;
  }
  const rowById = (el) => adminRows.find((r) => r.id === el.closest('[data-promo-id]')?.dataset.promoId);
  async function updatePromo(id, patch) {
    const { error } = await _supabase.from('promo_codes').update(patch).eq('id', id);
    if (error) { toast(at('saveFail') + error.message); return false; }
    return true;
  }
  tab?.addEventListener('change', (e) => {
    const form = e.target.closest('.stk-pform');
    if (form && e.target.name === 'discount_type') form.dataset.type = e.target.value;
    if (form && e.target.name === 'scope') form.dataset.scope = e.target.value;
    if (e.target.matches('[data-promo-archived]')) { showArchived = e.target.checked; renderAdminPromos(); }
  });
  tab?.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.matches('[data-promo-new]')) { editing = 'new'; adminMsg = ''; renderAdminPromos(); q('.stk-pform input[name="code"]', tab)?.focus(); return; }
    if (b.matches('[data-promo-cancel]')) { editing = null; renderAdminPromos(); return; }
    const r = rowById(b); if (!r) return;
    if (b.matches('[data-promo-edit]')) { editing = r; adminMsg = ''; renderAdminPromos(); q('.stk-pform', tab)?.scrollIntoView({ block: 'nearest', behavior: motionOff() ? 'auto' : 'smooth' }); return; }
    b.disabled = true;
    if (b.matches('[data-promo-toggle]')) { b.setAttribute('aria-checked', String(!r.active)); if (!(await updatePromo(r.id, { active: !r.active }))) b.setAttribute('aria-checked', String(r.active)); }
    else if (b.matches('[data-promo-archive]')) await updatePromo(r.id, { archived_at: new Date().toISOString(), active: false });
    else if (b.matches('[data-promo-restore]')) await updatePromo(r.id, { archived_at: null });
    else if (b.matches('[data-promo-delete]')) {
      if (!confirm(at('delConfirm', { c: r.code }))) { b.disabled = false; return; }
      const { error } = await _supabase.from('promo_codes').delete().eq('id', r.id);
      if (error?.code === '23503') { await updatePromo(r.id, { archived_at: new Date().toISOString(), active: false }); toast(at('hasHistory')); }
      else if (error) toast(at('saveFail') + error.message);
    }
    loadAdminPromos();
  });
  tab?.addEventListener('submit', async (e) => {
    const form = e.target.closest('.stk-pform'); if (!form) return;
    e.preventDefault();
    const f = new FormData(form), msg = q('[data-pform-msg]', form);
    const fail = (text) => { msg.textContent = text; msg.hidden = false; };
    const type = f.get('discount_type'), scope = type === 'free_product' ? 'product' : f.get('scope');
    const code = String(f.get('code') || '').trim();
    if (code.length < 3 || code.length > 40 || /\s/.test(code)) return fail(at('errCode'));
    const num = (k) => { const v = String(f.get(k) || '').trim(); return v === '' ? null : Number(v); };
    const payload = {
      code, title: String(f.get('title') || '').trim() || code, description: String(f.get('description') || '').trim() || null,
      discount_type: type, scope, percent_off: type === 'percent' ? num('percent_off') : null, amount_off: type === 'fixed' ? num('amount_off') : null,
      product_id: scope === 'product' ? (String(f.get('product_id') || '') || null) : null,
      max_uses: num('max_uses'), max_uses_per_user: num('max_uses_per_user') || 1,
      starts_at: f.get('starts_at') ? new Date(String(f.get('starts_at'))).toISOString() : null,
      ends_at: f.get('ends_at') ? new Date(String(f.get('ends_at'))).toISOString() : null,
      active: f.get('active') === 'on'
    };
    if (type === 'percent' && !(payload.percent_off > 0 && payload.percent_off <= 100)) return fail(at('errValue'));
    if (type === 'fixed' && !(payload.amount_off > 0)) return fail(at('errValue'));
    if (scope === 'product' && !payload.product_id) return fail(at('errProduct'));
    if (payload.max_uses !== null && !(Number.isInteger(payload.max_uses) && payload.max_uses > 0)) return fail(at('errValue'));
    if (!(Number.isInteger(payload.max_uses_per_user) && payload.max_uses_per_user > 0)) return fail(at('errValue'));
    if (payload.starts_at && payload.ends_at && payload.ends_at <= payload.starts_at) return fail(at('errDates'));
    const submit = q('button[type="submit"]', form); submit.disabled = true;
    const isEdit = editing && editing !== 'new';
    const { error } = isEdit ? await _supabase.from('promo_codes').update(payload).eq('id', editing.id) : await _supabase.from('promo_codes').insert(payload);
    submit.disabled = false;
    if (error) return fail(error.code === '23505' ? at('dup') : at('saveFail') + error.message);
    editing = null; adminMsg = at('savedOk');
    loadAdminPromos();
  });
  tabBtn?.addEventListener('click', loadAdminPromos);
  if (tabBtn) tabBtn.textContent = at('title');

  /* ───────── admin: Telegram bot username (site_settings.telegram_bot) ───────── */
  const settingsTab = q('#tab-settings');
  if (settingsTab && !q('#stkTgBot')) {
    const box = document.createElement('div'); box.className = 'stk-tgbot';
    box.innerHTML = `<label for="stkTgBot" data-stk-a="tgBot"></label><p class="stk-hint" data-stk-a="tgBotHelp"></p><div class="stk-tgbot-row"><input id="stkTgBot" type="text" maxlength="32" autocomplete="off" spellcheck="false" placeholder="stackd_bot"><button type="button" class="btn btn-ghost" id="stkTgBotSave" data-stk-a="save"></button></div><p class="stk-msg" id="stkTgBotMsg" aria-live="polite"></p>`;
    settingsTab.append(box);
    const label = () => qa('[data-stk-a]', box).forEach((n) => { n.textContent = t(n.dataset.stkA); });
    label(); q('.lang-dropdown')?.addEventListener('click', () => setTimeout(label, 0)); q('#stkLang')?.addEventListener('click', () => setTimeout(label, 0));
    q('#stkTgBotSave')?.addEventListener('click', async () => {
      const v = String(q('#stkTgBot').value || '').replace(/^@/, '').trim(), m = q('#stkTgBotMsg');
      if (v && !/^[A-Za-z0-9_]{5,32}$/.test(v)) { m.textContent = 'Username: 5–32 [A-Za-z0-9_]'; return; }
      const { error } = await _supabase.from('site_settings').upsert([{ key: 'telegram_bot', value: v }], { onConflict: 'key' });
      m.textContent = error ? error.message : t('saved'); if (!error) { tgBot = v; syncTelegramButton(); }
    });
  }

  syncSettings(); renderPromoUI();
})();
