---
description: Sync with remote - pull latest, check for conflicts
---

Sync the workspace with GitHub:

1. `git fetch origin main`
2. `git status` - check for local changes
3. If clean: `git pull origin main`
4. If dirty: stash, pull, pop stash, resolve conflicts
5. Check .opus-status.md for any coordination notes from other nodes (Sabertooth, 9020)

Report what was pulled and any conflicts.
