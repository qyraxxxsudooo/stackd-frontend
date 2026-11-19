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
    ru: { shop: 'Магазин', orders: 'Заказы', topup: 'Пополнить', cart: 'Корзина', pending: 'Пополнение на проверке', credited: 'Баланс пополнен' },
    en: { shop: 'Shop', orders: 'Orders', topup: 'Top up', cart: 'Cart', pending: 'Top-up under review', credited: 'Balance topped up' },
    az: { shop: 'Mağaza', orders: 'Sifarişlər', topup: 'Artır', cart: 'Səbət', pending: 'Balans yoxlanılır', credited: 'Balans artırıldı' }
  };
  const t = (k) => TX[L()][k];

  window.stLoader = (cls = '') => `<span class="st-loader ${cls}" aria-hidden="true"><i></i></span>`;

  /* ───────── tab bar ───────── */
  const ICONS = {
    shop: '<path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
    orders: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/>',
    topup: '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/><path d="M16 14.5h2"/><path d="M12 2v3M10.5 3.5 12 2l1.5 1.5"/>',
    cart: '<path d="M3 4h2.2l2.1 10.4a1.6 1.6 0 0 0 1.6 1.3h7.9a1.6 1.6 0 0 0 1.6-1.2L20 8H6.1"/><circle cx="9.5" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>'
  };
  const TABS = ['shop', 'orders', 'topup', 'cart'];
  const bar = document.createElement('nav');
  bar.className = 'st-tabbar'; bar.setAttribute('aria-label', 'STAKED');
  bar.innerHTML = `<span class="st-tab-ind" aria-hidden="true"></span>${TABS.map((k) => `<button type="button" class="st-tab" data-tab="${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg><span class="st-tab-label"></span>${k === 'cart' ? '<b class="st-tab-badge" hidden>0</b>' : '<b class="st-tab-dot" hidden></b>'}</button>`).join('')}`;
  document.body.append(bar);
  document.body.classList.add('has-tabbar');
  const sheets = { orders: () => $('#orders'), topup: () => $('#topup') };
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
  function go(k) {
    if (k === 'cart') { const cur = sheets[active]?.(); if (cur?.open) close(cur); setActive('cart'); setTimeout(() => { if (typeof A !== 'undefined' && A['cart-open']) A['cart-open'](); else $('#drawer')?.showModal(); }, cur?.open ? 230 : 0); return; }
    if (k === active && k !== 'shop') return;
    if (k !== 'shop' && !S.user) { $('#auth')?.showModal(); return; }
    const current = sheets[active]?.();
    setActive(k);
    if (k === 'shop') { close(current); $('#catalog')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); return; }
    const next = sheets[k]();
    const open = () => { if (k === 'orders' && typeof openOrders === 'function') openOrders(); else if (next && !next.open) next.showModal(); };
    if (current?.open) { close(current); setTimeout(open, reduced() ? 0 : 230); } else open();
  }
  bar.addEventListener('click', (e) => { const b = e.target.closest('.st-tab'); if (b) go(b.dataset.tab); });
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
  $('#drawer')?.addEventListener('close', () => setTimeout(() => { if (active === 'cart' && !$('#drawer').open) setActive('shop'); }, 260));
  ['orders', 'topup'].forEach((id) => {
    const d = $('#' + id); if (!d) return;
    d.addEventListener('close', () => { setTimeout(() => { if (active === id && !d.open) setActive('shop'); }, 260); });
    new MutationObserver(() => { if (d.open && active !== id) setActive(id); }).observe(d, { attributes: true, attributeFilter: ['open'] });
  });
  if (typeof applyLanguage === 'function') {
    const prev = applyLanguage;
    applyLanguage = function stackedApplyLanguage() { const r = prev.apply(this, arguments); labels(); return r; };
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
})();
