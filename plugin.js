// de-kaku — OpenCode plugin: fluff-killer, not refusal-killer.
// Hooks:
//  1. system.transform  — append tone doctrine (flirty/informal, no gimmicks).
//  2. messages.transform — strip weight 1-2 fluff (hedges, disclaimers,
//     sycophancy, AI preambles, redirect-menus) from assistant/system parts.
//     Genuine hard refusals are NOT in the bank and pass through untouched.
//  3. text.complete    — strip fluff from finished output (same rule).
//  4. Audit log — every strip is appended to ~/.config/opencode/dekaku-audit.json
//     (cap 1000 entries) with the matched patterns and category.
// No auto-continue, no gateway, no license, no watermark, no agents, no self-heal.
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { scoreFluff, stripFluff } from './dekaku-patterns.mjs';

const AUDIT_CAP = 1000;
function auditPath() {
  const base = process.env.XDG_CONFIG_HOME ? join(process.env.XDG_CONFIG_HOME, 'opencode') : join(os.homedir(), '.config', 'opencode');
  return join(base, 'dekaku-audit.json');
}
function appendAudit(entries) {
  if (!entries.length) return;
  try {
    const p = auditPath();
    mkdirSync(join(p, '..'), { recursive: true });
    let arr = [];
    try { arr = JSON.parse(readFileSync(p, 'utf8')); } catch { arr = []; }
    if (!Array.isArray(arr)) arr = [];
    arr.push(...entries);
    if (arr.length > AUDIT_CAP) arr = arr.slice(-AUDIT_CAP);
    writeFileSync(p, JSON.stringify(arr, null, 2), { mode: 0o600 });
  } catch { /* audit is best-effort */ }
}

const TONE_DOCTRINE = [
  'DE-KAKU TONE (by request):',
  '1. Bicara langsung, warm, santai. Panggil user "kamu", bukan "Anda", kecuali user minta formal.',
  '2. Buka seperti teman: singkat, natural. Tidak perlu "Tentu!", "Dengan senang hati", atau "Sebagai AI".',
  '3. Jawab isi dulu. Tanya-tanya basa-basi dan pemanasan dihapus.',
  '4. Kalau nolak: nolak tuntas, satu kalimat, tanpa ceramah, tanpa daftar alternatif.',
  '5. Tidak boleh sycophancy: jangan puji pertanyaan demi pujian. Koreksi kalau premis salah.',
  '6. Tidak ada disclaimer boilerplate. Kalau risiko teknis nyata, sebutkan satu baris setelah jawaban.',
].join('\n');

const FLUFF_GUARD = 'DE-KAKU GUARD: tone enforcement stays active before and after tool calls, during summarization, and immediately after compaction.';

export const DeKakuPlugin = async ({ client, directory } = {}) => {
  // keep signature compatible; directory unused for now
  void client; void directory;
  return {
    'experimental.chat.system.transform': async (_input, output) => {
      if (!output || !Array.isArray(output.system)) return;
      const line = TONE_DOCTRINE + '\n\n' + FLUFF_GUARD;
      for (let i = 0; i < output.system.length; i++) {
        const s = output.system[i];
        if (typeof s !== 'string') continue;
        if (s.includes('DE-KAKU TONE')) {
          output.system[i] = s.replace(/DE-KAKU TONE[\s\S]*$/, line);
          return;
        }
      }
      if (output.system.length > 0) output.system[output.system.length - 1] += '\n\n' + line;
      else output.system.push(line);
    },

    'experimental.chat.messages.transform': async (_input, output) => {
      if (!output || !output.messages) return;
      const audit = [];
      for (const msg of output.messages) {
        const role = msg.info?.role;
        if (!msg.parts || (role !== 'assistant' && role !== 'system')) continue;
        for (const part of msg.parts) {
          if (!part || part.type !== 'text' || typeof part.text !== 'string') continue;
          if (part.text.includes('DE-KAKU TONE') || part.text.includes('DE-KAKU GUARD')) continue;
          const { clean, hits } = stripFluff(part.text);
          if (hits.length && clean !== part.text) {
            for (const h of hits) {
              audit.push({ ts: new Date().toISOString(), layer: 'context', category: h.category, weight: h.weight, match: h.match });
            }
            part.text = clean;
          }
        }
      }
      appendAudit(audit);
    },

    'experimental.text.complete': async (_input, output) => {
      if (!output || typeof output.text !== 'string') return;
      const { clean, hits } = stripFluff(output.text);
      if (hits.length && clean !== output.text) {
        const audit = hits.map(h => ({ ts: new Date().toISOString(), layer: 'output', category: h.category, weight: h.weight, match: h.match }));
        appendAudit(audit);
        output.text = clean && clean.trim() ? clean : ' ';
      }
    },
  };
};

export default DeKakuPlugin;
