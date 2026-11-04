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
      hero: 'Первый экран', heroImage: 'Фото первого экрана', brandTitle: 'Бренд и контакты', brandHelp: 'Название проекта, описание и Telegram-ссылки в шапке и подвале сайта.', brandName: 'Название сайта', brandTagline: 'Короткое описание', supportTelegram: 'Telegram поддержки (без @)', channelTelegram: 'Telegram-канал (без @)', brandLogo: 'Логотип сайта', brandLogoReset: 'Вернуть исходный логотип', brandPreview: 'Предпросмотр логотипа', heroFit: 'Заполнение фото', heroPosition: 'Положение фото',
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
      imageHelp: 'JPG, PNG или WebP. Максимум 5 МБ.',
      featured: 'ПОПУЛЯРНОЕ', profileHint: 'Настройки профиля', profileClick: 'Нажмите, чтобы открыть',
      profileTitle: 'Профиль', profileNote: 'Управляйте аккаунтом и оформлением сайта.', profileOrders: 'Мои заказы',
      profileTheme: 'Тема оформления', profileLogout: 'Выйти из аккаунта', profileEmail: 'Вы вошли как',
      discountTitle: 'Скидки', discountHelp: 'Выберите, где действует скидка: во всём каталоге, в категории или на одном товаре.',
      discountScope: 'Область действия', discountAll: 'Весь каталог', discountCategory: 'Категория', discountProduct: 'Один товар',
      discountTarget: 'Выберите категорию или товар', discountPercent: 'Скидка, %', discountBadge: 'Текст на плашке',
      discountEnabled: 'Скидка активна', discountSave: 'Применить скидку', discountSaved: 'Скидка применена и учитывается при оформлении заказа.',
      discountDisabled: 'Скидка выключена. Исходные цены восстановлены.', newsTitle: 'Новости каталога',
      newsHelp: 'Добавляйте фотографии. Лента прокручивается сама каждые 4 секунды, её также можно листать вручную.',
      newsImage: 'Фотография', newsCaption: 'Подпись (необязательно)', newsLink: 'Ссылка (необязательно)',
      newsAdd: 'Добавить в ленту', newsRemove: 'Убрать', newsUp: 'Выше', newsDown: 'Ниже',
      newsEmpty: 'Пока нет фотографий в ленте.', newsSection: 'Новости'
    },
    en: {
      inStock: 'In stock', outStock: 'Out of stock', unlimited: 'Unlimited',
      added: 'added to cart', stockSaved: 'Stock saved', source: 'Product source language',
      translateAll: 'Translate catalog', translating: 'Translating catalog', translated: 'Catalog translated',
      translateFailed: 'Translation failed. Check the translation service quota.',
      hero: 'Hero section', heroImage: 'Hero image', brandTitle: 'Brand and contacts', brandHelp: 'Project name, short description and Telegram links shown in the header and footer.', brandName: 'Site name', brandTagline: 'Short description', supportTelegram: 'Support Telegram username', channelTelegram: 'Telegram channel username', brandLogo: 'Site logo', brandLogoReset: 'Restore original logo', brandPreview: 'Logo preview', heroFit: 'Image fit', heroPosition: 'Image position',
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
      imageHelp: 'JPG, PNG or WebP. Maximum 5 MB.',
      featured: 'POPULAR', profileHint: 'Profile settings', profileClick: 'Tap to open',
      profileTitle: 'Profile', profileNote: 'Manage your account and the site appearance.', profileOrders: 'My orders',
      profileTheme: 'Appearance', profileLogout: 'Log out', profileEmail: 'Signed in as',
      discountTitle: 'Discounts', discountHelp: 'Choose where the discount applies: the whole catalog, a category or one product.',
      discountScope: 'Discount applies to', discountAll: 'Entire catalog', discountCategory: 'A category', discountProduct: 'One product',
      discountTarget: 'Choose a category or product', discountPercent: 'Discount, %', discountBadge: 'Badge text',
      discountEnabled: 'Discount is active', discountSave: 'Apply discount', discountSaved: 'Discount applied and included in checkout.',
      discountDisabled: 'Discount turned off. Original prices restored.', newsTitle: 'Catalog news',
      newsHelp: 'Add photos. The rail advances every 4 seconds and can also be swiped manually.',
      newsImage: 'Photo', newsCaption: 'Caption (optional)', newsLink: 'Link (optional)',
      newsAdd: 'Add to news', newsRemove: 'Remove', newsUp: 'Move up', newsDown: 'Move down',
      newsEmpty: 'There are no photos in the news rail yet.', newsSection: 'News'
    },
    az: {
      inStock: 'Stokda var', outStock: 'Stokda yoxdur', unlimited: 'Limitsiz',
      added: 'səbətə əlavə edildi', stockSaved: 'Stok saxlanıldı', source: 'Məhsulun ilkin dili',
      translateAll: 'Kataloqu tərcümə et', translating: 'Kataloq tərcümə olunur', translated: 'Kataloq tərcümə edildi',
      translateFailed: 'Tərcümə alınmadı. Tərcümə xidmətinin limitini yoxlayın.',
      hero: 'Ana ekran', heroImage: 'Ana ekran şəkli', brandTitle: 'Brend və əlaqə', brandHelp: 'Layihənin adı, qısa təsviri və saytda göstərilən Telegram keçidləri.', brandName: 'Saytın adı', brandTagline: 'Qısa təsvir', supportTelegram: 'Dəstək Telegram istifadəçi adı', channelTelegram: 'Telegram kanalının istifadəçi adı', brandLogo: 'Saytın loqosu', brandLogoReset: 'İlkin loqoya qaytar', brandPreview: 'Loqoya baxış', heroFit: 'Şəklin yerləşməsi', heroPosition: 'Şəklin mövqeyi',
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
      imageHelp: 'JPG, PNG və ya WebP. Maksimum 5 MB.',
      featured: 'SEÇİLƏN', profileHint: 'Profil ayarları', profileClick: 'Açmaq üçün toxunun',
      profileTitle: 'Profil', profileNote: 'Hesabınızı və saytın görünüşünü idarə edin.', profileOrders: 'Sifarişlərim',
      profileTheme: 'Görünüş', profileLogout: 'Hesabdan çıx', profileEmail: 'Daxil olan hesab',
      discountTitle: 'Endirimlər', discountHelp: 'Endirimin bütün kataloqa, kateqoriyaya və ya bir məhsula tətbiq olunmasını seçin.',
      discountScope: 'Endirim harada keçərlidir', discountAll: 'Bütün kataloq', discountCategory: 'Kateqoriya', discountProduct: 'Bir məhsul',
      discountTarget: 'Kateqoriya və ya məhsul seçin', discountPercent: 'Endirim, %', discountBadge: 'Nişanın mətni',
      discountEnabled: 'Endirim aktivdir', discountSave: 'Endirimi tətbiq et', discountSaved: 'Endirim tətbiq edildi və sifariş zamanı nəzərə alınacaq.',
      discountDisabled: 'Endirim söndürüldü. İlkin qiymətlər bərpa edildi.', newsTitle: 'Kataloq xəbərləri',
      newsHelp: 'Şəkillər əlavə edin. Lent hər 4 saniyədən bir dəyişir və əl ilə də sürüşdürülə bilər.',
      newsImage: 'Şəkil', newsCaption: 'Başlıq (istəyə bağlı)', newsLink: 'Keçid (istəyə bağlı)',
      newsAdd: 'Lentə əlavə et', newsRemove: 'Sil', newsUp: 'Yuxarı', newsDown: 'Aşağı',
      newsEmpty: 'Hələ lentdə şəkil yoxdur.', newsSection: 'Xəbərlər'
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
  let hero = { hero_image_url: '', hero_fit: 'cover', hero_position: 'center', hero_height: '400', hero_ratio: 'auto', hero_title: '', hero_subtitle: '', hero_overlay: 'true', brand_accent: '', hero_enabled: 'true' };
  let heroPreviewObjectUrl = null;
  let heroImageRemoved = false;
  let brandLogoPreviewObjectUrl = null;
  let brandLogoRemoved = false;
  let brandSettings = { site_name: 'Stackd', site_tagline: '', support_telegram: 'sharkiff', telegram_channel: 'stackdbaku', brand_logo_url: '' };
  let defaultHeroSlide = { image: '', title: '', subtitle: '' };
  let promo = { enabled: false, scope: 'all', target: '', percent: 0, label: 'СКИДКА', originalPrices: {} };
  let newsItems = [];
  let newsTimer = null;
  let newsIndex = 0;
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
    try {
      const result = baseRenderAll();
      const allButton = $('#chips button[data-cat="All"]');
      if (allButton) allButton.textContent = 'All';
      return result;
    } finally { S.products = original; }
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
    const saleOriginal = Number(promo.originalPrices?.[String(p.id)]);
    const hasSale = promo.enabled && promotionMatches(p, promo) && Number.isFinite(saleOriginal) && saleOriginal > Number(p.price);
    return `<article class="card ${available ? '' : 'is-out'}" data-id="${esc(p.id)}">
      ${p.featured ? `<span class="badge-popular">${t('featured')}</span>` : ''}
      ${hasSale ? `<span class="stackd-sale-badge"><b>${esc(promo.label || 'СКИДКА')}</b><strong>−${Number(promo.percent)}%</strong></span>` : ''}
      <button class="card-media" type="button" data-act="detail" aria-label="${esc(p.name || 'Товар')}">
        <img src="${esc(image)}" alt="${esc(p.name || '')}" loading="lazy" decoding="async">
        <span class="stackd-arches" aria-label="McDonald’s"><svg viewBox="0 0 48 40" aria-hidden="true"><path d="M3 37V17.5C3 8.8 7.8 3 14 3c5.5 0 8.4 8.2 10 18.6C25.6 11.2 28.5 3 34 3c6.2 0 11 5.8 11 14.5V37h-6.2V17.5c0-5.2-1.7-8.4-4.8-8.4-3.6 0-6.8 15.6-9 27.9h-2c-2.2-12.3-5.4-27.9-9-27.9-3.1 0-4.8 3.2-4.8 8.4V37Z" fill="currentColor"/></svg></span>
      </button>
      <div class="card-body">
        <span class="tag">${esc(p.category || '')}</span>
        <h3>${esc(p.name || 'Товар')}</h3>
        <p>${esc(p.description || '')}</p>
        ${stock !== null ? `<span class="stock-info ${stock < 5 ? 'stock-low' : ''}">${stock > 0 ? `${stock} ${S.lang === 'en' ? 'left' : S.lang === 'az' ? 'ədəd qalıb' : 'шт. осталось'}` : esc(t('outStock'))}</span>` : ''}
        <div class="card-foot">
          ${hasSale ? `<span class="stackd-price-stack"><del>${fmt(saleOriginal)}</del><strong>${fmt(p.price)}</strong></span>` : `<strong>${fmt(p.price)}</strong>`}
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
    renderPromotionTargetOptions();
    syncPromotionForm();
  };

  setDraft = function stackdSetDraft(product) {
    const editable = product ? { ...product, price: Number(promo.originalPrices?.[String(product.id)]) || product.price } : product;
    baseSetDraft(editable);
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
      const willBeDiscounted = promo.enabled && promotionMatches(d, promo);
      const originalProductPrice = Number(d.price);
      const storedProductPrice = willBeDiscounted ? Number((originalProductPrice * (1 - Number(promo.percent) / 100)).toFixed(2)) : originalProductPrice;
      const payload = {
        name: d.name, description: d.description, category: d.category, price: storedProductPrice,
        image_url: imageUrl, stock: d.stock, available: d.available, active: d.active,
        featured: d.featured, source_lang: d.source_lang || 'ru', translations: d.translations || {}
      };
      const exists = S.products.some(p => String(p.id) === String(d.id));
      const result = exists
        ? await _supabase.from('products').update(payload).eq('id', d.id).select('id,name,description,category,price,image_url,stock,available,active,featured,translations,source_lang').maybeSingle()
        : await _supabase.from('products').insert(payload).select('id,name,description,category,price,image_url,stock,available,active,featured,translations,source_lang').single();
      if (result.error) throw result.error;
      if (!result.data) throw new Error('База данных не вернула сохранённый товар.');
      const savedId = String(result.data.id);
      if (willBeDiscounted) promo.originalPrices[savedId] = originalProductPrice;
      else delete promo.originalPrices[savedId];
      if (promo.enabled) await persistPromotion();
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


  function promotionMatches(product, config = promo) {
    if (!config?.enabled) return false;
    if (config.scope === 'all') return true;
    if (config.scope === 'category') return String(product.category || '').trim().toLowerCase() === String(config.target || '').trim().toLowerCase();
    if (config.scope === 'product') return String(product.id) === String(config.target);
    return false;
  }
  function parseSetting(value, fallback) {
    if (value && typeof value === 'object') return value;
    try { return JSON.parse(String(value || '')); } catch { return fallback; }
  }
  function renderPromotionTargetOptions() {
    const scope = $('#stackdPromoScope')?.value || promo.scope || 'all';
    const select = $('#stackdPromoTarget');
    if (!select) return;
    select.hidden = scope === 'all';
    if (scope === 'category') {
      const categories = [...new Map(S.products.filter(p => p.category).map(p => [String(p.category).trim().toLowerCase(), String(p.category).trim()])).values()];
      select.innerHTML = categories.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('');
    } else {
      select.innerHTML = S.products.map(p => `<option value="${esc(p.id)}">${esc(p.name || 'Без названия')}</option>`).join('');
    }
    if (promo.target && [...select.options].some(option => option.value === promo.target)) select.value = promo.target;
  }
  function syncPromotionForm() {
    if (!$('#stackdPromoScope')) return;
    $('#stackdPromoScope').value = promo.scope || 'all';
    if ($('#stackdPromoPercent')) $('#stackdPromoPercent').value = promo.percent || '';
    if ($('#stackdPromoBadge')) $('#stackdPromoBadge').value = promo.label || 'СКИДКА';
    if ($('#stackdPromoEnabled')) $('#stackdPromoEnabled').checked = promo.enabled === true;
    renderPromotionTargetOptions();
  }
  async function persistPromotion() {
    const { error } = await _supabase.from('site_settings').upsert(
      [{ key: 'discount_config', value: JSON.stringify(promo) }], { onConflict: 'key' }
    );
    if (error) throw error;
  }
  async function savePromotion() {
    if (!isAdmin()) { toast('Недостаточно прав.'); return; }
    const enabled = Boolean($('#stackdPromoEnabled')?.checked);
    const scope = $('#stackdPromoScope')?.value || 'all';
    const target = scope === 'all' ? '' : String($('#stackdPromoTarget')?.value || '');
    const percent = Number($('#stackdPromoPercent')?.value);
    const label = String($('#stackdPromoBadge')?.value || 'СКИДКА').trim().slice(0, 22) || 'СКИДКА';
    const status = $('#stackdPromoStatus');
    if (enabled && (!Number.isFinite(percent) || percent < 1 || percent > 90)) { if (status) status.textContent = 'Укажите скидку от 1 до 90%.'; return; }
    if (enabled && scope !== 'all' && !target) { if (status) status.textContent = 'Выберите категорию или товар.'; return; }
    const previous = promo;
    const next = { enabled, scope, target, percent: enabled ? percent : 0, label, originalPrices: {} };
    const changed = [];
    const button = $('#stackdPromoSave');
    try {
      if (button) button.disabled = true;
      if (status) status.textContent = 'Применяем изменения…';
      for (const product of S.products) {
        const id = String(product.id);
        const oldBase = Number(previous.originalPrices?.[id]);
        const basePrice = previous.enabled && Number.isFinite(oldBase) ? oldBase : Number(product.price);
        const apply = enabled && promotionMatches(product, next);
        const desired = apply ? Number((basePrice * (1 - percent / 100)).toFixed(2)) : basePrice;
        if (apply) next.originalPrices[id] = basePrice;
        const oldPrice = Number(product.price);
        if (!Number.isFinite(desired) || desired < 0) throw new Error('Некорректная цена: ' + id);
        if (Math.abs(desired - oldPrice) < 0.001) continue;
        const { error } = await _supabase.from('products').update({ price: desired }).eq('id', product.id);
        if (error) throw error;
        changed.push({ id: product.id, oldPrice, newPrice: desired });
      }
      promo = next;
      await persistPromotion();
      S.products = S.products.map(product => {
        const item = changed.find(change => String(change.id) === String(product.id));
        if (item) return { ...product, price: item.newPrice };
        const base = previous.enabled && Number.isFinite(Number(previous.originalPrices?.[String(product.id)]))
          ? Number(previous.originalPrices[String(product.id)]) : Number(product.price);
        const shouldApply = enabled && promotionMatches(product, next);
        return { ...product, price: shouldApply ? Number((base * (1 - percent / 100)).toFixed(2)) : base };
      });
      renderAll();
      if (status) status.textContent = enabled ? t('discountSaved') : t('discountDisabled');
      syncPromotionForm();
    } catch (error) {
      console.error('Promotion update failed:', error);
      for (const item of changed.reverse()) {
        const rollback = await _supabase.from('products').update({ price: item.oldPrice }).eq('id', item.id);
        if (rollback.error) console.error('Promotion rollback failed:', rollback.error);
      }
      promo = previous;
      if (status) status.textContent = 'Не удалось применить скидку: ' + (error.message || 'ошибка базы данных');
      await load();
    } finally { if (button) button.disabled = false; }
  }
  function makePromotionUI() {
    const tab = $('#tab-settings');
    if (!tab || $('#stackdPromoSettings')) return;
    const section = document.createElement('section');
    section.id = 'stackdPromoSettings'; section.className = 'stackd-settings-section stackd-promo-settings';
    section.innerHTML = `
      <div class="stackd-section-head"><h3>${esc(t('discountTitle'))}</h3><span>PROMOTIONS</span></div>
      <p class="stackd-admin-note">${esc(t('discountHelp'))}</p>
      <label for="stackdPromoScope">${esc(t('discountScope'))}</label>
      <select id="stackdPromoScope"><option value="all">${esc(t('discountAll'))}</option><option value="category">${esc(t('discountCategory'))}</option><option value="product">${esc(t('discountProduct'))}</option></select>
      <label for="stackdPromoTarget">${esc(t('discountTarget'))}</label><select id="stackdPromoTarget"></select>
      <div class="stackd-settings-grid"><div><label for="stackdPromoPercent">${esc(t('discountPercent'))}</label><input id="stackdPromoPercent" type="number" min="1" max="90" step="1" placeholder="20"></div><div><label for="stackdPromoBadge">${esc(t('discountBadge'))}</label><input id="stackdPromoBadge" maxlength="22" value="СКИДКА"></div></div>
      <label class="stackd-promo-check"><input id="stackdPromoEnabled" type="checkbox"><span>${esc(t('discountEnabled'))}</span></label>
      <button type="button" class="btn btn-primary stackd-promo-save" id="stackdPromoSave">${esc(t('discountSave'))}</button><p id="stackdPromoStatus" class="stackd-admin-note" role="status"></p>`;
    tab.append(section);
    $('#stackdPromoScope').addEventListener('change', renderPromotionTargetOptions);
    $('#stackdPromoSave').addEventListener('click', savePromotion);
    syncPromotionForm();
  }


  function safeWebLink(value) {
    try { const url = new URL(String(value || '').trim()); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
    catch { return ''; }
  }
  function renderNewsRail() {
    const catalog = $('#catalog');
    if (!catalog) return;
    let section = $('#stackdNewsRail');
    if (!section) {
      section = document.createElement('section'); section.id = 'stackdNewsRail'; section.className = 'stackd-news-section';
      section.innerHTML = `<div class="stackd-news-heading"><h3>${esc(t('newsSection'))}</h3><span>STACKD / UPDATES</span></div><div class="stackd-news-viewport" id="stackdNewsViewport"><div class="stackd-news-track" id="stackdNewsTrack"></div></div>`;
      catalog.insertBefore(section, catalog.querySelector('.head') || catalog.firstChild);
    }
    const viewport = $('#stackdNewsViewport'), track = $('#stackdNewsTrack');
    if (newsTimer) { clearInterval(newsTimer); newsTimer = null; }
    const items = newsItems.filter(item => item && item.image_url);
    newsIndex = 0; section.hidden = !items.length;
    if (!items.length) { track.replaceChildren(); viewport.scrollLeft = 0; return; }
    const slides = items.length > 1 ? [...items, items[0]] : items;
    track.innerHTML = slides.map((item, index) => {
      const image = safeImageUrl(item.image_url);
      const caption = item.title ? `<span class="stackd-news-caption">${esc(item.title)}</span>` : '';
      const body = `<img src="${esc(image)}" alt="${esc(item.title || 'Stackd news')}" loading="${index === 0 ? 'eager' : 'lazy'}">${caption}`;
      const href = safeWebLink(item.href);
      return href ? `<a class="stackd-news-card" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${body}</a>` : `<article class="stackd-news-card">${body}</article>`;
    }).join('');
    viewport.scrollLeft = 0;
    if (items.length < 2) return;
    newsTimer = setInterval(() => {
      if (document.hidden) return;
      newsIndex += 1;
      const next = $$('.stackd-news-card', track)[newsIndex];
      if (!next) return;
      viewport.scrollTo({ left: next.offsetLeft, behavior: 'smooth' });
      if (newsIndex === items.length) setTimeout(() => { viewport.scrollTo({ left: 0, behavior: 'auto' }); newsIndex = 0; }, 560);
    }, 4000);
  }
  function renderNewsAdmin() {
    const host = $('#stackdNewsList');
    if (!host) return;
    if (!newsItems.length) { host.innerHTML = `<li class="stackd-news-empty">${esc(t('newsEmpty'))}</li>`; return; }
    host.innerHTML = newsItems.map((item, index) => `<li data-news-index="${index}"><img src="${esc(item.image_url)}" alt=""><div class="stackd-news-meta"><strong>${esc(item.title || 'Фото без подписи')}</strong><small>${index + 1} / ${newsItems.length}</small></div><div class="stackd-news-actions"><button type="button" class="btn btn-ghost sm" data-news-action="up" data-index="${index}" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" class="btn btn-ghost sm" data-news-action="down" data-index="${index}" ${index === newsItems.length - 1 ? 'disabled' : ''}>↓</button><button type="button" class="btn btn-ghost sm" data-news-action="remove" data-index="${index}">${esc(t('newsRemove'))}</button></div></li>`).join('');
  }
  async function persistNews() {
    const { error } = await _supabase.from('site_settings').upsert([{ key: 'news_items', value: JSON.stringify(newsItems) }], { onConflict: 'key' });
    if (error) throw error;
  }
  function makeNewsUI() {
    const tab = $('#tab-settings');
    if (!tab || $('#stackdNewsSettings')) return;
    const section = document.createElement('section'); section.id = 'stackdNewsSettings'; section.className = 'stackd-settings-section stackd-news-settings';
    section.innerHTML = `<div class="stackd-section-head"><h3>${esc(t('newsTitle'))}</h3><span>UPDATES</span></div><p class="stackd-admin-note">${esc(t('newsHelp'))}</p><label for="stackdNewsFile">${esc(t('newsImage'))}</label><input type="file" id="stackdNewsFile" accept="image/jpeg,image/png,image/webp"><label for="stackdNewsCaption">${esc(t('newsCaption'))}</label><input type="text" id="stackdNewsCaption" maxlength="90"><label for="stackdNewsLink">${esc(t('newsLink'))}</label><input type="url" id="stackdNewsLink" placeholder="https://"><button class="btn btn-primary" type="button" id="stackdNewsAdd">${esc(t('newsAdd'))}</button><ul id="stackdNewsList" class="stackd-news-admin-list"></ul>`;
    tab.append(section);
    $('#stackdNewsAdd').addEventListener('click', addNewsItem);
    $('#stackdNewsList').addEventListener('click', handleNewsAction);
    renderNewsAdmin();
  }
  async function addNewsItem() {
    if (!isAdmin()) { toast('Недостаточно прав.'); return; }
    const input = $('#stackdNewsFile'), file = input?.files?.[0], button = $('#stackdNewsAdd');
    if (!file) { toast('Выберите изображение.'); return; }
    if (newsItems.length >= 20) { toast('Можно добавить максимум 20 фотографий.'); return; }
    let uploadedPath = '';
    try {
      await validateProductImage(file);
      button.disabled = true;
      const extension = IMAGE_TYPES[file.type];
      uploadedPath = `news/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await _supabase.storage.from(PRODUCT_BUCKET).upload(uploadedPath, file, { cacheControl: '31536000', upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data } = _supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(uploadedPath);
      if (!data?.publicUrl) throw new Error('Storage не вернул публичную ссылку.');
      newsItems.push({ id: crypto.randomUUID(), image_url: data.publicUrl, title: String($('#stackdNewsCaption')?.value || '').trim().slice(0, 90), href: safeWebLink($('#stackdNewsLink')?.value || '') });
      await persistNews();
      input.value = ''; $('#stackdNewsCaption').value = ''; $('#stackdNewsLink').value = '';
      renderNewsAdmin(); renderNewsRail(); toast('Фотография добавлена в новости.');
    } catch (error) {
      if (uploadedPath) await _supabase.storage.from(PRODUCT_BUCKET).remove([uploadedPath]);
      newsItems = newsItems.filter(item => !uploadedPath || !item.image_url.includes(uploadedPath));
      toast('Не удалось добавить новость: ' + (error.message || 'ошибка загрузки'));
    } finally { if (button) button.disabled = false; }
  }
  async function handleNewsAction(event) {
    const button = event.target.closest('[data-news-action]');
    if (!button || !isAdmin()) return;
    const index = Number(button.dataset.index), action = button.dataset.newsAction;
    if (!Number.isInteger(index) || !newsItems[index]) return;
    if (action === 'remove') {
      const removed = newsItems.splice(index, 1)[0];
      await persistNews();
      const path = getProductStoragePath(removed.image_url);
      if (path?.startsWith('news/')) { const { error } = await _supabase.storage.from(PRODUCT_BUCKET).remove([path]); if (error) console.warn(error); }
    } else {
      const next = index + (action === 'up' ? -1 : 1);
      if (next < 0 || next >= newsItems.length) return;
      [newsItems[index], newsItems[next]] = [newsItems[next], newsItems[index]];
      await persistNews();
    }
    renderNewsAdmin(); renderNewsRail();
  }
  function refreshPromotionNewsLabels() {
    const pairs = [
      ['stackdPromoSettings h3', 'discountTitle'], ['stackdNewsSettings h3', 'newsTitle'],
      ['.stackd-news-heading h3', 'newsSection'], ['#stackdPromoScope', null]
    ];
    for (const [selector, key] of pairs) { const node = document.querySelector(selector); if (node && key) node.textContent = t(key); }
    const profileText = {
      stackdProfileHint: 'profileHint', stackdProfileClick: 'profileClick', stackdProfileTitle: 'profileTitle',
      stackdProfileNote: 'profileNote', stackdProfileOrders: 'profileOrders', stackdProfileTheme: 'profileTheme',
      stackdProfileLogout: 'profileLogout', stackdProfileEmailLabel: 'profileEmail'
    };
    for (const [id, key] of Object.entries(profileText)) { const node = $('#' + id); if (node) node.textContent = t(key); }
    const scope = $('#stackdPromoScope'); if (scope) { scope.options[0].text = t('discountAll'); scope.options[1].text = t('discountCategory'); scope.options[2].text = t('discountProduct'); }
    const save = $('#stackdPromoSave'); if (save) save.textContent = t('discountSave');
    const add = $('#stackdNewsAdd'); if (add) add.textContent = t('newsAdd');
    renderPromotionTargetOptions(); renderNewsAdmin();
  }

  function applyBrandAccent(value) {
    const color = /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : '';
    if (!color) {
      document.documentElement.style.removeProperty('--stackd-custom-accent');
      document.documentElement.style.removeProperty('--accent-ink');
      return;
    }
    const channels = color.slice(1).match(/.{2}/g).map(part => parseInt(part, 16) / 255);
    const linear = channels.map(channel => channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4));
    const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    document.documentElement.style.setProperty('--stackd-custom-accent', color);
    document.documentElement.style.setProperty('--accent-ink', luminance > 0.42 ? '#23170f' : '#ffffff');
  }

  function clearHeroPreviewObjectUrl() {
    if (heroPreviewObjectUrl) URL.revokeObjectURL(heroPreviewObjectUrl);
    heroPreviewObjectUrl = null;
  }

  function syncHeroPreview() {
    const image = $('#stackdHeroPreview');
    const empty = $('#stackdHeroPreviewEmpty');
    if (!image) return;
    const current = heroPreviewObjectUrl || (!heroImageRemoved && hero.hero_image_url ? safeImageUrl(hero.hero_image_url) : defaultHeroSlide.image);
    if (current) {
      image.src = current;
      image.hidden = false;
      if (empty) empty.hidden = true;
    } else {
      image.removeAttribute('src');
      image.hidden = true;
      if (empty) empty.hidden = false;
    }
  }

  function syncHeroSettingsForm() {
    if ($('#stackdHeroFit')) $('#stackdHeroFit').value = hero.hero_fit || 'cover';
    if ($('#stackdHeroPosition')) $('#stackdHeroPosition').value = hero.hero_position || 'center';
    if ($('#stackdHeroHeight')) $('#stackdHeroHeight').value = String(hero.hero_height || '400');
    if ($('#stackdHeroRatio')) $('#stackdHeroRatio').value = hero.hero_ratio || 'auto';
    if ($('#stackdHeroOverlay')) $('#stackdHeroOverlay').checked = String(hero.hero_overlay) !== 'false';
    if ($('#stackdHeroEnabled')) $('#stackdHeroEnabled').checked = String(hero.hero_enabled) !== 'false';
    if ($('#stackdBrandAccent')) $('#stackdBrandAccent').value = /^#[0-9a-f]{6}$/i.test(String(hero.brand_accent || '')) ? hero.brand_accent : '#c2500a';
    applyBrandAccent(hero.brand_accent);
    syncHeroPreview();
  }


  function cleanTelegramUsername(value, fallback) {
    const username = String(value || '').trim().replace(/^@+/, '');
    return /^[A-Za-z0-9_]{5,32}$/.test(username) ? username : fallback;
  }

  function syncBrandPreview() {
    const image = $('#stackdBrandLogoPreview');
    const empty = $('#stackdBrandLogoEmpty');
    if (!image) return;
    const src = brandLogoPreviewObjectUrl || (!brandLogoRemoved && brandSettings.brand_logo_url ? safeImageUrl(brandSettings.brand_logo_url) : 'assets/icons/logo.svg');
    image.src = src;
    image.hidden = false;
    if (empty) empty.hidden = true;
  }

  function clearBrandLogoPreviewObjectUrl() {
    if (brandLogoPreviewObjectUrl) URL.revokeObjectURL(brandLogoPreviewObjectUrl);
    brandLogoPreviewObjectUrl = null;
  }

  function syncBrandSettingsForm() {
    if ($('#stackdSiteName')) $('#stackdSiteName').value = brandSettings.site_name || 'Stackd';
    if ($('#stackdSiteTagline')) $('#stackdSiteTagline').value = brandSettings.site_tagline || '';
    if ($('#stackdSupportTelegram')) $('#stackdSupportTelegram').value = brandSettings.support_telegram || 'sharkiff';
    if ($('#stackdChannelTelegram')) $('#stackdChannelTelegram').value = brandSettings.telegram_channel || 'stackdbaku';
    syncBrandPreview();
    applyBrandSettings();
  }

  function applyBrandSettings() {
    const name = String(brandSettings.site_name || '').trim().slice(0, 40) || 'Stackd';
    const tagline = String(brandSettings.site_tagline || '').trim().slice(0, 120) || translations[S.lang]?.footer_desc || translations.ru.footer_desc;
    const support = cleanTelegramUsername(brandSettings.support_telegram, 'sharkiff');
    const channel = cleanTelegramUsername(brandSettings.telegram_channel, 'stackdbaku');
    const logo = brandSettings.brand_logo_url ? safeImageUrl(brandSettings.brand_logo_url) : 'assets/icons/logo.svg';
    const headerBrand = $('.nav .brand');
    if (headerBrand) {
      const image = headerBrand.querySelector('img');
      const label = headerBrand.querySelector('span');
      if (image) image.src = logo;
      if (label) label.textContent = name;
      headerBrand.setAttribute('aria-label', name);
    }
    const footerBrand = $('.foot .wrap > div:first-child > strong');
    if (footerBrand) footerBrand.textContent = name;
    const footerDescription = $('.foot [data-i18n="footer_desc"]');
    if (footerDescription) footerDescription.textContent = tagline;
    document.title = `${name} — Premium digital deals`;
    const supportUrl = `https://t.me/${support}`;
    const channelUrl = `https://t.me/${channel}`;
    $$('.social-links a').forEach(anchor => {
      anchor.href = supportUrl;
      const last = anchor.lastChild;
      if (last?.nodeType === Node.TEXT_NODE) last.textContent = ` @${support}`;
      else anchor.append(document.createTextNode(` @${support}`));
    });
    $$('.foot a[href*="t.me"]').forEach(anchor => {
      if (anchor.classList.contains('tg-channel-btn') || anchor.closest('.social-links')) return;
      anchor.href = supportUrl;
      anchor.textContent = `Telegram: @${support}`;
    });
    const channelButton = $('.tg-channel-btn');
    if (channelButton) channelButton.href = channelUrl;
  }

  function makeBrandSettingsUI() {
    const tab = $('#tab-settings');
    if (!tab || $('#stackdBrandSettings')) return;
    const section = document.createElement('section');
    section.id = 'stackdBrandSettings';
    section.className = 'stackd-settings-section stackd-brand-settings-card';
    section.innerHTML = `
      <div class="stackd-section-head"><h3>${esc(t('brandTitle'))}</h3><span>IDENTITY</span></div>
      <p class="stackd-admin-note">${esc(t('brandHelp'))}</p>
      <label for="stackdSiteName">${esc(t('brandName'))}</label>
      <input id="stackdSiteName" type="text" maxlength="40" autocomplete="off" value="Stackd">
      <label for="stackdSiteTagline">${esc(t('brandTagline'))}</label>
      <input id="stackdSiteTagline" type="text" maxlength="120" autocomplete="off">
      <div class="stackd-settings-grid">
        <div><label for="stackdSupportTelegram">${esc(t('supportTelegram'))}</label><input id="stackdSupportTelegram" type="text" maxlength="32" placeholder="sharkiff" autocomplete="off"></div>
        <div><label for="stackdChannelTelegram">${esc(t('channelTelegram'))}</label><input id="stackdChannelTelegram" type="text" maxlength="32" placeholder="stackdbaku" autocomplete="off"></div>
      </div>
      <label for="stackdBrandLogoFile">${esc(t('brandLogo'))}</label>
      <input id="stackdBrandLogoFile" type="file" accept="image/jpeg,image/png,image/webp">
      <div class="stackd-brand-logo-preview"><img id="stackdBrandLogoPreview" src="assets/icons/logo.svg" alt="${esc(t('brandPreview'))}"><div id="stackdBrandLogoEmpty" hidden>${esc(t('brandPreview'))}</div><button type="button" class="btn btn-ghost sm" id="stackdBrandLogoReset">${esc(t('brandLogoReset'))}</button></div>`;
    tab.append(section);
    syncBrandSettingsForm();
    $('#stackdBrandLogoFile')?.addEventListener('change', async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        await validateProductImage(file);
        clearBrandLogoPreviewObjectUrl();
        brandLogoRemoved = false;
        brandLogoPreviewObjectUrl = URL.createObjectURL(file);
        syncBrandPreview();
      } catch (error) {
        event.target.value = '';
        clearBrandLogoPreviewObjectUrl();
        syncBrandPreview();
        toast(error.message || 'Не удалось прочитать логотип.');
      }
    });
    $('#stackdBrandLogoReset')?.addEventListener('click', () => {
      clearBrandLogoPreviewObjectUrl();
      if ($('#stackdBrandLogoFile')) $('#stackdBrandLogoFile').value = '';
      brandLogoRemoved = true;
      syncBrandPreview();
    });
    ['stackdSiteName', 'stackdSiteTagline', 'stackdSupportTelegram', 'stackdChannelTelegram'].forEach(id => {
      $('#' + id)?.addEventListener('input', () => {
        brandSettings.site_name = $('#stackdSiteName')?.value || 'Stackd';
        brandSettings.site_tagline = $('#stackdSiteTagline')?.value || '';
        brandSettings.support_telegram = $('#stackdSupportTelegram')?.value || 'sharkiff';
        brandSettings.telegram_channel = $('#stackdChannelTelegram')?.value || 'stackdbaku';
        applyBrandSettings();
      });
    });
  }

  function makeSettingsUI() {
    const tab = $('#tab-settings');
    if (!tab || $('#stackdHeroSettings')) return;
    const section = document.createElement('section');
    section.id = 'stackdHeroSettings';
    section.className = 'stackd-settings-section';
    section.innerHTML = `
      <div class="stackd-section-head"><h3>${esc(t('hero'))}</h3><span>HOMEPAGE</span></div>
      <label for="stackdHeroFile">${esc(t('heroImage'))}</label>
      <input id="stackdHeroFile" type="file" accept="image/jpeg,image/png,image/webp">
      <div class="stackd-hero-preview-wrap">
        <img id="stackdHeroPreview" alt="${esc(t('heroPreview'))}" hidden>
        <div class="stackd-hero-preview-empty" id="stackdHeroPreviewEmpty">${esc(t('heroPreview'))}</div>
        <div class="stackd-hero-preview-footer">
          <span id="stackdHeroPreviewStatus">${esc(t('heroPreview'))}</span>
          <button type="button" class="btn btn-ghost sm" id="stackdHeroRemove">${esc(t('heroRemove'))}</button>
        </div>
      </div>
      <div class="stackd-settings-grid">
        <div><label for="stackdHeroFit">${esc(t('heroFit'))}</label><select id="stackdHeroFit"><option value="cover">${esc(t('cover'))}</option><option value="contain">${esc(t('contain'))}</option></select></div>
        <div><label for="stackdHeroPosition">${esc(t('heroPosition'))}</label><select id="stackdHeroPosition"><option value="center">${esc(t('center'))}</option><option value="top">${esc(t('top'))}</option><option value="bottom">${esc(t('bottom'))}</option></select></div>
        <div><label for="stackdHeroHeight">${esc(t('heroHeight'))}</label><input id="stackdHeroHeight" type="number" min="180" max="760" step="10" value="400"></div>
        <div><label for="stackdHeroRatio">${esc(t('heroRatio'))}</label><select id="stackdHeroRatio"><option value="16 / 9">16:9</option><option value="21 / 9">21:9</option><option value="4 / 3">4:3</option><option value="auto">${S.lang === 'en' ? 'Natural height' : S.lang === 'az' ? 'Təbii hündürlük' : 'Автоматически'}</option></select></div>
      </div>
      <label class="stackd-admin-toggle" for="stackdHeroEnabled"><input id="stackdHeroEnabled" type="checkbox" checked><span>${S.lang === 'en' ? 'Show homepage cover' : S.lang === 'az' ? 'Ana səhifə üz qabığını göstər' : 'Показывать обложку главной страницы'}</span></label>
      <label class="stackd-admin-toggle" for="stackdHeroOverlay"><input id="stackdHeroOverlay" type="checkbox" checked><span>${S.lang === 'en' ? 'Darken behind text' : S.lang === 'az' ? 'Mətnin arxa fonunu tündləşdir' : 'Затемнение под текстом'}</span></label>
      <div class="stackd-settings-grid stackd-brand-settings">
        <div><label for="stackdBrandAccent">${S.lang === 'en' ? 'Site accent color' : S.lang === 'az' ? 'Saytın vurğu rəngi' : 'Акцентный цвет сайта'}</label><input id="stackdBrandAccent" type="color" value="#c2500a"></div>
      </div>
      <p class="stackd-admin-note">${S.lang === 'en' ? 'The image is uploaded to the existing product-images bucket. Changes are published after saving.' : S.lang === 'az' ? 'Şəkil mövcud product-images anbarına yüklənir. Dəyişikliklər saxlandıqdan sonra yayımlanır.' : 'Изображение загружается в существующее хранилище product-images. Изменения публикуются после сохранения.'}</p>`;
    tab.append(section);
    $('#stackdHeroFit').value = hero.hero_fit;
    $('#stackdHeroPosition').value = hero.hero_position;
    $('#stackdHeroHeight').value = hero.hero_height;
    $('#stackdHeroRatio').value = hero.hero_ratio;
    $('#stackdHeroOverlay').checked = String(hero.hero_overlay) !== 'false';
    $('#stackdHeroEnabled').checked = String(hero.hero_enabled) !== 'false';
    $('#stackdBrandAccent').value = /^#[0-9a-f]{6}$/i.test(String(hero.brand_accent || '')) ? hero.brand_accent : '#c2500a';
    applyBrandAccent(hero.brand_accent);
    syncHeroPreview();

    $('#stackdHeroFile')?.addEventListener('change', async event => {
      const file = event.target.files?.[0];
      if (!file) { clearHeroPreviewObjectUrl(); syncHeroPreview(); return; }
      try {
        await validateProductImage(file);
        clearHeroPreviewObjectUrl();
        heroPreviewObjectUrl = URL.createObjectURL(file);
        heroImageRemoved = false;
        syncHeroPreview();
        const status = $('#stackdHeroPreviewStatus');
        if (status) status.textContent = file.name;
      } catch (error) {
        event.target.value = '';
        clearHeroPreviewObjectUrl();
        syncHeroPreview();
        toast(error.message || 'Не удалось прочитать изображение.');
      }
    });

    $('#stackdHeroRemove')?.addEventListener('click', () => {
      clearHeroPreviewObjectUrl();
      if ($('#stackdHeroFile')) $('#stackdHeroFile').value = '';
      heroImageRemoved = true;
      syncHeroPreview();
      const status = $('#stackdHeroPreviewStatus');
      if (status) status.textContent = S.lang === 'en' ? 'Default cover will be restored after saving.' : S.lang === 'az' ? 'Standart şəkil saxlandıqdan sonra bərpa olunacaq.' : 'После сохранения вернётся исходная обложка.';
    });
    $('#stackdBrandAccent')?.addEventListener('input', event => applyBrandAccent(event.target.value));
  }

  function updateHero() {
    const slider = $('#showcaseSlider');
    if (!slider) return;
    const height = Math.min(760, Math.max(180, Number(hero.hero_height) || 400));
    slider.style.height = hero.hero_ratio === 'auto' ? `${height}px` : 'auto';
    slider.style.aspectRatio = hero.hero_ratio === 'auto' ? 'auto' : hero.hero_ratio;
    const heroVisible = String(hero.hero_enabled) !== 'false';
    slider.hidden = !heroVisible;
    const showcase = slider.closest('.showcase');
    if (showcase) showcase.hidden = !heroVisible;
    slider.classList.toggle('stackd-hero-no-overlay', String(hero.hero_overlay) === 'false');
    const slides = $$('.slide', slider);
    const useCustomCover = Boolean(hero.hero_image_url) && !heroImageRemoved;
    if (useCustomCover && slides.length) {
      slides.forEach((slide, index) => {
        slide.style.display = index === 0 ? 'flex' : 'none';
        if (index === 0) {
          slide.classList.add('active');
          slide.setAttribute('aria-hidden', 'false');
          slide.style.opacity = '1';
          slide.style.transform = 'none';
        } else {
          slide.setAttribute('aria-hidden', 'true');
        }
      });
    } else {
      slides.forEach(slide => {
        slide.style.removeProperty('display');
        slide.style.removeProperty('opacity');
        slide.style.removeProperty('transform');
      });
    }
    const firstImage = slider.querySelector('.slide img');
    if (firstImage) {
      firstImage.src = useCustomCover ? safeImageUrl(hero.hero_image_url) : (defaultHeroSlide.image || firstImage.src);
      firstImage.style.objectFit = hero.hero_fit || 'cover';
      firstImage.style.objectPosition = hero.hero_position || 'center';
    }
    const firstTitle = slider.querySelector('.slide .slide-content h2');
    const firstSubtitle = slider.querySelector('.slide .slide-content p');
    if (firstTitle) firstTitle.textContent = hero.hero_title || defaultHeroSlide.title || '';
    if (firstSubtitle) firstSubtitle.textContent = hero.hero_subtitle || defaultHeroSlide.subtitle || '';
    applyBrandAccent(hero.brand_accent);
    syncHeroPreview();
  }

  initSlider = function stackdInitSlider(slides) {
    baseInitSlider(slides);
    const first = $('#showcaseSlider .slide');
    const image = first?.querySelector('img');
    defaultHeroSlide = {
      image: image?.getAttribute('src') || '',
      title: first?.querySelector('.slide-content h2')?.textContent || '',
      subtitle: first?.querySelector('.slide-content p')?.textContent || ''
    };
    updateHero();
  };
  loadSettings = async function stackdLoadSettings() {
    await baseLoadSettings();
    const { data, error } = await _supabase.from('site_settings').select('key,value');
    if (error) { console.warn('Extended settings could not be loaded:', error); return; }
    const values = new Map((data || []).map(row => [row.key, row.value]));
    for (const row of data || []) {
      if (Object.hasOwn(hero, row.key)) hero[row.key] = row.value ?? hero[row.key];
      if (Object.hasOwn(brandSettings, row.key)) brandSettings[row.key] = row.value ?? brandSettings[row.key];
    }
    syncHeroSettingsForm();
    syncBrandSettingsForm();
    const savedPromo = parseSetting(values.get('discount_config'), null);
    if (savedPromo && typeof savedPromo === 'object') promo = { enabled: savedPromo.enabled === true, scope: ['all','category','product'].includes(savedPromo.scope) ? savedPromo.scope : 'all', target: String(savedPromo.target || ''), percent: Math.max(0, Math.min(90, Number(savedPromo.percent) || 0)), label: String(savedPromo.label || 'СКИДКА').slice(0,22), originalPrices: savedPromo.originalPrices && typeof savedPromo.originalPrices === 'object' ? savedPromo.originalPrices : {} };
    const savedNews = parseSetting(values.get('news_items'), []);
    newsItems = Array.isArray(savedNews) ? savedNews.filter(item => item && typeof item.image_url === 'string').slice(0,20).map(item => ({ id: String(item.id || crypto.randomUUID()), image_url: safeImageUrl(item.image_url), title: String(item.title || '').slice(0,90), href: safeWebLink(item.href || '') })) : [];
    makeSettingsUI(); makeBrandSettingsUI(); makePromotionUI(); makeNewsUI(); updateHero(); syncHeroSettingsForm(); syncBrandSettingsForm(); syncPromotionForm(); renderNewsRail(); renderNewsAdmin();
  };

  async function saveHeroSettings(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const button = $('#saveSettingsBtn');
    const message = $('#settingsMsg');
    if (!isAdmin()) { toast('Недостаточно прав.'); return; }
    const uploadedPaths = [];
    const previousHeroImage = hero.hero_image_url || '';
    const previousLogoImage = brandSettings.brand_logo_url || '';
    if (button) button.disabled = true;
    if (message) { message.textContent = S.lang === 'en' ? 'Saving…' : S.lang === 'az' ? 'Saxlanılır…' : 'Сохранение…'; message.style.color = 'var(--muted)'; }
    try {
      let heroImageUrl = heroImageRemoved ? '' : previousHeroImage;
      const heroFile = $('#stackdHeroFile')?.files?.[0];
      if (heroFile) {
        await validateProductImage(heroFile);
        const uploaded = await uploadProductImage(heroFile);
        uploadedPaths.push(uploaded.path);
        heroImageUrl = uploaded.url;
      }
      let logoImageUrl = brandLogoRemoved ? '' : previousLogoImage;
      const logoFile = $('#stackdBrandLogoFile')?.files?.[0];
      if (logoFile) {
        await validateProductImage(logoFile);
        const uploaded = await uploadProductImage(logoFile);
        uploadedPaths.push(uploaded.path);
        logoImageUrl = uploaded.url;
      }
      const height = Math.max(180, Math.min(760, Number($('#stackdHeroHeight')?.value) || 400));
      const allowedRatios = ['16 / 9', '21 / 9', '4 / 3', 'auto'];
      const requestedRatio = $('#stackdHeroRatio')?.value || 'auto';
      const selectedColor = $('#stackdBrandAccent')?.value || '#c2500a';
      const siteName = String($('#stackdSiteName')?.value || 'Stackd').trim().slice(0, 40) || 'Stackd';
      const siteTagline = String($('#stackdSiteTagline')?.value || '').trim().slice(0, 120);
      const supportRaw = String($('#stackdSupportTelegram')?.value || '').trim().replace(/^@+/, '');
      const channelRaw = String($('#stackdChannelTelegram')?.value || '').trim().replace(/^@+/, '');
      if (!/^[A-Za-z0-9_]{5,32}$/.test(supportRaw)) throw new Error(S.lang === 'en' ? 'Enter a valid Telegram support username (5–32 characters).' : S.lang === 'az' ? 'Düzgün Telegram dəstək istifadəçi adı daxil edin (5–32 simvol).' : 'Укажите корректный username Telegram поддержки (5–32 символа).');
      if (!/^[A-Za-z0-9_]{5,32}$/.test(channelRaw)) throw new Error(S.lang === 'en' ? 'Enter a valid Telegram channel username (5–32 characters).' : S.lang === 'az' ? 'Düzgün Telegram kanal adı daxil edin (5–32 simvol).' : 'Укажите корректный username Telegram-канала (5–32 символа).');
      const supportTelegram = supportRaw;
      const channelTelegram = channelRaw;
      const rows = [
        { key: 'hero_title', value: $('#settingHeroTitle')?.value.trim() || '' },
        { key: 'hero_subtitle', value: $('#settingHeroSub')?.value.trim() || '' },
        { key: 'hero_image_url', value: heroImageUrl },
        { key: 'hero_fit', value: $('#stackdHeroFit')?.value === 'contain' ? 'contain' : 'cover' },
        { key: 'hero_position', value: ['top', 'bottom'].includes($('#stackdHeroPosition')?.value) ? $('#stackdHeroPosition').value : 'center' },
        { key: 'hero_height', value: String(height) },
        { key: 'hero_ratio', value: allowedRatios.includes(requestedRatio) ? requestedRatio : 'auto' },
        { key: 'hero_overlay', value: $('#stackdHeroOverlay')?.checked ? 'true' : 'false' },
        { key: 'hero_enabled', value: $('#stackdHeroEnabled')?.checked ? 'true' : 'false' },
        { key: 'brand_accent', value: /^#[0-9a-f]{6}$/i.test(selectedColor) ? selectedColor : '#c2500a' },
        { key: 'site_name', value: siteName },
        { key: 'site_tagline', value: siteTagline },
        { key: 'support_telegram', value: supportTelegram },
        { key: 'telegram_channel', value: channelTelegram },
        { key: 'brand_logo_url', value: logoImageUrl }
      ];
      const { error } = await _supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
      if (error) throw error;

      rows.forEach(row => {
        if (Object.hasOwn(hero, row.key)) hero[row.key] = row.value;
        if (Object.hasOwn(brandSettings, row.key)) brandSettings[row.key] = row.value;
      });
      heroImageRemoved = false;
      brandLogoRemoved = false;
      clearHeroPreviewObjectUrl();
      clearBrandLogoPreviewObjectUrl();
      if ($('#stackdHeroFile')) $('#stackdHeroFile').value = '';
      if ($('#stackdBrandLogoFile')) $('#stackdBrandLogoFile').value = '';
      updateHero();
      syncHeroSettingsForm();
      syncBrandSettingsForm();

      const oldSiteImages = new Map([
        [previousHeroImage, heroImageUrl],
        [previousLogoImage, logoImageUrl]
      ]);
      for (const [oldUrl, newUrl] of oldSiteImages) {
        const oldPath = getProductStoragePath(oldUrl);
        if (oldPath && oldUrl !== newUrl) {
          const { error: cleanupError } = await _supabase.storage.from(PRODUCT_BUCKET).remove([oldPath]);
          if (cleanupError) console.warn('Previous site image cleanup failed:', cleanupError);
        }
      }
      uploadedPaths.length = 0;
      if (message) {
        message.textContent = S.lang === 'en' ? 'Site settings saved.' : S.lang === 'az' ? 'Sayt ayarları saxlanıldı.' : 'Настройки сайта сохранены.';
        message.style.color = 'var(--success, #287a46)';
      }
      toast(tr('saved'));
    } catch (error) {
      for (const path of uploadedPaths) {
        const { error: cleanupError } = await _supabase.storage.from(PRODUCT_BUCKET).remove([path]);
        if (cleanupError) console.warn('Uncommitted site image cleanup failed:', cleanupError);
      }
      console.error('Site settings save failed:', error);
      if (message) { message.textContent = error?.message || 'Не удалось сохранить настройки.'; message.style.color = 'var(--danger, #b42318)'; }
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
  A.add = id => {
    const product = find(id);
    if (!product || !isAvailable(product)) return;
    setQty(id, 1);
  };

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
    slider.style.width = `${active.offsetWidth}px`;
    slider.style.left = `${active.offsetLeft}px`;
    slider.style.transform = 'none';
  };


  function buildProfileBalanceRow() {
    const menu = $('#stackdProfileMenu');
    if (!menu || $('#stackdProfileBalanceRow')) return;
    const row = document.createElement('div');
    row.id = 'stackdProfileBalanceRow';
    row.className = 'stackd-profile-balance-row';
    row.innerHTML = `<div><small id="stackdProfileBalanceLabel">${S.lang === 'en' ? 'Balance' : S.lang === 'az' ? 'Balans' : 'Баланс'}</small><strong id="stackdProfileBalanceValue">${esc($('#userBalance')?.textContent?.trim() || '0.00')} AZN</strong></div><button type="button" id="stackdProfileTopup">${S.lang === 'en' ? 'Top up' : S.lang === 'az' ? 'Artır' : 'Пополнить'}</button>`;
    const orders = $('#myOrdersBtn', menu);
    menu.insertBefore(row, orders || menu.firstChild);
    $('#stackdProfileTopup')?.addEventListener('click', () => {
      menu.hidden = true;
      $('#stackdProfileTrigger')?.setAttribute('aria-expanded', 'false');
      $('#topup')?.showModal();
    });
    const source = $('#userBalance');
    if (source && 'MutationObserver' in window) {
      new MutationObserver(() => {
        const target = $('#stackdProfileBalanceValue');
        if (target) target.textContent = `${source.textContent?.trim() || '0.00'} AZN`;
      }).observe(source, { childList: true, characterData: true, subtree: true });
    }
  }

  function initProfileMenu() {
    buildProfileBalanceRow();
    const trigger = $('#stackdProfileTrigger');
    const menu = $('#stackdProfileMenu');
    if (!trigger || !menu || trigger.dataset.bound === '1') return;
    trigger.dataset.bound = '1';
    const toggle = () => {
      menu.hidden = !menu.hidden;
      trigger.setAttribute('aria-expanded', String(!menu.hidden));
      if (!menu.hidden) requestAnimationFrame(updateThemeSlider);
    };
    trigger.addEventListener('click', toggle);
    document.addEventListener('click', event => {
      if (!event.target.closest('.stackd-profile-anchor')) { menu.hidden = true; trigger.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') { menu.hidden = true; trigger.setAttribute('aria-expanded', 'false'); }
    });
    $('#myOrdersBtn')?.addEventListener('click', () => { menu.hidden = true; trigger.setAttribute('aria-expanded', 'false'); });
    const logout = $('#logoutBtn');
    if (logout) logout.addEventListener('click', () => { menu.hidden = true; });
    syncProfileMenu();
    _supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => { S.user = session?.user || null; syncProfileMenu(); }, 0);
    });
  }
  function syncProfileMenu() {
    if ($('#stackdProfileEmail')) $('#stackdProfileEmail').textContent = S.user?.email || '';
    const avatar = $('#userAvatar');
    if (avatar) avatar.alt = 'Profile';
    refreshPromotionNewsLabels();
  }
  const baseCheckAuth = checkAuth;
  checkAuth = async function stackdCheckAuthWithProfile(...args) {
    const result = await baseCheckAuth(...args);
    syncProfileMenu();
    return result;
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
    if (featured?.parentElement) featured.parentElement.lastChild.nodeValue = ` ${S.lang === 'en' ? 'Show POPULAR label' : S.lang === 'az' ? 'Populyar nişanını göstər' : 'Показывать метку «Популярное»'}`;
    const titleMap = {
      stackdHeroFile: t('heroImage'), stackdHeroFit: t('heroFit'), stackdHeroPosition: t('heroPosition'),
      stackdHeroHeight: t('heroHeight'), stackdHeroRatio: t('heroRatio'), stackdBrandAccent: S.lang === 'en' ? 'Site accent color' : S.lang === 'az' ? 'Saytın vurğu rəngi' : 'Акцентный цвет сайта'
    };
    for (const [id, labelText] of Object.entries(titleMap)) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) label.textContent = labelText;
    }
    const sectionTitle = $('#stackdHeroSettings h3'); if (sectionTitle) sectionTitle.textContent = t('hero');
    const fit = $('#stackdHeroFit'); if (fit) { fit.options[0].text = t('cover'); fit.options[1].text = t('contain'); }
    const position = $('#stackdHeroPosition'); if (position) { position.options[0].text = t('center'); position.options[1].text = t('top'); position.options[2].text = t('bottom'); }
    const ratio = $('#stackdHeroRatio'); if (ratio) ratio.options[3].text = S.lang === 'en' ? 'Natural height' : S.lang === 'az' ? 'Təbii hündürlük' : 'Автоматически';
    const brandSectionTitle = $('#stackdBrandSettings .stackd-section-head h3'); if (brandSectionTitle) brandSectionTitle.textContent = t('brandTitle');
    const profileBalanceLabel = $('#stackdProfileBalanceLabel'); if (profileBalanceLabel) profileBalanceLabel.textContent = S.lang === 'en' ? 'Balance' : S.lang === 'az' ? 'Balans' : 'Баланс';
    const profileTopup = $('#stackdProfileTopup'); if (profileTopup) profileTopup.textContent = S.lang === 'en' ? 'Top up' : S.lang === 'az' ? 'Artır' : 'Пополнить';
    const brandLabels = { stackdSiteName: 'brandName', stackdSiteTagline: 'brandTagline', stackdSupportTelegram: 'supportTelegram', stackdChannelTelegram: 'channelTelegram' };
    for (const [id, key] of Object.entries(brandLabels)) { const label = document.querySelector(`label[for="${id}"]`); if (label) label.textContent = t(key); }
    const brandHint = $('#stackdBrandSettings .stackd-admin-note'); if (brandHint) brandHint.textContent = t('brandHelp');
    const brandLogoLabel = document.querySelector('label[for="stackdBrandLogoFile"]'); if (brandLogoLabel) brandLogoLabel.textContent = t('brandLogo');
    const brandLogoReset = $('#stackdBrandLogoReset'); if (brandLogoReset) brandLogoReset.textContent = t('brandLogoReset');
    applyBrandSettings();
    const enabledLabel = $('#stackdHeroEnabled')?.parentElement?.querySelector('span'); if (enabledLabel) enabledLabel.textContent = S.lang === 'en' ? 'Show homepage cover' : S.lang === 'az' ? 'Ana səhifə üz qabığını göstər' : 'Показывать обложку главной страницы';
    const overlayLabel = $('#stackdHeroOverlay')?.parentElement?.querySelector('span'); if (overlayLabel) overlayLabel.textContent = S.lang === 'en' ? 'Darken behind text' : S.lang === 'az' ? 'Mətnin arxa fonunu tündləşdir' : 'Затемнение под текстом';
    const removeHero = $('#stackdHeroRemove'); if (removeHero) removeHero.textContent = S.lang === 'en' ? 'Reset image' : S.lang === 'az' ? 'Şəkli sıfırla' : 'Сбросить изображение';
    const translateButton = $('#stackdTranslateAll'); if (translateButton) translateButton.textContent = t('translateAll');
    renderGuideText();
    refreshPromotionNewsLabels();
  }

  function placeMobileCartButton() {
    const nav = $('.nav');
    const cart = $('.nav > .cart-btn') || $('.stackd-mobile-cart');
    if (!nav || !cart) return;
    const language = ($('#currentLangLabel')?.textContent || 'RU').trim().toUpperCase();
    cart.dataset.cartLabel = language === 'EN' ? 'Cart' : language === 'AZ' ? 'Səbət' : 'Корзина';
    const badge = cart.querySelector('.badge');
    if (badge) {
      const syncBadge = () => { badge.hidden = (Number.parseInt(badge.textContent || '0', 10) || 0) <= 0; };
      syncBadge();
      if (badge.dataset.stackdBound !== '1') {
        badge.dataset.stackdBound = '1';
        new MutationObserver(syncBadge).observe(badge, { childList: true, characterData: true, subtree: true });
      }
    }
    if (window.matchMedia('(max-width: 680px)').matches) {
      if (cart.parentElement !== document.body) document.body.append(cart);
      cart.classList.add('stackd-mobile-cart');
    } else {
      cart.classList.remove('stackd-mobile-cart');
      if (cart.parentElement !== nav) nav.append(cart);
    }
  }

  function syncThemeButtons() {
    let selected = 'system';
    try { selected = localStorage.getItem('pdd.theme') || 'system'; } catch {}
    $$('.seg button[data-v]').forEach(button => {
      const active = button.dataset.v === selected;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-selected', active);
    });
  }
  updateThemeSlider = syncThemeButtons;

  function initialise() {
    injectProductFields();
    makeSettingsUI();
    makeBrandSettingsUI();
    makePromotionUI();
    makeNewsUI();
    renderNewsRail();
    initProfileMenu();
    refreshAddedLabels();
    refreshPromotionNewsLabels();
    buildCartGuide();
    bindFloodProtection();
    bindTopupRateLimit();
    placeMobileCartButton();
    syncThemeButtons();
    window.addEventListener('resize', placeMobileCartButton, { passive: true });
    const langLabel = $('#currentLangLabel');
    if (langLabel && 'MutationObserver' in window) new MutationObserver(placeMobileCartButton).observe(langLabel, { childList: true, characterData: true, subtree: true });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
      let preference = 'system';
      try { preference = localStorage.getItem('pdd.theme') || 'system'; } catch {}
      if (preference === 'system') applyTheme();
    });
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
      setTimeout(() => { refreshAddedLabels(); refreshPromotionNewsLabels(); syncThemeButtons(); }, 0);
    });
    console.info(`Stackd enhancements ${VERSION} loaded`);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise, { once: true });
  else initialise();
})();
