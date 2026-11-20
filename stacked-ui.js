/*
 * STAKED UI layer (loaded last). Adds, without touching data logic:
 *  - mobile tab bar (Shop / Orders / Top up) with a sliding indicator; Orders and Top up open as bottom sheets
 *    that rise from the tab bar, and switching tabs while a sheet is open swaps sheets in place;
 *  - small orange "stacking" loader (window.stLoader) used by checkout, top-up and pending orders;
 *  - balance count-up when the balance changes, and a pending top-up indicator that polls the user's own rows.
 */
(() => {
  'use strict';
  if (typeof S === 'undefined' || typeof _supabase === 'undefined') return;
  const $ = (s, r = document) => r.querySelector(s);
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const L = () => (['ru', 'en', 'az'].includes(S.lang) ? S.lang : 'ru');
  const TX = {
    ru: { shop: 'Магазин', orders: 'Заказы', topup: 'Пополнить', cart: 'Корзина', profile: 'Профиль', pending: 'Пополнение на проверке', credited: 'Баланс пополнен', pick: 'Выбрать', nofile: 'Скриншот не выбран' },
    en: { shop: 'Shop', orders: 'Orders', topup: 'Top up', cart: 'Cart', profile: 'Profile', pending: 'Top-up under review', credited: 'Balance topped up', pick: 'Choose', nofile: 'No screenshot selected' },
    az: { shop: 'Mağaza', orders: 'Sifarişlər', topup: 'Artır', cart: 'Səbət', profile: 'Profil', pending: 'Balans yoxlanılır', credited: 'Balans artırıldı', pick: 'Seç', nofile: 'Skrinşot seçilməyib' }
  };
  const t = (k) => TX[L()][k];

  window.stLoader = (cls = '') => `<span class="st-loader ${cls}" aria-hidden="true"><i></i></span>`;

  /* ───────── centred panels: orders, top-up, cart ─────────
     They open non-modally above a blurred scrim, so the tab bar stays on top and clickable. */
  const PANELS = ['orders', 'topup', 'drawer'];
  const scrim = document.createElement('div'); scrim.className = 'st-scrim'; scrim.setAttribute('aria-hidden', 'true');
  document.body.append(scrim);
  const openPanel = () => PANELS.map((id) => document.getElementById(id)).find((d) => d?.open && !d.classList.contains('closing'));
  const nativeShowModal = HTMLDialogElement.prototype.showModal;
  HTMLDialogElement.prototype.showModal = function stShowModal() {
    if (!PANELS.includes(this.id) || document.querySelector('dialog:modal')) return nativeShowModal.call(this);
    if (this.open) return;
    PANELS.forEach((id) => { const o = document.getElementById(id); if (o !== this && o?.open && !o.classList.contains('closing')) (typeof closeDlg === 'function' ? closeDlg(o) : o.close()); });
    this.setAttribute('aria-modal', 'true'); this.setAttribute('role', 'dialog');
    this.show();
    (this.querySelector('[autofocus]') || this.querySelector('[data-act="close"]'))?.focus({ preventScroll: true });
  };
  let syncT = 0;
  const syncScrim = () => { clearTimeout(syncT); syncT = setTimeout(() => {
    const on = !!openPanel(); scrim.classList.toggle('is-on', on); document.body.classList.toggle('st-locked', on);
  }, 30); };
  PANELS.forEach((id) => { const d = document.getElementById(id); if (d) new MutationObserver(syncScrim).observe(d, { attributes: true, attributeFilter: ['open', 'class'] }); });
  const dismiss = () => { const d = openPanel(); if (d) (typeof closeDlg === 'function' ? closeDlg(d) : d.close()); };
  scrim.addEventListener('click', dismiss);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !document.querySelector('dialog:modal') && openPanel()) { e.preventDefault(); dismiss(); } });

  /* ───────── tab bar ───────── */
  const ICONS = {
    shop: '<path d="M4 9.5V20h16V9.5"/><path d="M3 9.5 4.6 4h14.8L21 9.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z"/><path d="M10 20v-5h4v5"/>',
    orders: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/>',
    topup: '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/><path d="M16 14.5h2"/><path d="M12 2v3M10.5 3.5 12 2l1.5 1.5"/>',
    cart: '<path d="M3 4h2.2l2.1 10.4a1.6 1.6 0 0 0 1.6 1.3h7.9a1.6 1.6 0 0 0 1.6-1.2L20 8H6.1"/><circle cx="9.5" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>',
    profile: '<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0"/>'
  };
  const TABS = ['shop', 'orders', 'topup', 'cart', 'profile'];
  const bar = document.createElement('nav');
  bar.className = 'st-tabbar'; bar.setAttribute('aria-label', 'STAKED');
  bar.innerHTML = `<span class="st-tab-ind" aria-hidden="true"></span>${TABS.map((k) => `<button type="button" class="st-tab" data-tab="${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg><span class="st-tab-label"></span>${k === 'cart' ? '<b class="st-tab-badge" hidden>0</b>' : '<b class="st-tab-dot" hidden></b>'}</button>`).join('')}`;
  document.body.append(bar);
  document.body.classList.add('has-tabbar');
  const sheets = { orders: () => $('#orders'), topup: () => $('#topup') };

  // Keep the profile flyout outside #userProfile, which starts hidden until
  // the auth UI refreshes. This prevents the hidden header wrapper hiding it.
  const profileMenu = $('#stackdProfileMenu');
  const profileTrigger = $('#stackdProfileTrigger');
  if (profileMenu && profileMenu.parentElement !== document.body) document.body.append(profileMenu);

  function ensureProfileBalanceRow() {
    const menu = $('#stackdProfileMenu');
    if (!menu || $('#stackdProfileBalanceRow')) return;
    const row = document.createElement('div');
    row.id = 'stackdProfileBalanceRow';
    row.className = 'stackd-profile-balance-row';
    row.innerHTML = '<div><small id="stackdProfileBalanceLabel"></small><strong id="stackdProfileBalanceValue"></strong></div><button type="button" id="stackdProfileTopup"></button>';
    row.querySelector('small').textContent = S.lang === 'en' ? 'Balance' : S.lang === 'az' ? 'Balans' : 'Баланс';
    row.querySelector('strong').textContent = ($('#userBalance')?.textContent?.trim() || '0.00') + ' AZN';
    row.querySelector('button').textContent = S.lang === 'en' ? 'Top up' : S.lang === 'az' ? 'Artır' : 'Пополнить';
    menu.insertBefore(row, menu.querySelector('#myOrdersBtn') || menu.firstChild);
    row.querySelector('button').addEventListener('click', () => {
      menu.hidden = true;
      menu.setAttribute('aria-hidden', 'true');
      profileTrigger?.setAttribute('aria-expanded', 'false');
      setActive('topup');
      const dialog = $('#topup');
      if (dialog && !dialog.open) dialog.showModal();
    });
    const balance = $('#userBalance');
    if (balance && 'MutationObserver' in window) {
      new MutationObserver(() => {
        const value = $('#stackdProfileBalanceValue');
        if (value) value.textContent = (balance.textContent?.trim() || '0.00') + ' AZN';
      }).observe(balance, { childList: true, characterData: true, subtree: true });
    }
  }

  ensureProfileBalanceRow();
  let active = 'shop';
  function labels() {
    bar.querySelectorAll('.st-tab').forEach((b) => {
      const k = b.dataset.tab, el = b.querySelector('.st-tab-label');
      const money = k === 'topup' && S.user && $('#userBalance');
      el.textContent = money ? `${$('#userBalance').textContent} ₼` : t(k);
      b.setAttribute('aria-label', money ? `${t('topup')}: ${el.textContent}` : t(k));
    });
  }
  function setActive(k) {
    active = k;
    bar.style.setProperty('--i', TABS.indexOf(k));
    bar.querySelectorAll('.st-tab').forEach((b) => {
      const on = b.dataset.tab === k;
      b.setAttribute('aria-current', on ? 'page' : 'false');
      if (on && !reduced()) { b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump'); }
    });
  }
  const close = (d) => { if (d?.open) (typeof closeDlg === 'function' ? closeDlg(d) : d.close()); };
  async function go(k) {
    if (k === 'profile') {
      // Refresh the in-memory user if the persisted Supabase session restored first.
      if (!S.user) {
        try {
          const { data, error } = await _supabase.auth.getSession();
          if (error) throw error;
          S.user = data?.session?.user || null;
        } catch (error) {
          console.error('Profile session check failed:', error);
        }
      }
      if (!S.user) {
        const auth = $('#auth');
        if (auth && !auth.open) auth.showModal();
        return;
      }
      if (!profileMenu) {
        console.error('STAKED profile menu element is missing.');
        return;
      }
      ensureProfileBalanceRow();
      const opening = profileMenu.hidden;
      const currentPanel = openPanel();
      if (currentPanel) close(currentPanel);
      profileMenu.hidden = !opening;
      profileMenu.setAttribute('aria-hidden', String(!opening));
      profileTrigger?.setAttribute('aria-expanded', String(opening));
      setActive(opening ? 'profile' : 'shop');
      return;
    }
    if (profileMenu && !profileMenu.hidden) {
      profileMenu.hidden = true;
      profileMenu.setAttribute('aria-hidden', 'true');
      profileTrigger?.setAttribute('aria-expanded', 'false');
    }
    if (k === 'cart') {
      const dr = $('#drawer');
      if (dr?.open && !dr.classList.contains('closing')) { close(dr); return; }
      setActive('cart');
      if (typeof A !== 'undefined' && A['cart-open']) A['cart-open']();
      else dr?.showModal();
      return;
    }
    if (k === active && k !== 'shop') {
      const current = sheets[k]?.();
      if (current?.open) { close(current); return; }
      // An active indicator can outlive a closed dialog: allow the next tap to reopen it.
    }
    if (k !== 'shop' && !S.user) {
      try {
        const { data, error } = await _supabase.auth.getSession();
        if (error) throw error;
        S.user = data?.session?.user || null;
      } catch (error) {
        console.error('Navigation session check failed:', error);
      }
      if (!S.user) {
        const auth = $('#auth');
        if (auth && !auth.open) auth.showModal();
        return;
      }
    }
    setActive(k);
    if (k === 'shop') {
      const any = openPanel();
      if (any) { close(any); return; }
      $('#catalog')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    const next = sheets[k]?.();
    if (k === 'orders' && typeof openOrders === 'function') openOrders();
    else if (next && !next.open) next.showModal();
  }
  window.stakedSetTabActive = (key) => setActive(key);
  bar.addEventListener('click', (e) => { const b = e.target.closest('.st-tab'); if (b) go(b.dataset.tab); });
  document.addEventListener('click', (event) => {
    if (event.target.closest('.st-tab[data-tab="profile"]') || event.target.closest('.stackd-profile-anchor') || event.target.closest('.stackd-profile-menu')) return;
    const menu = $('#stackdProfileMenu');
    if (menu && !menu.hidden) { menu.hidden = true; $('#stackdProfileTrigger')?.setAttribute('aria-expanded', 'false'); if (active === 'profile') setActive('shop'); }
  });
  // A modal sheet sits in the top layer above the bar; a tap where the bar is drawn reaches the dialog's backdrop.
  window.addEventListener('click', (e) => {
    const d = document.querySelector('dialog[open]');
    if (!d || getComputedStyle(bar).display === 'none' || bar.contains(e.target) || (d.contains(e.target) && e.target !== d)) return;
    const r = bar.getBoundingClientRect();
    if (e.clientY < r.top || e.clientX < r.left || e.clientX > r.right) return;
    const hit = [...bar.querySelectorAll('.st-tab')].find((b) => { const q = b.getBoundingClientRect(); return e.clientX >= q.left && e.clientX <= q.right; });
    if (!hit) return;
    e.stopPropagation(); e.preventDefault();
    if (d.id !== 'orders' && d.id !== 'topup') close(d);
    go(hit.dataset.tab);
  }, true);
  { const dr = $('#drawer'); if (dr) new MutationObserver(() => { if (dr.open && !dr.classList.contains('closing') && active !== 'cart') setActive('cart'); }).observe(dr, { attributes: true, attributeFilter: ['open'] }); }
  $('#drawer')?.addEventListener('close', () => setTimeout(() => { if (active === 'cart' && !$('#drawer').open) setActive('shop'); }, 260));
  ['orders', 'topup'].forEach((id) => {
    const d = $('#' + id); if (!d) return;
    d.addEventListener('close', () => { setTimeout(() => { if (active === id && !d.open) setActive('shop'); }, 260); });
    new MutationObserver(() => { if (d.open && active !== id) setActive(id); }).observe(d, { attributes: true, attributeFilter: ['open'] });
  });
  if (typeof applyLanguage === 'function') {
    const prev = applyLanguage;
    applyLanguage = function stackedApplyLanguage() { const r = prev.apply(this, arguments); labels(); window.stPaintFile?.(); return r; };
  }
  const cartTab = bar.querySelector('[data-tab="cart"]'), tabBadge = cartTab.querySelector('.st-tab-badge'), srcBadge = $('#badge');
  const syncBadge = () => {
    const n = Number.parseInt(srcBadge?.textContent || '0', 10) || 0, was = tabBadge.textContent;
    tabBadge.hidden = n <= 0; tabBadge.textContent = String(n);
    if (String(n) !== was && n > 0 && !reduced()) { tabBadge.classList.remove('is-pop'); void tabBadge.offsetWidth; tabBadge.classList.add('is-pop'); }
  };
  if (srcBadge) { new MutationObserver(syncBadge).observe(srcBadge, { childList: true, characterData: true, subtree: true }); syncBadge(); }
  const barVisible = () => getComputedStyle(bar).display !== 'none';
  window.stFlyTarget = () => (barVisible() ? cartTab.querySelector('svg') : null);
  window.stFlyLanded = () => { if (!barVisible() || reduced()) return; cartTab.classList.remove('is-catch'); void cartTab.offsetWidth; cartTab.classList.add('is-catch'); };
  labels(); setActive('shop'); bar.querySelector('.st-tab.is-bump')?.classList.remove('is-bump');

  /* ───────── quick amounts in the top-up form ───────── */
  const amount = $('#topupAmount');
  if (amount) {
    amount.inputMode = 'decimal'; amount.placeholder = '10.00';
    const row = document.createElement('div'); row.className = 'st-amounts';
    row.innerHTML = [5, 10, 20, 50].map((v) => `<button type="button" data-v="${v}" aria-pressed="false">${v} ₼</button>`).join('');
    amount.after(row);
    const sync = () => row.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(Number(amount.value) === Number(b.dataset.v))));
    row.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; amount.value = b.dataset.v; sync(); amount.dispatchEvent(new Event('input', { bubbles: true })); });
    amount.addEventListener('input', sync);
    $('#topupForm')?.addEventListener('reset', () => setTimeout(sync, 0));
  }

  /* ───────── localized file picker for the receipt ───────── */
  const file = $('#topupFile');
  if (file) {
    const box = document.createElement('label'); box.className = 'st-file'; box.htmlFor = 'topupFile';
    box.innerHTML = '<b></b><span></span>';
    file.classList.add('st-file-input'); file.after(box);
    const paint = () => { const f = file.files?.[0]; box.querySelector('b').textContent = t('pick'); box.querySelector('span').textContent = f ? f.name : t('nofile'); box.classList.toggle('has-file', !!f); };
    file.addEventListener('change', paint); $('#topupForm')?.addEventListener('reset', () => setTimeout(paint, 0));
    paint(); window.stPaintFile = paint;
  }

  /* ───────── balance count-up ───────── */
  const bal = $('#userBalance');
  let shown = null, writing = false, raf = 0;
  if (bal) new MutationObserver(() => {
    if (writing) return;
    const target = Number(bal.textContent);
    if (!Number.isFinite(target) || target === shown) return;
    const from = shown; shown = target; labels();
    if (from === null) return;
    const box = bal.closest('.balance-display');
    if (box) { box.classList.remove('is-up', 'is-down'); void box.offsetWidth; box.classList.add(target > from ? 'is-up' : 'is-down'); }
    if (reduced() || !box) return;
    cancelAnimationFrame(raf);
    const t0 = performance.now(), D = 700;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - p, 3);
      writing = true; bal.textContent = (from + (target - from) * e).toFixed(2); writing = false; labels();
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }).observe(bal, { childList: true, characterData: true, subtree: true });

  /* ───────── pending top-up indicator ───────── */
  const pill = document.createElement('span');
  pill.className = 'st-pending-pill'; pill.hidden = true; pill.setAttribute('role', 'status');
  $('.balance-group')?.prepend(pill);
  let lastPending = 0, timer = 0;
  async function pollTopups() {
    clearTimeout(timer);
    if (!S.user || document.hidden) { timer = setTimeout(pollTopups, 20000); return; }
    try {
      const { count, error } = await _supabase.from('topups').select('id', { count: 'exact', head: true }).eq('user_id', S.user.id).eq('status', 'pending');
      if (error) throw error;
      const n = count || 0;
      pill.hidden = n === 0; pill.innerHTML = n ? `${window.stLoader()}<span>${t('pending')}</span>` : '';
      const dot = bar.querySelector('[data-tab="topup"] .st-tab-dot'); if (dot) dot.hidden = n === 0;
      if (lastPending > n) {
        const { data } = await _supabase.from('profiles').select('balance').eq('id', S.user.id).maybeSingle();
        if (data && bal) bal.textContent = Number(data.balance || 0).toFixed(2);
        if (typeof toast === 'function') toast(t('credited'));
      }
      lastPending = n;
    } catch (e) { /* offline or signed out: try again later */ }
    timer = setTimeout(pollTopups, lastPending ? 12000 : 30000);
  }
  _supabase.auth.onAuthStateChange(() => { setTimeout(pollTopups, 800); setTimeout(labels, 900); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pollTopups(); });
  $('#topupForm')?.addEventListener('submit', () => setTimeout(pollTopups, 2500));
  pollTopups();

  /* ───────── cart clear: items are swept into the button, which bursts ───────── */
  if (typeof A !== 'undefined' && typeof A.clear === 'function') {
    const plainClear = A.clear;
    let clearing = false;
    A.clear = function stClear(...args) {
      const items = [...document.querySelectorAll('#lines li[data-id]')];
      const btn = $('#clearBtn');
      if (clearing) return;
      if (!items.length || !btn || reduced() || typeof Element.prototype.animate !== 'function') return plainClear.apply(this, args);
      clearing = true;
      const b = btn.getBoundingClientRect(), bx = b.left + b.width / 2, by = b.top + b.height / 2;
      const runs = items.map((li, i) => {
        const r = li.getBoundingClientRect(), dx = bx - (r.left + r.width / 2), dy = by - (r.top + r.height / 2);
        li.style.willChange = 'transform,opacity';
        return li.animate([
          { transform: 'none', opacity: 1 },
          { transform: `translate(${dx * .15}px,${dy * .1 - 14}px) scale(1.02) rotate(${i % 2 ? 2 : -2}deg)`, opacity: 1, offset: .3 },
          { transform: `translate(${dx}px,${dy}px) scale(.12) rotate(${i % 2 ? 14 : -14}deg)`, opacity: 0 }
        ], { duration: 620, delay: i * 70, easing: 'cubic-bezier(.55,0,.6,1)', fill: 'forwards' }).finished;
      });
      const hit = items.length * 70 + 520;
      setTimeout(() => {
        btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(.94)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.3,1.4,.4,1)' });
        const ring = document.createElement('div'); ring.className = 'st-clear-ring';
        Object.assign(ring.style, { left: bx + 'px', top: by + 'px', width: b.height * 1.4 + 'px', height: b.height * 1.4 + 'px' });
        document.body.append(ring); setTimeout(() => ring.remove(), 700);
        for (let k = 0; k < 12; k++) {
          const d = document.createElement('i'); d.className = 'st-clear-dot'; Object.assign(d.style, { left: bx - 3 + 'px', top: by - 3 + 'px' });
          document.body.append(d);
          const a = (k / 12) * Math.PI * 2 + Math.random() * .4, dist = 46 + Math.random() * 40;
          d.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * dist}px,${Math.sin(a) * dist}px) scale(.2)`, opacity: 0 }],
            { duration: 560 + Math.random() * 200, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' }).finished.then(() => d.remove());
        }
      }, hit - 120);
      Promise.all(runs).then(() => {
        plainClear.apply(this, args);
        document.dispatchEvent(new Event('stacked:cart-cleared'));
        clearing = false;
        const empty = document.querySelector('#lines li:not([data-id])');
        empty?.classList.add('st-empty-pop');
      }, () => { clearing = false; plainClear.apply(this, args); });
    };
  }

  /* ───────── restrained STAKED context menu on non-editing surfaces ───────── */
  const contextMenu = document.createElement('div');
  contextMenu.className = 'st-context-menu';
  contextMenu.hidden = true;
  contextMenu.setAttribute('role', 'menu');
  const contextLabels = S.lang === 'en'
    ? ['Back to top', 'Refresh page', 'Copy page link']
    : S.lang === 'az'
      ? ['Yuxarı qayıt', 'Səhifəni yenilə', 'Səhifə linkini köçür']
      : ['В начало', 'Обновить страницу', 'Копировать ссылку'];
  contextMenu.innerHTML =
    '<button type="button" role="menuitem" data-st-context="top">' + contextLabels[0] + '</button>' +
    '<button type="button" role="menuitem" data-st-context="reload">' + contextLabels[1] + '</button>' +
    '<button type="button" role="menuitem" data-st-context="copy">' + contextLabels[2] + '</button>';
  document.body.append(contextMenu);
  let contextHideTimer = 0;
  const hideContextMenu = () => {
    clearTimeout(contextHideTimer);
    contextMenu.classList.remove('is-open');
    contextHideTimer = setTimeout(() => { contextMenu.hidden = true; }, 150);
  };
  document.addEventListener('contextmenu', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    // Keep browser actions available in editable controls, links, media and selected text.
    if (target.closest('input,textarea,select,[contenteditable="true"],a,button,[role="button"],video,audio,iframe')) return;
    if (window.getSelection && window.getSelection().toString().trim()) return;
    event.preventDefault();
    clearTimeout(contextHideTimer);
    contextMenu.hidden = false;
    contextMenu.classList.remove('is-open');
    const width = 204, height = 3 * 41 + 12;
    const x = Math.max(8, Math.min(event.clientX, innerWidth - width - 8));
    const y = Math.max(8, Math.min(event.clientY, innerHeight - height - 8));
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
    requestAnimationFrame(() => contextMenu.classList.add('is-open'));
  });
  contextMenu.addEventListener('click', async (event) => {
    const action = event.target.closest('[data-st-context]')?.dataset.stContext;
    hideContextMenu();
    if (action === 'top') {
      window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
    } else if (action === 'reload') {
      window.location.reload();
    } else if (action === 'copy') {
      try {
        await navigator.clipboard.writeText(window.location.href);
        if (typeof toast === 'function') toast(S.lang === 'en' ? 'Link copied' : S.lang === 'az' ? 'Link kopyalandı' : 'Ссылка скопирована');
      } catch {
        if (typeof toast === 'function') toast(S.lang === 'en' ? 'Could not copy the link' : S.lang === 'az' ? 'Linki köçürmək olmadı' : 'Не удалось скопировать ссылку');
      }
    }
  });
  document.addEventListener('click', (event) => { if (!contextMenu.contains(event.target)) hideContextMenu(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') hideContextMenu(); });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-lang]')) return;
    setTimeout(() => {
      const language = S.lang || 'ru';
      const labels = language === 'en'
        ? ['Back to top', 'Refresh page', 'Copy page link']
        : language === 'az'
          ? ['Yuxarı qayıt', 'Səhifəni yenilə', 'Səhifə linkini köçür']
          : ['В начало', 'Обновить страницу', 'Копировать ссылку'];
      contextMenu.querySelectorAll('[data-st-context]').forEach((button, index) => {
        button.textContent = labels[index] || '';
      });
    }, 0);
  });

  window.addEventListener('resize', hideContextMenu, { passive: true });
  window.addEventListener('scroll', hideContextMenu, { passive: true, capture: true });

})();