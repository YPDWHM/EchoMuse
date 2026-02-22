'use strict';

const STORAGE_TOKEN_KEY = 'chatbox_access_token_v3';
const STORAGE_SESSIONS_KEY = 'chatbox_sessions_v3';
const STORAGE_ACTIVE_KEY = 'chatbox_active_session_v3';
const STORAGE_AVATARS_KEY = 'chatbox_avatars_v1';
const STORAGE_SETTINGS_KEY = 'chatbox_settings_v1';
const MIN_CN_CHARS = 800;
const MAX_SESSIONS = 30;
const MAX_ARTIFACTS_PER_SESSION = 10;

const DEFAULT_SETTINGS = {
  language: 'zh-CN',
  globalDefense: false,
  translateFrom: 'auto',
  translateTo: 'zh-CN',
  fontSize: 'md',
  theme: 'system',
  proxyEnabled: false,
  proxyType: 'socks5',
  proxyHost: '',
  proxyPort: '',
  proxyUser: '',
  proxyPass: '',
  chatContextLimit: 14,
  chatContextUnlimited: false,
  chatTemperatureUseDefault: true,
  chatTemperature: 0.7,
  chatTopPUseDefault: true,
  chatTopP: 0.9,
  chatStreamOutput: true,
  chatShowTimestamp: true,
  chatShowModel: false,
  chatShowCharCount: false,
  chatMarkdownRender: true,
  chatLatexRender: true,
  chatSpellcheck: false,
  chatAutoTitle: true,
  chatAutoPreviewArtifact: true
};

const FONT_SIZE_MAP = {
  sm: '13px',
  md: '14px',
  lg: '16px',
  xl: '18px'
};

const state = {
  token: localStorage.getItem(STORAGE_TOKEN_KEY) || '',
  sessions: [],
  avatars: [],
  activeSessionId: '',
  search: '',
  settings: { ...DEFAULT_SETTINGS },
  info: {
    host: '',
    port: '',
    model: 'qwen3:8b',
    shareMode: false,
    tokenRecommended: false,
    warning: '',
    providers: [],
    activeProviderId: ''
  },
  health: {
    online: false,
    message: 'Not connected'
  },
  ui: {
    chatStreaming: false,
    toolRunning: false,
    activeTool: '',
    drawerOpen: false,
    activeArtifactId: '',
    activeArtifactTab: 'overview',
    chatMode: 'flash',
    webSearchEnabled: false,
    selectedProviderId: '',
    selectedModel: '',
    userAvatar: localStorage.getItem('chatbox_user_avatar') || '👤',
    aiAvatar: localStorage.getItem('chatbox_ai_avatar') || '🤖',
    expandedArtifacts: {},
    inlineArtifactTabs: {},
    editAvailableModels: [],
    editSelectedModels: [],
    sidebarTab: localStorage.getItem('chatbox_sidebar_tab_v1') || 'sessions'
  },
  pdfjsLib: null
};

const els = {
  sessionSearch: document.getElementById('sessionSearch'),
  newSessionBtn: document.getElementById('newSessionBtn'),
  sessionList: document.getElementById('sessionList'),

  connDot: null,
  connLine1: document.getElementById('connLine1'),
  connLine2: document.getElementById('connLine2'),
  settingsBtn: document.getElementById('settingsBtn'),
  toggleStudyBtn: document.getElementById('toggleStudyBtn'),
  studyPanel: document.getElementById('studyPanel'),
  modelSelect: document.getElementById('modelSelect'),

  materialsBox: null,
  materialsInput: null,
  charHint: null,
  uploadBtn: null,
  clearMaterialsBtn: null,
  fileInput: document.getElementById('fileInput'),
  fileStatus: null,
  showAccessBtn: document.getElementById('showAccessBtn'),
  chatUploadBtn: document.getElementById('chatUploadBtn'),
  chatFileInput: document.getElementById('chatFileInput'),

  messageList: document.getElementById('messageList'),
  chatInput: document.getElementById('chatInput'),
  sendBtn: document.getElementById('sendBtn'),

  artifactDrawer: document.getElementById('artifactDrawer'),
  artifactList: document.getElementById('artifactList'),
  artifactTabs: document.getElementById('artifactTabs'),
  artifactContent: document.getElementById('artifactContent'),
  drawerTitle: document.getElementById('drawerTitle'),
  drawerSub: document.getElementById('drawerSub'),
  closeDrawerBtn: document.getElementById('closeDrawerBtn'),
  drawerFab: document.getElementById('drawerFab'),

  copyJsonBtn: document.getElementById('copyJsonBtn'),
  exportAnkiBtn: document.getElementById('exportAnkiBtn'),
  exportPdfBtn: document.getElementById('exportPdfBtn'),
  exportWordBtn: document.getElementById('exportWordBtn'),

  accessDialog: document.getElementById('accessDialog'),
  accessLinks: document.getElementById('accessLinks'),
  accessQr: document.getElementById('accessQr'),
  closeAccessBtn: document.getElementById('closeAccessBtn'),

  settingsPanel: document.getElementById('settingsPanel'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  tokenInput: document.getElementById('tokenInput'),
  saveTokenBtn: document.getElementById('saveTokenBtn'),
  uiLangSelect: document.getElementById('uiLangSelect'),
  globalDefenseToggle: document.getElementById('globalDefenseToggle'),
  translateFromSelect: document.getElementById('translateFromSelect'),
  translateToSelect: document.getElementById('translateToSelect'),
  fontSizeSelect: document.getElementById('fontSizeSelect'),
  themeSelect: document.getElementById('themeSelect'),
  proxyEnableToggle: document.getElementById('proxyEnableToggle'),
  proxyFields: document.getElementById('proxyFields'),
  proxyTypeSelect: document.getElementById('proxyTypeSelect'),
  proxyHostInput: document.getElementById('proxyHostInput'),
  proxyPortInput: document.getElementById('proxyPortInput'),
  proxyUserInput: document.getElementById('proxyUserInput'),
  proxyPassInput: document.getElementById('proxyPassInput'),
  chatContextLimitRange: document.getElementById('chatContextLimitRange'),
  chatContextLimitLabel: document.getElementById('chatContextLimitLabel'),
  chatContextUnlimitedToggle: document.getElementById('chatContextUnlimitedToggle'),
  chatTemperatureRange: document.getElementById('chatTemperatureRange'),
  chatTemperatureLabel: document.getElementById('chatTemperatureLabel'),
  chatTemperatureUseDefault: document.getElementById('chatTemperatureUseDefault'),
  chatTopPRange: document.getElementById('chatTopPRange'),
  chatTopPLabel: document.getElementById('chatTopPLabel'),
  chatTopPUseDefault: document.getElementById('chatTopPUseDefault'),
  chatStreamOutputToggle: document.getElementById('chatStreamOutputToggle'),
  chatShowTimestampToggle: document.getElementById('chatShowTimestampToggle'),
  chatShowModelToggle: document.getElementById('chatShowModelToggle'),
  chatShowCharCountToggle: document.getElementById('chatShowCharCountToggle'),
  chatMarkdownToggle: document.getElementById('chatMarkdownToggle'),
  chatLatexToggle: document.getElementById('chatLatexToggle'),
  chatSpellcheckToggle: document.getElementById('chatSpellcheckToggle'),
  chatAutoTitleToggle: document.getElementById('chatAutoTitleToggle'),
  chatAutoPreviewArtifactToggle: document.getElementById('chatAutoPreviewArtifactToggle'),
  userAvatarInput: document.getElementById('userAvatarInput'),
  aiAvatarInput: document.getElementById('aiAvatarInput'),
  saveAvatarBtn: document.getElementById('saveAvatarBtn'),
  resetAvatarBtn: document.getElementById('resetAvatarBtn'),
  userAvatarPreview: document.getElementById('userAvatarPreview'),
  aiAvatarPreview: document.getElementById('aiAvatarPreview'),
  userAvatarUploadBtn: document.getElementById('userAvatarUploadBtn'),
  userAvatarFile: document.getElementById('userAvatarFile'),
  aiAvatarUploadBtn: document.getElementById('aiAvatarUploadBtn'),
  aiAvatarFile: document.getElementById('aiAvatarFile'),
  clearChatBtn: document.getElementById('clearChatBtn'),
  openExportBtn: document.getElementById('openExportBtn'),

  providerType: document.getElementById('providerType'),
  openaiFields: document.getElementById('openaiFields'),
  providerBaseUrl: document.getElementById('providerBaseUrl'),
  providerApiKey: document.getElementById('providerApiKey'),
  providerModelList: document.getElementById('providerModelList'),
  providerModelManual: document.getElementById('providerModelManual'),
  addModelManualBtn: document.getElementById('addModelManualBtn'),
  fetchModelsBtn: document.getElementById('fetchModelsBtn'),
  fetchModelsStatus: document.getElementById('fetchModelsStatus'),
  providerTemp: document.getElementById('providerTemp'),
  providerMaxTokens: document.getElementById('providerMaxTokens'),
  providerTestAllBtn: document.getElementById('providerTestAllBtn'),
  providerSaveBtn: document.getElementById('providerSaveBtn'),
  providerStatus: document.getElementById('providerStatus'),
  providerTestResult: document.getElementById('providerTestResult'),
  providerListWrap: document.getElementById('providerListWrap'),
  presetProviderList: document.getElementById('presetProviderList'),
  providerEditId: document.getElementById('providerEditId'),
  providerName: document.getElementById('providerName'),
  providerFormTitle: document.getElementById('providerFormTitle'),
  providerCancelBtn: document.getElementById('providerCancelBtn'),

  toggleAvatarBtn: document.getElementById('toggleAvatarBtn'),
  toggleSearchBtn: document.getElementById('toggleSearchBtn'),
  avatarSelectPanel: document.getElementById('avatarSelectPanel'),
  avatarListWrap: document.getElementById('avatarListWrap'),
  avatarFormTitle: document.getElementById('avatarFormTitle'),
  avatarEditId: document.getElementById('avatarEditId'),
  avatarNameInput: document.getElementById('avatarNameInput'),
  avatarRelInput: document.getElementById('avatarRelInput'),
  avatarPromptInput: document.getElementById('avatarPromptInput'),
  avatarMemoryInput: document.getElementById('avatarMemoryInput'),
  avatarSaveBtn: document.getElementById('avatarSaveBtn'),
  avatarCancelBtn: document.getElementById('avatarCancelBtn'),
  avatarStatus: document.getElementById('avatarStatus'),
  avatarEmojiInput: document.getElementById('avatarEmojiInput'),
  avatarIconPreview: document.getElementById('avatarIconPreview'),
  avatarIconUploadBtn: document.getElementById('avatarIconUploadBtn'),
  avatarIconFile: document.getElementById('avatarIconFile'),
  avatarMemoryImportBtn: document.getElementById('avatarMemoryImportBtn'),
  avatarMemoryFile: document.getElementById('avatarMemoryFile'),
  avatarMemoryFileStatus: document.getElementById('avatarMemoryFileStatus'),
  tavernImportBtn: document.getElementById('tavernImportBtn'),
  tavernImportFile: document.getElementById('tavernImportFile'),
  tavernImportStatus: document.getElementById('tavernImportStatus'),

  tabSessions: document.getElementById('tabSessions'),
  tabContacts: document.getElementById('tabContacts'),
  sessionsPane: document.getElementById('sessionsPane'),
  contactsPane: document.getElementById('contactsPane'),
  contactList: document.getElementById('contactList'),
  importTavernContactBtn: document.getElementById('importTavernContactBtn'),
  contactTavernFile: document.getElementById('contactTavernFile'),
  newGroupBtn: document.getElementById('newGroupBtn'),
  groupDialog: document.getElementById('groupDialog'),
  groupNameInput: document.getElementById('groupNameInput'),
  groupMemberList: document.getElementById('groupMemberList'),
  groupSaveBtn: document.getElementById('groupSaveBtn'),
  groupCancelBtn: document.getElementById('groupCancelBtn'),

  mcpServerListWrap: document.getElementById('mcpServerListWrap'),
  presetMcpList: document.getElementById('presetMcpList'),
  mcpFormTitle: document.getElementById('mcpFormTitle'),
  mcpEditId: document.getElementById('mcpEditId'),
  mcpName: document.getElementById('mcpName'),
  mcpCommand: document.getElementById('mcpCommand'),
  mcpArgs: document.getElementById('mcpArgs'),
  mcpEnv: document.getElementById('mcpEnv'),
  mcpTestBtn: document.getElementById('mcpTestBtn'),
  mcpSaveBtn: document.getElementById('mcpSaveBtn'),
  mcpCancelBtn: document.getElementById('mcpCancelBtn'),
  mcpStatus: document.getElementById('mcpStatus'),

  toggleMcpBtn: document.getElementById('toggleMcpBtn'),
  mcpQuickPanel: document.getElementById('mcpQuickPanel'),
  mcpQuickList: document.getElementById('mcpQuickList'),
  mcpGoSettingsBtn: document.getElementById('mcpGoSettingsBtn'),

  kbListWrap: document.getElementById('kbListWrap'),
  kbFormTitle: document.getElementById('kbFormTitle'),
  kbEditId: document.getElementById('kbEditId'),
  kbName: document.getElementById('kbName'),
  kbContent: document.getElementById('kbContent'),
  kbUploadBtn: document.getElementById('kbUploadBtn'),
  kbFileInput: document.getElementById('kbFileInput'),
  kbUploadStatus: document.getElementById('kbUploadStatus'),
  kbSaveBtn: document.getElementById('kbSaveBtn'),
  kbCancelBtn: document.getElementById('kbCancelBtn'),
  kbStatus: document.getElementById('kbStatus'),

  toggleKbBtn: document.getElementById('toggleKbBtn'),
  kbQuickPanel: document.getElementById('kbQuickPanel'),
  kbQuickList: document.getElementById('kbQuickList'),
  kbGoSettingsBtn: document.getElementById('kbGoSettingsBtn')
};

function boot() {
  loadSettings();
  loadSessionsState();
  loadAvatars();
  bindEvents();
  applySettings();
  syncSettingsUI();
  registerServiceWorker();
  syncMaterialsFromSession();
  applyToolModeUI();
  renderSessionList();
  renderMessages();
  renderDrawer();
  renderAvatarSelectPanel();
  switchSidebarTab(state.ui.sidebarTab);
  refreshServiceStatus();
}

let systemThemeMedia = null;
let systemThemeListenerBound = false;

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      state.settings = { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
}

function saveSettings() {
  localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(state.settings));
}

function applySettings() {
  applyTheme(state.settings.theme);
  applyFontSize(state.settings.fontSize);
  applyChatUiSettings();
  updateProxyFieldsUI();
}

function applyTheme(theme) {
  const root = document.documentElement;
  const desired = theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system';
  if (!systemThemeMedia) systemThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
  if (desired === 'system') {
    root.dataset.theme = systemThemeMedia.matches ? 'dark' : 'light';
    if (!systemThemeListenerBound) {
      systemThemeMedia.addEventListener('change', (e) => {
        if (state.settings.theme === 'system') {
          root.dataset.theme = e.matches ? 'dark' : 'light';
        }
      });
      systemThemeListenerBound = true;
    }
  } else {
    root.dataset.theme = desired;
  }
}

function applyFontSize(sizeKey) {
  const size = FONT_SIZE_MAP[sizeKey] || FONT_SIZE_MAP.md;
  document.documentElement.style.setProperty('--ui-font-size', size);
}

function syncSettingsUI() {
  if (els.uiLangSelect) els.uiLangSelect.value = state.settings.language || 'zh-CN';
  if (els.globalDefenseToggle) els.globalDefenseToggle.checked = Boolean(state.settings.globalDefense);
  if (els.translateFromSelect) els.translateFromSelect.value = state.settings.translateFrom || 'auto';
  if (els.translateToSelect) els.translateToSelect.value = state.settings.translateTo || 'zh-CN';
  if (els.fontSizeSelect) els.fontSizeSelect.value = state.settings.fontSize || 'md';
  if (els.themeSelect) els.themeSelect.value = state.settings.theme || 'system';
  if (els.proxyEnableToggle) els.proxyEnableToggle.checked = Boolean(state.settings.proxyEnabled);
  if (els.proxyTypeSelect) els.proxyTypeSelect.value = state.settings.proxyType || 'socks5';
  if (els.proxyHostInput) els.proxyHostInput.value = state.settings.proxyHost || '';
  if (els.proxyPortInput) els.proxyPortInput.value = state.settings.proxyPort || '';
  if (els.proxyUserInput) els.proxyUserInput.value = state.settings.proxyUser || '';
  if (els.proxyPassInput) els.proxyPassInput.value = state.settings.proxyPass || '';
  if (els.chatContextLimitRange) els.chatContextLimitRange.value = String(state.settings.chatContextLimit ?? 14);
  if (els.chatContextUnlimitedToggle) els.chatContextUnlimitedToggle.checked = Boolean(state.settings.chatContextUnlimited);
  if (els.chatTemperatureRange) els.chatTemperatureRange.value = String(state.settings.chatTemperature ?? 0.7);
  if (els.chatTemperatureUseDefault) els.chatTemperatureUseDefault.checked = Boolean(state.settings.chatTemperatureUseDefault);
  if (els.chatTopPRange) els.chatTopPRange.value = String(state.settings.chatTopP ?? 0.9);
  if (els.chatTopPUseDefault) els.chatTopPUseDefault.checked = Boolean(state.settings.chatTopPUseDefault);
  if (els.chatStreamOutputToggle) els.chatStreamOutputToggle.checked = Boolean(state.settings.chatStreamOutput);
  if (els.chatShowTimestampToggle) els.chatShowTimestampToggle.checked = Boolean(state.settings.chatShowTimestamp);
  if (els.chatShowModelToggle) els.chatShowModelToggle.checked = Boolean(state.settings.chatShowModel);
  if (els.chatShowCharCountToggle) els.chatShowCharCountToggle.checked = Boolean(state.settings.chatShowCharCount);
  if (els.chatMarkdownToggle) els.chatMarkdownToggle.checked = Boolean(state.settings.chatMarkdownRender);
  if (els.chatLatexToggle) els.chatLatexToggle.checked = Boolean(state.settings.chatLatexRender);
  if (els.chatSpellcheckToggle) els.chatSpellcheckToggle.checked = Boolean(state.settings.chatSpellcheck);
  if (els.chatAutoTitleToggle) els.chatAutoTitleToggle.checked = Boolean(state.settings.chatAutoTitle);
  if (els.chatAutoPreviewArtifactToggle) els.chatAutoPreviewArtifactToggle.checked = Boolean(state.settings.chatAutoPreviewArtifact);
  updateChatSettingsUI();
  updateProxyFieldsUI();
}

