/* STACKED enhancements. Loaded after the existing app.js. */
(() => {
  'use strict';

  const VERSION = '1.2.0';
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
  const baseSetDraft = setDraft;
  const baseReadForm = readForm;
  let hero = { hero_image_url: '', hero_fit: 'cover', hero_position: 'center', hero_height: '400', hero_ratio: 'auto', hero_title: '', hero_subtitle: '', hero_overlay: 'true', brand_accent: '', hero_enabled: 'true' };
  let heroPreviewObjectUrl = null;
  let heroImageRemoved = false;
  let brandLogoPreviewObjectUrl = null;
  let brandLogoRemoved = false;
  let brandSettings = { site_name: 'STACKED', site_tagline: '', support_telegram: 'sharkiff', telegram_channel: 'stackdbaku', brand_logo_url: '' };
  let defaultHeroSlide = { image: '', title: '', subtitle: '' };
  let promo = { enabled: false, scope: 'all', target: '', percent: 0, label: 'СКИДКА', originalPrices: {} };
  let newsItems = [];
  let newsTimer = null;
  let newsIndex = 0;
  let translationBusy = false;
  let rateFallback = new Map();
  // The last known hero and brand settings are restored before this module paints anything, so returning
  // visitors see the cover, brand name and accent at once instead of a jump when the settings request lands.
  let heroKnown = false;
  try {
    const cached = JSON.parse(localStorage.getItem('stk.site') || 'null');
    if (cached && typeof cached === 'object') {
      for (const key of Object.keys(hero)) if (typeof cached.hero?.[key] === 'string') hero[key] = cached.hero[key];
      for (const key of Object.keys(brandSettings)) if (typeof cached.brand?.[key] === 'string') brandSettings[key] = cached.brand[key];
      heroKnown = true;
    }
  } catch { /* storage unavailable: the reserved placeholder covers the wait */ }

  function productText(product, selected = lang()) {
    const source = product.source_lang || 'ru';
    const translated = product.translations?.[selected];
    if (selected !== source && translated && typeof translated === 'object') {
      return { ...product, name: translated.name || product.name, description: translated.description || product.description, category: translated.category || product.category };
    }
    return product;
  }

  // Presentation hooks for the single renderer in app.js: translated product text and the active discount.
  productView = productText;
  productSale = product => {
    const original = Number(promo.originalPrices?.[String(product.id)]);
    if (!promo.enabled || !promotionMatches(product, promo) || !Number.isFinite(original) || !(original > Number(product.price))) return null;
    return { original, percent: Number(promo.percent), label: promo.label || 'СКИДКА' };
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
      console.error('STACKED product save failed:', error);
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
  // News carousel: one implementation (it used to be rendered as a rail here and rebuilt as a carousel by
  // stacked-shop.js through body-wide mutation observers). Handlers are set as properties on the persistent
  // stage element, so repeated renders never stack listeners.
  function renderNewsRail() {
    const catalog = $('#catalog');
    if (!catalog) return;
    let section = $('#stackdNewsRail');
    if (!section) {
      section = document.createElement('section'); section.id = 'stackdNewsRail'; section.className = 'news';
      section.innerHTML = `<div class="stackd-news-heading news-head"><h3>${esc(t('newsSection'))}</h3></div><div class="news-stage" role="region" aria-roledescription="carousel"></div>`;
      catalog.insertBefore(section, catalog.querySelector('.head') || catalog.firstChild);
    }
    const stage = $('.news-stage', section);
    if (newsTimer) { clearInterval(newsTimer); newsTimer = null; }
    const items = newsItems.filter(item => item && item.image_url);
    newsIndex = 0; section.hidden = !items.length;
    if (!items.length) { stage.replaceChildren(); return; }
    stage.innerHTML = `<div class="news-slides">${items.map((item, index) => {
      const inner = `<img src="${esc(safeImageUrl(item.image_url))}" alt="${esc(item.title || 'STACKED')}" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async">${item.title ? `<span class="news-cap">${esc(item.title)}</span>` : ''}`;
      const href = safeWebLink(item.href), hidden = index === 0 ? '' : ' aria-hidden="true"';
      return href
        ? `<a class="news-slide${index === 0 ? ' is-on' : ''}" href="${esc(href)}" target="_blank" rel="noopener noreferrer"${hidden}${index === 0 ? '' : ' tabindex="-1"'}>${inner}</a>`
        : `<div class="news-slide${index === 0 ? ' is-on' : ''}"${hidden}>${inner}</div>`;
    }).join('')}</div>${items.length > 1 ? `<div class="news-dots">${items.map((_, index) => `<button type="button" data-go="${index}" aria-label="${index + 1} / ${items.length}"${index === 0 ? ' aria-current="true"' : ''}></button>`).join('')}</div>` : ''}`;
    if (items.length < 2) return;
    const slides = $$('.news-slide', stage), dots = $$('.news-dots button', stage);
    const show = index => {
      newsIndex = (index + items.length) % items.length;
      slides.forEach((slide, i) => {
        const on = i === newsIndex;
        slide.classList.toggle('is-on', on);
        if (on) slide.removeAttribute('aria-hidden'); else slide.setAttribute('aria-hidden', 'true');
        if (slide.tagName === 'A') slide.tabIndex = on ? 0 : -1;
      });
      dots.forEach((dot, i) => { if (i === newsIndex) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current'); });
    };
    const start = () => {
      clearInterval(newsTimer);
      newsTimer = setInterval(() => { if (!document.hidden && !matchMedia('(prefers-reduced-motion: reduce)').matches) show(newsIndex + 1); }, 6000);
    };
    let startX = null;
    stage.onclick = event => { const dot = event.target.closest('[data-go]'); if (dot) { show(Number(dot.dataset.go)); start(); } };
    stage.onpointerenter = () => clearInterval(newsTimer);
    stage.onpointerleave = start;
    stage.onpointerdown = event => { startX = event.clientX; };
    stage.onpointerup = event => {
      if (startX !== null && Math.abs(event.clientX - startX) > 40) { show(newsIndex + (event.clientX < startX ? 1 : -1)); start(); }
      startX = null;
    };
    start();
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
    if ($('#stackdSiteName')) $('#stackdSiteName').value = brandSettings.site_name || 'STACKED';
    if ($('#stackdSiteTagline')) $('#stackdSiteTagline').value = brandSettings.site_tagline || '';
    if ($('#stackdSupportTelegram')) $('#stackdSupportTelegram').value = brandSettings.support_telegram || 'sharkiff';
    if ($('#stackdChannelTelegram')) $('#stackdChannelTelegram').value = brandSettings.telegram_channel || 'stackdbaku';
    syncBrandPreview();
    applyBrandSettings();
  }

  function applyBrandSettings() {
    const name = String(brandSettings.site_name || '').trim().slice(0, 40) || 'STACKED';
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
    document.title = `${name} Baku - Food Deals, Discounts & Online Orders`;
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
      <input id="stackdSiteName" type="text" maxlength="40" autocomplete="off" value="STACKED">
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
        brandSettings.site_name = $('#stackdSiteName')?.value || 'STACKED';
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

  function ensureShowcaseHero() {
    const showcase = $('.showcase');
    if (!showcase) return null;
    let card = $('#stackdShowcaseHero');
    if (card) return card;
    card = document.createElement('section');
    card.id = 'stackdShowcaseHero';
    card.className = 'stackd-showcase-hero';
    card.setAttribute('aria-label', 'STACKED');
    card.innerHTML = `
      <img class="stackd-showcase-image" alt="" decoding="async" fetchpriority="high">
      <div class="stackd-showcase-shade" aria-hidden="true"></div>
      <div class="stackd-showcase-copy">
        <span class="stackd-showcase-kicker">STACKED / SPECIAL OFFERS</span>
        <h1 id="stackdShowcaseTitle"></h1>
        <p id="stackdShowcaseSubtitle"></p>
        <a class="stackd-showcase-cta" href="#catalog"><span id="stackdShowcaseCta"></span><span aria-hidden="true">↘</span></a>
      </div>`;
    showcase.prepend(card);
    return card;
  }

  function updateHero() {
    const slider = $('#showcaseSlider');
    const showcase = slider?.closest('.showcase') || $('.showcase');
    const card = ensureShowcaseHero();
    if (!showcase || !card) return;
    const heroVisible = String(hero.hero_enabled) !== 'false';
    const slideImage = defaultHeroSlide.image || slider?.querySelector('.slide img')?.getAttribute('src') || '';
    const imageUrl = (hero.hero_image_url && !heroImageRemoved) ? hero.hero_image_url : slideImage;
    const image = $('.stackd-showcase-image', card);
    if (image) {
      const safe = safeImageUrl(imageUrl);
      if (image.getAttribute('src') !== safe) image.src = safe;
      image.style.objectFit = hero.hero_fit === 'contain' ? 'contain' : 'cover';
      image.style.objectPosition = ['top', 'bottom'].includes(hero.hero_position) ? hero.hero_position : 'center';
    }
    const height = Math.max(210, Math.min(460, Number.parseInt(hero.hero_height || '340', 10) || 340));
    const ratio = ['16 / 9', '21 / 9', '4 / 3'].includes(hero.hero_ratio) ? hero.hero_ratio : 'auto';
    card.style.setProperty('--stackd-showcase-height', `${height}px`);
    card.style.aspectRatio = ratio === 'auto' ? 'auto' : ratio;
    card.style.height = ratio === 'auto' ? `${height}px` : 'auto';
    card.style.maxHeight = `${height}px`;
    const shade = $('.stackd-showcase-shade', card);
    if (shade) shade.hidden = String(hero.hero_overlay) === 'false';
    const title = $('#stackdShowcaseTitle');
    const subtitle = $('#stackdShowcaseSubtitle');
    const cta = $('#stackdShowcaseCta');
    if (title) title.textContent = hero.hero_title || defaultHeroSlide.title || (S.lang === 'en' ? 'Discover STACKED offers' : S.lang === 'az' ? 'STACKED təkliflərini kəşf edin' : 'Выгодные предложения STACKED');
    if (subtitle) {
      subtitle.textContent = hero.hero_subtitle || defaultHeroSlide.subtitle || (S.lang === 'en' ? 'Selected offers in one place.' : S.lang === 'az' ? 'Seçilmiş təkliflər bir yerdə.' : 'Подборка предложений в одном месте.');
      subtitle.hidden = !subtitle.textContent.trim();
    }
    if (cta) cta.textContent = S.lang === 'en' ? 'Explore offers' : S.lang === 'az' ? 'Təkliflərə bax' : 'Смотреть предложения';
    const visible = heroVisible && Boolean(imageUrl);
    card.hidden = !visible;
    // Until the settings are known the section keeps its reserved height, so the cover does not push the page down when it appears.
    showcase.hidden = heroKnown && !visible;
    showcase.toggleAttribute('data-pending', !heroKnown);
    // Keep the custom hero static. The legacy 5-second slider used to switch
    // to a hidden slide and make the cover disappear on some devices.
    if (slider) slider.hidden = true;
    applyBrandAccent(hero.brand_accent);
    syncHeroPreview();
  }

  function applySlides() {
    const first = S.slides[0];
    defaultHeroSlide = { image: first?.image_url || '', title: first?.title || '', subtitle: first?.description || '' };
    updateHero();
  }
  // Settings arrive once from app.js (one shared request) instead of being fetched again here.
  function applySettings({ values }) {
    const data = [...values].map(([key, value]) => ({ key, value }));
    for (const row of data || []) {
      if (Object.hasOwn(hero, row.key)) hero[row.key] = row.value ?? hero[row.key];
      if (Object.hasOwn(brandSettings, row.key)) brandSettings[row.key] = row.value ?? brandSettings[row.key];
    }
    heroKnown = true;
    try { localStorage.setItem('stk.site', JSON.stringify({ hero, brand: brandSettings })); } catch { /* storage unavailable */ }
    syncHeroSettingsForm();
    syncBrandSettingsForm();
    const savedPromo = parseSetting(values.get('discount_config'), null);
    if (savedPromo && typeof savedPromo === 'object') promo = { enabled: savedPromo.enabled === true, scope: ['all','category','product'].includes(savedPromo.scope) ? savedPromo.scope : 'all', target: String(savedPromo.target || ''), percent: Math.max(0, Math.min(90, Number(savedPromo.percent) || 0)), label: String(savedPromo.label || 'СКИДКА').slice(0,22), originalPrices: savedPromo.originalPrices && typeof savedPromo.originalPrices === 'object' ? savedPromo.originalPrices : {} };
    const savedNews = parseSetting(values.get('news_items'), []);
    newsItems = Array.isArray(savedNews) ? savedNews.filter(item => item && typeof item.image_url === 'string').slice(0,20).map(item => ({ id: String(item.id || crypto.randomUUID()), image_url: safeImageUrl(item.image_url), title: String(item.title || '').slice(0,90), href: safeWebLink(item.href || '') })) : [];
    makeSettingsUI(); makeBrandSettingsUI(); makePromotionUI(); makeNewsUI(); updateHero(); syncHeroSettingsForm(); syncBrandSettingsForm(); syncPromotionForm(); renderNewsRail(); renderNewsAdmin();
    if (S.catalogReady) renderAll();   // discounts and translations change what the cards show
  }

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
      const siteName = String($('#stackdSiteName')?.value || 'STACKED').trim().slice(0, 40) || 'STACKED';
      const siteTagline = String($('#stackdSiteTagline')?.value || '').trim().slice(0, 120);
      const supportRaw = String($('#stackdSupportTelegram')?.value || '').trim().replace(/^@+/, '');
      const channelRaw = String($('#stackdChannelTelegram')?.value || '').trim().replace(/^@+/, '');
      if (!/^[A-Za-z0-9_]{5,32}$/.test(supportRaw)) throw new Error(S.lang === 'en' ? 'Enter a valid Telegram support username (5-32 characters).' : S.lang === 'az' ? 'Düzgün Telegram dəstək istifadəçi adı daxil edin (5-32 simvol).' : 'Укажите корректный username Telegram поддержки (5-32 символа).');
      if (!/^[A-Za-z0-9_]{5,32}$/.test(channelRaw)) throw new Error(S.lang === 'en' ? 'Enter a valid Telegram channel username (5-32 characters).' : S.lang === 'az' ? 'Düzgün Telegram kanal adı daxil edin (5-32 simvol).' : 'Укажите корректный username Telegram-канала (5-32 символа).');
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
    const guide = document.createElement('details');
    guide.id = 'stackdPurchaseGuide'; guide.className = 'guide';
    guide.innerHTML = `<summary>${esc(t('guideTitle'))}</summary><p>${esc(t('guide1'))}</p><p>${esc(t('guide2'))}</p><p>${esc(t('guide3'))}</p>`;
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
    if (guide) guide.innerHTML = `<summary>${esc(t('guideTitle'))}</summary><p>${esc(t('guide1'))}</p><p>${esc(t('guide2'))}</p><p>${esc(t('guide3'))}</p>`;
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
    const confirmOrder = async () => {
      completed = true; measure(); paint(max); swipe.classList.add('is-complete');
      if (hint) hint.textContent = t('preparing');
      const preparing = $('#stackdPreparing'); if (preparing) preparing.hidden = false;
      try { await A.checkout(); }
      finally {
        setTimeout(() => { completed = false; swipe.classList.remove('is-complete'); paint(0); if (preparing) preparing.hidden = true; if (hint) hint.textContent = ''; }, 1600);
      }
    };
    const release = confirmed => {
      if (!dragging) return;
      dragging = false; track.classList.remove('is-dragging');
      if (confirmed && max > 0 && offset / max >= 0.88) { confirmOrder(); return; }
      paint(0);
      if (confirmed && hint) { hint.textContent = t('swipeAgain'); setTimeout(() => { if (hint) hint.textContent = ''; }, 1500); }
    };
    thumb.addEventListener('pointerup', () => release(true));
    thumb.addEventListener('pointercancel', () => release(false));   // an interrupted gesture never places an order
    // Keyboard and assistive technology cannot drag: activating the handle confirms the order directly.
    thumb.addEventListener('click', event => { if (event.detail === 0 && !completed && !S.checkoutBusy) confirmOrder(); });
    window.addEventListener('resize', () => { measure(); paint(0); });
    measure(); paint(0);
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

  // Rate-limit checkout without changing its RPC/Telegram/QR implementation.

  const originalCheckoutAction = A.checkout;
  A.checkout = async (...args) => {
    if (S.checkoutBusy) return;
    if (!(await rateLimit('checkout', 5, 60))) return;
    return originalCheckoutAction(...args);
  };

  let topupHistoryTimer = null;
  let topupHistoryBusy = false;

  function makeTopupHistoryUI() {
    if (!$('#stackdTopupHistory')) {
      const dialog = document.createElement('dialog');
      dialog.id = 'stackdTopupHistory';
      dialog.className = 'modal wide stackd-topup-history';
      dialog.setAttribute('aria-labelledby', 'stackdTopupHistoryTitle');
      dialog.innerHTML = `
        <header class="stackd-history-head">
          <div><h2 id="stackdTopupHistoryTitle">История пополнений</h2><p id="stackdTopupHistoryNote">Статус каждой заявки обновляется после проверки.</p></div>
          <button class="icon-btn" type="button" data-act="close" aria-label="Закрыть"><svg class="ic"><use href="#i-x"/></svg></button>
        </header>
        <div class="stackd-history-toolbar"><span id="stackdTopupHistorySummary"></span><button class="btn btn-ghost sm" type="button" id="stackdTopupHistoryRefresh">Обновить</button></div>
        <div id="stackdTopupHistoryList" class="stackd-topup-history-list" aria-live="polite"><p class="stackd-history-state">Загрузка…</p></div>`;
      document.body.append(dialog);
      dialog.addEventListener('close', () => {
        if (topupHistoryTimer) clearInterval(topupHistoryTimer);
        topupHistoryTimer = null;
      });
      $('#stackdTopupHistoryRefresh')?.addEventListener('click', loadTopupHistory);
      A['topup-history'] = openTopupHistory;
    }
  }

  function topupStatusLabel(status) {
    const labels = {
      pending: { ru: 'Ожидает проверки', en: 'Under review', az: 'Yoxlanılır' },
      approved: { ru: 'Зачислено', en: 'Credited', az: 'Balansa əlavə edildi' },
      rejected: { ru: 'Отклонено', en: 'Rejected', az: 'Rədd edildi' }
    };
    return labels[String(status || '').toLowerCase()]?.[lang()] || String(status || '-');
  }

  async function loadTopupHistory() {
    const host = $('#stackdTopupHistoryList');
    if (!host || !S.user || topupHistoryBusy) return;
    topupHistoryBusy = true;
    const refresh = $('#stackdTopupHistoryRefresh');
    if (refresh) refresh.disabled = true;
    try {
      const { data, error } = await _supabase.from('topups')
        .select('id,amount,status,created_at')
        .eq('user_id', S.user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      const locale = S.lang === 'az' ? 'az-AZ' : S.lang === 'en' ? 'en-US' : 'ru-RU';
      const summary = $('#stackdTopupHistorySummary');
      if (summary) summary.textContent = S.lang === 'en' ? `${rows.length} recent requests` : S.lang === 'az' ? `${rows.length} son müraciət` : `${rows.length} последних заявок`;
      if (!rows.length) {
        host.innerHTML = `<p class="stackd-history-state">${S.lang === 'en' ? 'No top-ups yet.' : S.lang === 'az' ? 'Hələ balans artırılmayıb.' : 'Заявок на пополнение пока нет.'}</p>`;
      } else {
        host.innerHTML = rows.map(row => {
          const id = String(row.id || '');
          const date = row.created_at ? new Date(row.created_at) : null;
          const dateText = date && !Number.isNaN(date.getTime()) ? date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : '-';
          const amount = Number(row.amount);
          const amountText = Number.isFinite(amount) ? `${amount.toFixed(2)} AZN` : '- AZN';
          const status = ['pending','approved','rejected'].includes(String(row.status)) ? String(row.status) : 'pending';
          return `<article class="stackd-topup-item"><div class="stackd-topup-item-main"><strong>${esc(amountText)}</strong><small>${esc(dateText)} · ${esc(id.slice(0, 8).toUpperCase())}</small></div><span class="stackd-topup-status is-${status}">${esc(topupStatusLabel(status))}</span></article>`;
        }).join('');
      }
      // Refresh the displayed wallet balance after an operator approves a request.
      const { data: profile, error: profileError } = await _supabase.from('profiles').select('balance').eq('id', S.user.id).maybeSingle();
      if (!profileError && profile && $('#userBalance')) {
        $('#userBalance').textContent = Number(profile.balance || 0).toFixed(2);
        if (S.profile) S.profile.balance = profile.balance;
        const balanceValue = $('#stackdProfileBalanceValue');
        if (balanceValue) balanceValue.textContent = `${Number(profile.balance || 0).toFixed(2)} AZN`;
      }
    } catch (error) {
      console.error('Top-up history load failed:', error);
      host.innerHTML = `<p class="stackd-history-state is-error">${S.lang === 'en' ? 'Could not load top-up history. Check your connection and the topups read policy.' : S.lang === 'az' ? 'Balans tarixçəsini yükləmək olmadı. Bağlantını və topups oxuma icazəsini yoxlayın.' : 'Не удалось загрузить историю. Проверьте соединение и политику чтения таблицы topups.'}</p>`;
    } finally {
      topupHistoryBusy = false;
      if (refresh) refresh.disabled = false;
    }
  }

  function openTopupHistory() {
    if (!S.user) { openDlg($('#auth')); return; }
    const dialog = $('#stackdTopupHistory');
    if (!dialog) return;
    openDlg(dialog);
    loadTopupHistory();
    if (topupHistoryTimer) clearInterval(topupHistoryTimer);
    topupHistoryTimer = setInterval(() => {
      if (!dialog.open) { clearInterval(topupHistoryTimer); topupHistoryTimer = null; return; }
      loadTopupHistory();
    }, 12000);
  }

  // The profile menu itself is static markup opened through the overlay manager (A.profile in app.js).
  function initProfileMenu() {
    makeTopupHistoryUI();
    syncProfileMenu();
  }
  function syncProfileMenu() {
    if ($('#stackdProfileEmail')) $('#stackdProfileEmail').textContent = S.user?.email || '';
    const avatar = $('#userAvatar');
    if (avatar) avatar.alt = 'Profile';
    const historyButton = $('#stackdTopupHistoryOpen');
    if (historyButton) historyButton.textContent = S.lang === 'en' ? 'Top-up history' : S.lang === 'az' ? 'Balans tarixçəsi' : 'История пополнений';
    const historyTitle = $('#stackdTopupHistoryTitle');
    if (historyTitle) historyTitle.textContent = S.lang === 'en' ? 'Top-up history' : S.lang === 'az' ? 'Balans tarixçəsi' : 'История пополнений';
    const historyNote = $('#stackdTopupHistoryNote');
    if (historyNote) historyNote.textContent = S.lang === 'en' ? 'Each request updates after it is reviewed.' : S.lang === 'az' ? 'Hər müraciətin statusu yoxlamadan sonra yenilənir.' : 'Статус каждой заявки обновляется после проверки.';
    const historyRefresh = $('#stackdTopupHistoryRefresh');
    if (historyRefresh) historyRefresh.textContent = S.lang === 'en' ? 'Refresh' : S.lang === 'az' ? 'Yenilə' : 'Обновить';
    refreshPromotionNewsLabels();
  }

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
    bindTopupRateLimit();
    const productForm = $('#pform');
    productForm?.addEventListener('submit', saveProductWithExtras, true);
    $('#saveSettingsBtn')?.addEventListener('click', saveHeroSettings, true);
    window.addEventListener('resize', () => { requestAnimationFrame(updateChipsSlider); updateHero(); }, { passive: true });
    // Data and language reach this module through app.js events (sticky: late subscribers get the latest value),
    // so nothing is fetched twice and no DOM observers are needed to notice changes.
    subscribe('stackd:slides', applySlides);
    subscribe('stackd:settings', applySettings);
    subscribe('stackd:catalog', () => { renderPromotionTargetOptions(); syncPromotionForm(); });
    subscribe('stackd:auth', syncProfileMenu);
    subscribe('stackd:lang', () => { refreshAddedLabels(); refreshPromotionNewsLabels(); updateHero(); syncProfileMenu(); });
    console.info(`STACKED enhancements ${VERSION} loaded`);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise, { once: true });
  else initialise();
})();
