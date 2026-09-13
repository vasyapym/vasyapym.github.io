# Ledger — trim thesis copy (raft cluster)

## Round R001
- Goal: remove the tagline sentence "The network between them is simulated — the consensus is not." from the raft hero thesis paragraph — the owner flags it as the kind of wordy flavor copy LLMs keep adding.
- Preserved preferences: none (first round in this ledger).
- Changes: `web/RaftPage.tsx` — deleted the second sentence of `.raft-thesis`; the paragraph now reads "Every node runs the same Rust consensus core, compiled to WebAssembly." Nothing else touched.
- Before: source lines 533–536 (two-sentence thesis).
- After: source lines 533–535 (one-sentence thesis). Screenshot: NOT PRODUCED.
- Visual inspection: NOT RUN — no Chrome/Chromium in this environment (same limitation recorded across prior rounds in this repo). The change is a pure text deletion; layout risk limited to a shorter paragraph in a flexible-height hero.
- Code verification: `npm run typecheck` (portfolio root) — PASS, exit 0. `grep` confirms no test or core reference to the removed sentence.
- Open question: none — the removal is explicit owner instruction.

## Feedback F001
- Round: R001
- Verdict: REJECTED
- Scope: raft-cluster hero `.raft-thesis` copy — the sentence "The network between them is simulated — the consensus is not."
- Decision: the sentence is removed and must not return in this hero.
- User source: "remove this text from raft cluster project - 'The network between them is simulated — the consensus is not.'"
- Artifact: source edit in `web/RaftPage.tsx` (commit of round R001).
- Supersedes: none.

## Feedback F002
- Round: R001
- Verdict: REJECTED
- Scope: general copywriting across portfolio project pages — verbose flavor/tagline sentences of the "X is Y — and Z is not" pattern, especially ones added by AI beyond the owner's requested content.
- Decision: do not add wordy tagline/flavor copy to project pages; keep copy to what the owner asked for. When drafting or editing page text, err toward fewer sentences.
- User source: "usually LLMs keep adding wordiness like this. i don't like that."
- Artifact: not tied to one artifact — standing preference.
- Supersedes: none.