function updateProxyFieldsUI() {
  const enabled = Boolean(state.settings.proxyEnabled);
  if (els.proxyFields) els.proxyFields.classList.toggle('hidden', !enabled);
  const inputs = [
    els.proxyTypeSelect,
    els.proxyHostInput,
    els.proxyPortInput,
    els.proxyUserInput,
    els.proxyPassInput
  ];
  inputs.forEach((el) => {
    if (!el) return;
    el.disabled = !enabled;
  });
}

function applyChatUiSettings() {
  if (els.chatInput) {
    els.chatInput.spellcheck = Boolean(state.settings.chatSpellcheck);
  }
  updateChatSettingsUI();
}

function updateChatSettingsUI() {
  updateRangeLabels();
  updateChatControlAvailability();
}

function updateRangeLabels() {
  if (els.chatContextLimitLabel) {
    const unlimited = Boolean(state.settings.chatContextUnlimited);
    const limit = Number(state.settings.chatContextLimit || 14);
    els.chatContextLimitLabel.textContent = unlimited ? 'Unlimited' : `${limit} msgs`;
  }
  if (els.chatTemperatureLabel) {
    els.chatTemperatureLabel.textContent = state.settings.chatTemperatureUseDefault
      ? 'Default'
      : String(Number(state.settings.chatTemperature ?? 0.7).toFixed(2));
  }
  if (els.chatTopPLabel) {
    els.chatTopPLabel.textContent = state.settings.chatTopPUseDefault
      ? 'Default'
      : String(Number(state.settings.chatTopP ?? 0.9).toFixed(2));
  }
}

function updateChatControlAvailability() {
  if (els.chatContextLimitRange) els.chatContextLimitRange.disabled = Boolean(state.settings.chatContextUnlimited);
  if (els.chatTemperatureRange) els.chatTemperatureRange.disabled = Boolean(state.settings.chatTemperatureUseDefault);
  if (els.chatTopPRange) els.chatTopPRange.disabled = Boolean(state.settings.chatTopPUseDefault);
  if (els.chatLatexToggle) {
    const markdownOn = Boolean(state.settings.chatMarkdownRender);
    els.chatLatexToggle.disabled = !markdownOn;
    if (!markdownOn) {
      state.settings.chatLatexRender = false;
      els.chatLatexToggle.checked = false;
    }
  }
}

function getChatModelName() {
  return state.ui.selectedModel || state.info.model || 'qwen3:8b';
}

function getChatSamplingOptions() {
  const out = {};
  if (!state.settings.chatTemperatureUseDefault) {
    const t = Number(state.settings.chatTemperature);
    if (Number.isFinite(t)) out.temperature = t;
  }
  if (!state.settings.chatTopPUseDefault) {
    const p = Number(state.settings.chatTopP);
    if (Number.isFinite(p)) out.topP = p;
  }
  return out;
}

function bindEvents() {
  /* Sidebar tab switching */
  if (els.tabSessions) els.tabSessions.addEventListener('click', () => switchSidebarTab('sessions'));
  if (els.tabContacts) els.tabContacts.addEventListener('click', () => switchSidebarTab('contacts'));

  /* Contact list click */
  if (els.contactList) {
    els.contactList.addEventListener('click', (e) => {
      const item = e.target.closest('[data-action="open-contact"]');
      if (!item) return;
      openContact(item.dataset.avatarId || '');
    });
  }

  /* Tavern import from contacts tab */
  if (els.importTavernContactBtn && els.contactTavernFile) {
    els.importTavernContactBtn.addEventListener('click', () => els.contactTavernFile.click());
    els.contactTavernFile.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        await handleTavernImport(file);
        renderContactList();
      } catch (err) {
        alert(`导入失败：${err.message}`);
      }
      els.contactTavernFile.value = '';
    });
  }

  /* Group creation */
  if (els.newGroupBtn) els.newGroupBtn.addEventListener('click', () => openGroupDialog());
  if (els.groupSaveBtn) els.groupSaveBtn.addEventListener('click', () => saveGroup());
  if (els.groupCancelBtn) els.groupCancelBtn.addEventListener('click', () => els.groupDialog.close());

  els.newSessionBtn.addEventListener('click', () => {
    createSession('新会话');
    clearToolMode();
    renderSessionList();
    syncMaterialsFromSession();
    renderMessages();
    renderDrawer();
  });

  els.sessionSearch.addEventListener('input', () => {
    state.search = String(els.sessionSearch.value || '').trim().toLowerCase();
    renderSessionList();
  });

  els.sessionList.addEventListener('click', (event) => {
    const favBtn = event.target.closest('[data-action="toggle-fav"]');
    if (favBtn) {
      const sid = favBtn.dataset.sid || '';
      toggleFavorite(sid);
      renderSessionList();
      return;
    }

    const item = event.target.closest('[data-action="switch-session"]');
    if (!item) return;
    const sid = item.dataset.sid || '';
    if (!sid) return;
    switchSession(sid);
  });

  els.settingsBtn.addEventListener('click', () => openSettingsPanel());
  els.closeSettingsBtn.addEventListener('click', () => closeSettingsPanel());

  els.settingsPanel.querySelector('.settings-nav').addEventListener('click', (e) => {
    const navItem = e.target.closest('.settings-nav-item');
    if (!navItem || !navItem.dataset.section) return;
    const section = navItem.dataset.section;
    els.settingsPanel.querySelectorAll('.settings-nav-item').forEach((b) => b.classList.remove('active'));
    navItem.classList.add('active');
    els.settingsPanel.querySelectorAll('.settings-section').forEach((s) => {
      s.classList.toggle('hidden', s.dataset.section !== section);
    });
  });

  els.saveTokenBtn.addEventListener('click', () => {
    state.token = String(els.tokenInput.value || '').trim();
    if (state.token) localStorage.setItem(STORAGE_TOKEN_KEY, state.token);
    else localStorage.removeItem(STORAGE_TOKEN_KEY);
    setStatus(state.token ? 'Token saved.' : 'Token cleared.');
  });

  if (els.uiLangSelect) {
    els.uiLangSelect.addEventListener('change', () => {
      state.settings.language = els.uiLangSelect.value || 'zh-CN';
      saveSettings();
    });
  }
  if (els.globalDefenseToggle) {
    els.globalDefenseToggle.addEventListener('change', () => {
      state.settings.globalDefense = Boolean(els.globalDefenseToggle.checked);
      saveSettings();
    });
  }
  if (els.translateFromSelect) {
    els.translateFromSelect.addEventListener('change', () => {
      state.settings.translateFrom = els.translateFromSelect.value || 'auto';
      saveSettings();
    });
  }
  if (els.translateToSelect) {
    els.translateToSelect.addEventListener('change', () => {
      state.settings.translateTo = els.translateToSelect.value || 'zh-CN';
      saveSettings();
    });
  }
  if (els.fontSizeSelect) {
    els.fontSizeSelect.addEventListener('change', () => {
      state.settings.fontSize = els.fontSizeSelect.value || 'md';
      saveSettings();
      applyFontSize(state.settings.fontSize);
    });
  }
  if (els.themeSelect) {
    els.themeSelect.addEventListener('change', () => {
      state.settings.theme = els.themeSelect.value || 'system';
      saveSettings();
      applyTheme(state.settings.theme);
    });
  }
  if (els.proxyEnableToggle) {
    els.proxyEnableToggle.addEventListener('change', () => {
      state.settings.proxyEnabled = Boolean(els.proxyEnableToggle.checked);
      saveSettings();
      updateProxyFieldsUI();
    });
  }
  if (els.proxyTypeSelect) {
    els.proxyTypeSelect.addEventListener('change', () => {
      state.settings.proxyType = els.proxyTypeSelect.value || 'socks5';
      saveSettings();
    });
  }
  if (els.proxyHostInput) {
    els.proxyHostInput.addEventListener('input', () => {
      state.settings.proxyHost = String(els.proxyHostInput.value || '').trim();
      saveSettings();
    });
  }
  if (els.proxyPortInput) {
    els.proxyPortInput.addEventListener('input', () => {
      state.settings.proxyPort = String(els.proxyPortInput.value || '').trim();
      saveSettings();
    });
  }
  if (els.proxyUserInput) {
    els.proxyUserInput.addEventListener('input', () => {
      state.settings.proxyUser = String(els.proxyUserInput.value || '').trim();
      saveSettings();
    });
  }
  if (els.proxyPassInput) {
    els.proxyPassInput.addEventListener('input', () => {
      state.settings.proxyPass = String(els.proxyPassInput.value || '').trim();
      saveSettings();
    });
  }
  if (els.chatContextLimitRange) {
    els.chatContextLimitRange.addEventListener('input', () => {
      const val = Math.max(4, Math.min(40, Number(els.chatContextLimitRange.value || 14)));
      state.settings.chatContextLimit = val;
      saveSettings();
      updateChatSettingsUI();
    });
  }
  if (els.chatContextUnlimitedToggle) {
    els.chatContextUnlimitedToggle.addEventListener('change', () => {
      state.settings.chatContextUnlimited = Boolean(els.chatContextUnlimitedToggle.checked);
      saveSettings();
      updateChatSettingsUI();
    });
  }
  if (els.chatTemperatureRange) {
    els.chatTemperatureRange.addEventListener('input', () => {
      state.settings.chatTemperature = Number(els.chatTemperatureRange.value || 0.7);
      saveSettings();
      updateChatSettingsUI();
    });
  }
  if (els.chatTemperatureUseDefault) {
    els.chatTemperatureUseDefault.addEventListener('change', () => {
      state.settings.chatTemperatureUseDefault = Boolean(els.chatTemperatureUseDefault.checked);
      saveSettings();
      updateChatSettingsUI();
    });
  }
  if (els.chatTopPRange) {
    els.chatTopPRange.addEventListener('input', () => {
      state.settings.chatTopP = Number(els.chatTopPRange.value || 0.9);
      saveSettings();
      updateChatSettingsUI();
    });
  }
  if (els.chatTopPUseDefault) {
    els.chatTopPUseDefault.addEventListener('change', () => {
      state.settings.chatTopPUseDefault = Boolean(els.chatTopPUseDefault.checked);
      saveSettings();
      updateChatSettingsUI();
    });
  }
  if (els.chatStreamOutputToggle) {
    els.chatStreamOutputToggle.addEventListener('change', () => {
      state.settings.chatStreamOutput = Boolean(els.chatStreamOutputToggle.checked);
      saveSettings();
    });
  }
  if (els.chatShowTimestampToggle) {
    els.chatShowTimestampToggle.addEventListener('change', () => {
      state.settings.chatShowTimestamp = Boolean(els.chatShowTimestampToggle.checked);
      saveSettings();
      renderMessages();
    });
  }
  if (els.chatShowModelToggle) {
    els.chatShowModelToggle.addEventListener('change', () => {
      state.settings.chatShowModel = Boolean(els.chatShowModelToggle.checked);
      saveSettings();
      renderMessages();
    });
  }
  if (els.chatShowCharCountToggle) {
    els.chatShowCharCountToggle.addEventListener('change', () => {
      state.settings.chatShowCharCount = Boolean(els.chatShowCharCountToggle.checked);
      saveSettings();
      renderMessages();
    });
  }
  if (els.chatMarkdownToggle) {
    els.chatMarkdownToggle.addEventListener('change', () => {
      state.settings.chatMarkdownRender = Boolean(els.chatMarkdownToggle.checked);
      if (!state.settings.chatMarkdownRender) state.settings.chatLatexRender = false;
      saveSettings();
      updateChatSettingsUI();
      renderMessages();
    });
  }
  if (els.chatLatexToggle) {
    els.chatLatexToggle.addEventListener('change', () => {
      state.settings.chatLatexRender = Boolean(els.chatLatexToggle.checked) && Boolean(state.settings.chatMarkdownRender);
      saveSettings();
      updateChatSettingsUI();
      renderMessages();
    });
  }
  if (els.chatSpellcheckToggle) {
    els.chatSpellcheckToggle.addEventListener('change', () => {
      state.settings.chatSpellcheck = Boolean(els.chatSpellcheckToggle.checked);
      saveSettings();
      applyChatUiSettings();
    });
  }
  if (els.chatAutoTitleToggle) {
    els.chatAutoTitleToggle.addEventListener('change', () => {
      state.settings.chatAutoTitle = Boolean(els.chatAutoTitleToggle.checked);
      saveSettings();
    });
  }
  if (els.chatAutoPreviewArtifactToggle) {
    els.chatAutoPreviewArtifactToggle.addEventListener('change', () => {
      state.settings.chatAutoPreviewArtifact = Boolean(els.chatAutoPreviewArtifactToggle.checked);
      saveSettings();
    });
  }

  els.saveAvatarBtn.addEventListener('click', () => {
    const userVal = String(els.userAvatarInput.value || '').trim();
    const aiVal = String(els.aiAvatarInput.value || '').trim();
    if (userVal) {
      state.ui.userAvatar = userVal;
      localStorage.setItem('chatbox_user_avatar', userVal);
    }
    if (aiVal) {
      state.ui.aiAvatar = aiVal;
      localStorage.setItem('chatbox_ai_avatar', aiVal);
    }
    renderMessages();
    refreshAvatarPreviews();
    setStatus('头像已更新。');
  });

  els.resetAvatarBtn.addEventListener('click', () => {
    state.ui.userAvatar = '👤';
    state.ui.aiAvatar = '🤖';
    localStorage.removeItem('chatbox_user_avatar');
    localStorage.removeItem('chatbox_ai_avatar');
    els.userAvatarInput.value = '';
    els.aiAvatarInput.value = '';
    renderMessages();
    refreshAvatarPreviews();
    setStatus('头像已恢复默认。');
  });

  els.userAvatarUploadBtn.addEventListener('click', () => els.userAvatarFile.click());
  els.userAvatarFile.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) resizeAndStoreAvatar(file, 'user');
    els.userAvatarFile.value = '';
  });

  els.aiAvatarUploadBtn.addEventListener('click', () => els.aiAvatarFile.click());
  els.aiAvatarFile.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) resizeAndStoreAvatar(file, 'ai');
    els.aiAvatarFile.value = '';
  });

  els.chatUploadBtn.addEventListener('click', () => els.chatFileInput.click());
  els.chatFileInput.addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) handleFileUpload(file);
    els.chatFileInput.value = '';
  });

  els.showAccessBtn.addEventListener('click', openAccessDialog);
  els.closeAccessBtn.addEventListener('click', () => {
    if (els.accessDialog.open) els.accessDialog.close();
  });

  els.sendBtn.addEventListener('click', sendChatMessage);
  els.chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      sendChatMessage();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && (event.key === 'k' || event.key === 'K')) {
      event.preventDefault();
      els.studyPanel.classList.toggle('hidden');
      if (!els.studyPanel.classList.contains('hidden') && els.avatarSelectPanel) els.avatarSelectPanel.classList.add('hidden');
    }
  });

  els.toggleStudyBtn.addEventListener('click', () => {
    if (state.ui.activeTool) {
      clearToolMode();
      els.studyPanel.classList.add('hidden');
      return;
    }
    els.studyPanel.classList.toggle('hidden');
    if (!els.studyPanel.classList.contains('hidden') && els.avatarSelectPanel) els.avatarSelectPanel.classList.add('hidden');
  });

  els.studyPanel.addEventListener('click', (event) => {
    const skillTarget = event.target.closest('[data-prompt]');
    if (skillTarget) {
      els.chatInput.value = String(skillTarget.dataset.prompt || '');
      els.chatInput.focus();
      els.studyPanel.classList.add('hidden');
      return;
    }
    const toolTarget = event.target.closest('[data-tool]');
    if (toolTarget) {
      const tool = toolTarget.dataset.tool || '';
      els.studyPanel.classList.add('hidden');
      handleToolButtonClick(tool);
    }
  });

  /* ── Avatar 选择器事件 ── */
  if (els.toggleAvatarBtn) {
    els.toggleAvatarBtn.addEventListener('click', () => {
      renderAvatarSelectPanel();
      els.avatarSelectPanel.classList.toggle('hidden');
      if (!els.avatarSelectPanel.classList.contains('hidden')) { els.studyPanel.classList.add('hidden'); }
    });
  }
  if (els.avatarSelectPanel) {
    els.avatarSelectPanel.addEventListener('click', (event) => {
      const target = event.target.closest('[data-action="select-avatar"]');
      if (!target) return;
      applyAvatarSelection(target.dataset.avatarId || '');
      els.avatarSelectPanel.classList.add('hidden');
    });
  }

  /* ── 点击空白处关闭所有弹出面板 ── */
  document.addEventListener('click', (e) => {
    const popups = [
      { panel: els.studyPanel, trigger: els.toggleStudyBtn },
      { panel: els.avatarSelectPanel, trigger: els.toggleAvatarBtn },
      { panel: els.mcpQuickPanel, trigger: els.toggleMcpBtn },
      { panel: els.kbQuickPanel, trigger: els.toggleKbBtn }
    ];
    for (const { panel, trigger } of popups) {
      if (!panel || panel.classList.contains('hidden')) continue;
      if (panel.contains(e.target) || (trigger && trigger.contains(e.target))) continue;
      panel.classList.add('hidden');
    }
  });

  /* ── 联网搜索开关 ── */
  if (els.toggleSearchBtn) {
    els.toggleSearchBtn.addEventListener('click', () => {
      state.ui.webSearchEnabled = !state.ui.webSearchEnabled;
      els.toggleSearchBtn.classList.toggle('active-tool', state.ui.webSearchEnabled);
    });
  }

  /* ── MCP 快捷面板 ── */
  if (els.toggleMcpBtn) {
    els.toggleMcpBtn.addEventListener('click', () => {
      refreshMcpQuickPanel();
      els.mcpQuickPanel.classList.toggle('hidden');
    });
  }
  if (els.mcpGoSettingsBtn) {
    els.mcpGoSettingsBtn.addEventListener('click', () => {
      els.mcpQuickPanel.classList.add('hidden');
      openSettingsPanel();
      // Switch to MCP tab
      els.settingsPanel.querySelectorAll('.settings-nav-item').forEach(b => b.classList.remove('active'));
      const mcpNav = els.settingsPanel.querySelector('.settings-nav-item[data-section="mcp"]');
      if (mcpNav) mcpNav.classList.add('active');
      els.settingsPanel.querySelectorAll('.settings-section').forEach(s => {
        s.classList.toggle('hidden', s.dataset.section !== 'mcp');
      });
    });
  }

  /* ── 知识库快捷面板 ── */
  if (els.toggleKbBtn) {
    els.toggleKbBtn.addEventListener('click', () => {
      refreshKbQuickPanel();
      els.kbQuickPanel.classList.toggle('hidden');
    });
  }
  if (els.kbGoSettingsBtn) {
    els.kbGoSettingsBtn.addEventListener('click', () => {
      els.kbQuickPanel.classList.add('hidden');
      openSettingsPanel();
      els.settingsPanel.querySelectorAll('.settings-nav-item').forEach(b => b.classList.remove('active'));
      const kbNav = els.settingsPanel.querySelector('.settings-nav-item[data-section="knowledge"]');
      if (kbNav) kbNav.classList.add('active');
      els.settingsPanel.querySelectorAll('.settings-section').forEach(s => {
        s.classList.toggle('hidden', s.dataset.section !== 'knowledge');
      });
    });
  }

  /* ── 知识库设置面板事件 ── */
  if (els.kbSaveBtn) els.kbSaveBtn.addEventListener('click', () => saveKb());
  if (els.kbCancelBtn) els.kbCancelBtn.addEventListener('click', () => resetKbForm());
  if (els.kbUploadBtn) els.kbUploadBtn.addEventListener('click', () => els.kbFileInput.click());
  if (els.kbFileInput) {
    els.kbFileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) await uploadKbFile(file);
      els.kbFileInput.value = '';
    });
  }

  /* ── Avatar 设置面板事件 ── */
  if (els.avatarSaveBtn) {
    els.avatarSaveBtn.addEventListener('click', () => {
      const name = String(els.avatarNameInput.value || '').trim();
      if (!name) { if (els.avatarStatus) els.avatarStatus.textContent = '请输入角色名称'; return; }
      const iconFromPreview = els.avatarIconPreview ? (els.avatarIconPreview.dataset.value || '😀') : '😀';
      const data = {
        name,
        icon: iconFromPreview,
        relationship: String(els.avatarRelInput?.value || '').trim(),
        customPrompt: String(els.avatarPromptInput.value || '').trim(),
        memoryText: String(els.avatarMemoryInput.value || '').trim()
      };
      const editId = els.avatarEditId.value;
      if (editId) { updateAvatar(editId, data); } else { createAvatar(data); }
      resetAvatarForm();
      renderAvatarList();
      renderAvatarSelectPanel();
      if (els.avatarStatus) els.avatarStatus.textContent = editId ? 'Role updated' : 'Role created';
    });
  }
  if (els.avatarCancelBtn) {
    els.avatarCancelBtn.addEventListener('click', () => resetAvatarForm());
  }
  if (els.avatarEmojiInput) {
    els.avatarEmojiInput.addEventListener('input', () => {
      const val = String(els.avatarEmojiInput.value || '').trim();
      if (val) {
        els.avatarIconPreview.innerHTML = val;
        els.avatarIconPreview.dataset.value = val;
      }
    });
  }
  if (els.avatarIconUploadBtn && els.avatarIconFile) {
    els.avatarIconUploadBtn.addEventListener('click', () => els.avatarIconFile.click());
    els.avatarIconFile.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 64; canvas.height = 64;
          const ctx = canvas.getContext('2d');
          const size = Math.min(img.width, img.height);
          ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 64, 64);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          els.avatarIconPreview.innerHTML = `<img src="${dataUrl}" alt="avatar">`;
          els.avatarIconPreview.dataset.value = dataUrl;
          els.avatarEmojiInput.value = '';
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
      els.avatarIconFile.value = '';
    });
  }
  if (els.avatarMemoryImportBtn && els.avatarMemoryFile) {
    els.avatarMemoryImportBtn.addEventListener('click', () => els.avatarMemoryFile.click());
    els.avatarMemoryFile.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const ext = file.name.split('.').pop().toLowerCase();
        let text = '';
        if (ext === 'json') {
          const raw = await file.text();
          const parsed = JSON.parse(raw);
          if (typeof parsed === 'string') text = parsed;
          else if (Array.isArray(parsed)) text = parsed.map((m) => `${m.role || m.from || ''}：${m.content || m.text || ''}`).join('\n');
          else text = raw;
        } else {
          text = await file.text();
        }
        els.avatarMemoryInput.value = text;
        if (els.avatarMemoryFileStatus) els.avatarMemoryFileStatus.textContent = `已导入：${file.name}`;
      } catch (err) {
        if (els.avatarMemoryFileStatus) els.avatarMemoryFileStatus.textContent = `导入失败：${err.message}`;
      }
      els.avatarMemoryFile.value = '';
    });
  }
  if (els.tavernImportBtn && els.tavernImportFile) {
    els.tavernImportBtn.addEventListener('click', () => els.tavernImportFile.click());
    els.tavernImportFile.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        if (els.tavernImportStatus) els.tavernImportStatus.textContent = '姝ｅ湪??...';
        const name = await handleTavernImport(file);
        if (els.tavernImportStatus) els.tavernImportStatus.textContent = `Imported role: ${name}`;
      } catch (err) {
        if (els.tavernImportStatus) els.tavernImportStatus.textContent = `Import failed: ${err.message}`;
      }
      els.tavernImportFile.value = '';
    });
  }
  if (els.avatarListWrap) {
    els.avatarListWrap.addEventListener('click', (event) => {
      const editBtn = event.target.closest('[data-action="edit-avatar"]');
      if (editBtn) {
        const avatar = getAvatarById(editBtn.dataset.avatarId || '');
        if (avatar) fillAvatarForm(avatar);
        return;
      }
      const delBtn = event.target.closest('[data-action="delete-avatar"]');
      if (delBtn) {
        const id = delBtn.dataset.avatarId || '';
        const avatar = getAvatarById(id);
        if (avatar && confirm(`确定删除角色「${avatar.name}」？`)) {
          deleteAvatar(id);
          renderAvatarList();
          renderAvatarSelectPanel();
          renderSessionList();
        }
      }
    });
  }

  els.modelSelect.addEventListener('change', () => {
    parseModelSelectValue(els.modelSelect.value);
  });

  els.providerType.addEventListener('change', () => {
    const needsApi = els.providerType.value === 'openai_compatible' || els.providerType.value === 'anthropic';
    els.openaiFields.classList.toggle('hidden', !needsApi);
  });
  els.providerTestAllBtn.addEventListener('click', runAllProviderTests);
  els.providerSaveBtn.addEventListener('click', saveProvider);
  els.providerCancelBtn.addEventListener('click', resetProviderForm);
  els.fetchModelsBtn.addEventListener('click', fetchProviderModels);
  els.addModelManualBtn.addEventListener('click', addModelManual);

  if (els.presetProviderList) {
    els.presetProviderList.addEventListener('click', (e) => {
      const card = e.target.closest('.preset-card');
      if (!card || card.classList.contains('added')) return;
      fillFormFromPreset(card.dataset.presetKey);
    });
  }

  /* MCP settings bindings */
  if (els.mcpSaveBtn) els.mcpSaveBtn.addEventListener('click', () => saveMcpServer());
  if (els.mcpTestBtn) els.mcpTestBtn.addEventListener('click', () => testMcpServer());
  if (els.mcpCancelBtn) els.mcpCancelBtn.addEventListener('click', () => resetMcpForm());
  if (els.presetMcpList) {
    els.presetMcpList.addEventListener('click', (e) => {
      const card = e.target.closest('.preset-card');
      if (!card || card.classList.contains('added')) return;
      fillMcpFromPreset(card.dataset.presetKey);
    });
  }

  els.openExportBtn.addEventListener('click', () => openDrawer());

  els.clearChatBtn.addEventListener('click', () => {
    const session = getActiveSession();
    if (!session) return;
    const ok = window.confirm('确认清空当前会话的聊天和产物吗？');
    if (!ok) return;
    session.messages = [];
    session.artifacts = [];
    state.ui.activeArtifactId = '';
    touchSession(session);
    persistSessionsState();
    renderSessionList();
    renderMessages();
    renderDrawer();
    setStatus('已清空当前会话。');
  });

  els.messageList.addEventListener('click', (event) => {
    const toggleBtn = event.target.closest('[data-action="toggle-inline-artifact"]');
    if (toggleBtn) {
      const artifactId = toggleBtn.dataset.artifactId || '';
      if (!state.ui.expandedArtifacts[artifactId]) {
        state.ui.expandedArtifacts[artifactId] = true;
      } else {
        delete state.ui.expandedArtifacts[artifactId];
      }
      renderMessages();
      return;
    }

    const tabBtn = event.target.closest('[data-action="switch-inline-tab"]');
    if (tabBtn) {
      const artifactId = tabBtn.dataset.artifactId || '';
      const tab = tabBtn.dataset.tab || 'overview';
      if (!state.ui.inlineArtifactTabs) state.ui.inlineArtifactTabs = {};
      state.ui.inlineArtifactTabs[artifactId] = tab;
      renderMessages();
      return;
    }

    const retryBtn = event.target.closest('[data-action="retry-tool"]');
    if (retryBtn) {
      const tool = retryBtn.dataset.tool || '';
      runTool(tool);
    }
  });

  els.closeDrawerBtn.addEventListener('click', closeDrawer);
  if (els.drawerFab) els.drawerFab.addEventListener('click', () => openDrawer());

  els.artifactList.addEventListener('click', (event) => {
    const item = event.target.closest('[data-action="select-artifact"]');
    if (!item) return;
    state.ui.activeArtifactId = item.dataset.artifactId || '';
    state.ui.activeArtifactTab = 'overview';
    renderDrawer();
  });

  els.artifactTabs.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-action="switch-artifact-tab"]');
    if (!tab) return;
    state.ui.activeArtifactTab = tab.dataset.tab || 'overview';
    renderDrawerContent();
    renderArtifactTabs();
  });

  els.copyJsonBtn.addEventListener('click', copyActiveArtifactJson);
  els.exportAnkiBtn.addEventListener('click', exportActiveAnkiCsv);
  els.exportPdfBtn.addEventListener('click', exportActivePdf);
  els.exportWordBtn.addEventListener('click', exportActiveWord);
}

