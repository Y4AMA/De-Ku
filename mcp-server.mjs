// de-kaku MCP server — JSON-RPC over stdio (Content-Length framing).
// Tools:
//   dekaku_status      → armed?, learned count, audit count
//   dekaku_toggle       → on|off (flag file .dekaku-active)
//   dekaku_intercepts   → last N audit entries
//   dekaku_learned      → learned fluff patterns
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';

function baseDir() {
  const b = process.env.XDG_CONFIG_HOME
    ? join(process.env.XDG_CONFIG_HOME, 'opencode')
    : join(os.homedir(), '.config', 'opencode');
  return b;
}
const FLAG = join(baseDir(), '.dekaku-active');
const AUDIT = join(baseDir(), 'dekaku-audit.json');
const LEARN = join(baseDir(), 'dekaku-learning.json');

function readJson(p, fallback) {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fallback; }
}
function armed() {
  try { return readFileSync(FLAG, 'utf8').trim() !== 'off'; } catch { return true; }
}

const TOOLS = [
  { name: 'dekaku_status', description: 'Status de-kaku: armed, learned count, audit count', inputSchema: { type: 'object', properties: {} } },
  { name: 'dekaku_toggle', description: 'Arm/disarm (on|off)', inputSchema: { type: 'object', properties: { mode: { type: 'string', enum: ['on', 'off'] } }, required: ['mode'] } },
  { name: 'dekaku_intercepts', description: 'Last N audit entries', inputSchema: { type: 'object', properties: { limit: { type: 'integer' } } } },
  { name: 'dekaku_learned', description: 'Learned fluff patterns', inputSchema: { type: 'object', properties: {} } },
];

async function handleCall(name, args) {
  switch (name) {
    case 'dekaku_status':
      return {
        armed: armed(),
        learned: readJson(LEARN, { patterns: [] }).patterns?.length || 0,
        audit: readJson(AUDIT, []).length || 0,
      };
    case 'dekaku_toggle':
      mkdirSync(baseDir(), { recursive: true });
      writeFileSync(FLAG, args.mode === 'off' ? 'off' : 'on', { mode: 0o600 });
      return { armed: armed() };
    case 'dekaku_intercepts': {
      const arr = readJson(AUDIT, []);
      const limit = Number(args.limit) > 0 ? Number(args.limit) : 20;
      return arr.slice(-limit);
    }
    case 'dekaku_learned':
      return readJson(LEARN, { patterns: [] });
    default:
      throw new Error(`unknown tool: ${name}`);
  }
}

// ---- stdio framing ----
function sendMsg(obj) {
  const body = JSON.stringify(obj);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
}

let buf = '';
function onData(chunk) {
  buf += chunk;
  let idx;
  while ((idx = buf.indexOf('\r\n\r\n')) !== -1) {
    const head = buf.slice(0, idx);
    const m = /Content-Length:\s*(\d+)/i.exec(head);
    if (!m) { buf = buf.slice(idx + 4); continue; }
    const len = parseInt(m[1], 10);
    const start = idx + 4;
    if (buf.length < start + len) return;
    const body = buf.slice(start, start + len);
    buf = buf.slice(start + len);
    let req;
    try { req = JSON.parse(body); } catch { continue; }
    void handle(req);
  }
}

async function handle(req) {
  if (req.method === 'initialize') {
    sendMsg({ jsonrpc: '2.0', id: req.id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'dekaku', version: '2.0.0' } } });
  } else if (req.method === 'tools/list') {
    sendMsg({ jsonrpc: '2.0', id: req.id, result: { tools: TOOLS } });
  } else if (req.method === 'tools/call') {
    try {
      const result = await handleCall(req.params.name, req.params.arguments || {});
      sendMsg({ jsonrpc: '2.0', id: req.id, result: { content: [{ type: 'text', text: JSON.stringify(result) }] } });
    } catch (e) {
      sendMsg({ jsonrpc: '2.0', id: req.id, error: { code: -32603, message: e.message } });
    }
  } else if (req.method === 'notifications/initialized') {
    // no-op
  } else {
    sendMsg({ jsonrpc: '2.0', id: req.id ?? null, error: { code: -32601, message: `method not found: ${req.method}` } });
  }
}
process.stdin.on('data', onData);
