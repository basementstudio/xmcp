# GitHub + xmcp

An authenticated HTTP MCP server using GitHub's REST API and Node's built-in `fetch`. All three tools are read-only; they do not post comments, change files, or merge pull requests.

| Tool                   | Purpose                                                       |
| ---------------------- | ------------------------------------------------------------- |
| `list-pull-requests`   | List one page of pull requests, newest created first.         |
| `get-pull-request`     | Read a PR's description, refs, commit SHAs, and merge status. |
| `read-repository-file` | Read one UTF-8 text file at a branch, tag, or commit.         |

## Run

Use Node 22 and pnpm. Create a fine-grained GitHub personal access token restricted to the repositories you intend to expose. Grant **Pull requests: read** for the PR tools and **Contents: read** for file reads. See GitHub's [pull request API](https://docs.github.com/en/rest/pulls/pulls) and [contents API](https://docs.github.com/en/rest/repos/contents).

From the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler
pnpm install --frozen-lockfile
cp examples/github-http/.env.example examples/github-http/.env
# Fill in GITHUB_TOKEN and a separate MCP_API_KEY.
pnpm --filter github-http build
pnpm --filter github-http start
```

Generate `MCP_API_KEY` with `openssl rand -hex 32` and keep `.env` private. MCP clients send this separate secret as `x-api-key` on every request. Only `GITHUB_TOKEN` is sent to `https://api.github.com`, as a Bearer token. The example pins the REST API version to `2026-03-10` and does not follow redirects or provider-supplied download URLs.

All MCP clients share the provider token's repository access. The `owner` and `repo` arguments do not establish per-user permissions. Use trusted clients and scope the token to the intended repositories. GitHub Enterprise Server and per-user OAuth are outside this example's scope.

Connect your client to the printed endpoint, normally `http://localhost:3001/mcp` (xmcp picks another available port if needed).

## List pull requests

In another terminal, set the same MCP key:

```sh
export MCP_API_KEY='your-client-secret'
curl http://localhost:3001/mcp \
  -H "x-api-key: $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list-pull-requests","arguments":{"owner":"basementstudio","repo":"xmcp","limit":10}}}'
```

The JSON text result contains `pullRequests` and `nextPage`. `state` defaults to `open`, with `closed` and `all` also supported. `limit` defaults to 20 and accepts 1–50; `page` defaults to 1. Pass a non-null `nextPage` as `page` with other arguments unchanged. The server never follows pagination automatically.

## Inspect a PR and its source

Call `get-pull-request` using a PR number from the list:

```json
{
  "owner": "basementstudio",
  "repo": "xmcp",
  "number": 123
}
```

This returns description and metadata, not review comments, checks, or diffs. `mergeable: null` means GitHub has not yet determined mergeability; it is not treated as false. A deleted fork may have `head.repo: null`.

For a file, call `read-repository-file`:

```json
{
  "owner": "basementstudio",
  "repo": "xmcp",
  "path": "README.md",
  "ref": "main"
}
```

The response includes `path`, the file's blob `sha`, its GitHub `url`, and decoded `content`. Omit `ref` for the default branch, or use a commit SHA for reproducible content. To inspect a fork PR's source, use `head.repo.full_name` for the repository and `head.sha` for `ref`; the token must have access to that repository.

File reads are limited to **100,000 bytes** to bound tool output. Directories, submodules, oversized files, malformed base64, and binary/non-UTF-8 content return errors. GitHub may resolve an in-repository symlink to its target file. The example does not recursively traverse repositories or fetch raw download URLs. Use the repository's current owner/name if it has been renamed, since redirects are disabled.

## Errors and validation

Missing or incorrect MCP keys return HTTP 401. Provider failures return MCP tool errors with HTTP status, without raw error bodies. Numeric `Retry-After` values are returned as `retryAfterSeconds` for HTTP 403/429 when supplied. A GitHub 404 may mean the token cannot access the resource. Requests time out after 30 seconds and are not retried automatically.

```sh
pnpm --filter github-http build
pnpm --filter github-http typecheck
pnpm --filter github-http test
pnpm --filter github-http test:smoke
```

Tests mock all provider requests. Built-server smoke tests cover MCP 2025-03-26 and 2026-07-28, authentication on every call, discovery, all three tools, and invalid input. Live token permissions and repository content require your own token and are not covered by these tests.