function handleToolButtonClick(tool) {
  if (!['review_pack', 'paper_report'].includes(tool)) return;
  if (state.ui.toolRunning) return;

  state.ui.activeTool = tool;
  applyToolModeUI();

  const session = getActiveSession();
  const sourceText = String((session && session.materialsText) || '').trim();
  const cnCount = countChineseChars(sourceText);
  if (cnCount >= MIN_CN_CHARS) {
    runTool(tool);
  } else {
    setStatus(`Selected ${toolName(tool)}. Paste/upload materials first (at least ${MIN_CN_CHARS} Chinese chars), then click again to run.`);
  }
}

function applyToolModeUI() {
  const activeTool = state.ui.activeTool;
  document.querySelectorAll('[data-tool]').forEach((button) => {
    button.classList.toggle('primary', button.dataset.tool === activeTool);
  });
  if (activeTool) {
    els.toggleStudyBtn.textContent = `📘 ${toolName(activeTool)}`;
    els.toggleStudyBtn.classList.add('active-tool');
  } else {
    els.toggleStudyBtn.textContent = '📘 学习模式';
    els.toggleStudyBtn.classList.remove('active-tool');
  }
}

function clearToolMode() {
  state.ui.activeTool = '';
  applyToolModeUI();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

function loadSessionsState() {
  try {
    const raw = localStorage.getItem(STORAGE_SESSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        state.sessions = parsed.filter(isValidSession);
      }
    }
  } catch (_) {
    state.sessions = [];
  }

  if (!state.sessions.length) {
    state.sessions = [createSessionObject('会话 1')];
  }

  const activeId = localStorage.getItem(STORAGE_ACTIVE_KEY);
  if (activeId && state.sessions.some((s) => s.id === activeId)) {
    state.activeSessionId = activeId;
  } else {
    state.activeSessionId = state.sessions[0].id;
  }
}

function persistSessionsState() {
  state.sessions = sortSessions(state.sessions).slice(0, MAX_SESSIONS);
  localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(state.sessions));
  localStorage.setItem(STORAGE_ACTIVE_KEY, state.activeSessionId);
}

function isValidSession(item) {
  return item
    && typeof item.id === 'string'
    && typeof item.title === 'string'
    && Array.isArray(item.messages)
    && Array.isArray(item.artifacts)
    && typeof item.materialsText === 'string';
}

function createSessionObject(title) {
  const now = Date.now();
  return {
    id: `s_${now}_${Math.random().toString(36).slice(2, 8)}`,
    title: title || '新会话',
    favorite: false,
    createdAt: now,
    updatedAt: now,
    materialsText: '',
    messages: [],
    artifacts: [],
    avatarId: null
  };
}

function createSession(title) {
  const session = createSessionObject(title);
  state.sessions.unshift(session);
  state.activeSessionId = session.id;
  persistSessionsState();
}

function getActiveSession() {
  return state.sessions.find((s) => s.id === state.activeSessionId) || null;
}

function switchSession(sessionId) {
  if (!state.sessions.some((s) => s.id === sessionId)) return;
  state.activeSessionId = sessionId;
  state.ui.activeTool = '';
  persistSessionsState();
  syncMaterialsFromSession();
  applyToolModeUI();
  renderSessionList();
  renderMessages();
  renderDrawer();
  renderAvatarSelectPanel();
}

function toggleFavorite(sessionId) {
  const session = state.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  session.favorite = !session.favorite;
  touchSession(session);
  persistSessionsState();
}

function touchSession(session) {
  session.updatedAt = Date.now();
}

function sortSessions(list) {
  return list.slice().sort((a, b) => {
    const af = a.favorite ? 1 : 0;
    const bf = b.favorite ? 1 : 0;
    if (af !== bf) return bf - af;
    return Number(b.updatedAt || 0) - Number(a.updatedAt || 0);
  });
}

/* ── Avatar (角色) CRUD ── */

function loadAvatars() {
  try {
    const raw = localStorage.getItem(STORAGE_AVATARS_KEY);
    if (!raw) { state.avatars = []; return; }
    const parsed = JSON.parse(raw);
    state.avatars = Array.isArray(parsed) ? parsed.filter(isValidAvatar) : [];
  } catch (_) { state.avatars = []; }
}

function isValidAvatar(a) {
  return a && typeof a.id === 'string' && typeof a.name === 'string';
}

function persistAvatars() {
  localStorage.setItem(STORAGE_AVATARS_KEY, JSON.stringify(state.avatars));
}

function getAvatarById(id) {
  return state.avatars.find((a) => a.id === id) || null;
}

function createAvatar(data) {
  const now = Date.now();
  const avatar = {
    id: `av_${now}_${Math.random().toString(36).slice(2, 8)}`,
    name: data.name,
    icon: data.icon || '😀',
    relationship: data.relationship || '',
    promptMode: derivePromptMode(data.customPrompt, data.memoryText),
    customPrompt: data.customPrompt || '',
    memoryText: data.memoryText || '',
    createdAt: now
  };
  state.avatars.unshift(avatar);
  persistAvatars();
  return avatar;
}

function updateAvatar(id, data) {
  const avatar = getAvatarById(id);
  if (!avatar) return;
  avatar.name = data.name;
  avatar.icon = data.icon || avatar.icon || '😀';
  avatar.relationship = data.relationship || '';
  avatar.customPrompt = data.customPrompt || '';
  avatar.memoryText = data.memoryText || '';
  avatar.promptMode = derivePromptMode(avatar.customPrompt, avatar.memoryText);
  persistAvatars();
}

function deleteAvatar(id) {
  state.avatars = state.avatars.filter((a) => a.id !== id);
  state.sessions.forEach((s) => { if (s.avatarId === id) s.avatarId = null; });
  persistAvatars();
  persistSessionsState();
}

function derivePromptMode(customPrompt, memoryText) {
  const hasPrompt = Boolean(customPrompt && customPrompt.trim());
  const hasMemory = Boolean(memoryText && memoryText.trim());
  if (hasPrompt && hasMemory) return 'both';
  if (hasMemory) return 'memory';
  return 'custom';
}

/* ── Tavern Character Card Import (酒馆卡片导入) ── */

function parsePngCharaData(buf) {
  const view = new DataView(buf);
  let offset = 8; // skip PNG signature
  while (offset < buf.byteLength) {
    const len = view.getUint32(offset);
    const typeCode = String.fromCharCode(view.getUint8(offset + 4), view.getUint8(offset + 5), view.getUint8(offset + 6), view.getUint8(offset + 7));
    if (typeCode === 'tEXt') {
      const dataStart = offset + 8;
      const dataBytes = new Uint8Array(buf, dataStart, len);
      const nullIdx = dataBytes.indexOf(0);
      if (nullIdx !== -1) {
        const keyword = new TextDecoder('latin1').decode(dataBytes.slice(0, nullIdx));
        if (keyword === 'chara') {
          const b64 = new TextDecoder('latin1').decode(dataBytes.slice(nullIdx + 1));
          const json = atob(b64);
          return JSON.parse(json);
        }
      }
    }
    offset += 12 + len; // 4 len + 4 type + data + 4 crc
  }
  return null;
}

