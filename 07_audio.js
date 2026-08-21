/* ================================================================
   Lyd: tone, metronom og planlegger (Web Audio)
   brassTone er hentet fra punnerud/notecircle.
   ================================================================ */
let AC = null;
function ensureAC() {
  if (!AC) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    AC = new Ctor();
  }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function midiFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

function brassTone(ac, freq, t0, dur, dest, gainMul) {
  const g = ac.createGain(), peak = 0.30 * (gainMul || 1);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.03);
  g.gain.exponentialRampToValueAtTime(peak * 0.66, t0 + Math.min(0.18, dur * 0.5));
  g.gain.setValueAtTime(peak * 0.66, t0 + Math.max(0.08, dur - 0.06));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  const f = ac.createBiquadFilter();
  f.type = 'lowpass'; f.Q.value = 0.9;
  f.frequency.setValueAtTime(Math.min(Math.max(freq * 3.2, 300), 3800), t0);
  f.frequency.exponentialRampToValueAtTime(Math.min(Math.max(freq * 5.5, 400), 4800), t0 + 0.06);
  const o1 = ac.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = freq; o1.detune.value = -4;
  const o2 = ac.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = freq; o2.detune.value = 5;
  o1.connect(f); o2.connect(f); f.connect(g); g.connect(dest || ac.destination);
  o1.start(t0); o2.start(t0); o1.stop(t0 + dur + 0.05); o2.stop(t0 + dur + 0.05);
}
function reedTone(ac, freq, t0, dur, dest) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.26, t0 + 0.05);
  g.gain.setValueAtTime(0.26, t0 + Math.max(0.08, dur - 0.07));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 1.4;
  f.frequency.setValueAtTime(Math.min(freq * 4, 5000), t0);
  const o1 = ac.createOscillator(); o1.type = 'triangle'; o1.frequency.value = freq;
  const o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq * 2; o2.detune.value = 3;
  const g2 = ac.createGain(); g2.gain.value = 0.25;
  o1.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(dest || ac.destination);
  o1.start(t0); o2.start(t0); o1.stop(t0 + dur + 0.05); o2.stop(t0 + dur + 0.05);
}
function pluckTone(ac, freq, t0, dur, dest) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.32, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.min(dur + 0.4, 2.2));
  const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = freq;
  const o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq * 2;
  const g2 = ac.createGain(); g2.gain.value = 0.3;
  o.connect(g); o2.connect(g2); g2.connect(g); g.connect(dest || ac.destination);
  o.start(t0); o2.start(t0);
  o.stop(t0 + dur + 0.5); o2.stop(t0 + dur + 0.5);
}
function playTone(midi, dur, when, group) {
  const ac = ensureAC(); if (!ac) return;
  const t0 = when === undefined ? ac.currentTime + 0.01 : when;
  const f = midiFreq(midi);
  const d = Math.max(0.12, Math.min(dur || 0.5, 4));
  if (group === 'brass') brassTone(ac, f, t0, d);
  else if (group === 'woodwind' || group === 'strings') reedTone(ac, f, t0, d);
  else pluckTone(ac, f, t0, d);
}
function click(when, accent) {
  const ac = ensureAC(); if (!ac) return;
  const t0 = when === undefined ? ac.currentTime + 0.01 : when;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(accent ? 1600 : 1050, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(accent ? 0.28 : 0.16, t0 + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.055);
  o.connect(g); g.connect(ac.destination);
  o.start(t0); o.stop(t0 + 0.07);
}

/* ---------------- Planlegger ---------------- */
const player = {
  playing: false, timer: null, notes: [], clicks: [], ni: 0, ci: 0,
  onNote: null, onStop: null, t0: 0, endTime: 0,
};
function buildSchedule(events, opts) {
  const o = opts, spb = 60 / o.bpm;
  const notes = [];
  let t = 0;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    notes.push({ i, t, dur: e.beats * spb, rest: e.rest, midi: e.rest ? null : e.midi });
    t += e.beats * spb;
  }
  const clicks = [];
  const unit = beatUnit(o.ts) * spb;
  const per = barBeats(o.ts) * spb;
  const startOffset = o.upbeat ? (per - o.upbeat * spb) : 0;
  for (let x = 0; x < t - 1e-6; x += unit) {
    const inBar = (x + startOffset) % per;
    clicks.push({ t: x, accent: Math.abs(inBar) < 1e-6 || Math.abs(inBar - per) < 1e-6 });
  }
  return { notes, clicks, total: t, spb, unit };
}
function startPlayback(events, opts) {
  const ac = ensureAC(); if (!ac) return false;
  stopPlayback();
  const from = opts.from || 0;
  const sc = buildSchedule(events.slice(from), opts);
  const lead = 0.12 + (opts.countIn ? opts.countIn * sc.unit : 0);
  player.t0 = ac.currentTime + lead;
  player.notes = sc.notes.map(n => ({ ...n, i: n.i + from }));
  player.clicks = opts.metronome ? sc.clicks : [];
  if (opts.countIn && opts.metronome) {
    for (let k = opts.countIn; k > 0; k--) player.clicks.unshift({ t: -k * sc.unit, accent: k === opts.countIn });
  }
  player.ni = 0; player.ci = 0; player.playing = true;
  player.endTime = player.t0 + sc.total;
  player.opts = opts;
  player.timer = setInterval(() => tick(ac), 25);
  tick(ac);
  return true;
}
function tick(ac) {
  if (!player.playing) return;
  const now = ac.currentTime, horizon = now + 0.15, o = player.opts;
  while (player.ci < player.clicks.length && player.t0 + player.clicks[player.ci].t < horizon) {
    const c = player.clicks[player.ci++];
    click(player.t0 + c.t, c.accent);
  }
  while (player.ni < player.notes.length && player.t0 + player.notes[player.ni].t < horizon) {
    const n = player.notes[player.ni++];
    if (o.tone && !n.rest) playTone(n.midi + (o.transpose || 0), n.dur * 0.92, player.t0 + n.t, o.group);
    const delay = Math.max(0, (player.t0 + n.t - now) * 1000);
    setTimeout(() => { if (player.playing && player.onNote) player.onNote(n.i); }, delay);
  }
  if (now > player.endTime + 0.05) {
    const cb = player.onStop; stopPlayback(); if (cb) cb();
  }
}
function stopPlayback() {
  player.playing = false;
  if (player.timer) clearInterval(player.timer);
  player.timer = null;
}
