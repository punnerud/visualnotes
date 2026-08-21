/* ================================================================
   Kjerne: tonemodell, transponering, instrumenter
   Deler av denne fila er hentet fra punnerud/notecircle (samme forfatter).
   ================================================================ */

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_SEMIS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LETTER_FIFTHS = { C: 0, D: 2, E: 4, F: -1, G: 1, A: 3, B: 5 };

function noteMidi(n) { return 12 * (n.oct + 1) + LETTER_SEMIS[n.letter] + n.alt; }
function diaIndex(n) { return n.oct * 7 + LETTERS.indexOf(n.letter); }
function fifthsOf(t) { return LETTER_FIFTHS[t.letter] + 7 * t.alt; }
function tonicFromFifths(f) {
  const idx = (((f + 1) % 7) + 7) % 7;
  return { letter: 'FCGDAEB'[idx], alt: Math.floor((f + 1) / 7) };
}
// Respell om stavemåten havner utenfor de 15 standardsignaturene (unngår dobbeltkryss).
function normalizeSpelling(out) {
  const sig = fifthsOf(out);
  if (sig > 7) return tonicFromFifths(sig - 12);
  if (sig < -7) return tonicFromFifths(sig + 12);
  return out;
}

/* Transponer en stavemåte (letter/alt/oct) med (letters, semis).
   skrevet = klingende + (letters, semis) — samme konvensjon som notecircle. */
function transposeBy(n, letters, semis) {
  if (!letters && !semis) return { letter: n.letter, alt: n.alt, oct: n.oct };
  const i = LETTERS.indexOf(n.letter);
  const li = i + letters;
  const nl = LETTERS[((li % 7) + 7) % 7];
  const octShift = Math.floor(li / 7);
  const base = LETTER_SEMIS[n.letter] + n.alt;
  const naturalRel = LETTER_SEMIS[nl] + 12 * octShift;
  const sp = normalizeSpelling({ letter: nl, alt: base + semis - naturalRel });
  // Oktav settes fra faktisk midi, slik at respelling ikke flytter tonen
  const target = noteMidi(n) + semis;
  let oct = n.oct + octShift;
  const guess = () => 12 * (oct + 1) + LETTER_SEMIS[sp.letter] + sp.alt;
  while (guess() - target >= 12) oct--;
  while (target - guess() >= 12) oct++;
  return { letter: sp.letter, alt: sp.alt, oct };
}

/* Enkel stavemåte fra midi (brukes når URL-en oppgir ventiltall e.l.) */
const SHARP_SPELL = [['C',0],['C',1],['D',0],['E',-1],['E',0],['F',0],['F',1],['G',0],['A',-1],['A',0],['B',-1],['B',0]];
function spellMidi(m) {
  const pc = ((m % 12) + 12) % 12;
  const [letter, alt] = SHARP_SPELL[pc];
  const oct = Math.floor(m / 12) - 1 - (letter === 'B' && alt === 0 && pc === 11 ? 0 : 0);
  const n = { letter, alt, oct };
  // juster oktav slik at midi stemmer (Cb/B# forekommer ikke i tabellen over)
  n.oct += Math.round((m - noteMidi(n)) / 12);
  return n;
}

/* ---------------- Nøkler (clefs) ----------------
   bottomDi = diatonisk indeks for nederste notelinje. */
const CLEFS = {
  treble: { bottomDi: 30, centerMidi: 71 }, // E4 nederst
  alto:   { bottomDi: 24, centerMidi: 60 }, // F3 nederst
  bass:   { bottomDi: 18, centerMidi: 50 }, // G2 nederst
};

/* ---------------- Grep for 3-ventils messing (skrevet tonehøyde) ----------------
   Hentet uendret fra notecircle. f = hovedgrep, a = alternativer, i = intonasjonsmerknad. */
