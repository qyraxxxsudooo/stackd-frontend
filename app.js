const SUPABASE_URL = 'https://wjlkztgmbqaflcdldapi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DpbANPkD124VOGD3JkS7AA_pd2n_Ong';
const ADMIN_EMAIL = 'yuska20102010@gmail.com';
const PRODUCT_BUCKET = 'product-images';
const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = Object.freeze({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' });

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.stackdSupabase = _supabase;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => (Number(n) || 0).toFixed(2) + ' AZN';
const PH = 'assets/icons/placeholder.svg';
const CATS = ['Burgers', 'Sides', 'Drinks', 'Desserts'];
// Sticky events connect the modules: a subscriber that registers late (the other scripts are deferred and
// load after app.js has already started fetching) immediately receives the latest value.
const stickyEvents = new Map();
function publish(name, detail = {}) { stickyEvents.set(name, detail); document.dispatchEvent(new CustomEvent(name, { detail })); }
function subscribe(name, handler) { document.addEventListener(name, event => handler(event.detail)); if (stickyEvents.has(name)) handler(stickyEvents.get(name)); }
const S = {
  products: [], cart: [], cat: 'All', q: '', adminQ: '', user: null, profile: null,
  draft: null, lang: 'ru', catalogError: null, catalogReady: false, catalogSig: '', catalogAt: 0,
  slides: [], icons: {}, ordersTimer: null, ordersBusy: false,
  checkoutBusy: false, topupRequestId: crypto.randomUUID(), qrCache: new Map()
};

try {
  const cached = JSON.parse(localStorage.getItem('pdd.cart') || '[]');
  S.cart = Array.isArray(cached)
    ? cached.filter(x => x && (typeof x.id === 'string' || typeof x.id === 'number') && Number.isInteger(Number(x.qty)) && Number(x.qty) > 0 && Number(x.qty) <= 50).map(x => ({ id: String(x.id), qty: Number(x.qty) }))
    : [];
} catch { S.cart = []; }
const saveCart = () => { try { localStorage.setItem('pdd.cart', JSON.stringify(S.cart)); } catch (e) { console.warn('Cart persistence unavailable', e); } };
const isAdmin = () => String(S.user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase() && !ADMIN_EMAIL.startsWith('REPLACE_');
const normalizeSearch = s => String(s ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
function safeImageUrl(value) {
  if (!value || typeof value !== 'string') return PH;
  try {
    const u = new URL(value, window.location.origin);
    return (u.protocol === 'https:' || u.origin === window.location.origin) ? u.href : PH;
  } catch { return PH; }
}

const translations = {
  ru: {
    search_placeholder: 'Поиск в STACKED', how_title: 'Как работает STACKED', how_sub: 'Выберите предложение, оформите заказ, дождитесь обработки и заберите в ресторане.', theme_light: 'Светлая', theme_dark: 'Тёмная', theme_system: 'Авто',
    login_btn: 'Войти', logout_btn: 'Выйти', catalog_btn: 'Каталог', orders_btn: 'Мои заказы', menu_title: 'Меню', balance_label: 'Баланс',
    footer_desc: 'Лучшие предложения на еду в Баку.', footer_support: 'Поддержка', footer_about: 'О проекте', footer_about_text: 'Данные хранятся в облаке Supabase.',
    cart_title: 'Корзина', cart_total: 'Итого', cart_checkout: 'Оформить заказ', cart_clear: 'Очистить', cart_empty: 'Корзина пуста', cart_remove: 'Удалить',
    auth_title: 'Добро пожаловать', auth_sub: 'Войдите или создайте аккаунт', auth_google: 'Продолжить с Google', auth_or: 'или', auth_login_btn: 'Войти', auth_register_btn: 'Регистрация',
    topup_title: 'Пополнение', topup_card_warn: 'Заявка проверяется оператором. Баланс пополнится только после подтверждения платежа.', topup_amount: 'Сумма (AZN)', topup_check: 'Скриншот чека', topup_btn: 'Отправить чек',
    topup_instructions: 'Реквизиты для перевода находятся в закреплённом сообщении Telegram-канала. После оплаты прикрепите скриншот чека.', topup_channel: 'Открыть Telegram-канал', topup_terms: 'Я подтверждаю, что данные заявки верны. Зачисление выполняется только после проверки платежа.',
    admin_title: 'Управление', admin_tab_products: 'Товары', admin_tab_settings: 'Настройки сайта', admin_products: 'Товары', admin_add: 'Добавить', admin_search: 'Поиск товаров',
    settings_title: 'Настройки главной страницы', settings_hero_title: 'Заголовок на главной', settings_hero_sub: 'Подзаголовок / описание', settings_save: 'Сохранить настройки',
    form_new: 'Новый товар', form_edit: 'Редактировать', form_name: 'Название', form_desc: 'Описание', form_cat: 'Категория', form_price: 'Цена (AZN)', form_image: 'Картинка (с ПК)', form_save: 'Сохранить',
    added_to_cart: 'добавлен в корзину', cart_cleared: 'Корзина очищена', checkout_msg: 'Заказ создан!', product_deleted: 'Удалено', saved: 'Сохранено', out_of_stock: 'Нет в наличии', add_to_cart: 'В корзину', add_short: 'В корзину', no_results: 'Ничего не найдено.', empty_catalog: 'Товаров пока нет.',
    orders_title: 'Мои заказы', orders_empty: 'У вас пока нет заказов.', orders_pending: 'Ожидает подтверждения', orders_ready: 'QR-код готов', orders_cancelled: 'Отменён', orders_completed: 'Выполнен', orders_expired: 'Срок действия QR истёк', orders_show_qr: 'Нажмите, чтобы открыть QR-код', orders_pending_note: 'Оператор проверяет заказ. QR-код появится здесь после ответа в Telegram.', orders_cancel: 'Отменить заказ', orders_time_left: 'Осталось', orders_expired_note: 'Срок QR-кода истёк. Обратитесь в поддержку.', orders_load_error: 'Не удалось загрузить заказы. Попробуйте ещё раз.', orders_hide_qr: 'Скрыть QR-код', wave_title: 'Заказ отправлен', wave_text: 'Оператор проверяет заказ. Как только он подтвердит, ваш QR-код появится в разделе «Мои заказы». Откройте его и покажите на выдаче.', wave_open: 'Открыть мои заказы', wave_close: 'Закрыть',
    cancel_confirm: 'Отменить заказ? Возврат средств выполняется сервером.', checkout_busy: 'Оформляем заказ…', checkout_success: 'Заказ создан. QR-код появится здесь после ответа оператора в Telegram.', checkout_notify_error: 'Заказ создан, но уведомление Telegram не отправлено. Обратитесь в поддержку.',
    search_empty: 'Ничего не найдено.'
  },
  en: {
    search_placeholder: 'Search STACKED', how_title: 'How STACKED works', how_sub: 'Choose an offer, place an order, wait for processing and pick it up at the restaurant.', theme_light: 'Light', theme_dark: 'Dark', theme_system: 'Auto',
    login_btn: 'Log in', logout_btn: 'Log out', catalog_btn: 'Admin panel', orders_btn: 'My orders', menu_title: 'Catalog', balance_label: 'Balance',
    footer_desc: 'The best food deals in Baku.', footer_support: 'Support', footer_about: 'About', footer_about_text: 'Data is stored in Supabase cloud.',
    cart_title: 'Cart', cart_total: 'Total', cart_checkout: 'Checkout', cart_clear: 'Clear', cart_empty: 'Your cart is empty', cart_remove: 'Remove',
    auth_title: 'Welcome', auth_sub: 'Log in or create an account', auth_google: 'Continue with Google', auth_or: 'or', auth_login_btn: 'Log in', auth_register_btn: 'Sign up',
    topup_title: 'Add balance', topup_card_warn: 'Your request is reviewed by an operator. Funds are added only after payment confirmation.', topup_amount: 'Amount (AZN)', topup_check: 'Payment receipt screenshot', topup_btn: 'Submit receipt',
    topup_instructions: 'Transfer details are in the pinned message of our Telegram channel. Attach your receipt screenshot after payment.', topup_channel: 'Open Telegram channel', topup_terms: 'I confirm that the submitted information is correct. Funds are added only after payment verification.',
    admin_title: 'Management', admin_tab_products: 'Products', admin_tab_settings: 'Site settings', admin_products: 'Products', admin_add: 'Add product', admin_search: 'Search products',
    settings_title: 'Homepage settings', settings_hero_title: 'Homepage title', settings_hero_sub: 'Subtitle / description', settings_save: 'Save settings',
    form_new: 'New product', form_edit: 'Edit product', form_name: 'Name', form_desc: 'Description', form_cat: 'Category', form_price: 'Price (AZN)', form_image: 'Image (from device)', form_save: 'Save',
    added_to_cart: 'added to cart', cart_cleared: 'Cart cleared', checkout_msg: 'Order created!', product_deleted: 'Deleted', saved: 'Saved', out_of_stock: 'Out of stock', add_to_cart: 'Add to cart', add_short: 'Add', no_results: 'No results found.', empty_catalog: 'No products yet.',
    orders_title: 'My orders', orders_empty: 'You have no orders yet.', orders_pending: 'Awaiting confirmation', orders_ready: 'QR code ready', orders_cancelled: 'Cancelled', orders_completed: 'Completed', orders_expired: 'QR code expired', orders_show_qr: 'Tap to reveal the QR code', orders_pending_note: 'The operator is reviewing your order. The QR will appear here after a Telegram reply.', orders_cancel: 'Cancel order', orders_time_left: 'Remaining', orders_expired_note: 'The QR code expired. Contact support.', orders_load_error: 'Could not load orders. Please try again.', orders_hide_qr: 'Hide QR code', wave_title: 'Order sent', wave_text: 'The operator is reviewing your order. Once confirmed, your QR code will appear in "My orders". Open it and show it at pickup.', wave_open: 'Open my orders', wave_close: 'Close',
    cancel_confirm: 'Cancel this order? Any refund is processed by the server.', checkout_busy: 'Placing order…', checkout_success: 'Order created. The QR will appear here after the operator replies in Telegram.', checkout_notify_error: 'Order created, but Telegram notification failed. Contact support.',
    search_empty: 'No results found.'
  },
  az: {
    search_placeholder: 'STACKED-də axtar', how_title: 'STACKED necə işləyir', how_sub: 'Təklifi seçin, sifariş verin, emalı gözləyin və restoranda götürün.', theme_light: 'Açıq', theme_dark: 'Tünd', theme_system: 'Avto',
    login_btn: 'Daxil ol', logout_btn: 'Çıxış', catalog_btn: 'İdarəetmə', orders_btn: 'Sifarişlərim', menu_title: 'Kataloq', balance_label: 'Balans',
    footer_desc: 'Bakıda ən yaxşı yemək təklifləri.', footer_support: 'Dəstək', footer_about: 'Layihə haqqında', footer_about_text: 'Məlumatlar Supabase buludunda saxlanılır.',
    cart_title: 'Səbət', cart_total: 'Cəmi', cart_checkout: 'Sifarişi rəsmiləşdir', cart_clear: 'Təmizlə', cart_empty: 'Səbət boşdur', cart_remove: 'Sil',
    auth_title: 'Xoş gəlmisiniz', auth_sub: 'Daxil olun və ya hesab yaradın', auth_google: 'Google ilə davam et', auth_or: 'və ya', auth_login_btn: 'Daxil ol', auth_register_btn: 'Qeydiyyat',
    topup_title: 'Balansı artır', topup_card_warn: 'Müraciət operator tərəfindən yoxlanılır. Vəsait yalnız ödəniş təsdiqləndikdən sonra əlavə olunur.', topup_amount: 'Məbləğ (AZN)', topup_check: 'Qəbzin ekran görüntüsü', topup_btn: 'Qəbzi göndər',
    topup_instructions: 'Köçürmə rekvizitləri Telegram kanalının sabitlənmiş mesajındadır. Ödənişdən sonra qəbzin şəklini əlavə edin.', topup_channel: 'Telegram kanalını aç', topup_terms: 'Müraciət məlumatlarının düzgün olduğunu təsdiq edirəm. Vəsait yalnız ödəniş yoxlanıldıqdan sonra əlavə olunur.',
    admin_title: 'İdarəetmə', admin_tab_products: 'Məhsullar', admin_tab_settings: 'Sayt ayarları', admin_products: 'Məhsullar', admin_add: 'Məhsul əlavə et', admin_search: 'Məhsul axtar',
    settings_title: 'Ana səhifə ayarları', settings_hero_title: 'Ana səhifə başlığı', settings_hero_sub: 'Alt başlıq / təsvir', settings_save: 'Ayarları saxla',
    form_new: 'Yeni məhsul', form_edit: 'Məhsulu redaktə et', form_name: 'Ad', form_desc: 'Təsvir', form_cat: 'Kateqoriya', form_price: 'Qiymət (AZN)', form_image: 'Şəkil (cihazdan)', form_save: 'Saxla',
    added_to_cart: 'səbətə əlavə edildi', cart_cleared: 'Səbət təmizləndi', checkout_msg: 'Sifariş yaradıldı!', product_deleted: 'Silindi', saved: 'Saxlanıldı', out_of_stock: 'Stokda yoxdur', add_to_cart: 'Səbətə əlavə et', add_short: 'Səbətə', no_results: 'Nəticə tapılmadı.', empty_catalog: 'Hələ məhsul yoxdur.',
    orders_title: 'Sifarişlərim', orders_empty: 'Hələ sifarişiniz yoxdur.', orders_pending: 'Təsdiq gözləyir', orders_ready: 'QR kod hazırdır', orders_cancelled: 'Ləğv edildi', orders_completed: 'Tamamlandı', orders_expired: 'QR kodun müddəti bitib', orders_show_qr: 'QR kodu açmaq üçün toxunun', orders_pending_note: 'Operator sifarişi yoxlayır. Telegram cavabından sonra QR burada görünəcək.', orders_cancel: 'Sifarişi ləğv et', orders_time_left: 'Qalıb', orders_expired_note: 'QR kodun müddəti bitib. Dəstəyə müraciət edin.', orders_load_error: 'Sifarişləri yükləmək mümkün olmadı. Yenidən cəhd edin.', orders_hide_qr: 'QR kodu gizlət', wave_title: 'Sifariş göndərildi', wave_text: 'Operator sifarişi yoxlayır. Təsdiqləndikdən sonra QR kodunuz "Sifarişlərim" bölməsində görünəcək. Onu açıb təhvil zamanı göstərin.', wave_open: 'Sifarişlərimi aç', wave_close: 'Bağla',
    cancel_confirm: 'Sifarişi ləğv etmək istəyirsiniz? Geri ödənişi server həyata keçirir.', checkout_busy: 'Sifariş hazırlanır…', checkout_success: 'Sifariş yaradıldı. Operator Telegram-da cavab verdikdən sonra QR burada görünəcək.', checkout_notify_error: 'Sifariş yaradıldı, lakin Telegram bildirişi göndərilmədi. Dəstəklə əlaqə saxlayın.',
    search_empty: 'Nəticə tapılmadı.'
  }
};
const tr = key => translations[S.lang]?.[key] || translations.ru[key] || key;
// Strings used by the unified catalog renderer, the tab bar and overlay labels.
Object.assign(translations.ru, {
  popular: 'Популярное', qty_label: 'Количество', qty_less: 'Уменьшить количество', qty_more: 'Увеличить количество',
  stock_left: 'Осталось {n} шт.', sold_out: 'Нет в наличии', all_categories: 'Все',
  cart_empty_hint: 'Добавьте блюда из меню — они появятся здесь.', cart_go_menu: 'Перейти в меню',
  cart_dropped: 'Часть товаров больше недоступна — корзина обновлена.', line_remove: 'Убрать из корзины',
  catalog_retry: 'Повторить', catalog_error: 'Не удалось загрузить каталог. Проверьте подключение и попробуйте ещё раз.',
  delete_failed: 'Товар не был удалён: нет прав или он уже удалён.',
  tab_menu: 'Меню', tab_orders: 'Заказы', tab_cart: 'Корзина', tab_profile: 'Профиль',
  orders_btn: 'Мои заказы', topup_short: 'Пополнить', settings_appearance: 'Оформление', settings_language: 'Язык', settings_promo: 'Промокод', promo_apply: 'Применить', promo_placeholder: 'Введите код', history_btn: 'История пополнений', tg_connect: 'Подключить Telegram', signed_in_as: 'Вы вошли как', nav_settings: 'Настройки', nav_profile: 'Профиль', nav_cart: 'Корзина', close: 'Закрыть'
});
Object.assign(translations.en, {
  popular: 'Popular', qty_label: 'Quantity', qty_less: 'Decrease quantity', qty_more: 'Increase quantity',
  stock_left: '{n} left', sold_out: 'Sold out', all_categories: 'All',
  cart_empty_hint: 'Add dishes from the menu and they will show up here.', cart_go_menu: 'Browse the menu',
  cart_dropped: 'Some items are no longer available — your cart was updated.', line_remove: 'Remove from cart',
  catalog_retry: 'Try again', catalog_error: 'Could not load the catalog. Check your connection and try again.',
  delete_failed: 'The product was not deleted: no permission or it is already gone.',
  tab_menu: 'Menu', tab_orders: 'Orders', tab_cart: 'Cart', tab_profile: 'Profile',
  orders_btn: 'My orders', topup_short: 'Top up', settings_appearance: 'Appearance', settings_language: 'Language', settings_promo: 'Promo code', promo_apply: 'Apply', promo_placeholder: 'Enter code', history_btn: 'Top-up history', tg_connect: 'Connect Telegram', signed_in_as: 'Signed in as', nav_settings: 'Settings', nav_profile: 'Profile', nav_cart: 'Cart', close: 'Close'
});
Object.assign(translations.az, {
  popular: 'Populyar', qty_label: 'Miqdar', qty_less: 'Miqdarı azalt', qty_more: 'Miqdarı artır',
  stock_left: '{n} ədəd qalıb', sold_out: 'Stokda yoxdur', all_categories: 'Hamısı',
  cart_empty_hint: 'Menyudan məhsul əlavə edin — onlar burada görünəcək.', cart_go_menu: 'Menyuya keç',
  cart_dropped: 'Bəzi məhsullar artıq mövcud deyil — səbət yeniləndi.', line_remove: 'Səbətdən sil',
  catalog_retry: 'Yenidən cəhd et', catalog_error: 'Kataloqu yükləmək mümkün olmadı. Bağlantını yoxlayıb yenidən cəhd edin.',
  delete_failed: 'Məhsul silinmədi: icazə yoxdur və ya artıq silinib.',
  tab_menu: 'Menyu', tab_orders: 'Sifarişlər', tab_cart: 'Səbət', tab_profile: 'Profil',
  orders_btn: 'Sifarişlərim', topup_short: 'Artır', settings_appearance: 'Görünüş', settings_language: 'Dil', settings_promo: 'Promokod', promo_apply: 'Tətbiq et', promo_placeholder: 'Kodu daxil edin', history_btn: 'Balans tarixçəsi', tg_connect: 'Telegram qoş', signed_in_as: 'Daxil olmusunuz:', nav_settings: 'Ayarlar', nav_profile: 'Profil', nav_cart: 'Səbət', close: 'Bağla'
});
const trf = (key, vars) => Object.entries(vars).reduce((text, [name, value]) => text.split(`{${name}}`).join(String(value)), tr(key));
function applyLanguage(lang) {
  const selected = Object.prototype.hasOwnProperty.call(translations, lang) ? lang : 'ru';
  S.lang = selected;
  try { localStorage.setItem('pdd.lang', selected); } catch {}
  document.documentElement.lang = selected;
  $$('[data-i18n]').forEach(element => {
    const value = translations[selected]?.[element.dataset.i18n] ?? translations.ru[element.dataset.i18n];
    if (value !== undefined) element.textContent = value;
  });
  $$('[data-i18n-placeholder]').forEach(element => {
    const value = translations[selected]?.[element.dataset.i18nPlaceholder] ?? translations.ru[element.dataset.i18nPlaceholder];
    if (value !== undefined) element.placeholder = value;
  });
  $$('[data-i18n-aria]').forEach(element => {
    const value = translations[selected]?.[element.dataset.i18nAria] ?? translations.ru[element.dataset.i18nAria];
    if (value !== undefined) element.setAttribute('aria-label', value);
  });
  $$('[data-act="lang"]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.v === selected)));
  renderAll();
  if ($('#editor')?.open) renderAdmin();
  if ($('#orders')?.open) loadOrders();
  // Other modules translate their own UI from this event instead of watching the DOM for label changes.
  publish('stackd:lang', { lang: selected });
}

// Auth state is published on <html>; CSS decides what is shown ([data-show="user|guest|admin"]).
function syncAuthUi() {
  const root = document.documentElement;
  root.dataset.auth = S.user ? 'user' : 'guest';
  root.toggleAttribute('data-admin', Boolean(S.user) && isAdmin());
  // The admin panel has its own stylesheet, requested only for the owner.
  if (root.hasAttribute('data-admin') && !$('#adminStyles')) {
    const link = document.createElement('link');
    link.id = 'adminStyles'; link.rel = 'stylesheet'; link.href = 'admin.css';
    document.head.append(link);
  }
  const avatarUrl = S.user?.user_metadata?.avatar_url || S.user?.user_metadata?.picture;
  if ($('#userAvatar')) $('#userAvatar').src = safeImageUrl(avatarUrl);
}
function setBalance(value) {
  const text = Number(value || 0).toFixed(2);
  $$('[data-balance]').forEach(node => { node.textContent = text; });
}
async function refreshProfile() {
  if (!S.user) { S.profile = null; setBalance(0); return; }
  const { data, error } = await _supabase.from('profiles').select('id,balance').eq('id', S.user.id).maybeSingle();
  if (error) throw error;
  S.profile = data || null;
  setBalance(data?.balance);
}
let authInflight = null;
function checkAuth() {
  // Boot, auth events and sign-in handlers may all ask at once: they share one round trip.
  authInflight ||= (async () => {
    try {
      const { data: { session }, error: sessionError } = await _supabase.auth.getSession();
      if (sessionError) throw sessionError;
      S.user = session?.user || null;
      syncAuthUi();
      await refreshProfile();
    } catch (error) {
      console.error('Authentication/profile loading failed:', error);
      toast('Не удалось загрузить профиль. Обновите страницу.');
    } finally {
      authInflight = null;
      publish('stackd:auth');
    }
  })();
  return authInflight;
}
// One shared read of site_settings for every module (hero, brand, discounts, icons, socials, bot).
// Concurrent callers reuse the same request; after 15 s the next caller reads fresh data.
let settingsRequest = null, settingsAt = 0;
function siteSettings() {
  if (!settingsRequest || Date.now() - settingsAt > 15000) {
    settingsAt = Date.now();
    settingsRequest = _supabase.from('site_settings').select('key,value').then(({ data, error }) => {
      if (error) { settingsRequest = null; throw error; }
      return new Map((data || []).map(row => [row.key, row.value]));
    });
  }
  return settingsRequest;
}
async function loadSettings() {
  let values;
  try { values = await siteSettings(); } catch (error) { console.error('Settings load failed:', error); return; }
  if ($('#settingHeroTitle')) $('#settingHeroTitle').value = values.get('hero_title') || '';
  if ($('#settingHeroSub')) $('#settingHeroSub').value = values.get('hero_subtitle') || '';
  publish('stackd:settings', { values });
}

$('#authForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  $('#authMsg').textContent = 'Загрузка...';
  const email = $('#emailInput').value, pass = $('#passInput').value;
  if (!email || !pass) return $('#authMsg').textContent = 'Заполните все поля';
  const { error } = await _supabase.auth.signInWithPassword({ email, password: pass });
  if (error) return $('#authMsg').textContent = 'Не удалось войти. Проверьте данные и настройки подтверждения email.';
  closeDlg($('#auth')); toast('Вы вошли!'); await checkAuth(); load();
});
$('#signUpBtn')?.addEventListener('click', async () => {
  $('#authMsg').textContent = 'Загрузка...';
  const email = $('#emailInput').value, pass = $('#passInput').value;
  if (!email || !pass) return $('#authMsg').textContent = 'Заполните все поля';
  if (pass.length < 6) return $('#authMsg').textContent = 'Пароль должен быть не менее 6 символов';
  const { data, error } = await _supabase.auth.signUp({ email, password: pass });
  if (error) return $('#authMsg').textContent = 'Ошибка: ' + error.message;
  if (data.user) {
    if (!data.session) { $('#authMsg').textContent = 'Проверьте почту и подтвердите адрес, затем войдите.'; return; }
    closeDlg($('#auth')); toast('Аккаунт создан!'); await checkAuth(); load();
  }
});
$('#googleLoginBtn')?.addEventListener('click', async () => {
  const { error } = await _supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  if (error) toast('Ошибка Google: ' + error.message);
});
$('#logoutBtn')?.addEventListener('click', async () => {
  if (S.ordersTimer) clearInterval(S.ordersTimer);
  await _supabase.auth.signOut();
  location.reload();
});

const PRODUCT_COLUMNS = 'id,name,description,category,price,image_url,stock,available,active,featured,translations,source_lang';
const catalogSignature = rows => JSON.stringify(rows.map(p => [p.id, p.name, p.description, p.category, p.price, p.image_url, p.stock, p.available, p.active, p.featured, p.translations]));

// S.products is the single source of truth for cards, cart lines, the quick view and the dock.
// Every change goes through setProducts(): it reconciles the cart and repaints everything once.
function setProducts(rows) {
  S.products = Array.isArray(rows) ? rows : [];
  S.catalogReady = true;
  S.catalogError = null;
  S.catalogSig = catalogSignature(S.products);
  S.catalogAt = Date.now();
  if (reconcileCart()) { saveCart(); toast(tr('cart_dropped')); }
  renderAll();
  syncDetail(true);
  publish('stackd:catalog');
}
async function load() {
  S.catalogError = null;
  const [slideResult, productResult] = await Promise.all([
    _supabase.from('slides').select('image_url,title,description'),
    _supabase.from('products').select(PRODUCT_COLUMNS)
  ]);
  if (slideResult.error) console.error('Slides load failed:', slideResult.error);
  initSlider(slideResult.error ? [] : slideResult.data);
  if (productResult.error) {
    console.error('Products load failed:', productResult.error);
    S.products = []; S.catalogReady = false;
    S.catalogError = tr('catalog_error');
    renderAll();
    return;
  }
  setProducts(productResult.data);
}
// A long-open page must not keep selling what was deleted, hidden or sold out elsewhere:
// the catalog is re-read when the tab becomes visible again and at most every 90 s while it stays open.
const CATALOG_MAX_AGE = 90000;
let refreshInflight = null;
function refreshProducts() {
  refreshInflight ||= (async () => {
    try {
      const { data, error } = await _supabase.from('products').select(PRODUCT_COLUMNS);
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      S.catalogAt = Date.now();
      if (catalogSignature(rows) !== S.catalogSig) setProducts(rows);
    } catch (error) { console.warn('Catalog refresh failed:', error); }
    finally { refreshInflight = null; }
  })();
  return refreshInflight;
}
const catalogIsStale = () => S.catalogReady && !document.hidden && !$('#editor')?.open && Date.now() - S.catalogAt > CATALOG_MAX_AGE;
document.addEventListener('visibilitychange', () => { if (catalogIsStale()) refreshProducts(); });
setInterval(() => { if (catalogIsStale()) refreshProducts(); }, 30000);

const find = id => S.products.find(p => String(p.id) === String(id));
const live = () => S.products.filter(p => p.active !== false);
const stockOf = p => (p?.stock === undefined || p?.stock === null || p?.stock === '' ? null : Math.max(0, Math.floor(Number(p.stock) || 0)));
const isAvailable = p => Boolean(p) && p.available !== false && (stockOf(p) === null || stockOf(p) > 0);
const isPurchasable = p => Boolean(p) && p.active !== false && isAvailable(p);
const stockCap = p => Math.min(50, stockOf(p) ?? 50);
const imgSrc = p => safeImageUrl(p?.image_url || p?.image || '');
const cartQty = id => Number(S.cart.find(x => String(x.id) === String(id))?.qty || 0);
// Presentation hooks: stackd-enhancements.js supplies translated product text and the active discount.
let productView = p => p;
let productSale = () => null;
const searchText = p => { const v = productView(p); return normalizeSearch([p.name, p.description, p.category, v.name, v.description, v.category].join(' ')); };

const ICON = name => `<svg class="ic" aria-hidden="true"><use href="#i-${name}"/></svg>`;
function stepperHtml(qty, atMax, modifier = '') {
  return `<div class="stepper${modifier ? ' ' + modifier : ''}" role="group" aria-label="${esc(tr('qty_label'))}"><button type="button" data-act="dec" aria-label="${esc(tr('qty_less'))}">${ICON('minus')}</button><output>${qty}</output><button type="button" data-act="inc" aria-label="${esc(tr('qty_more'))}"${atMax ? ' disabled' : ''}>${ICON('plus')}</button></div>`;
}
function stockHtml(p) {
  if (!isAvailable(p)) return `<span class="stock is-out">${esc(tr('sold_out'))}</span>`;
  const stock = stockOf(p);
  return stock === null ? '' : `<span class="stock${stock < 5 ? ' is-low' : ''}">${esc(trf('stock_left', { n: stock }))}</span>`;
}
function priceHtml(p) {
  const sale = productSale(p);
  return `<div class="price">${sale ? `<del>${fmt(sale.original)}</del>` : ''}<strong>${fmt(p.price)}</strong></div>`;
}
function buyHtml(p, qty) {
  if (qty > 0) { const stock = stockOf(p); return stepperHtml(qty, stock !== null && qty >= stock); }
  if (!isAvailable(p)) return '';
  // The visible label is the short form; the accessible name stays the full phrase.
  return `<button class="btn btn-primary btn-add" type="button" data-act="add" aria-label="${esc(tr('add_to_cart'))}">${ICON('plus')}<span>${esc(tr('add_short'))}</span></button>`;
}
function flagsHtml(p) {
  const sale = productSale(p);
  if (!p.featured && !sale) return '';
  return `<span class="flags">${p.featured ? `<span class="flag">${esc(tr('popular'))}</span>` : ''}${sale ? `<span class="flag is-sale">${esc(sale.label)} −${sale.percent}%</span>` : ''}</span>`;
}
// The one product card template (cards used to be rendered by three stacked overrides).
function card(p, index = 99) {
  const v = productView(p), qty = cartQty(p.id);
  const icon = S.icons[String(p.id)] ? safeImageUrl(S.icons[String(p.id)]) : '';
  return `<article class="card${isAvailable(p) ? '' : ' is-out'}" data-id="${esc(p.id)}" data-qty="${qty}">
    <button class="card-media" type="button" data-act="detail" aria-label="${esc(v.name || '')}">
      <img src="${esc(imgSrc(p))}" alt="" width="400" height="300" loading="${index < 4 ? 'eager' : 'lazy'}" decoding="async">
      ${flagsHtml(p)}${icon && icon !== PH ? `<span class="card-mark"><img src="${esc(icon)}" alt="" loading="lazy" decoding="async"></span>` : ''}
    </button>
    <div class="card-body">
      <span class="card-cat">${esc(v.category || '')}</span>
      <h3 class="card-title">${esc(v.name || '')}</h3>
      ${v.description ? `<p class="card-desc">${esc(v.description)}</p>` : ''}
      ${stockHtml(p)}
      <div class="card-foot">${priceHtml(p)}${buyHtml(p, qty)}</div>
    </div>
  </article>`;
}
// Updates only the buy control of a card / quick view. The photo and the rest of the node stay untouched,
// so quantity changes are instant, never flicker and keep keyboard focus.
function patchBuy(host, p) {
  if (!host) return;
  const qty = cartQty(p.id), stock = stockOf(p), stepper = host.querySelector('.stepper');
  if (stepper && qty > 0) {
    const output = stepper.querySelector('output');
    if (output.textContent !== String(qty)) { output.textContent = qty; replay(output, 'is-tick'); }
    stepper.querySelector('[data-act="inc"]').disabled = stock !== null && qty >= stock;
    return;
  }
  const hadFocus = host.contains(document.activeElement);
  host.querySelector('.stepper, .btn-add')?.remove();
  host.insertAdjacentHTML('beforeend', buyHtml(p, qty));
  if (hadFocus) host.querySelector('[data-act="inc"], [data-act="add"]')?.focus({ preventScroll: true });
}
function syncCards() {
  $$('#grid > .card[data-id]').forEach(node => {
    const p = find(node.dataset.id), qty = p ? cartQty(p.id) : 0;
    if (!p || node.dataset.qty === String(qty)) return;
    node.dataset.qty = String(qty);
    patchBuy(node.querySelector('.card-foot'), p);
  });
}
// Restarts a one-shot CSS animation class.
function replay(node, className) {
  if (!node) return;
  node.classList.remove(className);
  void node.offsetWidth;
  node.classList.add(className);
}

function updateChipsSlider() {
  const active = $('#chips button[aria-pressed="true"]'), slider = $('#chipsSlider');
  if (!active || !slider) return;
  slider.style.width = `${active.offsetWidth}px`;
  slider.style.transform = `translateX(${active.offsetLeft}px)`;
}
// Chips are rebuilt only when the category set or language changes; otherwise the indicator just slides.
function renderChips(categories, products) {
  const host = $('#chips');
  if (!host) return;
  const label = c => (c === 'All' ? tr('all_categories') : productView(products.find(p => p.category === c) || {}).category || c);
  const key = S.lang + '|' + categories.map(label).join('|');
  if (host.dataset.key !== key) {
    host.dataset.key = key;
    host.innerHTML = '<span class="chips-slider" id="chipsSlider" aria-hidden="true"></span>' + categories.map(c =>
      `<button type="button" data-act="cat" data-cat="${esc(c)}" aria-pressed="${S.cat === c}">${esc(label(c))}</button>`).join('');
    const slider = $('#chipsSlider');
    slider.style.transition = 'none';
    requestAnimationFrame(() => { updateChipsSlider(); requestAnimationFrame(() => { slider.style.transition = ''; }); });
    return;
  }
  $$('button[data-cat]', host).forEach(button => button.setAttribute('aria-pressed', String(button.dataset.cat === S.cat)));
  updateChipsSlider();
  $('button[aria-pressed="true"]', host)?.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
}
const stateHtml = (text, retry) => `<div class="state">${ICON('bag')}<p>${esc(text)}</p>${retry ? `<button class="btn btn-ghost" type="button" data-act="reload">${esc(tr('catalog_retry'))}</button>` : ''}</div>`;
function renderAll() {
  const L = live();
  const categories = ['All', ...new Set([...CATS, ...L.map(p => p.category).filter(Boolean)])].filter(c => c === 'All' || L.some(p => p.category === c));
  if (!categories.includes(S.cat)) S.cat = 'All';
  renderChips(categories, L);
  const q = normalizeSearch(S.q);
  const list = L.filter(p => (S.cat === 'All' || p.category === S.cat) && (!q || searchText(p).includes(q)));
  const grid = $('#grid');
  // Until the first answer arrives the grid keeps the skeleton that ships in index.html.
  if (grid && (S.catalogReady || S.catalogError)) {
    grid.removeAttribute('aria-busy');
    grid.innerHTML = list.length ? list.map(card).join('')
      : stateHtml(S.catalogError || (L.length ? tr('no_results') : tr('empty_catalog')), Boolean(S.catalogError));
    // Cards fade in only when the visible set changed (first load, category, search), never on stock or cart updates.
    const gridKey = S.cat + '|' + list.map(p => p.id).join(',');
    if (S.gridKey !== gridKey && list.length && !reduce()) {
      $$(':scope > .card', grid).slice(0, 12).forEach((node, i) => {
        node.style.setProperty('--i', i);
        node.classList.add('is-enter');
        node.addEventListener('animationend', () => { node.classList.remove('is-enter'); node.style.removeProperty('--i'); }, { once: true });
      });
    }
    S.gridKey = gridKey;
  }
  renderCart();
  if ($('#editor')?.open) renderAdmin();
}

const searchInput = $('#q'), suggestionsBox = $('#searchSuggestions');
function renderSuggestions() {
  if (!suggestionsBox) return;
  const needle = normalizeSearch(S.q);
  if (!needle) { Overlay.close(suggestionsBox); return; }
  const matches = live().filter(p => searchText(p).includes(needle)).slice(0, 6);
  suggestionsBox.innerHTML = matches.length
    ? matches.map(p => { const v = productView(p); return `<button type="button" class="suggestion" data-id="${esc(p.id)}"><img src="${esc(imgSrc(p))}" alt="" loading="lazy" decoding="async"><span><strong>${esc(v.name || '')}</strong><small>${esc(v.category || '')}</small></span><em>${fmt(p.price)}</em></button>`; }).join('')
    : `<p class="suggestion-empty">${esc(tr('no_results'))}</p>`;
  Overlay.open(suggestionsBox);
}
searchInput?.addEventListener('input', e => { S.q = String(e.target.value || '').trim(); renderAll(); renderSuggestions(); });
searchInput?.addEventListener('focus', () => { if (S.q) renderSuggestions(); });
suggestionsBox?.addEventListener('click', e => {
  const item = e.target.closest('.suggestion');
  if (!item) return;
  Overlay.close(suggestionsBox);
  if (searchInput) searchInput.value = '';
  S.q = ''; S.cat = 'All';
  renderAll();
  const node = $$('#grid > .card[data-id]').find(x => x.dataset.id === String(item.dataset.id));
  if (!node) return;
  node.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'center' });
  replay(node, 'is-highlight');
  node.addEventListener('animationend', () => node.classList.remove('is-highlight'), { once: true });
});

function applyTheme() {
  let t = 'system';
  try { t = localStorage.getItem('pdd.theme') || 'system'; } catch {}
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme:dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#141311' : '#f7f3ec');
  $$('[data-act="theme"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === t)));
}
matchMedia('(prefers-color-scheme:dark)').addEventListener?.('change', applyTheme);

const lines = () => S.cart.map(c => ({ p: find(c.id), qty: c.qty })).filter(l => l.p);
function cartLineHtml({ p, qty }) {
  const v = productView(p), stock = stockOf(p);
  return `<li data-id="${esc(p.id)}"><img src="${esc(imgSrc(p))}" alt="" width="56" height="56" loading="lazy" decoding="async"><div class="line-main"><strong>${esc(v.name || '')}</strong><small>${fmt(p.price)}</small></div>${stepperHtml(qty, stock !== null && qty >= stock, 'is-quiet')}<strong class="line-total">${fmt(p.price * qty)}</strong><button class="icon-btn is-small line-remove" type="button" data-act="rm" aria-label="${esc(tr('line_remove'))}">${ICON('trash')}</button></li>`;
}
function renderCart() {
  const L = lines(), count = L.reduce((a, l) => a + l.qty, 0), total = L.reduce((a, l) => a + l.qty * l.p.price, 0);
  document.documentElement.dataset.cart = count ? 'filled' : 'empty';
  $$('[data-cart-count]').forEach(node => { node.textContent = count; node.hidden = count === 0; });
  $$('[data-cart-total]').forEach(node => { node.textContent = fmt(total); });
  const list = $('#lines');
  if (list) {
    const key = L.length ? S.lang + '|' + L.map(l => l.p.id).join(',') : '';
    if (key && list.dataset.key === key) {
      // Same lines: patch quantities and totals in place (no image reload, focus stays on the pressed button).
      L.forEach(({ p, qty }) => {
        const row = $$('li[data-id]', list).find(node => node.dataset.id === String(p.id));
        if (!row) return;
        const output = row.querySelector('output'), stock = stockOf(p);
        if (output.textContent !== String(qty)) { output.textContent = qty; replay(output, 'is-tick'); }
        row.querySelector('[data-act="inc"]').disabled = stock !== null && qty >= stock;
        row.querySelector('.line-main small').textContent = fmt(p.price);
        row.querySelector('.line-total').textContent = fmt(p.price * qty);
      });
    } else {
      list.dataset.key = key;
      list.innerHTML = L.length ? L.map(cartLineHtml).join('')
        : `<li class="cart-empty">${ICON('bag')}<strong>${esc(tr('cart_empty'))}</strong><p>${esc(tr('cart_empty_hint'))}</p><button class="btn btn-ghost" type="button" data-act="close">${esc(tr('cart_go_menu'))}</button></li>`;
    }
  }
  if ($('#checkoutBtn')) $('#checkoutBtn').disabled = !L.length;
  if ($('#clearBtn')) $('#clearBtn').disabled = !L.length;
  publish('stackd:cart-rendered', { lines: L, count, total });
}
function bump() { $$('[data-cart-count]').forEach(node => replay(node, 'is-bump')); }
// Drops lines whose product is gone, hidden or sold out and clamps quantities to stock.
// Runs only against a loaded catalog, so a failed request never empties a saved cart.
function reconcileCart() {
  if (!S.catalogReady) return false;
  let changed = false;
  S.cart = S.cart.flatMap(item => {
    const p = find(item.id);
    const qty = isPurchasable(p) ? Math.min(Number(item.qty) || 0, stockCap(p)) : 0;
    if (qty !== item.qty) changed = true;
    return qty > 0 ? [{ id: String(item.id), qty }] : [];
  });
  return changed;
}
// The only path from a cart change to the UI: persist, repaint the cart, patch the cards and the quick view,
// then tell the other modules (dock, fly animation, promo estimate).
function commitCart(detail = {}) {
  saveCart();
  renderCart();
  syncCards();
  syncDetail();
  document.dispatchEvent(new CustomEvent('stackd:cart', { detail }));
}
function setQty(id, d, source) {
  const key = String(id), product = find(key);
  if (!product) return;
  const current = S.cart.find(x => String(x.id) === key);
  const before = current ? Number(current.qty) || 0 : 0;
  const after = Math.max(0, Math.min(stockCap(product), before + d));
  if (d > 0 && (after === before || !isPurchasable(product))) { toast(tr('out_of_stock')); return; }
  if (after === before) return;
  if (after === 0) S.cart = S.cart.filter(x => String(x.id) !== key);
  else if (current) current.qty = after;
  else S.cart.push({ id: key, qty: after });
  // The origin card is resolved before the repaint: the pressed "add" button is replaced by the stepper there.
  const card = source instanceof Element ? source.closest('.card') : null;
  commitCart({ id: key, delta: after - before, qty: after, source, card });
  if (after > before) bump();
}
const reduce = () => matchMedia('(prefers-reduced-motion:reduce)').matches;

// Overlay lifecycle: closed → opening → open → closing → closed, published as [data-state] for CSS.
// One implementation serves modal dialogs, anchored menus (dialogs with data-anchor: a dropdown on wide
// screens, a modal sheet on phones) and plain popovers (elements toggled with [hidden]).
// The exit waits for the element's own CSS animations through the Web Animations API, so nothing is
// removed mid-animation and nothing depends on timers; with reduced motion there is simply nothing to wait for.
const Overlay = (() => {
  const tokens = new WeakMap(), bound = new WeakSet(), floating = new Set();
  const narrow = () => matchMedia('(max-width: 680px)').matches;
  const isDialog = el => el instanceof HTMLDialogElement;
  const shown = el => (isDialog(el) ? el.open : !el.hidden);
  const state = el => el.dataset.state || 'closed';
  const mark = (el, value) => { const token = {}; tokens.set(el, token); el.dataset.state = value; return token; };
  const anchorOf = el => (el.dataset.anchor ? document.querySelector(el.dataset.anchor) : null);
  const settled = el => Promise.allSettled(el.getAnimations({ subtree: true })
    .filter(a => a.effect && a.effect.target === el && Number.isFinite(a.effect.getComputedTiming().endTime))
    .map(a => a.finished));
  const isModal = el => { try { return el.matches(':modal'); } catch { return true; } };
  const syncScrollLock = () => document.documentElement.classList.toggle('has-modal', $$('dialog[open]').some(isModal));
  const syncTrigger = (el, open) => anchorOf(el)?.setAttribute('aria-expanded', String(open));
  function place(el) {
    const anchor = anchorOf(el);
    if (!anchor || !isDialog(el) || isModal(el)) return;
    const r = anchor.getBoundingClientRect();
    // Top and left use the same viewport coordinates as the trigger's rectangle, so the panel lines up
    // with it whether or not the page reserves a scrollbar gutter.
    el.style.setProperty('--anchor-top', `${Math.round(r.bottom + 8)}px`);
    el.style.setProperty('--anchor-left', `${Math.max(8, Math.round(r.right - el.offsetWidth))}px`);
  }
  function bind(el) {
    if (bound.has(el)) return;
    bound.add(el);
    if (!isDialog(el)) return;
    el.addEventListener('cancel', event => { event.preventDefault(); close(el); });   // Escape leaves through the exit animation too
    el.addEventListener('close', () => {
      if (el.open) return;
      mark(el, 'closed'); floating.delete(el); syncTrigger(el, false); syncScrollLock();
      el.dispatchEvent(new CustomEvent('overlay:closed'));
    });
    // Backdrop dismissal: the press and the release must both land outside the panel (padding is not "outside").
    const outside = event => {
      if (event.target !== el) return false;
      const r = el.getBoundingClientRect();
      return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
    };
    let pressedOutside = false;
    el.addEventListener('pointerdown', event => { pressedOutside = outside(event); });
    el.addEventListener('click', event => { if (pressedOutside && outside(event)) close(el); pressedOutside = false; });
  }
  function closeFloating(except) { floating.forEach(el => { if (el !== except) close(el); }); }
  function closeMenus(except) { $$('dialog[data-anchor][open]').forEach(el => { if (el !== except) close(el); }); }
  async function open(el) {
    if (!el) return;
    bind(el);
    if (shown(el) && state(el) !== 'closing') return;
    const dialog = isDialog(el), modal = dialog && (!el.dataset.anchor || narrow());
    closeFloating(el);
    if (modal) closeMenus(el);
    const token = mark(el, 'opening');
    if (!dialog) el.hidden = false;
    else if (!el.open) { if (modal) el.showModal(); else el.show(); }
    if (!modal) { floating.add(el); place(el); }
    syncTrigger(el, true); syncScrollLock();
    el.dispatchEvent(new CustomEvent('overlay:open'));
    await settled(el);
    if (tokens.get(el) === token) el.dataset.state = 'open';
  }
  async function close(el) {
    if (!el || !shown(el) || state(el) === 'closing') return;
    const token = mark(el, 'closing');
    syncTrigger(el, false);
    await settled(el);
    if (tokens.get(el) !== token) return;                 // reopened while the exit was running
    if (isDialog(el)) { el.close(); return; }             // the "close" listener finishes the bookkeeping
    el.hidden = true; mark(el, 'closed'); floating.delete(el);
    el.dispatchEvent(new CustomEvent('overlay:closed'));
  }
  const toggle = el => (el && shown(el) && state(el) !== 'closing' ? close(el) : open(el));
  document.addEventListener('pointerdown', event => {
    floating.forEach(el => { if (!el.contains(event.target) && !anchorOf(el)?.contains(event.target)) close(el); });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !floating.size) return;
    const el = [...floating].pop();
    close(el);
    if (el.contains(document.activeElement)) anchorOf(el)?.focus({ preventScroll: true });
  });
  addEventListener('resize', () => floating.forEach(place), { passive: true });
  matchMedia('(max-width: 680px)').addEventListener?.('change', () => closeMenus());
  return { open, close, toggle, closeMenus };
})();
const openDlg = el => Overlay.open(el);
const closeDlg = el => Overlay.close(el);

// Toasts sit in a top-layer popover (above modal dialogs) and leave through their own exit animation.
function toast(message) {
  const host = $('#toasts'), text = String(message ?? '');
  if (!host) { console.info(text); return; }
  [...host.children].filter(node => node.textContent === text).forEach(node => node.remove());
  while (host.children.length >= 3) host.firstElementChild.remove();
  const item = document.createElement('div');
  item.className = 'toast'; item.setAttribute('role', 'status'); item.textContent = text; item.dataset.state = 'opening';
  host.append(item);
  // Re-showing moves the host above any dialog opened since the previous toast.
  try { if (host.matches(':popover-open')) host.hidePopover(); host.showPopover(); } catch { /* no Popover API: the host is fixed-position */ }
  const finished = () => Promise.allSettled(item.getAnimations().map(a => a.finished));
  finished().then(() => { if (item.dataset.state === 'opening') item.dataset.state = 'open'; });
  const dismiss = async () => {
    if (item.dataset.state === 'closing') return;
    item.dataset.state = 'closing';
    await finished();
    item.remove();
    if (!host.children.length) { try { host.hidePopover(); } catch { /* not a popover */ } }
  };
  const timer = setTimeout(dismiss, 3200);
  item.addEventListener('click', () => { clearTimeout(timer); dismiss(); });
}

// Quick view. It follows the cart while open and closes itself when its product disappears.
function detailHtml(p) {
  const v = productView(p);
  return `<div class="detail" data-id="${esc(p.id)}">
    <div class="detail-media"><img src="${esc(imgSrc(p))}" alt="" width="640" height="480" decoding="async">${flagsHtml(p)}</div>
    <div class="detail-body">
      <span class="card-cat">${esc(v.category || '')}</span>
      <h2 id="dtn">${esc(v.name || '')}</h2>
      ${v.description ? `<p class="detail-desc">${esc(v.description)}</p>` : ''}
      ${stockHtml(p)}
      <div class="detail-foot">${priceHtml(p)}${buyHtml(p, cartQty(p.id))}</div>
    </div>
  </div>`;
}
function openDetail(id) {
  const p = find(id), d = $('#detail');
  if (!p || !d || !$('#detailBody')) return;
  $('#detailBody').innerHTML = detailHtml(p);
  openDlg(d);
}
function syncDetail(full = false) {
  const d = $('#detail'), node = d?.querySelector('.detail[data-id]');
  if (!d?.open || !node) return;
  const p = find(node.dataset.id);
  if (!p || p.active === false) { closeDlg(d); return; }
  if (full) $('#detailBody').innerHTML = detailHtml(p);
  else patchBuy(node.querySelector('.detail-foot'), p);
}

// Slides only feed the hero (image/title fallback). The old auto-rotating slider and its timer are gone.
function initSlider(slides) {
  S.slides = (Array.isArray(slides) ? slides : []).filter(slide => slide && typeof slide.title === 'string' && typeof slide.image_url === 'string');
  publish('stackd:slides');
}

const blank = () => ({ id: Date.now().toString(), name: '', description: '', price: 0, category: 'Burgers' });
function renderAdmin() {
  const q = S.adminQ.toLowerCase(), list = S.products.filter(p => !q || (p.name + ' ' + p.category).toLowerCase().includes(q));
  if ($('#adminCount')) $('#adminCount').textContent = `${S.products.length} шт.`;
  if ($('#adminList')) $('#adminList').innerHTML = list.length ? list.map(p => `<li data-id="${esc(p.id)}" class="${p.active === false ? 'off' : ''}"><img src="${esc(imgSrc(p))}"><div class="info"><strong>${esc(p.name)}</strong><small>${esc(p.category)} · ${fmt(p.price)}</small></div><div class="acts"><button class="btn btn-ghost sm" data-act="edit">Ред.</button><button class="btn btn-ghost sm" data-act="del">Удал.</button></div></li>`).join('') : '<li>Ничего нет.</li>';
}
let productPreviewObjectUrl = null;
function clearProductPreviewObjectUrl() {
  if (productPreviewObjectUrl) URL.revokeObjectURL(productPreviewObjectUrl);
  productPreviewObjectUrl = null;
}
function showProductPreview(src, filename = '') {
  const wrap = $('#productImagePreviewWrap'), img = $('#productImagePreview'), name = $('#productImagePreviewName');
  if (!wrap || !img) return;
  if (!src) { wrap.hidden = true; img.removeAttribute('src'); if (name) name.textContent = ''; return; }
  img.src = src; wrap.hidden = false; if (name) name.textContent = filename;
}
async function validateProductImage(file) {
  if (!file) return;
  if (!Object.hasOwn(IMAGE_TYPES, file.type)) throw new Error('Поддерживаются только JPEG, PNG и WebP.');
  if (file.size <= 0 || file.size > MAX_PRODUCT_IMAGE_BYTES) throw new Error('Изображение должно быть не больше 5 МБ.');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  const isWebp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (!(isJpeg || isPng || isWebp)) throw new Error('Файл не соответствует заявленному формату изображения.');
}
async function uploadProductImage(file) {
  await validateProductImage(file);
  const extension = IMAGE_TYPES[file.type];
  const objectPath = `products/${crypto.randomUUID()}.${extension}`;
  const { error } = await _supabase.storage.from(PRODUCT_BUCKET).upload(objectPath, file, {
    cacheControl: '31536000', upsert: false, contentType: file.type
  });
  if (error) throw error;
  const { data } = _supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(objectPath);
  if (!data?.publicUrl) {
    await _supabase.storage.from(PRODUCT_BUCKET).remove([objectPath]).catch(() => {});
    throw new Error('Storage не вернул публичный URL. Проверьте, что bucket product-images создан как Public.');
  }
  return { path: objectPath, url: data.publicUrl };
}
function getProductStoragePath(url) {
  try {
    const parsed = new URL(url), marker = `/storage/v1/object/public/${PRODUCT_BUCKET}/`, index = parsed.pathname.indexOf(marker);
    return index >= 0 ? decodeURIComponent(parsed.pathname.slice(index + marker.length)) : null;
  } catch { return null; }
}
const F = () => $('#pform')?.elements;
function setDraft(p) {
  clearProductPreviewObjectUrl();
  S.draft = p ? { ...p } : blank();
  const f = F(), d = S.draft;
  if (!f) return;
  f.pn.value = d.name || ''; f.pd.value = d.description || ''; f.pc.value = d.category || 'Burgers'; f.pp.value = d.price ?? ''; f.pf.value = '';
  showProductPreview(d.image_url || d.image ? imgSrc(d) : '', d.image_url || d.image ? 'Текущее изображение' : '');
  if ($('#formMsg')) $('#formMsg').textContent = '';
  if ($('#formTitle')) $('#formTitle').textContent = p ? tr('form_edit') : tr('form_new');
}
function readForm() {
  const f = F();
  if (!f || !S.draft) throw new Error('Форма товара недоступна.');
  const price = Number(f.pp.value), name = f.pn.value.trim(), category = f.pc.value.trim();
  if (!name || !category) throw new Error('Заполните название и категорию.');
  if (!Number.isFinite(price) || price < 0 || price > 100000 || Math.round(price * 100) !== price * 100) throw new Error('Укажите цену от 0 до 100 000 AZN с точностью до 2 знаков.');
  Object.assign(S.draft, { name, description: f.pd.value.trim(), category, price });
}
$('#pf')?.addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    await validateProductImage(file);
    clearProductPreviewObjectUrl();
    productPreviewObjectUrl = URL.createObjectURL(file);
    showProductPreview(productPreviewObjectUrl, `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} МБ`);
    if ($('#formMsg')) $('#formMsg').textContent = '';
  } catch (error) {
    e.target.value = '';
    showProductPreview(S.draft?.image_url || S.draft?.image ? imgSrc(S.draft) : '');
    if ($('#formMsg')) $('#formMsg').textContent = error.message;
  }
});
$('#clearProductImage')?.addEventListener('click', () => {
  clearProductPreviewObjectUrl();
  if ($('#pf')) $('#pf').value = '';
  if (S.draft) { S.draft.image_url = ''; S.draft.image = ''; }
  showProductPreview('');
});
// Admin tabs: panels are switched with [hidden], so each one keeps its own layout.
$$('.admin-tabs .btn').forEach(button => {
  button.addEventListener('click', () => {
    $$('.admin-tabs .btn').forEach(other => other.classList.toggle('active', other === button));
    $$('#editor .tab-content').forEach(panel => { panel.hidden = panel.id !== `tab-${button.dataset.tab}`; });
  });
});
$('#saveSettingsBtn')?.addEventListener('click', async () => {
  if (!isAdmin()) { toast('Недостаточно прав.'); return; }
  const msg = $('#settingsMsg');
  if (msg) { msg.textContent = 'Сохранение...'; msg.style.color = 'var(--muted)'; }
  try {
    const rows = [
      { key: 'hero_title', value: $('#settingHeroTitle').value.trim() },
      { key: 'hero_subtitle', value: $('#settingHeroSub').value.trim() }
    ];
    const { error } = await _supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
    if (error) throw error;
    if (msg) { msg.textContent = 'Сохранено.'; msg.style.color = 'var(--success, #287a46)'; }
  } catch (error) {
    console.error('Settings save failed:', error);
    if (msg) { msg.textContent = 'Не удалось сохранить настройки: ' + error.message; msg.style.color = 'var(--danger, #b42318)'; }
  }
});

