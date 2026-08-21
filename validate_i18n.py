#!/usr/bin/env python3
"""Sjekker at alle språkfilene har de samme nøklene, og at ingen tekst er tom."""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
LANGS = ['no', 'sv', 'da', 'en']
REF = 'no'


def flat(d, prefix=''):
    out = set()
    for k, v in d.items():
        p = prefix + k
        if isinstance(v, dict):
            out |= flat(v, p + '.')
        else:
            out.add(p)
    return out


def get(d, path):
    cur = d
    for k in path.split('.'):
        cur = cur[k]
    return cur


def main():
    data = {}
    for l in LANGS:
        with open(os.path.join(HERE, 'i18n_%s.json' % l), encoding='utf-8') as f:
            data[l] = json.load(f)
    ref = flat(data[REF])
    bad = 0
    for l in LANGS:
        keys = flat(data[l])
        missing = sorted(ref - keys)
        extra = sorted(keys - ref)
        if missing:
            print('%s mangler: %s' % (l, ', '.join(missing)), file=sys.stderr); bad += 1
        if extra:
            print('%s har ekstra: %s' % (l, ', '.join(extra)), file=sys.stderr); bad += 1
        for k in sorted(keys & ref):
            v = get(data[l], k)
            if not isinstance(v, str) or not v.strip():
                print('%s: tom verdi for %s' % (l, k), file=sys.stderr); bad += 1
    print('i18n: %d nøkler × %d språk%s' % (len(ref), len(LANGS), '' if not bad else ' — FEIL'))
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
