#!/usr/bin/env node

/**
 * Compares current bundle metrics with baseline and generates a markdown report
 */

const fs = require("fs");
const path = require("path");

// Parse human-readable size to bytes
function parseSize(sizeStr) {
  if (!sizeStr || sizeStr === "N/A") return null;

  const normalized = sizeStr.trim().toUpperCase();
  const match = normalized.match(/^([\d.]+)\s*(KB|MB|GB|B)?$/);

  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = match[2] || "B";

  const multipliers = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  };

  return Math.round(value * multipliers[unit]);
}

// Format bytes to human-readable
function formatSize(bytes) {
  if (bytes === null || bytes === undefined) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Calculate percentage change
function getChange(current, baseline) {
  if (baseline === 0) return current > 0 ? 100 : 0;
  if (!current || !baseline) return null;
  return ((current - baseline) / baseline) * 100;
}

// Get symbol for change
function getChangeEmoji(change) {
  if (change === null) return "—";
  if (change < -5) return "✓";
  if (change < 0) return "↓";
  if (change === 0) return "—";
  if (change < 5) return "↑";
  if (change < 10) return "⚠";
  return "⚠⚠";
}

// Compare two metrics objects
function compareMetrics(current, baseline) {
  const results = {
    framework: {},
    testApp: {},
  };

  // Compare framework bundles
  if (current.framework_bundles && baseline.framework_bundles) {
    // Main bundles
    if (current.framework_bundles.main && baseline.framework_bundles.main) {
      results.framework.main = {};
      for (const [key, currentSize] of Object.entries(
        current.framework_bundles.main
      )) {
        const baselineSize = baseline.framework_bundles.main[key];
        const currentBytes = parseSize(currentSize);
        const baselineBytes = parseSize(baselineSize);
        const change = getChange(currentBytes, baselineBytes);

        results.framework.main[key] = {
          current: currentSize,
          baseline: baselineSize || "N/A",
          currentBytes,
          baselineBytes,
          change,
          emoji: getChangeEmoji(change),
        };
      }
    }

    // Runtime bundles
    if (
      current.framework_bundles.runtime &&
      baseline.framework_bundles.runtime
    ) {
      results.framework.runtime = {};
      for (const [key, currentSize] of Object.entries(
        current.framework_bundles.runtime
      )) {
        const baselineSize = baseline.framework_bundles.runtime[key];
        const currentBytes = parseSize(currentSize);
        const baselineBytes = parseSize(baselineSize);
        const change = getChange(currentBytes, baselineBytes);

        results.framework.runtime[key] = {
          current: currentSize,
          baseline: baselineSize || "N/A",
          currentBytes,
          baselineBytes,
          change,
          emoji: getChangeEmoji(change),
        };
      }
    }
  }

  // Compare test app metrics
  if (current.test_app && baseline.test_app) {
    for (const [key, currentSize] of Object.entries(current.test_app)) {
      const baselineSize = baseline.test_app[key];
      const currentBytes = parseSize(currentSize);
      const baselineBytes = parseSize(baselineSize);
      const change = getChange(currentBytes, baselineBytes);

      results.testApp[key] = {
        current: currentSize,
        baseline: baselineSize || "N/A",
        currentBytes,
        baselineBytes,
        change,
        emoji: getChangeEmoji(change),
      };
    }
  }

  return results;
}

// Check if there are any changes in the comparison
function hasChanges(comparison) {
  // Check framework bundles
  if (comparison.framework.main) {
    for (const data of Object.values(comparison.framework.main)) {
      if (data.change !== null && data.change !== 0) {
        return true;
      }
    }
  }

  if (comparison.framework.runtime) {
    for (const data of Object.values(comparison.framework.runtime)) {
      if (data.change !== null && data.change !== 0) {
        return true;
      }
    }
  }

  // Check test app metrics
  if (comparison.testApp) {
    for (const data of Object.values(comparison.testApp)) {
      if (data.change !== null && data.change !== 0) {
        return true;
      }
    }
  }

  return false;
}

// Generate markdown report
function generateMarkdown(comparison, currentMetadata) {
  const lines = [
    "## Bundle Size Analysis",
    "",
    `Generated: ${currentMetadata?.generated || "Unknown"}`,
    "",
  ];

  // Framework bundles table
  lines.push("### Framework Bundles");
  lines.push("");
  lines.push("| Bundle | Current | Baseline | Change | Status |");
  lines.push("|--------|---------|----------|--------|--------|");

  // Main bundles
  if (comparison.framework.main) {
    for (const [key, data] of Object.entries(comparison.framework.main)) {
      const changeStr =
        data.change !== null
          ? `${data.change > 0 ? "+" : ""}${data.change.toFixed(1)}%`
          : "N/A";
      const bundleName = key.replace(/_js$/, ".js").replace(/_/g, ".");
      lines.push(
        `| \`${bundleName}\` | ${data.current} | ${data.baseline} | ${changeStr} | ${data.emoji} |`
      );
    }
  }

  // Runtime bundles
  if (comparison.framework.runtime) {
    for (const [key, data] of Object.entries(comparison.framework.runtime)) {
      const changeStr =
        data.change !== null
          ? `${data.change > 0 ? "+" : ""}${data.change.toFixed(1)}%`
          : "N/A";
      const bundleName = key.replace(/_js$/, ".js").replace(/_/g, ".");
      lines.push(
        `| \`runtime/${bundleName}\` | ${data.current} | ${data.baseline} | ${changeStr} | ${data.emoji} |`
      );
    }
  }

  lines.push("");

  // Test app metrics
  lines.push("### Test App Metrics");
  lines.push("");
  lines.push("| Metric | Current | Baseline | Change | Status |");
  lines.push("|--------|---------|----------|--------|--------|");

  if (comparison.testApp) {
    for (const [key, data] of Object.entries(comparison.testApp)) {
      const changeStr =
        data.change !== null
          ? `${data.change > 0 ? "+" : ""}${data.change.toFixed(1)}%`
          : "N/A";
      const metricName = key.replace(/_/g, " ");
      lines.push(
        `| ${metricName} | ${data.current} | ${data.baseline} | ${changeStr} | ${data.emoji} |`
      );
    }
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("**Legend:**");
  lines.push("- ✓ Significant decrease (>5%)");
  lines.push("- ↓ Small decrease");
  lines.push("- — No change");
  lines.push("- ↑ Small increase (<5%)");
  lines.push("- ⚠ Moderate increase (5-10%)");
  lines.push("- ⚠⚠ Significant increase (>10%)");
  lines.push("");
  lines.push(
    "> Detailed bundle reports are available in the workflow artifacts."
  );

  return lines.join("\n");
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const currentMetricsPath =
    args[0] || path.join(__dirname, "..", "bundle-metrics.json");
  const baselinePath =
    args[1] ||
    path.join(__dirname, "..", "..", "..", ".github", "bundle-baseline.json");

  // Read current metrics
  if (!fs.existsSync(currentMetricsPath)) {
    console.error(
      `Error: Current metrics file not found: ${currentMetricsPath}`
    );
    process.exit(1);
  }

  const currentMetrics = JSON.parse(
    fs.readFileSync(currentMetricsPath, "utf8")
  );

  // Read baseline (optional - if doesn't exist, just show current)
  let baselineMetrics = null;
  if (fs.existsSync(baselinePath)) {
    baselineMetrics = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  } else {
    console.warn(`Warning: Baseline file not found: ${baselinePath}`);
    console.warn("Showing current metrics only (no comparison available)");
  }

  // Compare or just format current
  let comparison;
  let markdown;
  let hasChangesFlag = false;

  if (baselineMetrics) {
    comparison = compareMetrics(currentMetrics, baselineMetrics);
    hasChangesFlag = hasChanges(comparison);
    markdown = generateMarkdown(comparison, currentMetrics.metadata);
  } else {
    // No baseline - always show on first run
    hasChangesFlag = true;
    // Just show current metrics without comparison
    markdown = [
      "## Bundle Size Analysis",
      "",
      `Generated: ${currentMetrics.metadata?.generated || "Unknown"}`,
      "",
      "> ⚠ No baseline found. This is the first run or baseline needs to be set.",
      "",
      "### Current Framework Bundles",
      "",
      "| Bundle | Size |",
      "|--------|------|",
    ];

    if (currentMetrics.framework_bundles?.main) {
      for (const [key, size] of Object.entries(
        currentMetrics.framework_bundles.main
      )) {
        const bundleName = key.replace(/_js$/, ".js").replace(/_/g, ".");
        markdown.push(`| \`${bundleName}\` | ${size} |`);
      }
    }

    if (currentMetrics.framework_bundles?.runtime) {
      for (const [key, size] of Object.entries(
        currentMetrics.framework_bundles.runtime
      )) {
        const bundleName = key.replace(/_js$/, ".js").replace(/_/g, ".");
        markdown.push(`| \`runtime/${bundleName}\` | ${size} |`);
      }
    }

    markdown.push("");
    markdown.push("### Current Test App Metrics");
    markdown.push("");
    markdown.push("| Metric | Size |");
    markdown.push("|--------|------|");

    if (currentMetrics.test_app) {
      for (const [key, size] of Object.entries(currentMetrics.test_app)) {
        const metricName = key.replace(/_/g, " ");
        markdown.push(`| ${metricName} | ${size} |`);
      }
    }

    // Join array into string
    markdown = markdown.join("\n");
  }

  // Output markdown
  console.log(markdown);

  // Also write to file for GitHub Actions
  const outputPath =
    process.env.BUNDLE_COMMENT_PATH ||
    path.join(__dirname, "..", "bundle-comment.md");
  fs.writeFileSync(outputPath, markdown);

  // Write flag file to indicate if there are changes
  const flagPath =
    process.env.BUNDLE_HAS_CHANGES_PATH ||
    path.join(__dirname, "..", "bundle-has-changes.txt");
  fs.writeFileSync(flagPath, hasChangesFlag ? "true" : "false");
}

if (require.main === module) {
  main();
}

module.exports = {
  compareMetrics,
  generateMarkdown,
  parseSize,
  formatSize,
  hasChanges,
};
