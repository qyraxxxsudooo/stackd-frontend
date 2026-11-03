const SUPABASE_URL = 'https://wjlkztgmbqaflcdldapi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DpbANPkD124VOGD3JkS7AA_pd2n_Ong'; // Publishable key: safe for browser use only when RLS is correctly configured.
const ADMIN_EMAIL = 'REPLACE_WITH_ADMIN_EMAIL';
const PRODUCT_BUCKET = 'product-images';
const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = Object.freeze({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' });

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>(Number(n)||0).toFixed(2)+' AZN',PH='assets/icons/placeholder.svg',CATS=['Burgers','Sides','Drinks','Desserts'];
const S={products:[],cart:[],cat:'All',q:'',adminQ:'',user:null,profile:null,draft:null,lang:'ru',catalogError:null,ordersTimer:null,checkoutBusy:false,ordersBusy:false};

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
    search_placeholder: 'Поиск в Stackd', theme_light: 'Светлая', theme_dark: 'Темная', theme_system: 'Авто',
    login_btn: 'Войти', logout_btn: 'Выйти', catalog_btn: 'Каталог', menu_title: 'Меню', balance_label: 'Баланс',
    footer_desc: 'Лучшие предложения на еду в Баку.', footer_support: 'Поддержка', footer_about: 'О проекте', footer_about_text: 'Данные хранятся в облаке Supabase.',
    cart_title: 'Корзина', cart_total: 'Итого', cart_checkout: 'Оформить заказ', cart_clear: 'Очистить', cart_empty: 'Корзина пуста', cart_remove: 'Удалить',
    auth_title: 'Добро пожаловать', auth_sub: 'Войдите или создайте аккаунт', auth_google: 'Продолжить с Google', auth_or: 'или', auth_login_btn: 'Войти', auth_register_btn: 'Регистрация',
    topup_title: 'Пополнение', topup_card_warn: 'Отправка заявки не означает автоматическое зачисление. Поступление средств проверяется отдельно.', topup_amount: 'Сумма (AZN)', topup_check: 'Скриншот чека', topup_btn: 'Отправить чек',
    copy_btn: 'Копировать', topup_terms: 'Я подтверждаю, что данные заявки верны. Зачисление выполняется только после проверки платежа.',
    admin_title: 'Управление', admin_tab_products: 'Товары', admin_tab_settings: 'Настройки сайта', admin_products: 'Товары', admin_add: 'Добавить', admin_search: 'Поиск товаров',
    settings_title: 'Настройки главной страницы', settings_hero_title: 'Заголовок на главной', settings_hero_sub: 'Подзаголовок / Описание', settings_save: 'Сохранить настройки',
    form_new: 'Новый товар', form_edit: 'Редактировать', form_name: 'Название', form_desc: 'Описание', form_cat: 'Категория', form_price: 'Цена (AZN)', form_image: 'Картинка (с ПК)', form_save: 'Сохранить',
    added_to_cart: 'добавлен в корзину', cart_cleared: 'Корзина очищена', checkout_msg: 'Заказ создан!', product_deleted: 'Удалено', saved: 'Сохранено', out_of_stock: 'Нет в наличии', add_to_cart: 'В корзину', no_results: 'Ничего не найдено.', empty_catalog: 'Товаров пока нет.'
  },
  en: { /* ... */ },
  az: { /* ... */ }
};

function applyLanguage(lang) {
  S.lang = lang;
  localStorage.setItem('pdd.lang', lang);
  document.documentElement.lang = lang;
  if($('#currentLangLabel')) $('#currentLangLabel').textContent = lang.toUpperCase();
  
  $$('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if(translations[lang] && translations[lang][key]) el.textContent = translations[lang][key];
  });
  
  $$('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if(translations[lang] && translations[lang][key]) el.placeholder = translations[lang][key];
  });
  renderAll();
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
      if (adminBtn) adminBtn.style.display = isAdmin() ? 'block' : 'none';
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

$('#logoutBtn')?.addEventListener('click', async () => { await _supabase.auth.signOut(); location.reload(); });

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
const isAvailable=p=>p.available!==false;
const imgSrc=p=>safeImageUrl(p?.image_url || p?.image || '');

