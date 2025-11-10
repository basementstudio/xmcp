#!/bin/bash

# Bundle Metrics Generation Script for xmcp
# This script generates comprehensive bundle analysis metrics
# Usage: ./scripts/generate-bundle-metrics.sh

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  xmcp Bundle Metrics Generator${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get the script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
XMCP_PKG_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo -e "${GREEN}✓${NC} Script directory: $SCRIPT_DIR"
echo -e "${GREEN}✓${NC} xmcp package directory: $XMCP_PKG_DIR"
echo ""

# Step 1: Build the framework with bundle analyzer
echo -e "${YELLOW}[1/5]${NC} Building xmcp framework..."
cd "$XMCP_PKG_DIR"
GENERATE_STATS=true pnpm build

# Check if stats files were generated
if [ ! -f "$XMCP_PKG_DIR/stats-main.json" ] || [ ! -f "$XMCP_PKG_DIR/stats-runtime.json" ]; then
    echo -e "${YELLOW}⚠${NC} Stats files not found. Make sure BundleAnalyzerPlugin is configured."
    exit 1
fi

STATS_MAIN_SIZE=$(du -h "$XMCP_PKG_DIR/stats-main.json" | cut -f1)
STATS_RUNTIME_SIZE=$(du -h "$XMCP_PKG_DIR/stats-runtime.json" | cut -f1)
echo -e "${GREEN}✓${NC} Generated stats-main.json ($STATS_MAIN_SIZE)"
echo -e "${GREEN}✓${NC} Generated stats-runtime.json ($STATS_RUNTIME_SIZE)"
echo ""

# Step 2: Generate HTML reports from stats
echo -e "${YELLOW}[2/5]${NC} Generating HTML bundle reports..."
npx webpack-bundle-analyzer stats-main.json dist --mode static --report bundle-report-main.html --no-open > /dev/null 2>&1
npx webpack-bundle-analyzer stats-runtime.json dist/runtime --mode static --report bundle-report-runtime.html --no-open > /dev/null 2>&1
echo -e "${GREEN}✓${NC} Generated bundle-report-main.html"
echo -e "${GREEN}✓${NC} Generated bundle-report-runtime.html"
echo ""

# Step 3: Create a fresh test app
echo -e "${YELLOW}[3/5]${NC} Creating fresh test app..."
TEST_DIR="/tmp/xmcp-metrics-test-$(date +%s)"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

npx create-xmcp-app@latest test-app --http --yes --use-npm > /dev/null 2>&1
cd test-app

TEST_APP_SIZE=$(du -sh . | cut -f1)
NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1 || echo "0")
echo -e "${GREEN}✓${NC} Created test app (Total: $TEST_APP_SIZE, node_modules: $NODE_MODULES_SIZE)"
echo ""

# Step 4: Build the test app
echo -e "${YELLOW}[4/5]${NC} Building test app..."
npm run build > /dev/null 2>&1
DIST_SIZE=$(du -sh dist 2>/dev/null | cut -f1 || echo "0")
echo -e "${GREEN}✓${NC} Built test app (dist: $DIST_SIZE)"
echo ""

# Step 5: Collect metrics and generate files
echo -e "${YELLOW}[5/5]${NC} Collecting metrics and generating reports..."

# Get framework bundle sizes
FRAMEWORK_CLI_SIZE=$(ls -lh "$XMCP_PKG_DIR/dist/cli.js" | awk '{print $5}')
FRAMEWORK_INDEX_SIZE=$(ls -lh "$XMCP_PKG_DIR/dist/index.js" | awk '{print $5}')
FRAMEWORK_HTTP_SIZE=$(ls -lh "$XMCP_PKG_DIR/dist/runtime/http.js" 2>/dev/null | awk '{print $5}' || echo "N/A")
FRAMEWORK_STDIO_SIZE=$(ls -lh "$XMCP_PKG_DIR/dist/runtime/stdio.js" 2>/dev/null | awk '{print $5}' || echo "N/A")

# Get test app metrics
TEST_APP_TOTAL_SIZE=$(du -sh "$TEST_DIR/test-app" | cut -f1)
TEST_APP_NODE_MODULES=$(du -sh "$TEST_DIR/test-app/node_modules" 2>/dev/null | cut -f1 || echo "0")
TEST_APP_DIST=$(du -sh "$TEST_DIR/test-app/dist" 2>/dev/null | cut -f1 || echo "0")

