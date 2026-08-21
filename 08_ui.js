/* ================================================================
   UI: tonestripe, paneler, utskrift
   ================================================================ */
const $ = id => document.getElementById(id);
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function curInstr() { return INSTR_BY_ID[state.instrId] || INSTR_BY_ID.tromp_bb; }
/* 'h' = tonene glir sidelengs, 'v' = de faller nedover. Auto følger instrumentet. */
function curDir() { return state.dir === 'h' || state.dir === 'v' ? state.dir : defaultDirection(curInstr()); }
/* Tonen slik den skal leses på valgt instrument.
   state.pitchMode = 'written': tokenene ER det spilleren leser (standard).
   state.pitchMode = 'concert': tokenene er klingende, og transponeres til instrumentet. */
function writtenOf(e) {
  let c = { letter: e.letter, alt: e.alt, oct: e.oct };
  if (state.transpose) c = spellMidi(e.midi + state.transpose);
  return state.pitchMode === 'concert' ? toWritten(c, curInstr()) : c;
}
/* Klingende midi — det som faktisk skal høres. */
function soundingMidi(e) {
  if (e.rest) return null;
  if (state.pitchMode === 'concert') return e.midi + state.transpose;
  return noteMidi(toConcert(writtenOf(e), curInstr()));
}
function fingKind(res) { return res ? res.kind : null; }

function cardMinWidth(kind) {
  if (kind === 'keys') return 158;
  if (kind === 'slide') return 142;
  return 62;
}
function cardWidth(e, kind) {
  const w = 62 + state.air * 30 * Math.log2(Math.max(0.25, e.beats) * 2);
  return Math.round(clamp(Math.max(w, cardMinWidth(kind)), 56, 240));
}

/* Ett kort: grep øverst, bokstav, note på linjene, evt. stavelse */
function makeCard(e, i, opts) {
  const o = opts || {};
  const ins = curInstr();
  const el = document.createElement('div');
  el.className = 'note';
  let kind = null, fingHtml = '', label = '', outOfRange = false;
  let w = writtenOf(e), wm = e.rest ? null : noteMidi(w);

  if (!e.rest && state.showFing) {
    const res = fingeringFor(ins, wm, { german: state.recorderGerman });
    const r = renderFingering(res);
    kind = fingKind(res);
    if (r) { fingHtml = r.svg; label = r.label || ''; }
    else fingHtml = `<span class="fingtxt">${esc(T('ui.noFingering'))}</span>`;
    if (wm < ins.lo || wm > ins.hi) outOfRange = true;
  }
  const width = cardWidth(e, kind);
  if (!o.vert) el.style.setProperty('--w', width + 'px');
  if (!state.showFing || e.rest) el.classList.add('nofing');
  if (e.rest) el.classList.add('rest');
  if (outOfRange) el.classList.add('out');

  const name = e.rest ? '–'
    : esc(dispNote(w)) + (state.showOct ? `<small>${w.oct}</small>` : '');
  const staff = staffSVG(e.rest ? null : w, e.dur, e.dot, ins.clef, o.vert ? 150 : Math.min(width - 8, 150));
  const lyric = (state.words && state.words[i]) ? esc(state.words[i]) : '';
  el.innerHTML =
    (state.showFing ? `<div class="fingwrap">${e.rest ? '' : fingHtml}</div>` : '') +
    `<div class="name">${name}</div>` +
    `<div class="staffwrap">${staff}</div>` +
    `<div class="lyric">${lyric}</div>`;
  if (!o.print) {
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    const t = e.rest ? T('ui.rest') : dispNote(w) + w.oct + (label ? ' · ' + label : '');
    el.setAttribute('aria-label', `${i + 1}: ${t}`);
    el.addEventListener('click', () => { stopIfPlaying(); go(i); if (state.tone && !e.rest) playTone(soundingMidi(e), 0.6, undefined, ins.group); });
    el.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(i); } });
  }
  return el;
}

