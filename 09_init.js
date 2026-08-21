/* ================================================================
   Tilstand, cookie, URL og oppstart
   ================================================================ */
const COOKIE = 'visualnotes';
const DEFAULTS = {
  lang: 'no', instrId: 'tromp_bb', naming: 'native', pitchMode: 'written', recorderGerman: false,
  bpm: 100, ts: '4/4', upbeat: 0, auto: false, metronome: true, tone: true, countIn: 4,
  air: 0.6, showFing: true, showBars: true, showOct: true, transpose: 0,
  dir: 'auto', pRows: 11, pZoom: 0.8, pLand: true,
};
const PERSIST = ['lang', 'instrId', 'naming', 'pitchMode', 'recorderGerman', 'bpm', 'auto',
                 'metronome', 'tone', 'countIn', 'air', 'showFing', 'showBars', 'showOct',
                 'dir', 'pRows', 'pZoom', 'pLand'];
const state = Object.assign({}, DEFAULTS, {
  title: '', songId: null, sourceText: '', events: [], cur: 0, words: null, parseErrors: [],
  transposeLocked: false, bpmDefault: 100, aiWish: '',
});

function readCookie() {
  const m = document.cookie.match(new RegExp('(?:^|; )' + COOKIE + '=([^;]*)'));
  if (!m) return {};
  try { return JSON.parse(decodeURIComponent(m[1])) || {}; } catch (e) { return {}; }
}
function saveState() {
  const o = {};
  PERSIST.forEach(k => { o[k] = state[k]; });
  try {
    document.cookie = COOKIE + '=' + encodeURIComponent(JSON.stringify(o)) +
      ';path=/;max-age=31536000;SameSite=Lax';
  } catch (e) { /* ignorer */ }
}
function setInstrument(id) {
  if (!INSTR_BY_ID[id]) return;
  stopIfPlaying();                    // gammelt instrument ligger i planleggeren
  state.instrId = id;
  autoOctave();
  saveState(); rebuildAll(); syncUrl();
}
/* Flytter sangen oktavvis slik at den ligger innenfor instrumentets register.
   Rører ikke noe hvis den allerede passer, eller hvis brukeren har valgt transponering selv. */
function autoOctave() {
  if (state.transposeLocked) return;
  const ins = curInstr();
  const notes = state.events.filter(e => !e.rest);
  if (!notes.length) return;
  const lo = Math.min.apply(null, notes.map(e => e.midi));
  const hi = Math.max.apply(null, notes.map(e => e.midi));
  const rng = chartRange(ins);
  const fits = k => (lo + k * 12) >= rng.lo && (hi + k * 12) <= rng.hi;
  if (fits(0)) { state.transpose = 0; return; }
  for (let d = 1; d <= 3; d++) {
    if (fits(-d)) { state.transpose = -d * 12; return; }
    if (fits(d)) { state.transpose = d * 12; return; }
  }
  // Ingen oktav passer helt: velg den som gir færrest toner utenfor
  let best = 0, bestOut = Infinity;
  for (let k = -3; k <= 3; k++) {
    const out = notes.filter(e => e.midi + k * 12 < rng.lo || e.midi + k * 12 > rng.hi).length;
    if (out < bestOut) { bestOut = out; best = k; }
  }
  state.transpose = best * 12;
}
function setSource(text, kind, keepSong) {
  stopIfPlaying();                    // ellers spiller den forrige melodien videre
  if (!keepSong) state.songId = null;
  state.sourceText = String(text || '').trim();
  let r;
  if (kind === 'valves') {
    // Ventiltall gir skrevet tonehøyde direkte — ingen transponering
    r = parseValves(state.sourceText, { startMidi: 60 });
    state.sourceText = songToTokens(r.events);
  } else {
    r = parseSong(state.sourceText, { startOct: 4 });
  }
  state.parseErrors = r.errors;
  state.events = markBars(r.events, state.ts, state.upbeat);
  state.cur = 0;
  autoOctave();
  rebuildAll();
  syncUrl();
}
function loadSong(id) {
  const s = SONG_BY_ID[id];
  if (!s) return;
  state.songId = id;
  state.title = s.title[state.lang] || s.title.en;
  state.ts = s.ts; state.bpm = s.bpm; state.bpmDefault = s.bpm;
  state.upbeat = s.upbeat || 0; state.words = null;
  state.transposeLocked = false;
  setSource(s.s, null, true);
  go(0, true);
}
function rebuildAll() {
  if (state.songId && SONG_BY_ID[state.songId]) {
    state.title = SONG_BY_ID[state.songId].title[state.lang] || SONG_BY_ID[state.songId].title.en;
  }
  state.events = markBars(state.events, state.ts, state.upbeat);
  computeBeatIndex();
  renderStrip();
  renderLegend();
  updateTempoBar();
  go(state.cur, true);
}

