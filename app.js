const SUPABASE_URL = 'https://wjlkztgmbqaflcdldapi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DpbANPkD124VOGD3JkS7AA_pd2n_Ong';
const ADMIN_EMAIL = 'yuska20102010@gmail.com'; // ТВОЙ EMAIL
const PRODUCT_BUCKET = 'product-images';
const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>(Number(n)||0).toFixed(2)+' AZN',PH='assets/icons/placeholder.svg',CATS=['Burgers','Sides','Drinks','Desserts'];
const S={products:[],cart:[],cat:'All',q:'',adminQ:'',user:null,profile:null,draft:null,lang:'ru',catalogError:null};

try {
  const cached = JSON.parse(localStorage.getItem('pdd.cart') || '[]');
  S.cart = Array.isArray(cached) ? cached.filter(x => x && (typeof x.id === 'string' || typeof x.id === 'number') && Number.isInteger(Number(x.qty)) && Number(x.qty) > 0).map(x => ({ id: String(x.id), qty: Number(x.qty) })) : [];
} catch { S.cart = []; }
const saveCart=()=>{ try { localStorage.setItem('pdd.cart',JSON.stringify(S.cart)); } catch (e) {} };
const isAdmin=()=>String(S.user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
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
    topup_title: 'Пополнение', topup_amount: 'Сумма (AZN)', topup_check: 'Скриншот чека', topup_btn: 'Отправить чек',
    admin_title: 'Управление', admin_tab_products: 'Товары', admin_tab_settings: 'Настройки сайта', admin_products: 'Товары', admin_add: 'Добавить', admin_search: 'Поиск товаров',
    settings_title: 'Настройки главной страницы', settings_hero_title: 'Заголовок на главной', settings_hero_sub: 'Подзаголовок / Описание', settings_save: 'Сохранить настройки',
    form_new: 'Новый товар', form_edit: 'Редактировать', form_name: 'Название', form_desc: 'Описание', form_cat: 'Категория', form_price: 'Цена (AZN)', form_image: 'Картинка (с ПК)', form_save: 'Сохранить',
    added_to_cart: 'добавлен в корзину', cart_cleared: 'Корзина очищена', checkout_msg: 'Заказ создан!', product_deleted: 'Удалено', saved: 'Сохранено', out_of_stock: 'Нет в наличии', add_to_cart: 'В корзину', no_results: 'Ничего не найдено.', empty_catalog: 'Товаров пока нет.'
  }
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
    const { data: { session } } = await _supabase.auth.getSession();
    S.user = session?.user || null;
    S.profile = null;

    const loginBtn = $('#loginBtn'), userProfile = $('#userProfile'), adminBtn = $('#adminBtn');
    if (S.user) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (userProfile) userProfile.style.display = 'flex';
      if (adminBtn) adminBtn.style.display = isAdmin() ? 'block' : 'none';
      const avatarUrl = S.user.user_metadata?.avatar_url || S.user.user_metadata?.picture;
      if ($('#userAvatar')) $('#userAvatar').src = safeImageUrl(avatarUrl);

      const { data } = await _supabase.from('profiles').select('id,balance').eq('id', S.user.id).maybeSingle();
      S.profile = data || null;
      if ($('#userBalance')) $('#userBalance').textContent = Number(data?.balance || 0).toFixed(2);
    } else {
      if (loginBtn) loginBtn.style.display = 'block';
      if (userProfile) userProfile.style.display = 'none';
      if (adminBtn) adminBtn.style.display = 'none';
      if ($('#userBalance')) $('#userBalance').textContent = '0.00';
    }
  } catch (error) {
    console.error('Auth error:', error);
  }
  await Promise.allSettled([load(), loadSettings()]);
}

async function loadSettings() {
  const { data } = await _supabase.from('site_settings').select('key,value');
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
  if (error) return $('#authMsg').textContent = 'Ошибка: ' + error.message;
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
    if (!data.session) { $('#authMsg').textContent = 'Проверьте почту и подтвердите адрес.'; return; }
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
    _supabase.from('products').select('*')
  ]);
  if (!slideResult.error) initSlider(slideResult.data || []);
  if (productResult.error) {
    S.products = [];
    S.catalogError = 'Ошибка загрузки каталога.';
  } else {
    S.products = Array.isArray(productResult.data) ? productResult.data : [];
  }
  renderAll();
}

const find=id=>S.products.find(p=>String(p.id)===String(id));
const live=()=>S.products.filter(p=>p.active!==false);
const isAvailable=p=>p.available!==false;
const imgSrc=p=>safeImageUrl(p?.image_url || p?.image || '');

