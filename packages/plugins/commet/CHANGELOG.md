# @xmcp-dev/commet

## 0.1.1

### Patch Changes

- 836b9b3: Widen the `xmcp` peer range to `>=0.7.0 <1.0.0`. The published range was a
  caret pinned to whichever core version happened to be current at the time, so it
  went stale and rejected newer 0.x releases of xmcp that the plugin works with.