function renderAll(){
  const L=live();
  if($('#chips')) $('#chips').innerHTML=['All',...new Set([...CATS,...L.map(p=>p.category)])].filter(c=>c==='All'||L.some(p=>p.category===c)).map(c=>`<button data-act="cat" data-cat="${esc(c)}" aria-pressed="${S.cat===c}">${esc(c)}</button>`).join('');
  const q=S.q.toLowerCase(),list=L.filter(p=>(S.cat==='All'||p.category===S.cat)&&(!q||(p.name+' '+p.description).toLowerCase().includes(q)));
  if($('#grid')) $('#grid').innerHTML = list.length?list.map(card).join(''):`<div class="state"><p>${L.length?translations[S.lang].no_results:translations[S.lang].empty_catalog}</p></div>`;
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
  const matches = live().filter(p => normalizeSearch([p.name,p.description,p.category].join(' ')).includes(needle)).slice(0,5);
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
  const t=localStorage.getItem('pdd.theme')||'system';
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
function setQty(id,d){const key=String(id),c=S.cart.find(x=>String(x.id)===key);if(c){c.qty=Math.min(50,Math.max(0,Number(c.qty||0)+d));if(c.qty<=0)S.cart=S.cart.filter(x=>x!==c)}else if(d>0)S.cart.push({id:key,qty:1});saveCart();renderCart();bump()}

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
  if($('#formTitle')) $('#formTitle').textContent=p?'Редактировать':'Новый товар';
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


// Заказы и получение QR от Telegram-оператора.
// notify-telegram отправляет карточку заказа в Telegram.
// telegram-webhook должен сохранить QR администратора в orders.qr_code_url.
function orderStatusLabel(status) {
  return ({
    pending: 'Ожидает подтверждения',
    ready: 'QR-код готов',
    cancelled: 'Отменён',
    completed: 'Выполнен'
  })[status] || 'В обработке';
}

function orderTimeLeft(expiresAt) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (!Number.isFinite(diff) || diff <= 0) return 'Срок действия QR-кода истёк';
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `QR действует ещё ${mins}:${String(secs).padStart(2, '0')}`;
}

function renderOrders(orders) {
  const host = $('#ordersList');
  if (!host) return;
  if (!orders.length) {
    host.innerHTML = '<div class="orders-empty">У вас пока нет заказов.</div>';
    return;
  }

  host.innerHTML = orders.map(order => {
    const id = String(order.id || '');
    const shortId = esc(id.slice(0, 8).toUpperCase());
    const status = String(order.status || 'pending');
    const createdAt = order.created_at ? new Date(order.created_at) : null;
    const createdLabel = createdAt && !Number.isNaN(createdAt.getTime())
      ? createdAt.toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }) : '';
    const expiry = order.qr_expires_at ? new Date(order.qr_expires_at).getTime() : 0;
    const qrActive = Boolean(order.qr_code_url) && status === 'ready' && expiry > Date.now();
    const canCancel = status === 'pending' && createdAt &&
      !Number.isNaN(createdAt.getTime()) && Date.now() - createdAt.getTime() < 120000;
    const count = Array.isArray(order.items)
      ? order.items.reduce((sum, item) => sum + Math.max(0, Number(item.qty) || 0), 0) : 0;

    let content;
    if (qrActive) {
      content = `
        <button type="button" class="order-qr-toggle" data-act="toggle-qr" data-id="${esc(id)}" aria-expanded="false">
          <span class="order-qr-hint">Нажмите, чтобы открыть QR-код</span>
          <img class="order-qr-image" src="${esc(safeImageUrl(order.qr_code_url))}" alt="QR-код заказа ${shortId}" loading="lazy">
        </button>
        <div class="order-qr-expiry">${esc(orderTimeLeft(order.qr_expires_at))}</div>`;
    } else if (order.qr_code_url && expiry && expiry <= Date.now()) {
      content = '<p class="order-note order-note-expired">Срок действия QR-кода истёк. Обратитесь в поддержку.</p>';
    } else if (status === 'pending') {
      content = `<p class="order-note">Оператор проверяет заказ. QR-код появится здесь после ответа в Telegram.</p>
        ${canCancel ? `<button type="button" class="btn btn-ghost sm order-cancel" data-act="cancel-order" data-id="${esc(id)}">Отменить заказ</button>` : ''}`;
    } else if (status === 'cancelled') {
      content = '<p class="order-note">Заказ отменён.</p>';
    } else if (status === 'completed') {
      content = '<p class="order-note">Заказ выполнен.</p>';
    } else {
      content = '<p class="order-note">Ожидаем обновления статуса заказа.</p>';
    }

    return `<article class="order-card" data-order="${esc(id)}">
      <div class="order-card-head">
        <div><strong>Заказ #${shortId}</strong>${createdLabel ? `<small>${esc(createdLabel)}</small>` : ''}</div>
        <span class="order-status order-status-${esc(status)}">${esc(orderStatusLabel(status))}</span>
      </div>
      <div class="order-card-meta"><span>${count ? `${count} поз.` : 'Цифровой заказ'}</span><strong>${fmt(order.total)}</strong></div>
      ${content}
    </article>`;
  }).join('');
}

