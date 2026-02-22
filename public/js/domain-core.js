(function () {
  'use strict';

  const utils = window.EchoMuseUtils || {};
  const toolName = typeof utils.toolName === 'function'
    ? utils.toolName
    : (() => '工具');

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

  function sortSessions(list) {
    return (Array.isArray(list) ? list : []).slice().sort((a, b) => {
      const af = a && a.favorite ? 1 : 0;
      const bf = b && b.favorite ? 1 : 0;
      if (af !== bf) return bf - af;
      return Number(b?.updatedAt || 0) - Number(a?.updatedAt || 0);
    });
  }

  function getSessionPreview(session) {
    if (!session || !Array.isArray(session.messages) || !session.messages.length) return '暂无消息';
    const last = session.messages[session.messages.length - 1];
    if (last && last.kind === 'tool') {
      const statusText = last.status === 'done' ? '已完成' : last.status === 'running' ? '进行中' : '失败';
      return `${toolName(last.tool)}：${statusText}`;
    }
    return String((last && last.content) || '').replace(/\s+/g, ' ').slice(0, 44) || '暂无消息';
  }

  function isValidAvatar(a) {
    return a && typeof a.id === 'string' && typeof a.name === 'string';
  }

  function derivePromptMode(customPrompt, memoryText) {
    const hasPrompt = Boolean(customPrompt && customPrompt.trim());
    const hasMemory = Boolean(memoryText && memoryText.trim());
    if (hasPrompt && hasMemory) return 'both';
    if (hasMemory) return 'memory';
    return 'custom';
  }

  function promptModeLabel(mode) {
    if (mode === 'both') return '混合';
    if (mode === 'memory') return '记忆';
    return '自定义';
  }

  function parsePngCharaData(buf) {
    const view = new DataView(buf);
    let offset = 8;
    while (offset < buf.byteLength) {
      const len = view.getUint32(offset);
      const typeCode = String.fromCharCode(
        view.getUint8(offset + 4),
        view.getUint8(offset + 5),
        view.getUint8(offset + 6),
        view.getUint8(offset + 7)
      );
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
      offset += 12 + len;
    }
    return null;
  }

  function normalizeTavernCard(raw) {
    const d = (raw && raw.spec === 'chara_card_v2' && raw.data) ? raw.data : raw;
    if (!d || !d.name) return null;
    const parts = [];
    if (d.description) parts.push(d.description.trim());
    if (d.personality) parts.push(`性格：${d.personality.trim()}`);
    if (d.scenario) parts.push(`场景：${d.scenario.trim()}`);
    if (d.mes_example) parts.push(`对话示例：\n${d.mes_example.trim()}`);
    return {
      name: d.name,
      customPrompt: parts.join('\n\n'),
      firstMessage: d.first_mes || ''
    };
  }

  window.EchoMuseDomainCore = Object.freeze({
    isValidSession,
    createSessionObject,
    sortSessions,
    getSessionPreview,
    isValidAvatar,
    derivePromptMode,
    promptModeLabel,
    parsePngCharaData,
    normalizeTavernCard
  });
})();