// Orders and private QR storage.
function statusText(status) {
  return tr(({ pending: 'orders_pending', ready: 'orders_ready', cancelled: 'orders_cancelled', completed: 'orders_completed' })[status] || 'orders_pending');
}
function remainingText(expiry) {
  const ms = new Date(expiry).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return tr('orders_expired');
  const seconds = Math.floor(ms / 1000);
  return `${tr('orders_time_left')}: ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
async function resolveOrderQr(order) {
  const raw = String(order.qr_code_url || '');
  if (!raw) return '';
  if (/^https:\/\//i.test(raw)) return safeImageUrl(raw);
  const ownerPrefix = `${S.user.id}/`;
  if (!raw.startsWith(ownerPrefix)) {
    return _supabase.storage.from('product-images').getPublicUrl(raw).data.publicUrl || '';
  }
  const expiresAt = order.qr_expires_at ? new Date(order.qr_expires_at).getTime() : Date.now() + 30 * 60 * 1000;
  const remaining = Math.floor((expiresAt - Date.now()) / 1000);
  if (!Number.isFinite(remaining) || remaining <= 0) return '';
  const cacheKey = `${raw}:${order.qr_expires_at || ''}`;
  const cached = S.qrCache.get(cacheKey);
  if (cached && cached.until > Date.now()) return cached.url;
  const ttl = Math.max(60, Math.min(1800, remaining));
  const { data, error } = await _supabase.storage.from('order-qrs').createSignedUrl(raw, ttl);
  if (error) throw error;
  const url = data?.signedUrl || '';
  if (url) S.qrCache.set(cacheKey, { url, until: Date.now() + Math.max(30000, Math.min(ttl * 1000 - 30000, 10 * 60 * 1000)) });
  return url;
}
const QR_ICON = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3m4 0v4h-4m0-4h-3v4"/></svg>';
function orderItemsHtml(items) {
  if (!Array.isArray(items)) return '';
  const rows = items.map(item => {
    const name = String(item?.name || item?.title || find(item?.id)?.name || '').trim();
    const qty = Math.max(0, Number(item?.qty) || 0);
    return name && qty ? `<li><span class="order-item-name">${esc(name)}</span><span class="order-item-qty">× ${qty}</span></li>` : '';
  }).filter(Boolean);
  return rows.length ? `<ul class="order-items">${rows.join('')}</ul>` : '';
}
function describeOrder(order) {
  const id = String(order.id || ''), status = ['pending', 'ready', 'cancelled', 'completed'].includes(order.status) ? order.status : 'pending';
  const created = order.created_at ? new Date(order.created_at) : null;
  const createdOk = created && !Number.isNaN(created.getTime());
  const expiry = order.qr_expires_at ? new Date(order.qr_expires_at).getTime() : 0;
  const qrIsExpired = Boolean(order.qr_code_url && expiry && expiry <= Date.now());
  const qrIsReady = Boolean(order.qr_code_url) && status === 'ready' && !qrIsExpired;
  const canCancel = status === 'pending' && createdOk && Date.now() - created.getTime() < 120000;
  return { id, status, created: createdOk ? created : null, qrIsExpired, qrIsReady, canCancel };
}
function orderCardHtml(order, d, qr) {
  const short = esc(d.id.slice(0, 8).toUpperCase());
  const createdText = d.created ? d.created.toLocaleString(S.lang === 'az' ? 'az-AZ' : S.lang === 'en' ? 'en-US' : 'ru-RU', { dateStyle: 'medium', timeStyle: 'short' }) : '';
  const itemCount = Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + Math.max(0, Number(item.qty) || 0), 0) : 0;
  const unit = S.lang === 'en' ? 'items' : S.lang === 'az' ? 'ədəd' : 'поз.';
  let body = '';
  if (d.qrIsReady && qr) {
    body = `<div class="order-qr"><button type="button" class="order-qr-toggle" data-act="toggle-qr" aria-expanded="false">${QR_ICON}<span class="order-qr-label order-qr-label-show">${esc(tr('orders_show_qr'))}</span><span class="order-qr-label order-qr-label-hide">${esc(tr('orders_hide_qr'))}</span><svg class="ic order-qr-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div class="order-qr-panel"><div class="order-qr-inner"><div class="order-qr-frame"><img class="order-qr-image" src="${esc(qr)}" alt="QR ${short}" decoding="async"></div><div class="order-qr-expiry" data-expiry="${esc(order.qr_expires_at || '')}">${esc(order.qr_expires_at ? remainingText(order.qr_expires_at) : '')}</div></div></div></div>`;
  } else if (d.qrIsExpired) {
    body = `<p class="order-note order-note-expired">${esc(tr('orders_expired_note'))}</p>`;
  } else if (d.status === 'pending') {
    body = `<p class="order-note">${esc(tr('orders_pending_note'))}</p>${d.canCancel ? `<button type="button" class="btn btn-ghost order-cancel" data-act="cancel-order" data-id="${esc(d.id)}">${esc(tr('orders_cancel'))}</button>` : ''}`;
  } else if (d.status !== 'completed' && d.status !== 'cancelled') {
    body = `<p class="order-note">${esc(statusText(d.status))}</p>`;
  }
  return `<div class="order-card-head"><div class="order-id"><strong>№ ${short}</strong>${createdText ? `<small>${esc(createdText)}</small>` : ''}</div><span class="order-status order-status-${esc(d.status)}">${esc(statusText(d.status))}</span></div>${orderItemsHtml(order.items)}<div class="order-card-total"><span>${itemCount ? `${itemCount} ${unit}` : ''}</span><strong>${fmt(order.total)}</strong></div>${body ? `<div class="order-card-body">${body}</div>` : ''}`;
}
// Keyed update: untouched cards stay in the DOM, so scroll position, an open QR and running animations survive each poll.
async function renderOrders(rows) {
  const host = $('#ordersList');
  if (!host) return;
  const owner = S.user?.id || '';
  if (host.dataset.owner !== owner) { host.innerHTML = ''; host.dataset.ready = ''; host.dataset.owner = owner; }
  if (!rows.length) { host.innerHTML = `<div class="orders-empty">${esc(tr('orders_empty'))}</div>`; host.dataset.ready = '1'; return; }
  const prepared = await Promise.all(rows.map(async order => {
    const d = describeOrder(order);
    let qr = '';
    if (d.qrIsReady) { try { qr = await resolveOrderQr(order); } catch (error) { console.error('QR signed URL failed:', error); } }
    const sig = [S.lang, d.status, order.total, order.qr_code_url || '', order.qr_expires_at || '', d.qrIsReady && qr ? 'qr' : '', d.qrIsExpired ? 'x' : '', d.canCancel ? 'c' : '', JSON.stringify(order.items || [])].join('|');
    return { order, d, qr, sig };
  }));
  if (host.dataset.owner !== (S.user?.id || '')) return;
  host.querySelectorAll(':scope > .orders-empty, :scope > .orders-error').forEach(node => node.remove());
  const firstRender = host.dataset.ready !== '1';
  const scrollTop = host.scrollTop;
  const existing = new Map(Array.from(host.querySelectorAll(':scope > .order-card')).map(node => [node.dataset.order, node]));
  let prev = null;
  prepared.forEach(({ order, d, qr, sig }) => {
    let node = existing.get(d.id);
    existing.delete(d.id);
    if (!node) {
      node = document.createElement('article');
      node.className = 'order-card';
      node.dataset.order = d.id;
      if (!firstRender) { node.classList.add('is-new'); node.addEventListener('animationend', () => node.classList.remove('is-new'), { once: true }); }
      node.innerHTML = orderCardHtml(order, d, qr);
      node.dataset.sig = sig;
    } else if (node.dataset.sig !== sig) {
      const wasOpen = node.classList.contains('qr-open');
      node.innerHTML = orderCardHtml(order, d, qr);
      node.dataset.sig = sig;
      const toggle = node.querySelector('.order-qr-toggle');
      node.classList.toggle('qr-open', Boolean(wasOpen && toggle));
      if (toggle && wasOpen) toggle.setAttribute('aria-expanded', 'true');
    }
    node.dataset.status = d.status;
    const ref = prev ? prev.nextSibling : host.firstChild;
    if (node !== ref) host.insertBefore(node, ref);
    prev = node;
  });
  existing.forEach(node => node.remove());
  host.dataset.ready = '1';
  host.scrollTop = scrollTop;
  tickOrderTimers();
}
function tickOrderTimers() {
  document.querySelectorAll('#ordersList .order-qr-expiry[data-expiry]').forEach(node => {
    const value = node.dataset.expiry;
    if (!value) return;
    node.textContent = remainingText(value);
    if (new Date(value).getTime() <= Date.now() && !node.dataset.expired) { node.dataset.expired = '1'; loadOrders(); }
  });
}
async function loadOrders() {
  if (!S.user) return;
  if (S.ordersBusy) { S.ordersQueued = true; return; }
  S.ordersBusy = true;
  const host = $('#ordersList');
  try {
    const { data, error } = await _supabase.from('orders').select('id,user_id,total,items,status,created_at,qr_code_url,qr_expires_at').eq('user_id', S.user.id).order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    await renderOrders(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Orders load failed:', error);
    // A failed background refresh must not wipe cards the user is looking at.
    if (host && !host.querySelector('.order-card')) host.innerHTML = `<p class="orders-error">${esc(tr('orders_load_error'))} ${esc(error.message || '')}</p>`;
  } finally {
    S.ordersBusy = false;
    if (S.ordersQueued) { S.ordersQueued = false; loadOrders(); }
  }
}
function stopOrdersTimers() {
  if (S.ordersTimer) clearInterval(S.ordersTimer);
  if (S.ordersTick) clearInterval(S.ordersTick);
  S.ordersTimer = S.ordersTick = null;
}
function openOrders() {
  if (!S.user) { openDlg($('#auth')); return; }
  const dialog = $('#orders');
  if (!dialog) return;
  openDlg(dialog);
  stopOrdersTimers();
  loadOrders();
  S.ordersTimer = setInterval(() => {
    if (!dialog.open) { stopOrdersTimers(); return; }
    if (!document.hidden) loadOrders();
  }, 4000);
  S.ordersTick = setInterval(tickOrderTimers, 1000);
}
$('#orders')?.addEventListener('close', stopOrdersTimers);
// Full-width confirmation that rises from the bottom after an order is placed.
function showOrderWave(withWarning) {
  let d = $('#orderWave');
  if (!d) {
    d = document.createElement('dialog');
    d.id = 'orderWave';
    d.className = 'order-wave';
    d.setAttribute('aria-labelledby', 'orderWaveTitle');
    document.body.appendChild(d);
    d.addEventListener('click', e => {
      const button = e.target.closest('[data-wave]');
      if (!button) return;
      closeDlg(d);
      if (button.dataset.wave === 'open') openOrders();
    });
  }
  d.innerHTML = `<div class="order-wave-sheet"><svg class="order-wave-edge" viewBox="0 0 1200 48" preserveAspectRatio="none" aria-hidden="true"><path d="M0 26C100 6 200 6 300 26S500 46 600 26S800 6 900 26S1100 46 1200 26V48H0Z" fill="currentColor"/></svg><div class="order-wave-body"><span class="order-wave-icon">${QR_ICON}</span><h2 id="orderWaveTitle">${esc(tr('wave_title'))}</h2><p>${esc(tr('wave_text'))}</p>${withWarning ? `<p class="order-wave-warn">${esc(tr('checkout_notify_error'))}</p>` : ''}<div class="order-wave-actions"><button type="button" class="btn order-wave-primary" data-wave="open">${esc(tr('wave_open'))}</button><button type="button" class="btn order-wave-secondary" data-wave="close">${esc(tr('wave_close'))}</button></div></div></div>`;
  openDlg(d);
  d.querySelector('[data-wave="open"]')?.focus({ preventScroll: true });
}
async function cancelOrder(id) {
  if (!S.user || !id) return;
  if (!confirm(tr('cancel_confirm'))) return;
  try {
    const { error } = await _supabase.rpc('cancel_order', { order_uuid: id });
    if (error) throw error;
    await refreshProfile().catch(error => console.warn('Balance refresh failed:', error));
    toast(tr('orders_cancelled'));
    await loadOrders();
  } catch (error) { console.error('Cancel order failed:', error); toast('Не удалось отменить заказ: ' + (error.message || '')); }
}
async function checkout() {
  if (!S.user) { openDlg($('#auth')); return; }
  if (S.checkoutBusy) return;
  if (!lines().length) { toast(tr('cart_empty')); return; }
  const button = $('#checkoutBtn'), oldText = button?.textContent || tr('cart_checkout');
  S.checkoutBusy = true;
  if (button) { button.disabled = true; button.textContent = tr('checkout_busy'); }
  try {
    const cartItems = S.cart.map(item => ({ id: item.id, qty: item.qty }));
    // stacked-shop.js installs window.stackdPlaceOrder (promo codes + idempotent stackd_checkout); same result shape.
    const { data, error } = typeof window.stackdPlaceOrder === 'function'
      ? await window.stackdPlaceOrder(cartItems)
      : await _supabase.rpc('checkout_order', { cart_items: cartItems });
    if (error) throw error;
    const orderId = typeof data === 'string' ? data : (data?.id || data?.order_id || data?.orderId || data?.[0]?.id);
    if (!orderId) throw new Error('checkout_order не вернул ID заказа.');
    S.cart = []; commitCart({ cleared: true, reason: 'checkout' }); closeDlg($('#drawer'));
    document.dispatchEvent(new CustomEvent('stackd:order-placed', { detail: { orderId } }));
    refreshProfile().catch(error => console.warn('Balance refresh failed:', error));
    let telegramOk = false;
    try {
      const { data: notifyData, error: notifyError } = await _supabase.functions.invoke('notify-telegram', { body: { orderId } });
      telegramOk = !notifyError && notifyData?.ok === true;
      if (notifyError) console.error('notify-telegram failed:', notifyError);
      if (notifyData && notifyData.ok === false) console.error('notify-telegram failed:', notifyData);
    } catch (error) { console.error('notify-telegram invocation failed:', error); }
    showOrderWave(!telegramOk);
    loadOrders();
  } catch (error) {
    console.error('Checkout failed:', error);
    toast('Не удалось оформить заказ: ' + (error.message || 'ошибка сервера'));
    refreshProducts();   // the usual cause is a stale catalog: reconcile it so the cart shows what can really be ordered
  } finally {
    S.checkoutBusy = false;
    if (button) { button.disabled = false; button.textContent = oldText; }
    renderCart();
  }
}

const A = {
  add: (id, b) => setQty(id, 1, b),
  inc: (id, b) => setQty(id, 1, b), dec: (id, b) => setQty(id, -1, b),
  rm: id => { S.cart = S.cart.filter(c => String(c.id) !== String(id)); commitCart({ id: String(id), removed: true }); },
  clear: () => { if (!S.cart.length) return; S.cart = []; commitCart({ cleared: true }); toast(tr('cart_cleared')); },
  checkout, orders: openOrders,
  'toggle-qr': (_, button) => { const card = button.closest('.order-card'); if (!card) return; const open = card.classList.toggle('qr-open'); button.setAttribute('aria-expanded', String(open)); },
  'cancel-order': id => cancelOrder(id), detail: openDetail, reload: () => load(),
  'cart-open': () => openDlg($('#drawer')),
  manage: () => { if (!isAdmin()) { toast('Доступ только владельцу проекта.'); return; } const d = $('#editor'); if (!d) return; if (!d.open) setDraft(null); openDlg(d); renderAdmin(); },
  auth: () => openDlg($('#auth')),
  topup: () => openDlg($(S.user ? '#topup' : '#auth')),
  profile: () => (S.user ? Overlay.toggle($('#stackdProfileMenu')) : openDlg($('#auth'))),
  settings: () => Overlay.toggle($('#stkSettings')),
  menu: () => $('#catalog')?.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' }),
  close: (_, b) => closeDlg(b.closest('dialog')),
  cat: (_, b) => { S.cat = b.dataset.cat; renderAll(); },
  theme: (_, b) => {
    try { localStorage.setItem('pdd.theme', b.dataset.v); } catch {}
    // Native cross-fade between themes where view transitions exist; an instant switch elsewhere.
    if (document.startViewTransition && !reduce()) document.startViewTransition(applyTheme); else applyTheme();
  },
  lang: (_, b) => applyLanguage(b.dataset.v),
  new: () => { if (!isAdmin()) { toast('Недостаточно прав.'); return; } setDraft(null); },
  edit: id => { if (!isAdmin()) { toast('Недостаточно прав.'); return; } setDraft(find(id)); },
  del: async id => {
    const p = find(id);
    if (!p || !isAdmin()) { toast('Недостаточно прав.'); return; }
    if (!window.confirm(`Удалить "${p.name}"?`)) return;
    // .select() returns the rows that were really removed: an RLS refusal deletes nothing without raising an error.
    const { data: removed, error } = await _supabase.from('products').delete().eq('id', id).select('id');
    if (error) { console.error('Product delete failed:', error); toast('Не удалось удалить товар: ' + error.message); return; }
    if (!removed?.length) { toast(tr('delete_failed')); refreshProducts(); return; }
    const storedImagePath = getProductStoragePath(p.image_url || p.image || '');
    if (storedImagePath) { const cleanup = await _supabase.storage.from(PRODUCT_BUCKET).remove([storedImagePath]); if (cleanup.error) console.warn('Deleted product image cleanup failed:', cleanup.error); }
    if (S.draft && String(S.draft.id) === String(id)) setDraft(null);
    // One pass removes the product from the grid, the cart, the dock and an open quick view.
    setProducts(S.products.filter(x => String(x.id) !== String(id)));
    toast('Товар удалён.');
  }
};

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  if (b.tagName === 'A') e.preventDefault();
  A[b.dataset.act]?.(b.closest('[data-id]')?.dataset.id, b);
});
$('#searchForm')?.addEventListener('submit', e => { e.preventDefault(); closeDlg(suggestionsBox); searchInput?.blur(); $('#catalog')?.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' }); });
$('#adminSearch')?.addEventListener('input', e => { S.adminQ = e.target.value.trim(); renderAdmin(); });

// Product upload and save.
$('#pform')?.addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('#formMsg');
  let uploadedPath = null;
  const previousImageUrl = S.draft?.image_url || S.draft?.image || '';
  const submit = $('#pform button[type="submit"]');
  try {
    if (!isAdmin()) throw new Error('Только владелец может управлять товарами.');
    readForm();
    const d = S.draft, file = $('#pf')?.files?.[0];
    if (file) await validateProductImage(file);
    if (msg) { msg.textContent = 'Сохранение…'; msg.style.color = 'var(--muted)'; }
    if (submit) submit.disabled = true;
    let imageUrl = d.image_url || d.image || '';
    if (file) {
      const uploaded = await uploadProductImage(file);
      uploadedPath = uploaded.path;
      imageUrl = uploaded.url;
    }
    const payload = { name: d.name, description: d.description, category: d.category, price: d.price, image_url: imageUrl };
    const exists = S.products.some(p => String(p.id) === String(d.id));
    const result = exists
      ? await _supabase.from('products').update(payload).eq('id', d.id).select('id,name,description,category,price,image_url').maybeSingle()
      : await _supabase.from('products').insert(payload).select('id,name,description,category,price,image_url').single();
    if (result.error) throw result.error;
    if (!result.data) throw new Error('База данных не вернула сохранённый товар.');
    const oldImagePath = getProductStoragePath(previousImageUrl);
    if (oldImagePath && previousImageUrl !== imageUrl) {
      const cleanup = await _supabase.storage.from(PRODUCT_BUCKET).remove([oldImagePath]);
      if (cleanup.error) console.warn('Old image cleanup failed:', cleanup.error);
    }
    uploadedPath = null;
    clearProductPreviewObjectUrl();
    $('#pform')?.reset(); S.draft = null;
    if (msg) { msg.textContent = ''; msg.style.color = ''; }
    await load(); renderAdmin(); toast(tr('saved'));
  } catch (error) {
    console.error('Product save failed:', error);
    if (uploadedPath) {
      const cleanup = await _supabase.storage.from(PRODUCT_BUCKET).remove([uploadedPath]);
      if (cleanup.error) console.warn('Orphan product image cleanup failed:', cleanup.error);
    }
    if (msg) { msg.textContent = error?.message || 'Не удалось сохранить товар.'; msg.style.color = 'var(--danger, #b42318)'; }
  } finally { if (submit) submit.disabled = false; }
});

