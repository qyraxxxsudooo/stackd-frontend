/* Stackd storefront — repaired frontend. Keep secrets out of browser code. */
const SUPABASE_URL = 'https://wjlkztgmbqaflcdldapi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DpbANPkD124VOGD3JkS7AA_pd2n_Ong';
const ADMIN_EMAIL = 'yuska20102010@gmail.com';
const PRODUCT_BUCKET = 'product-images';
const QR_BUCKET = 'order-qrs';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = Object.freeze({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' });

if (!window.supabase?.createClient) {
  console.error('[Stackd] Supabase SDK не загрузился ни с одного CDN.');
  const showBootError = () => {
    const panel = document.createElement('section');
    panel.setAttribute('role', 'alert');
    panel.style.cssText = 'max-width:900px;margin:28px auto;padding:20px 24px;border:1px solid #c2500a;border-radius:16px;background:#211b16;color:#fff;font:15px/1.5 system-ui,sans-serif';
    panel.innerHTML = '<strong>Stackd не смог подключить Supabase SDK.</strong><p style="margin:8px 0 0">Проверьте доступ к CDN и обновите страницу. Каталог не будет загружен, пока библиотека Supabase недоступна.</p>';
    document.querySelector('main')?.prepend(panel);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showBootError, { once: true });
  else showBootError();
  throw new Error('Supabase SDK не загружен. Проверьте CDN.');
}
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch]);
const money = value => `${(Number(value) || 0).toFixed(2)} AZN`;
const PLACEHOLDER = 'assets/icons/placeholder.svg';
const DEFAULT_CATEGORIES = ['Burgers', 'Sides', 'Drinks', 'Desserts'];
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const notificationRetryAt = new Map();

const state = {
  products: [], cart: [], category: 'All', query: '', adminQuery: '',
  user: null, profile: null, draft: null, lang: 'ru', catalogError: null,
  sliderTimer: null, ordersTimer: null, topupRequestId: crypto.randomUUID(),
  checkoutBusy: false, productBusy: false
};

