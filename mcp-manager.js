'use strict';

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const connections = new Map();

async function connectServer(config) {
  const existing = connections.get(config.id);
  if (existing && existing.status === 'connected') return existing.tools;

  const transport = new StdioClientTransport({
    command: config.command,
    args: config.args || [],
    env: { ...process.env, ...(config.env || {}) }
  });

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
