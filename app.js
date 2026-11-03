const SUPABASE_URL = 'https://wjlkztgmbqaflcdldapi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DpbANPkD124VOGD3JkS7AA_pd2n_Ong';
const ADMIN_EMAIL = 'yuska20102010@gmail.com'; 
const BUCKET = 'product-images';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => (Number(n)||0).toFixed(2)+' AZN';
const PH = 'assets/icons/placeholder.svg';
const CATS = ['Burgers','Sides','Drinks','Desserts'];
const S = { products: [], cart: [], cat: 'All', q: '', user: null, profile: null, draft: null, duration: 5000 };
let orderTimers = {};

try { S.cart = JSON.parse(localStorage.getItem('pdd.cart')) || []; } catch { S.cart = []; }
const saveCart = () => localStorage.setItem('pdd.cart', JSON.stringify(S.cart));
const isAdmin = () => String(S.user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();

// АВТОРИЗАЦИЯ
async function checkAuth() {
  const { data: { session } } = await _supabase.auth.getSession();
  S.user = session?.user || null;
  
  if (S.user) {
    if($('#loginBtn')) $('#loginBtn').style.display = 'none';
    if($('#userProfile')) $('#userProfile').style.display = 'flex';
    if($('#myOrdersBtn')) $('#myOrdersBtn').style.display = 'block';
    if($('#adminBtn')) $('#adminBtn').style.display = isAdmin() ? 'block' : 'none';
    
    const av = S.user.user_metadata?.avatar_url;
    if ($('#userAvatar') && av) $('#userAvatar').src = av;

    const { data } = await _supabase.from('profiles').select('id,balance').eq('id', S.user.id).maybeSingle();
    S.profile = data;
    if ($('#userBalance')) $('#userBalance').textContent = Number(data?.balance || 0).toFixed(2);
  } else {
    if($('#loginBtn')) $('#loginBtn').style.display = 'block';
    if($('#userProfile')) $('#userProfile').style.display = 'none';
    if($('#myOrdersBtn')) $('#myOrdersBtn').style.display = 'none';
    if($('#adminBtn')) $('#adminBtn').style.display = 'none';
  }
  load();
}

// ЗАГРУЗКА
async function load() {
  const [prodRes, setRes, slidesRes] = await Promise.all([
    _supabase.from('products').select('*'),
    _supabase.from('site_settings').select('*'),
    _supabase.from('slides').select('*')
  ]);
  
  S.products = prodRes.data || [];
  const dur = setRes.data?.find(x => x.key === 'slider_duration');
  if (dur) S.duration = parseInt(dur.value) || 5000;

  renderAll();
  initSlider(slidesRes.data || []);
}

const imgSrc = p => p?.image_url || PH;

// КАРТОЧКА
const card = p => {
  const stock = p.stock || 0;
  return `<article class="card" data-id="${esc(p.id)}">
    ${p.featured ? '<span class="badge-popular">🔥 ХИТ</span>' : ''}
    <button class="card-media" data-act="detail"><img src="${esc(imgSrc(p))}" loading="lazy"></button>
    <div class="card-body">
      <span class="tag">${esc(p.category)}</span>
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.description)}</p>
      <div class="stock-info ${stock < 5 ? 'stock-low' : ''}">В наличии: ${stock} шт.</div>
      <div class="card-foot">
        <strong>${fmt(p.price)}</strong>
        <button class="btn btn-primary sm" data-act="add" ${stock > 0 ? '' : 'disabled'}>${stock > 0 ? 'В корзину' : 'Нет'}</button>
      </div>
    </div>
  </article>`;
};

function renderAll() {
  const L = S.products.filter(p => p.active !== false);
  const q = S.q.toLowerCase();
  const list = L.filter(p => (S.cat === 'All' || p.category === S.cat) && (!q || (p.name + ' ' + p.description).toLowerCase().includes(q)));
  if ($('#grid')) $('#grid').innerHTML = list.length ? list.map(card).join('') : `<div class="state"><p>Ничего не найдено</p></div>`;
  
  // Категории
  const cats = ['All', ...new Set([...CATS, ...L.map(p => p.category)])].filter(c => c === 'All' || L.some(p => p.category === c));
  if ($('#chips')) $('#chips').innerHTML = cats.map(c => `<button data-act="cat" data-cat="${esc(c)}" aria-pressed="${S.cat === c}">${c === 'All' ? 'Все' : esc(c)}</button>`).join('');
  setTimeout(updateChipsSlider, 50);
  
  renderCart();
  if ($('#editor')?.open) renderAdmin();
}

// КОРЗИНА
const find = id => S.products.find(p => String(p.id) === String(id));
const lines = () => S.cart.map(c => ({ p: find(c.id), qty: c.qty })).filter(l => l.p);

function renderCart() {
  const L = lines(), n = L.reduce((a, l) => a + l.qty, 0), t = L.reduce((a, l) => a + l.qty * l.p.price, 0);
  if ($('#badge')) $('#badge').textContent = n;
  if ($('#total')) $('#total').textContent = fmt(t);
  if ($('#lines')) $('#lines').innerHTML = L.length ? L.map(({p, qty}) => `
    <li data-id="${esc(p.id)}"><img src="${esc(imgSrc(p))}"><div><strong>${esc(p.name)}</strong><small>${fmt(p.price)}</small><div class="qty"><button data-act="dec">−</button><span>${qty}</span><button data-act="inc">+</button></div></div><button class="link" data-act="rm">Удалить</button></li>
  `).join('') : '<li style="text-align:center;padding:20px;">Корзина пуста</li>';
  if ($('#checkoutBtn')) $('#checkoutBtn').disabled = $('#clearBtn').disabled = !L.length;
}

function setQty(id, delta) {
  const key = String(id), p = find(key);
  if (!p) return;
  const stock = Math.max(0, Math.floor(Number(p.stock) || 0));
  const current = S.cart.find(item => String(item.id) === key);
  const cq = current ? Math.max(0, Math.floor(Number(current.qty) || 0)) : 0;
  const nq = delta > 0 ? Math.min(50, stock, cq + delta) : Math.max(0, cq + delta);

  if (delta > 0 && nq === cq) { toast(stock < 1 ? 'Товар закончился.' : 'Больше нет.'); return; }
  if (nq <= 0) S.cart = S.cart.filter(item => String(item.id) !== key);
  else if (current) current.qty = nq;
  else S.cart.push({ id: key, qty: nq });
  
  saveCart(); renderCart();
}

// ОФОРМЛЕНИЕ
$('#checkoutBtn')?.addEventListener('click', async () => {
  if (!S.user) return $('#auth').showModal();
  const btn = $('#checkoutBtn');
  btn.disabled = true; btn.textContent = 'Оформление...';

  try {
    const { data: orderId, error } = await _supabase.rpc('checkout_order', {
      cart_items: S.cart.map(c => ({ id: c.id, qty: c.qty }))
    });
    if (error) throw error;

    S.cart = []; saveCart(); renderCart();
    closeDlg($('#drawer'));
    toast('Заказ оформлен! Ожидайте QR-код.');
    await checkAuth(); 
    await _supabase.functions.invoke('notify-telegram', { body: { orderId } }).catch(console.error);
    
    setTimeout(() => $('#myOrdersBtn')?.click(), 1000);
  } catch (error) {
    alert('Ошибка: ' + error.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Оформить заказ';
  }
});

// ЗАКАЗЫ (С ПЕРЕВОРОТОМ И ТАЙМЕРОМ)
$('#myOrdersBtn')?.addEventListener('click', () => {
  $('#orders').showModal();
  loadOrders();
});

async function loadOrders() {
  const { data, error } = await _supabase.from('orders').select('*').eq('user_id', S.user.id).order('created_at', { ascending: false });
  if (error || !data || !data.length) {
    $('#ordersList').innerHTML = '<div style="text-align:center;">У вас пока нет заказов.</div>';
    return;
  }

  $('#ordersList').innerHTML = data.map(o => {
    let sc = o.status === 'pending' ? 'status-pending' : o.status === 'ready' ? 'status-ready' : 'status-completed';
    let st = o.status === 'pending' ? 'Ожидает' : o.status === 'ready' ? 'Готов' : 'Выполнен';
    
    if (o.qr_code_url) {
      return `<div class="flip-card" onclick="this.classList.toggle('flipped')">
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <div class="order-header" style="width:100%"><span>Заказ #${o.id.slice(0,6).toUpperCase()}</span><span class="order-status ${sc}">${st}</span></div>
            <h3 style="margin:20px 0; color:var(--accent)">Нажмите, чтобы увидеть QR</h3>
            <strong>Сумма: ${fmt(o.total)}</strong>
          </div>
          <div class="flip-card-back">
            <img src="${o.qr_code_url}" class="qr-image">
            <div class="timer-badge" id="timer-${o.id}">Загрузка...</div>
          </div>
        </div>
      </div>`;
    }
    return `<div class="order-card">
      <div class="order-header"><span>Заказ #${o.id.slice(0,6).toUpperCase()}</span><span class="order-status ${sc}">${st}</span></div>
      <div style="font-weight:bold; margin-top:5px;">Сумма: ${fmt(o.total)}</div>
      ${o.status === 'pending' ? '<p style="font-size:0.8rem; color:orange; margin-top:5px;">Ждем подтверждения оператора...</p>' : ''}
    </div>`;
  }).join('');

  data.forEach(o => {
    if (o.qr_code_url && o.qr_expires_at) startTimer(o.id, o.qr_expires_at);
  });
}

function startTimer(id, expires) {
  if (orderTimers[id]) clearInterval(orderTimers[id]);
  const el = $(`#timer-${id}`);
  if (!el) return;

  const tick = () => {
    const diff = new Date(expires).getTime() - Date.now();
    if (diff <= 0) {
      el.textContent = 'Истек'; el.classList.remove('active');
      clearInterval(orderTimers[id]);
    } else {
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      el.textContent = `Осталось: ${m}:${s < 10 ? '0' : ''}${s}`;
      el.classList.add('active');
    }
  };
  tick();
  orderTimers[id] = setInterval(tick, 1000);
}

// РЕАЛТАЙМ
_supabase.channel('orders-rt')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
    if (S.user && payload.new.user_id === S.user.id && $('#orders').open) {
      loadOrders();
    }
  }).subscribe();