/* ---------------- URL ---------------- */
const P_ALIAS = { song: 's', notes: 's', instrument: 'i', instr: 'i', lang: 'l', title: 't',
                  tempo: 'bpm', pitch: 'p', words: 'w', valves: 'v', key: 'k' };
function query() {
  const p = new URLSearchParams(location.search);
  const o = {};
  p.forEach((v, k) => { o[P_ALIAS[k] || k] = v; });
  return o;
}
function applyQuery(q) {
  if (q.l && LANG_ORDER.indexOf(q.l) >= 0) state.lang = q.l;
  if (q.i && INSTR_BY_ID[q.i]) state.instrId = q.i;
  if (q.ts && /^\d+\/\d+$/.test(q.ts)) state.ts = q.ts;
  if (q.up !== undefined) state.upbeat = Math.max(0, parseFloat(q.up) || 0);
  if (q.bpm) { state.bpm = clamp(parseInt(q.bpm, 10) || DEFAULTS.bpm, 30, 240); state.bpmDefault = state.bpm; }
  if (q.p === 'c' || q.p === 'concert') state.pitchMode = 'concert';
  if (q.p === 'w' || q.p === 'written') state.pitchMode = 'written';
  if (q.k) { state.transpose = clamp(parseInt(q.k, 10) || 0, -24, 24); state.transposeLocked = true; }
  if (q.n === 'intl' || q.n === 'native') state.naming = q.n;
  if (q.dir === 'auto' || q.dir === 'h' || q.dir === 'v') state.dir = q.dir;
  ['auto', 'met', 'tone'].forEach(k => {
    if (q[k] !== undefined) {
      const v = q[k] !== '0' && q[k] !== 'false';
      if (k === 'auto') state.auto = v; else if (k === 'met') state.metronome = v; else state.tone = v;
    }
  });
  if (q.count !== undefined) state.countIn = clamp(parseInt(q.count, 10) || 0, 0, 8);
  if (q.air !== undefined) state.air = clamp(parseFloat(q.air), 0, 1.6);
  if (q.fing !== undefined) state.showFing = q.fing !== '0';
  if (q.bars !== undefined) state.showBars = q.bars !== '0';
  if (q.w) state.words = q.w.split('|').map(x => x.trim());
  if (q.t) state.title = q.t;

  if (q.id && SONG_BY_ID[q.id]) {
    const s = SONG_BY_ID[q.id];
    state.songId = q.id;
    if (!q.t) state.title = s.title[state.lang] || s.title.en;
    if (!q.ts) state.ts = s.ts;
    if (!q.bpm) { state.bpm = s.bpm; state.bpmDefault = s.bpm; }
    state.upbeat = q.up !== undefined ? state.upbeat : (s.upbeat || 0);
    setSource(s.s, null, true);
    return true;
  }
  if (q.v) { setSource(q.v, 'valves'); return true; }
  if (q.s) { setSource(q.s); return true; }
  return false;
}
function buildUrl() {
  const p = [];
  // Tegn som er trygge i en query og gjør lenka lesbar, holdes ukodet
  const add = (k, v) => p.push(k + '=' + encodeURIComponent(v)
    .replace(/%20/g, '+').replace(/%3A/g, ':').replace(/%7C/g, '|')
    .replace(/%2C/g, ',').replace(/%2F/g, '/'));
  if (state.songId) add('id', state.songId);
  else add('s', state.sourceText);
  if (state.title && (!state.songId || state.title !== (SONG_BY_ID[state.songId].title[state.lang] || ''))) add('t', state.title);
  add('i', state.instrId);
  add('l', state.lang);
  if (state.ts !== '4/4') add('ts', state.ts);
  if (state.upbeat) add('up', state.upbeat);
  if (state.bpm !== DEFAULTS.bpm) add('bpm', state.bpm);
  if (state.pitchMode !== 'written') add('p', 'c');
  if (state.dir !== 'auto') add('dir', state.dir);
  if (state.transpose) add('k', state.transpose);
  if (state.auto !== DEFAULTS.auto) add('auto', state.auto ? 1 : 0);
  if (state.metronome !== DEFAULTS.metronome) add('met', state.metronome ? 1 : 0);
  if (state.tone !== DEFAULTS.tone) add('tone', state.tone ? 1 : 0);
  if (state.words) add('w', state.words.join('|'));
  return location.origin + location.pathname + '?' + p.join('&');
}
function syncUrl() {
  try { history.replaceState(null, '', buildUrl()); } catch (e) { /* ignorer */ }
}

