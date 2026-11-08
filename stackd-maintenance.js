(() => {
  "use strict";

  const OWNER_EMAIL = "yuska20102010@gmail.com";
  const TABLE = "site_maintenance_settings";
  const DEFAULTS = {
    id: 1,
    enabled: false,
    eyebrow: "STACKD • BAKU",
    title: "Скоро вернёмся",
    message: "Сейчас мы обновляем Stackd. Сайт снова будет доступен совсем скоро.",
    font_family: "system",
    font_scale: 1,
    theme: "dark",
    accent_color: "#D7A85B"
  };

  const FONT_STACKS = {
    system: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    rounded: '"Trebuchet MS", Arial, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: 'ui-monospace, SFMono-Regular, Consolas, monospace'
  };

  const overlay = document.getElementById("stackdMaintenance");
  if (!overlay) return;

  const $ = (selector, root) => (root || document).querySelector(selector);
  let client = null;
  let owner = false;
  let settings = { ...DEFAULTS };
  let refreshBusy = false;
  let pollTimer = null;

  function cleanSettings(row) {
    const source = row || {};
    const scale = Number(source.font_scale);
    const color = /^#[0-9a-f]{6}$/i.test(String(source.accent_color || ""))
      ? source.accent_color
      : DEFAULTS.accent_color;
    const font = Object.prototype.hasOwnProperty.call(FONT_STACKS, source.font_family)
      ? source.font_family
      : DEFAULTS.font_family;

    return {
      ...DEFAULTS,
      ...source,
      id: 1,
      enabled: source.enabled === true,
      eyebrow: String(source.eyebrow || DEFAULTS.eyebrow).slice(0, 70),
      title: String(source.title || DEFAULTS.title).slice(0, 100),
      message: String(source.message || DEFAULTS.message).slice(0, 500),
      font_family: font,
      font_scale: Number.isFinite(scale) ? Math.min(1.3, Math.max(0.85, scale)) : 1,
      theme: source.theme === "light" ? "light" : "dark",
      accent_color: color
    };
  }

  function showScreen(data, isError) {
    const value = cleanSettings(data);

    overlay.hidden = !isError && (!value.enabled || owner);
    document.body.classList.toggle("stackd-maintenance-active", !overlay.hidden);
    if (overlay.hidden) return;

    overlay.dataset.theme = value.theme;
    overlay.style.setProperty("--sm-accent", value.accent_color);
    overlay.style.setProperty("--sm-font", FONT_STACKS[value.font_family]);
    overlay.style.setProperty("--sm-scale", String(value.font_scale));

    $(".stackd-maintenance-eyebrow", overlay).textContent = isError ? "STACKD STATUS" : value.eyebrow;
    $(".stackd-maintenance-title", overlay).textContent = isError
      ? "Не удалось проверить статус сайта"
      : value.title;
    $(".stackd-maintenance-message", overlay).textContent = isError
      ? "Не получилось связаться с базой настроек. Обновите страницу или войдите как владелец."
      : value.message;

    $("#stackdMaintenanceOwner").hidden = owner;
    $("#stackdMaintenanceRetry").hidden = !isError;
  }

  function openOwnerLogin() {
    const authDialog = document.getElementById("auth");
    if (authDialog && !authDialog.open) authDialog.showModal();
  }

  function panelMarkup() {
    return [
      '<section class="stackd-maintenance-admin" id="stackdMaintenanceAdmin">',
      '<div class="stackd-maintenance-admin-head"><div><h3>Режим технического обслуживания</h3>',
      '<p>Показывает посетителям отдельный экран вместо каталога. Владелец сайта видит сайт и панель управления.</p></div>',
      '<label class="stackd-maintenance-switch"><input id="smEnabled" type="checkbox"><span>Включить режим</span></label></div>',
      '<div class="stackd-maintenance-fields">',
      '<div class="stackd-maintenance-field"><label for="smEyebrow">Надпись над заголовком</label><input id="smEyebrow" maxlength="70" type="text"></div>',
      '<div class="stackd-maintenance-field"><label for="smTitle">Главный заголовок</label><input id="smTitle" maxlength="100" type="text"></div>',
      '<div class="stackd-maintenance-field sm-wide"><label for="smMessage">Текст сообщения</label><textarea id="smMessage" maxlength="500" rows="3"></textarea></div>',
      '<div class="stackd-maintenance-field"><label for="smFont">Шрифт</label><select id="smFont"><option value="system">Современный</option><option value="rounded">Мягкий / округлый</option><option value="serif">Классический</option><option value="mono">Моноширинный</option></select></div>',
      '<div class="stackd-maintenance-field"><label for="smScale">Размер текста: <output id="smScaleLabel">100%</output></label><input id="smScale" type="range" min="0.85" max="1.3" step="0.05"></div>',
      '<div class="stackd-maintenance-field"><label for="smTheme">Цветовая тема</label><select id="smTheme"><option value="dark">Тёмная</option><option value="light">Светлая</option></select></div>',
      '<div class="stackd-maintenance-field"><label for="smAccent">Акцентный цвет</label><input id="smAccent" type="color"></div>',
      '</div>',
      '<div class="stackd-maintenance-preview-wrap"><span class="stackd-maintenance-preview-label">ПРЕДПРОСМОТР</span>',
      '<div class="stackd-maintenance-preview" id="smPreview" data-theme="dark"><span class="stackd-maintenance-preview-eyebrow" id="smPreviewEyebrow">STACKD • BAKU</span><strong id="smPreviewTitle">Скоро вернёмся</strong><p id="smPreviewMessage">Сейчас мы обновляем Stackd. Сайт снова будет доступен совсем скоро.</p></div></div>',
      '<div class="stackd-maintenance-admin-actions"><button class="btn btn-primary" id="smSave" type="button">Сохранить настройки</button><span class="stackd-maintenance-save-status" id="smSaveStatus" role="status"></span></div>',
      '<p class="stackd-maintenance-admin-note">Изменения появятся у посетителей после обновления статуса (обычно не позднее 10 секунд).</p></section>'
    ].join("");
  }

  function formValues() {
    const scale = Number($("#smScale").value);
    return cleanSettings({
      id: 1,
      enabled: $("#smEnabled").checked,
      eyebrow: $("#smEyebrow").value.trim() || DEFAULTS.eyebrow,
      title: $("#smTitle").value.trim() || DEFAULTS.title,
      message: $("#smMessage").value.trim() || DEFAULTS.message,
      font_family: $("#smFont").value,
      font_scale: scale,
      theme: $("#smTheme").value,
      accent_color: $("#smAccent").value
    });
  }

  function updatePreview() {
    const preview = $("#smPreview");
    if (!preview) return;

    const value = formValues();
    preview.dataset.theme = value.theme;
    preview.style.setProperty("--sm-accent", value.accent_color);
    preview.style.setProperty("--sm-font", FONT_STACKS[value.font_family]);
    preview.style.setProperty("--sm-scale", String(value.font_scale));

    $("#smPreviewEyebrow").textContent = value.eyebrow;
    $("#smPreviewTitle").textContent = value.title;
    $("#smPreviewMessage").textContent = value.message;
    $("#smScaleLabel").textContent = Math.round(value.font_scale * 100) + "%";
  }

  function fillAdminForm() {
    if (!owner) return;

    const host = document.getElementById("tab-settings");
    if (!host) return;

    if (!$("#stackdMaintenanceAdmin")) {
      const anchor = $("#settingsMsg", host);
      if (!anchor) return;

      anchor.insertAdjacentHTML("afterend", panelMarkup());

      [
        "#smEnabled", "#smEyebrow", "#smTitle", "#smMessage",
        "#smFont", "#smScale", "#smTheme", "#smAccent"
      ].forEach(selector => {
        $(selector).addEventListener("input", updatePreview);
        $(selector).addEventListener("change", updatePreview);
      });

      $("#smSave").addEventListener("click", saveSettings);
    }

    $("#smEnabled").checked = settings.enabled;
    $("#smEyebrow").value = settings.eyebrow;
    $("#smTitle").value = settings.title;
    $("#smMessage").value = settings.message;
    $("#smFont").value = settings.font_family;
    $("#smScale").value = String(settings.font_scale);
    $("#smTheme").value = settings.theme;
    $("#smAccent").value = settings.accent_color;
    updatePreview();
  }

  async function saveSettings() {
    if (!owner || !client) return;

    const button = $("#smSave");
    const status = $("#smSaveStatus");
    const value = formValues();

    button.disabled = true;
    status.textContent = "Сохранение…";

    try {
      const payload = { ...value, updated_at: new Date().toISOString() };
      const { error } = await client.from(TABLE).upsert(payload, { onConflict: "id" });
      if (error) throw error;

      settings = value;
      status.textContent = "Сохранено.";
      showScreen(settings, false);
    } catch (error) {
      console.error("Stackd maintenance settings save failed:", error);
      status.textContent = "Ошибка сохранения: " + (error.message || "проверьте SQL и права доступа");
    } finally {
      button.disabled = false;
    }
  }

  async function refreshState(sessionOverride) {
    if (!client || refreshBusy) return;

    refreshBusy = true;
    try {
      let session = sessionOverride;

      if (typeof session === "undefined") {
        const result = await client.auth.getSession();
        if (result.error) throw result.error;
        session = result.data && result.data.session;
      }

      owner = String(session && session.user && session.user.email || "").toLowerCase() === OWNER_EMAIL;

      if (owner) {
        showScreen(settings, false);
        fillAdminForm();
      }

      const { data, error } = await client.from(TABLE)
        .select("id,enabled,eyebrow,title,message,font_family,font_scale,theme,accent_color")
        .eq("id", 1)
        .maybeSingle();

      if (error) throw error;
      if (data) settings = cleanSettings(data);

      showScreen(settings, false);

      if (owner) {
        fillAdminForm();
      } else {
        const adminPanel = document.getElementById("stackdMaintenanceAdmin");
        if (adminPanel) adminPanel.remove();
      }
    } catch (error) {
      console.error("Stackd maintenance status check failed:", error);
      if (!owner) showScreen(DEFAULTS, true);
      else showScreen(settings, false);
    } finally {
      refreshBusy = false;
    }
  }

  $("#stackdMaintenanceOwner").addEventListener("click", openOwnerLogin);
  $("#stackdMaintenanceRetry").addEventListener("click", () => refreshState());

  async function start() {
    client = window.stackdSupabase;

    if (!client) {
      showScreen(DEFAULTS, true);
      return;
    }

    await refreshState();

    client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => refreshState(session), 0);
    });

    pollTimer = window.setInterval(() => refreshState(), 10000);

    window.addEventListener("pagehide", () => {
      if (pollTimer) window.clearInterval(pollTimer);
    }, { once: true });
  }

  start();
})();