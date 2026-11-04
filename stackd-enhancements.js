/* Stackd enhancements. Loaded after the existing app.js. */
(() => {
  'use strict';

  const VERSION = '1.1.0';
  const languageNames = { ru: 'Русский', en: 'English', az: 'Azərbaycan' };
  const copy = {
    ru: {
      inStock: 'В наличии', outStock: 'Нет в наличии', unlimited: 'Без ограничения',
      added: 'добавлен в корзину', stockSaved: 'Остаток сохранён', source: 'Язык исходного товара',
      translateAll: 'Перевести каталог', translating: 'Перевод каталога', translated: 'Каталог переведён',
      translateFailed: 'Не удалось перевести. Проверьте лимит сервиса перевода.',
      hero: 'Первый экран', heroImage: 'Фото первого экрана', heroFit: 'Заполнение фото', heroPosition: 'Положение фото',
      heroHeight: 'Высота, px', heroRatio: 'Соотношение сторон', cover: 'Заполнить', contain: 'Показать целиком',
      center: 'По центру', top: 'Сверху', bottom: 'Снизу', save: 'Сохранить настройки',
      guideTitle: 'Перед покупкой', guide1: 'Проверьте состав, цену и количество выбранных товаров.',
      guide2: 'Количество можно изменить кнопками «+» и «−» прямо в карточке или корзине.',
      guide3: 'Заказ отправляется оператору. QR-код появится в разделе «Мои заказы» после подтверждения.',
      swipe: 'Проведите, чтобы оформить заказ', preparing: 'Готовим заказ',
      preparingText: 'Отправляем заказ оператору. QR-код появится в «Моих заказах» после подтверждения.',
      swipeAgain: 'Сдвиньте ползунок до конца', rateLimited: 'Слишком много запросов. Попробуйте немного позже.',
      stockError: 'Количество должно быть целым числом от 0 и выше.',
      unlimitedNote: 'Оставьте пустым, если ограничение остатка не требуется.',
      sourceHelp: 'Укажите язык, на котором написаны название и описание.',
      imageHelp: 'JPG, PNG или WebP. Максимум 5 МБ.'
    },
    en: {
      inStock: 'In stock', outStock: 'Out of stock', unlimited: 'Unlimited',
      added: 'added to cart', stockSaved: 'Stock saved', source: 'Product source language',
      translateAll: 'Translate catalog', translating: 'Translating catalog', translated: 'Catalog translated',
      translateFailed: 'Translation failed. Check the translation service quota.',
      hero: 'Hero section', heroImage: 'Hero image', heroFit: 'Image fit', heroPosition: 'Image position',
      heroHeight: 'Height, px', heroRatio: 'Aspect ratio', cover: 'Cover', contain: 'Contain',
      center: 'Center', top: 'Top', bottom: 'Bottom', save: 'Save settings',
      guideTitle: 'Before you order', guide1: 'Check item details, prices and selected quantities.',
      guide2: 'Change quantities with the “+” and “−” controls on product cards or in the cart.',
      guide3: 'Your order is sent to an operator. The QR code appears in “My orders” after confirmation.',
      swipe: 'Swipe to place your order', preparing: 'Preparing your order',
      preparingText: 'Sending the order to the operator. The QR code will appear in “My orders” after confirmation.',
      swipeAgain: 'Move the slider all the way', rateLimited: 'Too many requests. Please try again shortly.',
      stockError: 'Stock must be a whole number equal to or greater than zero.',
      unlimitedNote: 'Leave empty when stock is not limited.',
      sourceHelp: 'Choose the language used for the product name and description.',
      imageHelp: 'JPG, PNG or WebP. Maximum 5 MB.'
    },
    az: {
      inStock: 'Stokda var', outStock: 'Stokda yoxdur', unlimited: 'Limitsiz',
      added: 'səbətə əlavə edildi', stockSaved: 'Stok saxlanıldı', source: 'Məhsulun ilkin dili',
      translateAll: 'Kataloqu tərcümə et', translating: 'Kataloq tərcümə olunur', translated: 'Kataloq tərcümə edildi',
      translateFailed: 'Tərcümə alınmadı. Tərcümə xidmətinin limitini yoxlayın.',
      hero: 'Ana ekran', heroImage: 'Ana ekran şəkli', heroFit: 'Şəklin yerləşməsi', heroPosition: 'Şəklin mövqeyi',
      heroHeight: 'Hündürlük, px', heroRatio: 'Tərəflərin nisbəti', cover: 'Doldur', contain: 'Tam göstər',
      center: 'Mərkəz', top: 'Yuxarı', bottom: 'Aşağı', save: 'Ayarları saxla',
      guideTitle: 'Sifarişdən əvvəl', guide1: 'Məhsulun tərkibini, qiymətini və sayını yoxlayın.',
      guide2: 'Miqdarı məhsul kartında və ya səbətdə «+» və «−» düymələri ilə dəyişin.',
      guide3: 'Sifariş operatora göndərilir. Təsdiqdən sonra QR kod «Sifarişlərim» bölməsində görünəcək.',
      swipe: 'Sifariş üçün sürüşdürün', preparing: 'Sifariş hazırlanır',
      preparingText: 'Sifariş operatora göndərilir. Təsdiqdən sonra QR kod «Sifarişlərim» bölməsində görünəcək.',
      swipeAgain: 'Sürüşdürməni sona qədər aparın', rateLimited: 'Sorğular çoxdur. Bir az sonra yenidən cəhd edin.',
      stockError: 'Stok 0 və ya daha böyük tam ədəd olmalıdır.',
      unlimitedNote: 'Stok məhdudiyyəti yoxdursa, sahəni boş saxlayın.',
      sourceHelp: 'Məhsulun adı və təsvirinin yazıldığı dili seçin.',
      imageHelp: 'JPG, PNG və ya WebP. Maksimum 5 MB.'
    }
  };
  const t = key => copy[S.lang]?.[key] || copy.ru[key] || key;
  const lang = () => ['ru', 'en', 'az'].includes(S.lang) ? S.lang : 'ru';
  const stockValue = p => p?.stock === '' || p?.stock === undefined ? null : p?.stock == null ? null : Math.max(0, Math.floor(Number(p.stock) || 0));
  const quantity = id => Number(S.cart.find(x => String(x.id) === String(id))?.qty || 0);
  const baseCard = card;
  const baseRenderAll = renderAll;
  const baseRenderCart = renderCart;
  const baseOpenDetail = openDetail;
  const baseLoad = load;
  const baseSetDraft = setDraft;
  const baseReadForm = readForm;
  const baseInitSlider = initSlider;
  const baseLoadSettings = loadSettings;
  let hero = { hero_image_url: '', hero_fit: 'cover', hero_position: 'center', hero_height: '400', hero_ratio: 'auto', hero_title: '', hero_subtitle: '' };
  let translationBusy = false;
  let rateFallback = new Map();

  function productText(product, selected = lang()) {
    const source = product.source_lang || 'ru';
    const translated = product.translations?.[selected];
    if (selected !== source && translated && typeof translated === 'object') {
      return { ...product, name: translated.name || product.name, description: translated.description || product.description, category: translated.category || product.category };
    }
    return product;
  }

  // The original renderer remains responsible for layout and cart state.
  renderAll = function stackdRenderAll() {
    const original = S.products;
    S.products = original.map(p => productText(p));
    try { return baseRenderAll(); }
    finally { S.products = original; }
  };

  renderCart = function stackdRenderCart() {
    const original = S.products;
    S.products = original.map(p => productText(p));
    try { return baseRenderCart(); }
    finally { S.products = original; }
  };

  openDetail = function stackdOpenDetail(id) {
    const original = S.products;
    S.products = original.map(p => productText(p));
    try { return baseOpenDetail(id); }
    finally { S.products = original; }
  };
  A.detail = openDetail;

  card = function stackdProductCard(p) {
    const qty = quantity(p.id);
    const stock = stockValue(p);
    const available = p.available !== false && (stock === null || stock > 0);
    const image = imgSrc(p);
    return `<article class="card ${available ? '' : 'is-out'}" data-id="${esc(p.id)}">
      ${p.featured ? `<span class="badge-popular">${S.lang === 'en' ? 'FEATURED' : S.lang === 'az' ? 'SEÇİLİB' : 'ХИТ'}</span>` : ''}
      <button class="card-media" type="button" data-act="detail" aria-label="${esc(p.name || 'Товар')}">
        <img src="${esc(image)}" alt="${esc(p.name || '')}" loading="lazy" decoding="async">
        <span class="stackd-arches" aria-label="McDonald’s"><svg viewBox="0 0 36 30" aria-hidden="true"><path d="M3 27C3 3 13 3 18 27C23 3 33 3 33 27" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      </button>
      <div class="card-body">
        <span class="tag">${esc(p.category || '')}</span>
        <h3>${esc(p.name || 'Товар')}</h3>
        <p>${esc(p.description || '')}</p>
        ${stock !== null ? `<span class="stock-info ${stock < 5 ? 'stock-low' : ''}">${stock > 0 ? `${stock} ${S.lang === 'en' ? 'left' : S.lang === 'az' ? 'ədəd qalıb' : 'шт. осталось'}` : esc(t('outStock'))}</span>` : ''}
        <div class="card-foot">
          <strong>${fmt(p.price)}</strong>
          <div class="stackd-card-actions">
            ${qty > 0 ? `<div class="stackd-card-qty" aria-label="${S.lang === 'en' ? 'Quantity' : S.lang === 'az' ? 'Miqdar' : 'Количество'}"><button type="button" data-act="dec" aria-label="−">−</button><span>${qty}</span><button type="button" data-act="inc" aria-label="+" ${stock !== null && qty >= stock ? 'disabled' : ''}>+</button></div>` : ''}
            <button class="btn btn-primary sm" type="button" data-act="add" ${available && (stock === null || qty < stock) ? '' : 'disabled'}>${available ? (qty > 0 ? (S.lang === 'en' ? 'Add one' : S.lang === 'az' ? 'Birini əlavə et' : 'Ещё один') : tr('add_to_cart')) : t('outStock')}</button>
          </div>
        </div>
      </div>
    </article>`;
  };

  load = async function stackdLoadWithStock() {
    S.catalogError = null;
    const [slideResult, productResult] = await Promise.all([
      _supabase.from('slides').select('image_url,title,description'),
      _supabase.from('products').select('id,name,description,category,price,image_url,stock,available,active,featured,translations,source_lang')
    ]);
    if (slideResult.error) { console.error('Slides load failed:', slideResult.error); initSlider([]); }
    else initSlider(slideResult.data || []);
    if (productResult.error) {
      console.error('Products load failed:', productResult.error);
      S.products = [];
      S.catalogError = S.lang === 'en' ? 'Could not load the catalog. Check connection and database policies.' : S.lang === 'az' ? 'Kataloqu yükləmək mümkün olmadı. Bağlantını və verilənlər bazası icazələrini yoxlayın.' : 'Не удалось загрузить каталог. Проверьте подключение и права доступа.';
    } else S.products = Array.isArray(productResult.data) ? productResult.data : [];
    renderAll();
  };

  setDraft = function stackdSetDraft(product) {
    baseSetDraft(product);
    const stock = $('#stackdStock');
    if (stock) stock.value = product?.stock == null ? '' : String(product.stock);
    const active = $('#stackdActive');
    if (active) active.checked = product?.active !== false;
    const featured = $('#stackdFeatured');
    if (featured) featured.checked = product?.featured === true;
    const source = $('#stackdSourceLang');
    if (source) source.value = product?.source_lang || lang();
  };

  readForm = function stackdReadForm() {
    baseReadForm();
    const input = $('#stackdStock');
    const raw = input?.value.trim() ?? '';
    if (raw !== '' && (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)))) throw new Error(t('stockError'));
    S.draft.stock = raw === '' ? null : Number(raw);
    S.draft.available = S.draft.stock === null ? true : S.draft.stock > 0;
    S.draft.active = $('#stackdActive')?.checked !== false;
    S.draft.featured = $('#stackdFeatured')?.checked === true;
    S.draft.source_lang = $('#stackdSourceLang')?.value || lang();
  };

  function toastTop(message) {
    const host = $('#toasts');
    if (!host) { console.info(message); return; }
    host.setAttribute('popover', 'manual');
    const duplicate = [...host.children].find(x => x.textContent === String(message));
    if (duplicate) duplicate.remove();
    while (host.children.length >= 5) {
      const oldest = host.firstElementChild;
      oldest.classList.add('stackd-toast-out');
      oldest.remove();
    }
    const item = document.createElement('div');
    item.className = 'toast stackd-toast';
    item.setAttribute('role', 'status');
    item.textContent = String(message ?? '');
    host.append(item);
    try { if (!host.matches(':popover-open')) host.showPopover(); } catch {}
    const timer = setTimeout(() => {
      item.classList.add('stackd-toast-out');
      setTimeout(() => {
        item.remove();
        if (!host.children.length) { try { host.hidePopover(); } catch {} }
      }, 240);
    }, 3000);
    item.addEventListener('click', () => { clearTimeout(timer); item.classList.add('stackd-toast-out'); setTimeout(() => item.remove(), 240); });
  }
  toast = toastTop;

  function injectProductFields() {
    const form = $('#pform');
    if (!form || $('#stackdStock')) return;
    const imageLabel = form.querySelector('label[for="pf"]');
    const block = document.createElement('div');
    block.className = 'stackd-product-fields';
    block.innerHTML = `
      <div class="stackd-field"><label for="stackdStock">${S.lang === 'en' ? 'Stock quantity' : S.lang === 'az' ? 'Stok miqdarı' : 'Количество в наличии'}</label><input id="stackdStock" type="number" min="0" step="1" inputmode="numeric" placeholder="${esc(t('unlimited'))}"><small>${esc(t('unlimitedNote'))}</small></div>
      <div class="stackd-checks"><label><input id="stackdActive" type="checkbox" checked> ${S.lang === 'en' ? 'Show product in catalog' : S.lang === 'az' ? 'Məhsulu kataloqda göstər' : 'Показывать товар в каталоге'}</label><label><input id="stackdFeatured" type="checkbox"> ${S.lang === 'en' ? 'Featured product' : S.lang === 'az' ? 'Seçilmiş məhsul' : 'Отметить как популярный'}</label></div>
      <div class="stackd-field"><label for="stackdSourceLang">${esc(t('source'))}</label><select id="stackdSourceLang"><option value="ru">Русский</option><option value="en">English</option><option value="az">Azərbaycan</option></select><small>${esc(t('sourceHelp'))}</small></div>`;
    if (imageLabel) imageLabel.before(block); else form.append(block);
    const adminToolbar = form.parentElement?.querySelector('.row');
    if (adminToolbar && !$('#stackdTranslateAll')) {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.id = 'stackdTranslateAll'; btn.className = 'btn btn-ghost sm'; btn.textContent = t('translateAll');
      btn.addEventListener('click', translateCatalog);
      adminToolbar.append(btn);
    }
    const stockHead = $('#adminList')?.parentElement?.querySelector('.row');
    if (stockHead && !$('#stackdStockHint')) {
      const hint = document.createElement('p'); hint.id = 'stackdStockHint'; hint.className = 'stackd-admin-note';
      hint.textContent = S.lang === 'en' ? 'Blank stock means unlimited. Set 0 to disable sales.' : S.lang === 'az' ? 'Boş stok limitsiz deməkdir. Satışı dayandırmaq üçün 0 yazın.' : 'Пустое поле означает неограниченный остаток. 0 отключает продажи.';
      stockHead.after(hint);
    }
  }

  async function saveProductWithExtras(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const msg = $('#formMsg');
    const submit = $('#pform button[type="submit"]');
    let uploadedPath = null;
    const previousImageUrl = S.draft?.image_url || S.draft?.image || '';
    try {
      if (!isAdmin()) throw new Error('Недостаточно прав.');
      readForm();
      const d = S.draft;
      const file = $('#pf')?.files?.[0];
      if (file) await validateProductImage(file);
      if (msg) { msg.textContent = S.lang === 'en' ? 'Saving…' : S.lang === 'az' ? 'Saxlanılır…' : 'Сохранение…'; msg.style.color = 'var(--muted)'; }
      if (submit) submit.disabled = true;
      let imageUrl = d.image_url || d.image || '';
      if (file) { const uploaded = await uploadProductImage(file); uploadedPath = uploaded.path; imageUrl = uploaded.url; }
      const payload = {
        name: d.name, description: d.description, category: d.category, price: d.price,
        image_url: imageUrl, stock: d.stock, available: d.available, active: d.active,
        featured: d.featured, source_lang: d.source_lang || 'ru', translations: d.translations || {}
      };
      const exists = S.products.some(p => String(p.id) === String(d.id));
      const result = exists
        ? await _supabase.from('products').update(payload).eq('id', d.id).select('id,name,description,category,price,image_url,stock,available,active,featured,translations,source_lang').maybeSingle()
        : await _supabase.from('products').insert(payload).select('id,name,description,category,price,image_url,stock,available,active,featured,translations,source_lang').single();
      if (result.error) throw result.error;
      if (!result.data) throw new Error('База данных не вернула сохранённый товар.');
      const oldPath = getProductStoragePath(previousImageUrl);
      if (oldPath && previousImageUrl !== imageUrl) await _supabase.storage.from(PRODUCT_BUCKET).remove([oldPath]);
      uploadedPath = null;
      clearProductPreviewObjectUrl();
      $('#pform').reset(); S.draft = null;
      await load(); renderAdmin(); toast(S.lang === 'en' ? 'Product saved.' : S.lang === 'az' ? 'Məhsul saxlanıldı.' : 'Товар сохранён.');
      // Automatic translation is best-effort; saving the product never depends on the translation API.
      translateOne(result.data).then(async translated => {
        if (translated) { await load(); toast(S.lang === 'en' ? 'Product translations are ready.' : S.lang === 'az' ? 'Məhsulun tərcüməsi hazırdır.' : 'Переводы товара готовы.'); }
      }).catch(error => { console.warn('Product translation skipped:', error); toast(t('translateFailed')); });
    } catch (error) {
      console.error('Stackd product save failed:', error);
      if (uploadedPath) await _supabase.storage.from(PRODUCT_BUCKET).remove([uploadedPath]);
      if (msg) { msg.textContent = error?.message || 'Не удалось сохранить товар.'; msg.style.color = 'var(--danger, #b42318)'; }
    } finally { if (submit) submit.disabled = false; }
  }

  async function rateLimit(action, limit, seconds) {
    const now = Date.now();
    const previous = rateFallback.get(action) || [];
    const live = previous.filter(ts => now - ts < seconds * 1000);
    if (live.length >= limit) { rateFallback.set(action, live); toast(t('rateLimited')); return false; }
    live.push(now); rateFallback.set(action, live);
    try {
      const { data, error } = await _supabase.rpc('stackd_rate_limit', {
        p_action: action, p_limit: limit, p_window_seconds: seconds
      });
      if (!error && data === false) { toast(t('rateLimited')); return false; }
      if (error) console.warn('Database rate limiter unavailable; local fallback remains active:', error.message);
    } catch (error) { console.warn('Rate-limit check failed:', error); }
    return true;
  }

  async function translateText(text, from, to) {
    const value = String(text || '').trim();
    if (!value || from === to) return value;
    const chunks = [];
    let chunk = '';
    for (const character of Array.from(value)) {
      if (chunk && new TextEncoder().encode(chunk + character).length > 430) {
        chunks.push(chunk);
        chunk = '';
      }
      chunk += character;
    }
    if (chunk) chunks.push(chunk);
    const results = [];
    for (const chunk of chunks) {
      const url = new URL('https://api.mymemory.translated.net/get');
      url.searchParams.set('q', chunk);
      url.searchParams.set('langpair', `${from}|${to}`);
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Translation service HTTP ${response.status}`);
      const data = await response.json();
      const translated = data?.responseData?.translatedText;
      if (!translated || Number(data?.responseStatus) >= 400) throw new Error(data?.responseDetails || 'Translation service rejected the request');
      results.push(translated.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"));
    }
    return results.join('');
  }

  async function translateOne(product) {
    if (!product?.id) return false;
    const from = ['ru', 'en', 'az'].includes(product.source_lang) ? product.source_lang : 'ru';
    const translations = { ...(product.translations || {}) };
    let changed = false;
    for (const to of ['ru', 'en', 'az']) {
      if (to === from || ['name', 'description', 'category'].every(key => typeof translations[to]?.[key] === 'string')) continue;
      const [name, description, category] = await Promise.all([
        translateText(product.name, from, to),
        translateText(product.description, from, to),
        translateText(product.category, from, to)
      ]);
      translations[to] = { name, description, category };
      changed = true;
    }
    if (!changed) return true;
    const { error } = await _supabase.from('products').update({ translations }).eq('id', product.id);
    if (error) throw error;
    return true;
  }

  async function translateCatalog() {
    if (translationBusy) return;
    if (!isAdmin()) { toast('Недостаточно прав.'); return; }
    translationBusy = true;
    const button = $('#stackdTranslateAll');
    const old = button?.textContent;
    if (button) { button.disabled = true; button.textContent = t('translating') + '…'; }
    let success = 0, failed = 0;
    try {
      const { data, error } = await _supabase.from('products').select('id,name,description,category,source_lang,translations');
      if (error) throw error;
      for (const product of data || []) {
        try { if (await translateOne(product)) success++; }
        catch (e) { failed++; console.warn('Translation failed for product', product.id, e); }
      }
      await load();
      toast(failed ? `${t('translated')}: ${success}. ${t('translateFailed')}` : `${t('translated')}: ${success}`);
    } catch (error) { console.error(error); toast(t('translateFailed')); }
    finally { translationBusy = false; if (button) { button.disabled = false; button.textContent = old || t('translateAll'); } }
  }

  function makeSettingsUI() {
    const tab = $('#tab-settings');
    if (!tab || $('#stackdHeroSettings')) return;
    const section = document.createElement('section');
    section.id = 'stackdHeroSettings'; section.className = 'stackd-settings-section';
    section.innerHTML = `
      <h3>${esc(t('hero'))}</h3>
      <label for="stackdHeroFile">${esc(t('heroImage'))}</label><input id="stackdHeroFile" type="file" accept="image/jpeg,image/png,image/webp">
      <div class="stackd-settings-grid">
        <div><label for="stackdHeroFit">${esc(t('heroFit'))}</label><select id="stackdHeroFit"><option value="cover">${esc(t('cover'))}</option><option value="contain">${esc(t('contain'))}</option></select></div>
        <div><label for="stackdHeroPosition">${esc(t('heroPosition'))}</label><select id="stackdHeroPosition"><option value="center">${esc(t('center'))}</option><option value="top">${esc(t('top'))}</option><option value="bottom">${esc(t('bottom'))}</option></select></div>
        <div><label for="stackdHeroHeight">${esc(t('heroHeight'))}</label><input id="stackdHeroHeight" type="number" min="180" max="760" step="10" value="400"></div>
        <div><label for="stackdHeroRatio">${esc(t('heroRatio'))}</label><select id="stackdHeroRatio"><option value="16 / 9">16:9</option><option value="21 / 9">21:9</option><option value="4 / 3">4:3</option><option value="auto">${S.lang === 'en' ? 'Natural height' : S.lang === 'az' ? 'Təbii hündürlük' : 'Автоматически'}</option></select></div>
      </div><p class="stackd-admin-note">${S.lang === 'en' ? 'The image is uploaded to the existing product-images bucket.' : S.lang === 'az' ? 'Şəkil mövcud product-images anbarına yüklənir.' : 'Фото загружается в существующее хранилище product-images.'}</p>`;
    tab.append(section);
    $('#stackdHeroFit').value = hero.hero_fit;
    $('#stackdHeroPosition').value = hero.hero_position;
    $('#stackdHeroHeight').value = hero.hero_height;
    $('#stackdHeroRatio').value = hero.hero_ratio;
  }

  function updateHero() {
    const slider = $('#showcaseSlider');
    if (!slider) return;
    slider.style.height = hero.hero_ratio === 'auto' ? `${Math.min(760, Math.max(180, Number(hero.hero_height) || 400))}px` : 'auto';
    slider.style.aspectRatio = hero.hero_ratio === 'auto' ? 'auto' : hero.hero_ratio;
    const firstImage = slider.querySelector('.slide img');
    if (firstImage) {
      if (hero.hero_image_url) firstImage.src = safeImageUrl(hero.hero_image_url);
      firstImage.style.objectFit = hero.hero_fit || 'cover';
      firstImage.style.objectPosition = hero.hero_position || 'center';
    }
    const firstTitle = slider.querySelector('.slide .slide-content h2');
    const firstSubtitle = slider.querySelector('.slide .slide-content p');
    if (firstTitle && hero.hero_title) firstTitle.textContent = hero.hero_title;
    if (firstSubtitle && hero.hero_subtitle) firstSubtitle.textContent = hero.hero_subtitle;
  }

  initSlider = function stackdInitSlider(slides) { baseInitSlider(slides); updateHero(); };
  loadSettings = async function stackdLoadSettings() {
    await baseLoadSettings();
    const { data, error } = await _supabase.from('site_settings').select('key,value');
    if (error) { console.warn('Extended settings could not be loaded:', error); return; }
    for (const row of data || []) if (Object.hasOwn(hero, row.key)) hero[row.key] = row.value ?? hero[row.key];
    makeSettingsUI(); updateHero();
  };

  async function saveHeroSettings(event) {
    event.preventDefault(); event.stopImmediatePropagation();
    const button = $('#saveSettingsBtn');
    const message = $('#settingsMsg');
    if (!isAdmin()) { toast('Недостаточно прав.'); return; }
    if (button) button.disabled = true;
    try {
      let imageUrl = hero.hero_image_url || '';
      const file = $('#stackdHeroFile')?.files?.[0];
      if (file) { const uploaded = await uploadProductImage(file); imageUrl = uploaded.url; }
      const rows = [
        { key: 'hero_title', value: $('#settingHeroTitle')?.value.trim() || '' },
        { key: 'hero_subtitle', value: $('#settingHeroSub')?.value.trim() || '' },
        { key: 'hero_image_url', value: imageUrl },
        { key: 'hero_fit', value: $('#stackdHeroFit')?.value || 'cover' },
        { key: 'hero_position', value: $('#stackdHeroPosition')?.value || 'center' },
        { key: 'hero_height', value: $('#stackdHeroHeight')?.value || '400' },
        { key: 'hero_ratio', value: $('#stackdHeroRatio')?.value || '16 / 9' }
      ];
      const { error } = await _supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
      if (error) throw error;
      rows.forEach(row => { if (Object.hasOwn(hero, row.key)) hero[row.key] = row.value; });
      updateHero();
      if (message) { message.textContent = S.lang === 'en' ? 'Saved.' : S.lang === 'az' ? 'Saxlanıldı.' : 'Сохранено.'; message.style.color = 'var(--success, #287a46)'; }
      toast(tr('saved'));
    } catch (error) {
      console.error('Hero settings save failed:', error);
      if (message) { message.textContent = error.message || 'Не удалось сохранить настройки.'; message.style.color = 'var(--danger, #b42318)'; }
    } finally { if (button) button.disabled = false; }
  }

  function buildCartGuide() {
    const drawer = $('#drawer');
    if (!drawer || $('#stackdPurchaseGuide')) return;
    const list = $('#lines');
    const footer = drawer.querySelector('footer');
    const checkoutButton = $('#checkoutBtn');
    const guide = document.createElement('section');
    guide.id = 'stackdPurchaseGuide'; guide.className = 'stackd-purchase-guide';
    guide.innerHTML = `<strong>${esc(t('guideTitle'))}</strong><p>${esc(t('guide1'))}</p><p>${esc(t('guide2'))}</p><p>${esc(t('guide3'))}</p>`;
    if (list) list.before(guide);
    if (checkoutButton) checkoutButton.hidden = true;
    if (footer && !$('#stackdSwipe')) {
      const swipe = document.createElement('div');
      swipe.id = 'stackdSwipe'; swipe.className = 'stackd-swipe';
      swipe.innerHTML = `<div class="stackd-swipe-track"><span class="stackd-swipe-fill"></span><span class="stackd-swipe-label">${esc(t('swipe'))}</span><button type="button" class="stackd-swipe-thumb" aria-label="${esc(t('swipe'))}"><span></span></button></div><small class="stackd-swipe-hint" aria-live="polite"></small>`;
      footer.insertBefore(swipe, checkoutButton || footer.firstChild);
      bindSwipe(swipe);
    }
    if (footer && !$('#stackdPreparing')) {
      const state = document.createElement('div');
      state.id = 'stackdPreparing'; state.className = 'stackd-preparing'; state.hidden = true;
      state.innerHTML = `<span class="stackd-spinner" aria-hidden="true"></span><strong>${esc(t('preparing'))}</strong><p>${esc(t('preparingText'))}</p>`;
      footer.append(state);
    }
    renderGuideText();
  }

  function renderGuideText() {
    const guide = $('#stackdPurchaseGuide');
    if (guide) guide.innerHTML = `<strong>${esc(t('guideTitle'))}</strong><p>${esc(t('guide1'))}</p><p>${esc(t('guide2'))}</p><p>${esc(t('guide3'))}</p>`;
    const label = $('.stackd-swipe-label'); if (label) label.textContent = t('swipe');
    const state = $('#stackdPreparing');
    if (state) state.innerHTML = `<span class="stackd-spinner" aria-hidden="true"></span><strong>${esc(t('preparing'))}</strong><p>${esc(t('preparingText'))}</p>`;
  }

  function bindSwipe(swipe) {
    const track = swipe.querySelector('.stackd-swipe-track');
    const thumb = swipe.querySelector('.stackd-swipe-thumb');
    const fill = swipe.querySelector('.stackd-swipe-fill');
    const hint = swipe.querySelector('.stackd-swipe-hint');
    let dragging = false, startX = 0, offset = 0, max = 0, completed = false;
    const measure = () => { max = Math.max(0, track.clientWidth - thumb.offsetWidth - 8); };
    const paint = value => { offset = Math.max(0, Math.min(max, value)); thumb.style.transform = `translateX(${offset}px)`; fill.style.width = `${offset + thumb.offsetWidth / 2}px`; track.style.setProperty('--swipe-progress', String(max ? offset / max : 0)); };
    thumb.addEventListener('pointerdown', event => {
      if (completed || S.checkoutBusy) return;
      measure(); dragging = true; startX = event.clientX - offset;
      thumb.setPointerCapture?.(event.pointerId);
      track.classList.add('is-dragging');
    });
    thumb.addEventListener('pointermove', event => { if (dragging) paint(event.clientX - startX); });
    const finish = async () => {
      if (!dragging) return;
      dragging = false; track.classList.remove('is-dragging');
      if (max > 0 && offset / max >= 0.88) {
        completed = true; paint(max); swipe.classList.add('is-complete');
        if (hint) hint.textContent = t('preparing');
        const preparing = $('#stackdPreparing'); if (preparing) preparing.hidden = false;
        try { await A.checkout(); }
        finally {
          setTimeout(() => { completed = false; swipe.classList.remove('is-complete'); paint(0); if (preparing) preparing.hidden = true; if (hint) hint.textContent = ''; }, 1600);
        }
      } else {
        paint(0); if (hint) { hint.textContent = t('swipeAgain'); setTimeout(() => { if (hint) hint.textContent = ''; }, 1500); }
      }
    };
    thumb.addEventListener('pointerup', finish);
    thumb.addEventListener('pointercancel', finish);
    window.addEventListener('resize', () => { measure(); paint(0); });
    measure(); paint(0);
  }

  function flyToCart(button) {
    const cardEl = button.closest('.card');
    const image = cardEl?.querySelector('.card-media img');
    const target = $('.cart-btn');
    if (!image || !target || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const a = image.getBoundingClientRect(), b = target.getBoundingClientRect();
    const clone = image.cloneNode(true);
    clone.className = 'stackd-fly-image';
    Object.assign(clone.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
    document.body.append(clone);
    const mark = cardEl.querySelector('.stackd-arches');
    let markClone = null;
    if (mark) {
      const m = mark.getBoundingClientRect();
      markClone = mark.cloneNode(true);
      markClone.className = 'stackd-fly-mark';
      Object.assign(markClone.style, { left: `${m.left}px`, top: `${m.top}px`, width: `${m.width}px`, height: `${m.height}px` });
      document.body.append(markClone);
    }
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    requestAnimationFrame(() => {
      clone.style.transform = `translate(${dx}px,${dy}px) scale(.12)`;
      clone.style.opacity = '0.15';
      if (markClone) { markClone.style.transform = `translate(${dx}px,${dy}px) scale(.35)`; markClone.style.opacity = '0.1'; }
    });
    setTimeout(() => { clone.remove(); markClone?.remove(); }, 680);
  }

  function bindFloodProtection() {
    const cooldowns = new Map();
    document.addEventListener('click', event => {
      const control = event.target.closest('[data-act]');
      if (!control) return;
      if (control.dataset.act === 'add') flyToCart(control);
      const action = control.dataset.act;
      if (!['orders', 'auth', 'manage', 'toggle-qr', 'clear'].includes(action)) return;
      const now = Date.now(), last = cooldowns.get(action) || 0;
      if (now - last < 500) { event.preventDefault(); event.stopImmediatePropagation(); }
      else cooldowns.set(action, now);
    }, true);
  }

  function bindTopupRateLimit() {
    const form = $('#topupForm');
    if (!form) return;
    let allowed = false, checking = false;
    form.addEventListener('submit', async event => {
      if (allowed) { allowed = false; return; }
      event.preventDefault(); event.stopImmediatePropagation();
      if (checking) return;
      checking = true;
      try {
        if (await rateLimit('topup_submit', 4, 300)) { allowed = true; form.requestSubmit(); }
      } finally { checking = false; }
    }, true);
  }

  // Wrap existing checkout action without changing its RPC/Telegram/QR implementation.
  const originalCheckoutAction = A.checkout;
  A.checkout = async (...args) => {
    if (S.checkoutBusy) return;
    if (!(await rateLimit('checkout', 5, 60))) return;
    return originalCheckoutAction(...args);
  };

  // Improve category slider geometry and resize handling.
  updateChipsSlider = function stackdUpdateChipsSlider() {
    const chips = $('#chips'), active = $('#chips button[aria-pressed="true"]'), slider = $('#chipsSlider');
    if (!chips || !active || !slider) return;
    const left = active.getBoundingClientRect().left - chips.getBoundingClientRect().left;
    slider.style.width = `${active.getBoundingClientRect().width}px`;
    slider.style.transform = `translate3d(${left}px,0,0)`;
  };

  function refreshAddedLabels() {
    const source = $('#stackdSourceLang');
    const stockLabel = document.querySelector('label[for="stackdStock"]');
    if (stockLabel) stockLabel.textContent = S.lang === 'en' ? 'Stock quantity' : S.lang === 'az' ? 'Stok miqdarı' : 'Количество в наличии';
    if ($('#stackdStock')) $('#stackdStock').placeholder = t('unlimited');
    const stockHelp = $('#stackdStock')?.parentElement?.querySelector('small');
    if (stockHelp) stockHelp.textContent = t('unlimitedNote');
    if (source) {
      const label = source.parentElement?.querySelector('label');
      if (label) label.textContent = t('source');
      const help = source.parentElement?.querySelector('small'); if (help) help.textContent = t('sourceHelp');
    }
    const active = $('#stackdActive'), featured = $('#stackdFeatured');
    if (active?.parentElement) active.parentElement.lastChild.nodeValue = ` ${S.lang === 'en' ? 'Show product in catalog' : S.lang === 'az' ? 'Məhsulu kataloqda göstər' : 'Показывать товар в каталоге'}`;
    if (featured?.parentElement) featured.parentElement.lastChild.nodeValue = ` ${S.lang === 'en' ? 'Featured product' : S.lang === 'az' ? 'Seçilmiş məhsul' : 'Отметить как популярный'}`;
    const titleMap = {
      stackdHeroFile: t('heroImage'), stackdHeroFit: t('heroFit'), stackdHeroPosition: t('heroPosition'),
      stackdHeroHeight: t('heroHeight'), stackdHeroRatio: t('heroRatio')
    };
    for (const [id, labelText] of Object.entries(titleMap)) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) label.textContent = labelText;
    }
    const sectionTitle = $('#stackdHeroSettings h3'); if (sectionTitle) sectionTitle.textContent = t('hero');
    const fit = $('#stackdHeroFit'); if (fit) { fit.options[0].text = t('cover'); fit.options[1].text = t('contain'); }
    const position = $('#stackdHeroPosition'); if (position) { position.options[0].text = t('center'); position.options[1].text = t('top'); position.options[2].text = t('bottom'); }
    const ratio = $('#stackdHeroRatio'); if (ratio) ratio.options[3].text = S.lang === 'en' ? 'Natural height' : S.lang === 'az' ? 'Təbii hündürlük' : 'Автоматически';
    const translateButton = $('#stackdTranslateAll'); if (translateButton) translateButton.textContent = t('translateAll');
    renderGuideText();
  }

  function initialise() {
    injectProductFields();
    makeSettingsUI();
    refreshAddedLabels();
    buildCartGuide();
    bindFloodProtection();
    bindTopupRateLimit();
    const productForm = $('#pform');
    productForm?.addEventListener('submit', saveProductWithExtras, true);
    $('#saveSettingsBtn')?.addEventListener('click', saveHeroSettings, true);
    // Reload once after the original deferred app.js initialization so fields omitted by its old query are restored.
    load().catch(error => console.error('Stackd enhanced catalog load failed:', error));
    loadSettings().catch(error => console.error('Stackd settings load failed:', error));
    const grid = $('#grid');
    if (grid) new MutationObserver(() => requestAnimationFrame(updateChipsSlider)).observe(grid, { childList: true, subtree: true });
    searchInput?.addEventListener('input', () => setTimeout(() => {
      if (!S.q || !suggestionsBox) return;
      const needle = normalizeSearch(S.q);
      const matches = live().filter(p => normalizeSearch([productText(p).name, productText(p).description, productText(p).category].join(' ')).includes(needle)).slice(0, 6);
      suggestionsBox.innerHTML = matches.length ? matches.map(p => { const view = productText(p); return `<button type="button" class="suggestion-item" data-id="${esc(p.id)}"><img src="${esc(imgSrc(p))}" alt=""><span><span class="s-title">${esc(view.name)}</span><span class="s-cat">${esc(view.category || '')}</span></span></button>`; }).join('') : `<div class="suggestion-empty">${esc(tr('no_results'))}</div>`;
    }, 0));
    window.addEventListener('resize', () => { requestAnimationFrame(updateChipsSlider); updateHero(); }, { passive: true });
    document.addEventListener('click', event => {
      const langButton = event.target.closest('[data-lang]');
      if (!langButton) return;
      setTimeout(refreshAddedLabels, 0);
    });
    console.info(`Stackd enhancements ${VERSION} loaded`);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise, { once: true });
  else initialise();
})();
