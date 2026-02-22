'use strict';

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const connections = new Map();

let _sseClientTransport = null;
let _streamableHttpClientTransport = null;
let _remoteTransportLoadTried = false;

function loadRemoteTransportClasses() {
  if (_remoteTransportLoadTried) {
    return {
      SSEClientTransport: _sseClientTransport,
      StreamableHTTPClientTransport: _streamableHttpClientTransport
    };
  }
  _remoteTransportLoadTried = true;

  try {
    const mod = require('@modelcontextprotocol/sdk/client/sse.js');
    _sseClientTransport = mod.SSEClientTransport || mod.default || null;
  } catch (_) {}

  try {
    const mod = require('@modelcontextprotocol/sdk/client/streamableHttp.js');
    _streamableHttpClientTransport = mod.StreamableHTTPClientTransport || mod.default || null;
  } catch (_) {}

  return {
    SSEClientTransport: _sseClientTransport,
    StreamableHTTPClientTransport: _streamableHttpClientTransport
  };
}

function normalizeRemoteType(config) {
  const raw = String(config?.type || config?.transport || 'stdio').toLowerCase();
  if (raw.includes('sse')) return 'sse';
  if (raw.includes('http')) return 'http';
  return 'stdio';
}

function normalizeHeaders(headers) {
  if (!headers) return {};
  if (Array.isArray(headers)) {
    const out = {};
    for (const item of headers) {
      const s = String(item || '');
      const idx = s.indexOf(':');
      if (idx > 0) out[s.slice(0, idx).trim()] = s.slice(idx + 1).trim();
    }
    return out;
  }
  if (typeof headers === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(headers)) {
      if (!k) continue;
      out[String(k)] = String(v ?? '');
    }
    return out;
  }
  if (typeof headers === 'string') {
    const out = {};
    String(headers).split(/\r?\n/).forEach((line) => {
      const s = line.trim();
      if (!s) return;
      const idx = s.indexOf(':');
      if (idx > 0) out[s.slice(0, idx).trim()] = s.slice(idx + 1).trim();
    });
    return out;
  }
  return {};
}

function createRemoteTransport(config) {
  const type = normalizeRemoteType(config);
  const urlRaw = String(config?.url || '').trim();
  if (!urlRaw) throw new Error('Remote MCP requires url');
  const url = new URL(urlRaw);
  const headers = normalizeHeaders(config?.headers);
  const { SSEClientTransport, StreamableHTTPClientTransport } = loadRemoteTransportClasses();

  if (type === 'sse') {
    if (!SSEClientTransport) {
      throw new Error('SSE transport is not available in current MCP SDK build');
    }
    const attempts = [
      () => new SSEClientTransport(url, { requestInit: { headers } }),
      () => new SSEClientTransport(url, { headers }),
      () => new SSEClientTransport(url)
    ];
    for (const fn of attempts) {
      try { return fn(); } catch (_) {}
    }
    throw new Error('Failed to initialize SSE MCP transport');
  }

  if (!StreamableHTTPClientTransport) {
    throw new Error('HTTP transport is not available in current MCP SDK build');
  }
  const attempts = [
    () => new StreamableHTTPClientTransport(url, { requestInit: { headers } }),
    () => new StreamableHTTPClientTransport(url, { headers }),
    () => new StreamableHTTPClientTransport(url)
  ];
  for (const fn of attempts) {
    try { return fn(); } catch (_) {}
  }
  throw new Error('Failed to initialize HTTP MCP transport');
}

async function connectServer(config) {
  const existing = connections.get(config.id);
  if (existing && existing.status === 'connected') return existing.tools;

  const transportType = normalizeRemoteType(config);
  const transport = transportType === 'stdio'
    ? new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env: { ...process.env, ...(config.env || {}) }
    })
    : createRemoteTransport(config);

  const client = new Client({ name: 'echomuse', version: '1.0.0' });
  await client.connect(transport);

  let tools = [];
  try {
    const result = await client.listTools();
    tools = result.tools || [];
  } catch (_) {}

  const entry = {
    client,
    transport,
    tools,
    config,
    status: 'connected',
    lastUsed: Date.now(),
    idleTimer: null
  };
  resetIdleTimer(entry);
  connections.set(config.id, entry);
  return tools;
}

async function disconnectServer(id) {
  const entry = connections.get(id);
  if (!entry) return;
  clearTimeout(entry.idleTimer);
  entry.status = 'disconnected';
  try { await entry.client.close(); } catch (_) {}
  connections.delete(id);
}

function resetIdleTimer(entry) {
  clearTimeout(entry.idleTimer);
  entry.idleTimer = setTimeout(() => disconnectServer(entry.config.id), IDLE_TIMEOUT_MS);
}

async function ensureConnected(config) {
  const entry = connections.get(config.id);
  if (entry && entry.status === 'connected') {
    entry.lastUsed = Date.now();
    resetIdleTimer(entry);
    return entry;
  }
  await connectServer(config);
  return connections.get(config.id);
}

async function ensureAllConnected(configs) {
  const results = [];
  for (const cfg of configs) {
    try {
      const entry = await ensureConnected(cfg);
      if (entry) results.push(entry);
    } catch (err) {
      console.error(`[mcp] Failed to connect ${cfg.name || cfg.id}: ${err.message}`);
    }
  }
  return getAllConnectedTools();
}

function getAllConnectedTools() {
  const all = [];
  for (const [serverId, entry] of connections) {
    if (entry.status !== 'connected') continue;
    for (const tool of entry.tools) {
      all.push({
        name: tool.name,
        description: tool.description || '',
        inputSchema: tool.inputSchema || { type: 'object', properties: {} },
        serverId,
        serverName: entry.config.name || serverId
      });
    }
  }
  return all;
}

function findToolServer(toolName) {
  for (const [serverId, entry] of connections) {
    if (entry.status !== 'connected') continue;
    if (entry.tools.some(t => t.name === toolName)) return serverId;
  }
  return null;
}

async function callTool(toolName, args) {
  const serverId = findToolServer(toolName);
  if (!serverId) throw new Error(`No MCP server provides tool: ${toolName}`);
  const entry = connections.get(serverId);
  entry.lastUsed = Date.now();
  resetIdleTimer(entry);
  const result = await entry.client.callTool({ name: toolName, arguments: args || {} });
  const text = (result.content || [])
    .filter(c => c.type === 'text')
    .map(c => c.text)
    .join('\n');
  return { text, isError: Boolean(result.isError) };
}

function getStatus(id) {
  const entry = connections.get(id);
  if (!entry) return 'disconnected';
  return entry.status;
}

async function disconnectAll() {
  const ids = [...connections.keys()];
  for (const id of ids) {
    await disconnectServer(id);
  }
}

module.exports = {
  connectServer,
  disconnectServer,
  disconnectAll,
  ensureConnected,
  ensureAllConnected,
  callTool,
  getAllConnectedTools,
  getStatus
};
