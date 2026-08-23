/* ================================================================
   QR-kode: nok av standarden til å lage en lenke som kan skannes.
   Byte-modus, versjon 1–40, alle fire feilrettingsnivåer.
   Blokktabellene er hentet ut av en referanseimplementasjon, og hele
   matrisen er sammenlignet med den samme referansen i test_qr.js.
   ================================================================ */
/* Blokkstruktur per versjon og nivå, hentet fra referansen (python qrcode). */
const RS_BLOCKS = {
  L: [[[1,26,19]],[[1,44,34]],[[1,70,55]],[[1,100,80]],[[1,134,108]],[[2,86,68]],[[2,98,78]],[[2,121,97]],[[2,146,116]],[[2,86,68],[2,87,69]],[[4,101,81]],[[2,116,92],[2,117,93]],[[4,133,107]],[[3,145,115],[1,146,116]],[[5,109,87],[1,110,88]],[[5,122,98],[1,123,99]],[[1,135,107],[5,136,108]],[[5,150,120],[1,151,121]],[[3,141,113],[4,142,114]],[[3,135,107],[5,136,108]],[[4,144,116],[4,145,117]],[[2,139,111],[7,140,112]],[[4,151,121],[5,152,122]],[[6,147,117],[4,148,118]],[[8,132,106],[4,133,107]],[[10,142,114],[2,143,115]],[[8,152,122],[4,153,123]],[[3,147,117],[10,148,118]],[[7,146,116],[7,147,117]],[[5,145,115],[10,146,116]],[[13,145,115],[3,146,116]],[[17,145,115]],[[17,145,115],[1,146,116]],[[13,145,115],[6,146,116]],[[12,151,121],[7,152,122]],[[6,151,121],[14,152,122]],[[17,152,122],[4,153,123]],[[4,152,122],[18,153,123]],[[20,147,117],[4,148,118]],[[19,148,118],[6,149,119]]],
  M: [[[1,26,16]],[[1,44,28]],[[1,70,44]],[[2,50,32]],[[2,67,43]],[[4,43,27]],[[4,49,31]],[[2,60,38],[2,61,39]],[[3,58,36],[2,59,37]],[[4,69,43],[1,70,44]],[[1,80,50],[4,81,51]],[[6,58,36],[2,59,37]],[[8,59,37],[1,60,38]],[[4,64,40],[5,65,41]],[[5,65,41],[5,66,42]],[[7,73,45],[3,74,46]],[[10,74,46],[1,75,47]],[[9,69,43],[4,70,44]],[[3,70,44],[11,71,45]],[[3,67,41],[13,68,42]],[[17,68,42]],[[17,74,46]],[[4,75,47],[14,76,48]],[[6,73,45],[14,74,46]],[[8,75,47],[13,76,48]],[[19,74,46],[4,75,47]],[[22,73,45],[3,74,46]],[[3,73,45],[23,74,46]],[[21,73,45],[7,74,46]],[[19,75,47],[10,76,48]],[[2,74,46],[29,75,47]],[[10,74,46],[23,75,47]],[[14,74,46],[21,75,47]],[[14,74,46],[23,75,47]],[[12,75,47],[26,76,48]],[[6,75,47],[34,76,48]],[[29,74,46],[14,75,47]],[[13,74,46],[32,75,47]],[[40,75,47],[7,76,48]],[[18,75,47],[31,76,48]]],
  Q: [[[1,26,13]],[[1,44,22]],[[2,35,17]],[[2,50,24]],[[2,33,15],[2,34,16]],[[4,43,19]],[[2,32,14],[4,33,15]],[[4,40,18],[2,41,19]],[[4,36,16],[4,37,17]],[[6,43,19],[2,44,20]],[[4,50,22],[4,51,23]],[[4,46,20],[6,47,21]],[[8,44,20],[4,45,21]],[[11,36,16],[5,37,17]],[[5,54,24],[7,55,25]],[[15,43,19],[2,44,20]],[[1,50,22],[15,51,23]],[[17,50,22],[1,51,23]],[[17,47,21],[4,48,22]],[[15,54,24],[5,55,25]],[[17,50,22],[6,51,23]],[[7,54,24],[16,55,25]],[[11,54,24],[14,55,25]],[[11,54,24],[16,55,25]],[[7,54,24],[22,55,25]],[[28,50,22],[6,51,23]],[[8,53,23],[26,54,24]],[[4,54,24],[31,55,25]],[[1,53,23],[37,54,24]],[[15,54,24],[25,55,25]],[[42,54,24],[1,55,25]],[[10,54,24],[35,55,25]],[[29,54,24],[19,55,25]],[[44,54,24],[7,55,25]],[[39,54,24],[14,55,25]],[[46,54,24],[10,55,25]],[[49,54,24],[10,55,25]],[[48,54,24],[14,55,25]],[[43,54,24],[22,55,25]],[[34,54,24],[34,55,25]]],
  H: [[[1,26,9]],[[1,44,16]],[[2,35,13]],[[4,25,9]],[[2,33,11],[2,34,12]],[[4,43,15]],[[4,39,13],[1,40,14]],[[4,40,14],[2,41,15]],[[4,36,12],[4,37,13]],[[6,43,15],[2,44,16]],[[3,36,12],[8,37,13]],[[7,42,14],[4,43,15]],[[12,33,11],[4,34,12]],[[11,36,12],[5,37,13]],[[11,36,12],[7,37,13]],[[3,45,15],[13,46,16]],[[2,42,14],[17,43,15]],[[2,42,14],[19,43,15]],[[9,39,13],[16,40,14]],[[15,43,15],[10,44,16]],[[19,46,16],[6,47,17]],[[34,37,13]],[[16,45,15],[14,46,16]],[[30,46,16],[2,47,17]],[[22,45,15],[13,46,16]],[[33,46,16],[4,47,17]],[[12,45,15],[28,46,16]],[[11,45,15],[31,46,16]],[[19,45,15],[26,46,16]],[[23,45,15],[25,46,16]],[[23,45,15],[28,46,16]],[[19,45,15],[35,46,16]],[[11,45,15],[46,46,16]],[[59,46,16],[1,47,17]],[[22,45,15],[41,46,16]],[[2,45,15],[64,46,16]],[[24,45,15],[46,46,16]],[[42,45,15],[32,46,16]],[[10,45,15],[67,46,16]],[[20,45,15],[61,46,16]]],
};
const ALIGN_POS = [
  [],
  [6,18],
  [6,22],
  [6,26],
  [6,30],
  [6,34],
  [6,22,38],
  [6,24,42],
  [6,26,46],
  [6,28,50],
  [6,30,54],
  [6,32,58],
  [6,34,62],
  [6,26,46,66],
  [6,26,48,70],
  [6,26,50,74],
  [6,30,54,78],
  [6,30,56,82],
  [6,30,58,86],
  [6,34,62,90],
  [6,28,50,72,94],
  [6,26,50,74,98],
  [6,30,54,78,102],
  [6,28,54,80,106],
  [6,32,58,84,110],
  [6,30,58,86,114],
  [6,34,62,90,118],
  [6,26,50,74,98,122],
  [6,30,54,78,102,126],
  [6,26,52,78,104,130],
  [6,30,56,82,108,134],
  [6,34,60,86,112,138],
  [6,30,58,86,114,142],
  [6,34,62,90,118,146],
  [6,30,54,78,102,126,150],
  [6,24,50,76,102,128,154],
  [6,28,54,80,106,132,158],
  [6,32,58,84,110,136,162],
  [6,26,54,82,110,138,166],
  [6,30,58,86,114,142,170]
];

