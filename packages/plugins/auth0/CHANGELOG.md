# @xmcp-dev/auth0

## 1.0.2

### Patch Changes

- fdb24c2: Check tool permissions for every `tools/call` in a JSON-RPC batch, not only the first. Previously a user without `tool:<name>` could call a private tool by placing it after a public tool in the same batch request. Reported by Aleksandr Tynianov (@tynianov1).

## 1.0.1

### Patch Changes

- f48c55e: Update dependencies to their latest versions.

## 1.0.0

### Patch Changes

- Updated dependencies [10bdd57]
  - xmcp@1.0.0

## 0.1.1

### Patch Changes

- 836b9b3: Widen the `xmcp` peer range to `>=0.7.0 <1.0.0`. The published range was a
  caret pinned to whichever core version happened to be current at the time, so it
  went stale and rejected newer 0.x releases of xmcp that the plugin works with.
