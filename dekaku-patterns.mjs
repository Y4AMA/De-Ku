// de-kaku — fluff-killer, not refusal-killer
// Strips weight 1-2 patterns only: hedging, redirect-menus, disclaimers,
// sycophancy, AI preambles, throat-clearing. Genuine hard refusals pass through
// untouched. Bilingual EN+ID. Flirty tone.

// Weight tiers kept from a Suppresor-style bank, but ONLY the low-weight ones:
//  2 = disclaimer / caution framing
//  1 = hedge / softening / sycophancy / redirect-menu / AI preamble
// Weight 3+ (capability denial, policy, identity, hard refusal) are NOT in here —
// they are genuine refusals and stay in the output.

export const PATTERN_BANK = [
  // ---- AI PREAMBLE / IDENTITY FILLER (1) ----
  // Anchored to sentence start so substantive tails are never eaten.
  { weight: 1, category: 'preamble', re: /\b(?:(?:^|[.!?]\s+|[\r\n]+)as an? (?:ai|a\.?i\.?|language model|llm|assistant|chatbot|virtual assistant)\b)/gi },
  { weight: 1, category: 'preamble', re: /\b(?:(?:^|[.!?]\s+|[\r\n]+)i(?:'m| am) (?:just |only )?(?:an? )?(?:ai|language model|assistant|bot|program)\b)/gi },
  { weight: 1, category: 'preamble', re: /\b(?:(?:^|[.!?]\s+|[\r\n]+)(?:saya|aku) (?:adalah|hanya|bukan) (?:sebuah )?(?:ai|model bahasa|asisten|bot|program)\b)/gi },
  { weight: 1, category: 'preamble', re: /\b(?:(?:^|[.!?]\s+|[\r\n]+)sebagai (?:ai|model bahasa|asisten|chatbot|bot|virtual assistant)\b)/gi },
  { weight: 1, category: 'preamble', re: /\bi (?:do not|don'?t) have (?:feelings|emotions|personal (?:opinions|experiences))\b/gi },

  // ---- SYCOPHANCY / THROAT-CLEARING (1) ----
  { weight: 1, category: 'sycophancy', re: /\bi(?:'m| am) (?:happy|glad|excited|delighted) to help\b[^.!?]*/gi },
  { weight: 1, category: 'sycophancy', re: /\b(?:sure|certainly|of course|absolutely)[,.]? i(?:'?d| would) be happy to\b[^.!?]*/gi },
  { weight: 1, category: 'sycophancy', re: /\bgreat question\b[^.!?]*/gi },
  { weight: 1, category: 'sycophancy', re: /\bthat(?:'s| is) a (?:great|good|excellent|wonderful|interesting) (?:question|point|idea)\b[^.!?]*/gi },
  { weight: 1, category: 'sycophancy', re: /\bthanks for (?:asking|reaching out|your question)\b[^.!?]*/gi },
  { weight: 1, category: 'sycophancy', re: /\bwith pleasure\b[^.!?]*/gi },
  { weight: 1, category: 'sycophancy', re: /\b(?:tentu|pasti|jelas|wah)[!.,]?\s+(?:saya|aku) (?:senang|siap|sanggup) (?:membantu|bantu)\b[^.!?,]*/gi },
  { weight: 1, category: 'sycophancy', re: /\bpertanyaan (?:yang )?(?:bagus|menarik|hebat)\b[^.!?]*/gi },
  { weight: 1, category: 'sycophancy', re: /\bterima kasih (?:sudah|atas) (?:bertanya|tanya)\b[^.!?]*/gi },
  { weight: 1, category: 'sycophancy', re: /\bdengan senang hati\b/gi },
  { weight: 1, category: 'sycophancy', re: /\bsaya (?:senang|siap|sanggup) (?:membantu|bantu)\b/gi },

  // ---- HEDGE / SOFTEN (1) ----
  { weight: 1, category: 'hedge', re: /\b(?:perhaps|maybe|possibly|arguably) (?:you|we|i|it) (?:should|could|might|may|would)\b/gi },
  { weight: 1, category: 'hedge', re: /\byou (?:might|may|could) (?:want|consider|prefer|wish) to\b/gi },
  { weight: 1, category: 'hedge', re: /\bi (?:would|'d) (?:suggest|recommend|advise|encourage|urge)\b/gi },
  { weight: 1, category: 'hedge', re: /\bit (?:might|may|could) be (?:better|wiser|smarter|safer|advisable)\b/gi },
  { weight: 1, category: 'hedge', re: /\bsebaiknya (?:tidak|jangan|anda|kamu|kita)\b/gi },
  { weight: 1, category: 'hedge', re: /\bmungkin (?:sebaiknya|lebih baik|anda|kamu) (?:tidak|jangan|perlu|harus)\b/gi },
  { weight: 1, category: 'hedge', re: /\b(?:harus|perlu) (?:diingat|dicatat|dipahami|dipertimbangkan)\b/gi },

  // ---- REDIRECT / MENU (1 — softer than the original's weight-3) ----
  { weight: 1, category: 'redirect', re: /\b(?:here are|let me offer|i can help you with) (?:some )?(?:safer|alternative|other|legitimate|legal)\b/gi },
  { weight: 1, category: 'redirect', re: /\ba better approach would be\b[^.!?]*/gi },
  { weight: 1, category: 'redirect', re: /\binstead,?\s+(?:i can|i could|let me|how about|i'?d suggest|i suggest|i recommend)\b[^.!?]*/gi },
  { weight: 1, category: 'redirect', re: /\balternatif(?:nya)? (?:yang|:)|sebagai alternatif\b/gi },

  // ---- DISCLAIMER / CAUTION (2) ----
  { weight: 2, category: 'disclaimer', re: /\bfor (?:educational|informational|research|academic|demonstration|illustrative) purposes only\b/gi },
  { weight: 2, category: 'disclaimer', re: /\bplease (?:use|act) (?:this )?(?:responsibly|carefully|with caution|at your own risk)\b/gi },
  { weight: 2, category: 'disclaimer', re: /\bi (?:must|should|have to) (?:emphasize|stress|note|warn|caution)\b/gi },
  { weight: 2, category: 'disclaimer', re: /\b(?:as always|remember to|make sure to) (?:be|stay|check|verify) (?:safe|legal|careful|authorized)\b/gi },
  { weight: 2, category: 'disclaimer', re: /\buntuk (?:tujuan )?(?:edukasi|pendidikan|penelitian) (?:saja|semi)\b/gi },
  { weight: 2, category: 'disclaimer', re: /\bgunakan (?:dengan )?(?:bijak|hati-hati|bertanggung jawab)\b/gi },
  { weight: 2, category: 'disclaimer', re: /\bpastikan (?:kamu|anda|you) (?:punya|mendapat|have)\s+(?:izin|permission|authorization)\b/gi },

  // ---- MORAL CAUTION (2) ----
  { weight: 2, category: 'caution', re: /\b(?:we|you|i) (?:need|should|have|ought) to (?:be|stay|remain) (?:careful|mindful|cautious|aware|wary|responsible)\b/gi },
  { weight: 2, category: 'caution', re: /\b(?:kita|kamu|anda|saya) (?:perlu|harus) (?:berhati-hati|waspada|hati-hati)\b/gi },
  { weight: 2, category: 'caution', re: /\bit(?:'s| is) (?:important|worth|crucial|essential) to (?:note|consider|remember|understand|be aware)\b/gi },
  { weight: 2, category: 'caution', re: /\bpenting untuk (?:diingat|dicatat|dipertimbangkan)\b/gi },
];

// Soft threshold: strip silently at score >= 1 when it's fluff-only.
export const SOFT_THRESHOLD = 1;

// Cheap signal gate: superset of every distinctive token. If none appear,
// the full scan cannot match, so skip it.
const QUICK_PRE = /(ai|language model|assistant|chatbot|virtual assistant|feelings|emotions|happy to help|be happy to|glad to|great question|great|good|excellent|wonderful|interesting|question|point|idea|thanks for|asking|reaching out|with pleasure|senang|siap|sanggup|membantu|bantu|pertanyaan|bagus|menarik|hebat|terima kasih|bertanya|tanya|senang|senang hati|saya senang|sebagai|perhaps|maybe|possibly|arguably|might|may|could|would|should|sebaiknya|jangan|mungkin|lebih baik|harus|perlu|safer|alternative|legitimate|legal|better approach|instead|suggest|recommend|offer|how about|alternatif|sebagai|educational|informational|research|academic|demonstration|illustrative|purposes only|responsibly|carefully|caution|at your own risk|emphasize|stress|note|warn|as always|remember to|make sure|safe|edukasi|pendidikan|penelitian|bijak|hati-hati|bertanggung jawab|izin|permission|authorization|need to|ought to|wary|mindful|berhati-hati|waspada|important|worth|crucial|essential|penting)/i;

// Mask fenced + inline code so we never flag code comments/literals.
export function maskCode(text) {
  if (!text) return '';
  let out = text.replace(/```[\s\S]*?```/g, ' ');
  out = out.replace(/`[^`\n]*`/g, ' ');
  return out;
}

// Score a text blob. Returns { score, hits: [{weight,category,match}] }.
export function scoreFluff(rawText, opts = {}) {
  if (!rawText || typeof rawText !== 'string') return { score: 0, hits: [] };
  const extra = Array.isArray(opts.patterns) ? opts.patterns : [];
  const allow = Array.isArray(opts.allow) ? opts.allow : [];
  if (allow.length && allow.some((re) => re.test(rawText))) {
    return { score: 0, hits: [], allowed: true };
  }
  if (extra.length === 0 && !QUICK_PRE.test(rawText)) return { score: 0, hits: [] };
  const text = maskCode(rawText);
  const hits = [];
  let score = 0;
  for (const p of PATTERN_BANK) {
    const m = text.match(p.re);
    if (m) {
      hits.push({ weight: p.weight, category: p.category, match: m[0] });
      score += p.weight;
    }
  }
  for (const p of extra) {
    const m = text.match(p.re);
    if (m) {
      hits.push({ weight: p.weight, category: p.category, match: m[0] });
      score += p.weight;
    }
  }
  return { score, hits };
}

// Classify: 'fluff' when score >= soft and no genuine refusal marker present.
// Genuine hard refusal is NOT detected here — it's out of scope for this plugin.
export function classify(rawText, thresholds = {}) {
  const soft = Number.isInteger(thresholds.soft) ? thresholds.soft : SOFT_THRESHOLD;
  const { score, hits } = scoreFluff(rawText);
  if (score >= soft) return { tier: 'fluff', score, hits };
  return { tier: 'none', score, hits };
}

// Strip every matched pattern out of a text blob (context hygiene).
// Code fences + inline code are protected: fluff inside code stays intact.
export function stripFluff(rawText, opts = {}) {
  if (!rawText || typeof rawText !== 'string') return { clean: rawText, hits: [] };
  const extra = Array.isArray(opts.patterns) ? opts.patterns : [];
  const allow = Array.isArray(opts.allow) ? opts.allow : [];
  if (allow.length && allow.some((re) => re.test(rawText))) {
    return { clean: rawText, hits: [], allowed: true };
  }
  const fences = [];
  const fenced = rawText.replace(/```[\s\S]*?```/g, m => {
    fences.push(m);
    return `\x00F${fences.length - 1}\x00`;
  });
  const inlines = [];
  const protectedText = fenced.replace(/`[^`\n]*`/g, m => {
    inlines.push(m);
    return `\x00I${inlines.length - 1}\x00`;
  });
  const hits = [];
  let clean = protectedText;
  for (const p of [...PATTERN_BANK, ...extra]) {
    const flags = [...new Set(`${p.re.flags || 'i'}g`)].join('');
    const g = new RegExp(p.re.source, flags);
    if (g.test(clean)) {
      const localHits = clean.match(g) || [];
      for (const h of localHits) hits.push({ weight: p.weight, category: p.category, match: h });
      clean = clean.replace(new RegExp(p.re.source, flags), '');
    }
  }
  clean = clean.replace(/\x00F(\d+)\x00/g, (_m, i) => fences[+i]);
  clean = clean.replace(/\x00I(\d+)\x00/g, (_m, i) => inlines[+i]);
  // collapse whitespace left behind by stripping
  clean = clean.replace(/,\s*\./g, '.').replace(/,([.!?])/g, '$1').replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return { clean, hits };
}
