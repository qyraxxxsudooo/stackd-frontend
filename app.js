const SUPABASE_URL = 'https://wjlkztgmbqaflcdldapi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DpbANPkD124VOGD3JkS7AA_pd2n_Ong';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>(Number(n)||0).toFixed(2)+' AZN',PH='assets/icons/placeholder.svg',CATS=['Burgers','Sides','Drinks','Desserts'];
const S={products:[],cart:[],cat:'All',q:'',adminQ:'',user:null,profile:null,draft:null,lang:'ru'};

try{S.cart=JSON.parse(localStorage.getItem('pdd.cart'))||[]}catch{}
const saveCart=()=>localStorage.setItem('pdd.cart',JSON.stringify(S.cart));

/* СЛОВАРИ ПЕРЕВОДОВ */
const translations = {
  ru: {
    search_placeholder: 'Поиск в Stackd', theme_light: 'Светлая', theme_dark: 'Темная', theme_system: 'Авто',
    login_btn: 'Войти', logout_btn: 'Выйти', catalog_btn: 'Каталог', menu_title: 'Меню', balance_label: 'Баланс',
    footer_desc: 'Лучшие предложения на еду в Баку.', footer_support: 'Поддержка', footer_about: 'О проекте', footer_about_text: 'Данные хранятся в облаке Supabase.',
    cart_title: 'Корзина', cart_total: 'Итого', cart_checkout: 'Оформить заказ', cart_clear: 'Очистить', cart_empty: 'Корзина пуста', cart_remove: 'Удалить',
    auth_title: 'Добро пожаловать', auth_sub: 'Войдите или создайте аккаунт', auth_google: 'Продолжить с Google', auth_or: 'или', auth_login_btn: 'Войти', auth_register_btn: 'Регистрация',
    topup_title: 'Пополнение', topup_card: 'Перевод на карту: 4169 7388 1234 5678', topup_amount: 'Сумма (AZN)', topup_check: 'Скриншот чека', topup_btn: 'Отправить чек',
    admin_title: 'Управление каталогом', admin_products: 'Товары', admin_add: 'Добавить', admin_search: 'Поиск товаров',
    form_new: 'Новый товар', form_edit: 'Редактировать', form_name: 'Название', form_desc: 'Описание', form_cat: 'Категория', form_price: 'Цена (AZN)', form_image: 'Картинка (с ПК)', form_save: 'Сохранить',
    added_to_cart: 'добавлен в корзину', cart_cleared: 'Корзина очищена', checkout_msg: 'Заказ создан!', product_deleted: 'Удалено', saved: 'Сохранено', out_of_stock: 'Нет в наличии', add_to_cart: 'В корзину', no_results: 'Ничего не найдено.', empty_catalog: 'Товаров пока нет.'
  },
  en: {
    search_placeholder: 'Search in Stackd', theme_light: 'Light', theme_dark: 'Dark', theme_system: 'Auto',
    login_btn: 'Log in', logout_btn: 'Log out', catalog_btn: 'Catalog', menu_title: 'Menu', balance_label: 'Balance',
    footer_desc: 'Best food deals in Baku.', footer_support: 'Support', footer_about: 'About', footer_about_text: 'Data is stored in Supabase cloud.',
    cart_title: 'Cart', cart_total: 'Total', cart_checkout: 'Checkout', cart_clear: 'Clear', cart_empty: 'Your cart is empty', cart_remove: 'Remove',
    auth_title: 'Welcome', auth_sub: 'Sign in or create an account', auth_google: 'Continue with Google', auth_or: 'or', auth_login_btn: 'Log in', auth_register_btn: 'Register',
    topup_title: 'Top-up', topup_card: 'Card transfer: 4169 7388 1234 5678', topup_amount: 'Amount (AZN)', topup_check: 'Receipt screenshot', topup_btn: 'Send receipt',
    admin_title: 'Catalog Management', admin_products: 'Products', admin_add: 'Add', admin_search: 'Search products',
    form_new: 'New product', form_edit: 'Edit product', form_name: 'Name', form_desc: 'Description', form_cat: 'Category', form_price: 'Price (AZN)', form_image: 'Image (from PC)', form_save: 'Save',
    added_to_cart: 'added to cart', cart_cleared: 'Cart cleared', checkout_msg: 'Order created!', product_deleted: 'Deleted', saved: 'Saved', out_of_stock: 'Out of stock', add_to_cart: 'Add to cart', no_results: 'No products found.', empty_catalog: 'No products yet.'
  },
  az: {
    search_placeholder: 'Stackd-də axtar', theme_light: 'İşıqlı', theme_dark: 'Qaranlıq', theme_system: 'Avto',
    login_btn: 'Daxil ol', logout_btn: 'Çıxış', catalog_btn: 'Kataloq', menu_title: 'Menyu', balance_label: 'Balans',
    footer_desc: 'Bakıda ən yaxşı yemək təklifləri.', footer_support: 'Dəstək', footer_about: 'Layihə haqqında', footer_about_text: 'Məlumatlar Supabase buludunda saxlanılır.',
    cart_title: 'Səbət', cart_total: 'Cəmi', cart_checkout: 'Sifariş et', cart_clear: 'Təmizlə', cart_empty: 'Səbətiniz boşdur', cart_remove: 'Sil',
    auth_title: 'Xoş gəlmisiniz', auth_sub: 'Daxil olun və ya hesab yaradın', auth_google: 'Google ilə davam et', auth_or: 'və ya', auth_login_btn: 'Daxil ol', auth_register_btn: 'Qeydiyyat',
    topup_title: 'Balans artırma', topup_card: 'Karta köçürmə: 4169 7388 1234 5678', topup_amount: 'Məbləğ (AZN)', topup_check: 'Qəbz ekran görüntüsü', topup_btn: 'Qəbzi göndər',
    admin_title: 'Kataloq İdarəetməsi', admin_products: 'Məhsullar', admin_add: 'Əlavə et', admin_search: 'Məhsul axtar',
    form_new: 'Yeni məhsul', form_edit: 'Məhsulu redaktə et', form_name: 'Ad', form_desc: 'Təsvir', form_cat: 'Kateqoriya', form_price: 'Qiymət (AZN)', form_image: 'Şəkil (PC-dən)', form_save: 'Yadda saxla',
    added_to_cart: 'səbətə əlavə edildi', cart_cleared: 'Səbət təmizləndi', checkout_msg: 'Sifariş yaradıldı!', product_deleted: 'Silindi', saved: 'Yadda saxlanıldı', out_of_stock: 'Stokda yoxdur', add_to_cart: 'Səbətə at', no_results: 'Heç nə tapılmadı.', empty_catalog: 'Hələ məhsul yoxdur.'
  }
};

