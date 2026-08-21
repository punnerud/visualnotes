/* Tester tolking av tonerekker, ventiltall og URL-format. */
const { load, ok, eq, done } = require('./test_lib');
const c = load();

// --- tonenavn ---
eq(c.parseNoteName('C4'), { letter: 'C', alt: 0, oct: 4 }, 'C4');
eq(c.parseNoteName('F#4'), { letter: 'F', alt: 1, oct: 4 }, 'F#4');
eq(c.parseNoteName('Bb3'), { letter: 'B', alt: -1, oct: 3 }, 'Bb3');
eq(c.parseNoteName('H'), { letter: 'B', alt: 0, oct: null }, 'H = B♮');
eq(c.parseNoteName('B'), { letter: 'B', alt: 0, oct: null }, 'B = B♮');
eq(c.parseNoteName('Hess'), { letter: 'B', alt: -1, oct: null }, 'Hess = B♭');
eq(c.parseNoteName('Hes'), { letter: 'B', alt: -1, oct: null }, 'Hes = B♭');
eq(c.parseNoteName('Ciss5'), { letter: 'C', alt: 1, oct: 5 }, 'Ciss5');
eq(c.parseNoteName('Es'), { letter: 'E', alt: -1, oct: null }, 'Es');
eq(c.parseNoteName('As2'), { letter: 'A', alt: -1, oct: 2 }, 'As2');
eq(c.parseNoteName('sol'), { letter: 'G', alt: 0, oct: null }, 'sol');
eq(c.parseNoteName('mi3'), { letter: 'E', alt: 0, oct: 3 }, 'mi3');
ok(c.parseNoteName('Q') === null, 'ugyldig tonenavn gir null');

// --- lengder ---
eq(c.parseDuration('2'), 2, ':2');
eq(c.parseDuration('.5'), 0.5, ':.5');
eq(c.parseDuration('1.5'), 1.5, ':1.5');
eq(c.parseDuration('h'), 2, ':h');
eq(c.parseDuration('q.'), 1.5, ':q.');
eq(c.parseDuration('e'), 0.5, ':e');
eq(c.parseDuration('s'), 0.25, ':s');
ok(c.parseDuration('zz') === null, 'ukjent lengde gir null');

// --- tonerekke ---
let r = c.parseSong('C4 D E F G:2 G:2 | A*4 G:4');
eq(r.errors, [], 'ingen feil');
eq(r.events.length, 11, 'antall hendelser');
eq(r.events.map(e => e.letter + e.oct).join(' '), 'C4 D4 E4 F4 G4 G4 A4 A4 A4 A4 G4', 'oktavvalg');
eq(r.events[4].beats, 2, 'G:2 er to slag');
eq(r.events[6].phrase, 1, 'frasemarkering');
eq(r.events[10].dur + '/' + r.events[10].dot, '4/0', 'helnote');

r = c.parseSong('C:1.5 D:.5 - r:2');
eq(r.events.map(e => (e.rest ? '-' : e.letter) + ':' + e.beats).join(' '), 'C:1.5 D:0.5 -:1 -:2', 'pauser og punktert');
eq(r.events[0].dot, 1, 'punktert firedel');

eq(c.parseSong('G3 C5 A').events.map(e => e.letter + e.oct).join(' '), 'G3 C5 A4', 'nærmeste oktav');
eq(c.parseSong('C~ C:2 D').events.map(e => e.letter + ':' + e.beats).join(' '), 'C:3 D:1', 'bindebue slår sammen');
eq(c.parseSong('C4 || D').events[1].phrase, 2, 'dobbel frase');
eq(c.parseSong('C4 Xx D').errors, ['Xx'], 'feil rapporteres');

// --- ventiltall ---
r = c.parseValves('0 13 12 1 0 0 12*4');
eq(r.errors, [], 'ventiler uten feil');
eq(r.events.map(e => e.letter + e.oct).join(' '), 'C4 D4 E4 F4 G4 G4 A4 A4 A4 A4', 'ventiler -> toner');
eq(c.parseValves('0 123 13').events.map(e => e.midi).join(' '), '60 61 62', 'kromatisk fra ventiler');

// --- taktart ---
eq(c.barBeats('4/4'), 4, '4/4');
eq(c.barBeats('3/4'), 3, '3/4');
eq(c.barBeats('6/8'), 3, '6/8');
eq(c.beatUnit('6/8'), 1.5, '6/8 teller punkterte');
eq(c.beatUnit('2/4'), 1, '2/4');

const ev = c.markBars(c.parseSong('C4 D E F | G A B C5').events, '4/4', 0);
eq(ev.map(e => e.bar ? 1 : 0).join(''), '00001000', 'taktstrek etter fire slag');

// --- serialisering ---
const round = c.parseSong(c.songToTokens(c.parseSong('C4 D E F G:2 G:2 | A*4').events));
eq(round.events.map(e => e.letter + e.oct + ':' + e.beats).join(' '),
   c.parseSong('C4 D E F G:2 G:2 | A*4').events.map(e => e.letter + e.oct + ':' + e.beats).join(' '),
   'tur-retur gjennom songToTokens');

// --- planlegging ---
const sc = c.buildSchedule(c.parseSong('C4 D:2 E').events, { bpm: 120, ts: '4/4', upbeat: 0 });
eq(sc.total, 2, 'fire slag i 120 BPM = 2 sekunder');
eq(sc.notes.map(n => +n.t.toFixed(3)).join(' '), '0 0.5 1.5', 'starttider');
eq(sc.clicks.filter(x => x.accent).length, 1, 'ett aksentert slag i én takt');

done('test_url');
