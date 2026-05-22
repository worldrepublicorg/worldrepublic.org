---
name: org-sync
description: >-
  Sync the private org/ git repository — status, suggested commit message, commit
  and push. Use when the user asks to sync, commit, or push org docs; after
  editing files under org/; or when checking whether org/ has uncommitted work.
---

# Org sync

The `org/` folder is a **separate private repository** (`github.com/worldrepublicorg/org`). It is gitignored in the main app — Cursor Changes will not list it.

## Check status

From the **world-republic repo root**:

```bash
bash .cursor/hooks/check-nested-repo-status.sh --report --repo org
```

Read the output. If it shows a bash block, the repo needs a commit and/or push.

## Commit and push

1. Run `--report` first unless the user already pasted the suggested command.
2. If there are uncommitted changes, use the suggested `git commit` message from the script (or a clearer one-line summary of what changed).
3. Run the commit and push **only when the user asks** or approves:

```bash
(cd org && git add -A && git commit -m "…" && git push origin main)
```

Request `git_write` and network permissions for push.

## Privacy

- Never move `org/` files into the public app repo.
- Do not commit secrets, bank details, or full email threads.

## Related

- [org/README.md](../../org/README.md)
- [.cursor/rules/org-context.mdc](../rules/org-context.mdc)
