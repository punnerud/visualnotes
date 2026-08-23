/* Tester QR-koderen mot fasit fra en uavhengig implementasjon (python qrcode).
   Hver matrise ble sammenlignet modul for modul da fasiten ble laget; her
   sjekkes en sjekksum av hele matrisen, så et hvilket som helst avvik fanges. */
const { load, ok, eq, done } = require('./test_lib');
const c = load();

function fnv(s) {
  let x = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; }
  return x.toString(16).padStart(8, '0');
}
const U = 'https://punnerud.github.io/visualnotes/';
const FASIT = [
  { t: U + '?id=lisa', e: 'M', m: 0, v: 4, n: 33, h: '93512bf3' },
  { t: U + '?id=lisa', e: 'L', m: 3, v: 3, n: 29, h: 'aefcf0f3' },
  { t: U + '?id=lisa&i=tromp_bb&l=no&fs=40&ns=120&sp=60', e: 'M', m: 5, v: 5, n: 37, h: '0b32fa5a' },
  { t: 'hello world', e: 'Q', m: 1, v: 1, n: 21, h: 'f069ecb1' },
  { t: 'a', e: 'H', m: 7, v: 1, n: 21, h: 'ddfbc609' },
  { t: U + '?s=C4,D,E,F,G:h2/A:q4,G:w&t=Lisa+gikk+til+skolen&i=tromp_bb&l=no&ts=4/4&bpm=100&fs=40', e: 'M', m: 2, v: 8, n: 49, h: '73a7a395' },
  { t: 'x'.repeat(300), e: 'L', m: 4, v: 11, n: 61, h: '3e09dca9' },
  { t: 'x'.repeat(700), e: 'L', m: 6, v: 18, n: 89, h: 'd708362a' },
  { t: 'æøå ÆØÅ – notelinje', e: 'M', m: 6, v: 3, n: 29, h: 'efcb97dd' },
  { t: U + '?id=stjerne&i=piano&dir=v&ns=140', e: 'Q', m: 0, v: 6, n: 41, h: '396a45fd' },
];
FASIT.forEach(f => {
  const m = c.qrMatrix(f.t, { ecl: f.e, mask: f.m === null ? undefined : f.m });
  ok(!!m, `ingen matrise for ${JSON.stringify(f.t.slice(0, 20))}`);
  if (!m) return;
  const navn = `v${f.v} ${f.e} maske ${f.m === null ? 'auto' : f.m}`;
  eq(m.length, f.n, `${navn}: størrelse`);
  eq(fnv(m.map(r => r.join('')).join('')), f.h, `${navn}: matrisen avviker fra fasiten`);
});

/* Uten tvungen maske skal vi velge den med minst straffepoeng. Referansen
   hopper over overlappende treff i mønstersøket og lander av og til på en
   annen maske — begge gir en gyldig kode, så her testes vår egen regel. */
const autoTekst = U + '?id=stjerne&i=piano&dir=v&ns=140';
const auto = c.qrMatrix(autoTekst, { ecl: 'M' });
const alle = [];
for (let mask = 0; mask < 8; mask++) alle.push(c.qrMatrix(autoTekst, { ecl: 'M', mask }));
const straff = alle.map(m => c.qrPenalty(m));
const beste = straff.indexOf(Math.min.apply(null, straff));
eq(auto.map(r => r.join('')).join(''), alle[beste].map(r => r.join('')).join(''),
   'auto velger masken med minst straffepoeng');
ok(straff.every(p => p > 0 && p < 100000), 'straffepoengene er rimelige: ' + straff.join(','));
ok(new Set(straff).size > 1, 'maskene gir ulike straffepoeng');

/* Versjonsvalget skal følge datamengden */
eq(c.qrMatrix('a', { ecl: 'L' }).length, 21, 'kort tekst gir versjon 1');
ok(c.qrMatrix('x'.repeat(2000), { ecl: 'L' }).length > 100, 'lang tekst gir stor versjon');
eq(c.qrMatrix('x'.repeat(4000), { ecl: 'L' }), null, 'for mye data gir ingen kode');

/* Strukturen: søkemønstre, taktmønster og mørk modul */
const m1 = c.qrMatrix(U + '?id=lisa', { ecl: 'M' });
const n1 = m1.length;
[[0, 0], [0, n1 - 7], [n1 - 7, 0]].forEach(([r, cc]) => {
  eq(m1[r + 3][cc + 3], 1, 'midten av søkemønsteret er mørk');
  eq(m1[r + 1][cc + 1], 0, 'ringen rundt er lys');
});
ok([0, 1, 0, 1].every((v, i) => m1[6][8 + i] === (i % 2 === 0 ? 1 : 0)), 'taktmønsteret veksler');
eq(m1[n1 - 8][8], 1, 'den mørke modulen står');

/* SVG-en */
const svg = c.qrSVG(U + '?id=lisa', { ecl: 'M' });
ok(svg.indexOf('<svg') === 0 && svg.indexOf('</svg>') > 0, 'gyldig SVG');
ok(svg.indexOf('viewBox="0 0 41 41"') > 0, 'stille sone på fire moduler rundt');
ok(svg.split('M').length > 100, 'stien har mange moduler');

done('test_qr');