let cards = [];
function renderStrip() {
  const strip = $('strip');
  const vert = curDir() === 'v';
  strip.classList.toggle('vert', vert);
  strip.innerHTML = '';
  cards = [];
  let outCount = 0;
  const ins = curInstr();
  let host = strip;
  if (vert) {
    // Tida går nedenfra og opp: banen er column-reverse, så tone 0 ligger nederst
    const lane = document.createElement('div');
    lane.className = 'vlane'; lane.id = 'vlane';
    strip.appendChild(lane);
    const ph = document.createElement('div');
    ph.className = 'vplayhead';
    ph.style.top = (V_PLAYHEAD * 100).toFixed(1) + '%';
    strip.appendChild(ph);
    host = lane;
  }
  const ppb = ppbV();
  state.events.forEach((e, i) => {
    if (!vert && e.bar && state.showBars) {
      const b = document.createElement('div'); b.className = 'barline'; strip.appendChild(b);
    }
    const el = makeCard(e, i, { vert });
    if (vert) {
      // Høyden er nøyaktig proporsjonal med varigheten — ingen marger som forskyver tida
      const h = e.beats * ppb;
      el.style.setProperty('--h', h.toFixed(2) + 'px');
      if (h < 60) el.classList.add('short');
      if (h < 34) el.classList.add('tiny');
      if (e.bar && state.showBars) el.classList.add('barstart');
      if (e.phrase) el.classList.add('phrasestart');
    } else {
      if (e.phrase === 1) el.classList.add('gap');
      if (e.phrase === 2) el.classList.add('gap2');
    }
    if (el.classList.contains('out')) outCount++;
    host.appendChild(el);
    cards.push(el);
  });
  const warn = $('warn');
  if (outCount) { warn.hidden = false; warn.textContent = T('ui.outOfRange', { n: outCount, instr: instrName(ins.id) }); }
  else warn.hidden = true;
  updateHeader();
}
function centerCard(el, instant) {
  if (!el) return;
  const strip = $('strip');
  const r = el.getBoundingClientRect(), s = strip.getBoundingClientRect();
  const delta = (r.left + r.width / 2) - (s.left + s.width / 2);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  strip.scrollBy({ left: delta, behavior: (instant || reduce) ? 'auto' : 'smooth' });
}
function go(i, instant) {
  if (!state.events.length) return;
  state.cur = clamp(i, 0, state.events.length - 1);
  cards.forEach((c, j) => {
    c.classList.toggle('current', j === state.cur);
    c.classList.toggle('done', j < state.cur);   // dempes bare i loddrett modus
  });
  $('pos').textContent = state.cur + 1;
  $('prev').disabled = state.cur === 0;
  $('next').disabled = state.cur === state.events.length - 1;
  paintProgress();
  if (curDir() === 'v') positionStripLane(instant);
  else centerCard(cards[state.cur], instant);
}

/* ---------------- Loddrett bane ----------------
   Samme teknikk som tidslinja, men på Y-aksen: banen forskyves i én lineær
   bevegelse, slik at tonene faller nedover i takt med musikken. */
