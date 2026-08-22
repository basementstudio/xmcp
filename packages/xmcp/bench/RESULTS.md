# Bundle benchmark results

Generated 2026-08-20 on Darwin 25.5.0 (arm64), Node v20.20.2, npm 11.17.0.

The xmcp rows use the packed local 0.8.1 migration candidate. The comparison fixtures are exact-pinned: FastMCP 4.16.5, mcp-framework 0.2.22, tmcp 1.20.0, `@modelcontextprotocol/server`/`node` 2.0.0, Zod 4.4.3, and esbuild 0.28.2.

Fresh-install measurements install each complete runnable fixture with development dependencies omitted. View A follows each framework's documented deployment model: xmcp's self-contained `dist/`, or compiled source plus production `node_modules`. View B bundles non-xmcp fixtures with esbuild 0.28.2 and compares that single file with xmcp's generated transport file.

## M1 — registry package size

| fixture | tarball | unpacked |
| --- | --- | --- |
| xmcp-http | 1.44 MiB | 4.94 MiB |
| xmcp-stdio | 1.44 MiB | 4.94 MiB |
| fastmcp | 379.67 KiB | 1.64 MiB |
| mcp-framework | 84.24 KiB | 343.44 KiB |
| tmcp | 73.89 KiB | 413.30 KiB |
| sdk-raw | 1.42 MiB | 6.01 MiB |

## M2 — fresh transitive install

| fixture | node_modules | dependency entries |
| --- | --- | --- |
| xmcp-http | 9.29 MiB | 2 |
| xmcp-stdio | 9.29 MiB | 2 |
| fastmcp | 38.93 MiB | 182 |
| mcp-framework | 41.59 MiB | 152 |
| tmcp | 6.88 MiB | 12 |
| sdk-raw | 13.25 MiB | 6 |

## M3 — user server artifact

| fixture | View A deploy footprint | View B bundled artifact |
| --- | --- | --- |
| xmcp-http | 1.19 MiB | 1.19 MiB |
| xmcp-stdio | 524.71 KiB | 524.69 KiB |
| fastmcp | 38.93 MiB | 1.80 MiB |
| mcp-framework | 41.59 MiB | 1.05 MiB |
| tmcp | 6.89 MiB | 414.23 KiB |
| sdk-raw | 13.25 MiB | 646.54 KiB |

## Reproduce

`pnpm bench` runs M1–M3. Use `--m1`, `--m2`, or `--m3` to select a metric and `--only <fixture>` to select one fixture. To measure a local split build, also pass `--xmcp-tarball <path> --compiler-tarball <path>`.
