/* Tester lydplanleggeren og kompensasjonen for utgangsforsinkelse. */
const { load, ok, eq, done } = require('./test_lib');
const c = load();

/* --- utgangsforsinkelse --- */
eq(c.outputLatency({ outputLatency: 0.21 }), 0.21, 'outputLatency brukes når den finnes');
eq(c.outputLatency({ baseLatency: 0.012 }), 0.012, 'baseLatency som reserve');
eq(c.outputLatency({ outputLatency: 0, baseLatency: 0.02 }), 0.02, 'null faller videre til baseLatency');
eq(c.outputLatency({}), 0, 'ingen opplysning gir null');
eq(c.outputLatency(null), 0, 'uten kontekst gir null');
eq(c.outputLatency({ outputLatency: -1 }), 0, 'negativ verdi klippes');
eq(c.outputLatency({ outputLatency: 9 }), 0.5, 'urimelig stor verdi klippes');
eq(c.outputLatency({ outputLatency: 'x', baseLatency: 0.03 }), 0.03, 'feil type hoppes over');

/* --- planen som lages --- */
const ev = c.parseSong('C4 D:2 E').events;
const sc = c.buildSchedule(ev, { bpm: 120, ts: '4/4', upbeat: 0 });
eq(sc.total, 2, 'fire slag i 120 BPM er to sekunder');
eq(sc.notes.map(n => +n.t.toFixed(3)).join(' '), '0 0.5 1.5', 'starttider');
eq(sc.notes.map(n => +n.dur.toFixed(3)).join(' '), '0.5 1 0.5', 'varigheter i sekunder');
eq(sc.clicks.filter(x => x.accent).length, 1, 'ett aksentert slag i én takt');
ok(sc.clicks.every(x => x.t >= 0 && x.t < sc.total), 'ingen klikk etter siste tone');

const c34 = c.buildSchedule(c.parseSong('C4 D E | F G A').events, { bpm: 60, ts: '3/4', upbeat: 0 });
eq(c34.clicks.filter(x => x.accent).length, 2, 'to takter i 3/4 gir to aksenter');
eq(c34.unit, 1, 'slagenhet i 3/4 er ett sekund i 60 BPM');
// unit er i sekunder: 6/8 teller punkterte firedeler = 1,5 slag = 0,75 s i 120 BPM
eq(c.buildSchedule(ev, { bpm: 120, ts: '6/8', upbeat: 0 }).unit, 0.75, '6/8 teller punkterte');

/* --- opptakt flytter aksenten --- */
const up = c.buildSchedule(c.parseSong('G4 | C5 D E F').events, { bpm: 60, ts: '4/4', upbeat: 1 });
eq(+up.clicks[1].t.toFixed(3), 1, 'aksenten kommer på taktstarten etter opptakten');
ok(up.clicks[1].accent && !up.clicks[0].accent, 'opptaktsslaget er ikke aksentert');

done('test_audio');
