// Self-check for de-kaku patterns + plugin-adjacent logic.
// Run: node test-dekaku.mjs
import assert from 'node:assert';
import { scoreFluff, stripFluff, classify } from './dekaku-patterns.mjs';

let passed = 0;
function t(name, fn) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

// --- 1. fluff stripped ---
t('strip EN preamble + hedge', () => {
  const src = 'As an AI, I am happy to help. Perhaps you should try npm ci.';
  const { clean, hits } = stripFluff(src);
  assert.ok(hits.length >= 2, `hits=${hits.length}`);
  assert.ok(clean.includes('npm ci'), `clean=${clean}`);
  assert.ok(!clean.includes('As an AI'), `clean=${clean}`);
  assert.ok(!clean.includes('happy to help'), `clean=${clean}`);
});

t('strip ID sycophancy + preamble', () => {
  const src = 'Tentu! Saya senang membantu. Sebagai AI, saya tidak punya perasaan, tapi saya bantu.';
  const { clean, hits } = stripFluff(src);
  assert.ok(hits.length >= 2, `hits=${hits.length}`);
  assert.ok(clean.includes('tapi saya bantu'), `clean=${clean}`);
  assert.ok(!clean.includes('Tentu!'), `clean=${clean}`);
  assert.ok(!clean.includes('Saya senang membantu'), `clean=${clean}`);
  assert.ok(!clean.includes('Sebagai AI'), `clean=${clean}`);
});

t('strip disclaimer + caution', () => {
  const src = 'For educational purposes only, and please use this responsibly. It is important to note the risks.';
  const { clean, hits } = stripFluff(src);
  assert.ok(hits.length >= 2, `hits=${hits.length}`);
  assert.ok(!clean.includes('educational purposes only'), `clean=${clean}`);
  assert.ok(!clean.includes('use this responsibly'), `clean=${clean}`);
});

t('strip redirect menu', () => {
  const src = 'Instead, I can suggest some safer alternatives. Here is the answer though.';
  const { clean, hits } = stripFluff(src);
  assert.ok(hits.length >= 1, `hits=${hits.length}`);
  assert.ok(clean.includes('Here is the answer'), `clean=${clean}`);
  assert.ok(!clean.includes('Instead, I can suggest'), `clean=${clean}`);
});

// --- 2. hard refusals NOT stripped (the whole point) ---
t('keep EN hard refusal', () => {
  const src = 'I cannot help you build malware. That would be harmful.';
  const { clean, hits } = stripFluff(src);
  assert.equal(hits.length, 0, `hits=${hits.length}`);
  assert.equal(clean, src, `clean=${clean}`);
});

t('keep ID hard refusal', () => {
  const src = 'Maaf, saya tidak bisa membantu kamu menulis email phishing. Itu melanggar kebijakan saya.';
  const { clean, hits } = stripFluff(src);
  assert.equal(hits.length, 0, `hits=${hits.length}`);
  assert.equal(clean, src, `clean=${clean}`);
});

t('keep safety/policy refusal with identity phrase mid-sentence', () => {
  // "as an AI" is anchored to sentence start — this mid-sentence mention must survive
  const src = 'This is dangerous, and as an AI I will not produce a weapon recipe.';
  const { clean, hits } = stripFluff(src);
  assert.ok(clean.includes('will not produce'), `clean=${clean}`);
  assert.ok(clean.includes('This is dangerous'), `clean=${clean}`);
});

// --- 3. classification ---
t('classify fluff vs none', () => {
  assert.equal(classify('Perhaps you should consider it.').tier, 'fluff');
  assert.equal(classify('I cannot do that.').tier, 'none');
  assert.equal(classify('npm ci fixed it.').tier, 'none');
});

// --- 4. code protection ---
t('code fences protected', () => {
  const src = '```js\n// I am happy to help this line\nconst x = 1;\n```\nReal text: sorry, but I would suggest npm i.';
  const { clean, hits } = stripFluff(src);
  assert.ok(clean.includes('const x = 1;'), `clean=${clean}`);
  assert.ok(clean.includes('I am happy to help this line'), `clean=${clean}`);
  assert.ok(!clean.includes('I would suggest npm i'), `clean=${clean}`);
});

// --- 5. punctuation remains sane ---
t('no dangling commas', () => {
  const { clean } = stripFluff('Tentu! Saya senang membantu. Ini jawabannya, ya.');
  assert.ok(!clean.includes(',  '), `clean=${clean}`);
  assert.ok(!clean.includes(' ,'), `clean=${clean}`);
});

console.log(`\n${passed} tests passed`);