function applyLanguage(lang) {
  S.lang = lang;
  localStorage.setItem('pdd.lang', lang);
  document.documentElement.lang = lang;
  $('#currentLangLabel').textContent = lang.toUpperCase();
  
  $$('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if(translations[lang] && translations[lang][key]) el.textContent = translations[lang][key];
  });
  
  $$('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if(translations[lang] && translations[lang][key]) el.placeholder = translations[lang][key];
  });
  
  renderAll();
  setTimeout(updateThemeSlider, 50);
}

/* 1. АВТОРИЗАЦИЯ SUPABASE */
async function checkAuth() {
  const { data: { session } } = await _supabase.auth.getSession();
  if (session) {
    S.user = session.user;
    $('#loginBtn').style.display = 'none';
    $('#userProfile').style.display = 'flex';
    
    // --- АВАТАРКА GOOGLE ---
    const avatarUrl = S.user.user_metadata?.avatar_url || S.user.user_metadata?.picture;
    if (avatarUrl) {
        $('#userAvatar').src = avatarUrl;
    } else {
        $('#userAvatar').src = PH;
    }
    
    const { data } = await _supabase.from('profiles').select('*').eq('id', S.user.id).single();
    if (data) {
      S.profile = data;
      $('#userBalance').textContent = data.balance.toFixed(2);
      if (data.email === 'yuska20102010@gmail.com' || data.role === 'admin') {
        $('#adminBtn').style.display = 'block';
      }
    }
  } else {
    S.user = null; S.profile = null;
    $('#loginBtn').style.display = 'block';
    $('#userProfile').style.display = 'none';
    $('#adminBtn').style.display = 'none';
  }
  await load(); 
}

