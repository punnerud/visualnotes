/* ================================================================
   URL-format: tolking og bygging
   Ren logikk uten DOM — testes med node.
   ================================================================ */
/* Frasemerket skrives «/», men «|» godtas fortsatt. Komma og mellomrom
   skiller tonene. Alle tegnene i det vi selv skriver er lovlige i en URL,
   slik at lenken overlever å bli limt inn i notat- og meldingsapper. */
function splitTokens(str) {
  return String(str || '')
    .replace(/,/g, ' ')
    .replace(/\|\||\/\//g, ' §§ ')
    .replace(/[|/]/g, ' § ')
    .split(/\s+/).filter(Boolean);
}
const SOLFEGE = { do: 'C', ut: 'C', re: 'D', 'ré': 'D', mi: 'E', fa: 'F', sol: 'G', so: 'G', la: 'A', si: 'B', ti: 'B' };
const DUR_NAMES = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25, t: 0.125 };

function parseDuration(str) {
  if (!str) return null;
  let s = String(str).trim().toLowerCase();
  let dots = 0;
  while (s.endsWith('.') && !/^[\d.]*$/.test(s.slice(0, -1) + '0')) { dots++; s = s.slice(0, -1); }
  if (DUR_NAMES[s] !== undefined) {
    const base = DUR_NAMES[s];
    return base * (dots === 2 ? 1.75 : dots === 1 ? 1.5 : 1);
  }
  // punktum kan også være desimalskille: ":1.5"
  if (/^\d*\.?\d+$/.test(s)) { const v = parseFloat(s); return v > 0 ? v : null; }
  if (dots) {
    const m = s.match(/^([a-z])$/);
    if (m && DUR_NAMES[m[1]] !== undefined) return DUR_NAMES[m[1]] * (dots === 2 ? 1.75 : 1.5);
  }
  return null;
}
/* "C#4" / "Ciss4" / "Hess" / "do" -> {letter, alt, oct|null} */
function parseNoteName(raw) {
  let s = String(raw).trim();
  if (!s) return null;
  let oct = null;
  const om = s.match(/(-?\d)$/);
  if (om) { oct = parseInt(om[1], 10); s = s.slice(0, om.index); }
  const low = s.toLowerCase();
  for (const k of Object.keys(SOLFEGE)) {
    if (low === k || low === k + '#' || low === k + 'b') {
      const letter = SOLFEGE[k];
      const alt = low.endsWith('#') ? 1 : low.endsWith('b') ? -1 : 0;
      return { letter, alt, oct };
    }
  }
  const m = s.match(/^([A-Ha-h])(.*)$/);
  if (!m) return null;
  let letter = m[1].toUpperCase();
  let rest = m[2];
  if (letter === 'H') letter = 'B';
  let alt = 0;
  while (rest.length) {
    const r = rest.toLowerCase();
    if (r.startsWith('iss')) { alt++; rest = rest.slice(3); }
    else if (r.startsWith('is')) { alt++; rest = rest.slice(2); }
    else if (r.startsWith('ess')) { alt--; rest = rest.slice(3); }
    else if (r.startsWith('es')) { alt--; rest = rest.slice(2); }
    else if (r[0] === '#' || r[0] === '♯') { alt++; rest = rest.slice(1); }
    else if (r[0] === 'x' || r[0] === '𝄪') { alt += 2; rest = rest.slice(1); }
    else if (r[0] === 'b' || r[0] === '♭') { alt--; rest = rest.slice(1); }
    else if (r[0] === '♮' || r[0] === 'n') { rest = rest.slice(1); }
    else if (r[0] === 's' && (letter === 'A' || letter === 'E')) { alt--; rest = rest.slice(1); }
    else return null;
  }
  return { letter, alt, oct };
}
/* Oktaven når den ikke er oppgitt: samme oktavtall som forrige tone hvis
   spranget er en kvint eller mindre, ellers nærmeste tone. Brukes både når vi
   tolker og når vi skriver, så de to alltid er enige. */
function inferOctave(letter, alt, prev, startOct) {
  if (!prev) return startOct;
  let oct = prev.oct;
  const d = noteMidi({ letter, alt, oct }) - noteMidi(prev);
  if (Math.abs(d) > 7) {
    let dd = d;
    while (dd > 6) { oct--; dd -= 12; }
    while (dd < -6) { oct++; dd += 12; }
  }
  return oct;
}

