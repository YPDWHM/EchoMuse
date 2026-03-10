(function () {
  'use strict';

  const STORAGE_KEY = 'echomuse_voice_assist_v1';
  const MSG_BTN_CLASS = 'voice-assist-msg-btn';
  const WHISPER_CPP_RELEASES_URL = 'https://github.com/ggml-org/whisper.cpp/releases';
  const WHISPER_CPP_QUICKSTART_URL = 'https://github.com/ggml-org/whisper.cpp#quick-start';

  function clampNumber(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function normalizePrefs(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const voicePacks = Array.isArray(src.voicePacks) ? src.voicePacks : [];
    return {
      toolbarVisible: Boolean(src.toolbarVisible),
      autoSpeak: Boolean(src.autoSpeak),
      voiceName: String(src.voiceName || ''),
      rate: clampNumber(src.rate, 0.5, 2, 1),
      pitch: clampNumber(src.pitch, 0, 2, 1),
      volume: clampNumber(src.volume, 0, 1, 1),
      voiceProvider: String(src.voiceProvider || 'system'),
      sttMode: String(src.sttMode || 'native'),
      sttLang: String(src.sttLang || ''),
      sttInterim: Boolean(src.sttInterim)
      ,
      localWhisperExePath: String(src.localWhisperExePath || ''),
      localWhisperModelPath: String(src.localWhisperModelPath || ''),
      localWhisperThreads: clampNumber(src.localWhisperThreads, 1, 32, 4),
      localWhisperTranslate: Boolean(src.localWhisperTranslate),
      voicePacks: voicePacks
        .filter((p) => p && typeof p === 'object')
        .map((p) => ({
          id: String(p.id || `pack_${Math.random().toString(36).slice(2, 8)}`),
          name: String(p.name || 'Voice Pack').slice(0, 80),
          voiceName: String(p.voiceName || ''),
          rate: clampNumber(p.rate, 0.5, 2, 1),
          pitch: clampNumber(p.pitch, 0, 2, 1),
          volume: clampNumber(p.volume, 0, 1, 1),
          lang: String(p.lang || ''),
          source: String(p.source || 'import')
        }))
    };
  }

  function safeParse(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function createController(options) {
    const opts = options || {};
    const state = {
      uiReady: false,
      ui: null,
      styleInjected: false,
      prefs: normalizePrefs(safeParse(localStorage.getItem(STORAGE_KEY), {})),
      voices: [],
      speakingMessageKey: '',
      lastAutoSpokenKey: '',
      recognition: null,
      listening: false,
      localSttTranscribing: false,
      toggleChip: null,
      localSttRecorder: null,
      settingsUi: null,
      toolbarNotice: '',
      toolbarNoticeTs: 0
    };

    const supportsTts = typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof window.SpeechSynthesisUtterance !== 'undefined';

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    const supportsStt = Boolean(SpeechRecognitionCtor);

    function onStatus(text) {
      const msg = String(text || '').trim();
      if (msg) {
        state.toolbarNotice = msg;
        state.toolbarNoticeTs = Date.now();
        try {
          if (state.uiReady) renderToolbarState();
        } catch (_) { }
      }
      try {
        if (typeof opts.setStatus === 'function') opts.setStatus(text);
      } catch (_) { }
    }

    function getActiveSession() {
      return typeof opts.getActiveSession === 'function' ? opts.getActiveSession() : null;
    }

    function getAvatarById(id) {
      return typeof opts.getAvatarById === 'function' ? opts.getAvatarById(id) : null;
    }

    function persistAvatars() {
      if (typeof opts.persistAvatars === 'function') {
        try { opts.persistAvatars(); } catch (_) { }
      }
    }

    function rerenderAvatarUi() {
      if (typeof opts.onAvatarVoiceProfileChanged === 'function') {
        try { opts.onAvatarVoiceProfileChanged(); } catch (_) { }
      }
    }

    function getChatInput() {
      if (typeof opts.getChatInputElement === 'function') return opts.getChatInputElement();
      return document.getElementById('chatInput');
    }

    function getComposerWrap() {
      const input = getChatInput();
      return input ? input.closest('.composer') : document.querySelector('.composer');
    }

    function getComposerBottomBar() {
      const composer = getComposerWrap();
      return composer ? composer.querySelector('.composer-bottom-bar') : document.querySelector('.composer-bottom-bar');
    }

    function getMessageList() {
      if (typeof opts.getMessageListElement === 'function') return opts.getMessageListElement();
      return document.getElementById('messageList');
    }

    function getSettingsPanel() {
      return document.getElementById('settingsPanel');
    }

    function getSettingsNav() {
      const panel = getSettingsPanel();
      return panel ? panel.querySelector('.settings-nav') : null;
    }

    function getSettingsContent() {
      const panel = getSettingsPanel();
      return panel ? panel.querySelector('.settings-content') : null;
    }

    function getAccessToken() {
      const appState = getState();
      return String((appState && appState.token) || '').trim();
    }

    async function apiFetchJson(url, options) {
      const token = getAccessToken();
      const headers = new Headers((options && options.headers) || {});
      if (token && !headers.has('x-access-token')) headers.set('x-access-token', token);
      const resp = await fetch(url, { ...(options || {}), headers });
      const payload = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const msg = payload && (payload.message || payload.error) ? String(payload.message || payload.error) : `HTTP ${resp.status}`;
        throw new Error(msg);
      }
      return payload;
    }

    function savePrefs() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.prefs));
      } catch (_) { }
    }

    function normalizeVoiceProfile(raw) {
      const src = raw && typeof raw === 'object' ? raw : {};
      return {
        enabled: src.enabled !== false,
        voiceName: String(src.voiceName || ''),
        rate: clampNumber(src.rate, 0.5, 2, 1),
        pitch: clampNumber(src.pitch, 0, 2, 1),
        volume: clampNumber(src.volume, 0, 1, 1),
        autoSpeak: typeof src.autoSpeak === 'boolean' ? src.autoSpeak : undefined
      };
    }

    function getActiveAvatar() {
      const session = getActiveSession();
      if (!session || !session.avatarId) return null;
      return getAvatarById(session.avatarId);
    }

    function getEffectivePrefsForAvatar(avatar) {
      const base = normalizePrefs(state.prefs);
      if (!avatar || !avatar.voiceProfile || typeof avatar.voiceProfile !== 'object') return base;
      const profile = normalizeVoiceProfile(avatar.voiceProfile);
      return {
        ...base,
        voiceName: profile.voiceName || base.voiceName,
        rate: profile.rate,
        pitch: profile.pitch,
        volume: profile.volume,
        autoSpeak: typeof profile.autoSpeak === 'boolean' ? profile.autoSpeak : base.autoSpeak
      };
    }

    function getState() {
      return typeof opts.getAppState === 'function' ? (opts.getAppState() || {}) : {};
    }

    function getUiLanguage() {
      const appState = getState();
      return String(appState.settings && appState.settings.language || 'zh-CN');
    }

    function isZh() {
      return getUiLanguage().startsWith('zh');
    }

    function isBrokenZhText(text) {
      if (!text) return true;
      const str = String(text);
      if (/\?{2,}/.test(str)) return true;
      if (/[\uE000-\uF8FF]/.test(str)) return true;
      if (/璇|鏈楄|绯荤|鏆傛|瀵煎叆闊宠壊鍖呭け璐ワ細|璇疯緭鍏ラ煶鑹插寘/.test(str)) return true;
      return false;
    }

    function t(zh, en) {
      if (!isZh()) return en;
      return isBrokenZhText(zh) ? en : zh;
    }

    function injectStyle() {
      if (state.styleInjected) return;
      const style = document.createElement('style');
      style.textContent = `
        .voice-assist-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:6px 0 2px;padding:6px 8px;border-radius:10px;border:1px solid rgba(148,163,184,.25);background:#fff}
        .voice-assist-toolbar.hidden{display:none}
        .voice-assist-chip.hidden{display:none}
        .voice-assist-chip{display:inline-flex;align-items:center;justify-content:center;min-width:72px;white-space:nowrap}
        .voice-assist-chip .voice-assist-chip-label{display:inline-flex;align-items:center;justify-content:center;line-height:1}
        .voice-assist-toolbar .va-btn{border:1px solid rgba(148,163,184,.35);background:#f8fafc;color:#0f172a;border-radius:8px;padding:4px 8px;font-size:12px;cursor:pointer}
        .voice-assist-toolbar .va-btn.active{background:#e0e7ff;border-color:#c7d2fe;color:#3730a3}
        .voice-assist-toolbar .va-label{font-size:12px;color:#64748b}
        .voice-assist-toolbar .va-select,.voice-assist-toolbar .va-range{font-size:12px}
        .voice-assist-toolbar .va-select{max-width:240px}
        .voice-assist-toolbar .va-sep{width:1px;height:18px;background:rgba(148,163,184,.35)}
        .voice-assist-toolbar .va-status{font-size:12px;color:#64748b;min-width:80px}
        .voice-settings-card{border:1px solid rgba(148,163,184,.18);border-radius:12px;background:#fff;padding:12px}
        .voice-settings-note{font-size:12px;color:#64748b;line-height:1.45}
        .voice-settings-grid{display:grid;gap:10px}
        .voice-settings-actions{display:flex;flex-wrap:wrap;gap:8px}
        .voice-pack-list{display:grid;gap:8px;margin-top:8px}
        .voice-pack-item{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 10px;border:1px solid rgba(148,163,184,.18);border-radius:10px;background:#f8fafc}
        .voice-pack-name{font-size:13px;font-weight:600;color:#334155}
        .voice-pack-meta{font-size:12px;color:#64748b}
        .${MSG_BTN_CLASS}{position:absolute;top:8px;right:8px;border:1px solid rgba(148,163,184,.35);background:#fff;border-radius:999px;padding:2px 7px;font-size:12px;color:#334155;cursor:pointer;opacity:0;pointer-events:none;transform:translateY(-2px);transition:opacity .16s ease,transform .16s ease}
        .msg.assistant:hover .${MSG_BTN_CLASS},.msg.assistant:focus-within .${MSG_BTN_CLASS}{opacity:.92;pointer-events:auto;transform:translateY(0)}
        .msg.assistant{position:relative}
      `;
      document.head.appendChild(style);
      state.styleInjected = true;
    }

    function buildToolbarHtml() {
      return `
        <button type="button" class="va-btn" data-action="speak-latest">${t('朗读最新', 'Speak Latest')}</button>
        <button type="button" class="va-btn" data-action="stop-speak">${t('停止', 'Stop')}</button>
        <button type="button" class="va-btn" data-action="toggle-stt">${t('语音输入', 'Dictation')}</button>
        <span class="va-sep" aria-hidden="true"></span>
        <label class="va-label"><input type="checkbox" data-action="toggle-auto-speak"> ${t('自动朗读角色回复', 'Auto-speak assistant')}</label>
        <label class="va-label">${t('音色', 'Voice')}</label>
        <select class="va-select" data-role="voice-select"></select>
        <label class="va-label">${t('语速', 'Rate')}</label>
        <input class="va-range" data-role="rate" type="range" min="0.6" max="1.8" step="0.1" value="1">
        <button type="button" class="va-btn" data-action="apply-avatar-voice">${t('应用到当前角色', 'Apply to Role')}</button>
        <button type="button" class="va-btn" data-action="clear-avatar-voice">${t('清除角色语音', 'Clear Role Voice')}</button>
        <button type="button" class="va-btn" data-action="collapse-toolbar" aria-label="${t('收起语音工具条', 'Collapse voice toolbar')}">▴</button>
        <span class="va-status" data-role="status"></span>
      `;
    }

    function collapseToolbar() {
      state.prefs.toolbarVisible = false;
      savePrefs();
      renderToolbarState();
    }

    function isLocalWhisperConfigured() {
      return Boolean(
        String(state.prefs.localWhisperExePath || '').trim() &&
        String(state.prefs.localWhisperModelPath || '').trim()
      );
    }

    function openVoiceSettingsPanel() {
      try {
        if (typeof window.openSettingsPanel === 'function') {
          window.openSettingsPanel();
        } else {
          const btn = document.getElementById('settingsBtn');
          if (btn && typeof btn.click === 'function') btn.click();
        }
      } catch (_) { }

      try { ensureVoiceSettingsSection(); } catch (_) { }

      try {
        if (typeof window.openSettingsSection === 'function') {
          window.openSettingsSection('voice');
          return;
        }
      } catch (_) { }

      const navBtn = state.settingsUi && state.settingsUi.navBtn;
      if (navBtn && typeof navBtn.click === 'function') {
        try { navBtn.click(); } catch (_) { }
      }
    }

    function ensureToggleChip() {
      let chip = state.toggleChip;
      if (chip && chip.isConnected) {
        const kbBtn = document.getElementById('toggleKbBtn');
        const kbWrap = kbBtn ? kbBtn.closest('.bar-dropdown-wrap') : null;
        const target = kbWrap || kbBtn;
        if (target && target.parentNode && chip.previousElementSibling !== target) {
          target.insertAdjacentElement('afterend', chip);
        }
        if (!String(chip.textContent || '').trim()) {
          chip.innerHTML = '<span class="voice-assist-chip-label">' + escapeHtml(t('🎤 语音', '🎤 Voice')) + '</span>';
        }
        return chip;
      }

      const bottomBar = getComposerBottomBar();
      if (!bottomBar) return null;

      chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'bar-chip voice-assist-chip';
      chip.dataset.action = 'toggle-voice-toolbar';
      chip.innerHTML = '<span class="voice-assist-chip-label">' + escapeHtml(t('🎤 语音', '🎤 Voice')) + '</span>';
      chip.title = t('展开语音工具条', 'Expand voice toolbar');
      chip.addEventListener('click', () => {
        state.prefs.toolbarVisible = !Boolean(state.prefs.toolbarVisible);
        savePrefs();
        renderToolbarState();
      });

      const kbBtn = document.getElementById('toggleKbBtn');
      const kbWrap = kbBtn ? kbBtn.closest('.bar-dropdown-wrap') : null;
      const target = kbWrap || kbBtn;
      if (target && target.parentNode === bottomBar) {
        target.insertAdjacentElement('afterend', chip);
      } else {
        bottomBar.appendChild(chip);
      }
      state.toggleChip = chip;
      return chip;
    }

    function ensureVoiceSettingsSection() {
      const nav = getSettingsNav();
      const content = getSettingsContent();
      if (!nav || !content) return null;

      let navBtn = nav.querySelector('.settings-nav-item[data-section="voice"]');
      if (!navBtn) {
        navBtn = document.createElement('button');
        navBtn.type = 'button';
        navBtn.className = 'settings-nav-item';
        navBtn.dataset.section = 'voice';
        const insertBefore = nav.querySelector('.settings-nav-item[data-section="mcp"]')
          || nav.querySelector('.settings-nav-spacer')
          || nav.lastElementChild;
        if (insertBefore) nav.insertBefore(navBtn, insertBefore);
        else nav.appendChild(navBtn);
      }

      let section = content.querySelector('.settings-section[data-section="voice"]');
      if (!section) {
        section = document.createElement('div');
        section.className = 'settings-section hidden';
        section.dataset.section = 'voice';
        section.innerHTML = `
          <h3></h3>
          <div class="voice-settings-grid">
            <div class="voice-settings-card">
              <h4 data-role="global-title"></h4>
              <div class="setting-row">
                <label data-role="toolbar-visible-label"></label>
                <div class="setting-control">
                  <label class="toggle">
                    <input type="checkbox" data-role="toolbar-visible-toggle">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div class="setting-row">
                <label data-role="auto-speak-label"></label>
                <div class="setting-control">
                  <label class="toggle">
                    <input type="checkbox" data-role="auto-speak-toggle">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div class="setting-row">
                <label data-role="voice-provider-label"></label>
                <select data-role="voice-provider-select">
                  <option value="system"></option>
                  <option value="online_reserved"></option>
                </select>
              </div>
              <div class="setting-row">
                <label data-role="voice-select-label"></label>
                <select data-role="settings-voice-select"></select>
              </div>
              <div class="setting-row">
                <label data-role="rate-label"></label>
                <div class="setting-control range-control">
                  <input type="range" min="0.6" max="1.8" step="0.1" data-role="settings-rate-range">
                  <span class="range-value" data-role="settings-rate-value"></span>
                </div>
              </div>
              <div class="voice-settings-note" data-role="voice-provider-note"></div>
            </div>

            <div class="voice-settings-card">
              <h4 data-role="stt-title"></h4>
              <div class="setting-row">
                <label data-role="stt-mode-label"></label>
                <select data-role="stt-mode-select">
                  <option value="native"></option>
                  <option value="local_whisper"></option>
                </select>
              </div>
              <div class="setting-row">
                <label data-role="stt-lang-label"></label>
                <input type="text" data-role="stt-lang-input" placeholder="auto / zh / en">
              </div>
              <div class="setting-row">
                <label data-role="whisper-exe-label"></label>
                <div class="setting-control">
                  <input type="text" data-role="whisper-exe-input" placeholder="E:\\tools\\whisper.cpp\\whisper-cli.exe">
                  <button type="button" class="btn ghost" data-action="pick-whisper-exe">📁</button>
                </div>
              </div>
              <div class="setting-row">
                <label data-role="whisper-model-label"></label>
                <div class="setting-control">
                  <input type="text" data-role="whisper-model-input" placeholder="E:\\models\\ggml-base.bin">
                  <button type="button" class="btn ghost" data-action="pick-whisper-model">📁</button>
                </div>
              </div>
              <div class="setting-row">
                <label data-role="whisper-threads-label"></label>
                <input type="number" min="1" max="32" step="1" data-role="whisper-threads-input">
              </div>
              <div class="setting-row">
                <label data-role="whisper-translate-label"></label>
                <div class="setting-control">
                  <label class="toggle">
                    <input type="checkbox" data-role="whisper-translate-toggle">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div class="voice-settings-note" data-role="stt-note"></div>
            </div>

            <div class="voice-settings-card">
              <h4 data-role="packs-title"></h4>
              <div class="voice-settings-actions">
                <button type="button" class="btn" data-action="import-pack-file"></button>
                <button type="button" class="btn ghost" data-action="export-current-pack"></button>
                <button type="button" class="btn ghost" data-action="open-pack-url"></button>
              </div>
              <input type="file" accept=".json,application/json" data-role="pack-file-input" style="display:none">
              <div class="setting-row hidden" data-role="pack-url-row">
                <label data-role="pack-url-label"></label>
                <div class="setting-control">
                  <input type="url" data-role="pack-url-input" placeholder="https://example.com/voice-pack.json">
                  <button type="button" class="btn" data-action="import-pack-url"></button>
                </div>
              </div>
              <div class="voice-settings-note" data-role="packs-note"></div>
              <div class="voice-pack-list" data-role="pack-list"></div>
            </div>
          </div>
        `;
        content.appendChild(section);
      }

      if (!state.settingsUi) {
        state.settingsUi = {
          navBtn,
          section
        };
      } else {
        state.settingsUi.navBtn = navBtn;
        state.settingsUi.section = section;
      }

      bindVoiceSettingsEvents(section);
      renderVoiceSettingsSection();
      return section;
    }

    function bindVoiceSettingsEvents(section) {
      if (!section || section.dataset.voiceBound === '1') return;
      section.dataset.voiceBound = '1';

      function getDesktopFilePicker() {
        const bridge = window.EchoMuseDesktop;
        if (!bridge || typeof bridge.openFileDialog !== 'function') return null;
        return bridge.openFileDialog.bind(bridge);
      }

      function parentDirOf(filePath) {
        const raw = String(filePath || '').trim();
        if (!raw) return '';
        const normalized = raw.replace(/\//g, '\\');
        const idx = normalized.lastIndexOf('\\');
        return idx > 0 ? normalized.slice(0, idx) : '';
      }

      async function pickFileIntoInput(inputRole, dialogOptions) {
        const picker = getDesktopFilePicker();
        const input = section.querySelector(`[data-role="${inputRole}"]`);
        if (!input) return;
        if (!picker) {
          onStatus(t('当前环境不支持文件选择，请手动填写路径', 'File picker is not available in this environment'));
          return;
        }
        const result = await picker({
          title: String((dialogOptions && dialogOptions.title) || ''),
          buttonLabel: String((dialogOptions && dialogOptions.buttonLabel) || ''),
          defaultPath: parentDirOf(input.value || ''),
          filters: dialogOptions && dialogOptions.filters
        });
        if (!result || result.canceled) {
          if (result && result.error) onStatus(t('打开文件选择失败：', 'Open file dialog failed: ') + result.error);
          return;
        }
        if (!result.filePath) return;
        input.value = String(result.filePath);
        applySettingsFieldChange(input, 'change');
      }

      function applySettingsFieldChange(target, source) {
        if (!target || !target.dataset) return false;
        let touched = false;
        switch (target.dataset.role) {
          case 'toolbar-visible-toggle':
            state.prefs.toolbarVisible = Boolean(target.checked);
            savePrefs();
            renderToolbarState();
            renderVoiceSettingsSection();
            touched = true;
            break;
          case 'auto-speak-toggle':
            state.prefs.autoSpeak = Boolean(target.checked);
            savePrefs();
            renderToolbarState();
            touched = true;
            break;
          case 'voice-provider-select':
            state.prefs.voiceProvider = String(target.value || 'system');
            savePrefs();
            renderVoiceSettingsSection();
            touched = true;
            break;
          case 'settings-voice-select':
            state.prefs.voiceName = String(target.value || '');
            savePrefs();
            renderToolbarState();
            touched = true;
            break;
          case 'settings-rate-range':
            state.prefs.rate = clampNumber(target.value, 0.5, 2, 1);
            savePrefs();
            renderToolbarState();
            renderVoiceSettingsSection();
            touched = true;
            break;
          case 'stt-mode-select':
            state.prefs.sttMode = String(target.value || 'native');
            savePrefs();
            renderToolbarState();
            renderVoiceSettingsSection();
            touched = true;
            break;
          case 'stt-lang-input':
            state.prefs.sttLang = String(target.value || '').trim();
            savePrefs();
            if (source !== 'input') renderToolbarState();
            touched = true;
            break;
          case 'whisper-exe-input':
            state.prefs.localWhisperExePath = String(target.value || '').trim();
            savePrefs();
            renderToolbarState();
            if (source !== 'input') renderVoiceSettingsSection();
            touched = true;
            break;
          case 'whisper-model-input':
            state.prefs.localWhisperModelPath = String(target.value || '').trim();
            savePrefs();
            renderToolbarState();
            if (source !== 'input') renderVoiceSettingsSection();
            touched = true;
            break;
          case 'whisper-threads-input':
            state.prefs.localWhisperThreads = clampNumber(target.value, 1, 32, 4);
            savePrefs();
            if (source !== 'input') renderToolbarState();
            touched = true;
            break;
          case 'whisper-translate-toggle':
            state.prefs.localWhisperTranslate = Boolean(target.checked);
            savePrefs();
            renderToolbarState();
            touched = true;
            break;
          default:
            break;
        }
        return touched;
      }

      section.addEventListener('change', (e) => {
        const target = e.target;
        applySettingsFieldChange(target, 'change');
      });

      section.addEventListener('input', (e) => {
        const target = e.target;
        if (!target || !target.dataset) return;
        if (!/^(stt-lang-input|whisper-exe-input|whisper-model-input|whisper-threads-input|settings-rate-range)$/.test(String(target.dataset.role || ''))) return;
        applySettingsFieldChange(target, 'input');
      });

      section.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.dataset.action || '';
        if (action === 'import-pack-file') {
          const fileInput = section.querySelector('[data-role="pack-file-input"]');
          if (fileInput) fileInput.click();
          return;
        }
        if (action === 'open-pack-url') {
          const row = section.querySelector('[data-role="pack-url-row"]');
          if (row) row.classList.toggle('hidden');
          return;
        }
        if (action === 'pick-whisper-exe') {
          await pickFileIntoInput('whisper-exe-input', {
            title: t('选择 Whisper 可执行文件', 'Choose Whisper executable'),
            buttonLabel: t('选择', 'Select'),
            filters: [{ name: 'Executable', extensions: ['exe'] }]
          });
          return;
        }
        if (action === 'pick-whisper-model') {
          await pickFileIntoInput('whisper-model-input', {
            title: t('选择 Whisper 模型文件', 'Choose Whisper model file'),
            buttonLabel: t('选择', 'Select'),
            filters: [{ name: 'Whisper Model', extensions: ['bin', 'gguf'] }]
          });
          return;
        }
        if (action === 'import-pack-url') {
          const urlInput = section.querySelector('[data-role="pack-url-input"]');
          const url = String(urlInput && urlInput.value || '').trim();
          if (!url) return onStatus(t('请输入音色包 URL', 'Please input a voice pack URL'));
          try {
            const resp = await fetch(url, { cache: 'no-store' });
            const json = await resp.json();
            importVoicePackJson(json, url);
          } catch (error) {
            onStatus(t(`导入音色包失败：${error.message || error}`, `Voice pack import failed: ${error.message || error}`));
          }
          return;
        }
        if (action === 'export-current-pack') {
          exportCurrentVoicePack();
          return;
        }
        if (action === 'apply-pack') {
          applyVoicePack(btn.dataset.packId || '');
          return;
        }
        if (action === 'delete-pack') {
          deleteVoicePack(btn.dataset.packId || '');
          return;
        }
      });

      const fileInput = section.querySelector('[data-role="pack-file-input"]');
      if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          try {
            const text = await file.text();
            const json = JSON.parse(text);
            importVoicePackJson(json, file.name || 'file');
          } catch (error) {
            onStatus(t(`导入音色包失败：${error.message || error}`, `Voice pack import failed: ${error.message || error}`));
          }
          e.target.value = '';
        });
      }
    }

    function renderVoiceSettingsSection() {
      const section = state.settingsUi && state.settingsUi.section;
      const navBtn = state.settingsUi && state.settingsUi.navBtn;
      if (!section || !navBtn) return;
      navBtn.textContent = t('语音', 'Voice');

      const setText = (sel, zh, en) => {
        const el = section.querySelector(sel);
        if (el) el.textContent = t(zh, en);
      };
      setText(':scope > h3', '语音设置', 'Voice Settings');
      setText('[data-role="global-title"]', '语音朗读（TTS）', 'TTS');
      setText('[data-role="toolbar-visible-label"]', '显示聊天语音工具条', 'Show chat voice toolbar');
      setText('[data-role="auto-speak-label"]', '自动朗读角色回复', 'Auto-speak role replies');
      setText('[data-role="voice-provider-label"]', '语音提供方', 'Voice provider');
      setText('[data-role="voice-select-label"]', '默认音色', 'Default voice');
      setText('[data-role="rate-label"]', '语速', 'Rate');
      setText('[data-role="stt-title"]', '语音输入（STT）', 'Speech Input (STT)');
      setText('[data-role="stt-mode-label"]', '语音输入模式', 'Speech input mode');
      setText('[data-role="stt-lang-label"]', '识别语言', 'Recognition language');
      setText('[data-role="whisper-exe-label"]', 'Whisper 可执行文件', 'Whisper executable path');
      setText('[data-role="whisper-model-label"]', 'Whisper 模型文件', 'Whisper model path');
      setText('[data-role="whisper-threads-label"]', 'Whisper 线程数', 'Whisper threads');
      setText('[data-role="whisper-translate-label"]', '翻译为英文（关闭=保留原语言）', 'Translate to English (off = keep original language)');
      setText('[data-role="packs-title"]', '音色包（预设）', 'Voice Packs (Presets)');
      setText('[data-role="pack-url-label"]', '音色包 URL', 'Voice pack URL');

      const providerSelect = section.querySelector('[data-role="voice-provider-select"]');
      if (providerSelect) {
        const opts = providerSelect.querySelectorAll('option');
        if (opts[0]) opts[0].textContent = t('系统音色（speechSynthesis）', 'System voices (speechSynthesis)');
        if (opts[1]) opts[1].textContent = t('在线 TTS（预留）', 'Online TTS (reserved)');
        providerSelect.value = state.prefs.voiceProvider || 'system';
      }

      const voiceSelect = section.querySelector('[data-role="settings-voice-select"]');
      if (voiceSelect) {
        const current = String(state.prefs.voiceName || '');
        const options = [`<option value="">${escapeHtml(t('系统默认', 'System default'))}</option>`]
          .concat((state.voices || []).map((voice) => {
            const label = voice.name + (voice.lang ? (' (' + voice.lang + ')') : '');
            return '<option value="' + escapeAttr(voice.name) + '">' + escapeHtml(label) + '</option>';
          }));
        voiceSelect.innerHTML = options.join('');
        if (current && Array.from(voiceSelect.options).some((o) => o.value === current)) voiceSelect.value = current;
        else voiceSelect.value = '';
      }

      const toolbarToggle = section.querySelector('[data-role="toolbar-visible-toggle"]');
      if (toolbarToggle) toolbarToggle.checked = Boolean(state.prefs.toolbarVisible);
      const autoSpeakToggle = section.querySelector('[data-role="auto-speak-toggle"]');
      if (autoSpeakToggle) autoSpeakToggle.checked = Boolean(state.prefs.autoSpeak);
      const rateRange = section.querySelector('[data-role="settings-rate-range"]');
      const rateValue = section.querySelector('[data-role="settings-rate-value"]');
      if (rateRange) rateRange.value = String(state.prefs.rate || 1);
      if (rateValue) rateValue.textContent = (Number(state.prefs.rate || 1).toFixed(1)) + 'x';

      const sttModeSelect = section.querySelector('[data-role="stt-mode-select"]');
      if (sttModeSelect) {
        const opts = sttModeSelect.querySelectorAll('option');
        if (opts[0]) opts[0].textContent = t('浏览器原生（兼容性有限）', 'Browser native (limited compatibility)');
        if (opts[1]) opts[1].textContent = t('本地 Whisper（推荐桌面版）', 'Local Whisper (recommended desktop)');
        sttModeSelect.value = state.prefs.sttMode || 'native';
      }
      const sttLangInput = section.querySelector('[data-role="stt-lang-input"]');
      if (sttLangInput) sttLangInput.value = String(state.prefs.sttLang || '');
      const exeInput = section.querySelector('[data-role="whisper-exe-input"]');
      if (exeInput) exeInput.value = String(state.prefs.localWhisperExePath || '');
      const modelInput = section.querySelector('[data-role="whisper-model-input"]');
      if (modelInput) modelInput.value = String(state.prefs.localWhisperModelPath || '');
      const threadsInput = section.querySelector('[data-role="whisper-threads-input"]');
      if (threadsInput) threadsInput.value = String(state.prefs.localWhisperThreads || 4);
      const translateToggle = section.querySelector('[data-role="whisper-translate-toggle"]');
      if (translateToggle) translateToggle.checked = state.prefs.localWhisperTranslate !== false;

      const providerNote = section.querySelector('[data-role="voice-provider-note"]');
      if (providerNote) providerNote.textContent = state.prefs.voiceProvider === 'online_reserved'
        ? t('在线 TTS 提供方后续会接入；当前仍使用系统音色。', 'Online TTS providers will be added later; currently uses system voices.')
        : t('系统音色来自浏览器/系统 speechSynthesis，可通过导入音色包快速切换参数。', 'System voices come from speechSynthesis; import preset packs to switch quickly.');

      const sttNote = section.querySelector('[data-role="stt-note"]');
      if (sttNote) {
        sttNote.innerHTML = state.prefs.sttMode === 'local_whisper'
          ? t(
            `本地 Whisper 需要填写可执行文件和模型路径。默认保留原语言转写；仅在开启“翻译为英文”时才会转成英文。回到聊天页点击“开始录音/停止并转写”。<br>如果安装包未内置 Whisper，可从 <a href="${WHISPER_CPP_RELEASES_URL}" target="_blank" rel="noopener noreferrer">官方下载页</a> 获取 whisper.cpp（Windows 包里需要 <code>whisper-cli.exe</code>），模型可参考 <a href="${WHISPER_CPP_QUICKSTART_URL}" target="_blank" rel="noopener noreferrer">官方 Quick Start</a>。`,
            `Local Whisper requires an executable path and a model path. It keeps the original spoken language by default; only translates when “Translate to English” is enabled. Use Start Recording / Stop & Transcribe in chat.<br>If your app package does not bundle Whisper, download whisper.cpp from the <a href="${WHISPER_CPP_RELEASES_URL}" target="_blank" rel="noopener noreferrer">official releases page</a> (the Windows package should include <code>whisper-cli.exe</code>). Model instructions are in the <a href="${WHISPER_CPP_QUICKSTART_URL}" target="_blank" rel="noopener noreferrer">official Quick Start</a>.`
          )
          : t(
            `浏览器原生语音输入在 Electron 环境兼容性不稳定，桌面版建议使用本地 Whisper。若安装包未内置 Whisper，可从 <a href="${WHISPER_CPP_RELEASES_URL}" target="_blank" rel="noopener noreferrer">官方下载页</a> 获取。`,
            `Native browser speech input is unstable in Electron; desktop users should prefer Local Whisper. If your package does not bundle Whisper, download it from the <a href="${WHISPER_CPP_RELEASES_URL}" target="_blank" rel="noopener noreferrer">official releases page</a>.`
          );
      }

      const importBtn = section.querySelector('[data-action="import-pack-file"]');
      if (importBtn) importBtn.textContent = t('导入音色包（JSON）', 'Import Voice Pack (JSON)');
      const exportBtn = section.querySelector('[data-action="export-current-pack"]');
      if (exportBtn) exportBtn.textContent = t('导出当前配置为音色包', 'Export current as pack');
      const openUrlBtn = section.querySelector('[data-action="open-pack-url"]');
      if (openUrlBtn) openUrlBtn.textContent = t('从 URL 导入', 'Import from URL');
      const importUrlBtn = section.querySelector('[data-action="import-pack-url"]');
      if (importUrlBtn) importUrlBtn.textContent = t('导入', 'Import');
      const pickExeBtn = section.querySelector('[data-action="pick-whisper-exe"]');
      if (pickExeBtn) pickExeBtn.title = t('选择 Whisper 可执行文件', 'Choose Whisper executable');
      const pickModelBtn = section.querySelector('[data-action="pick-whisper-model"]');
      if (pickModelBtn) pickModelBtn.title = t('选择 Whisper 模型文件', 'Choose Whisper model file');

      const packList = section.querySelector('[data-role="pack-list"]');
      if (packList) {
        const packs = Array.isArray(state.prefs.voicePacks) ? state.prefs.voicePacks : [];
        if (!packs.length) {
          packList.innerHTML = '<div class="voice-settings-note">' + escapeHtml(t('暂无音色包。可导入 JSON 预设，或导出当前配置为音色包。', 'No voice packs yet. Import a JSON preset or export current settings.')) + '</div>';
        } else {
          packList.innerHTML = packs.map((pack) => {
            const meta = [pack.voiceName || t('系统默认', 'System default'), (Number(pack.rate || 1).toFixed(1)) + 'x', pack.lang || 'auto'].join(' · ');
            return '<div class="voice-pack-item"><div><div class="voice-pack-name">' + escapeHtml(pack.name || 'Voice Pack') + '</div><div class="voice-pack-meta">' + escapeHtml(meta) + '</div></div><div class="voice-settings-actions"><button type="button" class="btn" data-action="apply-pack" data-pack-id="' + escapeAttr(pack.id) + '">' + escapeHtml(t('应用', 'Apply')) + '</button><button type="button" class="btn ghost" data-action="delete-pack" data-pack-id="' + escapeAttr(pack.id) + '">' + escapeHtml(t('删除', 'Delete')) + '</button></div></div>';
          }).join('');
        }
      }
    }

    function importVoicePackJson(json, sourceLabel) {
      const raw = json && typeof json === 'object' ? json : {};
      const candidates = Array.isArray(raw.packs) ? raw.packs : [raw];
      let imported = 0;
      for (const item of candidates) {
        if (!item || typeof item !== 'object') continue;
        const pack = {
          id: `pack_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          name: String(item.name || item.label || 'Voice Pack').slice(0, 80),
          voiceName: String(item.voiceName || item.voice || ''),
          rate: clampNumber(item.rate, 0.5, 2, 1),
          pitch: clampNumber(item.pitch, 0, 2, 1),
          volume: clampNumber(item.volume, 0, 1, 1),
          lang: String(item.lang || item.language || ''),
          source: String(sourceLabel || 'import')
        };
        if (!pack.name) continue;
        state.prefs.voicePacks = (state.prefs.voicePacks || []).filter((p) => p.id !== pack.id);
        state.prefs.voicePacks.push(pack);
        imported += 1;
      }
      savePrefs();
      renderVoiceSettingsSection();
      onStatus(imported > 0
        ? t(`已导入音色包 ${imported} 个`, `Imported ${imported} voice pack(s)`)
        : t('未识别到可用音色包', 'No valid voice packs found'));
    }

    function applyVoicePack(packId) {
      const pack = (state.prefs.voicePacks || []).find((p) => p.id === String(packId || ''));
      if (!pack) return;
      state.prefs.voiceName = String(pack.voiceName || '');
      state.prefs.rate = clampNumber(pack.rate, 0.5, 2, 1);
      state.prefs.pitch = clampNumber(pack.pitch, 0, 2, 1);
      state.prefs.volume = clampNumber(pack.volume, 0, 1, 1);
      if (pack.lang) state.prefs.sttLang = String(pack.lang || '');
      savePrefs();
      renderToolbarState();
      renderVoiceSettingsSection();
      onStatus(t(`已应用音色包：${pack.name}`, `Applied voice pack: ${pack.name}`));
    }

    function deleteVoicePack(packId) {
      const before = (state.prefs.voicePacks || []).length;
      state.prefs.voicePacks = (state.prefs.voicePacks || []).filter((p) => p.id !== String(packId || ''));
      if (state.prefs.voicePacks.length === before) return;
      savePrefs();
      renderVoiceSettingsSection();
    }

    function exportCurrentVoicePack() {
      const pack = {
        name: `Voice Pack ${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}`,
        voiceName: String(state.prefs.voiceName || ''),
        rate: clampNumber(state.prefs.rate, 0.5, 2, 1),
        pitch: clampNumber(state.prefs.pitch, 0, 2, 1),
        volume: clampNumber(state.prefs.volume, 0, 1, 1),
        lang: String(state.prefs.sttLang || '')
      };
      const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${pack.name}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    function ensureToolbar() {
      injectStyle();
      if (state.uiReady && state.ui && state.ui.root && state.ui.root.isConnected) return state.ui;
      const composer = getComposerWrap();
      if (!composer) return null;

      const root = document.createElement('div');
      root.className = 'voice-assist-toolbar';
      root.innerHTML = buildToolbarHtml();

      const inputWrap = composer.querySelector('.composer-input-wrap');
      if (inputWrap && inputWrap.parentNode) {
        inputWrap.insertAdjacentElement('afterend', root);
      } else {
        composer.appendChild(root);
      }

      const ui = {
        root,
        speakLatestBtn: root.querySelector('[data-action="speak-latest"]'),
        stopBtn: root.querySelector('[data-action="stop-speak"]'),
        sttBtn: root.querySelector('[data-action="toggle-stt"]'),
        autoSpeakToggle: root.querySelector('[data-action="toggle-auto-speak"]'),
        voiceSelect: root.querySelector('[data-role="voice-select"]'),
        rateRange: root.querySelector('[data-role="rate"]'),
        applyAvatarBtn: root.querySelector('[data-action="apply-avatar-voice"]'),
        clearAvatarBtn: root.querySelector('[data-action="clear-avatar-voice"]'),
        collapseBtn: root.querySelector('[data-action="collapse-toolbar"]'),
        status: root.querySelector('[data-role="status"]')
      };

      root.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.dataset.action || '';
        if (action === 'speak-latest') speakLatestAssistantMessage();
        if (action === 'stop-speak') stopSpeaking();
        if (action === 'toggle-stt') toggleSpeechInput();
        if (action === 'apply-avatar-voice') applyCurrentVoiceToAvatar();
        if (action === 'clear-avatar-voice') clearAvatarVoiceProfile();
        if (action === 'collapse-toolbar') collapseToolbar();
      });

      if (ui.autoSpeakToggle) {
        ui.autoSpeakToggle.checked = Boolean(state.prefs.autoSpeak);
        ui.autoSpeakToggle.addEventListener('change', () => {
          state.prefs.autoSpeak = Boolean(ui.autoSpeakToggle.checked);
          savePrefs();
          renderToolbarState();
        });
      }
      if (ui.rateRange) {
        ui.rateRange.value = String(state.prefs.rate || 1);
        ui.rateRange.addEventListener('input', () => {
          state.prefs.rate = clampNumber(ui.rateRange.value, 0.5, 2, 1);
          savePrefs();
          renderToolbarState();
        });
      }
      if (ui.voiceSelect) {
        ui.voiceSelect.addEventListener('change', () => {
          state.prefs.voiceName = String(ui.voiceSelect.value || '');
          savePrefs();
          renderToolbarState();
        });
      }

      const messageList = getMessageList();
      if (messageList) {
        messageList.addEventListener('click', (e) => {
          const btn = e.target.closest(`.${MSG_BTN_CLASS}[data-mid]`);
          if (!btn) return;
          e.preventDefault();
          e.stopPropagation();
          speakAssistantMessageById(btn.dataset.mid || '');
        });
      }

      state.ui = ui;
      state.uiReady = true;
      refreshVoices();
      renderToolbarState();
      return ui;
    }

    function renderToolbarState() {
      const ui = ensureToolbar();
      if (!ui) return;
      const localMode = shouldUseLocalWhisperStt();
      const localWhisperConfigured = isLocalWhisperConfigured();
      const localSttAvailable = supportsLocalAudioCapture();
      const localSttTranscribing = Boolean(state.localSttTranscribing);
      const sttButtonAvailable = localMode ? localSttAvailable : supportsStt;
      const supported = (supportsTts || sttButtonAvailable);
      ui.root.classList.toggle('hidden', !supported || !Boolean(state.prefs.toolbarVisible));

      const chip = ensureToggleChip();
      if (chip) {
        const chipLabel = String(t('🎤 语音', '🎤 Voice') || '').trim() || (isZh() ? '🎤 语音' : '🎤 Voice');
        chip.classList.toggle('hidden', !supported);
        chip.classList.toggle('active-tool', supported && Boolean(state.prefs.toolbarVisible));
        chip.innerHTML = '<span class="voice-assist-chip-label">' + escapeHtml(chipLabel) + '</span>';
        chip.title = state.prefs.toolbarVisible
          ? t('收起语音工具条', 'Collapse voice toolbar')
          : t('展开语音工具条', 'Expand voice toolbar');
      }

      if (ui.autoSpeakToggle) ui.autoSpeakToggle.checked = Boolean(state.prefs.autoSpeak);
      if (ui.rateRange) ui.rateRange.value = String(state.prefs.rate || 1);
      if (ui.sttBtn) {
        ui.sttBtn.disabled = localSttTranscribing || !sttButtonAvailable;
        ui.sttBtn.textContent = localSttTranscribing
          ? t('转写中…', 'Transcribing...')
          : (state.listening
            ? (localMode ? t('停止并转写', 'Stop & Transcribe') : t('停止录音', 'Stop Dictation'))
            : (localMode
              ? (localWhisperConfigured ? t('开始录音', 'Start Recording') : t('配置', 'Setup STT'))
              : t('语音输入', 'Dictation')));
        ui.sttBtn.classList.toggle('active', state.listening);
        if (localMode) {
          if (localSttTranscribing) {
            ui.sttBtn.title = t('正在本地 Whisper 转写…', 'Local Whisper transcription in progress...');
          } else if (!localSttAvailable) {
            ui.sttBtn.title = t('当前环境不支持本地录音（请确认麦克风权限）', 'Local recording is not supported (microphone permission required)');
          } else if (!localWhisperConfigured) {
            ui.sttBtn.title = t('未配置本地 Whisper 路径，点击打开“设置-语音”', 'Whisper paths are not configured. Click to open Settings > Voice');
          } else {
            ui.sttBtn.title = t('本地 Whisper 录音 + 转写（再次点击停止）', 'Local Whisper recording + transcription (click again to stop)');
          }
        } else {
          ui.sttBtn.title = supportsStt
            ? t('浏览器原生语音输入（兼容性有限）', 'Native browser speech input (limited compatibility)')
            : t('当前环境不支持 SpeechRecognition', 'SpeechRecognition is not supported in this environment');
        }
      }
      if (ui.collapseBtn) {
        ui.collapseBtn.textContent = '▴';
        ui.collapseBtn.title = t('收起语音工具条', 'Collapse voice toolbar');
      }
      if (ui.stopBtn) ui.stopBtn.disabled = !supportsTts;
      if (ui.speakLatestBtn) ui.speakLatestBtn.disabled = !supportsTts;
      const avatar = getActiveAvatar();
      if (ui.applyAvatarBtn) ui.applyAvatarBtn.disabled = !avatar;
      if (ui.clearAvatarBtn) ui.clearAvatarBtn.disabled = !(avatar && avatar.voiceProfile);
      if (ui.status) {
        if (!supportsTts && !sttButtonAvailable) ui.status.textContent = t('当前环境不支持语音 API', 'No speech API support');
        else if (localSttTranscribing) ui.status.textContent = t('正在本地转写…', 'Transcribing locally...');
        else if (state.listening) ui.status.textContent = localMode ? t('录音中…', 'Recording...') : t('识别中…', 'Listening...');
        else if (state.toolbarNotice && (Date.now() - Number(state.toolbarNoticeTs || 0) < 30000)) ui.status.textContent = state.toolbarNotice;
        else if (localMode && localWhisperConfigured) ui.status.textContent = t('点“开始录音”，再点“停止并转写”', 'Click Start Recording, then Stop & Transcribe');
        else ui.status.textContent = '';
      }
      refreshVoiceSelect();
      ensureVoiceSettingsSection();
      renderVoiceSettingsSection();
    }

    function refreshVoices() {
      if (!supportsTts) return;
      let list = [];
      try {
        list = window.speechSynthesis.getVoices() || [];
      } catch (_) {
        list = [];
      }
      state.voices = list.slice();
      refreshVoiceSelect();
    }

    function refreshVoiceSelect() {
      const ui = state.ui;
      if (!ui || !ui.voiceSelect) return;
      const currentValue = String(ui.voiceSelect.value || state.prefs.voiceName || '');
      const options = ['<option value="">' + escapeHtml(t('系统默认', 'System default')) + '</option>']
        .concat(state.voices.map((voice, idx) => {
          const label = `${voice.name}${voice.lang ? ` (${voice.lang})` : ''}`;
          return `<option value="${escapeAttr(voice.name)}">${escapeHtml(label)}</option>`;
        }));
      ui.voiceSelect.innerHTML = options.join('');
      if (currentValue && Array.from(ui.voiceSelect.options).some((opt) => opt.value === currentValue)) {
        ui.voiceSelect.value = currentValue;
      } else if (state.prefs.voiceName && Array.from(ui.voiceSelect.options).some((opt) => opt.value === state.prefs.voiceName)) {
        ui.voiceSelect.value = state.prefs.voiceName;
      } else {
        ui.voiceSelect.value = '';
      }
    }

    function escapeHtml(text) {
      return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function escapeAttr(text) {
      return escapeHtml(text);
    }

    function getLatestAssistantMessage(session) {
      const s = session || getActiveSession();
      if (!s || !Array.isArray(s.messages)) return null;
      for (let i = s.messages.length - 1; i >= 0; i -= 1) {
        const m = s.messages[i];
        if (!m || m.role !== 'assistant') continue;
        if (m.kind && m.kind !== 'chat') continue;
        if (!String(m.content || '').trim()) continue;
        return m;
      }
      return null;
    }

    function getAssistantMessageById(session, messageId) {
      if (!session || !Array.isArray(session.messages)) return null;
      return session.messages.find((m) => m && m.id === messageId && m.role === 'assistant' && (!m.kind || m.kind === 'chat')) || null;
    }

    function getSpeakableText(session, message) {
      if (!message) return '';
      let text = '';
      if (typeof opts.getSpeakTextForMessage === 'function') {
        try { text = String(opts.getSpeakTextForMessage(session, message) || ''); } catch (_) { }
      }
      if (!text) text = String(message.content || '');
      return String(text || '')
        .replace(/\n?\[(?:Translating|Translation failed)[^\]\n]*\]\s*$/iu, '')
        .replace(/\n?\[(?:翻译中|翻译失败)[^\]\n]*\]\s*$/u, '')
        .trim();
    }

    function getEffectiveVoiceSelection(session, message) {
      const avatar = session && session.avatarId ? getAvatarById(session.avatarId) : null;
      return getEffectivePrefsForAvatar(avatar);
    }

    function createMessageSpeakKey(session, message) {
      if (!session || !message) return '';
      return `${session.id}:${message.id}:${String(message.content || '').length}`;
    }

    function stopSpeaking() {
      if (!supportsTts) return;
      try {
        window.speechSynthesis.cancel();
      } catch (_) { }
      state.speakingMessageKey = '';
      renderToolbarState();
    }

    function speakText(session, message) {
      if (!supportsTts || !message) return false;
      const text = getSpeakableText(session, message);
      if (!text) return false;
      stopSpeaking();
      const prefs = getEffectiveVoiceSelection(session, message);
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = clampNumber(prefs.rate, 0.5, 2, 1);
      utter.pitch = clampNumber(prefs.pitch, 0, 2, 1);
      utter.volume = clampNumber(prefs.volume, 0, 1, 1);
      const chosenName = String(prefs.voiceName || '').trim();
      if (chosenName && supportsTts) {
        const voice = (state.voices || []).find((v) => v && v.name === chosenName);
        if (voice) {
          utter.voice = voice;
          utter.lang = voice.lang || utter.lang;
        }
      }
      if (!utter.lang) {
        utter.lang = getUiLanguage() || 'zh-CN';
      }
      utter.onend = () => {
        state.speakingMessageKey = '';
        renderToolbarState();
      };
      utter.onerror = () => {
        state.speakingMessageKey = '';
        renderToolbarState();
      };
      state.speakingMessageKey = createMessageSpeakKey(session, message);
      try {
        window.speechSynthesis.speak(utter);
        renderToolbarState();
        return true;
      } catch (error) {
        state.speakingMessageKey = '';
        onStatus(t('语音朗读失败：', 'Speech playback failed: ') + (error && error.message ? error.message : error));
        renderToolbarState();
        return false;
      }
    }

    function speakLatestAssistantMessage() {
      const session = getActiveSession();
      const message = getLatestAssistantMessage(session);
      if (!session || !message) {
        onStatus(t('暂无可朗读的回复', 'No assistant reply to speak'));
        return false;
      }
      return speakText(session, message);
    }

    function speakAssistantMessageById(messageId) {
      const session = getActiveSession();
      const message = getAssistantMessageById(session, String(messageId || ''));
      if (!session || !message) return false;
      return speakText(session, message);
    }

    function applyCurrentVoiceToAvatar() {
      const avatar = getActiveAvatar();
      if (!avatar) {
        onStatus(t('当前会话未绑定角色', 'No role bound to current session'));
        return;
      }
      avatar.voiceProfile = {
        enabled: true,
        voiceName: String(state.prefs.voiceName || ''),
        rate: clampNumber(state.prefs.rate, 0.5, 2, 1),
        pitch: 1,
        volume: 1,
        autoSpeak: Boolean(state.prefs.autoSpeak)
      };
      persistAvatars();
      rerenderAvatarUi();
      renderToolbarState();
      onStatus(t(`已应用语音到角色：${avatar.name}`, `Voice settings applied to role: ${avatar.name}`));
    }

    function clearAvatarVoiceProfile() {
      const avatar = getActiveAvatar();
      if (!avatar || !avatar.voiceProfile) return;
      delete avatar.voiceProfile;
      persistAvatars();
      rerenderAvatarUi();
      renderToolbarState();
      onStatus(t(`已清除角色语音：${avatar.name}`, `Cleared role voice: ${avatar.name}`));
    }

    function createRecognition() {
      if (!supportsStt) return null;
      const rec = new SpeechRecognitionCtor();
      rec.lang = state.prefs.sttLang || (getUiLanguage().startsWith('zh') ? 'zh-CN' : 'en-US');
      rec.continuous = false;
      rec.interimResults = Boolean(state.prefs.sttInterim);
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        state.listening = true;
        renderToolbarState();
      };
      rec.onend = () => {
        state.listening = false;
        renderToolbarState();
      };
      rec.onerror = (e) => {
        state.listening = false;
        renderToolbarState();
        const msg = e && e.error ? String(e.error) : 'unknown';
        onStatus(t('语音输入错误：', 'Speech input error: ') + msg);
      };
      rec.onresult = (event) => {
        const input = getChatInput();
        if (!input) return;
        const parts = [];
        for (let i = event.resultIndex || 0; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (!result || !result[0]) continue;
          parts.push(String(result[0].transcript || ''));
        }
        const transcript = parts.join('').trim();
        if (!transcript) return;
        const prev = String(input.value || '');
        input.value = prev ? (prev + (/[\\s\\n]$/.test(prev) ? '' : ' ') + transcript) : transcript;
        try { input.dispatchEvent(new Event('input', { bubbles: true })); } catch (_) { }
        try { input.focus(); } catch (_) { }
      };
      return rec;
    }

    function shouldUseLocalWhisperStt() {
      const mode = String(state.prefs.sttMode || 'native');
      if (mode === 'local_whisper') return true;
      if (mode === 'native' && !supportsStt && isLocalWhisperConfigured()) return true;
      return false;
    }

    function supportsLocalAudioCapture() {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (window.AudioContext || window.webkitAudioContext));
    }

    function downsampleFloat32Buffer(samples, inputSampleRate, targetSampleRate) {
      if (!samples || !samples.length) return new Float32Array(0);
      if (!Number.isFinite(inputSampleRate) || inputSampleRate <= 0) return new Float32Array(samples);
      if (inputSampleRate <= targetSampleRate) return new Float32Array(samples);
      const ratio = inputSampleRate / targetSampleRate;
      const newLength = Math.max(1, Math.round(samples.length / ratio));
      const output = new Float32Array(newLength);
      let offset = 0;
      for (let i = 0; i < newLength; i += 1) {
        const next = Math.min(samples.length, Math.round((i + 1) * ratio));
        let sum = 0;
        let count = 0;
        while (offset < next) {
          sum += samples[offset];
          offset += 1;
          count += 1;
        }
        output[i] = count ? (sum / count) : 0;
      }
      return output;
    }

    function encodeWavPcm16(floatSamples, sampleRate) {
      const samples = floatSamples || new Float32Array(0);
      const buffer = new ArrayBuffer(44 + samples.length * 2);
      const view = new DataView(buffer);
      const writeStr = (offset, str) => {
        for (let i = 0; i < str.length; i += 1) view.setUint8(offset + i, str.charCodeAt(i));
      };
      writeStr(0, 'RIFF');
      view.setUint32(4, 36 + samples.length * 2, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeStr(36, 'data');
      view.setUint32(40, samples.length * 2, true);
      let offset = 44;
      for (let i = 0; i < samples.length; i += 1) {
        let s = Math.max(-1, Math.min(1, samples[i]));
        s = s < 0 ? s * 0x8000 : s * 0x7fff;
        view.setInt16(offset, s | 0, true);
        offset += 2;
      }
      return new Uint8Array(buffer);
    }

    async function startLocalWhisperRecording() {
      if (!supportsLocalAudioCapture()) throw new Error(t('当前环境不支持本地录音', 'Local audio capture is not supported'));
      if (!state.prefs.localWhisperExePath || !state.prefs.localWhisperModelPath) {
        throw new Error(t('请先在“设置-语音”中填写 Whisper 可执行文件和模型路径', 'Please configure Whisper executable and model paths in Settings > Voice first'));
      }
      if (state.localSttRecorder) return;
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        const name = String(error && error.name || '');
        const msg = String(error && error.message || error || '');
        if (/NotAllowedError|PermissionDeniedError/i.test(name) || /permission denied|denied/i.test(msg)) {
          throw new Error(t('麦克风权限被拒绝（请到 Windows 设置 > 隐私和安全性 > 麦克风，开启麦克风访问与桌面应用麦克风访问，然后重启软件）', 'Microphone permission denied (enable Microphone access and Desktop app microphone access in Windows Settings, then restart the app)'));
        }
        if (/NotFoundError|DevicesNotFoundError/i.test(name) || /device not found|not found/i.test(msg)) {
          throw new Error(t('未找到可用麦克风设备（请检查输入设备）', 'No microphone device found (check your input device)'));
        }
        throw error;
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (typeof audioCtx.resume === 'function' && audioCtx.state === 'suspended') {
        try { await audioCtx.resume(); } catch (_) { }
      }
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      const gain = audioCtx.createGain();
      gain.gain.value = 0;
      const chunks = [];
      let peak = 0;
      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer && event.inputBuffer.getChannelData ? event.inputBuffer.getChannelData(0) : null;
        if (!input || !input.length) return;
        const copied = new Float32Array(input);
        for (let i = 0; i < copied.length; i += 1) {
          const v = Math.abs(copied[i]);
          if (v > peak) peak = v;
        }
        chunks.push(copied);
      };
      source.connect(processor);
      processor.connect(gain);
      gain.connect(audioCtx.destination);
      state.localSttRecorder = { stream, audioCtx, source, processor, gain, chunks, sampleRate: audioCtx.sampleRate, peakRef: () => peak };
      state.listening = true;
      renderToolbarState();
      onStatus(t('录音中：再次点击“停止并转写”完成输入', 'Recording: click Stop & Transcribe to finish'));
    }

    async function stopLocalWhisperRecordingAndTranscribe() {
      const rec = state.localSttRecorder;
      if (!rec) return;
      state.localSttRecorder = null;
      state.listening = false;
      state.localSttTranscribing = true;
      renderToolbarState();
      try {
        try { rec.processor.disconnect(); } catch (_) { }
        try { rec.source.disconnect(); } catch (_) { }
        try { rec.gain.disconnect(); } catch (_) { }
        (rec.stream && rec.stream.getTracks ? rec.stream.getTracks() : []).forEach((t) => { try { t.stop(); } catch (_) { } });
        if (rec.audioCtx && typeof rec.audioCtx.close === 'function') { try { await rec.audioCtx.close(); } catch (_) { } }
        const mergedLength = (rec.chunks || []).reduce((sum, c) => sum + (c ? c.length : 0), 0);
        if (!mergedLength) throw new Error(t('未捕获到音频', 'No audio captured'));
        const peak = Number(typeof rec.peakRef === 'function' ? rec.peakRef() : 0);
        if (peak < 0.0015) {
          throw new Error(t('未检测到麦克风声音（请检查麦克风权限/输入设备）', 'No microphone signal detected (check mic permission/input device)'));
        }
        const merged = new Float32Array(mergedLength);
        let off = 0;
        for (const chunk of rec.chunks || []) { if (!chunk) continue; merged.set(chunk, off); off += chunk.length; }
        const downsampled = downsampleFloat32Buffer(merged, rec.sampleRate || 48000, 16000);
        const wavBytes = encodeWavPcm16(downsampled, 16000);
        const form = new FormData();
        form.append('audio', new Blob([wavBytes], { type: 'audio/wav' }), 'speech.wav');
        form.append('engine', 'whisper_cpp');
        form.append('whisperExePath', String(state.prefs.localWhisperExePath || ''));
        form.append('whisperModelPath', String(state.prefs.localWhisperModelPath || ''));
        form.append('language', String(state.prefs.sttLang || 'auto'));
        form.append('threads', String(Math.round(state.prefs.localWhisperThreads || 4)));
        form.append('translate', state.prefs.localWhisperTranslate === false ? '0' : '1');
        onStatus(t('正在本地转写…', 'Transcribing locally...'));
        const payload = await apiFetchJson('/api/voice/stt', { method: 'POST', body: form });
        const text = String((payload && payload.text) || '').trim();
        if (!text) throw new Error(t('未得到转写结果', 'No transcription result'));
        const input = getChatInput();
        if (input) {
          const prev = String(input.value || '');
          input.value = prev ? (prev + (/[\\s\\n]$/.test(prev) ? '' : ' ') + text) : text;
          try { input.dispatchEvent(new Event('input', { bubbles: true })); } catch (_) { }
          try { input.focus(); } catch (_) { }
        }
        onStatus(t('本地转写完成', 'Local transcription complete'));
      } catch (error) {
        const rawMsg = String((error && error.message) || error || '');
        const mappedMsg = /Whisper returned empty transcript/i.test(rawMsg)
          ? t('未识别到有效语音（请靠近麦克风并说话更清楚）', 'No speech recognized (move closer to the mic and speak clearly)')
          : rawMsg;
        onStatus(t('本地转写失败：', 'Local transcription failed: ') + mappedMsg);
      } finally {
        state.listening = false;
        state.localSttTranscribing = false;
        renderToolbarState();
      }
    }

    function toggleSpeechInput() {
      if (shouldUseLocalWhisperStt()) {
        if (state.localSttTranscribing) {
          onStatus(t('正在本地转写，请稍候…', 'Local transcription in progress, please wait...'));
          return;
        }
        if (!isLocalWhisperConfigured()) {
          onStatus(t('请先在“设置-语音”中配置 Whisper 路径', 'Please configure Whisper paths in Settings > Voice first'));
          openVoiceSettingsPanel();
          return;
        }
        if (state.localSttRecorder) {
          stopLocalWhisperRecordingAndTranscribe();
        } else {
          startLocalWhisperRecording().catch((error) => {
            state.listening = false;
            state.localSttTranscribing = false;
            renderToolbarState();
            onStatus(t('语音输入失败：', 'Speech input failed: ') + (error.message || error));
          });
        }
        return;
      }
      if (!supportsStt) {
        if (isLocalWhisperConfigured()) {
          state.prefs.sttMode = 'local_whisper';
          savePrefs();
          renderToolbarState();
          toggleSpeechInput();
          return;
        }
        onStatus(t('当前环境不支持原生语音输入，请在“设置-语音”切换到本地 Whisper', 'Native speech input is not supported. Please switch to local Whisper in Settings > Voice'));
        openVoiceSettingsPanel();
        return;
      }
      if (!state.recognition) state.recognition = createRecognition();
      if (!state.recognition) return;
      try {
        if (state.listening) state.recognition.stop();
        else state.recognition.start();
      } catch (error) {
        onStatus(t('语音输入失败：', 'Speech input failed: ') + (error && error.message ? error.message : error));
      }
    }

    function decorateAssistantMessageButtons() {
      const list = getMessageList();
      const session = getActiveSession();
      if (!list || !session) return;
      const shouldShowPerMessageBtn = Boolean(state.prefs && state.prefs.toolbarVisible);
      if (!shouldShowPerMessageBtn) {
        list.querySelectorAll(`.${MSG_BTN_CLASS}`).forEach((node) => {
          try { node.remove(); } catch (_) { }
        });
        return;
      }
      const nodes = list.querySelectorAll('.msg.assistant[data-mid]');
      nodes.forEach((node) => {
        if (node.querySelector(`.${MSG_BTN_CLASS}`)) return;
        const mid = String(node.getAttribute('data-mid') || '').trim();
        if (!mid) return;
        const msg = getAssistantMessageById(session, mid);
        if (!msg) return;
        if (!String(msg.content || '').trim()) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = MSG_BTN_CLASS;
        btn.dataset.mid = mid;
        btn.textContent = 'TTS';
        btn.title = t('朗读这条回复', 'Speak this reply');
        node.appendChild(btn);
      });
    }

    function maybeAutoSpeakLatestAssistant() {
      if (!supportsTts) return;
      const session = getActiveSession();
      if (!session) return;
      const latest = getLatestAssistantMessage(session);
      if (!latest) return;
      const prefs = getEffectiveVoiceSelection(session, latest);
      if (!prefs.autoSpeak) return;
      const key = createMessageSpeakKey(session, latest);
      if (!key || key === state.lastAutoSpokenKey) return;
      const appState = getState();
      if (appState && appState.ui && appState.ui.chatStreaming) return;
      state.lastAutoSpokenKey = key;
      speakText(session, latest);
    }

    function afterRenderMessages() {
      ensureToolbar();
      renderToolbarState();
      decorateAssistantMessageButtons();
      maybeAutoSpeakLatestAssistant();
    }

    function refreshUi() {
      if (state.ui && state.ui.root && state.ui.root.isConnected) {
        state.ui.root.innerHTML = buildToolbarHtml();
        state.uiReady = false;
        const old = state.ui.root;
        state.ui = null;
        old.remove();
      }
      if (state.toggleChip && state.toggleChip.isConnected) {
        // keep node; renderToolbarState will refresh label and active state
      } else {
        state.toggleChip = null;
      }
      ensureVoiceSettingsSection();
      ensureToggleChip();
      ensureToolbar();
      renderToolbarState();
    }

    function init() {
      ensureVoiceSettingsSection();
      ensureToggleChip();
      ensureToolbar();
      renderToolbarState();
      if (supportsTts) {
        try {
          refreshVoices();
          if (window.speechSynthesis && typeof window.speechSynthesis.addEventListener === 'function') {
            window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
          } else {
            window.speechSynthesis.onvoiceschanged = refreshVoices;
          }
        } catch (_) { }
      }
    }

    return {
      init,
      afterRenderMessages,
      refreshUi,
      stopSpeaking,
      speakLatestAssistantMessage,
      supportsTts,
      supportsStt
    };
  }

  window.EchoMuseVoiceTts = Object.freeze({
    createController
  });
})();
