(() => {
  "use strict";

  const OWNER_EMAIL = "yuska20102010@gmail.com";
  const TABLE = "site_maintenance_settings";
  const STORAGE_BUCKET = "product-images";
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

  const DEFAULTS = {
    id: 1,
    enabled: false,
    eyebrow: "STACKED • BAKU",
    title: "Скоро вернёмся",
    message: "Сейчас мы обновляем STACKED. Сайт снова будет доступен совсем скоро.",
    font_family: "manrope",
    font_scale: 1,
    theme: "dark",
    accent_color: "#F07A2A",
    template: "midnight",
    background_color: "#141311",
    background_image_url: "",
    background_overlay: 0.42,
    decor_image_url: "",
    decor_position: "right",
    decor_shape: "rounded",
    decor_scale: 1
  };

  const FONTS = {
    manrope: 'Manrope, Inter, ui-sans-serif, system-ui, sans-serif',
    inter: 'Inter, ui-sans-serif, system-ui, sans-serif',
    "space-grotesk": '"Space Grotesk", Inter, sans-serif',
    playfair: '"Playfair Display", Georgia, serif',
    system: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    rounded: '"Trebuchet MS", Arial, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: 'ui-monospace, SFMono-Regular, Consolas, monospace'
  };

  const THEMES = [
    { id: "midnight", name: "Midnight Luxe", note: "Тёмный фирменный", bg: "#141311", accent: "#F07A2A", theme: "dark" },
    { id: "warm", name: "Warm Minimal", note: "Тёплый кремовый", bg: "#F4EDE1", accent: "#C2500A", theme: "light" },
    { id: "aurora", name: "Aurora", note: "Холодное свечение", bg: "#102433", accent: "#72DCC6", theme: "dark" },
    { id: "editorial", name: "Editorial", note: "Журнальная эстетика", bg: "#F0E8DC", accent: "#A34D2B", theme: "light" },
    { id: "glass", name: "Glass", note: "Стекло и глубина", bg: "#101114", accent: "#F07A2A", theme: "dark" },
    { id: "mono", name: "Monochrome", note: "Чистый минимализм", bg: "#F2F2EE", accent: "#292929", theme: "light" },
    { id: "citrus", name: "Citrus", note: "Тёмный зелёный + лайм", bg: "#14251B", accent: "#C8E16A", theme: "dark" }
  ];

  const overlay = document.getElementById("stackdMaintenance");
  if (!overlay) return;

  const $ = (selector, root = document) => root.querySelector(selector);

  const safeUrl = value => {
    if (!value || typeof value !== "string") return "";
    try {
      const url = new URL(value, window.location.origin);
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  };

  const validHex = value => /^#[0-9a-f]{6}$/i.test(String(value || ""));

  const clamp = (value, min, max, fallback) => {
    const number = Number(value);
    return Number.isFinite(number)
      ? Math.min(max, Math.max(min, number))
      : fallback;
  };

  let client = null;
  let owner = false;
  let settings = { ...DEFAULTS };
  let refreshBusy = false;
  let refreshQueued = false;
  let saveInProgress = false;
  let adminFormDirty = false;
  let revision = 0;
  let pollTimer = null;
  let authSubscription = null;
  let draftBackgroundUrl = "";
  let draftDecorUrl = "";
  let pendingUploads = [];

  function cleanSettings(row = {}) {
    const source = row || {};
    const rawTheme = String(source.theme || DEFAULTS.theme);

    const theme =
      rawTheme === "light" || rawTheme === "warm" || rawTheme === "minimal"
        ? "light"
        : "dark";

    const font = Object.prototype.hasOwnProperty.call(FONTS, source.font_family)
      ? source.font_family
      : DEFAULTS.font_family;

    const template = THEMES.some(item => item.id === source.template)
      ? source.template
      : DEFAULTS.template;

    const decorPosition = ["left", "right", "top", "bottom"].includes(source.decor_position)
      ? source.decor_position
      : DEFAULTS.decor_position;

    const decorShape = ["rounded", "circle", "squircle"].includes(source.decor_shape)
      ? source.decor_shape
      : DEFAULTS.decor_shape;

    return {
      ...DEFAULTS,
      ...source,
      id: 1,
      enabled: source.enabled === true,
      eyebrow: String(source.eyebrow || DEFAULTS.eyebrow).slice(0, 70),
      title: String(source.title || DEFAULTS.title).slice(0, 100),
      message: String(source.message || DEFAULTS.message).slice(0, 500),
      font_family: font,
      font_scale: clamp(source.font_scale, 0.85, 1.3, 1),
      theme,
      accent_color: validHex(source.accent_color)
        ? source.accent_color
        : DEFAULTS.accent_color,
      template,
      background_color: validHex(source.background_color)
        ? source.background_color
        : (THEMES.find(item => item.id === template)?.bg || DEFAULTS.background_color),
      background_image_url: safeUrl(source.background_image_url),
      background_overlay: clamp(source.background_overlay, 0, 0.85, DEFAULTS.background_overlay),
      decor_image_url: safeUrl(source.decor_image_url),
      decor_position: decorPosition,
      decor_shape: decorShape,
      decor_scale: clamp(source.decor_scale, 0.65, 1.35, 1)
    };
  }

  function setImage(container, image, url) {
    if (!container || !image) return;

    const safe = safeUrl(url);

    if (!safe) {
      container.hidden = true;
      image.removeAttribute("src");
      return;
    }

    image.src = safe;
    container.hidden = false;
  }

  function applyVisual(root, value, isPreview = false) {
    if (!root) return;

    const card = $(
      isPreview ? ".stackd-maintenance-preview-card" : ".stackd-maintenance-card",
      root
    ) || root;

    const stage = $(
      isPreview ? ".stackd-maintenance-preview-stage" : ".stackd-maintenance-stage",
      root
    );

    const bgWrap = $(
      isPreview ? ".stackd-maintenance-preview-background" : ".stackd-maintenance-background",
      root
    );

    const bgImg = $(
      isPreview ? ".stackd-maintenance-preview-background img" : ".stackd-maintenance-background img",
      root
    );

    const decorWrap = $(
      isPreview ? ".stackd-maintenance-preview-decor" : ".stackd-maintenance-decor",
      root
    );

    const decorImg = $(
      isPreview ? ".stackd-maintenance-preview-decor img" : ".stackd-maintenance-decor img",
      root
    );

    root.dataset.template = value.template;
    root.dataset.theme = value.theme;

    root.style.setProperty("--sm-accent", value.accent_color);
    root.style.setProperty("--sm-font", FONTS[value.font_family]);
    root.style.setProperty("--sm-scale", String(value.font_scale));
    root.style.setProperty("--sm-background-color", value.background_color);
    root.style.setProperty("--sm-background-overlay", String(value.background_overlay));

    card.dataset.template = value.template;
    card.dataset.theme = value.theme;

    card.style.setProperty("--sm-accent", value.accent_color);
    card.style.setProperty("--sm-font", FONTS[value.font_family]);
    card.style.setProperty("--sm-scale", String(value.font_scale));
    card.style.setProperty("--sm-decor-scale", String(value.decor_scale));

    if (stage) {
      stage.dataset.decorPosition = value.decor_position;
      stage.dataset.hasDecor = value.decor_image_url ? "true" : "false";
    }

    if (decorWrap) decorWrap.dataset.shape = value.decor_shape;

    setImage(bgWrap, bgImg, value.background_image_url);
    setImage(decorWrap, decorImg, value.decor_image_url);

    const eyebrow = $(
      isPreview ? ".stackd-maintenance-preview-eyebrow" : ".stackd-maintenance-eyebrow",
      root
    );

    const title = $(
      isPreview ? ".stackd-maintenance-preview-title" : ".stackd-maintenance-title",
      root
    );

    const message = $(
      isPreview ? ".stackd-maintenance-preview-message" : ".stackd-maintenance-message",
      root
    );

    if (eyebrow) eyebrow.textContent = value.eyebrow;
    if (title) title.textContent = value.title;
    if (message) message.textContent = value.message;
  }

  function showScreen(data, isError = false) {
    const value = cleanSettings(data);
    const shouldShow = isError || (value.enabled && !owner);

    overlay.hidden = !shouldShow;
    document.body.classList.toggle("stackd-maintenance-active", shouldShow);

    if (!shouldShow) return;

    applyVisual(overlay, value);

    const title = $(".stackd-maintenance-title", overlay);
    const message = $(".stackd-maintenance-message", overlay);

    if (isError) {
      if (title) title.textContent = "Сервис временно недоступен";

      if (message) {
        message.textContent =
          "Не удалось получить настройки сайта. Попробуйте обновить страницу или повторить проверку.";
      }
    }

    const retry = $("#stackdMaintenanceRetry", overlay);
    if (retry) retry.hidden = !isError;
  }

  function panelMarkup() {
    const themeCards = THEMES.map(item => `
      <button class="sm-template-card" type="button"
        data-sm-template="${item.id}" aria-pressed="false">
        <span class="sm-template-swatch"
          style="--swatch-bg:${item.bg};--swatch-accent:${item.accent}">
          <i></i><i></i><i></i>
        </span>
        <strong>${item.name}</strong>
        <small>${item.note}</small>
      </button>
    `).join("");

    return `
      <section class="stackd-maintenance-admin" id="stackdMaintenanceAdmin">

        <div class="sm-admin-heading">
          <div>
            <span class="sm-admin-kicker">STACKED STUDIO</span>
            <h3>Страница технических работ</h3>
            <p>Собери отдельную страницу обслуживания. Все изменения видны в предпросмотре до публикации.</p>
          </div>

          <label class="stackd-maintenance-switch">
            <input id="smEnabled" type="checkbox">
            <span>Закрыть сайт для посетителей</span>
          </label>
        </div>

        <div class="sm-admin-section">
          <div class="sm-section-title">
            <div><span>01 / STYLE</span><h4>Выбери оформление</h4></div>
            <small>7 готовых концепций</small>
          </div>
          <div class="sm-template-grid" id="smTemplateGrid">
            ${themeCards}
          </div>
        </div>

        <div class="sm-admin-section">
          <div class="sm-section-title">
            <div><span>02 / CONTENT</span><h4>Текст и типографика</h4></div>
          </div>

          <div class="stackd-maintenance-fields">

            <div class="stackd-maintenance-field">
              <label for="smEyebrow">Надпись над заголовком</label>
              <input id="smEyebrow" maxlength="70" type="text">
            </div>

            <div class="stackd-maintenance-field">
              <label for="smTitle">Главный заголовок</label>
              <input id="smTitle" maxlength="100" type="text">
            </div>

            <div class="stackd-maintenance-field sm-wide">
              <label for="smMessage">Основное сообщение</label>
              <textarea id="smMessage" maxlength="500" rows="3"></textarea>
            </div>

            <div class="stackd-maintenance-field">
              <label for="smFont">Шрифт</label>
              <select id="smFont">
                <option value="manrope">Manrope - фирменный</option>
                <option value="inter">Inter - нейтральный</option>
                <option value="space-grotesk">Space Grotesk - современный</option>
                <option value="playfair">Playfair Display - редакционный</option>
                <option value="system">Системный</option>
                <option value="rounded">Округлый</option>
                <option value="serif">Антиква</option>
                <option value="mono">Моноширинный</option>
              </select>
            </div>

            <div class="stackd-maintenance-field">
              <label for="smScale">Масштаб текста: <output id="smScaleLabel">100%</output></label>
              <input id="smScale" type="range" min="0.85" max="1.30" step="0.05">
            </div>

            <div class="stackd-maintenance-field">
              <label for="smAccent">Акцентный цвет</label>
              <input id="smAccent" type="color">
            </div>

          </div>
        </div>

        <div class="sm-admin-section">
          <div class="sm-section-title">
            <div><span>03 / BACKGROUND</span><h4>Фон страницы</h4></div>
          </div>

          <div class="stackd-maintenance-fields">

            <div class="stackd-maintenance-field">
              <label for="smBackgroundColor">Цвет фона</label>
              <input id="smBackgroundColor" type="color">
            </div>

            <div class="stackd-maintenance-field">
              <label for="smOverlay">Затемнение фото: <output id="smOverlayLabel">42%</output></label>
              <input id="smOverlay" type="range" min="0" max="0.85" step="0.05">
            </div>

            <div class="stackd-maintenance-field sm-wide">
              <label for="smBackgroundFile">Фоновое изображение</label>

              <div class="sm-upload-row">
                <input id="smBackgroundFile" type="file" accept="image/jpeg,image/png,image/webp">
                <button id="smBackgroundRemove" class="sm-remove-image" type="button">
                  Убрать фото
                </button>
              </div>

              <small class="sm-help">
                JPG, PNG или WebP, не более 5 МБ. Изображение загружается в Supabase.
              </small>

              <div class="sm-upload-preview" id="smBackgroundPreview" hidden>
                <img id="smBackgroundPreviewImg" alt="Фоновое изображение">
                <span>Фон загружен</span>
              </div>
            </div>

          </div>
        </div>

        <div class="sm-admin-section">
          <div class="sm-section-title">
            <div><span>04 / ARTWORK</span><h4>Декоративное изображение</h4></div>
          </div>

          <div class="stackd-maintenance-fields">

            <div class="stackd-maintenance-field sm-wide">
              <label for="smDecorFile">Мини-фото или иллюстрация</label>

              <div class="sm-upload-row">
                <input id="smDecorFile" type="file" accept="image/jpeg,image/png,image/webp">
                <button id="smDecorRemove" class="sm-remove-image" type="button">
                  Убрать фото
                </button>
              </div>

              <small class="sm-help">
                Можно поставить рядом с текстом или над / под ним.
              </small>

              <div class="sm-upload-preview" id="smDecorPreview" hidden>
                <img id="smDecorPreviewImg" alt="Декоративное изображение">
                <span>Изображение загружено</span>
              </div>
            </div>

            <div class="stackd-maintenance-field">
              <label for="smDecorPosition">Расположение</label>
              <select id="smDecorPosition">
                <option value="right">Справа от текста</option>
                <option value="left">Слева от текста</option>
                <option value="top">Над текстом</option>
                <option value="bottom">Под текстом</option>
              </select>
            </div>

            <div class="stackd-maintenance-field">
              <label for="smDecorShape">Форма изображения</label>
              <select id="smDecorShape">
                <option value="rounded">Скруглённое</option>
                <option value="squircle">Мягкий квадрат</option>
                <option value="circle">Круг</option>
              </select>
            </div>

            <div class="stackd-maintenance-field sm-wide">
              <label for="smDecorScale">
                Размер изображения: <output id="smDecorScaleLabel">100%</output>
              </label>
              <input id="smDecorScale" type="range" min="0.65" max="1.35" step="0.05">
            </div>

          </div>
        </div>

        <div class="sm-admin-section sm-preview-section">

          <div class="sm-section-title">
            <div><span>05 / LIVE PREVIEW</span><h4>Предпросмотр страницы</h4></div>
            <small>Так её увидят посетители</small>
          </div>

          <div class="stackd-maintenance-preview" id="smPreview"
            data-template="midnight" data-theme="dark">

            <div class="stackd-maintenance-preview-background" hidden>
              <img alt="">
            </div>

            <div class="stackd-maintenance-preview-card"
              data-template="midnight" data-theme="dark">

              <div class="stackd-maintenance-preview-stage" data-decor-position="right">

                <div class="stackd-maintenance-preview-content">
                  <img class="sm-preview-logo" src="assets/icons/logo.svg" alt="STACKED">
                  <span class="stackd-maintenance-preview-eyebrow">STACKED • BAKU</span>
                  <strong class="stackd-maintenance-preview-title">Скоро вернёмся</strong>
                  <p class="stackd-maintenance-preview-message">
                    Сейчас мы обновляем STACKED. Сайт снова будет доступен совсем скоро.
                  </p>
                  <span class="sm-preview-line"></span>
                </div>

                <div class="stackd-maintenance-preview-decor" hidden>
                  <img alt="">
                </div>

              </div>
            </div>
          </div>
        </div>

        <div class="stackd-maintenance-admin-actions">
          <button class="btn btn-primary" id="smSave" type="button">
            Сохранить оформление и статус
          </button>
          <span class="stackd-maintenance-save-status" id="smSaveStatus" role="status"></span>
        </div>

        <p class="stackd-maintenance-admin-note">
          Изменения публикуются после сохранения. Посетители увидят обновлённую страницу при следующей проверке статуса.
        </p>

      </section>`;
  }

  function formValues() {
    const selectedTemplate =
      $("#smTemplateGrid .sm-template-card[aria-pressed=true]")?.dataset.smTemplate
      || settings.template;

    const selectedTheme =
      THEMES.find(item => item.id === selectedTemplate)?.theme || settings.theme;

    return cleanSettings({
      ...settings,
      enabled: $("#smEnabled").checked,
      eyebrow: $("#smEyebrow").value.trim() || DEFAULTS.eyebrow,
      title: $("#smTitle").value.trim() || DEFAULTS.title,
      message: $("#smMessage").value.trim() || DEFAULTS.message,
      font_family: $("#smFont").value,
      font_scale: Number($("#smScale").value),
      theme: selectedTheme,
      accent_color: $("#smAccent").value,
      template: selectedTemplate,
      background_color: $("#smBackgroundColor").value,
      background_image_url: draftBackgroundUrl,
      background_overlay: Number($("#smOverlay").value),
      decor_image_url: draftDecorUrl,
      decor_position: $("#smDecorPosition").value,
      decor_shape: $("#smDecorShape").value,
      decor_scale: Number($("#smDecorScale").value)
    });
  }

  function updatePreview() {
    const preview = $("#smPreview");
    if (!preview) return;

    const value = formValues();
    applyVisual(preview, value, true);

    $("#smScaleLabel").textContent = `${Math.round(value.font_scale * 100)}%`;
    $("#smOverlayLabel").textContent = `${Math.round(value.background_overlay * 100)}%`;
    $("#smDecorScaleLabel").textContent = `${Math.round(value.decor_scale * 100)}%`;

    $("#smTemplateGrid").querySelectorAll(".sm-template-card").forEach(button => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.smTemplate === value.template)
      );
    });
  }

  function markDirty() {
    adminFormDirty = true;
    const status = $("#smSaveStatus");

    if (status) status.textContent = "Есть несохранённые изменения.";

    updatePreview();
  }

  function setUploadPreview(kind, url) {
    const isBackground = kind === "background";

    const wrap = $(isBackground ? "#smBackgroundPreview" : "#smDecorPreview");
    const img = $(isBackground ? "#smBackgroundPreviewImg" : "#smDecorPreviewImg");

    if (!url) {
      wrap.hidden = true;
      img.removeAttribute("src");
    } else {
      img.src = url;
      wrap.hidden = false;
    }
  }

  function fillAdminForm() {
    if (!owner) return;

    const host = $("#tab-settings");
    if (!host) return;

    if (!$("#stackdMaintenanceAdmin")) {
      const anchor = $("#settingsMsg", host);
      if (!anchor) return;

      anchor.insertAdjacentHTML("afterend", panelMarkup());

      $("#stackdMaintenanceAdmin").addEventListener("input", event => {
        if (event.target.type !== "file") markDirty();
      });

      $("#stackdMaintenanceAdmin").addEventListener("change", event => {
        if (event.target.type !== "file") markDirty();
      });

      $("#smTemplateGrid").addEventListener("click", event => {
        const button = event.target.closest("[data-sm-template]");
        if (!button) return;

        const theme = THEMES.find(item => item.id === button.dataset.smTemplate);
        if (!theme) return;

        $("#smBackgroundColor").value = theme.bg;
        $("#smAccent").value = theme.accent;

        $("#smTemplateGrid").querySelectorAll(".sm-template-card").forEach(item => {
          item.setAttribute("aria-pressed", String(item === button));
        });

        markDirty();
      });

      $("#smSave").addEventListener("click", saveSettings);

      $("#smBackgroundFile").addEventListener("change", event => {
        handleImageUpload(event, "background");
      });

      $("#smDecorFile").addEventListener("change", event => {
        handleImageUpload(event, "decor");
      });

      $("#smBackgroundRemove").addEventListener("click", async () => {
        const oldUrl = draftBackgroundUrl;
        draftBackgroundUrl = "";
        await discardPendingUpload(oldUrl);
        setUploadPreview("background", "");
        $("#smBackgroundFile").value = "";
        markDirty();
      });

      $("#smDecorRemove").addEventListener("click", async () => {
        const oldUrl = draftDecorUrl;
        draftDecorUrl = "";
        await discardPendingUpload(oldUrl);
        setUploadPreview("decor", "");
        $("#smDecorFile").value = "";
        markDirty();
      });
    }

    if (adminFormDirty) return;

    draftBackgroundUrl = settings.background_image_url;
    draftDecorUrl = settings.decor_image_url;

    $("#smEnabled").checked = settings.enabled;
    $("#smEyebrow").value = settings.eyebrow;
    $("#smTitle").value = settings.title;
    $("#smMessage").value = settings.message;
    $("#smFont").value = settings.font_family;
    $("#smScale").value = String(settings.font_scale);
    $("#smAccent").value = settings.accent_color;
    $("#smBackgroundColor").value = settings.background_color;
    $("#smOverlay").value = String(settings.background_overlay);
    $("#smDecorPosition").value = settings.decor_position;
    $("#smDecorShape").value = settings.decor_shape;
    $("#smDecorScale").value = String(settings.decor_scale);

    $("#smTemplateGrid").querySelectorAll(".sm-template-card").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.smTemplate === settings.template));
    });

    setUploadPreview("background", draftBackgroundUrl);
    setUploadPreview("decor", draftDecorUrl);

    updatePreview();
  }

  function fileExtension(file) {
    return ({
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp"
    })[file.type] || "";
  }

  async function removeMaintenanceStorageUrl(url) {
    if (!client || !url) return;

    try {
      const parsed = new URL(url);
      const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
      const index = parsed.pathname.indexOf(marker);

      if (index < 0) return;

      const path = decodeURIComponent(parsed.pathname.slice(index + marker.length));

      if (!path.startsWith("products/maintenance-")) return;

      const { error } = await client.storage.from(STORAGE_BUCKET).remove([path]);

      if (error) console.warn("Maintenance image cleanup failed:", error);
    } catch (error) {
      console.warn("Maintenance image cleanup skipped:", error);
    }
  }

  async function discardPendingUpload(url) {
    if (!url || !pendingUploads.includes(url)) return;

    pendingUploads = pendingUploads.filter(item => item !== url);
    await removeMaintenanceStorageUrl(url);
  }

  async function handleImageUpload(event, kind) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const status = $("#smSaveStatus");
    const extension = fileExtension(file);

    if (!extension || file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      if (status) status.textContent = "Выберите JPG, PNG или WebP размером до 5 МБ.";
      event.target.value = "";
      return;
    }

    const button = $("#smSave");
    const previousUrl = kind === "background" ? draftBackgroundUrl : draftDecorUrl;

    if (button) button.disabled = true;
    if (status) status.textContent = "Загружаю изображение в Supabase…";

    try {
      const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      const isPng = bytes.length >= 8 &&
        [137,80,78,71,13,10,26,10].every((v, i) => bytes[i] === v);

      const isWebp = bytes.length >= 12 &&
        String.fromCharCode(...bytes.slice(0,4)) === "RIFF" &&
        String.fromCharCode(...bytes.slice(8,12)) === "WEBP";

      if (!(isJpeg || isPng || isWebp)) {
        throw new Error("Содержимое файла не соответствует формату изображения.");
      }

      const path = `products/maintenance-${kind}-${crypto.randomUUID()}.${extension}`;

      const { error } = await client.storage.from(STORAGE_BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      });

      if (error) throw error;

      const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path);

      if (!data?.publicUrl) {
        throw new Error("Supabase не вернул публичный адрес изображения.");
      }

      const url = data.publicUrl;
      pendingUploads.push(url);

      if (
        previousUrl &&
        previousUrl !== settings.background_image_url &&
        previousUrl !== settings.decor_image_url
      ) {
        await discardPendingUpload(previousUrl);
      }

      if (kind === "background") draftBackgroundUrl = url;
      else draftDecorUrl = url;

      setUploadPreview(kind, url);
      adminFormDirty = true;
      updatePreview();

      if (status) status.textContent = "Изображение загружено. Теперь сохраните оформление.";

    } catch (error) {
      console.error("Maintenance image upload failed:", error);

      if (status) {
        status.textContent = `Не удалось загрузить изображение: ${error.message || "ошибка Storage"}`;
      }

      event.target.value = "";

    } finally {
      if (button) button.disabled = false;
    }
  }

  async function saveSettings() {
    if (!owner || !client || saveInProgress) return;

    const button = $("#smSave");
    const status = $("#smSaveStatus");
    const value = formValues();

    saveInProgress = true;
    revision += 1;

    if (button) button.disabled = true;
    if (status) status.textContent = "Сохраняю страницу…";

    try {
      const payload = { ...value, updated_at: new Date().toISOString() };

      const { error } = await client.from(TABLE).upsert(payload, {
        onConflict: "id"
      });

      if (error) throw error;

      const oldImages = [
        settings.background_image_url,
        settings.decor_image_url
      ];

      settings = value;
      adminFormDirty = false;
      pendingUploads = [];

      if (status) status.textContent = "Сохранено. Страница обновлена.";

      showScreen(settings, false);
      fillAdminForm();

      for (const oldUrl of oldImages) {
        if (
          oldUrl &&
          oldUrl !== settings.background_image_url &&
          oldUrl !== settings.decor_image_url
        ) {
          await removeMaintenanceStorageUrl(oldUrl);
        }
      }

    } catch (error) {
      console.error("STACKED maintenance settings save failed:", error);

      if (status) {
        status.textContent = `Ошибка сохранения: ${error.message || "проверьте таблицу и права доступа"}`;
      }

      adminFormDirty = true;

    } finally {
      saveInProgress = false;

      if (button) button.disabled = false;

      scheduleQueuedRefresh();
    }
  }

  function scheduleQueuedRefresh() {
    if (!refreshQueued || refreshBusy || saveInProgress) return;

    refreshQueued = false;
    window.setTimeout(() => refreshState(), 0);
  }

  async function refreshState(sessionOverride) {
    if (!client) return;

    if (refreshBusy || saveInProgress) {
      refreshQueued = true;
      return;
    }

    refreshBusy = true;
    const revisionAtStart = revision;

    try {
      let session = sessionOverride;

      if (typeof session === "undefined") {
        const result = await client.auth.getSession();

        if (result.error) throw result.error;

        session = result.data?.session;
      }

      owner = String(session?.user?.email || "").toLowerCase() === OWNER_EMAIL;

      const { data, error } = await client
        .from(TABLE)
        .select("id,enabled,eyebrow,title,message,font_family,font_scale,theme,accent_color,template,background_color,background_image_url,background_overlay,decor_image_url,decor_position,decor_shape,decor_scale")
        .eq("id", 1)
        .maybeSingle();

      if (error) throw error;

      if (revisionAtStart !== revision) {
        refreshQueued = true;
        return;
      }

      if (data) settings = cleanSettings(data);

      showScreen(settings, false);

      if (owner) {
        fillAdminForm();
      } else {
        $("#stackdMaintenanceAdmin")?.remove();
        adminFormDirty = false;
      }

    } catch (error) {
      console.error("STACKED maintenance status check failed:", error);

      if (!owner) showScreen(DEFAULTS, true);
      else showScreen(settings, false);

    } finally {
      refreshBusy = false;
      scheduleQueuedRefresh();
    }
  }

  $("#stackdMaintenanceRetry")?.addEventListener("click", () => refreshState());

  async function start() {
    client = window.stackdSupabase;

    if (!client) {
      showScreen(DEFAULTS, true);
      return;
    }

    await refreshState();

    const authResult = client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => refreshState(session), 0);
    });

    authSubscription = authResult?.data?.subscription || null;

    pollTimer = window.setInterval(() => refreshState(), 10000);

    window.addEventListener("pagehide", () => {
      if (pollTimer) window.clearInterval(pollTimer);
      if (authSubscription) authSubscription.unsubscribe();
    }, { once: true });
  }

  start();
})();
