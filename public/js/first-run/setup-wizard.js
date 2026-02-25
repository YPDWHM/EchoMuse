(function () {
  'use strict';

  const PRESET_LOCAL_MODELS = [
    { model: 'qwen3:4b', size: '4B', family: 'Qwen3', desc: '轻量通用（入门机器）', flashDefault: true, thinkingDefault: false },
    { model: 'qwen3:8b', size: '8B', family: 'Qwen3', desc: '通用 / RP / 学习（推荐新手）', flashDefault: true, thinkingDefault: true },
    { model: 'qwen3:14b', size: '14B', family: 'Qwen3', desc: '质量更好（建议中高配）', flashDefault: true, thinkingDefault: true },
    { model: 'qwen3:32b', size: '32B', family: 'Qwen3', desc: '高质量（高配机器）', flashDefault: true, thinkingDefault: true },
    { model: 'mistral:7b', size: '7B', family: 'Mistral', desc: '通用 / RP（速度好）', flashDefault: true, thinkingDefault: false },
    { model: 'mistral-nemo:12b', size: '12B', family: 'Mistral', desc: '12B 档位，质量与速度平衡', flashDefault: true, thinkingDefault: false },
    { model: 'mixtral:8x7b', size: 'MoE', family: 'Mixtral', desc: '高质量生成（显存占用高）', flashDefault: true, thinkingDefault: false },
    { model: 'llama2:7b', size: '7B', family: 'Llama2', desc: '基础聊天（兼容路线）', flashDefault: true, thinkingDefault: false },
    { model: 'llama2:13b', size: '13B', family: 'Llama2', desc: '更稳的回答质量（中高配）', flashDefault: true, thinkingDefault: false },
    { model: 'codellama:7b', size: '7B', family: 'CodeLlama', desc: '代码解释 / 编程学习', flashDefault: true, thinkingDefault: false },
    { model: 'codellama:13b', size: '13B', family: 'CodeLlama', desc: '更强代码能力（中高配）', flashDefault: true, thinkingDefault: false },
    { model: 'codellama:34b', size: '34B', family: 'CodeLlama', desc: '高配代码模型（下载体积大）', flashDefault: true, thinkingDefault: false },
    { model: 'vicuna:7b', size: '7B', family: 'Vicuna', desc: '经典对话路线（兼容）', flashDefault: true, thinkingDefault: false },
    { model: 'vicuna:13b', size: '13B', family: 'Vicuna', desc: '经典对话路线（更高质量）', flashDefault: true, thinkingDefault: false },
    { model: 'yi:6b', size: '6B', family: 'Yi', desc: '轻量中文/多语对话', flashDefault: true, thinkingDefault: false },
    { model: 'yi:9b', size: '9B', family: 'Yi', desc: '中文质量更好（中配可用）', flashDefault: true, thinkingDefault: false },
    { model: 'yi:34b', size: '34B', family: 'Yi', desc: '高质量长文/复杂对话（高配）', flashDefault: true, thinkingDefault: false },
    { model: 'solar:10.7b', size: '10.7B', family: 'Solar', desc: '通用写作 / 对话（中配可试）', flashDefault: true, thinkingDefault: false }
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function createEl(tag, attrs, html) {
    const el = document.createElement(tag);
    if (attrs && typeof attrs === 'object') {
      Object.entries(attrs).forEach(([k, v]) => {
        if (v == null) return;
        if (k === 'class') el.className = String(v);
        else if (k === 'dataset' && v && typeof v === 'object') {
          Object.entries(v).forEach(([dk, dv]) => { el.dataset[dk] = String(dv); });
        } else if (k === 'checked') el.checked = Boolean(v);
        else if (k === 'disabled') el.disabled = Boolean(v);
        else el.setAttribute(k, String(v));
      });
    }
    if (html != null) el.innerHTML = String(html);
    return el;
  }

  function normMode(mode, fallback) {
    const m = String(mode || '').trim().toLowerCase();
    return ['api', 'local', 'hybrid'].includes(m) ? m : (fallback || 'api');
  }

  function createController(options) {
    const opts = options || {};
    const state = {
      styleInjected: false,
      ui: null,
      payload: null,
      selectedMode: 'api',
      modelMap: new Map(),
      loading: false,
      installing: false,
      installSummary: null,
      openedOnce: false,
      autoCheckDone: false
    };

    function call(fnName, ...args) {
      const fn = opts[fnName];
      if (typeof fn !== 'function') return undefined;
      try { return fn(...args); } catch (_) { return undefined; }
    }

    function setStatus(text) {
      call('setStatus', text);
    }

    function ensureStyle() {
      if (state.styleInjected) return;
      state.styleInjected = true;
      const style = createEl('style', { id: 'echomuse-first-run-style' }, `
.echomuse-frw-overlay{position:fixed;inset:0;background:rgba(15,23,42,.35);backdrop-filter:blur(2px);z-index:12000;display:none;align-items:center;justify-content:center;padding:24px}
.echomuse-frw-overlay.show{display:flex}
.echomuse-frw-modal{width:min(980px,96vw);max-height:88vh;background:#fff;border:1px solid #dbe3f0;border-radius:18px;box-shadow:0 20px 50px rgba(15,23,42,.18);display:flex;flex-direction:column;overflow:hidden}
.echomuse-frw-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #eef2f7}
.echomuse-frw-title{font-size:24px;font-weight:800;color:#0f172a}
.echomuse-frw-sub{font-size:13px;color:#64748b;margin-top:2px}
.echomuse-frw-close{border:1px solid #d5ddea;background:#f8fbff;border-radius:12px;padding:6px 10px;font-weight:700;cursor:pointer}
.echomuse-frw-body{padding:16px 20px 18px;overflow:auto;display:grid;gap:14px}
.echomuse-frw-card{border:1px solid #e5ebf5;border-radius:14px;background:#fbfdff;padding:14px}
.echomuse-frw-card h4{margin:0 0 8px;color:#0f172a;font-size:18px}
.echomuse-frw-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:14px}
.echomuse-frw-mode-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.echomuse-frw-mode{border:1px solid #dbe4f3;border-radius:12px;background:#fff;padding:12px;cursor:pointer;display:grid;gap:6px;align-content:start}
.echomuse-frw-mode.active{border-color:#4f7cff;box-shadow:0 0 0 2px rgba(79,124,255,.12);background:#f6f9ff}
.echomuse-frw-mode .m-title{font-weight:800;color:#0f172a}
.echomuse-frw-mode .m-desc{font-size:12px;color:#64748b;line-height:1.4}
.echomuse-frw-actions{display:flex;gap:10px;align-items:center;justify-content:flex-end;flex-wrap:wrap;padding-top:6px}
.echomuse-frw-btn{border:1px solid #d5ddea;background:#fff;border-radius:12px;padding:8px 12px;font-weight:700;cursor:pointer}
.echomuse-frw-btn.primary{background:#4f7cff;color:#fff;border-color:#4f7cff}
.echomuse-frw-btn.ghost{background:#f8fbff}
.echomuse-frw-badge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;background:#eef4ff;color:#3558d8}
.echomuse-frw-checks{display:grid;gap:8px}
.echomuse-frw-check{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #e6edf8;border-radius:10px;background:#fff;padding:10px 12px}
.echomuse-frw-check .k{font-weight:700;color:#0f172a}
.echomuse-frw-check .v{font-size:12px;color:#64748b;text-align:right}
.echomuse-frw-check.ok .k::before{content:'✓ ';color:#16a34a}
.echomuse-frw-check.warn .k::before{content:'! ';color:#d97706}
.echomuse-frw-check.no .k::before{content:'× ';color:#dc2626}
.echomuse-frw-models{display:grid;gap:8px;max-height:280px;overflow:auto;padding-right:4px}
.echomuse-frw-model{border:1px solid #e6edf8;border-radius:12px;background:#fff;padding:10px;display:grid;gap:8px}
.echomuse-frw-model-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.echomuse-frw-model-name{font-weight:800;color:#0f172a}
.echomuse-frw-model-size{font-size:12px;color:#475569;border:1px solid #dbe4f3;border-radius:999px;padding:2px 8px}
.echomuse-frw-model-desc{font-size:12px;color:#64748b;line-height:1.4}
.echomuse-frw-model-modes{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:#334155}
.echomuse-frw-model-modes label{display:inline-flex;align-items:center;gap:6px}
.echomuse-frw-inline-note{font-size:12px;color:#64748b;line-height:1.5}
.echomuse-frw-footnote{font-size:12px;color:#64748b;line-height:1.45}
.echomuse-frw-reco{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.echomuse-frw-install-box{border:1px dashed #dbe4f3;border-radius:12px;background:#fff;padding:10px}
.echomuse-frw-install-box .title{font-weight:800;color:#0f172a;margin-bottom:6px}
.echomuse-frw-install-box .line{font-size:12px;color:#475569;line-height:1.5}
.echomuse-frw-install-box .line.ok{color:#166534}
.echomuse-frw-install-box .line.err{color:#b91c1c}
@media (max-width: 900px){.echomuse-frw-grid{grid-template-columns:1fr}.echomuse-frw-mode-grid{grid-template-columns:1fr}}
      `);
      document.head.appendChild(style);
    }

    function ensureUi() {
      if (state.ui) return state.ui;
      ensureStyle();
      const overlay = createEl('div', { class: 'echomuse-frw-overlay', id: 'echomuseFirstRunOverlay' });
      overlay.innerHTML = `
        <div class="echomuse-frw-modal" role="dialog" aria-modal="true" aria-labelledby="echomuseFrwTitle">
          <div class="echomuse-frw-head">
            <div>
              <div id="echomuseFrwTitle" class="echomuse-frw-title">首次启动向导</div>
              <div class="echomuse-frw-sub">你只要选用途，我们帮你推荐模式与本地模型（后续可在设置里重开）</div>
            </div>
            <button type="button" class="echomuse-frw-close" id="echomuseFrwClose">稍后再说</button>
          </div>
          <div class="echomuse-frw-body">
            <div class="echomuse-frw-grid">
              <section class="echomuse-frw-card">
                <h4>1) 选择模式（推荐先点“一键推荐”）</h4>
                <div class="echomuse-frw-reco">
                  <span class="echomuse-frw-badge" id="echomuseFrwRecoBadge">推荐模式：检测中…</span>
                  <button type="button" class="echomuse-frw-btn ghost" id="echomuseFrwUseReco">一键推荐</button>
                  <button type="button" class="echomuse-frw-btn ghost" id="echomuseFrwConfigProvider">去配 API Provider</button>
                </div>
                <div class="echomuse-frw-inline-note" id="echomuseFrwRecoReason" style="margin-top:8px;">正在检测环境…</div>
                <div class="echomuse-frw-mode-grid" id="echomuseFrwModeGrid" style="margin-top:12px;">
                  <button type="button" class="echomuse-frw-mode" data-mode="api">
                    <div class="m-title">仅 API（推荐新手）</div>
                    <div class="m-desc">不装本地模型，最快开始使用。适合不懂模型或电脑配置一般的用户。</div>
                  </button>
                  <button type="button" class="echomuse-frw-mode" data-mode="local">
                    <div class="m-title">仅本地模型（离线）</div>
                    <div class="m-desc">离线优先。需要本地运行时与模型，会占空间并更吃性能。</div>
                  </button>
                  <button type="button" class="echomuse-frw-mode" data-mode="hybrid">
                    <div class="m-title">混合模式（进阶）</div>
                    <div class="m-desc">本地 + API 同时可用。适合想兼顾速度、质量和离线能力的用户。</div>
                  </button>
                </div>
              </section>
              <section class="echomuse-frw-card">
                <h4>2) 环境检查（自动）</h4>
                <div class="echomuse-frw-checks" id="echomuseFrwChecks"></div>
                <div class="echomuse-frw-footnote" id="echomuseFrwChecksNote" style="margin-top:8px;"></div>
              </section>
            </div>
            <section class="echomuse-frw-card" id="echomuseFrwLocalSection">
              <h4>3) 本地模型（只在“仅本地 / 混合模式”需要）</h4>
              <div class="echomuse-frw-inline-note">不懂怎么选就勾一个：<strong>qwen3:8b</strong> 或 <strong>mistral:7b</strong>。想要 12B/14B/32B 也可直接勾（体积更大、速度更慢）。每个模型都能单独开关 Flash / Thinking。</div>
              <div class="echomuse-frw-models" id="echomuseFrwModelList" style="margin-top:10px;"></div>
              <div class="echomuse-frw-install-box" id="echomuseFrwInstallBox" style="margin-top:10px;">
                <div class="title">安装状态</div>
                <div class="line" id="echomuseFrwInstallStatusLine">选择本地模型后，点击“完成并进入应用”会自动检测并下载缺失模型。</div>
              </div>
            </section>
            <div class="echomuse-frw-actions">
              <button type="button" class="echomuse-frw-btn ghost" id="echomuseFrwRefresh">重新检测</button>
              <button type="button" class="echomuse-frw-btn" id="echomuseFrwSaveLater">先用默认设置</button>
              <button type="button" class="echomuse-frw-btn primary" id="echomuseFrwFinish">完成并进入应用</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(overlay);

      const ui = {
        overlay,
        closeBtn: byId('echomuseFrwClose'),
        modeGrid: byId('echomuseFrwModeGrid'),
        checks: byId('echomuseFrwChecks'),
        checksNote: byId('echomuseFrwChecksNote'),
        localSection: byId('echomuseFrwLocalSection'),
        modelList: byId('echomuseFrwModelList'),
        installBox: byId('echomuseFrwInstallBox'),
        installStatusLine: byId('echomuseFrwInstallStatusLine'),
        recoBadge: byId('echomuseFrwRecoBadge'),
        recoReason: byId('echomuseFrwRecoReason'),
        useRecoBtn: byId('echomuseFrwUseReco'),
        configProviderBtn: byId('echomuseFrwConfigProvider'),
        refreshBtn: byId('echomuseFrwRefresh'),
        saveLaterBtn: byId('echomuseFrwSaveLater'),
        finishBtn: byId('echomuseFrwFinish')
      };

      ui.closeBtn.addEventListener('click', hide);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) hide(); });
      ui.modeGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-mode]');
        if (!btn) return;
        state.selectedMode = normMode(btn.dataset.mode, 'api');
        render();
      });
      ui.useRecoBtn.addEventListener('click', () => {
        const mode = normMode(state.payload && state.payload.recommendation && state.payload.recommendation.mode, 'api');
        state.selectedMode = mode;
        applyDefaultModelSelectionForMode(mode);
        render();
      });
      ui.configProviderBtn.addEventListener('click', async () => {
        try {
          if (typeof opts.openSettingsPanel === 'function') await opts.openSettingsPanel();
          if (typeof opts.openSettingsSection === 'function') await opts.openSettingsSection('provider');
        } catch (_) {}
      });
      ui.refreshBtn.addEventListener('click', () => loadStatus(true));
      ui.saveLaterBtn.addEventListener('click', async () => {
        await saveWizard(true);
      });
      ui.finishBtn.addEventListener('click', async () => {
        await saveWizard(false);
      });
      ui.modelList.addEventListener('change', (e) => {
        const row = e.target.closest('.echomuse-frw-model');
        if (!row) return;
        const model = row.dataset.model || '';
        if (!model) return;
        const item = state.modelMap.get(model) || { model, enabled: false, flashEnabled: true, thinkingEnabled: false };
        if (e.target.matches('input[data-role="enabled"]')) item.enabled = Boolean(e.target.checked);
        if (e.target.matches('input[data-role="flash"]')) item.flashEnabled = Boolean(e.target.checked);
        if (e.target.matches('input[data-role="thinking"]')) item.thinkingEnabled = Boolean(e.target.checked);
        if (!item.enabled) {
          // keep mode toggles but won't submit if disabled
        }
        state.modelMap.set(model, item);
        renderInstallStatus();
      });

      state.ui = ui;
      return ui;
    }

    function initModelSelections(setup) {
      state.modelMap.clear();
      PRESET_LOCAL_MODELS.forEach((m) => {
        state.modelMap.set(m.model, {
          model: m.model,
          enabled: false,
          flashEnabled: m.flashDefault !== false,
          thinkingEnabled: Boolean(m.thinkingDefault)
        });
      });
      const saved = Array.isArray(setup && setup.localModels) ? setup.localModels : [];
      for (const m of saved) {
        const key = String(m && m.model || '').trim();
        if (!key) continue;
        const existing = state.modelMap.get(key) || { model: key, enabled: true, flashEnabled: true, thinkingEnabled: false };
        existing.enabled = true;
        existing.flashEnabled = m.flashEnabled !== false;
        existing.thinkingEnabled = Boolean(m.thinkingEnabled);
        state.modelMap.set(key, existing);
      }
    }

    function applyDefaultModelSelectionForMode(mode) {
      const m = normMode(mode, 'api');
      for (const item of state.modelMap.values()) item.enabled = false;
      if (m === 'local' || m === 'hybrid') {
        const qwen = state.modelMap.get('qwen3:8b');
        if (qwen) {
          qwen.enabled = true;
          qwen.flashEnabled = true;
          qwen.thinkingEnabled = m === 'hybrid';
        }
      }
    }

    function getInstalledLocalModelSet() {
      const env = state.payload && state.payload.environment;
      const names = Array.isArray(env && env.localOllamaModels) ? env.localOllamaModels : [];
      return new Set(names.map((n) => String(n || '').trim()).filter(Boolean));
    }

    function getSelectedLocalModelsForInstall() {
      return Array.from(state.modelMap.values())
        .filter((m) => m && m.enabled && String(m.model || '').trim())
        .map((m) => ({
          model: String(m.model || '').trim(),
          flashEnabled: m.flashEnabled !== false,
          thinkingEnabled: Boolean(m.thinkingEnabled)
        }));
    }

    function setInstallStatusLine(text, tone) {
      const ui = ensureUi();
      if (!ui.installStatusLine) return;
      ui.installStatusLine.textContent = String(text || '');
      ui.installStatusLine.classList.remove('ok', 'err');
      if (tone === 'ok') ui.installStatusLine.classList.add('ok');
      if (tone === 'err') ui.installStatusLine.classList.add('err');
    }

    function renderInstallStatus() {
      const ui = ensureUi();
      const visible = state.selectedMode === 'local' || state.selectedMode === 'hybrid';
      if (ui.installBox) ui.installBox.style.display = visible ? '' : 'none';
      if (!visible) return;
      if (state.installing) {
        setInstallStatusLine('正在检测并安装缺失本地模型（首次下载可能较慢，请保持窗口开启）…');
        return;
      }
      const selected = getSelectedLocalModelsForInstall();
      if (!selected.length) {
        setInstallStatusLine('你还没勾选本地模型。不想动脑子就选 qwen3:8b（推荐）或 mistral:7b。');
        return;
      }
      const installed = getInstalledLocalModelSet();
      const missing = selected.filter((m) => !installed.has(m.model));
      if (state.installSummary && Array.isArray(state.installSummary.results)) {
        const s = state.installSummary.summary || {};
        const base = `本次安装结果：新增 ${Number(s.installed || 0)} 个，已存在 ${Number(s.alreadyInstalled || 0)} 个，失败 ${Number(s.failed || 0)} 个。`;
        setInstallStatusLine(base, Number(s.failed || 0) > 0 ? 'err' : 'ok');
        return;
      }
      if (missing.length) {
        const preview = missing.slice(0, 3).map((m) => m.model).join(' / ');
        setInstallStatusLine(`已选 ${selected.length} 个本地模型，其中 ${missing.length} 个未安装：${preview}${missing.length > 3 ? '…' : ''}。完成时会自动下载缺失模型。`);
        return;
      }
      setInstallStatusLine(`已选 ${selected.length} 个本地模型，当前都已安装。`, 'ok');
    }

    function renderChecks() {
      const ui = ensureUi();
      const env = state.payload && state.payload.environment;
      if (!env) {
        ui.checks.innerHTML = '<div class="echomuse-frw-inline-note">检测中…</div>';
        ui.checksNote.textContent = '';
        return;
      }
      const checks = [
        {
          key: '桌面模式',
          ok: Boolean(env.isDesktop),
          value: env.isDesktop ? '当前为桌面模式（Electron）' : '当前非桌面模式（Web）'
        },
        {
          key: 'API Provider',
          ok: Boolean(env.apiProvidersConfigured),
          value: env.apiProvidersConfigured ? '已检测到可用 API Provider 配置' : '未检测到 API Provider（可稍后去“设置 -> 模型”配置）'
        },
        {
          key: '本地 Ollama',
          ok: Boolean(env.localOllamaReachable),
          value: env.localOllamaReachable
            ? `已连接（模型数：${Array.isArray(env.localOllamaModels) ? env.localOllamaModels.length : 0}）`
            : (env.vendorOllamaBundled ? '检测到内置运行时文件，但当前服务未连通' : '未检测到本地运行时（Phase A 后续向导会引导安装）')
        }
      ];
      ui.checks.innerHTML = '';
      checks.forEach((c) => {
        const cls = c.ok ? 'ok' : (c.key === '桌面模式' ? 'warn' : 'no');
        const row = createEl('div', { class: `echomuse-frw-check ${cls}` }, `<div class="k">${c.key}</div><div class="v">${c.value}</div>`);
        ui.checks.appendChild(row);
      });
      ui.checksNote.textContent = '提示：点击“完成并进入应用”后，会按你的选择自动检测本地运行时，并下载缺失模型（首次下载可能较慢）。';
    }

    function renderModeCards() {
      const ui = ensureUi();
      ui.modeGrid.querySelectorAll('[data-mode]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.mode === state.selectedMode);
      });
      ui.localSection.style.display = (state.selectedMode === 'local' || state.selectedMode === 'hybrid') ? '' : 'none';
    }

    function renderRecommendation() {
      const ui = ensureUi();
      const rec = state.payload && state.payload.recommendation;
      if (!rec) {
        ui.recoBadge.textContent = '推荐模式：检测中…';
        ui.recoReason.textContent = '正在检测环境…';
        return;
      }
      const modeLabels = { api: '仅 API', local: '仅本地模型', hybrid: '混合模式' };
      ui.recoBadge.textContent = `推荐模式：${modeLabels[normMode(rec.mode, 'api')] || '仅 API'}`;
      ui.recoReason.textContent = String(rec.reason || '').trim() || '已完成环境检测。';
    }

    function renderModelList() {
      const ui = ensureUi();
      ui.modelList.innerHTML = '';
      const installed = getInstalledLocalModelSet();
      PRESET_LOCAL_MODELS.forEach((preset) => {
        const item = state.modelMap.get(preset.model) || {
          model: preset.model,
          enabled: false,
          flashEnabled: preset.flashDefault !== false,
          thinkingEnabled: Boolean(preset.thinkingDefault)
        };
        state.modelMap.set(preset.model, item);
        const row = createEl('div', { class: 'echomuse-frw-model', dataset: { model: preset.model } });
        const installedTag = installed.has(preset.model)
          ? '<span class="echomuse-frw-model-size" style="border-color:#bbf7d0;color:#166534;background:#f0fdf4">已安装</span>'
          : '<span class="echomuse-frw-model-size" style="border-color:#fed7aa;color:#b45309;background:#fff7ed">未安装</span>';
        row.innerHTML = `
          <div class="echomuse-frw-model-top">
            <label style="display:flex;align-items:center;gap:8px;font-weight:700;color:#0f172a;">
              <input type="checkbox" data-role="enabled" ${item.enabled ? 'checked' : ''}>
              <span class="echomuse-frw-model-name">${preset.model}</span>
            </label>
            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
              ${preset.family ? `<span class="echomuse-frw-model-size">${preset.family}</span>` : ''}
              <span class="echomuse-frw-model-size">${preset.size}</span>
              ${installedTag}
            </div>
          </div>
          <div class="echomuse-frw-model-desc">${preset.desc}</div>
          <div class="echomuse-frw-model-modes">
            <label><input type="checkbox" data-role="flash" ${item.flashEnabled ? 'checked' : ''}> ⚡ Flash</label>
            <label><input type="checkbox" data-role="thinking" ${item.thinkingEnabled ? 'checked' : ''}> 🧠 Thinking</label>
          </div>
        `;
        ui.modelList.appendChild(row);
      });
    }

    function render() {
      renderRecommendation();
      renderChecks();
      renderModeCards();
      renderModelList();
      renderInstallStatus();
      const ui = ensureUi();
      const busy = state.loading || state.installing;
      ui.finishBtn.disabled = busy;
      ui.refreshBtn.disabled = busy;
      ui.useRecoBtn.disabled = busy;
      ui.saveLaterBtn.disabled = busy;
      ui.configProviderBtn.disabled = busy;
      ui.finishBtn.textContent = state.installing ? '正在安装本地模型…' : '完成并进入应用';
    }

    function show() {
      const ui = ensureUi();
      ui.overlay.classList.add('show');
    }

    function hide() {
      const ui = ensureUi();
      ui.overlay.classList.remove('show');
    }

    function buildSubmitPayload(skipRecommended) {
      const mode = normMode(state.selectedMode, 'api');
      let localModels = [];
      if (mode === 'local' || mode === 'hybrid') {
        localModels = Array.from(state.modelMap.values())
          .filter((m) => m && m.enabled)
          .map((m) => ({
            model: String(m.model || ''),
            flashEnabled: m.flashEnabled !== false,
            thinkingEnabled: Boolean(m.thinkingEnabled)
          }))
          .filter((m) => m.model);
        if (!localModels.length && !skipRecommended) {
          const qwen = state.modelMap.get('qwen3:8b');
          if (qwen) {
            localModels.push({ model: 'qwen3:8b', flashEnabled: true, thinkingEnabled: mode === 'hybrid' });
          }
        }
      }
      return {
        runtimeMode: mode,
        localModels,
        wizardVersion: 1
      };
    }

    async function installMissingLocalModels(payload) {
      const mode = normMode(payload && payload.runtimeMode, 'api');
      const localModels = Array.isArray(payload && payload.localModels) ? payload.localModels : [];
      if (!['local', 'hybrid'].includes(mode) || !localModels.length) {
        state.installSummary = null;
        return null;
      }

      state.installing = true;
      state.installSummary = null;
      render();
      setInstallStatusLine('正在检查本地 Ollama 并下载缺失模型，请稍候…');
      setStatus('首启向导：正在安装本地模型（首次下载可能较慢）…');

      try {
        const resp = await call('apiRequest', '/api/setup/wizard-install-local-models', {
          method: 'POST',
          body: JSON.stringify({ localModels }),
          timeoutMs: 6 * 60 * 60 * 1000
        });
        state.installSummary = resp || null;
        try {
          const fresh = await call('apiRequest', '/api/setup/wizard-status', { method: 'GET' });
          if (fresh && typeof fresh === 'object') state.payload = fresh;
        } catch (_) {}
        const sum = resp && resp.summary ? resp.summary : {};
        if (Number(sum.failed || 0) > 0) {
          setInstallStatusLine(`部分模型安装失败：新增 ${sum.installed || 0}，已存在 ${sum.alreadyInstalled || 0}，失败 ${sum.failed || 0}。可稍后在向导重试。`, 'err');
          setStatus('首启向导：本地模型部分安装失败，可稍后重试。');
        } else {
          setInstallStatusLine(`本地模型准备完成：新增 ${sum.installed || 0}，已存在 ${sum.alreadyInstalled || 0}。`, 'ok');
          setStatus('首启向导：本地模型已准备完成。');
        }
        return resp;
      } catch (error) {
        const msg = String(error && (error.message || error) || '安装失败');
        state.installSummary = null;
        setInstallStatusLine(`本地模型自动安装失败：${msg}`, 'err');
        setStatus(`首启向导安装失败：${msg}`);
        throw error;
      } finally {
        state.installing = false;
        render();
      }
    }

    async function saveWizard(skipRecommended) {
      if (state.loading || state.installing) return;
      state.loading = true;
      render();
      try {
        const payload = buildSubmitPayload(Boolean(skipRecommended));
        const resp = await call('apiRequest', '/api/setup/wizard-complete', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        state.payload = {
          ...(state.payload || {}),
          setup: resp && resp.setup ? resp.setup : (state.payload ? state.payload.setup : null)
        };
        if (!skipRecommended) {
          try {
            await installMissingLocalModels(payload);
          } catch (_) {
            // Keep wizard open on install failure so user can read the inline status.
            return;
          }
        }
        setStatus('首次启动向导设置已保存。');
        hide();
        call('refreshServiceStatus');
      } catch (error) {
        const msg = String(error && (error.message || error) || '保存失败');
        setStatus(`首次向导保存失败：${msg}`);
      } finally {
        state.loading = false;
        render();
      }
    }

    async function loadStatus(forceShow) {
      if (state.loading) return;
      state.loading = true;
      render();
      try {
        const payload = await call('apiRequest', '/api/setup/wizard-status', { method: 'GET' });
        state.payload = payload || null;
        const setup = payload && payload.setup ? payload.setup : {};
        initModelSelections(setup);
        const recMode = normMode(payload && payload.recommendation && payload.recommendation.mode, 'api');
        state.selectedMode = normMode(setup && setup.runtimeMode, recMode);
        if (!(setup && setup.firstRunCompleted)) {
          if (!state.openedOnce) {
            applyDefaultModelSelectionForMode(recMode);
          }
          if (forceShow || !state.openedOnce) show();
        }
        state.openedOnce = true;
      } catch (error) {
        setStatus(`首次向导环境检测失败：${error && error.message ? error.message : error}`);
      } finally {
        state.loading = false;
        render();
      }
    }

    async function openWizard(options) {
      const force = !(options && options.force === false);
      await loadStatus(force);
      if (force) show();
    }

    function init() {
      ensureUi();
      if (state.autoCheckDone) return;
      state.autoCheckDone = true;
      loadStatus(false);
    }

    return {
      init,
      openWizard,
      refreshStatus: () => loadStatus(false)
    };
  }

  window.EchoMuseFirstRunSetup = { createController };
})();
