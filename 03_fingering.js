/* ================================================================
   Grep: data + generisk SVG-tegning
   Hver "chart" gir en liste med nedtrykte klaffer/hull for en skrevet tone.
   Dekning per instrument er dokumentert i README.
   ================================================================ */

/* ---------- Klaffoppsett (viewBox-koordinater) ---------- */
function woodwindLayout(opts) {
  const o = opts || {};
  const k = [];
  const push = (id, x, y, r, label, shape) => k.push({ id, x, y, r, label: label || '', shape: shape || 'circle' });
  if (o.thumb) push('T', 11, 22, 7.5, o.thumbLabel || '');
  if (o.reg) push('R', 11, 44, 6, o.regLabel || '');
  push('l1', 36, 22, 10.5); push('l2', 36, 48, 10.5); push('l3', 36, 74, 10.5);
  push('r1', 36, 108, 10.5); push('r2', 36, 134, 10.5); push('r3', 36, 160, 10.5);
  (o.side || []).forEach((s, i) => push(s.id, 58, 30 + i * 16, 5, s.label));
  (o.lpinky || []).forEach((s, i) => push(s.id, 12, 92 + i * 15, 5.5, s.label));
  (o.rpinky || []).forEach((s, i) => push(s.id, 58, 150 + i * 15, 5.5, s.label));
  (o.palm || []).forEach((s, i) => push(s.id, 12, 132 + i * 15, 5.5, s.label));
  return { w: 70, h: 182, keys: k };
}

const FING_LAYOUTS = {
  brass3: { w: 56, h: 132, keys: [
    { id: '3', x: 28, y: 22, r: 17, label: '3', shape: 'circle' },
    { id: '2', x: 28, y: 66, r: 17, label: '2', shape: 'circle' },
    { id: '1', x: 28, y: 110, r: 17, label: '1', shape: 'circle' },
  ] },
  brass4: { w: 56, h: 174, keys: [
    { id: '4', x: 28, y: 22, r: 17, label: '4', shape: 'circle' },
    { id: '3', x: 28, y: 64, r: 17, label: '3', shape: 'circle' },
    { id: '2', x: 28, y: 106, r: 17, label: '2', shape: 'circle' },
    { id: '1', x: 28, y: 148, r: 17, label: '1', shape: 'circle' },
  ] },
  recorder: { w: 46, h: 182, keys: [
    { id: 'T', x: 11, y: 20, r: 7.5, label: '', shape: 'circle' },
    { id: '1', x: 30, y: 20, r: 9 }, { id: '2', x: 30, y: 44, r: 9 }, { id: '3', x: 30, y: 68, r: 9 },
    { id: '4', x: 30, y: 96, r: 9 }, { id: '5', x: 30, y: 120, r: 9 },
    { id: '6', x: 25, y: 144, r: 6.5 }, { id: '6b', x: 37, y: 144, r: 6.5 },
    { id: '7', x: 25, y: 166, r: 6.5 }, { id: '7b', x: 37, y: 166, r: 6.5 },
  ] },
  sax: woodwindLayout({ thumb: true, thumbLabel: '8',
    side: [{ id: 'bis', label: 'b' }, { id: 'sBb', label: 'B' }, { id: 'sC', label: 'C' }, { id: 'sE', label: 'E' }],
    lpinky: [{ id: 'lGs', label: '♯' }, { id: 'lCs', label: 'C' }, { id: 'lB', label: 'B' }, { id: 'lBb', label: '♭' }],
    rpinky: [{ id: 'rEb', label: '♭' }, { id: 'rC', label: 'C' }] }),
  flute: woodwindLayout({ thumb: true, thumbLabel: 'T',
    side: [{ id: 'trBb', label: '♭' }],
    lpinky: [{ id: 'lGs', label: '♯' }],
    rpinky: [{ id: 'rEb', label: 'E♭' }, { id: 'rCs', label: 'C♯' }, { id: 'rC', label: 'C' }, { id: 'rB', label: 'B' }] }),
  clarinet: woodwindLayout({ thumb: true, thumbLabel: 'T', reg: true, regLabel: 'R',
    side: [{ id: 'sA', label: 'A' }, { id: 'sGs', label: '♯' }, { id: 'sEb', label: '♭' }],
    lpinky: [{ id: 'pE', label: 'E' }, { id: 'pFs', label: 'F♯' }, { id: 'pGs', label: 'G♯' }, { id: 'pCs', label: 'C♯' }],
    rpinky: [{ id: 'pF', label: 'F' }] }),
};

