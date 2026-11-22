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
  draft: null, lang: 'az', catalogError: null, ordersTimer: null, ordersBusy: false,
  checkoutBusy: false, topupRequestId: crypto.randomUUID(), pendingPromoCode: null, 
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
    search_placeholder: 'Поиск в STAKED', how_title: 'Как работает STAKED', how_sub: 'Выберите предложение, оформите заказ и введите код из «Моих заказов» в автомате.', logout_confirm: 'Выйти из аккаунта?', promo_waiting_cart: 'Код сохранён. Добавьте товар в корзину, чтобы проверить его.', theme_light: 'Светлая', theme_dark: 'Тёмная', theme_system: 'Авто',
    login_btn: 'Войти', logout_btn: 'Выйти', catalog_btn: 'Каталог', orders_btn: 'Мои заказы', menu_title: 'Меню', balance_label: 'Баланс',
    footer_desc: 'Выбирайте предложения, оплачивайте с баланса и получайте код для автомата.', footer_support: 'Поддержка', footer_about: 'О проекте', footer_about_text: 'STAKED собирает выгодные предложения ресторанов Баку. Заказ оплачивается с баланса, а код для автомата приходит в «Мои заказы».',
    cart_title: 'Корзина', cart_total: 'Итого', cart_checkout: 'Оформить заказ', cart_clear: 'Очистить', cart_empty: 'Корзина пуста', cart_remove: 'Удалить',
    auth_title: 'Добро пожаловать', auth_sub: 'Войдите или создайте аккаунт', auth_google: 'Продолжить с Google', auth_or: 'или', auth_login_btn: 'Войти', auth_register_btn: 'Регистрация',
    topup_title: 'Пополнение', topup_card_warn: 'Баланс пополнится, когда оператор проверит перевод.', topup_amount: 'Сумма (AZN)', topup_check: 'Скриншот чека', topup_btn: 'Отправить чек',
    topup_instructions: 'Реквизиты для перевода лежат в закреплённом сообщении Telegram-канала. Переведите сумму и прикрепите скриншот чека ниже.', topup_channel: 'Открыть Telegram-канал', topup_terms: 'Сумма в заявке совпадает с переводом, чек настоящий и мой.',
    topup_terms_required: 'Отметьте, что сумма и чек верные.',
    topup_amount_invalid: 'Укажите сумму от 1 до 100 AZN с точностью до копеек.',
    topup_file_required: 'Прикрепите изображение чека.',
    topup_session_expired: 'Сессия истекла. Войдите в аккаунт снова.',
    topup_sending: 'Отправка…',
    topup_sending_request: 'Отправляем заявку на проверку…',
    topup_submitted: 'Заявка принята. Баланс обновится после проверки платежа.',
    topup_network_error: 'Не удалось связаться с сервером. Проверьте соединение и повторите попытку.',
    topup_generic_error: 'Не удалось отправить заявку. Попробуйте ещё раз.',
    topup_invalid_file_type: 'Поддерживаются только JPEG, PNG и WebP.',
    topup_invalid_file_size: 'Размер изображения должен быть не более 5 МБ.',
    topup_invalid_file_content: 'Содержимое файла не соответствует формату изображения.',
    topup_pending_limit: 'Слишком много ожидающих заявок. Дождитесь проверки предыдущих.',
    auth_callback_error: 'Не удалось завершить вход. Попробуйте войти через Google ещё раз.',
    admin_title: 'Управление', admin_tab_products: 'Товары', admin_tab_settings: 'Настройки сайта', admin_products: 'Товары', admin_add: 'Добавить', admin_search: 'Поиск товаров',
    settings_title: 'Настройки главной страницы', settings_hero_title: 'Заголовок на главной', settings_hero_sub: 'Подзаголовок / описание', settings_save: 'Сохранить настройки',
    form_new: 'Новый товар', form_edit: 'Редактировать', form_name: 'Название', form_desc: 'Описание', form_cat: 'Категория', form_price: 'Цена (AZN)', form_image: 'Картинка (с ПК)', form_save: 'Сохранить',
    added_to_cart: 'добавлен в корзину', cart_cleared: 'Корзина очищена', checkout_msg: 'Заказ создан!', product_deleted: 'Удалено', saved: 'Сохранено', out_of_stock: 'Нет в наличии', add_to_cart: 'В корзину', no_results: 'Ничего не найдено.', empty_catalog: 'Товаров пока нет.',
    orders_title: 'Мои заказы', orders_empty: 'У вас пока нет заказов.', orders_pending: 'Ожидает подтверждения', orders_ready: 'Код готов', orders_cancelled: 'Отменён', orders_completed: 'Выполнен', orders_expired: 'Срок действия кода истёк', orders_show_qr: 'Показать код', orders_pending_note: 'Оператор проверяет заказ. Код для автомата появится здесь.', orders_cancel: 'Отменить заказ', orders_time_left: 'Осталось', orders_expired_note: 'Срок действия кода истёк. Напишите в поддержку, и мы выдадим новый.', orders_load_error: 'Не удалось загрузить заказы. Попробуйте ещё раз.', orders_hide_qr: 'Скрыть код', orders_code_label: 'Код для автомата', orders_code_hint: 'Введите этот код в автомате заказа.', orders_copy: 'Скопировать', orders_copied: 'Код скопирован', wave_title: 'Заказ отправлен', wave_text: 'Оператор проверяет заказ. Когда он подтвердит, в «Моих заказах» появится код. Введите его в автомате.', wave_open: 'Открыть мои заказы', wave_close: 'Закрыть', settings_title: 'Настройки', set_appearance: 'Оформление', set_language: 'Язык', set_winter: 'Новогодняя тема', set_winter_label: 'Снег, огни и зимняя улица', set_motion: 'Анимации', set_motion_label: 'Отключить декоративные анимации', promo_title: 'Промокод', promo_enter: 'Введите промокод', promo_placeholder: 'Введите промокод', promo_apply: 'Применить', promo_remove: 'Убрать', promo_invalid: 'Промокод недействителен или недоступен.', promo_already_used: 'Вы уже использовали этот промокод.', promo_not_applicable: 'Промокод не подходит к товарам в корзине.', promo_rate_limited: 'Слишком много попыток. Подождите минуту.', promo_applied: 'Промокод применён', promo_free_line: 'Бесплатно по промокоду', promo_free_tag: 'Бесплатно', promo_need_login: 'Войдите в аккаунт, чтобы применить промокод.', promo_discount_pct: 'Скидка {v}%', promo_discount_fix: 'Скидка {v}', promo_free_prod: 'Бесплатно: {name}', promo_scope_product: 'на «{name}»', promo_until: 'до {date}', promo_left: 'осталось {n}', promo_cart_hint: 'Есть промокод?', cart_subtotal: 'Сумма', cart_discount: 'Скидка', tg_title: 'Telegram', tg_hint: 'Получайте код заказа в личные сообщения.', tg_connect: 'Подключить уведомления', tg_open: 'Открыть Telegram', tg_connected: 'Telegram подключён', tg_error: 'Не удалось создать ссылку. Попробуйте позже.', admin_tab_promos: 'Промокоды', pr_new: 'Новый', pr_code: 'Код', pr_title: 'Название', pr_type: 'Тип', pr_percent: 'Процент', pr_fixed: 'Фиксированная сумма', pr_free: 'Бесплатный товар', pr_value: 'Размер скидки', pr_scope: 'Применяется к', pr_scope_all: 'Всему меню', pr_scope_product: 'Выбранному товару', pr_product: 'Товар', pr_max_uses: 'Общий лимит (пусто = без лимита)', pr_per_user: 'Лимит на пользователя', pr_starts: 'Начало', pr_ends: 'Окончание', pr_active: 'Активен', pr_save: 'Сохранить', pr_cancel: 'Отмена', pr_edit: 'Изменить', pr_archive: 'В архив', pr_restore: 'Вернуть', pr_delete: 'Удалить', pr_used: 'Использовано', pr_left: 'Осталось', pr_unlimited: 'без лимита', pr_empty: 'Промокодов пока нет.', pr_saved: 'Сохранено', pr_exists: 'Такой код уже существует.', pr_delete_blocked: 'У промокода есть история применений. Отправьте его в архив.', pr_confirm_delete: 'Удалить промокод?', pr_s_active: 'Активен', pr_s_off: 'Выключен', pr_s_expired: 'Истёк', pr_s_scheduled: 'Ещё не начался', pr_s_exhausted: 'Лимит исчерпан', pr_s_archived: 'В архиве',
    cancel_confirm: 'Отменить заказ? Возврат средств выполняется сервером.', checkout_busy: 'Оформляем заказ…', checkout_success: 'Заказ оформлен. Код для автомата появится в «Моих заказах».', checkout_notify_error: 'Заказ создан, но уведомление Telegram не отправлено. Обратитесь в поддержку.',
    search_empty: 'Ничего не найдено.'
  },
  en: {
    search_placeholder: 'Search STAKED', how_title: 'How STAKED works', how_sub: 'Pick an offer, place your order and enter the code from "My orders" at the kiosk.', logout_confirm: 'Log out of your account?', promo_waiting_cart: 'Code saved. Add an item to your cart to check it.', theme_light: 'Light', theme_dark: 'Dark', theme_system: 'Auto',
    login_btn: 'Log in', logout_btn: 'Log out', catalog_btn: 'Admin panel', orders_btn: 'My orders', menu_title: 'Catalog', balance_label: 'Balance',
    footer_desc: 'Pick offers, pay from your balance and get a code for the kiosk.', footer_support: 'Support', footer_about: 'About', footer_about_text: 'STAKED collects restaurant deals in Baku. You pay from your balance, and the kiosk code arrives in "My orders".',
    cart_title: 'Cart', cart_total: 'Total', cart_checkout: 'Checkout', cart_clear: 'Clear', cart_empty: 'Your cart is empty', cart_remove: 'Remove',
    auth_title: 'Welcome', auth_sub: 'Log in or create an account', auth_google: 'Continue with Google', auth_or: 'or', auth_login_btn: 'Log in', auth_register_btn: 'Sign up',
    topup_title: 'Add balance', topup_card_warn: 'Your balance is topped up once the operator checks the transfer.', topup_amount: 'Amount (AZN)', topup_check: 'Payment receipt screenshot', topup_btn: 'Submit receipt',
    topup_instructions: 'Transfer details are in the pinned message of our Telegram channel. Send the amount and attach a screenshot of the receipt below.', topup_channel: 'Open Telegram channel', topup_terms: 'The amount matches my transfer, and the receipt is genuine and mine.',
    topup_terms_required: 'Confirm that the amount and receipt are correct.',
    topup_amount_invalid: 'Enter an amount from 1 to 100 AZN, with up to two decimal places.',
    topup_file_required: 'Attach an image of the receipt.',
    topup_session_expired: 'Your session has expired. Sign in again.',
    topup_sending: 'Sending…',
    topup_sending_request: 'Submitting your request for review…',
    topup_submitted: 'Request received. Your balance will update after payment verification.',
    topup_network_error: 'Could not reach the server. Check your connection and try again.',
    topup_generic_error: 'Could not submit the request. Please try again.',
    topup_invalid_file_type: 'Only JPEG, PNG and WebP images are supported.',
    topup_invalid_file_size: 'The image must be no larger than 5 MB.',
    topup_invalid_file_content: 'The file content does not match its image format.',
    topup_pending_limit: 'You have too many pending requests. Wait for the previous ones to be reviewed.',
    auth_callback_error: 'Could not complete sign-in. Please try Google sign-in again.',
    admin_title: 'Management', admin_tab_products: 'Products', admin_tab_settings: 'Site settings', admin_products: 'Products', admin_add: 'Add product', admin_search: 'Search products',
    settings_title: 'Homepage settings', settings_hero_title: 'Homepage title', settings_hero_sub: 'Subtitle / description', settings_save: 'Save settings',
    form_new: 'New product', form_edit: 'Edit product', form_name: 'Name', form_desc: 'Description', form_cat: 'Category', form_price: 'Price (AZN)', form_image: 'Image (from device)', form_save: 'Save',
    added_to_cart: 'added to cart', cart_cleared: 'Cart cleared', checkout_msg: 'Order created!', product_deleted: 'Deleted', saved: 'Saved', out_of_stock: 'Out of stock', add_to_cart: 'Add to cart', no_results: 'No results found.', empty_catalog: 'No products yet.',
    orders_title: 'My orders', orders_empty: 'You have no orders yet.', orders_pending: 'Awaiting confirmation', orders_ready: 'Code ready', orders_cancelled: 'Cancelled', orders_completed: 'Completed', orders_expired: 'Code expired', orders_show_qr: 'Show code', orders_pending_note: 'The operator is checking your order. Your kiosk code will appear here.', orders_cancel: 'Cancel order', orders_time_left: 'Remaining', orders_expired_note: 'This code has expired. Message support and we will issue a new one.', orders_load_error: 'Could not load orders. Please try again.', orders_hide_qr: 'Hide code', orders_code_label: 'Kiosk code', orders_code_hint: 'Enter this code at the ordering kiosk.', orders_copy: 'Copy', orders_copied: 'Code copied', wave_title: 'Order sent', wave_text: 'The operator is checking your order. Once confirmed, a code appears in "My orders". Enter it at the kiosk.', wave_open: 'Open my orders', wave_close: 'Close', settings_title: 'Settings', set_appearance: 'Appearance', set_language: 'Language', set_winter: 'New Year theme', set_winter_label: 'Snow, lights and a winter street', set_motion: 'Motion', set_motion_label: 'Turn off decorative animations', promo_title: 'Promo code', promo_enter: 'Enter promo code', promo_placeholder: 'Enter promo code', promo_apply: 'Apply', promo_remove: 'Remove', promo_invalid: 'This promo code is invalid or unavailable.', promo_already_used: 'You have already used this promo code.', promo_not_applicable: 'This promo code does not fit the items in your cart.', promo_rate_limited: 'Too many attempts. Please wait a minute.', promo_applied: 'Promo code applied', promo_free_line: 'Free with promo code', promo_free_tag: 'Free', promo_need_login: 'Sign in to apply a promo code.', promo_discount_pct: '{v}% off', promo_discount_fix: '{v} off', promo_free_prod: 'Free: {name}', promo_scope_product: 'on "{name}"', promo_until: 'until {date}', promo_left: '{n} left', promo_cart_hint: 'Have a promo code?', cart_subtotal: 'Subtotal', cart_discount: 'Discount', tg_title: 'Telegram', tg_hint: 'Get your order code in a private message.', tg_connect: 'Connect notifications', tg_open: 'Open Telegram', tg_connected: 'Telegram connected', tg_error: 'Could not create the link. Please try later.', admin_tab_promos: 'Promo codes', pr_new: 'New', pr_code: 'Code', pr_title: 'Title', pr_type: 'Type', pr_percent: 'Percentage', pr_fixed: 'Fixed amount', pr_free: 'Free product', pr_value: 'Discount value', pr_scope: 'Applies to', pr_scope_all: 'Whole menu', pr_scope_product: 'Selected product', pr_product: 'Product', pr_max_uses: 'Total limit (empty = unlimited)', pr_per_user: 'Limit per user', pr_starts: 'Starts', pr_ends: 'Ends', pr_active: 'Active', pr_save: 'Save', pr_cancel: 'Cancel', pr_edit: 'Edit', pr_archive: 'Archive', pr_restore: 'Restore', pr_delete: 'Delete', pr_used: 'Used', pr_left: 'Left', pr_unlimited: 'unlimited', pr_empty: 'No promo codes yet.', pr_saved: 'Saved', pr_exists: 'This code already exists.', pr_delete_blocked: 'This promo code has usage history. Archive it instead.', pr_confirm_delete: 'Delete this promo code?', pr_s_active: 'Active', pr_s_off: 'Off', pr_s_expired: 'Expired', pr_s_scheduled: 'Not started', pr_s_exhausted: 'Limit reached', pr_s_archived: 'Archived',
    cancel_confirm: 'Cancel this order? Any refund is processed by the server.', checkout_busy: 'Placing order…', checkout_success: 'Order placed. Your kiosk code will appear in "My orders".', checkout_notify_error: 'Order created, but Telegram notification failed. Contact support.',
    search_empty: 'No results found.'
  },
  az: {
    search_placeholder: 'STAKED-də axtar', how_title: 'STAKED necə işləyir', how_sub: 'Təklifi seçin, sifariş verin və «Sifarişlərim» bölməsindəki kodu avtomata daxil edin.', logout_confirm: 'Hesabdan çıxmaq istəyirsiniz?', promo_waiting_cart: 'Kod saxlanıldı. Yoxlamaq üçün səbətə məhsul əlavə edin.', theme_light: 'Açıq', theme_dark: 'Tünd', theme_system: 'Avto',
    login_btn: 'Daxil ol', logout_btn: 'Çıxış', catalog_btn: 'İdarəetmə', orders_btn: 'Sifarişlərim', menu_title: 'Kataloq', balance_label: 'Balans',
    footer_desc: 'Təklifləri seçin, balansdan ödəyin və avtomat üçün kod alın.', footer_support: 'Dəstək', footer_about: 'Layihə haqqında', footer_about_text: 'STAKED Bakı restoranlarının sərfəli təkliflərini toplayır. Sifariş balansdan ödənilir, avtomat üçün kod «Sifarişlərim» bölməsinə gəlir.',
    cart_title: 'Səbət', cart_total: 'Cəmi', cart_checkout: 'Sifarişi rəsmiləşdir', cart_clear: 'Təmizlə', cart_empty: 'Səbət boşdur', cart_remove: 'Sil',
    auth_title: 'Xoş gəlmisiniz', auth_sub: 'Daxil olun və ya hesab yaradın', auth_google: 'Google ilə davam et', auth_or: 'və ya', auth_login_btn: 'Daxil ol', auth_register_btn: 'Qeydiyyat',
    topup_title: 'Balansı artır', topup_card_warn: 'Operator köçürməni yoxladıqdan sonra balans artırılacaq.', topup_amount: 'Məbləğ (AZN)', topup_check: 'Qəbzin ekran görüntüsü', topup_btn: 'Qəbzi göndər',
    topup_instructions: 'Köçürmə rekvizitləri Telegram kanalının sabitlənmiş mesajındadır. Məbləği köçürün və aşağıda çekin skrinşotunu əlavə edin.', topup_channel: 'Telegram kanalını aç', topup_terms: 'Müraciətdəki məbləğ köçürməyə uyğundur, çek həqiqidir və mənimdir.',
    topup_terms_required: 'Məbləğin və çekin düzgün olduğunu təsdiqləyin.',
    topup_amount_invalid: '1–100 AZN aralığında, qəpik dəqiqliyi ilə məbləğ daxil edin.',
    topup_file_required: 'Çekin şəklini əlavə edin.',
    topup_session_expired: 'Sessiyanın müddəti bitib. Hesaba yenidən daxil olun.',
    topup_sending: 'Göndərilir…',
    topup_sending_request: 'Müraciət yoxlanış üçün göndərilir…',
    topup_submitted: 'Müraciət qəbul edildi. Balans ödəniş yoxlanıldıqdan sonra yenilənəcək.',
    topup_network_error: 'Serverlə əlaqə yaratmaq olmadı. İnternet bağlantısını yoxlayıb yenidən cəhd edin.',
    topup_generic_error: 'Müraciəti göndərmək mümkün olmadı. Yenidən cəhd edin.',
    topup_invalid_file_type: 'Yalnız JPEG, PNG və WebP şəkilləri dəstəklənir.',
    topup_invalid_file_size: 'Şəklin ölçüsü 5 MB-dan çox olmamalıdır.',
    topup_invalid_file_content: 'Faylın məzmunu şəkil formatına uyğun deyil.',
    topup_pending_limit: 'Gözləyən müraciətlərin sayı çoxdur. Əvvəlkilərin yoxlanmasını gözləyin.',
    auth_callback_error: 'Daxil olma tamamlana bilmədi. Google ilə yenidən daxil olmağa çalışın.',
    admin_title: 'İdarəetmə', admin_tab_products: 'Məhsullar', admin_tab_settings: 'Sayt ayarları', admin_products: 'Məhsullar', admin_add: 'Məhsul əlavə et', admin_search: 'Məhsul axtar',
    settings_title: 'Ana səhifə ayarları', settings_hero_title: 'Ana səhifə başlığı', settings_hero_sub: 'Alt başlıq / təsvir', settings_save: 'Ayarları saxla',
    form_new: 'Yeni məhsul', form_edit: 'Məhsulu redaktə et', form_name: 'Ad', form_desc: 'Təsvir', form_cat: 'Kateqoriya', form_price: 'Qiymət (AZN)', form_image: 'Şəkil (cihazdan)', form_save: 'Saxla',
    added_to_cart: 'səbətə əlavə edildi', cart_cleared: 'Səbət təmizləndi', checkout_msg: 'Sifariş yaradıldı!', product_deleted: 'Silindi', saved: 'Saxlanıldı', out_of_stock: 'Stokda yoxdur', add_to_cart: 'Səbətə əlavə et', no_results: 'Nəticə tapılmadı.', empty_catalog: 'Hələ məhsul yoxdur.',
    orders_title: 'Sifarişlərim', orders_empty: 'Hələ sifarişiniz yoxdur.', orders_pending: 'Təsdiq gözləyir', orders_ready: 'Kod hazırdır', orders_cancelled: 'Ləğv edildi', orders_completed: 'Tamamlandı', orders_expired: 'Kodun müddəti bitib', orders_show_qr: 'Kodu göstər', orders_pending_note: 'Operator sifarişi yoxlayır. Avtomat üçün kod burada görünəcək.', orders_cancel: 'Sifarişi ləğv et', orders_time_left: 'Qalıb', orders_expired_note: 'Kodun müddəti bitib. Dəstəyə yazın, yeni kod verək.', orders_load_error: 'Sifarişləri yükləmək mümkün olmadı. Yenidən cəhd edin.', orders_hide_qr: 'Kodu gizlət', orders_code_label: 'Avtomat üçün kod', orders_code_hint: 'Bu kodu sifariş avtomatına daxil edin.', orders_copy: 'Köçür', orders_copied: 'Kod köçürüldü', wave_title: 'Sifariş göndərildi', wave_text: 'Operator sifarişi yoxlayır. Təsdiqdən sonra «Sifarişlərim» bölməsində kod görünəcək. Onu avtomata daxil edin.', wave_open: 'Sifarişlərimi aç', wave_close: 'Bağla', settings_title: 'Parametrlər', set_appearance: 'Görünüş', set_language: 'Dil', set_winter: 'Yeni il mövzusu', set_winter_label: 'Qar, işıqlar və qış küçəsi', set_motion: 'Animasiya', set_motion_label: 'Dekorativ animasiyaları söndür', promo_title: 'Promokod', promo_enter: 'Promokodu daxil edin', promo_placeholder: 'Promokodu daxil edin', promo_apply: 'Tətbiq et', promo_remove: 'Sil', promo_invalid: 'Promokod etibarsızdır və ya mövcud deyil.', promo_already_used: 'Bu promokodu artıq istifadə etmisiniz.', promo_not_applicable: 'Promokod səbətdəki məhsullara uyğun deyil.', promo_rate_limited: 'Çox cəhd edildi. Bir dəqiqə gözləyin.', promo_applied: 'Promokod tətbiq olundu', promo_free_line: 'Promokodla pulsuz', promo_free_tag: 'Pulsuz', promo_need_login: 'Promokod üçün hesaba daxil olun.', promo_discount_pct: '{v}% endirim', promo_discount_fix: '{v} endirim', promo_free_prod: 'Pulsuz: {name}', promo_scope_product: '"{name}" üçün', promo_until: '{date} tarixinədək', promo_left: '{n} qalıb', promo_cart_hint: 'Promokodunuz var?', cart_subtotal: 'Məbləğ', cart_discount: 'Endirim', tg_title: 'Telegram', tg_hint: 'Sifarişin kodunu şəxsi mesajda alın.', tg_connect: 'Bildirişləri qoş', tg_open: 'Telegram-ı aç', tg_connected: 'Telegram qoşulub', tg_error: 'Link yaradıla bilmədi. Sonra yenidən cəhd edin.', admin_tab_promos: 'Promokodlar', pr_new: 'Yeni', pr_code: 'Kod', pr_title: 'Ad', pr_type: 'Növ', pr_percent: 'Faiz', pr_fixed: 'Sabit məbləğ', pr_free: 'Pulsuz məhsul', pr_value: 'Endirim həcmi', pr_scope: 'Tətbiq sahəsi', pr_scope_all: 'Bütün menyu', pr_scope_product: 'Seçilmiş məhsul', pr_product: 'Məhsul', pr_max_uses: 'Ümumi limit (boş = limitsiz)', pr_per_user: 'İstifadəçi limiti', pr_starts: 'Başlanğıc', pr_ends: 'Bitmə', pr_active: 'Aktiv', pr_save: 'Yadda saxla', pr_cancel: 'Ləğv et', pr_edit: 'Dəyiş', pr_archive: 'Arxivə', pr_restore: 'Qaytar', pr_delete: 'Sil', pr_used: 'İstifadə', pr_left: 'Qalıb', pr_unlimited: 'limitsiz', pr_empty: 'Hələ promokod yoxdur.', pr_saved: 'Yadda saxlanıldı', pr_exists: 'Bu kod artıq mövcuddur.', pr_delete_blocked: 'Promokodun istifadə tarixçəsi var. Arxivə göndərin.', pr_confirm_delete: 'Promokod silinsin?', pr_s_active: 'Aktiv', pr_s_off: 'Söndürülüb', pr_s_expired: 'Müddəti bitib', pr_s_scheduled: 'Başlamayıb', pr_s_exhausted: 'Limit bitib', pr_s_archived: 'Arxivdə',
    cancel_confirm: 'Sifarişi ləğv etmək istəyirsiniz? Geri ödənişi server həyata keçirir.', checkout_busy: 'Sifariş hazırlanır…', checkout_success: 'Sifariş verildi. Avtomat üçün kod «Sifarişlərim» bölməsində görünəcək.', checkout_notify_error: 'Sifariş yaradıldı, lakin Telegram bildirişi göndərilmədi. Dəstəklə əlaqə saxlayın.',
    search_empty: 'Nəticə tapılmadı.'
  }
};
const AZ_MONTHS = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avqust','sentyabr','oktyabr','noyabr','dekabr'];
// Chrome ships no Azerbaijani month names, so az dates are built by hand.
function fmtDate(date, withTime = true) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  if (S.lang === 'az') {
    const hm = withTime ? `, ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` : '';
    return `${date.getDate()} ${AZ_MONTHS[date.getMonth()]} ${date.getFullYear()}${hm}`;
  }
  const loc = S.lang === 'en' ? 'en-US' : 'ru-RU';
  return withTime ? date.toLocaleString(loc, { dateStyle: 'medium', timeStyle: 'short' }) : date.toLocaleDateString(loc);
}
window.stakedFmtDate = fmtDate;
const L3 = (ru, en, az) => (S.lang === 'en' ? en : S.lang === 'az' ? az : ru);
const CAT_LABELS = {
  Burgers: { ru: 'Бургеры', en: 'Burgers', az: 'Burgerlər' }, Combos: { ru: 'Комбо', en: 'Combos', az: 'Kombo' },
  Sides: { ru: 'Закуски', en: 'Sides', az: 'Qəlyanaltılar' }, Drinks: { ru: 'Напитки', en: 'Drinks', az: 'İçkilər' },
  Desserts: { ru: 'Десерты', en: 'Desserts', az: 'Desertlər' }
};
const catLabel = category => CAT_LABELS[category]?.[S.lang] || category || '';
const tr = key => translations[S.lang]?.[key] || translations.ru[key] || key;
try { S.pendingPromoCode = String(localStorage.getItem('pdd.pendingPromo') || '').trim().toUpperCase() || null; } catch { S.pendingPromoCode = null; }
// persist=false is used for the automatic first-visit choice, so a later browser-language
// change still applies until the visitor picks a language by hand.
function applyLanguage(lang, persist = true) {
  const selected = Object.prototype.hasOwnProperty.call(translations, lang) ? lang : 'az';
  S.lang = selected;
  if (persist) { try { localStorage.setItem('pdd.lang', selected); localStorage.setItem('pdd.langManual', '1'); } catch {} }
  // Promo messages are stored as finished text; drop them so none stays in the previous language.
  if (persist && S.promoMsg) S.promoMsg = null;
  document.documentElement.lang = selected;
  document.dispatchEvent(new CustomEvent('staked:lang', { detail: selected }));
  if ($('#currentLangLabel')) $('#currentLangLabel').textContent = selected.toUpperCase();
  document.querySelectorAll('#langDropdown button[data-lang], #langChoice button[data-lang]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === selected)));
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const value = translations[selected]?.[element.dataset.i18n] ?? translations.ru[element.dataset.i18n];
    if (value !== undefined) element.textContent = value;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const value = translations[selected]?.[element.dataset.i18nPlaceholder] ?? translations.ru[element.dataset.i18nPlaceholder];
    if (value !== undefined) element.placeholder = value;
  });
  if (typeof window.stakedRefreshProductCards === 'function') {
    const categoryNames = {
      ru: { All: 'Все', Burgers: 'Бургеры', Combos: 'Комбо', Sides: 'Закуски', Drinks: 'Напитки', Desserts: 'Десерты' },
      en: { All: 'All', Burgers: 'Burgers', Combos: 'Combos', Sides: 'Sides', Drinks: 'Drinks', Desserts: 'Desserts' },
      az: { All: 'Hamısı', Burgers: 'Burgerlər', Combos: 'Kombo', Sides: 'Qəlyanaltılar', Drinks: 'İçkilər', Desserts: 'Desertlər' }
    }[selected];
    document.querySelectorAll('#chips button[data-cat]').forEach(button => {
      const category = button.dataset.cat;
      button.textContent = categoryNames[category] || category;
    });
    requestAnimationFrame(updateChipsSlider);
    window.stakedRefreshProductCards();
    renderCart();
  } else {
    renderAll();
  }
  if ($('#editor')?.open) renderAdmin();
  if ($('#orders')?.open) loadOrders();
}

