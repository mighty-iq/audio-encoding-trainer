"""Build-time variant of the int8 Kokoro graph (written next to the original as .timed.onnx): the per-token
durations (/encoder/Round -> Clip -> Cast) become an extra output 'duration', so kokoro-onnx reports phoneme
timings (used for the word times `wt` in the manifest) and tops up pauses at punctuation.
(Tried and rejected: adding frames to punctuation or pad tokens to force pauses makes the model voice filler
vowels.) Usage: python3 -I tools/audio/kokoro_timed.py
"""
import sys

sys.path.insert(0, __import__('os').path.dirname(__file__))
from common import CORPORA  # noqa: E402

SRC = CORPORA / 'kokoro' / 'kokoro-v1.0.int8.onnx'
DST = CORPORA / 'kokoro' / 'kokoro-v1.0.int8.timed.onnx'
TENSOR = '/encoder/Cast_output_0'


def main():
    import onnx
    from onnx import helper
    if DST.exists():
        print('exists', DST.name)
        return
    m = onnx.load(str(SRC))
    g = m.graph
    if not any(TENSOR in n.output for n in g.node):
        raise SystemExit(f'tensor {TENSOR} not found; the model layout changed')
    g.node.append(helper.make_node('Identity', [TENSOR], ['duration'], name='expose_duration'))
    g.output.append(helper.make_tensor_value_info('duration', onnx.TensorProto.INT64, None))
    onnx.save(m, str(DST))
    print('wrote', DST.name)


if __name__ == '__main__':
    main()