// СЛАЙДЕР
function initSlider(slides) {
  const c = $('#showcaseSlider');
  if (!c) return;
  const src = slides.length ? slides : [{title:'Добро пожаловать', description:'Подборка', image_url:'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200'}];
  c.innerHTML = src.map((s, i) => `<div class="slide ${i===0?'active':''}"><img src="${esc(s.image_url)}"><div class="slide-content"><h2>${esc(s.title)}</h2><p>${esc(s.description||'')}</p></div></div>`).join('');
  if (src.length < 2) return;
  let curr = 0;
  setInterval(() => {
    const el = $$('.slide', c);
    el[curr].classList.remove('active');
    curr = (curr + 1) % el.length;
    el[curr].classList.add('active');
  }, S.duration);
}

// АДМИНКА
function renderAdmin() {
  $('#adminList').innerHTML = S.products.map(p => `<li><img src="${esc(imgSrc(p))}"><div class="info"><strong>${esc(p.name)}</strong><small>${fmt(p.price)} · Ост: ${p.stock||0}</small></div><div class="acts"><button class="btn btn-ghost sm" data-act="edit" data-id="${p.id}">Ред.</button><button class="btn btn-ghost sm" data-act="del" data-id="${p.id}">Удал.</button></div></li>`).join('');
}

