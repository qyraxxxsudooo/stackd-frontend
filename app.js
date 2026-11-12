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
const S = {
  products: [], cart: [], cat: 'All', q: '', adminQ: '', user: null, profile: null,
  draft: null, lang: 'ru', catalogError: null, ordersTimer: null, ordersBusy: false,
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
    added_to_cart: 'добавлен в корзину', cart_cleared: 'Корзина очищена', checkout_msg: 'Заказ создан!', product_deleted: 'Удалено', saved: 'Сохранено', out_of_stock: 'Нет в наличии', add_to_cart: 'В корзину', no_results: 'Ничего не найдено.', empty_catalog: 'Товаров пока нет.',
    orders_title: 'Мои заказы', orders_empty: 'У вас пока нет заказов.', orders_pending: 'Ожидает подтверждения', orders_ready: 'QR-код готов', orders_cancelled: 'Отменён', orders_completed: 'Выполнен', orders_expired: 'Срок действия QR истёк', orders_show_qr: 'Нажмите, чтобы открыть QR-код', orders_pending_note: 'Оператор проверяет заказ. QR-код появится здесь после ответа в Telegram.', orders_cancel: 'Отменить заказ', orders_time_left: 'Осталось', orders_expired_note: 'Срок QR-кода истёк. Обратитесь в поддержку.', orders_load_error: 'Не удалось загрузить заказы. Попробуйте ещё раз.', orders_hide_qr: 'Скрыть QR-код', wave_title: 'Заказ отправлен', wave_text: 'Оператор проверяет заказ. Как только он подтвердит, ваш QR-код появится в разделе «Мои заказы». Откройте его и покажите на выдаче.', wave_open: 'Открыть мои заказы', wave_close: 'Закрыть', settings_title: 'Настройки', set_appearance: 'Оформление', set_language: 'Язык', set_motion: 'Анимации', set_motion_label: 'Отключить декоративные анимации', promo_title: 'Промокод', promo_placeholder: 'Введите промокод', promo_apply: 'Применить', promo_remove: 'Убрать', promo_invalid: 'Промокод недействителен или недоступен.', promo_already_used: 'Вы уже использовали этот промокод.', promo_not_applicable: 'Промокод не подходит к товарам в корзине.', promo_rate_limited: 'Слишком много попыток. Подождите минуту.', promo_applied: 'Промокод применён', promo_free_line: 'Бесплатно по промокоду', promo_free_tag: 'Бесплатно', promo_need_login: 'Войдите в аккаунт, чтобы применить промокод.', promo_discount_pct: 'Скидка {v}%', promo_discount_fix: 'Скидка {v}', promo_free_prod: 'Бесплатно: {name}', promo_scope_product: 'на «{name}»', promo_until: 'до {date}', promo_left: 'осталось {n}', promo_cart_hint: 'Есть промокод?', cart_subtotal: 'Сумма', cart_discount: 'Скидка', tg_title: 'Telegram', tg_hint: 'Получайте QR-код заказа в личные сообщения.', tg_connect: 'Подключить уведомления', tg_open: 'Открыть Telegram', tg_connected: 'Telegram подключён', tg_error: 'Не удалось создать ссылку. Попробуйте позже.', admin_tab_promos: 'Промокоды', pr_new: 'Новый', pr_code: 'Код', pr_title: 'Название', pr_type: 'Тип', pr_percent: 'Процент', pr_fixed: 'Фиксированная сумма', pr_free: 'Бесплатный товар', pr_value: 'Размер скидки', pr_scope: 'Применяется к', pr_scope_all: 'Всему меню', pr_scope_product: 'Выбранному товару', pr_product: 'Товар', pr_max_uses: 'Общий лимит (пусто = без лимита)', pr_per_user: 'Лимит на пользователя', pr_starts: 'Начало', pr_ends: 'Окончание', pr_active: 'Активен', pr_save: 'Сохранить', pr_cancel: 'Отмена', pr_edit: 'Изменить', pr_archive: 'В архив', pr_restore: 'Вернуть', pr_delete: 'Удалить', pr_used: 'Использовано', pr_left: 'Осталось', pr_unlimited: 'без лимита', pr_empty: 'Промокодов пока нет.', pr_saved: 'Сохранено', pr_exists: 'Такой код уже существует.', pr_delete_blocked: 'У промокода есть история применений. Отправьте его в архив.', pr_confirm_delete: 'Удалить промокод?', pr_s_active: 'Активен', pr_s_off: 'Выключен', pr_s_expired: 'Истёк', pr_s_scheduled: 'Ещё не начался', pr_s_exhausted: 'Лимит исчерпан', pr_s_archived: 'В архиве',
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
    added_to_cart: 'added to cart', cart_cleared: 'Cart cleared', checkout_msg: 'Order created!', product_deleted: 'Deleted', saved: 'Saved', out_of_stock: 'Out of stock', add_to_cart: 'Add to cart', no_results: 'No results found.', empty_catalog: 'No products yet.',
    orders_title: 'My orders', orders_empty: 'You have no orders yet.', orders_pending: 'Awaiting confirmation', orders_ready: 'QR code ready', orders_cancelled: 'Cancelled', orders_completed: 'Completed', orders_expired: 'QR code expired', orders_show_qr: 'Tap to reveal the QR code', orders_pending_note: 'The operator is reviewing your order. The QR will appear here after a Telegram reply.', orders_cancel: 'Cancel order', orders_time_left: 'Remaining', orders_expired_note: 'The QR code expired. Contact support.', orders_load_error: 'Could not load orders. Please try again.', orders_hide_qr: 'Hide QR code', wave_title: 'Order sent', wave_text: 'The operator is reviewing your order. Once confirmed, your QR code will appear in "My orders". Open it and show it at pickup.', wave_open: 'Open my orders', wave_close: 'Close', settings_title: 'Settings', set_appearance: 'Appearance', set_language: 'Language', set_motion: 'Motion', set_motion_label: 'Turn off decorative animations', promo_title: 'Promo code', promo_placeholder: 'Enter promo code', promo_apply: 'Apply', promo_remove: 'Remove', promo_invalid: 'This promo code is invalid or unavailable.', promo_already_used: 'You have already used this promo code.', promo_not_applicable: 'This promo code does not fit the items in your cart.', promo_rate_limited: 'Too many attempts. Please wait a minute.', promo_applied: 'Promo code applied', promo_free_line: 'Free with promo code', promo_free_tag: 'Free', promo_need_login: 'Sign in to apply a promo code.', promo_discount_pct: '{v}% off', promo_discount_fix: '{v} off', promo_free_prod: 'Free: {name}', promo_scope_product: 'on "{name}"', promo_until: 'until {date}', promo_left: '{n} left', promo_cart_hint: 'Have a promo code?', cart_subtotal: 'Subtotal', cart_discount: 'Discount', tg_title: 'Telegram', tg_hint: 'Get your order QR code in a private message.', tg_connect: 'Connect notifications', tg_open: 'Open Telegram', tg_connected: 'Telegram connected', tg_error: 'Could not create the link. Please try later.', admin_tab_promos: 'Promo codes', pr_new: 'New', pr_code: 'Code', pr_title: 'Title', pr_type: 'Type', pr_percent: 'Percentage', pr_fixed: 'Fixed amount', pr_free: 'Free product', pr_value: 'Discount value', pr_scope: 'Applies to', pr_scope_all: 'Whole menu', pr_scope_product: 'Selected product', pr_product: 'Product', pr_max_uses: 'Total limit (empty = unlimited)', pr_per_user: 'Limit per user', pr_starts: 'Starts', pr_ends: 'Ends', pr_active: 'Active', pr_save: 'Save', pr_cancel: 'Cancel', pr_edit: 'Edit', pr_archive: 'Archive', pr_restore: 'Restore', pr_delete: 'Delete', pr_used: 'Used', pr_left: 'Left', pr_unlimited: 'unlimited', pr_empty: 'No promo codes yet.', pr_saved: 'Saved', pr_exists: 'This code already exists.', pr_delete_blocked: 'This promo code has usage history. Archive it instead.', pr_confirm_delete: 'Delete this promo code?', pr_s_active: 'Active', pr_s_off: 'Off', pr_s_expired: 'Expired', pr_s_scheduled: 'Not started', pr_s_exhausted: 'Limit reached', pr_s_archived: 'Archived',
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
    added_to_cart: 'səbətə əlavə edildi', cart_cleared: 'Səbət təmizləndi', checkout_msg: 'Sifariş yaradıldı!', product_deleted: 'Silindi', saved: 'Saxlanıldı', out_of_stock: 'Stokda yoxdur', add_to_cart: 'Səbətə əlavə et', no_results: 'Nəticə tapılmadı.', empty_catalog: 'Hələ məhsul yoxdur.',
    orders_title: 'Sifarişlərim', orders_empty: 'Hələ sifarişiniz yoxdur.', orders_pending: 'Təsdiq gözləyir', orders_ready: 'QR kod hazırdır', orders_cancelled: 'Ləğv edildi', orders_completed: 'Tamamlandı', orders_expired: 'QR kodun müddəti bitib', orders_show_qr: 'QR kodu açmaq üçün toxunun', orders_pending_note: 'Operator sifarişi yoxlayır. Telegram cavabından sonra QR burada görünəcək.', orders_cancel: 'Sifarişi ləğv et', orders_time_left: 'Qalıb', orders_expired_note: 'QR kodun müddəti bitib. Dəstəyə müraciət edin.', orders_load_error: 'Sifarişləri yükləmək mümkün olmadı. Yenidən cəhd edin.', orders_hide_qr: 'QR kodu gizlət', wave_title: 'Sifariş göndərildi', wave_text: 'Operator sifarişi yoxlayır. Təsdiqləndikdən sonra QR kodunuz "Sifarişlərim" bölməsində görünəcək. Onu açıb təhvil zamanı göstərin.', wave_open: 'Sifarişlərimi aç', wave_close: 'Bağla', settings_title: 'Parametrlər', set_appearance: 'Görünüş', set_language: 'Dil', set_motion: 'Animasiya', set_motion_label: 'Dekorativ animasiyaları söndür', promo_title: 'Promokod', promo_placeholder: 'Promokodu daxil edin', promo_apply: 'Tətbiq et', promo_remove: 'Sil', promo_invalid: 'Promokod etibarsızdır və ya mövcud deyil.', promo_already_used: 'Bu promokodu artıq istifadə etmisiniz.', promo_not_applicable: 'Promokod səbətdəki məhsullara uyğun deyil.', promo_rate_limited: 'Çox cəhd edildi. Bir dəqiqə gözləyin.', promo_applied: 'Promokod tətbiq olundu', promo_free_line: 'Promokodla pulsuz', promo_free_tag: 'Pulsuz', promo_need_login: 'Promokod üçün hesaba daxil olun.', promo_discount_pct: '{v}% endirim', promo_discount_fix: '{v} endirim', promo_free_prod: 'Pulsuz: {name}', promo_scope_product: '"{name}" üçün', promo_until: '{date} tarixinədək', promo_left: '{n} qalıb', promo_cart_hint: 'Promokodunuz var?', cart_subtotal: 'Məbləğ', cart_discount: 'Endirim', tg_title: 'Telegram', tg_hint: 'Sifarişin QR kodunu şəxsi mesajda alın.', tg_connect: 'Bildirişləri qoş', tg_open: 'Telegram-ı aç', tg_connected: 'Telegram qoşulub', tg_error: 'Link yaradıla bilmədi. Sonra yenidən cəhd edin.', admin_tab_promos: 'Promokodlar', pr_new: 'Yeni', pr_code: 'Kod', pr_title: 'Ad', pr_type: 'Növ', pr_percent: 'Faiz', pr_fixed: 'Sabit məbləğ', pr_free: 'Pulsuz məhsul', pr_value: 'Endirim həcmi', pr_scope: 'Tətbiq sahəsi', pr_scope_all: 'Bütün menyu', pr_scope_product: 'Seçilmiş məhsul', pr_product: 'Məhsul', pr_max_uses: 'Ümumi limit (boş = limitsiz)', pr_per_user: 'İstifadəçi limiti', pr_starts: 'Başlanğıc', pr_ends: 'Bitmə', pr_active: 'Aktiv', pr_save: 'Yadda saxla', pr_cancel: 'Ləğv et', pr_edit: 'Dəyiş', pr_archive: 'Arxivə', pr_restore: 'Qaytar', pr_delete: 'Sil', pr_used: 'İstifadə', pr_left: 'Qalıb', pr_unlimited: 'limitsiz', pr_empty: 'Hələ promokod yoxdur.', pr_saved: 'Yadda saxlanıldı', pr_exists: 'Bu kod artıq mövcuddur.', pr_delete_blocked: 'Promokodun istifadə tarixçəsi var. Arxivə göndərin.', pr_confirm_delete: 'Promokod silinsin?', pr_s_active: 'Aktiv', pr_s_off: 'Söndürülüb', pr_s_expired: 'Müddəti bitib', pr_s_scheduled: 'Başlamayıb', pr_s_exhausted: 'Limit bitib', pr_s_archived: 'Arxivdə',
    cancel_confirm: 'Sifarişi ləğv etmək istəyirsiniz? Geri ödənişi server həyata keçirir.', checkout_busy: 'Sifariş hazırlanır…', checkout_success: 'Sifariş yaradıldı. Operator Telegram-da cavab verdikdən sonra QR burada görünəcək.', checkout_notify_error: 'Sifariş yaradıldı, lakin Telegram bildirişi göndərilmədi. Dəstəklə əlaqə saxlayın.',
    search_empty: 'Nəticə tapılmadı.'
  }
};
const tr = key => translations[S.lang]?.[key] || translations.ru[key] || key;
function applyLanguage(lang) {
  const selected = Object.prototype.hasOwnProperty.call(translations, lang) ? lang : 'ru';
  S.lang = selected;
  try { localStorage.setItem('pdd.lang', selected); } catch {}
  document.documentElement.lang = selected;
  if ($('#currentLangLabel')) $('#currentLangLabel').textContent = selected.toUpperCase();
  $$('[data-i18n]').forEach(element => {
    const value = translations[selected]?.[element.dataset.i18n] ?? translations.ru[element.dataset.i18n];
    if (value !== undefined) element.textContent = value;
  });
  $$('[data-i18n-placeholder]').forEach(element => {
    const value = translations[selected]?.[element.dataset.i18nPlaceholder] ?? translations.ru[element.dataset.i18nPlaceholder];
    if (value !== undefined) element.placeholder = value;
  });
  renderAll();
  if ($('#editor')?.open) renderAdmin();
  if ($('#orders')?.open) loadOrders();
}