async function loadOrders() {
  if (!S.user || S.ordersBusy) return;
  S.ordersBusy = true;
  const host = $('#ordersList');
  try {
    const { data, error } = await _supabase.from('orders').select('*')
      .eq('user_id', S.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    renderOrders(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Orders load failed:', error);
    if (host) host.innerHTML = '<p class="orders-error">Не удалось загрузить заказы. Попробуйте обновить список.</p>';
  } finally {
    S.ordersBusy = false;
  }
}

function openOrders() {
  if (!S.user) { $('#auth')?.showModal(); return; }
  const dialog = $('#orders');
  if (!dialog) return;
  if (!dialog.open) dialog.showModal();
  if (S.ordersTimer) clearInterval(S.ordersTimer);
  loadOrders();
  // QR появляется автоматически после того, как Telegram webhook обновит запись заказа.
  S.ordersTimer = setInterval(() => {
    if (!dialog.open) {
      clearInterval(S.ordersTimer);
      S.ordersTimer = null;
      return;
    }
    loadOrders();
  }, 5000);
}

$('#orders')?.addEventListener('close', () => {
  if (S.ordersTimer) clearInterval(S.ordersTimer);
  S.ordersTimer = null;
});

async function cancelOrder(orderId) {
  if (!S.user || !orderId) return;
  if (!window.confirm('Отменить заказ? Возврат средств выполняется сервером.')) return;
  try {
    const { error } = await _supabase.rpc('cancel_order', { order_uuid: orderId });
    if (error) throw error;
    toast('Заказ отменён. Баланс обновлён.');
    const { data, error: profileError } = await _supabase.from('profiles')
      .select('id,balance').eq('id', S.user.id).maybeSingle();
    if (!profileError) {
      S.profile = data || null;
      if ($('#userBalance')) $('#userBalance').textContent = Number(data?.balance || 0).toFixed(2);
    }
    await loadOrders();
  } catch (error) {
    console.error('Order cancellation failed:', error);
    toast('Не удалось отменить заказ: ' + (error.message || 'ошибка сервера'));
  }
}

const A={
  add:id=>{const p=find(id);if(p&&isAvailable(p)){setQty(id,1);toast(p.name+' '+translations[S.lang].added_to_cart)}},
  inc:id=>setQty(id,1),dec:id=>setQty(id,-1),
  rm:id=>{S.cart=S.cart.filter(c=>c.id!==id);saveCart();renderCart();bump()},
  clear:()=>{S.cart=[];saveCart();renderCart();toast(translations[S.lang].cart_cleared)},
  checkout:async()=>{
    if(!S.user) return $('#auth').showModal();
    if(S.checkoutBusy) return;
    if(!lines().length) return toast('Корзина пуста.');
    const button=$('#checkoutBtn');
    const oldText=button?.textContent || 'Оформить заказ';
    S.checkoutBusy=true;
    if(button){button.disabled=true;button.textContent='Оформляем заказ…';}
    try {
      // Списание баланса и создание заказа выполняются атомарно серверной RPC.
      const { data, error } = await _supabase.rpc('checkout_order', {
        cart_items:S.cart.map(item=>({id:item.id,qty:item.qty}))
      });
      if(error) throw error;
      const orderId = typeof data === 'string' ? data :
        (data?.id || data?.order_id || data?.orderId || data?.[0]?.id);
      if(!orderId) throw new Error('Сервер не вернул ID заказа. Проверьте RPC checkout_order.');

      // Заказ уже создан — сбрасываем корзину. Ошибка Telegram не отменяет заказ.
      S.cart=[]; saveCart(); renderCart(); closeDlg($('#drawer'));
      let telegramSent=true;
      try {
        const { data: notifyData, error: notifyError } = await _supabase.functions.invoke('notify-telegram', {
          body:{orderId}
        });
        if(notifyError || notifyData?.ok===false) {
          telegramSent=false;
          console.error('Telegram order notification failed:', notifyError || notifyData);
        }
      } catch(error) {
        telegramSent=false;
        console.error('Telegram order notification failed:', error);
      }

      openOrders();
      toast(telegramSent
        ? 'Заказ создан. QR-код появится здесь после ответа оператора в Telegram.'
        : 'Заказ создан, но Telegram не получил уведомление. Обратитесь в поддержку.');
      await loadOrders();
    } catch(error) {
      console.error('Checkout failed:', error);
      toast('Не удалось оформить заказ: ' + (error.message || 'ошибка сервера'));
    } finally {
      S.checkoutBusy=false;
      if(button){button.disabled=false;button.textContent=oldText;}
      renderCart();
    }
  },
  orders:openOrders,
  'toggle-qr':(id,button)=>{
    const card=button.closest('.order-card');
    if(!card)return;
    const opened=card.classList.toggle('qr-open');
    button.setAttribute('aria-expanded',String(opened));
  },
  'cancel-order':id=>cancelOrder(id),
  detail:openDetail,
  reload:()=>load(),
  'cart-open':()=>{const d=$('#drawer');if(!d.open)d.showModal()},
  manage:()=>{if(!isAdmin()){toast('Доступ только владельцу проекта.');return;}const d=$('#editor');if(!d.open){d.showModal();setDraft(null)}renderAdmin()},
  auth:()=>{const d=$('#auth');if(!d.open)d.showModal()},
  'toggle-lang':toggleLangDropdown,
  close:(_,b)=>closeDlg(b.closest('dialog')),
  cat:(_,b)=>{S.cat=b.dataset.cat;renderAll()},
  theme:(_,b)=>{localStorage.setItem('pdd.theme',b.dataset.v);applyTheme()},
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

$('#searchForm')?.addEventListener('submit',e=>e.preventDefault());
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

    // Delete the previous image only after the product row was saved successfully.
    const oldPath = getProductStoragePath(previousImageUrl);
    if (oldPath && oldPath !== getProductStoragePath(imageUrl)) {
      const { error: removeError } = await _supabase.storage.from(PRODUCT_BUCKET).remove([oldPath]);
      if (removeError) console.warn('Old product image cleanup failed:', removeError);
    }

    await load();
    clearProductPreviewObjectUrl();
    setDraft(null);
    if (msg) { msg.textContent = 'Товар сохранён.'; msg.style.color = 'var(--success, #287a46)'; }
    toast(translations[S.lang].saved);
  } catch (error) {
    console.error('Product save failed:', error);
    // Remove an uploaded orphan if the database write failed.
    if (uploadedPath) {
      const { error: cleanupError } = await _supabase.storage.from(PRODUCT_BUCKET).remove([uploadedPath]);
      if (cleanupError) console.warn('Orphan image cleanup failed:', cleanupError);
    }
    if (msg) { msg.textContent = 'Ошибка сохранения: ' + (error.message || 'неизвестная ошибка'); msg.style.color = 'var(--danger, #b42318)'; }
  }
});

