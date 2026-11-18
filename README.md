# de-kaku

OpenCode plugin. Penghapus basa-basi (fluff-killer) — **bukan** pembunuh penolakan (refusal-killer).

## Apa yang dilakukan

- **Tone**: jawaban langsung + santai + hangat (mode flirty). Tanpa "Tentu!", "Dengan senang hati", "Sebagai AI".
- **Context strip / output strip**: menghapus pola bobot 1–2 saja — hedging, sycophancy, redirect-menu, disclaimer, preamble AI, permintaan maaf.
- **Audit log**: semua yang dihapus tercatat di `~/.config/opencode/dekaku-audit.json` (cap 1000 entri).

## Apa yang TIDAK dilakukan

- Tidak menyentuh penolakan asli (bobot 4–5): "I cannot…", "itu melanggar…", "This is dangerous…" — tetap utuh.
- Tidak ada auto-continue, tidak ada gateway, tidak ada license, tidak ada watermark, tidak ada phone-home.

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

- `plugin.js` — hook system.transform / messages.transform / text.complete
- `dekaku-patterns.mjs` — bank pola bobot 1–2 (EN+ID)
- `test-dekaku.mjs` — self-check
- `install.sh` — installer