function normalizeTavernCard(raw) {
  const d = (raw && raw.spec === 'chara_card_v2' && raw.data) ? raw.data : raw;
  if (!d || !d.name) return null;
  const parts = [];
  if (d.description) parts.push(d.description.trim());
  if (d.personality) parts.push('性格：' + d.personality.trim());
  if (d.scenario) parts.push('场景：' + d.scenario.trim());
  if (d.mes_example) parts.push('对话示例：\n' + d.mes_example.trim());
  return {
    name: d.name,
    customPrompt: parts.join('\n\n'),
    firstMessage: d.first_mes || ''
  };
}

async function handleTavernImport(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  let raw = null;
  let iconDataUrl = '';

  if (ext === 'png') {
    const buf = await file.arrayBuffer();
    raw = parsePngCharaData(buf);
    if (!raw) throw new Error('PNG 中未找到角色卡数据');
    // convert PNG to base64 icon
    const blob = new Blob([buf], { type: 'image/png' });
    iconDataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } else if (ext === 'json') {
    const text = await file.text();
    raw = JSON.parse(text);
  } else {
    throw new Error('不支持的文件格式，请选择 .png 或 .json 文件');
  }

  const card = normalizeTavernCard(raw);
  if (!card) throw new Error('无法识别角色卡格式');

  const avatar = createAvatar({
    name: card.name,
    icon: iconDataUrl || '🎭',
    customPrompt: card.customPrompt,
    memoryText: ''
  });

  // create a new session bound to this avatar
  createSession(card.name);
  const session = getActiveSession();
  if (session) {
    session.avatarId = avatar.id;
    if (card.firstMessage) {
      session.messages.push({
        id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        kind: 'chat',
        role: 'assistant',
        content: card.firstMessage,
        createdAt: Date.now()
      });
    }
    touchSession(session);
    persistSessionsState();
  }

  renderAvatarList();
  renderAvatarSelectPanel();
  renderSessionList();
  renderMessages();
  return card.name;
}

/* ── Sidebar Tabs + Contact List + Group ── */

function switchSidebarTab(tab) {
  state.ui.sidebarTab = tab;
  localStorage.setItem('chatbox_sidebar_tab_v1', tab);
  if (els.tabSessions) els.tabSessions.classList.toggle('active', tab === 'sessions');
  if (els.tabContacts) els.tabContacts.classList.toggle('active', tab === 'contacts');
  if (els.sessionsPane) els.sessionsPane.classList.toggle('hidden', tab !== 'sessions');
  if (els.contactsPane) els.contactsPane.classList.toggle('hidden', tab !== 'contacts');
  if (tab === 'contacts') renderContactList();
}

function renderContactList() {
  if (!els.contactList) return;
  const avatars = state.avatars;
  if (!avatars.length) {
    els.contactList.innerHTML = '<div class="muted">还没有联系人，导入酒馆卡片或在设置中创建角色</div>';
    return;
  }
  els.contactList.innerHTML = avatars.map((a) => {
    const isGroup = a.type === 'group';
    const iconVal = a.icon || (isGroup ? '👥' : '😀');
    const iconHtml = iconVal.startsWith('data:image')
      ? `<img src="${iconVal}" alt="avatar">`
      : iconVal;
    const boundSession = state.sessions.find((s) => s.avatarId === a.id);
    const preview = boundSession ? getSessionPreview(boundSession) : '暂无消息';
    const badge = isGroup ? '<span class="contact-badge">群组</span>' : '';
    return `
      <button class="contact-item" data-action="open-contact" data-avatar-id="${a.id}" type="button">
        <span class="contact-icon">${iconHtml}</span>
        <div class="contact-info">
          <div class="contact-name">${escapeHtml(a.name)} ${badge}</div>
          <div class="contact-preview">${escapeHtml(preview)}</div>
        </div>
      </button>
    `;
  }).join('');
}

function openContact(avatarId) {
  const existing = state.sessions.find((s) => s.avatarId === avatarId);
  if (existing) {
    switchSession(existing.id);
  } else {
    const avatar = getAvatarById(avatarId);
    if (!avatar) return;
    createSession(avatar.name);
    const session = getActiveSession();
    if (session) {
      session.avatarId = avatarId;
      touchSession(session);
      persistSessionsState();
    }
    renderSessionList();
    renderMessages();
    renderAvatarSelectPanel();
  }
  switchSidebarTab('sessions');
}

function openGroupDialog() {
  if (!els.groupDialog) return;
  if (els.groupNameInput) els.groupNameInput.value = '';
  renderGroupMemberList();
  els.groupDialog.showModal();
}

function renderGroupMemberList() {
  if (!els.groupMemberList) return;
  const singles = state.avatars.filter((a) => a.type !== 'group');
  if (!singles.length) {
    els.groupMemberList.innerHTML = '<div class="muted">先创建角色才能建群</div>';
    return;
  }
  els.groupMemberList.innerHTML = singles.map((a) => {
    const iconVal = a.icon || '😀';
    const iconHtml = iconVal.startsWith('data:image')
      ? `<img src="${iconVal}" alt="" style="width:20px;height:20px;border-radius:50%">`
      : iconVal;
    return `
      <label class="group-member-item">
        <input type="checkbox" value="${a.id}">
        ${iconHtml} ${escapeHtml(a.name)}
      </label>
    `;
  }).join('');
}