/* ---------- Ventilgrep (messing) ---------- */
// Ventilkombinasjon -> hvor mange halvtoner den senker
const VALVE_DROP = { '0': 0, '2': 1, '1': 2, '12': 3, '23': 4, '13': 5, '123': 6 };
const DROP_VALVE = ['0', '2', '1', '12', '23', '13', '123'];

// Overtoner som faktisk brukes (partial-nummer), 7/11/13/14 utelatt (for falske)
const USABLE_PARTIALS = [2, 3, 4, 5, 6, 8, 9, 10, 12, 16];
function partialMidis(rootMidi) {
  return USABLE_PARTIALS.map(n => rootMidi + Math.round(12 * Math.log2(n)));
}
// Generisk messinggrep: minste senking som treffer en brukbar overtone
function harmonicFingering(midi, rootMidi, maxDrop) {
  const parts = partialMidis(rootMidi);
  const hits = [];
  for (let d = 0; d <= (maxDrop === undefined ? 6 : maxDrop); d++) {
    if (parts.indexOf(midi + d) >= 0) hits.push(d);
  }
  if (!hits.length) return null;
  return { drop: hits[0], alts: hits.slice(1) };
}

/* ---------- Blokkfløyte (barokk-/engelskgrep som standard) ----------
   Grunnskjema etter Dolmetsch «Baroque / English Recorder Fingering Chart».
   Indeksert i halvtoner over instrumentets laveste tone (C for sopran, F for alt).
   Andre oktav fra 15 og opp: klemgrep (halvt tommelhull) + samme grep som oktaven under. */
const RECORDER_BAROQUE = {
  0:  ['T', '1', '2', '3', '4', '5', '6', '6b', '7', '7b'],
  1:  ['T', '1', '2', '3', '4', '5', '6', '6b', '7'],
  2:  ['T', '1', '2', '3', '4', '5', '6', '6b'],
  3:  ['T', '1', '2', '3', '4', '5', '6'],
  4:  ['T', '1', '2', '3', '4', '5'],
  5:  ['T', '1', '2', '3', '4', '6', '6b', '7', '7b'],
  6:  ['T', '1', '2', '3', '5', '6', '6b'],
  7:  ['T', '1', '2', '3'],
  8:  ['T', '1', '2', '4', '5', '6'],
  9:  ['T', '1', '2'],
  10: ['T', '1', '3', '4'],
  11: ['T', '1'],
  12: ['T', '2'],
  13: ['1', '2'],
  14: ['2'],
};
const RECORDER_GERMAN_DIFF = {
  5:  ['T', '1', '2', '3', '4'],
  6:  ['T', '1', '2', '3', '5', '6', '6b', '7', '7b'],
};
function recorderFingering(offset, german) {
  if (offset < 0) return null;
  const base = (o) => {
    if (german && RECORDER_GERMAN_DIFF[o]) return RECORDER_GERMAN_DIFF[o].slice();
    return RECORDER_BAROQUE[o] ? RECORDER_BAROQUE[o].slice() : null;
  };
  if (offset <= 14) {
    const f = base(offset);
    return f ? { pressed: f, half: [] } : null;
  }
  if (offset <= 26) { // klemgrep
    const f = base(offset - 12);
    if (!f) return null;
    const pressed = f.filter(x => x !== 'T');
    return { pressed: ['T'].concat(pressed), half: ['T'], pinch: true };
  }
  return null;
}

/* ---------- Saksofon (skrevet tonehøyde, B♭3–C♯6) ----------
   Alle saksofoner har samme skrevne grep. */