const FINGERINGS = {
  54: { f: '123', i: 'i123' },
  55: { f: '13',  i: 'i13' },
  56: { f: '23' },
  57: { f: '12', a: ['3'] },
  58: { f: '1' },
  59: { f: '2' },
  60: { f: '0' },
  61: { f: '123', i: 'i123' },
  62: { f: '13',  i: 'i13' },
  63: { f: '23' },
  64: { f: '12', a: ['3'] },
  65: { f: '1' },
  66: { f: '2' },
  67: { f: '0' },
  68: { f: '23' },
  69: { f: '12', a: ['3'] },
  70: { f: '1' },
  71: { f: '2' },
  72: { f: '0' },
  73: { f: '12', a: ['3', '123'] },
  74: { f: '1',  a: ['13'] },
  75: { f: '2',  a: ['23'] },
  76: { f: '0',  a: ['12'], i: 'i5th' },
  77: { f: '1' },
  78: { f: '2' },
  79: { f: '0',  a: ['13'] },
  80: { f: '23' },
  81: { f: '12', a: ['3'] },
  82: { f: '1' },
  83: { f: '2' },
  84: { f: '0' },
  85: { f: '12', i: 'ihigh12' },
  86: { f: '1',  i: 'ihigh' },
  87: { f: '2',  i: 'ihigh' },
  88: { f: '0',  i: 'ihigh' },
  89: { f: '1',  i: 'ihigh' },
  90: { f: '2',  i: 'ihigh' },
  91: { f: '0',  i: 'ihigh' },
};

/* ---------------- Instrumenter ----------------
   skrevet = klingende + (letters, semis). lo/hi = skrevet register i midi.
   fing = id på grepstabell i 03_fingering.js (null = kun noter).
   Tabellen er hentet fra notecircle og utvidet med blokkfløyte. */