async function checkAuth() {
  try {
    const { data: { session }, error: sessionError } = await _supabase.auth.getSession();
    if (sessionError) throw sessionError;
    S.user = session?.user || null;
    S.profile = null;
    const loginBtn = $('#loginBtn'), userProfile = $('#userProfile'), adminBtn = $('#adminBtn');
    if (S.user) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (userProfile) userProfile.style.display = 'flex';
      if ($('#myOrdersBtn')) $('#myOrdersBtn').style.display = 'inline-flex';
      if (adminBtn) adminBtn.style.display = isAdmin() ? 'inline-flex' : 'none';
      const avatarUrl = S.user.user_metadata?.avatar_url || S.user.user_metadata?.picture;
      if ($('#userAvatar')) $('#userAvatar').src = safeImageUrl(avatarUrl);
      const { data, error } = await _supabase.from('profiles').select('id,balance').eq('id', S.user.id).maybeSingle();
      if (error) throw error;
      S.profile = data || null;
      if ($('#userBalance')) $('#userBalance').textContent = Number(data?.balance || 0).toFixed(2);
    } else {
      if (loginBtn) loginBtn.style.display = 'block';
      if (userProfile) userProfile.style.display = 'none';
      if ($('#myOrdersBtn')) $('#myOrdersBtn').style.display = 'none';
      if (adminBtn) adminBtn.style.display = 'none';
      if ($('#userBalance')) $('#userBalance').textContent = '0.00';
    }
  } catch (error) {
    console.error('Authentication/profile loading failed:', error);
    toast('Не удалось загрузить профиль. Обновите страницу.');
  }
  await Promise.allSettled([load(), loadSettings()]);
}
async function loadSettings() {
  const { data, error } = await _supabase.from('site_settings').select('key,value');
  if (error) { console.error('Settings load failed:', error); return; }
  (data || []).forEach(item => {
    if (item.key === 'hero_title' && $('#settingHeroTitle')) $('#settingHeroTitle').value = item.value || '';
    if (item.key === 'hero_subtitle' && $('#settingHeroSub')) $('#settingHeroSub').value = item.value || '';
  });
}

