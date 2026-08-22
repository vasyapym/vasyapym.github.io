## What it does

`custom-learning` turns technology learning into a sequence of small, defensible proofs rather than a stream of explanations. It maintains a Practice Map of Cards and Subcards, keeps exactly one Subcard active, and produces a self-contained interactive HTML artifact that shows progress and dependencies.

Its defining constraint is **proof before unlock**: a new Subcard opens only after the current one has been reviewed as ✅ done and its artifact could survive a serious code review.

## When to reach for it

You invoke this by typing `/custom-learning` when learning a technology is the work itself and you want a persistent route from working knowledge toward middle+/senior practice. The skill gives the learner Russian explanations and briefs while preserving industry terms such as `mutex`, `goroutine`, and `deadlock` in their native form.

| Situation | Reach for |
| --- | --- |
| A technology needs a dependency-ordered learning route with projects | `/custom-learning` |
| A current Subcard needs explanation, a proof project, and review | `/custom-learning` |
| A visual implementation needs a feedback round | [design-iteration](https://aihero.dev/skills-design-iteration) |
| A single code change needs deliberate planning and verification | [code-iteration](https://aihero.dev/skills-code-iteration) |
| The topic is known and only a build sequence is needed | [planning](https://aihero.dev/skills-planning) |

## Cards, Subcards, and proof

A Card represents a technology or major area. Its Subcards represent concrete skills. The map follows a rough dependency DAG, but only one Subcard can be open at once. Each closed Subcard leaves three things behind: a concise mental model, a grown-up proof-of-concept, and a reviewable artifact with a stated quality bar.

The initial Linux Card is seeded with twenty ordered Tier 1 Subcards, beginning with process lifecycle and continuing through filesystems, networking, services, logging, and reproducible host state. The map can be extended with other Cards without opening parallel tracks.

## The interactive artifact

The learner works through clicks rather than forced quizzes. Locked tiles become visible when prerequisites close, progress bars fill as the current Subcard advances, and panels divide the explanation into Проблема, Модель, Механика, Грабли, and Когда НЕ применять. The artifact is one offline HTML file with Russian labels and inline CSS/JS, so the visual state remains inspectable and portable.

## Common questions

**Does it teach from zero?**

No. It assumes the learner already writes code and adjusts the depth around the current stack and observed gaps. It explains where needed without switching to a naive or childish register.

**Can I work on several technologies at once?**

Cards can be arranged in a dependency graph, but only one Subcard is active. A new Subcard opens after the current one has passed review, which prevents collecting half-learned topics.

**Does it write the proof project for me?**

No. It frames the work as an incoming ticket, gives the brief, and supplies hints on request. The learner writes the artifact so the proof is evidence of their skill rather than the agent's output.

**What language are the lessons and UI?**

Everything the learner receives is in Russian, including explanations, briefs, reviews, UI labels, and code comments. Industry terms remain native where translation would make them less precise.

## It's working if

- The map names one active Subcard and leaves the rest locked or completed.
- The learner sees why the topic matters before receiving its mechanics.
- Every completed Subcard has a non-trivial artifact and a review verdict.
- The HTML artifact changes visibly when progress or unlock state changes.
- The next session can resume from persistent state without reconstructing the route.
- Each Subcard closes with no more than two canonical references for deeper study.

## Where it fits

`custom-learning` is a **reach-for-it-anytime learning workspace**. It is closest to [teach](https://aihero.dev/skills-teach), which supports multi-session lessons and source-grounded retention, but this skill is technology-specific and makes a reviewable project artifact the gate for progress. It also neighbours [code-iteration](https://aihero.dev/skills-code-iteration), which supplies a deliberate workflow for a single non-trivial implementation rather than a curriculum. [ask-matt](https://aihero.dev/skills-ask-matt) routes over the whole set.
