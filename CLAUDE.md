# DOS2 Skills Lookup - Development Guide

## Local Development Workflow

**IMPORTANT:** This project requires a local web server to work properly due to CORS restrictions with `fetch()`.

### Starting the Dev Server

Use the Makefile commands:

```bash
make start   # Start dev server (takes over terminal)
make kill    # Kill any hanging processes on port 8000
```

Then visit: `http://localhost:8000`

Press `Ctrl+C` to stop the server.

## Data Editing

- Edit `data/skills.yaml` directly
- Refresh browser to see changes
- No build step required

## Deployment

- Push to `main` branch
- GitHub Pages auto-deploys
- Live at: https://jguluarte.github.io/dos2-skills

## Agent Workflow Notes

- **User prefers to review diffs manually in shell** - don't show long diffs unless asked
- VSCode plugin doesn't allow agents to act without inputs (requires manual approval)
- Current workaround: Using Claude.ai web interface for more autonomous workflow
- Branch context may not update correctly in conversation UI