/* ---------------- Avspilling ---------------- */
function stopIfPlaying() { if (player.playing) { stopPlayback(); freezeLanes(); updatePlayBtn(); } }
function updatePlayBtn() {
  const b = $('playBtn');
  b.textContent = player.playing ? '⏸' : '▶';
  b.classList.toggle('on', player.playing);
  b.setAttribute('aria-label', T(player.playing ? 'ui.pause' : 'ui.play'));
}
function beginPlayback(from, countIn) {
  if (!state.events.length) return false;
  const ins = curInstr();
  player.onNote = i => { go(i); flash(i); };
  player.onStop = () => { updatePlayBtn(); freezeLanes(); };
  const sounding = state.events.map(e => Object.assign({}, e, { midi: e.rest ? null : soundingMidi(e) }));
  const ok = startPlayback(sounding, {
    bpm: state.bpm, ts: state.ts, upbeat: state.upbeat, from: from || 0,
    metronome: state.metronome, tone: state.tone,
    countIn: countIn === undefined ? state.countIn : countIn,
    transpose: 0, group: ins.group,
  });
  updatePlayBtn();
  if (ok) {
    const lead = AC ? player.t0 - AC.currentTime : 0;
    glideBand(from || 0, lead);
    if (curDir() === 'v') positionStripLane(true);
  }
  return ok;
}
function playPause() {
  if (player.playing) { stopPlayback(); freezeLanes(); updatePlayBtn(); return; }
  go(0, true);                       // ▶ spiller alltid sangen fra begynnelsen
  beginPlayback(0);
}
let flashTimer = null;
function flash(i) {
  cards.forEach(c => c.classList.remove('beat'));
  const el = cards[i];
  if (!el) return;
  el.classList.add('beat');
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => el.classList.remove('beat'), 140);
}

/* Automatisk start: nettleseren tillater ikke lyd før brukeren har rørt siden,
   så vi prøver med én gang, og ellers ved første trykk eller tastetrykk. */
function armAutoStart() {
  let started = false;
  const kick = () => {
    if (started || player.playing) return;
    started = true;
    document.removeEventListener('pointerdown', kick);
    document.removeEventListener('keydown', kick);
    playPause();
  };
  setTimeout(() => {
    const ac = ensureAC();
    if (ac && ac.state === 'running') kick();
    else {
      document.addEventListener('pointerdown', kick);
      document.addEventListener('keydown', kick);
    }
  }, 300);
}