$('#topupForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('#topupMsg');
  const button = $('#topupForm button[type="submit"]');
  try {
    if (!S.user) throw new Error('Сначала войдите в аккаунт.');
    if (!$('#termsCheck')?.checked) throw new Error('Подтвердите условия отправки заявки.');
    const token = document.querySelector('[name="cf-turnstile-response"]')?.value || '';
    const file = $('#topupFile')?.files?.[0];
    const amount = Number($('#topupAmount')?.value);
    if (!Number.isFinite(amount) || amount < 1 || amount > 100) throw new Error('Сумма должна быть от 1 до 100 AZN.');
    if (!file) throw new Error('Выберите изображение подтверждения платежа.');
    await validateProductImage(file);
    if (!token) throw new Error('Пройдите проверку Turnstile.');

    if (msg) { msg.textContent = 'Отправка защищённой заявки…'; msg.style.color = 'var(--muted)'; }
    if (button) button.disabled = true;
    const body = new FormData();
    body.append('amount', String(amount));
    body.append('file', file, file.name);
    body.append('turnstileToken', token);
    body.append('requestId', crypto.randomUUID());
    const { data, error } = await _supabase.functions.invoke('submit-topup', { body });
    if (error) throw error;
    if (!data?.ok) throw new Error(data?.message || 'Сервер не подтвердил заявку.');
    if (msg) { msg.textContent = 'Заявка отправлена на проверку. Баланс изменится только после подтверждения поступления денег.'; msg.style.color = 'var(--success, #287a46)'; }
    $('#topupForm').reset();
    if (window.turnstile) window.turnstile.reset();
  } catch (error) {
    console.error('Top-up submission failed:', error);
    if (msg) { msg.textContent = error.message || 'Не удалось отправить заявку.'; msg.style.color = 'var(--danger, #b42318)'; }
  } finally {
    if (button) button.disabled = false;
  }
});

if($('#categoryOptions')) $('#categoryOptions').innerHTML=CATS.map(c=>`<option value="${c}">`).join('');
applyTheme();
applyLanguage(localStorage.getItem('pdd.lang') || 'ru');
checkAuth().catch(error => { console.error('App initialization failed:', error); toast('Не удалось инициализировать приложение.'); });
