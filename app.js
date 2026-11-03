// ТВОИ КЛЮЧИ (Я ИХ УЖЕ ВСТАВИЛ)
const SUPABASE_URL = 'https://wjlkztgmbqaflcdldapi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DpbANPkD124VOGD3JkS7AA_pd2n_Ong';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>(Number(n)||0).toFixed(2)+' AZN',PH='assets/icons/placeholder.svg';
const S={products:[],cart:[],cat:'All',q:'',user:null,profile:null,draft:null};

// 1. АВТОРИЗАЦИЯ
async function checkAuth() {
  const { data: { session } } = await _supabase.auth.getSession();
  if (session) {
    S.user = session.user;
    $('#loginBtn').style.display = 'none';
    $('#userProfile').style.display = 'flex';
    
    const { data } = await _supabase.from('profiles').select('*').eq('id', S.user.id).single();
    if (data) {
      S.profile = data;
      $('#userBalance').textContent = data.balance.toFixed(2);
      if (data.role === 'admin') $('#adminBtn').style.display = 'block';
    }
  } else {
    S.user = null; S.profile = null;
    $('#loginBtn').style.display = 'block';
    $('#userProfile').style.display = 'none';
    $('#adminBtn').style.display = 'none';
  }
  loadData();
}

$('#authForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('#emailInput').value, pass = $('#passInput').value;
  const { error } = await _supabase.auth.signInWithPassword({ email, password: pass });
  if (error) {
    const { error: regErr } = await _supabase.auth.signUp({ email, password: pass });
    if (regErr) return alert(regErr.message);
    await _supabase.auth.signInWithPassword({ email, password: pass });
  }
  $('#auth').close();
  checkAuth();
});

$('#logoutBtn').addEventListener('click', async () => { await _supabase.auth.signOut(); location.reload(); });

// 2. ЗАГРУЗКА ДАННЫХ
async function loadData() {
  // Слайдер
  const { data: slides } = await _supabase.from('slides').select('*');
  const slider = $('#showcaseSlider');
  if (slides && slides.length > 0) {
    slider.innerHTML = slides.map((s, i) => `<div class="slide ${i===0?'active':''}"><img src="${s.image_url}"><div class="slide-content"><h2>${s.title}</h2><p>${s.description}</p></div></div>`).join('');
    let c = 0; setInterval(() => { const el = $$('.slide'); if(el.length < 2) return; el[c].classList.remove('active'); c = (c+1)%el.length; el[c].classList.add('active'); }, 3000);
  } else {
    slider.innerHTML = `<div class="slide active"><img src="https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200"><div class="slide-content"><h2>Добро пожаловать в Stackd</h2></div></div>`;
  }

  // Товары
  const { data: prods } = await _supabase.from('products').select('*');
  S.products = prods || [];
  renderAll();
}

// 3. ОТРИСОВКА
const card=p=>`<article class="card" data-id="${esc(p.id)}"><button class="card-media" data-act="detail"><img src="${esc(p.image_url || PH)}" alt=""></button><div class="card-body"><span class="tag">${esc(p.category||'Меню')}</span><h3>${esc(p.name)}</h3><p>${esc(p.description||'')}</p><div class="card-foot"><strong>${fmt(p.price)}</strong><button class="btn btn-primary sm" data-act="add">В корзину</button></div></div></article>`;

function renderAll(){
  $('#grid').innerHTML = S.products.length ? S.products.map(card).join('') : `<div class="state"><p>Товаров пока нет. Добавьте их в админке.</p></div>`;
  renderCart();
}

const find=id=>S.products.find(p=>p.id===id);

// 4. КОРЗИНА
const lines=()=>S.cart.map(c=>({p:find(c.id),qty:c.qty})).filter(l=>l.p);
function renderCart(){
  const L=lines(),n=L.reduce((a,l)=>a+l.qty,0),t=L.reduce((a,l)=>a+l.qty*l.p.price,0);
  $('#badge').textContent=n;$('#total').textContent=fmt(t);
  $('#lines').innerHTML=L.length?L.map(({p,qty})=>`<li data-id="${esc(p.id)}"><img src="${esc(p.image_url || PH)}" alt=""><div><strong>${esc(p.name)}</strong><small>${fmt(p.price)}</small><div class="qty"><button data-act="dec">−</button><span>${qty}</span><button data-act="inc">+</button></div></div><button class="link" data-act="rm">Удалить</button></li>`).join(''):'<li style="display:block;padding:20px;text-align:center;">Корзина пуста</li>';
  $('#checkoutBtn').disabled=$('#clearBtn').disabled=!L.length;
}
function bump(){const b=$('#badge');b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}
function setQty(id,d){const c=S.cart.find(x=>x.id===id);if(c){c.qty+=d;if(c.qty<=0)S.cart=S.cart.filter(x=>x!==c)}else if(d>0)S.cart.push({id,qty:1});renderCart();bump()}