function setDraft(p) {
  S.draft = p ? {...p} : { id: Date.now().toString(), name: '', description: '', price: 0, category: 'Burgers', stock: 10, featured: false, image_url: '' };
  const f = $('#pform').elements, d = S.draft;
  f.pn.value = d.name; f.pd.value = d.description; f.pc.value = d.category; f.pp.value = d.price;
  f.pStock.value = d.stock; f.pFeatured.checked = d.featured; f.pf.value = '';
  $('#formMsg').textContent = '';
}

$('#pform')?.addEventListener('submit', async e => {
  e.preventDefault();
  const f = $('#pform').elements;
  const name = f.pn.value.trim(), cat = f.pc.value.trim(), price = Number(f.pp.value), stock = Number(f.pStock.value);
  if (!name || !cat) return $('#formMsg').textContent = 'Заполните поля';
  
  $('#formMsg').textContent = 'Сохранение...';
  try {
    let img = S.draft.image_url;
    if (f.pf.files[0]) {
      const ext = f.pf.files[0].name.split('.').pop();
      const path = `products/${crypto.randomUUID()}.${ext}`;
      await _supabase.storage.from(BUCKET).upload(path, f.pf.files[0]);
      img = _supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }
    const payload = { name, category: cat, price, stock, featured: f.pFeatured.checked, description: f.pd.value.trim(), image_url: img };
    
    if (S.products.some(p => String(p.id) === String(S.draft.id))) await _supabase.from('products').update(payload).eq('id', S.draft.id);
    else await _supabase.from('products').insert(payload);
    
    await load(); closeDlg($('#editor')); toast('Сохранено');
  } catch (err) { $('#formMsg').textContent = 'Ошибка: ' + err.message; }
});