# Get top dependencies
echo -e "${BLUE}Collecting dependency sizes...${NC}"
TOP_DEPS=$(cd "$TEST_DIR/test-app" && du -sh node_modules/* 2>/dev/null | sort -hr | head -20)

# Generate timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Generate JSON metrics file
cat > "$XMCP_PKG_DIR/bundle-metrics.json" << EOF
{
  "metadata": {
    "generated": "$TIMESTAMP",
    "framework": "xmcp",
    "script_version": "1.0.0"
  },
  "framework_bundles": {
    "main": {
      "cli_js": "$FRAMEWORK_CLI_SIZE",
      "index_js": "$FRAMEWORK_INDEX_SIZE"
    },
    "runtime": {
      "http_js": "$FRAMEWORK_HTTP_SIZE",
      "stdio_js": "$FRAMEWORK_STDIO_SIZE"
    },
    "stats_files": {
      "stats_main_json": "$STATS_MAIN_SIZE",
      "stats_runtime_json": "$STATS_RUNTIME_SIZE"
    }
  },
  "test_app": {
    "total_size": "$TEST_APP_TOTAL_SIZE",
    "node_modules": "$TEST_APP_NODE_MODULES",
    "dist": "$TEST_APP_DIST"
  },
  "top_dependencies": $(cd "$TEST_DIR/test-app" && du -sh node_modules/* 2>/dev/null | sort -hr | head -20 | awk '{printf "{\"name\": \"%s\", \"size\": \"%s\"},", $2, $1}' | sed 's/,$//' | sed 's/^/[/' | sed 's/$/]/')
}
EOF

echo -e "${GREEN}✓${NC} Generated bundle-metrics.json"

# Generate HTML report (calling Node.js to process the data properly)
XMCP_PKG_DIR="$XMCP_PKG_DIR" TEST_DIR="$TEST_DIR" node << 'NODESCRIPT'
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const xmcpPkgDir = process.env.XMCP_PKG_DIR;
const testDir = process.env.TEST_DIR;

if (!xmcpPkgDir || !testDir) {
  console.error('Error: XMCP_PKG_DIR or TEST_DIR environment variables not set');
  console.error('xmcpPkgDir:', xmcpPkgDir);
  console.error('testDir:', testDir);
  process.exit(1);
}

// Read framework bundle sizes
const getFileSize = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    const mb = (stats.size / (1024 * 1024)).toFixed(2);
    return mb >= 1 ? `${mb} MB` : `${(stats.size / 1024).toFixed(1)} KB`;
  } catch {
    return 'N/A';
  }
};

const frameworkBundles = {
  'cli.js': getFileSize(path.join(xmcpPkgDir, 'dist/cli.js')),
  'index.js': getFileSize(path.join(xmcpPkgDir, 'dist/index.js')),
  'http.js': getFileSize(path.join(xmcpPkgDir, 'dist/runtime/http.js')),
  'adapter-nextjs.js': getFileSize(path.join(xmcpPkgDir, 'dist/runtime/adapter-nextjs.js')),
  'adapter-express.js': getFileSize(path.join(xmcpPkgDir, 'dist/runtime/adapter-express.js')),
  'stdio.js': getFileSize(path.join(xmcpPkgDir, 'dist/runtime/stdio.js')),
  'headers.js': getFileSize(path.join(xmcpPkgDir, 'dist/runtime/headers.js'))
};

// Get test app metrics
const getDirectorySize = (dirPath) => {
  try {
    if (!dirPath || !fs.existsSync(dirPath)) {
      return 'N/A';
    }
    const output = execSync(`du -sh "${dirPath}" 2>/dev/null || echo "0"`, { encoding: 'utf8' });
    return output.trim().split('\t')[0] || 'N/A';
  } catch (e) {
    console.error(`Error getting size for ${dirPath}: ${e.message}`);
    return 'N/A';
  }
};

const testAppPath = testDir ? path.join(testDir, 'test-app') : null;
const testAppMetrics = testAppPath ? {
  total: getDirectorySize(testAppPath),
  nodeModules: getDirectorySize(path.join(testAppPath, 'node_modules')),
  dist: getDirectorySize(path.join(testAppPath, 'dist'))
} : {
  total: 'N/A',
  nodeModules: 'N/A',
  dist: 'N/A'
};

// Get top dependencies
const getTopDeps = () => {
  try {
    if (!testAppPath || !fs.existsSync(path.join(testAppPath, 'node_modules'))) {
      return [];
    }
    const output = execSync(
      `cd "${testAppPath}" && du -sh node_modules/* 2>/dev/null | sort -hr | head -20`,
      { encoding: 'utf8' }
    );
    return output.trim().split('\n').filter(line => line).map(line => {
      const [size, name] = line.split('\t');
      return { size, name: path.basename(name) };
    });
  } catch (e) {
    console.error(`Error getting top deps: ${e.message}`);
    return [];
  }
};

const topDeps = getTopDeps();

// Get test app dist files
const getDistFiles = () => {
  try {
    if (!testAppPath) {
      return [];
    }
    const distPath = path.join(testAppPath, 'dist');
    if (!fs.existsSync(distPath)) {
      return [];
    }
    const files = fs.readdirSync(distPath);
    return files.map(file => ({
      name: file,
      size: getFileSize(path.join(distPath, file))
    })).filter(f => f.size !== 'N/A');
  } catch (e) {
    console.error(`Error getting dist files: ${e.message}`);
    return [];
  }
};

const distFiles = getDistFiles();

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>xmcp Bundle Analysis</title>
</head>
<body>
    <h1>xmcp Bundle Analysis</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
    <hr>
    
    <h2>Summary Metrics</h2>
    <ul>
        <li><strong>Framework CLI:</strong> ${frameworkBundles['cli.js']} (includes all embedded runtimes)</li>
        <li><strong>Fresh App Size:</strong> ${testAppMetrics.total} (node_modules + source)</li>
        <li><strong>Compiled App:</strong> ${testAppMetrics.dist} (production dist/)</li>
        <li><strong>node_modules:</strong> ${testAppMetrics.nodeModules}</li>
    </ul>
    
    <h2>Key Insights</h2>
    <ul>
        <li>The ~141MB app size is NOT from runtime bundles (~1MB)</li>
        <li>~140MB is node_modules with build-time dependencies</li>
        <li>Compiled production bundle is only ~1-2MB</li>
        <li>~47% of node_modules is build tools (swc, typescript, esbuild, webpack)</li>
        <li>Runtime files are embedded as strings in cli.js</li>
    </ul>
    
    <h2>Framework Bundle Sizes</h2>
    <table border="1">
        <thead>
            <tr>
                <th>File</th>
                <th>Size</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>cli.js</strong></td>
                <td>${frameworkBundles['cli.js']}</td>
                <td>Main CLI (includes all embedded runtime files)</td>
            </tr>
            <tr>
                <td>index.js</td>
                <td>${frameworkBundles['index.js']}</td>
                <td>Framework exports</td>
            </tr>
            <tr>
                <td>http.js</td>
                <td>${frameworkBundles['http.js']}</td>
                <td>HTTP transport runtime</td>
            </tr>
            <tr>
                <td>adapter-nextjs.js</td>
                <td>${frameworkBundles['adapter-nextjs.js']}</td>
                <td>Next.js adapter runtime</td>
            </tr>
            <tr>
                <td>adapter-express.js</td>
                <td>${frameworkBundles['adapter-express.js']}</td>
                <td>Express adapter runtime</td>
            </tr>
            <tr>
                <td>stdio.js</td>
                <td>${frameworkBundles['stdio.js']}</td>
                <td>STDIO transport runtime</td>
            </tr>
            <tr>
                <td>headers.js</td>
                <td>${frameworkBundles['headers.js']}</td>
                <td>HTTP headers utility</td>
            </tr>
        </tbody>
    </table>
    
    <h2>Top 20 Dependencies (Test App)</h2>
    <table border="1">
        <thead>
            <tr>
                <th>Package</th>
                <th>Size</th>
            </tr>
        </thead>
        <tbody>
            ${topDeps.length > 0 ? topDeps.map(dep => `
            <tr>
                <td>${dep.name}</td>
                <td>${dep.size}</td>
            </tr>
            `).join('') : '<tr><td colspan="2">No dependency data available</td></tr>'}
        </tbody>
    </table>
    
    <h2>Compiled App Files</h2>
    <table border="1">
        <thead>
            <tr>
                <th>File</th>
                <th>Size</th>
            </tr>
        </thead>
        <tbody>
            ${distFiles.length > 0 ? distFiles.map(file => `
            <tr>
                <td>${file.name}</td>
                <td>${file.size}</td>
            </tr>
            `).join('') : '<tr><td colspan="2">No compiled files available</td></tr>'}
        </tbody>
    </table>
</body>
</html>`;

fs.writeFileSync(path.join(xmcpPkgDir, 'bundle-metrics.html'), html);
console.log('Generated bundle-metrics.html');
NODESCRIPT

echo -e "${GREEN}✓${NC} Generated bundle-metrics.html"
echo ""

# Cleanup
echo -e "${BLUE}Cleaning up test directory...${NC}"
rm -rf "$TEST_DIR"
echo -e "${GREEN}✓${NC} Cleaned up $TEST_DIR"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Bundle metrics generated successfully!${NC}"
echo ""
echo -e "Generated files:"
echo -e "  📊 stats-main.json ($STATS_MAIN_SIZE)"
echo -e "  📊 stats-runtime.json ($STATS_RUNTIME_SIZE)"
echo -e "  📈 bundle-report-main.html"
echo -e "  📈 bundle-report-runtime.html"
echo -e "  📄 bundle-metrics.json"
echo -e "  🌐 bundle-metrics.html"
echo ""
echo -e "View the report:"
echo -e "  ${BLUE}open $XMCP_PKG_DIR/bundle-metrics.html${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