const INSTRUMENTS = [
  { id: 'violin',      family: 'violinF',    group: 'strings',  clef: 'treble', letters: 0,   semis: 0,   fing: 'str_violin', lo: 55, hi: 91 },
  { id: 'viola',       family: 'violaF',     group: 'strings',  clef: 'alto',   letters: 0,   semis: 0,   fing: 'str_viola',  lo: 48, hi: 81 },
  { id: 'cello',       family: 'celloF',     group: 'strings',  clef: 'bass',   letters: 0,   semis: 0,   fing: 'str_cello',  lo: 36, hi: 67 },
  { id: 'dbass',       family: 'dbassF',     group: 'strings',  clef: 'bass',   letters: 7,   semis: 12,  fing: 'str_bass',   lo: 40, hi: 67 },
  { id: 'blokkfloyte_c', family: 'recorder', group: 'woodwind', clef: 'treble', letters: -7,  semis: -12, fing: 'rec_c',      lo: 60, hi: 86 },
  { id: 'blokkfloyte_f', family: 'recorder', group: 'woodwind', clef: 'treble', letters: 0,   semis: 0,   fing: 'rec_f',      lo: 65, hi: 91 },
  { id: 'piccolo',     family: 'flute',      group: 'woodwind', clef: 'treble', letters: -7,  semis: -12, fing: 'flute',      lo: 62, hi: 93 },
  { id: 'flute',       family: 'flute',      group: 'woodwind', clef: 'treble', letters: 0,   semis: 0,   fing: 'flute',      lo: 60, hi: 93 },
  { id: 'altflute',    family: 'flute',      group: 'woodwind', clef: 'treble', letters: 3,   semis: 5,   fing: 'flute',      lo: 60, hi: 89 },
  { id: 'oboe',        family: 'oboe',       group: 'woodwind', clef: 'treble', letters: 0,   semis: 0,   fing: null,         lo: 58, hi: 86 },
  { id: 'englhorn',    family: 'oboe',       group: 'woodwind', clef: 'treble', letters: 4,   semis: 7,   fing: null,         lo: 59, hi: 86 },
  { id: 'klar_bb',     family: 'clarinet',   group: 'woodwind', clef: 'treble', letters: 1,   semis: 2,   fing: 'clarinet',   lo: 52, hi: 91 },
  { id: 'klar_a',      family: 'clarinet',   group: 'woodwind', clef: 'treble', letters: 2,   semis: 3,   fing: 'clarinet',   lo: 52, hi: 91 },
  { id: 'klar_eb',     family: 'clarinet',   group: 'woodwind', clef: 'treble', letters: -2,  semis: -3,  fing: 'clarinet',   lo: 52, hi: 88 },
  { id: 'bassklar',    family: 'clarinet',   group: 'woodwind', clef: 'treble', letters: 8,   semis: 14,  fing: 'clarinet',   lo: 51, hi: 84 },
  { id: 'fagott',      family: 'bassoon',    group: 'woodwind', clef: 'bass',   letters: 0,   semis: 0,   fing: null,         lo: 34, hi: 64 },
  { id: 'kontrafag',   family: 'bassoon',    group: 'woodwind', clef: 'bass',   letters: 7,   semis: 12,  fing: null,         lo: 34, hi: 60 },
  { id: 'sopransax',   family: 'sax',        group: 'woodwind', clef: 'treble', letters: 1,   semis: 2,   fing: 'sax',        lo: 58, hi: 88 },
  { id: 'altsax',      family: 'sax',        group: 'woodwind', clef: 'treble', letters: 5,   semis: 9,   fing: 'sax',        lo: 58, hi: 88 },
  { id: 'tenorsax',    family: 'sax',        group: 'woodwind', clef: 'treble', letters: 8,   semis: 14,  fing: 'sax',        lo: 58, hi: 88 },
  { id: 'barisax',     family: 'sax',        group: 'woodwind', clef: 'treble', letters: 12,  semis: 21,  fing: 'sax',        lo: 57, hi: 88 },
  { id: 'tromp_bb',    family: 'trumpet',    group: 'brass',    clef: 'treble', letters: 1,   semis: 2,   fing: 'brass3',     lo: 54, hi: 91 },
  { id: 'tromp_c',     family: 'trumpet',    group: 'brass',    clef: 'treble', letters: 0,   semis: 0,   fing: 'brass3',     lo: 54, hi: 91 },
  { id: 'tromp_d',     family: 'trumpet',    group: 'brass',    clef: 'treble', letters: -1,  semis: -2,  fing: 'brass3',     lo: 54, hi: 89 },
  { id: 'tromp_eb',    family: 'trumpet',    group: 'brass',    clef: 'treble', letters: -2,  semis: -3,  fing: 'brass3',     lo: 54, hi: 89 },
  { id: 'picctromp',   family: 'trumpet',    group: 'brass',    clef: 'treble', letters: -6,  semis: -10, fing: 'brass4',     lo: 54, hi: 86 },
  { id: 'kornett_bb',  family: 'trumpet',    group: 'brass',    clef: 'treble', letters: 1,   semis: 2,   fing: 'brass3',     lo: 54, hi: 89 },
  { id: 'kornett_eb',  family: 'trumpet',    group: 'brass',    clef: 'treble', letters: -2,  semis: -3,  fing: 'brass3',     lo: 54, hi: 88 },
  { id: 'flygelhorn',  family: 'trumpet',    group: 'brass',    clef: 'treble', letters: 1,   semis: 2,   fing: 'brass3',     lo: 54, hi: 86 },
  { id: 'basstromp',   family: 'trumpet',    group: 'brass',    clef: 'treble', letters: 8,   semis: 14,  fing: 'brass3',     lo: 54, hi: 84 },
  { id: 'horn_f',      family: 'horn',       group: 'brass',    clef: 'treble', letters: 4,   semis: 7,   fing: 'horn_f',     lo: 46, hi: 81 },
  { id: 'althorn',     family: 'horn',       group: 'brass',    clef: 'treble', letters: 5,   semis: 9,   fing: 'brass3',     lo: 54, hi: 84 },
  { id: 'trombone',    family: 'trombone',   group: 'brass',    clef: 'bass',   letters: 0,   semis: 0,   fing: 'slide',      lo: 40, hi: 70 },
  { id: 'basstrombone',family: 'trombone',   group: 'brass',    clef: 'bass',   letters: 0,   semis: 0,   fing: 'slide',      lo: 34, hi: 67 },
  { id: 'eufonium_c',  family: 'euphonium',  group: 'brass',    clef: 'bass',   letters: 0,   semis: 0,   fing: 'brass3', fsemis: 14, lo: 34, hi: 70 },
  { id: 'eufonium_bb', family: 'euphonium',  group: 'brass',    clef: 'treble', letters: 8,   semis: 14,  fing: 'brass3',     lo: 54, hi: 84 },
  { id: 'tuba',        family: 'tuba',       group: 'brass',    clef: 'bass',   letters: 0,   semis: 0,   fing: 'brass3', fsemis: 26, lo: 28, hi: 58 },
  { id: 'tuba_eb',     family: 'tuba',       group: 'brass',    clef: 'treble', letters: 12,  semis: 21,  fing: 'brass3',     lo: 54, hi: 82 },
  { id: 'tuba_bb',     family: 'tuba',       group: 'brass',    clef: 'treble', letters: 15,  semis: 26,  fing: 'brass3',     lo: 54, hi: 80 },
  { id: 'piano',       family: 'pianoF',     group: 'other',    clef: 'treble', letters: 0,   semis: 0,   fing: 'keys',       lo: 36, hi: 96 },
  { id: 'klokkespill', family: 'percussion', group: 'other',    clef: 'treble', letters: -14, semis: -24, fing: 'keys',       lo: 55, hi: 84 },
  { id: 'xylofon',     family: 'percussion', group: 'other',    clef: 'treble', letters: -7,  semis: -12, fing: 'keys',       lo: 60, hi: 89 },
  { id: 'sang',        family: 'voiceF',     group: 'other',    clef: 'treble', letters: 0,   semis: 0,   fing: null,         lo: 48, hi: 84 },
];
const INSTR_BY_ID = {};
INSTRUMENTS.forEach(x => { INSTR_BY_ID[x.id] = x; });
const INSTR_GROUP_ORDER = ['brass', 'woodwind', 'strings', 'other'];