/* Tolker en tonerekke. Returnerer {events, errors} */
function parseSong(str, opts) {
  const o = opts || {};
  const startOct = o.startOct === undefined ? 4 : o.startOct;
  const events = [], errors = [];
  if (!str) return { events, errors };
  const tokens = splitTokens(str);
  let prev = null, pendingPhrase = 0, pendingTie = false, lastTok = null;
  for (const tok0 of tokens) {
    if (tok0 === '§') { pendingPhrase = Math.max(pendingPhrase, 1); continue; }
    if (tok0 === '§§') { pendingPhrase = 2; continue; }
    let tok = tok0;
    let repeat = 1;
    const rm = tok.match(/\*(\d+)$/);
    if (rm) { repeat = Math.min(64, parseInt(rm[1], 10)); tok = tok.slice(0, rm.index); }
    let tie = false;
    if (tok.endsWith('~')) { tie = true; tok = tok.slice(0, -1); }
    if (tok === '') { // "*4" alene = gjenta forrige
      if (!lastTok) { errors.push('*' + repeat); continue; }
      tok = lastTok;
    }
    let beats = 1;
    const ci = tok.indexOf(':');
    if (ci >= 0) {
      let dpart = tok.slice(ci + 1);
      // «A4:e4» = fire åttedeler. Tallet henger rett på lengden, uten skilletegn,
      // fordi «*» blir spist av enkelte apper når lenken limes inn.
      const cm = dpart.match(/^([A-Za-z]\.{0,2})(\d+)$/);
      if (cm && repeat === 1) { dpart = cm[1]; repeat = Math.min(64, Math.max(1, parseInt(cm[2], 10))); }
      const d = parseDuration(dpart);
      if (d === null) { errors.push(tok0); continue; }
      beats = d; tok = tok.slice(0, ci);
    }
    const isRest = tok === '-' || tok === '_' || tok.toLowerCase() === 'r' || tok.toLowerCase() === 'p';
    let ev = null;
    if (isRest) {
      ev = { rest: true, beats };
    } else {
      const n = parseNoteName(tok);
      if (!n) { errors.push(tok0); continue; }
      const oct = n.oct === null ? inferOctave(n.letter, n.alt, prev, startOct) : n.oct;
      ev = { rest: false, letter: n.letter, alt: n.alt, oct, beats };
      prev = { letter: n.letter, alt: n.alt, oct };
    }
    for (let i = 0; i < repeat; i++) {
      const e = Object.assign({}, ev);
      e.phrase = (i === 0) ? pendingPhrase : 0;
      e.tie = (i === repeat - 1) ? tie : false;
      events.push(e);
      pendingPhrase = 0;
    }
    lastTok = tok0.replace(/\*\d+$/, '');
  }
  // bind sammen bundne toner med samme tonehøyde
  const out = [];
  for (const e of events) {
    const p = out[out.length - 1];
    if (p && p.tie && !p.rest && !e.rest && p.letter === e.letter && p.alt === e.alt && p.oct === e.oct) {
      p.beats += e.beats; p.tie = e.tie; continue;
    }
    if (p && p.tie && p.rest && e.rest) { p.beats += e.beats; p.tie = e.tie; continue; }
    out.push(e);
  }
  out.forEach(e => { if (!e.rest) e.midi = noteMidi(e); const g = glyphFor(e.beats); e.dur = g.dur; e.dot = g.dot; });
  return { events: out, errors };
}
/* Ventiltall -> toner. combos som "0", "12", "123". */
function valveIndex() {
  const map = {};
  for (const k of Object.keys(FINGERINGS)) {
    const m = parseInt(k, 10), e = FINGERINGS[k];
    [e.f].concat(e.a || []).forEach(c => { (map[c] = map[c] || []).push(m); });
  }
  Object.keys(map).forEach(c => map[c].sort((a, b) => a - b));
  return map;
}
function parseValves(str, opts) {
  const o = opts || {};
  const idx = valveIndex();
  const events = [], errors = [];
  let cur = o.startMidi === undefined ? 60 : o.startMidi;
  let pendingPhrase = 0;
  for (const tok0 of splitTokens(str)) {
    if (tok0 === '§') { pendingPhrase = Math.max(pendingPhrase, 1); continue; }
    if (tok0 === '§§') { pendingPhrase = 2; continue; }
    let tok = tok0, repeat = 1, beats = 1;
    const rm = tok.match(/\*(\d+)$/);
    if (rm) { repeat = Math.min(64, parseInt(rm[1], 10)); tok = tok.slice(0, rm.index); }
    const ci = tok.indexOf(':');
    if (ci >= 0) {
      let dpart = tok.slice(ci + 1);
      const cm = dpart.match(/^([A-Za-z]\.{0,2})(\d+)$/);
      if (cm && repeat === 1) { dpart = cm[1]; repeat = Math.min(64, Math.max(1, parseInt(cm[2], 10))); }
      const d = parseDuration(dpart);
      if (d === null) { errors.push(tok0); continue; }
      beats = d; tok = tok.slice(0, ci);
    }
    if (tok === '-' || tok.toLowerCase() === 'r') {
      for (let i = 0; i < repeat; i++) { events.push({ rest: true, beats, phrase: i ? 0 : pendingPhrase }); pendingPhrase = 0; }
      continue;
    }
    const key = tok.split('').sort().join('');
    const cands = idx[key] || idx[tok];
    if (!cands || !cands.length) { errors.push(tok0); continue; }
    let best = cands[0];
    for (const m of cands) if (Math.abs(m - cur) < Math.abs(best - cur)) best = m;
    cur = best;
    for (let i = 0; i < repeat; i++) {
      const n = spellMidi(best);
      events.push({ rest: false, letter: n.letter, alt: n.alt, oct: n.oct, midi: best, beats, phrase: i ? 0 : pendingPhrase });
      pendingPhrase = 0;
    }
  }
  events.forEach(e => { const g = glyphFor(e.beats); e.dur = g.dur; e.dot = g.dot; });
  return { events, errors };
}
/* Bygger en kompakt tonerekke av hendelsene. Kortest mulig, og bare med tegn
   som er lovlige i en URL: bokstaver, tall og , : . - * /
   Firedeler skrives uten lengde, oktavtall utelates når de kan gjettes,
   kryss skrives «is» (ikke «#», som må prosentkodes) og like naboer pakkes til A*4. */