$('#authForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  $('#authMsg').textContent = 'Загрузка...';
  const email = $('#emailInput').value, pass = $('#passInput').value;
  if (!email || !pass) return $('#authMsg').textContent = 'Заполните все поля';
  const { error } = await _supabase.auth.signInWithPassword({ email, password: pass });
  if (error) return $('#authMsg').textContent = 'Не удалось войти. Проверьте данные и настройки подтверждения email.';
  closeDlg($('#auth')); toast('Вы вошли!'); await checkAuth();
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
    closeDlg($('#auth')); toast('Аккаунт создан!'); await checkAuth();
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

async function load() {
  S.catalogError = null;
  const [slideResult, productResult] = await Promise.all([
    _supabase.from('slides').select('image_url,title,description'),
    _supabase.from('products').select('id,name,description,category,price,image_url')
  ]);
  if (slideResult.error) {
    console.error('Slides load failed:', slideResult.error);
    initSlider([]);
  } else initSlider(slideResult.data || []);
  if (productResult.error) {
    console.error('Products load failed:', productResult.error);
    S.products = [];
    S.catalogError = 'Не удалось загрузить каталог. Проверьте подключение и права доступа.';
  } else S.products = Array.isArray(productResult.data) ? productResult.data : [];
  renderAll();
}
const find = id => S.products.find(p => String(p.id) === String(id));
const live = () => S.products.filter(p => p.active !== false);
const isAvailable = p => p && p.available !== false && (p.stock === undefined || p.stock === null || Number(p.stock) > 0);
const imgSrc = p => safeImageUrl(p?.image_url || p?.image || '');

function card(p) {
  const stockKnown = p.stock !== undefined && p.stock !== null && p.stock !== '';
  const stock = stockKnown ? Math.max(0, Number(p.stock) || 0) : null;
  const available = isAvailable(p);
  return `<article class="card ${available ? '' : 'is-out'}" data-id="${esc(p.id)}">
    ${p.featured ? '<span class="badge-popular">ХИТ</span>' : ''}
    <button class="card-media" type="button" data-act="detail" aria-label="${esc(p.name || 'Товар')}">
      <img src="${esc(imgSrc(p))}" alt="${esc(p.name || '')}" loading="lazy" decoding="async">
    </button>
    <div class="card-body">
      <span class="tag">${esc(p.category || '')}</span>
      <h3>${esc(p.name || 'Товар')}</h3>
      <p>${esc(p.description || '')}</p>
      ${stockKnown ? `<span class="stock-info ${stock < 5 ? 'stock-low' : ''}">${stock} шт.</span>` : ''}
      <div class="card-foot">
        <strong>${fmt(p.price)}</strong>
        <button class="btn btn-primary sm" type="button" data-act="add" ${available ? '' : 'disabled'}>${available ? tr('add_to_cart') : tr('out_of_stock')}</button>
      </div>
    </div>
  </article>`;
}
function updateChipsSlider() {
  const active = $('#chips button[aria-pressed="true"]'), slider = $('#chipsSlider');
  if (!active || !slider) return;
  slider.style.width = `${active.offsetWidth}px`;
  slider.style.transform = `translateX(${active.offsetLeft}px)`;
}
function renderAll() {
  const L = live();
  const categories = ['All', ...new Set([...CATS, ...L.map(p => p.category).filter(Boolean)])].filter(c => c === 'All' || L.some(p => p.category === c));
  if (!categories.includes(S.cat)) S.cat = 'All';
  if ($('#chips')) {
    $('#chips').innerHTML = '<div class="chips-slider" id="chipsSlider"></div>' + categories.map(c =>
      `<button type="button" data-act="cat" data-cat="${esc(c)}" aria-pressed="${S.cat === c}">${c === 'All' ? (S.lang === 'en' ? 'All' : S.lang === 'az' ? 'Hamısı' : 'Все') : esc(c)}</button>`
    ).join('');
    requestAnimationFrame(updateChipsSlider);
  }
  const q = normalizeSearch(S.q);
  const list = L.filter(p => (S.cat === 'All' || p.category === S.cat) && (!q || normalizeSearch([p.name, p.description, p.category].join(' ')).includes(q)));
  if ($('#grid')) $('#grid').innerHTML = list.length ? list.map(card).join('') : `<div class="state"><p>${esc(S.catalogError || (L.length ? tr('no_results') : tr('empty_catalog')))}</p></div>`;
  // Fade cards in only when the visible set changed (first load, category, search), never on stock or cart updates.
  const gridKey = S.cat + '|' + list.map(p => p.id).join(',');
  if ($('#grid') && S.gridKey !== gridKey && list.length && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
    $('#grid').querySelectorAll(':scope > .card').forEach((node, i) => {
      if (i > 11) return;
      node.style.setProperty('--i', i);
      node.classList.add('is-enter');
      node.addEventListener('animationend', () => { node.classList.remove('is-enter'); node.style.removeProperty('--i'); }, { once: true });
    });
  }
  S.gridKey = gridKey;
  renderCart();
  if ($('#editor')?.open) renderAdmin();
}

const searchInput = $('#q'), suggestionsBox = $('#searchSuggestions');
searchInput?.addEventListener('input', e => {
  const val = String(e.target.value || '').trim();
  S.q = val;
  renderAll();
  if (!val) { suggestionsBox?.classList.remove('active'); return; }
  const needle = normalizeSearch(val);
  const matches = live().filter(p => normalizeSearch([p.name, p.description, p.category].join(' ')).includes(needle)).slice(0, 6);
  if (matches.length && suggestionsBox) {
    suggestionsBox.innerHTML = matches.map(p => `<button type="button" class="suggestion-item" data-id="${esc(p.id)}"><img src="${esc(imgSrc(p))}" alt=""><span><span class="s-title">${esc(p.name)}</span><span class="s-cat">${esc(p.category || '')}</span></span></button>`).join('');
    suggestionsBox.classList.add('active');
  } else if (suggestionsBox) {
    suggestionsBox.innerHTML = `<div class="suggestion-empty">${esc(translations[S.lang].no_results)}</div>`;
    suggestionsBox.classList.add('active');
  }
});
suggestionsBox?.addEventListener('click', e => {
  const item = e.target.closest('.suggestion-item');
  if (!item) return;
  const id = item.dataset.id;
  suggestionsBox.classList.remove('active');
  if (searchInput) searchInput.value = '';
  S.q = '';
  S.cat = 'All';
  renderAll();
  const el = [...document.querySelectorAll('.card[data-id]')].find(node => node.dataset.id === String(id));
  if (el) {
    el.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'center' });
    el.classList.add('card-highlight');
    setTimeout(() => el.classList.remove('card-highlight'), 1200);
  }
});
document.addEventListener('click', e => { if (!e.target.closest('.search-container')) suggestionsBox?.classList.remove('active'); });
function toggleLangDropdown() { $('#langDropdown')?.classList.toggle('active'); }
document.querySelector('.lang-dropdown')?.addEventListener('click', e => {
  const btn = e.target.closest('button[data-lang]');
  if (btn) { applyLanguage(btn.dataset.lang); $('#langDropdown')?.classList.remove('active'); }
});
function updateThemeSlider() {
  const activeBtn = $('.seg button[aria-pressed="true"]'), slider = $('#themeSlider');
  if (activeBtn && slider) { slider.style.width = `${activeBtn.offsetWidth}px`; slider.style.transform = `translateX(${activeBtn.offsetLeft - 3}px)`; }
}
function applyTheme() {
  const root = document.documentElement;
  root.classList.add('theme-switching'); clearTimeout(applyTheme.timer); applyTheme.timer = setTimeout(() => root.classList.remove('theme-switching'), 320);
  let t = 'system';
  try { t = localStorage.getItem('pdd.theme') || 'system'; } catch {}
  document.documentElement.dataset.theme = t === 'system' ? (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light') : t;
  $$('.seg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === t));
  setTimeout(updateThemeSlider, 50);
}

const lines = () => S.cart.map(c => ({ p: find(c.id), qty: c.qty })).filter(l => l.p);
function renderCart() {
  const L = lines(), n = L.reduce((a, l) => a + l.qty, 0), t = L.reduce((a, l) => a + l.qty * l.p.price, 0);
  if ($('#badge')) $('#badge').textContent = n;
  if ($('#total')) $('#total').textContent = fmt(promoEstimate().total);
  if ($('#lines')) $('#lines').innerHTML = L.length ? L.map(({ p, qty }) => `<li data-id="${esc(p.id)}"><img src="${esc(imgSrc(p))}"><div><strong>${esc(p.name)}</strong><small>${linePriceHtml(p, qty)}</small><div class="qty"><button data-act="dec">−</button><span>${qty}</span><button data-act="inc">+</button></div></div><button class="link" data-act="rm">${translations[S.lang].cart_remove}</button></li>`).join('') : `<li style="display:block;padding:20px;text-align:center;">${translations[S.lang].cart_empty}</li>`;
  if ($('#checkoutBtn')) $('#checkoutBtn').disabled = $('#clearBtn').disabled = !L.length;
  renderPromoUI();
}
function bump() { const b = $('#badge'); if (!b) return; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
function setQty(id, d) {
  const key = String(id), product = find(key);
  if (!product) return;
  const current = S.cart.find(x => String(x.id) === key);
  const before = current ? Number(current.qty) || 0 : 0;
  const stockKnown = product.stock !== undefined && product.stock !== null && product.stock !== '';
  const cap = stockKnown ? Math.max(0, Math.floor(Number(product.stock) || 0)) : 50;
  const after = Math.max(0, Math.min(50, cap, before + d));
  if (d > 0 && after === before) { toast(tr('out_of_stock')); return; }
  if (after === 0) S.cart = S.cart.filter(x => String(x.id) !== key);
  else if (current) current.qty = after;
  else S.cart.push({ id: key, qty: after });
  saveCart(); renderCart(); bump();
}
const reduce = () => matchMedia('(prefers-reduced-motion:reduce)').matches || document.documentElement.dataset.motion === 'off';
function closeDlg(d) {
  if (!d || !d.open) return;
  if (reduce()) return d.close();
  d.classList.add('closing'); d.style.pointerEvents = 'none';
  setTimeout(() => { d.close(); d.classList.remove('closing'); d.style.pointerEvents = ''; }, 250);
}
function toast(m) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; $('#toasts')?.append(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(10px)'; setTimeout(() => t.remove(), 300); }, 2400);
}
function openDetail(id) {
  const p = find(id), d = $('#detail');
  if (!p || d?.open) return;
  if ($('#detailBody')) $('#detailBody').innerHTML = `<div class="detail" data-id="${esc(p.id)}"><img src="${esc(imgSrc(p))}"><span class="tag">${esc(p.category)}</span><h2>${esc(p.name)}</h2><p>${esc(p.description)}</p><div class="card-foot"><strong>${fmt(p.price)}</strong><button class="btn btn-primary" data-act="add"${isAvailable(p) ? '' : ' disabled'}>${isAvailable(p) ? translations[S.lang].add_to_cart : translations[S.lang].out_of_stock}</button></div></div>`;
  d?.showModal();
}

let sliderTimer = null;
function initSlider(slides) {
  const container = $('#showcaseSlider');
  if (!container) return;
  if (sliderTimer) { clearInterval(sliderTimer); sliderTimer = null; }
  const validSlides = (Array.isArray(slides) ? slides : []).filter(slide => slide && typeof slide.title === 'string' && typeof slide.image_url === 'string');
  const source = validSlides.length ? validSlides : [{
    title: 'Добро пожаловать в STACKED', description: 'Подборка предложений',
    image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&auto=format&fit=crop&q=85'
  }];
  container.innerHTML = source.map((slide, index) => `
    <div class="slide ${index === 0 ? 'active' : ''}" aria-hidden="${index !== 0}">
      <img src="${esc(safeImageUrl(slide.image_url))}" alt="${esc(slide.title)}" loading="${index === 0 ? 'eager' : 'lazy'}">
      <div class="slide-content"><h2>${esc(slide.title)}</h2><p>${esc(slide.description || '')}</p></div>
    </div>`).join('');
  if (source.length < 2) return;
  let current = 0;
  sliderTimer = setInterval(() => {
    if (document.hidden || reduce()) return;
    const elements = $$('.slide', container);
    if (elements.length < 2) return;
    elements[current].classList.remove('active');
    elements[current].setAttribute('aria-hidden', 'true');
    current = (current + 1) % elements.length;
    elements[current].classList.add('active');
    elements[current].setAttribute('aria-hidden', 'false');
  }, 5000);
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
document.querySelectorAll('.admin-tabs .btn').forEach(btn => {
  btn.addEventListener('click', e => {
    document.querySelectorAll('.admin-tabs .btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    e.currentTarget.classList.add('active');
    const tab = $(`#tab-${e.currentTarget.dataset.tab}`); if (tab) tab.style.display = 'block';
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
    return name && qty ? `<li><span class="order-item-name">${esc(name)}</span><span class="order-item-qty">${item.promo ? `<em class="order-item-free">${esc(tr('promo_free_tag'))}</em> ` : ''}× ${qty}</span></li>` : '';
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
  return `<div class="order-card-head"><div class="order-id"><strong>№ ${short}</strong>${createdText ? `<small>${esc(createdText)}</small>` : ''}</div><span class="order-status order-status-${esc(d.status)}">${esc(statusText(d.status))}</span></div>${orderItemsHtml(order.items)}${Number(order.discount) > 0 ? `<div class="order-card-discount"><span>${esc(order.promo_code || '')}</span><span>−${fmt(order.discount)}</span></div>` : ''}<div class="order-card-total"><span>${itemCount ? `${itemCount} ${unit}` : ''}</span><strong>${fmt(order.total)}</strong></div>${body ? `<div class="order-card-body">${body}</div>` : ''}`;
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
    const sig = [S.lang, d.status, order.total, order.discount || 0, order.qr_code_url || '', order.qr_expires_at || '', d.qrIsReady && qr ? 'qr' : '', d.qrIsExpired ? 'x' : '', d.canCancel ? 'c' : '', JSON.stringify(order.items || [])].join('|');
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
    const { data, error } = await _supabase.from('orders').select('id,user_id,total,items,status,created_at,qr_code_url,qr_expires_at,discount,promo_code').eq('user_id', S.user.id).order('created_at', { ascending: false }).limit(50);
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
  if (!S.user) { $('#auth')?.showModal(); return; }
  const dialog = $('#orders');
  if (!dialog) return;
  if (!dialog.open) dialog.showModal();
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
      if (!button) { if (e.target === d) closeDlg(d); return; }
      closeDlg(d);
      if (button.dataset.wave === 'open') openOrders();
    });
  }
  d.innerHTML = `<div class="order-wave-sheet"><svg class="order-wave-edge" viewBox="0 0 1200 48" preserveAspectRatio="none" aria-hidden="true"><path d="M0 26C100 6 200 6 300 26S500 46 600 26S800 6 900 26S1100 46 1200 26V48H0Z" fill="currentColor"/></svg><div class="order-wave-body"><span class="order-wave-icon">${QR_ICON}</span><h2 id="orderWaveTitle">${esc(tr('wave_title'))}</h2><p>${esc(tr('wave_text'))}</p>${withWarning ? `<p class="order-wave-warn">${esc(tr('checkout_notify_error'))}</p>` : ''}<div class="order-wave-actions"><button type="button" class="btn order-wave-primary" data-wave="open">${esc(tr('wave_open'))}</button><button type="button" class="btn order-wave-secondary" data-wave="close">${esc(tr('wave_close'))}</button></div></div></div>`;
  if (!d.open) d.showModal();
  d.querySelector('[data-wave="open"]')?.focus({ preventScroll: true });
}
async function cancelOrder(id) {
  if (!S.user || !id) return;
  if (!confirm(tr('cancel_confirm'))) return;
  try {
    const { error } = await _supabase.rpc('cancel_order', { order_uuid: id });
    if (error) throw error;
    const { data: profile, error: profileError } = await _supabase.from('profiles').select('id,balance').eq('id', S.user.id).maybeSingle();
    if (!profileError) { S.profile = profile || null; if ($('#userBalance')) $('#userBalance').textContent = Number(profile?.balance || 0).toFixed(2); }
    toast(tr('orders_cancelled'));
    await loadOrders();
  } catch (error) { console.error('Cancel order failed:', error); toast('Не удалось отменить заказ: ' + (error.message || '')); }
}

/* ===================== Promo codes (browser only previews; checkout_order re-checks everything on the server) ===================== */
S.promo = null; S.promoMsg = null; S.checkoutRequestId = null;
const trf = (key, vars = {}) => Object.entries(vars).reduce((out, [k, v]) => out.split(`{${k}}`).join(String(v)), tr(key));
function newRequestId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
}
function promoEstimate(promo = S.promo) {
  const L = lines(), subtotal = L.reduce((a, l) => a + l.qty * l.p.price, 0);
  if (!promo || !S.user) return { subtotal, discount: 0, total: subtotal, applicable: !promo };
  const sameProduct = l => String(l.p.id) === String(promo.product_id);
  let discount = 0;
  if (promo.kind === 'free_product') discount = L.find(sameProduct)?.p.price || 0;
  else {
    const eligible = promo.scope === 'product' ? L.filter(sameProduct).reduce((a, l) => a + l.qty * l.p.price, 0) : subtotal;
    discount = promo.kind === 'percent' ? Math.round(eligible * Number(promo.value)) / 100 : Math.min(Number(promo.value), eligible);
  }
  discount = Math.min(Math.max(discount, 0), subtotal);
  return { subtotal, discount, total: Math.max(subtotal - discount, 0), applicable: discount > 0 };
}
function linePriceHtml(p, qty) {
  if (S.promo?.kind === 'free_product' && S.user && String(S.promo.product_id) === String(p.id) && qty >= 1) {
    return `<span class="promo-tag">${esc(tr('promo_free_line'))}</span> 1 × <s>${fmt(p.price)}</s> ${fmt(0)}${qty > 1 ? ` · ${qty - 1} × ${fmt(p.price)}` : ''}`;
  }
  return fmt(p.price);
}
function promoDescription(p) {
  const name = find(p.product_id)?.name || '';
  let text = p.kind === 'percent' ? trf('promo_discount_pct', { v: Number(p.value) }) : p.kind === 'fixed' ? trf('promo_discount_fix', { v: fmt(p.value) }) : trf('promo_free_prod', { name });
  if (p.kind !== 'free_product' && p.scope === 'product') text += ' ' + trf('promo_scope_product', { name });
  if (p.ends_at) text += ' · ' + trf('promo_until', { date: new Date(p.ends_at).toLocaleDateString(S.lang === 'az' ? 'az-AZ' : S.lang === 'en' ? 'en-US' : 'ru-RU') });
  if (p.remaining !== null && p.remaining !== undefined) text += ' · ' + trf('promo_left', { n: p.remaining });
  return text;
}
function promoChipHtml(est) {
  const p = S.promo;
  return `<div class="promo-chip"><div class="promo-chip-text"><strong>${esc(p.title || p.code)}</strong><small>${esc(p.code)} · ${esc(promoDescription(p))}</small>${est.applicable ? '' : `<small class="promo-warn">${esc(tr('promo_not_applicable'))}</small>`}</div><button type="button" class="link" data-promo="remove">${esc(tr('promo_remove'))}</button></div>`;
}
function renderPromoUI() {
  if (!S.user && S.promo) S.promo = null;
  const est = promoEstimate(), status = $('#promoStatus'), box = $('#cartPromo');
  const msg = S.promoMsg ? `<p class="promo-msg ${S.promoMsg.error ? 'is-error' : 'is-ok'}">${esc(S.promoMsg.text)}</p>` : '';
  if (status) status.innerHTML = (S.promo ? promoChipHtml(est) : '') + msg;
  if (box) {
    box.hidden = !lines().length;
    box.innerHTML = S.promo ? promoChipHtml(est) : `<button type="button" class="link" data-promo="settings">${esc(tr('promo_cart_hint'))}</button>`;
  }
  const showSum = Boolean(S.promo) && est.discount > 0;
  [['#cartSubtotalRow', showSum], ['#cartDiscountRow', showSum]].forEach(([sel, on]) => { const node = $(sel); if (node) node.hidden = !on; });
  if ($('#cartSubtotal')) $('#cartSubtotal').textContent = fmt(est.subtotal);
  if ($('#cartDiscount')) $('#cartDiscount').textContent = '−' + fmt(est.discount);
}
function setPromoMsg(text, error) { S.promoMsg = text ? { text, error: Boolean(error) } : null; renderPromoUI(); }
async function applyPromo(raw) {
  const code = String(raw || '').trim().toUpperCase();
  if (!code || S.promoBusy) return;
  if (!S.user) { setPromoMsg(tr('promo_need_login'), true); return; }
  const button = $('#promoApplyBtn');
  S.promoBusy = true; if (button) button.disabled = true;
  try {
    const { data, error } = await _supabase.rpc('promo_validate', { p_code: code, cart_items: S.cart.map(item => ({ id: item.id, qty: item.qty })) });
    if (error) { console.error('promo_validate failed:', error); setPromoMsg(tr('promo_invalid'), true); return; }
    if (!data?.ok) { setPromoMsg(tr('promo_' + (['already_used', 'not_applicable', 'rate_limited'].includes(data?.reason) ? data.reason : 'invalid')), true); return; }
    if (data.add_product && data.product_id && !S.cart.some(x => String(x.id) === String(data.product_id) && x.qty > 0)) {
      setQty(data.product_id, 1);   // the free unit comes out of the cart, so the product has to be there
      if (!S.cart.some(x => String(x.id) === String(data.product_id) && x.qty > 0)) { setPromoMsg(tr('promo_not_applicable'), true); return; }
    }
    S.promo = { code: data.code, title: data.title, kind: data.kind, value: data.value, scope: data.scope, product_id: data.product_id, ends_at: data.ends_at, remaining: data.remaining };
    S.promoMsg = { text: tr('promo_applied'), error: false };
    if ($('#promoInput')) $('#promoInput').value = '';
    renderCart();
  } finally { S.promoBusy = false; if (button) button.disabled = false; }
}
$('#promoForm')?.addEventListener('submit', e => { e.preventDefault(); applyPromo($('#promoInput')?.value); });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-promo]'); if (!b) return;
  if (b.dataset.promo === 'remove') { S.promo = null; S.promoMsg = null; renderCart(); }
  if (b.dataset.promo === 'settings') { closeDlg($('#drawer')); openSettings(); $('#promoInput')?.focus({ preventScroll: true }); }
});

/* ===================== Settings panel ===================== */
const settingsBtn = $('#settingsBtn'), settingsPanel = $('#settingsPanel'), settingsScrim = $('#settingsScrim');
function syncSettingsUI() {
  settingsBtn?.setAttribute('aria-label', tr('settings_title'));
  $$('#langChoice button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === S.lang)));
  const motion = $('#motionOff'); if (motion) motion.checked = document.documentElement.dataset.motion === 'off';
  renderPromoUI(); updateThemeSlider();
}
async function syncTelegramUI() {
  const section = $('#tgSection'); if (!section) return;
  if (!S.user) { section.hidden = true; return; }
  try {
    if (S.tgBot === undefined) { const { data } = await _supabase.from('site_settings').select('value').eq('key', 'tg_bot_username').maybeSingle(); S.tgBot = String(data?.value || '').replace(/^@/, '').trim() || null; }
    if (!S.tgBot) { section.hidden = true; return; }
    const { data: link } = await _supabase.from('telegram_links').select('chat_id').eq('user_id', S.user.id).maybeSingle();
    section.hidden = false;
    const btn = $('#tgConnectBtn'); if (btn) { btn.textContent = link ? tr('tg_connected') : tr('tg_connect'); btn.disabled = Boolean(link); }
  } catch (error) { console.error('Telegram status failed:', error); section.hidden = true; }
}
function openSettings() {
  if (!settingsPanel || !settingsPanel.hidden) return;
  settingsPanel.hidden = false; if (settingsScrim) settingsScrim.hidden = false;
  syncSettingsUI(); syncTelegramUI();
  requestAnimationFrame(() => { settingsPanel.classList.add('is-open'); settingsScrim?.classList.add('is-open'); settingsBtn?.classList.add('is-open'); updateThemeSlider(); });
  settingsBtn?.setAttribute('aria-expanded', 'true');
}
function closeSettings(returnFocus = true) {
  if (!settingsPanel || settingsPanel.hidden) return;
  settingsPanel.classList.remove('is-open'); settingsScrim?.classList.remove('is-open'); settingsBtn?.classList.remove('is-open');
  settingsBtn?.setAttribute('aria-expanded', 'false');
  const done = () => { settingsPanel.hidden = true; if (settingsScrim) settingsScrim.hidden = true; };
  if (reduce()) done(); else setTimeout(done, 200);
  if (returnFocus) settingsBtn?.focus({ preventScroll: true });
}
settingsBtn?.addEventListener('click', () => (settingsPanel.hidden ? openSettings() : closeSettings()));
settingsPanel?.querySelector('[data-settings-close]')?.addEventListener('click', () => closeSettings());
settingsScrim?.addEventListener('click', () => closeSettings(false));
document.addEventListener('pointerdown', e => { if (settingsPanel && !settingsPanel.hidden && !settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) closeSettings(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && settingsPanel && !settingsPanel.hidden) { e.stopPropagation(); closeSettings(); } }, true);
$('#langChoice')?.addEventListener('click', e => { const b = e.target.closest('button[data-lang]'); if (!b) return; applyLanguage(b.dataset.lang); syncSettingsUI(); });
$('#motionOff')?.addEventListener('change', e => {
  const off = e.target.checked;
  try { localStorage.setItem('stacked.motion', off ? 'off' : 'on'); } catch {}
  if (off) document.documentElement.dataset.motion = 'off'; else delete document.documentElement.dataset.motion;
});
$('#tgConnectBtn')?.addEventListener('click', async e => {
  const btn = e.currentTarget; if (!S.tgBot || btn.disabled) return;
  btn.disabled = true;
  try {
    const { data: token, error } = await _supabase.rpc('create_telegram_link');
    if (error || !token) throw error || new Error('no token');
    const url = `https://t.me/${S.tgBot}?start=link_${token}`;
    let a = $('#tgOpenLink');
    if (!a) { a = document.createElement('a'); a.id = 'tgOpenLink'; a.className = 'btn btn-primary block'; a.target = '_blank'; a.rel = 'noopener'; btn.after(a); }
    a.href = url; a.textContent = tr('tg_open');
  } catch (error) { console.error('create_telegram_link failed:', error); toast(tr('tg_error')); }
  finally { btn.disabled = false; }
});
document.addEventListener('visibilitychange', () => { if (!document.hidden && settingsPanel && !settingsPanel.hidden) syncTelegramUI(); });

/* ===================== Admin: promo codes tab ===================== */
const PROMO_FORM = () => $('#promoEditor');
function promoStatusOf(r) {
  const now = Date.now();
  if (r.archived_at) return 'archived';
  if (!r.active) return 'off';
  if (r.ends_at && new Date(r.ends_at).getTime() <= now) return 'expired';
  if (r.starts_at && new Date(r.starts_at).getTime() > now) return 'scheduled';
  if (r.max_uses !== null && r.uses_count >= r.max_uses) return 'exhausted';
  return 'active';
}
const toLocalInput = v => { if (!v) return ''; const d = new Date(v); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
function syncPromoFormFields() {
  const f = PROMO_FORM(); if (!f) return;
  const kind = f.kind.value, free = kind === 'free_product';
  f.querySelector('[data-pe=value]').hidden = free;
  f.querySelector('[data-pe=scope]').hidden = free;
  f.querySelector('[data-pe=product]').hidden = !(free || f.scope.value === 'product');
  f.value.required = !free;
}
function fillPromoProducts(selected) {
  const f = PROMO_FORM(); if (!f) return;
  f.product_id.innerHTML = (S.products || []).map(p => `<option value="${esc(p.id)}">${esc(p.name || p.id)}</option>`).join('');
  if (selected) f.product_id.value = selected;
}
function openPromoEditor(row) {
  const f = PROMO_FORM(); if (!f) return;
  f.reset(); f.dataset.id = row?.id || ''; fillPromoProducts(row?.product_id);
  f.code.value = row?.code || ''; f.title.value = row?.title || ''; f.kind.value = row?.kind || 'percent';
  f.value.value = row?.value ?? ''; f.scope.value = row?.scope || 'all';
  f.max_uses.value = row?.max_uses ?? ''; f.per_user_limit.value = row?.per_user_limit ?? 1;
  f.starts_at.value = toLocalInput(row?.starts_at); f.ends_at.value = toLocalInput(row?.ends_at);
  f.active.checked = row ? Boolean(row.active) : true;
  $('#promoMsg').textContent = ''; f.hidden = false; syncPromoFormFields();
  f.scrollIntoView({ block: 'nearest', behavior: reduce() ? 'auto' : 'smooth' });
}
function renderPromoRows() {
  const host = $('#promoList'); if (!host) return;
  const rows = S.promoRows || [];
  if ($('#promoCount')) $('#promoCount').textContent = rows.length ? `(${rows.length})` : '';
  host.innerHTML = rows.length ? rows.map(r => {
    const st = promoStatusOf(r), left = r.max_uses === null ? tr('pr_unlimited') : Math.max(r.max_uses - r.uses_count, 0);
    const what = r.kind === 'percent' ? `${Number(r.value)}%` : r.kind === 'fixed' ? fmt(r.value) : tr('pr_free');
    const target = r.kind === 'free_product' || r.scope === 'product' ? ` · ${esc(find(r.product_id)?.name || '—')}` : '';
    return `<article class="promo-row is-${st}" data-id="${esc(r.id)}"><div class="promo-row-head"><div><strong class="promo-code">${esc(r.code)}</strong><small>${esc(r.title || '')}</small></div><span class="promo-state promo-state-${st}">${esc(tr('pr_s_' + st))}</span></div><div class="promo-row-meta"><span>${esc(what)}${target}</span><span>${esc(tr('pr_used'))}: <b>${r.uses_count}</b></span><span>${esc(tr('pr_left'))}: <b>${esc(left)}</b></span>${r.ends_at ? `<span>${esc(trf('promo_until', { date: new Date(r.ends_at).toLocaleDateString() }))}</span>` : ''}</div><div class="promo-row-actions"><button class="btn btn-ghost sm" type="button" data-pa="edit">${esc(tr('pr_edit'))}</button><button class="btn btn-ghost sm" type="button" data-pa="toggle">${esc(r.active ? tr('pr_s_off') : tr('pr_s_active'))}</button><button class="btn btn-ghost sm" type="button" data-pa="archive">${esc(r.archived_at ? tr('pr_restore') : tr('pr_archive'))}</button><button class="btn btn-ghost sm" type="button" data-pa="delete">${esc(tr('pr_delete'))}</button></div></article>`;
  }).join('') : `<p class="orders-empty">${esc(tr('pr_empty'))}</p>`;
}
async function loadPromos() {
  if (!isAdmin()) return;
  const { data, error } = await _supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
  if (error) { const host = $('#promoList'); if (host) host.innerHTML = `<p class="orders-error">${esc(error.message)}</p>`; return; }
  S.promoRows = data || []; renderPromoRows();
}
document.querySelector('.admin-tabs [data-tab="promos"]')?.addEventListener('click', loadPromos);
$('#promoNewBtn')?.addEventListener('click', () => openPromoEditor(null));
$('#promoCancelBtn')?.addEventListener('click', () => { const f = PROMO_FORM(); if (f) f.hidden = true; });
PROMO_FORM()?.addEventListener('change', syncPromoFormFields);
PROMO_FORM()?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!isAdmin()) { toast('Недостаточно прав.'); return; }
  const f = e.currentTarget, msg = $('#promoMsg'), free = f.kind.value === 'free_product';
  const num = v => (v === '' ? null : Number(v));
  const payload = {
    code: f.code.value.trim().toUpperCase(), title: f.title.value.trim(), kind: f.kind.value,
    value: free ? null : num(f.value.value), scope: free ? 'product' : f.scope.value,
    product_id: free || f.scope.value === 'product' ? f.product_id.value || null : null,
    max_uses: num(f.max_uses.value), per_user_limit: num(f.per_user_limit.value) || 1,
    starts_at: f.starts_at.value ? new Date(f.starts_at.value).toISOString() : null,
    ends_at: f.ends_at.value ? new Date(f.ends_at.value).toISOString() : null, active: f.active.checked
  };
  msg.textContent = '';
  const q = f.dataset.id ? _supabase.from('promo_codes').update(payload).eq('id', f.dataset.id) : _supabase.from('promo_codes').insert(payload);
  const { error } = await q;
  if (error) { msg.textContent = error.code === '23505' ? tr('pr_exists') : (error.message || 'Error'); return; }
  f.hidden = true; toast(tr('pr_saved')); loadPromos();
});
$('#promoList')?.addEventListener('click', async e => {
  const b = e.target.closest('[data-pa]'); if (!b || !isAdmin()) return;
  const row = (S.promoRows || []).find(r => r.id === b.closest('.promo-row')?.dataset.id); if (!row) return;
  let error = null;
  if (b.dataset.pa === 'edit') { openPromoEditor(row); return; }
  if (b.dataset.pa === 'toggle') ({ error } = await _supabase.from('promo_codes').update({ active: !row.active }).eq('id', row.id));
  if (b.dataset.pa === 'archive') ({ error } = await _supabase.from('promo_codes').update(row.archived_at ? { archived_at: null } : { archived_at: new Date().toISOString(), active: false }).eq('id', row.id));
  if (b.dataset.pa === 'delete') {
    if (!confirm(tr('pr_confirm_delete'))) return;
    ({ error } = await _supabase.from('promo_codes').delete().eq('id', row.id));
    if (error?.code === '23503') { toast(tr('pr_delete_blocked')); return; }
  }
  if (error) { toast(error.message || 'Error'); return; }
  loadPromos();
});

