---
"@xmcp-dev/descope": patch
---

Use the configured issuer's origin for Descope SDK token verification and the
fallback discovery JWKS URL, so alternate environments and custom domains do not
fetch signing keys from the default Descope host.
