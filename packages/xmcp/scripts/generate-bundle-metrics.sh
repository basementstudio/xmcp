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

# Step 1: Build the framework with bundle analyzer (if stats files don't exist)
echo -e "${YELLOW}[1/5]${NC} Building xmcp framework..."
cd "$XMCP_PKG_DIR"

# Ensure xmcp package is built (dist folder must exist for file: reference to work)
if [ ! -d "$XMCP_PKG_DIR/dist" ]; then
    echo -e "${YELLOW}Building xmcp package (dist folder missing)...${NC}"
    GENERATE_STATS=true pnpm build
    if [ ! -d "$XMCP_PKG_DIR/dist" ]; then
        echo -e "${YELLOW}⚠${NC} Failed to build xmcp package. dist folder not found."
        exit 1
    fi
fi

# Check if stats files already exist (e.g., from a previous build step)
if [ -f "$XMCP_PKG_DIR/stats-main.json" ] && [ -f "$XMCP_PKG_DIR/stats-runtime.json" ]; then
    echo -e "${GREEN}✓${NC} Stats files already exist, skipping build..."
else
    GENERATE_STATS=true pnpm build
    
    # Check if stats files were generated
    if [ ! -f "$XMCP_PKG_DIR/stats-main.json" ] || [ ! -f "$XMCP_PKG_DIR/stats-runtime.json" ]; then
        echo -e "${YELLOW}⚠${NC} Stats files not found. Make sure BundleAnalyzerPlugin is configured."
        exit 1
    fi
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

# Build and ensure create-xmcp-app is ready
CREATE_XMCP_APP_DIR="$( cd "$XMCP_PKG_DIR/../create-xmcp-app" && pwd )"
if [ ! -d "$CREATE_XMCP_APP_DIR/dist" ]; then
    echo -e "${YELLOW}Building create-xmcp-app...${NC}"
    cd "$CREATE_XMCP_APP_DIR"
    pnpm build
    cd "$TEST_DIR"
fi

# Ensure create-xmcp-app has dependencies installed
if [ ! -d "$CREATE_XMCP_APP_DIR/node_modules" ]; then
    echo -e "${YELLOW}Installing create-xmcp-app dependencies...${NC}"
    cd "$CREATE_XMCP_APP_DIR"
    pnpm install --no-frozen-lockfile
    cd "$TEST_DIR"
fi

# Use local create-xmcp-app instead of npm version
echo -e "${BLUE}Creating test app with local create-xmcp-app...${NC}"
# Run from create-xmcp-app directory to ensure proper module resolution
cd "$CREATE_XMCP_APP_DIR"
# Use --skip-install to avoid npm installing xmcp@latest
if ! node index.js "$TEST_DIR/test-app" --http --yes --use-npm --skip-install; then
    echo -e "${YELLOW}⚠${NC} Failed to create test app. Check errors above."
    exit 1
fi
cd "$TEST_DIR"

if [ ! -d "test-app" ]; then
    echo -e "${YELLOW}⚠${NC} Test app directory was not created."
    exit 1
fi

cd test-app

# Update package.json to use local xmcp package instead of npm version
echo -e "${BLUE}Updating test app to use local xmcp package...${NC}"
# Use file: protocol for local package reference
if ! XMCP_PKG_DIR="$XMCP_PKG_DIR" node -e "
const fs = require('fs');
const path = require('path');
const xmcpPkgDir = process.env.XMCP_PKG_DIR;
if (!xmcpPkgDir) {
  console.error('Error: XMCP_PKG_DIR not set');
  process.exit(1);
}
const pkgPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(pkgPath)) {
  console.error('Error: package.json not found at', pkgPath);
  process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.dependencies = pkg.dependencies || {};
// Use file: protocol to reference local package
pkg.dependencies['xmcp'] = 'file:' + xmcpPkgDir;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log('Updated package.json to use local xmcp package:', 'file:' + xmcpPkgDir);
"; then
    echo -e "${YELLOW}⚠${NC} Failed to update package.json"
    exit 1
fi

# Install dependencies with local xmcp package reference
echo -e "${BLUE}Installing dependencies with local xmcp package...${NC}"
# Install xmcp package dependencies that might be needed at runtime
# @rspack/core is needed for the CLI to compile configs (it's in devDependencies but needed at runtime)
if ! npm install @rspack/core@^1.6.1; then
    echo -e "${YELLOW}⚠${NC} Failed to install @rspack/core"
fi

if ! npm install; then
    echo -e "${YELLOW}⚠${NC} Failed to install dependencies"
    echo -e "${BLUE}Checking xmcp package setup...${NC}"
    echo -e "  XMCP_PKG_DIR: $XMCP_PKG_DIR"
    echo -e "  dist exists: $([ -d "$XMCP_PKG_DIR/dist" ] && echo 'yes' || echo 'no')"
    echo -e "  package.json exists: $([ -f "$XMCP_PKG_DIR/package.json" ] && echo 'yes' || echo 'no')"
    exit 1
fi

# Verify xmcp package is properly linked
if [ ! -L "node_modules/xmcp" ] && [ ! -d "node_modules/xmcp" ]; then
    echo -e "${YELLOW}⚠${NC} xmcp package not found in node_modules after install"
    exit 1
fi

# Verify xmcp dist folder is accessible
if [ ! -d "node_modules/xmcp/dist" ]; then
    echo -e "${YELLOW}⚠${NC} xmcp dist folder not found in node_modules/xmcp"
    echo -e "${BLUE}Checking symlink...${NC}"
    if [ -L "node_modules/xmcp" ]; then
        echo -e "  Symlink target: $(readlink node_modules/xmcp)"
    fi
    exit 1
fi

TEST_APP_SIZE=$(du -sh . | cut -f1)
NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1 || echo "0")
echo -e "${GREEN}✓${NC} Created test app (Total: $TEST_APP_SIZE, node_modules: $NODE_MODULES_SIZE)"
echo ""

