#!/usr/bin/env node
// de-kaku installer — single command, auto-wires OpenCode config (V1+V2)
// and MCP server. Staged copy: files land in tmp dir, checked, then swapped.
import { createHash } from 'node:crypto';
import {
  copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync,
  readdirSync, renameSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const VERSION = '2.0.0';

function configDir() {
  return process.env.OPENCODE_CONFIG_DIR
    || join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'opencode');
}
const CFG = configDir();
const DEST = join(CFG, 'plugins', 'dekaku');

const FILES = ['plugin.js', 'dekaku-patterns.mjs', 'dekaku-recover.mjs', 'mcp-server.mjs'];

function log(msg) { console.log(`[dekaku] ${msg}`); }
function ok(msg) { console.log(`  ✓ ${msg}`); }
function fail(msg) { console.error(`  ✗ ${msg}`); process.exit(1); }

// strip JSONC comments for robust config read
function stripComments(s) {
  let out = '', inStr = false, esc = false, line = false, block = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i], n = s[i + 1];
    if (line) { if (c === '\n') { line = false; out += c; } continue; }
    if (block) { if (c === '*' && n === '/') { block = false; i++; } continue; }
    if (inStr) {
      out += c;
      if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false;
      continue;
    }
    if (c === '/' && n === '/') { line = true; i++; continue; }
    if (c === '/' && n === '*') { block = true; i++; continue; }
    if (c === '"') inStr = true;
    out += c;
  }
  return out;
}

function readConfig() {
  const p = join(CFG, 'opencode.jsonc');
  if (!existsSync(p)) return {};
  try { return JSON.parse(stripComments(readFileSync(p, 'utf8'))); } catch { return {}; }
}
function writeConfig(cfg) {
  const p = join(CFG, 'opencode.jsonc');
  mkdirSync(CFG, { recursive: true });
  writeFileSync(p, JSON.stringify(cfg, null, 2), { mode: 0o644 });
}

function wireConfig() {
  const cfg = readConfig();
  const pluginPath = join(DEST, 'plugin.js');
  let changed = false;

  // V2 style: plugins: [dir]
  if (!Array.isArray(cfg.plugins) || !cfg.plugins.some(x => String(x).includes('dekaku'))) {
    cfg.plugins = [...(cfg.plugins || []), DEST];
    changed = true;
  }
  // V1 style: plugin: [file]
  if (!Array.isArray(cfg.plugin) || !cfg.plugin.some(x => String(x).includes('dekaku'))) {
    cfg.plugin = [...(cfg.plugin || []), pluginPath];
    changed = true;
  }
  // MCP: mcp.servers (V2) + mcp (V1)
  cfg.mcp = cfg.mcp || {};
  cfg.mcp.servers = cfg.mcp.servers || {};
  if (!cfg.mcp.servers.dekaku) {
    cfg.mcp.servers.dekaku = { command: 'node', args: [join(DEST, 'mcp-server.mjs')] };
    changed = true;
  }
  cfg.mcp.dekaku = cfg.mcp.dekaku || { command: 'node', args: [join(DEST, 'mcp-server.mjs')] };

  if (changed) writeConfig(cfg);
  return changed;
}

function install() {
  log(`target config: ${CFG}`);
  mkdirSync(DEST, { recursive: true });

  // staged copy
  const stage = mkdtempSync(join(CFG, 'plugins', '.dekaku-stage-'));
  try {
    for (const f of FILES) {
      const src = join(HERE, f);
      if (!existsSync(src)) fail(`missing source: ${f}`);
      const dst = join(stage, f);
      copyFileSync(src, dst);
      statSync(dst);
      // sanity: non-empty
      if (statSync(dst).size === 0) fail(`empty file: ${f}`);
    }
    // swap: clear old, move staged in
    for (const f of FILES) {
      const old = join(DEST, f);
      if (existsSync(old)) rmSync(old);
      renameSync(join(stage, f), old);
    }
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }

  const wired = wireConfig();
  ok('files copied → ' + DEST);
  ok(wired ? 'config wired (plugin + MCP)' : 'config already wired');
  log('restart OpenCode. MCP tool: dekaku_status / dekaku_toggle / dekaku_intercepts / dekaku_learned');
  log('toggle: /dekaku off | on (atau file ~/.config/opencode/.dekaku-active)');
  log('audit: ' + join(CFG, 'dekaku-audit.json'));
  log('learned: ' + join(CFG, 'dekaku-learning.json'));
}

function doctor() {
  log(`checking ${CFG}`);
  for (const f of FILES) {
    const p = join(DEST, f);
    ok(existsSync(p) ? `${f} present` : `${f} MISSING`);
  }
  const cfg = readConfig();
  const hasPlugin = cfg.plugins?.some(x => String(x).includes('dekaku')) || cfg.plugin?.some(x => String(x).includes('dekaku'));
  const hasMcp = !!cfg.mcp?.servers?.dekaku;
  ok(hasPlugin ? 'plugin wired' : 'plugin NOT wired');
  ok(hasMcp ? 'mcp wired' : 'mcp NOT wired');
}

const args = process.argv.slice(2);
if (args.includes('--doctor')) {
  doctor();
} else {
  install();
}
