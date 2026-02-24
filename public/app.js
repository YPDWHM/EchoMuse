'use strict';

const STORAGE_TOKEN_KEY = 'chatbox_access_token_v3';
const STORAGE_SESSIONS_KEY = 'chatbox_sessions_v3';
const STORAGE_ACTIVE_KEY = 'chatbox_active_session_v3';
const STORAGE_AVATARS_KEY = 'chatbox_avatars_v1';
const STORAGE_SETTINGS_KEY = 'chatbox_settings_v1';
const STORAGE_CLIENT_ID_KEY = 'chatbox_client_id_v1';
const MIN_CN_CHARS = 800;
const MAX_SESSIONS = 30;
const MAX_ARTIFACTS_PER_SESSION = 10;

const CLIENT_INSTANCE_ID = getOrCreateClientInstanceId();

function getOrCreateClientInstanceId() {
  try {
    const existing = String(localStorage.getItem(STORAGE_CLIENT_ID_KEY) || '').trim();
    if (existing && existing.length <= 128) return existing;
    const generated = createClientInstanceId();
    localStorage.setItem(STORAGE_CLIENT_ID_KEY, generated);
    return generated;
  } catch (_) {
    return createClientInstanceId();
  }
}

function createClientInstanceId() {
  try {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return `web-${window.crypto.randomUUID()}`;
    }
  } catch (_) {}
  return `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const DEFAULT_SETTINGS = {
  language: 'zh-CN',
  globalDefense: false,
  translateEnabled: false,
  translateFrom: 'auto',
  translateTo: 'zh-CN',
  fontSize: 14,
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
  chatShowTokenUsage: false,
  chatShowFirstTokenLatency: false,
  chatMarkdownRender: true,
  chatLatexRender: true,
  chatSpellcheck: false,
  chatAutoTitle: true,
  chatAutoPreviewArtifact: true
};

const FONT_SIZE_MAP = {
  sm: 13,
  md: 14,
  lg: 16,
  xl: 18
};

const UI_PACK_ZH = {
  newSession: '新建会话',
  send: '发送',
  sessions: '会话',
  contacts: '联系人',
  searchSessionsPlaceholder: '搜索会话',
  chatPlaceholder: '输入问题，Ctrl+Enter 发送',
  settingsTitle: '设置',
  navGeneral: '通用',
  navProvider: '模型',
  navMcp: 'MCP 工具',
  navKnowledge: '知识库',
  closeSettings: '返回聊天',
  generalTitle: '通用设置',
  displaySettings: '显示设置',
  uiLanguage: '界面语言',
  globalDefense: '全局防御',
  globalDefenseDesc: '用于降低提示注入与不安全输出风险',
  translateEnabled: '启用翻译',
  translateEnabledDesc: '仅在聊天内容中生效（含角色卡/记忆等上下文）',
  translateDirection: '翻译方向',
  fontSize: '字体大小',
  theme: '主题',
  themeSystem: '跟随系统',
  themeLight: '浅色',
  themeDark: '深色',
  autoDetect: '自动检测'
};

const UI_PACK_EN = {
  newSession: 'New Chat',
  send: 'Send',
  sessions: 'Chats',
  contacts: 'Contacts',
  searchSessionsPlaceholder: 'Search chats',
  chatPlaceholder: 'Type a message, Ctrl+Enter to send',
  settingsTitle: 'Settings',
  navGeneral: 'General',
  navProvider: 'Models',
  navMcp: 'MCP Tools',
  navKnowledge: 'Knowledge Base',
  closeSettings: 'Back to Chat',
  generalTitle: 'General Settings',
  displaySettings: 'Display',
  uiLanguage: 'Interface Language',
  globalDefense: 'Global Defense',
  globalDefenseDesc: 'Reduce prompt injection and unsafe output risk',
  translateEnabled: 'Enable Translation',
  translateEnabledDesc: 'Only affects chat content (including avatar cards/memory context)',
  translateDirection: 'Translation Direction',
  fontSize: 'Font Size',
  theme: 'Theme',
  themeSystem: 'Follow System',
  themeLight: 'Light',
  themeDark: 'Dark',
  autoDetect: 'Auto Detect'
};

const UI_PACK_JA = {
  newSession: '新しい会話',
  send: '送信',
  sessions: '会話',
  contacts: '連絡先',
  searchSessionsPlaceholder: '会話を検索',
  chatPlaceholder: 'メッセージを入力、Ctrl+Enter で送信',
  settingsTitle: '設定',
  navGeneral: '一般',
  navProvider: 'モデル',
  navMcp: 'MCP ツール',
  navKnowledge: 'ナレッジベース',
  closeSettings: 'チャットに戻る',
  generalTitle: '一般設定',
  displaySettings: '表示',
  uiLanguage: '表示言語',
  globalDefense: '全体防御',
  globalDefenseDesc: 'プロンプトインジェクションや危険な出力のリスクを低減',
  translateEnabled: '翻訳を有効化',
  translateEnabledDesc: 'チャット内容にのみ適用（角色カード/記憶コンテキストを含む）',
  translateDirection: '翻訳方向',
  fontSize: '文字サイズ',
  theme: 'テーマ',
  themeSystem: 'システムに従う',
  themeLight: 'ライト',
  themeDark: 'ダーク',
  autoDetect: '自動検出'
};

const UI_PACK_KO = {
  newSession: '새 대화',
  send: '보내기',
  sessions: '대화',
  contacts: '연락처',
  searchSessionsPlaceholder: '대화 검색',
  chatPlaceholder: '메시지를 입력하세요, Ctrl+Enter 전송',
  settingsTitle: '설정',
  navGeneral: '일반',
  navProvider: '모델',
  navMcp: 'MCP 도구',
  navKnowledge: '지식베이스',
  closeSettings: '채팅으로 돌아가기',
  generalTitle: '일반 설정',
  displaySettings: '표시',
  uiLanguage: '인터페이스 언어',
  globalDefense: '전역 방어',
  globalDefenseDesc: '프롬프트 인젝션 및 위험한 출력 위험 감소',
  translateEnabled: '번역 사용',
  translateEnabledDesc: '채팅 내용에만 적용 (캐릭터 카드/메모리 문맥 포함)',
  translateDirection: '번역 방향',
  fontSize: '글자 크기',
  theme: '테마',
  themeSystem: '시스템 따라가기',
  themeLight: '라이트',
  themeDark: '다크',
  autoDetect: '자동 감지'
};

const UI_PACK_FR = {
  newSession: 'Nouveau chat',
  send: 'Envoyer',
  sessions: 'Chats',
  contacts: 'Contacts',
  searchSessionsPlaceholder: 'Rechercher des chats',
  chatPlaceholder: 'Saisir un message, Ctrl+Entrée pour envoyer',
  settingsTitle: 'Paramètres',
  navGeneral: 'Général',
  navProvider: 'Modèles',
  navMcp: 'Outils MCP',
  navKnowledge: 'Base de connaissances',
  closeSettings: 'Retour au chat',
  generalTitle: 'Paramètres généraux',
  displaySettings: 'Affichage',
  uiLanguage: 'Langue de l’interface',
  globalDefense: 'Protection globale',
  globalDefenseDesc: 'Réduit les risques d’injection de prompt et de sorties dangereuses',
  translateEnabled: 'Activer la traduction',
  translateEnabledDesc: 'Agit surtout sur le contenu du chat (cartes/avatar/mémoire compris)',
  translateDirection: 'Sens de traduction',
  fontSize: 'Taille de police',
  theme: 'Thème',
  themeSystem: 'Suivre le système',
  themeLight: 'Clair',
  themeDark: 'Sombre',
  autoDetect: 'Détection auto'
};

const UI_PACK_DE = {
  newSession: 'Neuer Chat',
  send: 'Senden',
  sessions: 'Chats',
  contacts: 'Kontakte',
  searchSessionsPlaceholder: 'Chats suchen',
  chatPlaceholder: 'Nachricht eingeben, Strg+Enter zum Senden',
  settingsTitle: 'Einstellungen',
  navGeneral: 'Allgemein',
  navProvider: 'Modelle',
  navMcp: 'MCP-Tools',
  navKnowledge: 'Wissensbasis',
  closeSettings: 'Zurück zum Chat',
  generalTitle: 'Allgemeine Einstellungen',
  displaySettings: 'Anzeige',
  uiLanguage: 'Oberflächensprache',
  globalDefense: 'Globaler Schutz',
  globalDefenseDesc: 'Reduziert Risiken durch Prompt-Injection und unsichere Ausgaben',
  translateEnabled: 'Übersetzung aktivieren',
  translateEnabledDesc: 'Wirkt hauptsächlich auf Chat-Inhalte (inkl. Rollenkarte/Speicher)',
  translateDirection: 'Übersetzungsrichtung',
  fontSize: 'Schriftgröße',
  theme: 'Thema',
  themeSystem: 'System folgen',
  themeLight: 'Hell',
  themeDark: 'Dunkel',
  autoDetect: 'Automatisch erkennen'
};

const UI_PACK_ES = {
  newSession: 'Nuevo chat',
  send: 'Enviar',
  sessions: 'Chats',
  contacts: 'Contactos',
  searchSessionsPlaceholder: 'Buscar chats',
  chatPlaceholder: 'Escribe un mensaje, Ctrl+Enter para enviar',
  settingsTitle: 'Configuración',
  navGeneral: 'General',
  navProvider: 'Modelos',
  navMcp: 'Herramientas MCP',
  navKnowledge: 'Base de conocimiento',
  closeSettings: 'Volver al chat',
  generalTitle: 'Configuración general',
  displaySettings: 'Pantalla',
  uiLanguage: 'Idioma de la interfaz',
  globalDefense: 'Defensa global',
  globalDefenseDesc: 'Reduce riesgos de prompt injection y salidas inseguras',
  translateEnabled: 'Activar traducción',
  translateEnabledDesc: 'Afecta principalmente al chat (incluye tarjeta de rol/memoria)',
  translateDirection: 'Dirección de traducción',
  fontSize: 'Tamaño de fuente',
  theme: 'Tema',
  themeSystem: 'Seguir sistema',
  themeLight: 'Claro',
  themeDark: 'Oscuro',
  autoDetect: 'Detección automática'
};

const UI_PACK_RU = {
  newSession: 'Новый чат',
  send: 'Отправить',
  sessions: 'Чаты',
  contacts: 'Контакты',
  searchSessionsPlaceholder: 'Поиск чатов',
  chatPlaceholder: 'Введите сообщение, Ctrl+Enter для отправки',
  settingsTitle: 'Настройки',
  navGeneral: 'Общие',
  navProvider: 'Модели',
  navMcp: 'Инструменты MCP',
  navKnowledge: 'База знаний',
  closeSettings: 'Назад в чат',
  generalTitle: 'Общие настройки',
  displaySettings: 'Отображение',
  uiLanguage: 'Язык интерфейса',
  globalDefense: 'Глобальная защита',
  globalDefenseDesc: 'Снижает риск prompt injection и небезопасных ответов',
  translateEnabled: 'Включить перевод',
  translateEnabledDesc: 'В основном влияет на содержимое чата (включая карту роли/память)',
  translateDirection: 'Направление перевода',
  fontSize: 'Размер шрифта',
  theme: 'Тема',
  themeSystem: 'Как в системе',
  themeLight: 'Светлая',
  themeDark: 'Тёмная',
  autoDetect: 'Автоопределение'
};

const UI_PACKS = {
  'zh-CN': UI_PACK_ZH,
  'en-US': UI_PACK_EN,
  'ja-JP': UI_PACK_JA,
  'ko-KR': UI_PACK_KO,
  'fr-FR': UI_PACK_FR,
  'de-DE': UI_PACK_DE,
  'es-ES': UI_PACK_ES,
  'ru-RU': UI_PACK_RU
};

const UI_PACK_EXTRAS = {
  'zh-CN': {
    basicSettings: '基础设置',
    mobileAccess: '手机访问',
    viewLanQr: '查看局域网地址 / 二维码',
    importTavernCard: '🃏 导入酒馆卡片',
    newGroup: '新建群组',
    accessDialogTitle: '手机访问',
    close: '关闭',
    groupDialogTitle: '新建群组',
    connected: '已连接',
    disconnected: '未连接',
    startLocalService: '请先启动本地服务',
    serviceUnavailable: '服务不可用',
    accessTokenLabel: '访问口令',
    accessTokenPlaceholder: '留空则无口令',
    dataSettingsGroupTitle: '数据设置',
    exportArtifactsBtn: '导出产物',
    clearCurrentSessionBtn: '清空当前会话',
    proxyGroupTitle: '网络代理',
    proxyEnableLabel: '启用代理',
    proxyEnableDesc: '默认关闭，开启后填写代理信息',
    proxyTypeLabel: '代理类型',
    proxyHostLabel: '代理主机',
    proxyPortLabel: '代理端口',
    proxyUserLabel: '代理用户名',
    proxyPassLabel: '代理密码',
    chatSettingsSectionTitle: '对话设置',
    chatContextGroupTitle: '上下文管理',
    chatContextLimitLabel: '上下文的消息数量上限',
    chatUnlimited: '不限制',
    chatContextNote: '控制发送给模型的历史消息条数；越大越完整，但越慢。',
    chatGenerationGroupTitle: '生成参数',
    chatTemperatureSettingLabel: '温度（Temperature）',
    chatTopPSettingLabel: 'Top P',
    useDefault: '使用默认',
    chatStreamOutputTitle: '流式输出',
    chatStreamOutputDesc: '开启后逐字显示回复，关闭后等待完整回复再显示',
    chatDisplayGroupTitle: '显示',
    chatShowTimestampTitle: '显示消息的时间戳',
    chatShowModelTitle: '显示模型名称',
    chatShowCharCountTitle: '显示消息的字数统计',
    chatShowTokenUsageTitle: '显示消息的 token 消耗（估算）',
    chatShowFirstTokenLatencyTitle: '显示首字耗时（TTFT）',
    chatMarkdownRenderTitle: 'Markdown 渲染',
    chatMarkdownRenderDesc: '关闭后助手回复按纯文本显示',
    chatLatexRenderTitle: 'LaTeX 公式渲染',
    chatLatexRenderDesc: '需要开启 Markdown 渲染',
    chatSpellcheckTitle: '拼写检查（输入框）',
    chatFeatureGroupTitle: '功能',
    chatAutoTitleTitle: '自动生成聊天标题',
    chatAutoTitleDesc: '根据第一条用户消息自动命名会话',
    chatAutoPreviewArtifactTitle: '自动预览生成物（Artifacts）',
    chatAutoPreviewArtifactDesc: '工具生成完成后自动展开卡片预览',
    avatarGroupTitle: '头像',
    avatarPreviewUser: '用户',
    avatarPreviewAi: 'AI',
    avatarUserLabel: '用户头像',
    avatarAiLabel: 'AI 头像',
    uploadImage: '上传图片',
    save: '保存',
    resetDefault: '恢复默认',
    avatarUserPlaceholder: 'emoji 如 😀',
    avatarAiPlaceholder: 'emoji 如 🤖',
    labelUnset: '未设置',
    labelMessagesUnit: '条'
  },
  'en-US': {
    basicSettings: 'Basic Settings',
    mobileAccess: 'Mobile Access',
    viewLanQr: 'View LAN Address / QR Code',
    importTavernCard: '🃏 Import Tavern Card',
    newGroup: 'New Group',
    accessDialogTitle: 'Mobile Access',
    close: 'Close',
    groupDialogTitle: 'Create Group',
    connected: 'Connected',
    disconnected: 'Disconnected',
    startLocalService: 'Please start the local service first',
    serviceUnavailable: 'Service unavailable',
    accessTokenLabel: 'Access Token',
    accessTokenPlaceholder: 'Leave empty to disable token',
    dataSettingsGroupTitle: 'Data Settings',
    exportArtifactsBtn: 'Export Artifacts',
    clearCurrentSessionBtn: 'Clear Current Session',
    proxyGroupTitle: 'Network Proxy',
    proxyEnableLabel: 'Enable Proxy',
    proxyEnableDesc: 'Disabled by default. Fill in proxy details after enabling.',
    proxyTypeLabel: 'Proxy Type',
    proxyHostLabel: 'Proxy Host',
    proxyPortLabel: 'Proxy Port',
    proxyUserLabel: 'Proxy Username',
    proxyPassLabel: 'Proxy Password',
    chatSettingsSectionTitle: 'Chat Settings',
    chatContextGroupTitle: 'Context Management',
    chatContextLimitLabel: 'Context message limit',
    chatUnlimited: 'Unlimited',
    chatContextNote: 'Controls how many recent messages are sent to the model. More context improves continuity but may slow responses.',
    chatGenerationGroupTitle: 'Generation Parameters',
    chatTemperatureSettingLabel: 'Temperature',
    chatTopPSettingLabel: 'Top P',
    useDefault: 'Use default',
    chatStreamOutputTitle: 'Streaming output',
    chatStreamOutputDesc: 'Show response incrementally while generating',
    chatDisplayGroupTitle: 'Display',
    chatShowTimestampTitle: 'Show message timestamps',
    chatShowModelTitle: 'Show model name',
    chatShowCharCountTitle: 'Show character count',
    chatShowTokenUsageTitle: 'Show token usage (estimated)',
    chatShowFirstTokenLatencyTitle: 'Show first-token latency (TTFT)',
    chatMarkdownRenderTitle: 'Markdown rendering',
    chatMarkdownRenderDesc: 'Render assistant replies with markdown styling',
    chatLatexRenderTitle: 'LaTeX rendering',
    chatLatexRenderDesc: 'Requires Markdown rendering',
    chatSpellcheckTitle: 'Spellcheck (input box)',
    chatFeatureGroupTitle: 'Features',
    chatAutoTitleTitle: 'Auto-generate chat title',
    chatAutoTitleDesc: 'Name conversations from the first user message',
    chatAutoPreviewArtifactTitle: 'Auto-preview artifacts',
    chatAutoPreviewArtifactDesc: 'Expand tool result preview automatically after generation',
    avatarGroupTitle: 'Avatars',
    avatarPreviewUser: 'User',
    avatarPreviewAi: 'AI',
    avatarUserLabel: 'User Avatar',
    avatarAiLabel: 'AI Avatar',
    uploadImage: 'Upload Image',
    save: 'Save',
    resetDefault: 'Reset Default',
    avatarUserPlaceholder: 'emoji e.g. 😀',
    avatarAiPlaceholder: 'emoji e.g. 🤖',
    labelUnset: 'Unset',
    labelMessagesUnit: 'msgs'
  },
  'ja-JP': {
    basicSettings: '基本設定',
    mobileAccess: 'スマホアクセス',
    viewLanQr: 'LAN アドレス / QR コードを見る',
    importTavernCard: '🃏 酒館カードを読み込む',
    newGroup: '新しいグループ',
    accessDialogTitle: 'スマホアクセス',
    close: '閉じる',
    groupDialogTitle: '新規グループ',
    connected: '接続済み',
    disconnected: '未接続',
    startLocalService: '先にローカルサービスを起動してください',
    serviceUnavailable: 'サービスを利用できません',
    accessTokenLabel: 'アクセス口令',
    accessTokenPlaceholder: '空欄で口令なし',
    dataSettingsGroupTitle: 'データ設定',
    exportArtifactsBtn: '生成物をエクスポート',
    clearCurrentSessionBtn: '現在の会話をクリア',
    proxyGroupTitle: 'ネットワークプロキシ',
    proxyEnableLabel: 'プロキシを有効化',
    proxyEnableDesc: '既定では無効です。有効化後にプロキシ情報を入力してください。',
    proxyTypeLabel: 'プロキシ種別',
    proxyHostLabel: 'プロキシホスト',
    proxyPortLabel: 'プロキシポート',
    proxyUserLabel: 'プロキシユーザー名',
    proxyPassLabel: 'プロキシパスワード',
    chatSettingsSectionTitle: 'チャット設定',
    chatContextGroupTitle: 'コンテキスト管理',
    chatContextLimitLabel: 'コンテキストのメッセージ数上限',
    chatUnlimited: '無制限',
    chatContextNote: 'モデルに送る履歴メッセージ数を制御します。多いほど文脈は保たれますが、遅くなる場合があります。',
    chatGenerationGroupTitle: '生成パラメータ',
    chatTemperatureSettingLabel: '温度（Temperature）',
    chatTopPSettingLabel: 'Top P',
    useDefault: 'デフォルトを使用',
    chatStreamOutputTitle: 'ストリーミング出力',
    chatStreamOutputDesc: '生成中に返信を逐次表示します',
    chatDisplayGroupTitle: '表示',
    chatShowTimestampTitle: 'メッセージ時刻を表示',
    chatShowModelTitle: 'モデル名を表示',
    chatShowCharCountTitle: '文字数を表示',
    chatShowTokenUsageTitle: 'トークン消費を表示（推定）',
    chatShowFirstTokenLatencyTitle: '初回トークン遅延を表示（TTFT）',
    chatMarkdownRenderTitle: 'Markdown レンダリング',
    chatMarkdownRenderDesc: 'アシスタント返信を Markdown で表示',
    chatLatexRenderTitle: 'LaTeX 数式レンダリング',
    chatLatexRenderDesc: 'Markdown の有効化が必要',
    chatSpellcheckTitle: 'スペルチェック（入力欄）',
    chatFeatureGroupTitle: '機能',
    chatAutoTitleTitle: 'チャットタイトルを自動生成',
    chatAutoTitleDesc: '最初のユーザーメッセージから会話名を付けます',
    chatAutoPreviewArtifactTitle: '生成物を自動プレビュー（Artifacts）',
    chatAutoPreviewArtifactDesc: '生成完了後にツール結果カードを自動展開',
    avatarGroupTitle: 'アバター',
    avatarPreviewUser: 'ユーザー',
    avatarPreviewAi: 'AI',
    avatarUserLabel: 'ユーザーアバター',
    avatarAiLabel: 'AI アバター',
    uploadImage: '画像をアップロード',
    save: '保存',
    resetDefault: '既定に戻す',
    avatarUserPlaceholder: 'emoji 例 😀',
    avatarAiPlaceholder: 'emoji 例 🤖',
    labelUnset: '未設定',
    labelMessagesUnit: '件'
  },
  'ko-KR': {
    basicSettings: '기본 설정',
    mobileAccess: '모바일 접속',
    viewLanQr: 'LAN 주소 / QR 코드 보기',
    importTavernCard: '🃏 타번 카드 가져오기',
    newGroup: '새 그룹',
    accessDialogTitle: '모바일 접속',
    close: '닫기',
    groupDialogTitle: '새 그룹',
    connected: '연결됨',
    disconnected: '연결 안 됨',
    startLocalService: '먼저 로컬 서비스를 실행하세요',
    serviceUnavailable: '서비스를 사용할 수 없습니다',
    accessTokenLabel: '접근 토큰',
    accessTokenPlaceholder: '비워두면 토큰 없음',
    dataSettingsGroupTitle: '데이터 설정',
    exportArtifactsBtn: '산출물 내보내기',
    clearCurrentSessionBtn: '현재 대화 지우기',
    proxyGroupTitle: '네트워크 프록시',
    proxyEnableLabel: '프록시 사용',
    proxyEnableDesc: '기본은 꺼짐입니다. 켠 뒤 프록시 정보를 입력하세요.',
    proxyTypeLabel: '프록시 유형',
    proxyHostLabel: '프록시 호스트',
    proxyPortLabel: '프록시 포트',
    proxyUserLabel: '프록시 사용자명',
    proxyPassLabel: '프록시 비밀번호',
    chatSettingsSectionTitle: '대화 설정',
    chatContextGroupTitle: '컨텍스트 관리',
    chatContextLimitLabel: '컨텍스트 메시지 수 상한',
    chatUnlimited: '제한 없음',
    chatContextNote: '모델에 보낼 최근 메시지 수를 조절합니다. 많을수록 문맥이 유지되지만 느려질 수 있습니다.',
    chatGenerationGroupTitle: '생성 파라미터',
    chatTemperatureSettingLabel: '온도 (Temperature)',
    chatTopPSettingLabel: 'Top P',
    useDefault: '기본값 사용',
    chatStreamOutputTitle: '스트리밍 출력',
    chatStreamOutputDesc: '생성 중 답변을 순차적으로 표시합니다',
    chatDisplayGroupTitle: '표시',
    chatShowTimestampTitle: '메시지 시간 표시',
    chatShowModelTitle: '모델 이름 표시',
    chatShowCharCountTitle: '문자 수 표시',
    chatShowTokenUsageTitle: '토큰 사용량 표시 (추정)',
    chatShowFirstTokenLatencyTitle: '첫 토큰 지연 표시 (TTFT)',
    chatMarkdownRenderTitle: 'Markdown 렌더링',
    chatMarkdownRenderDesc: '어시스턴트 답변을 Markdown으로 렌더링',
    chatLatexRenderTitle: 'LaTeX 수식 렌더링',
    chatLatexRenderDesc: 'Markdown 렌더링 필요',
    chatSpellcheckTitle: '맞춤법 검사 (입력창)',
    chatFeatureGroupTitle: '기능',
    chatAutoTitleTitle: '채팅 제목 자동 생성',
    chatAutoTitleDesc: '첫 사용자 메시지로 대화 제목을 자동 지정',
    chatAutoPreviewArtifactTitle: '생성물 자동 미리보기 (Artifacts)',
    chatAutoPreviewArtifactDesc: '생성 완료 후 결과 카드를 자동 펼침',
    avatarGroupTitle: '아바타',
    avatarPreviewUser: '사용자',
    avatarPreviewAi: 'AI',
    avatarUserLabel: '사용자 아바타',
    avatarAiLabel: 'AI 아바타',
    uploadImage: '이미지 업로드',
    save: '저장',
    resetDefault: '기본값으로 복원',
    avatarUserPlaceholder: 'emoji 예: 😀',
    avatarAiPlaceholder: 'emoji 예: 🤖',
    labelUnset: '미설정',
    labelMessagesUnit: '개'
  },
  'fr-FR': {
    basicSettings: 'Paramètres de base',
    mobileAccess: 'Accès mobile',
    viewLanQr: 'Voir l’adresse LAN / QR code',
    importTavernCard: '🃏 Importer une carte Tavern',
    newGroup: 'Nouveau groupe',
    accessDialogTitle: 'Accès mobile',
    close: 'Fermer',
    groupDialogTitle: 'Nouveau groupe',
    connected: 'Connecté',
    disconnected: 'Déconnecté',
    startLocalService: 'Veuillez d’abord démarrer le service local',
    serviceUnavailable: 'Service indisponible',
    accessTokenLabel: 'Jeton d’accès',
    accessTokenPlaceholder: 'Laisser vide pour désactiver le jeton',
    dataSettingsGroupTitle: 'Paramètres de données',
    exportArtifactsBtn: 'Exporter les artefacts',
    clearCurrentSessionBtn: 'Effacer le chat actuel',
    proxyGroupTitle: 'Proxy réseau',
    proxyEnableLabel: 'Activer le proxy',
    proxyEnableDesc: 'Désactivé par défaut. Saisissez les infos du proxy après activation.',
    proxyTypeLabel: 'Type de proxy',
    proxyHostLabel: 'Hôte proxy',
    proxyPortLabel: 'Port proxy',
    proxyUserLabel: 'Nom d’utilisateur proxy',
    proxyPassLabel: 'Mot de passe proxy',
    chatSettingsSectionTitle: 'Paramètres du chat',
    chatContextGroupTitle: 'Gestion du contexte',
    chatContextLimitLabel: 'Limite de messages de contexte',
    chatUnlimited: 'Illimité',
    chatContextNote: 'Contrôle le nombre de messages récents envoyés au modèle. Plus il y en a, meilleure est la continuité, mais cela peut ralentir la réponse.',
    chatGenerationGroupTitle: 'Paramètres de génération',
    chatTemperatureSettingLabel: 'Température',
    chatTopPSettingLabel: 'Top P',
    useDefault: 'Utiliser la valeur par défaut',
    chatStreamOutputTitle: 'Sortie en flux',
    chatStreamOutputDesc: 'Affiche la réponse progressivement pendant la génération',
    chatDisplayGroupTitle: 'Affichage',
    chatShowTimestampTitle: 'Afficher l’horodatage des messages',
    chatShowModelTitle: 'Afficher le nom du modèle',
    chatShowCharCountTitle: 'Afficher le nombre de caractères',
    chatShowTokenUsageTitle: 'Afficher l’usage des tokens (estimé)',
    chatShowFirstTokenLatencyTitle: 'Afficher la latence du 1er token (TTFT)',
    chatMarkdownRenderTitle: 'Rendu Markdown',
    chatMarkdownRenderDesc: 'Afficher les réponses de l’assistant avec style Markdown',
    chatLatexRenderTitle: 'Rendu LaTeX',
    chatLatexRenderDesc: 'Nécessite le rendu Markdown',
    chatSpellcheckTitle: 'Vérification orthographique (saisie)',
    chatFeatureGroupTitle: 'Fonctions',
    chatAutoTitleTitle: 'Générer automatiquement le titre du chat',
    chatAutoTitleDesc: 'Nommer la conversation à partir du premier message utilisateur',
    chatAutoPreviewArtifactTitle: 'Aperçu automatique des artefacts',
    chatAutoPreviewArtifactDesc: 'Déployer automatiquement la carte du résultat après génération',
    avatarGroupTitle: 'Avatars',
    avatarPreviewUser: 'Utilisateur',
    avatarPreviewAi: 'IA',
    avatarUserLabel: 'Avatar utilisateur',
    avatarAiLabel: 'Avatar IA',
    uploadImage: 'Téléverser une image',
    save: 'Enregistrer',
    resetDefault: 'Réinitialiser',
    avatarUserPlaceholder: 'emoji ex. 😀',
    avatarAiPlaceholder: 'emoji ex. 🤖',
    labelUnset: 'Non défini',
    labelMessagesUnit: 'msg'
  },
  'de-DE': {
    basicSettings: 'Grundeinstellungen',
    mobileAccess: 'Mobiler Zugriff',
    viewLanQr: 'LAN-Adresse / QR-Code anzeigen',
    importTavernCard: '🃏 Tavern-Karte importieren',
    newGroup: 'Neue Gruppe',
    accessDialogTitle: 'Mobiler Zugriff',
    close: 'Schließen',
    groupDialogTitle: 'Neue Gruppe',
    connected: 'Verbunden',
    disconnected: 'Nicht verbunden',
    startLocalService: 'Bitte zuerst den lokalen Dienst starten',
    serviceUnavailable: 'Dienst nicht verfügbar',
    accessTokenLabel: 'Zugriffstoken',
    accessTokenPlaceholder: 'Leer lassen für kein Token',
    dataSettingsGroupTitle: 'Dateneinstellungen',
    exportArtifactsBtn: 'Artefakte exportieren',
    clearCurrentSessionBtn: 'Aktuellen Chat leeren',
    proxyGroupTitle: 'Netzwerk-Proxy',
    proxyEnableLabel: 'Proxy aktivieren',
    proxyEnableDesc: 'Standardmäßig aus. Nach Aktivierung Proxy-Daten eintragen.',
    proxyTypeLabel: 'Proxy-Typ',
    proxyHostLabel: 'Proxy-Host',
    proxyPortLabel: 'Proxy-Port',
    proxyUserLabel: 'Proxy-Benutzername',
    proxyPassLabel: 'Proxy-Passwort',
    chatSettingsSectionTitle: 'Chat-Einstellungen',
    chatContextGroupTitle: 'Kontextverwaltung',
    chatContextLimitLabel: 'Limit für Kontextnachrichten',
    chatUnlimited: 'Unbegrenzt',
    chatContextNote: 'Steuert, wie viele frühere Nachrichten an das Modell gesendet werden. Mehr Kontext verbessert die Kontinuität, kann aber langsamer sein.',
    chatGenerationGroupTitle: 'Generierungsparameter',
    chatTemperatureSettingLabel: 'Temperatur',
    chatTopPSettingLabel: 'Top P',
    useDefault: 'Standard verwenden',
    chatStreamOutputTitle: 'Streaming-Ausgabe',
    chatStreamOutputDesc: 'Antwort während der Generierung schrittweise anzeigen',
    chatDisplayGroupTitle: 'Anzeige',
    chatShowTimestampTitle: 'Zeitstempel anzeigen',
    chatShowModelTitle: 'Modellname anzeigen',
    chatShowCharCountTitle: 'Zeichenanzahl anzeigen',
    chatShowTokenUsageTitle: 'Token-Verbrauch anzeigen (geschätzt)',
    chatShowFirstTokenLatencyTitle: 'Erst-Token-Latenz anzeigen (TTFT)',
    chatMarkdownRenderTitle: 'Markdown-Rendering',
    chatMarkdownRenderDesc: 'Assistentenantworten mit Markdown formatieren',
    chatLatexRenderTitle: 'LaTeX-Rendering',
    chatLatexRenderDesc: 'Erfordert Markdown-Rendering',
    chatSpellcheckTitle: 'Rechtschreibprüfung (Eingabefeld)',
    chatFeatureGroupTitle: 'Funktionen',
    chatAutoTitleTitle: 'Chat-Titel automatisch erzeugen',
    chatAutoTitleDesc: 'Konversation anhand der ersten Nutzernachricht benennen',
    chatAutoPreviewArtifactTitle: 'Artefakte automatisch vorschauen',
    chatAutoPreviewArtifactDesc: 'Ergebniskarte nach der Generierung automatisch aufklappen',
    avatarGroupTitle: 'Avatare',
    avatarPreviewUser: 'Benutzer',
    avatarPreviewAi: 'KI',
    avatarUserLabel: 'Benutzer-Avatar',
    avatarAiLabel: 'KI-Avatar',
    uploadImage: 'Bild hochladen',
    save: 'Speichern',
    resetDefault: 'Zurücksetzen',
    avatarUserPlaceholder: 'Emoji z. B. 😀',
    avatarAiPlaceholder: 'Emoji z. B. 🤖',
    labelUnset: 'Nicht gesetzt',
    labelMessagesUnit: 'Nachr.'
  },
  'es-ES': {
    basicSettings: 'Configuración básica',
    mobileAccess: 'Acceso móvil',
    viewLanQr: 'Ver dirección LAN / código QR',
    importTavernCard: '🃏 Importar tarjeta Tavern',
    newGroup: 'Nuevo grupo',
    accessDialogTitle: 'Acceso móvil',
    close: 'Cerrar',
    groupDialogTitle: 'Nuevo grupo',
    connected: 'Conectado',
    disconnected: 'Desconectado',
    startLocalService: 'Inicia primero el servicio local',
    serviceUnavailable: 'Servicio no disponible',
    accessTokenLabel: 'Token de acceso',
    accessTokenPlaceholder: 'Déjalo vacío para desactivar el token',
    dataSettingsGroupTitle: 'Configuración de datos',
    exportArtifactsBtn: 'Exportar artefactos',
    clearCurrentSessionBtn: 'Limpiar chat actual',
    proxyGroupTitle: 'Proxy de red',
    proxyEnableLabel: 'Activar proxy',
    proxyEnableDesc: 'Desactivado por defecto. Completa los datos del proxy al activarlo.',
    proxyTypeLabel: 'Tipo de proxy',
    proxyHostLabel: 'Host del proxy',
    proxyPortLabel: 'Puerto del proxy',
    proxyUserLabel: 'Usuario del proxy',
    proxyPassLabel: 'Contraseña del proxy',
    chatSettingsSectionTitle: 'Configuración del chat',
    chatContextGroupTitle: 'Gestión de contexto',
    chatContextLimitLabel: 'Límite de mensajes de contexto',
    chatUnlimited: 'Sin límite',
    chatContextNote: 'Controla cuántos mensajes recientes se envían al modelo. Más contexto mejora la continuidad, pero puede ralentizar la respuesta.',
    chatGenerationGroupTitle: 'Parámetros de generación',
    chatTemperatureSettingLabel: 'Temperatura',
    chatTopPSettingLabel: 'Top P',
    useDefault: 'Usar valor predeterminado',
    chatStreamOutputTitle: 'Salida en streaming',
    chatStreamOutputDesc: 'Muestra la respuesta de forma progresiva mientras se genera',
    chatDisplayGroupTitle: 'Visualización',
    chatShowTimestampTitle: 'Mostrar marca de tiempo',
    chatShowModelTitle: 'Mostrar nombre del modelo',
    chatShowCharCountTitle: 'Mostrar conteo de caracteres',
    chatShowTokenUsageTitle: 'Mostrar uso de tokens (estimado)',
    chatShowFirstTokenLatencyTitle: 'Mostrar latencia del primer token (TTFT)',
    chatMarkdownRenderTitle: 'Renderizado Markdown',
    chatMarkdownRenderDesc: 'Mostrar respuestas del asistente con formato Markdown',
    chatLatexRenderTitle: 'Renderizado LaTeX',
    chatLatexRenderDesc: 'Requiere renderizado Markdown',
    chatSpellcheckTitle: 'Corrección ortográfica (entrada)',
    chatFeatureGroupTitle: 'Funciones',
    chatAutoTitleTitle: 'Generar título del chat automáticamente',
    chatAutoTitleDesc: 'Nombrar la conversación según el primer mensaje del usuario',
    chatAutoPreviewArtifactTitle: 'Vista previa automática de artefactos',
    chatAutoPreviewArtifactDesc: 'Expandir automáticamente la tarjeta del resultado tras generarlo',
    avatarGroupTitle: 'Avatares',
    avatarPreviewUser: 'Usuario',
    avatarPreviewAi: 'IA',
    avatarUserLabel: 'Avatar del usuario',
    avatarAiLabel: 'Avatar de IA',
    uploadImage: 'Subir imagen',
    save: 'Guardar',
    resetDefault: 'Restablecer',
    avatarUserPlaceholder: 'emoji p. ej. 😀',
    avatarAiPlaceholder: 'emoji p. ej. 🤖',
    labelUnset: 'Sin definir',
    labelMessagesUnit: 'mens.'
  },
  'ru-RU': {
    basicSettings: 'Базовые настройки',
    mobileAccess: 'Доступ с телефона',
    viewLanQr: 'Показать LAN-адрес / QR-код',
    importTavernCard: '🃏 Импорт карты Tavern',
    newGroup: 'Новая группа',
    accessDialogTitle: 'Доступ с телефона',
    close: 'Закрыть',
    groupDialogTitle: 'Новая группа',
    connected: 'Подключено',
    disconnected: 'Не подключено',
    startLocalService: 'Сначала запустите локальный сервис',
    serviceUnavailable: 'Сервис недоступен',
    accessTokenLabel: 'Токен доступа',
    accessTokenPlaceholder: 'Оставьте пустым, чтобы отключить токен',
    dataSettingsGroupTitle: 'Настройки данных',
    exportArtifactsBtn: 'Экспорт артефактов',
    clearCurrentSessionBtn: 'Очистить текущий чат',
    proxyGroupTitle: 'Сетевой прокси',
    proxyEnableLabel: 'Включить прокси',
    proxyEnableDesc: 'По умолчанию выключено. После включения заполните параметры прокси.',
    proxyTypeLabel: 'Тип прокси',
    proxyHostLabel: 'Хост прокси',
    proxyPortLabel: 'Порт прокси',
    proxyUserLabel: 'Имя пользователя прокси',
    proxyPassLabel: 'Пароль прокси',
    chatSettingsSectionTitle: 'Настройки чата',
    chatContextGroupTitle: 'Управление контекстом',
    chatContextLimitLabel: 'Лимит сообщений в контексте',
    chatUnlimited: 'Без ограничений',
    chatContextNote: 'Определяет, сколько последних сообщений отправляется модели. Больше контекста улучшает связность, но может замедлять ответ.',
    chatGenerationGroupTitle: 'Параметры генерации',
    chatTemperatureSettingLabel: 'Температура',
    chatTopPSettingLabel: 'Top P',
    useDefault: 'Использовать по умолчанию',
    chatStreamOutputTitle: 'Потоковый вывод',
    chatStreamOutputDesc: 'Показывать ответ постепенно во время генерации',
    chatDisplayGroupTitle: 'Отображение',
    chatShowTimestampTitle: 'Показывать время сообщения',
    chatShowModelTitle: 'Показывать имя модели',
    chatShowCharCountTitle: 'Показывать число символов',
    chatShowTokenUsageTitle: 'Показывать расход токенов (оценка)',
    chatShowFirstTokenLatencyTitle: 'Показывать задержку первого токена (TTFT)',
    chatMarkdownRenderTitle: 'Рендеринг Markdown',
    chatMarkdownRenderDesc: 'Отображать ответы ассистента с форматированием Markdown',
    chatLatexRenderTitle: 'Рендеринг LaTeX',
    chatLatexRenderDesc: 'Требуется включённый Markdown',
    chatSpellcheckTitle: 'Проверка орфографии (поле ввода)',
    chatFeatureGroupTitle: 'Функции',
    chatAutoTitleTitle: 'Автогенерация названия чата',
    chatAutoTitleDesc: 'Называть диалог по первому сообщению пользователя',
    chatAutoPreviewArtifactTitle: 'Автопросмотр артефактов',
    chatAutoPreviewArtifactDesc: 'Автоматически раскрывать карточку результата после генерации',
    avatarGroupTitle: 'Аватары',
    avatarPreviewUser: 'Пользователь',
    avatarPreviewAi: 'ИИ',
    avatarUserLabel: 'Аватар пользователя',
    avatarAiLabel: 'Аватар ИИ',
    uploadImage: 'Загрузить изображение',
    save: 'Сохранить',
    resetDefault: 'Сбросить',
    avatarUserPlaceholder: 'emoji напр. 😀',
    avatarAiPlaceholder: 'emoji напр. 🤖',
    labelUnset: 'Не задано',
    labelMessagesUnit: 'сообщ.'
  }
};

const LANG_LABELS_ZH = {
  auto: '自动检测',
  'zh-CN': '中文',
  'en-US': 'English',
  'ja-JP': '日本語',
  'ko-KR': '한국어',
  'fr-FR': 'Français',
  'de-DE': 'Deutsch',
  'es-ES': 'Español',
  'ru-RU': 'Русский'
};

const LANG_LABELS_EN = {
  auto: 'Auto Detect',
  'zh-CN': 'Chinese',
  'en-US': 'English',
  'ja-JP': 'Japanese',
  'ko-KR': 'Korean',
  'fr-FR': 'French',
  'de-DE': 'German',
  'es-ES': 'Spanish',
  'ru-RU': 'Russian'
};

const LANG_LABELS_NATIVE = {
  auto: 'Auto Detect',
  'zh-CN': '简体中文',
  'en-US': 'English',
  'ja-JP': '日本語',
  'ko-KR': '한국어',
  'fr-FR': 'Français',
  'de-DE': 'Deutsch',
  'es-ES': 'Español',
  'ru-RU': 'Русский'
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
    sidebarTab: localStorage.getItem('chatbox_sidebar_tab_v1') || 'sessions',
    activeContactAvatarId: '',
    selectedMessageId: ''
  },
  pdfjsLib: null
};

const translationOverlayRuntime = {
  queue: [],
  pending: new Set(),
  active: 0,
  maxConcurrent: 3,
  renderLookback: 1,
  requestTimeoutMs: 35000,
  retryTimeoutMs: 60000,
  failureCooldownMs: 12000,
  lastErrorAt: 0,
  pauseUntil: 0,
  resumeTimer: 0,
  persistTimer: 0,
  refreshTimer: 0,
  refreshSessionId: ''
};

function applyTranslationRateHints(info) {
  const limit = Number(info && info.translateRateLimitPerMin);
  if (!Number.isFinite(limit) || limit <= 0) return;
  if (limit >= 900) translationOverlayRuntime.maxConcurrent = 5;
  else if (limit >= 480) translationOverlayRuntime.maxConcurrent = 4;
  else if (limit >= 240) translationOverlayRuntime.maxConcurrent = 3;
  else translationOverlayRuntime.maxConcurrent = 2;
}

const sharedUtils = window.EchoMuseUtils;
if (!sharedUtils) {
  throw new Error('EchoMuseUtils not loaded. Check script order in public/index.html.');
}
const sharedDomainCore = window.EchoMuseDomainCore;
if (!sharedDomainCore) {
  throw new Error('EchoMuseDomainCore not loaded. Check script order in public/index.html.');
}
const sharedChatRenderCore = window.EchoMuseChatRenderCore;
if (!sharedChatRenderCore) {
  throw new Error('EchoMuseChatRenderCore not loaded. Check script order in public/index.html.');
}
const sharedVoiceTts = window.EchoMuseVoiceTts || null;

let voiceTtsController = null;
const {
  countQuestionTotal,
  toolName,
  formatTime,
  escapeHtml,
  countChineseChars,
  fallbackCopy,
  csvEscape,
  timestamp,
  downloadBlob
} = sharedUtils;
const escapeAttr = (s) => escapeHtml(String(s || ''));
const {
  isValidSession,
  createSessionObject,
  sortSessions,
  getSessionPreview,
  isValidAvatar,
  derivePromptMode,
  promptModeLabel,
  parsePngCharaData,
  normalizeTavernCard
} = sharedDomainCore;
const {
  buildSessionListHtml,
  renderMessageMetaHtml,
  renderToolCardHtml
} = sharedChatRenderCore;

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
  translateEnableToggle: document.getElementById('translateEnableToggle'),
  translateFromSelect: document.getElementById('translateFromSelect'),
  translateToSelect: document.getElementById('translateToSelect'),
  fontSizeSelect: document.getElementById('fontSizeSelect'),
  fontSizeValueLabel: document.getElementById('fontSizeValueLabel'),
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
  chatShowTokenUsageToggle: document.getElementById('chatShowTokenUsageToggle'),
  chatShowFirstTokenLatencyToggle: document.getElementById('chatShowFirstTokenLatencyToggle'),
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
  mcpImportJsonBtn: document.getElementById('mcpImportJsonBtn'),
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
  ensurePersonasSettingsSectionNav();
  ensureTeamSharingSettingsSection();
  ensureLorebookSettingsSection();
  ensureAvatarScenarioManagerUi();
  renderAvatarScenarioDraftList();
  applySettings();
  syncSettingsUI();
  initVoiceTtsModule();
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

function initVoiceTtsModule() {
  if (!sharedVoiceTts || typeof sharedVoiceTts.createController !== 'function') return;
  if (voiceTtsController) return;
  try {
    voiceTtsController = sharedVoiceTts.createController({
      setStatus,
      getActiveSession,
      getAvatarById,
      persistAvatars,
      onAvatarVoiceProfileChanged: () => {
        renderAvatarSelectPanel();
        renderMessages();
      },
      getChatInputElement: () => els.chatInput,
      getMessageListElement: () => els.messageList,
      getAppState: () => state,
      getSpeakTextForMessage: (session, message) => getOverlayDisplayContent(session, message)
    });
    voiceTtsController.init();
  } catch (error) {
    console.warn('[voice-tts] init failed:', error);
  }
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

function getTranslateTargetRowLabelText() {
  const lang = String(state.settings.language || 'zh-CN');
  if (lang === 'zh-CN') return '翻译输出语言';
  return 'Translation Output Language';
}

function applySettings() {
  applyTheme(state.settings.theme);
  applyFontSize(state.settings.fontSize);
  applyLanguage();
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
  const px = normalizeFontSizePx(sizeKey);
  document.documentElement.style.setProperty('--ui-font-size', `${px}px`);
  updateFontSizeValueLabel(px);
}

function syncSettingsUI() {
  state.settings.translateFrom = 'auto';
  if (els.uiLangSelect) els.uiLangSelect.value = state.settings.language || 'zh-CN';
  if (els.globalDefenseToggle) els.globalDefenseToggle.checked = Boolean(state.settings.globalDefense);
  if (els.translateEnableToggle) els.translateEnableToggle.checked = Boolean(state.settings.translateEnabled);
  if (els.translateFromSelect) els.translateFromSelect.value = 'auto';
  if (els.translateToSelect) els.translateToSelect.value = state.settings.translateTo || 'zh-CN';
  if (els.fontSizeSelect) els.fontSizeSelect.value = String(normalizeFontSizePx(state.settings.fontSize));
  updateFontSizeValueLabel();
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
  if (els.chatShowTokenUsageToggle) els.chatShowTokenUsageToggle.checked = Boolean(state.settings.chatShowTokenUsage);
  if (els.chatShowFirstTokenLatencyToggle) els.chatShowFirstTokenLatencyToggle.checked = Boolean(state.settings.chatShowFirstTokenLatency);
  if (els.chatMarkdownToggle) els.chatMarkdownToggle.checked = Boolean(state.settings.chatMarkdownRender);
  if (els.chatLatexToggle) els.chatLatexToggle.checked = Boolean(state.settings.chatLatexRender);
  if (els.chatSpellcheckToggle) els.chatSpellcheckToggle.checked = Boolean(state.settings.chatSpellcheck);
  if (els.chatAutoTitleToggle) els.chatAutoTitleToggle.checked = Boolean(state.settings.chatAutoTitle);
  if (els.chatAutoPreviewArtifactToggle) els.chatAutoPreviewArtifactToggle.checked = Boolean(state.settings.chatAutoPreviewArtifact);
  applyLanguage();
  updateChatSettingsUI();
  updateTranslateSettingsUI();
  updateProxyFieldsUI();
}

function normalizeFontSizePx(value) {
  if (typeof value === 'string' && Object.prototype.hasOwnProperty.call(FONT_SIZE_MAP, value)) {
    return FONT_SIZE_MAP[value];
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return FONT_SIZE_MAP.md;
  return Math.max(12, Math.min(20, Math.round(parsed)));
}

function updateFontSizeValueLabel(px) {
  if (!els.fontSizeValueLabel) return;
  const resolved = Number.isFinite(px) ? px : normalizeFontSizePx(state.settings.fontSize);
  els.fontSizeValueLabel.textContent = `${resolved}px`;
}

function getUiPack() {
  const lang = String(state.settings.language || 'zh-CN');
  const base = UI_PACKS[lang] || (lang.startsWith('zh') ? UI_PACK_ZH : UI_PACK_EN);
  const extrasDefault = UI_PACK_EXTRAS['en-US'] || {};
  const extras = UI_PACK_EXTRAS[lang] || {};
  return { ...base, ...extrasDefault, ...extras };
}

function getLangLabelMap() {
  const lang = String(state.settings.language || 'zh-CN');
  if (lang.startsWith('zh')) return LANG_LABELS_ZH;
  if (lang.startsWith('en')) return LANG_LABELS_EN;
  const pack = getUiPack();
  return { ...LANG_LABELS_NATIVE, auto: pack.autoDetect || LANG_LABELS_NATIVE.auto };
}

function setSettingRowLabel(controlEl, text) {
  if (!controlEl || !text) return;
  const row = controlEl.closest('.setting-row');
  const label = row ? row.querySelector('label') : null;
  if (label) label.textContent = text;
}

function setSelectOptionText(selectEl, value, text) {
  if (!selectEl) return;
  const option = Array.from(selectEl.options || []).find((opt) => opt.value === value);
  if (option && text) option.textContent = text;
}

function setGroupTitleByChild(childEl, text) {
  if (!childEl || !text) return;
  const group = childEl.closest('.settings-group');
  const h4 = group ? group.querySelector('h4') : null;
  if (h4) h4.textContent = text;
}

function setSwitchItemTextByToggle(toggleEl, title, desc) {
  if (!toggleEl) return;
  const item = toggleEl.closest('.setting-switch-item');
  if (!item) return;
  const titleEl = item.querySelector('.setting-switch-title');
  const descEl = item.querySelector('.setting-switch-desc');
  if (titleEl && title) titleEl.textContent = title;
  if (descEl && typeof desc === 'string') descEl.textContent = desc;
}

function setInlineCheckLabel(inputEl, text) {
  if (!inputEl || !text) return;
  const label = inputEl.closest('.inline-check');
  if (!label) return;
  const textNodeType = (window.Node && window.Node.TEXT_NODE) || 3;
  const nodes = Array.from(label.childNodes || []);
  const existing = nodes.find((n) => n.nodeType === textNodeType && String(n.textContent || '').trim().length);
  if (existing) {
    existing.textContent = ` ${text}`;
  } else {
    label.appendChild(document.createTextNode(` ${text}`));
  }
}

function setSettingNoteByControl(controlEl, text) {
  if (!controlEl || !text) return;
  const row = controlEl.closest('.setting-row');
  const note = row ? row.querySelector('.setting-note') : null;
  if (note) note.textContent = text;
}

function applyLanguage() {
  const pack = getUiPack();
  const langLabels = getLangLabelMap();
  const uiLang = String(state.settings.language || 'zh-CN');
  document.documentElement.lang = uiLang;

  if (els.newSessionBtn) els.newSessionBtn.textContent = pack.newSession;
  if (els.sendBtn) els.sendBtn.textContent = pack.send;
  if (els.tabSessions) els.tabSessions.textContent = pack.sessions;
  if (els.tabContacts) els.tabContacts.textContent = pack.contacts;
  if (els.sessionSearch) els.sessionSearch.placeholder = pack.searchSessionsPlaceholder;
  if (els.chatInput) els.chatInput.placeholder = pack.chatPlaceholder;
  if (els.closeSettingsBtn) els.closeSettingsBtn.textContent = pack.closeSettings;
  if (els.showAccessBtn) els.showAccessBtn.textContent = pack.viewLanQr;
  if (els.importTavernContactBtn) els.importTavernContactBtn.textContent = pack.importTavernCard;
  if (els.tavernImportBtn) els.tavernImportBtn.textContent = pack.importTavernCard;
  if (els.newGroupBtn) els.newGroupBtn.textContent = pack.newGroup;
  if (els.closeAccessBtn) els.closeAccessBtn.textContent = pack.close;

  if (els.settingsPanel) {
    const navGeneral = els.settingsPanel.querySelector('.settings-nav-item[data-section="general"]');
    const navProvider = els.settingsPanel.querySelector('.settings-nav-item[data-section="provider"]');
    const navMcp = els.settingsPanel.querySelector('.settings-nav-item[data-section="mcp"]');
    const navKnowledge = els.settingsPanel.querySelector('.settings-nav-item[data-section="knowledge"]');
    const navTeamSharing = els.settingsPanel.querySelector('.settings-nav-item[data-section="team-sharing"]');
    const navTitle = els.settingsPanel.querySelector('.settings-nav h2');
    const generalTitle = els.settingsPanel.querySelector('.settings-section[data-section="general"] > h3');
    const teamSharingTitle = els.settingsPanel.querySelector('.settings-section[data-section="team-sharing"] > h3');
    if (navTitle) navTitle.textContent = pack.settingsTitle;
    if (navGeneral) navGeneral.textContent = pack.navGeneral;
    if (navProvider) navProvider.textContent = pack.navProvider;
    if (navMcp) navMcp.textContent = pack.navMcp;
    if (navKnowledge) navKnowledge.textContent = pack.navKnowledge;
    if (navTeamSharing) navTeamSharing.textContent = (state.settings.language || 'zh-CN') === 'en-US' ? 'Team Sharing' : '团队分享';
    if (generalTitle) generalTitle.textContent = pack.generalTitle;
    if (teamSharingTitle) teamSharingTitle.textContent = (state.settings.language || 'zh-CN') === 'en-US' ? 'Team Sharing' : '团队分享（Team Sharing）';

    const basicGroupTitle = els.settingsPanel.querySelector('.settings-section[data-section="general"] .settings-group h4');
    if (basicGroupTitle) basicGroupTitle.textContent = pack.basicSettings;
  }

  setSettingRowLabel(els.tokenInput, pack.accessTokenLabel);
  if (els.tokenInput && pack.accessTokenPlaceholder) els.tokenInput.placeholder = pack.accessTokenPlaceholder;
  if (els.saveTokenBtn && pack.save) els.saveTokenBtn.textContent = pack.save;

  if (els.uiLangSelect) {
    const group = els.uiLangSelect.closest('.settings-group');
    const h4 = group ? group.querySelector('h4') : null;
    if (h4) h4.textContent = pack.displaySettings;
  }
  setSettingRowLabel(els.uiLangSelect, pack.uiLanguage);
  setSettingRowLabel(els.showAccessBtn, pack.mobileAccess);
  setSettingRowLabel(els.globalDefenseToggle, pack.globalDefense);
  setSettingRowLabel(els.translateEnableToggle, pack.translateEnabled);
  setSettingRowLabel(els.translateToSelect, getTranslateTargetRowLabelText());
  setSettingRowLabel(els.fontSizeSelect, pack.fontSize);
  setSettingRowLabel(els.themeSelect, pack.theme);

  if (els.globalDefenseToggle) {
    const row = els.globalDefenseToggle.closest('.setting-row');
    const desc = row ? row.querySelector('.muted') : null;
    if (desc) desc.textContent = pack.globalDefenseDesc;
  }
  if (els.translateEnableToggle) {
    const row = els.translateEnableToggle.closest('.setting-row');
    const desc = row ? row.querySelector('.muted') : null;
    if (desc) desc.textContent = pack.translateEnabledDesc;
  }

  setGroupTitleByChild(els.openExportBtn, pack.dataSettingsGroupTitle);
  if (els.openExportBtn && pack.exportArtifactsBtn) els.openExportBtn.textContent = pack.exportArtifactsBtn;
  if (els.clearChatBtn && pack.clearCurrentSessionBtn) els.clearChatBtn.textContent = pack.clearCurrentSessionBtn;

  setGroupTitleByChild(els.proxyEnableToggle, pack.proxyGroupTitle);
  setSettingRowLabel(els.proxyEnableToggle, pack.proxyEnableLabel);
  setSettingRowLabel(els.proxyTypeSelect, pack.proxyTypeLabel);
  setSettingRowLabel(els.proxyHostInput, pack.proxyHostLabel);
  setSettingRowLabel(els.proxyPortInput, pack.proxyPortLabel);
  setSettingRowLabel(els.proxyUserInput, pack.proxyUserLabel);
  setSettingRowLabel(els.proxyPassInput, pack.proxyPassLabel);
  if (els.proxyEnableToggle) {
    const row = els.proxyEnableToggle.closest('.setting-row');
    const desc = row ? row.querySelector('.muted') : null;
    if (desc && pack.proxyEnableDesc) desc.textContent = pack.proxyEnableDesc;
  }

  setSelectOptionText(els.themeSelect, 'system', pack.themeSystem);
  setSelectOptionText(els.themeSelect, 'light', pack.themeLight);
  setSelectOptionText(els.themeSelect, 'dark', pack.themeDark);

  if (els.uiLangSelect) {
    Object.entries(langLabels).forEach(([code, label]) => {
      if (code === 'auto') return;
      setSelectOptionText(els.uiLangSelect, code, label);
    });
  }
  if (els.translateFromSelect) {
    Object.entries(langLabels).forEach(([code, label]) => {
      setSelectOptionText(els.translateFromSelect, code, label);
    });
  }
  if (els.translateToSelect) {
    Object.entries(langLabels).forEach(([code, label]) => {
      if (code === 'auto') return;
      setSelectOptionText(els.translateToSelect, code, label);
    });
  }
  if (els.accessDialog) {
    const title = els.accessDialog.querySelector('h3');
    if (title) title.textContent = pack.accessDialogTitle;
  }
  if (els.groupDialog) {
    const title = els.groupDialog.querySelector('h3');
    if (title) title.textContent = pack.groupDialogTitle;
  }

  if (els.settingsPanel) {
    const chatSection = els.settingsPanel.querySelector('.settings-section[data-section="avatar"]');
    if (chatSection) {
      const chatSectionTitle = chatSection.querySelector(':scope > h3');
      if (chatSectionTitle && pack.chatSettingsSectionTitle) chatSectionTitle.textContent = pack.chatSettingsSectionTitle;
    }
  }
  setGroupTitleByChild(els.chatContextLimitRange, pack.chatContextGroupTitle);
  setSettingRowLabel(els.chatContextLimitRange, pack.chatContextLimitLabel);
  setInlineCheckLabel(els.chatContextUnlimitedToggle, pack.chatUnlimited);
  setSettingNoteByControl(els.chatContextLimitRange, pack.chatContextNote);

  setGroupTitleByChild(els.chatTemperatureRange, pack.chatGenerationGroupTitle);
  setSettingRowLabel(els.chatTemperatureRange, pack.chatTemperatureSettingLabel);
  setSettingRowLabel(els.chatTopPRange, pack.chatTopPSettingLabel);
  setInlineCheckLabel(els.chatTemperatureUseDefault, pack.useDefault);
  setInlineCheckLabel(els.chatTopPUseDefault, pack.useDefault);
  setSwitchItemTextByToggle(els.chatStreamOutputToggle, pack.chatStreamOutputTitle, pack.chatStreamOutputDesc);

  setGroupTitleByChild(els.chatShowTimestampToggle, pack.chatDisplayGroupTitle);
  setSwitchItemTextByToggle(els.chatShowTimestampToggle, pack.chatShowTimestampTitle);
  setSwitchItemTextByToggle(els.chatShowModelToggle, pack.chatShowModelTitle);
  setSwitchItemTextByToggle(els.chatShowCharCountToggle, pack.chatShowCharCountTitle);
  setSwitchItemTextByToggle(els.chatShowTokenUsageToggle, pack.chatShowTokenUsageTitle);
  setSwitchItemTextByToggle(els.chatShowFirstTokenLatencyToggle, pack.chatShowFirstTokenLatencyTitle);
  setSwitchItemTextByToggle(els.chatMarkdownToggle, pack.chatMarkdownRenderTitle, pack.chatMarkdownRenderDesc);
  setSwitchItemTextByToggle(els.chatLatexToggle, pack.chatLatexRenderTitle, pack.chatLatexRenderDesc);
  setSwitchItemTextByToggle(els.chatSpellcheckToggle, pack.chatSpellcheckTitle);

  setGroupTitleByChild(els.chatAutoTitleToggle, pack.chatFeatureGroupTitle);
  setSwitchItemTextByToggle(els.chatAutoTitleToggle, pack.chatAutoTitleTitle, pack.chatAutoTitleDesc);
  setSwitchItemTextByToggle(els.chatAutoPreviewArtifactToggle, pack.chatAutoPreviewArtifactTitle, pack.chatAutoPreviewArtifactDesc);

  setGroupTitleByChild(els.userAvatarInput, pack.avatarGroupTitle);
  if (els.userAvatarPreview) {
    const row = els.userAvatarPreview.closest('.avatar-preview-row');
    const labels = row ? row.querySelectorAll('.avatar-preview-item .muted') : [];
    if (labels[0] && pack.avatarPreviewUser) labels[0].textContent = pack.avatarPreviewUser;
    if (labels[1] && pack.avatarPreviewAi) labels[1].textContent = pack.avatarPreviewAi;
  }
  setSettingRowLabel(els.userAvatarInput, pack.avatarUserLabel);
  setSettingRowLabel(els.aiAvatarInput, pack.avatarAiLabel);
  if (els.userAvatarInput && pack.avatarUserPlaceholder) els.userAvatarInput.placeholder = pack.avatarUserPlaceholder;
  if (els.aiAvatarInput && pack.avatarAiPlaceholder) els.aiAvatarInput.placeholder = pack.avatarAiPlaceholder;
  if (els.userAvatarUploadBtn && pack.uploadImage) els.userAvatarUploadBtn.textContent = pack.uploadImage;
  if (els.aiAvatarUploadBtn && pack.uploadImage) els.aiAvatarUploadBtn.textContent = pack.uploadImage;
  if (els.saveAvatarBtn && pack.save) els.saveAvatarBtn.textContent = pack.save;
  if (els.resetAvatarBtn && pack.resetDefault) els.resetAvatarBtn.textContent = pack.resetDefault;

  updateChatSettingsUI();
  updateConnectionUI();
  updateTranslateSettingsUI();
  refreshDynamicUiLanguageLabels();
  try { voiceTtsController && voiceTtsController.refreshUi && voiceTtsController.refreshUi(); } catch (_) {}
}

function isZhUiLanguage() {
  return String(state.settings.language || 'zh-CN') === 'zh-CN';
}

function uiText(zh, nonZh) {
  return isZhUiLanguage() ? zh : nonZh;
}

function refreshDynamicUiLanguageLabels() {
  if (els.toggleSearchBtn) {
    els.toggleSearchBtn.textContent = uiText('🔎 联网', '🔎 Web');
  }
  if (els.mcpGoSettingsBtn) {
    els.mcpGoSettingsBtn.textContent = uiText('⚙ 管理 MCP 工具', '⚙ Manage MCP Tools');
  }
  if (els.kbGoSettingsBtn) {
    els.kbGoSettingsBtn.textContent = uiText('⚙ 管理知识库', '⚙ Manage Knowledge Base');
  }
  applyToolModeUI();
  try { refreshMcpQuickPanel(); } catch (_) {}
  try { refreshKbQuickPanel(); } catch (_) {}
  try { refreshContactsLorebookShortcut(); } catch (_) {}
}

function updateTranslateSettingsUI() {
  const enabled = Boolean(state.settings.translateEnabled);
  state.settings.translateFrom = 'auto';
  if (els.translateFromSelect) {
    els.translateFromSelect.value = 'auto';
    els.translateFromSelect.disabled = true;
    els.translateFromSelect.style.display = 'none';
    els.translateFromSelect.setAttribute('aria-hidden', 'true');
    els.translateFromSelect.tabIndex = -1;
  }
  if (els.translateToSelect) els.translateToSelect.disabled = !enabled;
  if (els.translateToSelect) {
    els.translateToSelect.style.flex = '1';
    els.translateToSelect.style.width = '100%';
  }
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
  const pack = getUiPack();
  if (els.chatContextLimitLabel) {
    const unlimited = Boolean(state.settings.chatContextUnlimited);
    const limit = Number(state.settings.chatContextLimit || 14);
    els.chatContextLimitLabel.textContent = unlimited
      ? (pack.chatUnlimited || 'Unlimited')
      : `${limit} ${pack.labelMessagesUnit || 'msgs'}`;
  }
  if (els.chatTemperatureLabel) {
    els.chatTemperatureLabel.textContent = state.settings.chatTemperatureUseDefault
      ? (pack.useDefault || 'Default')
      : String(Number(state.settings.chatTemperature ?? 0.7).toFixed(2));
  }
  if (els.chatTopPLabel) {
    els.chatTopPLabel.textContent = state.settings.chatTopPUseDefault
      ? (pack.useDefault || 'Default')
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

function getChatClientPreferences() {
  return {
    uiLanguage: String(state.settings.language || 'zh-CN'),
    translateEnabled: Boolean(state.settings.translateEnabled),
    translationDisplayOverlay: true,
    translateFrom: 'auto',
    translateTo: String(state.settings.translateTo || 'zh-CN'),
    globalDefense: Boolean(state.settings.globalDefense)
  };
}

function bindEvents() {
  /* Sidebar tab switching */
  if (els.tabSessions) els.tabSessions.addEventListener('click', () => switchSidebarTab('sessions'));
  if (els.tabContacts) els.tabContacts.addEventListener('click', () => switchSidebarTab('contacts'));

  /* Contact list click */
  if (els.contactList) {
    els.contactList.addEventListener('click', (e) => {
      const lorebookBtn = e.target.closest('[data-action="open-contact-lorebook"]');
      if (lorebookBtn) {
        e.preventDefault();
        e.stopPropagation();
        openLorebookSettingsForAvatar(lorebookBtn.dataset.avatarId || '', { create: true }).catch(() => {});
        return;
      }
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

    const delBtn = event.target.closest('[data-action="delete-session"]');
    if (delBtn) {
      event.preventDefault();
      event.stopPropagation();
      const sid = delBtn.dataset.sid || '';
      deleteSession(sid);
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
    if (section === 'personas') {
      ensureAvatarScenarioManagerUi();
      renderAvatarList();
      renderAvatarScenarioDraftList();
      renderAvatarSelectPanel();
    }
    if (section === 'general' || section === 'team-sharing') loadTeamSharingStatus();
    if (section === 'lorebook') loadLorebookList();
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
      applyLanguage();
    });
  }
  if (els.globalDefenseToggle) {
    els.globalDefenseToggle.addEventListener('change', () => {
      state.settings.globalDefense = Boolean(els.globalDefenseToggle.checked);
      saveSettings();
    });
  }
  if (els.translateEnableToggle) {
    els.translateEnableToggle.addEventListener('change', () => {
      state.settings.translateEnabled = Boolean(els.translateEnableToggle.checked);
      saveSettings();
      updateTranslateSettingsUI();
      renderMessages();
      renderContactList();
      if (state.settings.translateEnabled) {
        triggerOverlayTranslationForActiveSession({ force: true, maxCount: 2 });
      }
    });
  }
  if (els.translateFromSelect) {
    els.translateFromSelect.addEventListener('change', () => {
      state.settings.translateFrom = 'auto';
      els.translateFromSelect.value = 'auto';
      saveSettings();
    });
  }
  if (els.translateToSelect) {
    els.translateToSelect.addEventListener('change', () => {
      state.settings.translateTo = els.translateToSelect.value || 'zh-CN';
      saveSettings();
      renderMessages();
      renderContactList();
      if (state.settings.translateEnabled) {
        triggerOverlayTranslationForActiveSession({ force: true, maxCount: 2 });
      }
    });
  }
  if (els.fontSizeSelect) {
    const onFontSizeChange = () => {
      state.settings.fontSize = normalizeFontSizePx(els.fontSizeSelect.value);
      saveSettings();
      applyFontSize(state.settings.fontSize);
    };
    els.fontSizeSelect.addEventListener('input', onFontSizeChange);
    els.fontSizeSelect.addEventListener('change', onFontSizeChange);
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
  if (els.chatShowTokenUsageToggle) {
    els.chatShowTokenUsageToggle.addEventListener('change', () => {
      state.settings.chatShowTokenUsage = Boolean(els.chatShowTokenUsageToggle.checked);
      saveSettings();
      renderMessages();
    });
  }
  if (els.chatShowFirstTokenLatencyToggle) {
    els.chatShowFirstTokenLatencyToggle.addEventListener('change', () => {
      state.settings.chatShowFirstTokenLatency = Boolean(els.chatShowFirstTokenLatencyToggle.checked);
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
        memoryText: String(els.avatarMemoryInput.value || '').trim(),
        openingScenarios: getAvatarScenarioDraftItems()
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
  if (els.avatarNameInput) {
    els.avatarNameInput.addEventListener('input', () => {
      renderAvatarScenarioDraftList();
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
        const result = await handleTavernImport(file);
        if (els.tavernImportStatus) {
          const name = typeof result === 'string' ? result : String(result && result.name || '');
          const tagsCount = Number(result && result.tagsCount || 0) || 0;
          const lorebookTotal = Number(result && result.lorebookTotal || 0) || 0;
          const lorebookImported = Number(result && result.lorebookImported || 0) || 0;
          const lorebookFailed = Number(result && result.lorebookFailed || 0) || 0;
          const parts = [`已导入角色：${name || '未命名角色'}`];
          if (tagsCount > 0) parts.push(`标签 ${tagsCount}`);
          if (lorebookTotal > 0) {
            parts.push(`世界书 ${lorebookImported}/${lorebookTotal}`);
            if (lorebookFailed > 0) parts.push(`失败 ${lorebookFailed}`);
          }
          els.tavernImportStatus.textContent = parts.join(' · ');
        }
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
  if (els.mcpImportJsonBtn) els.mcpImportJsonBtn.addEventListener('click', () => importMcpServersFromClipboard());
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
    session.messageTree = { version: MESSAGE_TREE_VERSION, selections: {}, activeLeafId: '' };
    session.artifacts = [];
    state.ui.activeArtifactId = '';
    delete session.scenePresetApplied;
    delete session.scenePickerDismissed;
    delete session.openingScenarioId;
    touchSession(session);
    persistSessionsState();
    renderSessionList();
    renderMessages();
    renderDrawer();
    setStatus('已清空当前会话。');
  });

  els.messageList.addEventListener('click', (event) => {
    const clickedMessageBubble = event.target.closest('.msg[data-mid]');
    if (clickedMessageBubble) {
      setSelectedMessageBubble(clickedMessageBubble.dataset.mid || '');
    }

    const branchPrevBtn = event.target.closest('[data-action="branch-prev"]');
    if (branchPrevBtn) {
      const session = getActiveSession();
      if (session) switchMessageBranchSibling(session, branchPrevBtn.dataset.mid || '', -1);
      return;
    }

    const branchNextBtn = event.target.closest('[data-action="branch-next"]');
    if (branchNextBtn) {
      const session = getActiveSession();
      if (session) switchMessageBranchSibling(session, branchNextBtn.dataset.mid || '', +1);
      return;
    }

    const regenBranchBtn = event.target.closest('[data-action="regen-branch"]');
    if (regenBranchBtn) {
      const session = getActiveSession();
      if (session) regenerateAssistantBranch(session, regenBranchBtn.dataset.mid || '').catch((e) => setStatus(`分支重生成失败：${e.message || e}`));
      return;
    }

    const editResendBtn = event.target.closest('[data-action="edit-resend-branch"]');
    if (editResendBtn) {
      const session = getActiveSession();
      if (session) editAndResendFromUserMessage(session, editResendBtn.dataset.mid || '').catch((e) => setStatus(`编辑重发失败：${e.message || e}`));
      return;
    }

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
    els.toggleStudyBtn.textContent = uiText('📘 学习模式', '📘 Study');
    els.toggleStudyBtn.classList.remove('active-tool');
  }
}

function clearToolMode() {
  state.ui.activeTool = '';
  applyToolModeUI();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const isDesktop = Boolean(window.EchoMuseDesktop && window.EchoMuseDesktop.isDesktop);
  if (isDesktop) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.getRegistrations()
        .then((regs) => Promise.all((regs || []).map((reg) => reg.unregister().catch(() => false))))
        .catch(() => {});
      if (window.caches && typeof window.caches.keys === 'function') {
        caches.keys()
          .then((keys) => Promise.all((keys || []).map((key) => caches.delete(key))))
          .catch(() => {});
      }
    });
    return;
  }
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
  state.sessions.forEach((s) => {
    try { ensureSessionMessageTreeState(s); } catch (_) {}
  });

  const activeId = localStorage.getItem(STORAGE_ACTIVE_KEY);
  if (activeId && state.sessions.some((s) => s.id === activeId)) {
    state.activeSessionId = activeId;
  } else {
    state.activeSessionId = state.sessions[0].id;
  }
}

function persistSessionsState() {
  state.sessions.forEach((s) => {
    try { ensureSessionMessageTreeState(s); } catch (_) {}
  });
  state.sessions = sortSessions(state.sessions).slice(0, MAX_SESSIONS);
  localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(state.sessions));
  localStorage.setItem(STORAGE_ACTIVE_KEY, state.activeSessionId);
}

function createSession(title) {
  const session = createSessionObject(title);
  ensureSessionMessageTreeState(session);
  state.sessions.unshift(session);
  state.activeSessionId = session.id;
  persistSessionsState();
}

function deleteSession(sessionId) {
  const sid = String(sessionId || '').trim();
  if (!sid) return false;
  const idx = state.sessions.findIndex((s) => s && s.id === sid);
  if (idx < 0) return false;
  const session = state.sessions[idx];
  const title = String(session && session.title || '该会话');
  if (!window.confirm(`确认删除会话「${title}」？`)) return false;

  const wasActive = state.activeSessionId === sid;
  state.sessions.splice(idx, 1);

  if (!state.sessions.length) {
    const replacement = createSessionObject('会话 1');
    ensureSessionMessageTreeState(replacement);
    state.sessions = [replacement];
    state.activeSessionId = replacement.id;
  } else if (wasActive || !state.sessions.some((s) => s.id === state.activeSessionId)) {
    const regular = getRegularSessions();
    const next = regular[0] || state.sessions[0];
    state.activeSessionId = next.id;
  }

  state.ui.activeTool = '';
  persistSessionsState();
  syncMaterialsFromSession();
  applyToolModeUI();
  renderSessionList();
  renderMessages();
  renderDrawer();
  renderAvatarSelectPanel();
  return true;
}

function getActiveSession() {
  const session = state.sessions.find((s) => s.id === state.activeSessionId) || null;
  if (session) ensureSessionMessageTreeState(session);
  return session;
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

const MESSAGE_TREE_ROOT_KEY = '__root__';
const MESSAGE_TREE_VERSION = 1;

function isChatMessageNode(msg) {
  return Boolean(msg && (!msg.kind || msg.kind === 'chat') && (msg.role === 'user' || msg.role === 'assistant'));
}

function isToolMessageNode(msg) {
  return Boolean(msg && msg.kind === 'tool');
}

function normalizeMessageTreeParentId(value) {
  const id = String(value || '').trim();
  return id || null;
}

function getMessageTreeParentKey(parentId) {
  return normalizeMessageTreeParentId(parentId) || MESSAGE_TREE_ROOT_KEY;
}

function getSessionMessageById(session, messageId) {
  if (!session || !Array.isArray(session.messages)) return null;
  const id = String(messageId || '').trim();
  if (!id) return null;
  return session.messages.find((m) => m && m.id === id) || null;
}

function getSessionChatMessages(session) {
  if (!session || !Array.isArray(session.messages)) return [];
  return session.messages.filter(isChatMessageNode);
}

function buildSessionMessageTreeIndex(session) {
  const chatMessages = getSessionChatMessages(session);
  const byId = new Map();
  const childrenByParent = new Map();
  for (const msg of chatMessages) {
    byId.set(msg.id, msg);
  }
  for (const msg of chatMessages) {
    const parentId = normalizeMessageTreeParentId(msg.treeParentId);
    const key = getMessageTreeParentKey(parentId && byId.has(parentId) ? parentId : null);
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    childrenByParent.get(key).push(msg);
  }
  for (const list of childrenByParent.values()) {
    list.sort((a, b) => {
      const at = Number(a && a.createdAt || 0);
      const bt = Number(b && b.createdAt || 0);
      if (at !== bt) return at - bt;
      return String(a && a.id || '').localeCompare(String(b && b.id || ''));
    });
  }
  return { byId, childrenByParent };
}

function ensureSessionMessageTreeState(session) {
  if (!session || !Array.isArray(session.messages)) return session;
  if (!session.messageTree || typeof session.messageTree !== 'object') {
    session.messageTree = {};
  }
  if (!session.messageTree.selections || typeof session.messageTree.selections !== 'object') {
    session.messageTree.selections = {};
  }
  session.messageTree.version = MESSAGE_TREE_VERSION;

  let changed = false;
  let prevChatId = null;
  for (const msg of session.messages) {
    if (isChatMessageNode(msg)) {
      if (!msg.treeNodeId || typeof msg.treeNodeId !== 'string') {
        msg.treeNodeId = msg.id;
        changed = true;
      }
      if (typeof msg.treeParentId === 'undefined') {
        msg.treeParentId = prevChatId;
        changed = true;
      }
      msg.treeParentId = normalizeMessageTreeParentId(msg.treeParentId);
      prevChatId = msg.id;
      continue;
    }
    if (isToolMessageNode(msg)) {
      if (typeof msg.treeParentId === 'undefined') {
        msg.treeParentId = prevChatId;
        changed = true;
      }
      msg.treeParentId = normalizeMessageTreeParentId(msg.treeParentId);
    }
  }

  const idx = buildSessionMessageTreeIndex(session);
  const selections = session.messageTree.selections;
  for (const [parentKey, children] of idx.childrenByParent.entries()) {
    if (!children.length) continue;
    const current = String(selections[parentKey] || '');
    if (!current || !children.some((m) => m.id === current)) {
      selections[parentKey] = children[children.length - 1].id;
      changed = true;
    }
  }

  const visibleChatPath = getVisibleChatPathForSession(session, idx);
  const currentLeaf = visibleChatPath.length ? visibleChatPath[visibleChatPath.length - 1].id : '';
  if (String(session.messageTree.activeLeafId || '') !== String(currentLeaf || '')) {
    session.messageTree.activeLeafId = currentLeaf || '';
    changed = true;
  }
  if (changed) touchSession(session);
  return session;
}

function getVisibleChatPathForSession(session, prebuiltIndex = null) {
  if (!session || !Array.isArray(session.messages)) return [];
  const idx = prebuiltIndex || buildSessionMessageTreeIndex(session);
  const selections = (session.messageTree && session.messageTree.selections && typeof session.messageTree.selections === 'object')
    ? session.messageTree.selections
    : {};
  const path = [];
  let parentId = null;
  let guard = 0;
  while (guard < 4096) {
    guard += 1;
    const key = getMessageTreeParentKey(parentId);
    const children = idx.childrenByParent.get(key) || [];
    if (!children.length) break;
    let selected = children.find((m) => m.id === selections[key]) || null;
    if (!selected) selected = children[children.length - 1];
    if (!selected) break;
    path.push(selected);
    parentId = selected.id;
  }
  return path;
}

function getVisibleChatMessageIds(session) {
  return new Set(getVisibleChatPathForSession(session).map((m) => m.id));
}

function getVisibleSessionMessages(session) {
  if (!session || !Array.isArray(session.messages)) return [];
  ensureSessionMessageTreeState(session);
  const visibleChatIds = getVisibleChatMessageIds(session);
  const allChatIds = new Set(getSessionChatMessages(session).map((m) => m.id));
  return session.messages.filter((m) => {
    if (isChatMessageNode(m)) return visibleChatIds.has(m.id);
    if (isToolMessageNode(m)) {
      const anchorId = normalizeMessageTreeParentId(m.treeParentId);
      if (!anchorId) return true;
      if (!allChatIds.has(anchorId)) return true;
      return visibleChatIds.has(anchorId);
    }
    return true;
  });
}

function getVisibleChatLeafMessage(session) {
  const path = getVisibleChatPathForSession(session);
  return path.length ? path[path.length - 1] : null;
}

function setSessionBranchSelection(session, parentId, selectedMessageId) {
  if (!session) return false;
  ensureSessionMessageTreeState(session);
  const key = getMessageTreeParentKey(parentId);
  const msgId = String(selectedMessageId || '').trim();
  if (!msgId) return false;
  if (!session.messageTree || !session.messageTree.selections) return false;
  if (session.messageTree.selections[key] === msgId) return false;
  session.messageTree.selections[key] = msgId;
  const visiblePath = getVisibleChatPathForSession(session);
  session.messageTree.activeLeafId = visiblePath.length ? visiblePath[visiblePath.length - 1].id : '';
  touchSession(session);
  return true;
}

function getMessageSiblingBranchInfo(session, message, prebuiltIndex = null) {
  if (!session || !message || !isChatMessageNode(message)) return null;
  ensureSessionMessageTreeState(session);
  const idx = prebuiltIndex || buildSessionMessageTreeIndex(session);
  const parentId = normalizeMessageTreeParentId(message.treeParentId);
  const key = getMessageTreeParentKey(parentId);
  const siblings = (idx.childrenByParent.get(key) || []).filter(Boolean);
  if (!siblings.length) return null;
  const currentIndex = siblings.findIndex((m) => m.id === message.id);
  if (currentIndex < 0) return null;
  return {
    parentId,
    parentKey: key,
    siblings,
    index: currentIndex,
    count: siblings.length,
    hasPrev: currentIndex > 0,
    hasNext: currentIndex < siblings.length - 1
  };
}

function buildMessageBranchControlsHtml(session, message, prebuiltIndex = null) {
  if (!session || !message || !isChatMessageNode(message)) return '';
  const branch = getMessageSiblingBranchInfo(session, message, prebuiltIndex);
  const isGroupSession = Boolean(session.avatarId && (() => {
    const av = getAvatarById(session.avatarId);
    return av && av.type === 'group';
  })());
  const actions = [];
  if (message.role === 'assistant') {
    const disabled = state.ui.chatStreaming || isGroupSession;
    const title = isGroupSession ? '群聊分支重生成功能后续支持' : '重新生成此回复（形成分支）';
    actions.push(`<button class="msg-branch-btn" style="border:1px solid rgba(148,163,184,.35);background:#fff;border-radius:999px;padding:2px 8px;font-size:12px;color:#334155;cursor:pointer;" data-action="regen-branch" data-mid="${message.id}" type="button" ${disabled ? 'disabled' : ''} title="${escapeHtml(title)}">↻ 重新生成</button>`);
  } else if (message.role === 'user') {
    const disabled = state.ui.chatStreaming || isGroupSession;
    const title = isGroupSession ? '群聊编辑重发分支后续支持' : '编辑后重发（形成分支）';
    actions.push(`<button class="msg-branch-btn" style="border:1px solid rgba(148,163,184,.35);background:#fff;border-radius:999px;padding:2px 8px;font-size:12px;color:#334155;cursor:pointer;" data-action="edit-resend-branch" data-mid="${message.id}" type="button" ${disabled ? 'disabled' : ''} title="${escapeHtml(title)}">✎ 编辑重发</button>`);
  }
  let nav = '';
  if (branch && branch.count > 1) {
    nav = `
      <span class="msg-branch-nav" data-parent-key="${escapeAttr(branch.parentKey)}" style="display:inline-flex;align-items:center;gap:4px;">
        <button class="msg-branch-btn" style="border:1px solid rgba(148,163,184,.35);background:#fff;border-radius:999px;padding:2px 6px;font-size:12px;color:#334155;cursor:pointer;" data-action="branch-prev" data-mid="${message.id}" type="button" ${branch.hasPrev ? '' : 'disabled'} aria-label="Previous branch">◀</button>
        <span class="msg-branch-index" style="font-size:12px;color:#64748b;min-width:34px;text-align:center;">${branch.index + 1}/${branch.count}</span>
        <button class="msg-branch-btn" style="border:1px solid rgba(148,163,184,.35);background:#fff;border-radius:999px;padding:2px 6px;font-size:12px;color:#334155;cursor:pointer;" data-action="branch-next" data-mid="${message.id}" type="button" ${branch.hasNext ? '' : 'disabled'} aria-label="Next branch">▶</button>
      </span>
    `;
  }
  if (!actions.length && !nav) return '';
  return `<div class="msg-branch-controls" style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px;">${nav}${actions.join('')}</div>`;
}


/* ── Avatar (角色) CRUD ── */

function generateAvatarScenarioId(prefix = 'scn') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeAvatarScenario(raw, existing = null) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const prev = existing && typeof existing === 'object' ? existing : {};
  const id = String(src.id || prev.id || generateAvatarScenarioId()).trim().slice(0, 64);
  const title = String(src.title || prev.title || '').trim().slice(0, 80) || '默认开场';
  const description = String(src.description || prev.description || '').trim().slice(0, 240);
  const openingMessage = String(src.openingMessage || prev.openingMessage || '').replace(/\r/g, '').trim().slice(0, 4000);
  const tagsRaw = Array.isArray(src.tags) ? src.tags : (typeof src.tags === 'string' ? src.tags.split(/[\r\n,，;；]+/g) : (Array.isArray(prev.tags) ? prev.tags : []));
  const tags = [];
  const seen = new Set();
  for (const t of tagsRaw) {
    const s = String(t || '').trim().slice(0, 24);
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(s);
    if (tags.length >= 12) break;
  }
  const createdAt = Number(src.createdAt || prev.createdAt) || Date.now();
  const updatedAt = Number(src.updatedAt || prev.updatedAt) || Date.now();
  const useCount = Math.max(0, Number(src.useCount || prev.useCount || 0) || 0);
  return {
    id,
    title,
    description,
    openingMessage,
    tags,
    createdAt,
    updatedAt,
    useCount
  };
}

function normalizeAvatarScenarios(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => normalizeAvatarScenario(item))
    .filter((item) => item && item.openingMessage)
    .slice(0, 50);
}

function cloneAvatarScenarios(list) {
  return normalizeAvatarScenarios(list).map((item) => ({ ...item, tags: [...(item.tags || [])] }));
}

function getAvatarOpeningScenarios(avatar) {
  if (!avatar || typeof avatar !== 'object') return [];
  if (!Array.isArray(avatar.openingScenarios)) avatar.openingScenarios = [];
  avatar.openingScenarios = normalizeAvatarScenarios(avatar.openingScenarios);
  return avatar.openingScenarios;
}

function normalizeAvatarTags(raw, fallback = []) {
  const src = raw != null ? raw : fallback;
  const list = Array.isArray(src)
    ? src
    : (typeof src === 'string' ? src.split(/[\r\n,，;；|]+/g) : []);
  const out = [];
  const seen = new Set();
  for (const item of list) {
    const tag = String(item || '').trim().replace(/\s+/g, ' ').slice(0, 32);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= 20) break;
  }
  return out;
}

function getAvatarTags(avatar) {
  if (!avatar || typeof avatar !== 'object') return [];
  avatar.tags = normalizeAvatarTags(avatar.tags || []);
  return avatar.tags;
}

const GROUP_RELATION_TYPES = ['stranger', 'friend', 'rival'];

function groupRelationLabel(type) {
  const t = String(type || 'stranger');
  if (t === 'friend') return isZhUiLanguage() ? '朋友' : 'Friend';
  if (t === 'rival') return isZhUiLanguage() ? '对手' : 'Rival';
  return isZhUiLanguage() ? '陌生人' : 'Stranger';
}

function getGroupRelationPairKey(aId, bId) {
  const a = String(aId || '').trim();
  const b = String(bId || '').trim();
  if (!a || !b) return '';
  return [a, b].sort().join('::');
}

function clampGroupSpectatorRounds(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function normalizeGroupRelationMap(raw, memberIds) {
  const out = {};
  const src = (raw && typeof raw === 'object') ? raw : {};
  const ids = Array.isArray(memberIds) ? memberIds.map((id) => String(id || '').trim()).filter(Boolean) : [];
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const key = getGroupRelationPairKey(ids[i], ids[j]);
      if (!key) continue;
      const val = String(src[key] || 'stranger').trim().toLowerCase();
      out[key] = GROUP_RELATION_TYPES.includes(val) ? val : 'stranger';
    }
  }
  return out;
}

function normalizeGroupChatSettings(raw, memberIds) {
  const src = (raw && typeof raw === 'object') ? raw : {};
  return {
    allowAiCrossTalk: src.allowAiCrossTalk !== false,
    spectatorRoundsPerTrigger: clampGroupSpectatorRounds(src.spectatorRoundsPerTrigger),
    lastSpeakerId: String(src.lastSpeakerId || '').trim(),
    relationMap: normalizeGroupRelationMap(src.relationMap, memberIds)
  };
}

function ensureGroupChatSettings(group) {
  if (!group || group.type !== 'group') return null;
  group.groupChatSettings = normalizeGroupChatSettings(group.groupChatSettings, group.memberIds || []);
  return group.groupChatSettings;
}

function getGroupPairRelationType(group, aId, bId) {
  const settings = ensureGroupChatSettings(group);
  if (!settings) return 'stranger';
  const key = getGroupRelationPairKey(aId, bId);
  if (!key) return 'stranger';
  const v = String(settings.relationMap && settings.relationMap[key] || 'stranger').trim().toLowerCase();
  return GROUP_RELATION_TYPES.includes(v) ? v : 'stranger';
}

function getGroupRelationHintsForSpeaker(group, speaker, members) {
  if (!group || !speaker || !Array.isArray(members)) return [];
  return members
    .filter((m) => m && m.id !== speaker.id)
    .map((m) => ({
      memberId: m.id,
      name: m.name,
      type: getGroupPairRelationType(group, speaker.id, m.id)
    }));
}

function getGroupOrderedMembersForTurn(group, members) {
  if (!group || !Array.isArray(members) || members.length <= 1) return [...(members || [])];
  const settings = ensureGroupChatSettings(group);
  if (!settings) return [...members];
  const lastId = String(settings.lastSpeakerId || '').trim();
  const startIdxBase = lastId ? members.findIndex((m) => m && m.id === lastId) : -1;
  const startIdx = startIdxBase >= 0 ? ((startIdxBase + 1) % members.length) : 0;
  const ordered = [];
  for (let i = 0; i < members.length; i += 1) {
    ordered.push(members[(startIdx + i) % members.length]);
  }
  return ordered.filter(Boolean);
}

function normalizeSpeakerTagKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\s\[\]【】()（）:：'"`~!@#$%^&*+=,，.。!?！？/\\|<>《》_-]+/g, '');
}

function isGroupReplyTaggedLine(line) {
  return /^\s*[\[【(（]?\s*[^:\]】)）]{1,80}\s*[\]】)）]?\s*[:：]\s+/.test(String(line || ''));
}

function parseGroupReplyTaggedLine(line) {
  const s = String(line || '');
  const m = s.match(/^\s*[\[【(（]?\s*([^:\]】)）]{1,80})\s*[\]】)）]?\s*[:：]\s*(.*)$/);
  if (!m) return null;
  return {
    speakerLabel: String(m[1] || '').trim(),
    text: String(m[2] || '').trim()
  };
}

function isCurrentGroupSpeakerLabel(label, member) {
  const tagKey = normalizeSpeakerTagKey(label);
  const nameKey = normalizeSpeakerTagKey(member && member.name);
  if (!tagKey || !nameKey) return false;
  return tagKey === nameKey || tagKey.includes(nameKey) || nameKey.includes(tagKey);
}

function dedupeRepeatedLines(lines, maxRepeat = 1) {
  const out = [];
  let prevKey = '';
  let repeat = 0;
  for (const rawLine of (Array.isArray(lines) ? lines : [])) {
    const line = String(rawLine || '').trimEnd();
    const key = line.replace(/\s+/g, ' ').trim();
    if (!key) {
      if (out.length && out[out.length - 1] !== '') out.push('');
      prevKey = '';
      repeat = 0;
      continue;
    }
    if (key === prevKey) {
      repeat += 1;
      if (repeat > maxRepeat) continue;
    } else {
      prevKey = key;
      repeat = 1;
    }
    out.push(line);
  }
  while (out.length && !String(out[out.length - 1] || '').trim()) out.pop();
  return out;
}

function sanitizeGroupSpeakerReplyContent(content, member, members) {
  const raw = String(content || '').replace(/\r/g, '').trim();
  if (!raw) return '';
  const lines = raw.split('\n');
  const hasTaggedLines = lines.some(isGroupReplyTaggedLine);
  let collected = [];
  let startedFromTaggedCurrent = false;
  let seenTaggedBoundary = false;

  if (hasTaggedLines) {
    for (const line of lines) {
      const parsed = parseGroupReplyTaggedLine(line);
      if (!parsed) {
        if (!seenTaggedBoundary) {
          // Keep natural untagged opener text before model starts scripting multiple speakers.
          collected.push(String(line || ''));
          continue;
        }
        if (startedFromTaggedCurrent && collected.length) {
          collected.push(String(line || ''));
        }
        continue;
      }
      seenTaggedBoundary = true;
      const isCurrent = isCurrentGroupSpeakerLabel(parsed.speakerLabel, member);
      if (isCurrent) {
        startedFromTaggedCurrent = true;
        if (parsed.text) collected.push(parsed.text);
        continue;
      }
      // Another speaker/user tag appeared.
      if (collected.some((l) => String(l || '').trim())) break;
      // If we haven't collected anything meaningful yet, keep scanning for current speaker.
    }
  } else {
    collected = [...lines];
  }

  if (!collected.some((l) => String(l || '').trim())) {
    // If the model scripted multiple speakers and we could not match the current
    // speaker label (e.g. translated/aliased names), keep only the first tagged
    // speaker's first segment to avoid preserving a whole dialogue script.
    if (hasTaggedLines) {
      let firstSpeakerKey = '';
      let fallbackCollected = [];
      for (const line of lines) {
        const parsed = parseGroupReplyTaggedLine(line);
        if (!parsed) {
          if (fallbackCollected.some((l) => String(l || '').trim())) {
            fallbackCollected.push(String(line || ''));
          }
          continue;
        }
        const speakerKey = normalizeSpeakerTagKey(parsed.speakerLabel);
        if (!firstSpeakerKey) firstSpeakerKey = speakerKey;
        if (speakerKey && firstSpeakerKey && speakerKey !== firstSpeakerKey) {
          if (fallbackCollected.some((l) => String(l || '').trim())) break;
          continue;
        }
        if (parsed.text) fallbackCollected.push(parsed.text);
      }
      if (fallbackCollected.some((l) => String(l || '').trim())) {
        collected = fallbackCollected;
      }
    }
  }

  if (!collected.some((l) => String(l || '').trim())) {
    collected = [...lines];
  }

  collected = dedupeRepeatedLines(collected, 1);
  let text = collected.join('\n').trim();

  // Strip self-tag prefix that may still remain on first line.
  const firstParsed = parseGroupReplyTaggedLine(text.split('\n')[0] || '');
  if (firstParsed && isCurrentGroupSpeakerLabel(firstParsed.speakerLabel, member)) {
    const rest = text.split('\n');
    rest[0] = firstParsed.text;
    text = rest.join('\n').trim();
  }

  // Hard cap group single-turn reply length to reduce runaway output and translation stalls.
  const hardLimit = 900;
  if (text.length > hardLimit) {
    const slice = text.slice(0, hardLimit);
    const cutIdx = Math.max(
      slice.lastIndexOf('\n'),
      slice.lastIndexOf('。'),
      slice.lastIndexOf('！'),
      slice.lastIndexOf('!'),
      slice.lastIndexOf('？'),
      slice.lastIndexOf('?')
    );
    text = (cutIdx > 120 ? slice.slice(0, cutIdx) : slice).trim();
    if (!/[。！？!?…]$/.test(text)) text += '…';
  }
  return text || raw;
}

function detectGroupReplyRunawayDuringStream(content, member, members) {
  const raw = String(content || '').replace(/\r/g, '');
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const lines = raw.split('\n').map((line) => String(line || '').trim()).filter(Boolean);
  const taggedLines = [];
  const taggedSpeakerKeys = new Set();
  let foreignTaggedCount = 0;
  for (const line of lines) {
    const parsed = parseGroupReplyTaggedLine(line);
    if (!parsed) continue;
    taggedLines.push(parsed);
    const tagKey = normalizeSpeakerTagKey(parsed.speakerLabel);
    if (tagKey) taggedSpeakerKeys.add(tagKey);
    if (!isCurrentGroupSpeakerLabel(parsed.speakerLabel, member)) foreignTaggedCount += 1;
  }

  const deduped = dedupeRepeatedLines(lines, 1);
  const removedRepeats = Math.max(0, lines.length - deduped.filter((l) => String(l || '').trim()).length);
  const hasLoopPattern = removedRepeats >= 2;
  const hasMultiSpeakerScript = (foreignTaggedCount >= 1 && taggedLines.length >= 2)
    || (taggedSpeakerKeys.size >= 2 && taggedLines.length >= 2);
  const tooManyTaggedTurns = taggedLines.length >= 3;
  const tooLong = trimmed.length > 1400;

  if (!(hasLoopPattern || hasMultiSpeakerScript || tooManyTaggedTurns || tooLong)) return null;

  let sanitized = sanitizeGroupSpeakerReplyContent(trimmed, member, members);

  const aggressiveCut = hasLoopPattern || hasMultiSpeakerScript || tooManyTaggedTurns;
  if (aggressiveCut) {
    // Stronger single-turn cutoff only when we detect scripting/looping.
    const firstBlock = String(sanitized || '')
      .split(/\n{2,}/g)
      .map((s) => s.trim())
      .filter(Boolean)[0] || '';
    if (firstBlock) sanitized = firstBlock;

    const firstLines = String(sanitized || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
    if (firstLines.length) sanitized = dedupeRepeatedLines(firstLines, 1).join('\n').trim();

    if (!sanitized) sanitized = trimmed.slice(0, 240).trim();
    if (sanitized.length > 260) {
      const cut = sanitized.slice(0, 260);
      const p = Math.max(cut.lastIndexOf('。'), cut.lastIndexOf('！'), cut.lastIndexOf('!'), cut.lastIndexOf('？'), cut.lastIndexOf('?'), cut.lastIndexOf('\n'));
      sanitized = (p > 60 ? cut.slice(0, p) : cut).trim();
    }
  } else if (tooLong) {
    // Legit long single-speaker reply: keep more content, just prevent UI/translation runaway.
    if (!sanitized) sanitized = trimmed.slice(0, 900).trim();
    if (sanitized.length > 900) {
      const cut = sanitized.slice(0, 900);
      const p = Math.max(cut.lastIndexOf('。'), cut.lastIndexOf('！'), cut.lastIndexOf('!'), cut.lastIndexOf('？'), cut.lastIndexOf('?'), cut.lastIndexOf('\n'));
      sanitized = (p > 140 ? cut.slice(0, p) : cut).trim();
    }
  }
  if (sanitized && !/[。！？!?…]$/.test(sanitized)) sanitized += '…';

  return {
    reason: hasLoopPattern ? 'repeat-loop' : (hasMultiSpeakerScript ? 'multi-speaker-script' : (tooLong ? 'too-long' : 'tagged-turns')),
    content: sanitized
  };
}

function normalizeGroupLoopComparableText(text) {
  return String(text || '')
    .replace(/\r/g, '')
    .replace(/\[[^\]]{1,80}\]\s*[:：]\s*/g, '')
    .replace(/[【】[\]()（）"'`]/g, '')
    .replace(/\s+/g, '')
    .replace(/[。！？!?…~～,.，、]/g, '')
    .trim()
    .toLowerCase();
}

function buildGroupLoopBreakHint(session) {
  if (!session || !Array.isArray(session.messages)) return '';
  const visible = getVisibleSessionMessages(session)
    .filter((m) => {
      if (!(m && m.kind === 'chat' && m.role === 'assistant' && m.speakerAvatarId)) return false;
      const text = String(m.content || '').trim();
      if (!text) return false;
      if (/^(未收到有效回复，请重试。|本轮未生成有效回复（已跳过该角色本轮发言）。)$/.test(text)) return false;
      return true;
    })
    .slice(-8);
  if (visible.length < 4) return '';
  const keys = visible.map((m) => ({
    id: m.id,
    speakerAvatarId: m.speakerAvatarId,
    text: String(m.content || '').trim(),
    key: normalizeGroupLoopComparableText(m.content || '')
  })).filter((x) => x.key);
  if (keys.length < 4) return '';

  const last4 = keys.slice(-4);
  const shortRepeatLoop = last4.every((x) => x.key.length > 0 && x.key.length <= 12) && new Set(last4.map((x) => x.key)).size <= 2;
  const sameCount = new Map();
  for (const item of keys) sameCount.set(item.key, (sameCount.get(item.key) || 0) + 1);
  const maxRepeat = Math.max(...Array.from(sameCount.values()));
  const obviousFarewellLoop = last4.some((x) => /(再见|またね|bye|goodbye)/i.test(x.text));

  if (shortRepeatLoop || maxRepeat >= 3 || obviousFarewellLoop) {
    return '注意：最近群聊出现重复寒暄/重复句循环。请换一个新话题或推进情节，不要继续重复“再见/好的/嗯嗯”等短句。';
  }
  return '';
}

function getAvatarScenarioDraftItems() {
  return cloneAvatarScenarios(avatarScenarioRuntime.draftItems || []);
}

function setAvatarScenarioDraftItems(list) {
  avatarScenarioRuntime.draftItems = cloneAvatarScenarios(list || []);
}

function hasChatMessages(session) {
  return Boolean(session && Array.isArray(session.messages) && session.messages.some((m) => m && m.kind === 'chat'));
}

function clampAvatarRating(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(5, Math.round(n)));
}

function getAvatarRating(avatar) {
  return clampAvatarRating(avatar && avatar.rating);
}

function setAvatarRating(avatarId, rating) {
  const avatar = getAvatarById(avatarId);
  if (!avatar) return false;
  avatar.rating = clampAvatarRating(rating);
  persistAvatars();
  if (state.ui.sidebarTab === 'contacts') renderContactList();
  renderAvatarList();
  renderAvatarSelectPanel();
  if (avatarGalleryRuntime.modalReady) renderAvatarGallery();
  if (avatarGalleryRuntime.detailModalReady && avatarGalleryRuntime.detailUi && avatarGalleryRuntime.detailUi.backdrop.classList.contains('open')) {
    renderAvatarGalleryDetail(getAvatarById(avatarId) || avatar);
  }
  return true;
}

function recordAvatarUsage(avatarId, amount = 1) {
  const avatar = getAvatarById(avatarId);
  if (!avatar) return;
  const inc = Math.max(1, Number(amount || 1) || 1);
  avatar.usageCount = Math.max(0, Number(avatar.usageCount || 0) || 0) + inc;
  persistAvatars();
  if (avatarGalleryRuntime.modalReady) renderAvatarGallery();
  if (avatarGalleryRuntime.detailModalReady && avatarGalleryRuntime.detailUi && avatarGalleryRuntime.detailUi.backdrop.classList.contains('open')) {
    renderAvatarGalleryDetail(getAvatarById(avatarId) || avatar);
  }
}

function loadAvatars() {
  try {
    const raw = localStorage.getItem(STORAGE_AVATARS_KEY);
    if (!raw) { state.avatars = []; return; }
    const parsed = JSON.parse(raw);
    state.avatars = Array.isArray(parsed)
      ? parsed.filter(isValidAvatar).map((avatar) => ({
          ...avatar,
          rating: clampAvatarRating(avatar.rating),
          usageCount: Math.max(0, Number(avatar.usageCount || 0) || 0),
          tags: normalizeAvatarTags(avatar.tags || []),
          openingScenarios: normalizeAvatarScenarios(avatar.openingScenarios || [])
        })).map((avatar) => {
          if (avatar && avatar.type === 'group') ensureGroupChatSettings(avatar);
          return avatar;
        })
      : [];
  } catch (_) { state.avatars = []; }
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
    rating: clampAvatarRating(data.rating || 0),
    usageCount: Math.max(0, Number(data.usageCount || 0) || 0),
    tags: normalizeAvatarTags(data.tags || []),
    openingScenarios: normalizeAvatarScenarios(data.openingScenarios || []),
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
  avatar.rating = clampAvatarRating(data.rating != null ? data.rating : avatar.rating);
  avatar.tags = normalizeAvatarTags(data.tags != null ? data.tags : avatar.tags || []);
  avatar.openingScenarios = normalizeAvatarScenarios(data.openingScenarios || avatar.openingScenarios || []);
  avatar.usageCount = Math.max(0, Number(avatar.usageCount || 0) || 0);
  avatar.promptMode = derivePromptMode(avatar.customPrompt, avatar.memoryText);
  persistAvatars();
}

function deleteAvatar(id) {
  state.avatars = state.avatars.filter((a) => a.id !== id);
  state.sessions.forEach((s) => {
    if (s.avatarId === id) s.avatarId = null;
    if (s.contactOwnerAvatarId === id) delete s.contactOwnerAvatarId;
  });
  persistAvatars();
  persistSessionsState();
}

function resolveContactSession(avatarId, options = {}) {
  const { createIfMissing = false, focus = false } = options;
  if (!avatarId) return null;
  const avatar = getAvatarById(avatarId);
  if (!avatar) return null;

  let session = null;
  if (avatar.contactSessionId) {
    session = state.sessions.find((s) => s.id === avatar.contactSessionId && s.avatarId === avatarId) || null;
  }

  if (!session) {
    const candidates = state.sessions.filter((s) => s.avatarId === avatarId);
    session = candidates.find((s) => s.contactOwnerAvatarId === avatarId) || null;
    if (!session) {
      session = candidates.find((s) => String(s.title || '').trim() === String(avatar.name || '').trim()) || null;
    }
    if (!session && candidates.length) {
      // Fallback to the oldest bound session; imported contact session is usually the earliest one.
      session = candidates.slice().sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0))[0];
    }
    if (session) {
      session.contactOwnerAvatarId = avatarId;
      avatar.contactSessionId = session.id;
      persistAvatars();
      persistSessionsState();
    }
  }

  if (!session && createIfMissing) {
    createSession(avatar.name || '联系人会话');
    session = getActiveSession();
    if (session) {
      session.avatarId = avatarId;
      session.contactOwnerAvatarId = avatarId;
      avatar.contactSessionId = session.id;
      touchSession(session);
      persistAvatars();
      persistSessionsState();
      renderSessionList();
      renderAvatarSelectPanel();
    }
  }

  if (session && focus) {
    switchSession(session.id);
  }
  return session;
}

function isContactDedicatedSession(session) {
  return Boolean(session && session.contactOwnerAvatarId);
}

function getRegularSessions() {
  return state.sessions.filter((s) => !isContactDedicatedSession(s));
}

/* ── Tavern Character Card Import (酒馆卡片导入) ── */

function getTavernCardData(raw) {
  return (raw && raw.spec === 'chara_card_v2' && raw.data) ? raw.data : (raw || {});
}

function collectTagValuesFromUnknown(input, out) {
  if (!input) return;
  if (Array.isArray(input)) {
    for (const item of input) collectTagValuesFromUnknown(item, out);
    return;
  }
  if (typeof input === 'string') {
    out.push(...normalizeAvatarTags(input));
    return;
  }
  if (typeof input === 'object') {
    if (typeof input.name === 'string') out.push(input.name);
    if (typeof input.tag === 'string') out.push(input.tag);
    if (typeof input.label === 'string') out.push(input.label);
  }
}

function extractTavernCardTags(raw) {
  const d = getTavernCardData(raw);
  const found = [];
  collectTagValuesFromUnknown(d.tags, found);
  collectTagValuesFromUnknown(d.tag, found);
  if (d.extensions && typeof d.extensions === 'object') {
    collectTagValuesFromUnknown(d.extensions.tags, found);
    if (d.extensions.chub && typeof d.extensions.chub === 'object') {
      collectTagValuesFromUnknown(d.extensions.chub.tags, found);
      collectTagValuesFromUnknown(d.extensions.chub.tag_list, found);
      collectTagValuesFromUnknown(d.extensions.chub.categories, found);
    }
  }
  return normalizeAvatarTags(found);
}

function extractTavernWorldbookRawEntries(raw) {
  const d = getTavernCardData(raw);
  const candidates = [
    d.character_book,
    d.characterBook,
    d.worldbook,
    d.world_book,
    d.lorebook,
    raw && raw.character_book,
    raw && raw.characterBook,
    raw && raw.worldbook,
    raw && raw.world_book
  ];
  for (const book of candidates) {
    if (!book) continue;
    if (Array.isArray(book)) return book;
    if (Array.isArray(book.entries)) return book.entries;
    if (book.entries && typeof book.entries === 'object') return Object.values(book.entries);
  }
  return [];
}

function normalizeImportedTavernLorebookEntries(raw, avatarId = '') {
  const list = extractTavernWorldbookRawEntries(raw);
  if (!list.length) return [];
  const out = [];
  for (let i = 0; i < list.length; i += 1) {
    const src = list[i];
    if (!src || typeof src !== 'object') continue;
    const content = String(src.content ?? src.entry ?? src.text ?? '').replace(/\r/g, '').trim();
    if (!content) continue;
    const keys = []
      .concat(Array.isArray(src.keys) ? src.keys : (src.keys != null ? [src.keys] : []))
      .concat(Array.isArray(src.secondary_keys) ? src.secondary_keys : (src.secondary_keys != null ? [src.secondary_keys] : []))
      .concat(Array.isArray(src.secondaryKeys) ? src.secondaryKeys : (src.secondaryKeys != null ? [src.secondaryKeys] : []))
      .map((v) => String(v || '').trim())
      .filter(Boolean);
    const keywords = splitLorebookKeywordsInput(keys.join('\n'));
    const alwaysOn = Boolean(src.constant || src.always_on || src.alwaysOn) || (!keywords.length || src.selective === false);
    const title = String(
      src.comment ?? src.name ?? src.title ?? src.key ?? (keywords[0] || `导入世界书词条 ${i + 1}`)
    ).trim().slice(0, 120) || `导入世界书词条 ${i + 1}`;
    const tags = normalizeAvatarTags(
      []
        .concat(Array.isArray(src.tags) ? src.tags : (src.tags != null ? [src.tags] : []))
        .concat(Array.isArray(src.group) ? src.group : (src.group != null ? [src.group] : []))
        .concat(Array.isArray(src.category) ? src.category : (src.category != null ? [src.category] : []))
    );
    out.push({
      title,
      content: content.slice(0, 12000),
      keywords,
      enabled: src.enabled !== false,
      alwaysOn: Boolean(alwaysOn),
      priority: Math.max(0, Math.min(1000, Number(src.insertion_order ?? src.order ?? src.priority ?? 50) || 50)),
      scopeType: 'avatar',
      scopeId: String(avatarId || '').trim(),
      tags
    });
    if (out.length >= 80) break;
  }
  return out;
}

async function importLorebookEntriesForAvatar(avatarId, entries) {
  const id = String(avatarId || '').trim();
  const list = Array.isArray(entries) ? entries : [];
  if (!id || !list.length) return { total: 0, imported: 0, failed: 0 };
  const results = await Promise.allSettled(
    list.map((entry) => apiRequest('/api/lorebooks', {
      method: 'POST',
      body: JSON.stringify({ ...entry, scopeType: 'avatar', scopeId: id })
    }))
  );
  let imported = 0;
  let failed = 0;
  for (const item of results) {
    if (item.status === 'fulfilled') imported += 1;
    else failed += 1;
  }
  return { total: list.length, imported, failed };
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
  const importedCardTags = extractTavernCardTags(raw);

  const avatar = createAvatar({
    name: card.name,
    icon: iconDataUrl || '🎭',
    customPrompt: card.customPrompt,
    memoryText: '',
    tags: importedCardTags,
    openingScenarios: card.firstMessage
      ? [{
          title: '默认开场',
          description: '导入酒馆卡时自动生成',
          openingMessage: String(card.firstMessage || '').trim(),
          tags: ['导入']
        }]
      : []
  });

  // create a new session bound to this avatar
  createSession(card.name);
  const session = getActiveSession();
  if (session) {
    session.avatarId = avatar.id;
    session.contactOwnerAvatarId = avatar.id;
    avatar.contactSessionId = session.id;
    if (card.firstMessage) {
      const msgId = `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      session.messages.push({
        id: msgId,
        kind: 'chat',
        role: 'assistant',
        content: card.firstMessage,
        createdAt: Date.now(),
        treeNodeId: msgId,
        treeParentId: null
      });
      ensureSessionMessageTreeState(session);
      setSessionBranchSelection(session, null, msgId);
    }
    touchSession(session);
    persistAvatars();
    persistSessionsState();
  }

  let lorebookImport = { total: 0, imported: 0, failed: 0 };
  const importedLorebookEntries = normalizeImportedTavernLorebookEntries(raw, avatar.id);
  if (importedLorebookEntries.length) {
    try {
      lorebookImport = await importLorebookEntriesForAvatar(avatar.id, importedLorebookEntries);
    } catch (_) {
      lorebookImport = { total: importedLorebookEntries.length, imported: 0, failed: importedLorebookEntries.length };
    }
    try { if (lorebookRuntime && lorebookRuntime.sectionReady) loadLorebookList({ force: true, silent: true }); } catch (_) {}
  }

  renderAvatarList();
  renderAvatarSelectPanel();
  renderSessionList();
  renderMessages();
  return {
    name: card.name,
    tagsCount: importedCardTags.length,
    lorebookTotal: lorebookImport.total,
    lorebookImported: lorebookImport.imported,
    lorebookFailed: lorebookImport.failed
  };
}

/* ── Sidebar Tabs + Contact List + Group ── */

function switchSidebarTab(tab) {
  if (tab === 'sessions') {
    const active = getActiveSession();
    if (!active || isContactDedicatedSession(active)) {
      const regular = sortSessions(getRegularSessions())[0] || null;
      if (regular) {
        switchSession(regular.id);
      } else {
        createSession('新会话');
        syncMaterialsFromSession();
        renderMessages();
        renderDrawer();
        renderAvatarSelectPanel();
      }
    }
  }

  state.ui.sidebarTab = tab;
  localStorage.setItem('chatbox_sidebar_tab_v1', tab);
  if (els.tabSessions) els.tabSessions.classList.toggle('active', tab === 'sessions');
  if (els.tabContacts) els.tabContacts.classList.toggle('active', tab === 'contacts');
  if (els.sessionsPane) els.sessionsPane.classList.toggle('hidden', tab !== 'sessions');
  if (els.contactsPane) els.contactsPane.classList.toggle('hidden', tab !== 'contacts');
  if (tab === 'sessions') renderSessionList();
  if (tab === 'contacts') {
    ensureContactsLorebookShortcut();
    refreshContactsLorebookShortcut();
    renderContactList();
  }
}

function renderContactList() {
  if (!els.contactList) return;
  const avatars = state.avatars;
  const activeSession = getActiveSession();
  const activeAvatarId = (state.ui.activeContactAvatarId || (activeSession && activeSession.avatarId) || '');
  if (!avatars.length) {
    els.contactList.innerHTML = '<div class="muted">还没有联系人，导入酒馆卡片或在设置中创建角色</div>';
    refreshContactsLorebookShortcut();
    return;
  }
  const avatarsOrdered = avatars.slice().sort((a, b) => {
    const sa = resolveContactSession(a.id, { createIfMissing: false, focus: false });
    const sb = resolveContactSession(b.id, { createIfMissing: false, focus: false });
    const aLastMsg = sa && Array.isArray(sa.messages) && sa.messages.length
      ? Math.max(...sa.messages.map((m) => Number(m && m.createdAt || 0)))
      : 0;
    const bLastMsg = sb && Array.isArray(sb.messages) && sb.messages.length
      ? Math.max(...sb.messages.map((m) => Number(m && m.createdAt || 0)))
      : 0;
    const aTs = Math.max(Number(sa && sa.updatedAt || 0), aLastMsg, Number(a && a.updatedAt || 0), Number(a && a.createdAt || 0));
    const bTs = Math.max(Number(sb && sb.updatedAt || 0), bLastMsg, Number(b && b.updatedAt || 0), Number(b && b.createdAt || 0));
    if (aTs !== bTs) return bTs - aTs;
    return String(a && a.name || '').localeCompare(String(b && b.name || ''));
  });

  els.contactList.innerHTML = avatarsOrdered.map((a) => {
    const isGroup = a.type === 'group';
    const iconVal = a.icon || (isGroup ? '👥' : '😀');
    const iconHtml = iconVal.startsWith('data:image')
      ? `<img src="${iconVal}" alt="avatar">`
      : iconVal;
    const boundSession = resolveContactSession(a.id, { createIfMissing: false, focus: false });
    const preview = boundSession ? getOverlaySessionPreview(boundSession) : '暂无消息';
    const badge = isGroup ? '<span class="contact-badge">群组</span>' : '';
    const isActive = activeAvatarId && a.id === activeAvatarId;
    const activeItemStyle = isActive
      ? 'background:linear-gradient(180deg, rgba(239,246,255,.95), rgba(238,242,255,.92)); border-color:rgba(59,130,246,.35); box-shadow:0 0 0 1px rgba(59,130,246,.22), 0 8px 18px rgba(59,130,246,.12);'
      : '';
    const activeShortcutStyle = isActive
      ? 'background:rgba(59,130,246,.08);border-color:rgba(59,130,246,.28);box-shadow:0 0 0 1px rgba(59,130,246,.12) inset;'
      : '';
    return `
      <div class="contact-item-row" style="display:flex;align-items:stretch;gap:8px;">
        <button class="contact-item${isActive ? ' active' : ''}" data-action="open-contact" data-avatar-id="${a.id}" type="button" aria-pressed="${isActive ? 'true' : 'false'}" style="flex:1;min-width:0;${activeItemStyle}">
          <span class="contact-icon">${iconHtml}</span>
          <div class="contact-info">
            <div class="contact-name">${escapeHtml(a.name)} ${badge}</div>
            <div class="contact-preview">${escapeHtml(preview)}</div>
          </div>
        </button>
        <button
          class="btn ghost contact-lorebook-shortcut-btn"
          data-action="open-contact-lorebook"
          data-avatar-id="${a.id}"
          type="button"
          title="打开 ${escapeHtml(a.name)} 的世界观书（Lorebook）"
          aria-label="打开 ${escapeHtml(a.name)} 的世界观书"
          style="padding:0 10px;min-width:44px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:18px;${activeShortcutStyle}"
        >📚</button>
      </div>
    `;
  }).join('');
  refreshContactsLorebookShortcut();
}

function openContact(avatarId) {
  if (!avatarId) return;
  state.ui.activeContactAvatarId = avatarId;
  const avatar = getAvatarById(avatarId);
  const session = resolveContactSession(avatarId, { createIfMissing: true, focus: true });
  if (!session) return;
  updateAvatarBtnLabel();
  if (state.ui.sidebarTab === 'contacts') {
    renderContactList();
  }
  refreshContactsLorebookShortcut();
  if (avatar) {
    setTimeout(() => {
      try { maybeOfferAvatarOpeningScene(session, avatar); } catch (_) {}
    }, 0);
  }
  if (els.chatInput) els.chatInput.focus();
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
  ensureGroupChatSettings(group);
  state.avatars.unshift(group);
  persistAvatars();
  els.groupDialog.close();
  renderContactList();
  renderAvatarSelectPanel();
}

/* ── Avatar UI (设置面板 + 选择器) ── */

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
    const sceneCount = getAvatarOpeningScenarios(a).length;
    const usageCount = Math.max(0, Number(a.usageCount || 0) || 0);
    return `
    <div class="avatar-card" data-avatar-id="${a.id}">
      ${iconHtml}
      <div class="avatar-card-info">
        <span class="avatar-card-name">${escapeHtml(a.name)}</span>
        <span class="avatar-tag">${promptModeLabel(a.promptMode)} · 开场${sceneCount} · 使用${usageCount}</span>
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
  setAvatarScenarioDraftItems([]);
  renderAvatarScenarioDraftList();
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
  setAvatarScenarioDraftItems(getAvatarOpeningScenarios(avatar));
  renderAvatarScenarioDraftList();
  els.avatarFormTitle.textContent = '编辑角色';
  els.avatarCancelBtn.classList.remove('hidden');
}

function getPersonasSettingsSection() {
  return els.settingsPanel ? els.settingsPanel.querySelector('.settings-section[data-section="personas"]') : null;
}

function ensureAvatarScenarioManagerUi() {
  const section = getPersonasSettingsSection();
  if (!section) return null;
  let host = section.querySelector('#avatarScenarioManagerBlock');
  if (host) return host;
  ensureToolUiInjectedStyle();

  const actionsRow = section.querySelector('.setting-row-actions');
  host = document.createElement('div');
  host.id = 'avatarScenarioManagerBlock';
  host.className = 'settings-group';
  host.innerHTML = `
    <h4>情景预设 / 开场白</h4>
    <div style="padding:12px 14px;border:1px solid rgba(148,163,184,.28);border-radius:12px;background:rgba(248,250,252,.75);">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <div style="min-width:0;flex:1;">
          <div style="font-weight:700;">角色开场场景</div>
          <div id="avatarScenarioSummary" class="muted" style="font-size:12px;line-height:1.45;margin-top:4px;">为当前角色绑定多个开场场景，聊天时可选一个直接开始。</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button id="avatarScenarioGalleryBtn" class="btn ghost" type="button">🖼️ 打开画廊</button>
          <button id="avatarScenarioAddBtn" class="btn ghost" type="button">+ 添加场景</button>
          <button id="avatarScenarioClearBtn" class="btn ghost" type="button">清空草稿</button>
        </div>
      </div>
      <div id="avatarScenarioDraftList" style="display:grid;gap:10px;margin-top:10px;"></div>
      <div id="avatarScenarioDraftStatus" class="muted" style="font-size:12px;margin-top:8px;min-height:18px;"></div>
    </div>
  `;
  if (actionsRow && actionsRow.parentElement === section) section.insertBefore(host, actionsRow);
  else section.appendChild(host);

  const listEl = host.querySelector('#avatarScenarioDraftList');
  const galleryBtn = host.querySelector('#avatarScenarioGalleryBtn');
  const addBtn = host.querySelector('#avatarScenarioAddBtn');
  const clearBtn = host.querySelector('#avatarScenarioClearBtn');
  const statusEl = host.querySelector('#avatarScenarioDraftStatus');

  if (galleryBtn) {
    galleryBtn.addEventListener('click', () => {
      const selectedAvatarId = String(els.avatarEditId && els.avatarEditId.value || '').trim();
      const avatarName = String(els.avatarNameInput && els.avatarNameInput.value || '').trim();
      openAvatarGalleryModal({
        source: 'personas',
        selectedAvatarId: selectedAvatarId || '',
        search: selectedAvatarId ? '' : avatarName
      });
    });
  }
  if (addBtn) addBtn.addEventListener('click', () => openAvatarScenarioEditorModal({ mode: 'create' }));
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!avatarScenarioRuntime.draftItems.length) return;
      if (!window.confirm('确认清空当前角色表单中的开场场景草稿？')) return;
      setAvatarScenarioDraftItems([]);
      renderAvatarScenarioDraftList();
      if (statusEl) statusEl.textContent = '已清空开场场景草稿。';
    });
  }
  if (listEl) {
    listEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action][data-scenario-id]');
      if (!btn) return;
      const action = btn.dataset.action || '';
      const scenarioId = btn.dataset.scenarioId || '';
      if (!action || !scenarioId) return;
      if (action === 'edit') {
        const item = (avatarScenarioRuntime.draftItems || []).find((s) => s.id === scenarioId);
        if (item) openAvatarScenarioEditorModal({ mode: 'edit', scenario: item });
        return;
      }
      if (action === 'delete') {
        avatarScenarioRuntime.draftItems = (avatarScenarioRuntime.draftItems || []).filter((s) => s.id !== scenarioId);
        renderAvatarScenarioDraftList();
        if (statusEl) statusEl.textContent = '场景已删除（角色保存后生效）。';
      }
    });
  }

  avatarScenarioRuntime.initialized = true;
  return host;
}

function renderAvatarScenarioDraftList() {
  const host = ensureAvatarScenarioManagerUi();
  if (!host) return;
  const listEl = host.querySelector('#avatarScenarioDraftList');
  const summaryEl = host.querySelector('#avatarScenarioSummary');
  const statusEl = host.querySelector('#avatarScenarioDraftStatus');
  if (!listEl || !summaryEl) return;

  const avatarName = String(els.avatarNameInput && els.avatarNameInput.value || '').trim();
  const items = cloneAvatarScenarios(avatarScenarioRuntime.draftItems || []);
  avatarScenarioRuntime.draftItems = items;
  summaryEl.textContent = avatarName
    ? `当前角色：${avatarName} · 已绑定 ${items.length} 个开场场景。用户可在开始聊天时直接选择开场。`
    : `当前为新角色草稿 · 已配置 ${items.length} 个开场场景。保存角色后可使用。`;
  if (statusEl && !statusEl.textContent) statusEl.textContent = '';

  if (!items.length) {
    listEl.innerHTML = '<div class="muted" style="padding:8px 2px;">暂无开场场景。可添加“咖啡馆偶遇”“雨天图书馆”等不同开局。</div>';
    return;
  }

  listEl.innerHTML = items.map((item) => {
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const tagHtml = tags.length
      ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">${tags.map((tag) => `<span style="font-size:12px;color:#4338ca;background:rgba(99,102,241,.08);padding:2px 8px;border-radius:999px;">${escapeHtml(tag)}</span>`).join('')}</div>`
      : '';
    const preview = String(item.openingMessage || '').replace(/\s+/g, ' ').trim();
    return `
      <div class="toolui-switch-block" style="background:#fff;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;flex-wrap:wrap;">
          <div style="min-width:0;flex:1;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <strong style="color:#0f172a;">${escapeHtml(item.title || '开场场景')}</strong>
              <span class="hint">使用 ${Number(item.useCount || 0)} 次</span>
            </div>
            ${item.description ? `<div class="hint" style="margin-top:4px;">${escapeHtml(item.description)}</div>` : ''}
            ${tagHtml}
            <div style="margin-top:8px;font-size:13px;color:#334155;line-height:1.45;white-space:pre-wrap;word-break:break-word;">${escapeHtml(preview.slice(0, 220))}${preview.length > 220 ? '…' : ''}</div>
          </div>
        </div>
        <div class="toolui-actions-row" style="margin-top:10px;">
          <button type="button" class="btn ghost" data-action="edit" data-scenario-id="${escapeHtml(item.id)}">编辑场景</button>
          <button type="button" class="btn ghost" data-action="delete" data-scenario-id="${escapeHtml(item.id)}">删除</button>
        </div>
      </div>
    `;
  }).join('');
}

function ensureAvatarScenarioEditorModal() {
  if (avatarScenarioRuntime.editorModalReady && avatarScenarioRuntime.editorUi) return avatarScenarioRuntime.editorUi;
  ensureToolUiInjectedStyle();
  const backdrop = document.createElement('div');
  backdrop.className = 'toolui-backdrop';
  backdrop.innerHTML = `
    <div class="toolui-modal narrow" role="dialog" aria-modal="true" aria-labelledby="avatarScenarioEditorTitle">
      <div class="toolui-head">
        <div class="toolui-title" id="avatarScenarioEditorTitle">开场场景</div>
        <button class="toolui-close" type="button" data-close>ESC</button>
      </div>
      <div class="toolui-body">
        <div class="toolui-grid">
          <input id="avatarScenarioEditId" type="hidden">
          <div class="toolui-row">
            <label for="avatarScenarioTitleInput">场景标题 *</label>
            <input id="avatarScenarioTitleInput" class="toolui-input" type="text" placeholder="例如：咖啡馆偶遇 / 雨天图书馆">
          </div>
          <div class="toolui-row">
            <label for="avatarScenarioDescInput">场景描述（可选）</label>
            <input id="avatarScenarioDescInput" class="toolui-input" type="text" placeholder="简短描述这个开局氛围或时间地点">
          </div>
          <div class="toolui-row">
            <label for="avatarScenarioTagsInput">标签（可选）</label>
            <input id="avatarScenarioTagsInput" class="toolui-input" type="text" placeholder="日常, 校园, 暧昧, 夜晚（逗号分隔）">
          </div>
          <div class="toolui-row">
            <label for="avatarScenarioOpeningInput">开场白 / 开局内容 *</label>
            <textarea id="avatarScenarioOpeningInput" class="toolui-textarea" rows="8" placeholder="将作为角色的第一条消息插入会话，例如：*咖啡馆里，窗边传来轻轻的雨声…*"></textarea>
            <div class="hint">选择场景后会直接把这段作为角色第一条消息写入会话，用户无需手动铺垫。</div>
          </div>
          <div id="avatarScenarioEditorStatus" class="toolui-status"></div>
        </div>
      </div>
      <div class="toolui-foot">
        <button id="avatarScenarioSaveBtn" type="button" class="btn primary">保存场景</button>
        <button type="button" class="btn ghost" data-close>取消</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const ui = {
    backdrop,
    editId: backdrop.querySelector('#avatarScenarioEditId'),
    title: backdrop.querySelector('#avatarScenarioTitleInput'),
    desc: backdrop.querySelector('#avatarScenarioDescInput'),
    tags: backdrop.querySelector('#avatarScenarioTagsInput'),
    opening: backdrop.querySelector('#avatarScenarioOpeningInput'),
    status: backdrop.querySelector('#avatarScenarioEditorStatus'),
    saveBtn: backdrop.querySelector('#avatarScenarioSaveBtn'),
    titleEl: backdrop.querySelector('#avatarScenarioEditorTitle')
  };

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeAvatarScenarioEditorModal();
  });
  backdrop.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => closeAvatarScenarioEditorModal()));
  if (ui.saveBtn) ui.saveBtn.addEventListener('click', () => saveAvatarScenarioEditorModal());

  avatarScenarioRuntime.editorModalReady = true;
  avatarScenarioRuntime.editorUi = ui;
  return ui;
}

function closeAvatarScenarioEditorModal() {
  const ui = ensureAvatarScenarioEditorModal();
  ui.backdrop.classList.remove('open');
}

function openAvatarScenarioEditorModal(options = {}) {
  ensureAvatarScenarioManagerUi();
  const ui = ensureAvatarScenarioEditorModal();
  const mode = options.mode === 'edit' ? 'edit' : 'create';
  const item = options.scenario || null;
  ui.editId.value = item ? String(item.id || '') : '';
  ui.title.value = item ? String(item.title || '') : '';
  ui.desc.value = item ? String(item.description || '') : '';
  ui.tags.value = item && Array.isArray(item.tags) ? item.tags.join(', ') : '';
  ui.opening.value = item ? String(item.openingMessage || '') : '';
  if (ui.titleEl) ui.titleEl.textContent = mode === 'edit' ? '编辑开场场景' : '新增开场场景';
  setToolUiStatus(ui.status, '', '');
  ui.backdrop.classList.add('open');
  if (ui.title) ui.title.focus();
}

function saveAvatarScenarioEditorModal() {
  const ui = ensureAvatarScenarioEditorModal();
  const title = String(ui.title.value || '').trim();
  const openingMessage = String(ui.opening.value || '').trim();
  if (!title) {
    setToolUiStatus(ui.status, '请填写场景标题。', 'error');
    return;
  }
  if (!openingMessage) {
    setToolUiStatus(ui.status, '请填写开场白内容。', 'error');
    return;
  }
  const tags = String(ui.tags.value || '')
    .split(/[\r\n,，;；]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
  const editId = String(ui.editId.value || '').trim();
  const existing = editId ? (avatarScenarioRuntime.draftItems || []).find((s) => s.id === editId) : null;
  const scenario = normalizeAvatarScenario({
    id: editId || undefined,
    title,
    description: String(ui.desc.value || '').trim(),
    openingMessage,
    tags,
    useCount: existing ? existing.useCount : 0,
    createdAt: existing ? existing.createdAt : Date.now(),
    updatedAt: Date.now()
  }, existing || undefined);

  if (existing) {
    avatarScenarioRuntime.draftItems = (avatarScenarioRuntime.draftItems || []).map((s) => (s.id === existing.id ? scenario : s));
  } else {
    avatarScenarioRuntime.draftItems = [scenario, ...(avatarScenarioRuntime.draftItems || [])];
  }
  renderAvatarScenarioDraftList();
  const host = ensureAvatarScenarioManagerUi();
  const statusEl = host ? host.querySelector('#avatarScenarioDraftStatus') : null;
  if (statusEl) statusEl.textContent = editId ? '场景已更新（角色保存后生效）。' : '场景已添加（角色保存后生效）。';
  closeAvatarScenarioEditorModal();
}

function ensureAvatarScenePickerModal() {
  if (avatarScenarioRuntime.pickerModalReady && avatarScenarioRuntime.pickerUi) return avatarScenarioRuntime.pickerUi;
  ensureToolUiInjectedStyle();
  const backdrop = document.createElement('div');
  backdrop.className = 'toolui-backdrop';
  backdrop.innerHTML = `
    <div class="toolui-modal" role="dialog" aria-modal="true" aria-labelledby="avatarScenePickerTitle">
      <div class="toolui-head">
        <div class="toolui-title" id="avatarScenePickerTitle">选择开场场景</div>
        <button class="toolui-close" type="button" data-close>ESC</button>
      </div>
      <div class="toolui-body">
        <div id="avatarScenePickerHint" class="muted" style="margin-bottom:10px;">为这个角色选择一个开场场景，直接开始对话。</div>
        <div id="avatarScenePickerList" style="display:grid;gap:10px;"></div>
        <div id="avatarScenePickerStatus" class="toolui-status"></div>
      </div>
      <div class="toolui-foot">
        <button id="avatarScenePickerSkipBtn" type="button" class="btn ghost">跳过本会话</button>
        <button type="button" class="btn ghost" data-close>关闭</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const ui = {
    backdrop,
    title: backdrop.querySelector('#avatarScenePickerTitle'),
    hint: backdrop.querySelector('#avatarScenePickerHint'),
    list: backdrop.querySelector('#avatarScenePickerList'),
    status: backdrop.querySelector('#avatarScenePickerStatus'),
    skipBtn: backdrop.querySelector('#avatarScenePickerSkipBtn')
  };

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeAvatarScenePickerModal();
  });
  backdrop.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => closeAvatarScenePickerModal()));
  if (ui.skipBtn) {
    ui.skipBtn.addEventListener('click', () => {
      const session = state.sessions.find((s) => s.id === avatarScenarioRuntime.pendingSessionId);
      if (session) {
        session.scenePickerDismissed = true;
        touchSession(session);
        persistSessionsState();
      }
      closeAvatarScenePickerModal();
    });
  }
  if (ui.list) {
    ui.list.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action="use-scene"][data-scene-id]');
      if (!btn) return;
      const sceneId = btn.dataset.sceneId || '';
      const avatar = getAvatarById(avatarScenarioRuntime.pendingAvatarId);
      const session = state.sessions.find((s) => s.id === avatarScenarioRuntime.pendingSessionId);
      if (!avatar || !session) return;
      const scene = getAvatarOpeningScenarios(avatar).find((s) => s.id === sceneId);
      if (!scene) return;
      applyAvatarOpeningScenarioToSession(session, avatar, scene);
      closeAvatarScenePickerModal();
    });
  }

  avatarScenarioRuntime.pickerModalReady = true;
  avatarScenarioRuntime.pickerUi = ui;
  return ui;
}

function closeAvatarScenePickerModal() {
  const ui = ensureAvatarScenePickerModal();
  ui.backdrop.classList.remove('open');
  avatarScenarioRuntime.pendingSessionId = '';
  avatarScenarioRuntime.pendingAvatarId = '';
}

function applyAvatarOpeningScenarioToSession(session, avatar, scene) {
  if (!session || !avatar || !scene) return;
  if (!Array.isArray(session.messages)) session.messages = [];
  if (!hasChatMessages(session)) {
    const msgId = `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    session.messages.push({
      id: msgId,
      kind: 'chat',
      role: 'assistant',
      content: String(scene.openingMessage || '').trim(),
      createdAt: Date.now(),
      treeNodeId: msgId,
      treeParentId: null
    });
    ensureSessionMessageTreeState(session);
    setSessionBranchSelection(session, null, msgId);
  }
  session.scenePresetApplied = true;
  session.scenePickerDismissed = false;
  session.openingScenarioId = scene.id;
  touchSession(session);

  avatar.usageCount = Math.max(0, Number(avatar.usageCount || 0) || 0) + 1;
  avatar.openingScenarios = getAvatarOpeningScenarios(avatar).map((item) => (
    item.id === scene.id
      ? { ...item, useCount: Math.max(0, Number(item.useCount || 0) || 0) + 1, updatedAt: Date.now() }
      : item
  ));

  persistSessionsState();
  persistAvatars();
  renderMessages();
  renderSessionList();
  if (state.ui.sidebarTab === 'contacts') renderContactList();
  renderAvatarList();
}

function maybeOfferAvatarOpeningScene(session, avatar) {
  if (!session || !avatar) return;
  if (avatar.type === 'group') return;
  const scenes = getAvatarOpeningScenarios(avatar);
  if (!scenes.length) return;
  if (hasChatMessages(session)) return;
  if (session.scenePresetApplied || session.scenePickerDismissed) return;
  if (state.ui.chatStreaming) return;
  if (avatarScenarioRuntime.pendingSessionId) return;

  const ui = ensureAvatarScenePickerModal();
  avatarScenarioRuntime.pendingSessionId = session.id;
  avatarScenarioRuntime.pendingAvatarId = avatar.id;
  if (ui.title) ui.title.textContent = `选择开场场景 · ${avatar.name}`;
  if (ui.hint) {
    ui.hint.textContent = `为「${avatar.name}」选择一个开场场景，系统会直接插入角色的第一条消息。`;
  }
  ui.list.innerHTML = scenes.map((scene) => {
    const tags = Array.isArray(scene.tags) ? scene.tags : [];
    const tagsHtml = tags.length
      ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">${tags.map((tag) => `<span style="font-size:12px;color:#4338ca;background:rgba(99,102,241,.08);padding:2px 8px;border-radius:999px;">${escapeHtml(tag)}</span>`).join('')}</div>`
      : '';
    const preview = String(scene.openingMessage || '').replace(/\s+/g, ' ').trim();
    return `
      <div class="toolui-switch-block" style="background:#fff;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;flex-wrap:wrap;">
          <div style="min-width:0;flex:1;">
            <div style="font-weight:700;color:#0f172a;">${escapeHtml(scene.title || '开场场景')}</div>
            ${scene.description ? `<div class="hint" style="margin-top:4px;">${escapeHtml(scene.description)}</div>` : ''}
            ${tagsHtml}
            <div style="margin-top:8px;font-size:13px;line-height:1.45;color:#334155;white-space:pre-wrap;word-break:break-word;">${escapeHtml(preview.slice(0, 280))}${preview.length > 280 ? '…' : ''}</div>
            <div class="hint" style="margin-top:6px;">已使用 ${Number(scene.useCount || 0)} 次</div>
          </div>
          <div style="display:flex;align-items:flex-start;">
            <button type="button" class="btn primary" data-action="use-scene" data-scene-id="${escapeHtml(scene.id)}">使用此开场</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  setToolUiStatus(ui.status, '', '');
  ui.backdrop.classList.add('open');
}

function getAvatarGalleryTagLabel(tagValue) {
  const v = String(tagValue || 'all');
  if (v === 'all') return '全部';
  if (v === 'type:single') return '单人角色';
  if (v === 'type:group') return '群组';
  if (v === 'prompt:custom') return '仅自定义Prompt';
  if (v === 'prompt:memory') return '仅记忆风格';
  if (v === 'prompt:both') return '混合风格';
  if (v === 'scene:has') return '有开场场景';
  if (v === 'scene:none') return '无开场场景';
  if (v === 'rating:4+') return '高评分（4-5）';
  if (v === 'rating:none') return '未评分';
  if (v.startsWith('avatar-tag:')) return `角色标签：${v.slice('avatar-tag:'.length)}`;
  if (v.startsWith('scene-tag:')) return `场景标签：${v.slice('scene-tag:'.length)}`;
  return v;
}

function getAvatarGalleryTagOptions() {
  const options = ['all', 'type:single', 'type:group', 'scene:has', 'scene:none', 'rating:4+', 'rating:none'];
  const tagSet = new Set();
  for (const avatar of state.avatars || []) {
    if (!avatar) continue;
    tagSet.add(`prompt:${derivePromptMode(avatar.customPrompt, avatar.memoryText)}`);
    for (const tag of getAvatarTags(avatar)) {
      const t = String(tag || '').trim();
      if (t) tagSet.add(`avatar-tag:${t}`);
    }
    for (const scene of getAvatarOpeningScenarios(avatar)) {
      for (const tag of (scene.tags || [])) {
        const t = String(tag || '').trim();
        if (t) tagSet.add(`scene-tag:${t}`);
      }
    }
  }
  const sortedAvatarTags = Array.from(tagSet)
    .filter((v) => v.startsWith('avatar-tag:'))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
  const sortedSceneTags = Array.from(tagSet)
    .filter((v) => v.startsWith('scene-tag:'))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
  const promptTags = ['prompt:custom', 'prompt:memory', 'prompt:both'].filter((v) => tagSet.has(v));
  return options
    .concat(promptTags)
    .concat(sortedAvatarTags)
    .concat(sortedSceneTags)
    .filter((v, idx, arr) => arr.indexOf(v) === idx);
}

function avatarMatchesGalleryTag(avatar, tagValue) {
  const tag = String(tagValue || 'all');
  if (tag === 'all') return true;
  if (tag === 'type:single') return avatar.type !== 'group';
  if (tag === 'type:group') return avatar.type === 'group';
  if (tag === 'scene:has') return getAvatarOpeningScenarios(avatar).length > 0;
  if (tag === 'scene:none') return getAvatarOpeningScenarios(avatar).length === 0;
  if (tag === 'rating:4+') return getAvatarRating(avatar) >= 4;
  if (tag === 'rating:none') return getAvatarRating(avatar) <= 0;
  if (tag.startsWith('prompt:')) {
    return derivePromptMode(avatar.customPrompt, avatar.memoryText) === tag.slice('prompt:'.length);
  }
  if (tag.startsWith('avatar-tag:')) {
    const needle = tag.slice('avatar-tag:'.length).toLowerCase();
    return getAvatarTags(avatar).some((t) => String(t || '').toLowerCase() === needle);
  }
  if (tag.startsWith('scene-tag:')) {
    const needle = tag.slice('scene-tag:'.length).toLowerCase();
    return getAvatarOpeningScenarios(avatar).some((scene) => (scene.tags || []).some((t) => String(t || '').toLowerCase() === needle));
  }
  return true;
}

function avatarMatchesGallerySearch(avatar, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const chunks = [
    avatar.name,
    avatar.relationship,
    ...(getAvatarTags(avatar)),
    avatar.customPrompt,
    avatar.memoryText,
    avatar.type === 'group' ? '群组' : '角色'
  ];
  for (const scene of getAvatarOpeningScenarios(avatar)) {
    chunks.push(scene.title, scene.description, scene.openingMessage, ...(scene.tags || []));
  }
  return chunks.some((item) => String(item || '').toLowerCase().includes(q));
}

function getAvatarGalleryFilteredList() {
  const search = avatarGalleryRuntime.search || '';
  const tag = avatarGalleryRuntime.tag || 'all';
  return (state.avatars || [])
    .filter((avatar) => avatar && avatarMatchesGalleryTag(avatar, tag) && avatarMatchesGallerySearch(avatar, search))
    .sort((a, b) => {
      const au = Number(a.usageCount || 0) || 0;
      const bu = Number(b.usageCount || 0) || 0;
      if (bu !== au) return bu - au;
      return String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN');
    });
}

function renderAvatarGalleryStars(avatarId, rating, opts = {}) {
  const current = clampAvatarRating(rating);
  const interactive = opts.interactive !== false;
  let html = '<span style="display:inline-flex;align-items:center;gap:4px;">';
  for (let i = 1; i <= 5; i += 1) {
    const active = i <= current;
    if (interactive) {
      html += `<button type="button" data-action="rate-avatar" data-avatar-id="${escapeHtml(avatarId)}" data-rating="${i}" style="border:none;background:none;padding:0;cursor:pointer;font-size:16px;line-height:1;color:${active ? '#f59e0b' : '#cbd5e1'};" title="评分 ${i} 星">${active ? '★' : '☆'}</button>`;
    } else {
      html += `<span style="font-size:16px;line-height:1;color:${active ? '#f59e0b' : '#cbd5e1'};">${active ? '★' : '☆'}</span>`;
    }
  }
  if (interactive) {
    html += `<button type="button" data-action="rate-avatar" data-avatar-id="${escapeHtml(avatarId)}" data-rating="0" style="margin-left:4px;border:none;background:none;padding:0;cursor:pointer;font-size:12px;color:#64748b;">清空</button>`;
  }
  html += '</span>';
  return html;
}

function ensureAvatarGalleryModal() {
  if (avatarGalleryRuntime.modalReady && avatarGalleryRuntime.ui) return avatarGalleryRuntime.ui;
  ensureToolUiInjectedStyle();
  const backdrop = document.createElement('div');
  backdrop.className = 'toolui-backdrop';
  backdrop.innerHTML = `
    <div class="toolui-modal" role="dialog" aria-modal="true" aria-labelledby="avatarGalleryTitle">
      <div class="toolui-head">
        <div class="toolui-title" id="avatarGalleryTitle">角色画廊 / 卡片管理器</div>
        <button class="toolui-close" type="button" data-close>ESC</button>
      </div>
      <div class="toolui-body">
        <div class="toolui-grid">
          <div class="toolui-grid two-col">
            <div class="toolui-row">
              <label for="avatarGallerySearchInput">搜索</label>
              <input id="avatarGallerySearchInput" class="toolui-input" type="text" placeholder="搜索角色名、关系、场景、标签...">
            </div>
            <div class="toolui-row">
              <label for="avatarGalleryTagFilterSelect">标签筛选</label>
              <select id="avatarGalleryTagFilterSelect" class="toolui-input"></select>
            </div>
          </div>
          <div id="avatarGallerySummary" class="muted" style="font-size:12px;line-height:1.45;"></div>
          <div class="toolui-row">
            <label>角色卡片（缩略图画廊，点击查看详情）</label>
            <div class="hint" style="margin-bottom:8px;">只显示图片和名字，点击卡片后再弹出详细信息。</div>
            <div id="avatarGalleryGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(138px,1fr));gap:12px;max-height:min(62vh,560px);overflow:auto;padding:2px 2px 6px 2px;"></div>
          </div>
          <div id="avatarGalleryStatus" class="toolui-status"></div>
        </div>
      </div>
      <div class="toolui-foot">
        <button id="avatarGalleryRefreshBtn" type="button" class="btn ghost">刷新</button>
        <button id="avatarGalleryToPersonasBtn" type="button" class="btn ghost">打开角色设置</button>
        <button type="button" class="btn ghost" data-close>关闭</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const ui = {
    backdrop,
    title: backdrop.querySelector('#avatarGalleryTitle'),
    search: backdrop.querySelector('#avatarGallerySearchInput'),
    tag: backdrop.querySelector('#avatarGalleryTagFilterSelect'),
    summary: backdrop.querySelector('#avatarGallerySummary'),
    grid: backdrop.querySelector('#avatarGalleryGrid'),
    status: backdrop.querySelector('#avatarGalleryStatus'),
    refreshBtn: backdrop.querySelector('#avatarGalleryRefreshBtn'),
    toPersonasBtn: backdrop.querySelector('#avatarGalleryToPersonasBtn')
  };

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeAvatarGalleryModal();
  });
  backdrop.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => closeAvatarGalleryModal()));
  if (ui.search) {
    ui.search.addEventListener('input', () => {
      avatarGalleryRuntime.search = String(ui.search.value || '');
      renderAvatarGallery();
    });
  }
  if (ui.tag) {
    ui.tag.addEventListener('change', () => {
      avatarGalleryRuntime.tag = ui.tag.value || 'all';
      renderAvatarGallery();
    });
  }
  if (ui.refreshBtn) ui.refreshBtn.addEventListener('click', () => renderAvatarGallery());
  if (ui.toPersonasBtn) {
    ui.toPersonasBtn.addEventListener('click', async () => {
      closeAvatarGalleryModal();
      await openSettingsSection('personas');
    });
  }
  if (ui.grid) {
    ui.grid.addEventListener('click', async (e) => {
      const card = e.target.closest('[data-avatar-gallery-card]');
      if (!card) return;
      avatarGalleryRuntime.selectedAvatarId = card.dataset.avatarGalleryCard || '';
      renderAvatarGallery();
      const avatar = getAvatarById(avatarGalleryRuntime.selectedAvatarId);
      if (avatar) openAvatarGalleryDetailModal(avatar.id);
    });
  }

  avatarGalleryRuntime.modalReady = true;
  avatarGalleryRuntime.ui = ui;
  return ui;
}

function closeAvatarGalleryModal() {
  const ui = ensureAvatarGalleryModal();
  ui.backdrop.classList.remove('open');
}

function setAvatarGalleryStatus(text, type = '') {
  const ui = ensureAvatarGalleryModal();
  setToolUiStatus(ui.status, text, type);
}

function ensureAvatarGalleryDetailModal() {
  if (avatarGalleryRuntime.detailModalReady && avatarGalleryRuntime.detailUi) return avatarGalleryRuntime.detailUi;
  ensureToolUiInjectedStyle();
  const backdrop = document.createElement('div');
  backdrop.className = 'toolui-backdrop';
  backdrop.innerHTML = `
    <div class="toolui-modal narrow" role="dialog" aria-modal="true" aria-labelledby="avatarGalleryDetailTitle">
      <div class="toolui-head">
        <div class="toolui-title" id="avatarGalleryDetailTitle">角色详情</div>
        <button class="toolui-close" type="button" data-close>ESC</button>
      </div>
      <div class="toolui-body">
        <div id="avatarGalleryDetailBody" class="toolui-grid"></div>
        <div id="avatarGalleryDetailStatus" class="toolui-status"></div>
      </div>
      <div class="toolui-foot">
        <button type="button" class="btn ghost" data-close>关闭</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const ui = {
    backdrop,
    title: backdrop.querySelector('#avatarGalleryDetailTitle'),
    body: backdrop.querySelector('#avatarGalleryDetailBody'),
    status: backdrop.querySelector('#avatarGalleryDetailStatus')
  };

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeAvatarGalleryDetailModal();
    const btn = e.target.closest('button[data-action][data-avatar-id]');
    if (!btn) return;
    e.preventDefault();
    const avatarId = String(btn.dataset.avatarId || '').trim();
    const action = String(btn.dataset.action || '').trim();
    const avatar = getAvatarById(avatarId);
    if (!avatar) return;
    if (action === 'rate-avatar') {
      const rating = clampAvatarRating(btn.dataset.rating);
      setAvatarRating(avatarId, rating);
      setToolUiStatus(ui.status, `已为「${avatar.name}」评分：${rating || 0} 星`, 'success');
      return;
    }
    if (action === 'gallery-edit-avatar') {
      closeAvatarGalleryDetailModal();
      closeAvatarGalleryModal();
      Promise.resolve(openSettingsSection('personas')).then(() => {
        fillAvatarForm(avatar);
        ensureAvatarScenarioManagerUi();
        renderAvatarScenarioDraftList();
      }).catch(() => {});
      return;
    }
    if (action === 'gallery-open-contact') {
      closeAvatarGalleryDetailModal();
      closeAvatarGalleryModal();
      if (avatar.type === 'group') {
        applyAvatarSelection(avatar.id);
      } else {
        switchSidebarTab('contacts');
        openContact(avatar.id);
      }
    }
  });
  backdrop.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => closeAvatarGalleryDetailModal()));

  avatarGalleryRuntime.detailModalReady = true;
  avatarGalleryRuntime.detailUi = ui;
  return ui;
}

function closeAvatarGalleryDetailModal() {
  const ui = ensureAvatarGalleryDetailModal();
  ui.backdrop.classList.remove('open');
}

function renderAvatarGalleryDetail(avatar) {
  const ui = ensureAvatarGalleryDetailModal();
  if (!ui.body) return;
  if (!avatar) {
    if (ui.title) ui.title.textContent = '角色详情';
    ui.body.innerHTML = '<div class="muted">未找到角色信息。</div>';
    return;
  }
  if (ui.title) ui.title.textContent = `角色详情 · ${avatar.name || '未命名角色'}`;
  const iconVal = avatar.icon || (avatar.type === 'group' ? '👥' : '😀');
  const iconHtml = iconVal.startsWith('data:image')
    ? `<img src="${iconVal}" alt="avatar" style="width:100%;max-height:280px;object-fit:cover;border-radius:14px;border:1px solid rgba(148,163,184,.22);background:#fff;">`
    : `<div style="width:100%;height:220px;display:flex;align-items:center;justify-content:center;font-size:88px;border-radius:14px;background:#fff;border:1px solid rgba(148,163,184,.22);">${iconVal}</div>`;
  const avatarTags = getAvatarTags(avatar);
  const avatarTagHtml = avatarTags.length
    ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">${avatarTags.map((tag) => `<span style="font-size:12px;color:#1d4ed8;background:rgba(59,130,246,.08);padding:2px 8px;border-radius:999px;">${escapeHtml(tag)}</span>`).join('')}</div>`
    : '';
  const scenes = getAvatarOpeningScenarios(avatar);
  const sceneHtml = scenes.length
    ? `<div style="display:grid;gap:8px;">${scenes.slice(0, 6).map((scene) => {
      const sceneTags = Array.isArray(scene.tags) ? scene.tags : [];
      const sceneTagsHtml = sceneTags.length
        ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">${sceneTags.slice(0, 8).map((tag) => `<span style="font-size:11px;color:#4338ca;background:rgba(99,102,241,.08);padding:2px 6px;border-radius:999px;">${escapeHtml(tag)}</span>`).join('')}</div>`
        : '';
      return `<div style="padding:10px;border:1px solid rgba(148,163,184,.18);border-radius:10px;background:#fff;">
        <div style="font-weight:700;color:#0f172a;">${escapeHtml(scene.title || '开场')}</div>
        ${scene.description ? `<div class="hint" style="margin-top:2px;">${escapeHtml(scene.description)}</div>` : ''}
        ${sceneTagsHtml}
        <div class="hint" style="margin-top:4px;">使用 ${Number(scene.useCount || 0)} 次</div>
      </div>`;
    }).join('')}</div>`
    : '<div class="muted">暂无开场场景</div>';
  const promptPreview = String(avatar.customPrompt || '').trim().replace(/\s+/g, ' ');
  const memoryPreview = String(avatar.memoryText || '').trim().replace(/\s+/g, ' ');
  ui.body.innerHTML = `
    <div class="toolui-row">
      ${iconHtml}
    </div>
    <div class="toolui-row">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <strong style="font-size:18px;color:#0f172a;">${escapeHtml(avatar.name || '角色')}</strong>
        <span class="hint">${avatar.type === 'group' ? '群组' : '角色'}</span>
        <span class="hint">使用 ${Number(avatar.usageCount || 0)} 次</span>
        <span class="hint">开场 ${scenes.length} 个</span>
      </div>
      ${avatar.relationship ? `<div class="hint" style="margin-top:4px;">关系：${escapeHtml(avatar.relationship)}</div>` : ''}
      ${avatarTagHtml}
      <div style="margin-top:8px;">评分：${renderAvatarGalleryStars(avatar.id, getAvatarRating(avatar), { interactive: true })}</div>
    </div>
    <div class="toolui-row">
      <label>开场场景</label>
      ${sceneHtml}
    </div>
    <div class="toolui-row">
      <label>角色设定预览</label>
      <div class="toolui-filebox" style="line-height:1.5;white-space:pre-wrap;word-break:break-word;">
        ${escapeHtml((promptPreview || memoryPreview || '未配置角色设定').slice(0, 900))}
        ${(promptPreview || memoryPreview).length > 900 ? '…' : ''}
      </div>
    </div>
    <div class="toolui-actions-row">
      <button type="button" class="btn ghost" data-action="gallery-edit-avatar" data-avatar-id="${escapeHtml(avatar.id)}">编辑角色</button>
      <button type="button" class="btn primary" data-action="gallery-open-contact" data-avatar-id="${escapeHtml(avatar.id)}">${avatar.type === 'group' ? '作为当前角色使用' : '打开联系人聊天'}</button>
    </div>
  `;
}

function openAvatarGalleryDetailModal(avatarId) {
  const avatar = typeof avatarId === 'string' ? getAvatarById(avatarId) : avatarId;
  const ui = ensureAvatarGalleryDetailModal();
  avatarGalleryRuntime.selectedAvatarId = avatar ? avatar.id : '';
  setToolUiStatus(ui.status, '', '');
  renderAvatarGalleryDetail(avatar);
  ui.backdrop.classList.add('open');
}

function renderAvatarGalleryPreview(avatar) {
  const ui = ensureAvatarGalleryModal();
  if (!ui.preview) return;
  if (!avatar) {
    ui.preview.innerHTML = '<div class="muted">选择一张角色卡查看大图预览和详细信息。</div>';
    return;
  }
  const iconVal = avatar.icon || (avatar.type === 'group' ? '👥' : '😀');
  const iconHtml = iconVal.startsWith('data:image')
    ? `<img src="${iconVal}" alt="avatar" style="width:96px;height:96px;border-radius:18px;object-fit:cover;border:1px solid rgba(148,163,184,.28);">`
    : `<div style="width:96px;height:96px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:54px;background:#fff;border:1px solid rgba(148,163,184,.28);">${iconVal}</div>`;
  const scenes = getAvatarOpeningScenarios(avatar);
  const topScenes = scenes.slice(0, 3);
  const topSceneHtml = topScenes.length
    ? topScenes.map((scene) => `<li style="margin-bottom:6px;"><strong>${escapeHtml(scene.title)}</strong>${scene.description ? ` · <span class="muted">${escapeHtml(scene.description)}</span>` : ''}<br><span class="muted">使用 ${Number(scene.useCount || 0)} 次</span></li>`).join('')
    : '<li class="muted">暂无开场场景</li>';
  const promptPreview = String(avatar.customPrompt || '').trim().replace(/\s+/g, ' ');
  const relationship = String(avatar.relationship || '').trim();
  ui.preview.innerHTML = `
    <div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;">
      ${iconHtml}
      <div style="min-width:0;flex:1;">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <strong style="font-size:16px;color:#0f172a;">${escapeHtml(avatar.name || '角色')}</strong>
          <span class="hint">${avatar.type === 'group' ? '群组' : '角色'}</span>
          <span class="hint">使用 ${Number(avatar.usageCount || 0)} 次</span>
          <span class="hint">开场 ${scenes.length} 个</span>
        </div>
        ${relationship ? `<div class="hint" style="margin-top:4px;">关系：${escapeHtml(relationship)}</div>` : ''}
        <div style="margin-top:8px;">评分：${renderAvatarGalleryStars(avatar.id, getAvatarRating(avatar), { interactive: true })}</div>
      </div>
    </div>
    <div style="margin-top:12px;">
      <div style="font-weight:700;color:#334155;margin-bottom:6px;">代表场景</div>
      <ul style="margin:0 0 0 18px;padding:0;">${topSceneHtml}</ul>
    </div>
    <div style="margin-top:12px;">
      <div style="font-weight:700;color:#334155;margin-bottom:6px;">角色风格预览</div>
      <div style="font-size:13px;line-height:1.45;color:#334155;white-space:pre-wrap;word-break:break-word;">${escapeHtml(promptPreview.slice(0, 320) || (avatar.memoryText ? '已配置记忆风格（未展示全文）' : '未配置自定义 Prompt'))}${promptPreview.length > 320 ? '…' : ''}</div>
    </div>
    <div class="toolui-actions-row" style="margin-top:12px;">
      <button type="button" class="btn ghost" data-action="gallery-edit-avatar" data-avatar-id="${escapeHtml(avatar.id)}">编辑角色</button>
      <button type="button" class="btn primary" data-action="gallery-open-contact" data-avatar-id="${escapeHtml(avatar.id)}">${avatar.type === 'group' ? '作为当前角色' : '打开联系人聊天'}</button>
    </div>
  `;
}

function renderAvatarGallery() {
  const ui = ensureAvatarGalleryModal();
  const tagOptions = getAvatarGalleryTagOptions();
  if (!tagOptions.includes(avatarGalleryRuntime.tag)) avatarGalleryRuntime.tag = 'all';
  if (ui.tag) {
    ui.tag.innerHTML = tagOptions.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(getAvatarGalleryTagLabel(v))}</option>`).join('');
    ui.tag.value = avatarGalleryRuntime.tag;
  }
  if (ui.search && ui.search.value !== avatarGalleryRuntime.search) ui.search.value = avatarGalleryRuntime.search;

  const filtered = getAvatarGalleryFilteredList();
  const all = Array.isArray(state.avatars) ? state.avatars : [];
  const totalUsage = all.reduce((sum, avatar) => sum + (Number(avatar && avatar.usageCount || 0) || 0), 0);
  const rated = all.filter((avatar) => getAvatarRating(avatar) > 0);
  const avgRating = rated.length
    ? (rated.reduce((sum, avatar) => sum + getAvatarRating(avatar), 0) / rated.length).toFixed(1)
    : '0.0';
  if (ui.summary) {
    ui.summary.textContent = `全部 ${all.length} 张 · 当前筛选 ${filtered.length} 张 · 总使用 ${totalUsage} 次 · 已评分 ${rated.length} 张（均分 ${avgRating}）`;
  }

  if (!avatarGalleryRuntime.selectedAvatarId || !filtered.some((a) => a.id === avatarGalleryRuntime.selectedAvatarId)) {
    avatarGalleryRuntime.selectedAvatarId = filtered[0] ? filtered[0].id : '';
  }
  if (ui.grid) {
    if (!filtered.length) {
      ui.grid.innerHTML = '<div class="muted" style="grid-column:1/-1;padding:8px 2px;">没有匹配的角色卡。试试清空筛选或修改搜索关键词。</div>';
    } else {
      ui.grid.innerHTML = filtered.map((avatar) => {
        const isSelected = avatar.id === avatarGalleryRuntime.selectedAvatarId;
        const iconVal = avatar.icon || (avatar.type === 'group' ? '👥' : '😀');
        const iconHtml = iconVal.startsWith('data:image')
          ? `<img src="${iconVal}" alt="avatar" style="width:100%;height:156px;object-fit:cover;border-radius:12px;border:1px solid rgba(148,163,184,.18);display:block;background:#fff;">`
          : `<div style="width:100%;height:156px;display:flex;align-items:center;justify-content:center;font-size:64px;border-radius:12px;background:#fff;border:1px solid rgba(148,163,184,.18);">${iconVal}</div>`;
        const roleTags = getAvatarTags(avatar);
        const roleTagLine = roleTags.length ? ` · ${escapeHtml(roleTags.slice(0, 1)[0])}` : '';
        return `
          <div
            data-avatar-gallery-card="${escapeHtml(avatar.id)}"
            title="点击查看角色详情"
            style="border:1px solid ${isSelected ? 'rgba(59,130,246,.38)' : 'rgba(148,163,184,.2)'};border-radius:14px;padding:8px;background:${isSelected ? 'rgba(239,246,255,.55)' : '#fff'};cursor:pointer;transition:border-color .15s ease, box-shadow .15s ease;"
          >
            ${iconHtml}
            <div style="margin-top:8px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <strong style="font-size:13px;color:#0f172a;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(avatar.name || '角色')}</strong>
              <span class="hint" style="font-size:11px;">${avatar.type === 'group' ? '群组' : '角色'}</span>
            </div>
            <div class="hint" style="margin-top:3px;min-height:16px;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(String(avatar.relationship || '').trim() || '未设置关系')}${roleTagLine}</div>
          </div>
        `;
      }).join('');
    }
  }
}

function openAvatarGalleryModal(options = {}) {
  const ui = ensureAvatarGalleryModal();
  avatarGalleryRuntime.source = String(options.source || '');
  if (typeof options.search === 'string') avatarGalleryRuntime.search = options.search;
  if (typeof options.tag === 'string') avatarGalleryRuntime.tag = options.tag;
  if (typeof options.selectedAvatarId === 'string') avatarGalleryRuntime.selectedAvatarId = options.selectedAvatarId;
  if (ui.title) {
    ui.title.textContent = avatarGalleryRuntime.source === 'contacts'
      ? '角色画廊 / 联系人卡片管理器'
      : '角色画廊 / 卡片管理器';
  }
  setAvatarGalleryStatus('', '');
  renderAvatarGallery();
  ui.backdrop.classList.add('open');
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
  if (avatarId) {
    const avatar = getAvatarById(avatarId);
    if (avatar) {
      setTimeout(() => {
        try { maybeOfferAvatarOpeningScene(session, avatar); } catch (_) {}
      }, 0);
    }
  }
}

function updateAvatarBtnLabel() {
  if (!els.toggleAvatarBtn) return;
  const session = getActiveSession();
  const avatar = session && session.avatarId ? getAvatarById(session.avatarId) : null;
  els.toggleAvatarBtn.textContent = avatar ? `🎭 ${avatar.name}` : '🎭 角色';
}

function renderSessionList() {
  els.sessionList.innerHTML = buildSessionListHtml({
    sessions: getRegularSessions(),
    activeId: state.activeSessionId,
    search: state.search,
    sortSessions,
    getAvatarById,
    escapeHtml,
    formatTime,
    getSessionPreview: getSessionPreviewForUi
  });
}

function syncMaterialsFromSession() {}

function updateCharHint() {}

function isAvatarTranslationOverlayEnabled(session) {
  return Boolean(
    session &&
    session.avatarId &&
    state.settings &&
    state.settings.translateEnabled &&
    state.settings.translateTo
  );
}

function getSessionPreviewForUi(session) {
  const visibleMessages = getVisibleSessionMessages(session);
  if (!session) return getSessionPreview(session);
  if (!visibleMessages.length) return getSessionPreview(session);
  const pseudoSession = { ...session, messages: visibleMessages };
  return getSessionPreview(pseudoSession);
}

function getOverlayTranslationTaskKey(sessionId, messageId, lang, sourceText) {
  return `${sessionId}:${messageId}:${lang}:${String(sourceText || '').length}`;
}

function isTranslatableAssistantMessage(session, message) {
  if (!session || !message) return false;
  if (!isAvatarTranslationOverlayEnabled(session)) return false;
  if (message.kind && message.kind !== 'chat') return false;
  if (message.role !== 'assistant') return false;
  if (message.isThinking) return false;
  if (!String(message.content || '').trim()) return false;
  const visibleMessages = getVisibleSessionMessages(session);
  if (!visibleMessages.some((m) => m && m.id === message.id)) return false;
  const lastMsg = visibleMessages.length ? visibleMessages[visibleMessages.length - 1] : null;
  if (state.ui.chatStreaming && lastMsg && lastMsg.id === message.id) return false;
  return true;
}

function getMessageTranslationCache(message, lang) {
  if (!message || !lang || !message.translatedByLang || typeof message.translatedByLang !== 'object') return null;
  const entry = message.translatedByLang[lang];
  if (!entry) return null;
  if (typeof entry === 'string') {
    return { text: entry, source: '' };
  }
  if (typeof entry === 'object' && typeof entry.text === 'string') {
    return { text: entry.text, source: String(entry.source || '') };
  }
  return null;
}

function getMessageTranslationError(message, lang) {
  if (!message || !lang || !message.translationErrorsByLang || typeof message.translationErrorsByLang !== 'object') return null;
  const entry = message.translationErrorsByLang[lang];
  if (!entry || typeof entry !== 'object') return null;
  return {
    source: String(entry.source || ''),
    message: String(entry.message || ''),
    failedAt: Number(entry.failedAt || 0) || 0
  };
}

function clearMessageTranslationError(message, lang) {
  if (!message || !lang || !message.translationErrorsByLang || typeof message.translationErrorsByLang !== 'object') return;
  delete message.translationErrorsByLang[lang];
}

function setMessageTranslationError(message, lang, sourceText, errorText) {
  if (!message || !lang) return;
  if (!message.translationErrorsByLang || typeof message.translationErrorsByLang !== 'object') {
    message.translationErrorsByLang = {};
  }
  message.translationErrorsByLang[lang] = {
    source: String(sourceText || ''),
    message: String(errorText || '翻译失败'),
    failedAt: Date.now()
  };
}

function setMessageTranslationCache(message, lang, sourceText, translatedText) {
  if (!message || !lang) return;
  if (!message.translatedByLang || typeof message.translatedByLang !== 'object') {
    message.translatedByLang = {};
  }
  message.translatedByLang[lang] = {
    text: String(translatedText || ''),
    source: String(sourceText || '')
  };
}

function getOverlayDisplayContent(session, message) {
  const raw = String((message && message.content) || '');
  if (!isTranslatableAssistantMessage(session, message)) return raw;
  const lang = String(state.settings.translateTo || 'zh-CN');
  const cached = getMessageTranslationCache(message, lang);
  if (cached && cached.text && cached.source === raw) return cached.text;
  const pendingKey = getOverlayTranslationTaskKey(session.id, message.id, lang, raw);
  if (translationOverlayRuntime.pending.has(pendingKey)) {
    return `${raw}\n\n[翻译中…]`;
  }
  const err = getMessageTranslationError(message, lang);
  if (err && err.source === raw) {
    const age = Date.now() - Number(err.failedAt || 0);
    if (age < Number(translationOverlayRuntime.failureCooldownMs || 12000)) {
      return `${raw}\n\n[翻译失败：${err.message || '请稍后重试'}]`;
    }
  }
  return raw;
}

function getOverlaySessionPreview(session) {
  const base = getSessionPreviewForUi(session);
  const visibleMessages = getVisibleSessionMessages(session);
  if (!session || !visibleMessages.length) return base;
  if (!isAvatarTranslationOverlayEnabled(session)) return base;
  const last = visibleMessages[visibleMessages.length - 1];
  if (!last || (last.kind && last.kind !== 'chat') || last.role !== 'assistant') return base;
  const display = getOverlayDisplayContent(session, last);
  return String(display || '').replace(/\s+/g, ' ').slice(0, 44) || base;
}

function enqueueOverlayTranslation(session, message, options = {}) {
  if (!isTranslatableAssistantMessage(session, message)) return;
  const lang = String(state.settings.translateTo || 'zh-CN');
  const sourceText = String(message.content || '');
  const cached = getMessageTranslationCache(message, lang);
  if (cached && cached.text && cached.source === sourceText) return;
  const force = Boolean(options && options.force);
  const lastError = getMessageTranslationError(message, lang);
  if (!force && lastError && lastError.source === sourceText) {
    const age = Date.now() - Number(lastError.failedAt || 0);
    if (age < Number(translationOverlayRuntime.failureCooldownMs || 12000)) return;
  }

  const queueKey = getOverlayTranslationTaskKey(session.id, message.id, lang, sourceText);
  if (translationOverlayRuntime.pending.has(queueKey)) return;

  translationOverlayRuntime.pending.add(queueKey);
  const task = {
    key: queueKey,
    sessionId: session.id,
    messageId: message.id,
    lang,
    sourceText
  };
  const activeSession = getActiveSession();
  const isActiveSession = Boolean(activeSession && activeSession.id === session.id);
  const lastMessage = Array.isArray(session.messages) && session.messages.length ? session.messages[session.messages.length - 1] : null;
  const isLatestAssistant = Boolean(lastMessage && lastMessage.id === message.id && lastMessage.role === 'assistant');
  if (isActiveSession && isLatestAssistant) {
    translationOverlayRuntime.queue = translationOverlayRuntime.queue.filter((item) => item && item.sessionId !== session.id);
    translationOverlayRuntime.queue.unshift(task);
    // Force a near-immediate rerender so the user can at least see “翻译中…”
    scheduleOverlayTranslationRefresh(session.id);
  } else {
    translationOverlayRuntime.queue.push(task);
  }
  pumpOverlayTranslationQueue();
}

function queueRecentAssistantMessagesForOverlayTranslation(session, options = {}) {
  const visibleMessages = getVisibleSessionMessages(session);
  if (!session || !visibleMessages.length) return 0;
  if (!isAvatarTranslationOverlayEnabled(session)) return 0;
  const force = Boolean(options && options.force);
  const maxCount = Math.max(1, Number(options.maxCount || 2) || 2);
  let queued = 0;
  for (let i = visibleMessages.length - 1; i >= 0; i -= 1) {
    const msg = visibleMessages[i];
    if (!msg || msg.role !== 'assistant') continue;
    if (msg.kind && msg.kind !== 'chat') continue;
    enqueueOverlayTranslation(session, msg, { force });
    queued += 1;
    if (queued >= maxCount) break;
  }
  return queued;
}

function triggerOverlayTranslationForActiveSession(options = {}) {
  const session = getActiveSession();
  if (!session) return 0;
  const queued = queueRecentAssistantMessagesForOverlayTranslation(session, options);
  if (queued > 0) scheduleOverlayTranslationRefresh(session.id);
  return queued;
}

function scheduleOverlayQueueResume() {
  if (!translationOverlayRuntime.pauseUntil) return;
  if (translationOverlayRuntime.resumeTimer) return;
  const delay = Math.max(50, translationOverlayRuntime.pauseUntil - Date.now());
  translationOverlayRuntime.resumeTimer = window.setTimeout(() => {
    translationOverlayRuntime.resumeTimer = 0;
    pumpOverlayTranslationQueue();
  }, delay);
}

function scheduleOverlayTranslationPersist() {
  if (translationOverlayRuntime.persistTimer) return;
  translationOverlayRuntime.persistTimer = window.setTimeout(() => {
    translationOverlayRuntime.persistTimer = 0;
    persistSessionsState();
  }, 250);
}

function scheduleOverlayTranslationRefresh(sessionId) {
  translationOverlayRuntime.refreshSessionId = String(sessionId || '');
  if (translationOverlayRuntime.refreshTimer) return;
  translationOverlayRuntime.refreshTimer = window.setTimeout(() => {
    translationOverlayRuntime.refreshTimer = 0;
    renderContactList();
    renderMessages();
  }, 40);
}

function likelyNeedsVisibleTranslation(sourceText, targetLang) {
  const src = String(sourceText || '').trim();
  const target = String(targetLang || '');
  if (!src) return false;
  if (target === 'en-US') return false;
  const latinWords = (src.match(/[A-Za-z]{3,}/g) || []).length;
  const cjkChars = (src.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length;
  return latinWords >= 6 && cjkChars < 6;
}

function isLikelyUntranslatedResult(sourceText, translatedText, targetLang) {
  const src = String(sourceText || '').trim();
  const out = String(translatedText || '').trim();
  if (!src || !out) return true;
  if (out === src) return likelyNeedsVisibleTranslation(src, targetLang);
  return false;
}

function getLiveModelSelectElement() {
  try {
    const live = document.getElementById('modelSelect');
    if (live && live !== els.modelSelect) {
      els.modelSelect = live;
    }
    return live || els.modelSelect || null;
  } catch (_) {
    return els.modelSelect || null;
  }
}

function getCurrentTranslateRequestProviderSelection() {
  const fallback = {
    providerId: String(state.ui && state.ui.selectedProviderId || '').trim(),
    model: String(state.ui && state.ui.selectedModel || '').trim()
  };
  try {
    const modelSelectEl = getLiveModelSelectElement();
    const raw = String(modelSelectEl && modelSelectEl.value || '').trim();
    if (!raw) return fallback;
    const parts = raw.split('::');
    return {
      providerId: String(parts[0] || fallback.providerId || '').trim(),
      model: String(parts[1] || fallback.model || '').trim()
    };
  } catch (_) {
    return fallback;
  }
}

function splitOverlayTranslationSourceChunks(text, maxChars = 1200) {
  const src = String(text || '');
  const limit = Math.max(300, Number(maxChars || 1200) || 1200);
  if (!src || src.length <= limit) return [src];
  const chunks = [];
  let start = 0;
  while (start < src.length) {
    let end = Math.min(src.length, start + limit);
    if (end < src.length) {
      const probeStart = Math.min(end - 1, start + Math.floor(limit * 0.55));
      const probe = src.slice(probeStart, end);
      const tokens = ['\n\n', '\n', '。', '！', '？', '. ', '! ', '? ', '; ', '；', ', ', '，'];
      let bestIdx = -1;
      let bestLen = 0;
      for (const token of tokens) {
        const idx = probe.lastIndexOf(token);
        if (idx > bestIdx) {
          bestIdx = idx;
          bestLen = token.length;
        }
      }
      if (bestIdx >= 0) end = probeStart + bestIdx + bestLen;
    }
    if (end <= start) end = Math.min(src.length, start + limit);
    chunks.push(src.slice(start, end));
    start = end;
  }
  return chunks.filter(Boolean);
}

function isLikelyLocalOllamaProviderId(providerId) {
  const id = String(providerId || '').trim().toLowerCase();
  return id === 'ollama-default' || id.startsWith('ollama') || id.includes('ollama');
}

async function requestOverlayTranslationContent(task, fastMode, timeoutMs) {
  const providerSel = getCurrentTranslateRequestProviderSelection();
  const sourceLen = String(task && task.sourceText || '').length;
  const isLocalOllama = isLikelyLocalOllamaProviderId(providerSel.providerId);
  const baseTimeout = Number(timeoutMs || translationOverlayRuntime.requestTimeoutMs || 18000);
  const scaledTimeout = isLocalOllama
    ? Math.min(180000, Math.max(baseTimeout, 20000 + sourceLen * (fastMode ? 20 : 34)))
    : Math.min(90000, Math.max(baseTimeout, 12000 + sourceLen * (fastMode ? 5 : 8)));
  const payload = await apiRequest('/api/translate', {
    method: 'POST',
    timeoutMs: scaledTimeout,
    body: JSON.stringify({
      text: task.sourceText,
      targetLang: task.lang,
      fastMode: Boolean(fastMode),
      providerId: providerSel.providerId || undefined,
      model: providerSel.model || undefined,
      allowLocalFallback: false
    })
  });
  return String((payload && payload.content) || '').trim();
}

async function requestOverlayTranslationWithRetry(task, sourceText, opts = {}) {
  const chunkTask = sourceText === task.sourceText ? task : { ...task, sourceText };
  let translated = await requestOverlayTranslationContent(
    chunkTask,
    true,
    Number(opts.fastTimeoutMs || translationOverlayRuntime.requestTimeoutMs || 18000)
  );
  if (isLikelyUntranslatedResult(sourceText, translated, task.lang)) {
    translated = await requestOverlayTranslationContent(
      chunkTask,
      false,
      Number(opts.retryTimeoutMs || translationOverlayRuntime.retryTimeoutMs || 32000)
    );
  }
  return String(translated || '').trim();
}

async function translateOverlayTaskSourceWithChunking(task) {
  const source = String(task && task.sourceText || '');
  if (!source) return '';
  const providerSel = getCurrentTranslateRequestProviderSelection();
  const isLocalOllama = isLikelyLocalOllamaProviderId(providerSel.providerId);
  const chunkSize = isLocalOllama ? 650 : (source.length > 2200 ? 900 : 1100);
  const chunks = splitOverlayTranslationSourceChunks(source, chunkSize);
  if (chunks.length <= 1) {
    return requestOverlayTranslationWithRetry(task, source);
  }
  const output = [];
  for (const chunk of chunks) {
    const translated = await requestOverlayTranslationWithRetry(task, chunk, {
      fastTimeoutMs: isLocalOllama ? 45000 : Math.min(22000, Number(translationOverlayRuntime.requestTimeoutMs || 18000) + 4000),
      retryTimeoutMs: isLocalOllama ? 90000 : Math.min(45000, Number(translationOverlayRuntime.retryTimeoutMs || 32000) + 8000)
    });
    output.push(translated || chunk);
  }
  return output.join('');
}

async function pumpOverlayTranslationQueue() {
  if (translationOverlayRuntime.pauseUntil && Date.now() < translationOverlayRuntime.pauseUntil) {
    scheduleOverlayQueueResume();
    return;
  }
  if (translationOverlayRuntime.pauseUntil && Date.now() >= translationOverlayRuntime.pauseUntil) {
    translationOverlayRuntime.pauseUntil = 0;
  }

  while (translationOverlayRuntime.active < translationOverlayRuntime.maxConcurrent && translationOverlayRuntime.queue.length) {
    const task = translationOverlayRuntime.queue.shift();
    translationOverlayRuntime.active += 1;
    runOverlayTranslationTask(task)
      .catch((error) => {
        const msg = String(error && (error.message || error) || '');
        try {
          const session = state.sessions.find((s) => s.id === task.sessionId);
          const message = session && Array.isArray(session.messages)
            ? session.messages.find((m) => m && m.id === task.messageId)
            : null;
          if (message) {
            setMessageTranslationError(message, task.lang, task.sourceText, msg || '翻译失败');
            scheduleOverlayTranslationPersist();
            scheduleOverlayTranslationRefresh(task.sessionId);
          }
        } catch (_) {}
        const isRateLimited = Number(error && error.status) === 429 || /Too Many Requests|\u8bf7\u6c42\u8fc7\u4e8e\u9891\u7e41/.test(msg);
        if (isRateLimited) {
          const now = Date.now();
          const retryAfterMs = Number(error && error.payload && error.payload.retryAfterMs);
          const backoffMs = Number.isFinite(retryAfterMs) && retryAfterMs > 0
            ? Math.max(1000, Math.min(60000, retryAfterMs))
            : 15000;
          translationOverlayRuntime.pauseUntil = Math.max(translationOverlayRuntime.pauseUntil || 0, now + backoffMs);
          scheduleOverlayQueueResume();
          if (now - translationOverlayRuntime.lastErrorAt > 3000) {
            translationOverlayRuntime.lastErrorAt = now;
            setStatus(`翻译请求过快，已暂停 ${Math.ceil(backoffMs / 1000)} 秒后继续。`);
          }
          return;
        }
        console.error('[overlay-translate] failed:', error);
        const now = Date.now();
        if (now - translationOverlayRuntime.lastErrorAt > 3000) {
          translationOverlayRuntime.lastErrorAt = now;
          setStatus(`翻译显示失败：${error.message || error}`);
        }
      })
      .finally(() => {
        translationOverlayRuntime.active = Math.max(0, translationOverlayRuntime.active - 1);
        translationOverlayRuntime.pending.delete(task.key);
        scheduleOverlayTranslationRefresh(task.sessionId);
        if (translationOverlayRuntime.queue.length) {
          pumpOverlayTranslationQueue();
        }
      });
  }
}

async function runOverlayTranslationTask(task) {
  const session = state.sessions.find((s) => s.id === task.sessionId);
  if (!session) return;
  const message = (session.messages || []).find((m) => m.id === task.messageId);
  if (!message) return;
  if (!isTranslatableAssistantMessage(session, message)) return;
  if (String(message.content || '') !== String(task.sourceText || '')) return;

  let translated = await translateOverlayTaskSourceWithChunking(task);
  if (!translated) return;
  clearMessageTranslationError(message, task.lang);

  setMessageTranslationCache(message, task.lang, task.sourceText, translated);
  scheduleOverlayTranslationPersist();

  scheduleOverlayTranslationRefresh(session.id);
}

function renderMessages() {
  const session = getActiveSession();
  const visibleMessages = getVisibleSessionMessages(session);
  if (!session || !visibleMessages.length) {
    els.messageList.innerHTML = '<div class="muted">开始提问吧。你可以先上传资料，再点击工具生成结构化产物。</div>';
    try { voiceTtsController && voiceTtsController.afterRenderMessages && voiceTtsController.afterRenderMessages(); } catch (_) {}
    return;
  }
  const messageTreeIndex = buildSessionMessageTreeIndex(session);

  const boundAvatar = session.avatarId ? getAvatarById(session.avatarId) : null;

  els.messageList.innerHTML = visibleMessages.map((message) => {
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
    const displayText = role === 'assistant'
      ? getOverlayDisplayContent(session, message)
      : String(message.content || '');
    const content = role === 'assistant'
      ? renderAssistantMessageContent(displayText || '')
      : escapeHtml(displayText || '').replace(/\n/g, '<br>');
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
    let lorebookHitsHtml = '';
    if (role === 'assistant' && Array.isArray(message.lorebookHits) && message.lorebookHits.length) {
      const hitItems = message.lorebookHits.slice(0, 8).map((hit) => {
        const title = escapeHtml(String(hit && hit.title || '词条'));
        const scopeType = String(hit && hit.scopeType || 'global');
        const scopeId = String(hit && hit.scopeId || '');
        const matched = Array.isArray(hit && hit.matchedKeywords) ? hit.matchedKeywords : [];
        const matchedText = matched.length ? ` · 关键词：${escapeHtml(matched.join(' / '))}` : '';
        const scopeText = scopeType === 'avatar'
          ? `联系人词条${scopeId ? ` (${escapeHtml(resolveLorebookScopeName(scopeType, scopeId))})` : ''}`
          : '全局词条';
        return `<div style="font-size:12px;line-height:1.35;color:#64748b;">• <strong style="color:#334155;">${title}</strong> · ${scopeText}${matchedText}</div>`;
      }).join('');
      lorebookHitsHtml = `
        <details class="lorebook-hit-block" style="margin-bottom:8px;border:1px solid rgba(148,163,184,.22);border-radius:10px;background:#f8fafc;">
          <summary style="cursor:pointer;list-style:none;padding:8px 10px;font-size:12px;color:#475569;font-weight:600;">📚 世界观书命中（${message.lorebookHits.length}）</summary>
          <div style="padding:0 10px 8px 10px;">${hitItems}</div>
        </details>
      `;
    }
    const speakerHtml = speakerName ? `<div class="msg-speaker-name">${escapeHtml(speakerName)}</div>` : '';
    const branchControlsHtml = buildMessageBranchControlsHtml(session, message, messageTreeIndex);
    const metaHtml = renderMessageMeta(message, role);
    const isSelectedMsg = String(state.ui.selectedMessageId || '') === String(message.id || '');
    const selectedStyle = isSelectedMsg
      ? 'box-shadow:0 0 0 2px rgba(59,130,246,.45),0 6px 22px rgba(30,41,59,.08);border-color:rgba(59,130,246,.45);background:linear-gradient(180deg, rgba(255,255,255,.98), rgba(248,250,252,.98));'
      : '';
    return `<div class="msg-row ${role}"><span class="avatar">${avatarHtml}</span><div class="msg ${role}${isSelectedMsg ? ' msg-selected' : ''}" data-mid="${message.id}" style="${selectedStyle}">${speakerHtml}${thinkHtml}${toolCallsHtml}${lorebookHitsHtml}${content}${branchControlsHtml}${metaHtml}</div></div>`;
  }).join('');

  if (isAvatarTranslationOverlayEnabled(session)) {
    let queuedAssistantCount = 0;
    for (let i = visibleMessages.length - 1; i >= 0; i -= 1) {
      const msg = visibleMessages[i];
      if (!isTranslatableAssistantMessage(session, msg)) continue;
      enqueueOverlayTranslation(session, msg);
      queuedAssistantCount += 1;
      if (queuedAssistantCount >= translationOverlayRuntime.renderLookback) break;
    }
    // Also translate the first assistant message (character greeting) if not already queued
    const firstAssistant = visibleMessages.find((m) => m.role === 'assistant' && (!m.kind || m.kind === 'chat'));
    if (firstAssistant && isTranslatableAssistantMessage(session, firstAssistant)) {
      enqueueOverlayTranslation(session, firstAssistant);
    }
  }

  setSelectedMessageBubble(state.ui.selectedMessageId || '');
  els.messageList.scrollTop = els.messageList.scrollHeight;
  try { voiceTtsController && voiceTtsController.afterRenderMessages && voiceTtsController.afterRenderMessages(); } catch (_) {}
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

function estimateTokenUsage(text) {
  const s = String(text || '');
  if (!s) return 0;
  const cjk = (s.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length;
  const asciiLike = s.length - cjk;
  const est = Math.round(cjk * 1.25 + asciiLike * 0.28);
  return Math.max(1, est);
}

function renderMessageMeta(message, role) {
  return renderMessageMetaHtml({
    message,
    role,
    settings: state.settings,
    formatTime,
    getChatModelName,
    estimateTokenUsage,
    escapeHtml
  });
}

function renderToolCard(message) {
  return renderToolCardHtml({
    message,
    stateUi: state.ui,
    getActiveSession,
    getArtifactTabs,
    renderPaperArtifact,
    renderReviewArtifact,
    escapeHtml,
    toolName,
    formatTime
  });
}

function appendChatMessage(role, content, extra) {
  const session = getActiveSession();
  if (!session) return null;
  ensureSessionMessageTreeState(session);
  const extraObj = (extra && typeof extra === 'object') ? extra : {};
  const explicitParentId = Object.prototype.hasOwnProperty.call(extraObj, '_treeParentId')
    ? normalizeMessageTreeParentId(extraObj._treeParentId)
    : null;
  const inferredParent = getVisibleChatLeafMessage(session);
  const treeParentId = Object.prototype.hasOwnProperty.call(extraObj, '_treeParentId')
    ? explicitParentId
    : (inferredParent ? inferredParent.id : null);
  const message = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    kind: 'chat',
    role,
    content: String(content || ''),
    createdAt: Date.now(),
    ...extraObj,
    treeNodeId: extraObj.treeNodeId || undefined,
    treeParentId
  };
  delete message._treeParentId;
  if (!message.treeNodeId) message.treeNodeId = message.id;
  session.messages.push(message);
  setSessionBranchSelection(session, treeParentId, message.id);
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
  ensureSessionMessageTreeState(session);
  const visibleLeaf = getVisibleChatLeafMessage(session);
  const message = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    kind: 'tool',
    tool,
    title: toolName(tool),
    status: 'running',
    detail: detail || '姝ｅ湪澶勭悊...',
    artifactId: '',
    createdAt: Date.now(),
    treeParentId: visibleLeaf ? visibleLeaf.id : null
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

function setSelectedMessageBubble(messageId) {
  const id = String(messageId || '').trim();
  state.ui.selectedMessageId = id;
  if (!els.messageList) return;
  els.messageList.querySelectorAll('.msg[data-mid]').forEach((node) => {
    const isActive = id && String(node.getAttribute('data-mid') || '') === id;
    node.classList.toggle('msg-selected', Boolean(isActive));
    if (isActive) {
      node.style.boxShadow = '0 0 0 2px rgba(59,130,246,.45), 0 6px 22px rgba(30,41,59,.08)';
      node.style.borderColor = 'rgba(59,130,246,.45)';
      node.style.background = 'linear-gradient(180deg, rgba(255,255,255,.98), rgba(248,250,252,.98))';
    } else {
      node.style.boxShadow = '';
      node.style.borderColor = '';
      node.style.background = '';
    }
  });
}

function switchMessageBranchSibling(session, messageId, direction) {
  if (!session) return false;
  const message = getSessionMessageById(session, messageId);
  if (!message || !isChatMessageNode(message)) return false;
  const info = getMessageSiblingBranchInfo(session, message);
  if (!info || info.count <= 1) return false;
  const nextIndex = info.index + Number(direction || 0);
  if (nextIndex < 0 || nextIndex >= info.count) return false;
  const nextMsg = info.siblings[nextIndex];
  if (!nextMsg) return false;
  if (!setSessionBranchSelection(session, info.parentId, nextMsg.id)) return false;
  persistSessionsState();
  renderSessionList();
  renderMessages();
  return true;
}

async function editAndResendFromUserMessage(session, messageId) {
  if (!session || state.ui.chatStreaming) return;
  const target = getSessionMessageById(session, messageId);
  if (!target || !isChatMessageNode(target) || target.role !== 'user') return;
  const isGroup = Boolean(session.avatarId && (() => {
    const av = getAvatarById(session.avatarId);
    return av && av.type === 'group';
  })());
  if (isGroup) {
    setStatus('群聊分支编辑重发后续支持。');
    return;
  }
  const edited = window.prompt('编辑后重发（将形成新分支）', String(target.content || ''));
  if (edited == null) return;
  const text = String(edited || '').trim();
  if (!text) return;
  appendChatMessage('user', text, { _treeParentId: normalizeMessageTreeParentId(target.treeParentId) });
  persistSessionsState();
  renderSessionList();
  renderMessages();
  await sendSingleChatMessage(session);
}

async function regenerateAssistantBranch(session, messageId) {
  if (!session || state.ui.chatStreaming) return;
  const target = getSessionMessageById(session, messageId);
  if (!target || !isChatMessageNode(target) || target.role !== 'assistant') return;
  const isGroup = Boolean(target.speakerAvatarId) || Boolean(session.avatarId && (() => {
    const av = getAvatarById(session.avatarId);
    return av && av.type === 'group';
  })());
  if (isGroup) {
    setStatus('群聊回复分支重生成后续支持。');
    return;
  }
  const parentId = normalizeMessageTreeParentId(target.treeParentId);
  const payloadMessages = parentId
    ? buildChatPayloadMessages(session, { untilChatMessageId: parentId })
    : [];
  const assistant = appendChatMessage('assistant', '', {
    modelName: getChatModelName(),
    _treeParentId: parentId
  });
  persistSessionsState();
  renderSessionList();
  renderMessages();
  await sendSingleChatMessage(session, {
    payloadMessagesOverride: payloadMessages,
    assistantMessage: assistant
  });
}

function buildChatPayloadMessages(session, options = {}) {
  const visibleMessages = getVisibleSessionMessages(session);
  const untilChatMessageId = String(options && options.untilChatMessageId || '').trim();
  let sourceMessagesVisible = visibleMessages;
  if (untilChatMessageId) {
    const idx = visibleMessages.findIndex((m) => isChatMessageNode(m) && m.id === untilChatMessageId);
    if (idx >= 0) sourceMessagesVisible = visibleMessages.slice(0, idx + 1);
  }
  const filtered = sourceMessagesVisible
    .filter((m) => {
      if (!(m && m.kind === 'chat' && (m.role === 'user' || m.role === 'assistant'))) return false;
      if (m.excludeFromContext) return false;
      if (m.role === 'assistant' && m.speakerAvatarId) {
        const text = String(m.content || '').trim();
        if (!text) return false;
        if (/^(未收到有效回复，请重试。|本轮未生成有效回复（已跳过该角色本轮发言）。)$/.test(text)) return false;
      }
      return true;
    });
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

async function streamSSEResponse(response, messageId, requestStartedAt, options = {}) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let full = '';
  let thinkFull = '';
  let isThinking = false;
  let toolCalls = [];
  let lorebookHits;
  let firstTokenLatencyMs = null;
  const incrementalRender = Boolean(state.settings.chatStreamOutput);
  const contentGuard = (options && typeof options.contentGuard === 'function') ? options.contentGuard : null;
  let stoppedByGuard = false;
  let guardReason = '';

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
        } else if (Array.isArray(payload.lorebook_hits)) {
          lorebookHits = payload.lorebook_hits;
        } else if (payload.thinking === true) {
          isThinking = true;
        } else if (payload.thinking === false) {
          isThinking = false;
        } else if (payload.think_content) {
          thinkFull += payload.think_content;
        } else if (payload.content) {
          if (firstTokenLatencyMs == null && Number.isFinite(requestStartedAt)) {
            firstTokenLatencyMs = Date.now() - requestStartedAt;
          }
          full += payload.content;
          if (contentGuard) {
            const decision = contentGuard(full);
            if (decision && typeof decision === 'object' && decision.content) {
              full = String(decision.content);
            }
            if (decision && decision.stop !== false && (decision.reason || decision.content)) {
              stoppedByGuard = true;
              guardReason = String(decision.reason || '');
              isThinking = false;
            }
          }
        }
        updateMessage(messageId, (m) => ({
          ...m,
          content: full,
          thinkContent: thinkFull || undefined,
          isThinking,
          toolCalls: toolCalls.length ? [...toolCalls] : undefined,
          lorebookHits: Array.isArray(lorebookHits) ? lorebookHits : m.lorebookHits,
          firstTokenLatencyMs: Number.isFinite(firstTokenLatencyMs) ? firstTokenLatencyMs : m.firstTokenLatencyMs
        }));
        if (incrementalRender || payload.error || payload.tool_call || payload.tool_result || Array.isArray(payload.lorebook_hits) || typeof payload.thinking === 'boolean') {
          renderMessages();
        }
        if (stoppedByGuard) {
          try { await reader.cancel(); } catch (_) {}
          break;
        }
      } catch (_) {}
    }
    if (stoppedByGuard) break;
  }

  if (!full) {
    updateMessage(messageId, (m) => ({ ...m, content: '未收到有效回复，请重试。', isThinking: false }));
    renderMessages();
  } else {
    updateMessage(messageId, (m) => ({ ...m, isThinking: false }));
    renderMessages();
  }
  if (stoppedByGuard && guardReason) {
    try { setStatus(`已截断群聊异常长回复（${guardReason}）。`); } catch (_) {}
  }
  try {
    window.setTimeout(() => {
      try {
        const session = getActiveSession();
        const message = session && Array.isArray(session.messages)
          ? session.messages.find((m) => m && m.id === messageId)
          : null;
        if (session && message) {
          enqueueOverlayTranslation(session, message, { force: true });
        }
      } catch (_) {}
    }, 0);
  } catch (_) {}
  return full;
}

async function sendChatMessage() {
  if (state.ui.sidebarTab === 'contacts' && state.ui.activeContactAvatarId) {
    const active = getActiveSession();
    const required = resolveContactSession(state.ui.activeContactAvatarId, { createIfMissing: true, focus: false });
    if (!active || !required || active.id !== required.id) {
      openContact(state.ui.activeContactAvatarId);
    }
  }
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

async function sendSingleChatMessage(session, options = {}) {
  const payloadMessages = Array.isArray(options && options.payloadMessagesOverride)
    ? options.payloadMessagesOverride
    : buildChatPayloadMessages(session);
  const assistant = (options && options.assistantMessage)
    ? options.assistantMessage
    : appendChatMessage('assistant', '', { modelName: getChatModelName() });
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

    const requestStartedAt = Date.now();
    const proxyHeader = getClientProxyHeaderValue();
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(state.token ? { 'x-access-token': state.token } : {}),
        ...(CLIENT_INSTANCE_ID ? { 'x-client-id': CLIENT_INSTANCE_ID } : {}),
        ...(proxyHeader ? { 'x-client-proxy-config': proxyHeader } : {})
      },
      body: JSON.stringify({
        messages: payloadMessages,
        context: session.materialsText || '',
        mode: state.ui.chatMode,
        providerId: state.ui.selectedProviderId || undefined,
        model: state.ui.selectedModel || undefined,
        preferences: getChatClientPreferences(),
        ...samplingOptions,
        searchResults: searchResults.length ? searchResults : undefined,
        knowledgeBaseIds: getEnabledKbIds(),
        avatar: (() => {
          const av = session.avatarId ? getAvatarById(session.avatarId) : null;
          if (!av) return undefined;
          return {
            id: av.id,
            type: av.type || 'single',
            name: av.name,
            relationship: av.relationship || '',
            customPrompt: av.customPrompt || '',
            memoryText: av.memoryText || ''
          };
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

    if (session.avatarId) recordAvatarUsage(session.avatarId, 1);
    await streamSSEResponse(response, assistant.id, requestStartedAt);
  } catch (error) {
    updateMessage(assistant.id, (m) => ({ ...m, content: `测试失败：${error.message || error}`, isThinking: false }));
    renderMessages();
  } finally {
    state.ui.chatStreaming = false;
    els.sendBtn.disabled = false;
    persistSessionsState();
    renderMessages();
    renderSessionList();
  }
}

async function sendGroupChatMessage(session, group, options = {}) {
  const groupSettings = ensureGroupChatSettings(group);
  const spectatorMode = Boolean(options && options.spectatorMode);
  const spectatorRounds = spectatorMode
    ? clampGroupSpectatorRounds((options && options.spectatorRounds) || (groupSettings && groupSettings.spectatorRoundsPerTrigger) || 1)
    : 1;
  let groupSettingsChanged = false;
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

    let payloadMessages = buildChatPayloadMessages(session);
    if (spectatorMode && !payloadMessages.length) {
      payloadMessages = [{
        role: 'user',
        content: '（旁观模式）请角色们在群聊中自然开始互动、互相回应并推进对话，不需要先向用户提问。'
      }];
    }

    let lastSpeakerName = '';
    let stopRemainingSpectatorRounds = false;
    for (let roundIdx = 0; roundIdx < spectatorRounds; roundIdx += 1) {
      if (stopRemainingSpectatorRounds) break;
      let successfulRepliesInRound = 0;
      const orderedMembers = getGroupOrderedMembersForTurn(group, members);
      for (const member of orderedMembers) {
        const assistant = appendChatMessage('assistant', '', { modelName: getChatModelName() });
        const samplingOptions = getChatSamplingOptions();
        /* tag this message with the speaker */
        const msgInSession = session.messages.find((m) => m.id === assistant.id);
        if (msgInSession) msgInSession.speakerAvatarId = member.id;
        renderMessages();

        const relationHints = getGroupRelationHintsForSpeaker(group, member, members).map((item) => ({
          name: item.name,
          type: item.type,
          label: groupRelationLabel(item.type)
        }));
        const proxyHeader = getClientProxyHeaderValue();
        let finalContent = '';
        let memberSucceeded = false;
        const maxAttempts = 2;

        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          const loopBreakHint = buildGroupLoopBreakHint(session);
          const retryHint = attempt > 1
            ? '上一次回复为空或无效。请直接输出你这一轮的一次发言（1-3句），不要代替他人发言，不要重复寒暄/再见。'
            : '';
          const baseTurnInstruction = spectatorMode
            ? '当前为旁观模式。优先回应其他角色并自然推进话题，不要等待用户再次发言。'
            : '这是群聊回合。可以回应其他角色，也可以回应用户，但请保持群聊互动感。';
          const composedTurnInstruction = [baseTurnInstruction, loopBreakHint, retryHint]
            .map((s) => String(s || '').trim())
            .filter(Boolean)
            .join('\n');

          if (attempt > 1) {
            updateMessage(assistant.id, (m) => ({ ...m, content: '', isThinking: false }));
            renderMessages();
          }

          const requestStartedAt = Date.now();
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(state.token ? { 'x-access-token': state.token } : {}),
              ...(CLIENT_INSTANCE_ID ? { 'x-client-id': CLIENT_INSTANCE_ID } : {}),
              ...(proxyHeader ? { 'x-client-proxy-config': proxyHeader } : {})
            },
            body: JSON.stringify({
              messages: payloadMessages,
              context: session.materialsText || '',
              mode: state.ui.chatMode,
              providerId: state.ui.selectedProviderId || undefined,
              model: state.ui.selectedModel || undefined,
              preferences: getChatClientPreferences(),
              ...samplingOptions,
              knowledgeBaseIds: getEnabledKbIds(),
              avatar: {
                id: member.id,
                type: member.type || 'single',
                name: member.name,
                relationship: member.relationship || '',
                customPrompt: member.customPrompt || '',
                memoryText: member.memoryText || ''
              },
              groupContext: {
                groupName: group.name,
                memberNames: members.map((m) => m.name),
                currentSpeaker: member.name,
                lastSpeaker: lastSpeakerName || '',
                allowAiCrossTalk: Boolean(groupSettings ? groupSettings.allowAiCrossTalk !== false : true),
                spectatorMode,
                spectatorRound: roundIdx + 1,
                spectatorRounds,
                relationshipHints: relationHints,
                turnInstruction: composedTurnInstruction
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
            updateMessage(assistant.id, (m) => ({ ...m, content: msg, excludeFromContext: true }));
            renderMessages();
            finalContent = '';
            break;
          }

          finalContent = await streamSSEResponse(response, assistant.id, requestStartedAt, {
            contentGuard: (partialText) => {
              const detected = detectGroupReplyRunawayDuringStream(partialText, member, members);
              if (!detected) return null;
              return {
                stop: true,
                reason: detected.reason,
                content: detected.content
              };
            }
          });

          const normalizedAttemptContent = String(finalContent || '').trim();
          if (normalizedAttemptContent && normalizedAttemptContent !== '未收到有效回复，请重试。') {
            memberSucceeded = true;
            break;
          }
          if (attempt < maxAttempts) {
            try { setStatus(`${member.name} 本轮未正常回复，正在重试...`); } catch (_) {}
          }
        }

        const sanitizedContent = sanitizeGroupSpeakerReplyContent(finalContent, member, members);
        if (sanitizedContent && sanitizedContent !== finalContent) {
          finalContent = sanitizedContent;
          updateMessage(assistant.id, (m) => ({ ...m, content: finalContent }));
          renderMessages();
        }
        const finalText = String(finalContent || '').trim();
        if (!memberSucceeded || !finalText || finalText === '未收到有效回复，请重试。') {
          session.messages = (session.messages || []).filter((m) => m && m.id !== assistant.id);
          try { ensureSessionMessageTreeState(session); } catch (_) {}
          renderMessages();
          // Do not advance turn anchor or payload history for empty/invalid replies.
          try { setStatus(`${member.name} 本轮未生成有效回复，已跳过。`); } catch (_) {}
          continue;
        }
        recordAvatarUsage(member.id, 1);
        successfulRepliesInRound += 1;
        payloadMessages.push({ role: 'assistant', content: `[${member.name}]: ${finalContent}` });
        lastSpeakerName = member.name;
        if (groupSettings && String(groupSettings.lastSpeakerId || '') !== String(member.id || '')) {
          groupSettings.lastSpeakerId = String(member.id || '');
          groupSettingsChanged = true;
        }
      }
      if (spectatorMode && successfulRepliesInRound <= 0) {
        stopRemainingSpectatorRounds = true;
        try { setStatus('本轮旁观未生成有效回复，已停止继续连发。'); } catch (_) {}
      }
    }
  } catch (error) {
    appendChatMessage('assistant', `群组聊天失败：${error.message}`);
    renderMessages();
  } finally {
    state.ui.chatStreaming = false;
    els.sendBtn.disabled = false;
    if (groupSettingsChanged) persistAvatars();
    persistSessionsState();
    renderMessages();
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
    applyTranslationRateHints(info);
    const health = await apiRequest('/api/health', { method: 'GET' });
    state.health.online = Boolean(health.ok && health.model_available);
    state.health.message = health.message || '';
    updateConnectionUI();
    updateModelSelectFromProviders(info.providers || []);
  } catch (error) {
    state.health.online = false;
    state.health.message = error.message || (getUiPack().serviceUnavailable || '服务不可用');
    updateConnectionUI();
  }
}

function updateConnectionUI() {
  const pack = getUiPack();
  const online = state.health.online;
  if (online) {
    els.connLine1.textContent = pack.connected || '已连接';
    els.connLine2.textContent = '';
  } else {
    els.connLine1.textContent = pack.disconnected || '未连接';
    els.connLine2.textContent = state.health.message || pack.startLocalService || '请先启动本地服务';
  }
}

async function openSettingsPanel() {
  els.settingsPanel.classList.remove('hidden');
  ensurePersonasSettingsSectionNav();
  ensureTeamSharingSettingsSection();
  ensureLorebookSettingsSection();
  ensureAvatarScenarioManagerUi();
  try { voiceTtsController && voiceTtsController.refreshUi && voiceTtsController.refreshUi(); } catch (_) {}
  refreshAvatarPreviews();
  els.tokenInput.value = state.token || '';
  els.userAvatarInput.value = state.ui.userAvatar || '';
  els.aiAvatarInput.value = state.ui.aiAvatar || '';
  syncSettingsUI();
  resetProviderForm();
  resetAvatarForm();
  renderAvatarList();
  renderAvatarScenarioDraftList();
  await loadProviderList();
  loadMcpServerList();
  loadKbList();
  loadTeamSharingStatus();
  loadLorebookList();
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
    if (kbCreatorRuntime.initialized && kbCreatorRuntime.ui) {
      syncKbEmbeddingProviderOptions(kbCreatorRuntime.ui, {
        selectedId: kbCreatorRuntime.ui.embeddingProvider && kbCreatorRuntime.ui.embeddingProvider.value
      });
    }
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
  const select = getLiveModelSelectElement() || els.modelSelect;
  if (!select) return;
  const currentDomValue = String(select.value || '').trim();
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
  // Restore selection: prefer current visible value, then state snapshot, then fallback first option
  const hasOption = (value) => Boolean(value) && Boolean(select.querySelector(`option[value="${CSS.escape(String(value))}"]`));
  const prevKey = state.ui.selectedProviderId && state.ui.selectedModel && state.ui.chatMode
    ? `${state.ui.selectedProviderId}::${state.ui.selectedModel}::${state.ui.chatMode}` : '';
  let nextValue = '';
  if (hasOption(currentDomValue)) {
    nextValue = currentDomValue;
  } else if (hasOption(prevKey)) {
    nextValue = prevKey;
  } else if (select.options.length) {
    nextValue = String(select.options[0].value || '');
  }
  if (nextValue) {
    select.value = nextValue;
    parseModelSelectValue(nextValue);
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

function getClientProxyHeaderValue() {
  const s = state.settings || {};
  if (!s.proxyEnabled) return '';
  const host = String(s.proxyHost || '').trim();
  const portText = String(s.proxyPort || '').trim();
  const port = Number(portText);
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) return '';
  return JSON.stringify({
    enabled: true,
    type: String(s.proxyType || 'socks5'),
    host,
    port,
    user: String(s.proxyUser || ''),
    pass: String(s.proxyPass || '')
  });
}

async function apiRequest(url, options) {
  const reqOptions = options || {};
  const headers = new Headers(reqOptions.headers || {});
  if (reqOptions.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (state.token) headers.set('x-access-token', state.token);
  if (CLIENT_INSTANCE_ID) headers.set('x-client-id', CLIENT_INSTANCE_ID);
  const proxyHeader = getClientProxyHeaderValue();
  if (proxyHeader) headers.set('x-client-proxy-config', proxyHeader);

  let response;
  const timeoutMs = Number(reqOptions.timeoutMs || 0);
  let controller = null;
  let timeoutId = 0;
  if (timeoutMs > 0 && typeof AbortController !== 'undefined') {
    controller = new AbortController();
    timeoutId = window.setTimeout(() => {
      try { controller.abort(); } catch (_) {}
    }, timeoutMs);
  }
  try {
    const fetchOpts = { ...reqOptions, headers };
    if (controller) fetchOpts.signal = controller.signal;
    delete fetchOpts.timeoutMs;
    response = await fetch(url, fetchOpts);
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new Error(`请求超时（>${timeoutMs}ms）`);
    }
    throw new Error('网络错误，请确认本地服务已启动。');
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
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
    const err = new Error(payload.message || payload.error || `请求失败：${response.status}`);
    err.status = response.status;
    err.payload = payload;
    throw err;
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
  const target = els.fileStatus || document.getElementById('fileStatus') || null;
  if (target) {
    target.textContent = String(text || '');
    return;
  }
  if (text) console.warn('[status]', text);
}

/* Phase-1 split: pure/shared utility helpers moved to /public/js/utils-core.js */

/* ── MCP Settings ── */

const mcpCatalogRuntime = {
  initialized: false,
  ui: null,
  query: '',
  loading: false,
  lastMessage: ''
};

const mcpServerEditorRuntime = {
  initialized: false,
  ui: null,
  mode: 'create',
  editId: '',
  saving: false
};

const mcpJsonImportRuntime = {
  initialized: false,
  ui: null,
  busy: false
};

const kbCreatorRuntime = {
  initialized: false,
  ui: null,
  mode: 'create',
  editId: '',
  file: null,
  busy: false
};

const teamSharingRuntime = {
  launcherReady: false,
  modalReady: false,
  ui: null,
  data: null,
  loading: false,
  saving: false,
  lastIssuedToken: '',
  lastIssuedMemberId: ''
};

const lorebookRuntime = {
  sectionReady: false,
  modalReady: false,
  ui: null,
  modalUi: null,
  list: [],
  stats: null,
  loading: false,
  saving: false,
  filterScope: 'all',
  filterAvatarId: '',
  createScopeAvatarId: ''
};

const avatarScenarioRuntime = {
  initialized: false,
  draftItems: [],
  pickerModalReady: false,
  pickerUi: null,
  editorModalReady: false,
  editorUi: null,
  editingScenarioId: '',
  pendingSessionId: '',
  pendingAvatarId: ''
};

const avatarGalleryRuntime = {
  modalReady: false,
  detailModalReady: false,
  ui: null,
  detailUi: null,
  search: '',
  tag: 'all',
  selectedAvatarId: '',
  source: ''
};

function getEmbeddingCapableProviders(type = '') {
  const providers = Array.isArray(state.info.providers) ? state.info.providers : [];
  return providers.filter((p) => {
    if (!p || !p.enabled) return false;
    if (type === 'ollama') return p.type === 'ollama';
    if (type === 'openai_compatible') return p.type === 'openai_compatible';
    return p.type === 'ollama' || p.type === 'openai_compatible';
  });
}

function syncKbEmbeddingProviderOptions(ui, opts = {}) {
  if (!ui || !ui.embeddingMode || !ui.embeddingProvider) return;
  const mode = String(ui.embeddingMode.value || 'none');
  const selected = String(opts.selectedId || ui.embeddingProvider.value || '');
  const providers = getEmbeddingCapableProviders(mode);

  if (mode === 'none') {
    ui.embeddingProvider.innerHTML = '<option value=\"\">未启用向量检索</option>';
    ui.embeddingProvider.disabled = true;
    if (ui.embeddingModel) ui.embeddingModel.disabled = true;
    if (ui.embeddingStatusHint) ui.embeddingStatusHint.textContent = '当前仅使用词法检索（BM25-like）';
    return;
  }

  const allowEmpty = mode === 'ollama';
  const options = [];
  if (allowEmpty) options.push('<option value=\"\">本机 Ollama（默认）</option>');
  if (!providers.length) {
    ui.embeddingProvider.innerHTML = options.concat('<option value=\"\" disabled>暂无可用 Provider</option>').join('');
    ui.embeddingProvider.disabled = false;
    if (ui.embeddingModel) ui.embeddingModel.disabled = false;
    if (ui.embeddingStatusHint) {
      ui.embeddingStatusHint.textContent = mode === 'openai_compatible'
        ? '请先在模型提供方中添加并启用 OpenAI-compatible Provider'
        : '将使用本机 Ollama；也可在模型提供方中添加更多 Ollama Provider';
    }
    return;
  }

  const providerOptions = providers.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} · ${escapeHtml(p.type)}</option>`);
  ui.embeddingProvider.innerHTML = options.concat(providerOptions).join('');
  if (selected && Array.from(ui.embeddingProvider.options).some((op) => op.value === selected)) {
    ui.embeddingProvider.value = selected;
  } else if (allowEmpty) {
    ui.embeddingProvider.value = '';
  } else {
    ui.embeddingProvider.value = providers[0].id;
  }
  ui.embeddingProvider.disabled = false;
  if (ui.embeddingModel) ui.embeddingModel.disabled = false;
  if (ui.embeddingStatusHint) {
    ui.embeddingStatusHint.textContent = mode === 'openai_compatible'
      ? '使用兼容 OpenAI 的 /embeddings 接口构建向量索引'
      : '使用本机 Ollama embeddings 接口构建向量索引（推荐如 nomic-embed-text）';
  }
}

function ensureToolUiInjectedStyle() {
  if (document.getElementById('toolUiInjectedStyle')) return;
  const style = document.createElement('style');
  style.id = 'toolUiInjectedStyle';
  style.textContent = `
    .toolui-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.28);display:none;align-items:center;justify-content:center;padding:24px;z-index:10000}
    .toolui-backdrop.open{display:flex}
    .toolui-modal{width:min(860px,96vw);max-height:min(88vh,900px);background:#fff;color:#111827;border-radius:14px;box-shadow:0 24px 70px rgba(15,23,42,.25);display:flex;flex-direction:column;overflow:hidden}
    .toolui-modal.narrow{width:min(720px,96vw)}
    .toolui-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 18px;border-bottom:1px solid rgba(148,163,184,.18)}
    .toolui-title{font-size:18px;font-weight:700}
    .toolui-close{border:0;background:#f1f5f9;color:#334155;border-radius:10px;padding:8px 10px;cursor:pointer}
    .toolui-body{padding:16px 18px;overflow:auto}
    .toolui-foot{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:14px 18px;border-top:1px solid rgba(148,163,184,.18);background:#fff}
    .toolui-grid{display:grid;grid-template-columns:1fr;gap:12px}
    .toolui-row{display:flex;flex-direction:column;gap:6px}
    .toolui-row label{font-size:13px;font-weight:600;color:#334155}
    .toolui-row .hint{font-size:12px;color:#94a3b8}
    .toolui-input,.toolui-select,.toolui-textarea{width:100%;border:1px solid rgba(148,163,184,.35);border-radius:10px;padding:10px 12px;font:inherit;color:inherit;background:#fff}
    .toolui-textarea{min-height:110px;resize:vertical}
    .toolui-input:focus,.toolui-select:focus,.toolui-textarea:focus{outline:0;border-color:rgba(59,130,246,.55);box-shadow:0 0 0 3px rgba(59,130,246,.12)}
    .toolui-inline{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    .toolui-radio{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid rgba(148,163,184,.24);border-radius:999px;background:#fff;cursor:pointer}
    .toolui-radio input{margin:0}
    .toolui-radio.active{border-color:rgba(59,130,246,.45);background:#eff6ff}
    .toolui-switch-block{border:1px solid rgba(148,163,184,.18);border-radius:12px;padding:12px;background:#fafcff}
    .toolui-hidden{display:none !important}
    .toolui-status{font-size:12px;color:#64748b;margin-top:6px;min-height:18px;line-height:1.35}
    .toolui-status.error{color:#b91c1c}
    .toolui-status.success{color:#047857}
    .toolui-section-title{font-size:13px;font-weight:700;color:#64748b;margin:4px 0 2px}
    .toolui-actions-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    .toolui-filebox{border:1px dashed rgba(148,163,184,.35);border-radius:10px;padding:10px 12px;background:#f8fafc}
    @media (min-width: 760px){
      .toolui-grid.two-col{grid-template-columns:1fr 1fr}
    }
    @media (max-width: 700px){
      .toolui-backdrop{padding:12px}
      .toolui-modal,.toolui-modal.narrow{width:100%;max-height:92vh;border-radius:12px}
      .toolui-head,.toolui-body,.toolui-foot{padding-left:14px;padding-right:14px}
    }
  `;
  document.head.appendChild(style);
}

function setToolUiStatus(el, text, type = '') {
  if (!el) return;
  el.textContent = String(text || '');
  el.classList.remove('error', 'success');
  if (type) el.classList.add(type);
}

function parseKeyValueLines(text) {
  const out = {};
  String(text || '').split(/\r?\n/).forEach((line) => {
    const s = line.trim();
    if (!s || s.startsWith('#')) return;
    let idx = s.indexOf('=');
    if (idx <= 0) idx = s.indexOf(':');
    if (idx <= 0) return;
    out[s.slice(0, idx).trim()] = s.slice(idx + 1).trim();
  });
  return out;
}

function kvObjectToLines(obj, sep = '=') {
  if (!obj || typeof obj !== 'object') return '';
  return Object.entries(obj).map(([k, v]) => `${k}${sep}${String(v ?? '')}`).join('\n');
}

function getGeneralSettingsSection() {
  return els.settingsPanel ? els.settingsPanel.querySelector('.settings-section[data-section="general"]') : null;
}

function ensurePersonasSettingsSectionNav() {
  if (!els.settingsPanel) return null;
  const nav = els.settingsPanel.querySelector('.settings-nav');
  if (!nav) return null;
  const personaSection = els.settingsPanel.querySelector('.settings-section[data-section="personas"]');
  if (!personaSection) return null;

  let navBtn = nav.querySelector('.settings-nav-item[data-section="personas"]');
  if (!navBtn) {
    navBtn = document.createElement('button');
    navBtn.className = 'settings-nav-item';
    navBtn.type = 'button';
    navBtn.dataset.section = 'personas';
    navBtn.textContent = '角色';
    const mcpBtn = nav.querySelector('.settings-nav-item[data-section="mcp"]');
    const spacer = nav.querySelector('.settings-nav-spacer');
    if (mcpBtn) nav.insertBefore(navBtn, mcpBtn);
    else if (spacer) nav.insertBefore(navBtn, spacer);
    else nav.appendChild(navBtn);
  }
  return navBtn;
}

function getTeamSharingSettingsSection() {
  return els.settingsPanel ? els.settingsPanel.querySelector('.settings-section[data-section="team-sharing"]') : null;
}

function ensureTeamSharingSettingsSection() {
  if (!els.settingsPanel) return null;
  const nav = els.settingsPanel.querySelector('.settings-nav');
  const content = els.settingsPanel.querySelector('.settings-content');
  if (!nav || !content) return null;

  let navBtn = nav.querySelector('.settings-nav-item[data-section="team-sharing"]');
  if (!navBtn) {
    navBtn = document.createElement('button');
    navBtn.className = 'settings-nav-item';
    navBtn.type = 'button';
    navBtn.dataset.section = 'team-sharing';
    navBtn.textContent = '团队分享';
    const spacer = nav.querySelector('.settings-nav-spacer');
    if (spacer) nav.insertBefore(navBtn, spacer);
    else nav.appendChild(navBtn);
  }

  let section = getTeamSharingSettingsSection();
  if (!section) {
    section = document.createElement('div');
    section.className = 'settings-section hidden';
    section.dataset.section = 'team-sharing';
    section.innerHTML = `
      <h3>团队分享（Team Sharing）</h3>
      <div id="teamSharingSettingsMount"></div>
      <div class="settings-group" style="margin-top:12px;">
        <h4>接入说明</h4>
        <div class="setting-row">
          <label>OpenAI-compatible Relay</label>
          <div class="setting-control" style="flex-direction:column;align-items:flex-start;gap:8px;max-width:100%;">
            <div id="teamSharingRelaySummary" class="muted" style="line-height:1.5;word-break:break-all;">未加载</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button id="teamSharingCopyModelsUrlBtn" class="btn ghost" type="button">复制 models 地址</button>
              <button id="teamSharingCopyChatUrlBtn" class="btn ghost" type="button">复制 chat 地址</button>
              <button id="teamSharingCopyEmbedUrlBtn" class="btn ghost" type="button">复制 embeddings 地址</button>
            </div>
            <div id="teamSharingRelayCopyStatus" class="muted" style="font-size:12px;"></div>
          </div>
        </div>
      </div>
    `;
    content.appendChild(section);

    const copyStatusEl = section.querySelector('#teamSharingRelayCopyStatus');
    const copyRelayUrl = async (kind) => {
      const data = teamSharingRuntime.data || {};
      const base = String(data.publicBaseUrl || data.effectiveBaseUrl || location.origin).replace(/\/+$/, '');
      let path = '/api/team-sharing/openai/v1/models';
      if (kind === 'chat') path = '/api/team-sharing/openai/v1/chat/completions';
      if (kind === 'embeddings') path = '/api/team-sharing/openai/v1/embeddings';
      const ok = await copyTextPortable(`${base}${path}`);
      if (copyStatusEl) copyStatusEl.textContent = ok ? `已复制：${base}${path}` : '复制失败，请手动复制';
    };
    const btnModels = section.querySelector('#teamSharingCopyModelsUrlBtn');
    const btnChat = section.querySelector('#teamSharingCopyChatUrlBtn');
    const btnEmbed = section.querySelector('#teamSharingCopyEmbedUrlBtn');
    if (btnModels) btnModels.addEventListener('click', () => copyRelayUrl('models'));
    if (btnChat) btnChat.addEventListener('click', () => copyRelayUrl('chat'));
    if (btnEmbed) btnEmbed.addEventListener('click', () => copyRelayUrl('embeddings'));
  }

  return section;
}

function formatTeamSharingTime(ts) {
  const n = Number(ts || 0);
  if (!n) return '未使用';
  try {
    return new Date(n).toLocaleString();
  } catch (_) {
    return String(n);
  }
}

async function copyTextPortable(text) {
  const content = String(text || '');
  if (!content) return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(content);
      return true;
    }
  } catch (_) {}
  try {
    fallbackCopy(content);
    return true;
  } catch (_) {
    return false;
  }
}

function buildTeamSharingMemberGuideText(token, member, data) {
  const status = data && typeof data === 'object' ? data : (teamSharingRuntime.data || {});
  const baseUrl = String(status.publicBaseUrl || status.effectiveBaseUrl || `${location.origin}`).replace(/\/+$/, '');
  const name = String(member?.name || 'Member');
  const relayBase = `${baseUrl}/api/team-sharing/openai/v1`;
  return [
    `Team Sharing 成员：${name}`,
    `Base URL: ${baseUrl}`,
    `x-access-token: ${token}`,
    '',
    '当前 MVP 接入方式（FinalAI 客户端/自定义客户端）：',
    `- 请求头带上 x-access-token: ${token}`,
    `- 可访问路由：/api/chat /api/translate /api/search（以及少量只读状态接口）`,
    '- 管理路由 /api/team-sharing/* 仅管理员可访问',
    '',
    'OpenAI-compatible Relay（推荐给第三方客户端）：',
    `- Models: ${relayBase}/models`,
    `- Chat Completions: ${relayBase}/chat/completions`,
    `- Embeddings: ${relayBase}/embeddings`,
    '- 认证头可用 Authorization: Bearer <token> 或 x-access-token',
    '',
    '示例（健康检查）：',
    `curl -H "x-access-token: ${token}" "${baseUrl}/api/health"`,
    '',
    '示例（FinalAI 原生聊天接口）：',
    `curl -X POST "${baseUrl}/api/chat" -H "Content-Type: application/json" -H "x-access-token: ${token}" -d "{\\"messages\\":[{\\"role\\":\\"user\\",\\"content\\":\\"你好\\"}]}"`,
    '',
    '示例（OpenAI-compatible Chat）：',
    `curl -X POST "${relayBase}/chat/completions" -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" -d "{\\"model\\":\\"${(state.ui.selectedModel || state.info.model || 'qwen3:8b')}\\",\\"messages\\":[{\\"role\\":\\"user\\",\\"content\\":\\"你好\\"}]}"`,
  ].join('\n');
}

function ensureTeamSharingLauncher() {
  ensureTeamSharingSettingsSection();
  const teamSection = getTeamSharingSettingsSection();
  const sectionMount = teamSection ? teamSection.querySelector('#teamSharingSettingsMount') : null;
  const section = sectionMount || getGeneralSettingsSection();
  if (!section) return null;

  const existingHost = document.getElementById('teamSharingLauncherCard');
  if (existingHost) {
    if (existingHost.parentElement !== section) section.appendChild(existingHost);
    teamSharingRuntime.launcherReady = true;
    return existingHost;
  }

  const host = document.createElement('div');
  host.id = 'teamSharingLauncherCard';
  host.className = 'team-sharing-launcher-card';
  host.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:12px 14px;border:1px solid rgba(148,163,184,.28);border-radius:12px;background:rgba(248,250,252,.75);margin:8px 0 12px;">
      <div style="min-width:0;flex:1;">
        <div style="font-weight:700;">Team Sharing（共享访问）</div>
        <div class="muted" style="font-size:12px;line-height:1.4;margin-top:2px;">为成员生成独立 token，并按成员限流；可用于桌面版/自定义客户端共享接入（真实生效）</div>
        <div id="teamSharingLauncherSummary" class="muted" style="font-size:12px;line-height:1.5;margin-top:8px;">未加载</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
        <button id="teamSharingOpenBtn" class="btn primary" type="button">管理 Sharing</button>
        <button id="teamSharingRefreshBtn" class="btn ghost" type="button">刷新</button>
      </div>
    </div>
  `;

  const firstChild = section.firstElementChild;
  if (firstChild) section.insertBefore(host, firstChild);
  else section.appendChild(host);

  const openBtn = host.querySelector('#teamSharingOpenBtn');
  const refreshBtn = host.querySelector('#teamSharingRefreshBtn');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      openTeamSharingModal().catch((error) => {
        const summaryEl = host.querySelector('#teamSharingLauncherSummary');
        if (summaryEl) summaryEl.textContent = `打开 Sharing 管理失败：${error.message || error}`;
      });
    });
  }
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadTeamSharingStatus({ force: true });
    });
  }

  teamSharingRuntime.launcherReady = true;
  return host;
}

function refreshTeamSharingLauncherSummary() {
  const host = ensureTeamSharingLauncher();
  const summaryEl = host ? host.querySelector('#teamSharingLauncherSummary') : null;
  if (!summaryEl) return;

  const data = teamSharingRuntime.data;
  if (!data) {
    summaryEl.textContent = teamSharingRuntime.loading ? '正在加载 Team Sharing 状态...' : '未加载 Team Sharing 状态';
    return;
  }

  const enabled = Boolean(data.enabled);
  const members = Array.isArray(data.members) ? data.members : [];
  const activeCount = members.filter((m) => m && m.enabled !== false).length;
  const accessTokenConfigured = Boolean(data.accessTokenConfigured);
  const baseUrl = String(data.publicBaseUrl || data.effectiveBaseUrl || '').trim();
  const warn = String(data.warning || '').trim();

  let text = `${enabled ? '已启用' : '未启用'} · 成员 ${members.length} 个（启用 ${activeCount} 个）`;
  text += ` · 管理口令${accessTokenConfigured ? '已配置' : '未配置'}`;
  if (baseUrl) text += ` · Base URL: ${baseUrl}`;
  if (warn) text += ` · ${warn}`;
  summaryEl.textContent = text;

  const relaySummaryEl = els.settingsPanel ? els.settingsPanel.querySelector('#teamSharingRelaySummary') : null;
  if (relaySummaryEl) {
    const relayBase = String(baseUrl || location.origin).replace(/\/+$/, '');
    relaySummaryEl.innerHTML = [
      `Models: <code>${escapeHtml(`${relayBase}/api/team-sharing/openai/v1/models`)}</code>`,
      `Chat: <code>${escapeHtml(`${relayBase}/api/team-sharing/openai/v1/chat/completions`)}</code>`,
      `Embeddings: <code>${escapeHtml(`${relayBase}/api/team-sharing/openai/v1/embeddings`)}</code>`,
      '成员使用生成的 token 作为 `Authorization: Bearer <token>` 或 `x-access-token` 即可。'
    ].join('<br>');
  }
}

function ensureTeamSharingModal() {
  if (teamSharingRuntime.modalReady && teamSharingRuntime.ui) return teamSharingRuntime.ui;
  ensureToolUiInjectedStyle();

  const backdrop = document.createElement('div');
  backdrop.className = 'toolui-backdrop';
  backdrop.innerHTML = `
    <div class="toolui-modal" role="dialog" aria-modal="true" aria-labelledby="teamSharingTitle">
      <div class="toolui-head">
        <div class="toolui-title" id="teamSharingTitle">Team Sharing 管理</div>
        <button class="toolui-close" type="button" data-close>ESC</button>
      </div>
      <div class="toolui-body">
        <div class="toolui-grid">
          <div class="toolui-row">
            <label>共享设置（真实生效）</label>
            <div class="toolui-switch-block">
              <div class="toolui-grid two-col">
                <div class="toolui-row">
                  <label for="teamShareEnabledInput">启用 Team Sharing</label>
                  <label class="toolui-inline" style="font-weight:400;">
                    <input id="teamShareEnabledInput" type="checkbox">
                    <span>开启后成员 token 可访问受限 API（聊天/翻译等）</span>
                  </label>
                  <div class="hint">为避免管理接口暴露，建议并默认要求先配置 ACCESS_TOKEN 再启用。</div>
                </div>
                <div class="toolui-row">
                  <label for="teamShareDefaultRateInput">成员默认限流（次/分钟）</label>
                  <input id="teamShareDefaultRateInput" class="toolui-input" type="number" min="10" max="5000" step="1" value="120">
                  <div class="hint">新建成员时默认使用，可单独覆盖。</div>
                </div>
                <div class="toolui-row" style="grid-column:1/-1;">
                  <label for="teamSharePublicBaseUrlInput">对外 Base URL（可选）</label>
                  <input id="teamSharePublicBaseUrlInput" class="toolui-input" type="text" placeholder="例如：https://your-domain.com">
                  <div class="hint">用于生成接入说明；留空则按当前服务地址推断。</div>
                </div>
              </div>
            </div>
          </div>

          <div class="toolui-row">
            <label>运行状态</label>
            <div class="toolui-filebox">
              <div id="teamShareRuntimeInfo" style="font-size:13px;line-height:1.5;color:#334155;">未加载</div>
              <div id="teamShareWarningText" class="hint" style="margin-top:6px;"></div>
            </div>
          </div>

          <div class="toolui-row">
            <label>新增成员</label>
            <div class="toolui-filebox">
              <div class="toolui-grid two-col">
                <div class="toolui-row">
                  <label for="teamShareMemberNameInput">成员名称</label>
                  <input id="teamShareMemberNameInput" class="toolui-input" type="text" placeholder="例如：Alice / 测试机">
                </div>
                <div class="toolui-row">
                  <label for="teamShareMemberRateInput">限流（次/分钟）</label>
                  <input id="teamShareMemberRateInput" class="toolui-input" type="number" min="10" max="5000" step="1" placeholder="默认值">
                </div>
              </div>
              <div class="toolui-actions-row">
                <button id="teamShareCreateMemberBtn" type="button" class="btn primary">创建成员并生成 Token</button>
              </div>
              <div class="hint">注意：Token 只会在创建/重置时显示一次，请及时保存。</div>
            </div>
          </div>

          <div id="teamShareIssuedTokenWrap" class="toolui-row toolui-hidden">
            <label>新发放 Token（只展示一次）</label>
            <div class="toolui-filebox">
              <textarea id="teamShareIssuedTokenText" class="toolui-textarea" rows="3" readonly></textarea>
              <div class="toolui-actions-row" style="margin-top:8px;">
                <button id="teamShareCopyTokenBtn" type="button" class="btn ghost">复制 Token</button>
                <button id="teamShareCopyGuideBtn" type="button" class="btn ghost">复制接入说明</button>
              </div>
              <div id="teamShareIssuedTokenStatus" class="toolui-status"></div>
            </div>
          </div>

          <div class="toolui-row">
            <label>成员列表</label>
            <div id="teamShareMemberList" class="toolui-grid" style="gap:10px;"></div>
          </div>

          <div id="teamShareStatus" class="toolui-status"></div>
        </div>
      </div>
      <div class="toolui-foot">
        <button type="button" class="btn ghost" id="teamShareRefreshBtnModal">刷新</button>
        <button type="button" class="btn primary" id="teamShareSaveBtn">保存设置</button>
        <button type="button" class="btn ghost" data-close>关闭</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const ui = {
    backdrop,
    enabled: backdrop.querySelector('#teamShareEnabledInput'),
    defaultRate: backdrop.querySelector('#teamShareDefaultRateInput'),
    publicBaseUrl: backdrop.querySelector('#teamSharePublicBaseUrlInput'),
    runtimeInfo: backdrop.querySelector('#teamShareRuntimeInfo'),
    warningText: backdrop.querySelector('#teamShareWarningText'),
    memberName: backdrop.querySelector('#teamShareMemberNameInput'),
    memberRate: backdrop.querySelector('#teamShareMemberRateInput'),
    createMemberBtn: backdrop.querySelector('#teamShareCreateMemberBtn'),
    memberList: backdrop.querySelector('#teamShareMemberList'),
    issuedWrap: backdrop.querySelector('#teamShareIssuedTokenWrap'),
    issuedTokenText: backdrop.querySelector('#teamShareIssuedTokenText'),
    issuedTokenStatus: backdrop.querySelector('#teamShareIssuedTokenStatus'),
    copyTokenBtn: backdrop.querySelector('#teamShareCopyTokenBtn'),
    copyGuideBtn: backdrop.querySelector('#teamShareCopyGuideBtn'),
    status: backdrop.querySelector('#teamShareStatus'),
    refreshBtn: backdrop.querySelector('#teamShareRefreshBtnModal'),
    saveBtn: backdrop.querySelector('#teamShareSaveBtn')
  };

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeTeamSharingModal();
  });
  backdrop.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => closeTeamSharingModal()));

  ui.refreshBtn.addEventListener('click', () => loadTeamSharingStatus({ force: true, syncModal: true }));
  ui.saveBtn.addEventListener('click', () => saveTeamSharingConfigFromModal());
  ui.createMemberBtn.addEventListener('click', () => createTeamSharingMemberFromModal());
  ui.copyTokenBtn.addEventListener('click', async () => {
    const token = teamSharingRuntime.lastIssuedToken || '';
    const ok = await copyTextPortable(token);
    setToolUiStatus(ui.issuedTokenStatus, ok ? 'Token 已复制' : '复制失败，请手动复制', ok ? 'success' : 'error');
  });
  ui.copyGuideBtn.addEventListener('click', async () => {
    const token = teamSharingRuntime.lastIssuedToken || '';
    const data = teamSharingRuntime.data || {};
    const member = (Array.isArray(data.members) ? data.members : []).find((m) => m.id === teamSharingRuntime.lastIssuedMemberId) || { name: 'Member' };
    const ok = await copyTextPortable(buildTeamSharingMemberGuideText(token, member, data));
    setToolUiStatus(ui.issuedTokenStatus, ok ? '接入说明已复制' : '复制失败，请手动复制', ok ? 'success' : 'error');
  });

  ui.memberList.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action][data-member-id]');
    if (!btn) return;
    const action = btn.dataset.action;
    const memberId = btn.dataset.memberId;
    const card = btn.closest('[data-member-card]');
    if (!action || !memberId) return;
    if (action === 'delete' && !window.confirm('确认删除该 Team Sharing 成员？')) return;
    if (action === 'reset-token' && !window.confirm('确认重置该成员 Token？旧 Token 将立即失效。')) return;

    if (action === 'save') {
      await updateTeamSharingMemberFromCard(memberId, card);
      return;
    }
    if (action === 'toggle') {
      const nextEnabled = String(btn.dataset.nextEnabled || '0') === '1';
      await updateTeamSharingMember(memberId, { enabled: nextEnabled }, { okMessage: nextEnabled ? '成员已启用' : '成员已禁用' });
      return;
    }
    if (action === 'reset-token') {
      await resetTeamSharingMemberToken(memberId);
      return;
    }
    if (action === 'delete') {
      await deleteTeamSharingMember(memberId);
      return;
    }
  });

  teamSharingRuntime.modalReady = true;
  teamSharingRuntime.ui = ui;
  return ui;
}

function closeTeamSharingModal() {
  const ui = ensureTeamSharingModal();
  ui.backdrop.classList.remove('open');
}

function renderTeamSharingIssuedToken(member, token) {
  const ui = ensureTeamSharingModal();
  teamSharingRuntime.lastIssuedToken = String(token || '');
  teamSharingRuntime.lastIssuedMemberId = String(member && member.id || '');
  if (!teamSharingRuntime.lastIssuedToken) {
    ui.issuedWrap.classList.add('toolui-hidden');
    ui.issuedTokenText.value = '';
    setToolUiStatus(ui.issuedTokenStatus, '', '');
    return;
  }
  ui.issuedWrap.classList.remove('toolui-hidden');
  ui.issuedTokenText.value = teamSharingRuntime.lastIssuedToken;
  setToolUiStatus(ui.issuedTokenStatus, `请立即保存该 Token（成员：${member && member.name ? member.name : 'Member'}）`, '');
}

function renderTeamSharingMembers(data) {
  const ui = ensureTeamSharingModal();
  const list = Array.isArray(data && data.members) ? data.members : [];
  if (!list.length) {
    ui.memberList.innerHTML = '<div class="muted" style="padding:8px 2px;">暂无成员，请先创建一个 Team Sharing 成员。</div>';
    return;
  }

  ui.memberList.innerHTML = list.map((m) => {
    const usage = (m && m.usage && typeof m.usage === 'object') ? m.usage : {};
    const usageText = [
      `请求 ${Number(usage.requests || 0)}`,
      `聊天 ${Number(usage.chats || 0)}`,
      `翻译 ${Number(usage.translates || 0)}`,
      usage.lastMethod && usage.lastPath ? `${escapeHtml(String(usage.lastMethod))} ${escapeHtml(String(usage.lastPath))}` : null
    ].filter(Boolean).join(' · ');
    return `
      <div class="toolui-switch-block" data-member-card data-member-id="${escapeHtml(m.id)}" style="background:#fff;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;flex-wrap:wrap;">
          <div style="min-width:0;flex:1;">
            <div style="font-weight:700;color:#0f172a;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span>${escapeHtml(m.name || 'Member')}</span>
              <span style="font-size:12px;color:${m.enabled === false ? '#b45309' : '#047857'};">${m.enabled === false ? '已禁用' : '已启用'}</span>
            </div>
            <div class="hint" style="margin-top:4px;">Token 预览：${escapeHtml(m.tokenPreview || '') || '(无)'} · 最后使用：${escapeHtml(formatTeamSharingTime(m.lastUsedAt))}</div>
            <div class="hint" style="margin-top:2px;">${usageText}</div>
          </div>
        </div>
        <div class="toolui-grid two-col" style="margin-top:10px;">
          <div class="toolui-row">
            <label>名称</label>
            <input class="toolui-input" type="text" data-field="name" value="${escapeHtml(m.name || '')}">
          </div>
          <div class="toolui-row">
            <label>限流（次/分钟）</label>
            <input class="toolui-input" type="number" min="10" max="5000" step="1" data-field="rate" value="${escapeHtml(String(m.rateLimitPerMin || ''))}">
          </div>
        </div>
        <div class="toolui-actions-row" style="margin-top:10px;">
          <button type="button" class="btn ghost" data-action="save" data-member-id="${escapeHtml(m.id)}">保存成员</button>
          <button type="button" class="btn ghost" data-action="toggle" data-next-enabled="${m.enabled === false ? '1' : '0'}" data-member-id="${escapeHtml(m.id)}">${m.enabled === false ? '启用' : '禁用'}</button>
          <button type="button" class="btn ghost" data-action="reset-token" data-member-id="${escapeHtml(m.id)}">重置 Token</button>
          <button type="button" class="btn ghost" data-action="delete" data-member-id="${escapeHtml(m.id)}">删除</button>
        </div>
      </div>
    `;
  }).join('');
}

function fillTeamSharingModalFromData(data) {
  const ui = ensureTeamSharingModal();
  const payload = data && typeof data === 'object' ? data : {};
  ui.enabled.checked = Boolean(payload.enabled);
  ui.defaultRate.value = String(Number(payload.memberDefaultRatePerMin || 120) || 120);
  ui.publicBaseUrl.value = String(payload.publicBaseUrl || '');

  const members = Array.isArray(payload.members) ? payload.members : [];
  const activeCount = members.filter((m) => m && m.enabled !== false).length;
  const accessTokenConfigured = Boolean(payload.accessTokenConfigured);
  const baseUrl = String(payload.effectiveBaseUrl || payload.publicBaseUrl || '').trim();
  ui.runtimeInfo.innerHTML = `
    <div>状态：<strong>${payload.enabled ? '已启用' : '未启用'}</strong> · 成员 ${members.length} 个（启用 ${activeCount} 个）</div>
    <div style="margin-top:4px;">管理口令：${accessTokenConfigured ? '已配置' : '未配置'} · Share 模式：${payload.shareMode ? '开启' : '关闭'}${state.info && state.info.shareMode ? '' : '（本机模式也可用）'}</div>
    <div style="margin-top:4px;">对外地址：${escapeHtml(baseUrl || `${location.origin}`)}</div>
  `;
  ui.warningText.textContent = String(payload.warning || '');
  renderTeamSharingMembers(payload);
}

async function loadTeamSharingStatus(options = {}) {
  ensureTeamSharingSettingsSection();
  const section = getTeamSharingSettingsSection() || getGeneralSettingsSection();
  if (!section) return;
  ensureTeamSharingLauncher();

  if (!options.force && teamSharingRuntime.loading) return;
  if (state.info && state.info.authRequired && !state.token) {
    teamSharingRuntime.data = null;
    refreshTeamSharingLauncherSummary();
    const host = ensureTeamSharingLauncher();
    const summaryEl = host ? host.querySelector('#teamSharingLauncherSummary') : null;
    if (summaryEl) summaryEl.textContent = '需要管理员 ACCESS_TOKEN 才能管理 Team Sharing（打开设置后可输入）。';
    if (teamSharingRuntime.modalReady && options.syncModal) {
      const ui = ensureTeamSharingModal();
      ui.runtimeInfo.textContent = '需要管理员 ACCESS_TOKEN 才能管理 Team Sharing。';
      setToolUiStatus(ui.status, '请先输入管理员口令', 'error');
    }
    return;
  }

  teamSharingRuntime.loading = true;
  refreshTeamSharingLauncherSummary();
  try {
    const data = await apiRequest('/api/team-sharing/status', { method: 'GET' });
    teamSharingRuntime.data = data || {};
    refreshTeamSharingLauncherSummary();
    if (teamSharingRuntime.modalReady) fillTeamSharingModalFromData(teamSharingRuntime.data);
    if (teamSharingRuntime.modalReady && options.syncModal) {
      const ui = ensureTeamSharingModal();
      setToolUiStatus(ui.status, '', '');
    }
  } catch (error) {
    teamSharingRuntime.data = null;
    refreshTeamSharingLauncherSummary();
    const host = ensureTeamSharingLauncher();
    const summaryEl = host ? host.querySelector('#teamSharingLauncherSummary') : null;
    if (summaryEl) summaryEl.textContent = `Team Sharing 状态加载失败：${error.message || error}`;
    if (teamSharingRuntime.modalReady && options.syncModal) {
      const ui = ensureTeamSharingModal();
      setToolUiStatus(ui.status, `加载失败：${error.message || error}`, 'error');
    }
  } finally {
    teamSharingRuntime.loading = false;
  }
}

async function openTeamSharingModal() {
  await openSettingsSection('team-sharing');
  const ui = ensureTeamSharingModal();
  renderTeamSharingIssuedToken(null, '');
  ui.backdrop.classList.add('open');
  await loadTeamSharingStatus({ force: true, syncModal: true });
}

async function saveTeamSharingConfigFromModal() {
  const ui = ensureTeamSharingModal();
  if (teamSharingRuntime.saving) return;
  const body = {
    enabled: Boolean(ui.enabled.checked),
    publicBaseUrl: String(ui.publicBaseUrl.value || '').trim(),
    memberDefaultRatePerMin: Math.max(10, Math.min(5000, Number(ui.defaultRate.value || 120) || 120))
  };

  teamSharingRuntime.saving = true;
  setToolUiStatus(ui.status, '保存中...', '');
  try {
    const resp = await apiRequest('/api/team-sharing/config', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    teamSharingRuntime.data = (resp && resp.status) || teamSharingRuntime.data;
    if (teamSharingRuntime.data) fillTeamSharingModalFromData(teamSharingRuntime.data);
    refreshTeamSharingLauncherSummary();
    setToolUiStatus(ui.status, '设置已保存', 'success');
  } catch (error) {
    setToolUiStatus(ui.status, `保存失败：${error.message || error}`, 'error');
  } finally {
    teamSharingRuntime.saving = false;
  }
}

async function createTeamSharingMemberFromModal() {
  const ui = ensureTeamSharingModal();
  if (teamSharingRuntime.saving) return;
  const defaultRate = Number(ui.defaultRate.value || 120) || 120;
  const body = {
    name: String(ui.memberName.value || '').trim(),
    rateLimitPerMin: Math.max(10, Math.min(5000, Number(ui.memberRate.value || defaultRate) || defaultRate))
  };

  teamSharingRuntime.saving = true;
  setToolUiStatus(ui.status, '创建成员中...', '');
  try {
    const resp = await apiRequest('/api/team-sharing/members', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    teamSharingRuntime.data = (resp && resp.status) || teamSharingRuntime.data;
    if (teamSharingRuntime.data) fillTeamSharingModalFromData(teamSharingRuntime.data);
    refreshTeamSharingLauncherSummary();

    ui.memberName.value = '';
    ui.memberRate.value = '';
    renderTeamSharingIssuedToken(resp && resp.member, resp && resp.token);
    setToolUiStatus(ui.status, '成员已创建，Token 已生成（请及时保存）', 'success');
  } catch (error) {
    setToolUiStatus(ui.status, `创建成员失败：${error.message || error}`, 'error');
  } finally {
    teamSharingRuntime.saving = false;
  }
}

async function updateTeamSharingMember(memberId, patch, opts = {}) {
  const ui = ensureTeamSharingModal();
  if (!memberId) return;
  setToolUiStatus(ui.status, '保存成员中...', '');
  try {
    const resp = await apiRequest(`/api/team-sharing/members/${encodeURIComponent(memberId)}`, {
      method: 'POST',
      body: JSON.stringify(patch || {})
    });
    teamSharingRuntime.data = (resp && resp.status) || teamSharingRuntime.data;
    if (teamSharingRuntime.data) fillTeamSharingModalFromData(teamSharingRuntime.data);
    refreshTeamSharingLauncherSummary();
    setToolUiStatus(ui.status, opts.okMessage || '成员已保存', 'success');
  } catch (error) {
    setToolUiStatus(ui.status, `操作失败：${error.message || error}`, 'error');
  }
}

async function updateTeamSharingMemberFromCard(memberId, card) {
  if (!card) return;
  const nameInput = card.querySelector('input[data-field="name"]');
  const rateInput = card.querySelector('input[data-field="rate"]');
  const name = String(nameInput && nameInput.value || '').trim();
  const rate = Math.max(10, Math.min(5000, Number(rateInput && rateInput.value || 120) || 120));
  await updateTeamSharingMember(memberId, { name, rateLimitPerMin: rate }, { okMessage: '成员信息已保存' });
}

async function resetTeamSharingMemberToken(memberId) {
  const ui = ensureTeamSharingModal();
  setToolUiStatus(ui.status, '重置 Token 中...', '');
  try {
    const resp = await apiRequest(`/api/team-sharing/members/${encodeURIComponent(memberId)}/reset-token`, {
      method: 'POST',
      body: '{}'
    });
    teamSharingRuntime.data = (resp && resp.status) || teamSharingRuntime.data;
    if (teamSharingRuntime.data) fillTeamSharingModalFromData(teamSharingRuntime.data);
    refreshTeamSharingLauncherSummary();
    renderTeamSharingIssuedToken(resp && resp.member, resp && resp.token);
    setToolUiStatus(ui.status, 'Token 已重置（请及时保存新 Token）', 'success');
  } catch (error) {
    setToolUiStatus(ui.status, `重置 Token 失败：${error.message || error}`, 'error');
  }
}

async function deleteTeamSharingMember(memberId) {
  const ui = ensureTeamSharingModal();
  setToolUiStatus(ui.status, '删除成员中...', '');
  try {
    const resp = await apiRequest(`/api/team-sharing/members/${encodeURIComponent(memberId)}`, {
      method: 'DELETE'
    });
    teamSharingRuntime.data = (resp && resp.status) || teamSharingRuntime.data;
    if (teamSharingRuntime.data) fillTeamSharingModalFromData(teamSharingRuntime.data);
    if (teamSharingRuntime.lastIssuedMemberId === memberId) renderTeamSharingIssuedToken(null, '');
    refreshTeamSharingLauncherSummary();
    setToolUiStatus(ui.status, '成员已删除', 'success');
  } catch (error) {
    setToolUiStatus(ui.status, `删除失败：${error.message || error}`, 'error');
  }
}

function resolveLorebookScopeName(scopeType, scopeId) {
  const type = String(scopeType || 'global');
  if (type === 'avatar') {
    const id = String(scopeId || '').trim();
    const avatar = id ? getAvatarById(id) : null;
    return avatar ? avatar.name : (id || '未绑定联系人');
  }
  return '全局';
}

function formatLorebookTime(ts) {
  const n = Number(ts || 0);
  if (!n) return '未知时间';
  try {
    return new Date(n).toLocaleString();
  } catch (_) {
    return String(n);
  }
}

const groupChatEnhanceRuntime = {
  modalReady: false,
  activeGroupId: '',
  ui: null
};

function ensureGroupChatEnhanceModal() {
  if (groupChatEnhanceRuntime.modalReady && groupChatEnhanceRuntime.ui) return groupChatEnhanceRuntime.ui;
  const dialog = document.createElement('dialog');
  dialog.id = 'groupChatEnhanceDialog';
  dialog.style.cssText = 'width:min(860px,92vw);border:none;padding:0;border-radius:16px;box-shadow:0 20px 60px rgba(15,23,42,.2);';
  dialog.innerHTML = `
    <form method="dialog" style="padding:0;margin:0;">
      <div style="padding:16px 18px;border-bottom:1px solid rgba(148,163,184,.2);display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div>
          <div id="groupChatEnhanceTitle" style="font-size:18px;font-weight:800;color:#0f172a;">群聊增强设置</div>
          <div id="groupChatEnhanceSub" class="muted" style="font-size:12px;margin-top:4px;">配置角色关系与旁观模式。</div>
        </div>
        <button type="button" id="groupChatEnhanceCloseBtn" class="btn ghost">关闭</button>
      </div>
      <div style="padding:14px 18px;max-height:min(68vh,680px);overflow:auto;display:grid;gap:14px;">
        <div style="border:1px solid rgba(148,163,184,.22);border-radius:12px;padding:12px;background:#f8fafc;">
          <div style="font-weight:700;color:#0f172a;margin-bottom:8px;">旁观模式</div>
          <div style="display:grid;gap:10px;">
            <label style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <input id="groupChatSpectatorRoundsInput" type="number" min="1" max="5" step="1" style="width:72px;">
              <span>每次旁观触发轮次（1-5）</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <input id="groupChatAllowCrosstalkCheckbox" type="checkbox">
              <span>允许角色主动回应其他角色（增强互动感）</span>
            </label>
            <div class="muted" style="font-size:12px;line-height:1.4;">在联系人页点击“旁观一轮”后，AI 角色会按回合互动。轮次越大越像角色们在自己聊天。</div>
          </div>
        </div>
        <div style="border:1px solid rgba(148,163,184,.22);border-radius:12px;padding:12px;background:#fff;">
          <div style="font-weight:700;color:#0f172a;margin-bottom:4px;">角色关系</div>
          <div class="muted" style="font-size:12px;margin-bottom:10px;">朋友 / 对手 / 陌生人 会真实进入群聊提示词，影响语气和互动风格。</div>
          <div id="groupChatRelationRows" style="display:grid;gap:8px;"></div>
        </div>
        <div id="groupChatEnhanceStatus" class="muted" style="font-size:12px;min-height:18px;"></div>
      </div>
      <div style="padding:12px 18px;border-top:1px solid rgba(148,163,184,.2);display:flex;justify-content:flex-end;gap:8px;">
        <button type="button" id="groupChatEnhanceCancelBtn" class="btn ghost">取消</button>
        <button type="button" id="groupChatEnhanceSaveBtn" class="btn primary">保存</button>
      </div>
    </form>
  `;
  document.body.appendChild(dialog);

  const ui = {
    dialog,
    title: dialog.querySelector('#groupChatEnhanceTitle'),
    sub: dialog.querySelector('#groupChatEnhanceSub'),
    relationRows: dialog.querySelector('#groupChatRelationRows'),
    spectatorRounds: dialog.querySelector('#groupChatSpectatorRoundsInput'),
    allowCrosstalk: dialog.querySelector('#groupChatAllowCrosstalkCheckbox'),
    status: dialog.querySelector('#groupChatEnhanceStatus'),
    saveBtn: dialog.querySelector('#groupChatEnhanceSaveBtn'),
    cancelBtn: dialog.querySelector('#groupChatEnhanceCancelBtn'),
    closeBtn: dialog.querySelector('#groupChatEnhanceCloseBtn')
  };

  const close = () => { try { dialog.close(); } catch (_) {} };
  if (ui.cancelBtn) ui.cancelBtn.addEventListener('click', close);
  if (ui.closeBtn) ui.closeBtn.addEventListener('click', close);
  if (ui.saveBtn) ui.saveBtn.addEventListener('click', () => saveGroupChatEnhanceModal());

  groupChatEnhanceRuntime.modalReady = true;
  groupChatEnhanceRuntime.ui = ui;
  return ui;
}

function renderGroupChatEnhanceRelationRows(group) {
  const ui = ensureGroupChatEnhanceModal();
  if (!ui || !ui.relationRows) return;
  const members = (group && Array.isArray(group.memberIds) ? group.memberIds : [])
    .map((id) => getAvatarById(id))
    .filter(Boolean);
  if (members.length < 2) {
    ui.relationRows.innerHTML = '<div class="muted">当前群组成员不足 2 人。</div>';
    return;
  }
  const rows = [];
  for (let i = 0; i < members.length; i += 1) {
    for (let j = i + 1; j < members.length; j += 1) {
      const a = members[i];
      const b = members[j];
      const key = getGroupRelationPairKey(a.id, b.id);
      const current = getGroupPairRelationType(group, a.id, b.id);
      const options = GROUP_RELATION_TYPES.map((type) => (
        `<option value="${type}" ${type === current ? 'selected' : ''}>${escapeHtml(groupRelationLabel(type))}</option>`
      )).join('');
      rows.push(`
        <label style="display:grid;grid-template-columns:minmax(180px,1fr) 160px;gap:8px;align-items:center;">
          <span style="font-size:13px;color:#334155;">${escapeHtml(a.name)} ↔ ${escapeHtml(b.name)}</span>
          <select data-relation-key="${escapeAttr(key)}">${options}</select>
        </label>
      `);
    }
  }
  ui.relationRows.innerHTML = rows.join('') || '<div class="muted">暂无可配置关系。</div>';
}

function openGroupChatEnhanceModal(groupId) {
  const id = String(groupId || '').trim();
  const group = id ? getAvatarById(id) : null;
  if (!group || group.type !== 'group') {
    alert('请先选择一个群组联系人。');
    return;
  }
  const settings = ensureGroupChatSettings(group);
  const ui = ensureGroupChatEnhanceModal();
  if (!ui) return;
  groupChatEnhanceRuntime.activeGroupId = group.id;
  if (ui.title) ui.title.textContent = `群聊增强设置 · ${group.name}`;
  if (ui.sub) ui.sub.textContent = `成员 ${Math.max(0, (group.memberIds || []).length)} 人 · 可配置关系、旁观轮次与互动风格`;
  if (ui.spectatorRounds) ui.spectatorRounds.value = String(clampGroupSpectatorRounds(settings && settings.spectatorRoundsPerTrigger));
  if (ui.allowCrosstalk) ui.allowCrosstalk.checked = Boolean(settings && settings.allowAiCrossTalk !== false);
  if (ui.status) ui.status.textContent = '';
  renderGroupChatEnhanceRelationRows(group);
  try { ui.dialog.showModal(); } catch (_) { ui.dialog.open = true; }
}

function saveGroupChatEnhanceModal() {
  const ui = ensureGroupChatEnhanceModal();
  const groupId = String(groupChatEnhanceRuntime.activeGroupId || '').trim();
  const group = groupId ? getAvatarById(groupId) : null;
  if (!ui || !group || group.type !== 'group') return;
  const settings = ensureGroupChatSettings(group);
  settings.spectatorRoundsPerTrigger = clampGroupSpectatorRounds(ui.spectatorRounds && ui.spectatorRounds.value);
  settings.allowAiCrossTalk = Boolean(ui.allowCrosstalk && ui.allowCrosstalk.checked);
  const nextMap = {};
  if (ui.relationRows) {
    ui.relationRows.querySelectorAll('select[data-relation-key]').forEach((sel) => {
      const key = String(sel.getAttribute('data-relation-key') || '').trim();
      if (!key) return;
      const val = String(sel.value || 'stranger').trim().toLowerCase();
      nextMap[key] = GROUP_RELATION_TYPES.includes(val) ? val : 'stranger';
    });
  }
  settings.relationMap = normalizeGroupRelationMap(nextMap, group.memberIds || []);
  persistAvatars();
  refreshContactsLorebookShortcut();
  renderContactList();
  if (ui.status) ui.status.textContent = '已保存群聊增强设置。';
}

async function runGroupSpectatorRound() {
  const avatarId = String(state.ui.activeContactAvatarId || '').trim();
  const group = avatarId ? getAvatarById(avatarId) : null;
  if (!group || group.type !== 'group') {
    alert('请先选择一个群组联系人。');
    return;
  }
  const session = resolveContactSession(group.id, { createIfMissing: true, focus: true });
  if (!session) return;
  if (state.ui.chatStreaming) {
    setStatus('当前正在生成回复，请稍后再试旁观模式。');
    return;
  }
  const settings = ensureGroupChatSettings(group);
  await sendGroupChatMessage(session, group, {
    spectatorMode: true,
    spectatorRounds: clampGroupSpectatorRounds(settings && settings.spectatorRoundsPerTrigger)
  });
}

function ensureContactsLorebookShortcut() {
  if (!els.contactsPane || !els.contactList) return null;
  let host = els.contactsPane.querySelector('#contactsLorebookShortcutRow');
  if (host) return host;

  host = document.createElement('div');
  host.id = 'contactsLorebookShortcutRow';
  host.style.cssText = 'display:grid;gap:8px;padding:8px 2px 10px 2px;border-bottom:1px solid rgba(148,163,184,.16);margin-bottom:8px;';
  host.innerHTML = `
    <div id="contactsPrimaryActionRow" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
      <button id="contactsAvatarGalleryBtn" class="btn ghost" type="button" style="display:inline-flex;align-items:center;gap:6px;border-radius:12px;padding:8px 12px;">
        <span aria-hidden="true">🖼️</span>
        <span>角色画廊</span>
      </button>
      <button id="contactsScenePickerBtn" class="btn ghost" type="button" style="display:inline-flex;align-items:center;gap:6px;border-radius:12px;padding:8px 12px;">
        <span aria-hidden="true">🎬</span>
        <span>开场</span>
      </button>
      <button id="contactsLorebookOpenBtn" class="btn ghost" type="button" style="display:inline-flex;align-items:center;gap:6px;border-radius:12px;padding:8px 12px;">
        <span aria-hidden="true">📚</span>
        <span>世界观书</span>
      </button>
    </div>
    <div id="contactsGroupEnhanceRow" style="display:none;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:8px 10px;border:1px solid rgba(99,102,241,.18);background:rgba(99,102,241,.04);border-radius:12px;">
      <div style="display:flex;align-items:center;gap:8px;min-width:0;">
        <span aria-hidden="true" style="font-size:15px;">👥</span>
        <div style="min-width:0;">
          <div id="contactsGroupEnhanceLabel" style="font-size:12px;font-weight:700;color:#334155;">群聊增强</div>
          <div id="contactsGroupEnhanceMiniHint" class="muted" style="font-size:11px;line-height:1.25;">角色关系与旁观模式</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button id="contactsGroupSpectatorBtn" class="btn ghost" type="button" style="display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 10px;background:#fff;">
          <span aria-hidden="true">👀</span>
          <span>旁观一轮</span>
        </button>
        <button id="contactsGroupEnhanceBtn" class="btn ghost" type="button" style="display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 10px;background:#fff;">
          <span aria-hidden="true">🤝</span>
          <span>群聊关系</span>
        </button>
      </div>
    </div>
    <div id="contactsLorebookHint" class="muted" style="font-size:12px;line-height:1.35;min-width:0;padding:0 2px;"></div>
  `;
  els.contactsPane.insertBefore(host, els.contactList);
  const galleryBtn = host.querySelector('#contactsAvatarGalleryBtn');
  const sceneBtn = host.querySelector('#contactsScenePickerBtn');
  const openBtn = host.querySelector('#contactsLorebookOpenBtn');
  const spectatorBtn = host.querySelector('#contactsGroupSpectatorBtn');
  const enhanceBtn = host.querySelector('#contactsGroupEnhanceBtn');
  if (galleryBtn) {
    galleryBtn.addEventListener('click', () => {
      openAvatarGalleryModal({
        source: 'contacts',
        selectedAvatarId: String(state.ui.activeContactAvatarId || '').trim()
      });
    });
  }
  if (sceneBtn) {
    sceneBtn.addEventListener('click', () => {
      const avatarId = String(state.ui.activeContactAvatarId || '').trim();
      const avatar = avatarId ? getAvatarById(avatarId) : null;
      if (!avatar) {
        alert('请先选择一个联系人。');
        return;
      }
      const session = resolveContactSession(avatar.id, { createIfMissing: true, focus: true });
      if (!session) return;
      if (hasChatMessages(session)) {
        alert('当前联系人会话已经有消息。请新建/清空会话后再选择开场场景。');
        return;
      }
      session.scenePickerDismissed = false;
      persistSessionsState();
      maybeOfferAvatarOpeningScene(session, avatar);
    });
  }
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      openLorebookSettingsForAvatar(state.ui.activeContactAvatarId || '', { create: false }).catch(() => {});
    });
  }
  if (spectatorBtn) {
    spectatorBtn.addEventListener('click', () => {
      runGroupSpectatorRound().catch((error) => setStatus(`旁观模式失败：${error.message || error}`));
    });
  }
  if (enhanceBtn) {
    enhanceBtn.addEventListener('click', () => {
      openGroupChatEnhanceModal(state.ui.activeContactAvatarId || '');
    });
  }
  return host;
}

function localizeContactsShortcutRow(host) {
  if (!host) return;
  const galleryBtn = host.querySelector('#contactsAvatarGalleryBtn');
  const sceneBtn = host.querySelector('#contactsScenePickerBtn');
  const lorebookBtn = host.querySelector('#contactsLorebookOpenBtn');
  const spectatorBtn = host.querySelector('#contactsGroupSpectatorBtn');
  const enhanceBtn = host.querySelector('#contactsGroupEnhanceBtn');
  const groupLabel = host.querySelector('#contactsGroupEnhanceLabel');
  const groupMiniHint = host.querySelector('#contactsGroupEnhanceMiniHint');
  if (galleryBtn) {
    const textEl = galleryBtn.querySelector('span:last-child');
    if (textEl) textEl.textContent = uiText('角色画廊', 'Gallery');
  }
  if (sceneBtn) {
    const textEl = sceneBtn.querySelector('span:last-child');
    if (textEl) textEl.textContent = uiText('开场', 'Scene');
  }
  if (lorebookBtn) {
    const textEl = lorebookBtn.querySelector('span:last-child');
    if (textEl) textEl.textContent = uiText('世界观书', 'Lorebook');
  }
  if (spectatorBtn) {
    const textEl = spectatorBtn.querySelector('span:last-child');
    if (textEl) textEl.textContent = uiText('旁观一轮', 'Watch 1 round');
  }
  if (enhanceBtn) {
    const textEl = enhanceBtn.querySelector('span:last-child');
    if (textEl) textEl.textContent = uiText('群聊关系', 'Group Relations');
  }
  if (groupLabel) groupLabel.textContent = uiText('群聊增强', 'Group Chat Boost');
  if (groupMiniHint) groupMiniHint.textContent = uiText('角色关系与旁观模式', 'Relations and spectator mode');
}

function refreshContactsLorebookShortcut() {
  const host = ensureContactsLorebookShortcut();
  if (!host) return;
  localizeContactsShortcutRow(host);
  const hint = host.querySelector('#contactsLorebookHint');
  const spectatorBtn = host.querySelector('#contactsGroupSpectatorBtn');
  const enhanceBtn = host.querySelector('#contactsGroupEnhanceBtn');
  const groupRow = host.querySelector('#contactsGroupEnhanceRow');
  if (!hint) return;
  const avatarId = String(state.ui.activeContactAvatarId || '').trim();
  if (!avatarId) {
    if (spectatorBtn) spectatorBtn.style.display = 'none';
    if (enhanceBtn) enhanceBtn.style.display = 'none';
    if (groupRow) groupRow.style.display = 'none';
    hint.textContent = uiText('角色画廊 / 开场场景 / 联系人世界观词条', 'Gallery / opening scene / contact lorebook');
    return;
  }
  const avatar = getAvatarById(avatarId);
  if (!avatar) {
    if (spectatorBtn) spectatorBtn.style.display = 'none';
    if (enhanceBtn) enhanceBtn.style.display = 'none';
    if (groupRow) groupRow.style.display = 'none';
    hint.textContent = uiText('管理角色画廊与联系人词条', 'Manage gallery and contact lorebook entries');
    return;
  }
  const isGroup = avatar.type === 'group';
  if (spectatorBtn) spectatorBtn.style.display = isGroup ? 'inline-flex' : 'none';
  if (enhanceBtn) enhanceBtn.style.display = isGroup ? 'inline-flex' : 'none';
  if (groupRow) groupRow.style.display = isGroup ? 'flex' : 'none';
  const sceneCount = getAvatarOpeningScenarios(avatar).length;
  if (isGroup) {
    const settings = ensureGroupChatSettings(avatar);
    const rounds = clampGroupSpectatorRounds(settings && settings.spectatorRoundsPerTrigger);
    hint.textContent = isZhUiLanguage()
      ? `当前群组：${avatar.name} · 成员${(avatar.memberIds || []).length}人 · 旁观每次${rounds}轮（可在“群聊关系”里设置朋友/对手/陌生人）`
      : `Group: ${avatar.name} · Members ${(avatar.memberIds || []).length} · Watch ${rounds} round(s) (set relations in Group Relations)`;
    return;
  }
  hint.textContent = isZhUiLanguage()
    ? `当前联系人：${avatar.name} · 开场${sceneCount}个 · 可打开角色画廊`
    : `Contact: ${avatar.name} · Scenes ${sceneCount} · Open gallery`;
}

function getLorebookSettingsSection() {
  return els.settingsPanel ? els.settingsPanel.querySelector('.settings-section[data-section="lorebook"]') : null;
}

function ensureLorebookSettingsSection() {
  if (!els.settingsPanel) return null;
  const nav = els.settingsPanel.querySelector('.settings-nav');
  const content = els.settingsPanel.querySelector('.settings-content');
  if (!nav || !content) return null;

  let navBtn = nav.querySelector('.settings-nav-item[data-section="lorebook"]');
  if (!navBtn) {
    navBtn = document.createElement('button');
    navBtn.className = 'settings-nav-item';
    navBtn.type = 'button';
    navBtn.dataset.section = 'lorebook';
    navBtn.textContent = '世界观书';
    const teamBtn = nav.querySelector('.settings-nav-item[data-section="team-sharing"]');
    const spacer = nav.querySelector('.settings-nav-spacer');
    if (teamBtn) nav.insertBefore(navBtn, teamBtn);
    else if (spacer) nav.insertBefore(navBtn, spacer);
    else nav.appendChild(navBtn);
  }

  let section = getLorebookSettingsSection();
  if (!section) {
    section = document.createElement('div');
    section.className = 'settings-section hidden';
    section.dataset.section = 'lorebook';
    section.innerHTML = `
      <h3>世界观书（Lorebook）</h3>
      <div class="muted" style="margin-bottom:10px;">RP 词条触发系统：命中关键词/常驻词条后会真实注入到聊天上下文（非装饰）。</div>

      <div class="settings-group" style="margin-top:0;">
        <h4>词条管理</h4>
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:12px 14px;border:1px solid rgba(148,163,184,.28);border-radius:12px;background:rgba(248,250,252,.75);">
          <div style="min-width:0;flex:1;">
            <div style="font-weight:700;">Lorebook 管理面板</div>
            <div id="lorebookListSummary" class="muted" style="font-size:12px;line-height:1.45;margin-top:4px;">未加载</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button id="lorebookAddEntryBtn" class="btn primary" type="button">+ 添加词条</button>
            <button id="lorebookAddForAvatarBtn" class="btn ghost" type="button">为当前联系人添加</button>
            <button id="lorebookRefreshBtn" class="btn ghost" type="button">刷新</button>
          </div>
        </div>

        <div class="setting-row" style="margin-top:10px;">
          <label>筛选</label>
          <div class="setting-control" style="display:flex;gap:8px;flex-wrap:wrap;">
            <select id="lorebookScopeFilterSelect" style="min-width:160px;">
              <option value="all">全部词条</option>
              <option value="global">仅全局词条</option>
              <option value="avatar">仅联系人词条</option>
            </select>
            <select id="lorebookAvatarFilterSelect" style="min-width:220px;">
              <option value="">全部联系人</option>
            </select>
          </div>
        </div>

        <div id="lorebookListStatus" class="muted" style="font-size:12px;margin-top:6px;min-height:18px;"></div>
        <div id="lorebookListWrap" style="display:grid;gap:10px;margin-top:10px;"></div>
      </div>
    `;
    content.appendChild(section);
  }

  if (!lorebookRuntime.sectionReady) {
    const ui = {
      section,
      summary: section.querySelector('#lorebookListSummary'),
      status: section.querySelector('#lorebookListStatus'),
      listWrap: section.querySelector('#lorebookListWrap'),
      addBtn: section.querySelector('#lorebookAddEntryBtn'),
      addForAvatarBtn: section.querySelector('#lorebookAddForAvatarBtn'),
      refreshBtn: section.querySelector('#lorebookRefreshBtn'),
      scopeFilter: section.querySelector('#lorebookScopeFilterSelect'),
      avatarFilter: section.querySelector('#lorebookAvatarFilterSelect')
    };
    lorebookRuntime.ui = ui;

    if (ui.addBtn) {
      ui.addBtn.addEventListener('click', () => {
        openLorebookEditorModal({ mode: 'create' }).catch((error) => {
          setLorebookSectionStatus(`打开词条编辑器失败：${error.message || error}`, 'error');
        });
      });
    }
    if (ui.addForAvatarBtn) {
      ui.addForAvatarBtn.addEventListener('click', () => {
        const avatarId = String(lorebookRuntime.filterAvatarId || state.ui.activeContactAvatarId || '').trim();
        if (!avatarId) {
          setLorebookSectionStatus('请先在联系人列表选择一个联系人，再添加联系人词条。', 'error');
          return;
        }
        openLorebookEditorModal({ mode: 'create', presetScopeType: 'avatar', presetScopeId: avatarId }).catch((error) => {
          setLorebookSectionStatus(`打开词条编辑器失败：${error.message || error}`, 'error');
        });
      });
    }
    if (ui.refreshBtn) ui.refreshBtn.addEventListener('click', () => loadLorebookList({ force: true }));
    if (ui.scopeFilter) {
      ui.scopeFilter.addEventListener('change', () => {
        lorebookRuntime.filterScope = ui.scopeFilter.value || 'all';
        if (lorebookRuntime.filterScope !== 'avatar') lorebookRuntime.filterAvatarId = '';
        syncLorebookFilterControls();
        renderLorebookList();
      });
    }
    if (ui.avatarFilter) {
      ui.avatarFilter.addEventListener('change', () => {
        lorebookRuntime.filterAvatarId = ui.avatarFilter.value || '';
        if (lorebookRuntime.filterAvatarId) lorebookRuntime.filterScope = 'avatar';
        syncLorebookFilterControls();
        renderLorebookList();
      });
    }
    if (ui.listWrap) {
      ui.listWrap.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action][data-entry-id]');
        if (!btn) return;
        const entryId = btn.dataset.entryId || '';
        const action = btn.dataset.action || '';
        if (!entryId || !action) return;
        if (action === 'edit') {
          const entry = (lorebookRuntime.list || []).find((it) => it.id === entryId);
          if (!entry) return;
          await openLorebookEditorModal({ mode: 'edit', entry });
          return;
        }
        if (action === 'toggle') {
          await toggleLorebookEntry(entryId);
          return;
        }
        if (action === 'delete') {
          if (!window.confirm('确认删除这个世界观书词条？')) return;
          await deleteLorebookEntry(entryId);
        }
      });
    }

    lorebookRuntime.sectionReady = true;
    syncLorebookFilterControls();
  }

  syncLorebookAvatarFilterOptions();
  return section;
}

function setLorebookSectionStatus(text, type = '') {
  const ui = lorebookRuntime.ui;
  if (!ui || !ui.status) return;
  ui.status.textContent = String(text || '');
  ui.status.style.color = type === 'error' ? '#b91c1c' : (type === 'success' ? '#047857' : '');
}

function syncLorebookAvatarFilterOptions() {
  const ui = lorebookRuntime.ui;
  if (!ui || !ui.avatarFilter) return;
  const avatars = (state.avatars || []).slice().sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN'));
  const current = String(lorebookRuntime.filterAvatarId || ui.avatarFilter.value || '').trim();
  ui.avatarFilter.innerHTML = ['<option value="">全部联系人</option>']
    .concat(avatars.map((a) => `<option value="${escapeHtml(a.id)}">${escapeHtml(a.name)}${a.type === 'group' ? '（群组）' : ''}</option>`))
    .join('');
  if (current && avatars.some((a) => a.id === current)) ui.avatarFilter.value = current;
  else if (ui.avatarFilter.value && !avatars.some((a) => a.id === ui.avatarFilter.value)) ui.avatarFilter.value = '';
}

function syncLorebookFilterControls() {
  const ui = lorebookRuntime.ui;
  if (!ui) return;
  if (ui.scopeFilter) ui.scopeFilter.value = lorebookRuntime.filterScope || 'all';
  if (ui.avatarFilter) {
    ui.avatarFilter.disabled = (lorebookRuntime.filterScope !== 'avatar');
    if (lorebookRuntime.filterAvatarId) ui.avatarFilter.value = lorebookRuntime.filterAvatarId;
    else if (lorebookRuntime.filterScope !== 'avatar') ui.avatarFilter.value = '';
  }
  const activeAvatarId = String(lorebookRuntime.filterAvatarId || state.ui.activeContactAvatarId || '').trim();
  if (ui.addForAvatarBtn) {
    const avatar = activeAvatarId ? getAvatarById(activeAvatarId) : null;
    ui.addForAvatarBtn.textContent = avatar ? `为 ${avatar.name} 添加` : '为当前联系人添加';
  }
}

function buildLorebookFilteredList() {
  const list = Array.isArray(lorebookRuntime.list) ? lorebookRuntime.list : [];
  const scope = String(lorebookRuntime.filterScope || 'all');
  const avatarId = String(lorebookRuntime.filterAvatarId || '').trim();
  return list.filter((entry) => {
    if (!entry) return false;
    if (scope === 'global' && entry.scopeType !== 'global') return false;
    if (scope === 'avatar' && entry.scopeType !== 'avatar') return false;
    if (avatarId && String(entry.scopeId || '').trim() !== avatarId) return false;
    return true;
  });
}

function renderLorebookList() {
  ensureLorebookSettingsSection();
  const ui = lorebookRuntime.ui;
  if (!ui || !ui.listWrap) return;
  syncLorebookFilterControls();

  const stats = lorebookRuntime.stats || {};
  const all = Array.isArray(lorebookRuntime.list) ? lorebookRuntime.list : [];
  if (ui.summary) {
    const summaryParts = [
      `词条 ${Number(stats.total || all.length || 0)} 个`,
      `启用 ${Number(stats.enabled || all.filter((e) => e && e.enabled !== false).length)} 个`,
      `全局 ${Number(stats.global || all.filter((e) => e && e.scopeType === 'global').length)} 个`,
      `联系人 ${Number(stats.avatar || all.filter((e) => e && e.scopeType === 'avatar').length)} 个`
    ];
    if (lorebookRuntime.filterScope === 'avatar' && lorebookRuntime.filterAvatarId) {
      summaryParts.push(`当前筛选：${resolveLorebookScopeName('avatar', lorebookRuntime.filterAvatarId)}`);
    } else if (lorebookRuntime.filterScope === 'global') {
      summaryParts.push('当前筛选：仅全局');
    } else if (lorebookRuntime.filterScope === 'avatar') {
      summaryParts.push('当前筛选：仅联系人');
    }
    ui.summary.textContent = summaryParts.join(' · ');
  }

  if (lorebookRuntime.loading) {
    ui.listWrap.innerHTML = '<div class="muted" style="padding:10px 2px;">正在加载世界观书词条...</div>';
    return;
  }

  const list = buildLorebookFilteredList();
  if (!list.length) {
    ui.listWrap.innerHTML = '<div class="muted" style="padding:10px 2px;">暂无符合条件的词条。可点击上方“添加词条”。</div>';
    return;
  }

  ui.listWrap.innerHTML = list.map((entry) => {
    const keywords = Array.isArray(entry.keywords) ? entry.keywords : [];
    const tags = Array.isArray(entry.tags) ? entry.tags : [];
    const keywordText = keywords.length ? keywords.join(' / ') : (entry.alwaysOn ? '常驻（always-on）' : '无关键词');
    const preview = String(entry.content || '').trim().replace(/\s+/g, ' ');
    const tagHtml = tags.length
      ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">${tags.slice(0, 12).map((tag) => `<span style="font-size:12px;color:#1d4ed8;background:rgba(59,130,246,.08);padding:2px 8px;border-radius:999px;">${escapeHtml(tag)}</span>`).join('')}</div>`
      : '';
    const scopeText = entry.scopeType === 'avatar'
      ? `联系人：${escapeHtml(resolveLorebookScopeName(entry.scopeType, entry.scopeId))}`
      : '全局词条';
    return `
      <div class="toolui-switch-block" data-lorebook-card="${escapeHtml(entry.id)}" style="background:#fff;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;flex-wrap:wrap;">
          <div style="min-width:0;flex:1;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <strong style="color:#0f172a;">${escapeHtml(entry.title || '词条')}</strong>
              <span style="font-size:12px;color:${entry.enabled === false ? '#b45309' : '#047857'};">${entry.enabled === false ? '已禁用' : '已启用'}</span>
              ${entry.alwaysOn ? '<span style="font-size:12px;color:#4338ca;background:rgba(99,102,241,.08);padding:2px 6px;border-radius:999px;">常驻</span>' : ''}
            </div>
            <div class="hint" style="margin-top:4px;">${scopeText} · 优先级 ${Number(entry.priority || 0)} · 更新于 ${escapeHtml(formatLorebookTime(entry.updatedAt))}</div>
            <div class="hint" style="margin-top:2px;">触发词：${escapeHtml(keywordText)}</div>
            ${tagHtml}
            <div style="margin-top:8px;font-size:13px;line-height:1.45;color:#334155;white-space:pre-wrap;word-break:break-word;">${escapeHtml(preview.slice(0, 260))}${preview.length > 260 ? '…' : ''}</div>
          </div>
        </div>
        <div class="toolui-actions-row" style="margin-top:10px;">
          <button type="button" class="btn ghost" data-action="edit" data-entry-id="${escapeHtml(entry.id)}">编辑</button>
          <button type="button" class="btn ghost" data-action="toggle" data-entry-id="${escapeHtml(entry.id)}">${entry.enabled === false ? '启用' : '禁用'}</button>
          <button type="button" class="btn ghost" data-action="delete" data-entry-id="${escapeHtml(entry.id)}">删除</button>
        </div>
      </div>
    `;
  }).join('');
}

async function loadLorebookList(options = {}) {
  ensureLorebookSettingsSection();
  if (state.info && state.info.authRequired && !state.token) {
    lorebookRuntime.loading = false;
    lorebookRuntime.list = [];
    lorebookRuntime.stats = null;
    renderLorebookList();
    setLorebookSectionStatus('需要管理员 ACCESS_TOKEN 才能管理世界观书（请先在设置-通用输入口令）。', 'error');
    return;
  }
  if (lorebookRuntime.loading && !options.force) return;
  lorebookRuntime.loading = true;
  renderLorebookList();
  try {
    const data = await apiRequest('/api/lorebooks', { method: 'GET' });
    lorebookRuntime.list = Array.isArray(data.lorebooks) ? data.lorebooks : [];
    lorebookRuntime.stats = (data.stats && typeof data.stats === 'object') ? data.stats : null;
    syncLorebookAvatarFilterOptions();
    renderLorebookList();
    if (options.silent !== true) setLorebookSectionStatus('', '');
  } catch (error) {
    setLorebookSectionStatus(`加载世界观书失败：${error.message || error}`, 'error');
    lorebookRuntime.list = [];
    lorebookRuntime.stats = null;
    renderLorebookList();
  } finally {
    lorebookRuntime.loading = false;
    renderLorebookList();
  }
}

async function openLorebookSettingsForAvatar(avatarId, opts = {}) {
  const id = String(avatarId || '').trim();
  ensureLorebookSettingsSection();
  if (id) {
    lorebookRuntime.filterScope = 'avatar';
    lorebookRuntime.filterAvatarId = id;
    lorebookRuntime.createScopeAvatarId = id;
  } else {
    lorebookRuntime.filterScope = 'all';
    lorebookRuntime.filterAvatarId = '';
  }
  syncLorebookFilterControls();
  await openSettingsSection('lorebook');
  await loadLorebookList({ force: true, silent: true });
  if (opts && opts.create && id) {
    await openLorebookEditorModal({ mode: 'create', presetScopeType: 'avatar', presetScopeId: id });
  }
}

function ensureLorebookEditorModal() {
  if (lorebookRuntime.modalReady && lorebookRuntime.modalUi) return lorebookRuntime.modalUi;
  ensureToolUiInjectedStyle();

  const backdrop = document.createElement('div');
  backdrop.className = 'toolui-backdrop';
  backdrop.innerHTML = `
    <div class="toolui-modal" role="dialog" aria-modal="true" aria-labelledby="lorebookEditorTitle">
      <div class="toolui-head">
        <div class="toolui-title" id="lorebookEditorTitle">世界观书词条</div>
        <button class="toolui-close" type="button" data-close>ESC</button>
      </div>
      <div class="toolui-body">
        <div class="toolui-grid">
          <input id="lorebookEditorId" type="hidden">
          <div class="toolui-row">
            <label for="lorebookTitleInput">标题 *</label>
            <input id="lorebookTitleInput" class="toolui-input" type="text" placeholder="例如：学院校规 / 角色禁忌 / 世界背景">
          </div>
          <div class="toolui-grid two-col">
            <div class="toolui-row">
              <label for="lorebookScopeTypeInput">作用范围</label>
              <select id="lorebookScopeTypeInput" class="toolui-input">
                <option value="global">全局（所有聊天可触发）</option>
                <option value="avatar">联系人（仅指定联系人触发）</option>
              </select>
            </div>
            <div class="toolui-row">
              <label for="lorebookAvatarScopeInput">联系人</label>
              <select id="lorebookAvatarScopeInput" class="toolui-input">
                <option value="">请选择联系人</option>
              </select>
              <div class="hint">仅在“联系人”范围下生效。</div>
            </div>
          </div>
          <div class="toolui-grid two-col">
            <div class="toolui-row">
              <label for="lorebookPriorityInput">优先级</label>
              <input id="lorebookPriorityInput" class="toolui-input" type="number" min="0" max="1000" step="1" value="50">
              <div class="hint">数字越大越优先注入。</div>
            </div>
            <div class="toolui-row">
              <label>选项</label>
              <div class="toolui-switch-block">
                <label class="toolui-inline" style="margin-bottom:6px;">
                  <input id="lorebookEnabledInput" type="checkbox" checked>
                  <span>启用词条（真实生效）</span>
                </label>
                <label class="toolui-inline">
                  <input id="lorebookAlwaysOnInput" type="checkbox">
                  <span>常驻词条（无需关键词）</span>
                </label>
              </div>
            </div>
          </div>
          <div class="toolui-row">
            <label for="lorebookKeywordsInput">触发关键词</label>
            <textarea id="lorebookKeywordsInput" class="toolui-textarea" rows="3" placeholder="多个关键词用换行、逗号或分号分隔"></textarea>
            <div class="hint">非“常驻词条”时至少填写一个关键词；对最近几轮用户消息做包含匹配。</div>
          </div>
          <div class="toolui-row">
            <label for="lorebookTagsInput">标签（可选）</label>
            <input id="lorebookTagsInput" class="toolui-input" type="text" placeholder="世界观, 组织, 地点, 规则（逗号分隔）">
          </div>
          <div class="toolui-row">
            <label for="lorebookContentInput">词条内容 *</label>
            <textarea id="lorebookContentInput" class="toolui-textarea" rows="9" placeholder="写入世界观设定、关系约束、禁忌规则、地点背景等。命中后会注入到聊天上下文。"></textarea>
          </div>
          <div id="lorebookEditorStatus" class="toolui-status"></div>
        </div>
      </div>
      <div class="toolui-foot">
        <button type="button" class="btn primary" id="lorebookSaveBtn">保存词条</button>
        <button type="button" class="btn ghost" data-close>取消</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const ui = {
    backdrop,
    editId: backdrop.querySelector('#lorebookEditorId'),
    title: backdrop.querySelector('#lorebookTitleInput'),
    scopeType: backdrop.querySelector('#lorebookScopeTypeInput'),
    avatarScope: backdrop.querySelector('#lorebookAvatarScopeInput'),
    priority: backdrop.querySelector('#lorebookPriorityInput'),
    enabled: backdrop.querySelector('#lorebookEnabledInput'),
    alwaysOn: backdrop.querySelector('#lorebookAlwaysOnInput'),
    keywords: backdrop.querySelector('#lorebookKeywordsInput'),
    tags: backdrop.querySelector('#lorebookTagsInput'),
    content: backdrop.querySelector('#lorebookContentInput'),
    status: backdrop.querySelector('#lorebookEditorStatus'),
    saveBtn: backdrop.querySelector('#lorebookSaveBtn')
  };

  const syncScopeUi = () => {
    const isAvatar = String(ui.scopeType.value || 'global') === 'avatar';
    ui.avatarScope.disabled = !isAvatar;
    if (!isAvatar) ui.avatarScope.value = '';
  };
  const syncKeywordUi = () => {
    const alwaysOn = Boolean(ui.alwaysOn.checked);
    ui.keywords.disabled = alwaysOn;
    if (alwaysOn) ui.keywords.placeholder = '已启用常驻词条，无需关键词';
    else ui.keywords.placeholder = '多个关键词用换行、逗号或分号分隔';
  };

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeLorebookEditorModal();
  });
  backdrop.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => closeLorebookEditorModal()));
  ui.scopeType.addEventListener('change', syncScopeUi);
  ui.alwaysOn.addEventListener('change', syncKeywordUi);
  ui.saveBtn.addEventListener('click', () => saveLorebookEditorModal());

  lorebookRuntime.modalReady = true;
  lorebookRuntime.modalUi = ui;
  syncScopeUi();
  syncKeywordUi();
  return ui;
}

function closeLorebookEditorModal() {
  const ui = ensureLorebookEditorModal();
  ui.backdrop.classList.remove('open');
}

function syncLorebookModalAvatarOptions(ui, selectedId = '') {
  if (!ui || !ui.avatarScope) return;
  const avatars = (state.avatars || []).slice().sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN'));
  ui.avatarScope.innerHTML = ['<option value="">请选择联系人</option>']
    .concat(avatars.map((a) => `<option value="${escapeHtml(a.id)}">${escapeHtml(a.name)}${a.type === 'group' ? '（群组）' : ''}</option>`))
    .join('');
  if (selectedId && avatars.some((a) => a.id === selectedId)) ui.avatarScope.value = selectedId;
}

function fillLorebookEditorModal(entry, opts = {}) {
  const ui = ensureLorebookEditorModal();
  const mode = opts.mode || 'create';
  const presetScopeType = opts.presetScopeType || '';
  const presetScopeId = opts.presetScopeId || '';
  const target = entry && typeof entry === 'object' ? entry : null;
  ui.editId.value = target ? String(target.id || '') : '';
  ui.title.value = target ? String(target.title || '') : '';
  ui.scopeType.value = target ? String(target.scopeType || 'global') : (presetScopeType || 'global');
  syncLorebookModalAvatarOptions(ui, target ? String(target.scopeId || '') : String(presetScopeId || ''));
  ui.priority.value = String(target ? Number(target.priority || 50) : 50);
  ui.enabled.checked = target ? target.enabled !== false : true;
  ui.alwaysOn.checked = target ? Boolean(target.alwaysOn) : false;
  ui.keywords.value = target && Array.isArray(target.keywords) ? target.keywords.join('\n') : '';
  ui.tags.value = target && Array.isArray(target.tags) ? target.tags.join(', ') : '';
  ui.content.value = target ? String(target.content || '') : '';
  ui.backdrop.querySelector('#lorebookEditorTitle').textContent = mode === 'edit' ? '编辑世界观书词条' : '新增世界观书词条';
  setToolUiStatus(ui.status, '', '');
  ui.scopeType.dispatchEvent(new Event('change'));
  ui.alwaysOn.dispatchEvent(new Event('change'));
}

async function openLorebookEditorModal(options = {}) {
  ensureLorebookSettingsSection();
  const ui = ensureLorebookEditorModal();
  syncLorebookModalAvatarOptions(ui, options.presetScopeId || '');
  fillLorebookEditorModal(options.entry || null, options);
  ui.backdrop.classList.add('open');
  if (ui.title) ui.title.focus();
}

function splitLorebookKeywordsInput(text) {
  return String(text || '')
    .split(/[\r\n,，;；]+/g)
    .map((s) => String(s || '').trim())
    .filter(Boolean);
}

function splitLorebookTagsInput(text) {
  return String(text || '')
    .split(/[\r\n,，;；|]+/g)
    .map((s) => String(s || '').trim())
    .filter(Boolean);
}

async function saveLorebookEditorModal() {
  const ui = ensureLorebookEditorModal();
  if (lorebookRuntime.saving) return;
  const body = {
    id: String(ui.editId.value || '').trim() || undefined,
    title: String(ui.title.value || '').trim(),
    scopeType: String(ui.scopeType.value || 'global'),
    scopeId: String(ui.avatarScope.value || '').trim(),
    priority: Math.max(0, Math.min(1000, Number(ui.priority.value || 50) || 50)),
    enabled: Boolean(ui.enabled.checked),
    alwaysOn: Boolean(ui.alwaysOn.checked),
    keywords: splitLorebookKeywordsInput(ui.keywords.value),
    tags: splitLorebookTagsInput(ui.tags.value),
    content: String(ui.content.value || '').trim()
  };

  if (!body.title) {
    setToolUiStatus(ui.status, '请填写词条标题。', 'error');
    return;
  }
  if (!body.content) {
    setToolUiStatus(ui.status, '请填写词条内容。', 'error');
    return;
  }
  if (body.scopeType === 'avatar' && !body.scopeId) {
    setToolUiStatus(ui.status, '请选择联系人范围。', 'error');
    return;
  }
  if (!body.alwaysOn && !body.keywords.length) {
    setToolUiStatus(ui.status, '请填写关键词，或开启“常驻词条”。', 'error');
    return;
  }

  lorebookRuntime.saving = true;
  setToolUiStatus(ui.status, '保存中...', '');
  try {
    await apiRequest('/api/lorebooks', { method: 'POST', body: JSON.stringify(body) });
    setToolUiStatus(ui.status, '已保存', 'success');
    closeLorebookEditorModal();
    await loadLorebookList({ force: true, silent: true });
    setLorebookSectionStatus('世界观书词条已保存。', 'success');
  } catch (error) {
    setToolUiStatus(ui.status, `保存失败：${error.message || error}`, 'error');
  } finally {
    lorebookRuntime.saving = false;
  }
}

async function toggleLorebookEntry(entryId) {
  setLorebookSectionStatus('更新词条状态中...', '');
  try {
    await apiRequest(`/api/lorebooks/${encodeURIComponent(entryId)}/toggle`, { method: 'POST', body: '{}' });
    await loadLorebookList({ force: true, silent: true });
    setLorebookSectionStatus('词条状态已更新。', 'success');
  } catch (error) {
    setLorebookSectionStatus(`更新失败：${error.message || error}`, 'error');
  }
}

async function deleteLorebookEntry(entryId) {
  setLorebookSectionStatus('删除词条中...', '');
  try {
    await apiRequest(`/api/lorebooks/${encodeURIComponent(entryId)}`, { method: 'DELETE' });
    await loadLorebookList({ force: true, silent: true });
    setLorebookSectionStatus('词条已删除。', 'success');
  } catch (error) {
    setLorebookSectionStatus(`删除失败：${error.message || error}`, 'error');
  }
}

function getMcpSettingsSection() {
  return els.settingsPanel ? els.settingsPanel.querySelector('.settings-section[data-section="mcp"]') : null;
}

async function openSettingsSection(section) {
  if (!section) return;
  if (els.settingsPanel && els.settingsPanel.classList.contains('hidden')) {
    await openSettingsPanel();
  }
  if (!els.settingsPanel) return;
  if (section === 'personas') ensurePersonasSettingsSectionNav();
  if (section === 'team-sharing') ensureTeamSharingSettingsSection();
  if (section === 'lorebook') ensureLorebookSettingsSection();
  els.settingsPanel.querySelectorAll('.settings-nav-item').forEach((b) => b.classList.remove('active'));
  const nav = els.settingsPanel.querySelector(`.settings-nav-item[data-section="${CSS.escape(section)}"]`);
  if (nav) nav.classList.add('active');
  els.settingsPanel.querySelectorAll('.settings-section').forEach((s) => {
    s.classList.toggle('hidden', s.dataset.section !== section);
  });
  if (section === 'personas') {
    ensureAvatarScenarioManagerUi();
    renderAvatarList();
    renderAvatarScenarioDraftList();
    renderAvatarSelectPanel();
  }
  if (section === 'general' || section === 'team-sharing') loadTeamSharingStatus();
  if (section === 'lorebook') loadLorebookList();
}

function ensureMcpCatalogLauncher() {
  const section = getMcpSettingsSection();
  if (!section || !els.mcpServerListWrap) return;
  if (section.querySelector('#mcpCatalogOpenBtn')) return;

  const host = document.createElement('div');
  host.className = 'mcp-catalog-toolbar';
  host.innerHTML = `
    <div class="mcp-catalog-toolbar-card" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border:1px solid rgba(148,163,184,.28);border-radius:12px;background:rgba(248,250,252,.75);margin:8px 0 12px;">
      <div>
        <div style="font-weight:600;">MCP 添加中心</div>
        <div class="muted" style="font-size:12px;line-height:1.4;">自定义 MCP 管理：启用后 AI 在聊天中可调用对应工具（非装饰）</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
        <button id="mcpCatalogOpenBtn" class="btn primary" type="button">打开目录</button>
        <button id="mcpCatalogManualBtn" class="btn ghost" type="button">手动添加</button>
      </div>
    </div>
  `;
  section.insertBefore(host, els.mcpServerListWrap);

  const openBtn = host.querySelector('#mcpCatalogOpenBtn');
  const manualBtn = host.querySelector('#mcpCatalogManualBtn');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      openMcpCatalogModal().catch((error) => {
        if (els.mcpStatus) els.mcpStatus.textContent = `打开 MCP 目录失败：${error.message || error}`;
      });
    });
  }
  if (manualBtn) {
    manualBtn.addEventListener('click', async () => {
      await openMcpServerEditorModal({ mode: 'create' });
    });
  }
}

function ensureMcpCatalogModal() {
  if (mcpCatalogRuntime.initialized && mcpCatalogRuntime.ui) return mcpCatalogRuntime.ui;

  if (!document.getElementById('mcpCatalogInjectedStyle')) {
    const style = document.createElement('style');
    style.id = 'mcpCatalogInjectedStyle';
    style.textContent = `
      .mcp-catalog-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.28);display:none;align-items:center;justify-content:center;padding:24px;z-index:9999}
      .mcp-catalog-backdrop.open{display:flex}
      .mcp-catalog-modal{width:min(860px,96vw);max-height:min(86vh,900px);background:#fff;color:#111827;border-radius:14px;box-shadow:0 24px 70px rgba(15,23,42,.25);display:flex;flex-direction:column;overflow:hidden}
      .mcp-catalog-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(148,163,184,.2)}
      .mcp-catalog-search{flex:1;display:flex;align-items:center;gap:8px;border:1px solid rgba(148,163,184,.35);border-radius:10px;padding:10px 12px;background:#f8fafc}
      .mcp-catalog-search input{border:0;outline:0;background:transparent;width:100%;font-size:14px;color:inherit}
      .mcp-catalog-close{border:0;background:#f1f5f9;color:#334155;border-radius:10px;padding:8px 10px;cursor:pointer}
      .mcp-catalog-body{padding:10px 10px 14px;overflow:auto}
      .mcp-catalog-status{font-size:12px;color:#64748b;padding:4px 6px 8px}
      .mcp-catalog-section{padding:6px}
      .mcp-catalog-section-title{font-size:12px;font-weight:700;color:#64748b;padding:8px 6px;text-transform:none}
      .mcp-catalog-list{display:flex;flex-direction:column;gap:6px}
      .mcp-catalog-item{display:flex;align-items:flex-start;gap:10px;width:100%;text-align:left;border:1px solid rgba(148,163,184,.18);background:#fff;border-radius:12px;padding:12px;cursor:pointer;transition:border-color .15s ease,background-color .15s ease}
      .mcp-catalog-item:hover{border-color:rgba(59,130,246,.35);background:#f8fbff}
      .mcp-catalog-item[disabled]{cursor:not-allowed;opacity:.62;background:#f8fafc}
      .mcp-catalog-icon{width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-weight:700;flex:0 0 auto}
      .mcp-catalog-icon.text{background:#f1f5f9;color:#334155}
      .mcp-catalog-item-main{min-width:0;flex:1}
      .mcp-catalog-item-title{font-weight:600;line-height:1.25}
      .mcp-catalog-item-desc{font-size:12px;color:#64748b;line-height:1.35;margin-top:2px;word-break:break-word}
      .mcp-catalog-item-meta{font-size:11px;color:#94a3b8;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mcp-catalog-item-badge{font-size:11px;border-radius:999px;padding:3px 8px;background:#eff6ff;color:#1d4ed8;align-self:center}
      .mcp-catalog-item-badge.added{background:#ecfdf5;color:#047857}
      .mcp-catalog-empty{padding:18px 14px;color:#64748b;text-align:center}
      @media (max-width: 700px){
        .mcp-catalog-backdrop{padding:12px}
        .mcp-catalog-modal{width:100%;max-height:92vh;border-radius:12px}
        .mcp-catalog-item{padding:10px}
        .mcp-catalog-head{padding:12px}
      }
    `;
    document.head.appendChild(style);
  }

  const backdrop = document.createElement('div');
  backdrop.className = 'mcp-catalog-backdrop';
  backdrop.innerHTML = `
    <div class="mcp-catalog-modal" role="dialog" aria-modal="true" aria-labelledby="mcpCatalogTitle">
      <div class="mcp-catalog-head">
        <div class="mcp-catalog-search">
          <span aria-hidden="true">🔎</span>
          <input id="mcpCatalogSearchInput" type="text" placeholder="搜索 MCP、命令、描述..." autocomplete="off">
        </div>
        <button class="mcp-catalog-close" id="mcpCatalogCloseBtn" type="button" aria-label="关闭">ESC</button>
      </div>
      <div class="mcp-catalog-body">
        <div id="mcpCatalogStatus" class="mcp-catalog-status">正在加载...</div>
        <div id="mcpCatalogSections"></div>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const ui = {
    backdrop,
    searchInput: backdrop.querySelector('#mcpCatalogSearchInput'),
    closeBtn: backdrop.querySelector('#mcpCatalogCloseBtn'),
    status: backdrop.querySelector('#mcpCatalogStatus'),
    sections: backdrop.querySelector('#mcpCatalogSections')
  };

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeMcpCatalogModal();
  });
  if (ui.closeBtn) ui.closeBtn.addEventListener('click', () => closeMcpCatalogModal());
  if (ui.searchInput) {
    ui.searchInput.addEventListener('input', () => {
      mcpCatalogRuntime.query = String(ui.searchInput.value || '').trim();
      renderMcpCatalogSections();
    });
  }
  if (ui.sections) {
    ui.sections.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-mcp-catalog-action],button[data-mcp-preset-key]');
      if (!btn || btn.disabled) return;
      if (btn.dataset.mcpCatalogAction) {
        handleMcpCatalogAction(btn.dataset.mcpCatalogAction).catch((error) => {
          mcpCatalogRuntime.lastMessage = `操作失败：${error.message || error}`;
          mcpCatalogRuntime.loading = false;
          renderMcpCatalogSections();
        });
        return;
      }
      if (btn.dataset.mcpPresetKey) {
        addMcpPresetFromCatalog(btn.dataset.mcpPresetKey).catch((error) => {
          mcpCatalogRuntime.lastMessage = `添加失败：${error.message || error}`;
          mcpCatalogRuntime.loading = false;
          renderMcpCatalogSections();
        });
      }
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mcpCatalogRuntime.ui && mcpCatalogRuntime.ui.backdrop.classList.contains('open')) {
      closeMcpCatalogModal();
    }
  });

  mcpCatalogRuntime.initialized = true;
  mcpCatalogRuntime.ui = ui;
  return ui;
}

function closeMcpCatalogModal() {
  const ui = ensureMcpCatalogModal();
  ui.backdrop.classList.remove('open');
}

async function openMcpCatalogModal() {
  await openSettingsSection('mcp');
  const ui = ensureMcpCatalogModal();
  ui.backdrop.classList.add('open');
  if (ui.searchInput) {
    ui.searchInput.value = mcpCatalogRuntime.query || '';
    window.setTimeout(() => ui.searchInput.focus(), 0);
  }
  renderMcpCatalogSections();
  await refreshMcpCatalogData();
}

function mcpPresetMatchesServer(preset, server) {
  if (!preset || !server) return false;
  const presetType = String(preset.type || 'stdio').toLowerCase();
  const serverType = String(server.type || 'stdio').toLowerCase();
  if (presetType !== serverType) return false;
  if (presetType !== 'stdio') {
    return String(preset.url || '').trim() && String(preset.url || '').trim() === String(server.url || '').trim();
  }
  const pCmd = String(preset.command || '').trim();
  const sCmd = String(server.command || '').trim();
  if (!pCmd || pCmd !== sCmd) return false;
  const pArgs = JSON.stringify(Array.isArray(preset.args) ? preset.args.map((x) => String(x)) : []);
  const sArgs = JSON.stringify(Array.isArray(server.args) ? server.args.map((x) => String(x)) : []);
  return pArgs === sArgs;
}

function getMcpCatalogPresetAddedMap() {
  const presets = Array.isArray(state._mcpPresetCache) ? state._mcpPresetCache : [];
  const servers = Array.isArray(state._mcpServerCache) ? state._mcpServerCache : [];
  const out = new Map();
  presets.forEach((preset) => {
    const added = servers.some((server) => mcpPresetMatchesServer(preset, server));
    out.set(String(preset.key || ''), added);
  });
  return out;
}

function mcpCatalogEntryMatchesQuery(entry, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return [entry.title, entry.desc, entry.meta].some((v) => String(v || '').toLowerCase().includes(q));
}

function renderMcpCatalogSections() {
  const ui = ensureMcpCatalogModal();
  if (!ui.sections) return;
  const query = String(mcpCatalogRuntime.query || '').trim();
  const presetAddedMap = getMcpCatalogPresetAddedMap();
  const presets = Array.isArray(state._mcpPresetCache) ? state._mcpPresetCache : [];

  const sections = [];
  sections.push({
    title: '添加导入',
    items: [
      {
        kind: 'action',
        action: 'custom',
        icon: '+',
        iconClass: '',
        title: '添加自定义服务器',
        desc: '手动配置 stdio MCP 服务（npx / node / python）',
        meta: '适合本地命令型 MCP Server',
        badge: '打开表单'
      },
      {
        kind: 'action',
        action: 'import-json',
        icon: 'JSON',
        iconClass: 'text',
        title: '从剪贴板 JSON 导入',
        desc: '支持 mcpServers / servers / 配置数组',
        meta: '自动跳过重复项',
        badge: '快速导入'
      }
    ]
  });

  sections.push({
    title: '探索（预设）',
    items: presets.map((p) => ({
      kind: 'preset',
      key: String(p.key || ''),
      icon: p.icon || '🔌',
      iconClass: '',
      title: String(p.name || 'MCP Server'),
      desc: String(p.desc || ''),
      meta: ((p.type || 'stdio') === 'stdio')
        ? `${String(p.command || '')} ${(Array.isArray(p.args) ? p.args.join(' ') : '')}`.trim()
        : `${String(p.type || 'http').toUpperCase()} ${String(p.url || '')}`.trim(),
      added: Boolean(presetAddedMap.get(String(p.key || ''))),
      badge: Boolean(presetAddedMap.get(String(p.key || ''))) ? '已添加' : '点击添加'
    }))
  });

  let visibleCount = 0;
  const html = sections.map((section) => {
    const items = section.items.filter((entry) => mcpCatalogEntryMatchesQuery(entry, query));
    if (!items.length) return '';
    visibleCount += items.length;
    const itemsHtml = items.map((entry) => {
      const isPreset = entry.kind === 'preset';
      const disabledAttr = isPreset && entry.added ? ' disabled' : '';
      const actionAttr = !isPreset
        ? ` data-mcp-catalog-action="${escapeHtml(entry.action)}"`
        : ` data-mcp-preset-key="${escapeHtml(entry.key)}"`;
      const badgeClass = entry.added ? 'mcp-catalog-item-badge added' : 'mcp-catalog-item-badge';
      return `
        <button type="button" class="mcp-catalog-item"${actionAttr}${disabledAttr}>
          <span class="mcp-catalog-icon${entry.iconClass ? ` ${entry.iconClass}` : ''}">${escapeHtml(entry.icon)}</span>
          <span class="mcp-catalog-item-main">
            <div class="mcp-catalog-item-title">${escapeHtml(entry.title)}</div>
            <div class="mcp-catalog-item-desc">${escapeHtml(entry.desc)}</div>
            <div class="mcp-catalog-item-meta">${escapeHtml(entry.meta)}</div>
          </span>
          <span class="${badgeClass}">${escapeHtml(entry.badge || '')}</span>
        </button>
      `;
    }).join('');
    return `
      <section class="mcp-catalog-section">
        <div class="mcp-catalog-section-title">${escapeHtml(section.title)}</div>
        <div class="mcp-catalog-list">${itemsHtml}</div>
      </section>
    `;
  }).join('');

  ui.sections.innerHTML = html || '<div class="mcp-catalog-empty">没有匹配的 MCP 项目</div>';

  const parts = [];
  const serverCount = Array.isArray(state._mcpServerCache) ? state._mcpServerCache.length : 0;
  if (serverCount || serverCount === 0) parts.push(`已添加 ${serverCount} 个`);
  if (presets.length) parts.push(`预设 ${presets.length} 个`);
  if (query) parts.push(`搜索：${query}`);
  if (mcpCatalogRuntime.lastMessage) parts.push(mcpCatalogRuntime.lastMessage);
  if (mcpCatalogRuntime.loading) parts.push('同步中...');
  if (ui.status) ui.status.textContent = parts.join(' ｜ ') || 'MCP 目录';
}

async function refreshMcpCatalogData() {
  ensureMcpCatalogModal();
  mcpCatalogRuntime.loading = true;
  mcpCatalogRuntime.lastMessage = '';
  renderMcpCatalogSections();
  const results = await Promise.allSettled([
    apiRequest('/api/mcp-servers', { method: 'GET' }),
    apiRequest('/api/preset-mcp-servers', { method: 'GET' })
  ]);
  const [serversRes, presetsRes] = results;

  if (serversRes.status === 'fulfilled') {
    state._mcpServerCache = Array.isArray(serversRes.value.servers) ? serversRes.value.servers : [];
  } else {
    mcpCatalogRuntime.lastMessage = `服务器列表加载失败：${serversRes.reason?.message || serversRes.reason || 'unknown'}`;
  }
  if (presetsRes.status === 'fulfilled') {
    state._mcpPresetCache = Array.isArray(presetsRes.value.presets) ? presetsRes.value.presets : [];
  } else if (!mcpCatalogRuntime.lastMessage) {
    mcpCatalogRuntime.lastMessage = `预设加载失败：${presetsRes.reason?.message || presetsRes.reason || 'unknown'}`;
  }

  mcpCatalogRuntime.loading = false;
  renderMcpCatalogSections();
}

async function handleMcpCatalogAction(action) {
  if (action === 'custom') {
    closeMcpCatalogModal();
    await openMcpServerEditorModal({ mode: 'create' });
    return;
  }
  if (action === 'import-json') {
    closeMcpCatalogModal();
    await openMcpJsonImportModal();
  }
}

function buildMcpPayloadFromPreset(preset) {
  const type = String(preset.type || 'stdio').toLowerCase();
  if (type !== 'stdio') {
    return {
      name: String(preset.name || 'MCP Server').trim() || 'MCP Server',
      type,
      url: String(preset.url || '').trim(),
      headers: preset.headers && typeof preset.headers === 'object' ? { ...preset.headers } : {},
      enabled: true
    };
  }
  return {
    name: String(preset.name || 'MCP Server').trim() || 'MCP Server',
    command: String(preset.command || '').trim(),
    args: Array.isArray(preset.args) ? preset.args.map((x) => String(x)) : [],
    env: preset.env && typeof preset.env === 'object' ? { ...preset.env } : {},
    enabled: true
  };
}

async function addMcpPresetFromCatalog(presetKey) {
  const key = String(presetKey || '');
  if (!key) return;
  const preset = (Array.isArray(state._mcpPresetCache) ? state._mcpPresetCache : []).find((p) => String(p.key || '') === key);
  if (!preset) {
    mcpCatalogRuntime.lastMessage = '未找到该预设';
    renderMcpCatalogSections();
    return;
  }

  mcpCatalogRuntime.loading = true;
  mcpCatalogRuntime.lastMessage = `正在添加：${preset.name}`;
  renderMcpCatalogSections();
  try {
    await apiRequest('/api/mcp-servers', {
      method: 'POST',
      body: JSON.stringify(buildMcpPayloadFromPreset(preset))
    });
    if (els.mcpStatus) els.mcpStatus.textContent = `已添加 MCP：${preset.name}`;
    await refreshMcpUiAfterChange();
    mcpCatalogRuntime.lastMessage = `已添加：${preset.name}`;
  } catch (error) {
    const msg = error.message || String(error);
    if (els.mcpStatus) els.mcpStatus.textContent = `添加失败：${msg}`;
    mcpCatalogRuntime.lastMessage = `添加失败：${msg}`;
  } finally {
    mcpCatalogRuntime.loading = false;
    renderMcpCatalogSections();
  }
}

async function refreshMcpUiAfterChange() {
  const results = await Promise.allSettled([
    loadMcpServerList(),
    refreshMcpQuickPanel()
  ]);
  const loadErr = results.find((r) => r.status === 'rejected');
  if (loadErr && els.mcpStatus) {
    els.mcpStatus.textContent = `MCP 列表刷新失败：${loadErr.reason?.message || loadErr.reason || 'unknown'}`;
  }
  if (mcpCatalogRuntime.initialized && mcpCatalogRuntime.ui && mcpCatalogRuntime.ui.backdrop.classList.contains('open')) {
    renderMcpCatalogSections();
  }
}

function ensureMcpServerEditorModal() {
  if (mcpServerEditorRuntime.initialized && mcpServerEditorRuntime.ui) return mcpServerEditorRuntime.ui;
  ensureToolUiInjectedStyle();

  const backdrop = document.createElement('div');
  backdrop.className = 'toolui-backdrop';
  backdrop.innerHTML = `
    <div class="toolui-modal narrow" role="dialog" aria-modal="true" aria-labelledby="mcpServerEditorTitle">
      <div class="toolui-head">
        <div class="toolui-title" id="mcpServerEditorTitle">添加 MCP Server</div>
        <button class="toolui-close" type="button" data-close>ESC</button>
      </div>
      <div class="toolui-body">
        <div class="toolui-grid">
          <div class="toolui-row">
            <label for="mcpEditorNameInput">名称 *</label>
            <input id="mcpEditorNameInput" class="toolui-input" type="text" placeholder="如：Brave Search / GitHub / 本地工具箱">
          </div>

          <div class="toolui-row">
            <label>类型 *</label>
            <div class="toolui-inline" id="mcpEditorTransportGroup">
              <label class="toolui-radio active" data-radio-wrap>
                <input type="radio" name="mcpEditorTransport" value="http" checked>
                <span>远程 (http/sse)</span>
              </label>
              <label class="toolui-radio" data-radio-wrap>
                <input type="radio" name="mcpEditorTransport" value="stdio">
                <span>本地 (stdio)</span>
              </label>
            </div>
          </div>

          <div id="mcpEditorRemoteBlock" class="toolui-switch-block">
            <div class="toolui-grid">
              <div class="toolui-row">
                <label for="mcpEditorRemoteTypeSelect">远程协议</label>
                <select id="mcpEditorRemoteTypeSelect" class="toolui-select">
                  <option value="http">HTTP</option>
                  <option value="sse">SSE</option>
                </select>
              </div>
              <div class="toolui-row">
                <label for="mcpEditorUrlInput">URL *</label>
                <input id="mcpEditorUrlInput" class="toolui-input" type="text" placeholder="https://...">
              </div>
              <div class="toolui-row">
                <label for="mcpEditorHeadersInput">HTTP Header</label>
                <textarea id="mcpEditorHeadersInput" class="toolui-textarea" rows="4" placeholder="Authorization=Bearer xxx&#10;X-API-Key=..."></textarea>
                <div class="hint">每行一个，支持 <code>KEY=VALUE</code> 或 <code>Key: Value</code></div>
              </div>
            </div>
          </div>

          <div id="mcpEditorStdioBlock" class="toolui-switch-block toolui-hidden">
            <div class="toolui-grid">
              <div class="toolui-row">
                <label for="mcpEditorCommandInput">命令 *</label>
                <input id="mcpEditorCommandInput" class="toolui-input" type="text" placeholder="npx / node / python">
              </div>
              <div class="toolui-row">
                <label for="mcpEditorArgsInput">参数</label>
                <input id="mcpEditorArgsInput" class="toolui-input" type="text" placeholder="-y @modelcontextprotocol/server-fetch">
              </div>
              <div class="toolui-row">
                <label for="mcpEditorEnvInput">环境变量</label>
                <textarea id="mcpEditorEnvInput" class="toolui-textarea" rows="4" placeholder="KEY=value&#10;KEY2=value2"></textarea>
              </div>
            </div>
          </div>

          <div id="mcpEditorStatus" class="toolui-status"></div>
        </div>
      </div>
      <div class="toolui-foot">
        <button type="button" class="btn ghost" data-close>取消</button>
        <button type="button" class="btn ghost" id="mcpEditorTestBtn">测试</button>
        <button type="button" class="btn primary" id="mcpEditorSaveBtn">保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const ui = {
    backdrop,
    title: backdrop.querySelector('#mcpServerEditorTitle'),
    name: backdrop.querySelector('#mcpEditorNameInput'),
    transportGroup: backdrop.querySelector('#mcpEditorTransportGroup'),
    transportRadios: Array.from(backdrop.querySelectorAll('input[name="mcpEditorTransport"]')),
    remoteBlock: backdrop.querySelector('#mcpEditorRemoteBlock'),
    stdioBlock: backdrop.querySelector('#mcpEditorStdioBlock'),
    remoteType: backdrop.querySelector('#mcpEditorRemoteTypeSelect'),
    url: backdrop.querySelector('#mcpEditorUrlInput'),
    headers: backdrop.querySelector('#mcpEditorHeadersInput'),
    command: backdrop.querySelector('#mcpEditorCommandInput'),
    args: backdrop.querySelector('#mcpEditorArgsInput'),
    env: backdrop.querySelector('#mcpEditorEnvInput'),
    status: backdrop.querySelector('#mcpEditorStatus'),
    testBtn: backdrop.querySelector('#mcpEditorTestBtn'),
    saveBtn: backdrop.querySelector('#mcpEditorSaveBtn')
  };

  function updateTransportUi() {
    const current = (ui.transportRadios.find((r) => r.checked) || {}).value || 'http';
    ui.remoteBlock.classList.toggle('toolui-hidden', current === 'stdio');
    ui.stdioBlock.classList.toggle('toolui-hidden', current !== 'stdio');
    ui.transportGroup.querySelectorAll('[data-radio-wrap]').forEach((wrap) => {
      const radio = wrap.querySelector('input[type="radio"]');
      wrap.classList.toggle('active', !!(radio && radio.checked));
    });
  }

  ui.transportRadios.forEach((radio) => radio.addEventListener('change', updateTransportUi));
  updateTransportUi();

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeMcpServerEditorModal();
  });
  backdrop.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => closeMcpServerEditorModal()));
  ui.testBtn.addEventListener('click', () => testMcpServerEditorModal());
  ui.saveBtn.addEventListener('click', () => saveMcpServerEditorModal());

  mcpServerEditorRuntime.initialized = true;
  mcpServerEditorRuntime.ui = ui;
  return ui;
}

function closeMcpServerEditorModal() {
  const ui = ensureMcpServerEditorModal();
  ui.backdrop.classList.remove('open');
}

function getMcpServerEditorPayload({ requireName = true } = {}) {
  const ui = ensureMcpServerEditorModal();
  const name = String(ui.name.value || '').trim();
  const transport = (ui.transportRadios.find((r) => r.checked) || {}).value || 'http';
  const payload = {};

  if (requireName && !name) throw new Error('请输入名称');
  if (name) payload.name = name;
  if (transport === 'stdio') {
    const command = String(ui.command.value || '').trim();
    if (!command) throw new Error('请输入本地命令');
    payload.type = 'stdio';
    payload.command = command;
    payload.args = parseMcpImportArgs(ui.args.value || '');
    payload.env = parseMcpImportEnv(String(ui.env.value || '').replace(/\r/g, ''));
  } else {
    const remoteType = String(ui.remoteType.value || 'http').toLowerCase() === 'sse' ? 'sse' : 'http';
    const url = String(ui.url.value || '').trim();
    if (!url) throw new Error('请输入远程 URL');
    payload.type = remoteType;
    payload.url = url;
    payload.headers = parseKeyValueLines(ui.headers.value || '');
  }
  return payload;
}

async function openMcpServerEditorModal(options = {}) {
  await openSettingsSection('mcp');
  const ui = ensureMcpServerEditorModal();
  const mode = options.mode === 'edit' ? 'edit' : 'create';
  const server = options.server || null;
  mcpServerEditorRuntime.mode = mode;
  mcpServerEditorRuntime.editId = server && server.id ? String(server.id) : '';
  mcpServerEditorRuntime.saving = false;

  ui.title.textContent = mode === 'edit' ? '编辑 MCP Server' : '添加 MCP Server';
  ui.name.value = server ? String(server.name || '') : '';

  const type = String((server && server.type) || 'http').toLowerCase();
  const isStdio = type === 'stdio';
  ui.transportRadios.forEach((r) => { r.checked = isStdio ? r.value === 'stdio' : r.value === 'http'; });
  ui.remoteType.value = type === 'sse' ? 'sse' : 'http';
  ui.url.value = server ? String(server.url || '') : '';
  ui.headers.value = server ? kvObjectToLines(server.headers || {}, '=') : '';
  ui.command.value = server ? String(server.command || '') : '';
  ui.args.value = server ? (Array.isArray(server.args) ? server.args.join(' ') : String(server.args || '')) : '';
  ui.env.value = server ? kvObjectToLines(server.env || {}, '=') : '';
  setToolUiStatus(ui.status, '', '');

  ui.transportGroup.querySelectorAll('[data-radio-wrap]').forEach((wrap) => {
    const radio = wrap.querySelector('input[type="radio"]');
    wrap.classList.toggle('active', !!(radio && radio.checked));
  });
  ui.remoteBlock.classList.toggle('toolui-hidden', isStdio);
  ui.stdioBlock.classList.toggle('toolui-hidden', !isStdio);

  ui.backdrop.classList.add('open');
  window.setTimeout(() => ui.name.focus(), 0);
}

async function testMcpServerEditorModal() {
  const ui = ensureMcpServerEditorModal();
  try {
    const payload = getMcpServerEditorPayload({ requireName: false });
    setToolUiStatus(ui.status, '测试连接中...', '');
    const data = await apiRequest('/api/mcp-servers/test-connection', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const tools = Array.isArray(data.tools) ? data.tools : [];
    const names = tools.slice(0, 6).map((t) => t.name).join(', ');
    setToolUiStatus(ui.status, `测试成功：${tools.length} 个工具${names ? `（${names}）` : ''}`, 'success');
  } catch (error) {
    setToolUiStatus(ui.status, `测试失败：${error.message || error}`, 'error');
  }
}

async function saveMcpServerEditorModal() {
  const ui = ensureMcpServerEditorModal();
  if (mcpServerEditorRuntime.saving) return;
  try {
    const payload = getMcpServerEditorPayload({ requireName: true });
    if (mcpServerEditorRuntime.mode === 'edit' && mcpServerEditorRuntime.editId) {
      payload.id = mcpServerEditorRuntime.editId;
    }
    mcpServerEditorRuntime.saving = true;
    setToolUiStatus(ui.status, '保存中...', '');
    await apiRequest('/api/mcp-servers', { method: 'POST', body: JSON.stringify(payload) });
    setToolUiStatus(ui.status, '已保存', 'success');
    if (els.mcpStatus) els.mcpStatus.textContent = 'MCP 已保存';
    await refreshMcpUiAfterChange();
    closeMcpServerEditorModal();
  } catch (error) {
    setToolUiStatus(ui.status, `保存失败：${error.message || error}`, 'error');
  } finally {
    mcpServerEditorRuntime.saving = false;
  }
}

function ensureMcpJsonImportModal() {
  if (mcpJsonImportRuntime.initialized && mcpJsonImportRuntime.ui) return mcpJsonImportRuntime.ui;
  ensureToolUiInjectedStyle();

  const backdrop = document.createElement('div');
  backdrop.className = 'toolui-backdrop';
  backdrop.innerHTML = `
    <div class="toolui-modal narrow" role="dialog" aria-modal="true" aria-labelledby="mcpJsonImportTitle">
      <div class="toolui-head">
        <div class="toolui-title" id="mcpJsonImportTitle">从 JSON 导入 MCP</div>
        <button class="toolui-close" type="button" data-close>ESC</button>
      </div>
      <div class="toolui-body">
        <div class="toolui-grid">
          <div class="toolui-row">
            <label for="mcpJsonImportTextarea">MCP JSON 配置</label>
            <textarea id="mcpJsonImportTextarea" class="toolui-textarea" rows="12" placeholder='粘贴 JSON（支持 mcpServers / servers / 数组）'></textarea>
          </div>
          <div class="toolui-actions-row">
            <button type="button" class="btn ghost" id="mcpJsonPasteBtn">读取剪贴板</button>
            <button type="button" class="btn ghost" id="mcpJsonClearBtn">清空</button>
          </div>
          <div id="mcpJsonImportStatus" class="toolui-status"></div>
        </div>
      </div>
      <div class="toolui-foot">
        <button type="button" class="btn ghost" data-close>取消</button>
        <button type="button" class="btn primary" id="mcpJsonImportRunBtn">导入</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const ui = {
    backdrop,
    textarea: backdrop.querySelector('#mcpJsonImportTextarea'),
    status: backdrop.querySelector('#mcpJsonImportStatus'),
    pasteBtn: backdrop.querySelector('#mcpJsonPasteBtn'),
    clearBtn: backdrop.querySelector('#mcpJsonClearBtn'),
    runBtn: backdrop.querySelector('#mcpJsonImportRunBtn')
  };

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeMcpJsonImportModal();
  });
  backdrop.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => closeMcpJsonImportModal()));
  ui.clearBtn.addEventListener('click', () => {
    ui.textarea.value = '';
    setToolUiStatus(ui.status, '', '');
    ui.textarea.focus();
  });
  ui.pasteBtn.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.readText) throw new Error('当前浏览器不支持读取剪贴板');
      ui.textarea.value = await navigator.clipboard.readText();
      setToolUiStatus(ui.status, '已读取剪贴板内容', 'success');
    } catch (error) {
      setToolUiStatus(ui.status, `读取剪贴板失败：${error.message || error}`, 'error');
    }
  });
  ui.runBtn.addEventListener('click', () => runMcpJsonImportModal());

  mcpJsonImportRuntime.initialized = true;
  mcpJsonImportRuntime.ui = ui;
  return ui;
}

function closeMcpJsonImportModal() {
  const ui = ensureMcpJsonImportModal();
  ui.backdrop.classList.remove('open');
}

async function openMcpJsonImportModal() {
  await openSettingsSection('mcp');
  const ui = ensureMcpJsonImportModal();
  ui.backdrop.classList.add('open');
  setToolUiStatus(ui.status, '', '');
  window.setTimeout(() => ui.textarea.focus(), 0);
}

async function runMcpJsonImportModal() {
  const ui = ensureMcpJsonImportModal();
  if (mcpJsonImportRuntime.busy) return;
  const rawText = String(ui.textarea.value || '').trim();
  if (!rawText) {
    setToolUiStatus(ui.status, '请先粘贴 JSON 配置', 'error');
    return;
  }
  mcpJsonImportRuntime.busy = true;
  setToolUiStatus(ui.status, '导入中...', '');
  try {
    const resultText = await importMcpServersFromText(rawText);
    setToolUiStatus(ui.status, resultText || '导入完成', 'success');
    if (els.mcpStatus) els.mcpStatus.textContent = resultText || '导入完成';
  } catch (error) {
    setToolUiStatus(ui.status, `导入失败：${error.message || error}`, 'error');
  } finally {
    mcpJsonImportRuntime.busy = false;
  }
}

async function loadMcpServerList() {
  ensureMcpCatalogLauncher();
  if (!els.mcpServerListWrap) return;
  try {
    const data = await apiRequest('/api/mcp-servers', { method: 'GET' });
    const servers = data.servers || [];
    state._mcpServerCache = Array.isArray(servers) ? servers : [];
    renderMcpServerList(servers);
    renderPresetMcpServers(servers);
    if (mcpCatalogRuntime.initialized) renderMcpCatalogSections();
  } catch (error) {
    if (els.mcpStatus) els.mcpStatus.textContent = `加载 MCP 列表失败：${error.message || error}`;
  }
}

function renderMcpServerList(servers) {
  const wrap = els.mcpServerListWrap;
  if (!servers.length) { wrap.innerHTML = '<p class="muted">暂无 MCP 服务</p>'; return; }
  wrap.innerHTML = servers.map((s) => {
    const toolCount = s.toolCount || 0;
    const statusText = s.status === 'connected' ? `Connected · ${toolCount} tools` : 'Disconnected';
    const mcpType = (s.type || 'stdio').toLowerCase();
    const endpointText = mcpType === 'stdio'
      ? `${escapeHtml(s.command || '')} ${escapeHtml((s.args || []).join(' '))}`.trim()
      : `${mcpType.toUpperCase()} ${escapeHtml(s.url || '')}`.trim();
    return `
    <div class="provider-card${s.enabled ? '' : ' disabled'}">
      <div class="provider-card-info">
        <div class="provider-card-name">${escapeHtml(s.name)}</div>
        <div class="provider-card-meta">${endpointText} · ${statusText}${s.enabled ? '' : ' · 已禁用'}</div>
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
      const added = existing.some((s) => mcpPresetMatchesServer(p, s));
      return `<div class="preset-card${added ? ' added' : ''}" data-preset-key="${escapeHtml(p.key)}">
        <span class="preset-card-icon">${p.icon || '🔌'}</span>
        <span class="preset-card-name">${escapeHtml(p.name)}</span>
        <span class="preset-card-url">${escapeHtml(p.desc || '')}</span>
        <span class="preset-card-status">${added ? "Added" : "Click to add"}</span>
      </div>`;
    }).join('');
    state._mcpPresetCache = presets;
    if (mcpCatalogRuntime.initialized) renderMcpCatalogSections();
  } catch (error) {
    if (mcpCatalogRuntime.initialized) {
      mcpCatalogRuntime.lastMessage = `预设加载失败：${error.message || error}`;
      renderMcpCatalogSections();
    }
  }
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
    await refreshMcpUiAfterChange();
  } catch (e) {
    els.mcpStatus.textContent = `保存失败：${e.message || e}`;
  }
}

async function toggleMcpServer(id) {
  try {
    await apiRequest(`/api/mcp-servers/${encodeURIComponent(id)}/toggle`, { method: 'POST' });
    await refreshMcpUiAfterChange();
  } catch (e) {
    if (els.mcpStatus) els.mcpStatus.textContent = `切换失败：${e.message || e}`;
  }
}
window.toggleMcpServer = toggleMcpServer;

async function deleteMcpServer(id) {
  if (!window.confirm('确认删除该 MCP 服务？')) return;
  try {
    await apiRequest(`/api/mcp-servers/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (els.mcpStatus) els.mcpStatus.textContent = '已删除';
    await refreshMcpUiAfterChange();
  } catch (e) {
    if (els.mcpStatus) els.mcpStatus.textContent = `删除失败：${e.message || e}`;
  }
}
window.deleteMcpServer = deleteMcpServer;

async function editMcpServer(id) {
  try {
    const data = await apiRequest('/api/mcp-servers', { method: 'GET' });
    const s = (data.servers || []).find((x) => x.id === id);
    if (!s) return;
    await openMcpServerEditorModal({ mode: 'edit', server: s });
  } catch (error) {
    if (els.mcpStatus) els.mcpStatus.textContent = `读取失败：${error.message || error}`;
  }
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

function extractJsonFromClipboardText(text) {
  const raw = String(text || '').trim();
  if (!raw) return '';
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) return fence[1].trim();
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  const firstBracket = raw.indexOf('[');
  const lastBracket = raw.lastIndexOf(']');
  if (firstBrace >= 0 && lastBrace > firstBrace && (firstBracket < 0 || firstBrace < firstBracket)) {
    return raw.slice(firstBrace, lastBrace + 1).trim();
  }
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    return raw.slice(firstBracket, lastBracket + 1).trim();
  }
  return raw;
}

function parseMcpImportEnv(envLike) {
  if (!envLike) return {};
  if (typeof envLike === 'object' && !Array.isArray(envLike)) {
    const out = {};
    Object.entries(envLike).forEach(([k, v]) => {
      if (!k) return;
      out[String(k)] = String(v ?? '');
    });
    return out;
  }
  if (Array.isArray(envLike)) {
    const out = {};
    envLike.forEach((item) => {
      const s = String(item || '');
      const idx = s.indexOf('=');
      if (idx > 0) out[s.slice(0, idx)] = s.slice(idx + 1);
    });
    return out;
  }
  if (typeof envLike === 'string') {
    const out = {};
    envLike.trim().split(/\s+/).forEach((pair) => {
      const idx = pair.indexOf('=');
      if (idx > 0) out[pair.slice(0, idx)] = pair.slice(idx + 1);
    });
    return out;
  }
  return {};
}

function parseMcpImportArgs(argsLike) {
  if (Array.isArray(argsLike)) return argsLike.map((a) => String(a));
  if (typeof argsLike === 'string') return argsLike.trim() ? argsLike.trim().split(/\s+/) : [];
  return [];
}

function parseMcpImportHeaders(headersLike) {
  if (!headersLike) return {};
  if (typeof headersLike === 'object' && !Array.isArray(headersLike)) {
    const out = {};
    Object.entries(headersLike).forEach(([k, v]) => {
      if (!k) return;
      out[String(k)] = String(v ?? '');
    });
    return out;
  }
  if (Array.isArray(headersLike)) {
    const out = {};
    headersLike.forEach((item) => {
      const s = String(item || '');
      const idx = s.indexOf(':');
      if (idx > 0) out[s.slice(0, idx).trim()] = s.slice(idx + 1).trim();
    });
    return out;
  }
  if (typeof headersLike === 'string') {
    const out = {};
    String(headersLike).split(/\r?\n/).forEach((line) => {
      const s = line.trim();
      if (!s) return;
      const idx = s.indexOf(':');
      if (idx > 0) out[s.slice(0, idx).trim()] = s.slice(idx + 1).trim();
    });
    return out;
  }
  return {};
}

function collectMcpImportCandidates(parsed) {
  if (Array.isArray(parsed)) return parsed.map((raw, i) => ({ raw, nameHint: `MCP ${i + 1}` }));
  if (!parsed || typeof parsed !== 'object') return [];

  if (parsed.mcpServers && typeof parsed.mcpServers === 'object') {
    return Object.entries(parsed.mcpServers).map(([name, raw]) => ({ raw, nameHint: name }));
  }
  if (parsed.servers && typeof parsed.servers === 'object') {
    if (Array.isArray(parsed.servers)) {
      return parsed.servers.map((raw, i) => ({ raw, nameHint: `MCP ${i + 1}` }));
    }
    return Object.entries(parsed.servers).map(([name, raw]) => ({ raw, nameHint: name }));
  }
  if (parsed.command || parsed.cmd || parsed.url) {
    return [{ raw: parsed, nameHint: parsed.name || 'MCP Server' }];
  }

  const entries = Object.entries(parsed).filter(([, v]) => v && typeof v === 'object');
  if (entries.length) return entries.map(([name, raw]) => ({ raw, nameHint: name }));
  return [];
}

function normalizeMcpImportCandidate(candidate) {
  const raw = candidate && candidate.raw && typeof candidate.raw === 'object' ? candidate.raw : {};
  const transportObj = raw.transport && typeof raw.transport === 'object' ? raw.transport : null;
  const transportType = String(transportObj?.type || raw.transport || raw.type || raw.transportType || '').toLowerCase();
  const remoteUrl = String(
    raw.url || raw.sseUrl || raw.endpoint || raw.baseUrl ||
    transportObj?.url || transportObj?.sseUrl || transportObj?.endpoint || ''
  ).trim();
  const hasRemoteUrl = Boolean(remoteUrl);
  if (hasRemoteUrl || transportType.includes('sse') || transportType.includes('http')) {
    const remoteType = transportType.includes('sse') || raw.sseUrl ? 'sse' : 'http';
    if (!remoteUrl) {
      return {
        ok: false,
        name: String(raw.name || candidate.nameHint || 'MCP Server'),
        reason: '缺少远程 MCP 的 url 字段'
      };
    }
    return {
      ok: true,
      server: {
        name: String(raw.name || candidate.nameHint || 'MCP Server').trim() || 'MCP Server',
        type: remoteType,
        url: remoteUrl,
        headers: parseMcpImportHeaders(
          raw.headers ?? raw.httpHeaders ?? raw.requestHeaders ?? raw.header ??
          transportObj?.headers ?? transportObj?.httpHeaders
        ),
        enabled: raw.enabled !== false
      }
    };
  }

  const stdio = raw.stdio && typeof raw.stdio === 'object' ? raw.stdio : null;
  const command = String(raw.command || raw.cmd || stdio?.command || '').trim();
  if (!command) {
    return {
      ok: false,
      name: String(raw.name || candidate.nameHint || 'MCP Server'),
      reason: '缺少 command 字段'
    };
  }

  const args = parseMcpImportArgs(raw.args ?? raw.arguments ?? stdio?.args);
  const env = parseMcpImportEnv(raw.env ?? raw.environment ?? stdio?.env);
  const name = String(raw.name || candidate.nameHint || command).trim() || 'MCP Server';

  return {
    ok: true,
    server: {
      name,
      command,
      args,
      env,
      enabled: raw.enabled !== false
    }
  };
}

function mcpImportSignature(server) {
  if ((server.type || 'stdio') !== 'stdio') {
    return `${server.name}||${server.type || 'http'}||${server.url || ''}`;
  }
  return `${server.name}||${server.command}||${(server.args || []).join(' ')}`;
}

async function importMcpServersFromText(rawTextInput) {
  const rawText = String(rawTextInput || '');
  if (!String(rawText || '').trim()) {
    throw new Error('未读取到 JSON 内容');
  }
  let parsed;
  try {
    parsed = JSON.parse(extractJsonFromClipboardText(rawText));
  } catch (e) {
    throw new Error(`JSON 解析失败：${e.message || e}`);
  }

  const candidates = collectMcpImportCandidates(parsed);
  if (!candidates.length) {
    throw new Error('未识别到可导入的 MCP 配置（支持 mcpServers 对象或配置数组）');
  }

  let existingServers = [];
  try {
    const data = await apiRequest('/api/mcp-servers', { method: 'GET' });
    existingServers = Array.isArray(data.servers) ? data.servers : [];
  } catch (_) {}
  const seen = new Set(existingServers.map((s) => mcpImportSignature(s)));

  let imported = 0;
  let duplicate = 0;
  const skipped = [];
  const failed = [];

  for (const item of candidates) {
    const normalized = normalizeMcpImportCandidate(item);
    if (!normalized.ok) {
      skipped.push(`${normalized.name}（${normalized.reason}）`);
      continue;
    }
    const sig = mcpImportSignature(normalized.server);
    if (seen.has(sig)) {
      duplicate += 1;
      continue;
    }
    try {
      await apiRequest('/api/mcp-servers', {
        method: 'POST',
        body: JSON.stringify(normalized.server)
      });
      seen.add(sig);
      imported += 1;
    } catch (e) {
      failed.push(`${normalized.server.name}（${e.message || e}）`);
    }
  }

  await refreshMcpUiAfterChange();

  const summary = [];
  summary.push(`导入 ${imported} 个`);
  if (duplicate) summary.push(`重复跳过 ${duplicate} 个`);
  if (skipped.length) summary.push(`不支持/无效 ${skipped.length} 个`);
  if (failed.length) summary.push(`失败 ${failed.length} 个`);
  let text = summary.join('，');
  const detailLines = [...skipped.slice(0, 2), ...failed.slice(0, 2)];
  if (detailLines.length) text += `：${detailLines.join('；')}`;
  return text;
}

async function importMcpServersFromClipboard() {
  if (!els.mcpStatus) return;

  let rawText = '';
  try {
    if (!navigator.clipboard?.readText) throw new Error('clipboard_unavailable');
    rawText = await navigator.clipboard.readText();
  } catch (_) {
    rawText = window.prompt('请粘贴 MCP JSON 配置', '') || '';
  }

  try {
    const text = await importMcpServersFromText(rawText);
    els.mcpStatus.textContent = text;
  } catch (e) {
    els.mcpStatus.textContent = e.message || String(e);
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
  } catch (error) {
    if (els.mcpQuickList) {
      els.mcpQuickList.innerHTML = `<span class="muted" style="padding:6px 10px;display:block">MCP 列表加载失败：${escapeHtml(error.message || String(error))}</span>`;
    }
  }
}

function updateMcpBtnBadge(count) {
  if (!els.toggleMcpBtn) return;
  const label = 'MCP';
  els.toggleMcpBtn.textContent = count > 0 ? `🔌 ${label} (${count})` : `🔌 ${label}`;
  els.toggleMcpBtn.classList.toggle('active-tool', count > 0);
}

if (els.mcpQuickList) {
  els.mcpQuickList.addEventListener('change', async (e) => {
    const checkbox = e.target.closest('input[data-mcp-id]');
    if (!checkbox) return;
    const id = checkbox.dataset.mcpId;
    try {
      await apiRequest(`/api/mcp-servers/${encodeURIComponent(id)}/toggle`, { method: 'POST' });
      await refreshMcpUiAfterChange();
    } catch (error) {
      if (els.mcpStatus) els.mcpStatus.textContent = `切换失败：${error.message || error}`;
      await refreshMcpQuickPanel();
    }
  });
}

// Load initial badge on boot
refreshMcpQuickPanel();

/* 鈹€鈹€ Knowledge Base Settings 鈹€鈹€ */

function getKbSettingsSection() {
  return els.settingsPanel ? els.settingsPanel.querySelector('.settings-section[data-section="knowledge"]') : null;
}

function ensureKbCreatorLauncher() {
  const section = getKbSettingsSection();
  if (!section || !els.kbListWrap) return;
  if (section.querySelector('#kbCreatorOpenBtn')) return;

  const host = document.createElement('div');
  host.className = 'kb-creator-toolbar';
  host.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border:1px solid rgba(148,163,184,.28);border-radius:12px;background:rgba(248,250,252,.75);margin:8px 0 12px;">
      <div>
        <div style="font-weight:600;">知识库管理</div>
        <div class="muted" style="font-size:12px;line-height:1.4;">自定义知识库（非 Chatbox 风格），启用后会作为聊天参考内容注入</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
        <button id="kbCreatorOpenBtn" class="btn primary" type="button">+ 添加</button>
        <button id="kbCreatorLegacyBtn" class="btn ghost" type="button">旧表单</button>
      </div>
    </div>
  `;
  section.insertBefore(host, els.kbListWrap);

  const openBtn = host.querySelector('#kbCreatorOpenBtn');
  const legacyBtn = host.querySelector('#kbCreatorLegacyBtn');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      openKbCreatorModal({ mode: 'create' }).catch((error) => {
        if (els.kbStatus) els.kbStatus.textContent = `打开知识库弹窗失败：${error.message || error}`;
      });
    });
  }
  if (legacyBtn) {
    legacyBtn.addEventListener('click', async () => {
      await openSettingsSection('knowledge');
      resetKbForm();
      if (els.kbName) {
        els.kbName.scrollIntoView({ block: 'center', behavior: 'smooth' });
        els.kbName.focus();
      }
    });
  }
}

function ensureKbCreatorModal() {
  if (kbCreatorRuntime.initialized && kbCreatorRuntime.ui) return kbCreatorRuntime.ui;
  ensureToolUiInjectedStyle();

  const backdrop = document.createElement('div');
  backdrop.className = 'toolui-backdrop';
  backdrop.innerHTML = `
    <div class="toolui-modal narrow" role="dialog" aria-modal="true" aria-labelledby="kbCreatorTitle">
      <div class="toolui-head">
        <div class="toolui-title" id="kbCreatorTitle">创建知识库</div>
        <button class="toolui-close" type="button" data-close>ESC</button>
      </div>
      <div class="toolui-body">
        <div class="toolui-grid">
          <div class="toolui-row">
            <label for="kbCreatorNameInput">知识库名称 *</label>
            <input id="kbCreatorNameInput" class="toolui-input" type="text" placeholder="新知识库名称">
          </div>

          <div class="toolui-row">
            <label>作用方式（真实生效）</label>
            <div class="toolui-filebox">
              <div style="font-size:13px;line-height:1.5;color:#334155;">
                创建后该知识库会分块并建立自定义检索索引；启用状态下聊天会按问题检索相关片段注入给 AI。
              </div>
              <div class="hint" style="margin-top:6px;">当前为自定义 RAG（分块 + 轻量检索）流程，不展示未接入后端的装饰字段。</div>
            </div>
          </div>

          <div class="toolui-row">
            <label for="kbCreatorParserSelect">文档解析器（真实）</label>
            <select id="kbCreatorParserSelect" class="toolui-select">
              <option value="builtin">内置解析（txt / md / pdf / docx）</option>
            </select>
            <div class="hint">文件导入时会使用该解析器（当前仅内置解析已接入）</div>
          </div>

          <div class="toolui-row">
            <label for="kbCreatorRetrieverSelect">检索器（真实）</label>
            <select id="kbCreatorRetrieverSelect" class="toolui-select" disabled>
              <option value="lexical-bm25ish">词法检索（BM25-like）已启用</option>
            </select>
            <div class="hint">当前已接入词法检索；后续可扩展向量检索/重排</div>
          </div>

          <div class="toolui-row">
            <label>向量检索（真实，可选）</label>
            <div class="toolui-grid two-col">
              <div class="toolui-row">
                <label for="kbCreatorEmbeddingModeSelect">Embedding 提供方</label>
                <select id="kbCreatorEmbeddingModeSelect" class="toolui-select">
                  <option value="none">仅词法检索（关闭向量）</option>
                  <option value="ollama">Ollama Embeddings（本地）</option>
                  <option value="openai_compatible">OpenAI-compatible Embeddings（云端/兼容）</option>
                </select>
                <div class="hint">启用后会为知识库分块构建向量索引</div>
              </div>
              <div class="toolui-row">
                <label for="kbCreatorEmbeddingProviderSelect">Embedding Provider</label>
                <select id="kbCreatorEmbeddingProviderSelect" class="toolui-select">
                  <option value="">未启用向量检索</option>
                </select>
                <div class="hint">OpenAI-compatible 需先在“模型提供方”里配置 Provider</div>
              </div>
              <div class="toolui-row">
                <label for="kbCreatorEmbeddingModelInput">Embedding 模型 *</label>
                <input id="kbCreatorEmbeddingModelInput" class="toolui-input" type="text" placeholder="例如：nomic-embed-text / text-embedding-3-small">
                <div class="hint">不同 embedding 模型切换后需要重建索引（保存时自动处理）</div>
              </div>
            </div>
            <div id="kbCreatorEmbeddingStatusHint" class="hint">当前仅使用词法检索（BM25-like）</div>
          </div>

          <div class="toolui-row">
            <label>RAG 参数（真实生效）</label>
            <div class="toolui-grid two-col">
              <div class="toolui-row">
                <label for="kbCreatorChunkSizeInput">分块大小（字符）</label>
                <input id="kbCreatorChunkSizeInput" class="toolui-input" type="number" min="200" max="4000" step="10" value="700">
                <div class="hint">单个检索片段的大致长度</div>
              </div>
              <div class="toolui-row">
                <label for="kbCreatorChunkOverlapInput">分块重叠（字符）</label>
                <input id="kbCreatorChunkOverlapInput" class="toolui-input" type="number" min="0" max="1500" step="10" value="120">
                <div class="hint">相邻片段重复长度，减少断句信息丢失</div>
              </div>
              <div class="toolui-row">
                <label for="kbCreatorTopKInput">Top-K 召回</label>
                <input id="kbCreatorTopKInput" class="toolui-input" type="number" min="1" max="20" step="1" value="4">
                <div class="hint">每次回答最多从该知识库取多少个片段</div>
              </div>
              <div class="toolui-row">
                <label for="kbCreatorMaxContextCharsInput">注入上限（字符）</label>
                <input id="kbCreatorMaxContextCharsInput" class="toolui-input" type="number" min="1000" max="12000" step="100" value="4200">
                <div class="hint">检索片段注入到模型上下文的总字符上限</div>
              </div>
              <div class="toolui-row">
                <label for="kbCreatorMinScoreInput">最低相关度阈值</label>
                <input id="kbCreatorMinScoreInput" class="toolui-input" type="number" min="0" max="2" step="0.01" value="0.05">
                <div class="hint">过滤弱相关片段；太高可能召回不到</div>
              </div>
            </div>
          </div>

          <div class="toolui-section-title">知识内容来源（至少一种）</div>

          <div class="toolui-row">
            <label for="kbCreatorContentInput">文本内容</label>
            <textarea id="kbCreatorContentInput" class="toolui-textarea" rows="8" placeholder="粘贴知识内容（可选；若上传文件可留空）"></textarea>
          </div>

          <div class="toolui-row">
            <label>文件导入</label>
            <div class="toolui-filebox">
              <div class="toolui-actions-row">
                <button id="kbCreatorPickFileBtn" type="button" class="btn ghost">选择文件</button>
                <button id="kbCreatorClearFileBtn" type="button" class="btn ghost">清除文件</button>
                <input id="kbCreatorFileInput" type="file" hidden accept=".txt,.md,.pdf,.docx">
              </div>
              <div id="kbCreatorFileStatus" class="toolui-status"></div>
            </div>
          </div>

          <div id="kbCreatorStatus" class="toolui-status"></div>
        </div>
      </div>
      <div class="toolui-foot">
        <button type="button" class="btn ghost" data-close>取消</button>
        <button type="button" class="btn primary" id="kbCreatorSaveBtn">创建</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const ui = {
    backdrop,
    title: backdrop.querySelector('#kbCreatorTitle'),
    name: backdrop.querySelector('#kbCreatorNameInput'),
    parser: backdrop.querySelector('#kbCreatorParserSelect'),
    retriever: backdrop.querySelector('#kbCreatorRetrieverSelect'),
    embeddingMode: backdrop.querySelector('#kbCreatorEmbeddingModeSelect'),
    embeddingProvider: backdrop.querySelector('#kbCreatorEmbeddingProviderSelect'),
    embeddingModel: backdrop.querySelector('#kbCreatorEmbeddingModelInput'),
    embeddingStatusHint: backdrop.querySelector('#kbCreatorEmbeddingStatusHint'),
    chunkSize: backdrop.querySelector('#kbCreatorChunkSizeInput'),
    chunkOverlap: backdrop.querySelector('#kbCreatorChunkOverlapInput'),
    topK: backdrop.querySelector('#kbCreatorTopKInput'),
    maxContextChars: backdrop.querySelector('#kbCreatorMaxContextCharsInput'),
    minScore: backdrop.querySelector('#kbCreatorMinScoreInput'),
    content: backdrop.querySelector('#kbCreatorContentInput'),
    pickFileBtn: backdrop.querySelector('#kbCreatorPickFileBtn'),
    clearFileBtn: backdrop.querySelector('#kbCreatorClearFileBtn'),
    fileInput: backdrop.querySelector('#kbCreatorFileInput'),
    fileStatus: backdrop.querySelector('#kbCreatorFileStatus'),
    status: backdrop.querySelector('#kbCreatorStatus'),
    saveBtn: backdrop.querySelector('#kbCreatorSaveBtn')
  };

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeKbCreatorModal();
  });
  backdrop.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => closeKbCreatorModal()));
  if (ui.embeddingMode) {
    ui.embeddingMode.addEventListener('change', () => {
      syncKbEmbeddingProviderOptions(ui);
    });
  }
  if (ui.embeddingProvider) {
    ui.embeddingProvider.addEventListener('change', () => {
      syncKbEmbeddingProviderOptions(ui, { selectedId: ui.embeddingProvider.value });
    });
  }
  ui.pickFileBtn.addEventListener('click', () => ui.fileInput.click());
  ui.clearFileBtn.addEventListener('click', () => {
    kbCreatorRuntime.file = null;
    ui.fileInput.value = '';
    setToolUiStatus(ui.fileStatus, '未选择文件', '');
  });
  ui.fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    kbCreatorRuntime.file = file || null;
    setToolUiStatus(ui.fileStatus, file ? `已选择：${file.name}` : '未选择文件', file ? 'success' : '');
  });
  ui.saveBtn.addEventListener('click', () => saveKbCreatorModal());
  syncKbEmbeddingProviderOptions(ui);

  kbCreatorRuntime.initialized = true;
  kbCreatorRuntime.ui = ui;
  return ui;
}

function closeKbCreatorModal() {
  const ui = ensureKbCreatorModal();
  ui.backdrop.classList.remove('open');
}

async function openKbCreatorModal(options = {}) {
  await openSettingsSection('knowledge');
  try { await loadProviderList(); } catch (_) {}
  const ui = ensureKbCreatorModal();
  kbCreatorRuntime.mode = options.mode === 'edit' ? 'edit' : 'create';
  kbCreatorRuntime.editId = options.editId ? String(options.editId) : '';
  kbCreatorRuntime.file = null;
  kbCreatorRuntime.busy = false;

  ui.title.textContent = kbCreatorRuntime.mode === 'edit' ? '编辑知识库' : '创建知识库';
  ui.saveBtn.textContent = kbCreatorRuntime.mode === 'edit' ? '保存' : '创建';
  ui.name.value = String(options.name || '');
  const ragConfig = (options.ragConfig && typeof options.ragConfig === 'object') ? options.ragConfig : {};
  const embeddingConfig = (options.embeddingConfig && typeof options.embeddingConfig === 'object') ? options.embeddingConfig : {};
  const embeddingMeta = (options.embeddingMeta && typeof options.embeddingMeta === 'object') ? options.embeddingMeta : {};
  const sourceMeta = (options.sourceMeta && typeof options.sourceMeta === 'object') ? options.sourceMeta : {};
  ui.parser.value = String(sourceMeta.parser || 'builtin');
  if (ui.embeddingMode) {
    ui.embeddingMode.value = String(embeddingConfig.providerType || 'none');
    if (!['none', 'ollama', 'openai_compatible'].includes(ui.embeddingMode.value)) {
      ui.embeddingMode.value = 'none';
    }
    syncKbEmbeddingProviderOptions(ui, { selectedId: String(embeddingConfig.providerId || '') });
  }
  if (ui.embeddingModel) {
    ui.embeddingModel.value = String(embeddingConfig.model || '');
  }
  ui.chunkSize.value = String(Number(ragConfig.chunkSize) || 700);
  ui.chunkOverlap.value = String(Number(ragConfig.chunkOverlap) || 120);
  ui.topK.value = String(Number(ragConfig.topK) || 4);
  ui.maxContextChars.value = String(Number(ragConfig.maxContextChars) || 4200);
  ui.minScore.value = String(Number(ragConfig.minScore) || 0.05);
  ui.content.value = String(options.content || '');
  ui.fileInput.value = '';
  setToolUiStatus(ui.fileStatus, '未选择文件', '');
  setToolUiStatus(ui.status, '', '');
  if (ui.embeddingStatusHint) {
    const ready = Boolean(embeddingMeta.ready);
    const emModel = String(embeddingMeta.model || embeddingConfig.model || '').trim();
    const emType = String(embeddingMeta.providerType || embeddingConfig.providerType || 'none');
    const dim = Number(embeddingMeta.vectorDim || 0);
    const chunks = Number(embeddingMeta.chunkCount || 0);
    const err = String(embeddingMeta.error || '').trim();
    if (err) {
      ui.embeddingStatusHint.textContent = `向量索引状态：失败（${err}）`;
    } else if (ready) {
      ui.embeddingStatusHint.textContent = `向量索引状态：已构建（${emType}/${emModel}${dim ? ` · ${dim}维` : ''}${chunks ? ` · ${chunks}片段` : ''}）`;
    } else if (String(embeddingConfig.providerType || 'none') !== 'none') {
      ui.embeddingStatusHint.textContent = '保存后将构建/重建向量索引（失败时会保留词法检索）';
    } else {
      ui.embeddingStatusHint.textContent = '当前仅使用词法检索（BM25-like）';
    }
  }
  if (kbCreatorRuntime.mode === 'edit') {
    setToolUiStatus(ui.fileStatus, '编辑模式暂不支持文件替换，请修改文本内容后保存', '');
  }

  ui.backdrop.classList.add('open');
  window.setTimeout(() => ui.name.focus(), 0);
}

async function refreshKbUiAfterChange() {
  const results = await Promise.allSettled([
    loadKbList(),
    refreshKbQuickPanel()
  ]);
  const failed = results.find((r) => r.status === 'rejected');
  if (failed && els.kbStatus) {
    els.kbStatus.textContent = `知识库列表刷新失败：${failed.reason?.message || failed.reason || 'unknown'}`;
  }
}

async function saveKbCreatorModal() {
  const ui = ensureKbCreatorModal();
  if (kbCreatorRuntime.busy) return;
  const name = String(ui.name.value || '').trim();
  const content = String(ui.content.value || '').trim();
  const selectedFile = kbCreatorRuntime.file;
  const ragConfig = {
    chunkSize: Math.max(200, Math.min(4000, Number(ui.chunkSize.value || 700) || 700)),
    chunkOverlap: Math.max(0, Math.min(1500, Number(ui.chunkOverlap.value || 120) || 120)),
    topK: Math.max(1, Math.min(20, Number(ui.topK.value || 4) || 4)),
    maxContextChars: Math.max(1000, Math.min(12000, Number(ui.maxContextChars.value || 4200) || 4200)),
    minScore: Math.max(0, Math.min(2, Number(ui.minScore.value || 0.05) || 0.05))
  };
  const parser = String((ui.parser && ui.parser.value) || 'builtin');
  const embeddingMode = String((ui.embeddingMode && ui.embeddingMode.value) || 'none');
  const embeddingProviderId = String((ui.embeddingProvider && ui.embeddingProvider.value) || '').trim();
  const embeddingModel = String((ui.embeddingModel && ui.embeddingModel.value) || '').trim();
  const embeddingConfig = {
    enabled: embeddingMode !== 'none',
    providerType: embeddingMode,
    providerId: embeddingProviderId,
    model: embeddingMode === 'none' ? '' : embeddingModel
  };

  if (!name && !selectedFile) {
    setToolUiStatus(ui.status, '请输入知识库名称', 'error');
    return;
  }
  if (!content && !selectedFile) {
    setToolUiStatus(ui.status, '请输入文本内容或选择文件', 'error');
    return;
  }
  if (kbCreatorRuntime.mode === 'edit' && selectedFile) {
    setToolUiStatus(ui.status, '编辑模式暂不支持文件替换，请删除后重新创建或使用文本保存', 'error');
    return;
  }
  if (embeddingMode !== 'none' && !embeddingModel) {
    setToolUiStatus(ui.status, '启用向量检索时必须填写 Embedding 模型', 'error');
    return;
  }
  if (embeddingMode === 'openai_compatible' && !embeddingProviderId) {
    setToolUiStatus(ui.status, '请选择 OpenAI-compatible Embedding Provider', 'error');
    return;
  }

  kbCreatorRuntime.busy = true;
  setToolUiStatus(ui.status, '保存中...', '');
  try {
    let result = null;
    if (selectedFile) {
      const finalName = name || selectedFile.name.replace(/\.[^.]+$/, '');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', finalName);
      formData.append('ragChunkSize', String(ragConfig.chunkSize));
      formData.append('ragChunkOverlap', String(ragConfig.chunkOverlap));
      formData.append('ragTopK', String(ragConfig.topK));
      formData.append('ragMaxContextChars', String(ragConfig.maxContextChars));
      formData.append('ragMinScore', String(ragConfig.minScore));
      formData.append('parser', parser);
      formData.append('embedEnabled', embeddingConfig.enabled ? '1' : '0');
      formData.append('embedProviderType', embeddingConfig.providerType || 'none');
      if (embeddingConfig.providerId) formData.append('embedProviderId', embeddingConfig.providerId);
      if (embeddingConfig.model) formData.append('embedModel', embeddingConfig.model);
      const headers = new Headers();
      if (state.token) headers.set('x-access-token', state.token);
      if (CLIENT_INSTANCE_ID) headers.set('x-client-id', CLIENT_INSTANCE_ID);
      const proxyHeader = getClientProxyHeaderValue();
      if (proxyHeader) headers.set('x-client-proxy-config', proxyHeader);
      const resp = await fetch('/api/knowledge-bases/upload', { method: 'POST', headers, body: formData });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${resp.status}`);
      }
      result = await resp.json();
    } else {
      const body = { name, content, ragConfig, parser, embeddingConfig };
      if (kbCreatorRuntime.mode === 'edit' && kbCreatorRuntime.editId) body.id = kbCreatorRuntime.editId;
      result = await apiRequest('/api/knowledge-bases', { method: 'POST', body: JSON.stringify(body) });
    }

    const chunkCount = Number(result && result.chunkCount);
    const suffix = Number.isFinite(chunkCount) && chunkCount > 0 ? `（${chunkCount} 个片段）` : '';
    const warning = String((result && result.warning) || '').trim();
    if (els.kbStatus) {
      els.kbStatus.textContent = `${kbCreatorRuntime.mode === 'edit' ? '知识库已保存' : '知识库已创建'}${suffix}${warning ? `，向量索引警告：${warning}` : ''}`;
    }
    await refreshKbUiAfterChange();
    closeKbCreatorModal();
  } catch (error) {
    setToolUiStatus(ui.status, `保存失败：${error.message || error}`, 'error');
  } finally {
    kbCreatorRuntime.busy = false;
  }
}

let _kbCache = [];

function getEnabledKbIds() {
  return _kbCache.filter(kb => kb.enabled).map(kb => kb.id);
}

async function loadKbList() {
  ensureKbCreatorLauncher();
  if (!els.kbListWrap) return;
  try {
    const data = await apiRequest('/api/knowledge-bases', { method: 'GET' });
    _kbCache = data.knowledgeBases || [];
    renderKbList(_kbCache);
    updateKbBtnBadge(_kbCache.filter(kb => kb.enabled).length);
  } catch (error) {
    if (els.kbStatus) els.kbStatus.textContent = `加载知识库列表失败：${error.message || error}`;
  }
}

function renderKbList(list) {
  const wrap = els.kbListWrap;
  if (!list.length) { wrap.innerHTML = '<p class="muted">暂无知识库</p>'; return; }
  wrap.innerHTML = list.map(kb => {
    const chunkCount = Number(kb.chunkCount || 0);
    const ragCfg = (kb.ragConfig && typeof kb.ragConfig === 'object') ? kb.ragConfig : {};
    const embedCfg = (kb.embeddingConfig && typeof kb.embeddingConfig === 'object') ? kb.embeddingConfig : {};
    const embedMeta = (kb.embeddingMeta && typeof kb.embeddingMeta === 'object') ? kb.embeddingMeta : {};
    const sourceMeta = (kb.sourceMeta && typeof kb.sourceMeta === 'object') ? kb.sourceMeta : {};
    const sourceLabel = sourceMeta.type === 'file' ? '文件' : '文本';
    const parserLabel = sourceMeta.parser === 'builtin' ? '内置解析' : String(sourceMeta.parser || '解析器');
    const embedLabel = embedCfg.providerType && embedCfg.providerType !== 'none'
      ? `Vec:${embedMeta.ready ? '已建' : '待建'} ${embedCfg.providerType === 'ollama' ? 'Ollama' : 'OpenAI兼容'}${embedCfg.model ? `/${embedCfg.model}` : ''}${embedMeta.vectorDim ? ` ${embedMeta.vectorDim}d` : ''}`
      : 'Vec:关闭';
    const meta = [
      `${kb.charCount} 字符`,
      chunkCount ? `${chunkCount} 片段` : null,
      ragCfg.topK ? `TopK=${ragCfg.topK}` : null,
      ragCfg.maxContextChars ? `Ctx=${ragCfg.maxContextChars}` : null,
      embedLabel,
      parserLabel,
      sourceLabel,
      kb.enabled ? null : '已禁用'
    ].filter(Boolean).join(' · ');
    return `
    <div class="provider-card${kb.enabled ? '' : ' disabled'}">
      <div class="provider-card-info">
        <div class="provider-card-name">${escapeHtml(kb.name)}</div>
        <div class="provider-card-meta">${escapeHtml(meta)}</div>
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
    await refreshKbUiAfterChange();
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
    if (CLIENT_INSTANCE_ID) headers['x-client-id'] = CLIENT_INSTANCE_ID;
    const proxyHeader = getClientProxyHeaderValue();
    if (proxyHeader) headers['x-client-proxy-config'] = proxyHeader;
    const resp = await fetch('/api/knowledge-bases/upload', { method: 'POST', headers, body: formData });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${resp.status}`);
    }
    const data = await resp.json();
    els.kbUploadStatus.textContent = `上传完成：${data.charCount} 字符`;
    resetKbForm();
    await refreshKbUiAfterChange();
  } catch (e) {
    els.kbUploadStatus.textContent = `上传失败：${e.message || e}`;
  }
}

async function toggleKb(id) {
  try {
    await apiRequest(`/api/knowledge-bases/${encodeURIComponent(id)}/toggle`, { method: 'POST' });
    await refreshKbUiAfterChange();
  } catch (error) {
    if (els.kbStatus) els.kbStatus.textContent = `切换失败：${error.message || error}`;
  }
}
window.toggleKb = toggleKb;

async function deleteKb(id) {
  if (!window.confirm('确认删除知识库？')) return;
  try {
    await apiRequest(`/api/knowledge-bases/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (els.kbStatus) els.kbStatus.textContent = '已删除';
    await refreshKbUiAfterChange();
  } catch (error) {
    if (els.kbStatus) els.kbStatus.textContent = `删除失败：${error.message || error}`;
  }
}
window.deleteKb = deleteKb;

async function editKb(id) {
  try {
    const data = await apiRequest(`/api/knowledge-bases/${encodeURIComponent(id)}/content`, { method: 'GET' });
    if (!data) return;
    await openKbCreatorModal({
      mode: 'edit',
      editId: data.id,
      name: data.name || '',
      content: data.content || '',
      ragConfig: data.ragConfig || null,
      embeddingConfig: data.embeddingConfig || null,
      embeddingMeta: data.embeddingMeta || null,
      sourceMeta: data.sourceMeta || null
    });
  } catch (error) {
    if (els.kbStatus) els.kbStatus.textContent = `读取失败：${error.message || error}`;
  }
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
      const chunkCount = Number(kb.chunkCount || 0);
      const ragCfg = (kb.ragConfig && typeof kb.ragConfig === 'object') ? kb.ragConfig : {};
      const embedCfg = (kb.embeddingConfig && typeof kb.embeddingConfig === 'object') ? kb.embeddingConfig : {};
      const embedMeta = (kb.embeddingMeta && typeof kb.embeddingMeta === 'object') ? kb.embeddingMeta : {};
      const vecBadge = embedCfg.providerType && embedCfg.providerType !== 'none'
        ? ` · Vec ${embedMeta.ready ? 'ON' : 'PENDING'}`
        : '';
      return `<label class="mcp-quick-item">
        <input type="checkbox" data-kb-id="${escapeHtml(kb.id)}" ${kb.enabled ? 'checked' : ''}>
        <span class="mcp-quick-name">${escapeHtml(kb.name)}</span>
        <span class="mcp-quick-status muted">${chunkCount ? `${chunkCount} chunks · TopK ${escapeHtml(String(ragCfg.topK || 4))}${vecBadge}` : `${kb.charCount} chars${vecBadge}`}</span>
      </label>`;
    }).join('');
    updateKbBtnBadge(list.filter(kb => kb.enabled).length);
  } catch (error) {
    if (els.kbQuickList) {
      els.kbQuickList.innerHTML = `<span class="muted" style="padding:6px 10px;display:block">知识库列表加载失败：${escapeHtml(error.message || String(error))}</span>`;
    }
  }
}

function updateKbBtnBadge(count) {
  if (!els.toggleKbBtn) return;
  const label = uiText('知识库', 'Knowledge');
  els.toggleKbBtn.textContent = count > 0 ? ` 📚 ${label} (${count})` : ` 📚 ${label}`;
  els.toggleKbBtn.classList.toggle('active-tool', count > 0);
}

if (els.kbQuickList) {
  els.kbQuickList.addEventListener('change', async (e) => {
    const checkbox = e.target.closest('input[data-kb-id]');
    if (!checkbox) return;
    const id = checkbox.dataset.kbId;
    try {
      await apiRequest(`/api/knowledge-bases/${encodeURIComponent(id)}/toggle`, { method: 'POST' });
      await refreshKbUiAfterChange();
    } catch (error) {
      if (els.kbStatus) els.kbStatus.textContent = `切换失败：${error.message || error}`;
      await refreshKbQuickPanel();
    }
  });
}

refreshKbQuickPanel();

boot();
