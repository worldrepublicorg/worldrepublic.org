---
name: docs-sync
description: >-
  Sync the private docs/ git repository (Mintlify wiki) — status, suggested commit
  message, commit and push. Use when the user asks to sync, commit, or push wiki
  docs; after editing files under docs/; or when checking whether docs/ has
  uncommitted work.
---

# Docs sync

The `docs/` folder is a **separate private repository** (`github.com/worldrepublicorg/docs`). It is gitignored in the main app — Cursor Changes will not list it. Deploys to [wiki.worldrepublic.org](https://wiki.worldrepublic.org) via Mintlify.

## Check status

From the **world-republic repo root**:

```bash
bash .cursor/hooks/check-nested-repo-status.sh --report --repo docs
```

Or all nested repos:

```bash
bash .cursor/hooks/check-nested-repo-status.sh --report
```

Read the output. If it shows a bash block, the repo needs a commit and/or push.

## Commit and push

1. Run `--report` first unless the user already pasted the suggested command.
2. If there are uncommitted changes, use the suggested `git commit` message from the script (or a clearer one-line summary of what changed).
3. Run the commit and push **only when the user asks** or approves:

```bash
(cd docs && git add -A && git commit -m "…" && git push origin main)
```

Request `git_write` and network permissions for push.

## Content standards

Follow [docs/.cursor/rules/world-republic-docs.mdc](../../docs/.cursor/rules/world-republic-docs.mdc) for user-facing wiki copy.

## Privacy

- Never copy private `org/` content into `docs/`.
- Do not move `docs/` files into the public app repo.

## Related

- [.cursor/rules/docs-context.mdc](../rules/docs-context.mdc) — applies when `docs/**` files are in context
- [docs/README.md](../../docs/README.md) — Mintlify structure and local preview
