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

## Instalasi

```bash
bash install.sh
```

Lalu tambahkan di `~/.config/opencode/opencode.jsonc`:

```jsonc
{
  "plugin": ["~/.config/opencode/plugins/dekaku/plugin.js"]
}
```

Restart OpenCode.

## Tes

```bash
node test-dekaku.mjs
```

10 kasus: strip EN/ID, hard refusal lestari, code fence terlindungi, tanpa koma menggantung.

## Struktur

- `plugin.js` — hook system.transform / messages.transform / text.complete + L3 recovery
- `dekaku-patterns.mjs` — bank pola bobot 1–2 (EN+ID)
- `dekaku-recover.mjs` — L3 guard + L4 self-learning
- `test-dekaku.mjs` — self-check
- `install.sh` — installer