let authDataLoaded = false;
async function checkAuth({ loadData = false } = {}) {
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
      if ($('#userAvatar')) $('#userAvatar').src = avatarUrl ? safeImageUrl(avatarUrl) : 'assets/icons/avatar.svg';
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
    toast(L3('Не удалось загрузить профиль. Обновите страницу.', 'Could not load your profile. Refresh the page.', 'Profili yükləmək olmadı. Səhifəni yeniləyin.'));
  }
  if (loadData && !authDataLoaded) {
    await Promise.allSettled([load(), loadSettings()]);
    authDataLoaded = true;
  }
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
  $('#authMsg').textContent = L3('Подождите…', 'Please wait…', 'Gözləyin…');
  const email = $('#emailInput').value, pass = $('#passInput').value;
  if (!email || !pass) return $('#authMsg').textContent = L3('Введите email и пароль.', 'Enter your email and password.', 'Email və şifrəni daxil edin.');
  const { error } = await _supabase.auth.signInWithPassword({ email, password: pass });
  if (error) return $('#authMsg').textContent = L3('Неверный email или пароль. Если вы только зарегистрировались, подтвердите адрес по ссылке из письма.', 'Wrong email or password. If you just signed up, confirm your address using the link in the email.', 'Email və ya şifrə yanlışdır. Yeni qeydiyyatdan keçmisinizsə, məktubdakı linklə ünvanı təsdiqləyin.');
  closeDlg($('#auth')); toast(L3('Вы вошли в аккаунт', 'You are signed in', 'Hesaba daxil oldunuz')); await checkAuth();
});
$('#signUpBtn')?.addEventListener('click', async () => {
  $('#authMsg').textContent = L3('Подождите…', 'Please wait…', 'Gözləyin…');
  const email = $('#emailInput').value, pass = $('#passInput').value;
  if (!email || !pass) return $('#authMsg').textContent = L3('Введите email и пароль.', 'Enter your email and password.', 'Email və şifrəni daxil edin.');
  if (pass.length < 6) return $('#authMsg').textContent = L3('Пароль должен быть не короче 6 символов.', 'The password must be at least 6 characters.', 'Şifrə ən azı 6 simvol olmalıdır.');
  const { data, error } = await _supabase.auth.signUp({ email, password: pass });
  if (error) return $('#authMsg').textContent = L3('Не удалось зарегистрироваться: ', 'Could not sign up: ', 'Qeydiyyat alınmadı: ') + error.message;
  if (data.user) {
    if (!data.session) { $('#authMsg').textContent = L3('Мы отправили письмо. Подтвердите адрес по ссылке и войдите.', 'We sent you an email. Confirm your address with the link, then sign in.', 'Sizə məktub göndərdik. Linklə ünvanı təsdiqləyin və daxil olun.'); return; }
    closeDlg($('#auth')); toast(L3('Аккаунт создан', 'Account created', 'Hesab yaradıldı')); await checkAuth();
  }
});
$('#googleLoginBtn')?.addEventListener('click', async (event) => {
  event.preventDefault();
  const button = $('#googleLoginBtn');
  if (button?.disabled) return;
  const originalText = button?.textContent;
  if (button) {
    button.disabled = true;
    button.textContent = S.lang === 'en' ? 'Connecting to Google…' : S.lang === 'az' ? 'Google-a qoşulur…' : 'Подключение к Google…';
  }

  try {
    // Ask Supabase for the OAuth URL, then navigate explicitly. This avoids
    // relying on the SDK's implicit browser redirect and always displays
    // Google's account chooser for users with an existing Google session.
    const { data, error } = await _supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://staked.food/',
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' }
      }
    });
    if (error) throw error;
    if (!data?.url) throw new Error('Supabase не вернул адрес Google OAuth.');

    const authUrl = new URL(data.url);
    const expectedOrigin = new URL(SUPABASE_URL).origin;
    if (authUrl.origin !== expectedOrigin || authUrl.pathname !== '/auth/v1/authorize') {
      throw new Error('Получен неожиданный адрес авторизации. Вход остановлен для безопасности.');
    }

    window.location.assign(authUrl.href);
  } catch (error) {
    console.error('Google sign-in failed:', error?.message || 'Unknown error');
    const message = error?.message || 'Не удалось открыть вход Google.';
    if ($('#authMsg')) $('#authMsg').textContent = message;
    else toast(L3('Вход через Google не удался: ', 'Google sign-in failed: ', 'Google ilə giriş alınmadı: ') + message);
    if (button) {
      button.disabled = false;
      button.textContent = originalText || tr('auth_google');
    }
  }
});
$('#logoutBtn')?.addEventListener('click', async () => {
  if (!window.confirm(tr('logout_confirm'))) return;
  try {
    if (S.ordersTimer) clearInterval(S.ordersTimer);
    const { error } = await _supabase.auth.signOut();
    if (error) throw error;
    S.pendingPromoCode = null;
    try { localStorage.removeItem('pdd.pendingPromo'); } catch {}
    location.reload();
  } catch (error) {
    console.error('Sign out failed:', error);
    toast(S.lang === 'en' ? 'Could not sign out. Try again.' : S.lang === 'az' ? 'Hesabdan çıxmaq mümkün olmadı. Yenidən cəhd edin.' : 'Не удалось выйти из аккаунта. Попробуйте ещё раз.');
  }
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
    S.catalogError = L3('Не удалось загрузить меню. Проверьте интернет и обновите страницу.', 'Could not load the menu. Check your connection and refresh the page.', 'Menyunu yükləmək olmadı. İnterneti yoxlayıb səhifəni yeniləyin.');
  } else S.products = Array.isArray(productResult.data) ? productResult.data : [];
  S.catalogReady = true;
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
    ${p.featured ? `<span class="badge-popular">${L3('Хит', 'Popular', 'Populyar')}</span>` : ''}
    <button class="card-media" type="button" data-act="detail" aria-label="${esc(p.name || 'Товар')}">
      <img src="${esc(imgSrc(p))}" alt="${esc(p.name || '')}" loading="lazy" decoding="async">
    </button>
    <div class="card-body">
      <span class="tag">${esc(p.category || '')}</span>
      <h3>${esc(p.name || 'Товар')}</h3>
      <p>${esc(p.description || '')}</p>
      ${stockKnown ? `<span class="stock-info ${stock < 5 ? 'stock-low' : ''}">${stock} ${L3('шт.', 'pcs', 'əd.')}</span>` : ''}
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
  const categories = ['All', ...new Set([...CATS, ...L.map(p => p.category).filter(Boolean)])]
    .filter(category => category === 'All' || L.some(product => product.category === category));
  if (!categories.includes(S.cat)) S.cat = 'All';

  if ($('#chips')) {
    $('#chips').innerHTML = '<div class="chips-slider" id="chipsSlider"></div>' + categories.map(category =>
      `<button type="button" data-act="cat" data-cat="${esc(category)}" aria-pressed="${S.cat === category}">${category === 'All' ? (S.lang === 'en' ? 'All' : S.lang === 'az' ? 'Hamısı' : 'Все') : esc(category === 'Burgers' ? (S.lang === 'en' ? 'Burgers' : S.lang === 'az' ? 'Burgerlər' : 'Бургеры') : category === 'Combos' ? (S.lang === 'en' ? 'Combos' : S.lang === 'az' ? 'Kombo' : 'Комбо') : category === 'Sides' ? (S.lang === 'en' ? 'Sides' : S.lang === 'az' ? 'Qəlyanaltılar' : 'Закуски') : category === 'Drinks' ? (S.lang === 'en' ? 'Drinks' : S.lang === 'az' ? 'İçkilər' : 'Напитки') : category === 'Desserts' ? (S.lang === 'en' ? 'Desserts' : S.lang === 'az' ? 'Desertlər' : 'Десерты') : category)}</button>`
    ).join('');
    requestAnimationFrame(updateChipsSlider);
  }

  const q = normalizeSearch(S.q);
  const list = L.filter(product =>
    (S.cat === 'All' || product.category === S.cat) &&
    (!q || normalizeSearch([product.name, product.description, product.category].join(' ')).includes(q))
  );
  const nextGridKey = S.cat + '|' + list.map(product => product.id).join(',');
  const gridChanged = nextGridKey !== S.gridKey;
  const grid = $('#grid');

  if (grid) {
    // Until the first catalog response arrives, show card placeholders instead of "no products yet".
    const loadingMarkup = `<p class="st-sr-only" role="status">${esc(L3('Загрузка меню…', 'Loading the menu…', 'Menyu yüklənir…'))}</p>` +
      Array.from({ length: 6 }, () => '<div class="st-skel-card" aria-hidden="true"><span class="st-skel-media"></span><span class="st-skel-line"></span><span class="st-skel-line is-short"></span><span class="st-skel-line is-price"></span></div>').join('');
    const markup = list.length
      ? list.map(card).join('')
      : (!S.catalogReady && !S.catalogError && !L.length)
        ? loadingMarkup
        : `<div class="state"><p>${esc(S.catalogError || (L.length ? tr('no_results') : tr('empty_catalog')))}</p></div>`;
    const animateCards = () => {
      if (!gridChanged || reduce()) return;
      grid.querySelectorAll('.card').forEach((element, index) => {
        element.style.setProperty('--stagger-index', String(Math.min(index, 10)));
        element.classList.add('st-card-enter');
      });
    };

    clearTimeout(S.gridRenderTimer);
    S.gridRenderToken = (S.gridRenderToken || 0) + 1;
    const renderToken = S.gridRenderToken;

    if (gridChanged && grid.children.length && !reduce()) {
      // Fade the outgoing set first; token guards discard stale results when
      // the user changes category or search again before the transition ends.
      grid.classList.remove('st-grid-exit');
      void grid.offsetHeight;
      grid.classList.add('st-grid-exit');
      S.gridRenderTimer = setTimeout(() => {
        if (S.gridRenderToken !== renderToken) return;
        grid.innerHTML = markup;
        grid.classList.remove('st-grid-exit');
        animateCards();
      }, 125);
    } else {
      grid.classList.remove('st-grid-exit');
      grid.innerHTML = markup;
      animateCards();
    }
  }

  S.gridKey = nextGridKey;
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
function setLangDropdown(open) {
  const menu = $('#langDropdown'), trigger = $('.lang-btn');
  if (!menu) return;
  const next = typeof open === 'boolean' ? open : !menu.classList.contains('active');
  menu.classList.toggle('active', next);
  trigger?.setAttribute('aria-expanded', String(next));
}
function toggleLangDropdown() { setLangDropdown(); }
document.querySelector('.lang-dropdown')?.addEventListener('click', e => {
  const btn = e.target.closest('button[data-lang]');
  if (btn) {
    applyLanguage(btn.dataset.lang);
    setLangDropdown(false);
    document.querySelectorAll('.lang-dropdown button[data-lang]').forEach(item =>
      item.setAttribute('aria-pressed', String(item.dataset.lang === S.lang))
    );
  }
});
document.addEventListener('click', e => {
  if (!e.target.closest('#langSelector')) setLangDropdown(false);
});
function updateThemeSlider() {
  const group = $('#profileThemeSeg'), activeBtn = group?.querySelector('button[aria-pressed="true"]'), slider = $('#themeSlider');
  if (activeBtn && slider) {
    slider.style.width = `${activeBtn.offsetWidth}px`;
    slider.style.transform = `translateX(${activeBtn.offsetLeft - 3}px)`;
  }
}
function applyTheme() {
  const root = document.documentElement;

  let preference = 'system';
  try { preference = localStorage.getItem('pdd.theme') || 'system'; } catch {}
  const resolved = preference === 'system'
    ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference;

  // Keep the data attribute and legacy class in lockstep. A stale dark class
  // previously prevented the winter background from following a theme change.
  root.dataset.theme = resolved;
  root.classList.toggle('stacked-dark', resolved === 'dark');
  const browserTheme = document.querySelector('meta[name="theme-color"]');
  if (browserTheme) browserTheme.setAttribute('content', resolved === 'dark' ? '#141311' : '#f7f3ec');

  document.querySelectorAll('#profileThemeSeg button[data-v]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.v === preference)));
  requestAnimationFrame(updateThemeSlider);
}


 // Re-evaluate the system theme only while the user's preference is Auto.
const systemThemePreference = window.matchMedia?.('(prefers-color-scheme: dark)');
const syncSystemTheme = () => {
  let preference = 'system';
  try { preference = localStorage.getItem('pdd.theme') || 'system'; } catch {}
  if (preference === 'system') applyTheme();
};
if (systemThemePreference?.addEventListener) systemThemePreference.addEventListener('change', syncSystemTheme);
else systemThemePreference?.addListener?.(syncSystemTheme);

const lines = () => S.cart.map(c => ({ p: find(c.id), qty: c.qty })).filter(l => l.p);
function renderCart() {
  const L = lines(), n = L.reduce((a, l) => a + l.qty, 0), t = L.reduce((a, l) => a + l.qty * l.p.price, 0);
  if ($('#badge')) $('#badge').textContent = n;
  if ($('#total')) $('#total').textContent = fmt(promoEstimate().total);
  if ($('#lines')) $('#lines').innerHTML = L.length ? L.map(({ p, qty }) => `<li data-id="${esc(p.id)}"><img src="${esc(imgSrc(p))}" alt="" loading="lazy" decoding="async" width="56" height="56"><div><strong>${esc(p.name)}</strong><small>${linePriceHtml(p, qty)}</small><div class="qty"><button data-act="dec">−</button><span>${qty}</span><button data-act="inc">+</button></div></div><button class="link" data-act="rm">${translations[S.lang].cart_remove}</button></li>`).join('') : `<li style="display:block;padding:20px;text-align:center;">${translations[S.lang].cart_empty}</li>`;
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
  if (after > 0 && S.pendingPromoCode && !S.promo && !S.promoBusy) {
    const pendingCode = S.pendingPromoCode;
    S.pendingPromoCode = null;
    try { localStorage.removeItem('pdd.pendingPromo'); } catch {}
    setTimeout(() => applyPromo(pendingCode), 0);
  }
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
  if ($('#detailBody')) $('#detailBody').innerHTML = `<div class="detail" data-id="${esc(p.id)}"><img src="${esc(imgSrc(p))}" alt="${esc(p.name || '')}" width="600" height="450" decoding="async"><span class="tag">${esc(catLabel(p.category))}</span><h2 id="dtn">${esc(p.name)}</h2>${p.description ? `<p>${esc(p.description)}</p>` : ''}<div class="card-foot"><strong>${fmt(p.price)}</strong><button class="btn btn-primary" data-act="add"${isAvailable(p) ? '' : ' disabled'}>${isAvailable(p) ? translations[S.lang].add_to_cart : translations[S.lang].out_of_stock}</button></div></div>`;
  d?.showModal();
}

let sliderTimer = null;
function initSlider(slides) {
  const container = $('#showcaseSlider');
  if (!container) return;
  if (sliderTimer) { clearInterval(sliderTimer); sliderTimer = null; }
  const validSlides = (Array.isArray(slides) ? slides : []).filter(slide => slide && typeof slide.title === 'string' && typeof slide.image_url === 'string');
  const source = validSlides.length ? validSlides : [{
    title: L3('Добро пожаловать в STAKED', 'Welcome to STAKED', 'STAKED-ə xoş gəlmisiniz'), description: L3('Подборка предложений', 'Selected offers', 'Seçilmiş təkliflər'),
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

// Orders.
function statusText(status) {
  return tr(({ pending: 'orders_pending', ready: 'orders_ready', cancelled: 'orders_cancelled', completed: 'orders_completed' })[status] || 'orders_pending');
}
function remainingText(expiry) {
  const ms = new Date(expiry).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return tr('orders_expired');
  const seconds = Math.floor(ms / 1000);
  return `${tr('orders_time_left')}: ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
const COPY_ICON = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
const PICKUP_CODE_RE = /^[A-Za-z0-9-]{3,32}$/;
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
  const code = PICKUP_CODE_RE.test(String(order.pickup_code || '')) ? String(order.pickup_code) : '';
  const qrIsExpired = Boolean(code && expiry && expiry <= Date.now());
  const qrIsReady = Boolean(code) && status === 'ready' && !qrIsExpired;
  const canCancel = status === 'pending' && createdOk && Date.now() - created.getTime() < 120000;
  return { id, status, created: createdOk ? created : null, qrIsExpired, qrIsReady, canCancel, code };
}
function orderCardHtml(order, d) {
  const short = esc(d.id.slice(0, 8).toUpperCase());
  const createdText = d.created ? fmtDate(d.created) : '';
  const itemCount = Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + Math.max(0, Number(item.qty) || 0), 0) : 0;
  const unit = S.lang === 'en' ? 'items' : S.lang === 'az' ? 'ədəd' : 'поз.';
  let body = '';
  if (d.qrIsReady) {
    body = `<div class="order-code"><span class="order-code-label">${esc(tr('orders_code_label'))}</span><div class="order-code-row"><output class="order-code-value" data-selectable="true">${esc(d.code)}</output><button type="button" class="order-code-copy" data-act="copy-code" data-code="${esc(d.code)}" aria-label="${esc(tr('orders_copy'))}">${COPY_ICON}<span>${esc(tr('orders_copy'))}</span></button></div><p class="order-code-hint">${esc(tr('orders_code_hint'))}</p>${order.qr_expires_at ? `<div class="order-qr-expiry" data-expiry="${esc(order.qr_expires_at)}">${esc(remainingText(order.qr_expires_at))}</div>` : ''}</div>`;
  } else if (d.qrIsExpired) {
    body = `<p class="order-note order-note-expired">${esc(tr('orders_expired_note'))}</p>`;
  } else if (d.status === 'pending') {
    body = `<div class="order-wait"><p class="order-note">${esc(tr('orders_pending_note'))}</p></div>${d.canCancel ? `<button type="button" class="btn btn-ghost order-cancel" data-act="cancel-order" data-id="${esc(d.id)}">${esc(tr('orders_cancel'))}</button>` : ''}`;
  } else if (d.status !== 'completed' && d.status !== 'cancelled') {
    body = `<p class="order-note">${esc(statusText(d.status))}</p>`;
  }
  return `<div class="order-card-head"><div class="order-id"><strong>№ ${short}</strong>${createdText ? `<small>${esc(createdText)}</small>` : ''}</div><span class="order-status order-status-${esc(d.status)}">${esc(statusText(d.status))}</span></div>${orderItemsHtml(order.items)}${Number(order.discount_amount) > 0 ? `<div class="order-card-discount"><span>${esc(order.promo_code || '')}</span><span>−${fmt(order.discount_amount)}</span></div>` : ''}<div class="order-card-total"><span>${itemCount ? `${itemCount} ${unit}` : ''}</span><strong>${fmt(order.total)}</strong></div>${body ? `<div class="order-card-body">${body}</div>` : ''}`;
}
// Keyed update: untouched cards stay in the DOM, so scroll position and timers survive each poll.
async function renderOrders(rows) {
  const host = $('#ordersList');
  if (!host) return;
  const owner = S.user?.id || '';
  if (host.dataset.owner !== owner) { host.innerHTML = ''; host.dataset.ready = ''; host.dataset.owner = owner; }
  if (!rows.length) { host.innerHTML = `<div class="orders-empty">${esc(tr('orders_empty'))}</div>`; host.dataset.ready = '1'; return; }
  const prepared = await Promise.all(rows.map(async order => {
    const d = describeOrder(order);
    const sig = [S.lang, d.status, order.total, order.discount_amount || 0, d.code, order.qr_expires_at || '', d.qrIsReady ? 'ready' : '', d.qrIsExpired ? 'x' : '', d.canCancel ? 'c' : '', JSON.stringify(order.items || [])].join('|');
    return { order, d, sig };
  }));
  if (host.dataset.owner !== (S.user?.id || '')) return;
  host.querySelectorAll(':scope > .orders-empty, :scope > .orders-error').forEach(node => node.remove());
  const firstRender = host.dataset.ready !== '1';
  const scrollTop = host.scrollTop;
  const existing = new Map(Array.from(host.querySelectorAll(':scope > .order-card')).map(node => [node.dataset.order, node]));
  let prev = null;
  prepared.forEach(({ order, d, sig }) => {
    let node = existing.get(d.id);
    existing.delete(d.id);
    if (!node) {
      node = document.createElement('article');
      node.className = 'order-card';
      node.dataset.order = d.id;
      if (!firstRender) { node.classList.add('is-new'); node.addEventListener('animationend', () => node.classList.remove('is-new'), { once: true }); }
      node.innerHTML = orderCardHtml(order, d);
      node.dataset.sig = sig;
    } else if (node.dataset.sig !== sig) {
      node.innerHTML = orderCardHtml(order, d);
      node.dataset.sig = sig;
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
    const { data, error } = await _supabase.from('orders').select('id,user_id,total,items,status,created_at,pickup_code,qr_expires_at,discount_amount,promo_code').eq('user_id', S.user.id).order('created_at', { ascending: false }).limit(50);
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
  d.innerHTML = `<div class="order-wave-sheet"><svg class="order-wave-edge" viewBox="0 0 1200 48" preserveAspectRatio="none" aria-hidden="true"><path d="M0 26C100 6 200 6 300 26S500 46 600 26S800 6 900 26S1100 46 1200 26V48H0Z" fill="currentColor"/></svg><div class="order-wave-body"><span class="order-wave-icon"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span><h2 id="orderWaveTitle">${esc(tr('wave_title'))}</h2><p>${esc(tr('wave_text'))}</p>${withWarning ? `<p class="order-wave-warn">${esc(tr('checkout_notify_error'))}</p>` : ''}<div class="order-wave-actions"><button type="button" class="btn order-wave-primary" data-wave="open">${esc(tr('wave_open'))}</button><button type="button" class="btn order-wave-secondary" data-wave="close">${esc(tr('wave_close'))}</button></div></div></div>`;
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
  if (p.ends_at) text += ' · ' + trf('promo_until', { date: fmtDate(new Date(p.ends_at), false) });
  if (p.remaining !== null && p.remaining !== undefined) text += ' · ' + trf('promo_left', { n: p.remaining });
  return text;
}
function promoChipHtml(est) {
  const p = S.promo;
  return `<div class="promo-chip"><div class="promo-chip-text"><strong>${esc(p.title || p.code)}</strong><small>${esc(p.code)} · ${esc(promoDescription(p))}</small>${est.applicable ? '' : `<small class="promo-warn">${esc(tr('promo_not_applicable'))}</small>`}</div><button type="button" class="link" data-promo="remove">${esc(tr('promo_remove'))}</button></div>`;
}
function renderPromoUI() {
  if (!S.user && S.promo) S.promo = null;
  const est = promoEstimate(), box = $('#cartPromo');
  const msg = S.promoMsg ? `<p class="promo-msg ${S.promoMsg.error ? 'is-error' : 'is-ok'}">${esc(S.promoMsg.text)}</p>` : '';
  const promoView = (S.promo ? promoChipHtml(est) : '') + msg;
  if (box) {
    box.classList.add('st-promo-glass');
    box.hidden = !lines().length;
    if (!$('#cartPromoForm', box)) {
      box.innerHTML = `<div class="cart-promo-title" data-i18n="promo_enter">${esc(tr('promo_enter'))}</div>
        <form id="cartPromoForm" class="promo-form cart-promo-form" data-promo-form autocomplete="off">
          <input id="cartPromoInput" data-promo-input data-i18n-placeholder="promo_placeholder" type="text" maxlength="32" autocapitalize="characters" autocomplete="off" spellcheck="false" enterkeyhint="done" placeholder="${esc(tr('promo_placeholder'))}">
          <button class="btn btn-primary" type="submit" id="cartPromoApplyBtn" data-promo-apply data-i18n="promo_apply">${esc(tr('promo_apply'))}</button>
        </form>
        <div id="cartPromoStatus" class="promo-status" aria-live="polite"></div>`;
    }
  }
  ['#promoStatus', '#profilePromoStatus', '#cartPromoStatus'].forEach(selector => {
    const status = $(selector);
    if (status) status.innerHTML = promoView;
  });
  document.querySelectorAll('[data-promo-input]').forEach(input => {
    if (input !== document.activeElement && !input.value && S.pendingPromoCode) input.value = S.pendingPromoCode;
  });
  const showSum = Boolean(S.promo) && est.discount > 0;
  [['#cartSubtotalRow', showSum], ['#cartDiscountRow', showSum]].forEach(([sel, on]) => { const node = $(sel); if (node) node.hidden = !on; });
  if ($('#cartSubtotal')) $('#cartSubtotal').textContent = fmt(est.subtotal);
  if ($('#cartDiscount')) $('#cartDiscount').textContent = '−' + fmt(est.discount);
  document.querySelectorAll('form[data-promo-form]').forEach(form => {
    form.classList.toggle('is-error', Boolean(S.promoMsg?.error));
    form.classList.toggle('is-ok', Boolean(S.promo && S.promoMsg && !S.promoMsg.error));
  });
}
function setPromoMsg(text, error) {
  S.promoMsg = text ? { text, error: Boolean(error) } : null;
  // Restart the shake when the same error repeats.
  if (error) document.querySelectorAll('form[data-promo-form].is-error').forEach(form => { form.classList.remove('is-error'); void form.offsetWidth; });
  renderPromoUI();
}
document.addEventListener('input', e => {
  const input = e.target.closest?.('[data-promo-input]');
  if (input) input.closest('form')?.classList.remove('is-error');
});
async function applyPromo(raw) {
  const code = String(raw || '').trim().toUpperCase();
  if (!code || S.promoBusy) return;
  if (!S.user) { setPromoMsg(tr('promo_need_login'), true); return; }
  if (!lines().length) {
    S.pendingPromoCode = code;
    try { localStorage.setItem('pdd.pendingPromo', code); } catch {}
    S.promoMsg = { text: tr('promo_waiting_cart'), error: false };
    renderPromoUI();
    return;
  }

  const buttons = $$('[data-promo-apply]');
  S.promoBusy = true;
  buttons.forEach(button => { button.disabled = true; button.closest('form')?.classList.add('is-busy'); button.setAttribute('aria-busy', 'true'); });
  try {
    const cartItems = S.cart
      .filter(item => item && Number.isInteger(Number(item.qty)) && Number(item.qty) > 0)
      .map(item => ({ id: String(item.id), qty: Number(item.qty) }));

    const { data, error } = await _supabase.rpc('stackd_promo_preview', {
      p_code: code,
      p_items: cartItems
    });
    if (error) throw error;
    if (!data || typeof data !== 'object') throw new Error('The promo service returned an empty response.');

    if (!data.ok) {
      const reason = ['already_used', 'not_applicable', 'rate_limited'].includes(data.reason) ? data.reason : 'invalid';
      setPromoMsg(tr('promo_' + reason), true);
      return;
    }

    const kind = data.type;
    const productId = data.product?.id == null ? null : String(data.product.id);
    const needsFreeProduct = kind === 'free_product' && data.applicable === false;

    // A free-product code may preview as not applicable until its complimentary item is added.
    if (needsFreeProduct) {
      if (!productId || data.product?.purchasable !== true) {
        setPromoMsg(tr('promo_not_applicable'), true);
        return;
      }
      if (!S.cart.some(item => String(item.id) === productId && Number(item.qty) > 0)) {
        const product = find(productId);
        if (!product || !isAvailable(product)) {
          setPromoMsg(tr('promo_not_applicable'), true);
          return;
        }
        setQty(productId, 1);
        if (!S.cart.some(item => String(item.id) === productId && Number(item.qty) > 0)) {
          setPromoMsg(tr('promo_not_applicable'), true);
          return;
        }
      }
    } else if (data.applicable === false) {
      setPromoMsg(tr('promo_not_applicable'), true);
      return;
    }

    const value = kind === 'percent' ? Number(data.percent) : Number(data.amount);
    if (!['percent', 'fixed', 'free_product'].includes(kind) || (kind !== 'free_product' && (!Number.isFinite(value) || value <= 0))) {
      throw new Error('The promo service returned an invalid discount.');
    }

    const nextPromo = {
      code: String(data.code || code),
      title: String(data.title || data.code || code),
      kind,
      value: Number.isFinite(value) ? value : 0,
      scope: data.scope || 'cart',
      product_id: productId,
      ends_at: data.ends_at || null,
      remaining: data.remaining ?? null
    };
    S.promo = nextPromo;
    const estimate = promoEstimate(nextPromo);
    if (!estimate.applicable) {
      S.promo = null;
      setPromoMsg(tr('promo_not_applicable'), true);
      return;
    }

    S.promoMsg = { text: tr('promo_applied'), error: false };
    S.pendingPromoCode = null;
    try { localStorage.removeItem('pdd.pendingPromo'); } catch {}
    document.querySelectorAll('[data-promo-input]').forEach(input => { input.value = ''; });
    renderCart();
  } catch (error) {
    console.error('Promo preview failed:', error);
    const code = String(error?.code || '');
    const status = Number(error?.status || error?.statusCode || 0);
    if (code === '42501' || status === 401 || status === 403) {
      setPromoMsg(L3('Не удалось проверить промокод. Попробуйте позже.', 'Could not check the promo code. Try again later.', 'Promokodu yoxlamaq olmadı. Bir az sonra yenidən cəhd edin.'), true);
    } else if (status === 429 || /rate.?limit/i.test(String(error?.message || ''))) {
      setPromoMsg(tr('promo_rate_limited'), true);
    } else {
      setPromoMsg(L3('Не удалось проверить промокод. Проверьте интернет и попробуйте ещё раз.', 'Could not check the promo code. Check your connection and try again.', 'Promokodu yoxlamaq olmadı. İnterneti yoxlayıb yenidən cəhd edin.'), true);
    }
  } finally {
    S.promoBusy = false;
    buttons.forEach(button => { button.disabled = false; button.closest('form')?.classList.remove('is-busy'); button.removeAttribute('aria-busy'); });
  }
}
document.addEventListener('submit', e => {
  const form = e.target.closest('form[data-promo-form]');
  if (!form) return;
  e.preventDefault();
  applyPromo(form.querySelector('[data-promo-input]')?.value);
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-promo]'); if (!b) return;
  if (b.dataset.promo === 'remove') { S.promo = null; S.promoMsg = null; renderCart(); }
});

/* ===================== Settings panel ===================== */
const settingsBtn = $('#settingsBtn'), settingsPanel = $('#settingsPanel'), settingsScrim = $('#settingsScrim');
function syncSettingsUI() {
  settingsBtn?.setAttribute('aria-label', tr('settings_title'));
  document.querySelectorAll('#langChoice button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === S.lang)));
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
$('#tgConnectBtn')?.addEventListener('click', async e => {
  const btn = e.currentTarget; if (!S.tgBot || btn.disabled) return;
  btn.disabled = true;
  try {
    const { data: token, error } = await _supabase.rpc('stackd_telegram_link_token');
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
  S.promoRows = (data || []).map(r => ({ ...r, kind: r.discount_type, value: r.percent_off ?? r.amount_off, per_user_limit: r.max_uses_per_user })); renderPromoRows();
}
document.querySelector('.admin-tabs [data-tab="promos"]')?.addEventListener('click', loadPromos);
$('#promoNewBtn')?.addEventListener('click', () => openPromoEditor(null));
$('#promoCancelBtn')?.addEventListener('click', () => { const f = PROMO_FORM(); if (f) f.hidden = true; });
PROMO_FORM()?.addEventListener('change', syncPromoFormFields);
PROMO_FORM()?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!isAdmin()) { toast('Недостаточно прав.'); return; }

  const f = e.currentTarget, msg = $('#promoMsg'), free = f.kind.value === 'free_product';
  const kind = f.kind.value;
  const scope = free ? 'product' : f.scope.value;
  const code = String(f.code.value || '').trim().toUpperCase();
  const title = String(f.title.value || '').trim() || code;
  const productId = free || scope === 'product' ? String(f.product_id.value || '') : '';
  const value = f.value.value === '' ? null : Number(f.value.value);
  const maxUses = f.max_uses.value === '' ? null : Number(f.max_uses.value);
  const perUserLimit = f.per_user_limit.value === '' ? 1 : Number(f.per_user_limit.value);
  const startsAt = f.starts_at.value ? new Date(f.starts_at.value) : null;
  const endsAt = f.ends_at.value ? new Date(f.ends_at.value) : null;

  const fail = message => { if (msg) msg.textContent = message; };
  if (!/^[^\s]{3,32}$/.test(code)) { fail('Код должен содержать 3–32 символа без пробелов.'); return; }
  if (title.length < 1 || title.length > 80) { fail('Название должно содержать от 1 до 80 символов.'); return; }
  if (!['percent', 'fixed', 'free_product'].includes(kind)) { fail('Выберите корректный тип промокода.'); return; }
  if (!free && (!Number.isFinite(value) || value <= 0)) { fail('Укажите положительный размер скидки.'); return; }
  if (kind === 'percent' && value > 100) { fail('Процент скидки не может превышать 100%.'); return; }
  if (kind === 'fixed' && value > 100000) { fail('Фиксированная скидка слишком большая.'); return; }
  if (scope === 'product' && !productId) { fail('Выберите товар для этого промокода.'); return; }
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) { fail('Общий лимит должен быть целым числом больше нуля.'); return; }
  if (!Number.isInteger(perUserLimit) || perUserLimit < 1) { fail('Лимит на пользователя должен быть целым числом больше нуля.'); return; }
  if (startsAt && Number.isNaN(startsAt.getTime())) { fail('Проверьте дату начала.'); return; }
  if (endsAt && Number.isNaN(endsAt.getTime())) { fail('Проверьте дату окончания.'); return; }
  if (startsAt && endsAt && endsAt.getTime() <= startsAt.getTime()) { fail('Дата окончания должна быть позже даты начала.'); return; }

  const payload = {
    code,
    title: title.slice(0, 80),
    discount_type: kind,
    percent_off: kind === 'percent' ? value : null,
    amount_off: kind === 'fixed' ? value : null,
    scope,
    product_id: productId || null,
    max_uses: maxUses,
    max_uses_per_user: perUserLimit,
    starts_at: startsAt ? startsAt.toISOString() : null,
    ends_at: endsAt ? endsAt.toISOString() : null,
    active: f.active.checked
  };

  msg.textContent = '';
  const button = f.querySelector('button[type="submit"]');
  if (button) button.disabled = true;
  try {
    const query = f.dataset.id
      ? _supabase.from('promo_codes').update(payload).eq('id', f.dataset.id)
      : _supabase.from('promo_codes').insert(payload);
    const { error } = await query;
    if (error) {
      console.error('Promo save failed:', error);
      if (error.code === '23505') fail(tr('pr_exists'));
      else if (error.code === '23514') fail('Проверьте тип скидки, значение, выбранный товар и даты.');
      else fail(error.message || 'Не удалось сохранить промокод.');
      return;
    }
    f.hidden = true;
    toast(tr('pr_saved'));
    await loadPromos();
  } catch (error) {
    console.error('Promo save request failed:', error);
    fail('Не удалось сохранить промокод. Проверьте соединение и попробуйте ещё раз.');
  } finally {
    if (button) button.disabled = false;
  }
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
  if (button) { button.disabled = true; button.innerHTML = (window.stLoader ? stLoader() : '') + `<span>${esc(tr('checkout_busy'))}</span>`; }
  try {
    const { data, error } = await _supabase.rpc('stackd_checkout', { p_items: S.cart.map(item => ({ id: item.id, qty: item.qty })), p_promo_code: S.promo?.code || null, p_request_id: (S.checkoutRequestId ||= newRequestId()) });
    if (error) throw error;
    const orderId = typeof data === 'string' ? data : (data?.id || data?.order_id || data?.orderId || data?.[0]?.id);
    if (!orderId) throw new Error('checkout_order не вернул ID заказа.');
    S.cart = []; S.promo = null; S.promoMsg = null; S.pendingPromoCode = null; try { localStorage.removeItem('pdd.pendingPromo'); } catch {} S.checkoutRequestId = null; saveCart(); renderCart(); closeDlg($('#drawer')); document.dispatchEvent(new Event('stacked:cart-cleared'));
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
    const promoFail = /promo_(invalid|already_used|not_applicable|rate_limited)/i.exec(String(error?.message || ''));
    if (promoFail) { S.promo = null; S.promoMsg = null; renderCart(); toast(tr('promo_' + promoFail[1].toLowerCase())); return; }
    toast(L3('Не удалось оформить заказ: ', 'Could not place the order: ', 'Sifariş vermək olmadı: ') + (error.message || L3('ошибка сервера', 'server error', 'server xətası')));
  } finally {
    S.checkoutBusy = false;
    if (button) { button.disabled = false; button.textContent = oldText; }
    renderCart();
  }
}

const A = {
  add: id => { const p = find(id); if (p && isAvailable(p)) { setQty(id, 1); toast(p.name + ' ' + translations[S.lang].added_to_cart); } },
  inc: id => setQty(id, 1), dec: id => setQty(id, -1),
  rm: id => { S.cart = S.cart.filter(c => c.id !== id); if (!S.cart.length) { S.promo = null; S.promoMsg = null; } saveCart(); renderCart(); bump(); },
  clear: () => { S.cart = []; S.promo = null; S.promoMsg = null; S.pendingPromoCode = null; try { localStorage.removeItem('pdd.pendingPromo'); } catch {} saveCart(); renderCart(); document.dispatchEvent(new Event('stacked:cart-cleared')); toast(translations[S.lang].cart_cleared); },
  checkout, orders: openOrders,
  'copy-code': async (_, button) => {
    const code = String(button.dataset.code || '');
    if (!PICKUP_CODE_RE.test(code)) return;
    try { await navigator.clipboard.writeText(code); toast(tr('orders_copied')); }
    catch { const out = button.closest('.order-code')?.querySelector('.order-code-value'); if (out) { const r = document.createRange(); r.selectNodeContents(out); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); } }
  },
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
  const showMessage = (text, state = 'error') => { if (message) { message.textContent = text; message.dataset.state = state; message.setAttribute('role', 'status'); message.setAttribute('aria-live', 'polite'); } };
  const errorCopy = new Map([
    ['Поддерживаются только JPEG, PNG и WebP.', tr('topup_invalid_file_type')],
    ['Размер изображения должен быть не более 5 МБ.', tr('topup_invalid_file_size')],
    ['Содержимое файла не соответствует формату изображения.', tr('topup_invalid_file_content')],
    ['Сумма должна быть от 1 до 100 AZN.', tr('topup_amount_invalid')],
    ['Прикрепите изображение чека.', tr('topup_file_required')],
    ['Слишком много ожидающих заявок. Дождитесь проверки предыдущих.', tr('topup_pending_limit')],
    ['Сессия недействительна. Войдите снова.', tr('topup_session_expired')],
    ['Войдите в аккаунт.', tr('topup_session_expired')]
  ]);
  if (!S.user) { closeDlg($('#topup')); $('#auth')?.showModal(); return; }
  if (!$('#termsCheck')?.checked) { showMessage(tr('topup_terms_required')); return; }
  if (!Number.isFinite(amount) || amount < 1 || amount > 100 || Math.round(amount * 100) !== amount * 100) {
    showMessage(tr('topup_amount_invalid')); return;
  }
  if (!file) { showMessage(tr('topup_file_required')); return; }
  try {
    await validateProductImage(file);
    const { data: { session }, error: sessionError } = await _supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.access_token || !S.user?.id) throw new Error('Сессия недействительна. Войдите снова.');
    if (button) { button.disabled = true; button.innerHTML = (window.stLoader ? stLoader() : '') + '<span>' + tr('topup_sending') + '</span>'; }
    showMessage(tr('topup_sending_request'), 'info');
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('amount', String(amount));
    formData.append('requestId', S.topupRequestId);
    // The server derives ownership from the verified JWT; userId is retained only for backward compatibility.
    formData.append('userId', S.user.id);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/submit-topup`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}` },
      body: formData
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok !== true) {
      const serverMessage = String(result.error || result.message || '');
      if (serverMessage) throw new Error(errorCopy.get(serverMessage) || tr('topup_generic_error'));
      throw new Error(tr('topup_generic_error'));
    }
    form.reset();
    S.topupRequestId = crypto.randomUUID();
    showMessage(tr('topup_submitted'), 'success');
  } catch (error) {
    console.error('Top-up submission failed:', error);
    const messageText = errorCopy.get(String(error?.message || ''));
    showMessage(messageText || (error instanceof TypeError ? tr('topup_network_error') : error instanceof Error && error.message.startsWith('Поддерживаются') ? tr('topup_invalid_file_type') : tr('topup_generic_error')), 'error');
  } finally {
    if (button) { button.disabled = false; button.textContent = tr('topup_btn'); }
  }
});

// Restore language and theme.
// Order: the visitor's saved choice, then the browser languages, then Azerbaijani.
// Crawlers get Azerbaijani so search results show one consistent language.
function detectBrowserLanguage() {
  if (/bot|crawl|spider|slurp|facebookexternalhit|preview/i.test(navigator.userAgent || '')) return 'az';
  const list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']);
  for (const raw of list) {
    const code = String(raw || '').toLowerCase().split('-')[0];
    if (code === 'az' || code === 'tr') return 'az';
    if (code === 'ru' || code === 'uk' || code === 'be' || code === 'kk') return 'ru';
    if (code === 'en') return 'en';
  }
  return 'az';
}
let initialLanguage = null;
try {
  const storedLanguage = localStorage.getItem('pdd.lang');
  // Older builds saved "ru" on every visit, chosen or not. Without the manual flag a stored "ru"
  // is treated as unknown; "az" and "en" could only have been picked by hand, so they stay.
  const manual = localStorage.getItem('pdd.langManual') === '1' || (storedLanguage && storedLanguage !== 'ru');
  if (manual && storedLanguage && Object.prototype.hasOwnProperty.call(translations, storedLanguage)) initialLanguage = storedLanguage;
} catch (error) { console.warn('Language preference unavailable:', error); }
applyLanguage(initialLanguage || detectBrowserLanguage(), false);
applyTheme();

// Finalize OAuth callbacks before refreshing the account UI.
// Supabase normally detects the implicit-flow fragment during client startup;
// this fallback covers delayed callback restoration without exposing tokens.
async function finalizeOAuthCallback() {
  const params = new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '');
  const hasOAuthTokens = params.has('access_token') && params.has('refresh_token');
  if (!hasOAuthTokens) return;

  let session = null;
  try {
    const current = await _supabase.auth.getSession();
    if (current.error) throw current.error;
    session = current.data?.session || null;
  } catch (error) {
    console.warn('OAuth session lookup failed; attempting callback recovery.');
  }

  if (!session) {
    const { data, error } = await _supabase.auth.setSession({
      access_token: params.get('access_token'),
      refresh_token: params.get('refresh_token')
    });
    if (error) throw error;
    session = data?.session || null;
  }

  if (session) {
    // Remove access/refresh/provider tokens from the visible URL and browser history.
    window.history.replaceState(window.history.state, document.title, window.location.pathname + window.location.search);
  }
}

const authCallbackReady = finalizeOAuthCallback().catch(error => {
  console.error('OAuth callback could not be finalized:', error?.message || 'Unknown auth error');
  const message = tr('auth_callback_error');
  const authMessage = $('#authMsg');
  if (authMessage) authMessage.textContent = message;
  else if (typeof toast === 'function') toast(message);
});

// Auth changes update the account UI only. Catalog/settings are fetched once at boot.
let authRefreshTimer = 0;
function scheduleAuthRefresh(loadData = false) {
  clearTimeout(authRefreshTimer);
  authRefreshTimer = window.setTimeout(() => {
    checkAuth({ loadData: loadData || !authDataLoaded }).catch(error => {
      console.error('Authentication refresh failed:', error);
    });
  }, 60);
}
_supabase.auth.onAuthStateChange((_event, session) => {
  S.user = session?.user || null;
  scheduleAuthRefresh();
});

// Start only after the OAuth callback has been restored and its tokens removed from the URL.
authCallbackReady.finally(() => scheduleAuthRefresh(true));