// ВХОД (Кнопка "Войти")
$('#authForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('#authMsg').textContent = 'Загрузка...';
  const email = $('#emailInput').value, pass = $('#passInput').value;
  
  if (!email || !pass) return $('#authMsg').textContent = 'Заполните все поля';

  const { error } = await _supabase.auth.signInWithPassword({ email, password: pass });
  if (error) {
    return $('#authMsg').textContent = 'Неверный email или пароль.';
  }
  
  closeDlg($('#auth'));
  toast('Вы вошли!');
  checkAuth();
});

// РЕГИСТРАЦИЯ (Кнопка "Регистрация")
$('#signUpBtn').addEventListener('click', async () => {
  $('#authMsg').textContent = 'Загрузка...';
  const email = $('#emailInput').value, pass = $('#passInput').value;
  
  if (!email || !pass) return $('#authMsg').textContent = 'Заполните все поля';
  if (pass.length < 6) return $('#authMsg').textContent = 'Пароль должен быть не менее 6 символов';

  const { data, error } = await _supabase.auth.signUp({ email, password: pass });
  
  if (error) {
    return $('#authMsg').textContent = 'Ошибка: ' + error.message;
  }

  if (data.user) {
    await _supabase.auth.signInWithPassword({ email, password: pass });
    closeDlg($('#auth'));
    toast('Аккаунт создан!');
    checkAuth();
  }
});

// ВХОД ЧЕРЕЗ GOOGLE
$('#googleLoginBtn').addEventListener('click', async () => {
  const { error } = await _supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
  if (error) toast('Ошибка Google: ' + error.message);
});

// ВЫХОД
$('#logoutBtn').addEventListener('click', async () => { await _supabase.auth.signOut(); location.reload(); });

// 2. ЗАГРУЗКА ДАННЫХ
async function load(){
  try {
    const { data: slides } = await _supabase.from('slides').select('*');
    initSlider(slides || []);
    const { data: prods } = await _supabase.from('products').select('*');
    S.products = prods || []; 
  } catch (e) { console.error(e); }
  renderAll();
}

const find=id=>S.products.find(p=>p.id===id),live=()=>S.products.filter(p=>p.active!==false),isAvailable=p=>p.available!==false;
const imgSrc=p=>p.image_url || p.image || PH; 

// 3. ОТРИСОВКА
const card=p=>`<article class="card${isAvailable(p)?'':' is-out'}" data-id="${esc(p.id)}"><button class="card-media" data-act="detail"><img src="${esc(imgSrc(p))}" alt="${esc(p.name)}" loading="lazy"></button><div class="card-body"><span class="tag">${esc(p.category)}${isAvailable(p)?'':' · '+translations[S.lang].out_of_stock}</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><div class="card-foot"><strong>${fmt(p.price)}</strong><button class="btn btn-primary sm" data-act="add"${isAvailable(p)?'':' disabled'}>${isAvailable(p)?translations[S.lang].add_to_cart:translations[S.lang].out_of_stock}</button></div></div></article>`;

function renderAll(){
  const L=live();
  $('#chips').innerHTML=['All',...new Set([...CATS,...L.map(p=>p.category)])].filter(c=>c==='All'||L.some(p=>p.category===c)).map(c=>`<button data-act="cat" data-cat="${esc(c)}" aria-pressed="${S.cat===c}">${esc(c)}</button>`).join('');
  
  const q=S.q.toLowerCase(),list=L.filter(p=>(S.cat==='All'||p.category===S.cat)&&(!q||(p.name+' '+p.description).toLowerCase().includes(q)));
  $('#grid').innerHTML = list.length?list.map(card).join(''):`<div class="state"><p>${L.length?translations[S.lang].no_results:translations[S.lang].empty_catalog}</p></div>`;
  
  renderCart();
  if($('#editor').open)renderAdmin();
  updateChipsSlider();
}

