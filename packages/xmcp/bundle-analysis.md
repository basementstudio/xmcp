# Rspack Bundle Analysis

| Build            | Assets | Total Size (MB) | Build Time |
| ---------------- | -----: | --------------: | ---------: |
| Runtime Package  |      5 |            0.36 |      1.31s |
| Prebuilt Runtime |      7 |            5.32 |      1.40s |

## Runtime Package

Source: `stats-main.json`

| Asset            | Chunk       | Size (KB) | Size (MB) |
| ---------------- | ----------- | --------: | --------: |
| `index.js`       | index       |    334.12 |      0.33 |
| `cloudflare.js`  | cloudflare  |     26.68 |      0.03 |
| `config.js`      | config      |      5.57 |      0.01 |
| `host-bridge.js` | host-bridge |      4.76 |      0.00 |
| `cli.js`         | cli         |      0.79 |      0.00 |

**Total emitted JS:** 0.36 MB

## Prebuilt Runtime

Source: `stats-runtime.json`

| Asset                | Chunk           | Size (KB) | Size (MB) |
| -------------------- | --------------- | --------: | --------: |
| `http.js`            | http            |   1041.34 |      1.02 |
| `adapter-nestjs.js`  | adapter-nestjs  |   1016.28 |      0.99 |
| `adapter-nextjs.js`  | adapter-nextjs  |   1011.67 |      0.99 |
| `adapter-express.js` | adapter-express |   1008.81 |      0.99 |
| `adapter-fastify.js` | adapter-fastify |   1008.70 |      0.99 |
| `stdio.js`           | stdio           |    361.44 |      0.35 |
| `headers.js`         | headers         |      1.73 |      0.00 |

**Total emitted JS:** 5.32 MB

## Package Footprint (npm pack + npm install)

| Item                | Size (KB) | Size (MB) |
| ------------------- | --------: | --------: |
| Tarball (.tgz)      |   1961.02 |      1.92 |
| dist/               |   5905.60 |      5.77 |
| node_modules/       |   4451.74 |      4.35 |
| dist + node_modules |  10357.34 |     10.11 |
