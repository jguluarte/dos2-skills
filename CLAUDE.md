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

### Manual Deployment

```bash
make deploy   # Builds + commits + pushes to main
```

This will:
1. Run `build.sh` to add CSS cache-busting hash
2. Commit the updated `index.html`
3. Push to `main` branch
4. GitHub Pages auto-deploys

### Manual Build (without deploy)

```bash
make build    # Just updates CSS hash in index.html
```

**Live site:** https://jguluarte.github.io/dos2-skills

### Cache Busting

The build script adds a hash to the CSS file URL (e.g., `styles.css?v=58a6b505`). The hash is based on the CSS file's SHA256, so it only changes when the CSS content changes. This prevents browser caching issues on mobile.

## Agent Workflow Notes

- **User prefers to review diffs manually in shell** - don't show long diffs unless asked
- VSCode plugin doesn't allow agents to act without inputs (requires manual approval)
- Current workaround: Using Claude.ai web interface for more autonomous workflow
- Branch context may not update correctly in conversation UI
