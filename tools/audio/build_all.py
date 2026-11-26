"""Rebuild every stimulus asset in order (each step is resumable; finished clips are skipped).

  python3 tools/audio/build_all.py            all steps
  python3 tools/audio/build_all.py pack        only encode/pack/registry/validate
  python3 tools/audio/build_all.py STEP ...    named steps (see STEPS)

Needs the raw corpora in ../corpora (see docs/dev/STIMULI.md for the download list) and writes scratch audio
to ../stimwork. Heavy steps run under `nice -n 10`. Every Python step runs with -I (isolated mode).
"""
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]


def py(*args):
    return ['nice', '-n', '10', sys.executable, '-I', str(HERE / args[0]), *args[1:]]


STEPS = [
    ('content', py('content_words.py')),
    ('kokoro_timed', py('kokoro_timed.py')),
    ('scan_piper', py('scan_piper.py')),
    ('scan_accent', py('scan_accent.py')),
    ('starter', py('render_phrases.py', 'starter', 'babble1')),
    ('voices', py('render_phrases.py', 'wave2', 'piper_cs', 'babble2', 'intros')),
    ('strange', py('render_phrases.py', 'sus')),
    ('repair', py('render_phrases.py', 'repair')),
    ('echo', py('render_phrases.py', 'echo')),
    ('lab', py('render_phrases.py', 'matrix', 'stories')),
    ('audiomnist', py('natural.py', 'audiomnist')),
    ('cremad', py('natural.py', 'cremad')),
    ('librivox', py('natural.py', 'librivox')),
    ('beds', py('noise.py')),
    ('pack', py('pack.py', '--asr')),
    ('registry', py('registry.py')),
    ('validate', py('validate.py', '--publish')),
]
GROUPS = {'pack': ['pack', 'registry', 'validate']}


def main(argv):
    want = argv[1:] or [s for s, _ in STEPS]
    want = [w for x in want for w in GROUPS.get(x, [x])]
    for name, cmd in STEPS:
        if name not in want:
            continue
        t0 = time.time()
        print(f'== {name}', flush=True)
        r = subprocess.run(cmd, cwd=str(REPO))
        print(f'== {name}: exit {r.returncode} in {time.time() - t0:.0f} s', flush=True)
        if r.returncode != 0 and name in ('content', 'validate', 'pack'):
            return r.returncode
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
