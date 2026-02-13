# Future Development Needs

## Development Tooling
- [ ] Create `.vscode/tasks.json` with start/stop server tasks
  - Start server: `Cmd+Shift+B` (Mac) / `Ctrl+Shift+B` (Windows/Linux)
  - Stop server task: Terminal → Run Task → Stop Dev Server
  - Auto-cleanup on exit
- [ ] Alternative: Create `dev.sh` shell script for manual server management

## Workflow Notes
- VSCode plugin doesn't allow agent to act without inputs (requires manual approval for each action)
- Current workaround: Using Claude.ai web interface for more autonomous workflow
- Branch context not updating in conversation UI (shows romantic-bhaskara even when working on charming-rubin)
- **User prefers to review diffs manually in shell** - don't show long diffs unless asked