async function checkout() {
  if (!S.user) { $('#auth')?.showModal(); return; }
  if (S.checkoutBusy) return;
  if (!lines().length) { toast(tr('cart_empty')); return; }
  const button = $('#checkoutBtn'), oldText = button?.textContent || tr('cart_checkout');
  S.checkoutBusy = true;
  if (button) { button.disabled = true; button.textContent = tr('checkout_busy'); }
  try {
    const { data, error } = await _supabase.rpc('checkout_order', { cart_items: S.cart.map(item => ({ id: item.id, qty: item.qty })), promo_code: S.promo?.code || null, request_id: (S.checkoutRequestId ||= newRequestId()) });
    if (error) throw error;
    const orderId = typeof data === 'string' ? data : (data?.id || data?.order_id || data?.orderId || data?.[0]?.id);
    if (!orderId) throw new Error('checkout_order не вернул ID заказа.');
    S.cart = []; S.promo = null; S.checkoutRequestId = null; saveCart(); renderCart(); closeDlg($('#drawer'));
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
    const promoFail = /promo_(invalid|already_used|not_applicable|rate_limited)/.exec(String(error?.message || ''));
    if (promoFail) { S.promo = null; S.promoMsg = null; renderCart(); toast(tr('promo_' + promoFail[1])); return; }
    toast('Не удалось оформить заказ: ' + (error.message || 'ошибка сервера'));
  } finally {
    S.checkoutBusy = false;
    if (button) { button.disabled = false; button.textContent = oldText; }
    renderCart();
  }
}