const card=p=>`<article class="card" data-id="${esc(p.id)}"><button class="card-media" data-act="detail"><img src="${esc(imgSrc(p))}" alt="${esc(p.name)}" loading="lazy" onerror="this.src='${PH}'"></button><div class="card-body"><span class="tag">${esc(p.category)}</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><div class="card-foot"><strong>${fmt(p.price)}</strong><button class="btn btn-primary sm" data-act="add">В корзину</button></div></div></article>`;

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
    el.scrollIntoView({behavior: 'smooth', block:'center'});
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
  if($('#lines')) $('#lines').innerHTML=L.length?L.map(({p,qty})=>`<li data-id="${esc(p.id)}"><img src="${esc(imgSrc(p))}"><div><strong>${esc(p.name)}</strong><small>${fmt(p.price)}</small><div class="qty"><button data-act="dec">−</button><span>${qty}</span><button data-act="inc">+</button></div></div><button class="link" data-act="rm">Удалить</button></li>`).join(''):`<li style="display:block;padding:20px;text-align:center;">Корзина пуста</li>`;
  if($('#checkoutBtn')) $('#checkoutBtn').disabled=$('#clearBtn').disabled=!L.length;
}
function bump(){const b=$('#badge');if(!b)return;b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}
function setQty(id,d){const key=String(id),c=S.cart.find(x=>String(x.id)===key);if(c){c.qty=Math.min(50,Math.max(0,Number(c.qty||0)+d));if(c.qty<=0)S.cart=S.cart.filter(x=>x!==c)}else if(d>0)S.cart.push({id:key,qty:1});saveCart();renderCart();bump()}

const reduce=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
function closeDlg(d){if(!d||!d.open)return; if(reduce())return d.close(); d.classList.add('closing'); d.style.pointerEvents='none'; setTimeout(()=>{d.close();d.classList.remove('closing');d.style.pointerEvents='';},250);}
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;$('#toasts')?.append(t);setTimeout(()=>{t.style.opacity='0';t.style.transform='translateY(10px)';setTimeout(()=>t.remove(),300)},2400)}

function openDetail(id){
  const p=find(id),d=$('#detail');if(!p||d?.open)return;
  if($('#detailBody')) $('#detailBody').innerHTML=`<div class="detail" data-id="${esc(p.id)}"><img src="${esc(imgSrc(p))}"><span class="tag">${esc(p.category)}</span><h2>${esc(p.name)}</h2><p>${esc(p.description)}</p><div class="card-foot"><strong>${fmt(p.price)}</strong><button class="btn btn-primary" data-act="add">В корзину</button></div></div>`;
  d?.showModal();
}

