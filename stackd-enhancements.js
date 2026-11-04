/* Stackd visual QA patch. Load AFTER app.js and stackd-enhancements.js. */
(() => {
  'use strict';

  if (window.__stackdVisualFixLoaded) return;
  window.__stackdVisualFixLoaded = true;

  const $ = (selector, root = document) => root.querySelector(selector);
  const create = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function disableBrowserTranslation() {
    document.documentElement.classList.add('notranslate');
    document.documentElement.setAttribute('translate', 'no');
    document.body?.classList.add('notranslate');
    document.body?.setAttribute('translate', 'no');
    if (!$('meta[name="google"]')) {
      const meta = create('meta');
      meta.name = 'google';
      meta.content = 'notranslate';
      $('head')?.append(meta);
    }
  }

  function makeThemeCopy(profile, existingSegment) {
    if (existingSegment && profile.contains(existingSegment)) {
      existingSegment.classList.add('stackd-profile-theme-segment');
      return existingSegment;
    }

    if (existingSegment) {
      const copy = existingSegment.cloneNode(true);
      copy.removeAttribute('id');
      copy.classList.add('stackd-profile-theme-segment');
      copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      copy.querySelector('.seg-slider')?.remove();
      return copy;
    }

    const segment = create('div', 'seg stackd-profile-theme-segment');
    segment.setAttribute('role', 'group');
    segment.setAttribute('aria-label', 'Theme');
    [
      ['light', 'Светлая', 'theme_light'],
      ['dark', 'Тёмная', 'theme_dark'],
      ['system', 'Авто', 'theme_system']
    ].forEach(([value, label, key]) => {
      const button = create('button', '', label);
      button.type = 'button';
      button.dataset.act = 'theme';
      button.dataset.v = value;
      button.dataset.i18n = key;
      segment.append(button);
    });
    return segment;
  }

  function buildProfileMenu() {
    const profile = $('#userProfile');
    if (!profile || profile.dataset.visualQaReady === '1') return;

    const avatar = $('#userAvatar', profile) || create('img', 'avatar');
    if (!avatar.getAttribute('src')) avatar.src = 'assets/icons/placeholder.svg';
    avatar.alt = 'Аватар профиля';
    avatar.classList.add('avatar', 'stackd-profile-avatar');

    const orders = $('#myOrdersBtn', profile) || create('button', 'stackd-profile-action');
    orders.id = 'myOrdersBtn';
    orders.type = 'button';
    orders.dataset.act = 'orders';
    orders.removeAttribute('style');
    orders.classList.add('stackd-profile-action');
    orders.innerHTML = '<span class="stackd-profile-action-icon" aria-hidden="true">▤</span><span id="stackdProfileOrders">Мои заказы</span><span class="stackd-profile-arrow" aria-hidden="true">›</span>';

    const existingLogout = $('#logoutBtn', profile);
    const logout = existingLogout || create('button', 'stackd-profile-action stackd-profile-logout', 'Выйти из аккаунта');
    logout.id = 'logoutBtn';
    logout.type = 'button';
    logout.classList.add('stackd-profile-action', 'stackd-profile-logout');
    logout.innerHTML = '<span class="stackd-profile-action-icon" aria-hidden="true">↪</span><span id="stackdProfileLogout">Выйти из аккаунта</span>';

    const balance = $('.balance-group', profile) || $('.balance-group') || create('div', 'balance-group');
    const topup = $('#topupBtn', balance);
    if (topup) topup.type = 'button';

    const existingSegment = $('#themeSeg') || $('#profileThemeSeg') || $('.stackd-profile-theme .seg');
    const themeSegment = makeThemeCopy(profile, existingSegment);

    // Reuse existing controls so app.js event listeners for orders, logout and top-up survive.
    const anchor = create('div', 'stackd-profile-anchor');
    const trigger = create('button', 'stackd-profile-trigger');
    trigger.type = 'button';
    trigger.id = 'stackdProfileTrigger';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', 'stackdProfileMenu');
    trigger.setAttribute('aria-label', 'Открыть профиль');
    trigger.title = 'Профиль';

    const avatarFrame = create('span', 'stackd-profile-avatar-frame');
    avatarFrame.append(avatar);
    trigger.append(avatarFrame, create('span', 'stackd-profile-trigger-chevron', '⌄'));

    const menu = create('section', 'stackd-profile-menu glass');
    menu.id = 'stackdProfileMenu';
    menu.hidden = true;
    menu.setAttribute('aria-label', 'Меню профиля');

    const head = create('div', 'stackd-profile-head');
    const titleRow = create('div', 'stackd-profile-head-row');
    const title = create('strong', '', 'Профиль');
    title.id = 'stackdProfileTitle';
    const status = create('span', 'stackd-profile-status', 'АККАУНТ');
    titleRow.append(title, status);

    const emailLabel = create('small', '', 'Вы вошли как');
    emailLabel.id = 'stackdProfileEmailLabel';
    const email = create('strong', 'stackd-profile-email');
    email.id = 'stackdProfileEmail';
    email.textContent = '';
    head.append(titleRow, emailLabel, email);

    const note = create('p', 'stackd-profile-note', 'Управляйте аккаунтом и оформлением сайта.');
    note.id = 'stackdProfileNote';

    const balanceRow = create('div', 'stackd-profile-balance');
    const balanceInfo = create('div', 'stackd-profile-balance-info');
    const balanceLabel = create('span', '', 'Баланс');
    const balanceValue = create('strong', '', $('#userBalance')?.textContent?.trim() || '0.00');
    balanceLabel.id = 'stackdProfileBalanceLabel';
    balanceValue.id = 'stackdProfileBalanceValue';
    balanceInfo.append(balanceLabel, balanceValue);
    const topupAction = create('button', 'stackd-profile-topup', 'Пополнить');
    topupAction.type = 'button';
    topupAction.addEventListener('click', () => $('#topup')?.showModal());
    balanceRow.append(balanceInfo, topupAction);

    const actions = create('div', 'stackd-profile-actions');
    actions.append(orders);

    const themeBlock = create('div', 'stackd-profile-theme');
    const themeLabel = create('strong', '', 'Тема оформления');
    themeLabel.id = 'stackdProfileTheme';
    themeBlock.append(themeLabel, themeSegment);

    const footer = create('div', 'stackd-profile-footer');
    footer.append(logout);

    menu.append(head, note, balanceRow, actions, themeBlock, footer);
    anchor.append(trigger, menu);

    profile.replaceChildren(anchor, balance);
    profile.dataset.visualQaReady = '1';

    const closeMenu = () => {
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    };

    trigger.addEventListener('click', event => {
      event.preventDefault();
      const nextOpen = menu.hidden;
      menu.hidden = !nextOpen;
      trigger.setAttribute('aria-expanded', String(nextOpen));
      if (nextOpen) requestAnimationFrame(() => updateThemeCopy(themeSegment));
    });

    document.addEventListener('click', event => {
      if (!event.target.closest('.stackd-profile-anchor')) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenu();
    });
    orders.addEventListener('click', closeMenu);
    logout.addEventListener('click', closeMenu);

    const refreshEmail = () => {
      const emailValue = window.__stackdAuthEmail || '';
      if (emailValue) email.textContent = emailValue;
      try {
        if (typeof _supabase !== 'undefined' && _supabase?.auth?.getSession) {
          _supabase.auth.getSession().then(({ data }) => {
            email.textContent = data?.session?.user?.email || '';
          }).catch(() => {});
        }
      } catch (_) {}
    };
    refreshEmail();
    const balanceNode = $('#userBalance');
    if (balanceNode && 'MutationObserver' in window) {
      new MutationObserver(() => { balanceValue.textContent = balanceNode.textContent?.trim() || '0.00'; }).observe(balanceNode, { childList: true, characterData: true, subtree: true });
    }

    try {
      if (typeof _supabase !== 'undefined' && _supabase?.auth?.onAuthStateChange) {
        _supabase.auth.onAuthStateChange((_event, session) => {
          email.textContent = session?.user?.email || '';
          closeMenu();
        });
      }
    } catch (_) {}

    // If the original logout control did not exist, wire a safe fallback.
    if (!existingLogout) {
      logout.addEventListener('click', async () => {
        try {
          if (typeof _supabase !== 'undefined') await _supabase.auth.signOut();
        } finally {
          window.location.reload();
        }
      });
    }
  }

  function updateThemeCopy(segment) {
    if (!segment) return;
    let current = 'system';
    try { current = localStorage.getItem('pdd.theme') || 'system'; } catch (_) {}
    segment.querySelectorAll('button[data-v]').forEach(button => {
      const active = button.dataset.v === current;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-selected', active);
    });
  }

  function addMobileDock() {
    if ($('#stackdMobileDock')) return;

    const dock = create('nav', 'stackd-mobile-dock');
    dock.id = 'stackdMobileDock';
    dock.setAttribute('aria-label', 'Быстрые действия');
    dock.innerHTML = `
      <div class="stackd-mobile-dock-inner">
        <button class="stackd-dock-orders" type="button" data-act="orders" aria-label="Мои заказы">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.75h7l4 4V20a.75.75 0 0 1-.75.75h-10.5A.75.75 0 0 1 6 20V4.5a.75.75 0 0 1 .75-.75Z"/><path d="M14 4v4h4M9 12h6M9 15.5h6"/></svg>
          <span id="stackdDockOrdersLabel">Заказы</span>
        </button>
        <button class="stackd-dock-cart" type="button" data-act="cart-open" aria-label="Открыть корзину">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 4.5h2l2.1 10.1a1.2 1.2 0 0 0 1.17.95h8.45a1.2 1.2 0 0 0 1.17-.95L20 8H6.2M9.2 19.2h.01M17.2 19.2h.01"/></svg>
          <span id="stackdDockCartLabel">Корзина</span>
          <span class="stackd-dock-badge" id="stackdMobileBadge">0</span>
        </button>
      </div>`;
    document.body.append(dock);

    const sourceBadge = $('#badge');
    const targetBadge = $('#stackdMobileBadge');
    const syncBadge = () => {
      if (!sourceBadge || !targetBadge) return;
      const value = Number.parseInt(sourceBadge.textContent || '0', 10) || 0;
      targetBadge.textContent = value > 99 ? '99+' : String(value);
      targetBadge.hidden = value <= 0;
      dock.querySelector('.stackd-dock-cart').setAttribute('aria-label', `Корзина, ${value} товаров`);
    };
    syncBadge();
    if (sourceBadge && 'MutationObserver' in window) {
      new MutationObserver(syncBadge).observe(sourceBadge, { childList: true, characterData: true, subtree: true });
    }

    const syncLabels = () => {
      const label = ($('#currentLangLabel')?.textContent || '').trim().toUpperCase();
      const htmlLang = (document.documentElement.lang || '').toLowerCase();
      const language = label === 'EN' || htmlLang.startsWith('en') ? 'en' : label === 'AZ' || htmlLang.startsWith('az') ? 'az' : 'ru';
      const values = language === 'en' ? ['Orders', 'Cart'] : language === 'az' ? ['Sifarişlər', 'Səbət'] : ['Заказы', 'Корзина'];
      $('#stackdDockOrdersLabel').textContent = values[0];
      $('#stackdDockCartLabel').textContent = values[1];
    };
    syncLabels();
    const langNode = $('#currentLangLabel');
    if (langNode && 'MutationObserver' in window) {
      new MutationObserver(syncLabels).observe(langNode, { childList: true, characterData: true, subtree: true });
    }
  }

  function addPolishClasses() {
    const nav = $('.nav');
    nav?.classList.add('stackd-visual-nav');
    $('#drawer')?.classList.add('stackd-mobile-sheet');
    $('#orders')?.classList.add('stackd-mobile-sheet');
    $('#editor')?.classList.add('stackd-mobile-sheet');
  }

  function initialise() {
    disableBrowserTranslation();
    buildProfileMenu();
    addMobileDock();
    addPolishClasses();
    window.addEventListener('resize', () => {
      const menu = $('#stackdProfileMenu');
      const trigger = $('#stackdProfileTrigger');
      if (window.innerWidth > 680 && menu?.hidden === false && trigger) {
        menu.style.removeProperty('left');
      }
    }, { passive: true });
    console.info('Stackd visual QA patch loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialise, { once: true });
  } else {
    initialise();
  }
})();