// Submit a top-up receipt. requestId is the idempotency key expected by submit-topup.
$('#topupForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = $('#topupForm'), message = $('#topupMsg'), button = form?.querySelector('button[type="submit"]');
  const amount = Number($('#topupAmount')?.value), file = $('#topupFile')?.files?.[0];
  const showMessage = text => { if (message) message.textContent = text; };
  if (!S.user) { closeDlg($('#topup')); openDlg($('#auth')); return; }
  if (!$('#termsCheck')?.checked) { showMessage('Подтвердите правильность данных заявки.'); return; }
  if (!Number.isFinite(amount) || amount < 1 || amount > 100 || Math.round(amount * 100) !== amount * 100) {
    showMessage('Укажите сумму от 1 до 100 AZN.'); return;
  }
  if (!file) { showMessage('Прикрепите скриншот чека.'); return; }
  try {
    await validateProductImage(file);
    const { data: { session }, error: sessionError } = await _supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.access_token || !S.user?.id) throw new Error('Сессия истекла. Войдите снова.');
    if (button) { button.disabled = true; button.textContent = 'Отправка...'; }
    showMessage('Отправка заявки...');
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('amount', String(amount));
    formData.append('requestId', S.topupRequestId);
    // Compatibility field for older submit-topup deployments; the server must still verify the JWT user.
    formData.append('userId', S.user.id);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/submit-topup`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}` },
      body: formData
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok !== true) throw new Error(result.error || result.message || `Ошибка отправки заявки: ${response.status}`);
    form.reset();
    S.topupRequestId = crypto.randomUUID();
    showMessage('Заявка отправлена. Баланс пополнится после проверки платежа.');
  } catch (error) {
    console.error('Top-up submission failed:', error);
    showMessage(error?.message || 'Не удалось отправить заявку.');
  } finally {
    if (button) { button.disabled = false; button.textContent = tr('topup_btn'); }
  }
});

// Restore language and theme.
let initialLanguage = 'ru';
try {
  const storedLanguage = localStorage.getItem('pdd.lang');
  if (storedLanguage && Object.prototype.hasOwnProperty.call(translations, storedLanguage)) initialLanguage = storedLanguage;
} catch (error) { console.warn('Language preference unavailable:', error); }
applyLanguage(initialLanguage);
applyTheme();

// Auth events repeat (initial session, token refresh, tab focus). Only a different user needs new data:
// the profile, and the catalog as that user is allowed to see it.
_supabase.auth.onAuthStateChange((_event, session) => {
  setTimeout(() => {
    if (authInflight || (session?.user?.id || null) === (S.user?.id || null)) return;
    checkAuth().then(() => load()).catch(error => console.error('Authentication refresh failed:', error));
  }, 0);
});

// Start the application: session, catalog and settings are requested once, in parallel.
Promise.allSettled([checkAuth(), load(), loadSettings()]).then(results => {
  const failed = results.find(result => result.status === 'rejected');
  if (failed) { console.error('STACKED initialization failed:', failed.reason); toast('Не удалось запустить сайт. Обновите страницу.'); }
});
