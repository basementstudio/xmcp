# @xmcp-dev/better-auth

## 1.0.2

### Patch Changes

- 6e13b56: The compiler now runs on Rspack 2, which is ESM-only, so xmcp requires Node.js 22.12 or later. Configs passed to the `bundler` hook receive Rspack 2 options. The Better Auth plugin bundles its sign-in UI, so React and React Router are no longer installed as runtime dependencies.

## 1.0.1

### Patch Changes

- f48c55e: Update dependencies to their latest versions.

## 1.0.0

### Patch Changes

- Updated dependencies [10bdd57]
  - xmcp@1.0.0

## 0.0.12

### Patch Changes

- 836b9b3: Widen the `xmcp` peer range to `>=0.7.0 <1.0.0`. The published range was a
  caret pinned to whichever core version happened to be current at the time, so it
  went stale and rejected newer 0.x releases of xmcp that the plugin works with.
