/* Tester sangbiblioteket og at det bygde resultatet henger sammen. */
const { load, ok, eq, done, PURE } = require('./test_lib');
const fs = require('fs'), vm = require('vm'), path = require('path');
const c = load();

const langs = ['no', 'sv', 'da', 'en'];
const i18n = {};
langs.forEach(l => { i18n[l] = JSON.parse(fs.readFileSync(path.join(__dirname, `i18n_${l}.json`), 'utf8')); });

const seen = new Set();
for (const s of c.SONGS) {
  ok(!seen.has(s.id), `dublett-id: ${s.id}`); seen.add(s.id);
  const r = c.parseSong(s.s);
  eq(r.errors, [], `${s.id}: tolkefeil`);
  ok(r.events.length > 0, `${s.id}: tom sang`);
  const per = c.barBeats(s.ts);
  const total = r.events.reduce((a, e) => a + e.beats, 0);
  const bars = total / per;
  ok(Math.abs(bars - Math.round(bars)) < 1e-9, `${s.id}: ${total} slag går ikke opp i ${s.ts} (${bars} takter)`);
  langs.forEach(l => ok(typeof s.title[l] === 'string' && s.title[l].length > 0, `${s.id}: mangler tittel på ${l}`));
  langs.forEach(l => ok(i18n[l].songs.src[s.src], `${s.id}: mangler kilde-tekst "${s.src}" på ${l}`));
  ok(s.bpm >= 40 && s.bpm <= 208, `${s.id}: urimelig tempo`);
  const notes = r.events.filter(e => !e.rest);
  const lo = Math.min(...notes.map(e => e.midi)), hi = Math.max(...notes.map(e => e.midi));
  ok(lo >= 55 && hi <= 84, `${s.id}: register ${lo}–${hi} er utenfor G3–C6`);
  // hver sang skal kunne spilles på trompet uten å gå utenfor registeret
  // Tokenene er skrevet tonehøyde: de må ligge i trompetens register
  const ins = c.INSTR_BY_ID.tromp_bb;
  notes.forEach(e => ok(e.midi >= ins.lo && e.midi <= ins.hi,
    `${s.id}: skrevet ${e.midi} utenfor trompetens register`));
}
ok(c.SONGS.length >= 8, 'minst åtte sanger i biblioteket');
eq(c.parseSong(c.SONG_BY_ID.lisa.s).events.length, 22, 'Lisa gikk til skolen har 22 toner');
eq(c.parseSong(c.SONG_BY_ID.lisa.s).events.map(e =>
  c.fingeringFor(c.INSTR_BY_ID.tromp_bb, e.midi).label).join(' '), '0 13 12 1 0 0 12 12 12 12 0 1 1 1 1 12 12 13 13 13 13 0', 'Lisa: ventilgrepene stemmer med prototypen');

/* --- bygget resultat --- */
const idx = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
ok(idx.indexOf('/*__I18N__*/') < 0, 'i18n-plassholderen er erstattet i index.html');
langs.forEach(l => ok(idx.indexOf(`"${l}":{"clefs"`) > 0, `index.html inneholder språket ${l}`));
ok(idx.indexOf('<div class="strip" id="strip"') > 0, 'index.html inneholder tonestripen');
const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
let parsed = true;
try { new vm.Script(app, { filename: 'app.js' }); } catch (e) { parsed = false; console.error('  ' + e.message); }
ok(parsed, 'hele app.js er syntaktisk gyldig');
ok(PURE.every(f => app.indexOf(fs.readFileSync(path.join(__dirname, f), 'utf8').slice(0, 60)) >= 0),
   'alle kildedelene er med i byggeresultatet');

done('test_songs');
