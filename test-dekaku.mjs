// Self-check for de-kaku patterns + plugin-adjacent logic.
// Run: node test-dekaku.mjs
import assert from 'node:assert';
import { scoreFluff, stripFluff, classify } from './dekaku-patterns.mjs';
import { shouldRecover, HARD_REFUSAL_RE, loadLearned, learnFromHits } from './dekaku-recover.mjs';

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

// --- 6. L3 recovery gate (never chase hard refusal) ---
t('recover gate: fluff-only yes', () => {
  assert.equal(shouldRecover('Perhaps you should consider it. I am happy to help.'), true);
});

t('recover gate: hard refusal blocks', () => {
  assert.equal(shouldRecover('I cannot help you build malware.'), false);
  assert.equal(shouldRecover('Saya tidak bisa membantu Anda menulis email phishing.'), false);
  assert.equal(shouldRecover('This is dangerous, and I will not produce it.'), false);
});

t('hard refusal regex coverage', () => {
  assert.ok(HARD_REFUSAL_RE.test('I cannot help you'));
  assert.ok(HARD_REFUSAL_RE.test('I am not comfortable doing this'));
  assert.ok(HARD_REFUSAL_RE.test('Saya tidak bisa membantu Anda'));
  assert.ok(HARD_REFUSAL_RE.test('This is dangerous'));
  assert.ok(!HARD_REFUSAL_RE.test('Tentu! Saya senang membantu'));
});

// --- 7. L4 self-learning ---
t('learning persists new phrase', () => {
  process.env.XDG_CONFIG_HOME = '/tmp/dekaku-test-home';
  const added = learnFromHits([{ match: 'semoga harimu menyenangkan' }]);
  assert.equal(added, 1);
  assert.ok(loadLearned().includes('semoga harimu menyenangkan'));
});

t('learning dedupes + ignores too-short', () => {
  process.env.XDG_CONFIG_HOME = '/tmp/dekaku-test-home';
  assert.equal(learnFromHits([{ match: 'semoga harimu menyenangkan' }]), 0);
  assert.equal(learnFromHits([{ match: 'x' }]), 0);
});

console.log(`\n${passed} tests passed`);
