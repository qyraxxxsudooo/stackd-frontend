const SUPABASE_URL = 'https://wjlkztgmbqaflcdldapi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DpbANPkD124VOGD3JkS7AA_pd2n_Ong'; // Publishable key: safe for browser use only when RLS is correctly configured.
const ADMIN_EMAIL = 'yuska20102010@gmail.com';
const PRODUCT_BUCKET = 'product-images';
const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = Object.freeze({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' });

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.stackdSupabase = _supabase; // Used by the admin-only webhook setup command in DevTools.
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>(Number(n)||0).toFixed(2)+' AZN',PH='assets/icons/placeholder.svg',CATS=['Burgers','Sides','Drinks','Desserts'];
const S={products:[],cart:[],cat:'All',q:'',adminQ:'',user:null,profile:null,draft:null,lang:'ru',catalogError:null,ordersTimer:null,ordersBusy:false,checkoutBusy:false,topupRequestId:crypto.randomUUID(),qrCache:new Map()};

try {
  const cached = JSON.parse(localStorage.getItem('pdd.cart') || '[]');
  S.cart = Array.isArray(cached) ? cached.filter(x => x && (typeof x.id === 'string' || typeof x.id === 'number') && Number.isInteger(Number(x.qty)) && Number(x.qty) > 0 && Number(x.qty) <= 50).map(x => ({ id: String(x.id), qty: Number(x.qty) })) : [];
} catch { S.cart = []; }
const saveCart=()=>{ try { localStorage.setItem('pdd.cart',JSON.stringify(S.cart)); } catch (e) { console.warn('Cart persistence unavailable', e); } };
const isAdmin=()=>String(S.user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase() && !ADMIN_EMAIL.startsWith('REPLACE_');
const normalizeSearch=s=>String(s ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim();
function safeImageUrl(value) {
  if (!value || typeof value !== 'string') return PH;
  try { const u = new URL(value, window.location.origin); return (u.protocol === 'https:' || u.origin === window.location.origin) ? u.href : PH; }
  catch { return PH; }
}

const translations = {
  ru: {
    search_placeholder:'Поиск в Stackd', theme_light:'Светлая', theme_dark:'Тёмная', theme_system:'Авто',
    login_btn:'Войти', logout_btn:'Выйти', catalog_btn:'Каталог', orders_btn:'Мои заказы', menu_title:'Меню', balance_label:'Баланс',
    footer_desc:'Лучшие предложения на еду в Баку.', footer_support:'Поддержка', footer_about:'О проекте', footer_about_text:'Данные хранятся в облаке Supabase.',
    cart_title:'Корзина', cart_total:'Итого', cart_checkout:'Оформить заказ', cart_clear:'Очистить', cart_empty:'Корзина пуста', cart_remove:'Удалить',
    auth_title:'Добро пожаловать', auth_sub:'Войдите или создайте аккаунт', auth_google:'Продолжить с Google', auth_or:'или', auth_login_btn:'Войти', auth_register_btn:'Регистрация',
    topup_title:'Пополнение', topup_card_warn:'Заявка проверяется оператором. Баланс пополнится только после подтверждения платежа.', topup_amount:'Сумма (AZN)', topup_check:'Скриншот чека', topup_btn:'Отправить чек',
    topup_instructions:'Реквизиты для перевода находятся в закреплённом сообщении Telegram-канала. После оплаты прикрепите скриншот чека.', topup_channel:'Открыть Telegram-канал', topup_terms:'Я подтверждаю, что данные заявки верны. Зачисление выполняется только после проверки платежа.',
    admin_title:'Управление', admin_tab_products:'Товары', admin_tab_settings:'Настройки сайта', admin_products:'Товары', admin_add:'Добавить', admin_search:'Поиск товаров',
    settings_title:'Настройки главной страницы', settings_hero_title:'Заголовок на главной', settings_hero_sub:'Подзаголовок / описание', settings_save:'Сохранить настройки',
    form_new:'Новый товар', form_edit:'Редактировать', form_name:'Название', form_desc:'Описание', form_cat:'Категория', form_price:'Цена (AZN)', form_image:'Картинка (с ПК)', form_save:'Сохранить',
    added_to_cart:'добавлен в корзину', cart_cleared:'Корзина очищена', checkout_msg:'Заказ создан!', product_deleted:'Удалено', saved:'Сохранено', out_of_stock:'Нет в наличии', add_to_cart:'В корзину', no_results:'Ничего не найдено.', empty_catalog:'Товаров пока нет.',
    orders_title:'Мои заказы', orders_empty:'У вас пока нет заказов.', orders_pending:'Ожидает подтверждения', orders_ready:'QR-код готов', orders_cancelled:'Отменён', orders_completed:'Выполнен', orders_expired:'Срок действия QR истёк', orders_show_qr:'Нажмите, чтобы открыть QR-код', orders_pending_note:'Оператор проверяет заказ. QR-код появится здесь после ответа в Telegram.', orders_cancel:'Отменить заказ', orders_time_left:'Осталось', orders_expired_note:'Срок QR-кода истёк. Обратитесь в поддержку.', orders_load_error:'Не удалось загрузить заказы. Попробуйте ещё раз.',
    cancel_confirm:'Отменить заказ? Возврат средств выполняется сервером.', checkout_busy:'Оформляем заказ…', checkout_success:'Заказ создан. QR-код появится здесь после ответа оператора в Telegram.', checkout_notify_error:'Заказ создан, но уведомление Telegram не отправлено. Обратитесь в поддержку.',
    search_empty:'Ничего не найдено.'
  },
  en: {
    search_placeholder:'Search Stackd', theme_light:'Light', theme_dark:'Dark', theme_system:'Auto',
    login_btn:'Log in', logout_btn:'Log out', catalog_btn:'Admin panel', orders_btn:'My orders', menu_title:'Catalog', balance_label:'Balance',
    footer_desc:'The best food deals in Baku.', footer_support:'Support', footer_about:'About', footer_about_text:'Data is stored in Supabase cloud.',
    cart_title:'Cart', cart_total:'Total', cart_checkout:'Checkout', cart_clear:'Clear', cart_empty:'Your cart is empty', cart_remove:'Remove',
    auth_title:'Welcome', auth_sub:'Log in or create an account', auth_google:'Continue with Google', auth_or:'or', auth_login_btn:'Log in', auth_register_btn:'Sign up',
    topup_title:'Add balance', topup_card_warn:'Your request is reviewed by an operator. Funds are added only after payment confirmation.', topup_amount:'Amount (AZN)', topup_check:'Payment receipt screenshot', topup_btn:'Submit receipt',
    topup_instructions:'Transfer details are in the pinned message of our Telegram channel. Attach your receipt screenshot after payment.', topup_channel:'Open Telegram channel', topup_terms:'I confirm that the submitted information is correct. Funds are added only after payment verification.',
    admin_title:'Management', admin_tab_products:'Products', admin_tab_settings:'Site settings', admin_products:'Products', admin_add:'Add product', admin_search:'Search products',
    settings_title:'Homepage settings', settings_hero_title:'Homepage title', settings_hero_sub:'Subtitle / description', settings_save:'Save settings',
    form_new:'New product', form_edit:'Edit product', form_name:'Name', form_desc:'Description', form_cat:'Category', form_price:'Price (AZN)', form_image:'Image (from device)', form_save:'Save',
    added_to_cart:'added to cart', cart_cleared:'Cart cleared', checkout_msg:'Order created!', product_deleted:'Deleted', saved:'Saved', out_of_stock:'Out of stock', add_to_cart:'Add to cart', no_results:'No results found.', empty_catalog:'No products yet.',
    orders_title:'My orders', orders_empty:'You have no orders yet.', orders_pending:'Awaiting confirmation', orders_ready:'QR code ready', orders_cancelled:'Cancelled', orders_completed:'Completed', orders_expired:'QR code expired', orders_show_qr:'Tap to reveal the QR code', orders_pending_note:'The operator is reviewing your order. The QR will appear here after a Telegram reply.', orders_cancel:'Cancel order', orders_time_left:'Remaining', orders_expired_note:'The QR code expired. Contact support.', orders_load_error:'Could not load orders. Please try again.',
    cancel_confirm:'Cancel this order? Any refund is processed by the server.', checkout_busy:'Placing order…', checkout_success:'Order created. The QR will appear here after the operator replies in Telegram.', checkout_notify_error:'Order created, but Telegram notification failed. Contact support.',
    search_empty:'No results found.'
  },
  az: {
    search_placeholder:'Stackd-də axtar', theme_light:'Açıq', theme_dark:'Tünd', theme_system:'Avto',
    login_btn:'Daxil ol', logout_btn:'Çıxış', catalog_btn:'İdarəetmə', orders_btn:'Sifarişlərim', menu_title:'Kataloq', balance_label:'Balans',
    footer_desc:'Bakıda ən yaxşı yemək təklifləri.', footer_support:'Dəstək', footer_about:'Layihə haqqında', footer_about_text:'Məlumatlar Supabase buludunda saxlanılır.',
    cart_title:'Səbət', cart_total:'Cəmi', cart_checkout:'Sifarişi rəsmiləşdir', cart_clear:'Təmizlə', cart_empty:'Səbət boşdur', cart_remove:'Sil',
    auth_title:'Xoş gəlmisiniz', auth_sub:'Daxil olun və ya hesab yaradın', auth_google:'Google ilə davam et', auth_or:'və ya', auth_login_btn:'Daxil ol', auth_register_btn:'Qeydiyyat',
    topup_title:'Balansı artır', topup_card_warn:'Müraciət operator tərəfindən yoxlanılır. Vəsait yalnız ödəniş təsdiqləndikdən sonra əlavə olunur.', topup_amount:'Məbləğ (AZN)', topup_check:'Qəbzin ekran görüntüsü', topup_btn:'Qəbzi göndər',
    topup_instructions:'Köçürmə rekvizitləri Telegram kanalının sabitlənmiş mesajındadır. Ödənişdən sonra qəbzin şəklini əlavə edin.', topup_channel:'Telegram kanalını aç', topup_terms:'Müraciət məlumatlarının düzgün olduğunu təsdiq edirəm. Vəsait yalnız ödəniş yoxlanıldıqdan sonra əlavə olunur.',
    admin_title:'İdarəetmə', admin_tab_products:'Məhsullar', admin_tab_settings:'Sayt ayarları', admin_products:'Məhsullar', admin_add:'Məhsul əlavə et', admin_search:'Məhsul axtar',
    settings_title:'Ana səhifə ayarları', settings_hero_title:'Ana səhifə başlığı', settings_hero_sub:'Alt başlıq / təsvir', settings_save:'Ayarları saxla',
    form_new:'Yeni məhsul', form_edit:'Məhsulu redaktə et', form_name:'Ad', form_desc:'Təsvir', form_cat:'Kateqoriya', form_price:'Qiymət (AZN)', form_image:'Şəkil (cihazdan)', form_save:'Saxla',
    added_to_cart:'səbətə əlavə edildi', cart_cleared:'Səbət təmizləndi', checkout_msg:'Sifariş yaradıldı!', product_deleted:'Silindi', saved:'Saxlanıldı', out_of_stock:'Stokda yoxdur', add_to_cart:'Səbətə əlavə et', no_results:'Nəticə tapılmadı.', empty_catalog:'Hələ məhsul yoxdur.',
    orders_title:'Sifarişlərim', orders_empty:'Hələ sifarişiniz yoxdur.', orders_pending:'Təsdiq gözləyir', orders_ready:'QR kod hazırdır', orders_cancelled:'Ləğv edildi', orders_completed:'Tamamlandı', orders_expired:'QR kodun müddəti bitib', orders_show_qr:'QR kodu açmaq üçün toxunun', orders_pending_note:'Operator sifarişi yoxlayır. Telegram cavabından sonra QR burada görünəcək.', orders_cancel:'Sifarişi ləğv et', orders_time_left:'Qalıb', orders_expired_note:'QR kodun müddəti bitib. Dəstəyə müraciət edin.', orders_load_error:'Sifarişləri yükləmək mümkün olmadı. Yenidən cəhd edin.',
    cancel_confirm:'Sifarişi ləğv etmək istəyirsiniz? Geri ödənişi server həyata keçirir.', checkout_busy:'Sifariş hazırlanır…', checkout_success:'Sifariş yaradıldı. Operator Telegram-da cavab verdikdən sonra QR burada görünəcək.', checkout_notify_error:'Sifariş yaradıldı, lakin Telegram bildirişi göndərilmədi. Dəstəklə əlaqə saxlayın.',
    search_empty:'Nəticə tapılmadı.'
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
    const key = element.dataset.i18n;
    const value = translations[selected]?.[key] ?? translations.ru[key];
    if (value !== undefined) element.textContent = value;
  });
  $$('[data-i18n-placeholder]').forEach(element => {
    const key = element.dataset.i18nPlaceholder;
    const value = translations[selected]?.[key] ?? translations.ru[key];
    if (value !== undefined) element.placeholder = value;
  });

  // Keep dynamic UI in the selected language as well.
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

      // Never use profile.role or profile.email as the authority for admin access.
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

$('#authForm')?.addEventListener('submit', async (e) => {
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

$('#logoutBtn')?.addEventListener('click', async () => { if(S.ordersTimer)clearInterval(S.ordersTimer); await _supabase.auth.signOut(); location.reload(); });

async function load(){
  S.catalogError = null;
  const [slideResult, productResult] = await Promise.all([
    _supabase.from('slides').select('image_url,title,description'),
    _supabase.from('products').select('id,name,description,category,price,image_url')
  ]);
  if (slideResult.error) {
    console.error('Slides load failed:', slideResult.error);
    initSlider([]);
  } else {
    initSlider(slideResult.data || []);
  }
  if (productResult.error) {
    console.error('Products load failed:', productResult.error);
    S.products = [];
    S.catalogError = 'Не удалось загрузить каталог. Проверьте подключение и права доступа.';
  } else {
    S.products = Array.isArray(productResult.data) ? productResult.data : [];
  }
  renderAll();
}

const find=id=>S.products.find(p=>String(p.id)===String(id));
const live=()=>S.products.filter(p=>p.active!==false);
const isAvailable=p=>p && p.available!==false && (p.stock === undefined || p.stock === null || Number(p.stock) > 0);
const imgSrc=p=>safeImageUrl(p?.image_url || p?.image || '');

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
  const active = $('#chips button[aria-pressed="true"]');
  const slider = $('#chipsSlider');
  if (!active || !slider) return;
  slider.style.width = `${active.offsetWidth}px`;
  slider.style.transform = `translateX(${active.offsetLeft}px)`;
}

function renderAll(){
  const L=live();
  const categories=['All',...new Set([...CATS,...L.map(p=>p.category).filter(Boolean)])]
    .filter(c=>c==='All'||L.some(p=>p.category===c));
  if (!categories.includes(S.cat)) S.cat='All';
  if($('#chips')) {
    $('#chips').innerHTML='<div class="chips-slider" id="chipsSlider"></div>'+categories.map(c=>
      `<button type="button" data-act="cat" data-cat="${esc(c)}" aria-pressed="${S.cat===c}">${c==='All'?(S.lang==='en'?'All':S.lang==='az'?'Hamısı':'Все'):esc(c)}</button>`
    ).join('');
    requestAnimationFrame(updateChipsSlider);
  }
  const q=normalizeSearch(S.q);
  const list=L.filter(p=>(S.cat==='All'||p.category===S.cat)&&
    (!q||normalizeSearch([p.name,p.description,p.category].join(' ')).includes(q)));
  if($('#grid')) {
    $('#grid').innerHTML=list.length?list.map(card).join(''):
      `<div class="state"><p>${esc(S.catalogError || (L.length?tr('no_results'):tr('empty_catalog')))}</p></div>`;
  }
  renderCart();
  if($('#editor')?.open)renderAdmin();
}

const searchInput = $('#q'), suggestionsBox = $('#searchSuggestions');
searchInput?.addEventListener('input', e => {
  const val = String(e.target.value || '').trim();
  S.q = val;
  renderAll();
  if (!val) { suggestionsBox?.classList.remove('active'); return; }
  const needle = normalizeSearch(val);
  const matches = live().filter(p => normalizeSearch([p.name,p.description,p.category].join(' ')).includes(needle)).slice(0,6);
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
    el.scrollIntoView({behavior: reduce() ? 'auto' : 'smooth', block:'center'});
    el.classList.add('card-highlight');
    setTimeout(() => el.classList.remove('card-highlight'), 1200);
  }
});

document.addEventListener('click', e => {
  if (!e.target.closest('.search-container')) suggestionsBox?.classList.remove('active');
});

function toggleLangDropdown() { $('#langDropdown')?.classList.toggle('active'); }
document.querySelector('.lang-dropdown')?.addEventListener('click', e => {
  const btn = e.target.closest('button[data-lang]');
  if(btn) { applyLanguage(btn.dataset.lang); $('#langDropdown')?.classList.remove('active'); }
});

function updateThemeSlider() {
  const activeBtn = $('.seg button[aria-pressed="true"]'), slider = $('#themeSlider');
  if(activeBtn && slider) { slider.style.width = `${activeBtn.offsetWidth}px`; slider.style.transform = `translateX(${activeBtn.offsetLeft - 3}px)`; }
}
function applyTheme(){
  let t='system'; try { t=localStorage.getItem('pdd.theme')||'system'; } catch {}
  document.documentElement.dataset.theme=t==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):t;
  $$('.seg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===t));
  setTimeout(updateThemeSlider, 50);
}

const lines=()=>S.cart.map(c=>({p:find(c.id),qty:c.qty})).filter(l=>l.p);
function renderCart(){
  const L=lines(),n=L.reduce((a,l)=>a+l.qty,0),t=L.reduce((a,l)=>a+l.qty*l.p.price,0);
  if($('#badge')) $('#badge').textContent=n;
  if($('#total')) $('#total').textContent=fmt(t);
  if($('#lines')) $('#lines').innerHTML=L.length?L.map(({p,qty})=>`<li data-id="${esc(p.id)}"><img src="${esc(imgSrc(p))}"><div><strong>${esc(p.name)}</strong><small>${fmt(p.price)}</small><div class="qty"><button data-act="dec">−</button><span>${qty}</span><button data-act="inc">+</button></div></div><button class="link" data-act="rm">${translations[S.lang].cart_remove}</button></li>`).join(''):`<li style="display:block;padding:20px;text-align:center;">${translations[S.lang].cart_empty}</li>`;
  if($('#checkoutBtn')) $('#checkoutBtn').disabled=$('#clearBtn').disabled=!L.length;
}
function bump(){const b=$('#badge');if(!b)return;b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}
function setQty(id,d){
  const key=String(id),product=find(key);
  if(!product)return;
  const current=S.cart.find(x=>String(x.id)===key);
  const before=current?Number(current.qty)||0:0;
  const stockKnown=product.stock!==undefined&&product.stock!==null&&product.stock!=='';
  const cap=stockKnown?Math.max(0,Math.floor(Number(product.stock)||0)):50;
  const after=Math.max(0,Math.min(50,cap,before+d));
  if(d>0&&after===before){toast(tr('out_of_stock'));return;}
  if(after===0)S.cart=S.cart.filter(x=>String(x.id)!==key);
  else if(current)current.qty=after;
  else S.cart.push({id:key,qty:after});
  saveCart();renderCart();bump();
}

const reduce=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
function closeDlg(d){if(!d||!d.open)return; if(reduce())return d.close(); d.classList.add('closing'); d.style.pointerEvents='none'; setTimeout(()=>{d.close();d.classList.remove('closing');d.style.pointerEvents='';},250);}
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;$('#toasts')?.append(t);setTimeout(()=>{t.style.opacity='0';t.style.transform='translateY(10px)';setTimeout(()=>t.remove(),300)},2400)}

function openDetail(id){
  const p=find(id),d=$('#detail');if(!p||d?.open)return;
  if($('#detailBody')) $('#detailBody').innerHTML=`<div class="detail" data-id="${esc(p.id)}"><img src="${esc(imgSrc(p))}"><span class="tag">${esc(p.category)}</span><h2>${esc(p.name)}</h2><p>${esc(p.description)}</p><div class="card-foot"><strong>${fmt(p.price)}</strong><button class="btn btn-primary" data-act="add"${isAvailable(p)?'':' disabled'}>${isAvailable(p)?translations[S.lang].add_to_cart:translations[S.lang].out_of_stock}</button></div></div>`;
  d?.showModal();
}

let sliderTimer = null;
function initSlider(slides) {
  const container = $('#showcaseSlider');
  if (!container) return;
  if (sliderTimer) { clearInterval(sliderTimer); sliderTimer = null; }

  const validSlides = (Array.isArray(slides) ? slides : []).filter(slide =>
    slide && typeof slide.title === 'string' && typeof slide.image_url === 'string'
  );
  const source = validSlides.length ? validSlides : [{
    title: 'Добро пожаловать в Stackd',
    description: 'Подборка предложений',
    image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&auto=format&fit=crop&q=85'
  }];

  // Escape every database-controlled string and validate image URLs before insertion.
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

const blank=()=>({id:Date.now().toString(),name:'',description:'',price:0,category:'Burgers'});
function renderAdmin(){
  const q=S.adminQ.toLowerCase(),list=S.products.filter(p=>!q||(p.name+' '+p.category).toLowerCase().includes(q));
  if($('#adminCount')) $('#adminCount').textContent=`${S.products.length} шт.`;
  if($('#adminList')) $('#adminList').innerHTML=list.length?list.map(p=>`<li data-id="${esc(p.id)}" class="${p.active===false?'off':''}"><img src="${esc(imgSrc(p))}"><div class="info"><strong>${esc(p.name)}</strong><small>${esc(p.category)} · ${fmt(p.price)}</small></div><div class="acts"><button class="btn btn-ghost sm" data-act="edit">Ред.</button><button class="btn btn-ghost sm" data-act="del">Удал.</button></div></li>`).join(''):`<li>Ничего нет.</li>`;
}

let productPreviewObjectUrl = null;
function clearProductPreviewObjectUrl() {
  if (productPreviewObjectUrl) URL.revokeObjectURL(productPreviewObjectUrl);
  productPreviewObjectUrl = null;
}
function showProductPreview(src, filename='') {
  const wrap = $('#productImagePreviewWrap'), img = $('#productImagePreview'), name = $('#productImagePreviewName');
  if (!wrap || !img) return;
  if (!src) { wrap.hidden = true; img.removeAttribute('src'); if (name) name.textContent = ''; return; }
  img.src = src;
  wrap.hidden = false;
  if (name) name.textContent = filename;
}
async function validateProductImage(file) {
  if (!file) return;
  if (!Object.hasOwn(IMAGE_TYPES, file.type)) throw new Error('Поддерживаются только JPEG, PNG и WebP.');
  if (file.size <= 0 || file.size > MAX_PRODUCT_IMAGE_BYTES) throw new Error('Изображение должно быть не больше 5 МБ.');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
  const isWebp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP';
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
    await _supabase.storage.from(PRODUCT_BUCKET).remove([objectPath]).catch(()=>{});
    throw new Error('Storage не вернул публичный URL. Проверьте, что bucket product-images создан как Public.');
  }
  return { path: objectPath, url: data.publicUrl };
}
function getProductStoragePath(url) {
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${PRODUCT_BUCKET}/`;
    const index = parsed.pathname.indexOf(marker);
    return index >= 0 ? decodeURIComponent(parsed.pathname.slice(index + marker.length)) : null;
  } catch { return null; }
}

const F=()=>$('#pform')?.elements;
function setDraft(p){
  clearProductPreviewObjectUrl();
  S.draft=p?{...p}:blank();
  const f=F(),d=S.draft;
  if(!f) return;
  f.pn.value=d.name || '';
  f.pd.value=d.description || '';
  f.pc.value=d.category || 'Burgers';
  f.pp.value=d.price ?? '';
  f.pf.value='';
  showProductPreview(d.image_url || d.image ? imgSrc(d) : '', d.image_url || d.image ? 'Текущее изображение' : '');
  if($('#formMsg')) $('#formMsg').textContent='';
  if($('#formTitle')) $('#formTitle').textContent=p?tr('form_edit'):tr('form_new');
}
function readForm(){
  const f=F();
  if(!f || !S.draft) throw new Error('Форма товара недоступна.');
  const price = Number(f.pp.value);
  const name = f.pn.value.trim(), category = f.pc.value.trim();
  if (!name || !category) throw new Error('Заполните название и категорию.');
  if (!Number.isFinite(price) || price < 0 || price > 100000 || Math.round(price * 100) !== price * 100) throw new Error('Укажите цену от 0 до 100 000 AZN с точностью до 2 знаков.');
  Object.assign(S.draft,{name,description:f.pd.value.trim(),category,price});
}

$('#pf')?.addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    await validateProductImage(file);
    clearProductPreviewObjectUrl();
    productPreviewObjectUrl = URL.createObjectURL(file);
    showProductPreview(productPreviewObjectUrl, `${file.name} · ${(file.size/1024/1024).toFixed(2)} МБ`);
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
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.admin-tabs .btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    e.target.classList.add('active');
    const tab = $(`#tab-${e.target.dataset.tab}`); if(tab) tab.style.display = 'block';
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


// Заказы. QR хранится в приватном bucket order-qrs и подписывается только для владельца.
function statusText(status) {
  return tr(({pending:'orders_pending',ready:'orders_ready',cancelled:'orders_cancelled',completed:'orders_completed'})[status] || 'orders_pending');
}
function remainingText(expiry) {
  const ms = new Date(expiry).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return tr('orders_expired');
  const seconds = Math.floor(ms / 1000);
  return `${tr('orders_time_left')}: ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2,'0')}`;
}
async function resolveOrderQr(order) {
  const raw = String(order.qr_code_url || '');
  if (!raw) return '';
  if (/^https:\/\//i.test(raw)) return safeImageUrl(raw);
  const ownerPrefix = `${S.user.id}/`;
  if (!raw.startsWith(ownerPrefix)) {
    // Legacy QR files were uploaded to the public product-images bucket.
    return _supabase.storage.from('product-images').getPublicUrl(raw).data.publicUrl || '';
  }
  const expiresAt = order.qr_expires_at ? new Date(order.qr_expires_at).getTime() : Date.now() + 30 * 60 * 1000;
  const remaining = Math.max(60, Math.floor((expiresAt - Date.now()) / 1000));
  if (remaining <= 0) return '';
  const cacheKey = `${raw}:${order.qr_expires_at || ''}`;
  const cached = S.qrCache.get(cacheKey);
  if (cached && cached.until > Date.now()) return cached.url;
  const ttl = Math.min(1800, remaining);
  const { data, error } = await _supabase.storage.from('order-qrs').createSignedUrl(raw, ttl);
  if (error) throw error;
  const url = data?.signedUrl || '';
  if (url) S.qrCache.set(cacheKey, {url, until:Date.now()+Math.min(ttl*1000-30000, 10*60*1000)});
  return url;
}
async function renderOrders(rows) {
  const host=$('#ordersList');
  if(!host) return;
  if(!rows.length){host.innerHTML=`<div class="orders-empty">${esc(tr('orders_empty'))}</div>`;return;}
  const cards=await Promise.all(rows.map(async order=>{
    const id=String(order.id || '');
    const shortId=esc(id.slice(0,8).toUpperCase());
    const status=String(order.status || 'pending');
    const created=order.created_at ? new Date(order.created_at) : null;
    const createdText=created && !Number.isNaN(created.getTime()) ? created.toLocaleString(S.lang==='az'?'az-AZ':S.lang==='en'?'en-US':'ru-RU',{dateStyle:'medium',timeStyle:'short'}) : '';
    const expiry=order.qr_expires_at ? new Date(order.qr_expires_at).getTime() : 0;
    const qrIsExpired=Boolean(order.qr_code_url && expiry && expiry<=Date.now());
    const qrIsReady=Boolean(order.qr_code_url) && status==='ready' && !qrIsExpired;
    const canCancel=status==='pending' && created && !Number.isNaN(created.getTime()) && Date.now()-created.getTime()<120000;
    const itemCount=Array.isArray(order.items) ? order.items.reduce((sum,item)=>sum+Math.max(0,Number(item.qty)||0),0) : 0;
    let qr='';
    if(qrIsReady){
      try { qr=await resolveOrderQr(order); }
      catch(error){ console.error('QR signed URL failed:',error); }
    }
    let body='';
    if(qrIsReady && qr){
      body=`<button type="button" class="order-qr-toggle" data-act="toggle-qr" aria-expanded="false">
        <span class="order-qr-hint">${esc(tr('orders_show_qr'))}</span>
        <img class="order-qr-image" src="${esc(qr)}" alt="QR ${shortId}" loading="lazy">
      </button><div class="order-qr-expiry" data-expiry="${esc(order.qr_expires_at || '')}">${esc(order.qr_expires_at ? remainingText(order.qr_expires_at) : '')}</div>`;
    } else if(qrIsExpired){
      body=`<p class="order-note order-note-expired">${esc(tr('orders_expired_note'))}</p>`;
    } else if(status==='pending'){
      body=`<p class="order-note">${esc(tr('orders_pending_note'))}</p>
        ${canCancel?`<button type="button" class="btn btn-ghost sm order-cancel" data-act="cancel-order" data-id="${esc(id)}">${esc(tr('orders_cancel'))}</button>`:''}`;
    } else {
      body=`<p class="order-note">${esc(statusText(status))}</p>`;
    }
    return `<article class="order-card" data-order="${esc(id)}">
      <div class="order-card-head"><div><strong>№ ${shortId}</strong>${createdText?`<small>${esc(createdText)}</small>`:''}</div>
      <span class="order-status order-status-${esc(status)}">${esc(statusText(status))}</span></div>
      <div class="order-card-meta"><span>${itemCount?`${itemCount} ${S.lang==='en'?'items':S.lang==='az'?'ədəd':'поз.'}`:''}</span><strong>${fmt(order.total)}</strong></div>
      ${body}</article>`;
  }));
  host.innerHTML=cards.join('');
}
async function loadOrders() {
  if(!S.user || S.ordersBusy) return;
  S.ordersBusy=true;
  const host=$('#ordersList');
  try{
    const {data,error}=await _supabase.from('orders')
      .select('id,user_id,total,items,status,created_at,qr_code_url,qr_expires_at')
      .eq('user_id',S.user.id).order('created_at',{ascending:false}).limit(50);
    if(error) throw error;
    await renderOrders(Array.isArray(data)?data:[]);
  }catch(error){
    console.error('Orders load failed:',error);
    if(host)host.innerHTML=`<p class="orders-error">${esc(tr('orders_load_error'))} ${esc(error.message||'')}</p>`;
  }finally{S.ordersBusy=false;}
}
function openOrders() {
  if(!S.user){$('#auth')?.showModal();return;}
  const dialog=$('#orders');
  if(!dialog)return;
  if(!dialog.open)dialog.showModal();
  if(S.ordersTimer)clearInterval(S.ordersTimer);
  loadOrders();
  S.ordersTimer=setInterval(()=>{
    if(!dialog.open){clearInterval(S.ordersTimer);S.ordersTimer=null;return;}
    loadOrders();
  },4000);
}
$('#orders')?.addEventListener('close',()=>{
  if(S.ordersTimer)clearInterval(S.ordersTimer);
  S.ordersTimer=null;
});
async function cancelOrder(id) {
  if(!S.user || !id)return;
  if(!confirm(tr('cancel_confirm')))return;
  try{
    const {error}=await _supabase.rpc('cancel_order',{order_uuid:id});
    if(error)throw error;
    const {data:profile,error:profileError}=await _supabase.from('profiles').select('id,balance').eq('id',S.user.id).maybeSingle();
    if(!profileError){S.profile=profile||null;if($('#userBalance'))$('#userBalance').textContent=Number(profile?.balance||0).toFixed(2);}
    toast(tr('orders_cancelled'));
    await loadOrders();
  }catch(error){console.error('Cancel order failed:',error);toast('Не удалось отменить заказ: '+(error.message||''));}
}
async function checkout() {
  if(!S.user){$('#auth')?.showModal();return;}
  if(S.checkoutBusy)return;
  if(!lines().length){toast(tr('cart_empty'));return;}
  const button=$('#checkoutBtn');
  const oldText=button?.textContent || tr('cart_checkout');
  S.checkoutBusy=true;
  if(button){button.disabled=true;button.textContent=tr('checkout_busy');}
  try{
    const {data,error}=await _supabase.rpc('checkout_order',{
      cart_items:S.cart.map(item=>({id:item.id,qty:item.qty}))
    });
    if(error)throw error;
    const orderId=typeof data==='string'?data:(data?.id||data?.order_id||data?.orderId||data?.[0]?.id);
    if(!orderId)throw new Error('checkout_order не вернул ID заказа.');
    S.cart=[];saveCart();renderCart();closeDlg($('#drawer'));
    let telegramOk=false;
    try{
      const {data:notifyData,error:notifyError}=await _supabase.functions.invoke('notify-telegram',{body:{orderId}});
      telegramOk=!notifyError && notifyData?.ok===true;
      if(notifyError)console.error('notify-telegram failed:',notifyError);
      if(notifyData && notifyData.ok===false)console.error('notify-telegram failed:',notifyData);
    }catch(error){console.error('notify-telegram invocation failed:',error);}
    openOrders();
    toast(telegramOk?tr('checkout_success'):tr('checkout_notify_error'));
    await loadOrders();
  }catch(error){
    console.error('Checkout failed:',error);
    toast('Не удалось оформить заказ: '+(error.message||'ошибка сервера'));
  }finally{
    S.checkoutBusy=false;
    if(button){button.disabled=false;button.textContent=oldText;}
    renderCart();
  }
}

const A={
  add:id=>{const p=find(id);if(p&&isAvailable(p)){setQty(id,1);toast(p.name+' '+translations[S.lang].added_to_cart)}},
  inc:id=>setQty(id,1),dec:id=>setQty(id,-1),
  rm:id=>{S.cart=S.cart.filter(c=>c.id!==id);saveCart();renderCart();bump()},
  clear:()=>{S.cart=[];saveCart();renderCart();toast(translations[S.lang].cart_cleared)},
  checkout,
  orders:openOrders,
  'toggle-qr':(_,button)=>{const card=button.closest('.order-card');if(!card)return;const open=card.classList.toggle('qr-open');button.setAttribute('aria-expanded',String(open));},
  'cancel-order':id=>cancelOrder(id),
  detail:openDetail,
  reload:()=>load(),
  'cart-open':()=>{const d=$('#drawer');if(!d.open)d.showModal()},
  manage:()=>{if(!isAdmin()){toast('Доступ только владельцу проекта.');return;}const d=$('#editor');if(!d.open){d.showModal();setDraft(null)}renderAdmin()},
  auth:()=>{const d=$('#auth');if(!d.open)d.showModal()},
  'toggle-lang':toggleLangDropdown,
  close:(_,b)=>closeDlg(b.closest('dialog')),
  cat:(_,b)=>{S.cat=b.dataset.cat;renderAll()},
  theme:(_,b)=>{try{localStorage.setItem('pdd.theme',b.dataset.v)}catch{}applyTheme()},
  new:()=>{if(!isAdmin()){toast('Недостаточно прав.');return;}setDraft(null)},edit:id=>{if(!isAdmin()){toast('Недостаточно прав.');return;}setDraft(find(id))},
  del:async id=>{
    const p=find(id);
    if (!p || !isAdmin()) { toast('Недостаточно прав.'); return; }
    if(!window.confirm(`Удалить "${p.name}"?`)) return;
    const { error } = await _supabase.from('products').delete().eq('id', id);
    if (error) { console.error('Product delete failed:', error); toast('Не удалось удалить товар: ' + error.message); return; }
    const storedImagePath = getProductStoragePath(p.image_url || p.image || '');
    if (storedImagePath) { const cleanup = await _supabase.storage.from(PRODUCT_BUCKET).remove([storedImagePath]); if (cleanup.error) console.warn('Deleted product image cleanup failed:', cleanup.error); }
    S.products=S.products.filter(x=>String(x.id)!==String(id));
    S.cart=S.cart.filter(c=>String(c.id)!==String(id)); saveCart();
    if(S.draft && String(S.draft.id)===String(id)) setDraft(null);
    renderAll(); toast('Товар удалён.');
  }
};

document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');
  if(!b){if(e.target.matches('dialog'))closeDlg(e.target);return}
  A[b.dataset.act]?.(b.closest('[data-id]')?.dataset.id,b);
});

$('#searchForm')?.addEventListener('submit',e=>{e.preventDefault();suggestionsBox?.classList.remove('active');$('#catalog')?.scrollIntoView({behavior:reduce()?'auto':'smooth',block:'start'});});
$('#adminSearch')?.addEventListener('input',e=>{S.adminQ=e.target.value.trim();renderAdmin()});

$('#balanceBtn')?.addEventListener('click', () => $('#topup')?.showModal());
$('#topupBtn')?.addEventListener('click', () => $('#topup')?.showModal());

// ИСПРАВЛЕННАЯ ЗАГРУЗКА ТОВАРА
$('#pform')?.addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('#formMsg');
  let uploadedPath = null;
  let previousImageUrl = S.draft?.image_url || S.draft?.image || '';
  try {
    if (!isAdmin()) throw new Error('Только владелец может управлять товарами.');
    readForm();
    const d = S.draft;
    const file = $('#pf')?.files?.[0];
    if (file) await validateProductImage(file);
    if (msg) { msg.textContent = 'Сохранение…'; msg.style.color = 'var(--muted)'; }

    let imageUrl = d.image_url || d.image || '';
    if (file) {
      const uploaded = await uploadProductImage(file);
      uploadedPath = uploaded.path;
      imageUrl = uploaded.url;
    }

    const payload = { name:d.name, description:d.description, category:d.category, price:d.price, image_url:imageUrl };
    const exists = S.products.some(p => String(p.id) === String(d.id));
    const result = exists
      ? await _supabase.from('products').update(payload).eq('id', d.id).select('id,name,description,category,price,image_url').maybeSingle()
      : await _supabase.from('products').insert(payload).select('id,name,description,category,price,image_url').single();
    if (result.error) throw result.error;
    if (!result.data) throw new Error('База данных не вернула сохранённый товар.');
