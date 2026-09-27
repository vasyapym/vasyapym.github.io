BRIEF — practice-map R038: tier-list length mechanic (tier fold)

Task: the model tier list on the practice-map main page renders flat and is 11 tiers long (grows whenever a new tier lands in TIERS — lessons keep arriving via the pipeline). Owner ask: "add a pagination or 'next' list mechanic or what would be most native for this situation; it must be consistent." Design + code choices delegated to the chat model with autonomy; the orchestrator integrates, renders, tests, presents.

Constraints given: the ruled-records register (lowercase mono chrome, hairline separators, no boxes/washes, type wakes, ochre = attention only, 44/40px floors, reduced-motion guards, counts computed, tier order = data order, active row = outdent + warm ordinal); active tier must never be hidden/unreachable incl. after a palette jump; no new colors/fonts; works at 11 tiers today and on mobile stacked flow; test-impact disclosure required (the check picked rows by nth-child). Likely failure cases named: active outside window, lost position, double controls, seam row, scroll confusion.

Code supplied in brief: full TierList.tsx, the .pg-tier-list/.pg-tier-row CSS block, page wiring (props unchanged), TIERS data shape (11 ids in data order), design-language token digest.

Output contract: ## code (full TierList.tsx + anchored CSS hunks), ## notes (mechanic + decided behaviors + tradeoff + uncertainties + rejected alternative), ## test-impact (child order, precedence, retarget recommendations).

Standing preamble in every brief: challenge key assumptions, consider a credible alternative, check likely failure cases; give the requested output with concise rationale and material uncertainties.

Chat-model reply (salvaged): tail fold — WINDOW=6 head rows, fold only if ≥3 rows would hide (≤8 tiers render flat); folded shows head window + the active row pinned directly after it (derived per render from activeTierId); single control `.pg-tier-more` always last child ("+ show n more · 6 of 11" / "− show fewer · all 11", aria-expanded, label-in-name); no inner scroller; no ochre at rest; keyboard focus to first revealed row on expand, scrollIntoView nearest on fold; rejected pagination (jump swaps rows under pointer, stub pages, control pair) and internal scroll (seam, scroll-in-scroll). State: one boolean, no page wiring change.
