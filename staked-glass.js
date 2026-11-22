/* STAKED glass layer: header profile button, inline field validation, cart empty state,
   fixed site background and a soft theme cross-fade. Loaded last, after the other site scripts. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const lang = () => { try { return (typeof S !== 'undefined' && S.lang) || localStorage.getItem('pdd.lang') || 'ru'; } catch { return 'ru'; } };
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T = {
    ru: { profile: 'Профиль', required: 'Заполните это поле', reqAmount: 'Введите сумму', reqEmail: 'Введите email', reqPass: 'Введите пароль', min: 'Минимум {v}', max: 'Максимум {v}', step: 'Не больше двух знаков после запятой',
      number: 'Введите число', email: 'Введите email, например name@mail.com', short: 'Минимум {v} символов', file: 'Прикрепите скриншот чека',
      check: 'Отметьте, что данные верны', emptyTitle: 'Корзина пуста', emptyText: 'Выберите что-нибудь в меню.', toMenu: 'Открыть меню', history: 'История пополнений' },
    en: { profile: 'Profile', required: 'Fill in this field', reqAmount: 'Enter an amount', reqEmail: 'Enter your email', reqPass: 'Enter your password', min: 'At least {v}', max: 'No more than {v}', step: 'Use at most two decimal places',
      number: 'Enter a number', email: 'Enter an email such as name@mail.com', short: 'At least {v} characters', file: 'Attach a screenshot of the receipt',
      check: 'Confirm that the details are correct', emptyTitle: 'Your cart is empty', emptyText: 'Pick something from the menu.', toMenu: 'Open menu', history: 'Top-up history' },
    az: { profile: 'Profil', required: 'Bu xananı doldurun', reqAmount: 'Məbləği daxil edin', reqEmail: 'E-poçtu daxil edin', reqPass: 'Şifrəni daxil edin', min: 'Minimum {v}', max: 'Maksimum {v}', step: 'Vergüldən sonra ən çox iki rəqəm',
      number: 'Rəqəm daxil edin', email: 'Email daxil edin, məsələn name@mail.com', short: 'Minimum {v} simvol', file: 'Çekin skrinşotunu əlavə edin',
      check: 'Məlumatların düzgün olduğunu təsdiqləyin', emptyTitle: 'Səbət boşdur', emptyText: 'Menyudan bir şey seçin.', toMenu: 'Menyunu aç', history: 'Balans tarixçəsi' }
  };
  const t = (k, v) => String((T[lang()] || T.ru)[k] || T.ru[k]).replace('{v}', v ?? '');

  /* ── header profile button: same pill as the tab bar, opens the same profile panel ── */
  const trigger = $('#stackdProfileTrigger');
  function paintProfile() {
    if (!trigger) return;
    trigger.classList.add('st-profile-pill');
    const label = trigger.querySelector('strong');
    if (label) label.textContent = t('profile');
    trigger.title = t('profile');
    trigger.setAttribute('aria-label', t('profile'));
  }
  if (trigger) {
    paintProfile();
    const label = trigger.querySelector('strong');
    if (label) new MutationObserver(() => { if (label.textContent !== t('profile')) paintProfile(); }).observe(label, { childList: true, characterData: true, subtree: true });
    trigger.addEventListener('click', (e) => {
      const tab = $('.st-tab[data-tab="profile"]');
      if (!tab) return;
      e.preventDefault(); e.stopImmediatePropagation();
      tab.click();
    }, true);
  }

  /* ── inline validation instead of the browser bubble ── */
  function messageFor(el) {
    const v = el.validity;
    if (el.type === 'checkbox') return t('check');
    if (el.type === 'file') return t('file');
    if (v.valueMissing) return el.type === 'number' ? t('reqAmount') : el.type === 'email' ? t('reqEmail') : el.type === 'password' ? t('reqPass') : t('required');
    if (v.badInput || v.typeMismatch && el.type === 'number') return t('number');
    if (v.typeMismatch && el.type === 'email') return t('email');
    if (v.rangeUnderflow) return t('min', el.min);
    if (v.rangeOverflow) return t('max', el.max);
    if (v.stepMismatch) return t('step');
    if (v.tooShort) return t('short', el.minLength);
    return el.validationMessage || t('required');
  }
  function anchorOf(el) {
    if (el.type === 'checkbox') return el.closest('label') || el;
    if (el.type === 'file') return el.parentElement?.querySelector('.st-file') || el;
    return el;
  }
  function clearError(el) {
    el.classList.remove('st-invalid');
    const a = anchorOf(el);
    a.classList.remove('st-invalid', 'st-invalid-check');
    const next = a.nextElementSibling;
    if (next?.classList.contains('st-field-error')) next.remove();
  }
  function showError(el) {
    clearError(el);
    const a = anchorOf(el);
    a.classList.add(el.type === 'checkbox' ? 'st-invalid-check' : 'st-invalid');
    const msg = document.createElement('p');
    msg.className = 'st-field-error'; msg.setAttribute('role', 'alert');
    msg.textContent = messageFor(el);
    a.after(msg);
    if (!reduced()) { a.classList.remove('st-shake'); void a.offsetWidth; a.classList.add('st-shake'); setTimeout(() => a.classList.remove('st-shake'), 360); }
  }
  let firstInvalid = null;
  document.addEventListener('invalid', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) return;
    e.preventDefault();
    showError(el);
    if (!firstInvalid) { firstInvalid = el; requestAnimationFrame(() => { (firstInvalid.type === 'file' ? anchorOf(firstInvalid) : firstInvalid)?.focus?.({ preventScroll: false }); firstInvalid = null; }); }
  }, true);
  const revalidate = (e) => { const el = e.target; if (el?.classList && (el.classList.contains('st-invalid') || anchorOf(el)?.nextElementSibling?.classList.contains('st-field-error'))) { if (el.checkValidity()) clearError(el); } };
  document.addEventListener('input', revalidate, true);
  document.addEventListener('change', revalidate, true);

  /* ── cart empty state ── */
  const lines = $('#lines');
  function paintEmpty() {
    if (!lines || lines.querySelector('li[data-id]')) return;
    const li = lines.querySelector('li:not([data-id])');
    if (!li || li.classList.contains('st-empty')) return;
    li.className = 'st-empty';
    li.innerHTML = `<strong>${t('emptyTitle')}</strong><span>${t('emptyText')}</span><button type="button" class="btn btn-ghost" data-st-to-menu>${t('toMenu')}</button>`;
  }
  if (lines) {
    new MutationObserver(paintEmpty).observe(lines, { childList: true });
    paintEmpty();
    lines.addEventListener('click', (e) => {
      if (!e.target.closest('[data-st-to-menu]')) return;
      const shop = $('.st-tab[data-tab="shop"]');
      if (shop) shop.click(); else { $('#drawer')?.close(); $('#catalog')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }); }
    });
  }

  /* ── a site background from the admin: fixed layer, not stretched across the scrolling page ── */
  const layer = document.createElement('div');
  layer.className = 'st-site-bg'; layer.setAttribute('aria-hidden', 'true');
  document.body.prepend(layer);
  let lastBg = '';
  function syncBg() {
    const img = document.body.style.backgroundImage;
    const has = !!img && img !== 'none' && !document.documentElement.classList.contains('st-winter');
    const value = has ? img : '';
    if (value === lastBg) return;
    lastBg = value;
    document.body.classList.toggle('st-has-site-bg', has);
    if (has) layer.style.backgroundImage = value;
    layer.classList.toggle('is-on', has);
  }
  new MutationObserver(syncBg).observe(document.body, { attributes: true, attributeFilter: ['style'] });
  new MutationObserver(syncBg).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  syncBg();

  /* ── theme change: one short cross-fade. While it runs the browser hit-tests the whole page as <html>,
        so a tap would land "outside" the settings panel and close it. Taps on theme buttons during the fade
        are matched by position and replayed when it ends; other taps on <html> are swallowed. ── */
  let fading = null;
  const root = document.documentElement;
  function themeButtonAt(x, y) {
    return [...document.querySelectorAll('#settingsPanel [data-act="theme"]')].find((b) => {
      const r = b.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });
  }
  let queued = null;
  const guard = (e) => {
    if (!fading || e.target !== root) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (e.type === 'pointerdown') queued = themeButtonAt(e.clientX, e.clientY) || queued;
  };
  ['pointerdown', 'pointerup', 'click', 'mousedown'].forEach((t) => window.addEventListener(t, guard, true));
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act="theme"]');
    if (!b || b.dataset.stDirect) return;
    if (e.isTrusted) queued = null; // a real tap that reached the button is newer than anything queued
    if (fading || reduced() || typeof document.startViewTransition !== 'function') return;
    let current = 'system'; try { current = localStorage.getItem('pdd.theme') || 'system'; } catch { /* storage blocked */ }
    if (b.dataset.v === current) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const apply = () => { b.dataset.stDirect = '1'; b.click(); delete b.dataset.stDirect; };
    fading = document.startViewTransition(apply);
    fading.finished.finally(() => {
      fading = null;
      const next = queued; queued = null;
      if (next) next.click();
    });
  }, true);

  /* labels follow the language switch */
  document.addEventListener('click', (e) => { if (e.target.closest('[data-lang]')) setTimeout(() => { paintProfile(); const li = lines?.querySelector('li.st-empty'); if (li) { li.className = ''; paintEmpty(); } }, 60); });

  /* ── admin "Настройки сайта": section menu on the left, one section at a time, one Save all bar ── */
  const AT = {
    ru: { home: 'Текст на главной', saveAll: 'Сохранить все изменения', saving: 'Сохраняю…', saved: 'Все настройки сохранены', partial: 'Часть настроек не сохранилась, проверьте отмеченные разделы', note: 'Скидки и новости применяются своими кнопками внутри раздела.' },
    en: { home: 'Home page text', saveAll: 'Save all changes', saving: 'Saving…', saved: 'All settings saved', partial: 'Some settings were not saved. Check the marked sections.', note: 'Discounts and news are applied with their own buttons inside the section.' },
    az: { home: 'Ana səhifə mətni', saveAll: 'Bütün dəyişiklikləri yadda saxla', saving: 'Yadda saxlanılır…', saved: 'Bütün parametrlər yadda saxlanıldı', partial: 'Bəzi parametrlər saxlanmadı, işarələnmiş bölmələri yoxlayın.', note: 'Endirimlər və xəbərlər bölmənin öz düymələri ilə tətbiq olunur.' }
  };
  const at = (k) => (AT[lang()] || AT.ru)[k] || AT.ru[k];
  // Section id -> how to save it. Sections not listed (discounts, news) only run their own actions.
  const SAVERS = {
    'st-home-text': async () => (window.stakedSaveHeroSettings ? (await window.stakedSaveHeroSettings()) !== false : true),
    stackdHeroSettings: async () => (window.stakedSaveHeroSettings ? (await window.stakedSaveHeroSettings()) !== false : true),
    stackdBrandSettings: async () => (window.stakedSaveHeroSettings ? (await window.stakedSaveHeroSettings()) !== false : true),
    stwAdmin: async () => (window.stakedSaveWinterSettings ? (await window.stakedSaveWinterSettings()) !== false : true),
    stackedSocialSave: null,
    stackedSocialSettings: () => clickAndWait('#stackedSocialSave'),
    stakedBackgroundSettings: () => clickAndWait('#stakedBackgroundSave', '#stakedBackgroundMessage'),
    stackdMaintenanceAdmin: () => clickAndWait('#smSave', '#smSaveStatus')
  };
  function clickAndWait(btnSel, msgSel) {
    return new Promise((resolve) => {
      const btn = $(btnSel); if (!btn) return resolve(true);
      btn.click();
      const t0 = Date.now();
      const tick = () => {
        if (!btn.disabled || Date.now() - t0 > 15000) {
          const msg = msgSel ? $(msgSel)?.textContent || '' : '';
          resolve(!/не удалось|ошибка|failed|error|xəta|olmadı/i.test(msg));
        } else setTimeout(tick, 150);
      };
      setTimeout(tick, 120);
    });
  }
  let adminBuilt = false, adminTimer = 0;
  function buildAdminLayout() {
    const tab = $('#tab-settings');
    if (!tab) return;
    // loose legacy fields at the top become their own section
    if (!$('#st-home-text', tab)) {
      const loose = [...tab.children].filter((n) => !n.matches('section, .st-admin-nav, .st-admin-bar, .st-admin-body'));
      if (loose.length) {
        const sec = document.createElement('section');
        sec.id = 'st-home-text'; sec.className = 'stackd-settings-section';
        const h = document.createElement('h3'); h.textContent = at('home');
        sec.append(h);
        loose.forEach((n) => { if (n.tagName === 'H3') n.remove(); else sec.append(n); });
        tab.prepend(sec);
      }
    }
    const sections = [...tab.querySelectorAll(':scope > section, :scope > .st-admin-body > section')];
    if (!sections.length) return;
    let body = $('.st-admin-body', tab), nav = $('.st-admin-nav', tab), bar = $('.st-admin-bar', tab);
    if (!body) { body = document.createElement('div'); body.className = 'st-admin-body'; tab.append(body); }
    if (!nav) { nav = document.createElement('nav'); nav.className = 'st-admin-nav'; nav.setAttribute('aria-label', 'Settings'); tab.prepend(nav); }
    if (!bar) {
      bar = document.createElement('div'); bar.className = 'st-admin-bar';
      bar.innerHTML = '<button type="button" class="btn btn-primary" id="stAdminSaveAll"></button><span class="st-admin-bar-msg" role="status" aria-live="polite"></span>';
      tab.append(bar);
      bar.querySelector('button').addEventListener('click', saveAll);
    }
    sections.forEach((s) => { if (s.parentElement !== body) body.append(s); });
    $('.staked-save-all-row', tab)?.setAttribute('hidden', '');
    const current = tab.dataset.stSection && $('#' + CSS.escape(tab.dataset.stSection), body) ? tab.dataset.stSection : sections[0].id;
    nav.innerHTML = sections.map((s) => {
      const title = (s.querySelector('h3')?.textContent || s.id).trim();
      return `<button type="button" data-st-section="${s.id}" aria-current="${s.id === current}">${title.replace(/[<>&"]/g, '')}</button>`;
    }).join('');
    show(current);
    bar.querySelector('button').textContent = at('saveAll');
    adminBuilt = true;
  }
  function show(id) {
    const tab = $('#tab-settings'); if (!tab) return;
    tab.dataset.stSection = id;
    tab.querySelectorAll('.st-admin-body > section').forEach((s) => { s.hidden = s.id !== id; });
    tab.querySelectorAll('.st-admin-nav button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.stSection === id)));
  }
  async function saveAll() {
    const tab = $('#tab-settings'), btn = $('#stAdminSaveAll'), msg = $('.st-admin-bar-msg');
    if (!tab || !btn || btn.disabled) return;
    btn.disabled = true; msg.textContent = at('saving'); msg.dataset.state = '';
    tab.querySelectorAll('.st-admin-nav button').forEach((b) => b.classList.remove('is-failed'));
    let ok = true; const done = new Set();
    for (const s of tab.querySelectorAll('.st-admin-body > section')) {
      const saver = SAVERS[s.id];
      if (!saver) continue;
      const key = saver === SAVERS.stackdHeroSettings || saver === SAVERS.stackdBrandSettings || saver === SAVERS['st-home-text'] ? 'hero' : s.id;
      if (done.has(key)) continue; done.add(key);
      let r = false;
      try { r = await saver(); } catch (e) { console.error('Save failed for', s.id, e); }
      if (!r) { ok = false; tab.querySelector(`.st-admin-nav [data-st-section="${s.id}"]`)?.classList.add('is-failed'); }
    }
    btn.disabled = false;
    msg.textContent = ok ? at('saved') : at('partial'); msg.dataset.state = ok ? 'ok' : 'error';
    if (ok && typeof toast === 'function') toast(at('saved'));
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.st-admin-nav [data-st-section]');
    if (b) { show(b.dataset.stSection); $('#tab-settings .st-admin-body')?.scrollIntoView({ block: 'nearest' }); }
  });
  const tabSettings = $('#tab-settings');
  if (tabSettings) new MutationObserver((list) => {
    if (list.every((m) => [...m.addedNodes].every((n) => n.nodeType !== 1 || n.matches?.('.st-admin-nav,.st-admin-bar,.st-admin-body')))) return;
    clearTimeout(adminTimer); adminTimer = setTimeout(buildAdminLayout, 80);
  }).observe(tabSettings, { childList: true });
  setTimeout(buildAdminLayout, 400);
  document.addEventListener('click', (e) => { if (e.target.closest('[data-lang]')) setTimeout(buildAdminLayout, 120); });

  /* ── static aria-labels, titles and placeholders outside the admin panel ── */
  const ATTRS = {
    'Пополнить баланс': ['Top up balance', 'Balansı artır'],
    'Пополнить': ['Top up', 'Artır'],
    'Настройки': ['Settings', 'Parametrlər'],
    'Закрыть': ['Close', 'Bağla'],
    'Категории': ['Categories', 'Kateqoriyalar'],
    'Пароль (мин. 6 символов)': ['Password (6+ characters)', 'Şifrə (ən azı 6 simvol)'],
    'Навигация': ['Navigation', 'Naviqasiya'],
    'Открыть корзину': ['Open cart', 'Səbəti aç']
  };
  function translateAttrs() {
    const L = lang();
    document.querySelectorAll('[aria-label],[title],[placeholder]').forEach((el) => {
      if (el.closest('#editor')) return;
      for (const a of ['aria-label', 'title', 'placeholder']) {
        const v = el.getAttribute(a); if (!v) continue;
        const key = el.dataset['stRu' + a.replace('-', '')] || (ATTRS[v] ? v : null);
        if (!key) continue;
        el.dataset['stRu' + a.replace('-', '')] = key;
        const nv = L === 'en' ? ATTRS[key][0] : L === 'az' ? ATTRS[key][1] : key;
        if (v !== nv) el.setAttribute(a, nv);
      }
    });
  }
  setTimeout(translateAttrs, 300);
  document.addEventListener('staked:lang', () => setTimeout(translateAttrs, 0));
  document.addEventListener('click', (e) => { if (e.target.closest('[data-lang]')) setTimeout(translateAttrs, 150); });

  /* ── top-up: the review note sits under the submit button, history is the last row ── */
  const topup = $('#topup');
  if (topup) {
    const form = $('#topupForm', topup), submit = form?.querySelector('button[type=submit]'), warn = $('.warn', topup);
    if (warn && submit) { warn.removeAttribute('style'); submit.after(warn); }
    const hist = document.createElement('button');
    hist.type = 'button'; hist.className = 'st-topup-history';
    const paintHist = () => { hist.textContent = t('history'); };
    paintHist();
    hist.addEventListener('click', () => { const orig = $('#stackdTopupHistoryOpen'); if (orig) orig.click(); });
    // right under the Telegram block, so it is visible without scrolling
    const instr = $('.payment-instructions', topup);
    if (instr) instr.after(hist); else topup.append(hist);
    document.addEventListener('click', (e) => { if (e.target.closest('[data-lang]')) setTimeout(paintHist, 60); });
  }

  /* ── admin on phones: tap a product row to edit it; the form scrolls into view ── */
  const phone = () => matchMedia('(max-width:680px)').matches;
  document.addEventListener('click', (e) => {
    const editor = e.target.closest('#editor');
    if (!editor) return;
    const row = e.target.closest('#adminList li[data-id]');
    if (row && !e.target.closest('button')) { row.querySelector('[data-act=edit]')?.click(); return; }
    if (phone() && e.target.closest('[data-act=edit],[data-act=new]')) {
      setTimeout(() => $('#pform')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }), 60);
    }
  });

  /* product form: the Save button lives in a bar that sticks to the bottom while the long form scrolls */
  const pform = $('#pform');
  if (pform) {
    const save = pform.querySelector('button[type=submit]');
    if (save && !save.parentElement.classList.contains('st-form-save')) {
      const bar = document.createElement('div'); bar.className = 'st-form-save';
      pform.append(bar); bar.append(save);
    }
  }
})();

