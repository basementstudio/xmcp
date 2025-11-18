# Rspack Bundle Analysis

| Build | Assets | Total Size (MB) | Build Time |
| --- | ---: | ---: | ---: |
| Main Compiler | 2 | 3.93 | 1.55s |
| Runtime Compiler | 5 | 3.45 | 1.87s |

## Main Compiler

Source: `stats-main.json`

| Asset | Chunk | Size (KB) | Size (MB) |
| --- | --- | ---: | ---: |
| `cli.js` | cli | 3963.15 | 3.87 |
| `index.js` | index | 62.11 | 0.06 |

**Total emitted JS:** 3.93 MB

## Runtime Compiler

Source: `stats-runtime.json`

| Asset | Chunk | Size (KB) | Size (MB) |
| --- | --- | ---: | ---: |
| `http.js` | http | 1127.96 | 1.10 |
| `adapter-nextjs.js` | adapter-nextjs | 1103.53 | 1.08 |
| `adapter-express.js` | adapter-express | 1101.61 | 1.08 |
| `stdio.js` | stdio | 197.39 | 0.19 |
| `headers.js` | headers | 1.17 | 0.00 |

**Total emitted JS:** 3.45 MB

## Package Footprint (npm pack + npm install)

| Item | Size (KB) | Size (MB) |
| --- | ---: | ---: |
| Tarball (.tgz) | 3412.27 | 3.33 |
| dist/ | 9518.46 | 9.30 |
| node_modules/ | 95574.27 | 93.33 |
| dist + node_modules | 105092.74 | 102.63 |

