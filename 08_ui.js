/* ================================================================
   UI: tonestripe, paneler, utskrift
   ================================================================ */
const $ = id => document.getElementById(id);
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function curInstr() { return INSTR_BY_ID[state.instrId] || INSTR_BY_ID.tromp_bb; }
/* Grepdiagrammet kan trappes gradvis ned til ingenting, så man kan flytte
   blikket over på notene og beholde grepet som en liten støtte. */
function fingScale() { return clamp(state.fingSize, 0, 200) / 100; }
function showsFing() { return state.fingSize > 0; }
/* Notebåndet skaleres på samme vis: 0 gir bare grep, 100 full notelinje. */
function noteScale() { return clamp(state.noteSize, 0, 200) / 100; }
/* Luft mellom notene: 100 % er vanlig, 0 % er så tett det er lesbart. */
function airK() { return clamp(state.airPct, 0, 200) / 100; }
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
  const f = fingScale();
  if (kind === 'keys') return Math.max(62, 158 * f);
  if (kind === 'slide') return Math.max(62, 142 * f);
  return 62;
}
function cardWidth(e, kind) {
  // Grunnbredden gir plass til grepet og bokstaven; krymper grepet, kan kortene
  // stå tettere, så flere toner er synlige når man nærmer seg ren notelesing.
  const base = 62 * (0.72 + 0.28 * fingScale()) * (0.82 + 0.18 * airK());
  const w = base + (2 + 16 * airK()) * Math.log2(Math.max(0.25, e.beats) * 2);
  return Math.round(clamp(Math.max(w, cardMinWidth(kind)), 46, 240));
}