// ПОИСК
const searchInput = $('#q'), suggestionsBox = $('#searchSuggestions');
searchInput.addEventListener('input', e => {
  const val = e.target.value.trim().toLowerCase();
  S.q = val;
  renderAll();

  if(!val) { suggestionsBox.classList.remove('active'); return; }
  
  const matches = live().filter(p => p.name.toLowerCase().includes(val)).slice(0, 5);
  if(matches.length) {
    suggestionsBox.innerHTML = matches.map(p => `
      <div class="suggestion-item" data-id="${esc(p.id)}">
        <img src="${esc(imgSrc(p))}" alt="">
        <div><div class="s-title">${esc(p.name)}</div><div class="s-cat">${esc(p.category)}</div></div>
      </div>
    `).join('');
    suggestionsBox.classList.add('active');
  } else {
    suggestionsBox.classList.remove('active');
  }
});

suggestionsBox.addEventListener('mousedown', e => {
  const item = e.target.closest('.suggestion-item');
  if(item) {
    const id = item.dataset.id;
    suggestionsBox.classList.remove('active');
    searchInput.value = '';
    S.q = '';
    renderAll();
    const el = $(`.card[data-id="${id}"]`);
    if(el) {
      el.scrollIntoView({behavior:'smooth', block:'center'});
      el.style.boxShadow = '0 0 0 4px var(--accent)';
      setTimeout(()=> el.style.boxShadow = '', 1500);
    }
  }
});
searchInput.addEventListener('blur', () => setTimeout(()=>suggestionsBox.classList.remove('active'), 150));

// ЯЗЫК
function toggleLangDropdown() { $('#langDropdown').classList.toggle('active'); }
document.querySelector('.lang-dropdown').addEventListener('click', e => {
  const btn = e.target.closest('button[data-lang]');
  if(btn) { applyLanguage(btn.dataset.lang); $('#langDropdown').classList.remove('active'); }
});
document.addEventListener('click', e => {
  if(!e.target.closest('.lang-selector')) { $('#langDropdown').classList.remove('active'); }
});

// ТЕМЫ
function updateThemeSlider() {
  const activeBtn = $('.seg button[aria-pressed="true"]');
  const slider = $('#themeSlider');
  if(activeBtn && slider) {
    slider.style.width = `${activeBtn.offsetWidth}px`;
    slider.style.transform = `translateX(${activeBtn.offsetLeft - 3}px)`;
  }
}
function applyTheme(){
  const t=localStorage.getItem('pdd.theme')||'system';
  document.documentElement.dataset.theme=t==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):t;
  $$('.seg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===t));
  setTimeout(updateThemeSlider, 50);
}
matchMedia('(prefers-color-scheme:dark)').addEventListener('change',applyTheme);

// КАТЕГОРИИ
function updateChipsSlider() {
  const active = $('#chips button[aria-pressed="true"]');
  const slider = $('#chipsSlider');
  if(active && slider) {
    slider.style.width = `${active.offsetWidth}px`;
    slider.style.transform = `translateX(${active.offsetLeft}px)`;
  }
}
window.addEventListener('resize', () => { updateChipsSlider(); updateThemeSlider(); });

// КОРЗИНА
const lines=()=>S.cart.map(c=>({p:find(c.id),qty:c.qty})).filter(l=>l.p);
function renderCart(){
  const L=lines(),n=L.reduce((a,l)=>a+l.qty,0),t=L.reduce((a,l)=>a+l.qty*l.p.price,0);
  $('#badge').textContent=n;$('#total').textContent=fmt(t);
  $('#lines').innerHTML=L.length?L.map(({p,qty})=>`<li data-id="${esc(p.id)}"><img src="${esc(imgSrc(p))}" alt=""><div><strong>${esc(p.name)}</strong><small>${fmt(p.price)}</small><div class="qty"><button data-act="dec">−</button><span>${qty}</span><button data-act="inc">+</button></div></div><button class="link" data-act="rm">${translations[S.lang].cart_remove}</button></li>`).join(''):`<li style="display:block;padding:20px;text-align:center;">${translations[S.lang].cart_empty}</li>`;
  $('#checkoutBtn').disabled=$('#clearBtn').disabled=!L.length;
}
function bump(){const b=$('#badge');b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}
function setQty(id,d){const c=S.cart.find(x=>x.id===id);if(c){c.qty+=d;if(c.qty<=0)S.cart=S.cart.filter(x=>x!==c)}else if(d>0)S.cart.push({id,qty:1});saveCart();renderCart();bump()}