let sliderTimer = null;
function initSlider(slides) {
  const container = $('#showcaseSlider');
  if (!container) return;
  if (sliderTimer) { clearInterval(sliderTimer); sliderTimer = null; }

  const validSlides = (Array.isArray(slides) ? slides : []).filter(slide => slide && typeof slide.title === 'string' && typeof slide.image_url === 'string');
  const source = validSlides.length ? validSlides : [{
    title: 'Добро пожаловать в Stackd', description: 'Подборка предложений', image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&auto=format&fit=crop&q=85'
  }];

  container.innerHTML = source.map((slide, index) => `
    <div class="slide ${index === 0 ? 'active' : ''}" aria-hidden="${index !== 0}">
      <img src="${esc(safeImageUrl(slide.image_url))}" alt="${esc(slide.title)}">
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

const F=()=>$('#pform')?.elements;
function setDraft(p){
  S.draft=p?{...p}:blank();
  const f=F(),d=S.draft;
  if(!f) return;
  f.pn.value=d.name || '';
  f.pd.value=d.description || '';
  f.pc.value=d.category || 'Burgers';
  f.pp.value=d.price ?? '';
  f.pf.value='';
  if($('#formMsg')) $('#formMsg').textContent='';
  if($('#formTitle')) $('#formTitle').textContent=p?'Редактировать':'Новый товар';
}
function readForm(){
  const f=F();
  if(!f || !S.draft) throw new Error('Форма недоступна.');
  const price = Number(f.pp.value);
  const name = f.pn.value.trim(), category = f.pc.value.trim();
  if (!name || !category) throw new Error('Заполните название и категорию.');
  if (!Number.isFinite(price) || price < 0) throw new Error('Укажите корректную цену.');
  Object.assign(S.draft,{name,description:f.pd.value.trim(),category,price});
}

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
  try {
    const rows = [
      { key: 'hero_title', value: $('#settingHeroTitle').value.trim() },
      { key: 'hero_subtitle', value: $('#settingHeroSub').value.trim() }
    ];
    const { error } = await _supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
    if (error) throw error;
    if (msg) { msg.textContent = 'Сохранено.'; msg.style.color = 'green'; }
  } catch (error) {
    if (msg) { msg.textContent = 'Ошибка: ' + error.message; msg.style.color = 'red'; }
  }
});

const A={
  add:id=>{const p=find(id);if(p){setQty(id,1);toast(p.name+' добавлен')}},
  inc:id=>setQty(id,1),dec:id=>setQty(id,-1),
  rm:id=>{S.cart=S.cart.filter(c=>c.id!==id);saveCart();renderCart();bump()},
  clear:()=>{S.cart=[];saveCart();renderCart();toast('Корзина очищена')},
  checkout:()=>{ if(!S.user) return $('#auth').showModal(); toast('Оформление заказа пока отключено.'); },
  detail:openDetail,
  reload:()=>load(),
  'cart-open':()=>{const d=$('#drawer');if(!d.open)d.showModal()},
  manage:()=>{if(!isAdmin()){toast('Доступ только владельцу.');return;}const d=$('#editor');if(!d.open){d.showModal();setDraft(null)}renderAdmin()},
  auth:()=>{const d=$('#auth');if(!d.open)d.showModal()},
  'toggle-lang':toggleLangDropdown,
  close:(_,b)=>closeDlg(b.closest('dialog')),
  cat:(_,b)=>{S.cat=b.dataset.cat;renderAll()},
  theme:(_,b)=>{localStorage.setItem('pdd.theme',b.dataset.v);applyTheme()},
  new:()=>{if(!isAdmin()){toast('Нет прав.');return;}setDraft(null)},
  edit:id=>{if(!isAdmin()){toast('Нет прав.');return;}setDraft(find(id))},
  del:async id=>{
    const p=find(id);
    if (!p || !isAdmin()) { toast('Нет прав.'); return; }
    if(!window.confirm(`Удалить "${p.name}"?`)) return;
    const { error } = await _supabase.from('products').delete().eq('id', id);
    if (error) { toast('Ошибка: ' + error.message); return; }
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

$('#pform')?.addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('#formMsg');
  try {
    if (!isAdmin()) throw new Error('Только владелец может управлять товарами.');
    readForm();
    const d = S.draft;
    const file = $('#pf')?.files?.[0];
    
    if (msg) { msg.textContent = 'Сохранение…'; msg.style.color = 'gray'; }

    let imageUrl = d.image_url || d.image || '';
    if (file) {
      const fileExt = file.name.split('.').pop();
      const objectPath = `products/${crypto.randomUUID()}.${fileExt}`;
      const { error: upErr } = await _supabase.storage.from(PRODUCT_BUCKET).upload(objectPath, file, { upsert: false });
      if (upErr) throw upErr;
      const { data } = _supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(objectPath);
      imageUrl = data.publicUrl;
    }

    const payload = { name:d.name, description:d.description, category:d.category, price:d.price, image_url:imageUrl };
    const exists = S.products.some(p => String(p.id) === String(d.id));
    const result = exists
      ? await _supabase.from('products').update(payload).eq('id', d.id)
      : await _supabase.from('products').insert(payload);
      
    if (result.error) throw result.error;

    await load();
    setDraft(null);
    if (msg) { msg.textContent = 'Товар сохранён.'; msg.style.color = 'green'; }
    toast('Сохранено!');
  } catch (error) {
    if (msg) { msg.textContent = 'Ошибка: ' + (error.message || 'неизвестно'); msg.style.color = 'red'; }
  }
});

$('#topupForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('#topupMsg');
  try {
    if (!S.user) throw new Error('Сначала войдите в аккаунт.');
    if (!$('#termsCheck')?.checked) throw new Error('Подтвердите условия.');
    const file = $('#topupFile')?.files?.[0];
    const amount = Number($('#topupAmount')?.value);
    if (!amount || amount < 1 || amount > 100) throw new Error('Сумма от 1 до 100 AZN.');
    if (!file) throw new Error('Выберите скриншот.');

    if (msg) { msg.textContent = 'Отправка...'; msg.style.color = 'gray'; }
    
    const fileExt = file.name.split('.').pop();
    const objectPath = `${S.user.id}/${crypto.randomUUID()}.${fileExt}`;
    const { error: upErr } = await _supabase.storage.from('payment-proofs').upload(objectPath, file);
    if (upErr) throw upErr;

    const { error: dbErr } = await _supabase.from('topups').insert({ 
      user_id: S.user.id, 
      amount: amount, 
      screenshot_url: objectPath 
    });
    if (dbErr) throw dbErr;

    if (msg) { msg.textContent = 'Заявка отправлена! Ожидайте проверки.'; msg.style.color = 'green'; }
    $('#topupForm').reset();
  } catch (error) {
    if (msg) { msg.textContent = error.message; msg.style.color = 'red'; }
  }
});

if($('#categoryOptions')) $('#categoryOptions').innerHTML=CATS.map(c=>`<option value="${c}">`).join('');
applyTheme(); applyLanguage('ru'); checkAuth();