/* Ett kort: grep øverst, bokstav, note på linjene, evt. stavelse */
function makeCard(e, i, opts) {
  const o = opts || {};
  const ins = curInstr();
  const el = document.createElement('div');
  el.className = 'note';
  let kind = null, fingHtml = '', label = '', outOfRange = false;
  let w = writtenOf(e), wm = e.rest ? null : noteMidi(w);

  if (!e.rest && showsFing()) {
    const res = fingeringFor(ins, wm, { german: state.recorderGerman });
    const r = renderFingering(res);
    kind = fingKind(res);
    if (r) { fingHtml = r.svg; label = r.label || ''; }
    else fingHtml = `<span class="fingtxt">${esc(T('ui.noFingering'))}</span>`;
    if (wm < ins.lo || wm > ins.hi) outOfRange = true;
  }
  const width = cardWidth(e, kind);
  if (!o.vert) el.style.setProperty('--w', width + 'px');
  if (!showsFing() || e.rest) el.classList.add('nofing');
  if (e.rest) el.classList.add('rest');
  if (outOfRange) el.classList.add('out');

  const name = e.rest ? '–'
    : esc(dispNote(w)) + (state.oct ? `<small>${w.oct}</small>` : '');
  const staff = staffSVG(e.rest ? null : w, e.dur, e.dot, ins.clef, o.vert ? 150 : Math.min(width - 8, 150));
  const lyric = (state.words && state.words[i]) ? esc(state.words[i]) : '';
  el.innerHTML =
    (showsFing() ? `<div class="fingwrap">${e.rest ? '' : fingHtml}</div>` : '') +
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
  // Båndet kan ligge inne i stripen fra forrige tegning — ta det ut før vi tømmer
  const band = $('sband');
  if (band && band.parentNode) band.parentNode.removeChild(band);
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
    host = lane;
    // Båndet krysser tvers over ved landingslinja, og kortene faller bak det
    band.className = 'sband overlay' + (state.noteSize ? '' : ' noteless');
    band.style.top = (V_PLAYHEAD * 100).toFixed(1) + '%';
    strip.appendChild(band);
  } else {
    band.className = 'sband inflow' + (state.noteSize ? '' : ' noteless');
    band.style.top = '';
    strip.parentNode.insertBefore(band, strip.nextSibling);
  }
  const vh = cardH();
  state.events.forEach((e, i) => {
    if (!vert && e.bar && state.showBars) {
      const b = document.createElement('div'); b.className = 'barline'; strip.appendChild(b);
    }
    const el = makeCard(e, i, { vert });
    if (vert) {
      el.style.setProperty('--h', vh.toFixed(2) + 'px');
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
  renderStaffBand();
  const msgs = [];
  if (outCount) msgs.push(T('ui.outOfRange', { n: outCount, instr: instrName(ins.id) }));
  const off = barsOff(state.events, state.ts, state.upbeat);
  if (off) {
    msgs.push(T('ui.barsOff', {
      beats: +state.events.reduce((a, e) => a + e.beats, 0).toFixed(3),
      bars: +off.toFixed(2), ts: state.ts,
    }));
  }
  const warn = $('warn');
  warn.hidden = !msgs.length;
  warn.textContent = msgs.join(' · ');
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
/* Merker tonen uten å flytte noen baner — brukes mens man drar,
   så notelinja får ligge der fingeren slapp den. */
function selectOnly(i) {
  if (!state.events.length) return;
  state.cur = clamp(i, 0, state.events.length - 1);
  cards.forEach((c, j) => {
    c.classList.toggle('current', j === state.cur);
    c.classList.toggle('done', j < state.cur);   // dempes bare i loddrett modus
  });
  $('pos').textContent = state.cur + 1;
  $('prev').disabled = state.cur === 0;
  $('next').disabled = state.cur === state.events.length - 1;
  paintBand();
}
function go(i, instant, keepBand) {
  if (!state.events.length) return;
  selectOnly(i);
  if (curDir() === 'v') positionStripLane(instant);
  else centerCard(cards[state.cur], instant);
  if (!player.playing && !keepBand) positionBand(instant);
}

/* ---------------- Loddrett bane ----------------
   Samme teknikk som tidslinja, men på Y-aksen: banen forskyves i én lineær
   bevegelse, slik at tonene faller nedover i takt med musikken. */
const V_PLAYHEAD = 0.62;              // landingslinja, andel ned i vinduet
const S_HEAD = 13;                    // notehodets avstand fra segmentets venstrekant
let vY = 0, sX = 0, sSegs = [], beatStart = [], beatTotal = 0;
/* Alle kortene er like høye. Varigheten leses av notebåndet under, og like
   høye kort gjør at man ser flere av de kommende grepene. */
function cardH() { return Math.max(40, (62 + 38 * airK()) * fingScale()); }
function ppbSBase() { return 16 + 64 * airK(); }
/* Notehodet skal stå nær starten av tonen. Når det er tett, må avstanden
   fra segmentkanten krympe med, ellers havner hodet nesten på neste tone. */
function sHead() { return Math.min(S_HEAD, 0.35 * ppbSBase()); }
function ppbS() { return ppbSBase() * noteScale(); }

/* Notebåndet: én sammenhengende notelinje der bredden følger varigheten.
   Segmentene ligger inntil hverandre, så x blir nøyaktig proporsjonal med tida. */
function renderStaffBand() {
  const lane = $('slane');
  if (!lane) return;
  lane.innerHTML = '';
  const ins = curInstr();
  const k = noteScale();
  const ppb = ppbSBase();
  sSegs = state.events.map((e, i) => {
    const el = document.createElement('div');
    el.className = 'sseg' + (e.rest ? ' rest' : '');
    const w = e.beats * ppb;                       // tegnebredde, før skalering
    el.style.width = (w * k).toFixed(2) + 'px';
    el.innerHTML = staffSVG(e.rest ? null : writtenOf(e), e.dur, e.dot, ins.clef, w,
      { cont: true, headX: sHead(), bar: e.bar && state.showBars, scale: k });
    el.addEventListener('click', () => { stopIfPlaying(); go(i); });
    lane.appendChild(el);
    return el;
  });
  paintBand();
  positionBand(true);
}
function sOffset(beatPos) {
  const w = ($('sband') && $('sband').clientWidth) || 1;   // båndets egen bredde, uansett plassering
  return w / 2 - beatPos * ppbS() - sHead() * noteScale();
}
function sLaneStyle(transition, x) {
  const lane = $('slane');
  if (!lane) return;
  sX = x;
  lane.style.transition = transition;
  lane.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
}
/* Hvilket taktslag som ligger på spillehodet ved en gitt forskyvning */
function beatAtBandOffset(x) {
  const w = ($('sband') && $('sband').clientWidth) || 1;
  return (w / 2 - sHead() * noteScale() - x) / ppbS();
}
/* Invers av beatAtIndexF: fra taktslag til (brøkdels) tonenummer */
function indexAtBeat(beat) {
  const n = state.events.length;
  if (!n) return 0;
  if (beat <= 0) return 0;
  for (let i = 0; i < n; i++) {
    const len = state.events[i].beats;
    if (beat < beatStart[i] + len) return i + (beat - beatStart[i]) / len;
  }
  return n - 1;
}
/* Flytter begge banene til samme punkt i sangen */
function setLanesFromBeat(beat, transition) {
  sLaneStyle(transition, sOffset(beat));
  if (curDir() === 'v') vLaneStyle(transition, vOffset(indexAtBeat(beat)));
}
function paintBand() {
  sSegs.forEach((el, j) => {
    el.classList.toggle('on', j === state.cur);
    el.classList.toggle('done', j < state.cur);
  });
}
function positionBand(instant) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  sLaneStyle((instant || reduce) ? 'none' : 'transform .18s ease-out', sOffset(beatStart[state.cur] || 0));
}
/* Én sammenhengende, lineær bevegelse ut sangen. Røres ikke igjen mens den spilles. */
function glideBand(from, leadSecs) {
  if (!sSegs.length) return;
  const startBeats = beatStart[from] || 0;
  const secs = (beatTotal - startBeats) * 60 / state.bpm;
  sLaneStyle('none', sOffset(startBeats));
  void $('slane').offsetWidth;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  sLaneStyle(`transform ${secs.toFixed(3)}s linear ${Math.max(0, leadSecs || 0).toFixed(3)}s`, sOffset(beatTotal));
}
function vOffset(idx) {
  const h = $('strip').clientHeight || 1;
  return h * V_PLAYHEAD - h + idx * cardH();
}
function indexAtOffset(y) {
  const h = $('strip').clientHeight || 1;
  return (y - h * V_PLAYHEAD + h) / cardH();
}
/* Kortene ligger på indeks, båndet på taktslag — her er broen mellom dem */
function beatAtIndexF(f) {
  const i = Math.floor(f);
  if (i < 0) return 0;
  if (i >= state.events.length) return beatTotal;
  return beatStart[i] + (f - i) * state.events[i].beats;
}
function vLaneStyle(transition, y) {
  const lane = $('vlane');
  if (!lane) return;
  vY = y;
  lane.style.transition = transition;
  lane.style.transform = 'translateY(' + y.toFixed(1) + 'px)';
}
/* Begge banene deler tidsakse: tangentene faller, notene glir sidelengs */
function setLanes(idxF, transition) {
  vLaneStyle(transition, vOffset(idxF));
  sLaneStyle(transition, sOffset(beatAtIndexF(idxF)));
}
/* Tangentene hopper én tone om gangen, mens notebåndet glir uavbrutt.
   Under avspilling får derfor bare den fallende banen ny posisjon her —
   rører vi båndet, avbryter vi glidingen ved hver eneste tone. */
/* Tangentene hopper én tone om gangen; notebåndet glir for seg selv. */
function positionStripLane(instant) {
  if (!$('vlane')) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Under avspilling snappes kortet på slaget. Med en mjuk overgang begynner det
  // bare å bevege seg da, og lander et par hundredeler for sent — det leses som
  // at lyden kommer før bildet.
  const snap = instant || reduce || player.playing;
  vLaneStyle(snap ? 'none' : 'transform .18s ease-out', vOffset(state.cur));
}
function freezeOne(id) {
  const lane = $(id);
  if (!lane) return null;
  const m = getComputedStyle(lane).transform;
  lane.style.transition = 'none';
  if (!m || m === 'none') return null;
  lane.style.transform = m;
  const nums = m.match(/matrix\(([^)]+)\)/);
  return nums ? nums[1].split(',') : null;
}
function freezeLanes() {
  const v = freezeOne('vlane');
  if (v) vY = parseFloat(v[5]);
  const b = freezeOne('slane');
  if (b) sX = parseFloat(b[4]);
}
/* Etter dra eller hjul: hopp til tonen banen står på */
function snapStripLane() {
  if (!$('vlane') || !state.events.length) return;
  go(clamp(Math.round(indexAtOffset(vY)), 0, state.events.length - 1));
}

/* Tidslinje: én bit per tone der bredden er proporsjonal med varigheten.
   Banen glir mot venstre mens sangen spilles, og spillehodet står stille i midten. */
/* Starttidspunkt i taktslag for hver tone. Brukes av både den fallende banen
   og notebåndet, så den må regnes ut før begge tegnes. */
function computeBeatIndex() {
  beatStart = []; beatTotal = 0;
  state.events.forEach(e => { beatStart.push(beatTotal); beatTotal += e.beats; });
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
  const chart = showsFing() ? ins.fing : null;
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

/* Notebåndet kan dras sidelengs — det er den naturlige bevegelsen på en
   vannrett tidslinje, og den korteste veien tilbake til begynnelsen.
   Kortene følger med, og ved slipp hopper begge til nærmeste tone. */
function setupBandDrag(el) {
  let down = false, moved = false, pid = null, startX = 0, base = 0;
  let dragEndAt = -1e9, lastIdx = -1;
  // Litt slark i hver ende, så det ikke føles som en vegg ved første og siste tone
  const beatAt = x => clamp(beatAtBandOffset(x), -2, beatTotal + 2);
  const follow = beat => {
    setLanesFromBeat(beat, 'none');
    const i = clamp(Math.round(indexAtBeat(beat)), 0, state.events.length - 1);
    if (i === lastIdx) return;
    lastIdx = i;
    selectOnly(i);                             // merk tonen, men la linja ligge
    if (curDir() !== 'v') centerCard(cards[i], true);
  };
  /* Berøring håndteres med touch-hendelser, ikke pointer. touchmove og touchend
     går alltid til elementet der touchstart skjedde, og et preventDefault der
     hindrer at Safari overtar gesten som sidescrolling midt i et dra. */
  let tId = null;
  el.addEventListener('touchstart', e => {
    const t = e.changedTouches[0];
    tId = t.identifier; startX = t.clientX; base = sX; moved = false; lastIdx = -1;
    e.stopPropagation();
  }, { passive: true });
  el.addEventListener('touchmove', e => {
    let t = null;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === tId) t = e.changedTouches[i];
    }
    if (t) {
      const dx = t.clientX - startX;
      if (!moved && Math.abs(dx) >= 5) {
        moved = true;
        el.classList.add('grabbing');
        stopIfPlaying();
      }
      if (moved) follow(beatAt(base + dx));
    }
    e.preventDefault();
    e.stopPropagation();
  }, { passive: false });
  const touchEnd = () => {
    if (moved) dragEndAt = performance.now();
    moved = false; tId = null;
    el.classList.remove('grabbing');
  };
  el.addEventListener('touchend', touchEnd);
  el.addEventListener('touchcancel', touchEnd);

  el.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') return;              // tatt av touch-grenen
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    down = true; moved = false; pid = e.pointerId;
    startX = e.clientX; base = sX; lastIdx = -1;
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignorer */ }
    e.stopPropagation();
  });
  el.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    if (!down || e.pointerId !== pid) return;
    e.stopPropagation();
    const dx = e.clientX - startX;
    if (!moved) {
      if (Math.abs(dx) < 5) return;
      moved = true;
      el.classList.add('grabbing');
      stopIfPlaying();
    }
    follow(beatAt(base + dx));
    e.preventDefault();
  });
  const end = e => {
    if (!down) return;
    down = false;
    el.classList.remove('grabbing');
    try { el.releasePointerCapture(pid); } catch (err) { /* ignorer */ }
    if (e) e.stopPropagation();
    if (moved) dragEndAt = performance.now();
    moved = false;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', end);
  // Et dra skal ikke telle som trykk. Med finger kommer det ikke noe click etter
  // et dra i det hele tatt, så en flaggverdi ville spist det neste ekte trykket.
  el.addEventListener('click', e => {
    if (performance.now() - dragEndAt > 350) return;
    e.stopPropagation();
    e.preventDefault();
  }, true);
  el.addEventListener('wheel', e => {
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    stopIfPlaying();
    follow(beatAt(sX - d));
    e.preventDefault();
    e.stopPropagation();
  }, { passive: false });
  el.addEventListener('dragstart', e => e.preventDefault());
}

