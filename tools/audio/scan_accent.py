"""Check Kokoro voices of other languages reading English: six test utterances each; a voice is kept for
Strange voices (accent family) when the recogniser gets at least five of six exactly. Writes the result to
tools/audio/accent_voices.json (committed build input read by plan.py). Usage: python3 -I tools/audio/scan_accent.py
"""
import json
import sys

sys.path.insert(0, __import__('os').path.dirname(__file__))
import asr  # noqa: E402
import plan as P  # noqa: E402
import tts  # noqa: E402
from common import REPO, Log, Results, trim  # noqa: E402

TESTS = ['The window paints the turtle.', 'The parrot folds the engine.', 'Molly, crab, eight.',
         'We could take the early bus if the weather holds up.', 'Logan, wheel, three.',
         'She likes her coffee with cream and sugar.']


def main():
    log = Log('scan-accent')
    res = Results('accent_scan')
    eng = tts.engine('kokoro')
    rec = asr.recogniser('parakeet')
    out = {}
    for v, sex, acc in P.KOKORO_ACCENT:
        exact, wers = 0, []
        for i, t in enumerate(TESTS):
            key = f'{v}.{i}'
            r = res.get(key)
            if r is None:
                x = trim(eng.synth(t, v, lang='en-us'))
                heard, _ = rec.run(x)
                sc = asr.score(t, heard)
                r = {'id': key, 'ok': sc['ok'], 'wer': sc['wer'], 'heard': heard}
                res.put(r)
            exact += bool(r['ok'])
            wers.append(r['wer'])
        keep = exact >= 5
        out[v] = {'sex': sex, 'accent': acc, 'exact': exact, 'mean_wer': round(sum(wers) / len(wers), 3),
                  'keep': keep}
        log(v, acc, f'{exact}/6 exact', 'KEEP' if keep else 'drop')
    json.dump(out, open(REPO / 'tools' / 'audio' / 'accent_voices.json', 'w'), indent=1, sort_keys=True)
    log('kept', [v for v, d in out.items() if d['keep']])


if __name__ == '__main__':
    main()
