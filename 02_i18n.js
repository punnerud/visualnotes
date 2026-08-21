/* ================================================================
   Språk og notenavn
   Basert på punnerud/notecircle (samme forfatter).
   ================================================================ */
const I18N = /*__I18N__*/{};
const LANG_ORDER = ['no', 'sv', 'da', 'en'];
// gss = norsk/svensk (H, Ess, Aiss ...), gs = dansk/tysk (H, Es, As), letters = engelsk
const NOTE_SYSTEMS = { no: 'gss', sv: 'gss', da: 'gs', en: 'letters' };

function T(path, tokens) {
  const dig = (lang) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), I18N[lang]);
  let v = dig(state.lang);
  if (v == null) v = dig('no');
  if (v == null) return path;
  if (typeof v === 'string' && tokens) v = fmt(v, tokens);
  return v;
}
function fmt(s, tokens) {
  return s.replace(/\{(\w+)\}/g, (m, k) => (tokens && k in tokens) ? tokens[k] : m);
}
function accSymbol(alt) {
  if (alt === 0) return '';
  if (alt > 0) return '♯'.repeat(alt);
  return '♭'.repeat(-alt);
}
function intlName(letter, alt) { return letter + accSymbol(alt); }

// Notenavn i språkets egen tradisjon
function nativeName(letter, alt, sys) {
  if (sys === 'letters') return intlName(letter, alt);
  if (sys === 'gss') { // norsk/svensk: dobbeltkonsonant (Ess, Ass)
    if (letter === 'B') {
      if (alt === 0) return 'H';
      if (alt === 1) return 'Hiss';
      if (alt === -1) return 'B';
      return alt > 0 ? 'H' + 'iss'.repeat(alt) : 'Hess' + 'ess'.repeat(-alt - 1);
    }
    if (alt > 0) return letter + 'iss'.repeat(alt);
    if (alt === 0) return letter;
    const single = { C: 'Cess', D: 'Dess', E: 'Ess', F: 'Fess', G: 'Gess', A: 'Ass' }[letter];
    return alt === -1 ? single : single + 'ess'.repeat(-alt - 1);
  }
  // gs = dansk/tysk: enkeltkonsonant (Es, As)
  if (letter === 'B') {
    if (alt === 0) return 'H';
    if (alt === 1) return 'His';
    if (alt === -1) return 'B';
    return alt > 0 ? 'H' + 'is'.repeat(alt) : 'Hes' + 'es'.repeat(-alt - 1);
  }
  if (alt > 0) return letter + 'is'.repeat(alt);
  if (alt === 0) return letter;
  const single = { C: 'Ces', D: 'Des', E: 'Es', F: 'Fes', G: 'Ges', A: 'As' }[letter];
  return alt === -1 ? single : single + 'es'.repeat(-alt - 1);
}
function dispNote(n, namingOverride) {
  const naming = namingOverride || (typeof state !== 'undefined' ? state.naming : 'native');
  if (naming === 'intl') return intlName(n.letter, n.alt);
  return nativeName(n.letter, n.alt, NOTE_SYSTEMS[state.lang] || 'letters');
}
function langFromNavigator(nav) {
  const raw = (nav || '').toLowerCase();
  if (raw.startsWith('nb') || raw.startsWith('nn') || raw.startsWith('no')) return 'no';
  if (raw.startsWith('sv')) return 'sv';
  if (raw.startsWith('da')) return 'da';
  if (raw.startsWith('en')) return 'en';
  return null;
}
