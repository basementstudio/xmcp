# Bundle benchmark results

Generated 2026-08-18 on Darwin 25.5.0 (arm64), Node v26.4.0, npm 11.17.0.

> The repository targets Node 22. These numbers are provisional until the benchmark is rerun on Node 22.

All versions are exact-pinned: xmcp 0.7.1, fastmcp 4.16.4, mcp-framework 0.2.22, tmcp 1.20.0, `@modelcontextprotocol/sdk` 1.30.0, Zod 4.1.13, and esbuild 0.28.2. Fresh-install measurements charge Zod to every framework.

## Baseline comparison

### M1 — registry package size

| fixture | tarball | unpacked |
| --- | ---: | ---: |
| xmcp | 3.94 MiB | 11.82 MiB |
| fastmcp | 379.12 KiB | 1.64 MiB |
| mcp-framework | 84.24 KiB | 343.44 KiB |
| tmcp | 73.89 KiB | 413.30 KiB |
| `@modelcontextprotocol/sdk` | 569.18 KiB | 4.12 MiB |

### M2 — fresh transitive install

| fixture | `node_modules` | dependency entries |
| --- | ---: | ---: |
| xmcp | 100.60 MiB | 168 |
| fastmcp | 51.46 MiB | 185 |
| mcp-framework | 35.34 MiB | 79 |
| tmcp | 6.25 MiB | 7 |
| `@modelcontextprotocol/sdk` | 14.17 MiB | 93 |

### M3 — user server artifact

View A is the documented deployment model: xmcp's self-contained `dist/`, or compiled source plus production `node_modules` for the other fixtures. View B bundles each non-xmcp fixture with esbuild and compares that single file with xmcp's generated transport file.

| fixture | View A deploy footprint | View B bundled artifact |
| --- | ---: | ---: |
| xmcp HTTP | 1.11 MiB | 1.02 MiB |
| xmcp stdio | 443.73 KiB | 360.23 KiB |
| fastmcp | 51.46 MiB | 2.01 MiB |
| mcp-framework | 41.59 MiB | 1.05 MiB |
| tmcp | 6.38 MiB | 371.40 KiB |
| `@modelcontextprotocol/sdk` | 16.41 MiB | 1.36 MiB |

## xmcp checkpoints

| checkpoint | tarball / unpacked | fresh install | HTTP View A / B | stdio View A / B |
| --- | ---: | ---: | ---: | ---: |
| registry 0.7.1 | 3.94 / 11.82 MiB | 100.60 MiB | 1.11 / 1.02 MiB | 443.73 / 360.23 KiB |
| Tier 1 | not retained | not retained | byte-identical to baseline | byte-identical to baseline |
| accepted Tier 2 | not retained | not retained | 1.10 / 1.01 MiB | 443.73 / 360.23 KiB |
| runtime/compiler split | 1.92 / 5.77 MiB | 9.62 MiB (2 entries) | 1.10 / 1.01 MiB | 443.73 / 360.23 KiB |

The final compiler tarball is 128.34 KiB compressed and 417.41 KiB unpacked; its Rspack and TypeScript dependencies are development-only. Tier 1 and Tier 2 package snapshots were not retained after T2.1 failed its self-contained-deployment gate, so no replacement numbers are inferred for those cells. The accepted Tier 2 changes are the CORS-schema and Chalk decoupling; Zod remains bundled. The HTTP and stdio split artifacts were smoke-tested from directories with no `node_modules`.

M4 cold-start timing is optional and was not run.

## Reproduce

`pnpm bench` runs M1–M3. Use `--m1`, `--m2`, or `--m3` to select a metric and `--only <fixture>` to select one fixture. Partial runs print their report without overwriting this file. To measure a local split build, also pass `--xmcp-tarball <path> --compiler-tarball <path>`.
