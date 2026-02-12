# DOS2 Skills Lookup - Development Guide

## Local Development Workflow

**IMPORTANT:** This project requires a local web server to work properly due to CORS restrictions with `fetch()`.

### Starting the Dev Server

Before testing locally, always start the server:

```bash
python3 -m http.server 8000
```

Then visit: `http://localhost:8000`

### Stopping the Server

When done:
- Press `Ctrl+C` in the terminal, OR
- Run task: **Terminal → Run Task → Stop Dev Server**, OR
- Close VSCode (terminals auto-close)

The server will also auto-cleanup on exit.

### VSCode Shortcuts

- **Start**: `Cmd+Shift+B` (Mac) / `Ctrl+Shift+B` (Windows/Linux)
- **Stop**: Terminal → Run Task → Stop Dev Server

## Data Editing

- Edit `data/skills.yaml` directly
- Refresh browser to see changes
- No build step required

## Deployment

- Push to `main` branch
- GitHub Pages auto-deploys
- Live at: https://jguluarte.github.io/dos2-skills