function saveGroup() {
  const name = (els.groupNameInput?.value || '').trim();
  if (!name) { alert('请输入群组名称'); return; }
  const checked = els.groupMemberList.querySelectorAll('input[type="checkbox"]:checked');
  const memberIds = Array.from(checked).map((cb) => cb.value);
  if (memberIds.length < 2) { alert('至少选择两个成员'); return; }
  const now = Date.now();
  const group = {
    id: `av_${now}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'group',
    name,
    icon: '👥',
    relationship: '',
    customPrompt: '',
    memoryText: '',
    memberIds,
    createdAt: now
  };
  state.avatars.unshift(group);
  persistAvatars();
  els.groupDialog.close();
  renderContactList();
  renderAvatarSelectPanel();
}

/* ── Avatar UI (设置面板 + 选择器) ── */

function promptModeLabel(mode) {
  if (mode === 'both') return '混合';
  if (mode === 'memory') return '记忆';
  return '自定义';
}

function renderAvatarList() {
  if (!els.avatarListWrap) return;
  if (!state.avatars.length) {
    els.avatarListWrap.innerHTML = '<div class="muted">还没有角色，创建一个吧</div>';
    return;
  }
  els.avatarListWrap.innerHTML = state.avatars.map((a) => {
    const iconVal = a.icon || '😀';
    const iconHtml = iconVal.startsWith('data:image')
      ? `<img src="${iconVal}" alt="avatar" class="avatar-card-icon">`
      : `<span class="avatar-card-icon">${iconVal}</span>`;
    return `
    <div class="avatar-card" data-avatar-id="${a.id}">
      ${iconHtml}
      <div class="avatar-card-info">
        <span class="avatar-card-name">${escapeHtml(a.name)}</span>
        <span class="avatar-tag">${promptModeLabel(a.promptMode)}</span>
      </div>
      <div class="avatar-card-actions">
        <button class="btn ghost" data-action="edit-avatar" data-avatar-id="${a.id}" type="button">编辑</button>
        <button class="btn ghost" data-action="delete-avatar" data-avatar-id="${a.id}" type="button">删除</button>
      </div>
    </div>
  `}).join('');
}

function resetAvatarForm() {
  if (!els.avatarEditId) return;
  els.avatarEditId.value = '';
  els.avatarNameInput.value = '';
  if (els.avatarRelInput) els.avatarRelInput.value = '';
  els.avatarPromptInput.value = '';
  els.avatarMemoryInput.value = '';
  if (els.avatarEmojiInput) els.avatarEmojiInput.value = '';
  if (els.avatarIconPreview) els.avatarIconPreview.innerHTML = '😀';
  if (els.avatarIconPreview) els.avatarIconPreview.dataset.value = '😀';
  if (els.avatarMemoryFileStatus) els.avatarMemoryFileStatus.textContent = '';
  els.avatarFormTitle.textContent = '新建角色';
  els.avatarCancelBtn.classList.add('hidden');
  if (els.avatarStatus) els.avatarStatus.textContent = '';
}

function fillAvatarForm(avatar) {
  if (!avatar || !els.avatarEditId) return;
  els.avatarEditId.value = avatar.id;
  els.avatarNameInput.value = avatar.name;
  if (els.avatarRelInput) els.avatarRelInput.value = avatar.relationship || '';
  els.avatarPromptInput.value = avatar.customPrompt || '';
  els.avatarMemoryInput.value = avatar.memoryText || '';
  const iconVal = avatar.icon || '😀';
  if (els.avatarEmojiInput) els.avatarEmojiInput.value = iconVal.startsWith('data:image') ? '' : iconVal;
  if (els.avatarIconPreview) {
    els.avatarIconPreview.innerHTML = iconVal.startsWith('data:image')
      ? `<img src="${iconVal}" alt="avatar">` : iconVal;
    els.avatarIconPreview.dataset.value = iconVal;
  }
  if (els.avatarMemoryFileStatus) els.avatarMemoryFileStatus.textContent = '';
  els.avatarFormTitle.textContent = '编辑角色';
  els.avatarCancelBtn.classList.remove('hidden');
}

function renderAvatarSelectPanel() {
  if (!els.avatarSelectPanel) return;
  const session = getActiveSession();
  const currentId = session ? session.avatarId : null;
  let html = `<button class="popup-item${!currentId ? ' active' : ''}" data-action="select-avatar" data-avatar-id="" type="button">无（普通聊天）</button>`;
  html += state.avatars.map((a) => `
    <button class="popup-item${a.id === currentId ? ' active' : ''}" data-action="select-avatar" data-avatar-id="${a.id}" type="button">${escapeHtml(a.name)}</button>
  `).join('');
  els.avatarSelectPanel.innerHTML = html;
  updateAvatarBtnLabel();
}

function applyAvatarSelection(avatarId) {
  const session = getActiveSession();
  if (!session) return;
  session.avatarId = avatarId || null;
  touchSession(session);
  persistSessionsState();
  renderAvatarSelectPanel();
  renderSessionList();
}

function updateAvatarBtnLabel() {
  if (!els.toggleAvatarBtn) return;
  const session = getActiveSession();
  const avatar = session && session.avatarId ? getAvatarById(session.avatarId) : null;
  els.toggleAvatarBtn.textContent = avatar ? `🎭 ${avatar.name}` : '🎭 角色';
}

function renderSessionList() {
  const activeId = state.activeSessionId;
  const sorted = sortSessions(state.sessions);
  const filtered = sorted.filter((session) => {
    if (!state.search) return true;
    const preview = getSessionPreview(session).toLowerCase();
    return session.title.toLowerCase().includes(state.search) || preview.includes(state.search);
  });

  if (!filtered.length) {
    els.sessionList.innerHTML = '<div class="muted">没有匹配会话</div>';
    return;
  }

  els.sessionList.innerHTML = filtered.map((session) => {
    const active = session.id === activeId ? 'active' : '';
    const favorite = session.favorite ? 'on' : '';
    const boundAvatar = session.avatarId ? getAvatarById(session.avatarId) : null;
    const avatarTag = boundAvatar ? `<span class="session-avatar-tag">🎭 ${escapeHtml(boundAvatar.name)}</span>` : '';
    return `
      <button class="session-item ${active}" data-action="switch-session" data-sid="${session.id}" type="button">
        <div class="session-top">
          <span class="session-title">${escapeHtml(session.title)}${avatarTag}</span>
          <button class="session-fav ${favorite}" data-action="toggle-fav" data-sid="${session.id}" type="button">${session.favorite ? "★" : "☆"}</button>
        </div>
        <div class="session-preview">${escapeHtml(getSessionPreview(session))}</div>
        <div class="session-time">${formatTime(session.updatedAt)}</div>
      </button>
    `;
  }).join('');
}

function getSessionPreview(session) {
  if (!session.messages.length) return '暂无消息';
  const last = session.messages[session.messages.length - 1];
  if (last.kind === 'tool') {
    return `${toolName(last.tool)}：${last.status === 'done' ? '已完成' : last.status === 'running' ? '进行中' : '失败'}`;
  }
  return String(last.content || '').replace(/\s+/g, ' ').slice(0, 44) || '暂无消息';
}

function syncMaterialsFromSession() {}

function updateCharHint() {}

function renderMessages() {
  const session = getActiveSession();
  if (!session || !session.messages.length) {
    els.messageList.innerHTML = '<div class="muted">开始提问吧。你可以先上传资料，再点击工具生成结构化产物。</div>';
    return;
  }

  const boundAvatar = session.avatarId ? getAvatarById(session.avatarId) : null;

  els.messageList.innerHTML = session.messages.map((message) => {
    if (message.kind === 'tool') return renderToolCard(message);
    const role = message.role === 'user' ? 'user' : 'assistant';
    let avatarVal;
    let speakerName = '';
    if (role === 'assistant' && message.speakerAvatarId) {
      const speaker = getAvatarById(message.speakerAvatarId);
      if (speaker) {
        avatarVal = speaker.icon || '😀';
        speakerName = speaker.name;
      } else {
        avatarVal = state.ui.aiAvatar || '🤖';
      }
    } else if (role === 'assistant' && boundAvatar && boundAvatar.icon) {
      avatarVal = boundAvatar.icon;
    } else {
      avatarVal = role === 'user' ? (state.ui.userAvatar || '👤') : (state.ui.aiAvatar || '🤖');
    }
    const avatarHtml = avatarVal.startsWith('data:image')
      ? `<img src="${avatarVal}" alt="avatar">`
      : avatarVal;
    const content = role === 'assistant'
      ? renderAssistantMessageContent(message.content || '')
      : escapeHtml(message.content || '').replace(/\n/g, '<br>');
    const isStreaming = state.ui.chatStreaming && role === 'assistant' && !message.content;
    let thinkHtml = '';
    if (message.isThinking || isStreaming) {
      const partialThink = message.thinkContent
        ? `<div class="think-body">${escapeHtml(message.thinkContent)}</div>`
        : '';
      thinkHtml = `<details class="think-block thinking-active"><summary><div class="thinking-indicator"><span class="thinking-dot"></span><span class="thinking-dot"></span><span class="thinking-dot"></span> thinking</div></summary>${partialThink}</details>`;
    } else if (message.thinkContent) {
      thinkHtml = `<details class="think-block"><summary>思考过程</summary><div class="think-body">${escapeHtml(message.thinkContent)}</div></details>`;
    }
    let toolCallsHtml = '';
    if (message.toolCalls && message.toolCalls.length) {
      toolCallsHtml = message.toolCalls.map(tc => {
        const icon = tc.status === 'done' ? 'OK' : (tc.isError ? 'ERR' : 'RUN');
        const cls = tc.status === 'done' ? 'done' : (tc.isError ? 'error' : 'running');
        const resultHtml = tc.result ? `<div class="tool-call-result">${escapeHtml(tc.result).slice(0, 500)}</div>` : '';
        return `<details class="tool-call-indicator ${cls}"><summary>${icon} ${escapeHtml(tc.name)}</summary>${resultHtml}</details>`;
      }).join('');
    }
    const speakerHtml = speakerName ? `<div class="msg-speaker-name">${escapeHtml(speakerName)}</div>` : '';
    const metaHtml = renderMessageMeta(message, role);
    return `<div class="msg-row ${role}"><span class="avatar">${avatarHtml}</span><div class="msg ${role}" data-mid="${message.id}">${speakerHtml}${thinkHtml}${toolCallsHtml}${content}${metaHtml}</div></div>`;
  }).join('');

  els.messageList.scrollTop = els.messageList.scrollHeight;
}

function renderAssistantMessageContent(text) {
  const raw = String(text || '');
  if (!state.settings.chatMarkdownRender) {
    return escapeHtml(raw).replace(/\n/g, '<br>');
  }
  if (!state.settings.chatLatexRender) {
    return renderMarkdown(raw);
  }
  return renderRichTextWithMath(raw);
}

function renderMessageMeta(message, role) {
  const parts = [];
  if (state.settings.chatShowTimestamp) {
    parts.push(formatTime(message.createdAt));
  }
  if (state.settings.chatShowModel && role === 'assistant') {
    parts.push(message.modelName || getChatModelName());
  }
  if (state.settings.chatShowCharCount) {
    parts.push(`${String(message.content || '').length} chars`);
  }
  if (!parts.length) return '';
  return `<div class="msg-meta">${escapeHtml(parts.join(' · '))}</div>`;
}

function renderToolCard(message) {
  const statusClass = message.status || 'running';
  const statusText = statusClass === 'done'
    ? '已完成'
    : statusClass === 'error'
      ? '失败'
      : '进行中';

  let action = '';
  let inlineArtifact = '';
  if (statusClass === 'done' && message.artifactId) {
    const expanded = state.ui.expandedArtifacts && state.ui.expandedArtifacts[message.artifactId];
    action = `<button class="btn" data-action="toggle-inline-artifact" data-artifact-id="${message.artifactId}" type="button">${expanded ? '收起产物' : '查看产物'}</button>`;
    if (expanded) {
      const session = getActiveSession();
      const artifact = session && session.artifacts.find((a) => a.id === message.artifactId);
      if (artifact) {
        const tab = (state.ui.inlineArtifactTabs && state.ui.inlineArtifactTabs[message.artifactId]) || 'overview';
        const tabs = getArtifactTabs(artifact.tool);
        const tabsHtml = tabs.map((t) =>
          `<button class="artifact-tab ${t.id === tab ? 'active' : ''}" data-action="switch-inline-tab" data-artifact-id="${message.artifactId}" data-tab="${t.id}" type="button">${escapeHtml(t.label)}</button>`
        ).join('');
        let contentHtml = '';
        if (artifact.tool === 'paper_report') {
          contentHtml = renderPaperArtifact(artifact.data || {}, tab);
        } else {
          contentHtml = renderReviewArtifact(artifact.data || {}, tab);
        }
        inlineArtifact = `<div class="inline-artifact"><div class="inline-artifact-tabs">${tabsHtml}</div><div class="inline-artifact-content">${contentHtml}</div></div>`;
      }
    }
  } else if (statusClass === 'error') {
    action = `<button class="btn" data-action="retry-tool" data-tool="${message.tool}" type="button">重试</button>`;
  }

  return `
    <div class="tool-card ${statusClass}" data-mid="${message.id}">
      <div class="tool-card-head">
        <span class="tool-card-title">${escapeHtml(message.title || toolName(message.tool))}</span>
        <span class="tool-card-meta">${statusText} · ${formatTime(message.createdAt)}</span>
      </div>
      <div class="tool-card-meta">${escapeHtml(message.detail || '')}</div>
      ${action}
      ${inlineArtifact}
    </div>
  `;
}

function appendChatMessage(role, content, extra) {
  const session = getActiveSession();
  if (!session) return null;
  const message = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    kind: 'chat',
    role,
    content: String(content || ''),
    createdAt: Date.now(),
    ...(extra && typeof extra === 'object' ? extra : {})
  };
  session.messages.push(message);
  if (role === 'user') {
    const trimmed = message.content.trim();
    if (state.settings.chatAutoTitle && trimmed && (!session.title || /^会话/.test(session.title) || session.title === '新会话')) {
      session.title = trimmed.slice(0, 18);
    }
  }
  touchSession(session);
  return message;
}

function appendToolMessage(tool, detail) {
  const session = getActiveSession();
  if (!session) return null;
  const message = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    kind: 'tool',
    tool,
    title: toolName(tool),
    status: 'running',
    detail: detail || '姝ｅ湪澶勭悊...',
    artifactId: '',
    createdAt: Date.now()
  };
  session.messages.push(message);
  touchSession(session);
  return message;
}

function updateMessage(messageId, updater) {
  const session = getActiveSession();
  if (!session) return;
  const idx = session.messages.findIndex((m) => m.id === messageId);
  if (idx < 0) return;
  const updated = updater(session.messages[idx]);
  if (updated) session.messages[idx] = updated;
  touchSession(session);
}

function buildChatPayloadMessages(session) {
  const filtered = session.messages
    .filter((m) => m.kind === 'chat' && (m.role === 'user' || m.role === 'assistant'));
  const limit = Math.max(1, Number(state.settings.chatContextLimit || 14));
  const sourceMessages = state.settings.chatContextUnlimited ? filtered : filtered.slice(-limit);
  return sourceMessages
    .map((m) => {
      let content = String(m.content || '').trim();
      if (m.speakerAvatarId) {
        const speaker = getAvatarById(m.speakerAvatarId);
        if (speaker) content = `[${speaker.name}]: ${content}`;
      }
      return { role: m.role, content };
    })
    .filter((m) => m.content.length > 0);
}

async function streamSSEResponse(response, messageId) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let full = '';
  let thinkFull = '';
  let isThinking = false;
  let toolCalls = [];
  const incrementalRender = Boolean(state.settings.chatStreamOutput);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const dataText = line.slice(6).trim();
      if (!dataText || dataText === '[DONE]') continue;
      try {
        const payload = JSON.parse(dataText);
        if (payload.error) {
          full = payload.message || '请求失败';
        } else if (payload.tool_call) {
          toolCalls.push({ name: payload.tool_call.name, args: payload.tool_call.arguments, status: 'running' });
        } else if (payload.tool_result) {
          const tc = toolCalls.find(t => t.name === payload.tool_result.name && t.status === 'running');
          if (tc) { tc.status = 'done'; tc.result = payload.tool_result.result; tc.isError = payload.tool_result.isError; }
        } else if (payload.thinking === true) {
          isThinking = true;
        } else if (payload.thinking === false) {
          isThinking = false;
        } else if (payload.think_content) {
          thinkFull += payload.think_content;
        } else if (payload.content) {
          full += payload.content;
        }
        updateMessage(messageId, (m) => ({
          ...m,
          content: full,
          thinkContent: thinkFull || undefined,
          isThinking,
          toolCalls: toolCalls.length ? [...toolCalls] : undefined
        }));
        if (incrementalRender || payload.error || payload.tool_call || payload.tool_result || typeof payload.thinking === 'boolean') {
          renderMessages();
        }
      } catch (_) {}
    }
  }

  if (!full) {
    updateMessage(messageId, (m) => ({ ...m, content: '未收到有效回复，请重试。', isThinking: false }));
    renderMessages();
  } else {
    updateMessage(messageId, (m) => ({ ...m, isThinking: false }));
    renderMessages();
  }
  return full;
}

async function sendChatMessage() {
  const session = getActiveSession();
  if (!session || state.ui.chatStreaming) return;

  const text = String(els.chatInput.value || '').trim();
  if (!text) return;

  if (state.ui.activeTool) {
    clearToolMode();
  }

  appendChatMessage('user', text);
  els.chatInput.value = '';

  const boundAvatar = session.avatarId ? getAvatarById(session.avatarId) : null;
  const isGroup = boundAvatar && boundAvatar.type === 'group';

  if (isGroup) {
    await sendGroupChatMessage(session, boundAvatar);
  } else {
    await sendSingleChatMessage(session);
  }
}

async function sendSingleChatMessage(session) {
  const payloadMessages = buildChatPayloadMessages(session);
  const assistant = appendChatMessage('assistant', '', { modelName: getChatModelName() });
  const samplingOptions = getChatSamplingOptions();

  state.ui.chatStreaming = true;
  els.sendBtn.disabled = true;
  renderMessages();
  renderSessionList();
  persistSessionsState();

  try {
    /* 联网搜索 */
    let searchResults = [];
    if (state.ui.webSearchEnabled) {
      try {
        const sr = await apiRequest('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: String(session.messages.filter(m => m.role === 'user').pop()?.content || '') })
        });
        searchResults = Array.isArray(sr.results) ? sr.results : [];
      } catch (_) {}
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(state.token ? { 'x-access-token': state.token } : {})
      },
      body: JSON.stringify({
        messages: payloadMessages,
        context: session.materialsText || '',
        mode: state.ui.chatMode,
        providerId: state.ui.selectedProviderId || undefined,
        model: state.ui.selectedModel || undefined,
        ...samplingOptions,
        searchResults: searchResults.length ? searchResults : undefined,
        knowledgeBaseIds: getEnabledKbIds(),
        avatar: (() => {
          const av = session.avatarId ? getAvatarById(session.avatarId) : null;
          if (!av) return undefined;
          return { name: av.name, relationship: av.relationship || '', customPrompt: av.customPrompt || '', memoryText: av.memoryText || '' };
        })()
      })
    });

    if (response.status === 401) {
      askForToken();
      throw new Error('口令已更新，请重试。');
    }

    if (!response.ok) {
      const raw = await response.text();
      let msg = `请求失败：${response.status}`;
      try {
        const parsed = JSON.parse(raw);
        msg = parsed.message || msg;
      } catch (_) {}
      updateMessage(assistant.id, (m) => ({ ...m, content: msg }));
      renderMessages();
      return;
    }

    await streamSSEResponse(response, assistant.id);
  } catch (error) {
    updateMessage(assistant.id, (m) => ({ ...m, content: `测试失败：${error.message || error}`, isThinking: false }));
    renderMessages();
  } finally {
    state.ui.chatStreaming = false;
    els.sendBtn.disabled = false;
    persistSessionsState();
    renderSessionList();
  }
}

async function sendGroupChatMessage(session, group) {
  state.ui.chatStreaming = true;
  els.sendBtn.disabled = true;
  renderMessages();
  renderSessionList();
  persistSessionsState();

  try {
    const members = (group.memberIds || [])
      .map((id) => getAvatarById(id))
      .filter(Boolean);

    if (!members.length) {
      appendChatMessage('assistant', '群组中没有有效成员。');
      renderMessages();
      return;
    }

    const payloadMessages = buildChatPayloadMessages(session);

    for (const member of members) {
      const assistant = appendChatMessage('assistant', '', { modelName: getChatModelName() });
      const samplingOptions = getChatSamplingOptions();
      /* tag this message with the speaker */
      const msgInSession = session.messages.find((m) => m.id === assistant.id);
      if (msgInSession) msgInSession.speakerAvatarId = member.id;
      renderMessages();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(state.token ? { 'x-access-token': state.token } : {})
        },
        body: JSON.stringify({
          messages: payloadMessages,
          context: session.materialsText || '',
          mode: state.ui.chatMode,
          providerId: state.ui.selectedProviderId || undefined,
          model: state.ui.selectedModel || undefined,
          ...samplingOptions,
          knowledgeBaseIds: getEnabledKbIds(),
          avatar: {
            name: member.name,
            relationship: member.relationship || '',
            customPrompt: member.customPrompt || '',
            memoryText: member.memoryText || ''
          },
          groupContext: {
            groupName: group.name,
            memberNames: members.map((m) => m.name),
            currentSpeaker: member.name
          }
        })
      });

      if (response.status === 401) {
        askForToken();
        throw new Error('口令已更新，请重试。');
      }

      if (!response.ok) {
        const raw = await response.text();
        let msg = `请求失败：${response.status}`;
        try { msg = JSON.parse(raw).message || msg; } catch (_) {}
        updateMessage(assistant.id, (m) => ({ ...m, content: msg }));
        renderMessages();
        continue;
      }

      const finalContent = await streamSSEResponse(response, assistant.id);
      /* append this member's response to context for next member */
      payloadMessages.push({ role: 'assistant', content: `[${member.name}]: ${finalContent}` });
    }
  } catch (error) {
    appendChatMessage('assistant', `群组聊天失败：${error.message}`);
    renderMessages();
  } finally {
    state.ui.chatStreaming = false;
    els.sendBtn.disabled = false;
    persistSessionsState();
    renderSessionList();
  }
}

async function runTool(tool) {
  if (!['review_pack', 'paper_report'].includes(tool)) return;
  if (state.ui.toolRunning) return;
  const session = getActiveSession();
  if (!session) return;

  const sourceText = String(session.materialsText || '').trim();
  const cnCount = countChineseChars(sourceText);
  if (cnCount < MIN_CN_CHARS) {
    setStatus(`Insufficient materials: ${cnCount} Chinese chars, need at least ${MIN_CN_CHARS}.`);
    return;
  }

  state.ui.toolRunning = true;
  const runningText = tool === 'review_pack'
    ? '正在生成复习包...'
    : '正在生成论文/实验报告结构...';
  const toolMessage = appendToolMessage(tool, runningText);

  renderMessages();
  renderSessionList();
  persistSessionsState();

  try {
    const endpoint = tool === 'review_pack' ? '/api/tool/review_pack' : '/api/tool/paper_report';
    const body = tool === 'review_pack'
      ? { text: sourceText, mode: 'review_pack' }
      : { text: sourceText, type: 'course_report', style: '中文学术规范', word_target: 2500 };

    const payload = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    const artifact = pushArtifact(session, {
      tool,
      title: tool === 'review_pack' ? 'Review Pack' : 'Paper / Course Report',
      data: payload.data || {},
      meta: payload.meta || {},
      createdAt: Date.now()
    });

    updateMessage(toolMessage.id, (m) => ({
      ...m,
      status: 'done',
      detail: `${toolName(tool)} generated. Click to view artifact.`,
      artifactId: artifact.id
    }));

    state.ui.expandedArtifacts[artifact.id] = Boolean(state.settings.chatAutoPreviewArtifact);

    touchSession(session);
    persistSessionsState();
    renderMessages();
    renderSessionList();
    renderDrawer();
    clearToolMode();
  } catch (error) {
    updateMessage(toolMessage.id, (m) => ({
      ...m,
      status: 'error',
      detail: error.message || '生成失败，请重试。',
      artifactId: ''
    }));
    persistSessionsState();
    renderMessages();
    setStatus(`工具失败：${error.message || error}`);
  } finally {
    state.ui.toolRunning = false;
  }
}

function pushArtifact(session, artifactInput) {
  const artifact = {
    id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    tool: artifactInput.tool,
    title: artifactInput.title || toolName(artifactInput.tool),
    data: artifactInput.data || {},
    meta: artifactInput.meta || {},
    createdAt: artifactInput.createdAt || Date.now()
  };
  session.artifacts.unshift(artifact);
  session.artifacts = session.artifacts.slice(0, MAX_ARTIFACTS_PER_SESSION);
  state.ui.activeArtifactId = artifact.id;
  state.ui.activeArtifactTab = 'overview';
  return artifact;
}

function openDrawer(artifactId) {
  const session = getActiveSession();
  if (!session || !session.artifacts.length) {
    setStatus('当前会话还没有产物。');
    return;
  }
  if (artifactId) state.ui.activeArtifactId = artifactId;
  if (!state.ui.activeArtifactId || !session.artifacts.some((a) => a.id === state.ui.activeArtifactId)) {
    state.ui.activeArtifactId = session.artifacts[0].id;
  }
  state.ui.drawerOpen = true;
  document.body.classList.add('drawer-open');
  renderDrawer();
}

function closeDrawer() {
  state.ui.drawerOpen = false;
  document.body.classList.remove('drawer-open');
}

function getActiveArtifact() {
  const session = getActiveSession();
  if (!session || !session.artifacts.length) return null;
  const artifact = session.artifacts.find((a) => a.id === state.ui.activeArtifactId);
  return artifact || session.artifacts[0];
}

function renderDrawer() {
  const session = getActiveSession();
  const artifacts = session ? session.artifacts : [];

  if (!artifacts.length) {
    els.artifactList.innerHTML = '<div class="muted">暂无浜х墿</div>';
    els.artifactTabs.innerHTML = '';
    els.artifactContent.innerHTML = '<div class="muted">点击工具按钮后会在这里查看产物。</div>';
    els.drawerTitle.textContent = '产物中心';
    els.drawerSub.textContent = '暂无可查看数据';
    return;
  }

  if (!state.ui.activeArtifactId || !artifacts.some((a) => a.id === state.ui.activeArtifactId)) {
    state.ui.activeArtifactId = artifacts[0].id;
  }

  els.artifactList.innerHTML = artifacts.map((item) => {
    const active = item.id === state.ui.activeArtifactId ? 'active' : '';
    return `
      <button class="artifact-item ${active}" data-action="select-artifact" data-artifact-id="${item.id}" type="button">
        <div><strong>${escapeHtml(item.title)}</strong></div>
        <div class="muted">${escapeHtml(toolName(item.tool))}</div>
        <div class="muted">${formatTime(item.createdAt)}</div>
      </button>
    `;
  }).join('');

  renderArtifactTabs();
  renderDrawerContent();
}

function renderArtifactTabs() {
  const artifact = getActiveArtifact();
  if (!artifact) {
    els.artifactTabs.innerHTML = '';
    return;
  }

  const tabs = getArtifactTabs(artifact.tool);
  if (!tabs.some((t) => t.id === state.ui.activeArtifactTab)) {
    state.ui.activeArtifactTab = tabs[0].id;
  }

  els.artifactTabs.innerHTML = tabs.map((tab) => {
    const active = tab.id === state.ui.activeArtifactTab ? 'active' : '';
    return `<button class="artifact-tab ${active}" data-action="switch-artifact-tab" data-tab="${tab.id}" type="button">${escapeHtml(tab.label)}</button>`;
  }).join('');
}

function getArtifactTabs(tool) {
  if (tool === 'paper_report') {
    return [
      { id: 'overview', label: '概览' },
      { id: 'outline', label: '大纲' },
      { id: 'method_results', label: '方法与结果' },
      { id: 'draft', label: '草稿' },
      { id: 'anti_aigc', label: '降痕策略' },
      { id: 'citation_placeholders', label: '引用占位' },
      { id: 'raw', label: 'JSON' }
    ];
  }
  return [
    { id: 'overview', label: '概览' },
    { id: 'outline', label: '大纲' },
    { id: 'keypoints', label: '考点' },
    { id: 'question_bank', label: '题库' },
    { id: 'anki', label: 'Anki' },
    { id: 'raw', label: 'JSON' }
  ];
}

function renderDrawerContent() {
  const artifact = getActiveArtifact();
  if (!artifact) {
    els.artifactContent.innerHTML = '<div class="muted">暂无产物。</div>';
    return;
  }

  els.drawerTitle.textContent = artifact.title;
  els.drawerSub.textContent = `${toolName(artifact.tool)} · ${formatTime(artifact.createdAt)}`;

  const tab = state.ui.activeArtifactTab;
  if (artifact.tool === 'paper_report') {
    els.artifactContent.innerHTML = renderPaperArtifact(artifact.data || {}, tab);
  } else {
    els.artifactContent.innerHTML = renderReviewArtifact(artifact.data || {}, tab);
  }
}

function renderReviewArtifact(data, tab) {
  if (tab === 'raw') return `<pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
  if (tab === 'outline') return renderReviewOutline(data.outline || []);
  if (tab === 'keypoints') return renderReviewKeypoints(data.keypoints || []);
  if (tab === 'question_bank') return renderReviewQuestionBank(data.question_bank || {});
  if (tab === 'anki') return renderReviewAnki(data.anki || []);

  const meta = data.meta || {};
  return `
    <div class="artifact-block">
      <h3>${escapeHtml(meta.course_name || '未命名课程')}</h3>
      <p>${renderInlineWithMath(meta.source_summary || '资料未提取')}</p>
      <p class="muted">生成时间：${escapeHtml(meta.generated_at || '未知')}</p>
    </div>
    <div class="artifact-block">
      <p>章节数：${Array.isArray(data.outline) ? data.outline.length : 0}</p>
      <p>考点数：${Array.isArray(data.keypoints) ? data.keypoints.length : 0}</p>
      <p>题库总量：${countQuestionTotal(data.question_bank || {})}</p>
      <p>Anki 张数：${Array.isArray(data.anki) ? data.anki.length : 0}</p>
    </div>
  `;
}

function renderReviewOutline(list) {
  if (!Array.isArray(list) || !list.length) return '<div class="muted">无大纲数据</div>';
  return list.map((item) => `
    <div class="artifact-block">
      <h3>${escapeHtml(item.chapter || '')}</h3>
      <p>${renderInlineWithMath(item.summary || '')}</p>
      ${renderListLine('必背', item.must_know)}
      ${renderListLine('公式/规则', item.formulas_or_rules)}
      ${renderListLine('关键词', item.keywords)}
    </div>
  `).join('');
}

function renderReviewKeypoints(list) {
  if (!Array.isArray(list) || !list.length) return '<div class="muted">无考点数据</div>';
  return list.map((item) => `
    <div class="artifact-block">
      <h3>${escapeHtml(item.topic || '')}</h3>
      <p><strong>为什么重要：</strong>${renderInlineWithMath(item.why_important || '')}</p>
      <p><strong>核心解释：</strong>${renderInlineWithMath(item.core_explanation || '')}</p>
      ${renderListLine('常见误区', item.common_mistakes)}
      <p><strong>速记：</strong>${renderInlineWithMath(item.quick_memory || '')}</p>
    </div>
  `).join('');
}

function renderReviewQuestionBank(bank) {
  const mcq = Array.isArray(bank.mcq) ? bank.mcq : [];
  const blank = Array.isArray(bank.blank) ? bank.blank : [];
  const shortAnswer = Array.isArray(bank.short_answer) ? bank.short_answer : [];
  const comprehensive = Array.isArray(bank.comprehensive) ? bank.comprehensive : [];
  const blocks = [];

  if (mcq.length) {
    blocks.push('<h3>选择题</h3>');
    blocks.push(mcq.map((q) => `
      <div class="artifact-block">
        <p><strong>${escapeHtml(q.id || '')}</strong> ${renderInlineWithMath(q.question || '')}</p>
        <p>A. ${renderInlineWithMath(q.options?.A || '')}</p>
        <p>B. ${renderInlineWithMath(q.options?.B || '')}</p>
        <p>C. ${renderInlineWithMath(q.options?.C || '')}</p>
        <p>D. ${renderInlineWithMath(q.options?.D || '')}</p>
        <p><strong>答案：</strong>${escapeHtml(q.answer || '')}</p>
        <p><strong>解析：</strong>${renderInlineWithMath(q.analysis || '')}</p>
      </div>
    `).join(''));
  }

  if (blank.length) {
    blocks.push('<h3>填空题</h3>');
    blocks.push(blank.map((q) => `
      <div class="artifact-block">
        <p><strong>${escapeHtml(q.id || '')}</strong> ${renderInlineWithMath(q.question || '')}</p>
        <p><strong>答案：</strong>${renderInlineWithMath(q.answer || '')}</p>
      </div>
    `).join(''));
  }

  if (shortAnswer.length) {
    blocks.push('<h3>简答题</h3>');
    blocks.push(shortAnswer.map((q) => `
      <div class="artifact-block">
        <p><strong>${escapeHtml(q.id || '')}</strong> ${renderInlineWithMath(q.question || '')}</p>
        ${renderListLine('要点', q.key_points)}
      </div>
    `).join(''));
  }

  if (comprehensive.length) {
    blocks.push('<h3>综合题</h3>');
    blocks.push(comprehensive.map((q) => `
      <div class="artifact-block">
        <p><strong>${escapeHtml(q.id || '')}</strong> ${renderInlineWithMath(q.question || '')}</p>
        ${renderListLine('步骤', q.steps)}
      </div>
    `).join(''));
  }

  if (!blocks.length) return '<div class="muted">无题库数据</div>';
  return blocks.join('');
}

function renderReviewAnki(cards) {
  if (!Array.isArray(cards) || !cards.length) return '<div class="muted">无 Anki 卡片</div>';
  return cards.map((card, idx) => `
    <div class="artifact-block">
      <p><strong>Card ${idx + 1}</strong></p>
      <p><strong>Front：</strong>${renderInlineWithMath(card.front || '')}</p>
      <p><strong>Back：</strong>${renderInlineWithMath(card.back || '')}</p>
      ${renderListLine('Tags', card.tags)}
    </div>
  `).join('');
}

function renderPaperArtifact(data, tab) {
  if (tab === 'raw') return `<pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;

  if (tab === 'outline') {
    const list = Array.isArray(data.outline) ? data.outline : [];
    if (!list.length) return '<div class="muted">无大纲数据</div>';
    return list.map((item) => `
      <div class="artifact-block">
        <h3>${escapeHtml(item.h || '')}</h3>
        ${renderListLine('要点', item.bullets)}
      </div>
    `).join('');
  }

  if (tab === 'method_results') {
    const mr = data.method_results || {};
    return `
      <div class="artifact-block">${renderListLine('方法假设', mr.method?.assumptions)}</div>
      <div class="artifact-block">${renderListLine('材料与工具', mr.method?.materials_or_tools)}</div>
      <div class="artifact-block">${renderListLine('步骤流程', mr.method?.procedure_steps)}</div>
      <div class="artifact-block">${renderListLine('关键发现', mr.results?.key_findings)}</div>
      <div class="artifact-block">${renderListLine('讨论要点', mr.discussion?.interpretation_points)}</div>
      <div class="artifact-block">${renderListLine('误差分析', mr.discussion?.error_analysis)}</div>
    `;
  }

  if (tab === 'draft') {
    const draft = data.draft || {};
    return `
      <div class="artifact-block"><h3>摘要</h3><p>${renderInlineWithMath(draft.abstract || '')}</p></div>
      <div class="artifact-block"><h3>引言</h3><p>${renderInlineWithMath(draft.intro || '')}</p></div>
      <div class="artifact-block"><h3>方法</h3><p>${renderInlineWithMath(draft.method || '')}</p></div>
      <div class="artifact-block"><h3>结果</h3><p>${renderInlineWithMath(draft.results || '')}</p></div>
      <div class="artifact-block"><h3>讨论</h3><p>${renderInlineWithMath(draft.discussion || '')}</p></div>
      <div class="artifact-block"><h3>结论</h3><p>${renderInlineWithMath(draft.conclusion || '')}</p></div>
    `;
  }

  if (tab === 'anti_aigc') {
    const anti = data.anti_aigc || {};
    return `
      <div class="artifact-block">${renderListLine('策略说明', anti.strategy_notes)}</div>
      <div class="artifact-block">${renderListLine('人性化清单', anti.humanize_checklist)}</div>
      <div class="artifact-block">
        <h3>重写版本</h3>
        ${(Array.isArray(anti.rewrite_versions) ? anti.rewrite_versions : []).map((v) => `
          <p><strong>${escapeHtml(v.name || '')}：</strong>${renderInlineWithMath(v.text || '')}</p>
        `).join('')}
      </div>
    `;
  }

  if (tab === 'citation_placeholders') {
    const list = Array.isArray(data.citation_placeholders) ? data.citation_placeholders : [];
    if (!list.length) return '<div class="muted">暂无引用占位符</div>';
    return list.map((item) => `
      <div class="artifact-block">
        <p><strong>位置：</strong>${escapeHtml(item.where || '')}</p>
        <p><strong>需要证据：</strong>${escapeHtml(item.need || '')}</p>
        <p><strong>占位符：</strong>${escapeHtml(item.placeholder || '')}</p>
      </div>
    `).join('');
  }

  const meta = data.meta || {};
  const reqCheck = data.requirements_check || {};
  return `
    <div class="artifact-block">
      <h3>${escapeHtml(meta.title || '未命名报告')}</h3>
      <p>类型：${escapeHtml(meta.type || '')}</p>
      <p>学科：${escapeHtml(meta.discipline || '')}</p>
      <p>目标字数：${escapeHtml(String(meta.word_target || ''))}</p>
      <p class="muted">生成时间：${escapeHtml(meta.generated_at || '')}</p>
    </div>
    <div class="artifact-block">${renderListLine('缺少输入', reqCheck.missing_inputs)}</div>
    <div class="artifact-block">${renderListLine('风险提示', reqCheck.risk_notes)}</div>
  `;
}

async function refreshServiceStatus() {
  try {
    const info = await apiRequest('/api/info', { method: 'GET' });
    state.info = { ...state.info, ...info };
    const health = await apiRequest('/api/health', { method: 'GET' });
    state.health.online = Boolean(health.ok && health.model_available);
    state.health.message = health.message || '';
    updateConnectionUI();
    updateModelSelectFromProviders(info.providers || []);
  } catch (error) {
    state.health.online = false;
    state.health.message = error.message || '服务不可用';
    updateConnectionUI();
  }
}

function updateConnectionUI() {
  const online = state.health.online;
  if (online) {
    els.connLine1.textContent = '已连接';
    els.connLine2.textContent = '';
  } else {
    els.connLine1.textContent = '未连接';
    els.connLine2.textContent = state.health.message || '请先启动本地服务';
  }
}

async function openSettingsPanel() {
  els.settingsPanel.classList.remove('hidden');
  refreshAvatarPreviews();
  els.tokenInput.value = state.token || '';
  els.userAvatarInput.value = state.ui.userAvatar || '';
  els.aiAvatarInput.value = state.ui.aiAvatar || '';
  syncSettingsUI();
  resetProviderForm();
  resetAvatarForm();
  renderAvatarList();
  await loadProviderList();
  loadMcpServerList();
  loadKbList();
}

function closeSettingsPanel() {
  els.settingsPanel.classList.add('hidden');
}

function refreshAvatarPreviews() {
  setAvatarPreview(els.userAvatarPreview, state.ui.userAvatar);
  setAvatarPreview(els.aiAvatarPreview, state.ui.aiAvatar);
}

function setAvatarPreview(el, value) {
  if (!el) return;
  if (value && value.startsWith('data:image')) {
    el.innerHTML = `<img src="${value}" alt="avatar">`;
  } else {
    el.textContent = value || '👤';
  }
}

function resizeAndStoreAvatar(file, who) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 64, 64);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      if (who === 'user') {
        state.ui.userAvatar = dataUrl;
        localStorage.setItem('chatbox_user_avatar', dataUrl);
        els.userAvatarInput.value = '';
      } else {
        state.ui.aiAvatar = dataUrl;
        localStorage.setItem('chatbox_ai_avatar', dataUrl);
        els.aiAvatarInput.value = '';
      }
      renderMessages();
      refreshAvatarPreviews();
      setStatus('头像图片已上传。');
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

async function openAccessDialog() {
  try {
    const info = await apiRequest('/api/info', { method: 'GET' });
    const urls = [];
    urls.push(`本机：http://127.0.0.1:${info.port}`);
    (Array.isArray(info.localIPs) ? info.localIPs : []).forEach((ip) => {
      urls.push(`灞€域网：http://${ip}:${info.port}`);
    });
    els.accessLinks.innerHTML = urls.map((line) => escapeHtml(line)).join('<br>');

    const firstLan = Array.isArray(info.localIPs) && info.localIPs.length ? `http://${info.localIPs[0]}:${info.port}` : `http://127.0.0.1:${info.port}`;
    const qr = await apiRequest(`/api/qrcode?text=${encodeURIComponent(firstLan)}`, { method: 'GET' });
    els.accessQr.src = qr.dataUrl || '';
    els.accessDialog.showModal();
  } catch (error) {
    setStatus(`无法获取访问链接：${error.message || error}`);
  }
}