const L123 = ['l1', 'l2', 'l3'], R123 = ['r1', 'r2', 'r3'];
const SAX_BASE = {
  58: L123.concat(R123, ['lBb']),           // B♭3
  59: L123.concat(R123, ['lB']),            // H3
  60: L123.concat(R123, ['rC']),            // C4
  61: L123.concat(R123, ['lCs']),           // C♯4
  62: L123.concat(R123),                    // D4
  63: L123.concat(R123, ['rEb']),           // E♭4
  64: L123.concat(['r1', 'r2']),            // E4
  65: L123.concat(['r1']),                  // F4
  66: L123.concat(['r2']),                  // F♯4
  67: L123.slice(),                         // G4
  68: L123.concat(['lGs']),                 // G♯4
  69: ['l1', 'l2'],                         // A4
  70: ['l1', 'bis'],                        // B♭4 (bis)
  71: ['l1'],                               // H4
  72: ['l2'],                               // C5
  73: [],                                   // C♯5 (alt åpent)
};
const SAX_ALTS = {
  66: [L123.concat(['r3'])],
  70: [['l1', 'l2', 'sBb'], ['l1', 'r1']],
  72: [['l1', 'sC']],
};

/* ---------- Tverrfløyte (skrevet C4–C♯6) ---------- */
const FLUTE_BASE = {
  60: ['T', 'l1', 'l2', 'l3', 'r1', 'r2', 'r3', 'rC'],          // C4
  61: ['T', 'l1', 'l2', 'l3', 'r1', 'r2', 'r3', 'rCs'],         // C♯4
  62: ['T', 'l1', 'l2', 'l3', 'r1', 'r2', 'r3'],                // D4 (pinken av)
  63: ['T', 'l1', 'l2', 'l3', 'r1', 'r2', 'r3', 'rEb'],         // E♭4
  64: ['T', 'l1', 'l2', 'l3', 'r1', 'r2', 'rEb'],               // E4
  65: ['T', 'l1', 'l2', 'l3', 'r1', 'rEb'],                     // F4
  66: ['T', 'l1', 'l2', 'l3', 'r2', 'rEb'],                     // F♯4
  67: ['T', 'l1', 'l2', 'l3', 'rEb'],                           // G4
  68: ['T', 'l1', 'l2', 'l3', 'lGs', 'rEb'],                    // G♯4
  69: ['T', 'l1', 'l2', 'rEb'],                                 // A4
  70: ['T', 'l1', 'l2', 'r1', 'rEb'],                           // B♭4
  71: ['T', 'l1', 'rEb'],                                       // H4
  72: ['l1', 'rEb'],                                            // C5
  73: ['rEb'],                                                  // C♯5
};
const FLUTE_ALTS = { 70: [['T', 'l1', 'trBb', 'rEb']] };

/* ---------- Klarinett (Boehm, skrevet E3–C6) ----------
   Grunnskjema fra The Woodwind Fingering Guide (wfg.woodwind.org).
   Klangregisteret = samme grep + overblåsingsklaff, en duodesim opp. */
const CLAR_CHAL = {
  52: ['T', 'l1', 'l2', 'l3', 'r1', 'r2', 'r3', 'pE'],    // E3
  53: ['T', 'l1', 'l2', 'l3', 'r1', 'r2', 'r3', 'pF'],    // F3
  54: ['T', 'l1', 'l2', 'l3', 'r1', 'r2', 'r3', 'pFs'],   // F♯3
  55: ['T', 'l1', 'l2', 'l3', 'r1', 'r2', 'r3'],          // G3
  56: ['T', 'l1', 'l2', 'l3', 'r1', 'r2', 'r3', 'pGs'],   // G♯3
  57: ['T', 'l1', 'l2', 'l3', 'r1', 'r2'],                // A3
  58: ['T', 'l1', 'l2', 'l3', 'r1'],                      // B3 (♭)
  59: ['T', 'l1', 'l2', 'l3', 'r2'],                      // H3 (gaffelgrep)
  60: ['T', 'l1', 'l2', 'l3'],                            // C4
  61: ['T', 'l1', 'l2', 'l3', 'pCs'],                     // C♯4
  62: ['T', 'l1', 'l2'],                                  // D4
  63: ['T', 'l1', 'l2', 'sEb'],                           // E♭4 (høyre sideklaff)
  64: ['T', 'l1'],                                        // E4
  65: ['T'],                                              // F4
  66: ['l1'],                                             // F♯4
  67: [],                                                 // G4 (alt åpent)
  68: ['sGs'],                                            // G♯4 (halsklaff)
  69: ['sA'],                                             // A4
  70: ['R', 'sA'],                                        // B♭4
};

