# Progress: engine (resumable notes; newest at the bottom; times UTC)
- 2026-11-26 17:05 UTC — Started. Read CONTRACTS §0/§5–7, PLAN §6–7, R2–R5. Design (details below as files land):
  product psychometric model p = γ + (1−γ−λ)·Π F_i(x_i), one logistic component per active dial, slope fixed from
  priors, Gaussian posterior per dial stored as {m,s,n,at} and updated on a grid each trial (process noise tracks
  learning); others at "comfort" = component F 0.97; headphone context keeps its own Crowd posteriors ('crowd@hp');
  Strange families are exclusive dials (one per trial). Requests for stimuli/audio/shell appended to requests.md.