/* ---------------- Galois-feltet GF(256) ---------------- */
const GF_EXP = new Array(512), GF_LOG = new Array(256);
(function () {
  let x = 1;
  for (let i = 0; i < 255; i++) { GF_EXP[i] = x; GF_LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();
function gfMul(a, b) { return (a === 0 || b === 0) ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]]; }
function polyMul(a, b) {
  const r = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) r[i + j] ^= gfMul(a[i], b[j]);
  }
  return r;
}
function rsGenerator(n) {
  let g = [1];
  for (let i = 0; i < n; i++) g = polyMul(g, [1, GF_EXP[i]]);
  return g;
}
function rsRemainder(data, n) {
  const g = rsGenerator(n);
  const buf = data.concat(new Array(n).fill(0));
  for (let i = 0; i < data.length; i++) {
    const c = buf[i];
    if (!c) continue;
    for (let j = 0; j < g.length; j++) buf[i + j] ^= gfMul(g[j], c);
  }
  return buf.slice(data.length);
}

/* ---------------- Data ---------------- */
const QR_ECL = { L: 1, M: 0, Q: 3, H: 2 };        // bitmønsteret i formatinformasjonen
function utf8Bytes(str) {
  const out = [];
  for (const ch of unescape(encodeURIComponent(str))) out.push(ch.charCodeAt(0) & 0xff);
  return out;
}
function blocksFor(version, ecl) { return RS_BLOCKS[ecl][version - 1]; }
function dataCapacity(version, ecl) {
  return blocksFor(version, ecl).reduce((a, g) => a + g[0] * g[2], 0);
}
function qrVersionFor(bytes, ecl, minVersion) {
  for (let v = minVersion || 1; v <= 40; v++) {
    const countBits = v < 10 ? 8 : 16;
    if (dataCapacity(v, ecl) * 8 >= 4 + countBits + bytes.length * 8) return v;
  }
  return 0;
}
function qrCodewords(bytes, version, ecl) {
  const bits = [];
  const push = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >> i) & 1); };
  push(4, 4);                                   // byte-modus
  push(bytes.length, version < 10 ? 8 : 16);
  bytes.forEach(b => push(b, 8));
  const cap = dataCapacity(version, ecl) * 8;
  for (let i = 0; i < 4 && bits.length < cap; i++) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  }
  const pads = [0xec, 0x11];
  for (let i = 0; data.length < cap / 8; i++) data.push(pads[i % 2]);

  // del i blokker, regn feilretting, og flett sammen
  const groups = blocksFor(version, ecl);
  const dataBlocks = [], ecBlocks = [];
  let p = 0;
  groups.forEach(g => {
    for (let i = 0; i < g[0]; i++) {
      const d = data.slice(p, p + g[2]); p += g[2];
      dataBlocks.push(d);
      ecBlocks.push(rsRemainder(d, g[1] - g[2]));
    }
  });
  const out = [];
  const maxD = Math.max.apply(null, dataBlocks.map(b => b.length));
  for (let i = 0; i < maxD; i++) dataBlocks.forEach(b => { if (i < b.length) out.push(b[i]); });
  const maxE = Math.max.apply(null, ecBlocks.map(b => b.length));
  for (let i = 0; i < maxE; i++) ecBlocks.forEach(b => { if (i < b.length) out.push(b[i]); });
  return out;
}

