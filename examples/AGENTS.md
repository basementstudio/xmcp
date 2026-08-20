# Example guidance - xmcp

Use this file for `examples/**`.

## Standards

- Examples must demonstrate current xmcp APIs. Do not patch old examples just to
  keep deprecated patterns alive.
- User-facing features should have a runnable example or update an existing
  example that demonstrates the intended workflow.
- Prefer deleting stale examples over modernizing them unless the example still
  documents a supported workflow.
- Keep examples minimal and runnable. Avoid hidden setup beyond documented env
  vars and package scripts.
- Never commit secrets, real credentials, or provider-specific local state.
- Use workspace dependencies for local xmcp packages.
- If an example exists to document a package feature, keep the README and code
  in sync.

## Checks

- Run `pnpm build` inside the touched example when it has a build script.
- For Next.js examples, also run the example lint script when present.
- For auth or provider examples that need credentials, verify the buildable
  parts locally and document any skipped runtime checks.