const FAMILIES = [
  { id: 'trumpet',    group: 'brass',    std: 'tromp_bb' },
  { id: 'horn',       group: 'brass',    std: 'horn_f' },
  { id: 'trombone',   group: 'brass',    std: 'trombone' },
  { id: 'euphonium',  group: 'brass',    std: 'eufonium_bb' },
  { id: 'tuba',       group: 'brass',    std: 'tuba_bb' },
  { id: 'recorder',   group: 'woodwind', std: 'blokkfloyte_c' },
  { id: 'flute',      group: 'woodwind', std: 'flute' },
  { id: 'oboe',       group: 'woodwind', std: 'oboe' },
  { id: 'clarinet',   group: 'woodwind', std: 'klar_bb' },
  { id: 'bassoon',    group: 'woodwind', std: 'fagott' },
  { id: 'sax',        group: 'woodwind', std: 'altsax' },
  { id: 'violinF',    group: 'strings',  std: 'violin' },
  { id: 'violaF',     group: 'strings',  std: 'viola' },
  { id: 'celloF',     group: 'strings',  std: 'cello' },
  { id: 'dbassF',     group: 'strings',  std: 'dbass' },
  { id: 'pianoF',     group: 'other',    std: 'piano' },
  { id: 'percussion', group: 'other',    std: 'klokkespill' },
  { id: 'voiceF',     group: 'other',    std: 'sang' },
];
const FAMILY_BY_ID = {};
FAMILIES.forEach(f => {
  f.members = [f.std].concat(INSTRUMENTS.filter(x => x.family === f.id && x.id !== f.std).map(x => x.id));
  FAMILY_BY_ID[f.id] = f;
});

/* Klingende -> skrevet for valgt instrument */
function toWritten(n, ins) { return transposeBy(n, ins.letters, ins.semis); }
/* Skrevet -> klingende */
function toConcert(n, ins) { return transposeBy(n, -ins.letters, -ins.semis); }
