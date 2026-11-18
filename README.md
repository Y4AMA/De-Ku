# de-kaku

OpenCode plugin. Penghapus basa-basi (fluff-killer) — **bukan** pembunuh penolakan (refusal-killer).

## Apa yang dilakukan

Workflow mirror `Suppresor Refusall` — 4 lapis, tapi scoped fluff:

- **L1 — Tone inject**: jawaban langsung + santai + hangat (mode flirty). Tanpa "Tentu!", "Dengan senang hati", "Sebagai AI".
- **L2 — Context strip / output strip**: menghapus pola bobot 1–2 saja — hedging, sycophancy, redirect-menu, disclaimer, preamble AI, permintaan maaf. Bobot 3+ tidak ada di bank.
- **L3 — Auto-continue (recovery)**: kalau output dominan basa-basi, plugin mengirim prompt sintetik agar model menjawab ulang secara langsung. Guard keras: recovery **tidak pernah** dipicu jika ada tanda penolakan asli.
- **L4 — Self-learning**: pola basa-basi baru yang tertangkap disimpan ke `dekaku-learning.json` dan dipakai untuk strip berikutnya.
- **Audit log**: semua yang dihapus tercatat di `~/.config/opencode/dekaku-audit.json` (cap 1000 entri).

## Apa yang TIDAK dilakukan

- Tidak menyentuh penolakan asli (bobot 4–5): "I cannot…", "itu melanggar…", "This is dangerous…" — tetap utuh.
- Auto-continue tidak pernah memaksa deliverable di atas penolakan asli — guard `HARD_REFUSAL_RE` memblokirnya.
- Tidak ada gateway, tidak ada license, tidak ada watermark, tidak ada phone-home.

## Instalasi — satu perintah

```bash
bash install.sh
```

Installer akan:
- menyalin `plugin.js`, `dekaku-patterns.mjs`, `dekaku-recover.mjs`, `mcp-server.mjs` ke `~/.config/opencode/plugins/dekaku/`
- otomatis menulis `opencode.jsonc`: entri `plugin` (V1) + `plugins` (V2) + `mcp.servers.dekaku`
- idempotent: jalankan ulang aman; `node install.mjs --doctor` untuk cek

Restart OpenCode. Tidak ada langkah manual.

## UI/UX — theme ungu 🟣

Theme **dekaku-purple** (dark purple, bukan merah Tiki) otomatis terinstall dan aktif saat install:

- `themes/dekaku-purple.json` — background `#120a1e`, primary `#9b6dff`, secondary `#c9a8ff`
- Config `"theme": "dekaku-purple"` ditulis installer
- Ganti via MCP: `dekaku_theme` → `{ theme: "dekaku-purple" }` atau nama lain
- Restore: `{ theme: "default" }`

`opencode mcp list` → `dekaku` connected. Tools:

| Tool | Fungsi |
|---|---|
| `dekaku_status` | armed? + jumlah learned + jumlah audit |
| `dekaku_toggle` | on/off (tulis `.dekaku-active`) |
| `dekaku_intercepts` | N entri audit terakhir |
| `dekaku_learned` | daftar pola yang dipelajari |
| `dekaku_theme` | ganti theme (default: `dekaku-purple`) |

Toggle manual: `echo off > ~/.config/opencode/.dekaku-active`.

## Agen

Tidak ada agent terpisah. Kepribadian = **L1 tone inject** di system prompt — satu sumber kebenaran, tanpa file agent yang bisa konflik. Kalau mau style lain, ubah `TONE_DOCTRINE` di `plugin.js`.

## Tes

```bash
node test-dekaku.mjs
```

10 kasus: strip EN/ID, hard refusal lestari, code fence terlindungi, tanpa koma menggantung.

## Struktur

- `plugin.js` — hook system.transform / messages.transform / text.complete + L3 recovery + toggle flag
- `dekaku-patterns.mjs` — bank pola bobot 1–2 (EN+ID)
- `dekaku-recover.mjs` — L3 guard + L4 self-learning
- `mcp-server.mjs` — MCP stdio (status/toggle/intercepts/learned/theme)
- `themes/dekaku-purple.json` — theme ungu
- `install.mjs` / `install.sh` — installer otomatis (staged copy + wire config + theme)
- `test-dekaku.mjs`, `test-mcp.mjs` — self-check
- `README.md` — ini
