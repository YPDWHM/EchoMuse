(function () {
  'use strict';

  function buildSessionListHtml(params) {
    const {
      sessions,
      activeId,
      search,
      sortSessions,
      getAvatarById,
      escapeHtml,
      formatTime,
      getSessionPreview
    } = params;

    const sorted = sortSessions(Array.isArray(sessions) ? sessions : []);
    const keyword = String(search || '').trim().toLowerCase();
    const filtered = sorted.filter((session) => {
      if (!keyword) return true;
      const preview = getSessionPreview(session).toLowerCase();
      return String(session.title || '').toLowerCase().includes(keyword) || preview.includes(keyword);
    });

    if (!filtered.length) {
      return '<div class="muted">没有匹配会话</div>';
    }

    return filtered.map((session) => {
      const active = session.id === activeId ? 'active' : '';
      const favorite = session.favorite ? 'on' : '';
      const boundAvatar = session.avatarId ? getAvatarById(session.avatarId) : null;
      const avatarTag = boundAvatar ? `<span class="session-avatar-tag">🎭 ${escapeHtml(boundAvatar.name)}</span>` : '';
      return `
      <div class="session-item ${active}" data-action="switch-session" data-sid="${session.id}" role="button" tabindex="0">
        <div class="session-info">
          <div class="session-title-row">
            <span class="session-title">${escapeHtml(session.title)}${avatarTag}</span>
            <span class="session-time">${formatTime(session.updatedAt)}</span>
          </div>
          <div class="session-preview">${escapeHtml(getSessionPreview(session))}</div>
        </div>
        <div class="session-actions-hover">
          <button class="session-fav ${favorite}" data-action="toggle-fav" data-sid="${session.id}" type="button" title="Favorite">${session.favorite ? '★' : '☆'}</button>
          <button class="session-fav del-btn" data-action="delete-session" data-sid="${session.id}" type="button" title="Delete">✕</button>
        </div>
      </div>
    `;
    }).join('');
  }

  function renderMessageMetaHtml(params) {
    const {
      message,
      role,
      settings,
      formatTime,
      getChatModelName,
      estimateTokenUsage,
      escapeHtml
    } = params;

    const parts = [];
    if (settings.chatShowTimestamp) {
      parts.push(formatTime(message.createdAt));
    }
    if (settings.chatShowModel && role === 'assistant') {
      parts.push(message.modelName || getChatModelName());
    }
    if (settings.chatShowCharCount) {
      parts.push(`${String(message.content || '').length} chars`);
    }
    if (settings.chatShowTokenUsage) {
      parts.push(`~${estimateTokenUsage(message.content || '')} tok`);
    }
    if (settings.chatShowFirstTokenLatency && role === 'assistant' && Number.isFinite(message.firstTokenLatencyMs)) {
      parts.push(`TTFT ${Math.max(0, Math.round(message.firstTokenLatencyMs))}ms`);
    }
    if (!parts.length) return '';
    return `<div class="msg-meta">${escapeHtml(parts.join(' · '))}</div>`;
  }

  function renderToolCardHtml(params) {
    const {
      message,
      stateUi,
      getActiveSession,
      getArtifactTabs,
      renderPaperArtifact,
      renderReviewArtifact,
      escapeHtml,
      toolName,
      formatTime
    } = params;

    const statusClass = message.status || 'running';
    const statusText = statusClass === 'done'
      ? 'Done'
      : statusClass === 'error'
        ? 'Error'
        : 'Running';

    let action = '';
    let inlineArtifact = '';
    if (statusClass === 'done' && message.artifactId) {
      const expanded = stateUi.expandedArtifacts && stateUi.expandedArtifacts[message.artifactId];
      action = `<button class="btn" data-action="toggle-inline-artifact" data-artifact-id="${message.artifactId}" type="button">${expanded ? '收起产物' : '查看产物'}</button>`;
      if (expanded) {
        const session = getActiveSession();
        const artifact = session && session.artifacts.find((a) => a.id === message.artifactId);
        if (artifact) {
          const tab = (stateUi.inlineArtifactTabs && stateUi.inlineArtifactTabs[message.artifactId]) || 'overview';
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

  window.EchoMuseChatRenderCore = Object.freeze({
    buildSessionListHtml,
    renderMessageMetaHtml,
    renderToolCardHtml
  });
})();