/* Category chips: when they do not fit, fade the edge that hides more chips and keep the
   chosen chip in view, so a category is never hidden off-screen without a hint. */
(() => {
  const wrap = document.querySelector('.chips-wrapper');
  if (!wrap) return;
  const sync = () => {
    const over = wrap.scrollWidth - wrap.clientWidth > 2;
    wrap.classList.toggle('st-fade-end', over && wrap.scrollLeft + wrap.clientWidth < wrap.scrollWidth - 2);
    wrap.classList.toggle('st-fade-start', over && wrap.scrollLeft > 2);
  };
  wrap.addEventListener('scroll', sync, { passive: true });
  addEventListener('resize', sync, { passive: true });
  new MutationObserver(sync).observe(wrap, { childList: true, subtree: true, characterData: true });
  wrap.addEventListener('click', (e) => {
    const chip = e.target.closest('button[data-cat]');
    if (!chip) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off';
    requestAnimationFrame(() => chip.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }));
  });
  document.addEventListener('staked:lang', () => requestAnimationFrame(sync));
  requestAnimationFrame(sync);
})();

/* Language switch: the new text fades in, so the swap reads as one change instead of a flicker. */
(() => {
  // app.js applies the start-up language before this file loads, so every event seen here is a real switch.
  document.addEventListener('staked:lang', () => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off') return;
    const b = document.body;
    b.classList.remove('st-lang-swap'); void b.offsetWidth; b.classList.add('st-lang-swap');
    clearTimeout(b._stLangT); b._stLangT = setTimeout(() => b.classList.remove('st-lang-swap'), 420);
  });
})();
