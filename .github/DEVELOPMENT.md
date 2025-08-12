# CI/CD Setup for xmcp

This directory contains the GitHub Actions workflows for continuous integration of the xmcp monorepo.

## Workflows

### `ci.yml` - Main CI Pipeline

Runs on every pull request to `main`.

**What it does:**

- ✅ Builds main packages only (`xmcp` and `create-xmcp-app`) using Turbo filters
- ✅ Runs linting on main packages (if available)
- ✅ Verifies build outputs exist
- ✅ Tests that both CLIs are executable
- ✅ Tests `create-xmcp-app` can create new projects
- ✅ Validates example projects work with built packages
- ✅ Checks main package.json integrity (skips config packages)
- ✅ Verifies lockfile integrity via `--frozen-lockfile` flag

**Skip CLI Tests:**
Set the environment variable `SKIP_CLI_TESTS=true` in the workflow to skip CLI tests and only run build verification.

### `manual-ci.yml` - Manual CI with Options

Manually triggered workflow with options to customize testing.

**Features:**

- ✅ Choose to skip CLI tests for faster feedback
- ✅ Select target branch to test
- ✅ Same comprehensive testing as main CI
- ✅ Builds only main packages for speed

### `cross-platform.yml` - Cross-Platform Testing

Runs on PR to `main`.

**What it does:**

- ✅ Tests on Ubuntu, Windows, and macOS
- ✅ Builds only main packages for faster execution
- ✅ Ensures CLIs work across all platforms
- ✅ Verifies Node.js compatibility

### `publish.yml` - NPM Publishing

Automatically triggered when a GitHub release is published.

**What it does:**

- ✅ Builds both main packages (`xmcp` and `create-xmcp-app`)
- ✅ Verifies build outputs before publishing
- ✅ Extracts version from release tag (supports `v1.0.0` or `1.0.0` format)
- ✅ Updates package.json versions to match release tag
- ✅ Publishes both packages to NPM with provenance
- ✅ Creates a summary with installation instructions

**Requirements:**

- Set `NPM_TOKEN` secret in repository settings
- Create GitHub releases with semantic version tags (e.g., `v1.0.0`)
- Both packages will be published with the same version from the release tag

## Running Tests Locally

```bash
# Install dependencies
pnpm install

# Build main packages only (default - faster)
pnpm run build

# Build all packages including examples
pnpm run build:all

# Run full CI test suite
pnpm run ci

# Run build-only CI (skip CLI tests)
pnpm run ci:build-only

# Run individual test components
pnpm run test:build         # Test build outputs only
pnpm run test:cli           # Test CLI functionality
pnpm run test:cli:skip      # Skip CLI tests (exits immediately)

# Linting options
pnpm run lint               # Lint main packages only
pnpm run lint:all           # Lint all packages including examples
```

## Build Strategy

**Default behavior (recommended):**

- `pnpm run build` - Builds only `xmcp` and `create-xmcp-app` packages
- Skips building examples and config packages for faster CI/development iteration
- Examples are tested by installing the built packages, not by building them
- Config packages (like `eslint-config-custom`) are skipped in validation
- Lockfile integrity is verified automatically with `--frozen-lockfile`

**Full build (when needed):**

- `pnpm run build:all` - Builds everything including examples
- Use when you need to test example projects in depth

## Skipping CLI Tests

**Locally:**

```bash
# Skip CLI tests in full pipeline
pnpm run ci:build-only

# Or skip just the CLI portion
pnpm run test:ci:skip-cli
```

**In GitHub Actions:**

1. **Automatic CI:** Set `SKIP_CLI_TESTS: true` in the workflow environment
2. **Manual CI:** Use the "Manual CI" workflow and check "Skip CLI tests"

## Troubleshooting

**Build failures:**

- Ensure all packages have proper `build` scripts
- Check that TypeScript configurations are correct
- Verify all dependencies are properly declared

**CLI test failures:**

- Ensure CLIs have proper `--help` flags
- Check that bin files are executable
- Verify CLI entry points exist after build
- Use `pnpm run ci:build-only` to isolate build issues from CLI issues

**Lockfile issues:**

- The `--frozen-lockfile` flag ensures the lockfile is up to date
- If CI fails due to lockfile issues, run `pnpm install` locally and commit the updated lockfile

## Development Tips

**Fast iteration during development:**

- Use `pnpm run ci:build-only` for quick build verification
- Use the "Manual CI" workflow in GitHub for on-demand testing
- Skip CLI tests when debugging build issues to get faster feedback
- Default build targets only main packages for speed
- Config packages are automatically skipped in integrity checks
- Lockfile verification is built into the installation step for simplicity