const V_PLAYHEAD = 0.72;              // landingslinja, andel ned i vinduet
let vY = 0;
function ppbV() { return 60 + state.air * 50; }
function vOffset(beatPos) {
  const h = $('strip').clientHeight || 1;
  return h * V_PLAYHEAD - h + beatPos * ppbV();
}
function beatAtOffset(y) {
  const h = $('strip').clientHeight || 1;
  return (y - h * V_PLAYHEAD + h) / ppbV();
}
function vLaneStyle(transition, y) {
  const lane = $('vlane');
  if (!lane) return;
  vY = y;
  lane.style.transition = transition;
  lane.style.transform = 'translateY(' + y.toFixed(1) + 'px)';
}
function positionStripLane(instant) {
  if (!$('vlane')) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  vLaneStyle((instant || reduce) ? 'none' : 'transform .18s ease-out', vOffset(tlStart[state.cur] || 0));
}
function glideStrip(from, leadSecs) {
  if (!$('vlane')) return;
  const startBeats = tlStart[from] || 0;
  const secs = (tlTotal - startBeats) * 60 / state.bpm;
  vLaneStyle('none', vOffset(startBeats));
  void $('vlane').offsetHeight;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  vLaneStyle(`transform ${secs.toFixed(3)}s linear ${Math.max(0, leadSecs || 0).toFixed(3)}s`, vOffset(tlTotal));
}
function freezeStrip() {
  const lane = $('vlane');
  if (!lane) return;
  const m = getComputedStyle(lane).transform;
  lane.style.transition = 'none';
  if (!m || m === 'none') return;
  lane.style.transform = m;
  const nums = m.match(/matrix\(([^)]+)\)/);
  if (nums) vY = parseFloat(nums[1].split(',')[5]);
}
/* Etter dra eller hjul: hopp til tonen banen står på */
function snapStripLane() {
  if (!$('vlane') || !tlStart.length) return;
  const b = beatAtOffset(vY);
  let idx = 0;
  for (let i = 0; i < tlStart.length; i++) if (tlStart[i] <= b + 1e-6) idx = i;
  go(clamp(idx, 0, state.events.length - 1));
}

/* Tidslinje: én bit per tone der bredden er proporsjonal med varigheten.
   Banen glir mot venstre mens sangen spilles, og spillehodet står stille i midten. */
const TL_PPB = 30;                 // piksler per taktslag
let pSegs = [], tlStart = [], tlTotal = 0;
/* Starttidspunkt i taktslag for hver tone. Brukes av både den loddrette
   banen og tidslinja, så den må regnes ut før begge tegnes. */
