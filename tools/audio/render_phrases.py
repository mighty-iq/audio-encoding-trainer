"""Render whole utterances and keep each one only when the recogniser hears its text.

Short items (call-sign phrases, sentences, messages, intros) must match word for word (homophones and
spelling variants allowed); long items (story passages) may differ by at most `wer_max` and must contain
every keyword. On a miss the item is re-rendered at speed x0.95 and x1.05, then dropped and logged.
Word times (`wt`) come from the synthesiser's durations, or from the recogniser when counts differ.
Usage: python3 -I tools/audio/render_phrases.py JOB [JOB...]   (jobs are listed in jobs.py)
"""
import sys

import numpy as np

sys.path.insert(0, __import__('os').path.dirname(__file__))
import asr  # noqa: E402
import jobs as J  # noqa: E402
import tts  # noqa: E402
from common import (SR, Log, Results, active_level_db, code_level, fade, mp3_decode, mp3_encode, norm_words,  # noqa: E402
                    save_clip, speech_bounds, wav_path)

SPEEDS = [1.0, 0.95, 1.05]
PAD = 0.03


def trim_with_offset(x, pad=PAD):
    s, e = speech_bounds(x)
    a, b = max(0, s - int(pad * SR)), min(len(x), e + int(pad * SR))
    return fade(x[a:b], SR, 3.0, 8.0), a


def word_times(item, spans, offset, heard_words, dur):
    words = item.get('words') or norm_words(item.get('say', item['text']))
    if spans is not None and len(spans) == len(words):
        out = [[round(max(0.0, s - offset / SR), 3), round(min(dur, e - offset / SR), 3)] for s, e in spans]
        return out
    if len(heard_words) == len(words):
        st = [max(0.0, t) for _, t in heard_words] + [dur]
        return [[round(st[i], 3), round(min(dur, st[i + 1]), 3)] for i in range(len(words))]
    return None


def render_variant(it, rec, res, log):
    eng = tts.engine(it['src'])
    base = it.get('speed', 1.0)
    say = it.get('say', it['text'])
    for f in SPEEDS[:it.get('tries', 3)]:
        sp = round(base * f, 3)
        if it['src'] == 'kokoro':
            x, spans = eng.synth_timed(say, it['voice'], speed=sp, lang=it.get('lang'),
                                       clause=it.get('clause', 0.1), sentence=it.get('sentence', 0.3))
        else:
            x, spans = eng.synth(say, it['voice'], speed=sp), None
        y, off = trim_with_offset(x)
        heard, hw = rec.run(mp3_decode(mp3_encode(code_level(y))))      # judge the audio as it will ship
        sc = asr.score(it.get('asr_text', say), heard, it.get('keywords'))
        name_ok = True
        if it.get('name'):            # intros: the name must be heard within two phonemes of its spelling
            import cut_matrix
            name_ok = any(cut_matrix.ipa_dist(it['name'].lower(), w) <= 2 for w in norm_words(heard))
        ok = sc['ok'] or (it.get('wer_max', 0) > 0 and sc['wer'] <= it['wer_max'] and sc['kw_ok'] and name_ok)
        if not ok:
            log(it['id'], 'miss', sp, ' '.join(sc['errs']), '| heard:', heard[:120])
            continue
        save_clip(it['id'], y)
        dur = len(y) / SR
        row = {k2: v for k2, v in it.items() if k2 not in ('tries', 'alts')}
        row.update({'ok': True, 'heard': heard, 'wer': sc['wer'], 'rate': sp, 'dur': round(dur, 3),
                    'adb': round(active_level_db(y), 2)})
        wt = word_times(it, spans, off, hw, dur)
        if wt and it['kind'] != 'story':
            row['wt'] = wt
        res.put(row)
        return True
    res.put({'id': it['id'], 'src': it['src'], 'voice': it['voice'], 'kind': it['kind'], 'text': it['text'],
             'ok': False, 'pack': it.get('pack'), 'set': it.get('set')})
    log(it['id'], 'DROPPED')
    return False


def render_item(it, rec, res, log):
    """Try the item, then its alternatives (other wording of the same slot), skipping recorded failures."""
    variants = [it] + [dict(it, **alt, tries=2) for alt in it.get('alts', [])]
    for v in variants:
        r = res.get(v['id'])
        if r and r.get('ok') and wav_path(v['id']).exists():
            return True
        if r and r.get('ok') is False:
            continue
        if render_variant(v, rec, res, log):
            return True
    return False


def run(job_names, db='sentences'):
    res = Results(db)
    rec = asr.recogniser('parakeet')
    for name in job_names:
        log = Log(f'phrases-{name}')
        items = J.JOBS[name]()
        def settled(it):
            ids = [it['id']] + [a['id'] for a in it.get('alts', [])]
            if any(res.get(i, {}).get('ok') and wav_path(i).exists() for i in ids):
                return True
            return all(res.get(i, {}).get('ok') is False for i in ids)
        todo = [it for it in items if not settled(it)]
        log(f'job {name}: {len(items)} items, {len(todo)} to render')
        ok = 0
        for i, it in enumerate(todo):
            ok += render_item(it, rec, res, log)
            if (i + 1) % 20 == 0:
                log(f'{name}: {i + 1}/{len(todo)} done, {ok} kept')
        kept = sum(1 for it in items if any(res.get(i, {}).get('ok') for i in
                                            [it['id']] + [a['id'] for a in it.get('alts', [])]))
        log(f'JOB {name} done: {kept}/{len(items)} kept')
    return 0


if __name__ == '__main__':
    np.seterr(all='ignore')
    sys.exit(run(sys.argv[1:] or ['starter']))
