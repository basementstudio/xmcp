---
description: Review the current diff against xmcp review standards
---

Run a rule-by-rule review of the current working tree against the tracked agent
guidance and review standards.

Do this:

1. Read `AGENTS.md`, the applicable scoped `AGENTS.md` files, and
   `REVIEW_RULES.md`.
2. Gather the diff:
   - `git diff HEAD`
   - `git diff --cached`
   - `git status --short`
3. For each relevant standard, produce:
   - **Rule name**: `pass` | `fail` | `n/a`
   - If `fail`: cite the specific `file:line`, quote the offending code, and
     suggest the concrete fix.
   - If `n/a`: one short sentence on why it does not apply to this diff.
4. End with a **Summary** listing only failing rules, ordered by severity:
   structural/design issues first, then mechanical issues.

Do not modify files during the review. Output only.
