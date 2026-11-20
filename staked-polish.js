/* STAKED appearance settings: independent site / New Year backgrounds for light and dark mode. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const KEYS = ['site_bg_light','site_bg_dark','site_bg_light_color','site_bg_dark_color','winter_bg_light','winter_bg_dark'];
  const defaults = {
    site_bg_light:'', site_bg_dark:'',
    site_bg_light_color:'#f7f3ec', site_bg_dark_color:'#141311',
    winter_bg_light:'', winter_bg_dark:''
  };
  const state = Object.assign({}, defaults);
  const COPY = {
    ru:{
      title:'Фоны сайта',
      note:'Отдельные изображения для обычной и новогодней темы. Для каждой темы можно задать светлый и тёмный вариант.',
      normalLight:'Обычная тема · Светлая',normalDark:'Обычная тема · Тёмная',
      winterLight:'Новогодняя тема · Светлая',winterDark:'Новогодняя тема · Тёмная',
      colorLight:'Цвет подложки · Светлая',colorDark:'Цвет подложки · Тёмная',
      save:'Сохранить фоны',saveAll:'Сохранить всё оформление',
      saveAllNote:'Сохранит первый экран и бренд, зимнюю тему и четыре фоновых варианта.',
      saved:'Фоны сохранены.',allSaved:'Оформление сохранено.',failed:'Не удалось сохранить настройки.',
      url:'HTTPS-ссылка на изображение',file:'Или загрузите JPG, PNG или WebP до 5 МБ',
      empty:'Файл не выбран',bad:'Нужна HTTPS-ссылка или изображение JPG, PNG, WebP размером до 5 МБ.',
      saving:'Сохранение…',partial:'Некоторые настройки не сохранились. Проверьте сообщения в соответствующих разделах.'
    },
    en:{
      title:'Site backgrounds',
      note:'Separate images for the standard and New Year themes, with independent light and dark variants.',
      normalLight:'Standard theme · Light',normalDark:'Standard theme · Dark',
      winterLight:'New Year theme · Light',winterDark:'New Year theme · Dark',
      colorLight:'Surface color · Light',colorDark:'Surface color · Dark',
      save:'Save backgrounds',saveAll:'Save all appearance settings',
      saveAllNote:'Saves the hero and brand, winter theme, and all four background variants.',
      saved:'Backgrounds saved.',allSaved:'Appearance settings saved.',failed:'Could not save settings.',
      url:'HTTPS image URL',file:'Or upload JPG, PNG or WebP up to 5 MB',
      empty:'No file selected',bad:'Use an HTTPS URL or JPG, PNG or WebP image up to 5 MB.',
      saving:'Saving…',partial:'Some settings were not saved. Check the messages in the relevant sections.'
    },
    az:{
      title:'Sayt fonları',
      note:'Adi və Yeni il mövzuları üçün ayrıca şəkillər. Hər mövzunun açıq və tünd variantı var.',
      normalLight:'Adi mövzu · Açıq',normalDark:'Adi mövzu · Tünd',
      winterLight:'Yeni il mövzusu · Açıq',winterDark:'Yeni il mövzusu · Tünd',
      colorLight:'Fon rəngi · Açıq',colorDark:'Fon rəngi · Tünd',
      save:'Fonları saxla',saveAll:'Bütün görünüşü saxla',
      saveAllNote:'İlk ekranı və brendi, qış mövzusunu və dörd fon variantını saxlayır.',
      saved:'Fonlar saxlanıldı.',allSaved:'Görünüş parametrləri saxlanıldı.',failed:'Parametrləri saxlamaq mümkün olmadı.',
      url:'Şəklin HTTPS keçidi',file:'Və ya 5 MB-dək JPG, PNG və ya WebP yükləyin',
      empty:'Fayl seçilməyib',bad:'HTTPS keçidi və ya 5 MB-dək JPG, PNG, WebP şəkli seçin.',
      saving:'Saxlanılır…',partial:'Bəzi parametrlər saxlanılmadı. Müvafiq bölmələrdəki bildirişləri yoxlayın.'
    }
  };
  const lang = () => {
    try { return ['ru','en','az'].includes(S.lang) ? S.lang : 'ru'; }
    catch { return 'ru'; }
  };
  const t = key => COPY[lang()][key];
  const isDark = () => document.documentElement.classList.contains('stacked-dark') || document.documentElement.dataset.theme === 'dark';
  const isWinter = () => Boolean(window.stWinter && window.stWinter.on);
  function safeUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
      const url = new URL(raw);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
    } catch { return null; }
  }
  function apply() {
    const dark = isDark();
    const winter = isWinter();
    const key = winter ? (dark ? 'winter_bg_dark' : 'winter_bg_light') : (dark ? 'site_bg_dark' : 'site_bg_light');
    const colorKey = dark ? 'site_bg_dark_color' : 'site_bg_light_color';
    const url = state[key] || '';
    const body = document.body;
    if (!body) return;
    body.style.backgroundColor = state[colorKey] || defaults[colorKey];
    if (winter) {
      body.style.backgroundImage = 'none';
      const scene = $('.stw-bg .stw-scene');
      const bg = $('.stw-bg');
      if (scene && bg) {
        if (!scene.dataset.defaultSrc) scene.dataset.defaultSrc = scene.getAttribute('src') || '';
        if (url) {
          scene.src = url;
          scene.dataset.custom = 'true';
          bg.dataset.custom = 'true';
          scene.onerror = () => {
            scene.onerror = null;
            scene.src = scene.dataset.defaultSrc || '';
            delete scene.dataset.custom;
            delete bg.dataset.custom;
          };
        } else if (scene.dataset.custom === 'true') {
          scene.src = scene.dataset.defaultSrc || '';
          delete scene.dataset.custom;
          delete bg.dataset.custom;
          scene.onerror = null;
        }
      }
    } else {
      body.style.backgroundImage = url ? 'url("' + url.replace(/(["\\])/g, '\\$1') + '")' : '';
      body.style.backgroundSize = url ? 'cover' : '';
      body.style.backgroundPosition = url ? 'center top' : '';
      body.style.backgroundRepeat = url ? 'no-repeat' : '';
      const scene = $('.stw-bg .stw-scene');
      const bg = $('.stw-bg');
      if (scene && bg && scene.dataset.custom === 'true') {
        scene.src = scene.dataset.defaultSrc || scene.src;
        delete scene.dataset.custom;
        delete bg.dataset.custom;
        scene.onerror = null;
      }
    }
  }
  async function load() {
    if (typeof _supabase === 'undefined') return;
    try {
      const result = await _supabase.from('site_settings').select('key,value').in('key', KEYS);
      if (result.error) throw result.error;
      (result.data || []).forEach(row => {
        if (KEYS.includes(row.key)) state[row.key] = String(row.value ?? defaults[row.key]);
      });
      renderForm();
      apply();
    } catch (error) {
      console.warn('STAKED background settings unavailable:', error && error.message);
    }
  }
  function isValidImage(file) {
    return Boolean(file && file.size <= 5 * 1024 * 1024 && ['image/jpeg','image/png','image/webp'].includes(file.type));
  }
  async function hasValidSignature(file) {
    const bytes = new Uint8Array(await file.slice(0,12).arrayBuffer());
    if (file.type === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    if (file.type === 'image/png') return [137,80,78,71,13,10,26,10].every((value,index) => bytes[index] === value);
    if (file.type === 'image/webp') return String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP';
    return false;
  }
  async function upload(file,key) {
    if (!file) return '';
    if (!isValidImage(file) || !(await hasValidSignature(file))) throw new Error(t('bad'));
    const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2);
    const path = 'backgrounds/' + key + '-' + id + '.' + ext;
    const result = await _supabase.storage.from('site-media').upload(path,file,{
      upsert:false,contentType:file.type,cacheControl:'31536000'
    });
    if (result.error) throw result.error;
    return _supabase.storage.from('site-media').getPublicUrl(path).data.publicUrl;
  }
  let panel = null;
  const fields = [
    {key:'site_bg_light',label:'normalLight'},
    {key:'site_bg_dark',label:'normalDark'},
    {key:'winter_bg_light',label:'winterLight'},
    {key:'winter_bg_dark',label:'winterDark'}
  ];
  function build() {
    const host = $('#tab-settings');
    if (!host || panel || typeof S === 'undefined' || !S.user || typeof window.stakedCanManage !== 'function' || !window.stakedCanManage()) return;
    panel = document.createElement('section');
    panel.id = 'stakedBackgroundSettings';
    panel.className = 'stackd-settings-section staked-background-settings';
    let markup = '<div class="stackd-section-head"><h3></h3><span>APPEARANCE</span></div><p class="stackd-admin-note"></p>';
    markup += '<div class="staked-save-all-row"><button id="stakedSaveAllAppearance" class="btn btn-primary" type="button"></button><small></small></div>';
    fields.forEach(field => {
      markup += '<div class="staked-bg-field"><label for="staked-' + field.key + '"></label>';
      markup += '<input id="staked-' + field.key + '" type="url" inputmode="url" placeholder="https://">';
      markup += '<small class="staked-bg-url-help"></small>';
      markup += '<label for="staked-file-' + field.key + '"></label>';
      markup += '<input id="staked-file-' + field.key + '" type="file" accept="image/jpeg,image/png,image/webp">';
      markup += '<span class="staked-file-name"></span></div>';
    });
    markup += '<div class="staked-bg-colors"><div><label for="staked-site_bg_light_color"></label><input id="staked-site_bg_light_color" type="color"></div>';
    markup += '<div><label for="staked-site_bg_dark_color"></label><input id="staked-site_bg_dark_color" type="color"></div></div>';
    markup += '<button id="stakedBackgroundSave" class="btn btn-ghost" type="button"></button><p id="stakedBackgroundMessage" class="msg" role="status"></p>';
    panel.innerHTML = markup;
    host.append(panel);
    renderForm();
    panel.addEventListener('change',event => {
      const field = event.target;
      if (field && field.type === 'file') {
        const name = field.files && field.files[0] ? field.files[0].name : t('empty');
        field.parentElement.querySelector('.staked-file-name').textContent = name;
      }
    });
    $('#stakedBackgroundSave').addEventListener('click', saveBackgrounds);
    $('#stakedSaveAllAppearance').addEventListener('click', saveAllAppearance);
  }
  function renderForm() {
    if (!panel) return;
    const copy = COPY[lang()];
    panel.querySelector('.stackd-section-head h3').textContent = copy.title;
    panel.querySelector('.stackd-admin-note').textContent = copy.note;
    fields.forEach(field => {
      panel.querySelector('label[for="staked-' + field.key + '"]').textContent = copy[field.label];
      $('#staked-' + field.key).value = state[field.key] || '';
      $('#staked-' + field.key).nextElementSibling.textContent = copy.url;
      panel.querySelector('label[for="staked-file-' + field.key + '"]').textContent = copy.file;
      const fileInput = $('#staked-file-' + field.key);
      if (!fileInput.files || !fileInput.files.length) fileInput.nextElementSibling.textContent = copy.empty;
    });
    $('#staked-site_bg_light_color').previousElementSibling.textContent = copy.colorLight;
    $('#staked-site_bg_dark_color').previousElementSibling.textContent = copy.colorDark;
    $('#staked-site_bg_light_color').value = state.site_bg_light_color;
    $('#staked-site_bg_dark_color').value = state.site_bg_dark_color;
    $('#stakedBackgroundSave').textContent = copy.save;
    $('#stakedSaveAllAppearance').textContent = copy.saveAll;
    $('#stakedSaveAllAppearance').nextElementSibling.textContent = copy.saveAllNote;
  }
  async function saveBackgrounds() {
    const button = $('#stakedBackgroundSave');
    const message = $('#stakedBackgroundMessage');
    if (!button || button.disabled) return false;
    button.disabled = true;
    message.textContent = t('saving');
    try {
      const next = Object.assign({},state);
      for (const field of fields) {
        const input = $('#staked-' + field.key);
        const fileInput = $('#staked-file-' + field.key);
        const typed = safeUrl(input.value);
        if (input.value.trim() && !typed) throw new Error(t('bad'));
        next[field.key] = fileInput.files && fileInput.files[0] ? await upload(fileInput.files[0],field.key) : typed;
      }
      next.site_bg_light_color = $('#staked-site_bg_light_color').value;
      next.site_bg_dark_color = $('#staked-site_bg_dark_color').value;
      const rows = KEYS.map(key => ({key,value:next[key]}));
      const result = await _supabase.from('site_settings').upsert(rows,{onConflict:'key'});
      if (result.error) throw result.error;
      Object.assign(state,next);
      fields.forEach(field => { $('#staked-file-' + field.key).value = ''; });
      apply();
      message.textContent = t('saved');
      return true;
    } catch(error) {
      console.error('STAKED background save failed:',error);
      message.textContent = error && error.message ? error.message : t('failed');
      return false;
    } finally { button.disabled = false; }
  }
  async function saveAllAppearance() {
    const button = $('#stakedSaveAllAppearance');
    if (!button || button.disabled) return;
    button.disabled = true;
    const results = [];
    try {
      if (typeof window.stakedSaveHeroSettings === 'function') results.push(await window.stakedSaveHeroSettings());
      if (typeof window.stakedSaveWinterSettings === 'function') results.push(await window.stakedSaveWinterSettings());
      results.push(await saveBackgrounds());
      const ok = results.every(value => value === true);
      $('#stakedBackgroundMessage').textContent = ok ? t('allSaved') : t('partial');
    } finally { button.disabled = false; }
  }
  function maybeBuild() { build(); }
  document.addEventListener('click',event => {
    if (event.target.closest('[data-lang]')) setTimeout(renderForm,0);
  });
  if (window.MutationObserver) {
    new MutationObserver(apply).observe(document.documentElement,{attributes:true,attributeFilter:['class','data-theme']});
  }
  if (typeof _supabase !== 'undefined') {
    _supabase.auth.onAuthStateChange(() => setTimeout(maybeBuild,0));
  }
  maybeBuild();
  load();
  window.stakedAppearance = {apply:apply,load:load,state:state};
})();
