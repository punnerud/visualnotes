/* ================================================================
   Sangbibliotek — kun melodier som er fri bruk (folketoner eller
   komponister døde for mer enn 100 år siden). Klingende tonehøyde.
   Ingen sangtekst er lagt inn: teksten/oversettelsen kan være vernet
   selv om melodien er fri. Bruk &w= for egne stavelser.
   ================================================================ */
const SONGS = [
  { id: 'lisa', src: 'trad', ts: '4/4', bpm: 100,
    title: { no: 'Lisa gikk til skolen', sv: 'Lisa gick till skolan', da: 'Lisa gik i skole', en: 'Lisa Went to School' },
    s: 'C4 D E F G:2 G:2 | A*4 G:4 | F*4 E:2 E:2 | D*4 C:4' },

  { id: 'stjerne', src: 'trad', ts: '4/4', bpm: 96,
    title: { no: 'Blinke, blinke lille stjerne', sv: 'Blinka lilla stjärna', da: 'Blink, blink lille stjerne', en: 'Twinkle, Twinkle, Little Star' },
    s: 'C4 C G G A A G:2 | F F E E D D C:2 | G G F F E E D:2 | G G F F E E D:2 | C C G G A A G:2 | F F E E D D C:2' },

  { id: 'baebae', src: 'trad', ts: '4/4', bpm: 96,
    title: { no: 'Bæ, bæ, lille lam', sv: 'Bä, bä, vita lamm', da: 'Bæ, bæ, lille lam', en: 'Baa, Baa, Black Sheep' },
    s: 'C4 C G G A A G:2 | F F E E D D C:2 | G G F F E E D:2 | G G F F E E D:2 | C C G G A A G:2 | F F E E D D C:2' },

  { id: 'jakob', src: 'trad', ts: '4/4', bpm: 104,
    title: { no: 'Fader Jakob', sv: 'Broder Jakob', da: 'Mester Jakob', en: 'Frère Jacques' },
    s: 'C4 D E C | C D E C | E F G:2 | E F G:2 | G:.5 A:.5 G:.5 F:.5 E C | G:.5 A:.5 G:.5 F:.5 E C | C G3 C4:2 | C4 G3 C4:2' },

  { id: 'mary', src: 'trad', ts: '4/4', bpm: 100,
    title: { no: 'Mary hadde et lite lam', sv: 'Mary hade ett litet lamm', da: 'Mary havde et lille lam', en: 'Mary Had a Little Lamb' },
    s: 'E4 D C D E E E:2 | D D D:2 E G G:2 | E D C D E E E E | D D E D C:4' },

  { id: 'ro', src: 'trad', ts: '6/8', bpm: 108,
    title: { no: 'Ro, ro, ro din båt', sv: 'Ro, ro, ro din båt', da: 'Ro, ro, ro din båd', en: 'Row, Row, Row Your Boat' },
    s: 'C4:1.5 C:1.5 | C:1 D:.5 E:1.5 | E:1 D:.5 E:1 F:.5 | G:3 | C5:.5*3 G4:.5*3 E:.5*3 C:.5*3 | G:1 F:.5 E:1 D:.5 | C:3' },

  { id: 'glede', src: 'beethoven', ts: '4/4', bpm: 108,
    title: { no: 'Ode til gleden', sv: 'Glädjens ode', da: 'Ode til glæden', en: 'Ode to Joy' },
    s: 'E4 E F G | G F E D | C C D E | E:1.5 D:.5 D:2 | E E F G | G F E D | C C D E | D:1.5 C:.5 C:2' },

  { id: 'bjelleklang', src: 'pierpont', ts: '4/4', bpm: 120,
    title: { no: 'Bjelleklang', sv: 'Bjällerklang', da: 'Bjældeklang', en: 'Jingle Bells' },
    s: 'E4*2 E:2 | E*2 E:2 | E G C D E:4 | F*4 | F E E E:.5 E:.5 | E D D E D:2 G:2' },

  { id: 'durskala', src: 'exercise', ts: '4/4', bpm: 84,
    title: { no: 'C-durskala', sv: 'C-durskala', da: 'C-durskala', en: 'C major scale' },
    s: 'C4 D E F G A B C5 | C5 B A G F E D C4' },

  { id: 'femtoner', src: 'exercise', ts: '4/4', bpm: 80,
    title: { no: 'Femtonersøvelse', sv: 'Femtonsövning', da: 'Femtoneøvelse', en: 'Five-note exercise' },
    s: 'C4 D E F G:4 | G F E D C:4 | C:2 E:2 G:2 E:2 | C:4 -:4' },

  { id: 'kromatisk', src: 'exercise', ts: '4/4', bpm: 72,
    title: { no: 'Kromatisk øvelse', sv: 'Kromatisk övning', da: 'Kromatisk øvelse', en: 'Chromatic exercise' },
    s: 'C4 C# D D# E F | F# G G# A A# B | C5:4 | B4 A# A G# G F# | F E D# D C# C4:4 -:1' },
];
const SONG_BY_ID = {};
SONGS.forEach(s => { SONG_BY_ID[s.id] = s; });
