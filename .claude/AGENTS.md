# Agent Workflow

This project uses Claude Code for solo development.

## Development Process

Follow **Red-Green-Refactor (TDD)** with isolated commits:

1. **RED**: Write failing test(s) first, commit
2. **GREEN**: Minimal code to make tests pass, commit
3. **REFACTOR**: Clean up surrounding code, commit

## Branching & Merging

- Use feature branches or worktrees (see `~/.claude/CLAUDE.md` for worktree setup)
- **Local sessions**: May commit and merge directly to main without PRs
- **Remote sessions (via /rc)**: Push to a branch and open a PR so changes can be reviewed in a browser
- The user will direct which approach to use; when in doubt, ask
