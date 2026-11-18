// MCP smoke test: spawn mcp-server.mjs, speak Content-Length framing,
// verify initialize / tools/list / dekaku_status / dekaku_toggle.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert';

const HERE = dirname(fileURLToPath(import.meta.url));
const server = spawn('node', [join(HERE, 'mcp-server.mjs')], {
  env: { ...process.env, XDG_CONFIG_HOME: '/tmp/dekaku-test-home' },
  stdio: ['pipe', 'pipe', 'inherit'],
});

let outBuf = Buffer.alloc(0);
const queue = [];
function frame(obj) {
  const b = Buffer.from(JSON.stringify(obj));
  return Buffer.from(`Content-Length: ${b.length}\r\n\r\n`) + b;
}
function nextResponse() {
  return new Promise((resolve) => queue.push(resolve));
}
server.stdout.on('data', (c) => {
  outBuf = Buffer.concat([outBuf, c]);
  while (true) {
    const idx = outBuf.indexOf('\r\n\r\n');
    if (idx === -1) return;
    const head = outBuf.slice(0, idx).toString();
    const m = /Content-Length:\s*(\d+)/i.exec(head);
    if (!m) { outBuf = outBuf.slice(idx + 4); continue; }
    const len = parseInt(m[1], 10);
    if (outBuf.length < idx + 4 + len) return;
    const body = outBuf.slice(idx + 4, idx + 4 + len).toString();
    outBuf = outBuf.slice(idx + 4 + len);
    const resolve = queue.shift();
    if (resolve) resolve(JSON.parse(body));
  }
});
function send(obj) {
  const p = nextResponse();
  server.stdin.write(frame(obj));
  return p;
}

const init = await send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
assert.equal(init.result.serverInfo.name, 'dekaku');

const list = await send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
const names = list.result.tools.map((t) => t.name);
assert.ok(names.includes('dekaku_status'));
assert.ok(names.includes('dekaku_toggle'));
assert.ok(names.includes('dekaku_intercepts'));
assert.ok(names.includes('dekaku_learned'));

const status1 = await send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'dekaku_status', arguments: {} } });
const s1 = JSON.parse(status1.result.content[0].text);
assert.equal(s1.armed, true);

const toggled = await send({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'dekaku_toggle', arguments: { mode: 'off' } } });
assert.equal(JSON.parse(toggled.result.content[0].text).armed, false);

const status2 = await send({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'dekaku_status', arguments: {} } });
assert.equal(JSON.parse(status2.result.content[0].text).armed, false);

server.kill();
console.log('MCP smoke OK: initialize, tools/list, status, toggle');