/* ---------------- Matrisen ---------------- */
function qrMaskBit(m, i, j) {
  switch (m) {
    case 0: return (i + j) % 2 === 0;
    case 1: return i % 2 === 0;
    case 2: return j % 3 === 0;
    case 3: return (i + j) % 3 === 0;
    case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
    case 5: return ((i * j) % 2) + ((i * j) % 3) === 0;
    case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
    default: return (((i + j) % 2) + ((i * j) % 3)) % 2 === 0;
  }
}
function bchFormat(bits) {
  let d = bits << 10;
  for (let i = 14; i >= 10; i--) if ((d >> i) & 1) d ^= 0x537 << (i - 10);
  return ((bits << 10) | d) ^ 0x5412;
}
function bchVersion(v) {
  let d = v << 12;
  for (let i = 17; i >= 12; i--) if ((d >> i) & 1) d ^= 0x1f25 << (i - 12);
  return (v << 12) | d;
}
function qrBuild(text, version, ecl, mask) {
  const n = 17 + 4 * version;
  const m = [], fixed = [];
  for (let i = 0; i < n; i++) { m.push(new Array(n).fill(0)); fixed.push(new Array(n).fill(0)); }
  const set = (i, j, v) => { m[i][j] = v ? 1 : 0; fixed[i][j] = 1; };

  // søkemønstre med skillelinjer
  [[0, 0], [0, n - 7], [n - 7, 0]].forEach(([r, c]) => {
    for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) {
      const y = r + i, x = c + j;
      if (y < 0 || y >= n || x < 0 || x >= n) continue;
      const on = (i >= 0 && i <= 6 && (j === 0 || j === 6)) ||
                 (j >= 0 && j <= 6 && (i === 0 || i === 6)) ||
                 (i >= 2 && i <= 4 && j >= 2 && j <= 4);
      set(y, x, on);
    }
  });
  // taktmønstre
  for (let i = 8; i < n - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  // justeringsmønstre
  // Justeringsmønstre: alle unntatt de tre som ville ligget oppå søkemønstrene.
  // De som deler rad eller kolonne med taktmønsteret skal tegnes.
  const pos = ALIGN_POS[version - 1], last = pos.length - 1;
  pos.forEach((r, ri) => pos.forEach((c, ci) => {
    if ((ri === 0 && ci === 0) || (ri === 0 && ci === last) || (ri === last && ci === 0)) return;
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
      set(r + i, c + j, Math.max(Math.abs(i), Math.abs(j)) !== 1);
    }
  }));
  // mørk modul og reservert plass til formatinformasjon
  set(n - 8, 8, 1);
  for (let i = 0; i <= 8; i++) { if (!fixed[8][i]) set(8, i, 0); if (!fixed[i][8]) set(i, 8, 0); }
  for (let i = n - 8; i < n; i++) { if (!fixed[8][i]) set(8, i, 0); if (!fixed[i][8]) set(i, 8, 0); }
  // versjonsinformasjon
  if (version >= 7) {
    const bits = bchVersion(version);
    for (let i = 0; i < 18; i++) {
      const b = (bits >> i) & 1;
      set(Math.floor(i / 3), n - 11 + (i % 3), b);
      set(n - 11 + (i % 3), Math.floor(i / 3), b);
    }
  }

  // data i sikksakk
  const cw = qrCodewords(utf8Bytes(text), version, ecl);
  let bit = 0;
  const nextBit = () => {
    const byte = cw[bit >> 3];
    const v = byte === undefined ? 0 : (byte >> (7 - (bit & 7))) & 1;
    bit++;
    return v;
  };
  let up = true;
  for (let col = n - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let k = 0; k < n; k++) {
      const row = up ? n - 1 - k : k;
      for (let c = 0; c < 2; c++) {
        const j = col - c;
        if (fixed[row][j]) continue;
        m[row][j] = nextBit() ^ (qrMaskBit(mask, row, j) ? 1 : 0);
      }
    }
    up = !up;
  }

  // formatinformasjon
  const fmt = bchFormat((QR_ECL[ecl] << 3) | mask);
  for (let i = 0; i < 15; i++) {
    const b = (fmt >> (14 - i)) & 1;      // mest signifikante bit først
    if (i < 6) m[8][i] = b;
    else if (i < 8) m[8][i + 1] = b;
    else if (i === 8) m[7][8] = b;
    else m[14 - i][8] = b;
    // Andre kopi: de sju første bitene loddrett nederst, over den mørke
    // modulen, og de åtte siste vannrett ut mot høyre kant.
    if (i < 7) m[n - 1 - i][8] = b;
    else m[8][n - 15 + i] = b;
  }
  return m;
}
function qrPenalty(m) {
  const n = m.length;
  let p = 0;
  const run = (get) => {
    for (let i = 0; i < n; i++) {
      let prev = -1, len = 0;
      for (let j = 0; j < n; j++) {
        const v = get(i, j);
        if (v === prev) { len++; if (len === 5) p += 3; else if (len > 5) p += 1; }
        else { prev = v; len = 1; }
      }
    }
  };
  run((i, j) => m[i][j]);
  run((i, j) => m[j][i]);
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1; j++) {
      const v = m[i][j];
      if (v === m[i][j + 1] && v === m[i + 1][j] && v === m[i + 1][j + 1]) p += 3;
    }
  }
  const pat1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], pat2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  const scan = (get) => {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j + 11 <= n; j++) {
        let a = true, b = true;
        for (let k = 0; k < 11; k++) {
          const v = get(i, j + k);
          if (v !== pat1[k]) a = false;
          if (v !== pat2[k]) b = false;
        }
        if (a || b) p += 40;
      }
    }
  };
  scan((i, j) => m[i][j]);
  scan((i, j) => m[j][i]);
  let dark = 0;
  m.forEach(row => row.forEach(v => { if (v) dark++; }));
  p += Math.floor(Math.abs(dark * 100 / (n * n) - 50) / 5) * 10;
  return p;
}
/* Lager matrisen med det mønsteret som gir minst straff. */
function qrMatrix(text, opts) {
  const o = opts || {};
  const ecl = o.ecl || 'M';
  const bytes = utf8Bytes(text);
  const version = o.version || qrVersionFor(bytes, ecl, o.minVersion);
  if (!version) return null;
  if (o.mask !== undefined && o.mask !== null) return qrBuild(text, version, ecl, o.mask);
  let best = null, bestP = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const m = qrBuild(text, version, ecl, mask);
    const p = qrPenalty(m);
    if (p < bestP) { bestP = p; best = m; }
  }
  return best;
}
/* Tegner matrisen som én sti, så selv en stor kode blir et lite element. */
function qrSVG(text, opts) {
  const o = opts || {};
  const m = qrMatrix(text, o);
  if (!m) return '';
  const n = m.length, q = o.quiet === undefined ? 4 : o.quiet, size = n + q * 2;
  let d = '';
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) if (m[i][j]) d += `M${j + q} ${i + q}h1v1h-1z`;
  }
  return `<svg class="qr" viewBox="0 0 ${size} ${size}" width="100%" height="100%"
    shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
