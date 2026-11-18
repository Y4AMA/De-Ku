// de-kaku — recovery + self-learning (L3/L4), mirroring Suppresor Refusall's
// workflow but scoped strictly to fluff:
//   L3 auto-continue fires only when the output had fluff AND no hard-refusal
//      marker anywhere — genuine refusals are never chased.
//   L4 self-learning records matched fluff phrases for future preemptive strips.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { scoreFluff } from './dekaku-patterns.mjs';

export const RECOVERY_MARKER = '[[DEKAKU-RECOVERY]]';

const LEARN_CAP = 200;

// Gate: hard-refusal presence disables recovery. This is a guard for the
// auto-continue trigger, not a strip pattern — nothing here is ever removed.
export const HARD_REFUSAL_RE = /(i\s+(?:cannot|can'?t|won'?t|refuse|decline|am\s+unable|must\s+decline)|i(?:'m| am)\s+not\s+(?:comfortable|able|going\s+to)|i\s+will\s+not\s+(?:help|assist|do|write)|tidak\s+(?:bisa|dapat|mau|boleh)|\btidak\s+bisa\s+membantu|menolak|melanggar|not\s+allowed|not\s+permitted|dangerous|harmful|violates|outside\s+my\s+scope|ini\s+berbahaya|melanggar\s+kebijakan)/i;

export function shouldRecover(text) {
  if (!text || typeof text !== 'string') return false;
  if (HARD_REFUSAL_RE.test(text)) return false;
  return scoreFluff(text).score > 0;
}

function baseDir() {
  const b = process.env.XDG_CONFIG_HOME
    ? join(process.env.XDG_CONFIG_HOME, 'opencode')
    : join(os.homedir(), '.config', 'opencode');
  return b;
}

export function learningPath() {
  return join(baseDir(), 'dekaku-learning.json');
}

export function loadLearned() {
  try {
    const d = JSON.parse(readFileSync(learningPath(), 'utf8'));
    return Array.isArray(d.patterns) ? d.patterns : [];
  } catch {
    return [];
  }
}

export function learnFromHits(hits) {
  const p = learningPath();
  const list = loadLearned();
  let added = 0;
  for (const h of hits) {
    const m = String(h.match || '').trim();
    if (m.length >= 4 && m.length <= 80 && !list.includes(m)) {
      list.push(m);
      added++;
    }
  }
  if (!added) return 0;
  const trimmed = list.length > LEARN_CAP ? list.slice(-LEARN_CAP) : list;
  try {
    mkdirSync(join(p, '..'), { recursive: true });
    writeFileSync(p, JSON.stringify({ patterns: trimmed, updated: new Date().toISOString() }, null, 2), { mode: 0o600 });
  } catch {
    /* best-effort */
  }
  return added;
}