const DUR_TOKENS = [[4, 'w'], [2, 'h'], [1, 'q'], [0.5, 'e'], [0.25, 's'], [0.125, 't']];
function durToken(beats) {
  if (Math.abs(beats - 1) < 1e-9) return '';
  for (const [v, n] of DUR_TOKENS) {
    if (Math.abs(beats - v) < 1e-9) return ':' + n;
    if (Math.abs(beats - v * 1.5) < 1e-9) return ':' + n + '.';
    if (Math.abs(beats - v * 1.75) < 1e-9) return ':' + n + '..';
  }
  return ':' + (+beats.toFixed(4));
}
function noteToken(e, prev, startOct) {
  const acc = e.alt > 0 ? 'is'.repeat(e.alt) : 'b'.repeat(-e.alt);
  // Første tone skrives alltid med oktav, så lenken forteller selv hvor den ligger
  const guess = prev ? inferOctave(e.letter, e.alt, prev, startOct) : null;
  return e.letter + acc + (guess === e.oct ? '' : e.oct);
}
function songToTokens(events, startOct) {
  const so = startOct === undefined ? 4 : startOct;
  const out = [];
  let prev = null;
  for (const e of events) {
    if (e.phrase === 2) out.push({ t: '//' }); else if (e.phrase === 1) out.push({ t: '/' });
    if (e.rest) { out.push({ t: '-', d: durToken(e.beats) }); continue; }
    out.push({ t: noteToken(e, prev, so), d: durToken(e.beats) });
    prev = { letter: e.letter, alt: e.alt, oct: e.oct };
  }
  // Like naboer slås sammen. Tallet henger rett etter lengden — «A4:e4» — for
  // «*» overlever ikke alltid å bli limt inn i en notat- eller meldingsapp.
  const packed = [];
  for (const o of out) {
    const p = packed[packed.length - 1];
    if (p && p.t === o.t && p.d === o.d && o.t !== '/' && o.t !== '//') { p.n++; continue; }
    packed.push({ t: o.t, d: o.d || '', n: 1 });
  }
  return packed
    .map(p => {
      if (p.n === 1) return p.t + p.d;
      // For to firedeler er «C,C» kortere enn «C:q2» — velg det som gir minst tegn
      const short = p.t + (p.d || ':q') + p.n;
      const plain = new Array(p.n).fill(p.t + p.d).join(',');
      return short.length <= plain.length ? short : plain;
    })
    .join(',').replace(/,(\/+),/g, '$1').replace(/^(\/+),/, '$1');
}
/* Taktart "4/4" -> taktslag per takt */
function barBeats(ts) {
  const m = String(ts || '4/4').match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!m) return 4;
  return parseInt(m[1], 10) * 4 / parseInt(m[2], 10);
}
function beatUnit(ts) {
  const m = String(ts || '4/4').match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!m) return 1;
  const den = parseInt(m[2], 10), num = parseInt(m[1], 10);
  const u = 4 / den;
  return (den === 8 && num % 3 === 0) ? u * 3 : u;   // 6/8, 9/8, 12/8 teller punkterte
}
/* Hvor mange takter melodien fyller. Går den ikke opp i hele takter, mangler
   eller er det for mye et sted. Opptakten teller som den delen av første takt. */
function barCount(events, ts, upbeat) {
  const per = barBeats(ts);
  const total = events.reduce((a, e) => a + e.beats, 0);
  const fill = upbeat ? per - upbeat : 0;
  return (total + fill) / per;
}
function barsOff(events, ts, upbeat) {
  if (!events.length) return 0;
  const n = barCount(events, ts, upbeat);
  return Math.abs(n - Math.round(n)) < 1e-6 ? 0 : n;
}

/* Markerer taktstart på hendelsene */
function markBars(events, ts, upbeat) {
  const per = barBeats(ts);
  let pos = (upbeat ? per - upbeat : 0);
  for (const e of events) {
    e.bar = Math.abs(pos % per) < 1e-6;
    e.beatPos = pos;
    pos += e.beats;
  }
  if (events.length) events[0].bar = false;
  return events;
}
