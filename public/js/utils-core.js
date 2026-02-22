(function () {
  'use strict';

  function countQuestionTotal(bank) {
    const a = Array.isArray(bank?.mcq) ? bank.mcq.length : 0;
    const b = Array.isArray(bank?.blank) ? bank.blank.length : 0;
    const c = Array.isArray(bank?.short_answer) ? bank.short_answer.length : 0;
    const d = Array.isArray(bank?.comprehensive) ? bank.comprehensive.length : 0;
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

  window.EchoMuseUtils = Object.freeze({
    countQuestionTotal,
    toolName,
    formatTime,
    escapeHtml,
    countChineseChars,
    fallbackCopy,
    csvEscape,
    timestamp,
    downloadBlob
  });
})();
