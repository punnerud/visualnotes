/* ================================================================
   Notasjon: notehoder, haler, faner, punkter, pauser, hjelpelinjer
   ================================================================ */
const NOTE_VALUES = [
  { dur: 4,    dot: 0 }, { dur: 4,    dot: 1 },
  { dur: 2,    dot: 0 }, { dur: 2,    dot: 1 },
  { dur: 1,    dot: 0 }, { dur: 1,    dot: 1 },
  { dur: 0.5,  dot: 0 }, { dur: 0.5,  dot: 1 },
  { dur: 0.25, dot: 0 }, { dur: 0.25, dot: 1 },
];
function beatsOf(dur, dot) { return dur * (dot === 2 ? 1.75 : dot === 1 ? 1.5 : 1); }
// Nærmeste tegnbare noteverdi for et antall taktslag
function glyphFor(beats) {
  let best = NOTE_VALUES[4], bd = Infinity;
  for (const v of NOTE_VALUES) {
    const d = Math.abs(beatsOf(v.dur, v.dot) - beats);
    if (d < bd - 1e-9) { bd = d; best = v; }
  }
  return { dur: best.dur, dot: best.dot, exact: bd < 1e-9 };
}

const STAFF = { top: 14, gap: 8, half: 4 };           // linjer: 14,22,30,38,46
const STAFF_BOTTOM = STAFF.top + STAFF.gap * 4;       // 46
const STAFF_H = 78;

function accGlyph(alt) {
  if (alt === 0) return '';
  if (alt === 1) return '♯'; if (alt === 2) return '𝄪';
  if (alt === -1) return '♭'; if (alt === -2) return '𝄫';
  return alt > 0 ? '♯'.repeat(alt) : '♭'.repeat(-alt);
}
function headY(n, clefId) {
  const c = CLEFS[clefId] || CLEFS.treble;
  return STAFF_BOTTOM - (diaIndex(n) - c.bottomDi) * STAFF.half;
}
function ledgerLines(cy, cx, halfW) {
  let s = '';
  for (let y = STAFF_BOTTOM + STAFF.gap; y <= cy + 1; y += STAFF.gap)
    s += `<line x1="${cx - halfW}" x2="${cx + halfW}" y1="${y}" y2="${y}"/>`;
  for (let y = STAFF.top - STAFF.gap; y >= cy - 1; y -= STAFF.gap)
    s += `<line x1="${cx - halfW}" x2="${cx + halfW}" y1="${y}" y2="${y}"/>`;
  return s;
}
function restBody(dur, dot, cx) {
  const mid = STAFF.top + STAFF.gap * 2;   // midtlinje = 30
  let s = '';
  if (dur >= 4) s = `<rect x="${cx - 6}" y="${STAFF.top + STAFF.gap - 5}" width="12" height="5" fill="${INK}"/>`;
  else if (dur >= 2) s = `<rect x="${cx - 6}" y="${mid - 5}" width="12" height="5" fill="${INK}"/>`;
  else if (dur >= 1) {
    s = `<path d="M ${cx - 3.5} ${mid - 12} L ${cx + 3} ${mid - 5} L ${cx - 3} ${mid + 2} L ${cx + 3.5} ${mid + 9}"
          fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M ${cx + 3.5} ${mid + 9} q -6.5 -1.5 -5 5 q 3 -3.5 6.5 -1.5" fill="${INK}"/>`;
  } else {
    const n = dur >= 0.5 ? 1 : 2;
    s = `<line x1="${cx + 3}" y1="${mid - 9}" x2="${cx - 3}" y2="${mid + 10}" stroke="${INK}" stroke-width="2"/>`;
    for (let i = 0; i < n; i++) {
      const y = mid - 9 + i * 7;
      s += `<circle cx="${cx - 2.6}" cy="${y}" r="2.4" fill="${INK}"/>`;
      s += `<path d="M ${cx - 2.6} ${y} q 5 -1 6.5 -3.5" fill="none" stroke="${INK}" stroke-width="1.8"/>`;
    }
  }
  if (dot) s += `<circle cx="${cx + 10}" cy="${mid - 4}" r="1.9" fill="${INK}"/>`;
  return s;
}
/* Én note (eller pause) tegnet på fem linjer. n = skrevet tone eller null. */
function staffSVG(n, dur, dot, clefId, w) {
  const width = w || 70;
  const cx = width / 2;
  let lines = '';
  for (let i = 0; i < 5; i++) {
    const y = STAFF.top + i * STAFF.gap;
    lines += `<line x1="2" x2="${width - 2}" y1="${y}" y2="${y}"/>`;
  }
  let body = '';
  if (!n) {
    body = restBody(dur, dot, cx);
  } else {
    const cy = headY(n, clefId);
    const hollow = dur >= 2;
    const led = ledgerLines(cy, cx, 10);
    const up = cy >= STAFF.top + STAFF.gap * 2;
    const sx = up ? cx + 5.2 : cx - 5.2;
    const sy2 = up ? cy - 26 : cy + 26;
    const stem = dur >= 4 ? '' :
      `<line x1="${sx}" x2="${sx}" y1="${cy + (up ? -0.5 : 0.5)}" y2="${sy2}" stroke="${INK}" stroke-width="1.7"/>`;
    let flag = '';
    const nFlags = dur <= 0.25 ? 2 : dur <= 0.5 ? 1 : 0;
    for (let i = 0; i < nFlags; i++) {
      const y = sy2 + (up ? i * 6.5 : -i * 6.5);
      flag += up
        ? `<path d="M ${sx} ${y} q 8 3 7.5 11 q -2.5 -6 -7.5 -7 z" fill="${INK}"/>`
        : `<path d="M ${sx} ${y} q 8 -3 7.5 -11 q -2.5 6 -7.5 7 z" fill="${INK}"/>`;
    }
    const head = `<ellipse cx="${cx}" cy="${cy}" rx="5.7" ry="4.1" transform="rotate(-16 ${cx} ${cy})"
        fill="${hollow ? '#fff' : INK}" stroke="${INK}" stroke-width="${hollow ? 2 : 0}"/>`;
    const acc = n.alt ? `<text x="${cx - 11}" y="${cy + 4.5}" text-anchor="middle" font-size="14"
        font-weight="700" fill="${INK}">${accGlyph(n.alt)}</text>` : '';
    const dotG = dot ? `<circle cx="${cx + 11}" cy="${cy - (Math.round((STAFF_BOTTOM - cy) / STAFF.half) % 2 === 0 ? 4 : 0)}" r="1.9" fill="${INK}"/>` : '';
    body = `<g stroke="${INK}" stroke-width="1.1">${led}</g>${stem}${flag}${head}${acc}${dotG}`;
  }
  return `<svg class="staff" viewBox="0 0 ${width} ${STAFF_H}" width="${width}" height="${STAFF_H}" aria-hidden="true">
    <g stroke="${INK}" stroke-width="1.1">${lines}</g>${body}</svg>`;
}
