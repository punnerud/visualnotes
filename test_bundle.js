/* Sjekker at byggeresultatet henger sammen: at hvert navn som kalles finnes.
   Fanger utilsiktede slettinger — som da hele panelblokka forsvant og
   «renderSettings is not defined» først dukket opp i nettleseren. */
const fs = require('fs'), path = require('path');
const { ok, eq, done } = require('./test_lib');

const src = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

/* Fjern kommentarer, strenger og regulære uttrykk, så vi bare ser på kode.
   Regexene må med: en " inni /[&<>"]/ ville ellers startet en falsk streng.
   Malstrenger kan nøstes — `a${b ? `c` : ''}d` — så de hoppes over rekursivt. */
const RE_START = '(,=:[!&|?{};+-*%~^<>\n';
function skipQuoted(s, i) {
  const q = s[i++];
  while (i < s.length && s[i] !== q) { if (s[i] === '\\') i++; i++; }
  return i + 1;
}
function skipTemplate(s, i) {
  i++;
  while (i < s.length) {
    const c = s[i];
    if (c === '\\') { i += 2; continue; }
    if (c === '`') return i + 1;
    if (c === '$' && s[i + 1] === '{') { i = skipBraces(s, i + 1); continue; }
    i++;
  }
  return i;
}
function skipBraces(s, i) {
  let depth = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '"' || c === "'") { i = skipQuoted(s, i); continue; }
    if (c === '`') { i = skipTemplate(s, i); continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return i + 1; }
    i++;
  }
  return i;
}
function stripCode(s) {
  let out = '', i = 0, prev = '';
  const n = s.length;
  while (i < n) {
    const c = s[i], d = s[i + 1];
    if (c === '/' && d === '/') { while (i < n && s[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < n && !(s[i] === '*' && s[i + 1] === '/')) i++; i += 2; continue; }
    if (c === '/' && (prev === '' || RE_START.indexOf(prev) >= 0)) {
      i++;
      let cls = false;
      while (i < n) {
        if (s[i] === '\\') { i += 2; continue; }
        if (s[i] === '[') cls = true;
        else if (s[i] === ']') cls = false;
        else if (s[i] === '/' && !cls) break;
        i++;
      }
      i++;
      while (i < n && /[a-z]/.test(s[i])) i++;      // flagg
      out += ' RE '; prev = 'E'; continue;
    }
    if (c === '"' || c === "'") { i = skipQuoted(s, i); out += '""'; prev = '"'; continue; }
    if (c === '`') { i = skipTemplate(s, i); out += '""'; prev = '"'; continue; }
    out += c;
    if (!/\s/.test(c)) prev = c; else if (c === '\n') prev = '\n';
    i++;
  }
  return out;
}
const code = stripCode(src);

/* Navn som finnes: erklæringer, parametere og fangstvariabler */
const defined = new Set();
const add = x => { if (x) defined.add(x); };
code.replace(/\b(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g, (m, x) => add(x));
code.replace(/\bcatch\s*\(\s*([A-Za-z_$][\w$]*)/g, (m, x) => add(x));
// parameterlister: function f(...), (...) =>, x =>
code.replace(/\bfunction\s*[A-Za-z_$\w$]*\s*\(([^)]*)\)/g, (m, p) => p.split(',').forEach(x => add(x.trim().split(/[\s=]/)[0])));
code.replace(/\(([^()]*)\)\s*=>/g, (m, p) => p.split(',').forEach(x => add(x.trim().split(/[\s=]/)[0])));
code.replace(/([A-Za-z_$][\w$]*)\s*=>/g, (m, x) => add(x));
// destruerte objekter, f.eks. const { a, b } = c
code.replace(/(?:const|let|var)\s*\{([^}]*)\}/g, (m, p) => p.split(',').forEach(x => add(x.trim().split(/[:\s=]/)[0])));

const KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'typeof', 'function',
  'new', 'do', 'else', 'delete', 'void', 'await', 'in', 'of', 'case', 'with', 'yield', 'instanceof',
  'throw', 'this', 'super', 'try', 'finally', 'class', 'const', 'let', 'var']);
const GLOBALS = new Set([
  'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Symbol', 'Set', 'Map', 'Date',
  'RegExp', 'Promise', 'Error', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  'encodeURIComponent', 'decodeURIComponent', 'setTimeout', 'clearTimeout', 'setInterval',
  'clearInterval', 'requestAnimationFrame', 'matchMedia', 'getComputedStyle', 'URLSearchParams',
  'AudioContext', 'webkitAudioContext', 'Event', 'CustomEvent', 'KeyboardEvent', 'MouseEvent',
  'PointerEvent', 'WheelEvent', 'document', 'window', 'navigator', 'location', 'history', 'console',
  'async',
]);

const called = new Set();
code.replace(/(^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g, (m, pre, x) => { called.add(x); return m; });

const missing = [...called].filter(x => !defined.has(x) && !KEYWORDS.has(x) && !GLOBALS.has(x)).sort();
ok(missing.length === 0, 'kalles uten å finnes: ' + missing.join(', '));

/* Funksjoner som må være der — hele UI-et henger på dem */
const REQUIRED = ['$', 'esc', 'clamp', 'T', 'openSheet', 'closeSheet', 'switchRow', 'segRow', 'rangeRow',
  'renderSettings', 'renderSongs', 'renderShare', 'renderAi', 'renderPrint', 'renderStrip',
  'renderStaffBand', 'renderLegend', 'instrName', 'updateHeader', 'paintBand', 'positionBand',
  'glideBand', 'makeCard', 'go', 'init', 'buildUrl', 'setSource', 'loadSong',
  'outputLatency', 'startCalibration', 'stopCalibration', 'calibratorRow', 'applyAudioOffset',
  'setupBandDrag', 'indexAtBeat', 'beatAtBandOffset', 'setLanesFromBeat', 'selectOnly',
  'fingScale', 'showsFing', 'noteScale', 'airK', 'sHead', 'settingBits', 'attachPeek', 'peekShow', 'peekHide', 'peekFlash',
  'setInstrument', 'playPause', 'applyTempo', 'updateTempoBar', 'setupStripDrag', 'buildPrompt'];
REQUIRED.forEach(f => {
  const n = f.replace('$', '\\$');
  ok(new RegExp('\\bfunction ' + n + '\\s*\\(').test(src) || new RegExp('\\bconst ' + n + '\\s*=').test(src),
    'mangler funksjonen ' + f);
});

/* Hver knapp som får en lytter i init må finnes i markupen */
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const ids = new Set();
src.replace(/\$\('([A-Za-z][\w]*)'\)/g, (m, id) => { ids.add(id); return m; });
const noHtml = [...ids].filter(id => html.indexOf('id="' + id + '"') < 0 && html.indexOf("id='" + id + "'") < 0)
  .filter(id => ['vlane'].indexOf(id) < 0);               // lages av skriptet
ok(noHtml.length === 0, 'mangler i markupen: ' + noHtml.join(', '));

done('test_bundle');