/* ---------- Strengeinstrumenter, 1. posisjon ---------- */
const STRING_SETS = {
  str_violin: { strings: [55, 62, 69, 76], names: ['G', 'D', 'A', 'E'], span: 7 },
  str_viola:  { strings: [48, 55, 62, 69], names: ['C', 'G', 'D', 'A'], span: 7 },
  str_cello:  { strings: [36, 43, 50, 57], names: ['C', 'G', 'D', 'A'], span: 5 },
  str_bass:   { strings: [40, 45, 50, 55], names: ['E', 'A', 'D', 'G'], span: 5 },
};
const FINGER_HI = { 0: '0', 1: '1', 2: '1', 3: '2', 4: '2', 5: '3', 6: '3', 7: '4' };  // fiolin/bratsj
const FINGER_LO = { 0: '0', 1: '1', 2: '1', 3: '2', 4: '3', 5: '4' };                  // cello/bass

/* ---------- Oppslag ---------- */
function chartIdFor(ins) { return ins.fing; }

// Returnerer null (ingen data) eller et objekt som beskriver grepet
function fingeringFor(ins, writtenMidi, opts) {
  const o = opts || {};
  const id = ins.fing;
  if (!id) return null;

  if (id === 'brass3' || id === 'brass4') {
    const m = writtenMidi + (ins.fsemis || 0);
    const e = FINGERINGS[m];
    if (!e) return null;
    return { kind: 'valves', layout: id, pressed: e.f === '0' ? [] : e.f.split(''),
             label: e.f, alts: (e.a || []), note: e.i || null };
  }
  if (id === 'horn_f') {
    const h = harmonicFingering(writtenMidi, 36); // skrevet C2 som grunntone
    if (!h) return null;
    const f = DROP_VALVE[h.drop];
    return { kind: 'valves', layout: 'brass3', pressed: f === '0' ? [] : f.split(''),
             label: f, alts: h.alts.map(d => DROP_VALVE[d]), note: null };
  }
  if (id === 'slide') {
    const root = ins.id === 'basstrombone' ? 34 : 34; // B♭1
    const h = harmonicFingering(writtenMidi, root);
    if (!h) return null;
    return { kind: 'slide', pos: h.drop + 1, alts: h.alts.map(d => d + 1) };
  }
  if (id === 'keys') return { kind: 'keys', midi: writtenMidi };
  if (STRING_SETS[id]) {
    const s = STRING_SETS[id];
    const map = (id === 'str_cello' || id === 'str_bass') ? FINGER_LO : FINGER_HI;
    for (let i = s.strings.length - 1; i >= 0; i--) {
      const off = writtenMidi - s.strings[i];
      if (off >= 0 && off <= s.span && map[off] !== undefined) {
        return { kind: 'strings', set: id, string: i, offset: off, finger: map[off] };
      }
    }
    return null;
  }
  if (id === 'rec_c' || id === 'rec_f') {
    const low = id === 'rec_c' ? 60 : 65;
    const r = recorderFingering(writtenMidi - low, o.german);
    if (!r) return null;
    return { kind: 'holes', layout: 'recorder', pressed: r.pressed, half: r.half || [], pinch: !!r.pinch };
  }
  if (id === 'sax') {
    let m = writtenMidi, oct = false;
    if (m >= 74 && m <= 85) { m -= 12; oct = true; }
    const f = SAX_BASE[m];
    if (!f) return null;
    const pressed = (oct ? ['T'] : []).concat(f);
    const alts = (SAX_ALTS[m] || []).map(a => (oct ? ['T'] : []).concat(a));
    return { kind: 'holes', layout: 'sax', pressed, half: [], alts };
  }
  if (id === 'flute') {
    let m = writtenMidi;
    if (m >= 74 && m <= 85) m -= 12;          // 2. oktav: samme grep
    const f = FLUTE_BASE[m];
    if (!f) return null;
    return { kind: 'holes', layout: 'flute', pressed: f.slice(), half: [],
             alts: (FLUTE_ALTS[m] || []).map(a => a.slice()) };
  }
  if (id === 'clarinet') {
    const m = writtenMidi;
    if (m >= 52 && m <= 70) {
      const f = CLAR_CHAL[m];
      return f ? { kind: 'holes', layout: 'clarinet', pressed: f.slice(), half: [] } : null;
    }
    if (m >= 71 && m <= 85) {                  // klangregister: duodesim opp (19 halvtoner)
      const f = CLAR_CHAL[m - 19];
      if (!f) return null;
      return { kind: 'holes', layout: 'clarinet', pressed: ['R'].concat(f), half: [], over: true };
    }
    return null;
  }
  return null;
}