const i18n = {
  ru: {
    search_placeholder:'Поиск в Stackd', theme_light:'Светлая', theme_dark:'Тёмная', theme_system:'Авто',
    login_btn:'Войти', logout_btn:'Выйти', catalog_btn:'Каталог', orders_btn:'Мои заказы', menu_title:'Каталог', balance_label:'Баланс',
    footer_desc:'Цифровые предложения и товары Stackd.', footer_support:'Поддержка', footer_about:'О проекте', footer_about_text:'Платформа Stackd.',
    cart_title:'Корзина', cart_total:'Итого', cart_checkout:'Оформить заказ', cart_clear:'Очистить', cart_empty:'Корзина пуста', cart_remove:'Удалить',
    auth_title:'Добро пожаловать', auth_sub:'Войдите или создайте аккаунт', auth_google:'Продолжить с Google', auth_or:'или', auth_login_btn:'Войти', auth_register_btn:'Регистрация',
    topup_title:'Пополнение баланса', topup_card_warn:'Заявка проверяется оператором. Баланс пополнится только после подтверждения.', topup_amount:'Сумма (AZN)', topup_check:'Скриншот чека', topup_btn:'Отправить чек',
    topup_instructions:'Реквизиты для перевода опубликованы в закреплённом сообщении Telegram-канала.', topup_channel:'Открыть Telegram-канал', topup_terms:'Подтверждаю, что данные заявки верны.',
    copy_btn:'Копировать', admin_title:'Управление', admin_tab_products:'Товары', admin_tab_settings:'Настройки сайта', admin_products:'Товары', admin_add:'Добавить', admin_search:'Поиск товаров',
    settings_title:'Настройки главной страницы', settings_hero_title:'Заголовок на главной', settings_hero_sub:'Подзаголовок / описание', settings_save:'Сохранить настройки',
    form_new:'Новый товар', form_edit:'Редактировать', form_name:'Название', form_desc:'Описание', form_cat:'Категория', form_price:'Цена (AZN)', form_image:'Изображение', form_stock:'Количество', form_featured:'Популярное', form_save:'Сохранить',
    added_to_cart:'добавлен в корзину', cart_cleared:'Корзина очищена', checkout_msg:'Заказ создан', product_deleted:'Товар удалён', saved:'Сохранено', out_of_stock:'Нет в наличии', add_to_cart:'В корзину', no_results:'Ничего не найдено.', empty_catalog:'Товаров пока нет.',
    orders_title:'Мои заказы', orders_empty:'У вас пока нет заказов.', order_wait:'Ожидает подтверждения', order_ready:'QR-код готов', order_cancelled:'Отменён', order_completed:'Выполнен', order_expired:'Срок действия QR истёк', order_show_qr:'Нажмите, чтобы открыть QR', order_sum:'Сумма', order_cancel:'Отменить заказ', order_pending_note:'Оператор проверяет заказ. QR появится здесь после подтверждения.', order_time_left:'Осталось', order_expired_note:'Запросите новый QR через поддержку.',
    cancel_confirm:'Отменить заказ? Возврат средств выполняется сервером.',
    empty_error:'Не удалось загрузить каталог. Обновите страницу.'
  },
  en: {
    search_placeholder:'Search Stackd', theme_light:'Light', theme_dark:'Dark', theme_system:'Auto', login_btn:'Log in', logout_btn:'Log out', catalog_btn:'Admin', orders_btn:'My orders', menu_title:'Catalog', balance_label:'Balance',
    footer_desc:'Stackd digital deals and products.', footer_support:'Support', footer_about:'About', footer_about_text:'Stackd platform.', cart_title:'Cart', cart_total:'Total', cart_checkout:'Checkout', cart_clear:'Clear', cart_empty:'Your cart is empty', cart_remove:'Remove',
    auth_title:'Welcome', auth_sub:'Log in or create an account', auth_google:'Continue with Google', auth_or:'or', auth_login_btn:'Log in', auth_register_btn:'Sign up',
    topup_title:'Add balance', topup_card_warn:'Your request is reviewed by an operator. Funds are added only after confirmation.', topup_amount:'Amount (AZN)', topup_check:'Payment receipt image', topup_btn:'Submit receipt', topup_instructions:'Transfer details are published in the pinned Telegram channel message.', topup_channel:'Open Telegram channel', topup_terms:'I confirm that the submitted information is correct.', copy_btn:'Copy',
    admin_title:'Management', admin_tab_products:'Products', admin_tab_settings:'Site settings', admin_products:'Products', admin_add:'Add product', admin_search:'Search products', settings_title:'Homepage settings', settings_hero_title:'Homepage title', settings_hero_sub:'Subtitle / description', settings_save:'Save settings', form_new:'New product', form_edit:'Edit product', form_name:'Name', form_desc:'Description', form_cat:'Category', form_price:'Price (AZN)', form_image:'Image', form_stock:'Quantity', form_featured:'Featured', form_save:'Save',
    added_to_cart:'added to cart', cart_cleared:'Cart cleared', checkout_msg:'Order created', product_deleted:'Product deleted', saved:'Saved', out_of_stock:'Out of stock', add_to_cart:'Add to cart', no_results:'No results found.', empty_catalog:'No products yet.', orders_title:'My orders', orders_empty:'You have no orders yet.', order_wait:'Awaiting confirmation', order_ready:'QR is ready', order_cancelled:'Cancelled', order_completed:'Completed', order_expired:'QR expired', order_show_qr:'Tap to reveal QR', order_sum:'Total', order_cancel:'Cancel order', order_pending_note:'The operator is reviewing your order. The QR will appear here after approval.', order_time_left:'Remaining', order_expired_note:'Contact support to request a new QR.', cancel_confirm:'Cancel this order? The server handles the refund.', empty_error:'Could not load the catalog. Refresh the page.'
  },
  az: {
    search_placeholder:'Stackd-də axtar', theme_light:'Açıq', theme_dark:'Tünd', theme_system:'Avto', login_btn:'Daxil ol', logout_btn:'Çıxış', catalog_btn:'İdarəetmə', orders_btn:'Sifarişlərim', menu_title:'Kataloq', balance_label:'Balans',
    footer_desc:'Stackd rəqəmsal təklifləri və məhsulları.', footer_support:'Dəstək', footer_about:'Layihə haqqında', footer_about_text:'Stackd platforması.', cart_title:'Səbət', cart_total:'Cəmi', cart_checkout:'Sifarişi rəsmiləşdir', cart_clear:'Təmizlə', cart_empty:'Səbət boşdur', cart_remove:'Sil',
    auth_title:'Xoş gəlmisiniz', auth_sub:'Daxil olun və ya hesab yaradın', auth_google:'Google ilə davam et', auth_or:'və ya', auth_login_btn:'Daxil ol', auth_register_btn:'Qeydiyyat',
    topup_title:'Balansı artır', topup_card_warn:'Müraciət operator tərəfindən yoxlanılır. Vəsait yalnız təsdiqdən sonra əlavə olunur.', topup_amount:'Məbləğ (AZN)', topup_check:'Ödəniş qəbzinin şəkli', topup_btn:'Qəbzi göndər', topup_instructions:'Köçürmə rekvizitləri Telegram kanalının sabitlənmiş mesajındadır.', topup_channel:'Telegram kanalını aç', topup_terms:'Müraciət məlumatlarının düzgün olduğunu təsdiq edirəm.', copy_btn:'Kopyala',
    admin_title:'İdarəetmə', admin_tab_products:'Məhsullar', admin_tab_settings:'Sayt ayarları', admin_products:'Məhsullar', admin_add:'Əlavə et', admin_search:'Məhsul axtar', settings_title:'Ana səhifə ayarları', settings_hero_title:'Ana səhifə başlığı', settings_hero_sub:'Alt başlıq / təsvir', settings_save:'Ayarları saxla', form_new:'Yeni məhsul', form_edit:'Məhsulu redaktə et', form_name:'Ad', form_desc:'Təsvir', form_cat:'Kateqoriya', form_price:'Qiymət (AZN)', form_image:'Şəkil', form_stock:'Miqdar', form_featured:'Populyar', form_save:'Saxla',
    added_to_cart:'səbətə əlavə edildi', cart_cleared:'Səbət təmizləndi', checkout_msg:'Sifariş yaradıldı', product_deleted:'Məhsul silindi', saved:'Saxlanıldı', out_of_stock:'Stokda yoxdur', add_to_cart:'Səbətə əlavə et', no_results:'Nəticə tapılmadı.', empty_catalog:'Hələ məhsul yoxdur.', orders_title:'Sifarişlərim', orders_empty:'Hələ sifarişiniz yoxdur.', order_wait:'Təsdiq gözləyir', order_ready:'QR hazırdır', order_cancelled:'Ləğv edildi', order_completed:'Tamamlandı', order_expired:'QR kodun müddəti bitib', order_show_qr:'QR kodu açmaq üçün toxunun', order_sum:'Məbləğ', order_cancel:'Sifarişi ləğv et', order_pending_note:'Operator sifarişi yoxlayır. Təsdiqdən sonra QR burada görünəcək.', order_time_left:'Qalıb', order_expired_note:'Yeni QR üçün dəstəyə müraciət edin.', cancel_confirm:'Sifarişi ləğv etmək istəyirsiniz? Geri ödənişi server həyata keçirir.', empty_error:'Kataloq yüklənmədi. Səhifəni yeniləyin.'
  }
};
const t = key => i18n[state.lang]?.[key] ?? i18n.ru[key] ?? key;

function safeImageUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return PLACEHOLDER;
  try {
    const url = new URL(value, location.origin);
    return url.protocol === 'https:' || url.origin === location.origin ? url.href : PLACEHOLDER;
  } catch { return PLACEHOLDER; }
}
const imageOf = product => safeImageUrl(product?.image_url || product?.image || '');
const isAdmin = () => String(state.user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
const getProduct = id => state.products.find(product => String(product.id) === String(id));
const activeProducts = () => state.products.filter(product => product.active !== false);
function productStock(product) {
  if (product?.stock === null || product?.stock === undefined || product?.stock === '') return Infinity;
  const stock = Number(product.stock);
  return Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : Infinity;
}
const available = product => product && product.available !== false && productStock(product) > 0;

function toast(message, timeout = 2800) {
  const host = $('#toasts');
  if (!host) return;
  const item = document.createElement('div');
  item.className = 'toast';
  item.textContent = String(message);
  host.append(item);
  window.setTimeout(() => {
    item.classList.add('toast-out');
    window.setTimeout(() => item.remove(), reducedMotion() ? 0 : 240);
  }, timeout);
}

const closeTimers = new WeakMap();
function closeDialog(dialog) {
  if (!dialog?.open) return;
  const oldTimer = closeTimers.get(dialog);
  if (oldTimer) clearTimeout(oldTimer);
  if (reducedMotion()) { dialog.close(); return; }
  dialog.classList.add('closing');
  dialog.style.pointerEvents = 'none';
  const timer = setTimeout(() => {
    if (dialog.open) dialog.close();
    dialog.classList.remove('closing');
    dialog.style.pointerEvents = '';
    closeTimers.delete(dialog);
  }, dialog.classList.contains('drawer') ? 260 : 250);
  closeTimers.set(dialog, timer);
}
function openDialog(dialog) {
  if (!dialog || dialog.open) return;
  const oldTimer = closeTimers.get(dialog);
  if (oldTimer) clearTimeout(oldTimer);
  closeTimers.delete(dialog);
  dialog.classList.remove('closing');
  dialog.style.pointerEvents = '';
  dialog.showModal();
}

function saveCart() {
  try { localStorage.setItem('pdd.cart', JSON.stringify(state.cart)); }
  catch (error) { console.warn('Cart persistence unavailable:', error); }
}
function readCart() {
  try {
    const rows = JSON.parse(localStorage.getItem('pdd.cart') || '[]');
    if (!Array.isArray(rows)) return [];
    return rows.filter(row => row && (typeof row.id === 'string' || typeof row.id === 'number') && Number.isInteger(Number(row.qty)) && Number(row.qty) > 0 && Number(row.qty) <= 50)
      .map(row => ({ id: String(row.id), qty: Number(row.qty) }));
  } catch { return []; }
}
state.cart = readCart();

function updateProfileUI() {
  const loggedIn = Boolean(state.user);
  $('#loginBtn')?.toggleAttribute('hidden', loggedIn);
  if ($('#loginBtn')) $('#loginBtn').style.display = loggedIn ? 'none' : '';
  if ($('#userProfile')) $('#userProfile').style.display = loggedIn ? 'flex' : 'none';
  if ($('#myOrdersBtn')) $('#myOrdersBtn').style.display = loggedIn ? '' : 'none';
  if ($('#adminBtn')) $('#adminBtn').style.display = loggedIn && isAdmin() ? '' : 'none';
  if ($('#userBalance')) $('#userBalance').textContent = (Number(state.profile?.balance) || 0).toFixed(2);
  const avatar = state.user?.user_metadata?.avatar_url || state.user?.user_metadata?.picture;
  if ($('#userAvatar')) $('#userAvatar').src = safeImageUrl(avatar);
}

async function refreshProfile() {
  if (!state.user) { state.profile = null; updateProfileUI(); return; }
  const { data, error } = await db.from('profiles').select('id,balance').eq('id', state.user.id).maybeSingle();
  if (error) throw error;
  state.profile = data || null;
  updateProfileUI();
}

async function checkAuth() {
  try {
    const { data, error } = await db.auth.getSession();
    if (error) throw error;
    state.user = data.session?.user || null;
    await refreshProfile();
  } catch (error) {
    console.error('Auth/profile load failed:', error);
    state.user = null; state.profile = null; updateProfileUI();
    toast('Не удалось проверить сессию. Обновите страницу.');
  }
  await Promise.allSettled([loadCatalog(), loadSettings()]);
}

async function loadSettings() {
  const { data, error } = await db.from('site_settings').select('key,value');
  if (error) { console.warn('Settings load failed:', error); return; }
  for (const item of data || []) {
    if (item.key === 'hero_title' && $('#settingHeroTitle')) $('#settingHeroTitle').value = item.value || '';
    if (item.key === 'hero_subtitle' && $('#settingHeroSub')) $('#settingHeroSub').value = item.value || '';
  }
}

async function loadCatalog() {
  state.catalogError = null;
  const [slidesResult, productsResult] = await Promise.all([
    db.from('slides').select('image_url,title,description'),
    db.from('products').select('*')
  ]);
  if (slidesResult.error) { console.warn('Slides load failed:', slidesResult.error); initSlider([]); }
  else initSlider(slidesResult.data || []);
  if (productsResult.error) {
    console.error('Products load failed:', productsResult.error);
    state.products = [];
    state.catalogError = t('empty_error');
  } else {
    state.products = Array.isArray(productsResult.data) ? productsResult.data : [];
  }
  // Drop stale products and quantities which exceed the current stock.
  state.cart = state.cart.flatMap(item => {
    const product = getProduct(item.id);
    if (!product || !available(product)) return [];
    const max = productStock(product);
    return [{ id: String(item.id), qty: Math.min(item.qty, Number.isFinite(max) ? max : 50, 50) }].filter(row => row.qty > 0);
  });
  saveCart();
  renderAll();
}

function renderProductCard(product) {
  const stock = productStock(product);
  const inStock = available(product);
  const stockText = Number.isFinite(stock) ? `${stock} шт.` : '';
  return `<article class="card ${inStock ? '' : 'is-out'}" data-id="${escapeHTML(product.id)}">
    ${product.featured ? '<span class="badge-popular">ХИТ</span>' : ''}
    <button class="card-media" type="button" data-act="detail" aria-label="${escapeHTML(product.name)}">
      <img src="${escapeHTML(imageOf(product))}" alt="${escapeHTML(product.name)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
    </button>
    <div class="card-body">
      <span class="tag">${escapeHTML(product.category || '')}</span>
      <h3>${escapeHTML(product.name || 'Товар')}</h3>
      <p>${escapeHTML(product.description || '')}</p>
      ${stockText ? `<span class="stock-info ${stock < 5 ? 'stock-low' : ''}">${stockText}</span>` : ''}
      <div class="card-foot"><strong>${money(product.price)}</strong>
        <button class="btn btn-primary sm" type="button" data-act="add" ${inStock ? '' : 'disabled'}>${inStock ? t('add_to_cart') : t('out_of_stock')}</button>
      </div>
    </div>
  </article>`;
}

function renderAll() {
  const products = activeProducts();
  const categories = ['All', ...new Set([...DEFAULT_CATEGORIES, ...products.map(product => product.category).filter(Boolean)])]
    .filter(category => category === 'All' || products.some(product => product.category === category));
  if (!categories.includes(state.category)) state.category = 'All';
  if ($('#chips')) {
    $('#chips').innerHTML = `<div class="chips-slider" id="chipsSlider"></div>` + categories.map(category => `<button type="button" data-act="cat" data-cat="${escapeHTML(category)}" aria-pressed="${state.category === category}">${category === 'All' ? (state.lang === 'en' ? 'All' : state.lang === 'az' ? 'Hamısı' : 'Все') : escapeHTML(category)}</button>`).join('');
    updateChipsSlider();
  }
  const query = normalizeSearch(state.query);
  const filtered = products.filter(product => (state.category === 'All' || product.category === state.category) &&
    (!query || normalizeSearch([product.name, product.description, product.category].join(' ')).includes(query)));
  if ($('#grid')) {
    $('#grid').innerHTML = filtered.length ? filtered.map(renderProductCard).join('') :
      `<div class="state"><p>${escapeHTML(state.catalogError || (products.length ? t('no_results') : t('empty_catalog')))}</p></div>`;
  }
  renderCart();
  if ($('#editor')?.open) renderAdmin();
}

function normalizeSearch(value) {
  return String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
}

function renderSuggestions(value) {
  const box = $('#searchSuggestions');
  if (!box) return;
  if (!value) { box.classList.remove('active'); box.replaceChildren(); return; }
  const query = normalizeSearch(value);
  const matches = activeProducts().filter(product => normalizeSearch([product.name, product.description, product.category].join(' ')).includes(query)).slice(0, 5);
  box.innerHTML = matches.length ? matches.map(product => `<button type="button" class="suggestion-item" data-id="${escapeHTML(product.id)}"><img src="${escapeHTML(imageOf(product))}" alt=""><span><span class="s-title">${escapeHTML(product.name)}</span><span class="s-cat">${escapeHTML(product.category || '')}</span></span></button>`).join('') : `<div class="suggestion-empty">${escapeHTML(t('no_results'))}</div>`;
  box.classList.add('active');
}

function updateChipsSlider() {
  const active = $('#chips button[aria-pressed="true"]'), slider = $('#chipsSlider');
  if (!active || !slider) return;
  slider.style.width = `${active.offsetWidth}px`;
  slider.style.transform = `translateX(${active.offsetLeft}px)`;
}
function updateThemeSlider() {
  const active = $('.seg button[aria-pressed="true"]'), slider = $('#themeSlider');
  if (!active || !slider) return;
  slider.style.width = `${active.offsetWidth}px`;
  slider.style.transform = `translateX(${active.offsetLeft - 3}px)`;
}
function applyTheme() {
  let theme = 'system';
  try { theme = localStorage.getItem('pdd.theme') || 'system'; } catch { /* storage can be disabled */ }
  const valid = ['light', 'dark', 'system'].includes(theme) ? theme : 'system';
  const dark = valid === 'system' ? matchMedia('(prefers-color-scheme: dark)').matches : valid === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $$('.seg button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.v === valid)));
  requestAnimationFrame(updateThemeSlider);
}
function applyLanguage(language) {
  state.lang = Object.hasOwn(i18n, language) ? language : 'ru';
  try { localStorage.setItem('pdd.lang', state.lang); } catch { /* storage can be disabled */ }
  document.documentElement.lang = state.lang;
  if ($('#currentLangLabel')) $('#currentLangLabel').textContent = state.lang.toUpperCase();
  $$('[data-i18n]').forEach(element => {
    const key = element.dataset.i18n;
    if (i18n[state.lang][key]) element.textContent = i18n[state.lang][key];
  });
  $$('[data-i18n-placeholder]').forEach(element => {
    const key = element.dataset.i18nPlaceholder;
    if (i18n[state.lang][key]) element.placeholder = i18n[state.lang][key];
  });
  renderAll();
  if ($('#orders')?.open) loadOrders();
}

function cartLines() {
  return state.cart.map(item => ({ product: getProduct(item.id), qty: item.qty })).filter(line => line.product);
}
function renderCart() {
  const rows = cartLines();
  const quantity = rows.reduce((sum, row) => sum + row.qty, 0);
  const total = rows.reduce((sum, row) => sum + row.qty * (Number(row.product.price) || 0), 0);
  if ($('#badge')) $('#badge').textContent = quantity;
  if ($('#total')) $('#total').textContent = money(total);
  if ($('#lines')) {
    $('#lines').innerHTML = rows.length ? rows.map(({ product, qty }) => `<li data-id="${escapeHTML(product.id)}">
      <img src="${escapeHTML(imageOf(product))}" alt="${escapeHTML(product.name)}" onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
      <div><strong>${escapeHTML(product.name)}</strong><small>${money(product.price)}</small><div class="qty">
        <button type="button" data-act="dec" aria-label="−">−</button><span>${qty}</span><button type="button" data-act="inc" aria-label="+">+</button>
      </div></div><button type="button" class="link" data-act="rm">${t('cart_remove')}</button></li>`).join('') : `<li class="cart-empty">${t('cart_empty')}</li>`;
  }
  const empty = !rows.length;
  if ($('#checkoutBtn')) $('#checkoutBtn').disabled = empty || state.checkoutBusy;
  if ($('#clearBtn')) $('#clearBtn').disabled = empty;
}
function animateBadge() {
  const badge = $('#badge'); if (!badge) return;
  badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop');
}
function setQuantity(id, delta) {
  const key = String(id), product = getProduct(key);
  if (!product) return;
  const stock = productStock(product);
  const existing = state.cart.find(item => String(item.id) === key);
  const current = existing?.qty || 0;
  const next = delta > 0 ? Math.min(50, stock, current + delta) : Math.max(0, current + delta);
  if (delta > 0 && next === current) { toast(stock < 1 ? t('out_of_stock') : 'Достигнут лимит количества.'); return; }
  if (next <= 0) state.cart = state.cart.filter(item => String(item.id) !== key);
  else if (existing) existing.qty = next;
  else state.cart.push({ id: key, qty: next });
  saveCart(); renderCart(); animateBadge();
}

function openProductDetail(id) {
  const product = getProduct(id);
  if (!product) return;
  const body = $('#detailBody');
  if (!body) return;
  body.innerHTML = `<div class="detail" data-id="${escapeHTML(product.id)}">
    <img class="detail-image" src="${escapeHTML(imageOf(product))}" alt="${escapeHTML(product.name)}" onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
    <span class="tag">${escapeHTML(product.category || '')}</span><h2>${escapeHTML(product.name)}</h2><p>${escapeHTML(product.description || '')}</p>
    <div class="card-foot"><strong>${money(product.price)}</strong><button class="btn btn-primary" type="button" data-act="add" ${available(product) ? '' : 'disabled'}>${available(product) ? t('add_to_cart') : t('out_of_stock')}</button></div>
  </div>`;
  openDialog($('#detail'));
}

function initSlider(slides) {
  const container = $('#showcaseSlider');
  if (!container) return;
  if (state.sliderTimer) clearInterval(state.sliderTimer);
  const valid = (Array.isArray(slides) ? slides : []).filter(slide => slide && typeof slide.title === 'string' && typeof slide.image_url === 'string' && slide.image_url.trim());
  const items = valid.length ? valid : [{ title:'Добро пожаловать в Stackd', description:'Цифровые предложения Stackd', image_url:'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&auto=format&fit=crop&q=85' }];
  container.innerHTML = items.map((slide, index) => `<div class="slide ${index === 0 ? 'active' : ''}" aria-hidden="${index !== 0}">
    <img src="${escapeHTML(safeImageUrl(slide.image_url))}" alt="${escapeHTML(slide.title)}" loading="${index === 0 ? 'eager' : 'lazy'}" onerror="this.onerror=null;this.src='${PLACEHOLDER}'">
    <div class="slide-content"><h2>${escapeHTML(slide.title)}</h2><p>${escapeHTML(slide.description || '')}</p></div></div>`).join('');
  if (items.length < 2 || reducedMotion()) return;
  let current = 0;
  state.sliderTimer = setInterval(() => {
    if (document.hidden) return;
    const elements = $$('.slide', container);
    if (elements.length < 2) return;
    elements[current].classList.remove('active'); elements[current].setAttribute('aria-hidden', 'true');
    current = (current + 1) % elements.length;
    elements[current].classList.add('active'); elements[current].setAttribute('aria-hidden', 'false');
  }, 5000);
}

function openOrders() {
  if (!state.user) { openDialog($('#auth')); return; }
  openDialog($('#orders'));
  loadOrders();
  if (state.ordersTimer) clearInterval(state.ordersTimer);
  state.ordersTimer = setInterval(() => { if ($('#orders')?.open && !document.hidden) loadOrders(); }, 10000);
}
async function qrImageUrl(value) {
  if (!value) return '';
  if (/^https:\/\//i.test(value)) return safeImageUrl(value);
  const { data, error } = await db.storage.from(QR_BUCKET).createSignedUrl(value, 35 * 60);
  if (error) { console.warn('QR signed URL failed:', error); return ''; }
  return data?.signedUrl || '';
}
function orderStatus(order) {
  if (order.status === 'ready' && order.qr_expires_at && new Date(order.qr_expires_at).getTime() <= Date.now()) return 'expired';
  if (order.status === 'pending') return 'pending';
  if (order.status === 'ready') return 'ready';
  if (order.status === 'cancelled') return 'cancelled';
  if (order.status === 'completed') return 'completed';
  return 'pending';
}
async function loadOrders() {
  const list = $('#ordersList');
  if (!list || !state.user) return;
  list.innerHTML = '<div class="state">Загрузка…</div>';
  const { data, error } = await db.from('orders').select('id,user_id,total,items,status,created_at,qr_code_url,qr_expires_at,telegram_notified_at')
    .eq('user_id', state.user.id).order('created_at', { ascending: false }).limit(50);
  if (error) { console.error('Orders load failed:', error); list.innerHTML = `<div class="msg">Не удалось загрузить заказы: ${escapeHTML(error.message)}</div>`; return; }
  if (!data?.length) { list.innerHTML = `<div class="state">${t('orders_empty')}</div>`; return; }
  // Retry an order notification after transient network/Telegram errors; the server claim is idempotent.
  for (const order of data) {
    if (order.status !== 'pending' || order.telegram_notified_at) continue;
    const lastTry = notificationRetryAt.get(String(order.id)) || 0;
    if (Date.now() - lastTry < 30000) continue;
    notificationRetryAt.set(String(order.id), Date.now());
    db.functions.invoke('notify-telegram', { body: { orderId: order.id } }).then(({ error, data: result }) => {
      if (error || result?.ok === false) console.warn('Retrying order notification failed:', error || result);
    }).catch(error => console.warn('Retrying order notification failed:', error));
  }
  const cards = await Promise.all(data.map(async order => {
    const status = orderStatus(order);
    const qrUrl = status === 'ready' ? await qrImageUrl(order.qr_code_url) : '';
    const canCancel = status === 'pending' && new Date(order.created_at).getTime() + 120000 > Date.now();
    const statusLabel = ({ pending:t('order_wait'), ready:t('order_ready'), cancelled:t('order_cancelled'), completed:t('order_completed'), expired:t('order_expired') })[status];
    if (status === 'ready' && qrUrl) return `<article class="order-card order-ready" data-order-id="${escapeHTML(order.id)}">
      <button class="flip-card" type="button" data-act="flip-order" aria-label="${t('order_show_qr')}">
        <span class="flip-card-inner"><span class="flip-card-front"><span class="order-header"><strong>Заказ #${escapeHTML(String(order.id).slice(0, 8).toUpperCase())}</strong><span class="order-status status-ready">${statusLabel}</span></span>
          <strong>${t('order_show_qr')}</strong><span>${t('order_sum')}: ${money(order.total)}</span></span>
        <span class="flip-card-back"><img class="qr-image" src="${escapeHTML(qrUrl)}" alt="QR заказа" loading="lazy"><span class="timer-badge" data-expires="${escapeHTML(order.qr_expires_at || '')}"></span></span></span>
      </button></article>`;
    const note = status === 'pending' ? `<p class="order-note">${t('order_pending_note')}</p>` : status === 'expired' ? `<p class="order-note">${t('order_expired_note')}</p>` : status === 'ready' ? '<p class="order-note">QR уже выдан, но изображение пока недоступно. Обновите страницу или обратитесь в поддержку.</p>' : '';
    return `<article class="order-card" data-order-id="${escapeHTML(order.id)}">
      <div class="order-header"><strong>Заказ #${escapeHTML(String(order.id).slice(0, 8).toUpperCase())}</strong><span class="order-status status-${status}">${statusLabel}</span></div>
      <div class="order-total">${t('order_sum')}: ${money(order.total)}</div>${note}
      ${canCancel ? `<button class="btn btn-ghost block sm" type="button" data-act="cancel-order" data-order="${escapeHTML(order.id)}">${t('order_cancel')}</button>` : ''}
    </article>`;
  }));
  list.innerHTML = cards.join('');
  updateOrderTimers();
}
function updateOrderTimers() {
  $$('[data-expires]').forEach(element => {
    const expiry = new Date(element.dataset.expires).getTime();
    const seconds = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
    if (!Number.isFinite(expiry) || seconds <= 0) { element.textContent = t('order_expired'); element.classList.remove('active'); return; }
    const minutes = Math.floor(seconds / 60), remainder = seconds % 60;
    element.textContent = `${t('order_time_left')}: ${minutes}:${String(remainder).padStart(2, '0')}`;
    element.classList.add('active');
  });
}
setInterval(() => { if ($('#orders')?.open) updateOrderTimers(); }, 1000);
async function cancelOrder(orderId) {
  if (!state.user || !confirm(t('cancel_confirm'))) return;
  const button = $(`[data-act="cancel-order"][data-order="${CSS.escape(orderId)}"]`);
  if (button) button.disabled = true;
  try {
    const { error } = await db.rpc('cancel_order', { order_uuid: orderId });
    if (error) throw error;
    toast('Заказ отменён.');
    await Promise.allSettled([refreshProfile(), loadOrders()]);
  } catch (error) {
    console.error('Order cancellation failed:', error);
    toast(`Не удалось отменить заказ: ${error.message}`);
    if (button) button.disabled = false;
  }
}

async function checkout() {
  if (state.checkoutBusy) return;
  if (!state.user) { openDialog($('#auth')); return; }
  const rows = cartLines();
  if (!rows.length) return;
  state.checkoutBusy = true;
  const button = $('#checkoutBtn');
  if (button) { button.disabled = true; button.dataset.originalText ||= button.textContent; button.textContent = 'Оформление…'; }
  try {
    const cartItems = rows.map(({ product, qty }) => ({ id: product.id, qty }));
    const { data, error } = await db.rpc('checkout_order', { cart_items: cartItems });
    if (error) throw error;
    const orderId = typeof data === 'string' ? data : data?.orderId || data?.order_id || data?.id;
    if (!orderId) throw new Error('Сервер не вернул ID созданного заказа.');

    state.cart = []; saveCart(); renderCart(); closeDialog($('#drawer'));
    toast(t('checkout_msg'));
    const { data: notification, error: notificationError } = await db.functions.invoke('notify-telegram', { body: { orderId } });
    if (notificationError || notification?.ok === false) {
      console.error('Telegram order notification failed:', notificationError || notification);
      toast('Заказ создан, но уведомление оператору не отправлено. Свяжитесь с поддержкой.', 5000);
    }
    await Promise.allSettled([refreshProfile(), loadOrders()]);
    openOrders();
  } catch (error) {
    console.error('Checkout failed:', error);
    toast(`Не удалось оформить заказ: ${error.message}`, 5000);
  } finally {
    state.checkoutBusy = false;
    if (button) { button.disabled = !cartLines().length; button.textContent = button.dataset.originalText || t('cart_checkout'); }
  }
}

function setDraft(product = null) {
  clearPreviewObjectUrl();
  state.draft = product ? { ...product } : { id: crypto.randomUUID(), name:'', description:'', price:0, category:'Burgers', stock:10, featured:false, image_url:'' };
  const form = $('#pform');
  if (!form) return;
  form.elements.pn.value = state.draft.name || '';
  form.elements.pd.value = state.draft.description || '';
  form.elements.pc.value = state.draft.category || 'Burgers';
  form.elements.pp.value = state.draft.price ?? '';
  if (form.elements.pStock) form.elements.pStock.value = state.draft.stock ?? 10;
  if (form.elements.pFeatured) form.elements.pFeatured.checked = Boolean(state.draft.featured);
  form.elements.pf.value = '';
  const oldImage = state.draft.image_url || state.draft.image || '';
  showProductPreview(oldImage ? imageOf(state.draft) : '', oldImage ? 'Текущее изображение' : '');
  $('#formMsg').textContent = '';
  $('#formTitle').textContent = product ? t('form_edit') : t('form_new');
}
let previewObjectUrl = null;
function clearPreviewObjectUrl() {
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = null;
}
function showProductPreview(src, name = '') {
  const wrap = $('#productImagePreviewWrap'), image = $('#productImagePreview');
  if (!wrap || !image) return;
  if (!src) { wrap.hidden = true; image.removeAttribute('src'); $('#productImagePreviewName').textContent = ''; return; }
  image.src = src; wrap.hidden = false; $('#productImagePreviewName').textContent = name;
}
async function validateImage(file) {
  if (!(file instanceof File)) throw new Error('Выберите файл изображения.');
  if (!Object.hasOwn(IMAGE_TYPES, file.type)) throw new Error('Поддерживаются JPEG, PNG и WebP.');
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) throw new Error('Файл должен быть размером не более 5 МБ.');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((byte, index) => bytes[index] === byte);
  const webp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP';
  if (!(jpeg || png || webp)) throw new Error('Содержимое файла не соответствует формату изображения.');
}
async function uploadProductImage(file) {
  await validateImage(file);
  const path = `products/${crypto.randomUUID()}.${IMAGE_TYPES[file.type]}`;
  const { error } = await db.storage.from(PRODUCT_BUCKET).upload(path, file, { cacheControl:'31536000', upsert:false, contentType:file.type });
  if (error) throw error;
  const { data } = db.storage.from(PRODUCT_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) { await db.storage.from(PRODUCT_BUCKET).remove([path]); throw new Error('Не удалось получить URL изображения. Проверьте bucket product-images.'); }
  return { path, url:data.publicUrl };
}
function productStoragePath(url) {
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${PRODUCT_BUCKET}/`;
    const position = parsed.pathname.indexOf(marker);
    return position >= 0 ? decodeURIComponent(parsed.pathname.slice(position + marker.length)) : null;
  } catch { return null; }
}

async function saveProduct(event) {
  event.preventDefault();
  if (state.productBusy) return;
  const message = $('#formMsg');
  let uploadedPath = null;
  const oldImageUrl = state.draft?.image_url || state.draft?.image || '';
  try {
    if (!isAdmin()) throw new Error('Недостаточно прав.');
    if (!state.draft) throw new Error('Сначала выберите товар.');
    const form = $('#pform').elements;
    const name = form.pn.value.trim(), description = form.pd.value.trim(), category = form.pc.value.trim();
    const price = Number(form.pp.value);
    const stock = Number(form.pStock?.value ?? state.draft.stock ?? 0);
    if (!name || !category) throw new Error('Заполните название и категорию.');
    if (!Number.isFinite(price) || price < 0 || price > 100000 || Math.round(price * 100) !== price * 100) throw new Error('Цена должна быть от 0 до 100 000 AZN и содержать не более 2 знаков после запятой.');
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000) throw new Error('Укажите корректное количество от 0 до 100 000.');
    const file = form.pf.files?.[0];
    state.productBusy = true;
    const submit = $('#pform button[type="submit"]'); if (submit) submit.disabled = true;
    message.textContent = 'Сохранение…';
    let imageUrl = oldImageUrl;
    if (file) { const uploaded = await uploadProductImage(file); uploadedPath = uploaded.path; imageUrl = uploaded.url; }
    const payload = { name, description, category, price, stock, featured:Boolean(form.pFeatured?.checked), image_url:imageUrl };
    const exists = state.products.some(product => String(product.id) === String(state.draft.id));
    const result = exists
      ? await db.from('products').update(payload).eq('id', state.draft.id).select('*').maybeSingle()
      : await db.from('products').insert(payload).select('*').single();
    if (result.error) throw result.error;
    if (!result.data) throw new Error('База данных не вернула сохранённый товар.');
    const oldPath = productStoragePath(oldImageUrl), newPath = productStoragePath(imageUrl);
    if (oldPath && oldPath !== newPath) {
      const { error } = await db.storage.from(PRODUCT_BUCKET).remove([oldPath]);
      if (error) console.warn('Old image cleanup failed:', error);
    }
    uploadedPath = null;
    clearPreviewObjectUrl();
    await loadCatalog();
    setDraft(null);
    message.textContent = t('saved');
    toast(t('saved'));
  } catch (error) {
    console.error('Product save failed:', error);
    if (uploadedPath) { const { error: cleanupError } = await db.storage.from(PRODUCT_BUCKET).remove([uploadedPath]); if (cleanupError) console.warn('Orphan image cleanup failed:', cleanupError); }
    message.textContent = `Ошибка сохранения: ${error.message}`;
  } finally {
    state.productBusy = false;
    const submit = $('#pform button[type="submit"]'); if (submit) submit.disabled = false;
  }
}

async function deleteProduct(id) {
  const product = getProduct(id);
  if (!product || !isAdmin()) { toast('Недостаточно прав.'); return; }
  if (!confirm(`Удалить «${product.name}»?`)) return;
  const { error } = await db.from('products').delete().eq('id', id);
  if (error) { toast(`Не удалось удалить товар: ${error.message}`, 5000); return; }
  const path = productStoragePath(product.image_url || product.image || '');
  if (path) { const cleanup = await db.storage.from(PRODUCT_BUCKET).remove([path]); if (cleanup.error) console.warn('Image cleanup failed:', cleanup.error); }
  state.products = state.products.filter(item => String(item.id) !== String(id));
  state.cart = state.cart.filter(item => String(item.id) !== String(id)); saveCart();
  if (String(state.draft?.id) === String(id)) setDraft(null);
  renderAll(); renderAdmin(); toast(t('product_deleted'));
}
function renderAdmin() {
  const query = normalizeSearch(state.adminQuery);
  const products = state.products.filter(product => !query || normalizeSearch([product.name, product.category].join(' ')).includes(query));
  if ($('#adminCount')) $('#adminCount').textContent = `${state.products.length} шт.`;
  if ($('#adminList')) $('#adminList').innerHTML = products.length ? products.map(product => `<li data-id="${escapeHTML(product.id)}" class="${product.active === false ? 'off' : ''}">
    <img src="${escapeHTML(imageOf(product))}" alt="" onerror="this.onerror=null;this.src='${PLACEHOLDER}'"><div class="info"><strong>${escapeHTML(product.name)}</strong><small>${escapeHTML(product.category || '')} · ${money(product.price)} · ${Number(product.stock ?? 0)} шт.</small></div>
    <div class="acts"><button type="button" class="btn btn-ghost sm" data-act="edit">Ред.</button><button type="button" class="btn btn-ghost sm" data-act="del">Удал.</button></div></li>`).join('') : '<li>Ничего не найдено.</li>';
}

async function submitTopup(event) {
  event.preventDefault();
  const form = $('#topupForm'), button = form?.querySelector('button[type="submit"]'), message = $('#topupMsg');
  if (!state.user) { openDialog($('#auth')); return; }
  try {
    if (!$('#termsCheck')?.checked) throw new Error('Подтвердите условия.');
    const amount = Number($('#topupAmount')?.value);
    const file = $('#topupFile')?.files?.[0];
    if (!Number.isFinite(amount) || amount < 1 || amount > 100 || Math.round(amount * 100) !== amount * 100) throw new Error('Сумма должна быть от 1 до 100 AZN.');
    await validateImage(file);
    if (button) button.disabled = true;
    if (message) message.textContent = 'Отправка заявки…';
    const body = new FormData();
    body.append('amount', String(amount));
    body.append('file', file, file.name);
    body.append('requestId', state.topupRequestId);
    const { data, error } = await db.functions.invoke('submit-topup', { body });
    if (error) throw error;
    if (!data?.ok) throw new Error(data?.message || 'Сервер не подтвердил заявку.');
    if (message) message.textContent = data?.queued
      ? 'Заявка сохранена. Уведомление оператору уже отправляется; повторную заявку создавать не нужно.'
      : 'Заявка отправлена. Баланс изменится после проверки оператором.';
    form.reset();
    state.topupRequestId = crypto.randomUUID();
    toast('Заявка на пополнение отправлена.');
  } catch (error) {
    console.error('Top-up submission failed:', error);
    if (message) message.textContent = error.message || 'Не удалось отправить заявку.';
  } finally { if (button) button.disabled = false; }
}

function applyAdminTab(tabName) {
  $$('.admin-tabs [data-tab]').forEach(button => button.classList.toggle('active', button.dataset.tab === tabName));
  $$('.tab-content').forEach(panel => { panel.style.display = panel.id === `tab-${tabName}` ? '' : 'none'; });
}

const actions = {
  add: id => { const product = getProduct(id); if (!available(product)) return toast(t('out_of_stock')); setQuantity(id, 1); toast(`${product.name} ${t('added_to_cart')}`); },
  inc: id => setQuantity(id, 1), dec: id => setQuantity(id, -1),
  rm: id => { state.cart = state.cart.filter(item => String(item.id) !== String(id)); saveCart(); renderCart(); animateBadge(); },
  clear: () => { state.cart = []; saveCart(); renderCart(); toast(t('cart_cleared')); },
  checkout,
  detail: openProductDetail,
  'cart-open': () => { renderCart(); openDialog($('#drawer')); },
  auth: () => openDialog($('#auth')),
  manage: () => { if (!isAdmin()) return toast('Доступ только владельцу проекта.'); openDialog($('#editor')); setDraft(null); renderAdmin(); applyAdminTab('products'); },
  'toggle-lang': () => $('#langDropdown')?.classList.toggle('active'),
  close: (_, button) => closeDialog(button.closest('dialog')),
  cat: (_, button) => { state.category = button.dataset.cat; renderAll(); },
  theme: (_, button) => { try { localStorage.setItem('pdd.theme', button.dataset.v); } catch {} applyTheme(); },
  new: () => { if (!isAdmin()) return toast('Недостаточно прав.'); setDraft(null); },
  edit: id => { if (!isAdmin()) return toast('Недостаточно прав.'); const product = getProduct(id); if (product) setDraft(product); },
  del: deleteProduct,
  'flip-order': (_, button) => { const card = button.closest('.flip-card'); card?.classList.toggle('flipped'); },
  'cancel-order': (_, button) => cancelOrder(button.dataset.order)
};

document.addEventListener('click', event => {
  const button = event.target.closest('[data-act]');
  if (button) {
    const id = button.closest('[data-id]')?.dataset.id;
    const action = actions[button.dataset.act];
    if (action) { Promise.resolve(action(id, button)).catch(error => { console.error('Action failed:', error); toast(error.message || 'Произошла ошибка.'); }); }
  } else if (event.target instanceof HTMLDialogElement) closeDialog(event.target);
  if (!event.target.closest('.lang-selector')) $('#langDropdown')?.classList.remove('active');
});

$('#searchForm')?.addEventListener('submit', event => event.preventDefault());
$('#q')?.addEventListener('input', event => { state.query = event.target.value || ''; renderAll(); renderSuggestions(state.query.trim()); });
$('#searchSuggestions')?.addEventListener('click', event => {
  const item = event.target.closest('.suggestion-item'); if (!item) return;
  const product = getProduct(item.dataset.id); if (!product) return;
  $('#q').value = ''; state.query = ''; $('#searchSuggestions').classList.remove('active'); renderAll();
  document.querySelector(`.card[data-id="${CSS.escape(String(product.id))}"]`)?.scrollIntoView({ behavior:reducedMotion() ? 'auto' : 'smooth', block:'center' });
  document.querySelector(`.card[data-id="${CSS.escape(String(product.id))}"]`)?.classList.add('card-highlight');
});
document.addEventListener('click', event => { if (!event.target.closest('.search-container')) $('#searchSuggestions')?.classList.remove('active'); });
$('#myOrdersBtn')?.addEventListener('click', openOrders);
$('#pform')?.addEventListener('submit', saveProduct);
$('#adminSearch')?.addEventListener('input', event => { state.adminQuery = event.target.value.trim(); renderAdmin(); });
$$('.admin-tabs [data-tab]').forEach(button => button.addEventListener('click', () => applyAdminTab(button.dataset.tab)));
$('#pf')?.addEventListener('change', async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try { await validateImage(file); clearPreviewObjectUrl(); previewObjectUrl = URL.createObjectURL(file); showProductPreview(previewObjectUrl, `${file.name} · ${(file.size / 1048576).toFixed(2)} МБ`); $('#formMsg').textContent = ''; }
  catch (error) { event.target.value = ''; showProductPreview(state.draft?.image_url ? imageOf(state.draft) : ''); $('#formMsg').textContent = error.message; }
});
$('#clearProductImage')?.addEventListener('click', () => { clearPreviewObjectUrl(); $('#pf').value = ''; if (state.draft) { state.draft.image_url = ''; state.draft.image = ''; } showProductPreview(''); });
$('#saveSettingsBtn')?.addEventListener('click', async () => {
  if (!isAdmin()) return toast('Недостаточно прав.');
  const message = $('#settingsMsg'); message.textContent = 'Сохранение…';
  const rows = [ { key:'hero_title', value:$('#settingHeroTitle').value.trim() }, { key:'hero_subtitle', value:$('#settingHeroSub').value.trim() } ];
  const { error } = await db.from('site_settings').upsert(rows, { onConflict:'key' });
  message.textContent = error ? `Ошибка: ${error.message}` : t('saved');
  if (!error) toast(t('saved'));
});
$('#topupBtn')?.addEventListener('click', () => { if (!state.user) return openDialog($('#auth')); openDialog($('#topup')); });
$('#topupForm')?.addEventListener('submit', submitTopup);

$('#authForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  const email = $('#emailInput').value.trim(), password = $('#passInput').value;
  const message = $('#authMsg');
  if (!email || !password) { message.textContent = 'Заполните все поля.'; return; }
  const button = $('#authForm button[type="submit"]'); if (button) button.disabled = true;
  message.textContent = 'Проверка…';
  try {
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    closeDialog($('#auth')); toast('Вы вошли.'); await checkAuth();
  } catch (error) { message.textContent = 'Не удалось войти: ' + error.message; }
  finally { if (button) button.disabled = false; }
});
$('#signUpBtn')?.addEventListener('click', async () => {
  const email = $('#emailInput').value.trim(), password = $('#passInput').value;
  const message = $('#authMsg');
  if (!email || !password) { message.textContent = 'Заполните все поля.'; return; }
  if (password.length < 6) { message.textContent = 'Пароль должен содержать не менее 6 символов.'; return; }
  const button = $('#signUpBtn'); button.disabled = true; message.textContent = 'Создание аккаунта…';
  try {
    const { data, error } = await db.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.session) { message.textContent = 'Проверьте почту и подтвердите адрес, затем войдите.'; return; }
    closeDialog($('#auth')); toast('Аккаунт создан.'); await checkAuth();
  } catch (error) { message.textContent = 'Ошибка регистрации: ' + error.message; }
  finally { button.disabled = false; }
});
$('#googleLoginBtn')?.addEventListener('click', async () => {
  const { error } = await db.auth.signInWithOAuth({ provider:'google', options:{ redirectTo:location.origin } });
  if (error) toast('Ошибка Google: ' + error.message, 5000);
});
$('#logoutBtn')?.addEventListener('click', async () => {
  const { error } = await db.auth.signOut();
  if (error) return toast('Не удалось выйти: ' + error.message);
  state.user = null; state.profile = null; updateProfileUI(); closeDialog($('#orders')); toast('Вы вышли из аккаунта.');
});

db.auth.onAuthStateChange((_event, session) => {
  queueMicrotask(async () => {
    state.user = session?.user || null;
    try { await refreshProfile(); } catch (error) { console.error(error); }
    if (!state.user && $('#orders')?.open) closeDialog($('#orders'));
  });
});
window.addEventListener('focus', () => { if (state.user) refreshProfile().catch(console.error); });