async function runAllProviderTests() {
  const editId = els.providerEditId.value;
  if (!editId) {
    els.providerStatus.textContent = '请先保存 Provider 再测试。';
    return;
  }
  const isOllama = els.providerType.value === 'ollama';
  const testModel = state.ui.editSelectedModels[0] || '';

  const items = [{ type: 'connect', mode: '', label: '请求连接' }];
  if (isOllama) {
    items.push({ type: 'text', mode: 'flash', label: `Flash 文字 (${testModel || '?'})` });
    items.push({ type: 'text', mode: 'thinking', label: `Thinking 文字 (${testModel || '?'})` });
  } else {
    items.push({ type: 'text', mode: 'flash', label: `文字生成 (${testModel || '?'})` });
    items.push({ type: 'image', mode: '', label: '图片生成' });
  }
  items.push({ type: 'vision', mode: '', label: `图片识别 (${testModel || '?'})` });

  const dlg = document.createElement('dialog');
  dlg.className = 'access-dialog';
  dlg.innerHTML = `
    <h3>测试连接</h3>
    <div class="provider-test-popup-body">
      ${items.map((it) => `<div>${escapeHtml(it.label)} · 待测试</div>`).join('')}
    </div>
    <button class="btn" id="closeTestBtn" type="button" style="margin-top:10px">关闭</button>
  `;
  document.body.appendChild(dlg);
  dlg.querySelector('#closeTestBtn').addEventListener('click', () => { dlg.close(); dlg.remove(); });
  dlg.showModal();

  const rows = dlg.querySelectorAll('.provider-test-popup-body > div');

  const run = async (item, idx) => {
    const modeParam = item.mode ? `&mode=${item.mode}` : '';
    const modelParam = testModel ? `&model=${encodeURIComponent(testModel)}` : '';
    try {
      const r = await apiRequest(
        `/api/providers/test/${encodeURIComponent(editId)}?type=${item.type}${modeParam}${modelParam}`,
        { method: 'GET' }
      );
      let detail = r.message || '';
      if ((item.type === 'text' || item.type === 'vision') && r.content) detail = r.content.slice(0, 80);
      rows[idx].innerHTML = `<span style="color:var(--success)">✓</span> ${escapeHtml(item.label)} ${escapeHtml(detail)}`;
    } catch (error) {
      rows[idx].innerHTML = `<span style="color:var(--danger)">✗</span> ${escapeHtml(item.label)} 失败`;
    }
  };

  await Promise.all(items.map((it, i) => run(it, i)));
}

async function saveProvider() {
  const type = els.providerType.value;
  const editId = els.providerEditId.value;
  const body = {
    type,
    name: els.providerName.value.trim() || (type === 'ollama' ? 'Ollama 本地' : 'API'),
    models: [...state.ui.editSelectedModels],
    temperature: els.providerTemp.value ? Number(els.providerTemp.value) : null,
    maxTokens: els.providerMaxTokens.value ? Number(els.providerMaxTokens.value) : null
  };
  if (editId) body.id = editId;
  if (type === 'openai_compatible' || type === 'anthropic') {
    body.baseUrl = els.providerBaseUrl.value.trim();
    const keyVal = els.providerApiKey.value.trim();
    body.apiKey = keyVal || (editId ? '__KEEP__' : '');
  }

  els.providerStatus.textContent = '保存中...';
  try {
    await apiRequest('/api/providers', { method: 'POST', body: JSON.stringify(body) });
    els.providerStatus.textContent = '已保存';
    resetProviderForm();
    await loadProviderList();
    refreshServiceStatus();
  } catch (error) {
    els.providerStatus.textContent = `保存失败：${error.message || error}`;
  }
}

function resetProviderForm() {
  els.providerEditId.value = '';
  els.providerName.value = '';
  els.providerType.value = 'ollama';
  els.openaiFields.classList.add('hidden');
  els.providerBaseUrl.value = '';
  els.providerApiKey.value = '';
  els.providerApiKey.placeholder = 'sk-...';
  els.providerTemp.value = '';
  els.providerMaxTokens.value = '';
  els.providerStatus.textContent = '';
  els.providerFormTitle.textContent = '添加 Provider';
  els.providerCancelBtn.classList.add('hidden');
  els.providerTestResult.classList.add('hidden');
  els.providerTestResult.innerHTML = '';
  els.providerModelManual.value = '';
  els.fetchModelsStatus.textContent = '';
  state.ui.editAvailableModels = [];
  state.ui.editSelectedModels = [];
  renderModelCheckboxes();
}

async function loadProviderList() {
  try {
    const data = await apiRequest('/api/providers', { method: 'GET' });
    state.info.providers = data.providers || [];
    state.info.activeProviderId = data.activeProviderId || '';
    renderProviderList(data.providers || []);
    updateModelSelectFromProviders(data.providers || []);
    renderPresetProviders(data.providers || []);
  } catch {}
}

