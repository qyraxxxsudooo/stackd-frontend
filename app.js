'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>(Number(n)||0).toFixed(2)+' AZN',PH='assets/icons/placeholder.svg',CATS=['Burgers','Sides','Drinks','Desserts'];
const uid=()=>'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const S={products:[],cart:[],cat:'All',q:'',adminQ:'',draft:null,error:false,lang:'ru'};
try{S.cart=JSON.parse(localStorage.getItem('pdd.cart'))||[]}catch{}
const saveCart=()=>localStorage.setItem('pdd.cart',JSON.stringify(S.cart));

/* Словари переводов */
const translations = {
  ru: {
    search_label: 'Поиск', search_placeholder: 'Поиск в Stackd', theme_light: 'Светлая', theme_dark: 'Темная', theme_system: 'Авто',
    login_btn: 'Войти', catalog_btn: 'Каталог', menu_title: 'Меню',
    footer_demo: 'Демонстрационный прототип.', footer_support: 'Поддержка', footer_about: 'О проекте', footer_about_text: 'Данные хранятся только в вашем браузере.',
    cart_title: 'Корзина', cart_total: 'Итого', cart_checkout: 'Оформить заказ', cart_clear: 'Очистить', cart_empty: 'Корзина пуста', cart_remove: 'Удалить',
    auth_title: 'Добро пожаловать', auth_sub: 'Войдите или создайте аккаунт', auth_google: 'Продолжить с Google', auth_or: 'или', auth_get_code: 'Получить код', auth_toast: 'Код отправлен на номер!',
    admin_title: 'Редактор каталога', admin_warn: 'Локальное хранилище браузера.', admin_products: 'Товары', admin_add: 'Добавить', admin_search: 'Поиск товаров', admin_export: 'Экспорт', admin_import: 'Импорт', admin_reset: 'Сброс',
    form_new: 'Новый товар', form_edit: 'Редактировать', form_name: 'Название', form_desc: 'Описание', form_cat: 'Категория', form_price: 'Цена (AZN)', form_image: 'Картинка', form_published: 'Опубликовано', form_in_stock: 'В наличии', form_featured: 'Рекомендуемое', form_preview: 'Превью', form_save: 'Сохранить',
    added_to_cart: 'добавлен в корзину', cart_cleared: 'Корзина очищена', checkout_msg: 'Это прототип. Оплата не взимается.', product_deleted: 'Удалено', reset_done: 'Данные сброшены', saved: 'Сохранено', out_of_stock: 'Нет в наличии', add_to_cart: 'В корзину', no_results: 'Ничего не найдено.', empty_catalog: 'Каталог пуст. Добавьте товар.'
  },
  en: {
    search_label: 'Search', search_placeholder: 'Search in Stackd', theme_light: 'Light', theme_dark: 'Dark', theme_system: 'Auto',
    login_btn: 'Log in', catalog_btn: 'Catalog', menu_title: 'Menu',
    footer_demo: 'Demonstration prototype.', footer_support: 'Support', footer_about: 'About', footer_about_text: 'Data is stored only in your browser.',
    cart_title: 'Cart', cart_total: 'Total', cart_checkout: 'Checkout', cart_clear: 'Clear', cart_empty: 'Your cart is empty', cart_remove: 'Remove',
    auth_title: 'Welcome', auth_sub: 'Sign in or create an account', auth_google: 'Continue with Google', auth_or: 'or', auth_get_code: 'Get code', auth_toast: 'Code sent to your number!',
    admin_title: 'Catalog Editor', admin_warn: 'Local browser storage.', admin_products: 'Products', admin_add: 'Add', admin_search: 'Search products', admin_export: 'Export', admin_import: 'Import', admin_reset: 'Reset',
    form_new: 'New product', form_edit: 'Edit product', form_name: 'Name', form_desc: 'Description', form_cat: 'Category', form_price: 'Price (AZN)', form_image: 'Image', form_published: 'Published', form_in_stock: 'In stock', form_featured: 'Featured', form_preview: 'Preview', form_save: 'Save',
    added_to_cart: 'added to cart', cart_cleared: 'Cart cleared', checkout_msg: 'This is a prototype. No payment is taken.', product_deleted: 'Deleted', reset_done: 'Data reset', saved: 'Saved', out_of_stock: 'Out of stock', add_to_cart: 'Add to cart', no_results: 'No products found.', empty_catalog: 'The catalog is empty. Add a product.'
  },
  az: {
    search_label: 'Axtarış', search_placeholder: 'Stackd-də axtar', theme_light: 'İşıqlı', theme_dark: 'Qaranlıq', theme_system: 'Avto',
    login_btn: 'Daxil ol', catalog_btn: 'Kataloq', menu_title: 'Menyu',
    footer_demo: 'Nümunə prototipi.', footer_support: 'Dəstək', footer_about: 'Layihə haqqında', footer_about_text: 'Məlumatlar yalnız brauzerinizdə saxlanılır.',
    cart_title: 'Səbət', cart_total: 'Cəmi', cart_checkout: 'Sifariş et', cart_clear: 'Təmizlə', cart_empty: 'Səbətiniz boşdur', cart_remove: 'Sil',
    auth_title: 'Xoş gəlmisiniz', auth_sub: 'Daxil olun və ya hesab yaradın', auth_google: 'Google ilə davam et', auth_or: 'və ya', auth_get_code: 'Kod al', auth_toast: 'Kod nömrənizə göndərildi!',
    admin_title: 'Kataloq Redaktoru', admin_warn: 'Yerli brauzer yaddaşı.', admin_products: 'Məhsullar', admin_add: 'Əlavə et', admin_search: 'Məhsul axtar', admin_export: 'İxrac', admin_import: 'İdxal', admin_reset: 'Sıfırla',
    form_new: 'Yeni məhsul', form_edit: 'Məhsulu redaktə et', form_name: 'Ad', form_desc: 'Təsvir', form_cat: 'Kateqoriya', form_price: 'Qiymət (AZN)', form_image: 'Şəkil', form_published: 'Dərc edilib', form_in_stock: 'Stokda var', form_featured: 'Tövsiyə olunan', form_preview: 'Ön baxış', form_save: 'Yadda saxla',
    added_to_cart: 'səbətə əlavə edildi', cart_cleared: 'Səbət təmizləndi', checkout_msg: 'Bu prototipdir. Ödəniş tutulmur.', product_deleted: 'Silindi', reset_done: 'Məlumatlar sıfırlandı', saved: 'Yadda saxlanıldı', out_of_stock: 'Stokda yoxdur', add_to_cart: 'Səbətə at', no_results: 'Heç nə tapılmadı.', empty_catalog: 'Kataloq boşdur. Məhsul əlavə edin.'
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
  setTimeout(updateThemeSlider, 50); // Пересчитываем ползунок после смены текста
}

/* База данных (IndexedDB) */
const dbp=new Promise((res,rej)=>{const r=indexedDB.open('pdd',1);r.onupgradeneeded=()=>r.result.createObjectStore('products',{keyPath:'id'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const tx=async(m,fn)=>{const d=await dbp;return new Promise((res,rej)=>{const t=d.transaction('products',m);const q=fn(t.objectStore('products'));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)})};
const dbAll=()=>tx('readonly',s=>s.getAll()),dbPut=p=>tx('readwrite',s=>s.put(p)),dbDel=id=>tx('readwrite',s=>s.delete(id)),dbClear=()=>tx('readwrite',s=>s.clear());

async function load(){
  try{let all=await dbAll();
    if(!all.length&&!localStorage.getItem('pdd.seeded')){const r=await fetch('data/products.json');if(!r.ok)throw new Error('seed');all=await r.json();for(const p of all)await dbPut(p);localStorage.setItem('pdd.seeded','1')}
    S.products=all;S.error=false}catch{S.error=true}
  renderAll();
  initSlider();
}

const urls=new WeakMap();
const imgSrc=p=>{if(p.blob){if(!urls.has(p.blob))urls.set(p.blob,URL.createObjectURL(p.blob));return urls.get(p.blob)}return p.image||PH};
const find=id=>S.products.find(p=>p.id===id),live=()=>S.products.filter(p=>p.active!==false),isAvailable=p=>p.available!==false;

const card=p=>`<article class="card${isAvailable(p)?'':' is-out'}" data-id="${esc(p.id)}"><button class="card-media" data-act="detail"><img src="${esc(imgSrc(p))}" alt="${esc(p.name)}" loading="lazy"></button><div class="card-body"><span class="tag">${esc(p.category)}${isAvailable(p)?'':' · '+translations[S.lang].out_of_stock}</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><div class="card-foot"><strong>${fmt(p.price)}</strong><button class="btn btn-primary sm" data-act="add"${isAvailable(p)?'':' disabled'}>${isAvailable(p)?translations[S.lang].add_to_cart:translations[S.lang].out_of_stock}</button></div></div></article>`;

function renderAll(){
  const L=live();
  $('#chips').innerHTML=['All',...new Set([...CATS,...L.map(p=>p.category)])].filter(c=>c==='All'||L.some(p=>p.category===c)).map(c=>`<button data-act="cat" data-cat="${esc(c)}" aria-pressed="${S.cat===c}">${esc(c)}</button>`).join('');
  
  const q=S.q.toLowerCase(),list=L.filter(p=>(S.cat==='All'||p.category===S.cat)&&(!q||(p.name+' '+p.description).toLowerCase().includes(q)));
  $('#grid').innerHTML=S.error?`<div class="state">Ошибка загрузки данных</div>` : list.length?list.map(card).join(''):`<div class="state"><p>${L.length?translations[S.lang].no_results:translations[S.lang].empty_catalog}</p></div>`;
  
  renderCart();
  if($('#editor').open)renderAdmin();
  updateChipsSlider();
}

/* Поиск */
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

/* Язык */
function toggleLangDropdown() {
  $('#langDropdown').classList.toggle('active');
}
document.querySelector('.lang-dropdown').addEventListener('click', e => {
  const btn = e.target.closest('button[data-lang]');
  if(btn) {
    applyLanguage(btn.dataset.lang);
    $('#langDropdown').classList.remove('active');
  }
});
document.addEventListener('click', e => {
  if(!e.target.closest('.lang-selector')) {
    $('#langDropdown').classList.remove('active');
  }
});

/* Ползунки */
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

function updateChipsSlider() {
  const active = $('#chips button[aria-pressed="true"]');
  const slider = $('#chipsSlider');
  if(active && slider) {
    slider.style.width = `${active.offsetWidth}px`;
    slider.style.transform = `translateX(${active.offsetLeft}px)`;
  }
}
window.addEventListener('resize', () => {
  updateChipsSlider();
  updateThemeSlider();
});

/* Корзина */
const lines=()=>S.cart.map(c=>({p:find(c.id),qty:c.qty})).filter(l=>l.p);
function renderCart(){
  const L=lines(),n=L.reduce((a,l)=>a+l.qty,0),t=L.reduce((a,l)=>a+l.qty*l.p.price,0);
  $('#badge').textContent=n;$('#total').textContent=fmt(t);
  $('#lines').innerHTML=L.length?L.map(({p,qty})=>`<li data-id="${esc(p.id)}"><img src="${esc(imgSrc(p))}" alt=""><div><strong>${esc(p.name)}</strong><small>${fmt(p.price)}</small><div class="qty"><button data-act="dec">−</button><span>${qty}</span><button data-act="inc">+</button></div></div><button class="link" data-act="rm">${translations[S.lang].cart_remove}</button></li>`).join(''):`<li style="display:block;padding:20px;text-align:center;">${translations[S.lang].cart_empty}</li>`;
  $('#checkoutBtn').disabled=$('#clearBtn').disabled=!L.length;
}
function bump(){const b=$('#badge');b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}
function setQty(id,d){const c=S.cart.find(x=>x.id===id);if(c){c.qty+=d;if(c.qty<=0)S.cart=S.cart.filter(x=>x!==c)}else if(d>0)S.cart.push({id,qty:1});saveCart();renderCart();bump()}

/* Окна */
const reduce=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
function closeDlg(d){
  if(!d.open)return;
  if(reduce()) return d.close();
  d.classList.add('closing');
  d.style.pointerEvents = 'none';
  setTimeout(()=>{
    d.close();
    d.classList.remove('closing');
    d.style.pointerEvents = '';
  },250);
}
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;$('#toasts').append(t);setTimeout(()=>{t.style.opacity='0';t.style.transform='translateY(10px)';setTimeout(()=>t.remove(),300)},2400)}

function openDetail(id){
  const p=find(id),d=$('#detail');if(!p||d.open)return;
  $('#detailBody').innerHTML=`<div class="detail" data-id="${esc(p.id)}"><img src="${esc(imgSrc(p))}" alt=""><span class="tag">${esc(p.category)}</span><h2>${esc(p.name)}</h2><p>${esc(p.description)}</p><div class="card-foot"><strong>${fmt(p.price)}</strong><button class="btn btn-primary" data-act="add"${isAvailable(p)?'':' disabled'}>${isAvailable(p)?translations[S.lang].add_to_cart:translations[S.lang].out_of_stock}</button></div></div>`;
  d.showModal();
}

/* Слайдер */
const slidesData = [
  {img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop', title: 'Сочные бургеры', desc: 'Попробуйте наше новое фирменное меню.'},
  {img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200&auto=format&fit=crop', title: 'Свежие ингредиенты', desc: 'Только отборное мясо и овощи.'},
  {img: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?q=80&w=1200&auto=format&fit=crop', title: 'Идеальные напитки', desc: 'Освежающий лимонад и крафтовый кофе.'}
];
function initSlider() {
  const container = $('#showcaseSlider');
  container.innerHTML = slidesData.map((s, i) => `
    <div class="slide ${i===0?'active':''}">
      <img src="${s.img}" alt="${s.title}">
      <div class="slide-content"><h2>${s.title}</h2><p>${s.desc}</p></div>
    </div>
  `).join('');
  
  let current = 0;
  setInterval(() => {
    const slides = $$('.slide', container);
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 3000);
}

/* Админка */
const blank=()=>({id:uid(),name:'',description:'',price:0,category:'Burgers',available:true,active:true,featured:false,image:''});
function renderAdmin(){
  const q=S.adminQ.toLowerCase(),list=S.products.filter(p=>!q||(p.name+' '+p.category).toLowerCase().includes(q));
  $('#adminCount').textContent=`${S.products.length} шт.`;
  $('#adminList').innerHTML=list.length?list.map(p=>`<li data-id="${esc(p.id)}" class="${p.active===false?'off':''}"><img src="${esc(imgSrc(p))}" alt=""><div><strong>${esc(p.name)}</strong><br><small>${esc(p.category)} · ${fmt(p.price)}</small></div><div class="acts"><button class="btn btn-ghost sm" data-act="edit">${translations[S.lang].form_edit||'Ред.'}</button><button class="btn btn-ghost sm" data-act="toggle">${p.active===false?'Показать':'Скрыть'}</button><button class="btn btn-ghost sm" data-act="del">Удал.</button></div></li>`).join(''):`<li>${translations[S.lang].no_results}</li>`;
}
const F=()=>$('#pform').elements;
function setDraft(p){
  S.draft=p?{...p}:blank();const f=F(),d=S.draft;
  f.pn.value=d.name;f.pd.value=d.description;f.pc.value=d.category;f.pp.value=d.price;
  f.pa.checked=d.active!==false;f.ps.checked=isAvailable(d);f.pft.checked=!!d.featured;f.pf.value='';
  $('#formMsg').textContent='';$('#formTitle').textContent=p?translations[S.lang].form_edit:translations[S.lang].form_new;
  preview();
}
function readForm(){const f=F();Object.assign(S.draft,{name:f.pn.value.trim(),description:f.pd.value.trim(),category:f.pc.value.trim(),price:Math.max(0,parseFloat(f.pp.value)||0),active:f.pa.checked,available:f.ps.checked,featured:f.pft.checked})}
const preview=()=>{$('#preview').innerHTML=card(S.draft.name?S.draft:{...S.draft,name:'Название',description:'Описание'})};

/* Действия */
const A={
  add:id=>{const p=find(id);if(p&&isAvailable(p)){setQty(id,1);toast(p.name+' '+translations[S.lang].added_to_cart)}},
  inc:id=>setQty(id,1),dec:id=>setQty(id,-1),
  rm:id=>{S.cart=S.cart.filter(c=>c.id!==id);saveCart();renderCart();bump()},
  clear:()=>{S.cart=[];saveCart();renderCart();toast(translations[S.lang].cart_cleared)},
  checkout:()=>toast(translations[S.lang].checkout_msg),
  detail:openDetail,
  'cart-open':()=>{const d=$('#drawer');if(!d.open)d.showModal()},
  manage:()=>{const d=$('#editor');if(!d.open){d.showModal();setDraft(null)}renderAdmin()},
  auth:()=>{const d=$('#auth');if(!d.open)d.showModal()},
  'google-login':()=>toast('Перенаправление в Google...'),
  'toggle-lang':toggleLangDropdown,
  close:(_,b)=>closeDlg(b.closest('dialog')),
  cat:(_,b)=>{S.cat=b.dataset.cat;renderAll()},
  theme:(_,b)=>{localStorage.setItem('pdd.theme',b.dataset.v);applyTheme()},
  new:()=>setDraft(null),edit:id=>setDraft(find(id)),
  toggle:async id=>{const p=find(id);p.active=p.active===false;await dbPut(p);renderAll();toast(p.active?'Опубликовано':'Скрыто')},
  del:async id=>{const p=find(id);if(!confirm(`Удалить "${p.name}"?`))return;await dbDel(id);S.products=S.products.filter(x=>x.id!==id);S.cart=S.cart.filter(c=>c.id!==id);saveCart();if(S.draft&&S.draft.id===id)setDraft(null);renderAll();toast(translations[S.lang].product_deleted)},
  reset:async()=>{if(!confirm('Сбросить данные?'))return;await dbClear();localStorage.removeItem('pdd.seeded');await load();setDraft(null);toast(translations[S.lang].reset_done)}
};

document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');
  if(!b){if(e.target.matches('dialog'))closeDlg(e.target);return}
  A[b.dataset.act]?.(b.closest('[data-id]')?.dataset.id,b);
});

$('#searchForm').addEventListener('submit',e=>e.preventDefault());
$('#adminSearch').addEventListener('input',e=>{S.adminQ=e.target.value.trim();renderAdmin()});
$('#pform').addEventListener('input',preview);
$('#pf').addEventListener('change',e=>{const f=e.target.files[0];if(f)S.draft.blob=f;preview()});

$('#authForm').addEventListener('submit', e => {
  e.preventDefault();
  toast(translations[S.lang].auth_toast);
  closeDlg($('#auth'));
});

$('#pform').addEventListener('submit',async e=>{
  e.preventDefault();readForm();const d=S.draft;
  if(!d.name||!d.category){$('#formMsg').textContent='Заполните имя и категорию';return}
  try{await dbPut(d);const i=S.products.findIndex(p=>p.id===d.id);i<0?S.products.push({...d}):S.products[i]={...d};renderAll();toast(translations[S.lang].saved);setDraft(null)}catch{$('#formMsg').textContent='Ошибка сохранения'}
});

$('#categoryOptions').innerHTML=CATS.map(c=>`<option value="${c}">`).join('');
applyTheme();
applyLanguage(localStorage.getItem('pdd.lang') || 'ru');
load();