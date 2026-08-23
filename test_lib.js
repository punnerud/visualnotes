/* Felles testhjelper: laster de rene modulene inn i en vm-kontekst. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const PURE = ['01_core.js', '02_i18n.js', '03_fingering.js', '04_notation.js',
              '05_songs.js', '06_url.js', '06b_qr.js', '07_audio.js'];

function load(extraGlobals) {
  const ctx = vm.createContext(Object.assign({
    console, state: { lang: 'no', naming: 'native' },
    window: {}, navigator: { language: 'nb-NO' }, unescape, encodeURIComponent,
  }, extraGlobals || {}));
  const src = PURE.map(f => fs.readFileSync(path.join(__dirname, f), 'utf8')).join('\n');
  // Toppnivå-navn ligger i skriptets eget scope; eksporter dem til konteksten.
  const names = new Set();
  src.replace(/^(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/gm, (m, n) => { names.add(n); return m; });
  const epilogue = '\n;(function(){' +
    [...names].map(n => `try{globalThis.${n}=${n};}catch(e){}`).join('') + '})();';
  vm.runInContext(src + epilogue, ctx, { filename: 'pure.js' });
  return ctx;
}
let fails = 0, checks = 0;
function ok(cond, msg) {
  checks++;
  if (!cond) { fails++; console.error('  ✗ ' + msg); }
}
function eq(a, b, msg) { ok(JSON.stringify(a) === JSON.stringify(b), `${msg}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`); }
function done(name) {
  console.log(`${name}: ${checks - fails}/${checks} ok`);
  if (fails) process.exit(1);
}
module.exports = { load, ok, eq, done, PURE };