function renderProviderList(providers) {
  const wrap = els.providerListWrap;
  if (!providers.length) { wrap.innerHTML = '<p class="muted">暂无 Provider</p>'; return; }
  wrap.innerHTML = providers.map((p) => {
    const modelCount = (p.models || []).length;
    const modelText = modelCount ? `${modelCount} models` : 'No model selected';
    return `
    <div class="provider-card${p.enabled ? '' : ' disabled'}">
      <div class="provider-card-info">
        <div class="provider-card-name">${escapeHtml(p.name)}</div>
        <div class="provider-card-meta">${escapeHtml(p.type)} · ${escapeHtml(modelText)}${p.enabled ? '' : ' · 已禁用'}</div>
      </div>
      <div class="provider-card-actions">
        <button onclick="testProviderPopup('${escapeHtml(p.id)}')" title="测试">测试</button>
        <button onclick="editProviderById('${escapeHtml(p.id)}')" title="编辑">编辑</button>
        <button onclick="toggleProviderById('${escapeHtml(p.id)}')">${p.enabled ? '禁用' : '启用'}</button>
        ${p.id !== 'ollama-default' ? `<button onclick="deleteProviderById('${escapeHtml(p.id)}')" title="删除">删除</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

async function renderPresetProviders(existingProviders) {
  if (!els.presetProviderList) return;
  try {
    const data = await apiRequest('/api/preset-providers', { method: 'GET' });
    const presets = data.presets || [];
    const existing = existingProviders || state.info.providers || [];
    els.presetProviderList.innerHTML = presets.map((p) => {
      const added = existing.some((ep) => ep.baseUrl && p.baseUrl && ep.baseUrl.replace(/\/+$/, '') === p.baseUrl.replace(/\/+$/, ''));
      return `<div class="preset-card${added ? ' added' : ''}" data-preset-key="${escapeHtml(p.key)}">
        <span class="preset-card-icon">${p.icon || '🔌'}</span>
        <span class="preset-card-name">${escapeHtml(p.name)}</span>
        <span class="preset-card-url">${escapeHtml(p.baseUrl)}</span>
        <span class="preset-card-status">${added ? "Added" : "Click to add"}</span>
      </div>`;
    }).join('');

    state._presetCache = presets;
  } catch {}
}

function fillFormFromPreset(key) {
  const presets = state._presetCache || [];
  const preset = presets.find((p) => p.key === key);
  if (!preset) return;
  resetProviderForm();
  els.providerName.value = preset.name;
  els.providerType.value = preset.type || 'openai_compatible';
  els.providerType.dispatchEvent(new Event('change'));
  els.providerBaseUrl.value = preset.baseUrl;
  els.providerApiKey.value = '';
  els.providerApiKey.placeholder = '填入 API Key';
  els.providerApiKey.focus();
  state.ui.editAvailableModels = preset.defaultModels.map((m) => ({ id: m, name: m }));
  state.ui.editSelectedModels = [...preset.defaultModels];
  renderModelCheckboxes();
  els.providerFormTitle.textContent = `添加：${preset.name}`;
  els.providerStatus.textContent = '已填充，请输入 API Key 后保存。';
}

async function editProviderById(id) {
  try {
    const data = await apiRequest('/api/providers', { method: 'GET' });
    const p = (data.providers || []).find((x) => x.id === id);
    if (!p) return;
    els.providerEditId.value = p.id;
    els.providerName.value = p.name || '';
    els.providerType.value = p.type;
    els.openaiFields.classList.toggle('hidden', p.type !== 'openai_compatible' && p.type !== 'anthropic');
    els.providerBaseUrl.value = p.baseUrl || '';
    els.providerApiKey.value = '';
    els.providerApiKey.placeholder = p.hasApiKey ? 'Configured (leave blank to keep)' : 'sk-...';
    els.providerTemp.value = p.temperature != null ? p.temperature : '';
    els.providerMaxTokens.value = p.maxTokens != null ? p.maxTokens : '';
    els.providerFormTitle.textContent = `编辑：${p.name}`;
    els.providerCancelBtn.classList.remove('hidden');
    els.providerStatus.textContent = '';
    state.ui.editAvailableModels = p.availableModels || [];
    state.ui.editSelectedModels = [...(p.models || [])];
    renderModelCheckboxes();
  } catch {}
}
window.editProviderById = editProviderById;

async function fetchProviderModels() {
  const editId = els.providerEditId.value;
  els.fetchModelsStatus.textContent = '获取中...';
  try {
    let result;
    if (editId) {
      // Already saved -> use existing route
      result = await apiRequest(`/api/providers/${encodeURIComponent(editId)}/models`, { method: 'GET' });
    } else {
      // Not saved yet -> send form values directly
      const type = els.providerType.value;
      const body = { type };
      if (type === 'openai_compatible') {
        body.baseUrl = els.providerBaseUrl.value.trim();
        body.apiKey = els.providerApiKey.value.trim();
      }
      result = await apiRequest('/api/providers/fetch-models', { method: 'POST', body: JSON.stringify(body) });
    }
    const models = result.models || [];
    state.ui.editAvailableModels = models;
    els.fetchModelsStatus.textContent = `Fetched ${models.length} models`;
    renderModelCheckboxes();
  } catch (error) {
    els.fetchModelsStatus.textContent = `获取失败：${error.message || error}`;
  }
}

function addModelManual() {
  const val = els.providerModelManual.value.trim();
  if (!val) return;
  if (!state.ui.editSelectedModels.includes(val)) {
    state.ui.editSelectedModels.push(val);
  }
  if (!state.ui.editAvailableModels.find((m) => m.id === val)) {
    state.ui.editAvailableModels.push({ id: val, name: val });
  }
  els.providerModelManual.value = '';
  renderModelCheckboxes();
}

function renderModelCheckboxes() {
  const wrap = els.providerModelList;
  const available = state.ui.editAvailableModels || [];
  const selected = state.ui.editSelectedModels || [];
  // Merge: show all available + any selected that aren't in available
  const allIds = new Set(available.map((m) => m.id));
  const extra = selected.filter((id) => !allIds.has(id)).map((id) => ({ id, name: id }));
  const all = [...available, ...extra];
  if (!all.length) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = all.map((m) => {
    const checked = selected.includes(m.id) ? 'checked' : '';
    return `<div class="provider-model-item">
      <input type="checkbox" id="pm_${escapeHtml(m.id)}" value="${escapeHtml(m.id)}" ${checked}>
      <label for="pm_${escapeHtml(m.id)}">${escapeHtml(m.name)}</label>
    </div>`;
  }).join('');
  wrap.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        if (!state.ui.editSelectedModels.includes(cb.value)) state.ui.editSelectedModels.push(cb.value);
      } else {
        state.ui.editSelectedModels = state.ui.editSelectedModels.filter((id) => id !== cb.value);
      }
    });
  });
}

async function toggleProviderById(id) {
  try {
    await apiRequest(`/api/providers/${encodeURIComponent(id)}/toggle`, { method: 'POST', body: '{}' });
    await loadProviderList();
    refreshServiceStatus();
  } catch (error) {
    setStatus(`切换失败：${error.message || error}`);
  }
}
window.toggleProviderById = toggleProviderById;

async function deleteProviderById(id) {
  if (!window.confirm('确认删除该 Provider？')) return;
  try {
    await apiRequest(`/api/providers/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await loadProviderList();
    refreshServiceStatus();
  } catch (error) {
    setStatus(`删除失败：${error.message || error}`);
  }
}
window.deleteProviderById = deleteProviderById;

async function testProviderPopup(id) {
  const providerInfo = (state.info.providers || []).find((p) => p.id === id);
  const isOllama = !providerInfo || providerInfo.type === 'ollama';
  const models = (providerInfo && Array.isArray(providerInfo.models)) ? providerInfo.models : [];

  const modelOptions = models.length
    ? models.map((m) => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('')
    : '<option value="">默认</option>';

  const items = [{ type: 'connect', mode: '', label: '请求连接' }];
  if (isOllama) {
    items.push({ type: 'text', mode: 'flash', label: 'Flash 文字生成' });
    items.push({ type: 'text', mode: 'thinking', label: 'Thinking 文字生成' });
  } else {
    items.push({ type: 'text', mode: 'flash', label: '文字生成' });
    items.push({ type: 'image', mode: '', label: '图片生成' });
  }
  items.push({ type: 'vision', mode: '', label: '图片识别' });

  const dlg = document.createElement('dialog');
  dlg.className = 'access-dialog';
  dlg.innerHTML = `
    <h3>测试连接</h3>
    <div class="setting-row" style="margin:8px 0">
      <label>测试模型（可选）</label>
      <select class="model-select" id="testModelSelect">${modelOptions}</select>
    </div>
    <div class="provider-test-popup-body">
      ${items.map((it) => `<div>${escapeHtml(it.label)} · 待测试</div>`).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn primary" id="runTestBtn" type="button">开始测试</button>
      <button class="btn" id="closeTestBtn" type="button">关闭</button>
    </div>
  `;
  document.body.appendChild(dlg);
  dlg.querySelector('#closeTestBtn').addEventListener('click', () => { dlg.close(); dlg.remove(); });
  dlg.showModal();

  const runTests = async () => {
    const chosenModel = dlg.querySelector('#testModelSelect').value || '';
    const rows = dlg.querySelectorAll('.provider-test-popup-body > div');
    rows.forEach((r, i) => { r.innerHTML = `${escapeHtml(items[i].label)} ...`; });

    const run = async (item, idx) => {
      const modeParam = item.mode ? `&mode=${item.mode}` : '';
      const modelParam = chosenModel ? `&model=${encodeURIComponent(chosenModel)}` : '';
      try {
        const r = await apiRequest(
          `/api/providers/test/${encodeURIComponent(id)}?type=${item.type}${modeParam}${modelParam}`,
          { method: 'GET' }
        );
        let detail = r.message || '';
        if ((item.type === 'text' || item.type === 'vision') && r.content) detail = r.content.slice(0, 80);
        rows[idx].innerHTML = `<span style="color:var(--success)">✓</span> ${escapeHtml(item.label)} ${escapeHtml(detail)}`;
      } catch (error) {
        rows[idx].innerHTML = `<span style="color:var(--danger)">✗</span> ${escapeHtml(item.label)} 失败`;
      }
    };

    await Promise.all(items.map((it, i) => run(it, i)));
  };

  dlg.querySelector('#runTestBtn').addEventListener('click', runTests);
  // Auto-run on open
  runTests();
}
window.testProviderPopup = testProviderPopup;

function updateModelSelectFromProviders(providers) {
  const select = els.modelSelect;
  const enabledProviders = (providers || []).filter((p) => p.enabled);
  let html = '';
  for (const p of enabledProviders) {
    const models = Array.isArray(p.models) && p.models.length ? p.models : ['default'];
    for (const m of models) {
      if (p.type === 'ollama') {
        html += `<option value="${p.id}::${m}::flash">⚡ ${escapeHtml(m)} (Flash)</option>`;
        html += `<option value="${p.id}::${m}::thinking">🧠 ${escapeHtml(m)} (Thinking)</option>`;
      } else {
        html += `<option value="${p.id}::${m}::flash">${escapeHtml(p.name)} · ${escapeHtml(m)}</option>`;
      }
    }
  }
  if (!html) html = '<option value="">无可用模型</option>';
  select.innerHTML = html;
  // Restore previous selection if still valid
  const prevKey = state.ui.selectedProviderId && state.ui.selectedModel && state.ui.chatMode
    ? `${state.ui.selectedProviderId}::${state.ui.selectedModel}::${state.ui.chatMode}` : '';
  if (prevKey && select.querySelector(`option[value="${CSS.escape(prevKey)}"]`)) {
    select.value = prevKey;
  } else if (select.options.length) {
    select.value = select.options[0].value;
    parseModelSelectValue(select.value);
  }
}

function parseModelSelectValue(val) {
  const parts = val.split('::');
  state.ui.selectedProviderId = parts[0] || '';
  state.ui.selectedModel = parts[1] || '';
  state.ui.chatMode = parts[2] || 'flash';
}


async function copyActiveArtifactJson() {
  const artifact = getActiveArtifact();
  if (!artifact) return setStatus('暂无可复制产物。');
  const text = JSON.stringify(artifact.data || {}, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    setStatus('已复制 JSON。');
  } catch (_) {
    fallbackCopy(text);
    setStatus('已复制 JSON（兼容模式）。');
  }
}

function exportActiveAnkiCsv() {
  const artifact = getActiveArtifact();
  if (!artifact || artifact.tool !== 'review_pack') return setStatus('当前产物不是复习包，无法导出 Anki CSV。');
  const cards = Array.isArray(artifact.data?.anki) ? artifact.data.anki : [];
  if (!cards.length) return setStatus('当前复习包无 Anki 数据。');
  const lines = [['front', 'back', 'tags'].join(',')];
  cards.forEach((card) => {
    lines.push([csvEscape(card.front || ''), csvEscape(card.back || ''), csvEscape(Array.isArray(card.tags) ? card.tags.join(' ') : '')].join(','));
  });
  downloadBlob(new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' }), `anki_${timestamp()}.csv`);
  setStatus('Anki CSV 已导出。');
}

function exportActivePdf() {
  const artifact = getActiveArtifact();
  if (!artifact) return setStatus('暂无可导出产物。');
  const popup = window.open('', '_blank');
  if (!popup) return setStatus('请允许浏览器弹窗后重试。');
  popup.document.open();
  popup.document.write(`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><title>${escapeHtml(artifact.title)}</title><link rel="stylesheet" href="/vendor/katex/katex.min.css"><style>body{font-family:'Microsoft YaHei',sans-serif;padding:20px;color:#1f2937;line-height:1.6}.artifact-block{border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin:0 0 10px;background:#fff}</style></head><body><h1>${escapeHtml(artifact.title)}</h1>${els.artifactContent.innerHTML}</body></html>`);
  popup.document.close();
  popup.focus();
  setTimeout(() => popup.print(), 260);
}

async function exportActiveWord() {
  const artifact = getActiveArtifact();
  if (!artifact) return setStatus('暂无可导出产物。');
  if (!window.docx) return setStatus('Word 导出模块未加载。');

  try {
    const { Document, Packer, Paragraph, HeadingLevel } = window.docx;
    const lines = JSON.stringify(artifact.data || {}, null, 2).split('\n').slice(0, 2000);
    const children = [
      new Paragraph({ text: artifact.title || '导出文档', heading: HeadingLevel.TITLE }),
      ...lines.map((line) => new Paragraph({ text: line }))
    ];
    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `${artifact.tool}_${timestamp()}.docx`);
    setStatus('Word 已导出。');
  } catch (error) {
    setStatus(`Word 导出失败：${error.message || error}`);
  }
}

async function apiRequest(url, options) {
  const reqOptions = options || {};
  const headers = new Headers(reqOptions.headers || {});
  if (reqOptions.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (state.token) headers.set('x-access-token', state.token);

  let response;
  try {
    response = await fetch(url, { ...reqOptions, headers });
  } catch (_) {
    throw new Error('网络错误，请确认本地服务已启动。');
  }

  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (_) {
      payload = { message: text };
    }
  }

  if (response.status === 401) {
    askForToken();
    throw new Error('访问口令错误或缺失，已提示重新输入。');
  }

  if (!response.ok) {
    throw new Error(payload.message || payload.error || `请求失败：${response.status}`);
  }

  return payload;
}

function askForToken() {
  const value = window.prompt('Enter ACCESS_TOKEN', state.token || '');
  if (value === null) return;
  state.token = String(value).trim();
  if (state.token) localStorage.setItem(STORAGE_TOKEN_KEY, state.token);
  else localStorage.removeItem(STORAGE_TOKEN_KEY);
}

async function handleFileUpload(file) {
  const name = file.name.toLowerCase();
  const ext = name.includes('.') ? name.split('.').pop() : '';
  if (!ext || !['txt', 'md', 'pdf', 'docx', 'pptx'].includes(ext)) {
    setStatus('仅支持 txt/md/pdf/docx/pptx。');
    return;
  }

  setStatus(`正在提取：${file.name}`);
  try {
    let text = '';
    if (ext === 'txt' || ext === 'md') text = await file.text();
    else if (ext === 'docx') text = await extractDocxText(file);
    else if (ext === 'pptx') text = await extractPptxText(file);
    else text = await extractPdfText(file);

    const session = getActiveSession();
    if (!session) return;
    session.materialsText = String(text || '').trim();
    touchSession(session);
    persistSessionsState();
    const cnCount = countChineseChars(session.materialsText);
    appendChatMessage('user', `Uploaded file: ${file.name} (${session.materialsText.length} chars, ${cnCount} Chinese chars)`);
    renderMessages();
    renderSessionList();
  } catch (error) {
    setStatus(`Extract failed: ${error.message || error}`);
  } finally {
    els.fileInput.value = '';
  }
}

async function extractDocxText(file) {
  if (!window.mammoth || typeof window.mammoth.extractRawText !== 'function') {
    throw new Error('Word 解析模块未加载。');
  }
  const buffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value || '';
}

async function extractPptxText(file) {
  if (!window.JSZip || typeof window.JSZip.loadAsync !== 'function') {
    throw new Error('PPT 解析模块未加载。');
  }
  const buffer = await file.arrayBuffer();
  const zip = await window.JSZip.loadAsync(buffer);
  const slides = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => Number((a.match(/slide(\d+)/i) || [])[1]) - Number((b.match(/slide(\d+)/i) || [])[1]));

  const parts = [];
  for (const slidePath of slides) {
    const xml = await zip.files[slidePath].async('text');
    const texts = [];
    const pattern = /<a:t>([^<]*)<\/a:t>/g;
    let m;
    while ((m = pattern.exec(xml)) !== null) {
      if (m[1] && m[1].trim()) texts.push(m[1]);
    }
    if (texts.length) parts.push(texts.join(' '));
  }
  return parts.join('\n\n');
}

async function extractPdfText(file) {
  const lib = await ensurePdfJs();
  const buffer = await file.arrayBuffer();
  const docTask = lib.getDocument({ data: buffer });
  const pdf = await docTask.promise;
  const parts = [];
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join('');
    if (text.trim()) parts.push(text);
  }
  return parts.join('\n\n');
}

async function ensurePdfJs() {
  if (state.pdfjsLib) return state.pdfjsLib;
  try {
    const mod = await import('/vendor/pdf.min.mjs');
    const lib = mod && typeof mod.getDocument === 'function' ? mod : (mod.default || mod);
    if (!lib || typeof lib.getDocument !== 'function') {
      throw new Error('PDF 模块结构不兼容。');
    }
    state.pdfjsLib = lib;
    return lib;
  } catch (error) {
    throw new Error(`PDF 解析模块加载失败：${error.message || error}`);
  }
}

function renderListLine(label, arr) {
  const list = Array.isArray(arr) ? arr : [];
  if (!list.length) return `<p><strong>${escapeHtml(label)}：</strong>资料未提取</p>`;
  return `<p><strong>${escapeHtml(label)}：</strong>${list.map((item) => renderInlineWithMath(String(item))).join('；')}</p>`;
}

function renderRichTextWithMath(text) {
  const normalized = String(text || '')
    .replace(/\r/g, '')
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$');

  const segments = splitMathSegments(normalized);
  const placeholders = [];
  let merged = '';

  segments.forEach((segment) => {
    if (segment.type === 'text') {
      merged += segment.value;
      return;
    }
    const key = `@@MATH_${placeholders.length}@@`;
    placeholders.push({ key, html: renderMath(segment.value, segment.displayMode, segment.raw) });
    merged += key;
  });

  let html = renderMarkdown(merged);
  placeholders.forEach((item) => {
    html = html.replaceAll(item.key, item.html);
  });
  return html;
}

function renderInlineWithMath(text) {
  const segments = splitMathSegments(String(text || ''));
  return segments.map((segment) => {
    if (segment.type === 'text') return renderInlineMarkdown(segment.value);
    return renderMath(segment.value, segment.displayMode, segment.raw);
  }).join('');
}

function splitMathSegments(text) {
  const input = String(text || '');
  const regex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  const list = [];
  let lastIndex = 0;
  let m;

  while ((m = regex.exec(input)) !== null) {
    if (m.index > lastIndex) list.push({ type: 'text', value: input.slice(lastIndex, m.index) });
    if (typeof m[1] === 'string') list.push({ type: 'math', value: m[1], displayMode: true, raw: `$$${m[1]}$$` });
    else list.push({ type: 'math', value: m[2], displayMode: false, raw: `$${m[2]}$` });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < input.length) list.push({ type: 'text', value: input.slice(lastIndex) });
  return list;
}

function renderMath(latex, displayMode, raw) {
  if (!window.katex || typeof window.katex.renderToString !== 'function') return escapeHtml(raw || latex);
  try {
    return window.katex.renderToString(String(latex || ''), {
      displayMode: Boolean(displayMode),
      throwOnError: false,
      strict: 'ignore'
    });
  } catch (_) {
    return escapeHtml(raw || latex);
  }
}

function renderMarkdown(text) {
  const lines = String(text || '').split('\n');
  const html = [];
  let listMode = '';

  const closeList = () => {
    if (!listMode) return;
    html.push(`</${listMode}>`);
    listMode = '';
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      return;
    }

    let matched = trimmed.match(/^[-*]\s+(.+)$/);
    if (matched) {
      if (listMode !== 'ul') {
        closeList();
        listMode = 'ul';
        html.push('<ul>');
      }
      html.push(`<li>${renderInlineMarkdown(matched[1])}</li>`);
      return;
    }

    matched = trimmed.match(/^\d+\.\s+(.+)$/);
    if (matched) {
      if (listMode !== 'ol') {
        closeList();
        listMode = 'ol';
        html.push('<ol>');
      }
      html.push(`<li>${renderInlineMarkdown(matched[1])}</li>`);
      return;
    }

    closeList();
    if (trimmed.startsWith('### ')) html.push(`<h4>${renderInlineMarkdown(trimmed.slice(4))}</h4>`);
    else if (trimmed.startsWith('## ')) html.push(`<h3>${renderInlineMarkdown(trimmed.slice(3))}</h3>`);
    else if (trimmed.startsWith('# ')) html.push(`<h3>${renderInlineMarkdown(trimmed.slice(2))}</h3>`);
    else html.push(`<p>${renderInlineMarkdown(trimmed)}</p>`);
  });

  closeList();
  return html.join('');
}

