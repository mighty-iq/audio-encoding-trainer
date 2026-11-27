# Brief: final independent check (release candidate)

You did not build Earshot. Check a frozen copy of the release candidate (a `git worktree` the lead names) and edit
nothing in it. Write your report to `docs/dev/reviews/FINAL-CHECK.md` in the live repository (findings with id,
severity S1 = fix before release, S2 = should fix, S3 = polish; file and line; what the text says; what the code does).

1. Guide against code. Open `docs/Earshot-Guide.pdf` page by page (render pages to PNG and look at them). For every
   number, rule, level name, threshold, count, duration, probability, schedule and claim about behaviour, find the code
   or data that decides it and confirm it matches. Prefer the code over notes. List each claim you checked (page, claim,
   file:line, verdict). Check every link: clickable, target correct, no `file://`; metadata (author: the Chimera
   community; dates in UTC); the Chimera invitation with https://discord.gg/chmr; fonts embedded; references complete.
2. README, the announcement (`docs/dev/announcement.md`, under 2,000 characters, every claim true), and the app's own
   help sheets and Settings mode texts against the code, the same way.
3. The standing requirements table `docs/dev/VERIFY.md` (filled by the lead): spot-check at least ten rows against the
   built files and say which you confirmed.
4. Wording: confident, curious, no promises of outcomes, no in-app numbers presented as IQ or clinical scores, no names
   of commercial trainers, no quotes of the owner's private brief, nothing about the owner.
Final reply: ≤ 25 lines — counts per severity and the S1 list.
