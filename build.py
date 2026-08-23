#!/usr/bin/env python3
"""Sett sammen index.html fra delene + i18n-filene.

Kjør lokalt før commit:  python3 build.py
CI kjører den på nytt og feiler hvis index.html ikke er i synk.
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
PARTS_JS = ['01_core.js', '02_i18n.js', '03_fingering.js', '04_notation.js',
            '05_songs.js', '06_url.js', '06b_qr.js', '07_audio.js', '08_ui.js', '09_init.js']
LANGS = ['no', 'sv', 'da', 'en']


def read(name):
    with open(os.path.join(HERE, name), encoding='utf-8') as f:
        return f.read()


def main():
    i18n = {}
    for code in LANGS:
        p = os.path.join(HERE, 'i18n_%s.json' % code)
        if not os.path.exists(p):
            print('MANGLER: i18n_%s.json' % code, file=sys.stderr)
            return 1
        with open(p, encoding='utf-8') as f:
            i18n[code] = json.load(f)

    js = '\n'.join(read(p) for p in PARTS_JS)
    blob = json.dumps(i18n, ensure_ascii=False, separators=(',', ':'))
    if '/*__I18N__*/{}' not in js:
        print('FEIL: fant ikke /*__I18N__*/{} i kilden', file=sys.stderr)
        return 1
    js = js.replace('/*__I18N__*/{}', blob, 1)

    out = read('00_head.html') + read('10_body.html') + \
        "<script>\n'use strict';\n" + js + "\n</script>\n</body>\n</html>\n"
    with open(os.path.join(HERE, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(out)
    # Ren JS for node-testene
    with open(os.path.join(HERE, 'app.js'), 'w', encoding='utf-8') as f:
        f.write("'use strict';\n" + js + "\n")
    print('index.html: %d tegn · språk: %s' % (len(out), ', '.join(sorted(i18n))))
    return 0


if __name__ == '__main__':
    sys.exit(main())