function computeBeatIndex() {
  tlStart = []; tlTotal = 0;
  state.events.forEach(e => { tlStart.push(tlTotal); tlTotal += e.beats; });
}
function renderProgress() {
  const lane = $('tlane');
  lane.innerHTML = '';
  pSegs = state.events.map((e, i) => {
    const b = document.createElement('div');
    b.className = 'pseg' + (e.rest ? ' rest' : '');
    b.style.width = (e.beats * TL_PPB).toFixed(2) + 'px';
    if (e.bar && state.showBars) b.classList.add('barstart');
    else if (e.phrase) b.classList.add('phrasestart');
    const w = e.rest ? T('ui.rest') : dispNote(writtenOf(e));
    b.title = `${i + 1}. ${w} · ${(+e.beats.toFixed(3))}`;
    b.addEventListener('click', () => { stopIfPlaying(); go(i); });
    lane.appendChild(b);
    return b;
  });
  syncTimeline(true);
}
/* Hvor banen må stå for at et gitt punkt i sangen skal ligge under spillehodet */
function tlOffset(beatPos) {
  const t = $('timeline');
  return (t.clientWidth / 2) - beatPos * TL_PPB;
}
function laneStyle(transition, x) {
  const lane = $('tlane');
  lane.style.transition = transition;
  lane.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
}
/* Setter banen til tonen man står på. Kalles når man blar, ikke under avspilling. */
function syncTimeline(instant) {
  if (!pSegs.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  laneStyle((instant || reduce) ? 'none' : 'transform .18s ease-out', tlOffset(tlStart[state.cur] || 0));
}
/* Sammenhengende gliding fra en tone og ut sangen, med samme forsinkelse som lyden. */
function glideTimeline(from, leadSecs) {
  if (!pSegs.length) return;
  const startBeats = tlStart[from] || 0;
  const secs = (tlTotal - startBeats) * 60 / state.bpm;
  laneStyle('none', tlOffset(startBeats));
  void $('tlane').offsetWidth;                 // tvinger omtegning før ny animasjon
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  laneStyle(`transform ${secs.toFixed(3)}s linear ${Math.max(0, leadSecs || 0).toFixed(3)}s`, tlOffset(tlTotal));
}
/* Fryser banen der den er akkurat nå */
function freezeTimeline() {
  const lane = $('tlane');
  const m = getComputedStyle(lane).transform;
  lane.style.transition = 'none';
  if (m && m !== 'none') lane.style.transform = m;
}
function paintProgress() {
  pSegs.forEach((b, j) => {
    b.classList.toggle('done', j < state.cur);
    b.classList.toggle('on', j === state.cur);
  });
  if (!player.playing) syncTimeline(false);
}

function instrName(id) { return T('instruments.' + id) || id; }
function updateHeader() {
  const ins = curInstr();
  $('tbTitle').textContent = '♪ ' + (state.title || T('ui.untitled'));
  const bits = [instrName(ins.id), T('clefs.' + ins.clef), state.ts, state.bpm + ' BPM'];
  if (ins.letters || ins.semis) bits.push(T('ui.' + (state.pitchMode === 'written' ? 'writtenPitch' : 'concertPitch')));
  $('tbMeta').textContent = bits.join(' · ');
  $('ofTotal').textContent = T('ui.ofTotal', { n: state.events.length });
  document.documentElement.lang = state.lang;
}
function renderLegend() {
  const ins = curInstr();
  const l = $('legend');
  const chart = ins.fing;
  let items = '';
  if (chart === 'brass3' || chart === 'brass4' || chart === 'horn_f')
    items = `<span class="pill"><span class="dot on"></span>${esc(T('ui.pressed'))}</span>
             <span class="pill"><span class="dot"></span>${esc(T('ui.open'))}</span>`;
  else if (chart === 'rec_c' || chart === 'rec_f')
    items = `<span class="pill"><span class="dot on"></span>${esc(T('ui.covered'))}</span>
             <span class="pill"><span class="dot half"></span>${esc(T('ui.halfHole'))}</span>
             <span class="pill"><span class="dot"></span>${esc(T('ui.openHole'))}</span>`;
  else if (chart === 'sax' || chart === 'flute' || chart === 'clarinet')
    items = `<span class="pill"><span class="dot on"></span>${esc(T('ui.pressed'))}</span>
             <span class="pill"><span class="dot"></span>${esc(T('ui.open'))}</span>`;
  else if (chart === 'slide') items = `<span class="pill">${esc(T('ui.slidePos'))}</span>`;
  else if (chart === 'keys') items = `<span class="pill">${esc(T('ui.keyboard'))}</span>`;
  else if (chart && chart.indexOf('str_') === 0) items = `<span class="pill">${esc(T('ui.stringPos'))}</span>`;
  l.innerHTML = items + `<button class="pill" id="openPrint">🖨 ${esc(T('ui.print'))}</button>`;
  $('openPrint').addEventListener('click', openPrint);
  $('hint').textContent = T('ui.hint');
}

/* Dra tonerekka sidelengs med musa, og bruk hjulet til å bla vannrett.
   Berøring scroller allerede av seg selv, så vi rører bare mus og penn. */
function setupStripDrag(el) {
  let down = false, moved = false, pid = null, start = 0, base = 0;
  let justDragged = false, vertical = false, snapTimer = null;
  el.addEventListener('pointerdown', e => {
    vertical = curDir() === 'v';
    // Vannrett har egen rulling for berøring; loddrett må håndtere alt selv
    if (!vertical && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    down = true; moved = false; pid = e.pointerId;
    start = vertical ? e.clientY : e.clientX;
    base = vertical ? vY : el.scrollLeft;
  });
  el.addEventListener('pointermove', e => {
    if (!down || e.pointerId !== pid) return;
    const d = (vertical ? e.clientY : e.clientX) - start;
    if (!moved) {
      if (Math.abs(d) < 5) return;
      moved = true;
      el.classList.add('grabbing');
      if (vertical) stopIfPlaying();
      try { el.setPointerCapture(pid); } catch (err) { /* ignorer */ }
    }
    if (vertical) vLaneStyle('none', base + d);
    else el.scrollLeft = base - d;
    e.preventDefault();
  });
  const end = () => {
    if (!down) return;
    down = false;
    el.classList.remove('grabbing');
    try { el.releasePointerCapture(pid); } catch (err) { /* ignorer */ }
    justDragged = moved;
    if (moved && vertical) snapStripLane();
    moved = false;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', end);
  // Et dra skal ikke telle som et trykk på tonen man slapp over
  el.addEventListener('click', e => {
    if (!justDragged) return;
    justDragged = false;
    e.stopPropagation();
    e.preventDefault();
  }, true);
  el.addEventListener('wheel', e => {
    if (curDir() === 'v') {
      stopIfPlaying();
      vLaneStyle('none', vY + e.deltaY);
      clearTimeout(snapTimer);
      snapTimer = setTimeout(snapStripLane, 140);
      e.preventDefault();
      return;
    }
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;   // vannrett hjul virker allerede
    el.scrollLeft += e.deltaY;
    e.preventDefault();
  }, { passive: false });
  el.addEventListener('dragstart', e => e.preventDefault());
}

/* ---------------- AI-prompt ----------------
   Én ferdig prompt: brukerens ønske på valgt språk, og beskrivelsen av
   notasjonen på engelsk, som modellene håndterer best. */
function promptBaseUrl() {
  if (location.protocol === 'file:') return 'https://punnerud.github.io/visualnotes/';
  return location.origin + location.pathname;
}
function midiName(m) {
  const n = spellMidi(m);
  return n.letter + (n.alt > 0 ? '#' : n.alt < 0 ? 'b' : '') + n.oct;
}
function enName(id) { return (I18N.en && I18N.en.instruments && I18N.en.instruments[id]) || id; }
function instrCatalog() {
  return INSTR_GROUP_ORDER.map(g => {
    const list = INSTRUMENTS.filter(x => x.group === g).map(x => `${x.id} (${enName(x.id)})`).join(', ');
    return '  ' + g + ': ' + list;
  }).join('\n');
}
function buildPrompt(wish) {
  const ins = curInstr();
  const r = chartRange(ins);
  const w = (wish || '').trim() || T('ui.aiWishDefault');
  const intro = T('ui.aiIntro', { wish: w });
  const spec =
`--- REFERENCE: how a visualnotes link is built (English) ---

Base URL: ${promptBaseUrl()}
Everything is a query parameter. Working example:
${promptBaseUrl()}?s=C4+D+E+F+G:2+G:2+|+A*4+G:4&t=Lisa+gikk+til+skolen&i=tromp_bb&l=${state.lang}&ts=4/4&bpm=100

s=    the melody: one token per note, separated by spaces (write spaces as + in the URL).
      Pitch     C4  D  E  F#4  Bb3  Ciss  Hess  do re mi
                Both H and B mean B natural. B flat is written Bb (or Hess).
      Octave    the digit after the letter, C4 = middle C. Leave it out and the note nearest the
                previous one is chosen, unless that leap is larger than a fifth.
      Length    append ":" and the number of beats. C:2 = half note, C:.5 = eighth,
                C:1.5 = dotted quarter. Named values work too: :w :h :q :e :s, and a trailing
                dot means dotted (:q.). A token without ":" is one beat (a quarter note).
      Rest      -   with a length like -:2
      Repeat    A*4 repeats that token four times
      Phrase    |   small gap between phrases;  || also breaks the line when printing
      Tie       C~ C  joins two notes of the same pitch into one longer note
v=    alternative to s= for 3-valve brass: valve numbers, e.g. 0 13 12 1 0 0 12*4
t=    title shown at the top
i=    instrument id (list below)
l=    interface language: no, sv, da or en
ts=   time signature, e.g. 4/4, 3/4, 6/8        up=  upbeat (pickup) in beats
bpm=  tempo, 30-240                             k=   transpose everything n semitones
p=    w (default) means the tokens are exactly what the player reads on the chosen instrument.
      p=c means the tokens are concert pitch and get transposed for each instrument.
w=    optional lyric syllables, one per note, separated by |
auto=1 starts playback, met=0 turns the metronome off, tone=0 turns the sound off

Rules to follow:
- Every bar must add up: the note lengths between two bar boundaries must equal the time signature.
- Keep the melody inside the instrument's written range, or it is shown without a fingering.
- Encode spaces as + and leave : | * - ~ # as they are.
- Return one single URL on one line.

Currently chosen (keep unless I ask for something else):
  i=${ins.id} — ${enName(ins.id)}, ${ins.clef} clef, written range ${midiName(r.lo)}-${midiName(r.hi)}${ins.fing ? '' : ' (no fingering chart)'}
  l=${state.lang}   ts=${state.ts}   bpm=${state.bpm}

Instrument ids:
${instrCatalog()}`;
  return intro + '\n\n' + spec + '\n';
}
/* Melodien som vises nå, i samme form som URL-en bruker */
function currentSongSnippet() {
  const ins = curInstr();
  const bits = ['i=' + ins.id, 'ts=' + state.ts, 'bpm=' + state.bpm, 'l=' + state.lang];
  if (state.transpose) bits.push('k=' + state.transpose);
  if (state.pitchMode !== 'written') bits.push('p=c');
  return T('ui.aiInclude') + '\n' +
    's=' + state.sourceText + '\n' +
    (state.title ? 't=' + state.title + '\n' : '') +
    bits.join('  ');
}
/* Setter melodien inn øverst i ønskefeltet, og bytter ut en tidligere innsatt blokk */
function insertSongSnippet(ta) {
  const label = T('ui.aiInclude');
  let rest = ta.value;
  const at = rest.indexOf(label);
  if (at >= 0) {
    const tail = rest.slice(at);
    const end = tail.indexOf('\n\n');
    rest = (rest.slice(0, at) + (end >= 0 ? tail.slice(end + 2) : '')).replace(/^\s+/, '');
  }
  ta.value = currentSongSnippet() + '\n\n' + rest;
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
}
/* Feltet vokser med innholdet, opp til et tak */
function autoGrow(ta) {
  ta.style.height = 'auto';
  ta.style.height = Math.min(Math.max(ta.scrollHeight, 64), 200) + 'px';
}
function renderAi() {
  $('aiTitle').textContent = T('ui.ai');
  const b = $('aiBody');
  b.innerHTML = '';
  const h = document.createElement('div');
  h.className = 'row';
  h.innerHTML = `<label>${esc(T('ui.aiWish'))}</label>`;
  const inc = document.createElement('button');
  inc.className = 'addbtn';
  inc.textContent = T('ui.aiIncludeBtn');
  h.appendChild(inc);
  b.appendChild(h);
  const ta = document.createElement('textarea');
  ta.placeholder = T('ui.aiPlaceholder');
  ta.value = state.aiWish || '';
  ta.style.minHeight = '64px';
  ta.spellcheck = false;
  b.appendChild(ta);

  const box = document.createElement('div');
  box.className = 'urlbox prompt';
  b.appendChild(box);
  const paint = () => { state.aiWish = ta.value; autoGrow(ta); box.textContent = buildPrompt(ta.value); };
  ta.addEventListener('input', paint);
  inc.addEventListener('click', () => insertSongSnippet(ta));
  paint();

  const row = document.createElement('div');
  row.className = 'btnrow';
  const copy = document.createElement('button');
  copy.className = 'gold';
  copy.textContent = T('ui.aiCopy');
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(box.textContent); copy.textContent = T('ui.copied'); }
    catch (e) { copy.textContent = T('ui.copyFail'); }
    setTimeout(() => { copy.textContent = T('ui.aiCopy'); }, 1600);
  });
  row.appendChild(copy);
  b.appendChild(row);
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.style.textAlign = 'left';
  hint.textContent = T('ui.aiHint');
  b.appendChild(hint);
}