const A = {
  add: id => { const p = find(id); if (p && isAvailable(p)) { setQty(id, 1); toast(p.name + ' ' + translations[S.lang].added_to_cart); } },
  inc: id => setQty(id, 1), dec: id => setQty(id, -1),
  rm: id => { S.cart = S.cart.filter(c => c.id !== id); saveCart(); renderCart(); bump(); },
  clear: () => { S.cart = []; saveCart(); renderCart(); toast(translations[S.lang].cart_cleared); },
  checkout, orders: openOrders,
  'toggle-qr': (_, button) => { const card = button.closest('.order-card'); if (!card) return; const open = card.classList.toggle('qr-open'); button.setAttribute('aria-expanded', String(open)); },
  'cancel-order': id => cancelOrder(id), detail: openDetail, reload: () => load(),
  'cart-open': () => { const d = $('#drawer'); if (d && !d.open) d.showModal(); },
  manage: () => { if (!isAdmin()) { toast('Доступ только владельцу проекта.'); return; } const d = $('#editor'); if (!d) return; if (!d.open) { d.showModal(); setDraft(null); } renderAdmin(); },
  auth: () => { const d = $('#auth'); if (d && !d.open) d.showModal(); },
  'toggle-lang': toggleLangDropdown,
  close: (_, b) => closeDlg(b.closest('dialog')),
  cat: (_, b) => { S.cat = b.dataset.cat; renderAll(); },
  theme: (_, b) => { try { localStorage.setItem('pdd.theme', b.dataset.v); } catch {} applyTheme(); },
  new: () => { if (!isAdmin()) { toast('Недостаточно прав.'); return; } setDraft(null); },
  edit: id => { if (!isAdmin()) { toast('Недостаточно прав.'); return; } setDraft(find(id)); },
  del: async id => {
    const p = find(id);
    if (!p || !isAdmin()) { toast('Недостаточно прав.'); return; }
    if (!window.confirm(`Удалить "${p.name}"?`)) return;
    const { error } = await _supabase.from('products').delete().eq('id', id);
    if (error) { console.error('Product delete failed:', error); toast('Не удалось удалить товар: ' + error.message); return; }
    const storedImagePath = getProductStoragePath(p.image_url || p.image || '');
    if (storedImagePath) { const cleanup = await _supabase.storage.from(PRODUCT_BUCKET).remove([storedImagePath]); if (cleanup.error) console.warn('Deleted product image cleanup failed:', cleanup.error); }
    S.products = S.products.filter(x => String(x.id) !== String(id));
    S.cart = S.cart.filter(c => String(c.id) !== String(id)); saveCart();
    if (S.draft && String(S.draft.id) === String(id)) setDraft(null);
    renderAll(); toast('Товар удалён.');
  }
};

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b) { if (e.target.matches('dialog')) closeDlg(e.target); return; }
  A[b.dataset.act]?.(b.closest('[data-id]')?.dataset.id, b);
});
$('#searchForm')?.addEventListener('submit', e => { e.preventDefault(); suggestionsBox?.classList.remove('active'); $('#catalog')?.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' }); });
$('#adminSearch')?.addEventListener('input', e => { S.adminQ = e.target.value.trim(); renderAdmin(); });
$('#balanceBtn')?.addEventListener('click', () => $('#topup')?.showModal());
$('#topupBtn')?.addEventListener('click', () => $('#topup')?.showModal());

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
  if (!S.user) { closeDlg($('#topup')); $('#auth')?.showModal(); return; }
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

// Refresh auth state without running the callback recursively inline.
_supabase.auth.onAuthStateChange((_event, session) => {
  setTimeout(() => {
    S.user = session?.user || null;
    checkAuth().catch(error => console.error('Authentication refresh failed:', error));
  }, 0);
});

// Start the application.
checkAuth().catch(error => {
  console.error('STACKED initialization failed:', error);
  toast('Не удалось запустить сайт. Обновите страницу.');
});