function renderInlineMarkdown(text) {
  let out = escapeHtml(String(text || ''));
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  out = out.replace(/\n/g, '<br>');
  return out;
}

function setStatus(text) {
  els.fileStatus.textContent = String(text || '');
}

function countQuestionTotal(bank) {
  const a = Array.isArray(bank.mcq) ? bank.mcq.length : 0;
  const b = Array.isArray(bank.blank) ? bank.blank.length : 0;
  const c = Array.isArray(bank.short_answer) ? bank.short_answer.length : 0;
  const d = Array.isArray(bank.comprehensive) ? bank.comprehensive.length : 0;
  return a + b + c + d;
}

function toolName(tool) {
  if (tool === 'paper_report') return '论文生成器';
  return '期末复习包';
}

function formatTime(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const pad = (n) => String(n).padStart(2, '0');
  if (sameDay) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function countChineseChars(text) {
  const m = String(text || '').match(/[\u3400-\u9fff]/g);
  return m ? m.length : 0;
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

function csvEscape(text) {
  return `"${String(text || '').replace(/"/g, '""')}"`;
}

function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── MCP Settings ── */

async function loadMcpServerList() {
  if (!els.mcpServerListWrap) return;
  try {
    const data = await apiRequest('/api/mcp-servers', { method: 'GET' });
    const servers = data.servers || [];
    renderMcpServerList(servers);
    renderPresetMcpServers(servers);
  } catch {}
}

function renderMcpServerList(servers) {
  const wrap = els.mcpServerListWrap;
  if (!servers.length) { wrap.innerHTML = '<p class="muted">暂无 MCP 服务</p>'; return; }
  wrap.innerHTML = servers.map((s) => {
    const toolCount = s.toolCount || 0;
    const statusText = s.status === 'connected' ? `Connected · ${toolCount} tools` : 'Disconnected';
    return `
    <div class="provider-card${s.enabled ? '' : ' disabled'}">
      <div class="provider-card-info">
        <div class="provider-card-name">${escapeHtml(s.name)}</div>
        <div class="provider-card-meta">${escapeHtml(s.command)} ${escapeHtml((s.args || []).join(' '))} · ${statusText}${s.enabled ? '' : ' · 已禁用'}</div>
      </div>
      <div class="provider-card-actions">
        <button onclick="toggleMcpServer('${escapeHtml(s.id)}')">${s.enabled ? '禁用' : '启用'}</button>
        <button onclick="editMcpServer('${escapeHtml(s.id)}')">编辑</button>
        <button onclick="deleteMcpServer('${escapeHtml(s.id)}')">删除</button>
      </div>
    </div>`;
  }).join('');
}

async function renderPresetMcpServers(existingServers) {
  if (!els.presetMcpList) return;
  try {
    const data = await apiRequest('/api/preset-mcp-servers', { method: 'GET' });
    const presets = data.presets || [];
    const existing = existingServers || [];
    els.presetMcpList.innerHTML = presets.map((p) => {
      const added = existing.some((s) => s.name === p.name);
      return `<div class="preset-card${added ? ' added' : ''}" data-preset-key="${escapeHtml(p.key)}">
        <span class="preset-card-icon">${p.icon || '🔌'}</span>
        <span class="preset-card-name">${escapeHtml(p.name)}</span>
        <span class="preset-card-url">${escapeHtml(p.desc || '')}</span>
        <span class="preset-card-status">${added ? "Added" : "Click to add"}</span>
      </div>`;
    }).join('');
    state._mcpPresetCache = presets;
  } catch {}
}

function fillMcpFromPreset(key) {
  const presets = state._mcpPresetCache || [];
  const preset = presets.find((p) => p.key === key);
  if (!preset) return;
  resetMcpForm();
  els.mcpName.value = preset.name;
  els.mcpCommand.value = preset.command;
  els.mcpArgs.value = (preset.args || []).join(' ');
  els.mcpEnv.value = '';
  els.mcpFormTitle.textContent = `添加：${preset.name}`;
  els.mcpStatus.textContent = '已填充，可直接保存。';
}

function resetMcpForm() {
  if (els.mcpEditId) els.mcpEditId.value = '';
  if (els.mcpName) els.mcpName.value = '';
  if (els.mcpCommand) els.mcpCommand.value = '';
  if (els.mcpArgs) els.mcpArgs.value = '';
  if (els.mcpEnv) els.mcpEnv.value = '';
  if (els.mcpFormTitle) els.mcpFormTitle.textContent = '添加 MCP 服务';
  if (els.mcpCancelBtn) els.mcpCancelBtn.classList.add('hidden');
  if (els.mcpStatus) els.mcpStatus.textContent = '';
}

async function saveMcpServer() {
  const name = (els.mcpName.value || '').trim();
  const command = (els.mcpCommand.value || '').trim();
  const argsStr = (els.mcpArgs.value || '').trim();
  if (!name || !command) { els.mcpStatus.textContent = '名称和命令不能为空'; return; }
  const args = argsStr ? argsStr.split(/\s+/) : [];
  const envStr = (els.mcpEnv.value || '').trim();
  const env = {};
  if (envStr) {
    envStr.split(/\s+/).forEach(pair => {
      const idx = pair.indexOf('=');
      if (idx > 0) env[pair.slice(0, idx)] = pair.slice(idx + 1);
    });
  }
  const body = { name, command, args, env };
  const editId = els.mcpEditId.value;
  if (editId) body.id = editId;
  els.mcpStatus.textContent = '保存中...';
  try {
    await apiRequest('/api/mcp-servers', { method: 'POST', body: JSON.stringify(body) });
    els.mcpStatus.textContent = '已保存';
    resetMcpForm();
    await loadMcpServerList();
  } catch (e) {
    els.mcpStatus.textContent = `保存失败：${e.message || e}`;
  }
}

async function toggleMcpServer(id) {
  try {
    await apiRequest(`/api/mcp-servers/${encodeURIComponent(id)}/toggle`, { method: 'POST' });
    await loadMcpServerList();
  } catch {}
}
window.toggleMcpServer = toggleMcpServer;

async function deleteMcpServer(id) {
  if (!window.confirm('确认删除该 MCP 服务？')) return;
  try {
    await apiRequest(`/api/mcp-servers/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await loadMcpServerList();
  } catch {}
}
window.deleteMcpServer = deleteMcpServer;

async function editMcpServer(id) {
  try {
    const data = await apiRequest('/api/mcp-servers', { method: 'GET' });
    const s = (data.servers || []).find((x) => x.id === id);
    if (!s) return;
    els.mcpEditId.value = s.id;
    els.mcpName.value = s.name || '';
    els.mcpCommand.value = s.command || '';
    els.mcpArgs.value = (s.args || []).join(' ');
    els.mcpEnv.value = Object.entries(s.env || {}).map(([k, v]) => `${k}=${v}`).join(' ');
    els.mcpFormTitle.textContent = `编辑：${s.name}`;
    els.mcpCancelBtn.classList.remove('hidden');
    els.mcpStatus.textContent = '';
  } catch {}
}
window.editMcpServer = editMcpServer;

async function testMcpServer() {
  const command = (els.mcpCommand.value || '').trim();
  const argsStr = (els.mcpArgs.value || '').trim();
  if (!command) { els.mcpStatus.textContent = '请输入命令'; return; }
  const args = argsStr ? argsStr.split(/\s+/) : [];
  els.mcpStatus.textContent = '测试连接中...';
  try {
    const data = await apiRequest('/api/mcp-servers/test-connection', {
      method: 'POST',
      body: JSON.stringify({ command, args })
    });
    const tools = data.tools || [];
    els.mcpStatus.textContent = `测试成功：发现 ${tools.length} 个工具：${tools.map(t => t.name).join(', ')}`;
  } catch (e) {
    els.mcpStatus.textContent = `测试失败：${e.message || e}`;
  }
}

/* ── MCP Quick Panel (composer bar) ── */

async function refreshMcpQuickPanel() {
  if (!els.mcpQuickList) return;
  try {
    const data = await apiRequest('/api/mcp-servers', { method: 'GET' });
    const servers = data.servers || [];
    if (!servers.length) {
      els.mcpQuickList.innerHTML = '<span class="muted" style="padding:6px 10px;display:block">暂无可用 MCP 服务，请在设置页添加</span>';
      updateMcpBtnBadge(0);
      return;
    }
    els.mcpQuickList.innerHTML = servers.map(s => {
      return `<label class="mcp-quick-item">
        <input type="checkbox" data-mcp-id="${escapeHtml(s.id)}" ${s.enabled ? 'checked' : ''}>
        <span class="mcp-quick-name">${escapeHtml(s.name)}</span>
        <span class="mcp-quick-status muted">${s.status === "connected" ? "Connected" : ""}</span>
      </label>`;
    }).join('');
    updateMcpBtnBadge(servers.filter(s => s.enabled).length);
  } catch {}
}

function updateMcpBtnBadge(count) {
  if (!els.toggleMcpBtn) return;
  els.toggleMcpBtn.textContent = count > 0 ? `🔌 MCP (${count})` : '🔌 MCP';
  els.toggleMcpBtn.classList.toggle('active-tool', count > 0);
}

if (els.mcpQuickList) {
  els.mcpQuickList.addEventListener('change', async (e) => {
    const checkbox = e.target.closest('input[data-mcp-id]');
    if (!checkbox) return;
    const id = checkbox.dataset.mcpId;
    try {
      await apiRequest(`/api/mcp-servers/${encodeURIComponent(id)}/toggle`, { method: 'POST' });
      await refreshMcpQuickPanel();
    } catch {}
  });
}

// Load initial badge on boot
refreshMcpQuickPanel();

/* 鈹€鈹€ Knowledge Base Settings 鈹€鈹€ */

let _kbCache = [];

function getEnabledKbIds() {
  return _kbCache.filter(kb => kb.enabled).map(kb => kb.id);
}

async function loadKbList() {
  if (!els.kbListWrap) return;
  try {
    const data = await apiRequest('/api/knowledge-bases', { method: 'GET' });
    _kbCache = data.knowledgeBases || [];
    renderKbList(_kbCache);
    updateKbBtnBadge(_kbCache.filter(kb => kb.enabled).length);
  } catch {}
}

function renderKbList(list) {
  const wrap = els.kbListWrap;
  if (!list.length) { wrap.innerHTML = '<p class="muted">暂无知识库</p>'; return; }
  wrap.innerHTML = list.map(kb => {
    return `
    <div class="provider-card${kb.enabled ? '' : ' disabled'}">
      <div class="provider-card-info">
        <div class="provider-card-name">${escapeHtml(kb.name)}</div>
        <div class="provider-card-meta">${kb.charCount} 字符${kb.enabled ? '' : ' · 已禁用'}</div>
      </div>
      <div class="provider-card-actions">
        <button onclick="editKb('${escapeHtml(kb.id)}')">编辑</button>
        <button onclick="toggleKb('${escapeHtml(kb.id)}')">${kb.enabled ? '禁用' : '启用'}</button>
        <button onclick="deleteKb('${escapeHtml(kb.id)}')">删除</button>
      </div>
    </div>`;
  }).join('');
}

function resetKbForm() {
  if (els.kbEditId) els.kbEditId.value = '';
  if (els.kbName) els.kbName.value = '';
  if (els.kbContent) els.kbContent.value = '';
  if (els.kbFormTitle) els.kbFormTitle.textContent = '添加知识库';
  if (els.kbCancelBtn) els.kbCancelBtn.classList.add('hidden');
  if (els.kbStatus) els.kbStatus.textContent = '';
  if (els.kbUploadStatus) els.kbUploadStatus.textContent = '';
}

async function saveKb() {
  const name = (els.kbName.value || '').trim();
  const content = (els.kbContent.value || '').trim();
  if (!name) { els.kbStatus.textContent = '请输入名称'; return; }
  if (!content) { els.kbStatus.textContent = '请输入内容或上传文件'; return; }
  const body = { name, content };
  const editId = els.kbEditId.value;
  if (editId) body.id = editId;
  els.kbStatus.textContent = '保存中...';
  try {
    await apiRequest('/api/knowledge-bases', { method: 'POST', body: JSON.stringify(body) });
    els.kbStatus.textContent = '已保存';
    resetKbForm();
    await loadKbList();
  } catch (e) {
    els.kbStatus.textContent = `保存失败：${e.message || e}`;
  }
}

async function uploadKbFile(file) {
  const name = (els.kbName.value || '').trim() || file.name.replace(/\.[^.]+$/, '');
  els.kbUploadStatus.textContent = `正在上传：${file.name}`;
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    const headers = {};
    if (state.token) headers['x-access-token'] = state.token;
    const resp = await fetch('/api/knowledge-bases/upload', { method: 'POST', headers, body: formData });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${resp.status}`);
    }
    const data = await resp.json();
    els.kbUploadStatus.textContent = `上传完成：${data.charCount} 字符`;
    resetKbForm();
    await loadKbList();
  } catch (e) {
    els.kbUploadStatus.textContent = `上传失败：${e.message || e}`;
  }
}

async function toggleKb(id) {
  try {
    await apiRequest(`/api/knowledge-bases/${encodeURIComponent(id)}/toggle`, { method: 'POST' });
    await loadKbList();
  } catch {}
}
window.toggleKb = toggleKb;

async function deleteKb(id) {
  if (!window.confirm('确认删除知识库？')) return;
  try {
    await apiRequest(`/api/knowledge-bases/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await loadKbList();
  } catch {}
}
window.deleteKb = deleteKb;

async function editKb(id) {
  try {
    const data = await apiRequest(`/api/knowledge-bases/${encodeURIComponent(id)}/content`, { method: 'GET' });
    if (!data) return;
    els.kbEditId.value = data.id;
    els.kbName.value = data.name || '';
    els.kbContent.value = data.content || '';
    els.kbFormTitle.textContent = `编辑：${data.name}`;
    els.kbCancelBtn.classList.remove('hidden');
    els.kbStatus.textContent = '';
  } catch {}
}
window.editKb = editKb;

/* ── Knowledge Base Quick Panel ── */

async function refreshKbQuickPanel() {
  if (!els.kbQuickList) return;
  try {
    const data = await apiRequest('/api/knowledge-bases', { method: 'GET' });
    const list = data.knowledgeBases || [];
    _kbCache = list;
    if (!list.length) {
      els.kbQuickList.innerHTML = '<span class="muted" style="padding:6px 10px;display:block">暂无知识库，前往设置页添加</span>';
      updateKbBtnBadge(0);
      return;
    }
    els.kbQuickList.innerHTML = list.map(kb => {
      return `<label class="mcp-quick-item">
        <input type="checkbox" data-kb-id="${escapeHtml(kb.id)}" ${kb.enabled ? 'checked' : ''}>
        <span class="mcp-quick-name">${escapeHtml(kb.name)}</span>
        <span class="mcp-quick-status muted">${kb.charCount} chars</span>
      </label>`;
    }).join('');
    updateKbBtnBadge(list.filter(kb => kb.enabled).length);
  } catch {}
}

function updateKbBtnBadge(count) {
  if (!els.toggleKbBtn) return;
  els.toggleKbBtn.textContent = count > 0 ? ` 📚 知识库 (${count})` : ' 📚 知识库';
  els.toggleKbBtn.classList.toggle('active-tool', count > 0);
}

if (els.kbQuickList) {
  els.kbQuickList.addEventListener('change', async (e) => {
    const checkbox = e.target.closest('input[data-kb-id]');
    if (!checkbox) return;
    const id = checkbox.dataset.kbId;
    try {
      await apiRequest(`/api/knowledge-bases/${encodeURIComponent(id)}/toggle`, { method: 'POST' });
      await refreshKbQuickPanel();
    } catch {}
  });
}

refreshKbQuickPanel();

boot();