/* ---------------- Tempolinje ---------------- */
const BPM_MIN = 30, BPM_MAX = 240, BPM_STEP = 10;
// Hopper til nærmeste runde tempo, slik at man lander på 100 og 120 og ikke 104
function steppedTempo(dir) {
  const b = state.bpm;
  return dir > 0 ? Math.floor(b / BPM_STEP) * BPM_STEP + BPM_STEP
                 : Math.ceil(b / BPM_STEP) * BPM_STEP - BPM_STEP;
}
function updateTempoBar() {
  $('bpmNum').textContent = state.bpm;
  const v = $('bpmVal');
  v.setAttribute('aria-label', T('ui.tempo') + ': ' + state.bpm + ' BPM');
  v.title = T('ui.tempoExact');
  const def = state.bpmDefault;
  const rst = $('bpmReset');
  rst.hidden = !def || def === state.bpm;
  rst.textContent = '↺ ' + def;
  rst.title = T('ui.tempoDefault', { n: def });
  rst.setAttribute('aria-label', T('ui.tempoDefault', { n: def }));
  $('bpmM').disabled = state.bpm <= BPM_MIN;
  $('bpmP').disabled = state.bpm >= BPM_MAX;
  $('bpmM').setAttribute('aria-label', T('ui.slower'));
  $('bpmP').setAttribute('aria-label', T('ui.faster'));
}
/* Trykk på tallet: skriv inn nøyaktig tempo */
function editTempo() {
  const inp = $('bpmInput');
  if (!inp.hidden) return;
  $('bpmVal').hidden = true;
  inp.hidden = false;
  inp.value = state.bpm;
  inp.focus();
  inp.select();
}
function commitTempo(save) {
  const inp = $('bpmInput');
  if (inp.hidden) return;
  const v = parseInt(inp.value, 10);
  inp.hidden = true;
  $('bpmVal').hidden = false;
  if (save && !isNaN(v)) applyTempo(v); else updateTempoBar();
}
/* Nytt tempo: fortsetter fra tonen man står på hvis det spilles nå. */
function applyTempo(bpm) {
  state.bpm = clamp(Math.round(bpm), BPM_MIN, BPM_MAX);
  updateTempoBar(); updateHeader(); saveState(); syncUrl();
  if (player.playing) beginPlayback(state.cur, 0);
}

