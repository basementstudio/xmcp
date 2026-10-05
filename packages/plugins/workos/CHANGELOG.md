# @xmcp-dev/workos

## 1.0.1

### Patch Changes

- 67de23b: Declare optional `registration_endpoint` and `client_id_metadata_document_supported` fields on `OAuthAuthorizationServerMetadata` so the type matches the AuthKit RFC 8414 document the router already passes through.

## 1.0.0

### Patch Changes

- Updated dependencies [10bdd57]
  - xmcp@1.0.0

## 0.0.3

### Patch Changes

- 836b9b3: Widen the `xmcp` peer range to `>=0.7.0 <1.0.0`. The published range was a
  caret pinned to whichever core version happened to be current at the time, so it
  went stale and rejected newer 0.x releases of xmcp that the plugin works with.
