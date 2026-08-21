/* Tester grepdata mot kjente referansegrep, og at tabellene er hele. */
const { load, ok, eq, done } = require('./test_lib');
const c = load();

const I = c.INSTR_BY_ID;
const fg = (id, midi, o) => c.fingeringFor(I[id], midi, o);
const valves = (id, midi) => { const f = fg(id, midi); return f ? f.label : null; };
const holes = (id, midi, o) => { const f = fg(id, midi, o); return f ? f.pressed.slice().sort().join(' ') : null; };

/* --- 3-ventils messing (tabellen er hentet fra notecircle) --- */
const LISA = [['C', '0'], ['D', '13'], ['E', '12'], ['F', '1'], ['G', '0'], ['A', '12']];
const M = { C: 60, D: 62, E: 64, F: 65, G: 67, A: 69 };
LISA.forEach(([n, f]) => eq(valves('tromp_bb', M[n]), f, 'trompet skrevet ' + n));
eq(valves('tromp_bb', 72), '0', 'trompet C5 åpen');
eq(valves('tromp_bb', 76), '0', 'trompet E5 åpen');
eq(valves('tromp_bb', 54), '123', 'trompet laveste F♯3');
ok(fg('tromp_bb', 53) === null, 'under registeret gir null');
eq(valves('kornett_bb', 62), '13', 'kornett samme tabell');
eq(valves('tuba_bb', 62), '13', 'B♭-tuba (G-nøkkel) samme tabell');
// C-instrumenter i bassnøkkel bruker samme grep, forskjøvet
eq(valves('eufonium_c', 48), valves('eufonium_bb', 62), 'eufonium C3 = skrevet D4');
eq(valves('tuba', 36), valves('tuba_bb', 62), 'tuba C2 = skrevet D4');

/* --- valthorn (beregnet fra overtonerekka) --- */
[[64, '0'], [65, '1'], [66, '2'], [67, '0'], [69, '12'], [70, '1'], [71, '2'], [72, '0'], [63, '2'], [61, '12']]
  .forEach(([m, f]) => eq(valves('horn_f', m), f, 'valthorn skrevet midi ' + m));

/* --- trombone (beregnet posisjon) --- */
[[46, 1], [45, 2], [44, 3], [43, 4], [53, 1], [52, 2], [51, 3], [50, 4], [58, 1], [62, 1], [65, 1]]
  .forEach(([m, p]) => eq(fg('trombone', m).pos, p, 'trombone midi ' + m));

/* --- strengeinstrumenter, 1. posisjon --- */
eq(fg('violin', 55).finger, '0', 'fiolin G-streng løs');
eq(fg('violin', 69).finger, '0', 'fiolin A-streng løs');
eq(fg('violin', 71).finger, '1', 'fiolin H4 = 1. finger');
eq(fg('violin', 72).finger, '2', 'fiolin C5 = 2. finger');
eq(fg('violin', 76).string, 3, 'fiolin E5 = løs E-streng');
eq(fg('cello', 36).finger, '0', 'cello C-streng løs');
eq(fg('cello', 38).finger, '1', 'cello D2 = 1. finger');

/* --- tangenter --- */
eq(fg('piano', 61).midi, 61, 'piano gir tonen selv');

/* --- blokkfløyte (barokk) --- */
eq(holes('blokkfloyte_c', 60), '1 2 3 4 5 6 6b 7 7b T', 'blokkfløyte laveste C alle hull');
eq(holes('blokkfloyte_c', 67), '1 2 3 T', 'blokkfløyte G = T123');
eq(holes('blokkfloyte_c', 69), '1 2 T', 'blokkfløyte A = T12');
eq(holes('blokkfloyte_c', 71), '1 T', 'blokkfløyte H = T1');
eq(holes('blokkfloyte_c', 72), '2 T', 'blokkfløyte C (2. okt) = T2');
eq(holes('blokkfloyte_c', 74), '2', 'blokkfløyte D (2. okt) = 2');
eq(holes('blokkfloyte_c', 65), '1 2 3 4 6 6b 7 7b T', 'barokk F (gaffelgrep, hull 5 åpent)');
eq(holes('blokkfloyte_c', 66), '1 2 3 5 6 6b T', 'barokk F♯');
eq(holes('blokkfloyte_c', 68), '1 2 4 5 6 T', 'barokk G♯');
eq(holes('blokkfloyte_c', 70), '1 3 4 T', 'barokk B♭');
eq(holes('blokkfloyte_c', 63), '1 2 3 4 5 6 T', 'barokk E♭ (halvt dobbelthull)');
eq(holes('blokkfloyte_c', 65, { german: true }), '1 2 3 4 T', 'tysk F');
ok(fg('blokkfloyte_c', 77).pinch === true, 'andre oktav bruker klemgrep');
ok(fg('blokkfloyte_c', 77).half.indexOf('T') >= 0, 'klemgrep = halvt tommelhull');
eq(holes('blokkfloyte_f', 65), holes('blokkfloyte_c', 60), 'altblokkfløyte F = samme mønster som sopran C');