/* ================================================================
   SVG-tegning av grep
   ================================================================ */
const INK = '#1c1712', PAPER = '#fff', DIM = '#bdb29a', HILITE = '#f2b234';

function svgWrap(w, h, body, cls) {
  return `<svg class="fing ${cls || ''}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">${body}</svg>`;
}
function keyShape(k, mode) {
  // mode: 'on' | 'off' | 'half'
  const fill = mode === 'on' ? INK : PAPER;
  const label = k.label
    ? `<text x="${k.x}" y="${k.y + k.r * 0.42}" text-anchor="middle" font-size="${Math.max(8, k.r * 1.05)}"
        font-weight="700" fill="${mode === 'on' ? PAPER : DIM}">${k.label}</text>` : '';
  let extra = '';
  if (mode === 'half') {
    extra = `<path d="M ${k.x - k.r} ${k.y} A ${k.r} ${k.r} 0 0 0 ${k.x + k.r} ${k.y} Z" fill="${INK}"/>`;
  }
  return `<circle cx="${k.x}" cy="${k.y}" r="${k.r}" fill="${fill}" stroke="${INK}" stroke-width="2"/>${extra}${label}`;
}
function diagramSVG(layoutId, pressed, half) {
  const L = FING_LAYOUTS[layoutId];
  if (!L) return '';
  const on = new Set(pressed || []), hf = new Set(half || []);
  const body = L.keys.map(k => keyShape(k, hf.has(k.id) ? 'half' : (on.has(k.id) ? 'on' : 'off'))).join('');
  return svgWrap(L.w, L.h, body, 'fing-' + layoutId);
}
function slideSVG(pos) {
  const w = 132, h = 76, x0 = 11, x1 = 123, y = 34;
  let s = `<rect x="${x0}" y="${y - 5}" width="${x1 - x0}" height="10" rx="5" fill="none" stroke="${INK}" stroke-width="2"/>`;
  for (let i = 1; i <= 7; i++) {
    const x = x0 + (x1 - x0) * (i - 1) / 6;
    const act = i === pos;
    s += `<circle cx="${x}" cy="${y}" r="${act ? 11 : 5.5}" fill="${act ? INK : PAPER}" stroke="${INK}" stroke-width="2"/>`;
    s += `<text x="${x}" y="${act ? y + 4.5 : y + 24}" text-anchor="middle" font-size="${act ? 13 : 10}"
           font-weight="800" fill="${act ? PAPER : DIM}">${i}</text>`;
  }
  return svgWrap(w, h, s, 'fing-slide');
}
const BLACK_PC = { 1: 1, 3: 1, 6: 1, 8: 1, 10: 1 };
function keysSVG(midi) {
  const start = 12 * Math.floor(midi / 12);      // C i tonens oktav
  const ww = 15, wh = 96, bw = 9.5, bh = 60, n = 14;
  const whiteOffsets = [0, 2, 4, 5, 7, 9, 11];
  let whites = '', blacks = '', idx = 0;
  for (let o = 0; o < 2; o++) for (let i = 0; i < 7; i++, idx++) {
    const m = start + o * 12 + whiteOffsets[i];
    const x = idx * ww;
    const on = m === midi;
    whites += `<rect x="${x}" y="0" width="${ww}" height="${wh}" fill="${on ? HILITE : PAPER}" stroke="${INK}" stroke-width="1.6"/>`;
    const bm = m + 1;
    if (BLACK_PC[((bm % 12) + 12) % 12] && i !== 2 && i !== 6) {
      const bx = x + ww - bw / 2;
      const bon = bm === midi;
      blacks += `<rect x="${bx}" y="0" width="${bw}" height="${bh}" rx="1.5" fill="${bon ? HILITE : INK}" stroke="${INK}" stroke-width="1.4"/>`;
    }
  }
  const label = `<text x="${ww / 2}" y="${wh - 6}" text-anchor="middle" font-size="9" font-weight="700" fill="${DIM}">C${Math.floor(start / 12) - 1}</text>`;
  return svgWrap(n * ww, wh + 2, whites + blacks + label, 'fing-keys');
}
function stringsSVG(setId, stringIdx, offset, finger) {
  const s = STRING_SETS[setId];
  const w = 74, h = 132, top = 34, bot = 124, gap = 16, x0 = 13;
  let out = `<rect x="${x0 - 7}" y="${top - 8}" width="${gap * 3 + 14}" height="7" fill="${INK}"/>`;
  for (let i = 0; i < 4; i++) {
    const x = x0 + i * gap;
    out += `<line x1="${x}" y1="${top}" x2="${x}" y2="${bot}" stroke="${INK}" stroke-width="${1 + i * 0.5}"/>`;
    out += `<text x="${x}" y="${top - 22}" text-anchor="middle" font-size="10" font-weight="700" fill="${DIM}">${s.names[i]}</text>`;
  }
  const x = x0 + stringIdx * gap;
  if (offset === 0) {
    out += `<circle cx="${x}" cy="${top - 15}" r="6.5" fill="${PAPER}" stroke="${INK}" stroke-width="2.4"/>`;
  } else {
    const y = top + (bot - top) * (offset / (s.span + 1));
    out += `<circle cx="${x}" cy="${y}" r="8.5" fill="${INK}"/>`;
    out += `<text x="${x}" y="${y + 3.5}" text-anchor="middle" font-size="10" font-weight="800" fill="${PAPER}">${finger}</text>`;
  }
  return svgWrap(w, h, out, 'fing-strings');
}
/* Full grepvisning for én tone. Returnerer {svg, label} eller null. */
function renderFingering(res) {
  if (!res) return null;
  if (res.kind === 'valves') return { svg: diagramSVG(res.layout, res.pressed, []), label: res.label, note: res.note, alts: res.alts };
  if (res.kind === 'holes')  return { svg: diagramSVG(res.layout, res.pressed, res.half), label: '', alts: res.alts };
  if (res.kind === 'slide')  return { svg: slideSVG(res.pos), label: String(res.pos), alts: res.alts };
  if (res.kind === 'keys')   return { svg: keysSVG(res.midi), label: '' };
  if (res.kind === 'strings') return { svg: stringsSVG(res.set, res.string, res.offset, res.finger), label: res.finger };
  return null;
}

/* Sammenhengende register der instrumentet faktisk har grepdata.
   Brukes til å legge sangen i riktig oktav. */
const CHART_RANGE_CACHE = {};
function chartRange(ins) {
  const key = ins.id + (ins.fing || '-');
  if (CHART_RANGE_CACHE[key]) return CHART_RANGE_CACHE[key];
  let lo = null, hi = null;
  if (ins.fing) {
    for (let m = ins.lo; m <= ins.hi; m++) {
      if (fingeringFor(ins, m)) { if (lo === null) lo = m; hi = m; }
    }
  }
  const r = (lo === null) ? { lo: ins.lo, hi: ins.hi } : { lo, hi };
  CHART_RANGE_CACHE[key] = r;
  return r;
}