// 5. ПОПОЛНЕНИЕ
$('#balanceBtn').addEventListener('click', () => $('#topup').showModal());

$('#topupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = $('#topupFile').files[0], amount = parseFloat($('#topupAmount').value);
  $('#topupMsg').textContent = 'Загрузка чека...';
  
  const fileName = `check_${S.user.id}_${Date.now()}.jpg`;
  const { error: uploadError } = await _supabase.storage.from('images').upload(fileName, file);
  if (uploadError) return $('#topupMsg').textContent = 'Ошибка загрузки фото';

  const { data: { publicUrl } } = _supabase.storage.from('images').getPublicUrl(fileName);

  await _supabase.from('topups').insert({ user_id: S.user.id, amount: amount, screenshot_url: publicUrl });
  
  $('#topupMsg').textContent = 'Чек отправлен! Ожидайте проверки.';
  setTimeout(() => closeDlg($('#topup')), 2000);
});

// 6. АДМИНКА
$('#adminBtn').addEventListener('click', () => { renderAdmin(); $('#editor').showModal(); });
function renderAdmin(){
  $('#adminList').innerHTML = S.products.map(p => `<li><img src="${esc(p.image_url || PH)}"><div><strong>${esc(p.name)}</strong><br><small>${fmt(p.price)}</small></div><button class="btn btn-ghost sm" onclick="deleteProd('${p.id}')" style="color:red;">Удал.</button></li>`).join('');
}

window.deleteProd = async (id) => {
  if(!confirm('Удалить товар?')) return;
  await _supabase.from('products').delete().eq('id', id);
  await loadData(); renderAdmin();
};

$('#pform').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = $('#pf').files[0];
  if(!file) return alert('Выбери картинку!');
  
  $('#formMsg').textContent = 'Загрузка...';
  const fileName = `prod_${Date.now()}.jpg`;
  
  const { error } = await _supabase.storage.from('images').upload(fileName, file);
  if (error) return $('#formMsg').textContent = 'Ошибка загрузки фото';

  const { data: { publicUrl } } = _supabase.storage.from('images').getPublicUrl(fileName);

  await _supabase.from('products').insert({
    name: $('#pn').value,
    description: $('#pd').value,
    category: $('#pc').value,
    price: parseFloat($('#pp').value),
    image_url: publicUrl
  });
  
  $('#formMsg').textContent = '';
  $('#pform').reset();
  await loadData();
  renderAdmin();
  alert('Товар добавлен в облако!');
});

// 7. ОКНА
const reduce=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
function closeDlg(d){if(!d.open)return; d.classList.add('closing'); d.style.pointerEvents='none'; setTimeout(()=>{d.close();d.classList.remove('closing');d.style.pointerEvents='';},250);}

const A={
  add:id=>{const p=find(id);if(p){setQty(id,1);toast(p.name+' добавлен')}},
  inc:id=>setQty(id,1),dec:id=>setQty(id,-1),
  rm:id=>{S.cart=S.cart.filter(c=>c.id!==id);renderCart();bump()},
  clear:()=>{S.cart=[];renderCart()},
  checkout:()=>{ 
    if(!S.user) return $('#auth').showModal();
    const total = S.cart.reduce((a, c) => a + (c.p.price * c.qty), 0);
    if(S.profile.balance < total) return alert('Недостаточно средств! Пополните баланс.');
    alert('Заказ оформлен! Перенаправление в бота...');
  },
  detail:id=>{
    const p=find(id); if(!p) return;
    $('#detailBody').innerHTML=`<div class="detail"><img src="${esc(p.image_url||PH)}"><h2>${esc(p.name)}</h2><p>${esc(p.description||'')}</p><div class="card-foot"><strong>${fmt(p.price)}</strong><button class="btn btn-primary" data-act="add" data-id="${p.id}">В корзину</button></div></div>`;
    $('#detail').showModal();
  },
  'cart-open':()=>$('#drawer').showModal(),
  auth:()=>$('#auth').showModal(),
  'toggle-lang':()=>$('#langDropdown').classList.toggle('active'),
  close:(_,b)=>closeDlg(b.closest('dialog')),
  theme:(_,b)=>{localStorage.setItem('pdd.theme',b.dataset.v);applyTheme()}
};

document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');
  if(!b){if(e.target.matches('dialog'))closeDlg(e.target);return}
  A[b.dataset.act]?.(b.closest('[data-id]')?.dataset.id,b);
});

// Темы
function applyTheme(){
  const t=localStorage.getItem('pdd.theme')||'system';
  document.documentElement.dataset.theme=t==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):t;
}

function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;$('#toasts').append(t);setTimeout(()=>{t.style.opacity='0';t.style.transform='translateY(10px)';setTimeout(()=>t.remove(),300)},2400)}

// Старт
checkAuth();