/* ---------------- Oppstart ---------------- */
function init() {
  Object.assign(state, DEFAULTS);
  const nav = langFromNavigator(navigator.language || (navigator.languages || [])[0]);
  if (nav) state.lang = nav;
  const saved = readCookie();
  PERSIST.forEach(k => { if (saved[k] !== undefined) state[k] = saved[k]; });
  const q = query();
  const loaded = applyQuery(q);
  if (!loaded) loadSong('lisa');
  saveState();

  $('prev').addEventListener('click', () => { stopIfPlaying(); go(state.cur - 1); });
  $('next').addEventListener('click', () => { stopIfPlaying(); go(state.cur + 1); });
  $('playBtn').addEventListener('click', playPause);
  $('bpmM').addEventListener('click', () => applyTempo(steppedTempo(-1)));
  $('bpmP').addEventListener('click', () => applyTempo(steppedTempo(1)));
  $('bpmVal').addEventListener('click', editTempo);
  $('bpmReset').addEventListener('click', () => applyTempo(state.bpmDefault));
  $('bpmInput').addEventListener('blur', () => commitTempo(true));
  $('bpmInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); commitTempo(true); }
    else if (e.key === 'Escape') { e.preventDefault(); commitTempo(false); }
  });
  $('openAi').addEventListener('click', () => { renderAi(); openSheet('ai'); });
  $('openSettings').addEventListener('click', () => { renderSettings(); openSheet('settings'); });
  $('openSongs').addEventListener('click', () => { renderSongs(); openSheet('songs'); });
  $('openShare').addEventListener('click', () => { renderShare(); openSheet('share'); });
  document.querySelectorAll('[data-close]').forEach(b =>
    b.addEventListener('click', () => closeSheet(b.dataset.close)));
  document.querySelectorAll('.sheet').forEach(s =>
    s.addEventListener('click', e => { if (e.target === s) s.hidden = true; }));

  $('pclose').addEventListener('click', () => { $('printview').hidden = true; });
  $('doPrint').addEventListener('click', () => window.print());
  const printSet = (k, v) => { state[k] = v; saveState(); renderPrint(); };
  $('rowM').addEventListener('click', () => printSet('pRows', Math.max(3, state.pRows - 1)));
  $('rowP').addEventListener('click', () => printSet('pRows', Math.min(40, state.pRows + 1)));
  $('zM').addEventListener('click', () => printSet('pZoom', Math.max(0.3, +(state.pZoom - 0.1).toFixed(2))));
  $('zP').addEventListener('click', () => printSet('pZoom', Math.min(1.6, +(state.pZoom + 0.1).toFixed(2))));
  $('orient').addEventListener('click', () => printSet('pLand', !state.pLand));

  document.addEventListener('keydown', e => {
    const openSheetEl = document.querySelector('.sheet:not([hidden])');
    if (e.key === 'Escape') {
      if (openSheetEl) { openSheetEl.hidden = true; return; }
      if (!$('printview').hidden) { $('printview').hidden = true; return; }
    }
    if (openSheetEl || !$('printview').hidden) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '')) return;
    // I loddrett modus ligger neste tone over, så Opp = neste
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); stopIfPlaying(); go(state.cur + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); stopIfPlaying(); go(state.cur - 1); }
    else if (e.key === ' ') { e.preventDefault(); playPause(); }
  });
  window.addEventListener('resize', () => {
    if (player.playing) return;
    if (curDir() === 'v') positionStripLane(true);
    else centerCard(cards[state.cur], true);
    positionBand(true);
  });
  setupStripDrag($('strip'));

  rebuildAll();
  updateTempoBar();
  updatePlayBtn();
  go(state.cur, true);
  if (state.auto) armAutoStart();
  window.__app = { state, go, setSource, loadSong, setInstrument, buildUrl, rebuildAll };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
