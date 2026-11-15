---
name: release-notes
description: Draft release notes from the changes merged since a release tag. Use when the user asks for a changelog, release notes, or a summary of what shipped.
license: MIT
metadata:
  author: xmcp
  version: "1.0"
---

# Release notes

1. Call the `list-merged-changes` tool with the previous release tag.
2. Group the changes by type: features first, then fixes. Leave out chores
   unless the user asks for them.
3. Write the notes using the layout in `references/TEMPLATE.md`.

Keep each entry to one line and describe the change from the user's point of
view.