# Step 4: Build the test app
echo -e "${YELLOW}[4/5]${NC} Building test app..."
if ! npm run build; then
    echo -e "${YELLOW}⚠${NC} Failed to build test app. Check errors above."
    exit 1
fi
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

# Get top dependencies (excluding xmcp symlink since it's a local file reference)
echo -e "${BLUE}Collecting dependency sizes...${NC}"
# Exclude xmcp symlink and get actual dependencies
TOP_DEPS=$(cd "$TEST_DIR/test-app" && find node_modules -maxdepth 1 -type d ! -name node_modules ! -name xmcp -exec du -sh {} \; 2>/dev/null | sort -hr | head -20)

# Generate JSON array for top dependencies, defaulting to [] if empty
TOP_DEPS_JSON=$(cd "$TEST_DIR/test-app" && find node_modules -maxdepth 1 -type d ! -name node_modules ! -name xmcp -exec du -sh {} \; 2>/dev/null | sort -hr | head -20 | awk '{name=$2; gsub(/.*\//, "", name); printf "{\"name\": \"%s\", \"size\": \"%s\"},", name, $1}' | sed '$s/,$//' | sed '1s/^/[/;$s/$/]/')
if [ -z "$TOP_DEPS_JSON" ]; then
  TOP_DEPS_JSON="[]"
fi

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
  "top_dependencies": $TOP_DEPS_JSON
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

// Parse size string to bytes for calculations
const parseSizeToBytes = (sizeStr) => {
  if (!sizeStr || sizeStr === 'N/A') return 0;
  const normalized = sizeStr.trim().toUpperCase();
  const match = normalized.match(/^([\d.]+)\s*(KB|MB|GB|B)?$/);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2] || 'B';
  const multipliers = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
  return Math.round(value * multipliers[unit]);
};

// Format bytes to human-readable
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

// Get top dependencies (excluding xmcp symlink)
const getTopDeps = () => {
  try {
    if (!testAppPath || !fs.existsSync(path.join(testAppPath, 'node_modules'))) {
      return [];
    }
    // Exclude xmcp symlink and get actual dependencies
    const output = execSync(
      `cd "${testAppPath}" && find node_modules -maxdepth 1 -type d ! -name node_modules ! -name xmcp -exec du -sh {} \\; 2>/dev/null | sort -hr | head -20`,
      { encoding: 'utf8' }
    );
    return output.trim().split('\n').filter(line => line).map(line => {
      const parts = line.split('\t');
      if (parts.length < 2) return null;
      const size = parts[0];
      const fullPath = parts[1];
      const name = path.basename(fullPath);
      return { size, name };
    }).filter(Boolean);
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

// Calculate key insights dynamically
const frameworkCliBytes = parseSizeToBytes(frameworkBundles['cli.js']);
const testAppTotalBytes = parseSizeToBytes(testAppMetrics.total);
const testAppNodeModulesBytes = parseSizeToBytes(testAppMetrics.nodeModules);
const testAppDistBytes = parseSizeToBytes(testAppMetrics.dist);

// Calculate build tools percentage (look for common build tools in top deps)
const buildToolNames = ['typescript', 'tsx', 'swc', '@swc', 'esbuild', 'webpack', '@rspack', 'rspack'];
const buildToolsSize = topDeps
  .filter(dep => buildToolNames.some(tool => dep.name.toLowerCase().includes(tool.toLowerCase())))
  .reduce((sum, dep) => sum + parseSizeToBytes(dep.size), 0);
const buildToolsPercentage = testAppNodeModulesBytes > 0 
  ? ((buildToolsSize / testAppNodeModulesBytes) * 100).toFixed(0)
  : '0';

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
        <li>The ${testAppMetrics.total} app size is NOT from runtime bundles (${frameworkBundles['cli.js']})</li>
        <li>${testAppMetrics.nodeModules} is node_modules with build-time dependencies</li>
        <li>Compiled production bundle is ${testAppMetrics.dist}</li>
        <li>~${buildToolsPercentage}% of node_modules is build tools (swc, typescript, esbuild, webpack, rspack)</li>
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