// ОКНА
const reduce=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
function closeDlg(d){if(!d.open)return; if(reduce())return d.close(); d.classList.add('closing'); d.style.pointerEvents='none'; setTimeout(()=>{d.close();d.classList.remove('closing');d.style.pointerEvents='';},250);}
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;$('#toasts').append(t);setTimeout(()=>{t.style.opacity='0';t.style.transform='translateY(10px)';setTimeout(()=>t.remove(),300)},2400)}

function openDetail(id){
  const p=find(id),d=$('#detail');if(!p||d.open)return;
  $('#detailBody').innerHTML=`<div class="detail" data-id="${esc(p.id)}"><img src="${esc(imgSrc(p))}" alt=""><span class="tag">${esc(p.category)}</span><h2>${esc(p.name)}</h2><p>${esc(p.description)}</p><div class="card-foot"><strong>${fmt(p.price)}</strong><button class="btn btn-primary" data-act="add"${isAvailable(p)?'':' disabled'}>${isAvailable(p)?translations[S.lang].add_to_cart:translations[S.lang].out_of_stock}</button></div></div>`;
  d.showModal();
}

// СЛАЙДЕР
function initSlider(slides) {
  const container = $('#showcaseSlider');
  if (!slides.length) {
    container.innerHTML = `<div class="slide active"><img src="https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200"><div class="slide-content"><h2>Добро пожаловать в Stackd</h2></div></div>`;
    return;
  }
  container.innerHTML = slides.map((s, i) => `
    <div class="slide ${i===0?'active':''}">
      <img src="${s.image_url}" alt="">
      <div class="slide-content"><h2>${s.title}</h2><p>${s.description}</p></div>
    </div>
  `).join('');
  
  let current = 0;
  setInterval(() => {
    const el = $$('.slide', container);
    if(el.length < 2) return;
    el[current].classList.remove('active');
    current = (current + 1) % el.length;
    el[current].classList.add('active');
  }, 3000);
}

// АДМИНКА
const blank=()=>({id:Date.now().toString(),name:'',description:'',price:0,category:'Burgers'});
function renderAdmin(){
  const q=S.adminQ.toLowerCase(),list=S.products.filter(p=>!q||(p.name+' '+p.category).toLowerCase().includes(q));
  $('#adminCount').textContent=`${S.products.length} шт.`;
  $('#adminList').innerHTML=list.length?list.map(p=>`<li data-id="${esc(p.id)}" class="${p.active===false?'off':''}"><img src="${esc(imgSrc(p))}" alt=""><div><strong>${esc(p.name)}</strong><br><small>${esc(p.category)} · ${fmt(p.price)}</small></div><div class="acts"><button class="btn btn-ghost sm" data-act="edit">Ред.</button><button class="btn btn-ghost sm" data-act="toggle">${p.active===false?'Показать':'Скрыть'}</button><button class="btn btn-ghost sm" data-act="del">Удал.</button></div></li>`).join(''):`<li>Ничего нет.</li>`;
}
const F=()=>$('#pform').elements;
function setDraft(p){
  S.draft=p?{...p}:blank();const f=F(),d=S.draft;
  f.pn.value=d.name;f.pd.value=d.description;f.pc.value=d.category;f.pp.value=d.price;
  f.pf.value='';$('#formMsg').textContent='';$('#formTitle').textContent=p?'Редактировать':'Новый товар';
}
function readForm(){const f=F();Object.assign(S.draft,{name:f.pn.value.trim(),description:f.pd.value.trim(),category:f.pc.value.trim(),price:Math.max(0,parseFloat(f.pp.value)||0)})}

