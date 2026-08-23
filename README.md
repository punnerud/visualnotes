# visualnotes 🎺🎼

**Spill en sang tone for tone — med riktig grep for ditt instrument.** Hele sangen ligger i URL-en, så
en LLM kan lage en lenke som åpner akkurat den sangen du vil øve på.

**Prøv den: [punnerud.github.io/visualnotes](https://punnerud.github.io/visualnotes/)**

Fire språk (norsk · svenska · dansk · English) · grepdiagram for messing, blokkfløyte, saksofon, fløyte,
klarinett, strykere, trombone og tangenter · noteverdier og pauser · metronom, tone og automatisk bytte ·
utskriftsvennlig · MIT-lisens.

*Play a song one note at a time, with the fingering for your own instrument. The whole song lives in the
URL, so an LLM can generate a link. Four languages, no build step in the browser, no dependencies.*

---

## Kom i gang

| Lenke | Hva den gjør |
|---|---|
| [`?id=lisa`](https://punnerud.github.io/visualnotes/?id=lisa) | Innebygget sang |
| [`?s=C4,D,E,F,G:h2`](https://punnerud.github.io/visualnotes/?s=C4,D,E,F,G:h2) | Egne toner |
| [`?v=0 13 12 1 0`](https://punnerud.github.io/visualnotes/?v=0+13+12+1+0) | Ventiltall i stedet for tonenavn |
| [`?id=glede&i=altsax&l=sv`](https://punnerud.github.io/visualnotes/?id=glede&i=altsax&l=sv) | Altsaksofon, svensk |

Innstillinger (⚙) husker språk, instrument, lyd og utskriftsvalg i en cookie i ett år. Alt du endrer
speiles i URL-en, så lenken i adressefeltet er alltid den du kan dele.

**Tempo** justeres rett over avspillingsknappen: − og + hopper til nærmeste runde ti, og trykker du på
tallet kan du skrive inn et nøyaktig tempo. `↺` ved siden av setter det tilbake til melodiens eget.
Endrer du tempo mens den spiller, fortsetter den i det nye tempoet fra tonen du står på.
▶ spiller alltid fra første tone. Tonerekka kan dras sidelengs med musa, og hjulet blar vannrett.
Rett under kortene ligger **notebåndet**: én sammenhengende notelinje med taktstreker og pauser, der
bredden på hver tone er nøyaktig proporsjonal med hvor lenge den varer — så du ser hvor lang neste tone
er før du kommer dit. Under avspilling glir båndet jevnt mot venstre gjennom hele sangen, mens
spillehodet står stille på midten, rett under kortet som spilles. Kortene med grep hopper én tone om
gangen, så du ser tydelig når neste grep treffer, mens notebildet flyter som musikken. Spilte toner
dempes. Du kan trykke på en tone i båndet for å hoppe presist dit, eller **dra i båndet** for å spole — det er
den korteste veien tilbake til begynnelsen, og kortene følger med. Linja blir liggende der du slipper
den, med litt slark forbi første og siste tone, så den ikke stopper i en vegg. Musehjulet spoler likedan.

### Retning

Instrumenter med grepdiagram på høykant — trompet, blokkfløyte, saksofon, fløyte, klarinett, strykere —
viser grepene på rekke som glir sidelengs, med notebåndet under.

For **piano, klokkespill, xylofon og trombone** ligger diagrammet på tvers. Da faller grepene i stedet
nedover som i Guitar Hero — kommende toner ligger over, og spilte toner glir bak båndet og ut nederst —
mens notebåndet krysser tvers over ved landingslinja. Alle kortene er like høye, så du ser like mange
kommende grep uansett rytme; hvor lenge tonen varer leser du av båndet. Krysset midt i bildet er tonen som spilles nå: den står samtidig på landingslinja over
og med notehodet på spillehodet i båndet.

I begge tilfeller er det samme notebånd, og notene leses vannrett slik de skal.

Standarden følger instrumentet, men kan overstyres i innstillingene eller med `dir=h` / `dir=v`. I
fallende modus er piltast opp neste tone og ned forrige, og banen kan dras med musa eller fingeren.

**Lyd og bilde i takt.** En tone som leveres til lydkortet høres først et lite øyeblikk etter — på en
telefon 100–250 ms, mer over Bluetooth. Appen leser `outputLatency` fra nettleseren og forsinker bildet
tilsvarende, så notehodet treffer spillehodet i samme øyeblikk som tonen høres. Safari underrapporterer
ofte, så innstillingene har en **lydforsinkelse** du kan justere selv, med en liten kalibrator: den slår
takten som en metronom og lar to prikker lyse vekselvis, og du drar til prikken blinker samtidig som
klikket høres. Verdien huskes per enhet.

**Fra grep til noter.** «Størrelse på grep» og «Størrelse på noter» i innstillingene trapper de to
delene opp og ned hver for seg, fra full størrelse til av. Skru grepene ned, og bare notene står igjen;
skru notene ned, og eleven ser bare grep. Notebåndet krymper i begge retninger samtidig, så notene står
like tett som de er store.
Kortene blir både lavere og smalere med, så flere toner er synlige og notebåndet får mer plass etter
hvert som eleven trenger grepene mindre — på piano går kortet fra 330 til 166 piksler mellom 100 % og
30 %. Mens du drar i størrelsen — eller i «Luft mellom notene» — blir panelet nesten gjennomsiktig, så du
ser hva du justerer. Bare raden du holder i blir stående, så du fortsatt ser tallet, og et halvt sekund
etter at du slipper kommer menyen tilbake. Verdiene kan deles i lenken med `fs=` og `ns=`, for eksempel
[`?id=lisa&fs=40`](https://punnerud.github.io/visualnotes/?id=lisa&fs=40) eller
[`?id=lisa&ns=0`](https://punnerud.github.io/visualnotes/?id=lisa&ns=0).

**Utskrift** (🖨) viser arket i faktisk størrelse med de samme margene som skrives ut, så
forhåndsvisningen er det du får. Standard er liggende A4 på 80 %. En linje med toner deles aldri over
et sideskift. Velg «Standard» marger i utskriftsdialogen og slå av topp- og bunntekst.

---

## URL-format

Alt kan settes med GET-parametere. Korte navn er de kanoniske; de lange i parentes virker også.

| Parameter | Betydning | Standard |
|---|---|---|
| `s` (`song`, `notes`) | tonerekka — se grammatikken under | — |
| `v` (`valves`) | ventiltall i stedet for tonenavn: `0 13 12 1 0` | — |
| `id` | innebygget sang, f.eks. `lisa`, `stjerne`, `glede` | `lisa` |
| `t` (`title`) | tittel som vises øverst | sangens tittel |
| `i` (`instr`) | instrument-id, f.eks. `tromp_bb`, `altsax`, `blokkfloyte_c` | `tromp_bb` |
| `l` (`lang`) | `no`, `sv`, `da`, `en` | nettleserens språk, ellers `no` |
| `p` (`pitch`) | `w` = tokenene er **skrevet** tonehøyde (det spilleren leser), `c` = **klingende** | `w` |
| `k` (`key`) | transponer hele sangen n halvtoner (`-24`…`24`) | auto |
| `ts` | taktart, f.eks. `3/4`, `6/8` | `4/4` |
| `up` | opptakt i taktslag | `0` |
| `bpm` (`tempo`) | tempo 30–240 | `100` |
| `auto` | `1` = start avspilling med én gang (nettleseren krever ett trykk før lyd) | `0` |
| `met` | metronom av/på | `1` |
| `tone` | spill tonen av/på | `1` |
| `count` | antall opptellingsslag før start | `4` |
| `dir` | retning: `auto`, `h` (sidelengs) eller `v` (fallende) | `auto` |
| `off` | lydforsinkelse i millisekunder, −300…300 | `0` |
| `air` | luft mellom notene, `0`–`1.6` | `0.6` |
| `fs` | størrelse på grepdiagrammet i prosent, `0`–`100`. `0` gir bare noter | `100` |
| `ns` | størrelse på notebåndet i prosent, `0`–`100`. `0` gir bare grep | `100` |
| `bars` | `0` skjuler taktstrekene | `1` |
| `w` (`words`) | stavelser under notene: `Li\|sa\|gikk\|til\|sko\|len` | — |
| `n` | `native` (H, Ess) eller `intl` (B, E♭) | `native` |

### Tonerekka (`s=`)

Én tone per ord, skilt med komma:

```
C4,D,E,F,G                                 tonenavn; oktavtall bare der melodien hopper
Fis4  Bb3  Ciss5  Hess  do re mi           kryss skrives «is», b skrives «b»
C,D,E                                      uten oktavtall: samme oktav som forrige tone,
                                           med mindre spranget er større enn en kvint
C                                          en firedel trenger ingen lengde
C:w  C:h  C:e  C:s   C:q.   C:1.5          hel, halv, åttedel, sekstendel, punktert, taktslag
-     -:h                                  pause
A:e4                                       gjenta: tallet henger rett på lengden.
                                           A:e4 = fire åttedeler, A:q4 = fire firedeler
/                                          frasemellomrom (ikke ved hver takt — `ts=` gir taktstrekene)
//                                         større skille (linjeskift ved utskrift)
C~,C                                       bindebue: slås sammen til én lengre tone
```

Appen sier fra rett under notene hvis notelengdene ikke går opp i hele takter — «Taktene går ikke opp:
39 slag blir 19,5 takter i 2/4». Det fanger den vanligste feilen i en maskinskrevet melodi, som at
`-:h16` er seksten halvnotepauser (32 slag) og ikke én pause på 16 slag (`-:16`).

Alt appen selv skriver bruker bare **bokstaver, tall og `, : . - /`** — tegn som ikke trenger
prosentkoding i en URL. Det holder lenken kort og lesbar. `#`, `|` og `*` godtas fortsatt når du
skriver selv, men `#` og `|` blir til `%23` og `%7C` i en lenke, som gjør den lengre og styggere.
Gjentakelse skrives derfor `A:e4`, som både er kortest og er formen språkmodeller skriver av seg selv.

**`B` og `H` betyr begge h/B♮.** B♭ skrives `Bb`, `Hes` eller `Hess`. Ellers forstås både engelsk
(`F#`, `Bb`), nordisk/tysk (`Fiss`, `Fis`, `Ess`, `As`) og solfège (`do re mi fa sol la si`), og
mellomrom eller `+` virker som skille i tillegg til komma.

### Ventiltall (`v=`)

`0 13 12 1 0 0 12*4` — tallene er ventilkombinasjoner for 3-ventils messing, og tolkes som **skrevet**
tonehøyde. Hver tone blir den som ligger nærmest den forrige, med start på skrevet C4. Lengder,
pauser, gjentakelser og fraser virker som over: `12:2`, `-`, `0*4`, `|`.

### Skrevet eller klingende?

Standard er **skrevet** tonehøyde: tokenene er nøyaktig det spilleren leser, uansett instrument. En
B♭-trompet og en altsaksofon får da samme bokstaver, men klinger i hver sin toneart — akkurat som når
et barn får et ark med «C D E F G» og spiller det på sitt instrument.

Med `p=c` er tokenene klingende, og hvert instrument får sin egen transponerte notasjon. Da klinger
alle likt — riktig når flere skal spille sammen.

Ligger sangen utenfor instrumentets grepskart, flyttes den automatisk i hele oktaver til den passer.
`k=` slår av automatikken.

---

## Prompt til en LLM

Enklest: trykk 🤖 øverst i appen, skriv hva du vil ha, og kopier den ferdige prompten. Knappen
«♪ Ta med melodien som vises nå» limer inn tonene, tittelen, instrumentet og tempoet som er lastet, så
du kan be om endringer på den — «gjør den i 3/4», «transponer til D-dur», «legg til andre vers». Den er på
språket du har valgt, tar med hvilket instrument, tempo og taktart som er valgt nå, og legger ved hele
notasjonsbeskrivelsen på engelsk. Lim den inn hos ChatGPT, Claude eller Gemini — gjerne sammen med et
bilde eller en PDF av noten — og du får en ferdig lenke tilbake.

Vil du skrive den selv:

> Lag en URL til https://punnerud.github.io/visualnotes/ som viser melodien til «\<sang\>».
> Bruk parameteren `s=` med tonene skilt av komma: bokstav + oktavtall bare der melodien hopper
> (`C4,D,E,F`), `is` for kryss og `b` for b (`Fis4`, `Bb3`). En firedel skrives uten lengde; ellers
> `:h` halv, `:e` åttedel, `:s` sekstendel, `:q.` punktert firedel. `-` er pause. Gjentakelse skrives
> med tallet rett etter lengden: `A:e4` er fire åttedeler, `A:q4` fire firedeler — bruk aldri `*`.
> `/` er frasemellomrom — ikke sett ett ved hver takt, `ts=` gir taktstrekene selv. Bruk bare
> bokstaver, tall og `, : . - /` så lenken tåler å limes inn andre steder.
> Legg sammen notelengdene takt for takt før du svarer, og rett melodien hvis det ikke går opp i
> hele takter.
> Sett også `t=` (tittel), `ts=` (taktart) og `bpm=`. Tonene skal være det spilleren leser.
> Svar med bare URL-en.

Eksempel på svar:

```
https://punnerud.github.io/visualnotes/?s=C4,D,E,F,G:h2/A:q4,G:w&t=Lisa+gikk+til+skolen&ts=4/4&bpm=100
```

---

## Instrumenter og grep

43 instrumentvarianter med riktig transponering, nøkkel og register (tabellen er hentet fra
[notecircle](https://github.com/punnerud/notecircle)). Grepdiagrammene dekker:

| Instrumenter | Diagram | Dekning (skrevet) | Kilde |
|---|---|---|---|
| Trompet, kornett, flygelhorn, basstrompet, althorn, eufonium, tuba (E♭/B♭) | 3 ventiler | F♯3–G6 | tabell fra notecircle, med alternativgrep |
| Piccolotrompet | 4 ventiler | F♯3–D6 | samme tabell |
| Valthorn i F | 3 ventiler | B♭2–A5 | beregnet fra overtonerekka |
| Trombone, basstrombone | dragposisjon 1–7 | E2–B♭4 (klingende) | beregnet fra overtonerekka |
| Blokkfløyte i C og F | 8 hull, halvhull og klemgrep | C4–D6 (sopran), F4–G6 (alt) | barokk-/engelskgrep, tysk som alternativ |
| Saksofon (sopran/alt/tenor/baryton) | klaffdiagram | B♭3–C♯6 | standard grunngrep + oktavklaff |
| Fløyte, piccolo, altfløyte | klaffdiagram | C4–C♯6 | standard grunngrep, 2. oktav med samme grep |
| Klarinett (B♭/A/E♭/bass) | klaffdiagram | E3–C♯6 | grunnskjema fra WFG, klangregister via overblåsingsklaffen |
| Fiolin, bratsj, cello, kontrabass | streng + finger | 1. posisjon (G3–H5, C3–E5, C2–D4, E2–C4) | beregnet fra stemmingen |
| Piano, klokkespill, xylofon | klaviatur, to oktaver om gangen | hele registeret | beregnet |
| Fagott, kontrafagott, obo, engelsk horn, sang | kun noter | — | grepskart mangler foreløpig |

Toner utenfor grepskartet vises fortsatt med bokstav og note, men uten diagram — og appen sier fra
hvor mange toner som ligger utenfor instrumentets register.

**Grepene er vanlige standardgrep.** De aller fleste instrumenter har i tillegg alternativgrep som
brukes i raske passasjer eller for bedre intonasjon. Finner du en feil: åpne gjerne en issue —
tabellene ligger godt synlig i `03_fingering.js`.

---

## Sanger

Biblioteket inneholder **bare melodier som er fri bruk**: folketoner, eller komponister som døde for
mer enn 100 år siden. Hver sang oppgir hvorfor den er fri.

Lisa gikk til skolen · Blinke, blinke lille stjerne · Bæ, bæ, lille lam · Fader Jakob ·
Mary hadde et lite lam · Ro, ro, ro din båt · Ode til gleden (Beethoven 1824) ·
Bjelleklang (Pierpont 1857) · C-durskala · Femtonersøvelse · Kromatisk øvelse

**Sangtekst er ikke lagt inn.** En melodi kan være fri selv om en bestemt tekst eller oversettelse
fortsatt er vernet. Vil du ha stavelser under notene, bruk `w=`-parameteren.

Vil du foreslå en sang? Legg den til i `05_songs.js` med `src`-feltet satt til hvorfor melodien er fri,
og kjør `node test_songs.js` — testen sjekker at taktene går opp og at registeret er rimelig.

---

## Utvikling

Ingen npm, ingen rammeverk. `index.html` bygges fra nummererte kildefiler med Python:

```bash
python3 build.py          # setter sammen index.html (og app.js for testene)
python3 validate_i18n.py  # sjekker at alle fire språkfilene har samme nøkler
node test_url.js          # tolking av tonerekker, ventiltall og taktarter
node test_fingering.js    # grepdata mot kjente referansegrep
node test_songs.js        # sangbiblioteket og byggeresultatet
python3 -m http.server 8080   # åpne http://localhost:8080
```

| Fil | Innhold |
|---|---|
| `00_head.html` | `<head>` og all CSS |
| `01_core.js` | tonemodell, transponering, instrumenttabell, ventilgrep |
| `02_i18n.js` | oversettelser og notenavn per språk |
| `03_fingering.js` | grepdata og SVG-tegning av diagrammene |
| `04_notation.js` | notehoder, haler, faner, punkter, pauser, hjelpelinjer |
| `05_songs.js` | sangbiblioteket |
| `06_url.js` | tolking og bygging av URL-formatet |
| `07_audio.js` | tone, metronom og avspillingsplanlegger |
| `08_ui.js` | tonestripe, paneler og utskrift |
| `09_init.js` | tilstand, cookie, URL og oppstart |
| `10_body.html` | markup |
| `i18n_*.json` | tekstene for no, sv, da, en |

**Husk `python3 build.py` før commit** — CI bygger på nytt og feiler hvis `index.html` ikke er i synk.
Vil du automatisere det:

```bash
printf '#!/bin/sh\npython3 build.py && git add index.html\n' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

GitHub Pages publiserer `index.html` rett fra `main`.

---

## Takk til

- [notecircle](https://github.com/punnerud/notecircle) — instrumenttabell, ventilgrep, notenavn per språk og byggemønsteret
- [The Woodwind Fingering Guide](https://www.wfg.woodwind.org/) — grunnskjema for klarinett og saksofon
- Dolmetsch, *Baroque / English Recorder Fingering Chart* — blokkfløytegrepene

## Lisens

MIT — se [LICENSE](LICENSE).

Laget med [Claude Code](https://claude.com/claude-code).