/* --- saksofon --- */
eq(holes('altsax', 62), 'l1 l2 l3 r1 r2 r3', 'sax D4');
eq(holes('altsax', 67), 'l1 l2 l3', 'sax G4');
eq(holes('altsax', 69), 'l1 l2', 'sax A4');
eq(holes('altsax', 71), 'l1', 'sax H4');
eq(holes('altsax', 73), '', 'sax C♯5 er åpent');
eq(holes('altsax', 74), 'T l1 l2 l3 r1 r2 r3', 'sax D5 = D4 + oktavklaff');
eq(holes('tenorsax', 74), holes('altsax', 74), 'alle saksofoner har samme skrevne grep');
eq(holes('altsax', 58), 'l1 l2 l3 lBb r1 r2 r3', 'sax laveste B♭');
ok(fg('altsax', 86) === null, 'over C♯6 finnes ikke i tabellen');

/* --- fløyte --- */
eq(holes('flute', 62), 'T l1 l2 l3 r1 r2 r3', 'fløyte D4 (pinken av)');
eq(holes('flute', 63), 'T l1 l2 l3 r1 r2 r3 rEb', 'fløyte E♭4 med E♭-klaffen');
eq(holes('flute', 74), holes('flute', 62), 'fløyte D5 = samme grep som D4');
eq(holes('flute', 72), 'l1 rEb', 'fløyte C5');
eq(holes('flute', 71), 'T l1 rEb', 'fløyte H4');

/* --- klarinett --- */
eq(holes('klar_bb', 52), 'T l1 l2 l3 pE r1 r2 r3', 'klarinett laveste E3');
eq(holes('klar_bb', 60), 'T l1 l2 l3', 'klarinett C4');
eq(holes('klar_bb', 69), 'sA', 'klarinett A4 (halsklaff)');
ok(fg('klar_bb', 71).over === true, 'klarinett H4 bruker overblåsingsklaffen');
eq(holes('klar_bb', 71), 'R T l1 l2 l3 pE r1 r2 r3', 'klarinett H4 = E3 + register (duodesim opp)');
eq(holes('klar_bb', 62), 'T l1 l2', 'klarinett D4');
eq(holes('klar_bb', 59), 'T l1 l2 l3 r2', 'klarinett H3 er et gaffelgrep');
eq(holes('klar_bb', 67), '', 'klarinett G4 er alt åpent');
eq(holes('klar_bb', 79), holes('klar_bb', 60).split(' ').concat('R').sort().join(' '), 'klarinett G5 = C4 + register');

/* --- dekning og entydighet --- */
const RANGES = {
  tromp_bb: [54, 91], kornett_bb: [54, 89], altsax: [58, 85], flute: [60, 85],
  klar_bb: [52, 85], blokkfloyte_c: [60, 86], blokkfloyte_f: [65, 91],
  horn_f: [48, 79], trombone: [40, 70], violin: [55, 76], piano: [36, 96],
};
for (const [id, [lo, hi]] of Object.entries(RANGES)) {
  let miss = [];
  for (let m = lo; m <= hi; m++) if (!c.fingeringFor(I[id], m)) miss.push(m);
  ok(miss.length === 0, `${id}: mangler grep for ${miss.join(',')}`);
}
for (const id of ['altsax', 'flute', 'klar_bb', 'blokkfloyte_c']) {
  const r = RANGES[id];
  let dup = [];
  for (let m = r[0]; m < r[1]; m++) {
    const a = holes(id, m), b = holes(id, m + 1);
    if (a !== null && a === b) dup.push(m);
  }
  ok(dup.length === 0, `${id}: like grep på nabotoner ${dup.join(',')}`);
}

/* --- tegning --- */
for (const id of ['tromp_bb', 'altsax', 'blokkfloyte_c', 'trombone', 'piano', 'violin', 'klar_bb', 'flute']) {
  const r = c.renderFingering(c.fingeringFor(I[id], id === 'trombone' ? 53 : (id === 'violin' ? 71 : (id === 'klar_bb' ? 60 : 67))));
  ok(r && r.svg.indexOf('<svg') === 0 && r.svg.indexOf('</svg>') > 0, id + ' tegner gyldig SVG');
}
ok(c.fingeringFor(I.fagott, 50) === null, 'fagott har ingen grepdata (dokumentert)');

done('test_fingering');

/* --- registeret der grepdata finnes --- */
const R = id => c.chartRange(I[id]);
eq(R('violin'), { lo: 55, hi: 83 }, 'fiolin 1. posisjon dekker G3–H5');
eq(R('cello').hi, 62, 'cello 1. posisjon slutter på D4');
eq(R('tromp_bb'), { lo: 54, hi: 91 }, 'trompet dekker hele registeret');
eq(R('altsax'), { lo: 58, hi: 85 }, 'saksofon B♭3–C♯6');
eq(R('fagott'), { lo: 34, hi: 64 }, 'uten grepdata brukes instrumentets register');
