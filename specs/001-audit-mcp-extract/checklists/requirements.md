# Specification Quality Checklist: Extract Audit Into `audit-mcp` Package

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-04-22
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
  - *Note*: Spec references `tsup`, `pnpm`, `CJS`, `chalk` etc. as **dependencies and constraints of the deliverable**, not as internal implementation choices. These are contractual interfaces the new package exposes (a bin, a library, a build output shape), not design decisions deferred to planning. Retained deliberately.
- [x] Focused on user value and business needs
- [x] Written for technical stakeholders (maintainers, consumers of the audit)
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
  - Every FR maps to an observable output: a file exists, a command runs, an exit code matches, a diff is empty.
- [x] Success criteria are measurable
  - Pass/fail counts, byte-exact diffs, exit-code equality, bundle-size comparison.
- [x] Success criteria are technology-agnostic where possible
  - SC-001 / SC-002 / SC-005 / SC-006 reference test runners, diffs, and git — not implementation choices.
- [x] All acceptance scenarios are defined (6 scenarios covering primary + regression + agnostic paths)
- [x] Edge cases are identified (version skew, missing dep, pinned output, dual resolution)
- [x] Scope is clearly bounded (Non-Goals + Out of Scope sections)
- [x] Dependencies and assumptions identified (A1–A5 + Dependencies section)

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria (FR → SC cross-referenced below)
- [x] User scenarios cover primary flows: extract, consume-through-xmcp, consume-standalone, agnostic-fallback.
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification beyond the deliverable contract

## FR → SC Coverage Matrix

| Functional Requirement                                       | Verified By   |
| ------------------------------------------------------------ | ------------- |
| FR-001 package rooted at `packages/audit-mcp/`               | SC-001, SC-005 |
| FR-002 standalone `audit-mcp` binary                         | SC-003, SC-007 |
| FR-003 flag-surface parity                                   | SC-003        |
| FR-004 list-rules + explain subcommands                      | SC-001        |
| FR-005 library API exports                                   | SC-001        |
| FR-006 `git mv` preservation of all 119 files                | SC-005        |
| FR-007 inlined `DEFAULT_PATHS` + icons                       | SC-001 (compile), SC-002 (goldens) |
| FR-008 xmcp commands unchanged                               | SC-003, SC-004 |
| FR-009 xmcp consumes via `workspace:*`                       | SC-001, SC-008 |
| FR-010 externalised from xmcp bundle                         | SC-006        |
| FR-011 45 tests + goldens move intact                        | SC-001, SC-002 |
| FR-012 CJS output                                            | SC-003 (xmcp can require)  |
| FR-013 `.d.ts` emitted                                       | SC-001 (types resolve at build) |
| FR-014 shebang-prefixed `dist/cli.js`                        | SC-003, SC-007 |
| FR-015 no behaviour changes                                  | SC-002, SC-003, SC-008 |

## Notes

- Validation passed in a single iteration — no [NEEDS CLARIFICATION] markers raised, all criteria measurable, scope bounded.
- User directive honoured: **no new git branch**. Feature branch field reuses the existing `xmcp-cli-audit`.
- Phase-2 work (adapter SPI, rule re-tagging, cross-framework support) is explicitly out of scope and called out in Non-Goals / Out of Scope. Any scope creep during planning should round-trip back to the spec.
