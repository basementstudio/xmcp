# Rspack Bundle Analysis

| Build | Assets | Total Size (MB) | Build Time |
| --- | ---: | ---: | ---: |
| Main Compiler | 2 | 4.16 | 1.53s |
| Runtime Compiler | 5 | 3.69 | 1.68s |

## Main Compiler

Source: `stats-main.json`

| Asset | Chunk | Size (KB) | Size (MB) |
| --- | --- | ---: | ---: |
| `cli.js` | cli | 4193.78 | 4.10 |
| `index.js` | index | 62.11 | 0.06 |

**Total emitted JS:** 4.16 MB

## Runtime Compiler

Source: `stats-runtime.json`

| Asset | Chunk | Size (KB) | Size (MB) |
| --- | --- | ---: | ---: |
| `http.js` | http | 1189.46 | 1.16 |
| `adapter-nextjs.js` | adapter-nextjs | 1165.04 | 1.14 |
| `adapter-express.js` | adapter-express | 1163.11 | 1.14 |
| `stdio.js` | stdio | 255.86 | 0.25 |
| `headers.js` | headers | 1.17 | 0.00 |

**Total emitted JS:** 3.69 MB

## Package Footprint (npm pack + npm install)

| Item | Size (KB) | Size (MB) |
| --- | ---: | ---: |
| Tarball (.tgz) | 3412.27 | 3.33 |
| dist/ | 9518.46 | 9.30 |
| node_modules/ | 95574.27 | 93.33 |
| dist + node_modules | 105092.74 | 102.63 |