function setupStripDrag(el) {
  let down = false, moved = false, pid = null, start = 0, base = 0;
  let dragEndAt = -1e9, vertical = false, snapTimer = null;
  let tId = null;
  el.addEventListener('touchstart', e => {
    if (curDir() !== 'v') return;                       // vannrett ruller selv
    const t = e.changedTouches[0];
    tId = t.identifier; start = t.clientY; base = vY; moved = false;
  }, { passive: true });
  el.addEventListener('touchmove', e => {
    if (curDir() !== 'v' || tId === null) return;
    let t = null;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === tId) t = e.changedTouches[i];
    }
    if (t) {
      const d = t.clientY - start;
      if (!moved && Math.abs(d) >= 5) { moved = true; el.classList.add('grabbing'); stopIfPlaying(); }
      if (moved) setLanes(indexAtOffset(base + d), 'none');
    }
    e.preventDefault();
  }, { passive: false });
  const touchEnd = () => {
    if (tId === null) return;
    if (moved) { dragEndAt = performance.now(); snapStripLane(); }
    moved = false; tId = null;
    el.classList.remove('grabbing');
  };
  el.addEventListener('touchend', touchEnd);
  el.addEventListener('touchcancel', touchEnd);

  el.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') return;              // tatt av touch-grenen
    vertical = curDir() === 'v';
    if (e.button !== 0) return;
    down = true; moved = false; pid = e.pointerId;
    start = vertical ? e.clientY : e.clientX;
    base = vertical ? vY : el.scrollLeft;
  });
  el.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    if (!down || e.pointerId !== pid) return;
    const d = (vertical ? e.clientY : e.clientX) - start;
    if (!moved) {
      if (Math.abs(d) < 5) return;
      moved = true;
      el.classList.add('grabbing');
      if (vertical) stopIfPlaying();
      try { el.setPointerCapture(pid); } catch (err) { /* ignorer */ }
    }
    if (vertical) setLanes(indexAtOffset(base + d), 'none');
    else el.scrollLeft = base - d;
    e.preventDefault();
  });
  const end = () => {
    if (!down) return;
    down = false;
    el.classList.remove('grabbing');
    try { el.releasePointerCapture(pid); } catch (err) { /* ignorer */ }
    if (moved) dragEndAt = performance.now();
    if (moved && vertical) snapStripLane();
    moved = false;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', end);
  // Et dra skal ikke telle som et trykk på tonen man slapp over
  el.addEventListener('click', e => {
    if (performance.now() - dragEndAt > 350) return;
    e.stopPropagation();
    e.preventDefault();
  }, true);
  el.addEventListener('wheel', e => {
    if (curDir() === 'v') {
      stopIfPlaying();
      setLanes(indexAtOffset(vY + e.deltaY), 'none');
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

/* ---------------- Paneler ---------------- */
function openSheet(id) { $(id).hidden = false; }
function closeSheet(id) { $(id).hidden = true; }
function switchRow(labelKey, subKey, on, onToggle, visual) {
  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML = `<label>${esc(T(labelKey))}${subKey ? `<span class="sub">${esc(T(subKey))}</span>` : ''}</label>`;
  const b = document.createElement('button');
  b.className = 'switch' + (on ? ' on' : '');
  b.setAttribute('role', 'switch'); b.setAttribute('aria-checked', on ? 'true' : 'false');
  b.addEventListener('click', () => {
    const v = !b.classList.contains('on');
    b.classList.toggle('on', v); b.setAttribute('aria-checked', v ? 'true' : 'false');
    onToggle(v);
    if (visual) peekFlash(row);
  });
  row.appendChild(b);
  return row;
}
function segRow(labelKey, options, value, onPick, subKey, visual) {
  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML = `<label>${esc(T(labelKey))}` +
    (subKey ? `<span class="sub">${esc(T(subKey))}</span>` : '') + `</label>`;
  const seg = document.createElement('div');
  seg.className = 'seg';
  options.forEach(o => {
    const b = document.createElement('button');
    b.textContent = o.label;
    b.className = o.value === value ? 'on' : '';
    b.addEventListener('click', () => { if (visual) peekFlash(row); onPick(o.value); });
    seg.appendChild(b);
  });
  row.appendChild(seg);
  return row;
}
/* snapTo: verdien slideren fester seg til, med et rødt merke der så lenge man
   ikke står nøyaktig på den. */
function rangeRow(labelKey, min, max, step, value, fmtFn, onInput, peek, snapTo) {
  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML = `<label>${esc(T(labelKey))}<span class="sub" data-v>${esc(fmtFn(value))}</span></label>`;
  const inp = document.createElement('input');
  inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = value;
  const wrap = document.createElement('span');
  wrap.className = 'rangewrap';
  const hasSnap = snapTo !== undefined && snapTo !== null;
  const zone = (max - min) * 0.025;
  const mark = v => {
    if (!hasSnap) return;
    wrap.classList.toggle('off', Math.abs(v - snapTo) > 1e-9);
  };
  if (hasSnap) wrap.style.setProperty('--mark', ((snapTo - min) / (max - min) * 100).toFixed(2) + '%');
  mark(value);
  inp.addEventListener('input', () => {
    let v = parseFloat(inp.value);
    if (hasSnap && Math.abs(v - snapTo) <= zone && v !== snapTo) { v = snapTo; inp.value = String(v); }
    mark(v);
    row.querySelector('[data-v]').textContent = fmtFn(v);
    onInput(v);
  });
  if (peek) attachPeek(row, inp);
  wrap.appendChild(inp);
  row.appendChild(wrap);
  return row;
}

/* Panelet blir nesten gjennomsiktig mens man drar i en størrelse, så man ser
   det man justerer. Raden man holder i blir stående, ellers ser man ikke tallet.
   Et halvt sekund etter at man slipper, kommer menyen tilbake. */
let peekTimer = null, peekRow = null, peekSheet = null;
/* Panelet holdes gjennomsiktig så lenge man holder på, og av og til et lite
   øyeblikk etterpå. Referansen til panelet lagres, for raden kan bli tegnet
   på nytt under veis — da ville et oppslag gjennom den mistet panelet, og
   menyen blitt hengende gjennomsiktig. */
function peekShow(row) {
  if (row) peekSheet = row.closest('.sheet') || peekSheet;
  if (!peekSheet) return;
  clearTimeout(peekTimer);
  if (peekRow && peekRow !== row) peekRow.classList.remove('peeking');
  peekRow = row || null;
  peekSheet.classList.add('peek');
  if (peekRow) peekRow.classList.add('peeking');
}
function peekHide(delay) {
  clearTimeout(peekTimer);
  peekTimer = setTimeout(() => {
    if (peekSheet) peekSheet.classList.remove('peek');
    if (peekRow) peekRow.classList.remove('peeking');
    peekRow = null;
  }, delay);
}
/* Et trykk som endrer bildet: vis endringen med en gang, og la menyen
   komme tilbake 0,7 sekunder etter siste trykk. */
function peekFlash(row) { peekShow(row); peekHide(700); }
function attachPeek(row, inp) {
  let held = false;
  const on = () => peekShow(row);
  const off = () => peekHide(500);
  inp.addEventListener('pointerdown', () => { held = true; on(); });
  inp.addEventListener('input', () => { on(); if (!held) off(); });
  inp.addEventListener('keydown', () => { held = false; on(); });
  const release = () => { if (!held) return; held = false; off(); };
  inp.addEventListener('pointerup', release);
  inp.addEventListener('pointercancel', release);
  window.addEventListener('pointerup', release);
  inp.addEventListener('blur', () => { held = false; off(); });
}
function renderSettings() {
  stopCalibration();          // prikkene tegnes på nytt, så kalibratoren må stoppe
  const b = $('setBody');
  b.innerHTML = '';
  $('setTitle').textContent = T('ui.settings');

  b.appendChild(segRow('ui.language', LANG_ORDER.map(l => ({ value: l, label: T('meta.name', null) && I18N[l] ? I18N[l].meta.name : l })), state.lang,
    v => { state.lang = v; saveState(); rebuildAll(); renderSettings(); }));

  // Instrument: gruppe -> familie -> variant
  const ins = curInstr();
  const gRow = document.createElement('div');
  gRow.className = 'row';
  gRow.innerHTML = `<label>${esc(T('ui.instrument'))}</label>`;
  const wrap = document.createElement('div');
  wrap.className = 'seg';
  const famSel = document.createElement('select');
  FAMILIES.forEach(f => {
    const og = famSel.querySelector(`optgroup[data-g="${f.group}"]`) || (() => {
      const g = document.createElement('optgroup');
      g.label = T('instrumentGroups.' + f.group); g.dataset.g = f.group; famSel.appendChild(g); return g;
    })();
    const o = document.createElement('option');
    o.value = f.id; o.textContent = T('families.' + f.id) || f.id;
    if (f.id === ins.family) o.selected = true;
    og.appendChild(o);
  });
  famSel.addEventListener('change', () => {
    const f = FAMILY_BY_ID[famSel.value];
    peekFlash(gRow);
    setInstrument(f.std); renderSettings();
  });
  const varSel = document.createElement('select');
  const fam = FAMILY_BY_ID[ins.family];
  fam.members.forEach(id => {
    const o = document.createElement('option');
    o.value = id; o.textContent = instrName(id);
    if (id === ins.id) o.selected = true;
    varSel.appendChild(o);
  });
  varSel.addEventListener('change', () => { peekFlash(gRow); setInstrument(varSel.value); renderSettings(); });
  wrap.appendChild(famSel);
  if (fam.members.length > 1) wrap.appendChild(varSel);
  gRow.appendChild(wrap);
  b.appendChild(gRow);

  if (ins.family === 'recorder') {
    b.appendChild(segRow('ui.recorderSystem', [
      { value: false, label: T('ui.baroque') }, { value: true, label: T('ui.german') },
    ], state.recorderGerman, v => { state.recorderGerman = v; saveState(); rebuildAll(); renderSettings(); }, null, true));
  }
  b.appendChild(segRow('ui.direction', [
    { value: 'auto', label: T('ui.dirAuto') },
    { value: 'h', label: T('ui.dirHoriz') },
    { value: 'v', label: T('ui.dirVert') },
  ], state.dir, v => { state.dir = v; saveState(); rebuildAll(); renderSettings(); syncUrl(); },
     state.dir === 'auto' ? 'ui.dirAutoSub' : null, true));

  b.appendChild(segRow('ui.noteNames', [
    { value: 'native', label: T('ui.nativeNames') }, { value: 'intl', label: T('ui.intlNames') },
  ], state.naming, v => { state.naming = v; saveState(); rebuildAll(); renderSettings(); }, null, true));

  if (ins.letters || ins.semis) {
    b.appendChild(segRow('ui.pitchView', [
      { value: 'written', label: T('ui.writtenPitch') }, { value: 'concert', label: T('ui.concertPitch') },
    ], state.pitchMode, v => { state.pitchMode = v; saveState(); rebuildAll(); renderSettings(); syncUrl(); }, null, true));
  }
  b.appendChild(rangeRow('ui.tempo', BPM_MIN, BPM_MAX, 1, state.bpm, v => v + ' BPM', applyTempo));
  b.appendChild(switchRow('ui.autoAdvance', 'ui.autoAdvanceSub', state.auto, v => { state.auto = v; saveState(); syncUrl(); }));
  b.appendChild(switchRow('ui.metronome', null, state.metronome, v => { state.metronome = v; saveState(); syncUrl(); }));
  b.appendChild(switchRow('ui.toneSound', null, state.tone, v => { state.tone = v; saveState(); syncUrl(); }));
  b.appendChild(switchRow('ui.countIn', null, state.countIn > 0, v => { state.countIn = v ? 4 : 0; saveState(); syncUrl(); }));
  // Nettleserens eget anslag vises bare når lydmotoren er startet
  const auto = AC ? Math.round(outputLatency(AC) * 1000) : null;
  b.appendChild(rangeRow('ui.audioOffset', -300, 300, 10, state.audioOffset,
    v => (v > 0 ? '+' : '') + v + ' ms' +
         (auto === null ? '' : ' · ' + T('ui.audioAuto', { n: auto, sum: auto + v })),
    applyAudioOffset));
  b.appendChild(calibratorRow());
  b.appendChild(rangeRow('ui.air', 0, 200, 1, state.airPct, v => v + ' %',
    v => { state.airPct = Math.round(v); saveState(); rebuildAll(); syncUrl(); }, true, 100));
  b.appendChild(rangeRow('ui.fingSize', 0, 200, 1, state.fingSize,
    v => (v === 0 ? T('ui.off') : v + ' %'),
    v => { state.fingSize = Math.round(v); saveState(); rebuildAll(); syncUrl(); }, true, 100));
  b.appendChild(rangeRow('ui.noteSize', 0, 200, 1, state.noteSize,
    v => (v === 0 ? T('ui.off') : v + ' %'),
    v => { state.noteSize = Math.round(v); saveState(); rebuildAll(); syncUrl(); }, true, 100));
  b.appendChild(switchRow('ui.showBars', null, state.showBars, v => { state.showBars = v; saveState(); rebuildAll(); }, true));
  b.appendChild(switchRow('ui.showOct', 'ui.showOctSub', state.oct,
    v => { state.oct = v; saveState(); rebuildAll(); syncUrl(); }, true));

  const tr = document.createElement('div');
  tr.className = 'row';
  tr.innerHTML = `<label>${esc(T('ui.transpose'))}<span class="sub">${state.transpose > 0 ? '+' : ''}${state.transpose} ${esc(T('ui.semitones'))}</span></label>`;
  const seg = document.createElement('div'); seg.className = 'seg';
  [-12, -1, 0, 1, 12].forEach(d => {
    const btn = document.createElement('button');
    btn.textContent = d === 0 ? '0' : (d > 0 ? '+' + d : String(d));
    btn.addEventListener('click', () => {
      stopIfPlaying();
      peekFlash(tr);
      state.transpose = d === 0 ? 0 : clamp(state.transpose + d, -24, 24);
      state.transposeLocked = d !== 0;
      if (d === 0) autoOctave();
      saveState(); rebuildAll(); renderSettings(); syncUrl();
    });
    seg.appendChild(btn);
  });
  tr.appendChild(seg); b.appendChild(tr);

  const about = document.createElement('p');
  about.className = 'hint';
  about.innerHTML = T('ui.about');
  b.appendChild(about);
}
function renderSongs() {
  $('songsTitle').textContent = T('ui.songs');
  const list = $('songList');
  list.innerHTML = '';
  SONGS.forEach(s => {
    const b = document.createElement('button');
    b.className = 'songitem' + (state.songId === s.id ? ' on' : '');
    b.innerHTML = `<b>${esc(s.title[state.lang] || s.title.en)}</b><span>${esc(T('songs.src.' + s.src))} · ${esc(s.ts)} · ${s.bpm} BPM</span>`;
    b.addEventListener('click', () => { loadSong(s.id); closeSheet('songs'); });
    list.appendChild(b);
  });
  $('songsNote').textContent = T('ui.songsNote');
}
function renderShare() {
  $('shareTitle').textContent = T('ui.share');
  const b = $('shareBody');
  b.innerHTML = '';
  const url = buildUrl();
  const box = document.createElement('div');
  box.className = 'urlbox'; box.textContent = url;
  b.appendChild(box);
  if (url.length > 180) {
    const warn = document.createElement('p');
    warn.className = 'warn';
    warn.style.textAlign = 'left';
    warn.textContent = T('ui.longUrl', { n: url.length });
    b.appendChild(warn);
  }
  const row = document.createElement('div');
  row.className = 'btnrow';
  const copy = document.createElement('button');
  copy.className = 'gold'; copy.textContent = T('ui.copyLink');
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(url); copy.textContent = T('ui.copied'); }
    catch (e) { copy.textContent = T('ui.copyFail'); }
    setTimeout(() => { copy.textContent = T('ui.copyLink'); }, 1600);
  });
  row.appendChild(copy);
  b.appendChild(row);

  const h = document.createElement('div');
  h.className = 'row';
  h.innerHTML = `<label>${esc(T('ui.editNotes'))}<span class="sub">${esc(T('ui.editNotesSub'))}</span></label>`;
  b.appendChild(h);
  const ta = document.createElement('textarea');
  ta.value = state.sourceText;
  ta.spellcheck = false;
  b.appendChild(ta);
  const ti = document.createElement('div');
  ti.className = 'row';
  ti.innerHTML = `<label>${esc(T('ui.songTitle'))}</label>`;
  const tin = document.createElement('input');
  tin.type = 'text'; tin.value = state.title;
  ti.appendChild(tin); b.appendChild(ti);
  const tsRow = document.createElement('div');
  tsRow.className = 'row';
  tsRow.innerHTML = `<label>${esc(T('ui.timeSig'))}</label>`;
  const tsIn = document.createElement('input');
  tsIn.type = 'text'; tsIn.value = state.ts; tsIn.style.width = '90px';
  tsRow.appendChild(tsIn); b.appendChild(tsRow);

  const row2 = document.createElement('div');
  row2.className = 'btnrow';
  const apply = document.createElement('button');
  apply.className = 'gold'; apply.textContent = T('ui.apply');
  apply.addEventListener('click', () => {
    state.title = tin.value.trim();
    state.ts = /^\d+\s*\/\s*\d+$/.test(tsIn.value.trim()) ? tsIn.value.trim().replace(/\s/g, '') : state.ts;
    setSource(ta.value);
    renderShare();
  });
  row2.appendChild(apply);
  const help = document.createElement('button');
  help.textContent = T('ui.formatHelp');
  help.addEventListener('click', () => { helpEl.hidden = !helpEl.hidden; });
  row2.appendChild(help);
  b.appendChild(row2);
  const helpEl = document.createElement('p');
  helpEl.className = 'hint'; helpEl.hidden = true;
  helpEl.style.textAlign = 'left';
  helpEl.innerHTML = T('ui.formatHelpText');
  b.appendChild(helpEl);
  const err = document.createElement('p');
  err.className = 'warn';
  err.textContent = state.parseErrors.length ? T('ui.parseErrors', { list: state.parseErrors.slice(0, 8).join(' ') }) : '';
  err.hidden = !state.parseErrors.length;
  b.appendChild(err);
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
/* Valgene som er satt nå, i samme form som URL-en bruker, så modellen kan
   ta dem med videre i stedet for å tilbakestille dem. */
function settingBits() {
  const bits = ['l=' + state.lang, 'ts=' + state.ts, 'bpm=' + state.bpm,
                'fs=' + state.fingSize, 'ns=' + state.noteSize, 'sp=' + state.airPct];
  if (state.oct) bits.push('oct=1');
  if (!state.showBars) bits.push('bars=0');
  if (state.pitchMode !== 'written') bits.push('p=c');
  if (state.transpose) bits.push('k=' + state.transpose);
  if (state.dir !== 'auto') bits.push('dir=' + state.dir);
  if (state.upbeat) bits.push('up=' + state.upbeat);
  return bits;
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

s=    the melody, comma separated: C4,D,E,F,G
      Pitch     C4  D  E  Fis4  Bb3  Ciss  Hess  do re mi
                Sharps are written "is" (Fis, Ciss) and flats "b" (Bb, Eb). A "#" also works but has
                to be percent-encoded in a link, so prefer "is". Both H and B mean B natural.
      Octave    the digit after the letter, C4 = middle C. Leave it out and the note nearest the
                previous one is chosen, unless that leap is larger than a fifth. Write it only when
                the melody jumps.
      Length    a quarter note needs nothing at all. Otherwise ":w" whole, ":h" half, ":e" eighth,
                ":s" sixteenth, a trailing dot for dotted (":q." ":e."), or a number of beats (":1.5").
      Rest      -   with a length like "-:h"
      Repeat    the count goes straight after the length, with nothing in between:
                "A:e4" is four eighth notes, "A:q4" four quarters, "-:h2" two half rests.
                Use it — it keeps the link short. ("A:e*4" is also understood, but is longer.)
      Phrase    /   a small gap between phrases;  // also breaks the line when printing.
                Do NOT put one at every bar line: bar lines come from ts= by themselves.
      Tie       C~,C  joins two notes of the same pitch into one longer note

      Check the arithmetic before you answer: add the note lengths up bar by bar. A bar holds
      ts numerator x 4 / denominator beats — 2 beats in 2/4, 4 in 4/4, 3 in 6/8 where a dotted
      quarter counts 1.5. Watch the repeat count: ":h16" is sixteen half notes, that is 32 beats,
      while a single sixteen-beat rest is "-:16". If the total does not come out as whole bars,
      fix the melody before answering — the app shows a warning when it does not.

      Keep the link short and use only these characters: letters, digits and , : . - /
      None of them need percent-encoding, so the link stays short and readable when pasted into
      notes and chat apps. Avoid spaces, "+", "|" and "#". Example of a good, compact melody:
        s=C4,D,E,F,G:h2/A:q4,G:w/F*4,E:h*2/D*4,C:w

v=    alternative to s= for 3-valve brass: valve numbers, e.g. 0 13 12 1 0 0 12*4
t=    title shown at the top
i=    instrument id (list below)
l=    interface language: no, sv, da or en
ts=   time signature, e.g. 4/4, 3/4, 6/8        up=  upbeat (pickup) in beats
bpm=  tempo, 30-240                             k=   transpose everything n semitones
p=    w (default) means the tokens are exactly what the player reads on the chosen instrument.
      p=c means the tokens are concert pitch and get transposed for each instrument.
w=    optional lyric syllables, one per note, separated by |
fs=   fingering size in percent, 0-200, where 100 is the normal size. 40 leaves a small reminder
      above the letter, 0 shows the notes alone, 160 makes the chart big for a beginner.
ns=   notation size in percent, 0-200, same scale. 0 hides the staff and leaves the fingerings alone.
sp=   spacing between the notes in percent, 0-200. 100 is normal, 0 packs them tight.
oct=1 adds the octave number after the note letter (off by default — children read the letter alone)
bars=0 hides the bar lines
auto=1 starts playback, met=0 turns the metronome off, tone=0 turns the sound off

Rules to follow:
- Every bar must add up: the note lengths between two bar boundaries must equal the time signature.
- Keep the melody inside the instrument's written range, or it is shown without a fingering.
- Encode spaces as + and leave : | * - ~ # as they are.
- Return one single URL on one line.

Currently chosen — carry these over unless I ask for something else:
  i=${ins.id} — ${enName(ins.id)}, ${ins.clef} clef, written range ${midiName(r.lo)}-${midiName(r.hi)}${ins.fing ? '' : ' (no fingering chart)'}
  ${settingBits().join('   ')}

Instrument ids:
${instrCatalog()}`;
  return intro + '\n\n' + spec + '\n';
}
/* Melodien som vises nå, i samme form som URL-en bruker */
function currentSongSnippet() {
  const ins = curInstr();
  const bits = ['i=' + ins.id].concat(settingBits());
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

/* Kalibrator: klikk som en metronom, med to prikker som lyser vekselvis.
   Man drar i lydforsinkelsen til prikken blinker i samme øyeblikk som klikket. */
function calibratorRow() {
  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML = `<label>${esc(T('ui.calibrate'))}<span class="sub">${esc(T('ui.calibrateSub'))}</span></label>`;
  const wrap = document.createElement('div');
  wrap.className = 'calib';
  const btn = document.createElement('button');
  btn.className = 'calibbtn';
  const dots = [0, 1].map(() => {
    const d = document.createElement('span');
    d.className = 'calibdot';
    wrap.appendChild(d);
    return d;
  });
  const paint = () => { btn.textContent = T(calibRunning() ? 'ui.calibStop' : 'ui.calibStart'); };
  btn.addEventListener('click', () => {
    if (calibRunning()) { stopCalibration(); dots.forEach(d => d.classList.remove('lit')); }
    else {
      startCalibration(100, () => state.audioOffset / 1000, i => {
        dots.forEach((d, k) => d.classList.toggle('lit', k === i % 2));
      });
    }
    paint();
  });
  paint();
  wrap.insertBefore(btn, wrap.firstChild);
  row.appendChild(wrap);
  return row;
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
