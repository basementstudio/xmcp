# xmcp Claude guidance

Read the shared agent guidance before editing:

@AGENTS.md
@packages/AGENTS.md
@examples/AGENTS.md
@apps/website/AGENTS.md

Before touching runtime transports or tool extras, apply the stateless HTTP
rules in `AGENTS.md` and `packages/AGENTS.md`: do not recover metadata from
hidden per-client server state unless the task explicitly adds an opt-in
stateful transport.

Run `/review-rules` on your diff before handing work back. The local Stop hook
may also run `.claude/hooks/valerules-check.sh` to catch formatting, excess
logging, and fixed-ms timers.