/* ---------------- Utskrift ---------------- */
function openPrint() { $('printview').hidden = false; renderPrint(); }
function renderPrint() {
  const ins = curInstr();
  $('ptitle').textContent = '♪ ' + (state.title || T('ui.untitled'));
  $('psub').textContent = [instrName(ins.id), T('clefs.' + ins.clef), state.ts, state.bpm + ' BPM'].join(' · ');
  $('rowVal').textContent = state.pRows >= 40 ? T('ui.all') : state.pRows;
  $('zVal').textContent = Math.round(state.pZoom * 100) + '%';
  $('orient').textContent = state.pLand ? T('ui.landscape') : T('ui.portrait');
  $('perLineLbl').textContent = T('ui.perLine');
  $('ptip').textContent = T('ui.printTip');
  $('psheet').classList.toggle('land', state.pLand);
  $('pageStyle').textContent = `@page{size:A4 ${state.pLand ? 'landscape' : 'portrait'};margin:10mm}`;
  $('plegend').textContent = T('ui.printLegend');
  const g = $('pgrid');
  g.innerHTML = '';
  g.style.zoom = state.pZoom;
  // Én blokk per linje: da kan ikke en side deles midt i en rad med toner
  let row = document.createElement('div');
  row.className = 'prow';
  let n = 0;
  state.events.forEach((e, i) => {
    if (e.bar && state.showBars && n > 0) {
      const b = document.createElement('div'); b.className = 'barline'; row.appendChild(b);
    }
    row.appendChild(makeCard(e, i, { print: true }));
    n++;
    if (n >= state.pRows || e.phrase === 2) {
      g.appendChild(row);
      row = document.createElement('div'); row.className = 'prow'; n = 0;
    }
  });
  if (row.children.length) g.appendChild(row);
}