// ДЕЙСТВИЯ
const A = {
  add: id => { const p = find(id); if(p) { setQty(id, 1); toast('Добавлен'); } },
  inc: id => setQty(id, 1), dec: id => setQty(id, -1),
  rm: id => { S.cart = S.cart.filter(c => String(c.id) !== String(id)); saveCart(); renderCart(); },
  clear: () => { S.cart = []; saveCart(); renderCart(); toast('Корзина очищена'); },
  manage: () => { if(!isAdmin()) return toast('Нет прав'); $('#editor').showModal(); setDraft(null); renderAdmin(); },
  auth: () => $('#auth').showModal(),
  close: (_, b) => closeDlg(b.closest('dialog')),
  cat: (_, b) => { S.cat = b.dataset.cat; renderAll(); },
  theme: (_, b) => { localStorage.setItem('pdd.theme', b.dataset.v); applyTheme(); },
  new: () => setDraft(null),
  edit: id => setDraft(find(id)),
  del: async id => { if(!isAdmin()) return; if(!confirm('Удалить?')) return; await _supabase.from('products').delete().eq('id', id); S.products = S.products.filter(x => x.id !== id); renderAll(); toast('Удален'); }
};

A['cart-open'] = () => { renderCart(); $('#drawer').showModal(); };
A.detail = id => { const p = find(id); if(!p) return; $('#detailBody').innerHTML = `<img src="${esc(imgSrc(p))}" style="border-radius:12px;margin-bottom:10px"><h2>${esc(p.name)}</h2><p>${esc(p.description)}</p><div class="card-foot"><strong>${fmt(p.price)}</strong><button class="btn btn-primary" data-act="add" data-id="${p.id}">В корзину</button></div>`; $('#detail').showModal(); };

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b) { if (e.target.matches('dialog')) closeDlg(e.target); return; }
  A[b.dataset.act]?.(b.closest('[data-id]')?.dataset.id, b);
});

$('#q')?.addEventListener('input', e => { S.q = e.target.value.trim(); renderAll(); });
$('#topupBtn')?.addEventListener('click', () => $('#topup').showModal());

function closeDlg(d) { if(!d || !d.open) return; d.close(); }
function toast(m) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; $('#toasts').append(t); setTimeout(() => t.remove(), 3000); }
function updateChipsSlider() { const a = $('#chips button[aria-pressed="true"]'), s = $('#chipsSlider'); if(a && s) { s.style.width = a.offsetWidth+'px'; s.style.transform = `translateX(${a.offsetLeft}px)`; } }
function applyTheme() { const t = localStorage.getItem('pdd.theme') || 'system'; document.documentElement.dataset.theme = t === 'system' ? (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light') : t; $$('.seg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === t)); }

// АВТОРИЗАЦИЯ
$('#authForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('#emailInput').value, pass = $('#passInput').value;
  const { error } = await _supabase.auth.signInWithPassword({ email, password: pass });
  if (error) return $('#authMsg').textContent = 'Ошибка: ' + error.message;
  closeDlg($('#auth')); checkAuth();
});

$('#signUpBtn')?.addEventListener('click', async () => {
  const email = $('#emailInput').value, pass = $('#passInput').value;
  const { data, error } = await _supabase.auth.signUp({ email, password: pass });
  if (error) return $('#authMsg').textContent = 'Ошибка: ' + error.message;
  if (data.user) { closeDlg($('#auth')); checkAuth(); }
});

$('#googleLoginBtn')?.addEventListener('click', () => {
  _supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
});

$('#logoutBtn')?.addEventListener('click', async () => { await _supabase.auth.signOut(); location.reload(); });

// ПОПОЛНЕНИЕ
$('#topupForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('#topupMsg'), btn = $('#topupForm button[type="submit"]');
  try {
    if (!S.user) throw new Error('Войдите в аккаунт.');
    const file = $('#topupFile').files[0], amt = Number($('#topupAmount').value);
    if (amt < 1 || amt > 100) throw new Error('Сумма от 1 до 100 AZN.');
    if (!file) throw new Error('Прикрепите чек.');

    msg.textContent = 'Отправка...'; btn.disabled = true;
    
    const body = new FormData();
    body.append('amount', String(amt));
    body.append('file', file);
    body.append('requestId', crypto.randomUUID());
    body.append('userId', S.user.id);

    const { data, error } = await _supabase.functions.invoke('submit-topup', { body });
    if (error) throw error;
    if (!data?.ok) throw new Error('Ошибка сервера.');

    msg.textContent = 'Отправлено!'; msg.style.color = 'green';
    $('#topupForm').reset();
    setTimeout(() => closeDlg($('#topup')), 2000);
  } catch (err) {
    msg.textContent = err.message; msg.style.color = 'red';
  } finally { btn.disabled = false; }
});

applyTheme(); checkAuth();
$('#categoryOptions').innerHTML = CATS.map(c => `<option value="${c}">`).join('');
