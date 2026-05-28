Perform a full ADR (Architecture Decision Record) review for this session. Run every step in order without stopping to ask for confirmation — produce output at each step so progress is visible.

---

## Step 1 — Read existing ADRs

Read every `.md` file in `.adr/` except `PENDING.md`. For each, extract:
- ADR number and title
- The decision (one sentence)
- Status (Accepted / Proposed / Superseded)

Print a compact table: `| ADR | Title | Decision | Status |`

---

## Step 2 — Audit ADRs against this session

For each ADR from Step 1, assess: **was this topic touched in this conversation?**

- ✅ **Referenced** — we actively used or discussed this ADR's decision
- ⚠️ **Missed** — the topic came up but we didn't consult the ADR (possible drift)
- ➖ **Irrelevant** — not touched this session

Print: `| ADR | Relevance | Note |`

Any ⚠️ MISSED items should be highlighted with a brief explanation of how it was relevant.

---

## Step 3 — Mine the session for new decisions

Scan this entire conversation for **architectural decisions** — these are choices that constrain future work. Look for signals like:
- Technology or library chosen ("we'll use X instead of Y")
- A pattern adopted ("we'll always do X this way")
- A constraint accepted ("we won't do X because")
- A trade-off consciously made
- A non-obvious convention established

**Exclude**: bug fixes, one-off implementation details, stylistic preferences that aren't project conventions.

Compare each candidate against the existing ADRs. If it's already documented, skip it.

Print a list of new decisions found, each with:
- The decision in one sentence
- Why it's architectural (affects future choices)
- Confidence: **High** (explicitly decided) or **Low** (implicit/inferred)

If no new decisions were found, say so clearly and stop at this step.

---

## Step 4 — Write new ADRs

For each **High confidence** new decision from Step 3:

1. Find the next ADR number by listing `.adr/ADR-*.md` files and incrementing the highest number.
2. Create `.adr/ADR-NNN-short-kebab-title.md` using this exact template:

```
# ADR-NNN: [Title]

- **Status:** Accepted
- **Date:** [today's date]
- **Deciders:** Wouter Schaap

---

## Context

[What problem were we solving? What options existed? Keep it factual.]

## Decision

[The decision in one clear sentence. Include the key config/code snippet if it illustrates the choice.]

## Rationale

[Why this option over the alternatives? Link to ADRs it relates to with [[ADR-NNN]].]

## Consequences

[What does this decision constrain or enable going forward? Be honest about trade-offs.]
```

For **Low confidence** decisions, add them to PENDING.md (Step 5) instead of writing an ADR — they need confirmation first.

Announce each file written.

---

## Step 5 — Update `.adr/PENDING.md`

Rewrite `.adr/PENDING.md` completely with this structure:

```markdown
# ADR Pending Items

_Last updated: [date] — run `/adr` to refresh_

## Decisions to confirm

Decisions inferred from the session that need explicit confirmation before becoming ADRs.

[List each low-confidence decision with a one-line description and what needs to be confirmed]

## ADRs missed this session

Existing ADRs that were relevant but not consulted — review these at the start of the next session.

[List each ⚠️ MISSED ADR with a note on why it was relevant]

## Open questions

Architectural questions raised but not yet resolved.

[List any unresolved questions that should steer the next session]
```

If all three sections are empty, write a single line: `_No pending items — all decisions captured._`

---

## Step 6 — Update `CLAUDE.md`

Find or create a section `## 🔄 Open decisions` in `CLAUDE.md` (place it just before the `## Code style` section).

Replace its entire content with a live summary pulled from the current state of PENDING.md:

```markdown
## 🔄 Open decisions

> Updated by `/adr` on [date]. Run `/adr` to refresh.

[If PENDING.md has content, summarise each section in 1–3 bullet points with links to relevant ADRs]
[If nothing is pending, write: "All decisions captured. No open items."]
```

This section is read at every session start — keep it scannable and action-oriented.

---

## Step 7 — Report

Print a final summary:

```
## /adr complete

**New ADRs written:** [list filenames, or "none"]
**Missed ADRs (should review):** [list, or "none"]
**Pending decisions:** [count]
**CLAUDE.md updated:** yes / no

Next action: [one sentence — e.g. "Confirm the low-confidence decision about X before the next cycle" or "Nothing pending — safe to compact."]
```