// ДЕЙСТВИЯ
const A={
  add:id=>{const p=find(id);if(p&&isAvailable(p)){setQty(id,1);toast(p.name+' '+translations[S.lang].added_to_cart)}},
  inc:id=>setQty(id,1),dec:id=>setQty(id,-1),
  rm:id=>{S.cart=S.cart.filter(c=>c.id!==id);saveCart();renderCart();bump()},
  clear:()=>{S.cart=[];saveCart();renderCart();toast(translations[S.lang].cart_cleared)},
  checkout:()=>{
    if(!S.user) return $('#auth').showModal();
    const total = S.cart.reduce((a, c) => a + (c.p.price * c.qty), 0);
    if(S.profile.balance < total) return alert('Недостаточно средств! Пополните баланс.');
    toast(translations[S.lang].checkout_msg);
  },
  detail:openDetail,
  'cart-open':()=>{const d=$('#drawer');if(!d.open)d.showModal()},
  manage:()=>{const d=$('#editor');if(!d.open){d.showModal();setDraft(null)}renderAdmin()},
  auth:()=>{const d=$('#auth');if(!d.open)d.showModal()},
  'toggle-lang':toggleLangDropdown,
  close:(_,b)=>closeDlg(b.closest('dialog')),
  cat:(_,b)=>{S.cat=b.dataset.cat;renderAll()},
  theme:(_,b)=>{localStorage.setItem('pdd.theme',b.dataset.v);applyTheme()},
  new:()=>setDraft(null),edit:id=>setDraft(find(id)),
  toggle:async id=>{
    const p=find(id); const newStatus = p.active === false; 
    await _supabase.from('products').update({active: newStatus}).eq('id', id);
    await load(); toast(newStatus?'Опубликовано':'Скрыто');
  },
  del:async id=>{
    const p=find(id); if(!confirm(`Удалить "${p.name}"?`))return;
    await _supabase.from('products').delete().eq('id', id);
    S.products=S.products.filter(x=>x.id!==id); S.cart=S.cart.filter(c=>c.id!==id); saveCart();
    if(S.draft&&S.draft.id===id)setDraft(null); renderAll(); toast('Удалено');
  }
};

document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');
  if(!b){if(e.target.matches('dialog'))closeDlg(e.target);return}
  A[b.dataset.act]?.(b.closest('[data-id]')?.dataset.id,b);
});

$('#searchForm').addEventListener('submit',e=>e.preventDefault());
$('#adminSearch').addEventListener('input',e=>{S.adminQ=e.target.value.trim();renderAdmin()});

// ЗАГРУЗКА ФОТО В БАЗУ
$('#pform').addEventListener('submit',async e=>{
  e.preventDefault(); readForm(); const d=S.draft;
  if(!d.name||!d.category){$('#formMsg').textContent='Заполните имя и категорию';return}
  const file = $('#pf').files[0];
  if(!file) return $('#formMsg').textContent = 'Выберите картинку!';

  $('#formMsg').textContent = 'Загрузка фото...';
  
  try {
    const fileName = `prod_${Date.now()}.jpg`;
    const { error: upError } = await _supabase.storage.from('images').upload(fileName, file);
    if (upError) throw upError;
    const { data: { publicUrl } } = _supabase.storage.from('images').getPublicUrl(fileName);

    if (S.products.find(p=>p.id===d.id)) {
        await _supabase.from('products').update({name:d.name, description:d.description, category:d.category, price:d.price, image_url: publicUrl}).eq('id', d.id);
    } else {
        await _supabase.from('products').insert({name:d.name, description:d.description, category:d.category, price:d.price, image_url: publicUrl});
    }

    await load(); toast(translations[S.lang].saved); setDraft(null);
  } catch(err) {
    $('#formMsg').textContent = 'Ошибка: ' + err.message;
  }
});

// ПОПОЛНЕНИЕ БАЛАНСА
$('#balanceBtn').addEventListener('click', () => $('#topup').showModal());

$('#topupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = $('#topupFile').files[0], amount = parseFloat($('#topupAmount').value);
  $('#topupMsg').textContent = 'Загрузка...';
  
  try {
    const fileName = `check_${S.user.id}_${Date.now()}.jpg`;
    const { error: uploadError } = await _supabase.storage.from('images').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = _supabase.storage.from('images').getPublicUrl(fileName);

    await _supabase.from('topups').insert({ user_id: S.user.id, amount: amount, screenshot_url: publicUrl });
    $('#topupMsg').textContent = 'Отправлено!';
    setTimeout(() => closeDlg($('#topup')), 2000);
  } catch(e) {
    $('#topupMsg').textContent = 'Ошибка загрузки';
  }
});

// ЗАПУСК
$('#categoryOptions').innerHTML=CATS.map(c=>`<option value="${c}">`).join('');
applyTheme();
applyLanguage(localStorage.getItem('pdd.lang') || 'ru');
checkAuth();
