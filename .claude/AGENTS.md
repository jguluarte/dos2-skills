# Agent Workflow

This project uses Claude Code with an auto-merge workflow for solo development.

## Workflow

1. **Development in worktree branches**: All work happens in Claude-managed worktree branches
2. **Auto-merge to main**: Changes are merged directly to main without PR review
3. **Branch cleanup**: Feature branches are deleted after merging

## Rationale

This is a personal project with a single developer. The traditional PR review process adds unnecessary friction. Claude can safely:
- Push completed work to a feature branch
- Merge directly into main
- Clean up the feature branch

This keeps the workflow fast while maintaining a clean git history.

## Implementation

When work is complete:
```bash
# Switch to main and pull latest
git checkout main
git pull origin main

# Merge feature branch
git merge --no-ff claude/feature-branch -m "Merge: description"

# Push to remote
git push origin main

# Delete local and remote branch
git branch -d claude/feature-branch
git push origin --delete claude/feature-branch
```

The `--no-ff` flag ensures merge commits are created, preserving the branch history and making it easy to see logical groupings of changes.
