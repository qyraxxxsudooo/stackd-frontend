const SUPABASE_URL = 'https://wjlkztgmbqaflcdldapi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DpbANPkD124VOGD3JkS7AA_pd2n_Ong';
const ADMIN_EMAIL = 'yuska20102010@gmail.com'; 
const PRODUCT_BUCKET = 'product-images';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>(Number(n)||0).toFixed(2)+' AZN',PH='assets/icons/placeholder.svg',CATS=['Burgers','Sides','Drinks','Desserts'];
const S={products:[],cart:[],cat:'All',q:'',adminQ:'',user:null,profile:null,draft:null,lang:'ru'};

try { S.cart = JSON.parse(localStorage.getItem('pdd.cart') || '[]'); } catch { S.cart = []; }
const saveCart=()=>{ try { localStorage.setItem('pdd.cart',JSON.stringify(S.cart)); } catch (e) {} };
const isAdmin=()=>String(S.user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();

// АВТОРИЗАЦИЯ
async function checkAuth() {
  const { data: { session } } = await _supabase.auth.getSession();
  S.user = session?.user || null;
  
  if (S.user) {
    $('#loginBtn').style.display = 'none';
    $('#userProfile').style.display = 'flex';
    if($('#myOrdersBtn')) $('#myOrdersBtn').style.display = 'block';
    $('#adminBtn').style.display = isAdmin() ? 'block' : 'none';
    
    const avatarUrl = S.user.user_metadata?.avatar_url;
    if ($('#userAvatar') && avatarUrl) $('#userAvatar').src = avatarUrl;

    const { data } = await _supabase.from('profiles').select('id,balance').eq('id', S.user.id).maybeSingle();
    S.profile = data;
    if ($('#userBalance')) $('#userBalance').textContent = Number(data?.balance || 0).toFixed(2);
  } else {
    $('#loginBtn').style.display = 'block';
    $('#userProfile').style.display = 'none';
    if($('#myOrdersBtn')) $('#myOrdersBtn').style.display = 'none';
    $('#adminBtn').style.display = 'none';
  }
  await load();
}

// ЗАГРУЗКА
async function load(){
  const { data: prods } = await _supabase.from('products').select('*');
  S.products = prods || []; 
  renderAll();
}

const imgSrc=p=>p?.image_url || PH;
const card=p=>{
  const isAvail = (p.stock > 0);
  return `<article class="card" data-id="${esc(p.id)}" style="position:relative;">
    ${p.featured ? '<span class="badge-popular">🔥 ХИТ</span>' : ''}
    <button class="card-media" data-act="detail"><img src="${esc(imgSrc(p))}" alt="${esc(p.name)}" loading="lazy"></button>
    <div class="card-body">
      <span class="tag">${esc(p.category)}</span>
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.description)}</p>
      <div class="stock-info ${p.stock < 5 ? 'stock-low' : ''}">В наличии: ${p.stock} шт.</div>
      <div class="card-foot">
        <strong>${fmt(p.price)}</strong>
        <button class="btn btn-primary sm" data-act="add" ${isAvail?'':' disabled'}>${isAvail?'В корзину':'Нет'}</button>
      </div>
    </div>
  </article>`;
};

function renderAll(){
  const L=S.products.filter(p=>p.active!==false);
  const q=S.q.toLowerCase(), list=L.filter(p=>(S.cat==='All'||p.category===S.cat)&&(!q||(p.name+' '+p.description).toLowerCase().includes(q)));
  $('#grid').innerHTML = list.length?list.map(card).join(''):`<div class="state"><p>Ничего не найдено</p></div>`;
  renderCart();
}

// КОРЗИНА И ОФОРМЛЕНИЕ ЗАКАЗА
const find=id=>S.products.find(p=>String(p.id)===String(id));
const lines=()=>S.cart.map(c=>({p:find(c.id),qty:c.qty})).filter(l=>l.p);
function renderCart(){
  const L=lines(),n=L.reduce((a,l)=>a+l.qty,0),t=L.reduce((a,l)=>a+l.qty*l.p.price,0);
  $('#badge').textContent=n; $('#total').textContent=fmt(t);
  $('#lines').innerHTML=L.length?L.map(({p,qty})=>`<li><img src="${esc(imgSrc(p))}"><div><strong>${esc(p.name)}</strong><small>${fmt(p.price)}</small><div class="qty"><button data-act="dec">−</button><span>${qty}</span><button data-act="inc">+</button></div></div></li>`).join(''):'<li>Корзина пуста</li>';
  $('#checkoutBtn').disabled = !L.length;
}

$('#checkoutBtn')?.addEventListener('click', async () => {
  if(!S.user) return $('#auth').showModal();
  const btn = $('#checkoutBtn');
  btn.disabled = true; btn.textContent = 'Оформление...';

  try {
    // Вызываем защищенную функцию в базе
    const { data: orderId, error } = await _supabase.rpc('checkout_order', {
      cart_items: S.cart.map(c => ({ id: c.id, qty: c.qty }))
    });
    if (error) throw error;

    S.cart = []; saveCart(); renderCart();
    closeDlg($('#drawer'));
    toast('Заказ оформлен! Ожидайте QR-код в Telegram.');
    await checkAuth(); 
    
    // Отправляем пуш тебе в ТГ (через Edge Function)
    await _supabase.functions.invoke('notify-telegram', { body: { orderId } }).catch(console.error);

  } catch (error) {
    alert('Ошибка: ' + error.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Оформить заказ';
  }
});

// МОИ ЗАКАЗЫ
$('#myOrdersBtn')?.addEventListener('click', async () => {
  const d = $('#orders'); if(!d) return;
  $('#ordersList').innerHTML = '<div style="text-align:center;">Загрузка...</div>';
  d.showModal();

  const { data, error } = await _supabase.from('orders').select('*').eq('user_id', S.user.id).order('created_at', { ascending: false });
  if(error || !data.length) { $('#ordersList').innerHTML = '<div style="text-align:center;">У вас пока нет заказов.</div>'; return; }

  $('#ordersList').innerHTML = data.map(o => {
    let statusClass = o.status === 'pending' ? 'status-pending' : o.status === 'processing' ? 'status-processing' : o.status === 'completed' ? 'status-completed' : 'status-cancelled';
    let statusText = o.status === 'pending' ? 'Ожидает' : o.status === 'processing' ? 'Готовится' : o.status === 'completed' ? 'Выполнен' : 'Отменен';
    return `<div class="order-card"><div class="order-header"><span>Заказ #${o.id.slice(0,6).toUpperCase()}</span><span class="order-status ${statusClass}">${statusText}</span></div><div style="font-size:0.85rem; color:var(--muted); margin-bottom:5px;">${new Date(o.created_at).toLocaleString()}</div><div style="font-weight:bold;">Сумма: ${fmt(o.total)}</div></div>`;
  }).join('');
});

// АДМИНКА
function renderAdmin(){
  const list=S.products;
  $('#adminList').innerHTML=list.map(p=>`<li><img src="${esc(imgSrc(p))}"><div class="info"><strong>${esc(p.name)}</strong><small>${fmt(p.price)} · Ост: ${p.stock}</small></div><div class="acts"><button class="btn btn-ghost sm" data-act="edit" data-id="${p.id}">Ред.</button><button class="btn btn-ghost sm" data-act="del" data-id="${p.id}">Удал.</button></div></li>`).join('');
}

function setDraft(p){
  S.draft=p?{...p}:{id:Date.now().toString(),name:'',description:'',price:0,category:'Burgers',stock:10,featured:false,image_url:''};
  const f=$('#pform').elements, d=S.draft;
  f.pn.value=d.name||''; f.pd.value=d.description||''; f.pc.value=d.category||''; f.pp.value=d.price||0;
  f.pStock.value=d.stock||0; f.pFeatured.checked=d.featured||false;
  f.pf.value=''; $('#formMsg').textContent='';
}

$('#pform')?.addEventListener('submit', async e => {
  e.preventDefault();
  const f=$('#pform').elements;
  const name=f.pn.value.trim(), category=f.pc.value.trim(), price=Number(f.pp.value), stock=Number(f.pStock.value);
  if(!name||!category) return $('#formMsg').textContent='Заполните поля';
  
  $('#formMsg').textContent = 'Сохранение...';
  try {
    let imageUrl = S.draft.image_url;
    const file = f.pf.files[0];
    if(file) {
      const ext = file.name.split('.').pop();
      const path = `products/${crypto.randomUUID()}.${ext}`;
      await _supabase.storage.from(PRODUCT_BUCKET).upload(path, file);
      const { data } = _supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path);
      imageUrl = data.publicUrl;
    }
    const payload = { name, category, price, stock, featured: f.pFeatured.checked, description: f.pd.value.trim(), image_url: imageUrl };
    if(S.products.find(p=>p.id===S.draft.id)) {
      await _supabase.from('products').update(payload).eq('id', S.draft.id);
    } else {
      await _supabase.from('products').insert(payload);
    }
    await load(); closeDlg($('#editor')); toast('Товар сохранен!');
  } catch(e) { $('#formMsg').textContent = 'Ошибка: ' + e.message; }
});

// ОСТАЛЬНЫЕ ОБРАБОТЧИКИ (корзина, темы, язык)
const A={
  add:id=>{const p=find(id);if(p){setQty(id,1);toast(p.name+' добавлен')}},
  inc:id=>setQty(id,1),dec:id=>setQty(id,-1),
  rm:id=>{S.cart=S.cart.filter(c=>c.id!==id);saveCart();renderCart();},
  clear:()=>{S.cart=[];saveCart();renderCart();toast('Корзина очищена')},
  manage:()=>{if(!isAdmin()){toast('Доступ только владельцу.');return;}const d=$('#editor');if(!d.open){d.showModal();setDraft(null)}renderAdmin()},
  auth:()=>{const d=$('#auth');if(!d.open)d.showModal()},
  'toggle-lang':toggleLangDropdown,
  close:(_,b)=>closeDlg(b.closest('dialog')),
  cat:(_,b)=>{S.cat=b.dataset.cat;renderAll()},
  theme:(_,b)=>{localStorage.setItem('pdd.theme',b.dataset.v);applyTheme()},
  new:()=>{if(!isAdmin()){toast('Нет прав.');return;}setDraft(null)},
  edit:id=>{if(!isAdmin()){toast('Нет прав.');return;}setDraft(find(id))},
  del:async id=>{
    const p=find(id); if (!p || !isAdmin()) { toast('Нет прав.'); return; }
    if(!window.confirm(`Удалить "${p.name}"?`)) return;
    await _supabase.from('products').delete().eq('id', id);
    S.products=S.products.filter(x=>String(x.id)!==String(id)); S.cart=S.cart.filter(c=>String(c.id)!==String(id)); saveCart();
    renderAll(); toast('Товар удалён.');
  }
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b){if(e.target.matches('dialog'))closeDlg(e.target);return}A[b.dataset.act]?.(b.closest('[data-id]')?.dataset.id,b);});
function setQty(id,d){const key=String(id),c=S.cart.find(x=>String(x.id)===key);if(c){c.qty=Math.min(50,Math.max(0,Number(c.qty||0)+d));if(c.qty<=0)S.cart=S.cart.filter(x=>x!==c)}else if(d>0)S.cart.push({id:key,qty:1});saveCart();renderCart();}
function closeDlg(d){if(!d||!d.open)return; d.classList.add('closing'); setTimeout(()=>{d.close();d.classList.remove('closing');},250);}
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;$('#toasts')?.append(t);setTimeout(()=>{t.style.opacity='0';t.style.transform='translateY(10px)';setTimeout(()=>t.remove(),300)},2400)}
function toggleLangDropdown() { $('#langDropdown')?.classList.toggle('active'); }
function applyTheme(){const t=localStorage.getItem('pdd.theme')||'system';document.documentElement.dataset.theme=t==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):t;}

// ИНИЦИАЛИЗАЦИЯ
checkAuth();
applyTheme();
